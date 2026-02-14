"""
Phase 1 — File Landscape Profiler.

Analyzes scan results to identify patterns, categories, projects,
clients, time periods, and builds a comprehensive summary.
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

from .config import Config
from .database import Database
from .models import FileRecord, ScanProfile


# Common CRE (commercial real estate) terms for entity detection
CRE_TERMS = [
    "lease", "tenant", "landlord", "property", "building", "suite",
    "rent", "cam", "nnn", "triple net", "ti", "tenant improvement",
    "estoppel", "subordination", "snda", "noi", "cap rate", "irr",
    "cash flow", "pro forma", "proforma", "underwriting", "appraisal",
    "inspection", "due diligence", "closing", "escrow", "title",
    "survey", "environmental", "phase i", "phase ii", "zoning",
    "entitlement", "loi", "letter of intent", "psa", "purchase",
    "sale", "acquisition", "disposition", "refinance", "loan",
    "mortgage", "debt service", "dscr", "ltv", "occupancy",
    "vacancy", "absorption", "rent roll", "operating statement",
]


class Profiler:
    """Analyzes the scanned file inventory and builds a profile."""

    def __init__(self, config: Config, db: Database) -> None:
        self.config = config
        self.db = db

    def build_profile(self, scan_profile: ScanProfile | None = None) -> dict[str, Any]:
        """Build a comprehensive profile of the file landscape."""
        stats = self.db.get_stats()
        all_tags = self.db.get_all_tags()
        all_entities = self.db.get_all_entities()
        duplicates = self.db.find_duplicates_by_hash()

        # Get all files for deeper analysis
        files = self.db.get_all_files()

        # Detect themes
        themes = self._detect_themes(files)

        # Detect entities (companies, properties, people)
        detected_entities = self._detect_entities(files)

        # Detect projects/deals
        projects = self._detect_projects(files)

        # Personal vs business breakdown
        personal_business = self._classify_personal_business(files)

        # Time period analysis
        time_analysis = self._analyze_time_periods(files)

        profile = {
            "summary": {
                "total_files": stats["total_files"],
                "total_size": stats["total_size"],
                "total_size_human": _human_size(stats["total_size"]),
                "files_needing_review": stats["review_count"],
                "duplicate_groups": len(duplicates),
            },
            "by_category": stats["by_category"],
            "by_extension": stats["by_extension"],
            "by_status": stats["by_status"],
            "themes": themes,
            "detected_entities": detected_entities,
            "detected_projects": projects,
            "personal_vs_business": personal_business,
            "time_analysis": time_analysis,
            "existing_tags": all_tags[:50],
            "existing_entities": all_entities[:50],
        }

        if scan_profile:
            profile["scan_details"] = scan_profile.to_dict()

        return profile

    def _detect_themes(self, files: list[FileRecord]) -> list[dict[str, Any]]:
        """Identify major themes/categories in the files."""
        theme_counts: dict[str, int] = defaultdict(int)
        theme_keywords: dict[str, set[str]] = defaultdict(set)

        theme_patterns = {
            "Commercial Real Estate": [
                r"lease", r"tenant", r"property", r"noi", r"cap.?rate",
                r"rent.?roll", r"cam", r"nnn", r"pro.?forma",
            ],
            "Financial Analysis": [
                r"financial", r"model", r"irr", r"npv", r"cash.?flow",
                r"roi", r"underwriting", r"pro.?forma", r"projection",
            ],
            "Legal Documents": [
                r"contract", r"agreement", r"amendment", r"addendum",
                r"estoppel", r"loi", r"letter.?of.?intent", r"psa",
            ],
            "Tax & Accounting": [
                r"tax", r"w-?2", r"1099", r"k-?1", r"return",
                r"deduction", r"depreciation", r"schedule.?[a-e]",
            ],
            "Insurance": [
                r"insurance", r"policy", r"claim", r"coverage",
                r"certificate.?of.?insurance", r"coi",
            ],
            "Property Operations": [
                r"maintenance", r"repair", r"inspection", r"work.?order",
                r"hvac", r"plumbing", r"electrical", r"roof",
            ],
            "Investment": [
                r"invest", r"portfolio", r"distribution", r"waterfall",
                r"syndication", r"fund", r"offering", r"ppm",
            ],
            "Personal": [
                r"personal", r"family", r"medical", r"health",
                r"school", r"vacation", r"travel", r"recipe",
            ],
            "Correspondence": [
                r"email", r"letter", r"memo", r"from:", r"to:",
                r"subject:", r"dear\s", r"regards",
            ],
        }

        for record in files:
            text_lower = (record.extracted_text[:2000] + " " + record.filename).lower()
            for theme, patterns in theme_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, text_lower):
                        theme_counts[theme] += 1
                        theme_keywords[theme].add(pattern)
                        break  # One match per theme per file

        return [
            {
                "theme": theme,
                "file_count": count,
                "sample_keywords": list(theme_keywords[theme])[:5],
            }
            for theme, count in sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)
        ]

    def _detect_entities(self, files: list[FileRecord]) -> dict[str, list[dict[str, Any]]]:
        """Detect companies, properties, and people from file content."""
        companies: dict[str, int] = defaultdict(int)
        properties: dict[str, int] = defaultdict(int)

        # Check for known brands
        for record in files:
            text_lower = (record.extracted_text[:2000] + " " + record.filename).lower()
            for brand in self.config.brands:
                if brand.lower() in text_lower:
                    companies[brand] = companies.get(brand, 0) + 1

        # Look for property addresses (basic pattern)
        address_pattern = re.compile(
            r"\d{1,5}\s+[\w\s]+(?:street|st|avenue|ave|boulevard|blvd|road|rd|"
            r"drive|dr|lane|ln|way|court|ct|place|pl)\b",
            re.IGNORECASE,
        )
        for record in files:
            text = record.extracted_text[:3000]
            matches = address_pattern.findall(text)
            for match in matches[:3]:  # Cap to avoid noise
                clean = match.strip()
                if len(clean) > 10:
                    properties[clean] = properties.get(clean, 0) + 1

        return {
            "companies": [
                {"name": name, "file_count": count}
                for name, count in sorted(companies.items(), key=lambda x: x[1], reverse=True)
            ],
            "properties": [
                {"address": addr, "file_count": count}
                for addr, count in sorted(properties.items(), key=lambda x: x[1], reverse=True)
                if count >= 2  # Only properties mentioned in multiple files
            ][:20],
        }

    def _detect_projects(self, files: list[FileRecord]) -> list[dict[str, Any]]:
        """Detect project groupings based on co-occurring terms."""
        # Group files by directory as a proxy for projects
        dir_groups: dict[str, list[FileRecord]] = defaultdict(list)
        for record in files:
            parent = str(Path(record.file_path).parent) if record.file_path else ""
            if parent:
                dir_groups[parent].append(record)

        projects = []
        for directory, dir_files in dir_groups.items():
            if len(dir_files) >= 3:  # Only directories with 3+ files
                # Summarize the directory
                doc_types = defaultdict(int)
                for f in dir_files:
                    ext = f.extension.lower()
                    doc_types[ext] = doc_types.get(ext, 0) + 1
                projects.append({
                    "directory": directory,
                    "file_count": len(dir_files),
                    "top_types": dict(sorted(doc_types.items(), key=lambda x: x[1], reverse=True)[:5]),
                })

        return sorted(projects, key=lambda x: x["file_count"], reverse=True)[:30]

    def _classify_personal_business(self, files: list[FileRecord]) -> dict[str, int]:
        """Rough split of personal vs business files."""
        personal_indicators = {
            "personal", "family", "medical", "health", "school", "vacation",
            "recipe", "photo", "selfie", "birthday", "wedding", "holiday",
        }
        counts = {"business": 0, "personal": 0, "unknown": 0}
        for record in files:
            text_lower = (record.extracted_text[:500] + " " + record.filename).lower()
            if any(ind in text_lower for ind in personal_indicators):
                counts["personal"] += 1
            elif record.category in ("Personal",):
                counts["personal"] += 1
            elif any(brand.lower() in text_lower for brand in self.config.brands):
                counts["business"] += 1
            else:
                counts["unknown"] += 1
        return counts

    def _analyze_time_periods(self, files: list[FileRecord]) -> dict[str, Any]:
        """Analyze file distribution by time period."""
        year_counts: dict[str, int] = defaultdict(int)
        quarter_counts: dict[str, int] = defaultdict(int)

        for record in files:
            date_str = record.modified_at or record.created_at
            if date_str:
                try:
                    year = date_str[:4]
                    month = int(date_str[5:7]) if len(date_str) > 6 else 0
                    quarter = (month - 1) // 3 + 1 if month else 0
                    year_counts[year] += 1
                    if quarter:
                        quarter_counts[f"{year}-Q{quarter}"] += 1
                except (ValueError, IndexError):
                    pass

        return {
            "by_year": dict(sorted(year_counts.items())),
            "by_quarter": dict(sorted(quarter_counts.items(), reverse=True)[:12]),
        }

    def generate_report(self, profile: dict[str, Any]) -> str:
        """Generate a human-readable report from the profile."""
        lines = []
        lines.append("=" * 70)
        lines.append("FILE LANDSCAPE PROFILE")
        lines.append("=" * 70)

        s = profile["summary"]
        lines.append(f"\nTotal files: {s['total_files']:,}")
        lines.append(f"Total size: {s['total_size_human']}")
        lines.append(f"Duplicate groups: {s['duplicate_groups']}")
        lines.append(f"Files needing review: {s['files_needing_review']}")

        lines.append("\n--- Files by Category ---")
        for cat, count in profile.get("by_category", {}).items():
            lines.append(f"  {cat:30s} {count:>6,}")

        lines.append("\n--- Top File Extensions ---")
        for ext, count in list(profile.get("by_extension", {}).items())[:15]:
            lines.append(f"  .{ext:29s} {count:>6,}")

        lines.append("\n--- Major Themes ---")
        for theme in profile.get("themes", []):
            lines.append(
                f"  {theme['theme']:30s} {theme['file_count']:>6,} files"
            )

        entities = profile.get("detected_entities", {})
        if entities.get("companies"):
            lines.append("\n--- Detected Companies/Brands ---")
            for co in entities["companies"]:
                lines.append(f"  {co['name']:30s} {co['file_count']:>6,} files")

        if entities.get("properties"):
            lines.append("\n--- Detected Properties ---")
            for prop in entities["properties"][:10]:
                lines.append(f"  {prop['address'][:30]:30s} {prop['file_count']:>6,} files")

        pb = profile.get("personal_vs_business", {})
        if pb:
            lines.append("\n--- Personal vs Business ---")
            lines.append(f"  Business: {pb.get('business', 0):,}")
            lines.append(f"  Personal: {pb.get('personal', 0):,}")
            lines.append(f"  Unknown:  {pb.get('unknown', 0):,}")

        time_data = profile.get("time_analysis", {})
        if time_data.get("by_year"):
            lines.append("\n--- Files by Year ---")
            for year, count in time_data["by_year"].items():
                lines.append(f"  {year}  {count:>6,}")

        lines.append("\n" + "=" * 70)
        return "\n".join(lines)


def _human_size(size_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(size_bytes) < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0  # type: ignore
    return f"{size_bytes:.1f} PB"


# Need Path import
from pathlib import Path
