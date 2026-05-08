-- Migration 008: fn_create_movement SECURITY DEFINER RPC
-- Source: SCHEMA_BANCO.md + RESEARCH.md Padrao 5 (FIFO)
--
-- SECURITY: SET search_path = '' + public.tablename qualification (T-02-05)
-- FIFO: SELECT FOR UPDATE SKIP LOCKED ORDER BY opened_at ASC (T-02-02)
-- STOCK VALIDATION: Verifica remaining >= quantity antes de inserir

CREATE OR REPLACE FUNCTION public.fn_create_movement(
  p_product_id  uuid,
  p_quantity    numeric,
  p_user_id     uuid DEFAULT NULL,
  p_reason      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_batch_id      uuid;
  v_batch_number  text;
  v_unit_price    numeric;
  v_remaining     numeric;
  v_movement_id   uuid;
  v_product_status text;
BEGIN
  -- ============================================================
  -- 1. Verificar status do produto
  -- ============================================================
  SELECT status INTO v_product_status
    FROM public.products
   WHERE id = p_product_id;

  IF v_product_status IS NULL THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Produto nao encontrado';
  END IF;

  IF v_product_status = 'archived' THEN
    RAISE EXCEPTION 'PRODUCT_ARCHIVED: Produto arquivado, retirada nao permitida';
  END IF;

  -- ============================================================
  -- 2. FIFO: selecionar lote mais antigo aberto
  --    FOR UPDATE SKIP LOCKED: se outra transacao ja trava este lote,
  --    pega o proximo disponivel (T-02-02)
  -- ============================================================
  SELECT id, batch_number, unit_price, (quantity_in - quantity_out) AS remaining
    INTO v_batch_id, v_batch_number, v_unit_price, v_remaining
    FROM public.batches
   WHERE product_id = p_product_id
     AND status = 'open'
   ORDER BY opened_at ASC
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF v_batch_id IS NULL THEN
    RAISE EXCEPTION 'BATCH_NOT_FOUND: Nenhum lote aberto para o produto';
  END IF;

  -- ============================================================
  -- 3. Validar estoque suficiente no lote
  -- ============================================================
  IF v_remaining < p_quantity THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Estoque insuficiente. Disponivel: %, solicitado: %',
      v_remaining, p_quantity;
  END IF;

  -- ============================================================
  -- 4. Inserir stock_movement (withdrawal = quantity NEGATIVO)
  --    Triggers trg_close_batch e trg_lifecycle executam automaticamente
  -- ============================================================
  INSERT INTO public.stock_movements (
    product_id, batch_id, user_id,
    type, quantity, unit_price_snapshot, reason
  )
  VALUES (
    p_product_id, v_batch_id, p_user_id,
    'withdrawal', -ABS(p_quantity), v_unit_price, p_reason
  )
  RETURNING id INTO v_movement_id;

  -- ============================================================
  -- 5. Retorno
  -- ============================================================
  RETURN jsonb_build_object(
    'movement_id',         v_movement_id,
    'batch_id',            v_batch_id,
    'batch_number',        v_batch_number,
    'quantity',            -ABS(p_quantity),
    'unit_price_snapshot', v_unit_price,
    'product_id',          p_product_id
  );
END;
$$;
