#!/usr/bin/env bash
# Validation script for Phase 09 Plan 01: Sidebar Navigation
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PASS=0
FAIL=0

check() {
  local description="$1"
  local file="$2"
  local pattern="$3"
  local filepath="$PROJECT_ROOT/$file"

  if grep -q "$pattern" "$filepath" 2>/dev/null; then
    echo "  PASS: $description"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $description (pattern '$pattern' not found in $file)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Phase 09-01: Sidebar Navigation Validation ==="
echo ""

echo "-- NavLinks.tsx --"
check "'use client' em NavLinks" "components/NavLinks.tsx" "'use client'"
check "usePathname em NavLinks" "components/NavLinks.tsx" "usePathname"
check "PackagePlus em NavLinks (D-03)" "components/NavLinks.tsx" "PackagePlus"
check "PackageMinus em NavLinks (D-03)" "components/NavLinks.tsx" "PackageMinus"
check "bg-rose-50 active class (D-02)" "components/NavLinks.tsx" "bg-rose-50"
check "role check (D-01)" "components/NavLinks.tsx" "admin"
check "/entrada href" "components/NavLinks.tsx" "/entrada"
check "/retirada href" "components/NavLinks.tsx" "/retirada"

echo ""
echo "-- MobileSidebar.tsx --"
check "'use client' em MobileSidebar" "components/MobileSidebar.tsx" "'use client'"
check "Sheet importado (D-06)" "components/MobileSidebar.tsx" "Sheet"

echo ""
echo "-- layout.tsx --"
check "NavLinks em layout.tsx" "app/(dashboard)/layout.tsx" "NavLinks"
check "MobileSidebar em layout.tsx" "app/(dashboard)/layout.tsx" "MobileSidebar"
check "hidden lg:flex em aside (D-05)" "app/(dashboard)/layout.tsx" "hidden lg:flex"
check "role extraction em layout" "app/(dashboard)/layout.tsx" "app_metadata"

echo ""
echo "-- Append-only check (D-11) --"
UPDATES=$(grep -r "UPDATE.*stock_movements" "$PROJECT_ROOT/supabase/migrations/" 2>/dev/null | grep -v "smoke-test" || true)
DELETES=$(grep -r "DELETE.*stock_movements" "$PROJECT_ROOT/supabase/migrations/" 2>/dev/null | grep -v "smoke-test" || true)

if [ -z "$UPDATES" ] && [ -z "$DELETES" ]; then
  echo "  PASS: No UPDATE/DELETE on stock_movements in migrations"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Found UPDATE/DELETE on stock_movements in migrations"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
