"""
Configuration management for the file organizer system.

Loads settings from a YAML/JSON config file and provides defaults.
All paths are Windows-native by default.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


# --------------------------------------------------------------------------- #
# Default known brands / companies (carried forward from V1, expanded)
# --------------------------------------------------------------------------- #
DEFAULT_BRANDS: list[str] = [
    "Silva Operations",
    "Delta Airlines",
    "Uber",
    "Aman",
    "Montage",
    "SpringHill Suites",
    "Residence Inn",
    "Courtyard",
    "Marriott",
    "Hertz",
    "24 Hour Fitness",
    "Spring Creek Ranch",
    "Personal (Silva)",
]

# --------------------------------------------------------------------------- #
# Default document types (from V1, expanded)
# --------------------------------------------------------------------------- #
DEFAULT_DOCUMENT_TYPES: list[str] = [
    "Invoice",
    "Receipt",
    "Statement",
    "Contract",
    "Lease",
    "Tax-Form",
    "Insurance",
    "Legal",
    "Report",
    "Proposal",
    "Letter",
    "Financial",
    "Investment",
    "Memo",
    "Amendment",
    "Addendum",
    "Appraisal",
    "Inspection-Report",
    "Title-Report",
    "Closing-Document",
    "Loan-Document",
    "Operating-Agreement",
    "Partnership-Agreement",
    "Due-Diligence",
    "Environmental-Report",
    "Survey",
    "Rent-Roll",
    "Tenant-Ledger",
    "CAM-Reconciliation",
    "Budget",
    "Pro-Forma",
    "Financial-Model",
    "Bank-Statement",
    "W2",
    "1099",
    "K1",
    "Tax-Return",
    "Photo",
    "Presentation",
    "Spreadsheet",
    "Email",
    "Correspondence",
    "Notes",
    "Manual",
    "License",
    "Permit",
    "Certificate",
]

# --------------------------------------------------------------------------- #
# Default categories and subcategories
# --------------------------------------------------------------------------- #
DEFAULT_CATEGORIES: dict[str, list[str]] = {
    "Finance": [
        "Invoices",
        "Receipts",
        "Statements",
        "Bank-Statements",
        "Financial-Models",
        "Budgets",
        "Pro-Formas",
    ],
    "Legal": [
        "Contracts",
        "Leases",
        "Amendments",
        "Addendums",
        "Operating-Agreements",
        "Partnership-Agreements",
        "Closing-Documents",
        "Title-Reports",
    ],
    "Deals": [
        "Due-Diligence",
        "Appraisals",
        "Inspections",
        "Environmental",
        "Surveys",
        "Loan-Documents",
        "Underwriting",
    ],
    "Property-Ops": [
        "Rent-Rolls",
        "Tenant-Ledgers",
        "CAM-Reconciliation",
        "Maintenance",
        "Permits",
        "Certificates",
        "Inspections",
    ],
    "Tax": [
        "Returns",
        "W2",
        "1099",
        "K1",
        "Quarterly-Estimates",
        "Deductions",
    ],
    "Insurance": [
        "Policies",
        "Claims",
        "Certificates-of-Insurance",
    ],
    "Investment": [
        "Models",
        "Reports",
        "Correspondence",
        "Distributions",
    ],
    "Correspondence": [
        "Letters",
        "Memos",
        "Emails",
        "Notes",
    ],
    "Reports": [
        "Financial",
        "Operational",
        "Market",
        "Presentations",
    ],
    "Personal": [
        "Family",
        "Medical",
        "Education",
        "Travel",
        "Photos",
        "Subscriptions",
    ],
}

# --------------------------------------------------------------------------- #
# Status values
# --------------------------------------------------------------------------- #
VALID_STATUSES: list[str] = [
    "active",
    "archived",
    "reference",
    "draft",
    "final",
    "expired",
]

VALID_CONFIDENTIALITY: list[str] = [
    "business-confidential",
    "personal-private",
    "general",
]


@dataclass
class Config:
    """Central configuration object."""

    # Directories to scan
    scan_dirs: list[str] = field(default_factory=lambda: [
        os.path.expanduser("~"),
    ])

    # Directories to always skip
    exclude_dirs: list[str] = field(default_factory=lambda: [
        ".git",
        "node_modules",
        "__pycache__",
        ".venv",
        "venv",
        ".cache",
        "AppData",
        "Application Data",
        "$Recycle.Bin",
        "Windows",
        "Program Files",
        "Program Files (x86)",
        "ProgramData",
    ])

    # File extensions to skip entirely
    exclude_extensions: list[str] = field(default_factory=lambda: [
        ".exe", ".dll", ".sys", ".msi", ".tmp", ".log",
        ".lnk", ".dat", ".db-journal",
    ])

    # Maximum file size to read content from (100 MB)
    max_file_size_bytes: int = 100 * 1024 * 1024

    # Database path
    db_path: str = ""

    # JSON sidecar directory (empty = same directory as files)
    sidecar_dir: str = ""

    # Ollama configuration
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3:8b"

    # Tika server URL (empty = use tika-python's built-in server)
    tika_server_url: str = ""

    # Watch directories for the persistent agent
    watch_dirs: list[str] = field(default_factory=lambda: [
        os.path.expanduser("~/Downloads"),
        os.path.expanduser("~/Desktop"),
        os.path.expanduser("~/Documents"),
    ])

    # Base directory for organized files
    organized_base: str = field(default_factory=lambda: os.path.expanduser("~/Organized"))

    # Known brands
    brands: list[str] = field(default_factory=lambda: list(DEFAULT_BRANDS))

    # Document types
    document_types: list[str] = field(default_factory=lambda: list(DEFAULT_DOCUMENT_TYPES))

    # Categories
    categories: dict[str, list[str]] = field(
        default_factory=lambda: dict(DEFAULT_CATEGORIES)
    )

    # Naming convention: MMDDYYYY_Company_DocumentType.ext
    naming_date_format: str = "%m%d%Y"
    naming_separator: str = "_"
    naming_word_separator: str = "-"
    naming_lowercase: bool = True

    # Long path support (Windows)
    long_path_enabled: bool = False
    max_path_length: int = 260

    # Review/quarantine directory
    review_dir: str = field(
        default_factory=lambda: os.path.expanduser("~/Organized/_Inbox/_Review")
    )

    # Dashboard
    dashboard_port: int = 5000
    dashboard_host: str = "127.0.0.1"

    # Agent
    agent_confidence_threshold: float = 0.7
    agent_rescan_interval_days: int = 7
    corrections_file: str = ""

    def __post_init__(self) -> None:
        if not self.db_path:
            self.db_path = os.path.join(
                os.path.expanduser("~"), ".file_organizer", "file_organizer.db"
            )
        if not self.corrections_file:
            self.corrections_file = os.path.join(
                os.path.expanduser("~"), ".file_organizer", "corrections.json"
            )

    @classmethod
    def load(cls, path: str | Path | None = None) -> "Config":
        """Load configuration from a JSON file, falling back to defaults."""
        default_path = os.path.join(
            os.path.expanduser("~"), ".file_organizer", "config.json"
        )
        path = path or default_path
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data: dict[str, Any] = json.load(f)
            return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        return cls()

    def save(self, path: str | Path | None = None) -> None:
        """Persist configuration to a JSON file."""
        default_path = os.path.join(
            os.path.expanduser("~"), ".file_organizer", "config.json"
        )
        path = path or default_path
        os.makedirs(os.path.dirname(path), exist_ok=True)
        from dataclasses import asdict
        with open(path, "w", encoding="utf-8") as f:
            json.dump(asdict(self), f, indent=2)
