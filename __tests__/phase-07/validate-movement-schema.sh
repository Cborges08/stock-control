#!/usr/bin/env bash
# validate-movement-schema.sh — Testa MovementPayloadSchema (Zod)
# Fase 07, Plano 01 — Zod movement schema

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

if [ ! -f "$PROJECT_ROOT/lib/validators/movement.ts" ]; then
  echo "FAIL lib/validators/movement.ts nao existe"
  exit 1
fi

echo "=== validate-movement-schema.sh ==="
cd "$PROJECT_ROOT"

check "Payload valido passes safeParse" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({product_id:'550e8400-e29b-41d4-a716-446655440000',quantity:5}); process.stdout.write(r.success?'ok':'fail:'+JSON.stringify(r.error.issues[0]))"

check "Non-UUID product_id falha" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({product_id:'not-a-uuid',quantity:5}); process.stdout.write(!r.success?'ok':'fail')"

check "Missing product_id falha" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({quantity:5}); process.stdout.write(!r.success?'ok':'fail')"

check "quantity: 0 falha" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({product_id:'550e8400-e29b-41d4-a716-446655440000',quantity:0}); process.stdout.write(!r.success?'ok':'fail')"

check "quantity: -1 falha" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({product_id:'550e8400-e29b-41d4-a716-446655440000',quantity:-1}); process.stdout.write(!r.success?'ok':'fail')"

check "quantity: 0.001 passa (fracao positiva)" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({product_id:'550e8400-e29b-41d4-a716-446655440000',quantity:0.001}); process.stdout.write(r.success?'ok':'fail:'+JSON.stringify(r.error.issues[0]))"

check "Absent reason passa" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({product_id:'550e8400-e29b-41d4-a716-446655440000',quantity:1}); process.stdout.write(r.success?'ok':'fail:'+JSON.stringify(r.error.issues[0]))"

check "reason: 'producao' passa" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; const r = MovementPayloadSchema.safeParse({product_id:'550e8400-e29b-41d4-a716-446655440000',quantity:1,reason:'producao'}); process.stdout.write(r.success?'ok':'fail:'+JSON.stringify(r.error.issues[0]))"

check "MovementPayload type exportado" \
  "import {MovementPayloadSchema} from './lib/validators/movement.ts'; import type {MovementPayload} from './lib/validators/movement.ts'; process.stdout.write(typeof MovementPayloadSchema.parse === 'function'?'ok':'fail')"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
