#!/usr/bin/env bash
# validate-nfe.sh — Testa validateNfeKey (44 digitos, cUF, cDV Modulo-11)
# Fase 05, Plano 03 — NF-e key validator

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

if [ ! -f "$PROJECT_ROOT/lib/validators/nfe.ts" ]; then
  echo "FAIL lib/validators/nfe.ts nao existe"
  exit 1
fi

echo "=== validate-nfe.sh ==="
cd "$PROJECT_ROOT"

# Gerar uma chave NF-e valida para teste usando o proprio validator
# Chave construida: cUF=35 (SP), AAMM=2601, CNPJ=11222333000181, mod=55, serie=001, numero=000000001, tpEmis=1, cNF=00000001
# O cDV e calculado inline pelo script
check "Chave NF-e com 43 digitos (curta) retorna false" \
  "import {validateNfeKey} from './lib/validators/nfe.ts'; process.stdout.write(!validateNfeKey('1234567890123456789012345678901234567890123')?'ok':'fail')"

check "Chave NF-e com 45 digitos (longa) retorna false" \
  "import {validateNfeKey} from './lib/validators/nfe.ts'; process.stdout.write(!validateNfeKey('123456789012345678901234567890123456789012345')?'ok':'fail')"

check "Chave NF-e com letras retorna false" \
  "import {validateNfeKey} from './lib/validators/nfe.ts'; process.stdout.write(!validateNfeKey('3526011122233300018155001000000001100000017a')?'ok':'fail')"

check "Chave NF-e com cUF invalido (99) retorna false" \
  "import {validateNfeKey} from './lib/validators/nfe.ts'; process.stdout.write(!validateNfeKey('99260111222333000181550010000000011000000170')?'ok':'fail')"

check "Chave NF-e com cDV errado retorna false" \
  "import {validateNfeKey} from './lib/validators/nfe.ts'; process.stdout.write(!validateNfeKey('35260111222333000181550010000000011000000179')?'ok':'fail')"

check "Chave NF-e valida com cUF=35 (SP) retorna true (calculo inline)" \
  "import {validateNfeKey} from './lib/validators/nfe.ts'; const base = '3526011122233300018155001000000001100000017'; const digits = base.split('').map(Number); let sum = 0; let m = 2; for (let i = 42; i >= 0; i--) { sum += digits[i] * m; m = m === 9 ? 2 : m + 1; } const rem = sum % 11; const cdv = rem < 2 ? 0 : 11 - rem; const fullKey = base + String(cdv); process.stdout.write(validateNfeKey(fullKey)?'ok':'fail:'+fullKey)"

check "Chave NF-e string vazia retorna false" \
  "import {validateNfeKey} from './lib/validators/nfe.ts'; process.stdout.write(!validateNfeKey('')?'ok':'fail')"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
