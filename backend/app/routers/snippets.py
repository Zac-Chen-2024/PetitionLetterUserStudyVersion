"""
Snippets Router - Snippet 管理 API

从 writing V2 router 迁出的 snippet 端点
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import json

from app.services.snippet_registry import (
    load_registry,
    get_registry_stats,
    get_snippets_by_standard,
    update_snippet_standard,
)
from app.services.snippet_linker import load_links
from app.services.unified_extractor import load_combined_extraction, get_extraction_dir

router = APIRouter(prefix="/api/snippets", tags=["Snippets"])


class SnippetMappingRequest(BaseModel):
    """Snippet 映射请求"""
    snippet_id: str
    standard_key: str


@router.get("/{project_id}")
async def get_project_snippets(project_id: str):
    """获取项目的 snippet 注册表"""
    try:
        snippets = load_registry(project_id)
        stats = get_registry_stats(project_id)
        return {
            "project_id": project_id,
            "snippets": snippets,
            "stats": stats,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/by-standard/{standard_key}")
async def get_snippets_for_standard(project_id: str, standard_key: str):
    """获取某个标准下的所有 snippets"""
    try:
        snippets = get_snippets_by_standard(project_id, standard_key)
        return {
            "standard_key": standard_key,
            "snippets": snippets,
            "count": len(snippets),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/map")
async def map_snippet_to_standard(project_id: str, request: SnippetMappingRequest):
    """将 snippet 映射到某个标准"""
    try:
        result = update_snippet_standard(
            project_id=project_id,
            snippet_id=request.snippet_id,
            new_standard_key=request.standard_key,
        )
        if not result:
            raise HTTPException(status_code=404, detail=f"Snippet {request.snippet_id} not found")

        # Also sync to combined_extraction.json so writing/provenance see the change
        combined = load_combined_extraction(project_id)
        if combined and combined.get("snippets"):
            for snip in combined["snippets"]:
                if snip.get("snippet_id") == request.snippet_id:
                    snip["evidence_type"] = request.standard_key
                    break
            combined_file = get_extraction_dir(project_id) / "combined_extraction.json"
            with open(combined_file, "w", encoding="utf-8") as f:
                json.dump(combined, f, ensure_ascii=False, indent=2)

        return {
            "success": True,
            "snippet_id": request.snippet_id,
            "new_standard_key": request.standard_key,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/links")
async def get_snippet_links(project_id: str):
    """获取 snippet 关联信息"""
    try:
        links = load_links(project_id)
        return {
            "project_id": project_id,
            "links": links,
            "link_count": len(links),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
