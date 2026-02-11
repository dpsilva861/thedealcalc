# File Organization Agent — PowerShell launcher
# Usage: .\organize.ps1 scan C:\Users\YourName\Downloads
#        .\organize.ps1 organize C:\Users\YourName\Desktop --dry-run
#        .\organize.ps1 undo C:\Users\YourName\Desktop

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
python "$scriptDir\agent.py" @args
