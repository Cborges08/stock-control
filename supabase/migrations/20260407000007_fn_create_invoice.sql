-- Migration 007: fn_create_invoice SECURITY DEFINER RPC
-- Source: SCHEMA_BANCO.md + D-01 (slug) + D-02 (batch_number format)
--
-- SECURITY: SET search_path = '' + public.tablename qualification (T-02-05)
-- ATOMICITY: Tudo dentro de uma unica funcao PL/pgSQL = uma transacao
-- BATCH_NUMBER: {slug}-{YEAR}-{SEQ_3} via batch_number_counters UPDATE RETURNING (T-02-04)
-- NOTE: ncm is a products column, not invoice_items — not inserted here

CREATE OR REPLACE FUNCTION public.fn_create_invoice(
  p_supplier  jsonb,   -- { cnpj, name, ie, phone, address }
  p_invoice   jsonb,   -- { nfe_number, nfe_serie, nfe_key, protocol, emission_date, exit_date, total_value, natureza_operacao, raw_data }
  p_items     jsonb    -- [ { product_id, quantity, unit_price, total_price, cst, cfop, icms_base, icms_value, icms_aliquot, p_red_bc } ]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_supplier_id   uuid;
  v_invoice_id    uuid;
  v_item          record;
  v_invoice_item_id uuid;
  v_batch_id      uuid;
  v_movement_id   uuid;
  v_batch_ids     uuid[] := '{}';
  v_movement_ids  uuid[] := '{}';
  v_next_seq      int;
  v_year          int := EXTRACT(YEAR FROM now())::int;
  v_slug          text;
  v_batch_num     text;
BEGIN
  -- ============================================================
  -- 1. Pre-flight: verificar nfe_key duplicada
  -- ============================================================
  IF EXISTS (
    SELECT 1 FROM public.invoice_headers
     WHERE nfe_key = (p_invoice->>'nfe_key')
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_NFE_KEY: NF-e ja registrada com esta chave de acesso';
  END IF;

  -- ============================================================
  -- 2. Supplier upsert (por CNPJ)
  -- ============================================================
  INSERT INTO public.suppliers (cnpj, name, ie, phone, address)
  VALUES (
    p_supplier->>'cnpj',
    p_supplier->>'name',
    p_supplier->>'ie',
    p_supplier->>'phone',
    p_supplier->>'address'
  )
  ON CONFLICT (cnpj) DO UPDATE
    SET name    = EXCLUDED.name,
        ie      = EXCLUDED.ie,
        phone   = EXCLUDED.phone,
        address = EXCLUDED.address
  RETURNING id INTO v_supplier_id;

  -- ============================================================
  -- 3. Invoice header
  -- ============================================================
  INSERT INTO public.invoice_headers (
    supplier_id, nfe_number, nfe_serie, nfe_key, protocol,
    emission_date, exit_date, total_value, natureza_operacao, raw_data
  )
  VALUES (
    v_supplier_id,
    p_invoice->>'nfe_number',
    p_invoice->>'nfe_serie',
    p_invoice->>'nfe_key',
    p_invoice->>'protocol',
    (p_invoice->>'emission_date')::date,
    (p_invoice->>'exit_date')::date,
    (p_invoice->>'total_value')::numeric,
    p_invoice->>'natureza_operacao',
    p_invoice->'raw_data'
  )
  RETURNING id INTO v_invoice_id;

  -- ============================================================
  -- 4. Loop sobre itens da NF
  -- ============================================================
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id    uuid,
    quantity      numeric,
    unit_price    numeric,
    total_price   numeric,
    cst           text,
    cfop          text,
    icms_base     numeric,
    icms_value    numeric,
    icms_aliquot  numeric,
    p_red_bc      numeric
  )
  LOOP
    -- 4a. Invoice item (ncm removed — it is a products column, not invoice_items)
    INSERT INTO public.invoice_items (
      invoice_id, product_id, quantity, unit_price, total_price,
      cst, cfop, icms_base, icms_value, icms_aliquot, p_red_bc
    )
    VALUES (
      v_invoice_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_item.total_price,
      v_item.cst, v_item.cfop, v_item.icms_base, v_item.icms_value, v_item.icms_aliquot, v_item.p_red_bc
    )
    RETURNING id INTO v_invoice_item_id;

    -- 4b. Gerar batch_number atomico via counter table (D-02, T-02-04)
    UPDATE public.batch_number_counters
       SET last_seq = CASE WHEN year = v_year THEN last_seq + 1 ELSE 1 END,
           year     = v_year
     WHERE product_id = v_item.product_id
     RETURNING last_seq INTO v_next_seq;

    IF NOT FOUND THEN
      INSERT INTO public.batch_number_counters (product_id, year, last_seq)
      VALUES (v_item.product_id, v_year, 1)
      RETURNING last_seq INTO v_next_seq;
    END IF;

    SELECT slug INTO v_slug FROM public.products WHERE id = v_item.product_id;
    v_batch_num := v_slug || '-' || v_year || '-' || LPAD(v_next_seq::text, 3, '0');

    -- 4c. Batch
    INSERT INTO public.batches (
      product_id, invoice_item_id, batch_number,
      quantity_in, unit_price, total_cost
    )
    VALUES (
      v_item.product_id, v_invoice_item_id, v_batch_num,
      v_item.quantity, v_item.unit_price, v_item.total_price
    )
    RETURNING id INTO v_batch_id;

    v_batch_ids := v_batch_ids || v_batch_id;

    -- 4d. Stock movement (type=entry)
    INSERT INTO public.stock_movements (
      product_id, batch_id, invoice_item_id,
      type, quantity, unit_price_snapshot
    )
    VALUES (
      v_item.product_id, v_batch_id, v_invoice_item_id,
      'entry', v_item.quantity, v_item.unit_price
    )
    RETURNING id INTO v_movement_id;

    v_movement_ids := v_movement_ids || v_movement_id;
  END LOOP;

  -- ============================================================
  -- 5. Retorno
  -- ============================================================
  RETURN jsonb_build_object(
    'invoice_id',   v_invoice_id,
    'supplier_id',  v_supplier_id,
    'batch_ids',    to_jsonb(v_batch_ids),
    'movement_ids', to_jsonb(v_movement_ids)
  );
END;
$$;
