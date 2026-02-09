"""
File renaming engine — normalizes filenames following institutional best practices.

Naming standard (Stanford, Harvard, NARA, Smithsonian, Princeton, CESSDA):
  - Format: descriptor_YYYYMMDD_v01.ext
  - Underscores separate major elements (subject, date, version)
  - Hyphens separate words within an element (e.g., "annual-report")
  - ISO 8601 dates (YYYYMMDD)
  - All lowercase
  - Max ~50 characters (Harvard recommendation)

Handles Windows reserved names, invalid characters, and long paths.
"""

import os
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass

from config import (
    NAMING_RULES,
    WINDOWS_RESERVED_NAMES,
    WINDOWS_INVALID_CHARS,
)

# Regex to detect dates already present in a filename
_DATE_PATTERNS = [
    # YYYYMMDD or YYYY-MM-DD or YYYY_MM_DD
    re.compile(r"(20\d{2})[_\-]?([01]\d)[_\-]?([0-3]\d)"),
    # MMDDYYYY or MM-DD-YYYY
    re.compile(r"([01]\d)[_\-]?([0-3]\d)[_\-]?(20\d{2})"),
    # YYYYMM
    re.compile(r"(20\d{2})[_\-]?([01]\d)(?!\d)"),
]

# Regex to detect version strings already in filename
_VERSION_PATTERN = re.compile(r"[_\-\s]?v(?:er(?:sion)?)?[_\-\s.]?(\d+(?:\.\d+)?)", re.IGNORECASE)


@dataclass
class RenameAction:
    """A single planned rename operation."""
    original: Path
    new_path: Path
    reason: str

    @property
    def changed(self) -> bool:
        return self.original != self.new_path


def _extract_existing_date(name: str) -> tuple[str | None, str]:
    """
    Find and extract a date already embedded in the filename.

    Returns:
        (date_str in YYYYMMDD format, name with date removed)
    """
    for pattern in _DATE_PATTERNS:
        m = pattern.search(name)
        if m:
            groups = m.groups()
            if len(groups) == 3:
                if len(groups[2]) == 4:
                    # MM-DD-YYYY format
                    date_str = f"{groups[2]}{groups[0]}{groups[1]}"
                else:
                    # YYYY-MM-DD format
                    date_str = f"{groups[0]}{groups[1]}{groups[2]}"
                cleaned = name[:m.start()] + name[m.end():]
                return date_str, cleaned
            elif len(groups) == 2:
                date_str = f"{groups[0]}{groups[1]}"
                cleaned = name[:m.start()] + name[m.end():]
                return date_str, cleaned
    return None, name


def _extract_existing_version(name: str) -> tuple[str | None, str]:
    """
    Find and extract a version string from the filename.

    Returns:
        (version like "v01", name with version removed)
    """
    m = _VERSION_PATTERN.search(name)
    if m:
        ver_num = m.group(1)
        # Normalize to v01 format with leading zero
        if "." in ver_num:
            version = f"v{ver_num}"
        else:
            version = f"v{int(ver_num):02d}"
        cleaned = name[:m.start()] + name[m.end():]
        return version, cleaned
    return None, name


def _get_file_date(filepath: Path) -> str:
    """Get the file's modification date as YYYYMMDD."""
    try:
        mtime = os.path.getmtime(filepath)
        dt = datetime.fromtimestamp(mtime, tz=timezone.utc)
        return dt.strftime("%Y%m%d")
    except OSError:
        return datetime.now(timezone.utc).strftime("%Y%m%d")


def _clean_stem(name: str, rules: dict) -> str:
    """
    Clean a filename stem: normalize unicode, remove invalid chars,
    apply word separators.
    """
    word_sep = rules.get("word_separator", "-")

    # Normalize unicode
    stem = unicodedata.normalize("NFKD", name)
    stem = stem.encode("ascii", "ignore").decode("ascii")

    # Remove Windows-invalid characters
    for ch in WINDOWS_INVALID_CHARS:
        stem = stem.replace(ch, "")

    # Strip configured special characters
    for ch in rules.get("strip_characters", ""):
        stem = stem.replace(ch, "")

    # Replace spaces and tabs with word separator
    stem = stem.replace(" ", word_sep)
    stem = stem.replace("\t", word_sep)

    # Replace underscores with word separator (underscores are reserved
    # for element separation in the final name)
    stem = stem.replace("_", word_sep)

    # Lowercase
    if rules.get("lowercase", True):
        stem = stem.lower()

    # Collapse repeated word separators
    if rules.get("collapse_separators", True) and word_sep:
        stem = re.sub(re.escape(word_sep) + r"{2,}", word_sep, stem)

    # Strip leading/trailing separators
    if rules.get("strip_edge_separators", True) and word_sep:
        stem = stem.strip(word_sep)

    return stem


def normalize_filename(
    name: str,
    extension: str,
    rules: dict | None = None,
    filepath: Path | None = None,
    category: str | None = None,
) -> str:
    """
    Apply best-practice naming conventions to produce a standardized filename.

    Standard format: descriptor_YYYYMMDD_v01.ext
      - descriptor: cleaned subject/content words joined by hyphens
      - YYYYMMDD: date from metadata, filename, or file modification time
      - v01: version if one was found in the original name

    Args:
        name: The filename stem (no extension).
        extension: The file extension including the leading dot.
        rules: Naming rules dict. Uses NAMING_RULES defaults if None.
        filepath: Original file path (used to get modification date).
        category: File category (used for type-specific formatting).

    Returns:
        The normalized full filename (stem + extension).
    """
    r = rules or NAMING_RULES
    elem_sep = r.get("element_separator", "_")

    # Lowercase extension
    if r.get("lowercase", True):
        extension = extension.lower()

    # Extract date and version from original name before cleaning
    date_str, name_no_date = _extract_existing_date(name)
    version_str, name_cleaned = _extract_existing_version(name_no_date)

    # Clean the descriptor
    descriptor = _clean_stem(name_cleaned, r)

    # Remove common camera prefixes (IMG_, DSC_, etc.) since they're meaningless
    descriptor = re.sub(r"^(img|dsc|dscn|dscf|sam|p|wp|imag)\b-?", "", descriptor)
    descriptor = descriptor.strip("-")

    # If no date found in name and date prefixing is enabled, use file date
    if not date_str and r.get("add_date_prefix", True) and filepath:
        date_str = _get_file_date(filepath)

    # Build the final filename parts
    parts = []

    # Type-specific ordering
    is_media = category and any(
        cat in (category or "").lower()
        for cat in ("image", "audio", "video", "photo")
    )

    if is_media and date_str:
        # Media files: date first -> YYYYMMDD_descriptor_v01.ext
        parts.append(date_str)
        if descriptor:
            parts.append(descriptor)
    else:
        # Documents/other: descriptor first -> descriptor_YYYYMMDD_v01.ext
        if descriptor:
            parts.append(descriptor)
        if date_str:
            parts.append(date_str)

    if version_str:
        parts.append(version_str)

    stem = elem_sep.join(parts)

    # Truncate if too long
    max_len = r.get("max_filename_length", 50)
    if len(stem) > max_len:
        stem = stem[:max_len].rstrip("-").rstrip("_")

    # Handle Windows reserved names
    if stem.upper() in WINDOWS_RESERVED_NAMES:
        stem = f"{stem}{elem_sep}file"

    # Handle empty stem
    if not stem:
        if date_str:
            stem = date_str
        else:
            stem = "unnamed"

    return f"{stem}{extension}"


def plan_renames(
    files: list,
    rules: dict | None = None,
) -> list[RenameAction]:
    """
    Generate a list of rename actions for the given files.

    Args:
        files: List of FileEntry objects from the scanner.
        rules: Naming rules. Uses defaults if None.

    Returns:
        List of RenameAction objects (only those that actually change).
    """
    actions: list[RenameAction] = []
    used_names: dict[Path, dict[str, int]] = {}

    for entry in files:
        new_name = normalize_filename(
            entry.stem, entry.extension, rules,
            filepath=entry.path, category=entry.category,
        )
        parent = entry.parent

        if parent not in used_names:
            used_names[parent] = {}

        name_lower = new_name.lower()
        if name_lower in used_names[parent]:
            used_names[parent][name_lower] += 1
            count = used_names[parent][name_lower]
            stem_part, ext_part = _split_name(new_name)
            elem_sep = (rules or NAMING_RULES).get("element_separator", "_")
            new_name = f"{stem_part}{elem_sep}{count:02d}{ext_part}"
        else:
            used_names[parent][name_lower] = 0

        new_path = parent / new_name

        if new_path != entry.path:
            reason = _describe_change(entry.name, new_name)
            actions.append(RenameAction(
                original=entry.path,
                new_path=new_path,
                reason=reason,
            ))

    return actions


def _split_name(filename: str) -> tuple[str, str]:
    """Split a filename into stem and extension."""
    p = Path(filename)
    return p.stem, p.suffix


def _describe_change(old: str, new: str) -> str:
    """Generate a human-readable reason for the rename."""
    reasons = []
    if old != new and old.lower() == new.lower():
        reasons.append("case normalization")
    elif old.replace(" ", "-").replace("_", "-").lower() == new.replace("_", "-").lower():
        reasons.append("separator normalization")
    else:
        reasons.append("naming convention normalization")
    return ", ".join(reasons) if reasons else "renamed"
