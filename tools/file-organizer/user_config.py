"""
User configuration loader — reads config.json to override defaults.
"""

import json
from pathlib import Path
from typing import Optional

from config import DEFAULT_CATEGORIES, NAMING_RULES, SKIP_DIRECTORIES, SKIP_FILES


CONFIG_FILENAME = "organizer-config.json"


def default_config() -> dict:
    """Return the full default configuration as a dict."""
    return {
        "categories": DEFAULT_CATEGORIES,
        "naming_rules": NAMING_RULES,
        "skip_directories": list(SKIP_DIRECTORIES),
        "skip_files": list(SKIP_FILES),
        "organize_into_folders": True,
        "recursive": True,
        "watch_directories": [],
    }


def load_config(config_path: Optional[Path] = None) -> dict:
    """
    Load configuration from a JSON file, merging with defaults.

    If config_path is None, looks for organizer-config.json in the
    current working directory.

    Any key in the JSON overrides the default. Missing keys keep defaults.
    """
    cfg = default_config()

    if config_path is None:
        config_path = Path.cwd() / CONFIG_FILENAME

    if not config_path.exists():
        return cfg

    try:
        user_cfg = json.loads(config_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        print(f"Warning: Could not read config file {config_path}: {exc}")
        return cfg

    # Merge user overrides into defaults
    if "categories" in user_cfg:
        # User can add new categories or override existing ones
        cfg["categories"].update(user_cfg["categories"])

    if "naming_rules" in user_cfg:
        cfg["naming_rules"].update(user_cfg["naming_rules"])

    if "skip_directories" in user_cfg:
        cfg["skip_directories"] = user_cfg["skip_directories"]

    if "skip_files" in user_cfg:
        cfg["skip_files"] = user_cfg["skip_files"]

    if "organize_into_folders" in user_cfg:
        cfg["organize_into_folders"] = user_cfg["organize_into_folders"]

    if "recursive" in user_cfg:
        cfg["recursive"] = user_cfg["recursive"]

    if "watch_directories" in user_cfg:
        cfg["watch_directories"] = user_cfg["watch_directories"]

    return cfg


def save_default_config(output_path: Optional[Path] = None) -> Path:
    """
    Write the default configuration to a JSON file for the user to customize.

    Returns:
        Path to the written config file.
    """
    if output_path is None:
        output_path = Path.cwd() / CONFIG_FILENAME

    cfg = default_config()
    output_path.write_text(
        json.dumps(cfg, indent=2, sort_keys=False),
        encoding="utf-8",
    )
    return output_path
