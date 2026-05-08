#!/usr/bin/env bash
# run-all.sh — Orquestrador de validacao Phase 07
# Executa todos os scripts de validacao em sequencia

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TOTAL_PASS=0
TOTAL_FAIL=0
FAILED_SCRIPTS=()

run_script() {
  local script="$1"
  local name
  name=$(basename "$script")
  echo ">>> Executando $name"
  if bash "$script"; then
    TOTAL_PASS=$((TOTAL_PASS + 1))
    echo ">>> $name: OK"
  else
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
    FAILED_SCRIPTS+=("$name")
    echo ">>> $name: FALHOU"
  fi
  echo ""
}

echo "============================================"
echo "  Phase 07 — Validation Suite"
echo "============================================"
echo ""

run_script "$SCRIPT_DIR/validate-movement-schema.sh"

echo "============================================"
echo "  RESUMO FINAL"
echo "  Scripts OK:      $TOTAL_PASS"
echo "  Scripts FALHOU:  $TOTAL_FAIL"

if [ $TOTAL_FAIL -gt 0 ]; then
  echo "  Falhas: ${FAILED_SCRIPTS[*]}"
fi

echo "============================================"

if [ $TOTAL_FAIL -gt 0 ]; then
  exit 1
fi

exit 0
