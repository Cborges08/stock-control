#!/usr/bin/env bash
# validate-parsers.sh — Testa parseNumeric e getStockLevel
# Fase 04, Plano 01 — utilitarios fundacionais

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

# Verificar existencia dos arquivos
if [ ! -f "$PROJECT_ROOT/lib/parsers.ts" ]; then
  echo "FAIL lib/parsers.ts nao existe"
  exit 1
fi

if [ ! -f "$PROJECT_ROOT/lib/utils/stock.ts" ]; then
  echo "FAIL lib/utils/stock.ts nao existe"
  exit 1
fi

echo "=== validate-parsers.sh ==="

cd "$PROJECT_ROOT"

check "parseNumeric('5.750')===5.75" "import {parseNumeric} from './lib/parsers.ts'; process.stdout.write(parseNumeric('5.750')===5.75?'ok':'fail:'+parseNumeric('5.750'))"
check "parseNumeric(null)===0" "import {parseNumeric} from './lib/parsers.ts'; process.stdout.write(parseNumeric(null)===0?'ok':'fail:'+parseNumeric(null))"
check "parseNumeric('')===0" "import {parseNumeric} from './lib/parsers.ts'; process.stdout.write(parseNumeric('')===0?'ok':'fail:'+parseNumeric(''))"
check "parseNumeric('abc')===0" "import {parseNumeric} from './lib/parsers.ts'; process.stdout.write(parseNumeric('abc')===0?'ok':'fail:'+parseNumeric('abc'))"
check "parseNumeric(42)===42" "import {parseNumeric} from './lib/parsers.ts'; process.stdout.write(parseNumeric(42)===42?'ok':'fail:'+parseNumeric(42))"
check "parseNumeric('3,14')===3.14" "import {parseNumeric} from './lib/parsers.ts'; process.stdout.write(parseNumeric('3,14')===3.14?'ok':'fail:'+parseNumeric('3,14'))"
check "getStockLevel(0,5)==='depleted'" "import {getStockLevel} from './lib/utils/stock.ts'; process.stdout.write(getStockLevel(0,5)==='depleted'?'ok':'fail:'+getStockLevel(0,5))"
check "getStockLevel(3,5)==='low'" "import {getStockLevel} from './lib/utils/stock.ts'; process.stdout.write(getStockLevel(3,5)==='low'?'ok':'fail:'+getStockLevel(3,5))"
check "getStockLevel(10,5)==='healthy'" "import {getStockLevel} from './lib/utils/stock.ts'; process.stdout.write(getStockLevel(10,5)==='healthy'?'ok':'fail:'+getStockLevel(10,5))"
check "getStockLevel(5,5)==='healthy'" "import {getStockLevel} from './lib/utils/stock.ts'; process.stdout.write(getStockLevel(5,5)==='healthy'?'ok':'fail:'+getStockLevel(5,5))"
check "getStockLevel(0,0)==='depleted'" "import {getStockLevel} from './lib/utils/stock.ts'; process.stdout.write(getStockLevel(0,0)==='depleted'?'ok':'fail:'+getStockLevel(0,0))"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
