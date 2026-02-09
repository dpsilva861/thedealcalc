# File Organization Agent

A Python-based CLI tool for Windows that scans directories, renames files to consistent naming conventions, and organizes them into categorized folders.

## Features

- **File scanning** — Recursively scans directories and categorizes files by extension
- **Consistent renaming** — Normalizes filenames: lowercase, replaces spaces with hyphens, strips special characters, handles Unicode
- **Category organization** — Moves files into folders by type (Documents, Images, Videos, Audio, Code, Archives, etc.)
- **Dry-run mode** — Preview all changes before executing
- **Full undo** — Every operation is logged and can be reversed
- **Configurable** — Customize categories, naming rules, and skip lists via JSON config
- **Windows-safe** — Handles reserved filenames (CON, PRN, etc.), invalid characters, and long paths

## Requirements

- Python 3.10+ (uses standard library only — no pip installs needed)

## Quick Start

### 1. Scan a directory to see what's there

```cmd
python agent.py scan C:\Users\dpsil\Downloads
```

Output:
```
Scanned: C:\Users\dpsil\Downloads
Total files: 247
Total size: 3.2 GB
Skipped: 2
Errors: 0

  Archives: 12 files (890.3 MB)
  Documents: 45 files (120.5 MB)
  Images: 98 files (450.2 MB)
  Videos: 15 files (1.8 GB)
  Other: 77 files (12.1 MB)
```

### 2. Preview what the organizer would do (dry run)

```cmd
python agent.py organize C:\Users\dpsil\Downloads --dry-run
```

This shows all planned renames and moves without touching any files.

### 3. Organize the directory

```cmd
python agent.py organize C:\Users\dpsil\Downloads
```

The agent will:
1. Scan all files
2. Show a preview of changes
3. Ask for confirmation
4. Rename files to follow naming conventions
5. Move files into category folders
6. Save a change log

### 4. Undo if needed

```cmd
python agent.py undo C:\Users\dpsil\Downloads
```

Reverses the most recent operation, putting all files back exactly where they were.

## Commands

| Command | Description |
|---------|-------------|
| `scan <dir>` | Scan and summarize files |
| `organize <dir>` | Rename and organize files |
| `undo <dir>` | Reverse changes from a previous run |
| `logs <dir>` | List all change logs for a directory |
| `init-config` | Generate a default config file to customize |

## Flags

| Flag | Commands | Description |
|------|----------|-------------|
| `--dry-run`, `-n` | organize | Preview changes without modifying files |
| `--rename-only` | organize | Only rename files, don't move into folders |
| `--no-recurse` | scan, organize | Don't descend into subdirectories |
| `--yes`, `-y` | organize, undo | Skip the confirmation prompt |
| `--config`, `-c` | all | Path to a custom config JSON file |
| `--log` | undo | Undo a specific log file instead of the most recent |

## Using the Launchers

For convenience, batch and PowerShell launchers are included:

```cmd
:: CMD
organize.bat scan C:\Users\dpsil\Desktop

:: PowerShell
.\organize.ps1 organize C:\Users\dpsil\Desktop --dry-run
```

## Configuration

Generate a default config file:

```cmd
python agent.py init-config
```

This creates `organizer-config.json` in the current directory. Edit it to customize:

### Custom categories

```json
{
  "categories": {
    "Documents": [".pdf", ".doc", ".docx", ".txt"],
    "Spreadsheets": [".xls", ".xlsx", ".csv"],
    "Design": [".psd", ".ai", ".sketch", ".figma"]
  }
}
```

### Naming rules

```json
{
  "naming_rules": {
    "space_replacement": "_",
    "lowercase": true,
    "collapse_separators": true,
    "max_filename_length": 200,
    "strip_characters": "!@#$%^&()+={}[]|;',`~"
  }
}
```

### Skip lists

```json
{
  "skip_directories": [".git", "node_modules", "$RECYCLE.BIN"],
  "skip_files": ["desktop.ini", "thumbs.db"]
}
```

## Naming Convention

Based on institutional best practices from Stanford Libraries, Harvard, NARA (National Archives), the Smithsonian, Princeton, and CESSDA.

### Standard format

```
descriptor_YYYYMMDD_v01.ext
```

- **Underscores** (`_`) separate major elements (subject, date, version)
- **Hyphens** (`-`) separate words within an element
- **ISO 8601 dates** (`YYYYMMDD`) — files sort chronologically
- **Versions** with leading zeros (`v01`, `v02`)
- **All lowercase**
- **Max 50 characters** (Harvard recommendation)

### Type-specific ordering

| Type | Format | Example |
|------|--------|---------|
| Documents | `subject_YYYYMMDD_v01.ext` | `budget-proposal_20240315_v02.pdf` |
| Images | `YYYYMMDD_subject.ext` | `20240315_birthday-party.jpg` |
| Audio | `YYYYMMDD_subject.ext` | `20240315_podcast-episode-42.mp3` |
| Video | `YYYYMMDD_subject.ext` | `20240315_wedding-ceremony.mp4` |

### Transformation examples

| Before | After |
|--------|-------|
| `My Document (Final).pdf` | `my-document-final_20240315.pdf` |
| `IMG_20240115_photo.JPG` | `20240115_photo.jpg` |
| `Report Q4  2024 v3.xlsx` | `report-q4-2024_20240315_v03.xlsx` |
| `Meeting Notes 01-15-2024.txt` | `meeting-notes_20240115.txt` |
| `file___name---here.txt` | `file-name-here_20240315.txt` |
| `café résumé.pdf` | `cafe-resume_20240315.pdf` |
| `CON.txt` | `con_file_20240315.txt` |

### What the renamer does automatically

- Extracts dates from filenames (`01-15-2024` -> `20240115`) and reformats to ISO 8601
- Extracts version numbers (`Version 3` -> `v03`) and normalizes with leading zeros
- Strips meaningless camera prefixes (`IMG_`, `DSC_`, `DSCN_`)
- Adds file modification date when no date is in the filename
- With `--deep-scan`: renames from metadata (PDF title, MP3 artist/title, EXIF date)

## Directory Structure After Organizing

Folders use numbered prefixes (NARA/Smithsonian standard) so they always sort in a logical order:

```
Downloads/
├── 01_Documents/
│   ├── quarterly-report_20240315.pdf
│   ├── meeting-notes_20240210.docx
│   └── budget-proposal_20240301_v02.xlsx
├── 02_Images/
│   ├── 20240315_profile-photo.jpg
│   └── 20240115_screenshot.png
├── 03_Audio/
│   ├── 20240315_podcast-episode-42.mp3
│   └── 20240210_meeting-recording.m4a
├── 04_Video/
│   ├── 20240315_tutorial.mp4
│   └── 20240301_presentation.mov
├── 05_Archives/
│   ├── project-backup_20240315.zip
│   └── photos-2024_20240301.7z
├── 06_Code/
│   ├── script_20240315.py
│   └── config_20240315.json
└── Other/
    └── random-file_20240315.dat
```

## Automatic Organization on Login

Run the setup script once to make the organizer run every time you open your laptop:

### Quick setup (PowerShell)

```powershell
cd path\to\tools\file-organizer
.\setup-autorun.ps1
```

The script will:
1. Ask which directories to watch (Downloads, Desktop, Documents, or custom)
2. Save your choices to `organizer-config.json`
3. Register a Windows Task Scheduler task that runs on every login

### Setup options

```powershell
# Basic: organize once per login
.\setup-autorun.ps1

# Watch mode: keep running and re-organize every 30 minutes
.\setup-autorun.ps1 -WatchMode -IntervalMinutes 30

# Disable toast notifications
.\setup-autorun.ps1 -NoNotify

# Remove the scheduled task
.\setup-autorun.ps1 -Remove
```

### Manual config (alternative to setup script)

Add `watch_directories` to your `organizer-config.json`:

```json
{
  "watch_directories": [
    "C:\\Users\\dpsil\\Downloads",
    "C:\\Users\\dpsil\\Desktop"
  ]
}
```

Then register it manually in Task Scheduler or run directly:

```cmd
python autorun.py --config organizer-config.json
python autorun.py --config organizer-config.json --watch --interval 30
```

### How it works

- On every Windows login, Task Scheduler launches `autorun.py`
- It reads `watch_directories` from your config
- Each directory is scanned, renamed, and organized automatically
- All changes are logged (check `autorun.log` and `.file-organizer-logs/`)
- A Windows toast notification pops up when files are organized
- You can undo any run: `python agent.py undo C:\Users\dpsil\Downloads`

### Reviewing autorun history

```cmd
:: Check the autorun log
type autorun.log

:: List change logs for a specific directory
python agent.py logs C:\Users\dpsil\Downloads
```

## Safety

- **Always preview first**: Use `--dry-run` to see what will happen
- **Confirmation required**: The agent asks before making changes (use `-y` to skip)
- **Full logging**: Every rename and move is logged to `.file-organizer-logs/`
- **Complete undo**: Any operation can be fully reversed
- **System files protected**: `desktop.ini`, `thumbs.db`, etc. are never touched
- **Protected directories**: `.git`, `node_modules`, `$RECYCLE.BIN`, etc. are skipped
