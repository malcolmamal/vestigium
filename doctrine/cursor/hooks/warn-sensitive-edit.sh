#!/usr/bin/env bash
# preToolUse hook for Write/StrReplace tools.
# Warns (non-blocking) when editing files at the top of the instruction hierarchy.
# Always allows — advisory only.
#
# POSIX-compatible JSON extraction (no jq, no grep -P).
set -euo pipefail

input=$(cat)

json_str() { echo "$input" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1; }

tool_name=$(json_str tool_name)
file_path=$(json_str path)

if [ "$tool_name" != "Write" ] && [ "$tool_name" != "StrReplace" ]; then
  echo '{"decision": "allow"}'
  exit 0
fi

if [ -z "$file_path" ]; then
  echo '{"decision": "allow"}'
  exit 0
fi

bn="$(basename "$file_path")"

case "$bn" in
  general_guidelines.md|operational_guidelines.md|bootstrap.md)
    echo "{\"decision\": \"allow\", \"reason\": \"⚠️ Editing high-precedence governance file: ${bn}. Changes affect ALL agents and ALL tasks.\"}"
    ;;
  AGENTS.md|CLAUDE.md)
    echo "{\"decision\": \"allow\", \"reason\": \"⚠️ Editing root specification file: ${bn}. This file governs agent initialization.\"}"
    ;;
  *)
    echo '{"decision": "allow"}'
    ;;
esac

exit 0
