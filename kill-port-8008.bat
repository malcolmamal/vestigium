@echo off
echo Checking for process listening on port 8008...

REM Find the process ID listening on port 8008
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8008 ^| findstr LISTENING') do (
    set PID=%%a
    goto :found
)

echo No process found listening on port 8008.
exit /b 0

:found
echo Found process with PID: %PID%
echo Killing process...

REM Kill the process forcefully
taskkill /PID %PID% /F >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo Process %PID% has been terminated successfully.
) else (
    echo Failed to kill process %PID%. It may have already been terminated or you may need administrator privileges.
    exit /b 1
)

exit /b 0

