"""
Phase 3 — Taxonomy Proposal Engine.

Generates a folder structure and naming convention proposal based on
the scan profile and configuration. Outputs a tree visualization
for user review.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Any

from .config import Config
from .database import Database


@dataclass
class TaxonomyNode:
    """A node in the folder tree."""
    name: str
    children: list["TaxonomyNode"] = field(default_factory=list)
    description: str = ""

    def add_child(self, name: str, description: str = "") -> "TaxonomyNode":
        child = TaxonomyNode(name=name, description=description)
        self.children.append(child)
        return child

    def to_tree_string(self, prefix: str = "", is_last: bool = True) -> str:
        """Generate a tree visualization string."""
        connector = "└── " if is_last else "├── "
        line = prefix + connector + self.name
        if self.description:
            line += f"  ({self.description})"
        lines = [line]
        child_prefix = prefix + ("    " if is_last else "│   ")
        for i, child in enumerate(self.children):
            lines.append(
                child.to_tree_string(child_prefix, i == len(self.children) - 1)
            )
        return "\n".join(lines)

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "children": [c.to_dict() for c in self.children],
        }


class TaxonomyEngine:
    """Generates folder taxonomy proposals."""

    def __init__(self, config: Config, db: Database) -> None:
        self.config = config
        self.db = db

    def propose(self, profile: dict[str, Any] | None = None) -> TaxonomyNode:
        """
        Generate a taxonomy proposal based on scan profile and config.

        The hierarchy follows the user's preference: Company > Document Type > File
        """
        root = TaxonomyNode(
            name=os.path.basename(self.config.organized_base) or "Organized",
            description="Root organization folder",
        )

        # Business folder
        business = root.add_child("Business", "All business-related files")
        self._build_business_tree(business, profile)

        # Personal folder
        personal = root.add_child("Personal", "Personal and family files")
        self._build_personal_tree(personal)

        # Shared/Reference
        reference = root.add_child("Reference", "General reference materials")
        reference.add_child("Templates", "Document templates")
        reference.add_child("Manuals", "Product and equipment manuals")
        reference.add_child("Training", "Training materials and certifications")
        reference.add_child("Industry-Research", "Market reports, white papers")

        # System folders
        system = root.add_child("_System", "System files for the organizer")
        system.add_child("_Inbox", "New files awaiting classification")
        review = system.add_child("_Review", "Files needing manual review")
        system.add_child("_Duplicates", "Detected duplicate files")
        system.add_child("_Archive", "Archived/expired files")

        return root

    def _build_business_tree(
        self, parent: TaxonomyNode, profile: dict[str, Any] | None
    ) -> None:
        """Build the business portion of the taxonomy."""
        # Get detected companies from profile or config
        companies = list(self.config.brands)
        if profile:
            entities = profile.get("detected_entities", {})
            for co in entities.get("companies", []):
                name = co["name"]
                if name not in companies:
                    companies.append(name)

        # Create company folders
        for company in sorted(companies):
            if company == "Personal (Silva)":
                continue  # Goes in Personal tree
            safe_name = self._safe_folder_name(company)
            co_node = parent.add_child(safe_name, f"Files for {company}")
            self._add_document_type_folders(co_node)

        # Catch-all for unmatched business files
        other = parent.add_child("_Other-Business", "Uncategorized business files")
        self._add_document_type_folders(other)

        # Cross-company folders
        cross = parent.add_child("_Cross-Company", "Files spanning multiple companies")
        cross.add_child("Financial-Reports", "Consolidated financial reports")
        cross.add_child("Tax", "Multi-entity tax documents")
        cross.add_child("Legal", "Multi-entity legal documents")

    def _add_document_type_folders(self, parent: TaxonomyNode) -> None:
        """Add standard document type subfolders to a company node."""
        doc_folders = [
            ("Leases", "Lease agreements, amendments, addendums"),
            ("Contracts", "Service contracts, vendor agreements"),
            ("Financial", "Financial models, budgets, pro formas, statements"),
            ("Invoices", "Invoices and payment records"),
            ("Receipts", "Expense receipts"),
            ("Correspondence", "Letters, memos, emails"),
            ("Reports", "Reports, presentations, analysis"),
            ("Insurance", "Insurance policies, claims, COIs"),
            ("Tax", "Tax forms, returns, K-1s"),
            ("Legal", "Legal documents, operating agreements"),
            ("Due-Diligence", "Due diligence materials"),
            ("Property-Ops", "Rent rolls, tenant ledgers, maintenance"),
            ("Photos", "Property photos, inspection images"),
            ("Closing", "Closing documents, title reports, surveys"),
            ("Loan", "Loan documents, term sheets, commitment letters"),
        ]
        for name, desc in doc_folders:
            parent.add_child(name, desc)

    def _build_personal_tree(self, parent: TaxonomyNode) -> None:
        """Build the personal portion of the taxonomy."""
        categories = [
            ("Financial", "Personal financial documents"),
            ("Tax", "Personal tax returns and documents"),
            ("Insurance", "Personal insurance policies"),
            ("Medical", "Medical records and health documents"),
            ("Education", "Transcripts, certifications, courses"),
            ("Legal", "Personal legal documents, wills, trusts"),
            ("Travel", "Travel itineraries, bookings, loyalty programs"),
            ("Family", "Family documents and records"),
            ("Photos", "Personal photos"),
            ("Subscriptions", "Subscription records and accounts"),
            ("Vehicles", "Vehicle titles, registrations, maintenance"),
            ("Home", "Home-related documents, HOA, utilities"),
        ]
        for name, desc in categories:
            parent.add_child(name, desc)

    def _safe_folder_name(self, name: str) -> str:
        """Convert a name to a Windows-safe folder name."""
        # Remove characters not allowed in Windows paths
        safe = re.sub(r'[\\/:*?"<>|]', "", name)
        # Replace spaces with hyphens if configured
        if self.config.naming_word_separator:
            safe = safe.replace(" ", self.config.naming_word_separator)
        # Ensure it doesn't end with a period or space
        safe = safe.rstrip(". ")
        return safe

    def render_tree(self, root: TaxonomyNode) -> str:
        """Render the taxonomy as a visual tree string."""
        lines = [root.name]
        if root.description:
            lines[0] += f"  ({root.description})"
        for i, child in enumerate(root.children):
            lines.append(child.to_tree_string("", i == len(root.children) - 1))
        return "\n".join(lines)

    def create_directories(self, root: TaxonomyNode, base_path: str = "") -> list[str]:
        """Create the directory structure on disk."""
        base = base_path or self.config.organized_base
        created = []
        self._create_dirs_recursive(root, base, created)
        return created

    def _create_dirs_recursive(
        self, node: TaxonomyNode, current_path: str, created: list[str]
    ) -> None:
        path = os.path.join(current_path, node.name) if node.name else current_path
        # Check path length
        if not self.config.long_path_enabled and len(path) >= self.config.max_path_length:
            return
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
            created.append(path)
        for child in node.children:
            self._create_dirs_recursive(child, path, created)

    def get_naming_convention_doc(self) -> str:
        """Return documentation of the naming convention."""
        fmt = self.config.naming_date_format
        sep = self.config.naming_separator
        wsep = self.config.naming_word_separator
        return f"""
NAMING CONVENTION
=================

Format: MMDDYYYY{sep}Company{sep}DocumentType.ext

Rules:
- Date prefix using format: {fmt} (e.g., 01152025)
- Segments separated by: '{sep}' (underscore)
- Words within segments separated by: '{wsep}' (hyphen)
- All {'lowercase' if self.config.naming_lowercase else 'original case'}
- No special characters: \\ / : * ? " < > |
- Maximum path length: {self.config.max_path_length} characters

Examples:
  01152025{sep}silva{wsep}operations{sep}lease.pdf
  03222025{sep}24{wsep}hour{wsep}fitness{sep}invoice.xlsx
  06012025{sep}spring{wsep}creek{wsep}ranch{sep}inspection{wsep}report.pdf
  11302024{sep}personal{sep}tax{wsep}return.pdf

Date is derived from:
  1. Document content date (date_relevance) — preferred
  2. File modified date — fallback
  3. File created date — last resort
"""
