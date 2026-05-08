#!/usr/bin/env bash
# validate-auth-layout.sh — Verifica dashboard layout (AUTH-02, AUTH-05)
set -e
ROOT="/c/Users/GTIL/Documents/stock_control"
LAYOUT="$ROOT/app/(dashboard)/layout.tsx"
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

echo "=== validate-auth-layout.sh (AUTH-02, AUTH-05: dashboard layout) ==="
check "layout.tsx existe" "test -f '$LAYOUT'"
check "não é mais placeholder" "grep -q 'Placeholder' '$LAYOUT'" 1
check "sem 'use client' (deve ser Server Component)" "grep -q \"'use client'\" '$LAYOUT'" 1
check "chama getUser()" "grep -q 'getUser()' '$LAYOUT'"
check "não chama getSession() (ignora comentários)" "grep -v '^\s*//' '$LAYOUT' | grep -q 'getSession()'" 1
check "redireciona para /login se sem usuário" "grep -q \"redirect('/login')\" '$LAYOUT'"
check "busca tabela profiles" "grep -q \"from('profiles')\" '$LAYOUT'"
check "usa display_name" "grep -q 'display_name' '$LAYOUT'"
check "tem fallback para email" "grep -q 'user.email\|email.*??' '$LAYOUT'"
check "importa logout action" "grep -q 'auth-logout' '$LAYOUT'"
check "contém botão Sair" "grep -q 'Sair' '$LAYOUT'"
check "sidebar com Fava Sorvetes" "grep -q 'Fava Sorvetes' '$LAYOUT'"

echo ""; echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
