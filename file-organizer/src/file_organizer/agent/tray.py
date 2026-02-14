"""
System Tray Icon — shows agent status using pystray.

Displays:
- Agent status (running/paused)
- Files processed today
- Files awaiting review
- Quick toggle to pause/resume
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Any

from ..config import Config
from ..database import Database
from .service import AgentDaemon

logger = logging.getLogger(__name__)

try:
    import pystray
    from PIL import Image, ImageDraw, ImageFont
    _HAS_PYSTRAY = True
except ImportError:
    _HAS_PYSTRAY = False


def _create_icon_image(color: str = "green") -> Any:
    """Create a simple status icon."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return None

    size = 64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background circle
    colors = {
        "green": (76, 175, 80, 255),    # Running
        "yellow": (255, 193, 7, 255),   # Paused
        "red": (244, 67, 54, 255),      # Error
        "gray": (158, 158, 158, 255),   # Stopped
    }
    fill_color = colors.get(color, colors["gray"])
    draw.ellipse([4, 4, size - 4, size - 4], fill=fill_color)

    # "FO" text
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except (OSError, IOError):
        font = ImageFont.load_default()
    draw.text((size // 2, size // 2), "FO", fill="white", anchor="mm", font=font)

    return img


class TrayApp:
    """System tray application for the file organizer agent."""

    def __init__(self, config: Config | None = None) -> None:
        if not _HAS_PYSTRAY:
            raise ImportError(
                "pystray and Pillow are required for the system tray icon. "
                "Install them with: pip install pystray Pillow"
            )

        self.config = config or Config.load()
        self.db = Database(self.config.db_path)
        self.daemon = AgentDaemon(self.config)
        self._daemon_thread: threading.Thread | None = None
        self._paused = False
        self.icon: Any = None

    def run(self) -> None:
        """Start the tray icon and agent."""
        # Start agent in background thread
        self._daemon_thread = threading.Thread(target=self._start_daemon, daemon=True)
        self._daemon_thread.start()

        # Create tray icon
        self.icon = pystray.Icon(
            "FileOrganizer",
            _create_icon_image("green"),
            "File Organizer Agent",
            menu=self._build_menu(),
        )
        self.icon.run()

    def _build_menu(self) -> Any:
        """Build the system tray context menu."""
        status = self.daemon.status

        return pystray.Menu(
            pystray.MenuItem(
                lambda _: f"Status: {'Running' if not self._paused else 'Paused'}",
                None,
                enabled=False,
            ),
            pystray.MenuItem(
                lambda _: f"Files today: {status['files_processed_today']}",
                None,
                enabled=False,
            ),
            pystray.MenuItem(
                lambda _: f"Awaiting review: {status['files_awaiting_review']}",
                None,
                enabled=False,
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                lambda _: "Resume" if self._paused else "Pause",
                self._toggle_pause,
            ),
            pystray.MenuItem("Open Dashboard", self._open_dashboard),
            pystray.MenuItem("Open Review Queue", self._open_review),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", self._quit),
        )

    def _start_daemon(self) -> None:
        """Start the agent daemon in a background thread."""
        try:
            self.daemon.start()
        except Exception as e:
            logger.error("Agent daemon error: %s", e)
            if self.icon:
                self.icon.icon = _create_icon_image("red")

    def _toggle_pause(self, icon: Any = None, item: Any = None) -> None:
        """Toggle pause/resume."""
        if self._paused:
            # Resume
            self._paused = False
            self._daemon_thread = threading.Thread(target=self._start_daemon, daemon=True)
            self._daemon_thread.start()
            if self.icon:
                self.icon.icon = _create_icon_image("green")
            logger.info("Agent resumed")
        else:
            # Pause
            self._paused = True
            self.daemon.stop()
            if self.icon:
                self.icon.icon = _create_icon_image("yellow")
            logger.info("Agent paused")

    def _open_dashboard(self, icon: Any = None, item: Any = None) -> None:
        """Open the web dashboard in the default browser."""
        import webbrowser
        url = f"http://{self.config.dashboard_host}:{self.config.dashboard_port}"
        webbrowser.open(url)

    def _open_review(self, icon: Any = None, item: Any = None) -> None:
        """Open the review queue folder."""
        review_dir = self.config.review_dir
        if os.path.exists(review_dir):
            os.startfile(review_dir)  # type: ignore[attr-defined]

    def _quit(self, icon: Any = None, item: Any = None) -> None:
        """Quit the application."""
        self.daemon.stop()
        if self.icon:
            self.icon.stop()


def run_tray(config: Config | None = None) -> None:
    """Launch the system tray application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    app = TrayApp(config)
    app.run()
