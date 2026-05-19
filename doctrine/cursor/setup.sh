#!/bin/sh
# Convenience wrapper for consuming repos that have doctrine/ via subtree.
# Delegates to tools/scripts/setup-cursor.sh if available, otherwise
# performs a minimal setup inline.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FULL_SCRIPT="${REPO_ROOT}/tools/scripts/setup-cursor.sh"

if [ -f "$FULL_SCRIPT" ]; then
  exec sh "$FULL_SCRIPT" --source "$SCRIPT_DIR" --target "${REPO_ROOT}/.cursor" "$@"
fi

# Minimal fallback if tools/ is not available (subtree-only install)
echo "Setting up .cursor/ from doctrine/cursor/ (minimal mode)"

TARGET="${REPO_ROOT}/.cursor"
mkdir -p "$TARGET"

# Try symlink, fall back to copy
for item in hooks.json hooks; do
  src="${SCRIPT_DIR}/${item}"
  dst="${TARGET}/${item}"
  [ ! -e "$src" ] && continue
  [ -e "$dst" ] || [ -L "$dst" ] && { echo "  · $item  (exists)"; continue; }
  if ln -s "$(python3 -c "import os.path; print(os.path.relpath('$src', '$TARGET'))" 2>/dev/null || echo "$src")" "$dst" 2>/dev/null; then
    echo "  ✓ $item  (symlink)"
  else
    cp -r "$src" "$dst"
    echo "  ✓ $item  (copied)"
  fi
done

mkdir -p "$TARGET/rules" "$TARGET/skills"
echo "  ℹ rules/ and skills/ created empty — add project-specific content"
echo "  ℹ Run 'npm run deploy:cursor' to generate skills (requires Node.js)"
