#!/usr/bin/env bash
# validate-infra-02.sh
# INFRA-02: Supabase clients + env vars
# Checks: client.ts / server.ts / service.ts exist with correct creator functions,
#         .env.local has required env vars
# Exit 0 = all checks passed; non-zero = failure

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FAIL=0

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAIL=1; }

echo ""
echo "=== INFRA-02: Supabase clients + environment variables ==="

# ---- lib/supabase/client.ts ----

CLIENT="$ROOT/lib/supabase/client.ts"

if [ -f "$CLIENT" ]; then
  pass "lib/supabase/client.ts exists"

  # Must use createBrowserClient (not createClient) for browser context
  if grep -q 'createBrowserClient' "$CLIENT"; then
    pass "client.ts uses createBrowserClient (@supabase/ssr)"
  else
    fail "client.ts does NOT use createBrowserClient — wrong Supabase client for browser context"
  fi

  # Must export a createClient function
  if grep -q 'export function createClient' "$CLIENT"; then
    pass "client.ts exports createClient()"
  else
    fail "client.ts does NOT export createClient()"
  fi

  # Must NOT import 'server-only' (it's a browser client)
  if grep -q "import 'server-only'" "$CLIENT"; then
    fail "client.ts imports 'server-only' — browser client must NOT have this guard"
  else
    pass "client.ts does NOT import 'server-only' (correct for browser client)"
  fi
else
  fail "lib/supabase/client.ts not found"
fi

# ---- lib/supabase/server.ts ----

SERVER="$ROOT/lib/supabase/server.ts"

if [ -f "$SERVER" ]; then
  pass "lib/supabase/server.ts exists"

  # Must use createServerClient for SSR context
  if grep -q 'createServerClient' "$SERVER"; then
    pass "server.ts uses createServerClient (@supabase/ssr)"
  else
    fail "server.ts does NOT use createServerClient — wrong Supabase client for server context"
  fi

  # Must export a createClient function
  if grep -q 'export function createClient' "$SERVER"; then
    pass "server.ts exports createClient()"
  else
    fail "server.ts does NOT export createClient()"
  fi

  # Must have server-only guard to prevent browser bundling
  if grep -q "import 'server-only'" "$SERVER"; then
    pass "server.ts imports 'server-only' guard"
  else
    fail "server.ts does NOT import 'server-only' — could be accidentally bundled for the browser"
  fi

  # Must use getAll/setAll cookie pattern (not getCookie/setCookie)
  if grep -q 'getAll()' "$SERVER"; then
    pass "server.ts uses getAll() cookie pattern"
  else
    fail "server.ts does NOT use getAll() cookie pattern"
  fi
else
  fail "lib/supabase/server.ts not found"
fi

# ---- lib/supabase/service.ts ----

SERVICE="$ROOT/lib/supabase/service.ts"

if [ -f "$SERVICE" ]; then
  pass "lib/supabase/service.ts exists"

  # Must use createClient from @supabase/supabase-js (service role uses base client)
  if grep -q "from '@supabase/supabase-js'" "$SERVICE"; then
    pass "service.ts imports from @supabase/supabase-js"
  else
    fail "service.ts does NOT import from @supabase/supabase-js"
  fi

  # Must export createServiceClient (different name to avoid collision with server.ts)
  if grep -q 'export function createServiceClient' "$SERVICE"; then
    pass "service.ts exports createServiceClient()"
  else
    fail "service.ts does NOT export createServiceClient()"
  fi

  # Must have server-only guard (service role key must never reach browser)
  if grep -q "import 'server-only'" "$SERVICE"; then
    pass "service.ts imports 'server-only' guard"
  else
    fail "service.ts does NOT import 'server-only' — SECURITY: service role key would be bundled for browser"
  fi

  # Must use SUPABASE_SERVICE_ROLE_KEY (not ANON key)
  if grep -q 'SUPABASE_SERVICE_ROLE_KEY' "$SERVICE"; then
    pass "service.ts uses SUPABASE_SERVICE_ROLE_KEY"
  else
    fail "service.ts does NOT use SUPABASE_SERVICE_ROLE_KEY — service client would use anon key, bypassing RLS would be ineffective"
  fi

  # Must disable autoRefreshToken and persistSession (stateless server client)
  if grep -q 'autoRefreshToken: false' "$SERVICE"; then
    pass "service.ts has autoRefreshToken: false"
  else
    fail "service.ts does NOT have autoRefreshToken: false"
  fi

  if grep -q 'persistSession: false' "$SERVICE"; then
    pass "service.ts has persistSession: false"
  else
    fail "service.ts does NOT have persistSession: false"
  fi
else
  fail "lib/supabase/service.ts not found"
fi

# ---- .env.local environment variables ----

ENVFILE="$ROOT/.env.local"

if [ -f "$ENVFILE" ]; then
  pass ".env.local exists"

  if grep -q 'NEXT_PUBLIC_SUPABASE_URL=' "$ENVFILE"; then
    # Check value is not empty
    URL_VAL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$ENVFILE" | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ -n "$URL_VAL" ]; then
      pass "NEXT_PUBLIC_SUPABASE_URL is set in .env.local"
    else
      fail "NEXT_PUBLIC_SUPABASE_URL key exists but value is empty in .env.local"
    fi
  else
    fail "NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
  fi

  if grep -q 'NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENVFILE"; then
    ANON_VAL=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENVFILE" | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ -n "$ANON_VAL" ]; then
      pass "NEXT_PUBLIC_SUPABASE_ANON_KEY is set in .env.local"
    else
      fail "NEXT_PUBLIC_SUPABASE_ANON_KEY key exists but value is empty in .env.local"
    fi
  else
    fail "NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local"
  fi
else
  fail ".env.local not found — Supabase clients will fail at runtime (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required)"
fi

# ---- node_modules sanity check ----

if [ -d "$ROOT/node_modules/@supabase/ssr" ]; then
  pass "node_modules/@supabase/ssr is installed"
else
  fail "node_modules/@supabase/ssr not found — run npm install"
fi

if [ -d "$ROOT/node_modules/server-only" ]; then
  pass "node_modules/server-only is installed"
else
  fail "node_modules/server-only not found — run npm install"
fi

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "INFRA-02: ALL CHECKS PASSED"
  exit 0
else
  echo "INFRA-02: ONE OR MORE CHECKS FAILED"
  exit 1
fi
