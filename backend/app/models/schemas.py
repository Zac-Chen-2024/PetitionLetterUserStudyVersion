"""
Pydantic data models — shared between routers.

These models define the canonical shapes for API request/response bodies.
Router files can import from here instead of re-defining inline.
"""

from pydantic import BaseModel
from typing import Optional


class BBoxModel(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class SnippetOut(BaseModel):
    snippet_id: str
    exhibit_id: str
    document_id: str = ""
    text: str
    page: int
    bbox: Optional[BBoxModel] = None
    subject: Optional[str] = None
    subject_role: Optional[str] = None
    is_applicant_achievement: bool = True
    evidence_type: Optional[str] = None
    evidence_purpose: Optional[str] = None
    confidence: float = 1.0
    reasoning: Optional[str] = None


class ArgumentOut(BaseModel):
    id: str
    title: str
    subject: str = ""
    snippet_ids: list[str] = []
    sub_argument_ids: list[str] = []
    standard_key: str
    confidence: float = 0.0
    is_ai_generated: bool = True
    created_at: str = ""


class SubArgumentOut(BaseModel):
    id: str
    argument_id: str
    title: str
    purpose: str = ""
    relationship: str = ""
    snippet_ids: list[str] = []
    pending_snippet_ids: list[str] = []
    needs_snippet_confirmation: bool = False
    is_ai_generated: bool = True
    status: str = "draft"
    created_at: str = ""


class SentenceOut(BaseModel):
    text: str
    snippet_ids: list[str] = []
    subargument_id: Optional[str] = None
    argument_id: Optional[str] = None
    exhibit_refs: list[str] = []
    sentence_type: str = "body"


class ProvenanceIndexOut(BaseModel):
    by_subargument: dict[str, list[int]] = {}
    by_argument: dict[str, list[int]] = {}
    by_snippet: dict[str, list[int]] = {}


class ValidationResultOut(BaseModel):
    total_sentences: int = 0
    traced_sentences: int = 0
    warnings: list[str] = []


class WritingSectionOut(BaseModel):
    success: bool = True
    section: str
    paragraph_text: str
    sentences: list[SentenceOut]
    provenance_index: Optional[ProvenanceIndexOut] = None
    validation: Optional[ValidationResultOut] = None
    error: Optional[str] = None
    updated_subargument_snippets: Optional[dict[str, list[str]]] = None


class LegalStandardOut(BaseModel):
    id: str
    key: str
    name: str
    short_name: str
    description: str
    color: str
    order: int
