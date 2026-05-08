#!/usr/bin/env bash
# validate-comp-02.sh — Valida ProductCard.tsx
# Esperado: FAIL (RED) ate que o componente seja criado no Plano 02

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PASS=0
FAIL=0

check() {
  local desc="$1"
  local file="$2"
  local pattern="$3"
  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    echo "FAIL $desc (arquivo nao existe: $file)"
    FAIL=$((FAIL + 1))
  elif grep -q "$pattern" "$PROJECT_ROOT/$file" 2>/dev/null; then
    echo "PASS $desc"
    PASS=$((PASS + 1))
  else
    echo "FAIL $desc (padrao '$pattern' nao encontrado em $file)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== validate-comp-02.sh (ProductCard) ==="

check "'use client' em ProductCard.tsx" "components/ProductCard.tsx" "'use client'"
check "disabled em ProductCard.tsx" "components/ProductCard.tsx" "disabled"
check "parseNumeric em ProductCard.tsx" "components/ProductCard.tsx" "parseNumeric"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
