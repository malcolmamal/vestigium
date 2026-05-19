#!/usr/bin/env bash
#
# Renders C4 Mermaid diagrams with the Regnology branded theme.
#
# The theme config (regnology-c4.config.json) lives next to this script
# inside the doctrine styleguides. The script is repo-agnostic: it can
# be called from any repository that consumes the doctrine via symlink.
#
# Usage:
#   doctrine/styleguides/diagramming/render-c4.sh [options] [file …]
#
# Options:
#   -d DIR   Diagram directory to scan for c4_*.mermaid (default: docs/diagrams)
#   -o DIR   Output directory for SVGs              (default: output/diagrams)
#
# If file arguments are given, -d is ignored and only those files are rendered.
#
# Requirements: bash ≥ 4, jq, mmdc (mermaid-cli)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$SCRIPT_DIR/regnology-c4.config.json"

DIAGRAM_DIR="docs/diagrams"
OUT_DIR="output/diagrams"

while getopts "d:o:" opt; do
  case "$opt" in
    d) DIAGRAM_DIR="$OPTARG" ;;
    o) OUT_DIR="$OPTARG" ;;
    *) echo "Usage: $0 [-d diagram_dir] [-o output_dir] [file …]" >&2; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

if [[ ! -f "$CONFIG" ]]; then
  echo "Error: config not found at $CONFIG" >&2
  exit 1
fi

for cmd in jq mmdc; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is required but not found on PATH" >&2
    exit 1
  fi
done

INIT_LINE="%%{init: $(jq -c '.' "$CONFIG")}%%"

mkdir -p "$OUT_DIR"

render_one() {
  local src="$1"
  local name
  name="$(basename "${src%.mermaid}")"

  local tmpfile
  tmpfile="$(mktemp "/tmp/mermaid-${name}-XXXXXX.mmd")"
  trap "rm -f '$tmpfile'" RETURN

  printf '%s\n' "$INIT_LINE" > "$tmpfile"
  cat "$src" >> "$tmpfile"

  local out_svg="$OUT_DIR/${name}.svg"
  mmdc -i "$tmpfile" -o "$out_svg" --quiet 2>/dev/null || \
    mmdc -i "$tmpfile" -o "$out_svg"

  echo "  ✓ $out_svg"
}

files=()
if [[ $# -gt 0 ]]; then
  files=("$@")
else
  for f in "$DIAGRAM_DIR"/c4_*.mermaid; do
    [[ -f "$f" ]] && files+=("$f")
  done
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No C4 diagram files found in $DIAGRAM_DIR" >&2
  exit 1
fi

echo "Rendering ${#files[@]} C4 diagram(s) with Regnology theme…"
for f in "${files[@]}"; do
  render_one "$f"
done
echo "Done."
