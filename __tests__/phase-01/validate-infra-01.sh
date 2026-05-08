#!/usr/bin/env bash
# validate-infra-01.sh
# INFRA-01: Next.js + TypeScript project initialised correctly
# Checks: key deps present, tsconfig strict mode, no pages/ dir, tsc --noEmit passes
# Exit 0 = all checks passed; non-zero = failure

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FAIL=0

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAIL=1; }

echo ""
echo "=== INFRA-01: Next.js + TypeScript scaffolding ==="

# --- 1. package.json exists ---
if [ -f "$ROOT/package.json" ]; then
  pass "package.json exists"
else
  fail "package.json not found"
fi

# --- 2. Key runtime dependencies present ---
for dep in '"next"' '"react"' '"react-dom"' '"@supabase/ssr"' '"@supabase/supabase-js"' '"server-only"'; do
  if grep -q "$dep" "$ROOT/package.json"; then
    pass "dependency $dep found in package.json"
  else
    fail "dependency $dep MISSING from package.json"
  fi
done

# --- 3. Deprecated Supabase auth-helpers package must NOT be present ---
if grep -q '"@supabase/auth-helpers-nextjs"' "$ROOT/package.json"; then
  fail "@supabase/auth-helpers-nextjs is present (must be absent — deprecated package)"
else
  pass "@supabase/auth-helpers-nextjs absent from package.json"
fi

# --- 4. tsconfig.json exists with strict: true ---
if [ -f "$ROOT/tsconfig.json" ]; then
  pass "tsconfig.json exists"
  if grep -q '"strict": true' "$ROOT/tsconfig.json"; then
    pass "tsconfig.json has strict: true"
  else
    fail "tsconfig.json does NOT contain \"strict\": true"
  fi
  if grep -q '"noEmit": true' "$ROOT/tsconfig.json"; then
    pass "tsconfig.json has noEmit: true"
  else
    fail "tsconfig.json does NOT contain \"noEmit\": true"
  fi
else
  fail "tsconfig.json not found"
fi

# --- 5. App Router directory exists ---
if [ -d "$ROOT/app" ]; then
  pass "app/ directory exists (App Router)"
else
  fail "app/ directory not found — App Router not initialized"
fi

# --- 6. app/layout.tsx exists ---
if [ -f "$ROOT/app/layout.tsx" ]; then
  pass "app/layout.tsx exists"
else
  fail "app/layout.tsx not found"
fi

# --- 7. app/page.tsx exists ---
if [ -f "$ROOT/app/page.tsx" ]; then
  pass "app/page.tsx exists"
else
  fail "app/page.tsx not found"
fi

# --- 8. pages/ directory must NOT exist (App Router only) ---
if [ -d "$ROOT/pages" ]; then
  fail "pages/ directory exists — project should use App Router only (no pages/)"
else
  pass "pages/ directory absent (correct — App Router only)"
fi

# --- 9. next.config file exists (either .js or .ts or .mjs) ---
if [ -f "$ROOT/next.config.js" ] || [ -f "$ROOT/next.config.ts" ] || [ -f "$ROOT/next.config.mjs" ]; then
  pass "next.config file exists"
else
  fail "next.config.js / next.config.ts / next.config.mjs not found"
fi

# --- 10. TypeScript compilation passes ---
echo "  Running: npx tsc --noEmit (may take a few seconds)..."
if cd "$ROOT" && npx tsc --noEmit 2>&1 | grep -E "^.+\.tsx?:[0-9]" | grep -v "^$" | head -5; then
  # If grep found TypeScript errors (lines matching file:line pattern), fail
  fail "tsc --noEmit reported TypeScript errors (see above)"
else
  TSC_EXIT=${PIPESTATUS[0]}
  if [ "$TSC_EXIT" -eq 0 ]; then
    pass "npx tsc --noEmit exits with code 0 (no TypeScript errors)"
  else
    fail "npx tsc --noEmit exited with code $TSC_EXIT"
  fi
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "INFRA-01: ALL CHECKS PASSED"
  exit 0
else
  echo "INFRA-01: ONE OR MORE CHECKS FAILED"
  exit 1
fi
