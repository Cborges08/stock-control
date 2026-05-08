#!/usr/bin/env bash
# validate-sidebar.sh — Phase 06 sidebar and page structure validation
# Checks file existence and key patterns via grep

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

cd "$PROJECT_ROOT"

echo "--- validate-sidebar.sh ---"

# SidebarStockPanel checks
check "'use client' em SidebarStockPanel" \
  "components/invoice/SidebarStockPanel.tsx" "'use client'"
check "StockChartLoader importado em SidebarStockPanel" \
  "components/invoice/SidebarStockPanel.tsx" "StockChartLoader"
check "ProductStatusBadge importado em SidebarStockPanel" \
  "components/invoice/SidebarStockPanel.tsx" "ProductStatusBadge"

# Page.tsx checks
check "getUser em page.tsx (nunca getSession)" \
  "app/(dashboard)/entrada/page.tsx" "getUser"
check "parseNumeric em page.tsx" \
  "app/(dashboard)/entrada/page.tsx" "parseNumeric"
check "InvoiceForm renderizado em page.tsx" \
  "app/(dashboard)/entrada/page.tsx" "InvoiceForm"
check "SidebarStockPanel renderizado em page.tsx" \
  "app/(dashboard)/entrada/page.tsx" "SidebarStockPanel"
check "product_stock query em page.tsx" \
  "app/(dashboard)/entrada/page.tsx" "product_stock"
check "Layout flex gap-8 em page.tsx" \
  "app/(dashboard)/entrada/page.tsx" "flex gap-8"

# InvoiceForm checks
check "'use client' em InvoiceForm" \
  "components/invoice/InvoiceForm.tsx" "'use client'"
check "zodResolver em InvoiceForm" \
  "components/invoice/InvoiceForm.tsx" "zodResolver"
check "router.refresh em InvoiceForm" \
  "components/invoice/InvoiceForm.tsx" "router.refresh"

# InvoiceItemsTable checks
check "'use client' em InvoiceItemsTable" \
  "components/invoice/InvoiceItemsTable.tsx" "'use client'"
check "useFieldArray em InvoiceItemsTable" \
  "components/invoice/InvoiceItemsTable.tsx" "useFieldArray"
check "key={field.id} em InvoiceItemsTable" \
  "components/invoice/InvoiceItemsTable.tsx" "key={field.id}"

# Toaster in layout
check "Toaster em app/layout.tsx" \
  "app/layout.tsx" "Toaster"

echo ""
echo "Resultado: $PASS passou, $FAIL falhou"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
