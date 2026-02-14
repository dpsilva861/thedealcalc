"""
Phase 2 — Metadata management.

Handles writing metadata to:
1. SQLite database (via database.py)
2. NTFS Alternate Data Streams (Windows only)
3. Windows Extended File Properties (via COM/pywin32)
4. JSON sidecar files per directory
"""

from __future__ import annotations

import json
import logging
import os
import platform
from datetime import datetime
from pathlib import Path
from typing import Any

from .models import FileRecord

logger = logging.getLogger(__name__)

IS_WINDOWS = platform.system() == "Windows"


class NtfsAdsWriter:
    """Write metadata to NTFS Alternate Data Streams.

    ADS allows embedding metadata directly on files so it travels with
    the file on NTFS drives. Data is stored in a stream named
    ':file_organizer' as JSON.
    """

    STREAM_NAME = ":file_organizer"

    def write(self, record: FileRecord) -> bool:
        """Write metadata to ADS on the file."""
        if not IS_WINDOWS:
            logger.debug("ADS not available on non-Windows platforms")
            return False
        try:
            ads_path = record.file_path + self.STREAM_NAME
            meta = self._build_metadata(record)
            with open(ads_path, "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2)
            return True
        except Exception as e:
            logger.warning("Failed to write ADS for %s: %s", record.file_path, e)
            return False

    def read(self, file_path: str) -> dict[str, Any] | None:
        """Read metadata from ADS on a file."""
        if not IS_WINDOWS:
            return None
        try:
            ads_path = file_path + self.STREAM_NAME
            with open(ads_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return None
        except Exception as e:
            logger.warning("Failed to read ADS for %s: %s", file_path, e)
            return None

    def _build_metadata(self, record: FileRecord) -> dict[str, Any]:
        return {
            "tags": record.tags,
            "category": record.category,
            "subcategory": record.subcategory,
            "entities": record.entities,
            "document_type": record.document_type,
            "date_relevance": record.date_relevance,
            "status": record.status,
            "confidentiality": record.confidentiality,
            "summary": record.summary,
            "source": record.source,
            "classified_by": record.classified_by,
            "classified_at": record.classified_at,
            "organizer_version": "2.0.0",
        }


class WindowsPropertiesWriter:
    """Write metadata to Windows Extended File Properties.

    Uses the DSOFile COM object or pywin32's propsys to write to the
    Subject, Tags, Comments, and Categories fields visible in
    File Explorer and Windows Search.
    """

    def write(self, record: FileRecord) -> bool:
        """Write metadata to Windows file properties."""
        if not IS_WINDOWS:
            logger.debug("Windows properties not available on non-Windows platforms")
            return False
        try:
            return self._write_via_propsys(record)
        except Exception as e:
            logger.warning("Failed to write Windows properties for %s: %s", record.file_path, e)
            return False

    def _write_via_propsys(self, record: FileRecord) -> bool:
        """Write properties using propsys (pywin32)."""
        try:
            import pythoncom
            from win32com.propsys import propsys, pscon
            import win32com.propsys as ps
            from win32com.shell import shellcon

            # Open property store for writing
            prop_store = propsys.SHGetPropertyStoreFromParsingName(
                record.file_path,
                None,
                shellcon.GPS_READWRITE,
                propsys.IID_IPropertyStore,
            )

            # System.Subject
            if record.summary:
                pk_subject = propsys.PSGetPropertyKeyFromName("System.Subject")
                prop_store.SetValue(pk_subject, propsys.PROPVARIANTType(record.summary))

            # System.Keywords (Tags)
            if record.tags:
                pk_keywords = propsys.PSGetPropertyKeyFromName("System.Keywords")
                prop_store.SetValue(
                    pk_keywords, propsys.PROPVARIANTType(record.tags)
                )

            # System.Comment
            comment = f"Category: {record.category}"
            if record.subcategory:
                comment += f" > {record.subcategory}"
            if record.entities:
                comment += f" | Entities: {', '.join(record.entities)}"
            pk_comment = propsys.PSGetPropertyKeyFromName("System.Comment")
            prop_store.SetValue(pk_comment, propsys.PROPVARIANTType(comment))

            # System.Category
            if record.category:
                pk_category = propsys.PSGetPropertyKeyFromName("System.Category")
                prop_store.SetValue(
                    pk_category, propsys.PROPVARIANTType([record.category])
                )

            prop_store.Commit()
            return True

        except ImportError:
            logger.warning("pywin32 not installed — cannot write Windows properties")
            return False
        except Exception as e:
            logger.warning("propsys write failed for %s: %s", record.file_path, e)
            return False


class JsonSidecarWriter:
    """Write per-directory JSON sidecar files.

    Creates/updates a .file_organizer.json file in each directory
    containing metadata for all files in that directory. This serves
    as a portable backup since ADS and Windows properties don't survive
    transfers to non-NTFS drives, cloud sync, or ZIP compression.
    """

    SIDECAR_FILENAME = ".file_organizer.json"

    def write_for_file(self, record: FileRecord) -> bool:
        """Update the sidecar file in the file's directory."""
        try:
            directory = str(Path(record.file_path).parent)
            sidecar_path = os.path.join(directory, self.SIDECAR_FILENAME)

            # Load existing sidecar data
            existing: dict[str, Any] = {}
            if os.path.exists(sidecar_path):
                try:
                    with open(sidecar_path, "r", encoding="utf-8") as f:
                        existing = json.load(f)
                except (json.JSONDecodeError, OSError):
                    existing = {}

            # Update entry for this file
            if "files" not in existing:
                existing["files"] = {}
            existing["files"][record.filename] = {
                "tags": record.tags,
                "category": record.category,
                "subcategory": record.subcategory,
                "entities": record.entities,
                "document_type": record.document_type,
                "date_relevance": record.date_relevance,
                "status": record.status,
                "confidentiality": record.confidentiality,
                "summary": record.summary,
                "source": record.source,
                "sha256": record.sha256,
            }
            existing["updated_at"] = datetime.now().isoformat()
            existing["organizer_version"] = "2.0.0"

            with open(sidecar_path, "w", encoding="utf-8") as f:
                json.dump(existing, f, indent=2, ensure_ascii=False)
            return True

        except Exception as e:
            logger.warning("Failed to write sidecar for %s: %s", record.file_path, e)
            return False

    def write_for_directory(self, directory: str, records: list[FileRecord]) -> bool:
        """Write a complete sidecar file for a directory."""
        try:
            sidecar_path = os.path.join(directory, self.SIDECAR_FILENAME)
            data: dict[str, Any] = {
                "files": {},
                "updated_at": datetime.now().isoformat(),
                "organizer_version": "2.0.0",
            }
            for record in records:
                data["files"][record.filename] = {
                    "tags": record.tags,
                    "category": record.category,
                    "subcategory": record.subcategory,
                    "entities": record.entities,
                    "document_type": record.document_type,
                    "date_relevance": record.date_relevance,
                    "status": record.status,
                    "confidentiality": record.confidentiality,
                    "summary": record.summary,
                    "source": record.source,
                    "sha256": record.sha256,
                }
            with open(sidecar_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            logger.warning("Failed to write sidecar for directory %s: %s", directory, e)
            return False

    def read(self, directory: str) -> dict[str, Any] | None:
        """Read sidecar data from a directory."""
        sidecar_path = os.path.join(directory, self.SIDECAR_FILENAME)
        if not os.path.exists(sidecar_path):
            return None
        try:
            with open(sidecar_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None


class MetadataManager:
    """Unified interface for writing metadata to all storage backends."""

    def __init__(self) -> None:
        self.ads_writer = NtfsAdsWriter()
        self.win_writer = WindowsPropertiesWriter()
        self.sidecar_writer = JsonSidecarWriter()

    def apply_all(self, record: FileRecord) -> dict[str, bool]:
        """Apply metadata to all backends. Returns status for each."""
        return {
            "ads": self.ads_writer.write(record),
            "windows_properties": self.win_writer.write(record),
            "json_sidecar": self.sidecar_writer.write_for_file(record),
        }

    def apply_to_directory(self, directory: str, records: list[FileRecord]) -> bool:
        """Write sidecar for an entire directory."""
        return self.sidecar_writer.write_for_directory(directory, records)
