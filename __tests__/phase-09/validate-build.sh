#!/usr/bin/env bash
# validate-build.sh — next build TypeScript check (Phase 09)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== validate-build.sh ==="
echo "Running: next build (TypeScript check)"

cd "$PROJECT_ROOT"

if npx next build 2>&1; then
  echo ""
  echo "PASS next build succeeded (zero TypeScript errors)"
  exit 0
else
  echo ""
  echo "FAIL next build failed (TypeScript or build error)"
  exit 1
fi
