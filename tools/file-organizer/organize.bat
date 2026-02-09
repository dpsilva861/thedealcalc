@echo off
REM File Organization Agent — Windows launcher
REM Usage: organize.bat scan C:\Users\YourName\Downloads
REM        organize.bat organize C:\Users\YourName\Desktop --dry-run
REM        organize.bat undo C:\Users\YourName\Desktop

python "%~dp0agent.py" %*
