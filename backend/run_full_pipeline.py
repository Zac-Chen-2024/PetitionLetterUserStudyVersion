"""
Full Pipeline Script — Concurrent extraction + relationship analysis + argument generation + letter writing

Usage:
    python run_full_pipeline.py                       # Run full pipeline (steps 1 → 1.5 → 2 → 3 → 4)
    python run_full_pipeline.py --skip-extraction     # Skip step 1, reuse existing extraction
    python run_full_pipeline.py --skip-relationship   # Skip step 1.5, reuse existing relationship data
    python run_full_pipeline.py --skip-arguments      # Skip steps 1+1.5+2, reuse existing arguments
    python run_full_pipeline.py --writing-only        # Only run writing (step 3+4)
"""

import argparse
import asyncio
import json
import time
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.services.unified_extractor import extract_exhibit_unified, get_extraction_dir, PROJECTS_DIR
from app.services.legal_argument_organizer import full_legal_pipeline
from app.services.petition_writer_v3 import write_petition_section_v3, save_writing


PROJECT_ID = "dehuan_liu"
APPLICANT_NAME = "Dehuan Liu"
CONCURRENCY = 5  # Max concurrent LLM calls for extraction


async def step1_extract_all_concurrent():
    """Step 1: Extract all exhibits concurrently with semaphore."""
    documents_dir = PROJECTS_DIR / PROJECT_ID / "documents"
    exhibit_files = sorted(documents_dir.glob("*.json"))
    total = len(exhibit_files)
    print(f"\n{'='*60}")
    print(f"STEP 1: Extracting {total} exhibits (concurrency={CONCURRENCY})")
    print(f"{'='*60}")

    semaphore = asyncio.Semaphore(CONCURRENCY)
    completed = 0
    failed = 0
    lock = asyncio.Lock()

    async def extract_one(exhibit_file):
        nonlocal completed, failed
        exhibit_id = exhibit_file.stem
        async with semaphore:
            try:
                result = await extract_exhibit_unified(
                    PROJECT_ID, exhibit_id, APPLICANT_NAME
                )
                async with lock:
                    if result.get("success"):
                        completed += 1
                        print(f"  [{completed+failed}/{total}] OK  {exhibit_id}: {result.get('snippet_count',0)} snippets")
                    else:
                        failed += 1
                        print(f"  [{completed+failed}/{total}] ERR {exhibit_id}: {result.get('error','?')}")
            except Exception as e:
                async with lock:
                    failed += 1
                    print(f"  [{completed+failed}/{total}] EXC {exhibit_id}: {e}")

    t0 = time.time()
    tasks = [extract_one(f) for f in exhibit_files]
    await asyncio.gather(*tasks)
    elapsed = time.time() - t0

    print(f"\nExtraction complete: {completed}/{total} OK, {failed} failed ({elapsed:.1f}s)")

    # Combine all extraction results
    extraction_dir = get_extraction_dir(PROJECT_ID)
    all_snippets = []
    all_entities = []
    all_relations = []

    for exhibit_file in exhibit_files:
        exhibit_id = exhibit_file.stem
        ext_file = extraction_dir / f"{exhibit_id}_extraction.json"
        if ext_file.exists():
            with open(ext_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            all_snippets.extend(data.get("snippets", []))
            all_entities.extend(data.get("entities", []))
            all_relations.extend(data.get("relations", []))

    combined = {
        "version": "4.0",
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "applicant_name": APPLICANT_NAME,
        "exhibit_count": total,
        "successful": completed,
        "failed": failed,
        "snippets": all_snippets,
        "entities": all_entities,
        "relations": all_relations,
        "stats": {
            "total_snippets": len(all_snippets),
            "total_entities": len(all_entities),
            "total_relations": len(all_relations),
            "applicant_snippets": sum(1 for s in all_snippets if s.get("is_applicant_achievement")),
            "other_snippets": sum(1 for s in all_snippets if not s.get("is_applicant_achievement"))
        }
    }

    combined_file = extraction_dir / "combined_extraction.json"
    with open(combined_file, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    # Also save to snippets dir for compatibility
    snippets_dir = PROJECTS_DIR / PROJECT_ID / "snippets"
    snippets_dir.mkdir(parents=True, exist_ok=True)
    with open(snippets_dir / "extracted_snippets.json", 'w', encoding='utf-8') as f:
        json.dump({
            "version": "4.0",
            "extracted_at": datetime.now(timezone.utc).isoformat(),
            "snippet_count": len(all_snippets),
            "extraction_method": "unified_extraction",
            "snippets": all_snippets
        }, f, ensure_ascii=False, indent=2)

    # Print evidence type distribution
    type_counts = {}
    for s in all_snippets:
        etype = s.get('evidence_type', 'unknown')
        type_counts[etype] = type_counts.get(etype, 0) + 1

    print(f"\nEvidence type distribution ({len(all_snippets)} total snippets):")
    for etype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {etype}: {count}")

    return combined


async def step1_5_cross_document_linking():
    """Step 1.5: Cross-document evidence linking (not yet implemented — skipped)."""
    print(f"\n{'='*60}")
    print(f"STEP 1.5: Cross-Document Evidence Linking (SKIPPED — not implemented)")
    print(f"{'='*60}")
    return {"subjects_analyzed": 0, "links_found": 0, "snippets_enriched": 0}


async def step2_generate_arguments():
    """Step 2: Generate arguments + sub-arguments."""
    print(f"\n{'='*60}")
    print(f"STEP 2: Generating arguments + sub-arguments")
    print(f"{'='*60}")

    t0 = time.time()
    result = await full_legal_pipeline(
        project_id=PROJECT_ID,
        applicant_name=APPLICANT_NAME,
        project_type="EB-1A"
    )
    elapsed = time.time() - t0

    stats = result.get("stats", {})
    print(f"\nArgument generation complete ({elapsed:.1f}s):")
    print(f"  Arguments: {stats.get('argument_count', 0)}")
    print(f"  Sub-arguments: {stats.get('sub_argument_count', 0)}")
    print(f"  Standards covered: {list(stats.get('by_standard', {}).keys())}")

    # Print argument details
    for arg in result.get("arguments", []):
        sa_count = len(arg.get("sub_argument_ids", []))
        snp_count = len(arg.get("snippet_ids", []))
        print(f"  [{arg.get('standard')}] {arg.get('title')[:60]} ({snp_count} snippets, {sa_count} sub-args)")

    return result


async def step3_write_all_sections(arg_result):
    """Step 3: Write petition letter sections for all standards."""
    print(f"[Writing] Using provider: {settings.llm_provider}")

    standards = list(arg_result.get("stats", {}).get("by_standard", {}).keys())
    print(f"\n{'='*60}")
    print(f"STEP 3: Writing {len(standards)} petition letter sections")
    print(f"{'='*60}")

    t0 = time.time()
    results = {}

    for std_key in standards:
        print(f"\n  Writing [{std_key}]...")
        try:
            write_result = await write_petition_section_v3(
                project_id=PROJECT_ID,
                standard_key=std_key
            )
            if write_result.get("success"):
                n_sent = len(write_result.get("sentences", []))
                text_len = len(write_result.get("paragraph_text", ""))
                print(f"    OK: {n_sent} sentences, {text_len} chars")
                results[std_key] = write_result
                save_writing(PROJECT_ID, std_key, write_result)
            else:
                print(f"    FAILED: {write_result.get('error', '?')}")
        except Exception as e:
            err_str = str(e)
            # DeepSeek content filter → fallback to OpenAI
            if "Content Exists Risk" in err_str:
                print(f"    DeepSeek content filter, retrying with OpenAI...")
                try:
                    settings.llm_provider = "openai"
                    write_result = await write_petition_section_v3(
                        project_id=PROJECT_ID,
                        standard_key=std_key
                    )
                    settings.llm_provider = "deepseek"  # restore
                    if write_result.get("success"):
                        n_sent = len(write_result.get("sentences", []))
                        text_len = len(write_result.get("paragraph_text", ""))
                        print(f"    OK (OpenAI fallback): {n_sent} sentences, {text_len} chars")
                        results[std_key] = write_result
                        save_writing(PROJECT_ID, std_key, write_result)
                    else:
                        print(f"    FAILED (OpenAI): {write_result.get('error', '?')}")
                except Exception as e2:
                    settings.llm_provider = "deepseek"
                    print(f"    EXCEPTION (OpenAI fallback): {e2}")
            else:
                print(f"    EXCEPTION: {e}")

    elapsed = time.time() - t0
    print(f"\nWriting complete ({elapsed:.1f}s): {len(results)}/{len(standards)} sections")

    return results


def step4_print_full_letter(writing_results):
    """Step 4: Print the full letter for review."""
    print(f"\n{'='*60}")
    print(f"FULL PETITION LETTER — {APPLICANT_NAME}")
    print(f"{'='*60}\n")

    # Order standards by typical petition structure
    STANDARD_ORDER = [
        "awards", "membership", "published_material", "judging",
        "original_contribution", "scholarly_articles", "display",
        "leading_role", "high_salary", "commercial_success"
    ]

    total_sentences = 0
    total_chars = 0

    for std_key in STANDARD_ORDER:
        if std_key not in writing_results:
            continue
        result = writing_results[std_key]
        text = result.get("paragraph_text", "")
        sentences = result.get("sentences", [])

        total_sentences += len(sentences)
        total_chars += len(text)

        print(f"\n--- [{std_key.upper()}] ---\n")
        # Windows GBK can't handle § etc., replace on error
        try:
            print(text)
        except UnicodeEncodeError:
            print(text.encode('utf-8', errors='replace').decode('utf-8'))
        print()

    print(f"\n{'='*60}")
    print(f"SUMMARY: {len(writing_results)} sections, {total_sentences} sentences, {total_chars} characters")
    print(f"{'='*60}")


def _load_existing_arg_result() -> dict:
    """Load existing legal_arguments.json to get standard keys for writing-only mode."""
    legal_file = PROJECTS_DIR / PROJECT_ID / "arguments" / "legal_arguments.json"
    if not legal_file.exists():
        print(f"ERROR: {legal_file} not found. Run argument generation first.")
        sys.exit(1)

    with open(legal_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Build stats.by_standard from arguments
    by_standard = {}
    for arg in data.get("arguments", []):
        std = arg.get("standard_key", "")
        if std:
            by_standard[std] = by_standard.get(std, 0) + 1

    return {
        "arguments": data.get("arguments", []),
        "stats": {
            "argument_count": len(data.get("arguments", [])),
            "sub_argument_count": len(data.get("sub_arguments", [])),
            "by_standard": by_standard
        }
    }


async def main():
    parser = argparse.ArgumentParser(description="EB-1A Petition Letter Pipeline")
    parser.add_argument("--skip-extraction", action="store_true",
                        help="Skip extraction (step 1), reuse existing data")
    parser.add_argument("--skip-relationship", action="store_true",
                        help="Skip relationship analysis (step 1.5)")
    parser.add_argument("--skip-arguments", action="store_true",
                        help="Skip extraction + relationship + arguments (steps 1+1.5+2), reuse existing")
    parser.add_argument("--writing-only", action="store_true",
                        help="Only run writing + print (steps 3+4)")
    args = parser.parse_args()

    # --writing-only implies --skip-arguments implies --skip-extraction + --skip-relationship
    if args.writing_only:
        args.skip_arguments = True
    if args.skip_arguments:
        args.skip_extraction = True
        args.skip_relationship = True

    overall_t0 = time.time()

    # Step 1: Extract
    if not args.skip_extraction:
        combined = await step1_extract_all_concurrent()
    else:
        print("\n[SKIP] Step 1: Extraction (using existing data)")

    # Step 1.5: Cross-Document Evidence Linking
    if not args.skip_relationship:
        cross_doc_result = await step1_5_cross_document_linking()
    else:
        print("\n[SKIP] Step 1.5: Cross-document linking (using existing data)")

    # Step 2: Generate arguments (now graph-aware — loads relationship data internally)
    if not args.skip_arguments:
        arg_result = await step2_generate_arguments()
    else:
        print("\n[SKIP] Step 2: Argument generation (using existing data)")
        arg_result = _load_existing_arg_result()

    # Step 3: Write sections
    writing_results = await step3_write_all_sections(arg_result)

    # Step 4: Print full letter
    step4_print_full_letter(writing_results)

    overall_elapsed = time.time() - overall_t0
    print(f"\nTOTAL PIPELINE TIME: {overall_elapsed:.1f}s")


if __name__ == "__main__":
    asyncio.run(main())
