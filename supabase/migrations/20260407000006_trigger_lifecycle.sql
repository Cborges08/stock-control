-- Migration 006: fn_check_lifecycle trigger
-- Source: SCHEMA_BANCO.md
-- Executado AFTER INSERT em stock_movements para atualizar status do produto

CREATE OR REPLACE FUNCTION public.fn_check_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
  v_stock    numeric;
  v_qty_in   numeric;
  v_qty_out  numeric;
BEGIN
  -- Calcula estoque total atual do produto
  SELECT COALESCE(SUM(quantity), 0)
    INTO v_stock
    FROM public.stock_movements
   WHERE product_id = NEW.product_id;

  -- Calcula totais historicos de entrada e saida
  SELECT COALESCE(SUM(CASE WHEN type = 'entry' THEN quantity ELSE 0 END), 0),
         COALESCE(SUM(CASE WHEN type != 'entry' THEN ABS(quantity) ELSE 0 END), 0)
    INTO v_qty_in, v_qty_out
    FROM public.stock_movements
   WHERE product_id = NEW.product_id;

  -- Withdrawal que zerou o estoque -> marca produto como depleted
  IF v_stock <= 0 AND NEW.type = 'withdrawal' THEN
    UPDATE public.products
       SET status = 'depleted', depleted_at = now()
     WHERE id = NEW.product_id;

    INSERT INTO public.product_lifecycle_events
      (product_id, event_type, stock_at_event, total_qty_in, total_qty_out, occurred_at)
    VALUES
      (NEW.product_id, 'depleted', v_stock, v_qty_in, v_qty_out, now());

  -- Entry -> marca produto como active e preenche first_entry_at
  ELSIF NEW.type = 'entry' THEN
    -- Registra restocked se estava depleted antes da atualizacao
    IF EXISTS (
      SELECT 1 FROM public.products
       WHERE id = NEW.product_id AND depleted_at IS NOT NULL
    ) THEN
      INSERT INTO public.product_lifecycle_events
        (product_id, event_type, stock_at_event, total_qty_in, total_qty_out, occurred_at)
      VALUES
        (NEW.product_id, 'restocked', v_stock, v_qty_in, v_qty_out, now());
    END IF;

    UPDATE public.products
       SET status       = 'active',
           depleted_at  = NULL,
           first_entry_at = COALESCE(first_entry_at, now())
     WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lifecycle
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.fn_check_lifecycle();
