#!/usr/bin/env bash
# validate-comp-01.sh — Valida StockChart.tsx e StockChartLoader.tsx
# Esperado: FAIL (RED) ate que os componentes sejam criados no Plano 02

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
    echo "FAIL $desc (padrao '$pattern' encontrado em $file — nao deveria estar)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== validate-comp-01.sh (StockChart + StockChartLoader) ==="

check "'use client' em StockChart.tsx" "components/StockChart.tsx" "'use client'"
check "layout=\"vertical\" em StockChart.tsx" "components/StockChart.tsx" 'layout="vertical"'
check "ReferenceLine em StockChart.tsx" "components/StockChart.tsx" "ReferenceLine"
check "'ssr: false' em StockChartLoader.tsx" "components/StockChartLoader.tsx" "ssr: false"
check "next/dynamic em StockChartLoader.tsx" "components/StockChartLoader.tsx" "next/dynamic"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
