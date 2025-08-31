#!/bin/bash
# PBCEx Pre-commit Secret Detection Script
# Scans staged files for potential secrets and blocks commits if found

# Skip on Windows (use Node alternative later)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  echo "⚠️  Windows detected, skipping secret scan (use Node alternative)"
  exit 0
fi

# Define secret patterns (case-insensitive)
declare -a PATTERNS=(
  "sk_(live|test)_[a-zA-Z0-9]+"
  "AKIA[0-9A-Z]{16}"
  "twilio.*auth.*token"
  "resend.*api.*key"
  "fedex.*(secret|password|key)"
  "-----BEGIN.*PRIVATE.*KEY-----"
  "access[_-]?token|refresh[_-]?token|api[_-]?key|bearer "
)

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No staged files to scan"
  exit 0
fi

echo "🔍 Scanning staged files for secrets..."

# Check each pattern
SECRETS_FOUND=0
for pattern in "${PATTERNS[@]}"; do
  # Search staged files for pattern (case-insensitive)
  MATCHES=$(echo "$STAGED_FILES" | xargs grep -l -i -E "$pattern" 2>/dev/null || true)
  
  if [ ! -z "$MATCHES" ]; then
    echo "❌ Potential secret detected (pattern: ${pattern}):"
    echo "$MATCHES" | sed 's/^/  - /'
    SECRETS_FOUND=1
  fi
done

if [ $SECRETS_FOUND -eq 1 ]; then
  echo ""
  echo "🚫 COMMIT BLOCKED: Potential secrets found in staged files"
  echo "📋 Actions required:"
  echo "  1. Remove secrets from files above"
  echo "  2. Use environment variables instead"
  echo "  3. Add secrets to .env (which is gitignored)"
  echo "  4. Run 'git add .' and commit again"
  echo ""
  echo "🔄 To bypass this check temporarily (NOT RECOMMENDED):"
  echo "  git commit --no-verify"
  exit 1
fi

echo "✅ No secrets detected in staged files"
exit 0
