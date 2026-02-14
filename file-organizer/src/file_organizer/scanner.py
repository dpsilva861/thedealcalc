"""
Phase 1 — File Discovery & Inventory Scanner.

Walks directories, inventories every file, extracts content, computes hashes,
and builds a complete profile of the file landscape.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

try:
    import xxhash
    _HAS_XXHASH = True
except ImportError:
    _HAS_XXHASH = False

from .config import Config
from .content_reader import ContentReader
from .database import Database
from .models import FileRecord, ScanProfile, compute_sha256

logger = logging.getLogger(__name__)


class Scanner:
    """Scans directories and builds a complete file inventory."""

    def __init__(
        self,
        config: Config,
        db: Database,
        content_reader: ContentReader | None = None,
        progress_callback: Callable[[str, int, int], None] | None = None,
    ) -> None:
        self.config = config
        self.db = db
        self.reader = content_reader or ContentReader(
            tika_server_url=config.tika_server_url,
            max_size=config.max_file_size_bytes,
        )
        self.progress_callback = progress_callback
        self._exclude_dirs_lower = {d.lower() for d in config.exclude_dirs}
        self._exclude_exts_lower = {e.lower() for e in config.exclude_extensions}

    def scan(
        self,
        directories: list[str] | None = None,
        extract_content: bool = True,
        compute_hashes: bool = True,
        dry_run: bool = False,
    ) -> ScanProfile:
        """
        Scan directories and build the file inventory.

        Args:
            directories: List of directories to scan (defaults to config.scan_dirs)
            extract_content: Whether to extract text content from files
            compute_hashes: Whether to compute SHA-256 and content hashes
            dry_run: If True, just count files without processing

        Returns:
            ScanProfile with summary statistics
        """
        dirs = directories or self.config.scan_dirs
        scan_id = self.db.log_scan_start(dirs)

        profile = ScanProfile()
        file_paths: list[str] = []

        # Phase 1a: Discover all files
        logger.info("Discovering files in %d directories...", len(dirs))
        for directory in dirs:
            if not os.path.isdir(directory):
                logger.warning("Directory not found: %s", directory)
                profile.errors.append(f"Directory not found: {directory}")
                continue
            for file_path in self._walk(directory):
                file_paths.append(file_path)

        profile.total_files = len(file_paths)
        logger.info("Found %d files to process.", profile.total_files)

        if dry_run:
            return profile

        # Phase 1b: Process each file
        hash_map: dict[str, list[str]] = defaultdict(list)
        ext_counts: dict[str, int] = defaultdict(int)
        ext_sizes: dict[str, int] = defaultdict(int)
        dir_counts: dict[str, int] = defaultdict(int)
        earliest_date = ""
        latest_date = ""
        brand_hits: dict[str, int] = defaultdict(int)

        for idx, file_path in enumerate(file_paths):
            try:
                record = self._process_file(
                    file_path,
                    extract_content=extract_content,
                    compute_hashes=compute_hashes,
                )

                # Update profile stats
                ext = record.extension.lower()
                ext_counts[ext] = ext_counts.get(ext, 0) + 1
                ext_sizes[ext] = ext_sizes.get(ext, 0) + record.file_size
                profile.total_size_bytes += record.file_size

                parent = str(Path(file_path).parent)
                dir_counts[parent] = dir_counts.get(parent, 0) + 1

                # Track date range
                mod_date = record.modified_at
                if mod_date:
                    if not earliest_date or mod_date < earliest_date:
                        earliest_date = mod_date
                    if not latest_date or mod_date > latest_date:
                        latest_date = mod_date

                # Track duplicates
                if record.sha256:
                    hash_map[record.sha256].append(file_path)

                # Detect brands in content/filename
                text_lower = (record.extracted_text + " " + record.filename).lower()
                for brand in self.config.brands:
                    if brand.lower() in text_lower:
                        brand_hits[brand] = brand_hits.get(brand, 0) + 1

                # Save to database
                self.db.upsert_file(record)

                if self.progress_callback:
                    self.progress_callback(file_path, idx + 1, profile.total_files)

            except Exception as e:
                logger.error("Error processing %s: %s", file_path, e)
                profile.errors.append(f"{file_path}: {e}")

            # Log progress periodically
            if (idx + 1) % 100 == 0:
                logger.info("Processed %d / %d files", idx + 1, profile.total_files)

        # Finalize profile
        profile.file_counts_by_extension = dict(
            sorted(ext_counts.items(), key=lambda x: x[1], reverse=True)
        )
        profile.size_by_extension = dict(
            sorted(ext_sizes.items(), key=lambda x: x[1], reverse=True)
        )
        profile.date_range = (earliest_date, latest_date)
        profile.top_directories = sorted(
            dir_counts.items(), key=lambda x: x[1], reverse=True
        )[:20]
        profile.detected_brands = [
            brand for brand, count in sorted(brand_hits.items(), key=lambda x: x[1], reverse=True)
        ]
        profile.duplicates_found = sum(
            1 for paths in hash_map.values() if len(paths) > 1
        )

        # Categorize by broad type
        category_map = {
            "Documents": {".pdf", ".doc", ".docx", ".rtf", ".odt", ".txt", ".md"},
            "Spreadsheets": {".xls", ".xlsx", ".csv", ".tsv", ".ods"},
            "Presentations": {".ppt", ".pptx", ".odp"},
            "Images": {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif",
                      ".svg", ".webp", ".ico"},
            "Audio": {".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a"},
            "Video": {".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"},
            "Archives": {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"},
            "Emails": {".eml", ".msg", ".pst", ".ost"},
            "Code": {".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".java",
                    ".cpp", ".c", ".h", ".cs", ".go", ".rs", ".rb", ".php", ".sql",
                    ".sh", ".bat", ".ps1"},
        }
        cat_counts: dict[str, int] = defaultdict(int)
        for ext, count in ext_counts.items():
            found = False
            for cat, exts in category_map.items():
                if ext in exts:
                    cat_counts[cat] += count
                    found = True
                    break
            if not found:
                cat_counts["Other"] += count
        profile.file_counts_by_category = dict(
            sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
        )

        # Log scan completion
        self.db.log_scan_complete(
            scan_id,
            profile.total_files,
            profile.total_size_bytes,
            json.dumps(profile.to_dict()),
        )

        logger.info(
            "Scan complete: %d files, %d duplicates, %d errors",
            profile.total_files,
            profile.duplicates_found,
            len(profile.errors),
        )
        return profile

    def _walk(self, directory: str) -> list[str]:
        """Walk a directory tree, respecting exclusion rules."""
        file_paths: list[str] = []
        try:
            for root, dirs, files in os.walk(directory, topdown=True):
                # Filter excluded directories in-place
                dirs[:] = [
                    d for d in dirs
                    if d.lower() not in self._exclude_dirs_lower
                    and not d.startswith(".")
                ]
                for fname in files:
                    ext = Path(fname).suffix.lower()
                    if ext in self._exclude_exts_lower:
                        continue
                    full_path = os.path.join(root, fname)
                    try:
                        # Skip symlinks
                        if os.path.islink(full_path):
                            continue
                        file_paths.append(full_path)
                    except (OSError, PermissionError):
                        continue
        except PermissionError:
            logger.warning("Permission denied: %s", directory)
        return file_paths

    def _process_file(
        self,
        file_path: str,
        extract_content: bool = True,
        compute_hashes: bool = True,
    ) -> FileRecord:
        """Process a single file and create a FileRecord."""
        stat = os.stat(file_path)
        path_obj = Path(file_path)

        record = FileRecord(
            file_path=file_path,
            filename=path_obj.name,
            extension=path_obj.suffix.lower().lstrip("."),
            file_size=stat.st_size,
            created_at=datetime.fromtimestamp(stat.st_ctime).isoformat(),
            modified_at=datetime.fromtimestamp(stat.st_mtime).isoformat(),
            accessed_at=datetime.fromtimestamp(stat.st_atime).isoformat(),
            scanned_at=datetime.now().isoformat(),
        )

        # Compute hashes
        if compute_hashes:
            record.sha256 = compute_sha256(file_path)

        # Extract content
        if extract_content:
            extraction = self.reader.extract(file_path)
            record.extracted_text = extraction.get("text", "")
            record.extraction_method = extraction.get("method", "")

            # Compute content hash for near-duplicate detection
            if record.extracted_text and compute_hashes:
                normalized = " ".join(record.extracted_text.lower().split())
                if _HAS_XXHASH:
                    record.content_hash = xxhash.xxh64(normalized.encode()).hexdigest()
                else:
                    record.content_hash = hashlib.md5(normalized.encode()).hexdigest()

        return record

    def rescan_file(self, file_path: str) -> FileRecord | None:
        """Re-scan a single file and update its record."""
        if not os.path.exists(file_path):
            return None
        record = self._process_file(file_path)
        record.last_rescanned_at = datetime.now().isoformat()
        self.db.upsert_file(record)
        return record

    def scan_single(self, file_path: str) -> FileRecord:
        """Scan a single new file (used by the agent watcher)."""
        record = self._process_file(file_path)
        self.db.upsert_file(record)
        return record
