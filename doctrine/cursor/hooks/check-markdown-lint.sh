#!/usr/bin/env bash
# afterFileEdit hook for markdown files.
# Runs markdownlint on edited .md files if markdownlint-cli2 is installed.
# Non-blocking: reports issues as agent_message but does not deny.
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

# Only check markdown files
case "$file_path" in
  *.md) ;;
  *) echo '{}'; exit 0 ;;
esac

repo_root=$(json_arr_first workspace_roots)
if [ -z "$repo_root" ]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
fi

# Skip files in work/ (scratch space, less strict)
rel_path="${file_path#"$repo_root"/}"
case "$rel_path" in
  work/*) echo '{}'; exit 0 ;;
esac

# Prefer project-local markdownlint, fall back to global
mdlint=""
if [ -x "${repo_root}/node_modules/.bin/markdownlint-cli2" ]; then
  mdlint="${repo_root}/node_modules/.bin/markdownlint-cli2"
elif command -v markdownlint-cli2 >/dev/null 2>&1; then
  mdlint="markdownlint-cli2"
elif command -v markdownlint >/dev/null 2>&1; then
  mdlint="markdownlint"
fi

if [ -z "$mdlint" ]; then
  echo '{}'
  exit 0
fi

# Run lint with project config if available
config_flag=""
if [ -f "${repo_root}/.markdownlint.yaml" ]; then
  config_flag="--config ${repo_root}/.markdownlint.yaml"
fi

lint_output=$($mdlint $config_flag "$file_path" 2>&1 || true)

if [ -n "$lint_output" ]; then
  # Truncate to first 5 issues to avoid overwhelming the agent
  short_output=$(echo "$lint_output" | head -5 | sed 's/"/\\"/g' | tr '\n' ' ')
  count=$(echo "$lint_output" | wc -l | tr -d ' ')
  echo "{\"agent_message\": \"⚠️ Markdownlint found ${count} issue(s) in ${rel_path}: ${short_output}\"}"
else
  echo '{}'
fi

exit 0
