@echo off
echo Running Quality Pipeline...

echo [1/4] Building and Testing Java Backend...
call gradlew.bat clean build test
if %errorlevel% neq 0 exit /b %errorlevel%

echo [2/4] Building Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo [3/4] Linting Frontend...
call npm run lint -- --fix
if %errorlevel% neq 0 exit /b %errorlevel%

echo [4/4] Testing Frontend...
call npm run test
if %errorlevel% neq 0 exit /b %errorlevel%

cd ..
echo Quality Pipeline Passed!

