#!/bin/bash
set -e

echo "Running Quality Pipeline for Vestigium..."

echo "[1/8] Building Backend..."
./gradlew build -x test

echo "[2/8] Testing Backend (including Dependency Architecture Checks)..."
./gradlew test jacocoTestReport

echo "[3/8] Backend Quality OK. Switching to Frontend..."
cd frontend

echo "[4/8] Building Frontend..."
npm run build

echo "[5/8] Linting Frontend..."
npm run lint -- --fix

echo "[6/8] Testing Frontend..."
npm run test

cd ..

echo "Fixing lcov paths..."
sed -i 's/SF:src\//SF:frontend\/src\//g' frontend/coverage/lcov.info || true
sed -i 's/SF:src\\/SF:frontend\\src\\/g' frontend/coverage/lcov.info || true

echo "[7/8] Running SonarQube Analysis..."

# Attempt to load SONAR_TOKEN from .sonar.env if not set
if [ -z "$SONAR_TOKEN" ] && [ -f ".sonar.env" ]; then
    export $(grep -v '^#' .sonar.env | xargs)
fi

if [ -z "$SONAR_TOKEN" ]; then
    echo "SONAR_TOKEN is not set."
    echo "Set it in your shell, in environment variables, or in .sonar.env."
    exit 1
fi

sonar-scanner -Dsonar.token="$SONAR_TOKEN"

echo "[8/8] Quality Pipeline Passed!"
