#!/usr/bin/env bash
# run-all.sh
# Phase 01 — Project Scaffolding: run all Nyquist validation scripts
# Exit 0 = all validations passed; non-zero = one or more failed

set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
TOTAL=0
PASSED=0
FAILED=0
FAILED_NAMES=()

run_check() {
  local script="$1"
  local name
  name="$(basename "$script")"
  TOTAL=$((TOTAL + 1))

  bash "$script"
  local exit_code=$?

  if [ "$exit_code" -eq 0 ]; then
    PASSED=$((PASSED + 1))
    echo "  -> $name: PASSED"
  else
    FAILED=$((FAILED + 1))
    FAILED_NAMES+=("$name")
    echo "  -> $name: FAILED (exit $exit_code)"
  fi
  echo ""
}

echo "========================================================"
echo " Phase 01 — Project Scaffolding: Nyquist Validation"
echo "========================================================"
echo ""

run_check "$DIR/validate-infra-01.sh"
run_check "$DIR/validate-infra-03.sh"
run_check "$DIR/validate-infra-06.sh"
run_check "$DIR/validate-infra-02.sh"

echo "========================================================"
echo " SUMMARY: $PASSED/$TOTAL checks passed"
echo "========================================================"

if [ "$FAILED" -gt 0 ]; then
  echo ""
  echo "FAILED scripts:"
  for name in "${FAILED_NAMES[@]}"; do
    echo "  - $name"
  done
  echo ""
  echo "Phase 01 validation: FAILED"
  exit 1
else
  echo ""
  echo "Phase 01 validation: ALL PASSED"
  exit 0
fi
