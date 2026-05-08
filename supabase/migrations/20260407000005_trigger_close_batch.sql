-- Migration 005: fn_close_batch trigger
-- Source: SCHEMA_BANCO.md
-- Executado AFTER INSERT em stock_movements para fechar lote quando esgota

CREATE OR REPLACE FUNCTION public.fn_close_batch()
RETURNS TRIGGER AS $$
DECLARE
  v_qty_in   numeric;
  v_qty_out  numeric;
BEGIN
  -- Apenas processa withdrawals com batch_id
  IF NEW.type != 'withdrawal' OR NEW.batch_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calcula novo quantity_out somando a retirada atual
  SELECT quantity_in,
         quantity_out + ABS(NEW.quantity)
    INTO v_qty_in, v_qty_out
    FROM public.batches
   WHERE id = NEW.batch_id;

  -- Atualiza quantity_out do lote
  UPDATE public.batches
     SET quantity_out = v_qty_out
   WHERE id = NEW.batch_id;

  -- Se esgotou, fecha o lote com metricas de analytics
  IF v_qty_out >= v_qty_in THEN
    UPDATE public.batches
       SET status          = 'closed',
           depleted_at     = now(),
           days_to_deplete = GREATEST(
             EXTRACT(DAY FROM now() - opened_at)::int, 1
           ),
           avg_daily_usage = v_qty_in / GREATEST(
             EXTRACT(DAY FROM now() - opened_at), 1
           )
     WHERE id = NEW.batch_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_close_batch
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.fn_close_batch();
