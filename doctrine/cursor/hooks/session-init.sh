#!/usr/bin/env bash
# sessionStart hook — logs session metadata and checks for doctrine updates.
#
# 1. Appends session info to work/reports/logs/cursor-session-audit.log
# 2. If .doctrine-config/config.yaml defines doctrine_upstream, resolves
#    the upstream repo and checks for unpulled commits. Emits an advisory
#    agent_message when updates are available.
#
# POSIX-compatible JSON extraction (no jq, no grep -P).
# Non-blocking: always exits 0.
set -euo pipefail

input=$(cat)

json_str() { echo "$input" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1; }
json_arr_first() { echo "$input" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\[[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -1; }

repo_root=$(json_arr_first workspace_roots)
if [ -z "$repo_root" ]; then
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
fi

log_dir="${repo_root}/work/reports/logs"
log_file="${log_dir}/cursor-session-audit.log"

mkdir -p "$log_dir"

timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
conv_id=$(json_str conversation_id); conv_id="${conv_id:-unknown}"
model=$(json_str model); model="${model:-unknown}"
cursor_ver=$(json_str cursor_version); cursor_ver="${cursor_ver:-unknown}"
user_email=$(json_str user_email); user_email="${user_email:-unknown}"

doctrine_ver="unknown"
if [ -f "${repo_root}/doctrine/CHANGELOG.md" ]; then
  doctrine_ver=$(sed -n 's/^## \([0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\).*/\1/p' "${repo_root}/doctrine/CHANGELOG.md" 2>/dev/null | head -1 || echo "unknown")
fi

git_branch=$(cd "$repo_root" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
git_sha=$(cd "$repo_root" && git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo "[${timestamp}] session=${conv_id} model=${model} cursor=${cursor_ver} user=${user_email} doctrine=${doctrine_ver} branch=${git_branch} sha=${git_sha}" >> "$log_file"

# --- Doctrine upstream update check ---

update_msg=""
config_file="${repo_root}/.doctrine-config/config.yaml"

if [ -f "$config_file" ]; then
  upstream_ref=$(grep -E '^\s*doctrine_upstream:' "$config_file" 2>/dev/null | sed 's/^.*:[[:space:]]*//' | tr -d '"'"'" || true)

  # Fallback: resolve doctrine/ symlink to find upstream repo
  if [ -z "$upstream_ref" ] && [ -L "${repo_root}/doctrine" ]; then
    resolved="$(cd "${repo_root}/doctrine" && pwd -P 2>/dev/null || true)"
    if [ -n "$resolved" ]; then
      upstream_ref="$(dirname "$resolved")"
    fi
  fi

  if [ -n "$upstream_ref" ]; then
    case "$upstream_ref" in
      /*) upstream_dir="$upstream_ref" ;;
      *)  upstream_dir="${repo_root}/${upstream_ref}" ;;
    esac

    if [ -L "$upstream_dir" ]; then
      upstream_dir="$(cd "$upstream_dir" && pwd -P 2>/dev/null || echo "$upstream_dir")"
    fi

    if [ ! -d "$upstream_dir/.git" ] && [ -d "$(dirname "$upstream_dir")/.git" ]; then
      upstream_dir="$(dirname "$upstream_dir")"
    fi

    if [ -d "$upstream_dir/.git" ]; then
      if timeout 5 git -C "$upstream_dir" fetch --quiet 2>/dev/null; then
        local_sha=$(git -C "$upstream_dir" rev-parse HEAD 2>/dev/null || true)
        remote_sha=$(git -C "$upstream_dir" rev-parse '@{u}' 2>/dev/null || true)

        if [ -n "$local_sha" ] && [ -n "$remote_sha" ]; then
          behind=$(git -C "$upstream_dir" rev-list --count HEAD..'@{u}' 2>/dev/null || echo "0")
          if [ "$behind" != "0" ]; then
            upstream_branch=$(git -C "$upstream_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
            update_msg="⚠️ Doctrine upstream (${upstream_ref}) is ${behind} commit(s) behind origin/${upstream_branch}. Consider pulling before starting work: cd ${upstream_ref} && git pull"
          fi
        fi
      fi
    fi
  fi
fi

# --- Model discipline advisory ---

model_msg=""
case "$model" in
  *opus*|*thinking*|*o1*|*o3*|*pro*)
    model_msg="⚠️ Directive 042 (Model Discipline): You are running on a premium model (${model}). Delegate routine tasks (file creation, search, git ops, template generation) to fast subagents. Reserve this thread for complex reasoning and active iteration."
    ;;
esac

# Combine messages
msgs=""
if [ -n "$update_msg" ]; then
  msgs="${update_msg}"
fi
if [ -n "$model_msg" ]; then
  if [ -n "$msgs" ]; then
    msgs="${msgs} | ${model_msg}"
  else
    msgs="${model_msg}"
  fi
fi

if [ -n "$msgs" ]; then
  escaped_msg=$(echo "$msgs" | sed 's/"/\\"/g')
  echo "{\"agent_message\": \"${escaped_msg}\"}"
else
  echo '{}'
fi

exit 0
