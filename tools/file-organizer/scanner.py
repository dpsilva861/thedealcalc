"""
File scanner module — walks directories and categorizes files by extension.
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from config import DEFAULT_CATEGORIES, SKIP_DIRECTORIES, SKIP_FILES


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

    @classmethod
    def from_path(cls, filepath: Path, category: str) -> "FileEntry":
        stat = filepath.stat()
        return cls(
            path=filepath,
            name=filepath.name,
            stem=filepath.stem,
            extension=filepath.suffix.lower(),
            size=stat.st_size,
            category=category,
            parent=filepath.parent,
        )


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
) -> ScanResult:
    """
    Walk a directory tree and categorize every file.

    Args:
        root: Directory to scan.
        categories: Extension-to-category mapping. Uses defaults if None.
        recursive: Whether to descend into subdirectories.
        skip_dirs: Directory names to skip entirely.
        skip_files: Filenames to skip.

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
                entry = FileEntry.from_path(filepath, category)
                result.files.append(entry)
                result.total_size += entry.size
            except PermissionError:
                result.errors.append((filepath, "Permission denied"))
            except OSError as exc:
                result.errors.append((filepath, str(exc)))

    return result
