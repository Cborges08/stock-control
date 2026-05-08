#!/usr/bin/env bash
# validate-infra-04.sh — Verifica instalação do shadcn/ui (INFRA-04)
set -e
ROOT="/c/Users/GTIL/Documents/stock_control"
PASS=0
FAIL=0

check() {
  local desc="$1"; local cmd="$2"; local expect="${3:-0}"
  if eval "$cmd" > /dev/null 2>&1; then
    [ "$expect" -eq 0 ] && { echo "  PASS: $desc"; PASS=$((PASS+1)); } || { echo "  FAIL: $desc"; FAIL=$((FAIL+1)); }
  else
    [ "$expect" -ne 0 ] && { echo "  PASS: $desc"; PASS=$((PASS+1)); } || { echo "  FAIL: $desc"; FAIL=$((FAIL+1)); }
  fi
}

echo "=== validate-infra-04.sh (INFRA-04: shadcn/ui) ==="
check "components.json existe" "test -f '$ROOT/components.json'"
check "lib/utils.ts existe" "test -f '$ROOT/lib/utils.ts'"
check "lib/utils.ts contém twMerge" "grep -q 'twMerge' '$ROOT/lib/utils.ts'"
check "lib/utils.ts contém clsx" "grep -q 'clsx' '$ROOT/lib/utils.ts'"
check "lib/utils.ts exporta cn" "grep -q 'export function cn\|export const cn' '$ROOT/lib/utils.ts'"
check "components/ui/button.tsx existe" "test -f '$ROOT/components/ui/button.tsx'"
check "components/ui/card.tsx existe" "test -f '$ROOT/components/ui/card.tsx'"
check "components/ui/input.tsx existe" "test -f '$ROOT/components/ui/input.tsx'"
check "components/ui/label.tsx existe" "test -f '$ROOT/components/ui/label.tsx'"
check "package.json contém clsx" "grep -q '\"clsx\"' '$ROOT/package.json'"
check "package.json contém tailwind-merge" "grep -q '\"tailwind-merge\"' '$ROOT/package.json'"
check "globals.css contém CSS variables shadcn" "grep -q '\-\-background:' '$ROOT/app/globals.css'"

echo ""; echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
