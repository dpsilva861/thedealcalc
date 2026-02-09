"""
File renaming engine — normalizes filenames to consistent conventions.
Handles Windows reserved names, invalid characters, and long paths.
"""

import re
import unicodedata
from pathlib import Path
from dataclasses import dataclass

from config import (
    NAMING_RULES,
    WINDOWS_RESERVED_NAMES,
    WINDOWS_INVALID_CHARS,
)


@dataclass
class RenameAction:
    """A single planned rename operation."""
    original: Path
    new_path: Path
    reason: str

    @property
    def changed(self) -> bool:
        return self.original != self.new_path


def normalize_filename(
    name: str,
    extension: str,
    rules: dict | None = None,
) -> str:
    """
    Apply naming conventions to a filename stem, then re-attach the extension.

    Args:
        name: The filename stem (no extension).
        extension: The file extension including the leading dot.
        rules: Naming rules dict. Uses NAMING_RULES defaults if None.

    Returns:
        The normalized full filename (stem + extension).
    """
    r = rules or NAMING_RULES
    sep = r.get("space_replacement", "-")

    # Normalize unicode (e.g., accented chars -> ASCII equivalents)
    stem = unicodedata.normalize("NFKD", name)
    stem = stem.encode("ascii", "ignore").decode("ascii")

    # Remove Windows-invalid characters
    for ch in WINDOWS_INVALID_CHARS:
        stem = stem.replace(ch, "")

    # Strip configured special characters
    strip_chars = r.get("strip_characters", "")
    for ch in strip_chars:
        stem = stem.replace(ch, "")

    # Replace spaces and underscores with the separator
    stem = stem.replace(" ", sep)
    stem = stem.replace("\t", sep)
    if sep != "_":
        stem = stem.replace("_", sep)

    # Lowercase
    if r.get("lowercase", True):
        stem = stem.lower()
        extension = extension.lower()

    # Collapse repeated separators
    if r.get("collapse_separators", True) and sep:
        stem = re.sub(re.escape(sep) + r"{2,}", sep, stem)

    # Strip leading/trailing separators
    if r.get("strip_edge_separators", True) and sep:
        stem = stem.strip(sep)

    # Truncate if too long
    max_len = r.get("max_filename_length", 200)
    if len(stem) > max_len:
        stem = stem[:max_len].rstrip(sep)

    # Handle Windows reserved names
    if stem.upper() in WINDOWS_RESERVED_NAMES:
        stem = f"{stem}_file"

    # Handle empty stem after processing
    if not stem:
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
    # Track new names per directory to handle collisions
    used_names: dict[Path, dict[str, int]] = {}

    for entry in files:
        new_name = normalize_filename(entry.stem, entry.extension, rules)
        parent = entry.parent

        # Deduplicate within the same directory
        if parent not in used_names:
            used_names[parent] = {}

        name_lower = new_name.lower()
        if name_lower in used_names[parent]:
            used_names[parent][name_lower] += 1
            count = used_names[parent][name_lower]
            stem_part, ext_part = _split_name(new_name)
            sep = (rules or NAMING_RULES).get("space_replacement", "-")
            new_name = f"{stem_part}{sep}{count}{ext_part}"
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
