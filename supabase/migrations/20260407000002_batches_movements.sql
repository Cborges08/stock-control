-- Migration 002: Batches + Stock Movements
-- Source: SCHEMA_BANCO.md

-- ============================================================
-- batches — um lote = uma compra especifica de um produto
-- ============================================================
CREATE TABLE public.batches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES public.products(id),
  invoice_item_id  uuid NOT NULL REFERENCES public.invoice_items(id),

  batch_number     text UNIQUE NOT NULL,
  quantity_in      numeric(10,3) NOT NULL,
  quantity_out     numeric(10,3) NOT NULL DEFAULT 0,
  unit_price       numeric(10,4) NOT NULL,
  total_cost       numeric(10,2) NOT NULL,

  status           text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'archived')),
  opened_at        timestamptz NOT NULL DEFAULT now(),
  depleted_at      timestamptz,
  archived_at      timestamptz,

  days_to_deplete  int,
  avg_daily_usage  numeric(8,4),
  season           text GENERATED ALWAYS AS (
    CASE EXTRACT(MONTH FROM timezone('UTC', opened_at))::int
      WHEN 12 THEN 'summer' WHEN 1 THEN 'summer' WHEN 2 THEN 'summer'
      WHEN 3  THEN 'autumn' WHEN 4 THEN 'autumn' WHEN 5 THEN 'autumn'
      WHEN 6  THEN 'winter' WHEN 7 THEN 'winter' WHEN 8 THEN 'winter'
      ELSE 'spring'
    END
  ) STORED,

  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_batches_product_status ON public.batches(product_id, status);
CREATE INDEX idx_batches_product_opened ON public.batches(product_id, opened_at);
CREATE INDEX idx_batches_invoice_item ON public.batches(invoice_item_id);

-- ============================================================
-- stock_movements — APPEND-ONLY. Nunca UPDATE ou DELETE.
-- ============================================================
CREATE TABLE public.stock_movements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid NOT NULL REFERENCES public.products(id),
  batch_id            uuid REFERENCES public.batches(id),
  user_id             uuid REFERENCES auth.users(id),
  invoice_item_id     uuid REFERENCES public.invoice_items(id),
  type                text NOT NULL
    CHECK (type IN ('entry', 'withdrawal', 'adjustment')),
  quantity            numeric(10,3) NOT NULL,
  unit_price_snapshot numeric(10,4),
  reason              text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_product_created ON public.stock_movements(product_id, created_at DESC);
CREATE INDEX idx_movements_batch ON public.stock_movements(batch_id);
CREATE INDEX idx_movements_type ON public.stock_movements(type);
CREATE INDEX idx_movements_user ON public.stock_movements(user_id);
