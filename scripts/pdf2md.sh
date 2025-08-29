#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: pdf2md <path/to/file.pdf> [--media]"
  exit 1
fi

IN="$1"
if [ ! -f "$IN" ]; then
  echo "Error: file not found: $IN" >&2
  exit 2
fi

# Normalize output: same folder, same base name, .md extension
DIR="$(dirname "$IN")"
BASE="$(basename "$IN")"
NAME="${BASE%.*}"
OUT_MD="$DIR/$NAME.md"

# First extract text from PDF using pdftotext
TEMP_TXT="$DIR/${NAME}_temp.txt"
pdftotext "$IN" "$TEMP_TXT"

# Then convert text to GitHub-flavored Markdown
if [ "${2:-}" = "--media" ]; then
  pandoc "$TEMP_TXT" -f markdown -t gfm --extract-media="$DIR/${NAME}_media" -o "$OUT_MD"
else
  pandoc "$TEMP_TXT" -f markdown -t gfm -o "$OUT_MD"
fi

# Clean up temporary file
rm "$TEMP_TXT"

echo "✅ Converted:"
echo "  PDF: $IN"
echo "  MD : $OUT_MD"
