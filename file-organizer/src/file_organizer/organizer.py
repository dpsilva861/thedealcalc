"""
Phase 4 — Execution Engine.

Organizes files into the approved taxonomy, applies naming conventions,
writes metadata to all backends, and generates a manifest/log.
"""

from __future__ import annotations

import csv
import json
import logging
import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from .config import Config
from .database import Database
from .metadata import MetadataManager
from .models import FileRecord, MoveRecord

logger = logging.getLogger(__name__)


class Organizer:
    """Executes file organization — moves, renames, applies metadata."""

    def __init__(self, config: Config, db: Database) -> None:
        self.config = config
        self.db = db
        self.metadata_mgr = MetadataManager()
        self.dry_run = False

    def organize(
        self,
        records: list[FileRecord] | None = None,
        dry_run: bool = False,
    ) -> list[MoveRecord]:
        """
        Organize files according to their classification.

        Returns list of MoveRecords documenting every operation.
        """
        self.dry_run = dry_run
        if records is None:
            records = self.db.get_all_files()

        moves: list[MoveRecord] = []
        skipped = 0

        for record in records:
            if record.needs_review:
                # Move to review folder instead
                try:
                    move = self._move_to_review(record)
                    if move:
                        moves.append(move)
                except Exception as e:
                    logger.error("Failed to move to review %s: %s", record.file_path, e)
                continue

            if not record.category or not record.document_type:
                skipped += 1
                continue

            try:
                move = self._organize_file(record)
                if move:
                    moves.append(move)
            except Exception as e:
                logger.error("Failed to organize %s: %s", record.file_path, e)

        logger.info(
            "Organization complete: %d moved, %d skipped",
            len(moves),
            skipped,
        )
        return moves

    def _organize_file(self, record: FileRecord) -> MoveRecord | None:
        """Determine destination and move/rename a single file."""
        # Build destination path
        dest_dir = self._build_destination_path(record)
        new_filename = self._build_filename(record)

        if not dest_dir or not new_filename:
            return None

        new_path = os.path.join(dest_dir, new_filename)

        # Check if already in the right place
        if os.path.normpath(record.file_path) == os.path.normpath(new_path):
            return None

        # Check path length
        if not self.config.long_path_enabled and len(new_path) >= self.config.max_path_length:
            logger.warning("Path too long (%d chars): %s", len(new_path), new_path)
            return None

        # Handle filename collisions
        new_path = self._resolve_collision(new_path)

        move = MoveRecord(
            file_record_id=record.id,
            old_path=record.file_path,
            new_path=new_path,
            old_filename=record.filename,
            new_filename=os.path.basename(new_path),
            moved_at=datetime.now().isoformat(),
        )

        if self.dry_run:
            logger.info("[DRY RUN] %s -> %s", record.file_path, new_path)
            return move

        # Create destination directory
        os.makedirs(dest_dir, exist_ok=True)

        # Move file
        shutil.move(record.file_path, new_path)

        # Update record
        record.new_path = new_path
        record.new_filename = os.path.basename(new_path)
        record.file_path = new_path
        record.filename = record.new_filename
        self.db.upsert_file(record)

        # Apply metadata to all backends
        self.metadata_mgr.apply_all(record)

        # Log the move
        self.db.log_move(move)

        logger.info("Moved: %s -> %s", move.old_path, move.new_path)
        return move

    def _move_to_review(self, record: FileRecord) -> MoveRecord | None:
        """Move a file to the review/quarantine folder."""
        review_dir = os.path.normpath(self.config.review_dir)
        new_path = os.path.join(review_dir, record.filename)
        new_path = self._resolve_collision(new_path)

        move = MoveRecord(
            file_record_id=record.id,
            old_path=record.file_path,
            new_path=new_path,
            old_filename=record.filename,
            new_filename=os.path.basename(new_path),
            moved_at=datetime.now().isoformat(),
        )

        if self.dry_run:
            return move

        os.makedirs(review_dir, exist_ok=True)
        shutil.move(record.file_path, new_path)

        record.file_path = new_path
        self.db.upsert_file(record)
        self.db.log_move(move)

        return move

    def _build_destination_path(self, record: FileRecord) -> str:
        """Build the destination folder path based on classification."""
        base = self.config.organized_base
        parts: list[str] = []

        # Top level: Business or Personal
        if record.confidentiality == "personal-private" or record.category == "Personal":
            parts.append("Personal")
            if record.subcategory:
                parts.append(self._safe_name(record.subcategory))
        else:
            parts.append("Business")

            # Company/entity level
            entity = self._pick_primary_entity(record)
            if entity:
                parts.append(self._safe_name(entity))
            else:
                parts.append("_Other-Business")

            # Document type level
            doc_folder = self._doc_type_to_folder(record.document_type)
            if doc_folder:
                parts.append(doc_folder)

        return os.path.normpath(os.path.join(base, *parts))

    def _pick_primary_entity(self, record: FileRecord) -> str:
        """Pick the primary entity (company) for folder placement."""
        # Check entities list for a known brand
        for entity in record.entities:
            for brand in self.config.brands:
                if brand.lower() == entity.lower():
                    return brand
            # Partial match
            for brand in self.config.brands:
                if brand.lower() in entity.lower() or entity.lower() in brand.lower():
                    return brand

        # Check tags
        for tag in record.tags:
            for brand in self.config.brands:
                if brand.lower().replace(" ", "-") == tag.lower():
                    return brand

        return ""

    def _doc_type_to_folder(self, doc_type: str) -> str:
        """Map a document type to its folder name."""
        mapping: dict[str, str] = {
            "Invoice": "Invoices",
            "Receipt": "Receipts",
            "Statement": "Financial",
            "Contract": "Contracts",
            "Lease": "Leases",
            "Tax-Form": "Tax",
            "Tax-Return": "Tax",
            "W2": "Tax",
            "1099": "Tax",
            "K1": "Tax",
            "Insurance": "Insurance",
            "Legal": "Legal",
            "Report": "Reports",
            "Proposal": "Reports",
            "Letter": "Correspondence",
            "Memo": "Correspondence",
            "Email": "Correspondence",
            "Correspondence": "Correspondence",
            "Financial": "Financial",
            "Financial-Model": "Financial",
            "Pro-Forma": "Financial",
            "Budget": "Financial",
            "Bank-Statement": "Financial",
            "Investment": "Financial",
            "Amendment": "Leases",
            "Addendum": "Leases",
            "Appraisal": "Due-Diligence",
            "Inspection-Report": "Due-Diligence",
            "Environmental-Report": "Due-Diligence",
            "Survey": "Due-Diligence",
            "Due-Diligence": "Due-Diligence",
            "Title-Report": "Closing",
            "Closing-Document": "Closing",
            "Loan-Document": "Loan",
            "Operating-Agreement": "Legal",
            "Partnership-Agreement": "Legal",
            "Rent-Roll": "Property-Ops",
            "Tenant-Ledger": "Property-Ops",
            "CAM-Reconciliation": "Property-Ops",
            "Photo": "Photos",
            "Presentation": "Reports",
            "Spreadsheet": "Financial",
            "Notes": "Correspondence",
            "License": "Legal",
            "Permit": "Property-Ops",
            "Certificate": "Property-Ops",
        }
        return mapping.get(doc_type, "")

    def _build_filename(self, record: FileRecord) -> str:
        """
        Build filename using convention: MMDDYYYY_Company_DocumentType.ext
        """
        sep = self.config.naming_separator
        wsep = self.config.naming_word_separator

        # Date portion
        date_str = self._extract_date_for_name(record)

        # Company portion
        entity = self._pick_primary_entity(record)
        company_part = self._safe_name(entity) if entity else "unknown"

        # Document type portion
        doc_type_part = self._safe_name(record.document_type) if record.document_type else "file"

        # Extension
        ext = f".{record.extension}" if record.extension else ""

        # Build filename
        parts = [date_str, company_part, doc_type_part]
        filename = sep.join(parts) + ext

        if self.config.naming_lowercase:
            filename = filename.lower()

        return filename

    def _extract_date_for_name(self, record: FileRecord) -> str:
        """Extract the best date for the filename."""
        # Prefer date_relevance
        for date_str in (record.date_relevance, record.modified_at, record.created_at):
            if date_str:
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    return dt.strftime(self.config.naming_date_format)
                except (ValueError, TypeError):
                    pass
        return datetime.now().strftime(self.config.naming_date_format)

    def _safe_name(self, name: str) -> str:
        """Convert to a safe filename segment."""
        wsep = self.config.naming_word_separator
        # Remove Windows-unsafe characters
        safe = re.sub(r'[\\/:*?"<>|]', "", name)
        # Replace spaces with word separator
        safe = safe.replace(" ", wsep)
        # Remove consecutive separators
        safe = re.sub(rf"[{re.escape(wsep)}]+", wsep, safe)
        # Strip leading/trailing separators
        safe = safe.strip(wsep + ". ")
        return safe

    def _resolve_collision(self, path: str) -> str:
        """If the destination already exists, add a numeric suffix."""
        if not os.path.exists(path):
            return path
        base, ext = os.path.splitext(path)
        counter = 1
        while os.path.exists(f"{base}_{counter}{ext}"):
            counter += 1
        return f"{base}_{counter}{ext}"

    # ------------------------------------------------------------------ #
    # Manifest / Log
    # ------------------------------------------------------------------ #

    def export_manifest_csv(self, output_path: str) -> None:
        """Export the move log as a CSV manifest."""
        moves = self.db.get_moves(limit=100000)
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "move_id", "old_path", "new_path", "old_filename", "new_filename",
                "moved_at", "reverted",
            ])
            for m in moves:
                writer.writerow([
                    m.id, m.old_path, m.new_path, m.old_filename, m.new_filename,
                    m.moved_at, m.reverted,
                ])
        logger.info("Manifest exported to %s (%d entries)", output_path, len(moves))

    # ------------------------------------------------------------------ #
    # Undo / Rollback
    # ------------------------------------------------------------------ #

    def undo_last(self, count: int = 1) -> list[MoveRecord]:
        """Undo the last N moves."""
        moves = self.db.get_moves(limit=count)
        undone: list[MoveRecord] = []
        for move in moves:
            if move.reverted:
                continue
            try:
                if os.path.exists(move.new_path):
                    os.makedirs(os.path.dirname(move.old_path), exist_ok=True)
                    shutil.move(move.new_path, move.old_path)
                    self.db.revert_move(move.id or 0)

                    # Update file record
                    record = self.db.get_file(move.new_path)
                    if record:
                        record.file_path = move.old_path
                        record.filename = move.old_filename
                        self.db.upsert_file(record)

                    undone.append(move)
                    logger.info("Undone: %s -> %s", move.new_path, move.old_path)
            except Exception as e:
                logger.error("Failed to undo move %d: %s", move.id or 0, e)
        return undone
