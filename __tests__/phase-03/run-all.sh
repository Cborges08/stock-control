#!/usr/bin/env bash
# run-all.sh — Phase 3 Authentication validation suite
# Usage: bash __tests__/phase-03/run-all.sh
# Expected runtime: < 15 seconds

set -e
PHASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$PHASE_DIR/../.." && pwd)"

PASS=0
FAIL=0
ERRORS=()

run_script() {
  local script="$1"
  local name="$(basename $script .sh)"
  if bash "$script" > /dev/null 2>&1; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    FAIL=$((FAIL + 1))
    ERRORS+=("$name")
  fi
}

echo "=== Phase 3 Authentication — Validation Suite ==="
echo ""

run_script "$PHASE_DIR/validate-infra-04.sh"
run_script "$PHASE_DIR/validate-auth-01.sh"
run_script "$PHASE_DIR/validate-auth-06.sh"
run_script "$PHASE_DIR/validate-auth-layout.sh"
run_script "$PHASE_DIR/validate-middleware.sh"

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo "FAILED scripts: ${ERRORS[*]}"
  exit 1
else
  echo "All Phase 3 validations passed."
  exit 0
fi
