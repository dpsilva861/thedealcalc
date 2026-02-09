#!/usr/bin/env python3
"""
Autorun daemon for the File Organization Agent.

Runs silently in the background on Windows login. Organizes all directories
listed in the config, logs results, and optionally sends a Windows toast
notification when finished.

Usage:
    python autorun.py                       # Run once using default config
    python autorun.py --watch               # Stay running, re-organize every interval
    python autorun.py --config path.json    # Use a custom config file
    python autorun.py --interval 30         # Watch mode: check every 30 minutes
"""

import sys
import time
import logging
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))

from scanner import scan_directory
from organizer import plan_organization, execute_plan
from rollback import save_log
from user_config import load_config

# ---------------------------------------------------------------------------
# Logging — writes to a file next to this script so you can review history
# ---------------------------------------------------------------------------
LOG_FILE = Path(__file__).parent / "autorun.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger("file-organizer-autorun")


# ---------------------------------------------------------------------------
# Windows toast notification (best-effort, no dependencies required)
# ---------------------------------------------------------------------------
def _notify_windows(title: str, message: str) -> None:
    """Send a Windows 10/11 toast notification. Fails silently."""
    try:
        from ctypes import windll
        # Use PowerShell to show a toast — works on any Windows 10/11
        import subprocess
        ps_script = f"""
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null

        $template = @"
        <toast>
            <visual>
                <binding template="ToastGeneric">
                    <text>{title}</text>
                    <text>{message}</text>
                </binding>
            </visual>
        </toast>
"@
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("File Organizer").Show($toast)
        """
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_script],
            capture_output=True,
            timeout=10,
        )
    except Exception:
        pass  # Notifications are optional — never crash over them


def notify(title: str, message: str) -> None:
    """Send a notification on supported platforms."""
    if sys.platform == "win32":
        _notify_windows(title, message)
    log.info(f"[notification] {title}: {message}")


# ---------------------------------------------------------------------------
# Core: organize a single directory
# ---------------------------------------------------------------------------
def organize_directory(target: Path, config: dict) -> dict:
    """
    Organize one directory according to config.

    Returns a summary dict with counts.
    """
    log.info(f"Organizing: {target}")

    if not target.is_dir():
        log.warning(f"Skipping (not a directory): {target}")
        return {"directory": str(target), "status": "skipped", "reason": "not a directory"}

    scan_result = scan_directory(
        root=target,
        categories=config["categories"],
        recursive=config.get("recursive", True),
        skip_dirs=set(config.get("skip_directories", [])),
        skip_files=set(config.get("skip_files", [])),
    )

    if not scan_result.files:
        log.info(f"  No files found in {target}")
        return {"directory": str(target), "status": "empty", "files": 0}

    organize_into_folders = config.get("organize_into_folders", True)

    plan = plan_organization(
        files=scan_result.files,
        target_root=target,
        rename_rules=config.get("naming_rules"),
        organize_into_folders=organize_into_folders,
    )

    if plan.total_actions == 0:
        log.info(f"  Already organized: {target}")
        return {"directory": str(target), "status": "already_organized", "files": len(scan_result.files)}

    # Execute (no confirmation in autorun — that's the point)
    exec_result = execute_plan(plan, dry_run=False)

    # Save the change log
    log_path = save_log(target, exec_result.log_entries, dry_run=False)

    log.info(f"  Renames: {exec_result.renames_done}, Moves: {exec_result.moves_done}, Errors: {len(exec_result.errors)}")
    log.info(f"  Log saved: {log_path}")

    for path, err in exec_result.errors:
        log.error(f"  Error: {path}: {err}")

    return {
        "directory": str(target),
        "status": "organized",
        "renames": exec_result.renames_done,
        "moves": exec_result.moves_done,
        "errors": len(exec_result.errors),
        "log": str(log_path),
    }


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
def run_once(config: dict) -> list[dict]:
    """Organize all configured directories once."""
    directories = config.get("watch_directories", [])

    if not directories:
        log.warning("No watch_directories configured. Nothing to do.")
        log.warning("Add watch_directories to your organizer-config.json, e.g.:")
        log.warning('  "watch_directories": ["C:\\\\Users\\\\dpsil\\\\Downloads", "C:\\\\Users\\\\dpsil\\\\Desktop"]')
        return []

    results = []
    for dir_path in directories:
        target = Path(dir_path).resolve()
        result = organize_directory(target, config)
        results.append(result)

    return results


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="File Organizer Autorun Daemon")
    parser.add_argument("--config", "-c", help="Path to organizer-config.json")
    parser.add_argument("--watch", "-w", action="store_true", help="Stay running and re-organize periodically")
    parser.add_argument("--interval", "-i", type=int, default=60, help="Minutes between checks in watch mode (default: 60)")
    parser.add_argument("--notify", action="store_true", default=True, help="Send Windows toast notifications (default: on)")
    parser.add_argument("--no-notify", action="store_true", help="Disable notifications")
    args = parser.parse_args()

    config_path = Path(args.config) if args.config else None
    config = load_config(config_path)
    send_notifications = args.notify and not args.no_notify

    log.info("=" * 50)
    log.info("File Organizer Autorun started")
    log.info(f"  Watch mode: {args.watch}")
    log.info(f"  Interval: {args.interval} minutes")
    log.info(f"  Directories: {config.get('watch_directories', [])}")
    log.info("=" * 50)

    if not args.watch:
        # Run once and exit
        results = run_once(config)
        total_actions = sum(r.get("renames", 0) + r.get("moves", 0) for r in results)
        total_errors = sum(r.get("errors", 0) for r in results)

        if total_actions > 0 and send_notifications:
            notify(
                "File Organizer",
                f"Organized {total_actions} files across {len(results)} directories."
                + (f" ({total_errors} errors)" if total_errors else ""),
            )
        log.info("Autorun complete (single run).")
        return

    # Watch mode: loop forever
    while True:
        try:
            results = run_once(config)
            total_actions = sum(r.get("renames", 0) + r.get("moves", 0) for r in results)
            total_errors = sum(r.get("errors", 0) for r in results)

            if total_actions > 0 and send_notifications:
                notify(
                    "File Organizer",
                    f"Organized {total_actions} files."
                    + (f" ({total_errors} errors)" if total_errors else ""),
                )

            log.info(f"Sleeping {args.interval} minutes until next check...")
            time.sleep(args.interval * 60)

            # Reload config each cycle so you can change settings without restarting
            config = load_config(config_path)

        except KeyboardInterrupt:
            log.info("Autorun stopped by user.")
            break
        except Exception as exc:
            log.exception(f"Unexpected error: {exc}")
            time.sleep(60)  # Back off on errors


if __name__ == "__main__":
    main()
