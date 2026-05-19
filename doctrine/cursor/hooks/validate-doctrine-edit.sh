#!/usr/bin/env bash
# afterFileEdit hook for doctrine/** files.
# Validates cross-references and naming conventions after edits.
# Non-blocking: reports issues as agent_message but does not deny.
#
# POSIX-compatible JSON extraction (no jq, no grep -P).
set -euo pipefail

input=$(cat)

# --- JSON extraction helper (POSIX sed, no GNU grep -P) ---
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
  doctrine/*) ;;
  *) echo '{}'; exit 0 ;;
esac

errors=()

# 1. Check broken relative cross-references
while IFS= read -r ref; do
  ref_resolved="$(dirname "$file_path")/$ref"
  if [ ! -f "$ref_resolved" ]; then
    errors+=("Broken cross-reference: $ref")
  fi
done < <(sed -n 's|.*\(\.\./[a-z][a-z]*/[0-9_a-zA-Z-]*\.md\).*|\1|p' "$file_path" 2>/dev/null || true)

# 2. Agent profile naming: kebab-case.agent.md
if echo "$rel_path" | grep -q 'doctrine/agents/'; then
  bn="$(basename "$file_path")"
  case "$bn" in
    README.md) ;;
    *) if ! echo "$bn" | grep -qE '^[a-z][a-z0-9-]*\.agent\.md$'; then
         errors+=("Agent naming violation: $bn (expected kebab-case.agent.md)")
       fi ;;
  esac
fi

# 3. Directive naming: NNN_snake_case.md
if echo "$rel_path" | grep -q 'doctrine/directives/'; then
  bn="$(basename "$file_path")"
  case "$bn" in
    README.md) ;;
    *) if ! echo "$bn" | grep -qE '^[0-9]{3}_[a-z_]+\.md$'; then
         errors+=("Directive naming violation: $bn (expected NNN_snake_case.md)")
       fi ;;
  esac
fi

# 4. Tactic naming: kebab-case.tactic.md
if echo "$rel_path" | grep -q 'doctrine/tactics/'; then
  bn="$(basename "$file_path")"
  case "$bn" in
    README.md) ;;
    *) if ! echo "$bn" | grep -qE '^[a-zA-Z][a-zA-Z0-9_-]*\.tactic\.md$'; then
         errors+=("Tactic naming violation: $bn (expected kebab-case.tactic.md)")
       fi ;;
  esac
fi

if [ ${#errors[@]} -gt 0 ]; then
  msg=""
  for e in "${errors[@]}"; do
    msg="${msg}⚠️ ${e}\n"
  done
  escaped_msg=$(printf '%b' "$msg" | sed 's/"/\\"/g' | tr '\n' ' ')
  echo "{\"agent_message\": \"${escaped_msg}\"}"
else
  echo '{}'
fi

exit 0
