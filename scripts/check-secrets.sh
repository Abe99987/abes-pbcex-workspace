#!/usr/bin/env bash
set -euo pipefail

# Robust POSIX-safe secret scanner for git pre-commit hooks
# Checks only staged files for common secret patterns

PATTERN='(sk_(live|test)_[0-9a-zA-Z]+|AKIA[0-9A-Z]{16}|twilio.*auth.*token|resend.*api.*key|fedex.*(secret|password|key)|-----BEGIN[[:space:]]+.*PRIVATE KEY-----)'
found=0

# Check if running on Windows (Git Bash, WSL, etc.)
if [[ "${OSTYPE:-}" =~ ^(msys|win32|cygwin) ]]; then
  echo "🔍 Secret scanner: Skipping on Windows (${OSTYPE}). Install native Node.js scanner for full coverage."
  exit 0
fi

# Only check staged files that are added/modified/copied/renamed
if ! git diff --cached --name-only --diff-filter=ACMR -z 2>/dev/null | head -c1 | grep -q .; then
  echo "ℹ️ No staged files to check for secrets."
  exit 0
fi

echo "🔍 Scanning staged files for secrets..."

git diff --cached --name-only --diff-filter=ACMR -z | \
while IFS= read -r -d '' f; do
  # Skip if file doesn't exist (could be deleted)
  [[ -f "$f" ]] || continue
  
  # Skip large/binary files cheaply (>1MB or binary content)
  if [[ $(wc -c < "$f" 2>/dev/null || echo 0) -gt 1048576 ]]; then
    continue
  fi
  
  if file --brief --mime "$f" 2>/dev/null | grep -qi 'charset=binary'; then
    continue
  fi
  
  # Case-insensitive search for secret patterns
  if grep -nE -i "$PATTERN" "$f" >/dev/null 2>&1; then
    echo "❌ Potential secret detected in: $f"
    echo "   Run: git diff --cached '$f' | grep -E -i '$PATTERN' --color=always"
    found=1
  fi
done

if [ "$found" -eq 1 ]; then
  echo ""
  echo "🚫 COMMIT BLOCKED: Potential secrets detected in staged files."
  echo "   Remove or mask secrets, then re-stage and commit."
  echo "   To bypass (emergency only): git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ No secrets detected in staged files."
exit 0