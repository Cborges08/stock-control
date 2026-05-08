#!/usr/bin/env bash
# validate-cnpj.sh — Testa validateCnpj (Modulo-11)
# Fase 05, Plano 02 — CNPJ validator

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PASS=0
FAIL=0

check() {
  local desc="$1"
  local result
  result=$(npx tsx -e "$2" 2>&1)
  if [ "$result" = "ok" ]; then
    echo "PASS $desc"
    PASS=$((PASS + 1))
  else
    echo "FAIL $desc (got: $result)"
    FAIL=$((FAIL + 1))
  fi
}

if [ ! -f "$PROJECT_ROOT/lib/validators/cnpj.ts" ]; then
  echo "FAIL lib/validators/cnpj.ts nao existe"
  exit 1
fi

echo "=== validate-cnpj.sh ==="
cd "$PROJECT_ROOT"

check "CNPJ valido 11222333000181 retorna true" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(validateCnpj('11222333000181')?'ok':'fail')"

check "CNPJ formatado 11.222.333/0001-81 retorna true (strip)" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(validateCnpj('11.222.333/0001-81')?'ok':'fail')"

check "CNPJ todos zeros retorna false" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(!validateCnpj('00000000000000')?'ok':'fail')"

check "CNPJ todos uns retorna false" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(!validateCnpj('11111111111111')?'ok':'fail')"

check "CNPJ digito errado 11222333000182 retorna false" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(!validateCnpj('11222333000182')?'ok':'fail')"

check "CNPJ curto 1122233300018 retorna false" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(!validateCnpj('1122233300018')?'ok':'fail')"

check "CNPJ vazio retorna false" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(!validateCnpj('')?'ok':'fail')"

check "CNPJ com letras retorna false" \
  "import {validateCnpj} from './lib/validators/cnpj.ts'; process.stdout.write(!validateCnpj('1122233300018a')?'ok':'fail')"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
