#!/usr/bin/env bash
# validate-auth-01.sh — Verifica página de login (AUTH-01)
set -e
ROOT="/c/Users/GTIL/Documents/stock_control"
LOGIN_PAGE="$ROOT/app/(auth)/login/page.tsx"
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

echo "=== validate-auth-01.sh (AUTH-01: login page) ==="
check "login page.tsx existe" "test -f '$LOGIN_PAGE'"
check "não é mais o placeholder" "grep -q 'Login — em breve' '$LOGIN_PAGE'" 1
check "contém type=\"email\"" "grep -q 'type=\"email\"' '$LOGIN_PAGE'"
check "contém type=\"password\"" "grep -q 'type=\"password\"' '$LOGIN_PAGE'"
check "contém label Email" "grep -q 'Email' '$LOGIN_PAGE'"
check "contém label Senha" "grep -q 'Senha' '$LOGIN_PAGE'"
check "contém título Fava Sorvetes" "grep -q 'Fava Sorvetes' '$LOGIN_PAGE'"
check "contém botão Entrar" "grep -q 'Entrar' '$LOGIN_PAGE'"
check "importa shadcn Card" "grep -q \"@/components/ui/card\" '$LOGIN_PAGE'"
check "importa shadcn Input ou Button" "grep -qE \"@/components/ui/(input|button)\" '$LOGIN_PAGE'"
check "contém mensagem Credenciais inválidas" "grep -q 'Credenciais inválidas' '$LOGIN_PAGE'"
check "contém role=\"alert\"" "grep -q 'role=\"alert\"' '$LOGIN_PAGE'"
check "contém bg-rose-50" "grep -q 'bg-rose-50' '$LOGIN_PAGE'"
check "contém assinatura cursiva fava" "grep -q 'cursive\|fava' '$LOGIN_PAGE'"

echo ""; echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
