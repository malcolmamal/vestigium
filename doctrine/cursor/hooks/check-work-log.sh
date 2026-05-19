#!/usr/bin/env bash
# afterFileEdit hook for work/** progress logs.
# Ensures progress logs include required metadata sections.
# Non-blocking: advises agent but does not deny.
#
# POSIX-compatible JSON extraction (no jq, no grep -P).
set -euo pipefail

input=$(cat)

json_str() { echo "$input" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1; }
json_arr_first() { echo "$input" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\[[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1; }

file_path=$(json_str file_path)
if [ -z "$file_path" ]; then
  echo '{}'
  exit 0
fi

repo_root=$(json_arr_first workspace_roots)
if [ -z "$repo_root" ]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
fi

rel_path="${file_path#"$repo_root"/}"

case "$rel_path" in
  work/*) ;;
  *) echo '{}'; exit 0 ;;
esac

if ! echo "$file_path" | grep -q 'progress-log.*\.md$'; then
  echo '{}'
  exit 0
fi

if ! grep -q '## Session Context' "$file_path" 2>/dev/null; then
  echo '{"agent_message": "⚠️ Progress log missing a \"## Session Context\" section (Directive 014)."}'
else
  echo '{}'
fi

exit 0
