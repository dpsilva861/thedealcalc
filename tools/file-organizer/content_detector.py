"""
Content detection module — reads file headers (magic bytes) to determine
the real file type regardless of extension, and extracts metadata from
file contents for smart renaming.

Uses only the Python standard library (no pip installs).
"""

import struct
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# File signature database — maps magic bytes to (mime_type, category, extension)
# ---------------------------------------------------------------------------
@dataclass
class FileSignature:
    """A known file type signature."""
    magic: bytes
    offset: int  # byte offset where magic appears
    mime: str
    category: str
    extension: str
    description: str


# Ordered by specificity — more specific signatures first
SIGNATURES: list[FileSignature] = [
    # Images
    FileSignature(b"\x89PNG\r\n\x1a\n", 0, "image/png", "02_Images", ".png", "PNG image"),
    FileSignature(b"\xff\xd8\xff\xe0", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image (JFIF)"),
    FileSignature(b"\xff\xd8\xff\xe1", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image (EXIF)"),
    FileSignature(b"\xff\xd8\xff\xdb", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image"),
    FileSignature(b"\xff\xd8\xff\xee", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image (Adobe)"),
    FileSignature(b"\xff\xd8\xff", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image"),
    FileSignature(b"GIF89a", 0, "image/gif", "02_Images", ".gif", "GIF image (89a)"),
    FileSignature(b"GIF87a", 0, "image/gif", "02_Images", ".gif", "GIF image (87a)"),
    FileSignature(b"RIFF", 0, "image/webp", "02_Images", ".webp", "WebP image"),  # Also AVI/WAV — refined later
    FileSignature(b"BM", 0, "image/bmp", "02_Images", ".bmp", "BMP image"),
    FileSignature(b"\x00\x00\x01\x00", 0, "image/x-icon", "02_Images", ".ico", "ICO icon"),
    FileSignature(b"II\x2a\x00", 0, "image/tiff", "02_Images", ".tiff", "TIFF image (little-endian)"),
    FileSignature(b"MM\x00\x2a", 0, "image/tiff", "02_Images", ".tiff", "TIFF image (big-endian)"),

    # Documents
    FileSignature(b"%PDF", 0, "application/pdf", "01_Documents", ".pdf", "PDF document"),
    FileSignature(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", 0, "application/msoffice", "01_Documents", ".doc", "Microsoft Office (legacy)"),

    # Audio
    FileSignature(b"ID3", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio (ID3)"),
    FileSignature(b"\xff\xfb", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio"),
    FileSignature(b"\xff\xf3", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio"),
    FileSignature(b"\xff\xf2", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio"),
    FileSignature(b"fLaC", 0, "audio/flac", "03_Audio", ".flac", "FLAC audio"),
    FileSignature(b"OggS", 0, "audio/ogg", "03_Audio", ".ogg", "OGG audio"),

    # Video
    FileSignature(b"\x1a\x45\xdf\xa3", 0, "video/webm", "04_Video", ".webm", "WebM/MKV video"),
    FileSignature(b"\x00\x00\x00\x1c\x66\x74\x79\x70", 0, "video/mp4", "04_Video", ".mp4", "MP4 video"),
    FileSignature(b"\x00\x00\x00\x20\x66\x74\x79\x70", 0, "video/mp4", "04_Video", ".mp4", "MP4 video"),
    FileSignature(b"\x00\x00\x00\x18\x66\x74\x79\x70", 0, "video/mp4", "04_Video", ".mp4", "MP4 video"),

    # Archives
    FileSignature(b"PK\x03\x04", 0, "application/zip", "05_Archives", ".zip", "ZIP archive"),
    FileSignature(b"Rar!\x1a\x07", 0, "application/x-rar", "05_Archives", ".rar", "RAR archive"),
    FileSignature(b"\x37\x7a\xbc\xaf\x27\x1c", 0, "application/x-7z", "05_Archives", ".7z", "7-Zip archive"),
    FileSignature(b"\x1f\x8b", 0, "application/gzip", "05_Archives", ".gz", "Gzip archive"),
    FileSignature(b"\x42\x5a\x68", 0, "application/x-bzip2", "05_Archives", ".bz2", "Bzip2 archive"),
    FileSignature(b"\xfd\x37\x7a\x58\x5a\x00", 0, "application/x-xz", "05_Archives", ".xz", "XZ archive"),

    # Executables
    FileSignature(b"MZ", 0, "application/x-executable", "07_Executables", ".exe", "Windows executable"),

    # Databases
    FileSignature(b"SQLite format 3\x00", 0, "application/x-sqlite3", "10_Databases", ".sqlite", "SQLite database"),

    # Fonts
    FileSignature(b"\x00\x01\x00\x00", 0, "font/ttf", "08_Fonts", ".ttf", "TrueType font"),
    FileSignature(b"OTTO", 0, "font/otf", "08_Fonts", ".otf", "OpenType font"),
    FileSignature(b"wOFF", 0, "font/woff", "08_Fonts", ".woff", "WOFF font"),
    FileSignature(b"wOF2", 0, "font/woff2", "08_Fonts", ".woff2", "WOFF2 font"),
]


@dataclass
class ContentInfo:
    """Result of content-based file analysis."""
    detected_type: Optional[str] = None        # e.g. "image/jpeg"
    detected_category: Optional[str] = None    # e.g. "02_Images"
    detected_extension: Optional[str] = None   # e.g. ".jpg"
    description: Optional[str] = None          # e.g. "JPEG image (EXIF)"
    extension_mismatch: bool = False           # True if extension doesn't match content
    metadata: dict = field(default_factory=dict)  # Extracted metadata (title, author, etc.)
    suggested_name: Optional[str] = None       # Smart name derived from metadata


# ---------------------------------------------------------------------------
# Magic byte detection
# ---------------------------------------------------------------------------
def detect_file_type(filepath: Path) -> Optional[FileSignature]:
    """
    Read the first bytes of a file and match against known signatures.

    Returns the matching FileSignature or None if unknown.
    """
    try:
        with open(filepath, "rb") as f:
            header = f.read(64)  # Read enough bytes for all signatures
    except (PermissionError, OSError):
        return None

    if len(header) < 2:
        return None

    for sig in SIGNATURES:
        end = sig.offset + len(sig.magic)
        if len(header) >= end and header[sig.offset:end] == sig.magic:
            # Refine RIFF-based formats (could be WAV, AVI, or WebP)
            if sig.magic == b"RIFF" and len(header) >= 12:
                sub_type = header[8:12]
                if sub_type == b"WAVE":
                    return FileSignature(b"RIFF", 0, "audio/wav", "03_Audio", ".wav", "WAV audio")
                elif sub_type == b"AVI ":
                    return FileSignature(b"RIFF", 0, "video/avi", "04_Video", ".avi", "AVI video")
                elif sub_type == b"WEBP":
                    return FileSignature(b"RIFF", 0, "image/webp", "02_Images", ".webp", "WebP image")
                return None  # Unknown RIFF

            # Refine ftyp-based formats (MP4 vs M4A vs MOV)
            if b"ftyp" in sig.magic or (len(header) >= 12 and header[4:8] == b"ftyp"):
                ftyp_brand = header[8:12] if len(header) >= 12 else b""
                if ftyp_brand in (b"M4A ", b"M4A\x00"):
                    return FileSignature(sig.magic, 0, "audio/mp4", "03_Audio", ".m4a", "M4A audio")
                elif ftyp_brand in (b"qt  ",):
                    return FileSignature(sig.magic, 0, "video/quicktime", "04_Video", ".mov", "QuickTime video")

            return sig

    # Check for ftyp at variable offsets (MP4 box size varies)
    for offset in range(4, min(32, len(header) - 4)):
        if header[offset:offset + 4] == b"ftyp":
            brand = header[offset + 4:offset + 8] if len(header) >= offset + 8 else b""
            if brand in (b"M4A ", b"M4A\x00"):
                return FileSignature(b"ftyp", offset, "audio/mp4", "03_Audio", ".m4a", "M4A audio")
            return FileSignature(b"ftyp", offset, "video/mp4", "04_Video", ".mp4", "MP4 video")

    return None


def _is_zip_based_office(filepath: Path) -> Optional[FileSignature]:
    """Check if a ZIP file is actually a DOCX, XLSX, or PPTX."""
    try:
        with zipfile.ZipFile(filepath, "r") as zf:
            names = zf.namelist()
            if "[Content_Types].xml" in names:
                ct = zf.read("[Content_Types].xml").decode("utf-8", errors="ignore")
                if "wordprocessingml" in ct:
                    return FileSignature(b"PK", 0, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "01_Documents", ".docx", "Word document")
                elif "spreadsheetml" in ct:
                    return FileSignature(b"PK", 0, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "01_Documents", ".xlsx", "Excel spreadsheet")
                elif "presentationml" in ct:
                    return FileSignature(b"PK", 0, "application/vnd.openxmlformats-officedocument.presentationml.presentation", "01_Documents", ".pptx", "PowerPoint presentation")
            # OpenDocument formats
            if "mimetype" in names:
                mimetype = zf.read("mimetype").decode("utf-8", errors="ignore").strip()
                if "opendocument.text" in mimetype:
                    return FileSignature(b"PK", 0, mimetype, "01_Documents", ".odt", "OpenDocument text")
                elif "opendocument.spreadsheet" in mimetype:
                    return FileSignature(b"PK", 0, mimetype, "01_Documents", ".ods", "OpenDocument spreadsheet")
                elif "opendocument.presentation" in mimetype:
                    return FileSignature(b"PK", 0, mimetype, "01_Documents", ".odp", "OpenDocument presentation")
    except (zipfile.BadZipFile, OSError):
        pass
    return None


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------
def extract_pdf_metadata(filepath: Path) -> dict:
    """
    Extract metadata from a PDF file by parsing the /Info dictionary.
    Returns dict with keys like title, author, subject, creator.
    """
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            content = f.read(min(65536, filepath.stat().st_size))  # Read up to 64KB

        text = content.decode("latin-1", errors="ignore")

        # Find /Info dictionary entries
        for key, field_name in [
            ("/Title", "title"),
            ("/Author", "author"),
            ("/Subject", "subject"),
            ("/Creator", "creator"),
            ("/Producer", "producer"),
            ("/CreationDate", "created"),
        ]:
            idx = text.find(key)
            if idx == -1:
                continue
            # Look for the value in parentheses: /Title (The Value)
            rest = text[idx + len(key):]
            paren_start = rest.find("(")
            if paren_start != -1 and paren_start < 50:
                paren_end = rest.find(")", paren_start)
                if paren_end != -1:
                    value = rest[paren_start + 1:paren_end].strip()
                    # Clean up PDF unicode escapes
                    if value.startswith("\xfe\xff"):
                        try:
                            value = value[2:].encode("latin-1").decode("utf-16-be", errors="ignore")
                        except Exception:
                            pass
                    if value and value not in ("Untitled", "untitled", ""):
                        metadata[field_name] = value

    except (PermissionError, OSError):
        pass
    return metadata


def extract_jpeg_metadata(filepath: Path) -> dict:
    """
    Extract basic EXIF metadata from JPEG files.
    Reads date taken and basic camera info.
    """
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            # Verify JPEG
            if f.read(2) != b"\xff\xd8":
                return metadata

            # Walk through JPEG markers looking for APP1 (EXIF)
            while True:
                marker = f.read(2)
                if len(marker) < 2:
                    break
                if marker[0] != 0xff:
                    break

                # APP1 marker (EXIF)
                if marker[1] == 0xe1:
                    length = struct.unpack(">H", f.read(2))[0]
                    data = f.read(length - 2)

                    if data[:6] == b"Exif\x00\x00":
                        _parse_exif(data[6:], metadata)
                    break
                elif marker[1] in (0xd9, 0xda):
                    break  # End of image or start of scan
                else:
                    # Skip this marker
                    length = struct.unpack(">H", f.read(2))[0]
                    f.seek(length - 2, 1)

    except (PermissionError, OSError, struct.error):
        pass
    return metadata


def _parse_exif(data: bytes, metadata: dict) -> None:
    """Parse basic EXIF IFD0 fields from raw EXIF data."""
    if len(data) < 8:
        return

    # Determine byte order
    if data[:2] == b"II":
        endian = "<"
    elif data[:2] == b"MM":
        endian = ">"
    else:
        return

    try:
        ifd_offset = struct.unpack(endian + "I", data[4:8])[0]
        if ifd_offset + 2 > len(data):
            return

        num_entries = struct.unpack(endian + "H", data[ifd_offset:ifd_offset + 2])[0]

        for i in range(min(num_entries, 50)):  # Cap to prevent runaway
            entry_offset = ifd_offset + 2 + i * 12
            if entry_offset + 12 > len(data):
                break

            tag = struct.unpack(endian + "H", data[entry_offset:entry_offset + 2])[0]
            dtype = struct.unpack(endian + "H", data[entry_offset + 2:entry_offset + 4])[0]
            count = struct.unpack(endian + "I", data[entry_offset + 4:entry_offset + 8])[0]

            # For ASCII strings (type 2)
            if dtype == 2 and count > 0:
                if count <= 4:
                    value = data[entry_offset + 8:entry_offset + 8 + count]
                else:
                    str_offset = struct.unpack(endian + "I", data[entry_offset + 8:entry_offset + 12])[0]
                    if str_offset + count <= len(data):
                        value = data[str_offset:str_offset + count]
                    else:
                        continue

                text = value.decode("ascii", errors="ignore").rstrip("\x00").strip()
                if not text:
                    continue

                # Tag 0x010F = Camera Make
                if tag == 0x010F:
                    metadata["camera_make"] = text
                # Tag 0x0110 = Camera Model
                elif tag == 0x0110:
                    metadata["camera_model"] = text
                # Tag 0x0132 = DateTime
                elif tag == 0x0132:
                    metadata["date_taken"] = text
                # Tag 0x010E = Image Description
                elif tag == 0x010E:
                    metadata["description"] = text

    except (struct.error, IndexError):
        pass


def extract_id3_metadata(filepath: Path) -> dict:
    """
    Extract ID3v2 tags from MP3 files (title, artist, album).
    """
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            header = f.read(10)
            if header[:3] != b"ID3":
                # Try ID3v1 at end of file
                return _extract_id3v1(filepath)

            # ID3v2 version
            major_ver = header[3]
            # tag_size: syncsafe integer
            size_bytes = header[6:10]
            tag_size = (
                (size_bytes[0] & 0x7f) << 21 |
                (size_bytes[1] & 0x7f) << 14 |
                (size_bytes[2] & 0x7f) << 7 |
                (size_bytes[3] & 0x7f)
            )

            tag_data = f.read(min(tag_size, 65536))  # Cap read size

            pos = 0
            while pos < len(tag_data) - 10:
                if major_ver >= 3:
                    frame_id = tag_data[pos:pos + 4].decode("ascii", errors="ignore")
                    frame_size = struct.unpack(">I", tag_data[pos + 4:pos + 8])[0]
                    pos += 10  # Skip header (4 id + 4 size + 2 flags)
                else:
                    frame_id = tag_data[pos:pos + 3].decode("ascii", errors="ignore")
                    frame_size = (tag_data[pos + 3] << 16 | tag_data[pos + 4] << 8 | tag_data[pos + 5])
                    pos += 6

                if frame_size <= 0 or frame_size > len(tag_data) - pos:
                    break
                if not frame_id[0].isalpha():
                    break

                frame_data = tag_data[pos:pos + frame_size]
                pos += frame_size

                # Decode text frames
                text = _decode_id3_text(frame_data)
                if not text:
                    continue

                # Map frame IDs to metadata keys
                frame_map = {
                    "TIT2": "title", "TT2": "title",
                    "TPE1": "artist", "TP1": "artist",
                    "TALB": "album", "TAL": "album",
                    "TYER": "year", "TYE": "year",
                    "TDRC": "year",
                    "TRCK": "track", "TRK": "track",
                    "TCON": "genre", "TCO": "genre",
                }

                if frame_id in frame_map:
                    metadata[frame_map[frame_id]] = text

    except (PermissionError, OSError, struct.error):
        pass
    return metadata


def _extract_id3v1(filepath: Path) -> dict:
    """Extract ID3v1 tags from the last 128 bytes of an MP3."""
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            f.seek(-128, 2)
            tag = f.read(128)
            if tag[:3] != b"TAG":
                return metadata

            title = tag[3:33].decode("ascii", errors="ignore").strip("\x00").strip()
            artist = tag[33:63].decode("ascii", errors="ignore").strip("\x00").strip()
            album = tag[63:93].decode("ascii", errors="ignore").strip("\x00").strip()
            year = tag[93:97].decode("ascii", errors="ignore").strip("\x00").strip()

            if title:
                metadata["title"] = title
            if artist:
                metadata["artist"] = artist
            if album:
                metadata["album"] = album
            if year:
                metadata["year"] = year
    except (PermissionError, OSError):
        pass
    return metadata


def _decode_id3_text(data: bytes) -> Optional[str]:
    """Decode an ID3v2 text frame considering encoding byte."""
    if not data:
        return None

    encoding_byte = data[0]
    text_data = data[1:]

    try:
        if encoding_byte == 0:
            return text_data.decode("latin-1", errors="ignore").strip("\x00").strip()
        elif encoding_byte == 1:
            return text_data.decode("utf-16", errors="ignore").strip("\x00").strip()
        elif encoding_byte == 2:
            return text_data.decode("utf-16-be", errors="ignore").strip("\x00").strip()
        elif encoding_byte == 3:
            return text_data.decode("utf-8", errors="ignore").strip("\x00").strip()
    except (UnicodeDecodeError, ValueError):
        pass
    return None


def extract_office_metadata(filepath: Path) -> dict:
    """
    Extract metadata from Office Open XML files (DOCX, XLSX, PPTX).
    These are ZIP files containing docProps/core.xml with Dublin Core metadata.
    """
    metadata = {}
    try:
        with zipfile.ZipFile(filepath, "r") as zf:
            # Read core properties
            if "docProps/core.xml" in zf.namelist():
                xml_data = zf.read("docProps/core.xml")
                root = ET.fromstring(xml_data)

                # Dublin Core and cp namespaces
                ns = {
                    "dc": "http://purl.org/dc/elements/1.1/",
                    "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
                    "dcterms": "http://purl.org/dc/terms/",
                }

                for xpath, key in [
                    ("dc:title", "title"),
                    ("dc:creator", "author"),
                    ("dc:subject", "subject"),
                    ("dc:description", "description"),
                    ("cp:lastModifiedBy", "last_modified_by"),
                    ("cp:category", "category"),
                    ("dcterms:created", "created"),
                    ("dcterms:modified", "modified"),
                ]:
                    elem = root.find(xpath, ns)
                    if elem is not None and elem.text and elem.text.strip():
                        metadata[key] = elem.text.strip()

            # Read app properties for additional info
            if "docProps/app.xml" in zf.namelist():
                xml_data = zf.read("docProps/app.xml")
                root = ET.fromstring(xml_data)
                ns_app = {"ep": "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"}

                app_elem = root.find("ep:Application", ns_app)
                if app_elem is not None and app_elem.text:
                    metadata["application"] = app_elem.text.strip()

                pages_elem = root.find("ep:Pages", ns_app)
                if pages_elem is not None and pages_elem.text:
                    metadata["pages"] = pages_elem.text.strip()

    except (zipfile.BadZipFile, ET.ParseError, OSError):
        pass
    return metadata


# ---------------------------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------------------------
def analyze_file(filepath: Path) -> ContentInfo:
    """
    Perform full content analysis on a file:
    1. Detect real file type via magic bytes
    2. Check for extension mismatch
    3. Extract metadata based on detected type
    4. Generate a suggested filename from metadata

    Args:
        filepath: Path to the file to analyze.

    Returns:
        ContentInfo with all detected information.
    """
    info = ContentInfo()
    current_ext = filepath.suffix.lower()

    # Step 1: Detect real type from magic bytes
    sig = detect_file_type(filepath)

    if sig is not None:
        # Refine ZIP-based formats
        if sig.mime == "application/zip":
            office_sig = _is_zip_based_office(filepath)
            if office_sig:
                sig = office_sig

        info.detected_type = sig.mime
        info.detected_category = sig.category
        info.detected_extension = sig.extension
        info.description = sig.description

        # Step 2: Check extension mismatch
        if current_ext and current_ext != sig.extension:
            # Allow common equivalent extensions
            equivalents = {
                ".jpg": {".jpeg"},
                ".jpeg": {".jpg"},
                ".tif": {".tiff"},
                ".tiff": {".tif"},
                ".htm": {".html"},
                ".html": {".htm"},
                ".mpg": {".mpeg"},
                ".mpeg": {".mpg"},
            }
            allowed = equivalents.get(sig.extension, set())
            if current_ext not in allowed:
                info.extension_mismatch = True

    # Step 3: Extract metadata based on type
    if info.detected_type:
        if "pdf" in info.detected_type:
            info.metadata = extract_pdf_metadata(filepath)
        elif "jpeg" in info.detected_type or "jpg" in info.detected_type:
            info.metadata = extract_jpeg_metadata(filepath)
        elif "mpeg" in info.detected_type and info.detected_extension == ".mp3":
            info.metadata = extract_id3_metadata(filepath)
        elif "officedocument" in info.detected_type or "opendocument" in info.detected_type:
            info.metadata = extract_office_metadata(filepath)
    elif current_ext in (".docx", ".xlsx", ".pptx", ".odt", ".ods", ".odp"):
        # Extension suggests Office doc but magic detection got ZIP
        info.metadata = extract_office_metadata(filepath)

    # Step 4: Generate suggested name from metadata
    info.suggested_name = _build_suggested_name(info, filepath)

    return info


def _build_suggested_name(info: ContentInfo, filepath: Path) -> Optional[str]:
    """
    Build a smart filename from extracted metadata.
    Returns just the stem (no extension) or None if no useful metadata.
    """
    meta = info.metadata
    if not meta:
        return None

    parts = []

    # For audio: artist - title
    if info.detected_category == "03_Audio" or filepath.suffix.lower() in (".mp3", ".flac", ".m4a", ".ogg", ".wav"):
        artist = meta.get("artist", "")
        title = meta.get("title", "")
        album = meta.get("album", "")
        track = meta.get("track", "")

        if artist and title:
            if track:
                track_num = track.split("/")[0].zfill(2)
                parts = [artist, f"{track_num} {title}"]
            else:
                parts = [artist, title]
        elif title:
            parts = [title]

    # For images with EXIF date: date-description or date-camera
    elif info.detected_category == "02_Images" or filepath.suffix.lower() in (".jpg", ".jpeg", ".png", ".tiff"):
        date = meta.get("date_taken", "")
        desc = meta.get("description", "")

        if date:
            # Convert "2024:01:15 14:30:00" -> "2024-01-15"
            date_clean = date[:10].replace(":", "-")
            if desc:
                parts = [date_clean, desc]
            else:
                camera = meta.get("camera_model", "")
                if camera:
                    parts = [date_clean, camera]
                else:
                    parts = [date_clean, filepath.stem]
        elif desc:
            parts = [desc]

    # For documents: use title
    elif info.detected_category == "01_Documents" or filepath.suffix.lower() in (".pdf", ".docx", ".xlsx", ".pptx"):
        title = meta.get("title", "")
        if title and len(title) > 3:  # Ignore very short/meaningless titles
            parts = [title]

    if not parts:
        return None

    return " - ".join(parts)
