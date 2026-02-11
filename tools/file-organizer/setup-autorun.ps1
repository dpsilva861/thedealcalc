#Requires -Version 5.1
<#
.SYNOPSIS
    Sets up the File Organizer to run automatically on Windows login.

.DESCRIPTION
    This script does three things:
    1. Creates an organizer-config.json with your chosen directories
    2. Registers a Windows Task Scheduler task that runs on every logon
    3. Optionally enables "watch mode" to keep organizing periodically

    Run this script ONCE to set up automation. To remove it later, use:
        .\setup-autorun.ps1 -Remove

.EXAMPLE
    .\setup-autorun.ps1
    .\setup-autorun.ps1 -WatchMode -IntervalMinutes 30
    .\setup-autorun.ps1 -Remove
#>

param(
    [switch]$WatchMode,
    [int]$IntervalMinutes = 60,
    [switch]$Remove,
    [switch]$NoNotify
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TaskName = "FileOrganizerAutorun"
$ConfigPath = Join-Path $ScriptDir "organizer-config.json"
$AutorunScript = Join-Path $ScriptDir "autorun.py"
$LogFile = Join-Path $ScriptDir "autorun.log"

# ── Remove mode ──────────────────────────────────────────────────────────
if ($Remove) {
    Write-Host "Removing File Organizer scheduled task..." -ForegroundColor Yellow
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "Task '$TaskName' removed successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Task '$TaskName' not found (may already be removed)." -ForegroundColor Gray
    }
    exit 0
}

# ── Check Python ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  File Organizer — Autorun Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3\.(\d+)") {
            $minor = [int]$Matches[1]
            if ($minor -ge 10) {
                $pythonCmd = $cmd
                Write-Host "Found: $ver (using '$cmd')" -ForegroundColor Green
                break
            }
        }
    }
    catch { }
}

if (-not $pythonCmd) {
    Write-Host "ERROR: Python 3.10+ is required but not found in PATH." -ForegroundColor Red
    Write-Host "Install Python from https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host "Make sure to check 'Add Python to PATH' during installation." -ForegroundColor Red
    exit 1
}

# ── Configure directories ────────────────────────────────────────────────
Write-Host ""
Write-Host "Which directories should be auto-organized?" -ForegroundColor Yellow
Write-Host "Common choices:"
Write-Host "  1. Downloads    (C:\Users\dpsil\Downloads)"
Write-Host "  2. Desktop      (C:\Users\dpsil\Desktop)"
Write-Host "  3. Documents    (C:\Users\dpsil\Documents)"
Write-Host "  4. Custom path"
Write-Host ""
Write-Host "Enter numbers separated by commas, or type custom paths."
Write-Host "Example: 1,2  or  1,4" -ForegroundColor Gray
$choices = Read-Host "Your choice"

$directories = @()
$dirMap = @{
    "1" = Join-Path $env:USERPROFILE "Downloads"
    "2" = Join-Path $env:USERPROFILE "Desktop"
    "3" = Join-Path $env:USERPROFILE "Documents"
}

foreach ($choice in ($choices -split ",")) {
    $c = $choice.Trim()
    if ($dirMap.ContainsKey($c)) {
        $directories += $dirMap[$c]
    }
    elseif ($c -eq "4") {
        $custom = Read-Host "Enter the full path"
        if (Test-Path $custom -PathType Container) {
            $directories += $custom
        }
        else {
            Write-Host "Warning: '$custom' does not exist. Skipping." -ForegroundColor Yellow
        }
    }
    elseif (Test-Path $c -PathType Container) {
        # User typed a full path directly
        $directories += $c
    }
    else {
        Write-Host "Warning: '$c' is not valid. Skipping." -ForegroundColor Yellow
    }
}

if ($directories.Count -eq 0) {
    Write-Host "No directories selected. Using Downloads as default." -ForegroundColor Yellow
    $directories = @(Join-Path $env:USERPROFILE "Downloads")
}

Write-Host ""
Write-Host "Directories to auto-organize:" -ForegroundColor Green
foreach ($d in $directories) {
    Write-Host "  - $d"
}

# ── Create/update config ─────────────────────────────────────────────────
Write-Host ""
Write-Host "Creating config..." -ForegroundColor Yellow

if (Test-Path $ConfigPath) {
    # Merge watch_directories into existing config
    $existingConfig = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    $existingConfig | Add-Member -NotePropertyName "watch_directories" -NotePropertyValue $directories -Force
    $existingConfig | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
    Write-Host "Updated existing config with watch_directories." -ForegroundColor Green
}
else {
    # Generate default config first, then add watch_directories
    & $pythonCmd $AutorunScript --config $ConfigPath 2>$null
    & $pythonCmd (Join-Path $ScriptDir "agent.py") init-config --output $ConfigPath

    $newConfig = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    $newConfig | Add-Member -NotePropertyName "watch_directories" -NotePropertyValue $directories -Force
    $newConfig | ConvertTo-Json -Depth 10 | Set-Content $ConfigPath -Encoding UTF8
    Write-Host "Created config at: $ConfigPath" -ForegroundColor Green
}

# ── Build the command ─────────────────────────────────────────────────────
$arguments = @("`"$AutorunScript`"", "--config", "`"$ConfigPath`"")
if ($WatchMode) {
    $arguments += "--watch"
    $arguments += "--interval"
    $arguments += $IntervalMinutes
}
if ($NoNotify) {
    $arguments += "--no-notify"
}

$pythonPath = (Get-Command $pythonCmd).Source
$argString = $arguments -join " "

# ── Register scheduled task ───────────────────────────────────────────────
Write-Host ""
Write-Host "Registering Windows scheduled task..." -ForegroundColor Yellow

# Remove existing task if present
try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
}
catch { }

$action = New-ScheduledTaskAction `
    -Execute $pythonPath `
    -Argument $argString `
    -WorkingDirectory $ScriptDir

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "File Organizer — automatically organizes files on login" | Out-Null

Write-Host "Task '$TaskName' registered successfully!" -ForegroundColor Green

# ── Summary ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What happens now:" -ForegroundColor Yellow
Write-Host "  - Every time you log into Windows, the organizer runs automatically"
if ($WatchMode) {
    Write-Host "  - It will keep running and re-check every $IntervalMinutes minutes"
}
else {
    Write-Host "  - It runs once per login, then exits"
}
Write-Host "  - All changes are logged to: $LogFile"
Write-Host "  - Every run can be undone:  python agent.py undo <directory>"
Write-Host ""
Write-Host "To customize:" -ForegroundColor Yellow
Write-Host "  Edit: $ConfigPath"
Write-Host ""
Write-Host "To remove automation:" -ForegroundColor Yellow
Write-Host "  .\setup-autorun.ps1 -Remove"
Write-Host ""
Write-Host "To run it right now (test):" -ForegroundColor Yellow
Write-Host "  $pythonCmd `"$AutorunScript`" --config `"$ConfigPath`""
Write-Host ""
