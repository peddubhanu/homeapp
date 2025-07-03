@echo off
REM HomeOrder IAM Role Status Check - Batch Wrapper
REM This batch file runs the PowerShell script to check IAM role status

echo HomeOrder IAM Role Status Check
echo ================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available on this system.
    echo Please install PowerShell or run the script manually.
    pause
    exit /b 1
)

REM Run the PowerShell script
echo Running IAM role status check...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0check-iam-role.ps1" %*

echo.
echo Check completed!
pause 