#!/usr/bin/env bash
# validate-comp-04.sh — Valida BatchTag.tsx
# Esperado: FAIL (RED) ate que o componente seja criado no Plano 03

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

check_absent() {
  local desc="$1"
  local file="$2"
  local pattern="$3"
  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    echo "FAIL $desc (arquivo nao existe: $file)"
    FAIL=$((FAIL + 1))
  elif ! grep -q "$pattern" "$PROJECT_ROOT/$file" 2>/dev/null; then
    echo "PASS $desc"
    PASS=$((PASS + 1))
  else
    echo "FAIL $desc (padrao '$pattern' encontrado — nao deveria estar presente)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== validate-comp-04.sh (BatchTag) ==="

check_absent "BatchTag.tsx NAO contem 'use client'" "components/stock/BatchTag.tsx" "'use client'"
check "DateTimeFormat ou toLocaleDateString em BatchTag.tsx" "components/stock/BatchTag.tsx" "DateTimeFormat\|toLocaleDateString"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
