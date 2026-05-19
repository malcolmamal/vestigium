@echo off
set TEST_SCRIPT=test
if /I "%~1"=="--full-test-output" set TEST_SCRIPT=test

echo Note: In PowerShell, run this script as ".\quality-check.bat" or "cmd /c quality-check.bat".
echo Running Quality Pipeline for Vestigium...

echo [1/8] Building Backend...
call .\gradlew.bat build -x test
if %errorlevel% neq 0 exit /b %errorlevel%

echo [2/8] Testing Backend (including Dependency Architecture Checks)...
call .\gradlew.bat test jacocoTestReport
if %errorlevel% neq 0 exit /b %errorlevel%

echo [3/8] Backend Quality OK. Switching to Frontend...
cd frontend

echo [4/8] Building Frontend...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo [5/8] Linting Frontend...
call npm run lint -- --fix
if %errorlevel% neq 0 exit /b %errorlevel%

echo [6/8] Testing Frontend...
call npm run test
if %errorlevel% neq 0 exit /b %errorlevel%

cd ..

echo Fixing lcov paths...
powershell -Command "(Get-Content frontend\coverage\lcov.info) -replace 'SF:src\\', 'SF:frontend\src\' -replace 'SF:src/', 'SF:frontend/src/' | Set-Content frontend\coverage\lcov.info"

echo [7/8] Running SonarQube Analysis...
if "%SONAR_TOKEN%"=="" call :load_sonar_token_file
if "%SONAR_TOKEN%"=="" call :load_sonar_token_registry
if "%SONAR_TOKEN%"=="" (
	echo SONAR_TOKEN is not set.
	echo Set it in your shell, in Windows environment variables, or in .sonar.env.
	exit /b 1
)
call sonar-scanner -Dsonar.token=%SONAR_TOKEN%
if %errorlevel% neq 0 exit /b %errorlevel%

echo [8/8] Quality Pipeline Passed!

:load_sonar_token_file
if not exist ".sonar.env" exit /b 0
for /f "usebackq tokens=1,* delims==" %%A in (".sonar.env") do (
	if /I "%%A"=="SONAR_TOKEN" set "SONAR_TOKEN=%%B"
)
exit /b 0

:load_sonar_token_registry
for /f "tokens=1,2,*" %%A in ('reg query "HKCU\Environment" /v SONAR_TOKEN 2^>nul ^| findstr /I "SONAR_TOKEN"') do set "SONAR_TOKEN=%%C"
if not "%SONAR_TOKEN%"=="" exit /b 0
for /f "tokens=1,2,*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v SONAR_TOKEN 2^>nul ^| findstr /I "SONAR_TOKEN"') do set "SONAR_TOKEN=%%C"
exit /b 0
