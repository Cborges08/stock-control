#!/usr/bin/env bash
# validate-comp-05.sh — Valida MovementTable.tsx
# Esperado: FAIL (RED) ate que o componente seja criado no Plano 04

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

echo "=== validate-comp-05.sh (MovementTable) ==="

check "'use client' em MovementTable.tsx" "components/MovementTable.tsx" "'use client'"
check "useState em MovementTable.tsx" "components/MovementTable.tsx" "useState"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
