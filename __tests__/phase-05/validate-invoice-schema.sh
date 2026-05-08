#!/usr/bin/env bash
# validate-invoice-schema.sh — Testa InvoicePayloadSchema (Zod)
# Fase 05, Plano 04 — Zod invoice schema

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

if [ ! -f "$PROJECT_ROOT/lib/validators/invoice.ts" ]; then
  echo "FAIL lib/validators/invoice.ts nao existe"
  exit 1
fi

echo "=== validate-invoice-schema.sh ==="
cd "$PROJECT_ROOT"

check "Payload valido completo passa safeParse" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice.ts'; const p = { supplier: { cnpj: '11222333000181', name: 'Fornecedor Teste' }, invoice: { nfe_number: '123', nfe_serie: '1', nfe_key: '35260111222333000181550010000000011000000170', emission_date: '2026-01-15', total_value: 100.50 }, items: [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 10, unit_price: 5.25, total_price: 52.50 }] }; const r = InvoicePayloadSchema.safeParse(p); process.stdout.write(r.success?'ok':'fail:'+JSON.stringify(r.error.issues[0]))"

check "Payload sem supplier falha" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice.ts'; const p = { invoice: { nfe_number: '1', nfe_serie: '1', nfe_key: '35260111222333000181550010000000011000000170', emission_date: '2026-01-15', total_value: 100 }, items: [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 10, unit_price: 5, total_price: 50 }] }; const r = InvoicePayloadSchema.safeParse(p); process.stdout.write(!r.success?'ok':'fail')"

check "Payload com items vazio falha (min 1)" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice.ts'; const p = { supplier: { cnpj: '11222333000181', name: 'F' }, invoice: { nfe_number: '1', nfe_serie: '1', nfe_key: '35260111222333000181550010000000011000000170', emission_date: '2026-01-15', total_value: 100 }, items: [] }; const r = InvoicePayloadSchema.safeParse(p); process.stdout.write(!r.success?'ok':'fail')"

check "Payload com quantity negativa falha" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice.ts'; const p = { supplier: { cnpj: '11222333000181', name: 'F' }, invoice: { nfe_number: '1', nfe_serie: '1', nfe_key: '35260111222333000181550010000000011000000170', emission_date: '2026-01-15', total_value: 100 }, items: [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: -5, unit_price: 5, total_price: 50 }] }; const r = InvoicePayloadSchema.safeParse(p); process.stdout.write(!r.success?'ok':'fail')"

check "Payload com product_id invalido (nao UUID) falha" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice.ts'; const p = { supplier: { cnpj: '11222333000181', name: 'F' }, invoice: { nfe_number: '1', nfe_serie: '1', nfe_key: '35260111222333000181550010000000011000000170', emission_date: '2026-01-15', total_value: 100 }, items: [{ product_id: 'not-a-uuid', quantity: 5, unit_price: 5, total_price: 25 }] }; const r = InvoicePayloadSchema.safeParse(p); process.stdout.write(!r.success?'ok':'fail')"

check "Payload com nfe_key curta (43 chars) falha" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice.ts'; const p = { supplier: { cnpj: '11222333000181', name: 'F' }, invoice: { nfe_number: '1', nfe_serie: '1', nfe_key: '1234567890123456789012345678901234567890123', emission_date: '2026-01-15', total_value: 100 }, items: [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 5, unit_price: 5, total_price: 25 }] }; const r = InvoicePayloadSchema.safeParse(p); process.stdout.write(!r.success?'ok':'fail')"

check "InvoicePayload type exportado" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice.ts'; import type {InvoicePayload} from './lib/validators/invoice.ts'; process.stdout.write(typeof InvoicePayloadSchema.parse === 'function'?'ok':'fail')"

echo ""
echo "=== Resultado: $PASS PASS, $FAIL FAIL ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
