#!/usr/bin/env bash
# validate-infra-03.sh
# INFRA-03: Tailwind CSS v3 configured correctly with PostCSS
# Checks: tailwind.config.ts exists, content array covers app/ and components/,
#         postcss.config.js uses module.exports, globals.css has @tailwind directives,
#         layout.tsx imports globals.css
# Exit 0 = all checks passed; non-zero = failure

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FAIL=0

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAIL=1; }

echo ""
echo "=== INFRA-03: Tailwind CSS v3 configuration ==="

# --- 1. tailwind.config.ts exists ---
if [ -f "$ROOT/tailwind.config.ts" ]; then
  pass "tailwind.config.ts exists"
else
  fail "tailwind.config.ts not found"
fi

# --- 2. Tailwind version is v3 (not v4) ---
if grep -q '"tailwindcss"' "$ROOT/package.json"; then
  TW_VERSION=$(node -e "const p=require('./package.json'); const v=p.devDependencies?.tailwindcss||p.dependencies?.tailwindcss||''; console.log(v)" 2>/dev/null || echo "")
  if echo "$TW_VERSION" | grep -qE '^\^3\.|^3\.'; then
    pass "tailwindcss version is ^3.x ($TW_VERSION)"
  else
    fail "tailwindcss version is NOT ^3.x — got: $TW_VERSION (v4 would break shadcn/ui)"
  fi
else
  fail "tailwindcss not found in package.json"
fi

# --- 3. tailwind.config.ts content array covers app/ ---
if grep -q "'./app/\*\*" "$ROOT/tailwind.config.ts"; then
  pass "tailwind.config.ts content array includes './app/**'"
else
  fail "tailwind.config.ts does NOT include './app/**' in content array"
fi

# --- 4. tailwind.config.ts content array covers components/ (required for shadcn/ui) ---
if grep -q "'./components/\*\*" "$ROOT/tailwind.config.ts"; then
  pass "tailwind.config.ts content array includes './components/**'"
else
  fail "tailwind.config.ts does NOT include './components/**' — shadcn/ui components would render unstyled"
fi

# --- 5. postcss.config.js exists ---
if [ -f "$ROOT/postcss.config.js" ]; then
  pass "postcss.config.js exists"
else
  fail "postcss.config.js not found"
fi

# --- 6. postcss.config.js uses CommonJS module.exports (not ESM export default) ---
if grep -q 'module\.exports' "$ROOT/postcss.config.js"; then
  pass "postcss.config.js uses module.exports (CommonJS)"
else
  fail "postcss.config.js does NOT use module.exports — must be CommonJS, not ESM"
fi

# --- 7. postcss.config.js includes tailwindcss and autoprefixer plugins ---
if grep -q 'tailwindcss' "$ROOT/postcss.config.js"; then
  pass "postcss.config.js includes tailwindcss plugin"
else
  fail "postcss.config.js does NOT include tailwindcss plugin"
fi

if grep -q 'autoprefixer' "$ROOT/postcss.config.js"; then
  pass "postcss.config.js includes autoprefixer plugin"
else
  fail "postcss.config.js does NOT include autoprefixer plugin"
fi

# --- 8. app/globals.css exists with all three @tailwind directives ---
if [ -f "$ROOT/app/globals.css" ]; then
  pass "app/globals.css exists"
  for directive in '@tailwind base' '@tailwind components' '@tailwind utilities'; do
    if grep -q "$directive" "$ROOT/app/globals.css"; then
      pass "globals.css contains: $directive"
    else
      fail "globals.css MISSING directive: $directive"
    fi
  done
else
  fail "app/globals.css not found"
fi

# --- 9. app/layout.tsx imports globals.css ---
if [ -f "$ROOT/app/layout.tsx" ]; then
  if grep -q 'globals\.css' "$ROOT/app/layout.tsx"; then
    pass "app/layout.tsx imports globals.css"
  else
    fail "app/layout.tsx does NOT import globals.css"
  fi
else
  fail "app/layout.tsx not found (cannot check globals.css import)"
fi

# --- 10. app/layout.tsx has valid root layout structure ---
if [ -f "$ROOT/app/layout.tsx" ]; then
  if grep -q '<html' "$ROOT/app/layout.tsx"; then
    pass "app/layout.tsx contains <html> tag (valid root layout)"
  else
    fail "app/layout.tsx does NOT contain <html> tag — invalid root layout"
  fi
  if grep -q '<body' "$ROOT/app/layout.tsx"; then
    pass "app/layout.tsx contains <body> tag (valid root layout)"
  else
    fail "app/layout.tsx does NOT contain <body> tag — invalid root layout"
  fi
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "INFRA-03: ALL CHECKS PASSED"
  exit 0
else
  echo "INFRA-03: ONE OR MORE CHECKS FAILED"
  exit 1
fi
