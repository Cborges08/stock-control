#!/usr/bin/env bash
# validate-middleware.sh
# Verifica que middleware.ts implementa corretamente o RBAC com getUser() + app_metadata
#
# Checks:
#   1. getUser() presente (não getSession())
#   2. getSession() ausente (risco de segurança)
#   3. app_metadata usado para role
#   4. user_metadata ausente para decisões RBAC
#   5. supabaseResponse retornado
#   6. NextResponse.next() puro ausente
#   7. Guard /entrada presente
#   8. Redirect /login para não-autenticados

set -e

# Detectar caminho do middleware dinamicamente a partir da localização do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIDDLEWARE="${SCRIPT_DIR}/../../middleware.ts"

if [ ! -f "$MIDDLEWARE" ]; then
  echo "ERRO: middleware.ts não encontrado em: $MIDDLEWARE"
  exit 1
fi

PASS=0
FAIL=0

check() {
  local description="$1"
  local command="$2"
  local expected_exit="${3:-0}"

  if eval "$command" > /dev/null 2>&1; then
    if [ "$expected_exit" -eq 0 ]; then
      echo "  PASS: $description"
      PASS=$((PASS + 1))
    else
      echo "  FAIL: $description (esperado NÃO encontrar)"
      FAIL=$((FAIL + 1))
    fi
  else
    if [ "$expected_exit" -ne 0 ]; then
      echo "  PASS: $description"
      PASS=$((PASS + 1))
    else
      echo "  FAIL: $description"
      FAIL=$((FAIL + 1))
    fi
  fi
}

echo "=== validate-middleware.sh ==="
echo "Arquivo: $MIDDLEWARE"
echo ""

# Check 1: getUser() chamado (não apenas mencionado em comentário)
check "getUser() presente" "grep -q 'supabase.auth.getUser()' '$MIDDLEWARE'"

# Check 2: getSession() não é chamado (comentários OK, chamada real não)
check "getSession() ausente (risco de segurança)" "grep -qE '(supabase\.auth\.getSession|await.*getSession)' '$MIDDLEWARE'" 1

# Check 3: app_metadata usado para role
check "app_metadata usado para role" "grep -q 'app_metadata' '$MIDDLEWARE'"

# Check 4: user_metadata não é usado para decisões de segurança
check "user_metadata ausente (não confiável para RBAC)" "grep -qE 'user_metadata\?\.' '$MIDDLEWARE'" 1

# Check 5: supabaseResponse retornado no final
check "supabaseResponse retornado" "grep -q 'return supabaseResponse' '$MIDDLEWARE'"

# Check 6: NextResponse.next() puro não retornado (return statement)
check "NextResponse.next() puro ausente" "grep -q 'return NextResponse.next()' '$MIDDLEWARE'" 1

# Check 7: Guard /entrada presente
check "Guard /entrada presente" "grep -q \"pathname.startsWith('/entrada')\" '$MIDDLEWARE'"

# Check 8: Redirect /login para não-autenticados
check "Redirect /login para não-autenticados" "grep -q \"pathname !== '/login'\" '$MIDDLEWARE'"

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo "FAIL: middleware.ts tem problemas de segurança"
  exit 1
else
  echo "PASS: middleware.ts implementado corretamente"
  exit 0
fi
