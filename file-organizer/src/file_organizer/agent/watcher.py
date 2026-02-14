"""
File System Watcher — monitors directories for new/modified files.

Uses watchdog to detect changes and routes files through the
classification pipeline.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from watchdog.events import FileSystemEvent, FileSystemEventHandler
from watchdog.observers import Observer

from ..config import Config
from ..content_reader import ContentReader
from ..database import Database
from ..metadata import MetadataManager
from ..models import FileRecord
from ..organizer import Organizer
from ..scanner import Scanner
from .classifier import Classifier

logger = logging.getLogger(__name__)


class FileEventHandler(FileSystemEventHandler):
    """Handles file system events from watchdog."""

    def __init__(
        self,
        config: Config,
        db: Database,
        classifier: Classifier,
        organizer: Organizer,
        metadata_mgr: MetadataManager,
        scanner: Scanner,
        on_file_processed: Callable[[FileRecord], None] | None = None,
    ) -> None:
        super().__init__()
        self.config = config
        self.db = db
        self.classifier = classifier
        self.organizer = organizer
        self.metadata_mgr = metadata_mgr
        self.scanner = scanner
        self.on_file_processed = on_file_processed
        self._exclude_exts = {e.lower() for e in config.exclude_extensions}
        self._recent_events: dict[str, float] = {}  # debounce
        self._debounce_seconds = 2.0

    def on_created(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        self._handle_file(event.src_path)

    def on_modified(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        self._handle_file(event.src_path)

    def on_moved(self, event: FileSystemEvent) -> None:
        if event.is_directory:
            return
        # Track the new location
        if hasattr(event, "dest_path"):
            self._handle_file(event.dest_path)

    def _handle_file(self, file_path: str) -> None:
        """Process a new or modified file."""
        # Debounce — skip if we just processed this file
        now = time.time()
        if file_path in self._recent_events:
            if now - self._recent_events[file_path] < self._debounce_seconds:
                return
        self._recent_events[file_path] = now

        # Skip excluded extensions
        ext = Path(file_path).suffix.lower()
        if ext in self._exclude_exts:
            return

        # Skip system files
        filename = os.path.basename(file_path)
        if filename.startswith(".") or filename == ".file_organizer.json":
            return

        # Skip files still being written (wait for stable size)
        if not self._wait_for_stable(file_path):
            return

        logger.info("Processing new file: %s", file_path)

        try:
            # Step 1: Scan the file
            record = self.scanner.scan_single(file_path)

            # Step 2: Classify
            classification = self.classifier.classify(record)

            # Step 3: Apply metadata
            self.metadata_mgr.apply_all(record)

            # Step 4: Organize (move to destination)
            if not record.needs_review:
                moves = self.organizer.organize(records=[record])
                if moves:
                    logger.info(
                        "Agent moved %s -> %s",
                        moves[0].old_path,
                        moves[0].new_path,
                    )

            # Callback
            if self.on_file_processed:
                self.on_file_processed(record)

        except Exception as e:
            logger.error("Agent failed to process %s: %s", file_path, e)

    def _wait_for_stable(self, file_path: str, timeout: int = 10) -> bool:
        """Wait for a file to stop being written to."""
        try:
            prev_size = -1
            for _ in range(timeout):
                if not os.path.exists(file_path):
                    return False
                current_size = os.path.getsize(file_path)
                if current_size == prev_size and current_size > 0:
                    return True
                prev_size = current_size
                time.sleep(1)
            return os.path.exists(file_path)
        except (OSError, PermissionError):
            return False


class FileWatcher:
    """Manages the watchdog observer across multiple directories."""

    def __init__(
        self,
        config: Config,
        db: Database,
        on_file_processed: Callable[[FileRecord], None] | None = None,
    ) -> None:
        self.config = config
        self.db = db
        self.on_file_processed = on_file_processed
        self.observer = Observer()
        self._running = False

        # Initialize components
        self.reader = ContentReader(
            tika_server_url=config.tika_server_url,
            max_size=config.max_file_size_bytes,
        )
        self.scanner = Scanner(config, db, self.reader)
        self.classifier = Classifier(config, db)
        self.organizer = Organizer(config, db)
        self.metadata_mgr = MetadataManager()

        self.handler = FileEventHandler(
            config=config,
            db=db,
            classifier=self.classifier,
            organizer=self.organizer,
            metadata_mgr=self.metadata_mgr,
            scanner=self.scanner,
            on_file_processed=on_file_processed,
        )

    def start(self) -> None:
        """Start watching all configured directories."""
        for directory in self.config.watch_dirs:
            if os.path.isdir(directory):
                self.observer.schedule(self.handler, directory, recursive=True)
                logger.info("Watching: %s", directory)
            else:
                logger.warning("Watch directory not found: %s", directory)

        self.observer.start()
        self._running = True
        logger.info("File watcher started")

    def stop(self) -> None:
        """Stop watching."""
        self.observer.stop()
        self.observer.join()
        self._running = False
        logger.info("File watcher stopped")

    @property
    def is_running(self) -> bool:
        return self._running

    def run_rescan(self) -> None:
        """Periodic rescan of existing files for reclassification."""
        logger.info("Starting periodic rescan...")
        all_files = self.db.get_all_files()
        reclassified = 0
        for record in all_files:
            if not os.path.exists(record.file_path):
                # File was deleted — remove from DB
                self.db.delete_file(record.file_path)
                continue
            # Re-scan and reclassify
            updated = self.scanner.rescan_file(record.file_path)
            if updated:
                self.classifier.classify(updated)
                reclassified += 1
        logger.info("Rescan complete: %d files reclassified", reclassified)
