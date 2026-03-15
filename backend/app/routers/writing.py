"""
Writing Router - 写作 API

/api/writing 端点 - SubArgument 感知写作（完整溯源链）
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from pathlib import Path

from app.services.petition_writer_v3 import (
    write_petition_section_v3,
    save_writing,
    load_latest_writing,
    analyze_change_impact,
)

router = APIRouter(prefix="/api/writing", tags=["Writing"])


class WriteV3Request(BaseModel):
    """写作请求"""
    provider: str = "deepseek"
    argument_ids: Optional[List[str]] = None
    subargument_ids: Optional[List[str]] = None
    style: str = "legal"
    additional_instructions: Optional[str] = None
    exploration_writing: bool = False


class SentenceWithProvenanceV3(BaseModel):
    """带完整溯源的句子"""
    text: str
    snippet_ids: List[str]
    subargument_id: Optional[str] = None
    argument_id: Optional[str] = None
    exhibit_refs: List[str] = []
    sentence_type: str = "body"


class ProvenanceIndex(BaseModel):
    """溯源索引"""
    by_subargument: Dict[str, List[int]] = {}
    by_argument: Dict[str, List[int]] = {}
    by_snippet: Dict[str, List[int]] = {}


class ValidationResult(BaseModel):
    """验证结果"""
    total_sentences: int
    traced_sentences: int
    warnings: List[str] = []


class WriteV3Response(BaseModel):
    """写作响应"""
    success: bool
    section: str
    paragraph_text: str
    sentences: List[SentenceWithProvenanceV3]
    provenance_index: ProvenanceIndex
    validation: ValidationResult
    error: Optional[str] = None
    updated_subargument_snippets: Optional[Dict[str, List[str]]] = None


@router.get("/{project_id}/sections")
async def get_all_sections(project_id: str):
    """获取所有已保存的写作章节（每个 standard_key 取最新版本）"""
    try:
        projects_dir = Path(__file__).parent.parent.parent / "data" / "projects"
        writing_dir = projects_dir / project_id / "writing"
        standard_keys = set()
        if writing_dir.exists():
            for f in writing_dir.glob("*.json"):
                parts = f.stem.split("_", 1)
                if len(parts) >= 2:
                    rest = parts[1]
                    rest_parts = rest.rsplit("_", 2)
                    if len(rest_parts) >= 3:
                        key = rest_parts[0]
                    else:
                        key = rest
                    standard_keys.add(key)

        sections = []
        seen = set()
        for key in sorted(standard_keys):
            result = load_latest_writing(project_id, key)
            if result and key not in seen:
                seen.add(key)
                sections.append({
                    "section": result.get("section", key),
                    "paragraph_text": result.get("paragraph_text", ""),
                    "sentences": result.get("sentences", []),
                    "provenance_index": result.get("provenance_index"),
                    "validation": result.get("validation"),
                    "version_id": result.get("version_id"),
                    "timestamp": result.get("timestamp"),
                })

        return {
            "project_id": project_id,
            "sections": sections,
            "section_count": len(sections),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/{standard_key}", response_model=WriteV3Response)
async def write_petition(
    project_id: str,
    standard_key: str,
    request: WriteV3Request = None
):
    """SubArgument 感知的写作端点"""
    try:
        req = request or WriteV3Request()
        result = await write_petition_section_v3(
            project_id=project_id,
            standard_key=standard_key,
            argument_ids=req.argument_ids,
            subargument_ids=req.subargument_ids,
            additional_instructions=req.additional_instructions,
            provider=req.provider,
            exploration_writing=req.exploration_writing,
        )

        if not result.get("success"):
            return WriteV3Response(
                success=False,
                section=standard_key,
                paragraph_text="",
                sentences=[],
                provenance_index=ProvenanceIndex(),
                validation=ValidationResult(total_sentences=0, traced_sentences=0),
                error=result.get("error", "Unknown error"),
            )

        save_writing(project_id, standard_key, result)

        return WriteV3Response(
            success=True,
            section=result["section"],
            paragraph_text=result["paragraph_text"],
            sentences=[SentenceWithProvenanceV3(**s) for s in result["sentences"]],
            provenance_index=ProvenanceIndex(**result.get("provenance_index", {})),
            validation=ValidationResult(**result.get("validation", {})),
            updated_subargument_snippets=result.get("updated_subargument_snippets"),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AnalyzeImpactRequest(BaseModel):
    """分析变更影响请求"""
    standard_key: str
    change_type: str = "deletion"
    affected_subargument_id: str
    affected_title: str = ""


@router.post("/{project_id}/analyze-impact")
async def analyze_writing_impact(project_id: str, request: AnalyzeImpactRequest):
    """分析 SubArgument 变更对文章的间接影响"""
    try:
        result = await analyze_change_impact(
            project_id=project_id,
            standard_key=request.standard_key,
            change_type=request.change_type,
            affected_subargument_id=request.affected_subargument_id,
            affected_title=request.affected_title,
        )
        return {
            "success": True,
            "suggestions": result.get("suggestions", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
