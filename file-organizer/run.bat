@echo off
REM File Organizer — Double-click to run
REM This script activates the venv and launches the interactive menu

set "INSTALL_DIR=%~dp0"
call "%INSTALL_DIR%.venv\Scripts\activate.bat"

echo ============================================
echo  File Organizer v2
echo ============================================
echo.
echo  1. Scan my Documents
echo  2. Show profile
echo  3. Organize files (dry run preview)
echo  4. Organize files (for real)
echo  5. Undo last organize
echo  6. Find duplicates
echo  7. Open dashboard (web UI)
echo  8. Search files
echo  9. Show taxonomy
echo  0. Exit
echo.
set /p choice="Pick a number: "

if "%choice%"=="1" (
    file-organizer scan "%USERPROFILE%\Documents"
) else if "%choice%"=="2" (
    file-organizer profile
) else if "%choice%"=="3" (
    file-organizer organize --dry-run
) else if "%choice%"=="4" (
    echo.
    echo WARNING: This will move and rename your files!
    echo You can undo with option 5 if needed.
    set /p confirm="Are you sure? (y/n): "
    if /i "!confirm!"=="y" (
        file-organizer organize
    ) else (
        echo Cancelled.
    )
) else if "%choice%"=="5" (
    file-organizer undo
) else if "%choice%"=="6" (
    file-organizer duplicates
) else if "%choice%"=="7" (
    echo Opening dashboard at http://127.0.0.1:5000
    echo Press Ctrl+C to stop.
    start http://127.0.0.1:5000
    file-organizer dashboard
) else if "%choice%"=="8" (
    set /p query="Search for: "
    file-organizer search "%query%"
) else if "%choice%"=="9" (
    file-organizer taxonomy
) else if "%choice%"=="0" (
    exit /b 0
) else (
    echo Invalid choice.
)

echo.
pause
