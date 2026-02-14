"""
Windows Service — runs the file agent as a background service.

Can be installed as a Windows service via pywin32 or NSSM.
Starts on boot and runs continuously.
"""

from __future__ import annotations

import logging
import os
import sys
import threading
import time
from datetime import datetime

import schedule

from ..config import Config
from ..database import Database
from .watcher import FileWatcher

logger = logging.getLogger(__name__)

# Try to import pywin32 service infrastructure
try:
    import servicemanager
    import win32event
    import win32service
    import win32serviceutil
    _HAS_PYWIN32 = True
except ImportError:
    _HAS_PYWIN32 = False


class AgentDaemon:
    """
    Platform-independent agent daemon.

    On Windows with pywin32: runs as a Windows service.
    Otherwise: runs as a foreground process (useful for dev/testing).
    """

    def __init__(self, config: Config | None = None) -> None:
        self.config = config or Config.load()
        self.db = Database(self.config.db_path)
        self.watcher: FileWatcher | None = None
        self._stop_event = threading.Event()
        self._files_processed_today = 0
        self._files_awaiting_review = 0

    def start(self) -> None:
        """Start the agent."""
        logger.info("File Organizer Agent starting...")

        # Initialize watcher
        self.watcher = FileWatcher(
            self.config,
            self.db,
            on_file_processed=self._on_file_processed,
        )
        self.watcher.start()

        # Schedule periodic rescan
        schedule.every(self.config.agent_rescan_interval_days).days.do(
            self._run_rescan
        )

        # Schedule daily metrics logging
        schedule.every().day.at("23:59").do(self._log_daily_metrics)

        logger.info("Agent started — watching %d directories", len(self.config.watch_dirs))

        # Run scheduler loop
        while not self._stop_event.is_set():
            schedule.run_pending()
            time.sleep(1)

    def stop(self) -> None:
        """Stop the agent gracefully."""
        logger.info("Agent stopping...")
        self._stop_event.set()
        if self.watcher:
            self.watcher.stop()
        self.db.close()
        logger.info("Agent stopped")

    def _on_file_processed(self, record) -> None:
        """Callback when a file is processed."""
        self._files_processed_today += 1
        self._files_awaiting_review = len(self.db.get_files_needing_review())

    def _run_rescan(self) -> None:
        """Run periodic rescan."""
        if self.watcher:
            try:
                self.watcher.run_rescan()
            except Exception as e:
                logger.error("Rescan failed: %s", e)

    def _log_daily_metrics(self) -> None:
        """Log daily agent metrics."""
        corrections = self.db.get_recent_corrections(limit=100)
        today = datetime.now().strftime("%Y-%m-%d")
        today_corrections = sum(
            1 for c in corrections
            if c.corrected_at and c.corrected_at.startswith(today)
        )
        correct = max(0, self._files_processed_today - today_corrections)
        self.db.log_agent_metrics(
            self._files_processed_today, correct, today_corrections
        )
        self._files_processed_today = 0

    @property
    def status(self) -> dict:
        return {
            "running": not self._stop_event.is_set(),
            "files_processed_today": self._files_processed_today,
            "files_awaiting_review": self._files_awaiting_review,
            "watch_dirs": self.config.watch_dirs,
        }


if _HAS_PYWIN32:
    class FileOrganizerService(win32serviceutil.ServiceFramework):
        """Windows Service wrapper for the file organizer agent."""

        _svc_name_ = "FileOrganizerAgent"
        _svc_display_name_ = "File Organizer Agent"
        _svc_description_ = (
            "Intelligent file organization agent that monitors directories "
            "and automatically classifies, tags, and organizes files."
        )

        def __init__(self, args):
            win32serviceutil.ServiceFramework.__init__(self, args)
            self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
            self.daemon = AgentDaemon()

        def SvcStop(self):
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            self.daemon.stop()
            win32event.SetEvent(self.hWaitStop)

        def SvcDoRun(self):
            servicemanager.LogMsg(
                servicemanager.EVENTLOG_INFORMATION_TYPE,
                servicemanager.PYS_SERVICE_STARTED,
                (self._svc_name_, ""),
            )
            try:
                self.daemon.start()
            except Exception as e:
                servicemanager.LogErrorMsg(f"Service error: {e}")

    def install_service():
        """Install the Windows service."""
        if not _HAS_PYWIN32:
            print("pywin32 is required to install as a Windows service.")
            print("Install it with: pip install pywin32")
            return
        win32serviceutil.HandleCommandLine(FileOrganizerService)

    def uninstall_service():
        """Uninstall the Windows service."""
        if _HAS_PYWIN32:
            win32serviceutil.RemoveService(FileOrganizerService._svc_name_)

else:
    def install_service():
        print("pywin32 is required for Windows service installation.")
        print("Run: pip install pywin32")

    def uninstall_service():
        print("pywin32 is required for Windows service management.")


def run_foreground(config: Config | None = None) -> None:
    """Run the agent in the foreground (for development/testing)."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    daemon = AgentDaemon(config)
    try:
        daemon.start()
    except KeyboardInterrupt:
        daemon.stop()
