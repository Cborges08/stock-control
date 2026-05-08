#!/usr/bin/env bash
# validate-infra-06.sh
# INFRA-06: App route structure + middleware auth guard
# Checks: route files exist, middleware has redirectWithCookies, API 401 guard,
#         getUser() used (not getSession()), supabaseResponse returned
# Exit 0 = all checks passed; non-zero = failure

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FAIL=0

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAIL=1; }

echo ""
echo "=== INFRA-06: Route structure + middleware auth guard ==="

# ---- Route file structure ----

# --- 1. app/(auth)/login/page.tsx exists ---
if [ -f "$ROOT/app/(auth)/login/page.tsx" ]; then
  pass "app/(auth)/login/page.tsx exists"
  if grep -q 'export default function LoginPage' "$ROOT/app/(auth)/login/page.tsx"; then
    pass "LoginPage has a default export"
  else
    fail "LoginPage does NOT have 'export default function LoginPage'"
  fi
else
  fail "app/(auth)/login/page.tsx not found"
fi

# --- 2. app/(dashboard)/layout.tsx exists ---
if [ -f "$ROOT/app/(dashboard)/layout.tsx" ]; then
  pass "app/(dashboard)/layout.tsx exists"
  if grep -q 'export default function DashboardLayout' "$ROOT/app/(dashboard)/layout.tsx"; then
    pass "DashboardLayout has a default export"
  else
    fail "DashboardLayout does NOT have 'export default function DashboardLayout'"
  fi
else
  fail "app/(dashboard)/layout.tsx not found"
fi

# --- 3. app/(dashboard)/entrada/page.tsx exists ---
if [ -f "$ROOT/app/(dashboard)/entrada/page.tsx" ]; then
  pass "app/(dashboard)/entrada/page.tsx exists"
else
  fail "app/(dashboard)/entrada/page.tsx not found"
fi

# --- 4. app/(dashboard)/retirada/page.tsx exists ---
if [ -f "$ROOT/app/(dashboard)/retirada/page.tsx" ]; then
  pass "app/(dashboard)/retirada/page.tsx exists"
else
  fail "app/(dashboard)/retirada/page.tsx not found"
fi

# ---- middleware.ts checks ----

MIDDLEWARE="$ROOT/middleware.ts"

# --- 5. middleware.ts exists at project root ---
if [ -f "$MIDDLEWARE" ]; then
  pass "middleware.ts exists at project root"
else
  fail "middleware.ts not found at project root"
fi

# --- 6. middleware uses getUser() for auth checks ---
if grep -q 'supabase\.auth\.getUser()' "$MIDDLEWARE"; then
  pass "middleware calls supabase.auth.getUser()"
else
  fail "middleware does NOT call supabase.auth.getUser()"
fi

# --- 7. middleware does NOT call getSession() in code (security: getSession is client-only, not server-validated)
#         Comments mentioning getSession() as a warning are acceptable; actual calls are not.
#         A call looks like: .getSession() or supabase.auth.getSession() — always preceded by non-space chars.
if grep -v '^\s*\*' "$MIDDLEWARE" | grep -v '^\s*//' | grep -q 'getSession()'; then
  fail "middleware has a live getSession() call — SECURITY BUG: must use getUser() which validates JWT server-side"
else
  pass "middleware does NOT call getSession() in live code (correct; warning comments are acceptable)"
fi

# --- 8. redirectWithCookies helper exists (prevents JWT token loss on redirects) ---
if grep -q 'function redirectWithCookies' "$MIDDLEWARE"; then
  pass "middleware has redirectWithCookies helper function"
else
  fail "middleware does NOT have redirectWithCookies helper — refreshed JWT tokens will be discarded on redirects"
fi

# --- 9. supabaseResponse.cookies.getAll() is called inside redirectWithCookies ---
if grep -q 'supabaseResponse\.cookies\.getAll()' "$MIDDLEWARE"; then
  pass "middleware forwards supabaseResponse cookies via .getAll()"
else
  fail "middleware does NOT call supabaseResponse.cookies.getAll() — cookie forwarding missing"
fi

# --- 10. No bare NextResponse.redirect() calls outside the helper definition ---
# Grep returns exit 1 when no match found; that is the success case here, so invert.
# We exclude the one legitimate occurrence inside the helper definition itself.
if grep 'NextResponse\.redirect(' "$MIDDLEWARE" | grep -qv 'const redirectResponse = NextResponse\.redirect'; then
  fail "Found bare NextResponse.redirect() call(s) outside the helper — these discard refreshed auth cookies"
else
  pass "No bare NextResponse.redirect() calls outside the helper (all use redirectWithCookies)"
fi

# --- 11. API 401 guard: unauthenticated /api/* requests get JSON 401 (not HTML redirect) ---
if grep -q "pathname\.startsWith('/api/')" "$MIDDLEWARE"; then
  pass "middleware has API route guard (pathname.startsWith('/api/'))"
else
  fail "middleware does NOT guard /api/* routes — fetch() callers would receive HTML 302 instead of JSON 401"
fi

if grep -q "status: 401" "$MIDDLEWARE"; then
  pass "middleware returns HTTP 401 for unauthenticated API requests"
else
  fail "middleware does NOT return 401 status for unauthenticated API requests"
fi

# --- 12. API guard appears BEFORE the general unauthenticated redirect (order is load-bearing) ---
API_GUARD_LINE=$(grep -n "pathname\.startsWith('/api/')" "$MIDDLEWARE" | head -1 | cut -d: -f1)
GENERAL_REDIRECT_LINE=$(grep -n "pathname !== '/login'" "$MIDDLEWARE" | head -1 | cut -d: -f1)

if [ -n "$API_GUARD_LINE" ] && [ -n "$GENERAL_REDIRECT_LINE" ]; then
  if [ "$API_GUARD_LINE" -lt "$GENERAL_REDIRECT_LINE" ]; then
    pass "API guard (line $API_GUARD_LINE) appears BEFORE general redirect (line $GENERAL_REDIRECT_LINE) — correct order"
  else
    fail "API guard (line $API_GUARD_LINE) appears AFTER general redirect (line $GENERAL_REDIRECT_LINE) — /api/* routes would hit HTML redirect first"
  fi
else
  fail "Could not determine line order of API guard vs general redirect"
fi

# --- 13. Role check uses app_metadata (not user_metadata which is user-writable) ---
if grep -q 'app_metadata' "$MIDDLEWARE"; then
  pass "middleware reads from app_metadata (server-controlled, not user-writable)"
else
  fail "middleware does NOT reference app_metadata for role checks"
fi

# Exclude comment lines (lines starting with optional whitespace then // or *)
# user_metadata may appear in warning comments — only live code references are a bug
if grep -v '^\s*//' "$MIDDLEWARE" | grep -v '^\s*\*' | grep -q 'user_metadata'; then
  fail "middleware has live user_metadata reference — SECURITY BUG: user_metadata is user-writable and must not be trusted for role checks"
else
  pass "middleware does NOT use user_metadata in live code (correct; warning comments are acceptable)"
fi

# --- 14. Middleware exports config with matcher ---
if grep -q 'export const config' "$MIDDLEWARE"; then
  pass "middleware exports config with matcher"
else
  fail "middleware does NOT export config with matcher"
fi

if grep -q '_next/static' "$MIDDLEWARE"; then
  pass "matcher excludes _next/static"
else
  fail "matcher does NOT exclude _next/static"
fi

# --- 15. Final return is supabaseResponse (not plain NextResponse.next()) ---
# Check last return statement is supabaseResponse
if grep -q 'return supabaseResponse' "$MIDDLEWARE"; then
  pass "middleware returns supabaseResponse (preserves refreshed auth cookies)"
else
  fail "middleware does NOT return supabaseResponse — refreshed auth cookies will be lost"
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "INFRA-06: ALL CHECKS PASSED"
  exit 0
else
  echo "INFRA-06: ONE OR MORE CHECKS FAILED"
  exit 1
fi
