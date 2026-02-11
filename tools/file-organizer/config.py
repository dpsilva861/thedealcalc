"""
Default configuration for the file organizer agent.
Users can override these by providing a config.json file.

Naming conventions follow institutional best practices from:
Stanford Libraries, Harvard, NARA, Smithsonian, Princeton, CESSDA.
"""

# Map of category name -> list of file extensions
# Folder names follow NARA/Smithsonian recommended hierarchy with numeric prefixes
DEFAULT_CATEGORIES = {
    "01_Documents": [
        ".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".xls", ".xlsx",
        ".csv", ".ppt", ".pptx", ".odp", ".ods", ".pages", ".numbers",
        ".keynote", ".epub", ".mobi",
    ],
    "02_Images": [
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".tiff",
        ".tif", ".ico", ".heic", ".heif", ".raw", ".cr2", ".nef", ".psd",
        ".ai", ".eps",
    ],
    "03_Audio": [
        ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a", ".opus",
        ".aiff", ".alac", ".mid", ".midi",
    ],
    "04_Video": [
        ".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm", ".m4v",
        ".mpg", ".mpeg", ".3gp", ".vob", ".ogv",
    ],
    "05_Archives": [
        ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".iso",
        ".dmg", ".cab", ".lz", ".zst",
    ],
    "06_Code": [
        ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".scss",
        ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".go", ".rs", ".rb",
        ".php", ".swift", ".kt", ".r", ".m", ".sql", ".sh", ".bat",
        ".ps1", ".json", ".xml", ".yaml", ".yml", ".toml", ".ini",
        ".cfg", ".conf", ".md", ".rst",
    ],
    "07_Executables": [
        ".exe", ".msi", ".app", ".deb", ".rpm", ".apk", ".jar", ".com",
    ],
    "08_Fonts": [
        ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ],
    "09_3D-Models": [
        ".obj", ".stl", ".fbx", ".blend", ".3ds", ".dae",
    ],
    "10_Databases": [
        ".db", ".sqlite", ".sqlite3", ".mdb", ".accdb",
    ],
}

# Naming convention rules
# Based on: Stanford, Harvard, NARA, Smithsonian, Princeton, CESSDA
#
# Format: descriptor_YYYYMMDD_v01.ext
#   - Underscores separate major elements (subject, date, version)
#   - Hyphens separate words within an element (e.g., "annual-report")
#   - Dates in ISO 8601 format (YYYYMMDD)
#   - Versions with leading zeros (v01, v02)
#   - All lowercase
#   - Max 50 characters for filename stem (Harvard recommendation)
NAMING_RULES = {
    # Replace spaces with hyphens (for words within an element)
    "word_separator": "-",
    # Separate major filename elements (subject, date, version) with underscore
    "element_separator": "_",
    # Convert filenames to lowercase
    "lowercase": True,
    # Remove these characters from filenames
    "strip_characters": "!@#$%^&()+={}[]|;',`~",
    # Maximum filename length (Harvard recommends 40-50 chars)
    "max_filename_length": 50,
    # Collapse repeated separators
    "collapse_separators": True,
    # Strip leading/trailing separators from the name
    "strip_edge_separators": True,
    # Add file creation/modification date to filenames that lack one
    "add_date_prefix": True,
    # Date format in filenames (ISO 8601)
    "date_format": "YYYYMMDD",
}

# Directories to always skip
SKIP_DIRECTORIES = {
    ".git", ".svn", ".hg", "__pycache__", "node_modules", ".venv",
    "venv", ".env", "env", ".idea", ".vscode", "$RECYCLE.BIN",
    "System Volume Information", "WindowsApps",
    ".file-organizer-logs",
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
