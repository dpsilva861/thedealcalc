#!/usr/bin/env python3
r"""
File Organization Agent (single-file version)
==============================================
Save this ONE file to your computer and run it. No other files needed.

Usage:
    python file_organizer.py scan C:\Users\dpsil\Downloads
    python file_organizer.py organize C:\Users\dpsil\Downloads --dry-run
    python file_organizer.py organize C:\Users\dpsil\Downloads --deep-scan
    python file_organizer.py undo C:\Users\dpsil\Downloads
"""

import argparse
import json
import os
import re
import shutil
import struct
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
import zlib


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

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
    "08_Fonts": [".ttf", ".otf", ".woff", ".woff2", ".eot"],
    "09_3D-Models": [".obj", ".stl", ".fbx", ".blend", ".3ds", ".dae"],
    "10_Databases": [".db", ".sqlite", ".sqlite3", ".mdb", ".accdb"],
}

NAMING_RULES = {
    "word_separator": "-",
    "element_separator": "_",
    "lowercase": True,
    "strip_characters": "!@#$%^&()+={}[]|;',`~",
    "max_filename_length": 80,
    "collapse_separators": True,
    "strip_edge_separators": True,
    "add_date_prefix": True,
    "date_format": "YYYYMMDD",
}

SKIP_DIRECTORIES = {
    ".git", ".svn", ".hg", "__pycache__", "node_modules", ".venv",
    "venv", ".env", "env", ".idea", ".vscode", "$RECYCLE.BIN",
    "System Volume Information", "WindowsApps",
    ".file-organizer-logs",
}

SKIP_FILES = {
    "desktop.ini", "thumbs.db", ".ds_store", "ntuser.dat",
}

WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}

WINDOWS_INVALID_CHARS = '<>:"/\\|?*'

CONFIG_FILENAME = "organizer-config.json"


# ═══════════════════════════════════════════════════════════════════════════════
# USER CONFIG
# ═══════════════════════════════════════════════════════════════════════════════

def default_config() -> dict:
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
    if "categories" in user_cfg:
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
    if output_path is None:
        output_path = Path.cwd() / CONFIG_FILENAME
    cfg = default_config()
    output_path.write_text(json.dumps(cfg, indent=2, sort_keys=False), encoding="utf-8")
    return output_path


# ═══════════════════════════════════════════════════════════════════════════════
# CONTENT DETECTOR
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class FileSignature:
    magic: bytes
    offset: int
    mime: str
    category: str
    extension: str
    description: str


SIGNATURES: list[FileSignature] = [
    FileSignature(b"\x89PNG\r\n\x1a\n", 0, "image/png", "02_Images", ".png", "PNG image"),
    FileSignature(b"\xff\xd8\xff\xe0", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image (JFIF)"),
    FileSignature(b"\xff\xd8\xff\xe1", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image (EXIF)"),
    FileSignature(b"\xff\xd8\xff\xdb", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image"),
    FileSignature(b"\xff\xd8\xff\xee", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image (Adobe)"),
    FileSignature(b"\xff\xd8\xff", 0, "image/jpeg", "02_Images", ".jpg", "JPEG image"),
    FileSignature(b"GIF89a", 0, "image/gif", "02_Images", ".gif", "GIF image (89a)"),
    FileSignature(b"GIF87a", 0, "image/gif", "02_Images", ".gif", "GIF image (87a)"),
    FileSignature(b"RIFF", 0, "image/webp", "02_Images", ".webp", "WebP image"),
    FileSignature(b"BM", 0, "image/bmp", "02_Images", ".bmp", "BMP image"),
    FileSignature(b"\x00\x00\x01\x00", 0, "image/x-icon", "02_Images", ".ico", "ICO icon"),
    FileSignature(b"II\x2a\x00", 0, "image/tiff", "02_Images", ".tiff", "TIFF image (little-endian)"),
    FileSignature(b"MM\x00\x2a", 0, "image/tiff", "02_Images", ".tiff", "TIFF image (big-endian)"),
    FileSignature(b"%PDF", 0, "application/pdf", "01_Documents", ".pdf", "PDF document"),
    FileSignature(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", 0, "application/msoffice", "01_Documents", ".doc", "Microsoft Office (legacy)"),
    FileSignature(b"ID3", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio (ID3)"),
    FileSignature(b"\xff\xfb", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio"),
    FileSignature(b"\xff\xf3", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio"),
    FileSignature(b"\xff\xf2", 0, "audio/mpeg", "03_Audio", ".mp3", "MP3 audio"),
    FileSignature(b"fLaC", 0, "audio/flac", "03_Audio", ".flac", "FLAC audio"),
    FileSignature(b"OggS", 0, "audio/ogg", "03_Audio", ".ogg", "OGG audio"),
    FileSignature(b"\x1a\x45\xdf\xa3", 0, "video/webm", "04_Video", ".webm", "WebM/MKV video"),
    FileSignature(b"\x00\x00\x00\x1c\x66\x74\x79\x70", 0, "video/mp4", "04_Video", ".mp4", "MP4 video"),
    FileSignature(b"\x00\x00\x00\x20\x66\x74\x79\x70", 0, "video/mp4", "04_Video", ".mp4", "MP4 video"),
    FileSignature(b"\x00\x00\x00\x18\x66\x74\x79\x70", 0, "video/mp4", "04_Video", ".mp4", "MP4 video"),
    FileSignature(b"PK\x03\x04", 0, "application/zip", "05_Archives", ".zip", "ZIP archive"),
    FileSignature(b"Rar!\x1a\x07", 0, "application/x-rar", "05_Archives", ".rar", "RAR archive"),
    FileSignature(b"\x37\x7a\xbc\xaf\x27\x1c", 0, "application/x-7z", "05_Archives", ".7z", "7-Zip archive"),
    FileSignature(b"\x1f\x8b", 0, "application/gzip", "05_Archives", ".gz", "Gzip archive"),
    FileSignature(b"\x42\x5a\x68", 0, "application/x-bzip2", "05_Archives", ".bz2", "Bzip2 archive"),
    FileSignature(b"\xfd\x37\x7a\x58\x5a\x00", 0, "application/x-xz", "05_Archives", ".xz", "XZ archive"),
    FileSignature(b"MZ", 0, "application/x-executable", "07_Executables", ".exe", "Windows executable"),
    FileSignature(b"SQLite format 3\x00", 0, "application/x-sqlite3", "10_Databases", ".sqlite", "SQLite database"),
    FileSignature(b"\x00\x01\x00\x00", 0, "font/ttf", "08_Fonts", ".ttf", "TrueType font"),
    FileSignature(b"OTTO", 0, "font/otf", "08_Fonts", ".otf", "OpenType font"),
    FileSignature(b"wOFF", 0, "font/woff", "08_Fonts", ".woff", "WOFF font"),
    FileSignature(b"wOF2", 0, "font/woff2", "08_Fonts", ".woff2", "WOFF2 font"),
]


@dataclass
class ContentInfo:
    detected_type: Optional[str] = None
    detected_category: Optional[str] = None
    detected_extension: Optional[str] = None
    description: Optional[str] = None
    extension_mismatch: bool = False
    metadata: dict = field(default_factory=dict)
    suggested_name: Optional[str] = None


def detect_file_type(filepath: Path) -> Optional[FileSignature]:
    try:
        with open(filepath, "rb") as f:
            header = f.read(64)
    except (PermissionError, OSError):
        return None
    if len(header) < 2:
        return None
    for sig in SIGNATURES:
        end = sig.offset + len(sig.magic)
        if len(header) >= end and header[sig.offset:end] == sig.magic:
            if sig.magic == b"RIFF" and len(header) >= 12:
                sub_type = header[8:12]
                if sub_type == b"WAVE":
                    return FileSignature(b"RIFF", 0, "audio/wav", "03_Audio", ".wav", "WAV audio")
                elif sub_type == b"AVI ":
                    return FileSignature(b"RIFF", 0, "video/avi", "04_Video", ".avi", "AVI video")
                elif sub_type == b"WEBP":
                    return FileSignature(b"RIFF", 0, "image/webp", "02_Images", ".webp", "WebP image")
                return None
            if b"ftyp" in sig.magic or (len(header) >= 12 and header[4:8] == b"ftyp"):
                ftyp_brand = header[8:12] if len(header) >= 12 else b""
                if ftyp_brand in (b"M4A ", b"M4A\x00"):
                    return FileSignature(sig.magic, 0, "audio/mp4", "03_Audio", ".m4a", "M4A audio")
                elif ftyp_brand in (b"qt  ",):
                    return FileSignature(sig.magic, 0, "video/quicktime", "04_Video", ".mov", "QuickTime video")
            return sig
    for offset in range(4, min(32, len(header) - 4)):
        if header[offset:offset + 4] == b"ftyp":
            brand = header[offset + 4:offset + 8] if len(header) >= offset + 8 else b""
            if brand in (b"M4A ", b"M4A\x00"):
                return FileSignature(b"ftyp", offset, "audio/mp4", "03_Audio", ".m4a", "M4A audio")
            return FileSignature(b"ftyp", offset, "video/mp4", "04_Video", ".mp4", "MP4 video")
    return None


def _is_zip_based_office(filepath: Path) -> Optional[FileSignature]:
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


def extract_pdf_metadata(filepath: Path) -> dict:
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            content = f.read(min(65536, filepath.stat().st_size))
        text = content.decode("latin-1", errors="ignore")
        for key, field_name in [("/Title", "title"), ("/Author", "author"), ("/Subject", "subject"), ("/Creator", "creator"), ("/Producer", "producer"), ("/CreationDate", "created")]:
            idx = text.find(key)
            if idx == -1:
                continue
            rest = text[idx + len(key):]
            paren_start = rest.find("(")
            if paren_start != -1 and paren_start < 50:
                paren_end = rest.find(")", paren_start)
                if paren_end != -1:
                    value = rest[paren_start + 1:paren_end].strip()
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
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            if f.read(2) != b"\xff\xd8":
                return metadata
            while True:
                marker = f.read(2)
                if len(marker) < 2 or marker[0] != 0xff:
                    break
                if marker[1] == 0xe1:
                    length = struct.unpack(">H", f.read(2))[0]
                    data = f.read(length - 2)
                    if data[:6] == b"Exif\x00\x00":
                        _parse_exif(data[6:], metadata)
                    break
                elif marker[1] in (0xd9, 0xda):
                    break
                else:
                    length = struct.unpack(">H", f.read(2))[0]
                    f.seek(length - 2, 1)
    except (PermissionError, OSError, struct.error):
        pass
    return metadata


def _parse_exif(data: bytes, metadata: dict) -> None:
    if len(data) < 8:
        return
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
        for i in range(min(num_entries, 50)):
            entry_offset = ifd_offset + 2 + i * 12
            if entry_offset + 12 > len(data):
                break
            tag = struct.unpack(endian + "H", data[entry_offset:entry_offset + 2])[0]
            dtype = struct.unpack(endian + "H", data[entry_offset + 2:entry_offset + 4])[0]
            count = struct.unpack(endian + "I", data[entry_offset + 4:entry_offset + 8])[0]
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
                if tag == 0x010F:
                    metadata["camera_make"] = text
                elif tag == 0x0110:
                    metadata["camera_model"] = text
                elif tag == 0x0132:
                    metadata["date_taken"] = text
                elif tag == 0x010E:
                    metadata["description"] = text
    except (struct.error, IndexError):
        pass


def extract_id3_metadata(filepath: Path) -> dict:
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            header = f.read(10)
            if header[:3] != b"ID3":
                return _extract_id3v1(filepath)
            major_ver = header[3]
            size_bytes = header[6:10]
            tag_size = ((size_bytes[0] & 0x7f) << 21 | (size_bytes[1] & 0x7f) << 14 | (size_bytes[2] & 0x7f) << 7 | (size_bytes[3] & 0x7f))
            tag_data = f.read(min(tag_size, 65536))
            pos = 0
            while pos < len(tag_data) - 10:
                if major_ver >= 3:
                    frame_id = tag_data[pos:pos + 4].decode("ascii", errors="ignore")
                    frame_size = struct.unpack(">I", tag_data[pos + 4:pos + 8])[0]
                    pos += 10
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
                text = _decode_id3_text(frame_data)
                if not text:
                    continue
                frame_map = {"TIT2": "title", "TT2": "title", "TPE1": "artist", "TP1": "artist", "TALB": "album", "TAL": "album", "TYER": "year", "TYE": "year", "TDRC": "year", "TRCK": "track", "TRK": "track", "TCON": "genre", "TCO": "genre"}
                if frame_id in frame_map:
                    metadata[frame_map[frame_id]] = text
    except (PermissionError, OSError, struct.error):
        pass
    return metadata


def _extract_id3v1(filepath: Path) -> dict:
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
            if title: metadata["title"] = title
            if artist: metadata["artist"] = artist
            if album: metadata["album"] = album
            if year: metadata["year"] = year
    except (PermissionError, OSError):
        pass
    return metadata


def _decode_id3_text(data: bytes) -> Optional[str]:
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
    metadata = {}
    try:
        with zipfile.ZipFile(filepath, "r") as zf:
            if "docProps/core.xml" in zf.namelist():
                xml_data = zf.read("docProps/core.xml")
                root = ET.fromstring(xml_data)
                ns = {"dc": "http://purl.org/dc/elements/1.1/", "cp": "http://schemas.openxmlformats.org/package/2006/metadata/core-properties", "dcterms": "http://purl.org/dc/terms/"}
                for xpath, key in [("dc:title", "title"), ("dc:creator", "author"), ("dc:subject", "subject"), ("dc:description", "description"), ("cp:lastModifiedBy", "last_modified_by"), ("dcterms:created", "created"), ("dcterms:modified", "modified")]:
                    elem = root.find(xpath, ns)
                    if elem is not None and elem.text and elem.text.strip():
                        metadata[key] = elem.text.strip()
    except (zipfile.BadZipFile, ET.ParseError, OSError):
        pass
    return metadata


def analyze_file(filepath: Path) -> ContentInfo:
    info = ContentInfo()
    current_ext = filepath.suffix.lower()
    sig = detect_file_type(filepath)
    if sig is not None:
        if sig.mime == "application/zip":
            office_sig = _is_zip_based_office(filepath)
            if office_sig:
                sig = office_sig
        info.detected_type = sig.mime
        info.detected_category = sig.category
        info.detected_extension = sig.extension
        info.description = sig.description
        if current_ext and current_ext != sig.extension:
            equivalents = {".jpg": {".jpeg"}, ".jpeg": {".jpg"}, ".tif": {".tiff"}, ".tiff": {".tif"}, ".htm": {".html"}, ".html": {".htm"}, ".mpg": {".mpeg"}, ".mpeg": {".mpg"}}
            allowed = equivalents.get(sig.extension, set())
            if current_ext not in allowed:
                info.extension_mismatch = True
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
        info.metadata = extract_office_metadata(filepath)
    info.suggested_name = _build_suggested_name(info, filepath)
    return info


def _build_suggested_name(info: ContentInfo, filepath: Path) -> Optional[str]:
    meta = info.metadata
    if not meta:
        return None
    parts = []
    if info.detected_category == "03_Audio" or filepath.suffix.lower() in (".mp3", ".flac", ".m4a", ".ogg", ".wav"):
        artist = meta.get("artist", "")
        title = meta.get("title", "")
        track = meta.get("track", "")
        if artist and title:
            if track:
                track_num = track.split("/")[0].zfill(2)
                parts = [artist, f"{track_num} {title}"]
            else:
                parts = [artist, title]
        elif title:
            parts = [title]
    elif info.detected_category == "02_Images" or filepath.suffix.lower() in (".jpg", ".jpeg", ".png", ".tiff"):
        date = meta.get("date_taken", "")
        desc = meta.get("description", "")
        if date:
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
    elif info.detected_category == "01_Documents" or filepath.suffix.lower() in (".pdf", ".docx", ".xlsx", ".pptx"):
        title = meta.get("title", "")
        if title and len(title) > 3:
            parts = [title]
    if not parts:
        return None
    return " - ".join(parts)


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT TEXT EXTRACTION — reads actual text from inside documents
# ═══════════════════════════════════════════════════════════════════════════════

# Extensions we can extract text from
EXTRACTABLE_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".xls", ".xlsx",
    ".csv", ".ppt", ".pptx", ".odp", ".ods", ".md", ".log",
}


def extract_pdf_text(filepath: Path, max_bytes: int = 200000) -> str:
    """Extract readable text from a PDF by decompressing streams and scanning."""
    text_parts = []
    try:
        with open(filepath, "rb") as f:
            raw = f.read(max_bytes)

        # Method 1: Decompress PDF streams (most PDFs use FlateDecode)
        pos = 0
        while True:
            idx = raw.find(b"stream", pos)
            if idx == -1:
                break
            # Skip past "stream\r\n" or "stream\n"
            after = idx + 6
            if after < len(raw) and raw[after:after + 1] == b"\r":
                after += 1
            if after < len(raw) and raw[after:after + 1] == b"\n":
                after += 1
            end_idx = raw.find(b"endstream", after)
            if end_idx == -1:
                break
            stream_data = raw[after:end_idx]
            try:
                decompressed = zlib.decompress(stream_data)
                # Extract text between BT and ET (PDF text blocks)
                bt_pos = 0
                while True:
                    bt = decompressed.find(b"BT", bt_pos)
                    if bt == -1:
                        break
                    et = decompressed.find(b"ET", bt)
                    if et == -1:
                        break
                    text_block = decompressed[bt:et]
                    # Get strings in parentheses (Tj/TJ operators)
                    for match in re.finditer(rb'\(([^)]*)\)', text_block):
                        try:
                            text_parts.append(match.group(1).decode("utf-8", errors="ignore"))
                        except Exception:
                            pass
                    # Get hex strings
                    for match in re.finditer(rb'<([0-9a-fA-F]{4,})>', text_block):
                        try:
                            hex_str = match.group(1).decode("ascii")
                            if len(hex_str) % 2 == 0:
                                text_parts.append(bytes.fromhex(hex_str).decode("utf-16-be", errors="ignore"))
                        except Exception:
                            pass
                    bt_pos = et + 2
            except zlib.error:
                pass
            pos = end_idx + 9

        # Method 2: Scan for uncompressed text (Tj operator)
        decoded = raw.decode("latin-1", errors="ignore")
        for match in re.finditer(r'\(([^)]{2,})\)\s*Tj', decoded):
            text_parts.append(match.group(1))

        # Method 3: Find readable ASCII sequences (catches text in any encoding)
        for match in re.finditer(rb'[A-Za-z][A-Za-z ]{4,}', raw):
            word = match.group().decode("ascii", errors="ignore")
            text_parts.append(word)

    except (PermissionError, OSError):
        pass
    return " ".join(text_parts)


def extract_docx_text(filepath: Path, max_chars: int = 100000) -> str:
    """Extract text from a DOCX file by reading word/document.xml."""
    try:
        with zipfile.ZipFile(filepath, "r") as zf:
            if "word/document.xml" in zf.namelist():
                xml_data = zf.read("word/document.xml")
                text = re.sub(rb'<[^>]+>', b' ', xml_data)
                decoded = text.decode("utf-8", errors="ignore")
                decoded = re.sub(r'\s+', ' ', decoded).strip()
                return decoded[:max_chars]
    except (zipfile.BadZipFile, OSError):
        pass
    return ""


def extract_xlsx_text(filepath: Path, max_chars: int = 100000) -> str:
    """Extract text from an XLSX file by reading shared strings and sheets."""
    text_parts = []
    try:
        with zipfile.ZipFile(filepath, "r") as zf:
            if "xl/sharedStrings.xml" in zf.namelist():
                xml_data = zf.read("xl/sharedStrings.xml")
                root = ET.fromstring(xml_data)
                ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                for si in root.findall(".//s:t", ns):
                    if si.text:
                        text_parts.append(si.text)
                        if sum(len(t) for t in text_parts) > max_chars:
                            break
            # Also check inline strings in sheets
            for name in zf.namelist():
                if name.startswith("xl/worksheets/") and name.endswith(".xml"):
                    try:
                        sheet_data = zf.read(name)
                        sheet_root = ET.fromstring(sheet_data)
                        ns2 = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                        for t_elem in sheet_root.findall(".//s:is/s:t", ns2):
                            if t_elem.text:
                                text_parts.append(t_elem.text)
                    except (ET.ParseError, OSError):
                        pass
                    if sum(len(t) for t in text_parts) > max_chars:
                        break
    except (zipfile.BadZipFile, ET.ParseError, OSError):
        pass
    return " ".join(text_parts)


def extract_pptx_text(filepath: Path, max_chars: int = 100000) -> str:
    """Extract text from a PPTX file by reading slide XML."""
    text_parts = []
    try:
        with zipfile.ZipFile(filepath, "r") as zf:
            for name in sorted(zf.namelist()):
                if name.startswith("ppt/slides/slide") and name.endswith(".xml"):
                    try:
                        slide_data = zf.read(name)
                        text = re.sub(rb'<[^>]+>', b' ', slide_data)
                        decoded = text.decode("utf-8", errors="ignore")
                        decoded = re.sub(r'\s+', ' ', decoded).strip()
                        text_parts.append(decoded)
                    except (ET.ParseError, OSError):
                        pass
                    if sum(len(t) for t in text_parts) > max_chars:
                        break
    except (zipfile.BadZipFile, OSError):
        pass
    return " ".join(text_parts)


def extract_document_text(filepath: Path) -> str:
    """Extract text content from a document file based on its extension.

    Supports: PDF, DOCX, XLSX, PPTX, TXT, CSV, RTF, DOC (legacy), XLS (legacy).
    Returns empty string if unsupported or extraction fails.
    """
    ext = filepath.suffix.lower()
    if ext == ".pdf":
        return extract_pdf_text(filepath)
    elif ext == ".docx":
        return extract_docx_text(filepath)
    elif ext == ".xlsx":
        return extract_xlsx_text(filepath)
    elif ext == ".pptx":
        return extract_pptx_text(filepath)
    elif ext in (".txt", ".csv", ".rtf", ".md", ".log"):
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                return f.read(100000)
        except (PermissionError, OSError):
            return ""
    elif ext in (".doc", ".xls", ".ppt"):
        # Legacy Office: extract readable ASCII strings from binary
        try:
            with open(filepath, "rb") as f:
                raw = f.read(200000)
            parts = []
            for match in re.finditer(rb'[A-Za-z][A-Za-z ]{3,}', raw):
                parts.append(match.group().decode("ascii", errors="ignore"))
            return " ".join(parts)
        except (PermissionError, OSError):
            return ""
    return ""


def extract_texts_for_entries(files: list) -> int:
    """Extract text content for all document-type files in the list.

    Populates each FileEntry.text_content in-place.
    Returns the count of files whose text was extracted.
    """
    count = 0
    doc_files = [f for f in files if f.extension.lower() in EXTRACTABLE_EXTENSIONS
                 or f.category == "01_Documents"]
    total = len(doc_files)
    for i, entry in enumerate(doc_files, 1):
        if total > 20 and (i == 1 or i % 50 == 0 or i == total):
            print(f"  Reading document {i}/{total}...")
        entry.text_content = extract_document_text(entry.path)
        if entry.text_content:
            count += 1
    return count


# ═══════════════════════════════════════════════════════════════════════════════
# SCANNER
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class FileEntry:
    path: Path
    name: str
    stem: str
    extension: str
    size: int
    category: str
    parent: Path
    content_info: Optional[ContentInfo] = None
    real_category: Optional[str] = None
    real_extension: Optional[str] = None
    extension_mismatch: bool = False
    suggested_name: Optional[str] = None
    text_content: str = ""

    @classmethod
    def from_path(cls, filepath: Path, category: str, deep_scan: bool = False) -> "FileEntry":
        stat = filepath.stat()
        entry = cls(path=filepath, name=filepath.name, stem=filepath.stem, extension=filepath.suffix.lower(), size=stat.st_size, category=category, parent=filepath.parent)
        if deep_scan:
            entry.content_info = analyze_file(filepath)
            ci = entry.content_info
            if ci.detected_category:
                entry.real_category = ci.detected_category
                entry.category = ci.detected_category
            if ci.detected_extension:
                entry.real_extension = ci.detected_extension
            entry.extension_mismatch = ci.extension_mismatch
            entry.suggested_name = ci.suggested_name
        return entry


@dataclass
class ScanResult:
    root: Path
    files: list[FileEntry] = field(default_factory=list)
    skipped: list[Path] = field(default_factory=list)
    errors: list[tuple[Path, str]] = field(default_factory=list)
    total_size: int = 0

    @property
    def by_category(self) -> dict[str, list[FileEntry]]:
        groups: dict[str, list[FileEntry]] = {}
        for f in self.files:
            groups.setdefault(f.category, []).append(f)
        return groups

    @property
    def mismatched_files(self) -> list[FileEntry]:
        return [f for f in self.files if f.extension_mismatch]

    @property
    def files_with_metadata(self) -> list[FileEntry]:
        return [f for f in self.files if f.suggested_name]

    def summary(self) -> str:
        lines = [f"Scanned: {self.root}", f"Total files: {len(self.files)}", f"Total size: {_fmt_size(self.total_size)}", f"Skipped: {len(self.skipped)}", f"Errors: {len(self.errors)}", ""]
        for cat, entries in sorted(self.by_category.items()):
            cat_size = sum(e.size for e in entries)
            lines.append(f"  {cat}: {len(entries)} files ({_fmt_size(cat_size)})")
        mismatched = self.mismatched_files
        if mismatched:
            lines.append(f"\nExtension mismatches found: {len(mismatched)}")
            for f in mismatched[:10]:
                lines.append(f"  {f.name}: extension is {f.extension}, content is actually {f.real_extension} ({f.content_info.description})")
            if len(mismatched) > 10:
                lines.append(f"  ... and {len(mismatched) - 10} more")
        with_meta = self.files_with_metadata
        if with_meta:
            lines.append(f"\nFiles with extractable metadata: {len(with_meta)}")
            for f in with_meta[:10]:
                lines.append(f"  {f.name} -> suggested: {f.suggested_name}")
            if len(with_meta) > 10:
                lines.append(f"  ... and {len(with_meta) - 10} more")
        return "\n".join(lines)


def _fmt_size(nbytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if nbytes < 1024:
            return f"{nbytes:.1f} {unit}"
        nbytes /= 1024
    return f"{nbytes:.1f} PB"


def build_extension_map(categories=None) -> dict[str, str]:
    cats = categories or DEFAULT_CATEGORIES
    ext_map: dict[str, str] = {}
    for category, extensions in cats.items():
        for ext in extensions:
            ext_map[ext.lower()] = category
    return ext_map


def scan_directory(root, categories=None, recursive=True, skip_dirs=None, skip_files=None, deep_scan=False) -> ScanResult:
    root = Path(root).resolve()
    ext_map = build_extension_map(categories)
    result = ScanResult(root=root)
    _skip_dirs = skip_dirs or SKIP_DIRECTORIES
    _skip_files = skip_files or SKIP_FILES
    if not root.is_dir():
        result.errors.append((root, "Not a directory"))
        return result
    walker = os.walk(root, topdown=True)
    for dirpath, dirnames, filenames in walker:
        dirnames[:] = [d for d in dirnames if d.lower() not in {s.lower() for s in _skip_dirs}]
        if not recursive and Path(dirpath) != root:
            dirnames.clear()
            continue
        for fname in filenames:
            if fname.lower() in {s.lower() for s in _skip_files}:
                result.skipped.append(Path(dirpath) / fname)
                continue
            filepath = Path(dirpath) / fname
            try:
                ext = filepath.suffix.lower()
                category = ext_map.get(ext, "Other")
                entry = FileEntry.from_path(filepath, category, deep_scan=deep_scan)
                result.files.append(entry)
                result.total_size += entry.size
            except PermissionError:
                result.errors.append((filepath, "Permission denied"))
            except OSError as exc:
                result.errors.append((filepath, str(exc)))
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# RENAMER
# ═══════════════════════════════════════════════════════════════════════════════

_DATE_PATTERNS = [
    re.compile(r"(20\d{2})[_\-]?([01]\d)[_\-]?([0-3]\d)"),
    re.compile(r"([01]\d)[_\-]?([0-3]\d)[_\-]?(20\d{2})"),
    re.compile(r"(20\d{2})[_\-]?([01]\d)(?!\d)"),
]
_VERSION_PATTERN = re.compile(r"[_\-\s]?v(?:er(?:sion)?)?[_\-\s.]?(\d+(?:\.\d+)?)", re.IGNORECASE)


@dataclass
class RenameAction:
    original: Path
    new_path: Path
    reason: str

    @property
    def changed(self) -> bool:
        return self.original != self.new_path


def _extract_existing_date(name: str) -> tuple[str | None, str]:
    for pattern in _DATE_PATTERNS:
        m = pattern.search(name)
        if m:
            groups = m.groups()
            if len(groups) == 3:
                if len(groups[2]) == 4:
                    date_str = f"{groups[2]}{groups[0]}{groups[1]}"
                else:
                    date_str = f"{groups[0]}{groups[1]}{groups[2]}"
                cleaned = name[:m.start()] + name[m.end():]
                return date_str, cleaned
            elif len(groups) == 2:
                date_str = f"{groups[0]}{groups[1]}"
                cleaned = name[:m.start()] + name[m.end():]
                return date_str, cleaned
    return None, name


def _extract_existing_version(name: str) -> tuple[str | None, str]:
    m = _VERSION_PATTERN.search(name)
    if m:
        ver_num = m.group(1)
        if "." in ver_num:
            version = f"v{ver_num}"
        else:
            version = f"v{int(ver_num):02d}"
        cleaned = name[:m.start()] + name[m.end():]
        return version, cleaned
    return None, name


def _get_file_date(filepath: Path) -> str:
    """Get the file's modification date in YYYYMMDD format (converted to MMDDYYYY later)."""
    try:
        mtime = os.path.getmtime(filepath)
        dt = datetime.fromtimestamp(mtime, tz=timezone.utc)
        return dt.strftime("%Y%m%d")
    except OSError:
        return datetime.now(timezone.utc).strftime("%Y%m%d")


def _to_mmddyyyy(yyyymmdd: str) -> str:
    """Convert YYYYMMDD to MMDDYYYY."""
    if len(yyyymmdd) == 8:
        return yyyymmdd[4:6] + yyyymmdd[6:8] + yyyymmdd[:4]
    elif len(yyyymmdd) == 6:
        return yyyymmdd[4:6] + yyyymmdd[:4]
    return yyyymmdd


def _clean_stem(name: str, rules: dict) -> str:
    word_sep = rules.get("word_separator", "-")
    stem = unicodedata.normalize("NFKD", name)
    stem = stem.encode("ascii", "ignore").decode("ascii")
    for ch in WINDOWS_INVALID_CHARS:
        stem = stem.replace(ch, "")
    for ch in rules.get("strip_characters", ""):
        stem = stem.replace(ch, "")
    stem = stem.replace(" ", word_sep).replace("\t", word_sep).replace("_", word_sep)
    if rules.get("lowercase", True):
        stem = stem.lower()
    if rules.get("collapse_separators", True) and word_sep:
        stem = re.sub(re.escape(word_sep) + r"{2,}", word_sep, stem)
    if rules.get("strip_edge_separators", True) and word_sep:
        stem = stem.strip(word_sep)
    return stem


def normalize_filename(name, extension, rules=None, filepath=None, category=None, brand=None) -> str:
    """Build filename in format: mmddyyyy_Company_DocumentType.ext

    - Date: MMDDYYYY from the file or original filename
    - Company: brand/company name (if detected), hyphens for spaces
    - DocumentType: cleaned descriptor from the original filename
    """
    r = rules or NAMING_RULES
    if r.get("lowercase", True):
        extension = extension.lower()
    date_str, name_no_date = _extract_existing_date(name)
    version_str, name_cleaned = _extract_existing_version(name_no_date)
    descriptor = _clean_stem(name_cleaned, r)
    descriptor = re.sub(r"^(img|dsc|dscn|dscf|sam|p|wp|imag)\b-?", "", descriptor)
    descriptor = descriptor.strip("-")
    if not date_str and filepath:
        date_str = _get_file_date(filepath)
    # Convert date to MMDDYYYY
    if date_str:
        date_str = _to_mmddyyyy(date_str)
    # Clean company name for filename (spaces -> hyphens, strip parens)
    company = ""
    if brand:
        company = brand.replace(" ", "-").replace("(", "").replace(")", "")
        if r.get("lowercase", True):
            company = company.lower()
        # Remove brand words from the descriptor to avoid duplication
        # e.g. "uber-ride-receipt" -> "ride-receipt" when brand is "Uber"
        brand_words = brand.lower().replace("-", " ").replace("(", "").replace(")", "").split()
        for bw in brand_words:
            descriptor = re.sub(r'\b' + re.escape(bw) + r'\b-?', '', descriptor)
        descriptor = re.sub(r'-{2,}', '-', descriptor).strip('-')
    # Build: mmddyyyy_Company_DocumentType
    parts = []
    if date_str:
        parts.append(date_str)
    if company:
        parts.append(company)
    if descriptor:
        parts.append(descriptor)
    if version_str:
        parts.append(version_str)
    stem = "_".join(parts)
    max_len = r.get("max_filename_length", 80)
    if len(stem) > max_len:
        stem = stem[:max_len].rstrip("-").rstrip("_")
    if stem.upper() in WINDOWS_RESERVED_NAMES:
        stem = f"{stem}_file"
    if not stem:
        stem = date_str if date_str else "unnamed"
    return f"{stem}{extension}"


# ═══════════════════════════════════════════════════════════════════════════════
# SUBCATEGORY DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

# Keywords mapped to subfolder names within each major category.
# Checked against the ORIGINAL filename (case-insensitive).
DOCUMENT_SUBCATEGORIES = [
    ("Tax", ["w2", "w-2", "1095", "1099", "k-1", "k1", "tax return", "taxreturn", "tax_return", "irs", "1040", "w4", "w-4", "1098"]),
    ("Contracts", ["contract", "agreement", "scope of work", "sow", "engagement letter", "msa", "nda", "confidentiality"]),
    ("Leases", ["lease", "sublease", "tenant", "landlord", "rent roll", "rental", "occupancy"]),
    ("Financial", ["financial", "financials", "ledger", "aging", "invoice", "receipt", "payment", "budget", "p&l", "profit", "loss", "balance sheet", "income statement", "bank statement", "statement of", "accounts payable", "accounts receivable", "journal entry"]),
    ("Investment", ["investment", "investor", "k-1", "k1", "capital call", "distribution", "offering memo", "ppm", "subscription"]),
    ("Insurance", ["insurance", "policy", "certificate of", "coi", "coverage", "claim", "liability"]),
    ("Legal", ["amendment", "addendum", "resolution", "articles of", "operating agreement", "bylaws", "litigation", "complaint", "settlement", "notice of", "lien", "title report", "escrow"]),
    ("Correspondence", ["letter", "communication", "memo", "notice", "announcement"]),
    ("Reports", ["report", "summary", "analysis", "appraisal", "inspection", "assessment", "review", "audit"]),
    ("Presentations", ["presentation", "pitch", "deck", "proposal"]),
    ("Spreadsheets", [".xlsx", ".xls", ".csv"]),
]

IMAGE_SUBCATEGORIES = [
    ("Screenshots", ["screenshot", "screen shot", "snip", "capture"]),
    ("Photos", ["photo", "img_", "dsc_", "dscn", "pic_", "camera"]),
]

ARCHIVE_SUBCATEGORIES = [
    ("Backups", ["backup", "bak", "archive"]),
]


def _detect_subcategory(filename: str, extension: str, category: str) -> Optional[str]:
    """Determine a subfolder within the main category based on filename keywords."""
    name_lower = filename.lower()
    ext_lower = extension.lower()

    if category == "01_Documents":
        for subfolder, keywords in DOCUMENT_SUBCATEGORIES:
            for kw in keywords:
                if kw.startswith("."):
                    if ext_lower == kw:
                        return subfolder
                elif kw in name_lower:
                    return subfolder
        return "General"

    elif category == "02_Images":
        for subfolder, keywords in IMAGE_SUBCATEGORIES:
            for kw in keywords:
                if kw in name_lower:
                    return subfolder
        return "Photos"

    elif category == "03_Audio":
        return "Music"

    elif category == "04_Video":
        return "Clips"

    elif category == "05_Archives":
        for subfolder, keywords in ARCHIVE_SUBCATEGORIES:
            for kw in keywords:
                if kw in name_lower:
                    return subfolder
        return "Downloads"

    elif category == "07_Executables":
        return "Installers"

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# SMART BRAND / COMPANY DETECTION
# ═══════════════════════════════════════════════════════════════════════════════
#
# The system detects companies/brands in TWO ways:
#
# 1. KNOWN BRANDS (checked first — guaranteed matches)
#    Add a line to BRAND_FOLDERS for any company you always want matched.
#
# 2. AUTO-DETECTION (kicks in when no known brand matches)
#    Reads document text and automatically finds company names by looking for:
#    - Business entities: "Something LLC", "Something Inc", "Something Corp"
#    - Sender patterns: "From: Company", "Issued by: Company"
#    - Email domains: @companyname.com
#    - Prominent capitalized names in the document header
#
# Each detected company gets its own folder with subfolders inside.
#
BRAND_FOLDERS = [
    # Company / brand               Keywords to look for
    #
    # ORDER MATTERS — more specific brands must come BEFORE general ones.
    # e.g. "SpringHill Suites" before "Marriott", "Silva Operations" before "Silva"
    #
    # --- Silva ---
    ("Silva Operations",            ["silva operations llc", "silva operations", "silva ops"]),
    # --- Airlines ---
    ("Delta Airlines",              ["delta airlines", "delta air lines", "delta skymiles", "delta sky miles"]),
    # --- Ride share ---
    ("Uber",                        ["uber technologies", "uber eats", "uber trip", "uber receipt", "uber.com", "uber"]),
    # --- Hotels & Resorts (specific sub-brands BEFORE parent brand) ---
    ("Aman",                        ["aman resorts", "aman hotels", "amanresorts", "aman.com", "aman"]),
    ("Montage",                     ["montage hotels", "montage resorts", "montage international", "montagehotels", "montage"]),
    ("SpringHill Suites",           ["springhill suites by marriott", "springhill suites"]),
    ("Residence Inn",               ["residence inn by marriott", "residence inn"]),
    ("Courtyard",                   ["courtyard by marriott", "courtyard marriott", "courtyard"]),
    ("Marriott",                    ["marriott international", "marriott bonvoy", "marriott.com", "marriott"]),
    # --- Car Rental ---
    ("Hertz",                       ["hertz corporation", "hertz rental", "hertz.com", "hertz"]),
    # --- Personal catch-all — checked LAST (matches any "Silva" not caught above) ---
    ("Personal (Silva)",            ["silva"]),
]

# Common English words to filter out of entity extraction
_COMMON_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "have", "has", "had", "do", "does", "did", "will", "would",
    "shall", "should", "may", "might", "can", "could", "must", "not", "no",
    "this", "that", "these", "those", "it", "its", "my", "your", "our",
    "their", "his", "her", "all", "each", "every", "any", "some", "new",
    "dear", "sincerely", "regards", "thank", "thanks", "please", "hello",
    "hi", "note", "notes", "untitled", "document", "file", "page", "copy",
    "draft", "final", "subject", "date", "total", "amount", "balance",
    "scan", "scanned", "signed", "unsigned", "attached", "enclosed",
}

# Generic email domains to ignore
_GENERIC_DOMAINS = {
    "gmail", "yahoo", "outlook", "hotmail", "aol", "icloud", "protonmail",
    "mail", "email", "live", "msn", "me", "ymail", "inbox", "zoho",
    "fastmail", "tutanota", "pm", "hey",
}

# Pattern: "Company Name LLC/Inc/Corp/etc."
_ENTITY_SUFFIX_RE = re.compile(
    r'\b([A-Z][A-Za-z0-9\s&\'\-\.]{1,45}?)\s+'
    r'(LLC|L\.?L\.?C\.?|Inc\.?|Incorporated|Corp\.?|Corporation|'
    r'Ltd\.?|Limited|Co\.?|Company|Associates|Group|Partners|'
    r'LLP|L\.?L\.?P\.?|LP|L\.?P\.?|PC|P\.?C\.?|PLLC|P\.?L\.?L\.?C\.?)\b'
)

# Pattern: "From: / Issued by: / Billed by: Company Name"
# Uses [A-Za-z0-9 &'-] (space, not \s) so it stops at newlines
_SENDER_RE = re.compile(
    r'(?:from|issued\s+by|billed\s+by|prepared\s+by|sent\s+by|'
    r"provided\s+by|prepared\s+for|bill\s+from|invoice\s+from)\s*"
    r":?\s*([A-Z][A-Za-z0-9 &'\-.]{2,45}?)(?:\s*[,;\n]|\s+for\s|\s+regarding|\s*$)",
    re.IGNORECASE
)

# Pattern: email domain
_EMAIL_DOMAIN_RE = re.compile(r'@([a-zA-Z0-9\-]+)\.(com|org|net|io|co|us|biz)')


def _clean_entity_name(name: str) -> str:
    """Clean up an extracted entity name for use as a folder name."""
    # Strip common leading words that got accidentally captured
    _leading = (r'^(?:the|a|an|and|or|but|in|on|at|to|for|of|with|by|from|as|'
                r'is|was|invoice|receipt|bill|statement|prepared|billed|issued|'
                r'sent|provided|dear|re|subject|your|our|this|that)\s+')
    name = re.sub(_leading, '', name, flags=re.IGNORECASE)
    name = re.sub(_leading, '', name, flags=re.IGNORECASE)  # repeat for chains
    name = re.sub(r'\s+', ' ', name).strip()
    name = name.strip('.,;:-')
    # Title case
    name = name.title()
    # Fix common capitalizations
    for fix_from, fix_to in [("Llc", "LLC"), ("Llp", "LLP"), ("Pc", "PC"),
                              ("'S", "'s"), ("Jpmorgan", "JPMorgan")]:
        name = name.replace(fix_from, fix_to)
    return name


def _is_valid_entity(name: str) -> bool:
    """Check if an extracted name is a real entity, not just common words."""
    if not name or len(name) < 2 or len(name) > 50:
        return False
    words = name.lower().split()
    meaningful = [w for w in words if w not in _COMMON_WORDS and len(w) > 1]
    return len(meaningful) > 0


def _auto_detect_entity(text_content: str) -> Optional[str]:
    """Auto-detect the primary company/entity a document is FROM.

    Reads the document text and looks for:
    1. Sender patterns ("From:", "Billed by:", etc.)
    2. Business entity suffixes (LLC, Inc, Corp, etc.)
    3. Email domains (@companyname.com)

    Prioritizes the document header (first ~2000 chars) since the
    issuing company usually appears at the top.
    """
    if not text_content or len(text_content) < 20:
        return None

    header = text_content[:2000]

    # 1. Look for "Company LLC/Inc/Corp" in header (most reliable signal)
    m = _ENTITY_SUFFIX_RE.search(header)
    if m:
        name = _clean_entity_name(m.group(1))
        if _is_valid_entity(name):
            return name

    # 2. Look for "From: Company" or "Billed by: Company" in header
    m = _SENDER_RE.search(header)
    if m:
        name = _clean_entity_name(m.group(1))
        if _is_valid_entity(name):
            return name

    # 3. Check full text for entity suffixes — take the most common
    entities: dict[str, int] = {}
    for m in _ENTITY_SUFFIX_RE.finditer(text_content):
        name = _clean_entity_name(m.group(1))
        if _is_valid_entity(name):
            entities[name] = entities.get(name, 0) + 1

    if entities:
        return max(entities, key=entities.get)

    # 4. Check email domains (last resort)
    for m in _EMAIL_DOMAIN_RE.finditer(text_content.lower()):
        domain = m.group(1)
        if domain not in _GENERIC_DOMAINS and len(domain) > 2:
            return domain.replace('-', ' ').title()

    return None


def _detect_brand(filename: str, text_content: str) -> Optional[str]:
    """Classify a file into a company/brand folder.

    Step 1: Check known brands from BRAND_FOLDERS (guaranteed matches).
    Step 2: Auto-detect entity from document text (LLC, Inc, sender, email).
    Returns the folder name or None.
    """
    combined = (filename + " " + text_content).lower()
    normalized = combined.replace("_", " ").replace("-", " ")

    # Step 1: Known brands (priority — always checked first)
    for folder_name, keywords in BRAND_FOLDERS:
        for kw in keywords:
            if " " in kw or "." in kw:
                if kw in combined or kw in normalized:
                    return folder_name
            else:
                if re.search(r'\b' + re.escape(kw) + r'\b', normalized):
                    return folder_name

    # Step 2: Auto-detect from document text
    entity = _auto_detect_entity(text_content)
    if entity:
        return entity

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# ORGANIZER
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class MoveAction:
    original: Path
    destination: Path
    category: str

    @property
    def changed(self) -> bool:
        return self.original != self.destination


@dataclass
class OrganizePlan:
    renames: list[RenameAction] = field(default_factory=list)
    moves: list[MoveAction] = field(default_factory=list)
    brand_counts: dict = field(default_factory=dict)

    @property
    def total_actions(self) -> int:
        return len(self.renames) + len(self.moves)

    def preview(self, max_lines: int = 50) -> str:
        lines = []
        if self.brand_counts:
            lines.append("--- Brand / Company Classification ---")
            for brand, count in sorted(self.brand_counts.items(), key=lambda x: -x[1]):
                lines.append(f"  {brand}: {count} files")
            lines.append("")
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
                try:
                    rel_dest = action.destination.relative_to(action.destination.parent.parent.parent)
                except ValueError:
                    try:
                        rel_dest = action.destination.relative_to(action.destination.parent.parent)
                    except ValueError:
                        rel_dest = action.destination.name
                lines.append(f"  {rel_orig}  ->  {rel_dest}")
            if len(self.moves) > max_lines:
                lines.append(f"  ... and {len(self.moves) - max_lines} more")
        if not lines:
            lines.append("No changes needed. All files are already organized.")
        return "\n".join(lines)


def plan_organization(files, target_root, rename_rules=None, organize_into_folders=True) -> OrganizePlan:
    plan = OrganizePlan()
    used_names: dict[Path, set[str]] = {}
    for entry in files:
        if entry.suggested_name:
            name_stem = entry.suggested_name
        else:
            name_stem = entry.stem
        if entry.extension_mismatch and entry.real_extension:
            extension = entry.real_extension
        else:
            extension = entry.extension
        category = entry.category
        # Detect brand and subcategory
        brand = _detect_brand(entry.name, entry.text_content)
        subcategory = _detect_subcategory(entry.name, entry.extension, category)
        new_name = normalize_filename(name_stem, extension, rename_rules, filepath=entry.path, category=entry.category, brand=brand)
        if organize_into_folders:
            if brand:
                plan.brand_counts[brand] = plan.brand_counts.get(brand, 0) + 1
                if subcategory:
                    dest_dir = target_root / brand / subcategory
                else:
                    clean_cat = re.sub(r'^\d+_', '', category)
                    dest_dir = target_root / brand / clean_cat
            else:
                if subcategory:
                    dest_dir = target_root / category / subcategory
                else:
                    dest_dir = target_root / category
        else:
            dest_dir = entry.parent
        if dest_dir not in used_names:
            used_names[dest_dir] = set()
        final_name = _deduplicate(new_name, used_names[dest_dir])
        used_names[dest_dir].add(final_name.lower())
        dest_path = dest_dir / final_name
        reasons = []
        if entry.suggested_name:
            reasons.append("renamed from metadata")
        if entry.extension_mismatch and entry.real_extension:
            reasons.append(f"extension fixed: {entry.extension} -> {entry.real_extension}")
        if not reasons:
            reasons.append("naming convention normalization")
        reason = ", ".join(reasons)
        if final_name != entry.name and not organize_into_folders:
            plan.renames.append(RenameAction(original=entry.path, new_path=dest_path, reason=reason))
        if organize_into_folders:
            if dest_path != entry.path:
                plan.moves.append(MoveAction(original=entry.path, destination=dest_path, category=category))
    return plan


def _deduplicate(name: str, existing: set[str]) -> str:
    if name.lower() not in existing:
        return name
    stem = Path(name).stem
    ext = Path(name).suffix
    counter = 1
    while True:
        candidate = f"{stem}_{counter:02d}{ext}"
        if candidate.lower() not in existing:
            return candidate
        counter += 1


@dataclass
class ExecutionResult:
    renames_done: int = 0
    moves_done: int = 0
    errors: list[tuple[Path, str]] = field(default_factory=list)
    log_entries: list[dict] = field(default_factory=list)

    def summary(self) -> str:
        lines = [f"Renames completed: {self.renames_done}", f"Moves completed: {self.moves_done}", f"Errors: {len(self.errors)}"]
        for path, err in self.errors:
            lines.append(f"  ERROR {path}: {err}")
        return "\n".join(lines)


def execute_plan(plan: OrganizePlan, dry_run: bool = False) -> ExecutionResult:
    result = ExecutionResult()
    for action in plan.renames:
        if dry_run:
            result.renames_done += 1
            result.log_entries.append({"type": "rename", "from": str(action.original), "to": str(action.new_path), "dry_run": True})
            continue
        try:
            action.original.rename(action.new_path)
            result.renames_done += 1
            result.log_entries.append({"type": "rename", "from": str(action.original), "to": str(action.new_path)})
        except PermissionError:
            result.errors.append((action.original, "Permission denied"))
        except OSError as exc:
            result.errors.append((action.original, str(exc)))
    for action in plan.moves:
        if dry_run:
            result.moves_done += 1
            result.log_entries.append({"type": "move", "from": str(action.original), "to": str(action.destination), "category": action.category, "dry_run": True})
            continue
        try:
            action.destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(action.original), str(action.destination))
            result.moves_done += 1
            result.log_entries.append({"type": "move", "from": str(action.original), "to": str(action.destination), "category": action.category})
        except PermissionError:
            result.errors.append((action.original, "Permission denied"))
        except OSError as exc:
            result.errors.append((action.original, str(exc)))
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# ROLLBACK
# ═══════════════════════════════════════════════════════════════════════════════

LOG_DIR_NAME = ".file-organizer-logs"


def get_log_dir(root: Path) -> Path:
    log_dir = root / LOG_DIR_NAME
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def save_log(root, log_entries, dry_run=False) -> Path:
    log_dir = get_log_dir(root)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    suffix = "-dry-run" if dry_run else ""
    log_file = log_dir / f"changes-{timestamp}{suffix}.json"
    payload = {"timestamp": datetime.now(timezone.utc).isoformat(), "dry_run": dry_run, "actions_count": len(log_entries), "actions": log_entries}
    log_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return log_file


def list_logs(root) -> list[Path]:
    log_dir = get_log_dir(root)
    return sorted(log_dir.glob("changes-*.json"), reverse=True)


def load_log(log_path) -> dict:
    return json.loads(Path(log_path).read_text(encoding="utf-8"))


def rollback(log_path) -> dict:
    data = load_log(log_path)
    if data.get("dry_run"):
        return {"status": "skipped", "reason": "This is a dry-run log — no real changes were made."}
    actions = data.get("actions", [])
    reversed_count = 0
    errors = []
    for action in reversed(actions):
        src = action.get("to")
        dst = action.get("from")
        if not src or not dst:
            errors.append({"action": action, "error": "Missing from/to paths"})
            continue
        src_path, dst_path = Path(src), Path(dst)
        try:
            if action.get("type") == "rename":
                if src_path.exists():
                    src_path.rename(dst_path)
                    reversed_count += 1
                else:
                    errors.append({"action": action, "error": f"File not found: {src}"})
            elif action.get("type") == "move":
                if src_path.exists():
                    dst_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(src_path), str(dst_path))
                    reversed_count += 1
                else:
                    errors.append({"action": action, "error": f"File not found: {src}"})
        except PermissionError:
            errors.append({"action": action, "error": "Permission denied"})
        except OSError as exc:
            errors.append({"action": action, "error": str(exc)})
    # Clean up empty directories
    dirs_to_check = set()
    for action in actions:
        if action.get("type") == "move":
            dirs_to_check.add(Path(action["to"]).parent)
    for d in dirs_to_check:
        try:
            if d.exists() and d.is_dir() and not any(d.iterdir()):
                d.rmdir()
        except OSError:
            pass
    return {"status": "completed", "reversed": reversed_count, "errors": len(errors), "error_details": errors if errors else None}


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def cmd_scan(args):
    target = Path(args.directory).resolve()
    config = load_config(Path(args.config) if args.config else None)
    deep = args.deep_scan
    if deep:
        print(f"Deep scanning: {target} (reading file contents...)")
    else:
        print(f"Scanning: {target}")
    print()
    result = scan_directory(root=target, categories=config["categories"], recursive=config["recursive"] if not args.no_recurse else False, skip_dirs=set(config["skip_directories"]), skip_files=set(config["skip_files"]), deep_scan=deep)
    print(result.summary())
    if result.errors:
        print(f"\nErrors encountered:")
        for path, err in result.errors[:20]:
            print(f"  {path}: {err}")
        if len(result.errors) > 20:
            print(f"  ... and {len(result.errors) - 20} more")


def cmd_organize(args):
    target = Path(args.directory).resolve()
    config = load_config(Path(args.config) if args.config else None)
    organize_into_folders = not args.rename_only
    if "organize_into_folders" in config and not args.rename_only:
        organize_into_folders = config["organize_into_folders"]
    deep = args.deep_scan
    if deep:
        print(f"Deep scanning: {target} (reading file contents...)")
    else:
        print(f"Scanning: {target}")
    scan_result = scan_directory(root=target, categories=config["categories"], recursive=config["recursive"] if not args.no_recurse else False, skip_dirs=set(config["skip_directories"]), skip_files=set(config["skip_files"]), deep_scan=deep)
    print(f"Found {len(scan_result.files)} files across {len(scan_result.by_category)} categories\n")
    if not scan_result.files:
        print("No files to organize.")
        return
    # Read document contents to detect brands (Silva Operations, Delta, Uber, etc.)
    print("Reading document contents for brand/company classification...")
    docs_read = extract_texts_for_entries(scan_result.files)
    print(f"  Read text from {docs_read} documents.\n")
    plan = plan_organization(files=scan_result.files, target_root=target, rename_rules=config["naming_rules"], organize_into_folders=organize_into_folders)
    if plan.total_actions == 0:
        print("All files are already organized and properly named.")
        return
    print("=" * 60)
    print("PLAN PREVIEW")
    print("=" * 60)
    print(plan.preview(max_lines=30))
    print(f"\nTotal actions: {plan.total_actions}\n")
    if args.dry_run:
        print("[DRY RUN] No files were modified.")
        exec_result = execute_plan(plan, dry_run=True)
        log_path = save_log(target, exec_result.log_entries, dry_run=True)
        print(f"Dry-run log saved to: {log_path}")
        return
    if not args.yes:
        response = input("Proceed with these changes? [y/N] ").strip().lower()
        if response not in ("y", "yes"):
            print("Aborted.")
            return
    print("Executing...")
    exec_result = execute_plan(plan, dry_run=False)
    log_path = save_log(target, exec_result.log_entries, dry_run=False)
    print()
    print(exec_result.summary())
    print(f"\nChange log saved to: {log_path}")
    print(f'To undo: python file_organizer.py undo "{target}" --log "{log_path}"')


def cmd_undo(args):
    target = Path(args.directory).resolve()
    if args.log:
        log_path = Path(args.log)
    else:
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


def cmd_logs(args):
    target = Path(args.directory).resolve()
    logs = list_logs(target)
    if not logs:
        print("No change logs found.")
        return
    print(f"Change logs for: {target}\n")
    for log_path in logs:
        data = load_log(log_path)
        marker = " [DRY RUN]" if data.get("dry_run") else ""
        print(f"  {log_path.name}{marker}")
        print(f"    Time: {data.get('timestamp', 'unknown')}")
        print(f"    Actions: {data.get('actions_count', '?')}\n")


def cmd_watch(args):
    """Watch directories and auto-organize on a timer."""
    import time
    directories = [Path(d).resolve() for d in args.directories]
    interval = args.interval * 60  # convert minutes to seconds
    config = load_config(Path(args.config) if args.config else None)

    # Validate directories
    for d in directories:
        if not d.is_dir():
            print(f"Error: {d} is not a directory")
            return

    print("=" * 60)
    print("FILE ORGANIZER — AUTO-WATCH MODE")
    print("=" * 60)
    print(f"Watching: {', '.join(str(d) for d in directories)}")
    print(f"Interval: every {args.interval} minutes")
    print(f"Press Ctrl+C to stop.\n")

    run_count = 0
    while True:
        run_count += 1
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now}] Run #{run_count}")

        for target in directories:
            print(f"  Scanning: {target}")
            try:
                scan_result = scan_directory(
                    root=target,
                    categories=config["categories"],
                    recursive=config.get("recursive", True),
                    skip_dirs=set(config["skip_directories"]),
                    skip_files=set(config["skip_files"]),
                )

                if not scan_result.files:
                    print(f"    No files found.")
                    continue

                # Read document contents for Business/Personal classification
                extract_texts_for_entries(scan_result.files)

                plan = plan_organization(
                    files=scan_result.files,
                    target_root=target,
                    rename_rules=config["naming_rules"],
                    organize_into_folders=True,
                )

                if plan.total_actions == 0:
                    print(f"    Already organized. Nothing to do.")
                    continue

                # Show what's happening
                brand_msg = ""
                if plan.brand_counts:
                    parts = [f"{b}: {c}" for b, c in sorted(plan.brand_counts.items(), key=lambda x: -x[1])]
                    brand_msg = " | " + ", ".join(parts)
                print(f"    Organizing {plan.total_actions} files...{brand_msg}")

                exec_result = execute_plan(plan, dry_run=False)
                log_path = save_log(target, exec_result.log_entries, dry_run=False)

                print(f"    Done: {exec_result.moves_done} moved, {exec_result.renames_done} renamed")
                if exec_result.errors:
                    print(f"    Errors: {len(exec_result.errors)}")
                print(f"    Log: {log_path.name}")

            except Exception as exc:
                print(f"    Error: {exc}")

        next_run = (datetime.now() + timedelta(seconds=interval)).strftime("%H:%M")
        print(f"  Next run at {next_run}\n")

        try:
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\nStopped watching. All previous changes are saved and can be undone.")
            break


def cmd_setup_autowatch(args):
    """Set up Windows Task Scheduler to run the watcher at login."""
    script_path = Path(__file__).resolve()
    directories = [Path(d).resolve() for d in args.directories]
    interval = args.interval
    python_path = sys.executable

    # Validate directories
    for d in directories:
        if not d.is_dir():
            print(f"Error: {d} is not a directory")
            return

    task_name = "FileOrganizerAutoWatch"
    dir_args = " ".join(f'"{d}"' for d in directories)

    if sys.platform == "win32":
        # Create a .bat launcher file next to the script
        bat_path = script_path.parent / "auto-organize.bat"
        bat_content = f'@echo off\n"{python_path}" "{script_path}" watch {dir_args} --interval {interval}\n'
        bat_path.write_text(bat_content, encoding="utf-8")

        # Create the scheduled task using schtasks
        schtasks_cmd = (
            f'schtasks /Create /TN "{task_name}" /TR "\\"{bat_path}\\"" '
            f'/SC ONLOGON /RL HIGHEST /F'
        )
        print("Setting up Windows Task Scheduler...")
        print(f"  Task name: {task_name}")
        print(f"  Watches: {', '.join(str(d) for d in directories)}")
        print(f"  Interval: every {interval} minutes")
        print(f"  Trigger: runs when you log in")
        print()
        print("Run this command in an ADMIN PowerShell or Command Prompt:")
        print()
        print(f"  {schtasks_cmd}")
        print()
        print(f"Launcher script saved to: {bat_path}")
        print()
        print("Or to run it manually right now (without Task Scheduler):")
        print(f'  python "{script_path}" watch {dir_args} --interval {interval}')
    else:
        # Linux/Mac: print a cron suggestion
        cron_line = f"*/{interval} * * * * {python_path} \"{script_path}\" organize {dir_args} --yes"
        print("Add this line to your crontab (run: crontab -e):")
        print(f"  {cron_line}")


def cmd_init_config(args):
    output = Path(args.output) if args.output else None
    path = save_default_config(output)
    print(f"Default config written to: {path}")
    print("Edit this file to customize categories, naming rules, and skip lists.")


def cmd_detect(args):
    """Scan files, read every document, and report all detected companies."""
    target = Path(args.directory).resolve()
    config = load_config(Path(args.config) if args.config else None)

    print("=" * 60)
    print("COMPANY / BRAND DETECTION REPORT")
    print("=" * 60)
    print(f"Scanning: {target}\n")

    scan_result = scan_directory(
        root=target,
        categories=config["categories"],
        recursive=config["recursive"] if not args.no_recurse else False,
        skip_dirs=set(config["skip_directories"]),
        skip_files=set(config["skip_files"]),
    )

    print(f"Found {len(scan_result.files)} files\n")
    if not scan_result.files:
        print("No files found.")
        return

    print("Reading every document...")
    docs_read = extract_texts_for_entries(scan_result.files)
    print(f"  Read text from {docs_read} documents.\n")

    # Detect brands for every file
    brand_files: dict[str, list[str]] = {}  # brand -> [filename, ...]
    unmatched = []

    for entry in scan_result.files:
        brand = _detect_brand(entry.name, entry.text_content)
        if brand:
            brand_files.setdefault(brand, []).append(entry.name)
        else:
            unmatched.append(entry.name)

    # Print results
    print("=" * 60)
    print(f"DETECTED {len(brand_files)} COMPANIES / BRANDS")
    print("=" * 60)

    for brand, files in sorted(brand_files.items(), key=lambda x: -len(x[1])):
        print(f"\n  {brand}  ({len(files)} files)")
        show = files[:10] if not args.verbose else files
        for f in show:
            print(f"    - {f}")
        if len(files) > 10 and not args.verbose:
            print(f"    ... and {len(files) - 10} more")

    print(f"\n{'=' * 60}")
    print(f"UNMATCHED FILES: {len(unmatched)}  (will go to normal category folders)")
    print("=" * 60)
    if unmatched:
        show = unmatched[:20] if not args.verbose else unmatched
        for f in show:
            print(f"    - {f}")
        if len(unmatched) > 20 and not args.verbose:
            print(f"    ... and {len(unmatched) - 20} more")

    print(f"\n--- SUMMARY ---")
    print(f"  Total files:      {len(scan_result.files)}")
    print(f"  Companies found:  {len(brand_files)}")
    print(f"  Matched files:    {sum(len(f) for f in brand_files.values())}")
    print(f"  Unmatched files:  {len(unmatched)}")
    print()
    print("Nothing was moved. This is just a report.")
    print("To see every file, run again with --verbose")
    print("Send this output back so we can fine-tune the brands list.")


def main():
    if sys.platform == "win32":
        try:
            import ctypes
            ntdll = ctypes.windll.ntdll
            if hasattr(ntdll, "RtlAreLongPathsEnabled"):
                if not ntdll.RtlAreLongPathsEnabled():
                    print("Note: Windows long paths not enabled. Some deeply nested files may fail.")
        except Exception:
            pass

    parser = argparse.ArgumentParser(prog="file-organizer", description="File Organization Agent — rename, categorize, and organize files.")
    parser.add_argument("--config", "-c", help="Path to organizer-config.json")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_scan = subparsers.add_parser("scan", help="Scan and summarize files")
    p_scan.add_argument("directory", help="Directory to scan")
    p_scan.add_argument("--no-recurse", action="store_true")
    p_scan.add_argument("--deep-scan", "-d", action="store_true", help="Read file contents to detect real type and extract metadata")

    p_org = subparsers.add_parser("organize", help="Rename and organize files")
    p_org.add_argument("directory", help="Directory to organize")
    p_org.add_argument("--dry-run", "-n", action="store_true", help="Preview changes without modifying files")
    p_org.add_argument("--deep-scan", "-d", action="store_true", help="Read file contents for smart renaming")
    p_org.add_argument("--rename-only", action="store_true", help="Only rename, don't move into folders")
    p_org.add_argument("--no-recurse", action="store_true")
    p_org.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt")

    p_undo = subparsers.add_parser("undo", help="Undo changes from a previous run")
    p_undo.add_argument("directory", help="Directory that was organized")
    p_undo.add_argument("--log", help="Specific log file to undo")
    p_undo.add_argument("--yes", "-y", action="store_true")

    p_logs = subparsers.add_parser("logs", help="List change logs")
    p_logs.add_argument("directory")

    # detect
    p_detect = subparsers.add_parser("detect", help="Read every document and show all detected companies (no files moved)")
    p_detect.add_argument("directory", help="Directory to scan")
    p_detect.add_argument("--no-recurse", action="store_true")
    p_detect.add_argument("--verbose", "-v", action="store_true", help="Show all files, not just first 10 per brand")

    # watch
    p_watch = subparsers.add_parser("watch", help="Auto-organize directories on a timer")
    p_watch.add_argument("directories", nargs="+", help="Directories to watch")
    p_watch.add_argument("--interval", "-i", type=int, default=30, help="Minutes between runs (default: 30)")

    # setup-autowatch
    p_setup = subparsers.add_parser("setup-autowatch", help="Set up auto-organize to run at Windows login")
    p_setup.add_argument("directories", nargs="+", help="Directories to watch")
    p_setup.add_argument("--interval", "-i", type=int, default=30, help="Minutes between runs (default: 30)")

    p_init = subparsers.add_parser("init-config", help="Generate default config file")
    p_init.add_argument("--output", "-o")

    args = parser.parse_args()
    {"scan": cmd_scan, "organize": cmd_organize, "undo": cmd_undo, "logs": cmd_logs, "detect": cmd_detect, "watch": cmd_watch, "setup-autowatch": cmd_setup_autowatch, "init-config": cmd_init_config}[args.command](args)


if __name__ == "__main__":
    main()
