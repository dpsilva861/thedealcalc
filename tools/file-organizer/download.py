"""
File Organizer Downloader
=========================
Paste this into Notepad, save as download.py on your Desktop, then run:
    python C:\Users\dpsil\Desktop\download.py

It will download all the file organizer scripts to C:\Users\dpsil\file-organizer\
"""

import urllib.request
import os
import sys

FOLDER = os.path.join(os.path.expanduser("~"), "file-organizer")
BRANCH = "claude/file-organization-agent-c2LJa"
BASE_URL = f"https://raw.githubusercontent.com/dpsilva861/thedealcalc/{BRANCH}/tools/file-organizer"

FILES = [
    "agent.py",
    "config.py",
    "scanner.py",
    "renamer.py",
    "organizer.py",
    "rollback.py",
    "user_config.py",
    "content_detector.py",
    "autorun.py",
    "setup-autorun.ps1",
    "organize.bat",
    "organize.ps1",
]

def main():
    print(f"Downloading File Organizer to: {FOLDER}")
    print()
    os.makedirs(FOLDER, exist_ok=True)

    errors = []
    for filename in FILES:
        url = f"{BASE_URL}/{filename}"
        dest = os.path.join(FOLDER, filename)
        try:
            print(f"  Downloading {filename}...", end=" ")
            urllib.request.urlretrieve(url, dest)
            print("OK")
        except Exception as e:
            print(f"FAILED: {e}")
            errors.append(filename)

    print()
    if errors:
        print(f"Warning: {len(errors)} file(s) failed to download: {', '.join(errors)}")
    else:
        print(f"All {len(FILES)} files downloaded successfully!")

    print()
    print("=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print()
    print("Now you can run these commands:")
    print()
    print(f"  Scan your Downloads folder:")
    print(f"    python {os.path.join(FOLDER, 'agent.py')} scan C:\\Users\\dpsil\\Downloads")
    print()
    print(f"  Preview changes (safe, doesn't touch files):")
    print(f"    python {os.path.join(FOLDER, 'agent.py')} organize C:\\Users\\dpsil\\Downloads --dry-run")
    print()
    print(f"  Organize with deep scan (reads file contents):")
    print(f"    python {os.path.join(FOLDER, 'agent.py')} organize C:\\Users\\dpsil\\Downloads --deep-scan")
    print()
    print(f"  Undo changes:")
    print(f"    python {os.path.join(FOLDER, 'agent.py')} undo C:\\Users\\dpsil\\Downloads")
    print()
    input("Press Enter to close...")


if __name__ == "__main__":
    main()
