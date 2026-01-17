#!/bin/bash
set -e

echo "🔍 Running Quality Pipeline..."

echo "🏗️  Building Java Backend..."
./gradlew build test

echo "🏗️  Building Frontend..."
cd frontend
npm run build

echo "🧹 Linting Frontend..."
npm run lint

echo "🧪 Testing Frontend..."
npm run test

cd ..
echo "✅ Quality Pipeline Passed!"

