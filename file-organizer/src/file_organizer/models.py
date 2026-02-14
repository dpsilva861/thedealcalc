"""
Data models for the file organizer system.

Defines the core data structures used across all phases:
FileRecord, ClassificationResult, MoveRecord, Correction, etc.
"""

from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class FileRecord:
    """Represents a single file with all its metadata."""

    # Identity
    id: int | None = None
    file_path: str = ""
    filename: str = ""
    extension: str = ""
    file_size: int = 0

    # Hashes
    sha256: str = ""
    content_hash: str = ""  # xxhash of extracted text for near-duplicate detection

    # File system dates
    created_at: str = ""
    modified_at: str = ""
    accessed_at: str = ""

    # Extracted content
    extracted_text: str = ""
    extraction_method: str = ""  # tika, python-docx, ocr, etc.

    # Classification metadata
    tags: list[str] = field(default_factory=list)
    category: str = ""
    subcategory: str = ""
    entities: list[str] = field(default_factory=list)  # people, companies, properties
    document_type: str = ""
    date_relevance: str = ""  # the date the content pertains to
    status: str = "active"
    confidentiality: str = "general"
    summary: str = ""
    source: str = ""  # email attachment, download, self-created, scanned

    # Agent metadata
    confidence: float = 0.0
    classified_by: str = ""  # "rule", "llm", "manual"
    classified_at: str = ""
    needs_review: bool = False

    # Organization
    new_path: str = ""  # path after organization
    new_filename: str = ""

    # Scan tracking
    scanned_at: str = ""
    last_rescanned_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "file_path": self.file_path,
            "filename": self.filename,
            "extension": self.extension,
            "file_size": self.file_size,
            "sha256": self.sha256,
            "content_hash": self.content_hash,
            "created_at": self.created_at,
            "modified_at": self.modified_at,
            "accessed_at": self.accessed_at,
            "extracted_text": self.extracted_text[:500] if self.extracted_text else "",
            "extraction_method": self.extraction_method,
            "tags": ",".join(self.tags),
            "category": self.category,
            "subcategory": self.subcategory,
            "entities": ",".join(self.entities),
            "document_type": self.document_type,
            "date_relevance": self.date_relevance,
            "status": self.status,
            "confidentiality": self.confidentiality,
            "summary": self.summary,
            "source": self.source,
            "confidence": self.confidence,
            "classified_by": self.classified_by,
            "classified_at": self.classified_at,
            "needs_review": self.needs_review,
            "new_path": self.new_path,
            "new_filename": self.new_filename,
            "scanned_at": self.scanned_at,
            "last_rescanned_at": self.last_rescanned_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "FileRecord":
        tags = data.get("tags", "")
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]
        entities = data.get("entities", "")
        if isinstance(entities, str):
            entities = [e.strip() for e in entities.split(",") if e.strip()]
        return cls(
            id=data.get("id"),
            file_path=data.get("file_path", ""),
            filename=data.get("filename", ""),
            extension=data.get("extension", ""),
            file_size=data.get("file_size", 0),
            sha256=data.get("sha256", ""),
            content_hash=data.get("content_hash", ""),
            created_at=data.get("created_at", ""),
            modified_at=data.get("modified_at", ""),
            accessed_at=data.get("accessed_at", ""),
            extracted_text=data.get("extracted_text", ""),
            extraction_method=data.get("extraction_method", ""),
            tags=tags,
            category=data.get("category", ""),
            subcategory=data.get("subcategory", ""),
            entities=entities,
            document_type=data.get("document_type", ""),
            date_relevance=data.get("date_relevance", ""),
            status=data.get("status", "active"),
            confidentiality=data.get("confidentiality", "general"),
            summary=data.get("summary", ""),
            source=data.get("source", ""),
            confidence=data.get("confidence", 0.0),
            classified_by=data.get("classified_by", ""),
            classified_at=data.get("classified_at", ""),
            needs_review=bool(data.get("needs_review", False)),
            new_path=data.get("new_path", ""),
            new_filename=data.get("new_filename", ""),
            scanned_at=data.get("scanned_at", ""),
            last_rescanned_at=data.get("last_rescanned_at", ""),
        )


@dataclass
class MoveRecord:
    """Tracks a file move operation for undo/rollback."""

    id: int | None = None
    file_record_id: int | None = None
    old_path: str = ""
    new_path: str = ""
    old_filename: str = ""
    new_filename: str = ""
    moved_at: str = ""
    reverted: bool = False
    reverted_at: str = ""


@dataclass
class Correction:
    """Tracks when the user overrides the agent's classification."""

    id: int | None = None
    file_record_id: int | None = None
    file_path: str = ""
    agent_decision: dict[str, Any] = field(default_factory=dict)
    user_decision: dict[str, Any] = field(default_factory=dict)
    corrected_at: str = ""
    feedback_note: str = ""


@dataclass
class ClassificationResult:
    """The structured output from LLM or rule-based classification."""

    destination_folder: str = ""
    filename: str = ""
    tags: list[str] = field(default_factory=list)
    category: str = ""
    subcategory: str = ""
    entities: list[str] = field(default_factory=list)
    summary: str = ""
    document_type: str = ""
    date_relevance: str = ""
    status: str = "active"
    confidentiality: str = "general"
    source: str = ""
    confidence: float = 0.0
    reasoning: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "destination_folder": self.destination_folder,
            "filename": self.filename,
            "tags": self.tags,
            "category": self.category,
            "subcategory": self.subcategory,
            "entities": self.entities,
            "summary": self.summary,
            "document_type": self.document_type,
            "date_relevance": self.date_relevance,
            "status": self.status,
            "confidentiality": self.confidentiality,
            "source": self.source,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ClassificationResult":
        return cls(
            destination_folder=data.get("destination_folder", ""),
            filename=data.get("filename", ""),
            tags=data.get("tags", []),
            category=data.get("category", ""),
            subcategory=data.get("subcategory", ""),
            entities=data.get("entities", []),
            summary=data.get("summary", ""),
            document_type=data.get("document_type", ""),
            date_relevance=data.get("date_relevance", ""),
            status=data.get("status", "active"),
            confidentiality=data.get("confidentiality", "general"),
            source=data.get("source", ""),
            confidence=data.get("confidence", 0.0),
            reasoning=data.get("reasoning", ""),
        )


@dataclass
class ScanProfile:
    """Summary of a scan — the file landscape profile."""

    total_files: int = 0
    total_size_bytes: int = 0
    file_counts_by_extension: dict[str, int] = field(default_factory=dict)
    file_counts_by_category: dict[str, int] = field(default_factory=dict)
    size_by_extension: dict[str, int] = field(default_factory=dict)
    date_range: tuple[str, str] = ("", "")
    top_directories: list[tuple[str, int]] = field(default_factory=list)
    themes: list[str] = field(default_factory=list)
    detected_brands: list[str] = field(default_factory=list)
    detected_entities: list[str] = field(default_factory=list)
    duplicates_found: int = 0
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_files": self.total_files,
            "total_size_bytes": self.total_size_bytes,
            "total_size_human": _human_size(self.total_size_bytes),
            "file_counts_by_extension": self.file_counts_by_extension,
            "file_counts_by_category": self.file_counts_by_category,
            "size_by_extension": {
                k: _human_size(v) for k, v in self.size_by_extension.items()
            },
            "date_range": self.date_range,
            "top_directories": self.top_directories,
            "themes": self.themes,
            "detected_brands": self.detected_brands,
            "detected_entities": self.detected_entities,
            "duplicates_found": self.duplicates_found,
            "errors": self.errors,
        }


def compute_sha256(file_path: str, chunk_size: int = 8192) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                h.update(chunk)
    except (OSError, PermissionError):
        return ""
    return h.hexdigest()


def _human_size(size_bytes: int) -> str:
    """Convert bytes to human-readable string."""
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(size_bytes) < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0  # type: ignore[assignment]
    return f"{size_bytes:.1f} PB"
