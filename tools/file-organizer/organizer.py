"""
File organizer module — moves files into categorized folders and executes rename plans.
"""

import shutil
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from scanner import FileEntry
from renamer import RenameAction, normalize_filename


@dataclass
class MoveAction:
    """A planned file move into a category folder."""
    original: Path
    destination: Path
    category: str

    @property
    def changed(self) -> bool:
        return self.original != self.destination


@dataclass
class OrganizePlan:
    """Complete plan of all renames and moves to be executed."""
    renames: list[RenameAction] = field(default_factory=list)
    moves: list[MoveAction] = field(default_factory=list)

    @property
    def total_actions(self) -> int:
        return len(self.renames) + len(self.moves)

    def preview(self, max_lines: int = 50) -> str:
        lines = []
        if self.renames:
            lines.append(f"--- Renames ({len(self.renames)}) ---")
            for action in self.renames[:max_lines]:
                lines.append(f"  {action.original.name}  ->  {action.new_path.name}")
                lines.append(f"    reason: {action.reason}")
            if len(self.renames) > max_lines:
                lines.append(f"  ... and {len(self.renames) - max_lines} more")

        if self.moves:
            lines.append(f"\n--- Moves ({len(self.moves)}) ---")
            for action in self.moves[:max_lines]:
                rel_orig = action.original.name
                rel_dest = action.destination.relative_to(action.destination.parent.parent)
                lines.append(f"  {rel_orig}  ->  {rel_dest}")
            if len(self.moves) > max_lines:
                lines.append(f"  ... and {len(self.moves) - max_lines} more")

        if not lines:
            lines.append("No changes needed. All files are already organized.")

        return "\n".join(lines)


def plan_organization(
    files: list[FileEntry],
    target_root: Path,
    rename_rules: Optional[dict] = None,
    organize_into_folders: bool = True,
) -> OrganizePlan:
    """
    Build a full plan: rename files and optionally move them into category folders.

    Args:
        files: List of FileEntry objects from the scanner.
        target_root: Root directory where category folders will be created.
        rename_rules: Naming rules for the renamer. Uses defaults if None.
        organize_into_folders: If True, move files into category subfolders.

    Returns:
        An OrganizePlan with all renames and moves.
    """
    plan = OrganizePlan()
    # Track used names per destination directory to avoid collisions
    used_names: dict[Path, set[str]] = {}

    for entry in files:
        # Step 1: Compute the normalized filename
        new_name = normalize_filename(entry.stem, entry.extension, rename_rules)

        # Step 2: Determine destination directory
        if organize_into_folders:
            dest_dir = target_root / entry.category
        else:
            dest_dir = entry.parent

        # Step 3: Handle name collisions in the destination
        if dest_dir not in used_names:
            used_names[dest_dir] = set()

        final_name = _deduplicate(new_name, used_names[dest_dir])
        used_names[dest_dir].add(final_name.lower())

        dest_path = dest_dir / final_name

        # Record rename if the name changed (and file stays in place)
        if final_name != entry.name and not organize_into_folders:
            plan.renames.append(RenameAction(
                original=entry.path,
                new_path=dest_path,
                reason="naming convention normalization",
            ))

        # Record move if the file is going to a different directory
        if organize_into_folders:
            if dest_path != entry.path:
                plan.moves.append(MoveAction(
                    original=entry.path,
                    destination=dest_path,
                    category=entry.category,
                ))

    return plan


def _deduplicate(name: str, existing: set[str]) -> str:
    """Append a numeric suffix if name already exists in the set."""
    if name.lower() not in existing:
        return name

    stem = Path(name).stem
    ext = Path(name).suffix
    counter = 1
    while True:
        candidate = f"{stem}-{counter}{ext}"
        if candidate.lower() not in existing:
            return candidate
        counter += 1


@dataclass
class ExecutionResult:
    """Result of executing an organization plan."""
    renames_done: int = 0
    moves_done: int = 0
    errors: list[tuple[Path, str]] = field(default_factory=list)
    log_entries: list[dict] = field(default_factory=list)

    def summary(self) -> str:
        lines = [
            f"Renames completed: {self.renames_done}",
            f"Moves completed: {self.moves_done}",
            f"Errors: {len(self.errors)}",
        ]
        for path, err in self.errors:
            lines.append(f"  ERROR {path}: {err}")
        return "\n".join(lines)


def execute_plan(plan: OrganizePlan, dry_run: bool = False) -> ExecutionResult:
    """
    Execute all planned renames and moves.

    Args:
        plan: The OrganizePlan to execute.
        dry_run: If True, don't actually modify anything.

    Returns:
        ExecutionResult with counts and any errors encountered.
    """
    result = ExecutionResult()

    # Execute renames first
    for action in plan.renames:
        if dry_run:
            result.renames_done += 1
            result.log_entries.append({
                "type": "rename",
                "from": str(action.original),
                "to": str(action.new_path),
                "dry_run": True,
            })
            continue

        try:
            action.original.rename(action.new_path)
            result.renames_done += 1
            result.log_entries.append({
                "type": "rename",
                "from": str(action.original),
                "to": str(action.new_path),
            })
        except PermissionError:
            result.errors.append((action.original, "Permission denied"))
        except OSError as exc:
            result.errors.append((action.original, str(exc)))

    # Execute moves
    for action in plan.moves:
        if dry_run:
            result.moves_done += 1
            result.log_entries.append({
                "type": "move",
                "from": str(action.original),
                "to": str(action.destination),
                "category": action.category,
                "dry_run": True,
            })
            continue

        try:
            # Create category directory if needed
            action.destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(action.original), str(action.destination))
            result.moves_done += 1
            result.log_entries.append({
                "type": "move",
                "from": str(action.original),
                "to": str(action.destination),
                "category": action.category,
            })
        except PermissionError:
            result.errors.append((action.original, "Permission denied"))
        except OSError as exc:
            result.errors.append((action.original, str(exc)))

    return result
