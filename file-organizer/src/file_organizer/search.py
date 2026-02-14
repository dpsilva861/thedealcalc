"""
Phase 2 — Search Engine.

Provides the unified search interface for both CLI and PowerShell.
Supports full-text search, tag search, date ranges, entity filters,
and fuzzy matching.
"""

from __future__ import annotations

import logging
from typing import Any

from .database import Database
from .models import FileRecord

logger = logging.getLogger(__name__)

try:
    from thefuzz import fuzz, process
    _HAS_FUZZ = True
except ImportError:
    _HAS_FUZZ = False


class SearchEngine:
    """Unified search interface across the file inventory."""

    def __init__(self, db: Database) -> None:
        self.db = db

    def search(self, query: str, **filters: Any) -> list[FileRecord]:
        """
        Natural language search with optional filters.

        Supported filters:
            tags: list[str] or comma-separated string
            category: str
            subcategory: str
            entity: str
            document_type: str
            status: str
            date_start: str (YYYY-MM-DD)
            date_end: str (YYYY-MM-DD)
            extension: str
            limit: int (default 50)
        """
        # Parse tags from string if needed
        tags = filters.get("tags")
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        # First: try FTS if there's a text query
        results = self.db.search_advanced(
            query=query,
            tags=tags,
            category=filters.get("category", ""),
            subcategory=filters.get("subcategory", ""),
            entity=filters.get("entity", ""),
            document_type=filters.get("document_type", ""),
            status=filters.get("status", ""),
            date_start=filters.get("date_start", ""),
            date_end=filters.get("date_end", ""),
            extension=filters.get("extension", ""),
            limit=filters.get("limit", 50),
        )

        # If FTS returns no results, try fuzzy matching on filenames
        if not results and query and _HAS_FUZZ:
            results = self._fuzzy_search(query, limit=filters.get("limit", 50))

        return results

    def natural_language_search(self, query: str) -> list[FileRecord]:
        """
        Parse a natural language query into structured search.

        Examples:
            "all leases for 24 Hour Fitness"
            "financial models created in 2025"
            "anything related to Spring Creek Ranch"
            "personal tax documents"
            "drafts" --status=active
            "all files tagged aliso-viejo and TI-allowance"
        """
        query_lower = query.lower().strip()
        filters: dict[str, Any] = {}

        # Detect document type
        doc_type_map = {
            "lease": "Lease",
            "leases": "Lease",
            "contract": "Contract",
            "contracts": "Contract",
            "invoice": "Invoice",
            "invoices": "Invoice",
            "receipt": "Receipt",
            "receipts": "Receipt",
            "tax": "Tax-Form",
            "tax document": "Tax-Form",
            "tax documents": "Tax-Form",
            "tax return": "Tax-Return",
            "financial model": "Financial-Model",
            "financial models": "Financial-Model",
            "pro forma": "Pro-Forma",
            "pro formas": "Pro-Forma",
            "report": "Report",
            "reports": "Report",
            "memo": "Memo",
            "memos": "Memo",
            "email": "Email",
            "emails": "Email",
            "photo": "Photo",
            "photos": "Photo",
            "presentation": "Presentation",
            "presentations": "Presentation",
            "insurance": "Insurance",
            "appraisal": "Appraisal",
            "inspection": "Inspection-Report",
            "draft": None,  # special: status filter
            "drafts": None,
        }

        for phrase, doc_type in doc_type_map.items():
            if phrase in query_lower:
                if doc_type:
                    filters["document_type"] = doc_type
                elif phrase in ("draft", "drafts"):
                    filters["status"] = "draft"
                break

        # Detect status keywords
        status_keywords = {
            "active": "active",
            "archived": "archived",
            "expired": "expired",
            "draft": "draft",
            "final": "final",
        }
        for kw, status in status_keywords.items():
            if kw in query_lower:
                filters["status"] = status
                break

        # Detect year references
        import re
        year_match = re.search(r"\b(20\d{2})\b", query_lower)
        if year_match:
            year = year_match.group(1)
            # Check for "created in YYYY" or "from YYYY"
            filters["date_start"] = f"{year}-01-01"
            filters["date_end"] = f"{year}-12-31"

        # Detect "tagged X and Y"
        tag_match = re.search(r"tagged?\s+(.+?)(?:\s+and\s+|\s*$)", query_lower)
        if tag_match:
            tag_str = tag_match.group(1)
            tags = [t.strip() for t in re.split(r"\s+and\s+|\s*,\s*", tag_str) if t.strip()]
            filters["tags"] = tags

        # Detect entities (companies/properties from config)
        # The remaining query text serves as FTS query
        remaining_query = query
        for phrase in ["all", "any", "every", "files", "documents", "for", "related to",
                       "anything", "about", "from", "in", "the", "my"]:
            remaining_query = re.sub(rf"\b{phrase}\b", "", remaining_query, flags=re.IGNORECASE)
        remaining_query = remaining_query.strip()

        # If specific doc type was extracted, remove it from the query
        if filters.get("document_type"):
            for phrase in doc_type_map:
                remaining_query = re.sub(
                    rf"\b{re.escape(phrase)}s?\b", "", remaining_query, flags=re.IGNORECASE
                )
            remaining_query = remaining_query.strip()

        return self.search(remaining_query, **filters)

    def _fuzzy_search(self, query: str, limit: int = 50) -> list[FileRecord]:
        """Fuzzy match against filenames when FTS fails."""
        if not _HAS_FUZZ:
            return []

        all_files = self.db.get_all_files()
        if not all_files:
            return []

        # Build choices dict
        choices = {r.file_path: r.filename for r in all_files}
        matches = process.extract(query, choices, scorer=fuzz.partial_ratio, limit=limit)

        results = []
        for match_text, score, key in matches:
            if score >= 60:  # Threshold
                record = self.db.get_file(key)
                if record:
                    results.append(record)
        return results

    def get_suggestions(self, partial: str) -> dict[str, list[str]]:
        """Return autocomplete suggestions for a partial query."""
        suggestions: dict[str, list[str]] = {
            "tags": [],
            "categories": [],
            "entities": [],
            "document_types": [],
        }

        partial_lower = partial.lower()

        # Tags
        all_tags = self.db.get_all_tags()
        suggestions["tags"] = [
            tag for tag, count in all_tags if partial_lower in tag.lower()
        ][:10]

        # Entities
        all_entities = self.db.get_all_entities()
        suggestions["entities"] = [
            entity for entity, count in all_entities if partial_lower in entity.lower()
        ][:10]

        return suggestions
