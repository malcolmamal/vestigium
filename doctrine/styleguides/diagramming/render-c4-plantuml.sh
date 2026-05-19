#!/usr/bin/env bash
#
# Renders C4 PlantUML diagrams to SVG.
#
# The Regnology theme is included directly by each .puml file via
# !include, so no injection step is needed (unlike Mermaid).
# This script provides a convenient batch-render entrypoint.
#
# Usage:
#   doctrine/styleguides/diagramming/render-c4-plantuml.sh [options] [file …]
#
# Options:
#   -d DIR   Diagram directory to scan for c4_*.puml (default: docs/diagrams)
#   -o DIR   Output directory for SVGs               (default: output/diagrams)
#   -j JAR   Path to plantuml.jar (default: auto-detect via PLANTUML_JAR env var
#            or 'plantuml' on PATH)
#
# Requirements: bash ≥ 4, java, plantuml (jar or CLI)

set -euo pipefail

DIAGRAM_DIR="docs/diagrams"
OUT_DIR="output/diagrams"
PLANTUML="${PLANTUML_JAR:-}"

while getopts "d:o:j:" opt; do
  case "$opt" in
    d) DIAGRAM_DIR="$OPTARG" ;;
    o) OUT_DIR="$OPTARG" ;;
    j) PLANTUML="$OPTARG" ;;
    *) echo "Usage: $0 [-d diagram_dir] [-o output_dir] [-j plantuml.jar] [file …]" >&2; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

# Resolve PlantUML command
run_plantuml() {
  if [[ -n "$PLANTUML" && -f "$PLANTUML" ]]; then
    java -jar "$PLANTUML" "$@"
  elif command -v plantuml &>/dev/null; then
    plantuml "$@"
  else
    echo "Error: plantuml not found. Set PLANTUML_JAR or install plantuml." >&2
    exit 1
  fi
}

if ! command -v java &>/dev/null; then
  echo "Error: java is required but not found on PATH" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

# Collect files
files=()
if [[ $# -gt 0 ]]; then
  files=("$@")
else
  for f in "$DIAGRAM_DIR"/c4_*.puml; do
    [[ -f "$f" ]] && files+=("$f")
  done
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No C4 PlantUML files found in $DIAGRAM_DIR" >&2
  exit 1
fi

echo "Rendering ${#files[@]} C4 PlantUML diagram(s)…"
for f in "${files[@]}"; do
  name="$(basename "${f%.puml}")"
  run_plantuml -tsvg -o "$(cd "$(dirname "$f")" && pwd)/../../$OUT_DIR" "$f" 2>&1 | grep -v "^$" || true
  # plantuml writes output next to source by default; move if needed
  src_svg="$(dirname "$f")/${name}.svg"
  dest_svg="$OUT_DIR/${name}.svg"
  if [[ -f "$src_svg" && "$(realpath "$src_svg")" != "$(realpath "$dest_svg")" ]]; then
    mv "$src_svg" "$dest_svg"
  fi
  echo "  ✓ $dest_svg"
done
echo "Done."
