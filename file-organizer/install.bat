@echo off
REM File Organizer v2 — Installation Script for Windows
REM Run this from the file-organizer directory

echo ============================================
echo  File Organizer v2 — Installation
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

REM Check Java (for Apache Tika)
java -version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Java is not installed. Apache Tika requires Java for some file types.
    echo You can install Java from: https://adoptium.net/
    echo The organizer will still work for most file types without Java.
    echo.
)

REM Create virtual environment
echo Creating virtual environment...
if not exist ".venv" (
    python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Installing dependencies...
pip install --upgrade pip
pip install -e .

REM Install Windows-specific packages
echo.
echo Installing Windows-specific packages...
pip install pywin32 pystray

REM Post-install for pywin32
python -c "import win32com" >nul 2>&1
if errorlevel 1 (
    echo Running pywin32 post-install...
    python .venv\Scripts\pywin32_postinstall.py -install >nul 2>&1
)

REM Install Tesseract OCR check
tesseract --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo NOTE: Tesseract OCR is not installed. Image text extraction will be limited.
    echo Install from: https://github.com/UB-Mannheim/tesseract/wiki
    echo After installing, add Tesseract to your PATH.
)

REM Create default configuration
echo.
echo Creating default configuration...
python -m file_organizer.cli.main config --init

REM Install PowerShell module
echo.
echo To install the PowerShell module, run in PowerShell:
echo   Import-Module "%CD%\powershell\FileOrganizer.psm1"
echo.
echo Or add to your PowerShell profile:
echo   Add-Content $PROFILE 'Import-Module "%CD%\powershell\FileOrganizer.psm1"'

echo.
echo ============================================
echo  Installation Complete!
echo ============================================
echo.
echo Quick Start:
echo   file-organizer scan "%%USERPROFILE%%\Documents"
echo   file-organizer search "leases"
echo   file-organizer profile
echo   file-organizer taxonomy
echo   file-organizer dashboard
echo   file-organizer agent --foreground
echo.
echo For help: file-organizer --help
echo.
pause
