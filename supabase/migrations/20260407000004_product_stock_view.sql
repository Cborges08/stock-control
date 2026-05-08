-- Migration 004: VIEW product_stock
-- Source: SCHEMA_BANCO.md
-- REGRA CRITICA: current_stock NUNCA e coluna — sempre calculado via esta VIEW

CREATE VIEW public.product_stock AS
SELECT
  p.id,
  p.code,
  p.description,
  p.slug,
  p.unit,
  p.status,
  p.min_stock_alert,
  COALESCE(SUM(sm.quantity), 0)                                    AS current_stock,
  AVG(CASE WHEN sm.type = 'entry' THEN sm.unit_price_snapshot END) AS avg_price,
  MAX(sm.created_at)                                               AS last_movement_at
FROM public.products p
LEFT JOIN public.stock_movements sm ON sm.product_id = p.id
GROUP BY p.id, p.code, p.description, p.slug, p.unit, p.status, p.min_stock_alert;
