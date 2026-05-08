#!/usr/bin/env bash
# validate-stockchart-pages.sh — Verifica StockChartLoader em /entrada e /retirada

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

echo "=== validate-stockchart-pages.sh ==="

check "StockChartLoader importado em entrada/page.tsx (D-07)" \
  "app/(dashboard)/entrada/page.tsx" "StockChartLoader"
check "h-[200px] container em entrada (D-07)" \
  "app/(dashboard)/entrada/page.tsx" 'h-\[200px\]'
check "StockChartLoader importado em retirada/page.tsx (D-07)" \
  "app/(dashboard)/retirada/page.tsx" "StockChartLoader"
check "h-[200px] container em retirada (D-07)" \
  "app/(dashboard)/retirada/page.tsx" 'h-\[200px\]'

echo ""
echo "=== Resultado: $PASS passou, $FAIL falhou ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
