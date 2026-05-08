#!/usr/bin/env bash
# validate-auth-06.sh — Verifica Server Actions de login e logout (AUTH-06)
set -e
ROOT="/c/Users/GTIL/Documents/stock_control"
LOGIN_ACTION="$ROOT/app/actions/auth-login.ts"
LOGOUT_ACTION="$ROOT/app/actions/auth-logout.ts"
PASS=0
FAIL=0

check() {
  local desc="$1"; local cmd="$2"; local expect="${3:-0}"
  if eval "$cmd" > /dev/null 2>&1; then
    [ "$expect" -eq 0 ] && { echo "  PASS: $desc"; PASS=$((PASS+1)); } || { echo "  FAIL: $desc"; FAIL=$((FAIL+1)); }
  else
    [ "$expect" -ne 0 ] && { echo "  PASS: $desc"; PASS=$((PASS+1)); } || { echo "  FAIL: $desc"; FAIL=$((FAIL+1)); }
  fi
}

echo "=== validate-auth-06.sh (AUTH-06: login/logout actions) ==="

# Login action
check "auth-login.ts existe" "test -f '$LOGIN_ACTION'"
check "auth-login tem 'use server'" "grep -q \"'use server'\" '$LOGIN_ACTION'"
check "auth-login chama signInWithPassword" "grep -q 'signInWithPassword' '$LOGIN_ACTION'"
check "auth-login redireciona para /retirada" "grep -q \"redirect('/retirada')\" '$LOGIN_ACTION'"
check "auth-login importa server client" "grep -q '@/lib/supabase/server' '$LOGIN_ACTION'"

# Logout action
check "auth-logout.ts existe" "test -f '$LOGOUT_ACTION'"
check "auth-logout tem 'use server'" "grep -q \"'use server'\" '$LOGOUT_ACTION'"
check "auth-logout chama signOut" "grep -q 'signOut' '$LOGOUT_ACTION'"
check "auth-logout redireciona para /login" "grep -q \"redirect('/login')\" '$LOGOUT_ACTION'"
check "auth-logout não é stub" "grep -q 'not yet implemented' '$LOGOUT_ACTION'" 1

echo ""; echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
