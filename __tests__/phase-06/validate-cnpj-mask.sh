#!/usr/bin/env bash
# validate-cnpj-mask.sh — Phase 06 CNPJ mask unit tests
# Tests applyCnpjMask formatting for various digit lengths

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

cd "$PROJECT_ROOT"

echo "--- validate-cnpj-mask.sh ---"

check "2 digitos: '12' -> '12'" \
  "import {applyCnpjMask} from './lib/utils/cnpj-mask'; process.stdout.write(applyCnpjMask('12')==='12'?'ok':'fail: '+applyCnpjMask('12'))"

check "5 digitos: '12345' -> '12.345'" \
  "import {applyCnpjMask} from './lib/utils/cnpj-mask'; process.stdout.write(applyCnpjMask('12345')==='12.345'?'ok':'fail: '+applyCnpjMask('12345'))"

check "8 digitos: '12345678' -> '12.345.678'" \
  "import {applyCnpjMask} from './lib/utils/cnpj-mask'; process.stdout.write(applyCnpjMask('12345678')==='12.345.678'?'ok':'fail: '+applyCnpjMask('12345678'))"

check "12 digitos: '123456780001' -> '12.345.678/0001'" \
  "import {applyCnpjMask} from './lib/utils/cnpj-mask'; process.stdout.write(applyCnpjMask('123456780001')==='12.345.678/0001'?'ok':'fail: '+applyCnpjMask('123456780001'))"

check "14 digitos: '12345678000195' -> '12.345.678/0001-95'" \
  "import {applyCnpjMask} from './lib/utils/cnpj-mask'; process.stdout.write(applyCnpjMask('12345678000195')==='12.345.678/0001-95'?'ok':'fail: '+applyCnpjMask('12345678000195'))"

check "Strips non-digits: '12.345' -> '12.345'" \
  "import {applyCnpjMask} from './lib/utils/cnpj-mask'; process.stdout.write(applyCnpjMask('12.345')==='12.345'?'ok':'fail: '+applyCnpjMask('12.345'))"

check "Truncates to 14 digits max" \
  "import {applyCnpjMask} from './lib/utils/cnpj-mask'; const r=applyCnpjMask('1234567800019599'); process.stdout.write(r==='12.345.678/0001-95'?'ok':'fail: '+r)"

echo ""
echo "Resultado: $PASS passou, $FAIL falhou"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
