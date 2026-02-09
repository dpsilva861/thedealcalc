"""
File scanner module — walks directories and categorizes files by extension
and by reading file contents (magic bytes + metadata extraction).
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from config import DEFAULT_CATEGORIES, SKIP_DIRECTORIES, SKIP_FILES
from content_detector import analyze_file, ContentInfo


@dataclass
class FileEntry:
    """Represents a single file found during scanning."""
    path: Path
    name: str
    stem: str          # filename without extension
    extension: str     # lowercase extension including dot
    size: int
    category: str
    parent: Path
    # Content-aware fields
    content_info: Optional[ContentInfo] = None  # Full content analysis
    real_category: Optional[str] = None         # Category from content detection
    real_extension: Optional[str] = None        # Correct extension from content
    extension_mismatch: bool = False            # Extension doesn't match content
    suggested_name: Optional[str] = None        # Smart name from metadata

    @classmethod
    def from_path(cls, filepath: Path, category: str,
                  deep_scan: bool = False) -> "FileEntry":
        stat = filepath.stat()
        entry = cls(
            path=filepath,
            name=filepath.name,
            stem=filepath.stem,
            extension=filepath.suffix.lower(),
            size=stat.st_size,
            category=category,
            parent=filepath.parent,
        )

        if deep_scan:
            entry.content_info = analyze_file(filepath)
            ci = entry.content_info
            if ci.detected_category:
                entry.real_category = ci.detected_category
                entry.category = ci.detected_category  # Override extension-based category
            if ci.detected_extension:
                entry.real_extension = ci.detected_extension
            entry.extension_mismatch = ci.extension_mismatch
            entry.suggested_name = ci.suggested_name

        return entry


@dataclass
class ScanResult:
    """Aggregated results from scanning a directory tree."""
    root: Path
    files: list[FileEntry] = field(default_factory=list)
    skipped: list[Path] = field(default_factory=list)
    errors: list[tuple[Path, str]] = field(default_factory=list)
    total_size: int = 0

    @property
    def by_category(self) -> dict[str, list[FileEntry]]:
        groups: dict[str, list[FileEntry]] = {}
        for f in self.files:
            groups.setdefault(f.category, []).append(f)
        return groups

    @property
    def mismatched_files(self) -> list[FileEntry]:
        return [f for f in self.files if f.extension_mismatch]

    @property
    def files_with_metadata(self) -> list[FileEntry]:
        return [f for f in self.files if f.suggested_name]

    def summary(self) -> str:
        lines = [f"Scanned: {self.root}"]
        lines.append(f"Total files: {len(self.files)}")
        lines.append(f"Total size: {_fmt_size(self.total_size)}")
        lines.append(f"Skipped: {len(self.skipped)}")
        lines.append(f"Errors: {len(self.errors)}")
        lines.append("")
        for cat, entries in sorted(self.by_category.items()):
            cat_size = sum(e.size for e in entries)
            lines.append(f"  {cat}: {len(entries)} files ({_fmt_size(cat_size)})")

        mismatched = self.mismatched_files
        if mismatched:
            lines.append("")
            lines.append(f"Extension mismatches found: {len(mismatched)}")
            for f in mismatched[:10]:
                lines.append(f"  {f.name}: extension is {f.extension}, "
                             f"content is actually {f.real_extension} ({f.content_info.description})")
            if len(mismatched) > 10:
                lines.append(f"  ... and {len(mismatched) - 10} more")

        with_meta = self.files_with_metadata
        if with_meta:
            lines.append("")
            lines.append(f"Files with extractable metadata: {len(with_meta)}")
            for f in with_meta[:10]:
                lines.append(f"  {f.name} -> suggested: {f.suggested_name}")
            if len(with_meta) > 10:
                lines.append(f"  ... and {len(with_meta) - 10} more")

        return "\n".join(lines)


def _fmt_size(nbytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if nbytes < 1024:
            return f"{nbytes:.1f} {unit}"
        nbytes /= 1024
    return f"{nbytes:.1f} PB"


def build_extension_map(
    categories: Optional[dict[str, list[str]]] = None,
) -> dict[str, str]:
    """Build a reverse map from extension -> category name."""
    cats = categories or DEFAULT_CATEGORIES
    ext_map: dict[str, str] = {}
    for category, extensions in cats.items():
        for ext in extensions:
            ext_map[ext.lower()] = category
    return ext_map


def scan_directory(
    root: Path,
    categories: Optional[dict[str, list[str]]] = None,
    recursive: bool = True,
    skip_dirs: Optional[set[str]] = None,
    skip_files: Optional[set[str]] = None,
    deep_scan: bool = False,
) -> ScanResult:
    """
    Walk a directory tree and categorize every file.

    Args:
        root: Directory to scan.
        categories: Extension-to-category mapping. Uses defaults if None.
        recursive: Whether to descend into subdirectories.
        skip_dirs: Directory names to skip entirely.
        skip_files: Filenames to skip.
        deep_scan: If True, read file contents for type detection and
                   metadata extraction. Slower but much more accurate.

    Returns:
        ScanResult with all discovered files.
    """
    root = Path(root).resolve()
    ext_map = build_extension_map(categories)
    result = ScanResult(root=root)
    _skip_dirs = skip_dirs or SKIP_DIRECTORIES
    _skip_files = skip_files or SKIP_FILES

    if not root.is_dir():
        result.errors.append((root, "Not a directory"))
        return result

    walker = os.walk(root, topdown=True)
    for dirpath, dirnames, filenames in walker:
        # Prune skipped directories in-place so os.walk doesn't descend
        dirnames[:] = [
            d for d in dirnames
            if d.lower() not in {s.lower() for s in _skip_dirs}
        ]

        if not recursive and Path(dirpath) != root:
            dirnames.clear()
            continue

        for fname in filenames:
            if fname.lower() in {s.lower() for s in _skip_files}:
                result.skipped.append(Path(dirpath) / fname)
                continue

            filepath = Path(dirpath) / fname
            try:
                ext = filepath.suffix.lower()
                category = ext_map.get(ext, "Other")
                entry = FileEntry.from_path(filepath, category,
                                            deep_scan=deep_scan)
                result.files.append(entry)
                result.total_size += entry.size
            except PermissionError:
                result.errors.append((filepath, "Permission denied"))
            except OSError as exc:
                result.errors.append((filepath, str(exc)))

    return result
