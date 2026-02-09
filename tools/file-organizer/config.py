"""
Default configuration for the file organizer agent.
Users can override these by providing a config.json file.
"""

# Map of category name -> list of file extensions
DEFAULT_CATEGORIES = {
    "Documents": [
        ".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".xls", ".xlsx",
        ".csv", ".ppt", ".pptx", ".odp", ".ods", ".pages", ".numbers",
        ".keynote", ".epub", ".mobi",
    ],
    "Images": [
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".tiff",
        ".tif", ".ico", ".heic", ".heif", ".raw", ".cr2", ".nef", ".psd",
        ".ai", ".eps",
    ],
    "Videos": [
        ".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm", ".m4v",
        ".mpg", ".mpeg", ".3gp", ".vob", ".ogv",
    ],
    "Audio": [
        ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus",
        ".aiff", ".alac", ".mid", ".midi",
    ],
    "Archives": [
        ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".iso",
        ".dmg", ".cab", ".lz", ".zst",
    ],
    "Code": [
        ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".scss",
        ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".go", ".rs", ".rb",
        ".php", ".swift", ".kt", ".r", ".m", ".sql", ".sh", ".bat",
        ".ps1", ".json", ".xml", ".yaml", ".yml", ".toml", ".ini",
        ".cfg", ".conf", ".md", ".rst",
    ],
    "Executables": [
        ".exe", ".msi", ".app", ".deb", ".rpm", ".apk", ".jar", ".com",
    ],
    "Fonts": [
        ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ],
    "3D_Models": [
        ".obj", ".stl", ".fbx", ".blend", ".3ds", ".dae",
    ],
    "Databases": [
        ".db", ".sqlite", ".sqlite3", ".mdb", ".accdb",
    ],
}

# Naming convention rules
NAMING_RULES = {
    # Replace spaces with this character
    "space_replacement": "-",
    # Convert filenames to lowercase
    "lowercase": True,
    # Remove these characters from filenames
    "strip_characters": "!@#$%^&()+={}[]|;',`~",
    # Maximum filename length (excluding extension). Windows MAX_PATH consideration.
    "max_filename_length": 200,
    # Collapse repeated separators (e.g., "file---name" -> "file-name")
    "collapse_separators": True,
    # Strip leading/trailing separators from the name
    "strip_edge_separators": True,
}

# Directories to always skip
SKIP_DIRECTORIES = {
    ".git", ".svn", ".hg", "__pycache__", "node_modules", ".venv",
    "venv", ".env", "env", ".idea", ".vscode", "$RECYCLE.BIN",
    "System Volume Information", "WindowsApps",
}

# Files to never touch
SKIP_FILES = {
    "desktop.ini", "thumbs.db", ".ds_store", "ntuser.dat",
}

# Windows reserved filenames
WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}

# Characters not allowed in Windows filenames
WINDOWS_INVALID_CHARS = '<>:"/\\|?*'
