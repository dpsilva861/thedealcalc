"""
Rollback system — logs every change and can undo operations.
Change logs are stored as JSON files with timestamps.
"""

import json
import shutil
from pathlib import Path
from datetime import datetime, timezone


LOG_DIR_NAME = ".file-organizer-logs"


def get_log_dir(root: Path) -> Path:
    """Get (and create) the log directory inside the target root."""
    log_dir = root / LOG_DIR_NAME
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def save_log(root: Path, log_entries: list[dict], dry_run: bool = False) -> Path:
    """
    Save a change log to disk.

    Args:
        root: The root directory being organized.
        log_entries: List of action dicts from ExecutionResult.
        dry_run: If True, mark the log as a dry-run preview.

    Returns:
        Path to the saved log file.
    """
    log_dir = get_log_dir(root)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    suffix = "-dry-run" if dry_run else ""
    log_file = log_dir / f"changes-{timestamp}{suffix}.json"

    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dry_run": dry_run,
        "actions_count": len(log_entries),
        "actions": log_entries,
    }

    log_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return log_file


def list_logs(root: Path) -> list[Path]:
    """List all change log files, most recent first."""
    log_dir = get_log_dir(root)
    logs = sorted(log_dir.glob("changes-*.json"), reverse=True)
    return logs


def load_log(log_path: Path) -> dict:
    """Load and parse a change log file."""
    return json.loads(log_path.read_text(encoding="utf-8"))


def rollback(log_path: Path) -> dict:
    """
    Undo all changes recorded in a log file by reversing every action.

    Processes actions in reverse order:
    - Moves are reversed (destination -> original location)
    - Renames are reversed (new_path -> original path)

    Args:
        log_path: Path to the change log file.

    Returns:
        Summary dict with counts and any errors.
    """
    data = load_log(log_path)

    if data.get("dry_run"):
        return {
            "status": "skipped",
            "reason": "This is a dry-run log — no real changes were made.",
        }

    actions = data.get("actions", [])
    reversed_count = 0
    errors = []

    # Reverse in opposite order to undo correctly
    for action in reversed(actions):
        action_type = action.get("type")
        src = action.get("to")    # current location
        dst = action.get("from")  # original location

        if not src or not dst:
            errors.append({"action": action, "error": "Missing from/to paths"})
            continue

        src_path = Path(src)
        dst_path = Path(dst)

        try:
            if action_type == "rename":
                if src_path.exists():
                    src_path.rename(dst_path)
                    reversed_count += 1
                else:
                    errors.append({"action": action, "error": f"File not found: {src}"})

            elif action_type == "move":
                if src_path.exists():
                    # Ensure the original parent directory exists
                    dst_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(src_path), str(dst_path))
                    reversed_count += 1
                else:
                    errors.append({"action": action, "error": f"File not found: {src}"})

        except PermissionError:
            errors.append({"action": action, "error": "Permission denied"})
        except OSError as exc:
            errors.append({"action": action, "error": str(exc)})

    # Clean up empty category directories left behind
    _cleanup_empty_dirs(actions)

    return {
        "status": "completed",
        "reversed": reversed_count,
        "errors": len(errors),
        "error_details": errors if errors else None,
    }


def _cleanup_empty_dirs(actions: list[dict]) -> None:
    """Remove empty directories that were created during organization."""
    dirs_to_check = set()
    for action in actions:
        if action.get("type") == "move":
            dest = Path(action["to"])
            dirs_to_check.add(dest.parent)

    for d in dirs_to_check:
        try:
            if d.exists() and d.is_dir() and not any(d.iterdir()):
                d.rmdir()
        except OSError:
            pass  # Directory not empty or permission issue — skip
