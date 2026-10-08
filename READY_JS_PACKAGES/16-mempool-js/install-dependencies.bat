@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-dependencies.ps1" %*
exit /b %errorlevel%
