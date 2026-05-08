-- Migration 003: Lifecycle Events + Cold Storage Tables
-- Source: SCHEMA_BANCO.md

-- ============================================================
-- product_lifecycle_events — snapshots imutaveis de transicoes de status
-- ============================================================
CREATE TABLE public.product_lifecycle_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES public.products(id),
  event_type      text NOT NULL
    CHECK (event_type IN ('first_entry', 'depleted', 'restocked', 'archived')),
  stock_at_event  numeric(10,3),
  total_qty_in    numeric(10,3),
  total_qty_out   numeric(10,3),
  avg_price_paid  numeric(10,4),
  notes           text,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifecycle_product_occurred ON public.product_lifecycle_events(product_id, occurred_at DESC);

-- ============================================================
-- archived_batches — cold storage de lotes fechados (> 30 dias)
-- Mesma estrutura de batches, sem foreign keys ativas
-- ============================================================
CREATE TABLE public.archived_batches (
  id               uuid PRIMARY KEY,
  product_id       uuid NOT NULL,
  invoice_item_id  uuid,
  batch_number     text,
  quantity_in      numeric(10,3),
  quantity_out     numeric(10,3),
  unit_price       numeric(10,4),
  total_cost       numeric(10,2),
  status           text,
  opened_at        timestamptz,
  depleted_at      timestamptz,
  days_to_deplete  int,
  avg_daily_usage  numeric(8,4),
  season           text,
  archived_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_archived_batches_product ON public.archived_batches(product_id);
CREATE INDEX idx_archived_batches_season ON public.archived_batches(season);
CREATE INDEX idx_archived_batches_opened ON public.archived_batches(opened_at);

-- ============================================================
-- archived_stock_movements — cold storage de movimentacoes (> 6 meses)
-- Mesma estrutura de stock_movements, sem foreign keys ativas
-- ============================================================
CREATE TABLE public.archived_stock_movements (
  id                  uuid PRIMARY KEY,
  product_id          uuid NOT NULL,
  batch_id            uuid,
  user_id             uuid,
  invoice_item_id     uuid,
  type                text,
  quantity            numeric(10,3),
  unit_price_snapshot numeric(10,4),
  reason              text,
  created_at          timestamptz,
  archived_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_archived_movements_product ON public.archived_stock_movements(product_id);
CREATE INDEX idx_archived_movements_created ON public.archived_stock_movements(created_at);
