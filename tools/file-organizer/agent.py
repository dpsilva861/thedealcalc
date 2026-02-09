#!/usr/bin/env python3
"""
File Organization Agent for Windows
====================================
Scans directories, renames files to consistent naming conventions,
and organizes them into categorized folders.

Usage:
    python agent.py scan <directory>
    python agent.py organize <directory> [--dry-run] [--rename-only] [--no-recurse]
    python agent.py undo <directory> [--log <logfile>]
    python agent.py logs <directory>
    python agent.py init-config [--output <path>]

Safety:
    - Always runs a dry-run preview first and asks for confirmation
    - Every operation is logged so it can be reversed with `undo`
    - System files (desktop.ini, thumbs.db, etc.) are never touched
    - Protected directories (.git, node_modules, etc.) are skipped
"""

import argparse
import sys
import os
from pathlib import Path

# Ensure the script's directory is on the path so modules can import each other
sys.path.insert(0, str(Path(__file__).parent))

from scanner import scan_directory
from renamer import plan_renames
from organizer import plan_organization, execute_plan
from rollback import save_log, list_logs, load_log, rollback
from user_config import load_config, save_default_config


def enable_windows_long_paths() -> None:
    """Enable long path support on Windows (paths > 260 chars)."""
    if sys.platform == "win32":
        try:
            import ctypes
            ntdll = ctypes.windll.ntdll
            if hasattr(ntdll, "RtlAreLongPathsEnabled"):
                if not ntdll.RtlAreLongPathsEnabled():
                    print("Note: Windows long paths are not enabled in your system registry.")
                    print("  Some deeply nested files may fail. To enable, run as admin:")
                    print("  reg add HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1")
        except Exception:
            pass


def cmd_scan(args: argparse.Namespace) -> None:
    """Scan a directory and print a summary of found files."""
    target = Path(args.directory).resolve()
    config = load_config(Path(args.config) if args.config else None)

    print(f"Scanning: {target}")
    print()

    result = scan_directory(
        root=target,
        categories=config["categories"],
        recursive=config["recursive"] if not args.no_recurse else False,
        skip_dirs=set(config["skip_directories"]),
        skip_files=set(config["skip_files"]),
    )

    print(result.summary())

    if result.errors:
        print(f"\nErrors encountered:")
        for path, err in result.errors[:20]:
            print(f"  {path}: {err}")
        if len(result.errors) > 20:
            print(f"  ... and {len(result.errors) - 20} more")


def cmd_organize(args: argparse.Namespace) -> None:
    """Organize files: rename + move into category folders."""
    target = Path(args.directory).resolve()
    config = load_config(Path(args.config) if args.config else None)

    organize_into_folders = not args.rename_only
    if "organize_into_folders" in config and not args.rename_only:
        organize_into_folders = config["organize_into_folders"]

    print(f"Scanning: {target}")
    scan_result = scan_directory(
        root=target,
        categories=config["categories"],
        recursive=config["recursive"] if not args.no_recurse else False,
        skip_dirs=set(config["skip_directories"]),
        skip_files=set(config["skip_files"]),
    )

    print(f"Found {len(scan_result.files)} files across {len(scan_result.by_category)} categories")
    print()

    if not scan_result.files:
        print("No files to organize.")
        return

    # Build the plan
    if organize_into_folders:
        plan = plan_organization(
            files=scan_result.files,
            target_root=target,
            rename_rules=config["naming_rules"],
            organize_into_folders=True,
        )
    else:
        # Rename-only mode: build rename plan without moving
        plan = plan_organization(
            files=scan_result.files,
            target_root=target,
            rename_rules=config["naming_rules"],
            organize_into_folders=False,
        )

    if plan.total_actions == 0:
        print("All files are already organized and properly named.")
        return

    # Show preview
    print("=" * 60)
    print("PLAN PREVIEW")
    print("=" * 60)
    print(plan.preview(max_lines=30))
    print()
    print(f"Total actions: {plan.total_actions}")
    print()

    if args.dry_run:
        print("[DRY RUN] No files were modified.")
        # Save dry-run log for reference
        exec_result = execute_plan(plan, dry_run=True)
        log_path = save_log(target, exec_result.log_entries, dry_run=True)
        print(f"Dry-run log saved to: {log_path}")
        return

    # Ask for confirmation
    if not args.yes:
        response = input("Proceed with these changes? [y/N] ").strip().lower()
        if response not in ("y", "yes"):
            print("Aborted.")
            return

    # Execute
    print("Executing...")
    exec_result = execute_plan(plan, dry_run=False)

    # Save the change log
    log_path = save_log(target, exec_result.log_entries, dry_run=False)

    print()
    print(exec_result.summary())
    print(f"\nChange log saved to: {log_path}")
    print(f"To undo: python agent.py undo \"{target}\" --log \"{log_path}\"")


def cmd_undo(args: argparse.Namespace) -> None:
    """Undo changes from a previous run."""
    target = Path(args.directory).resolve()

    if args.log:
        log_path = Path(args.log)
    else:
        # Find the most recent non-dry-run log
        logs = list_logs(target)
        real_logs = [l for l in logs if "dry-run" not in l.name]
        if not real_logs:
            print("No change logs found. Nothing to undo.")
            return
        log_path = real_logs[0]

    if not log_path.exists():
        print(f"Log file not found: {log_path}")
        return

    data = load_log(log_path)
    actions = data.get("actions", [])
    print(f"Log file: {log_path.name}")
    print(f"Timestamp: {data.get('timestamp', 'unknown')}")
    print(f"Actions to reverse: {len(actions)}")

    if data.get("dry_run"):
        print("\nThis is a dry-run log — no real changes were made. Nothing to undo.")
        return

    if not args.yes:
        response = input("\nReverse all these changes? [y/N] ").strip().lower()
        if response not in ("y", "yes"):
            print("Aborted.")
            return

    print("Reversing changes...")
    result = rollback(log_path)

    if result.get("status") == "skipped":
        print(result["reason"])
    else:
        print(f"Reversed: {result.get('reversed', 0)} actions")
        if result.get("errors"):
            print(f"Errors: {result['errors']}")
            for err in (result.get("error_details") or []):
                print(f"  {err}")


def cmd_logs(args: argparse.Namespace) -> None:
    """List all change logs for a directory."""
    target = Path(args.directory).resolve()
    logs = list_logs(target)

    if not logs:
        print("No change logs found.")
        return

    print(f"Change logs for: {target}")
    print()
    for log_path in logs:
        data = load_log(log_path)
        marker = " [DRY RUN]" if data.get("dry_run") else ""
        print(f"  {log_path.name}{marker}")
        print(f"    Time: {data.get('timestamp', 'unknown')}")
        print(f"    Actions: {data.get('actions_count', '?')}")
        print()


def cmd_init_config(args: argparse.Namespace) -> None:
    """Generate a default config file for customization."""
    output = Path(args.output) if args.output else None
    path = save_default_config(output)
    print(f"Default config written to: {path}")
    print("Edit this file to customize categories, naming rules, and skip lists.")


def main() -> None:
    enable_windows_long_paths()

    parser = argparse.ArgumentParser(
        prog="file-organizer",
        description="File Organization Agent — rename, categorize, and organize files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--config", "-c",
        help="Path to organizer-config.json (default: looks in current directory)",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # scan
    p_scan = subparsers.add_parser("scan", help="Scan and summarize files in a directory")
    p_scan.add_argument("directory", help="Directory to scan")
    p_scan.add_argument("--no-recurse", action="store_true", help="Don't descend into subdirectories")

    # organize
    p_org = subparsers.add_parser("organize", help="Rename and organize files")
    p_org.add_argument("directory", help="Directory to organize")
    p_org.add_argument("--dry-run", "-n", action="store_true", help="Preview changes without modifying files")
    p_org.add_argument("--rename-only", action="store_true", help="Only rename files, don't move into folders")
    p_org.add_argument("--no-recurse", action="store_true", help="Don't descend into subdirectories")
    p_org.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt")

    # undo
    p_undo = subparsers.add_parser("undo", help="Undo changes from a previous run")
    p_undo.add_argument("directory", help="Directory that was organized")
    p_undo.add_argument("--log", help="Specific log file to undo (default: most recent)")
    p_undo.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt")

    # logs
    p_logs = subparsers.add_parser("logs", help="List change logs")
    p_logs.add_argument("directory", help="Directory to check logs for")

    # init-config
    p_init = subparsers.add_parser("init-config", help="Generate a default config file")
    p_init.add_argument("--output", "-o", help="Output path (default: organizer-config.json in current dir)")

    args = parser.parse_args()

    commands = {
        "scan": cmd_scan,
        "organize": cmd_organize,
        "undo": cmd_undo,
        "logs": cmd_logs,
        "init-config": cmd_init_config,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()
