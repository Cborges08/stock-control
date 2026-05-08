#!/usr/bin/env bash
# validate-form-schema.sh — Phase 06 form schema validation tests
# Tests that InvoicePayloadSchema works correctly for form validation

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

echo "--- validate-form-schema.sh ---"

check "Valid full payload passes safeParse" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice'; const p = { supplier: { cnpj: '11222333000181', name: 'Fornecedor Teste' }, invoice: { nfe_number: '123', nfe_serie: '1', nfe_key: '35240411222333000181550010000001231234567890', emission_date: '2026-04-01', total_value: 100.50 }, items: [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 5.750, unit_price: 10.50, total_price: 60.375 }] }; const r = InvoicePayloadSchema.safeParse(p); process.stdout.write(r.success ? 'ok' : 'fail: ' + JSON.stringify(r.error.issues))"

check "Missing supplier.name fails" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice'; const p = { supplier: { cnpj: '11222333000181' }, invoice: { nfe_number: '1', nfe_serie: '1', nfe_key: '35240411222333000181550010000001231234567890', emission_date: '2026-04-01', total_value: 100 }, items: [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 1, unit_price: 10, total_price: 10 }] }; process.stdout.write(InvoicePayloadSchema.safeParse(p).success ? 'fail' : 'ok')"

check "Empty items array fails" \
  "import {InvoicePayloadSchema} from './lib/validators/invoice'; const p = { supplier: { cnpj: '11222333000181', name: 'Test' }, invoice: { nfe_number: '1', nfe_serie: '1', nfe_key: '35240411222333000181550010000001231234567890', emission_date: '2026-04-01', total_value: 100 }, items: [] }; process.stdout.write(InvoicePayloadSchema.safeParse(p).success ? 'fail' : 'ok')"

check "Item with quantity zero fails" \
  "import {InvoiceItemSchema} from './lib/validators/invoice'; const r = InvoiceItemSchema.safeParse({ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 0, unit_price: 10, total_price: 0 }); process.stdout.write(r.success ? 'fail' : 'ok')"

check "Item with negative unit_price fails" \
  "import {InvoiceItemSchema} from './lib/validators/invoice'; const r = InvoiceItemSchema.safeParse({ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 1, unit_price: -5, total_price: -5 }); process.stdout.write(r.success ? 'fail' : 'ok')"

check "Item with optional cst/cfop passes" \
  "import {InvoiceItemSchema} from './lib/validators/invoice'; const r = InvoiceItemSchema.safeParse({ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 1, unit_price: 10, total_price: 10, cst: '060', cfop: '5102' }); process.stdout.write(r.success ? 'ok' : 'fail: ' + JSON.stringify(r.error.issues))"

echo ""
echo "Resultado: $PASS passou, $FAIL falhou"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
