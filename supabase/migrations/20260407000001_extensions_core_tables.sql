-- Migration 001: Extensions + Core Tables
-- Source: SCHEMA_BANCO.md + D-01 (slug column) + D-02 (batch_number_counters)

-- Extensao unaccent para busca sem acentos (pode ja estar ativa no projeto hosted)
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";

-- ============================================================
-- suppliers
-- ============================================================
CREATE TABLE public.suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  cnpj       text UNIQUE NOT NULL,
  ie         text,
  phone      text,
  address    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- products (com coluna slug per D-01)
-- NOTA: current_stock NUNCA e coluna — sempre calculado via VIEW product_stock
-- ============================================================
CREATE TABLE public.products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text UNIQUE NOT NULL,
  description      text NOT NULL,
  slug             text UNIQUE NOT NULL,   -- D-01: 4 letras maiusculas, ex: ACAI, MARA
  ncm              text,
  unit             text NOT NULL DEFAULT 'UN',
  min_stock_alert  numeric(10,3) DEFAULT 5,
  status           text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'depleted', 'archived')),
  first_entry_at   timestamptz,
  depleted_at      timestamptz,
  archived_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- batch_number_counters — contador sequencial por produto (D-02)
-- Usado por fn_create_invoice para gerar batch_number atomicamente
-- ============================================================
CREATE TABLE public.batch_number_counters (
  product_id  uuid PRIMARY KEY REFERENCES public.products(id),
  year        int  NOT NULL,
  last_seq    int  NOT NULL DEFAULT 0
);

-- ============================================================
-- invoice_headers
-- ============================================================
CREATE TABLE public.invoice_headers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id         uuid NOT NULL REFERENCES public.suppliers(id),
  nfe_number          text NOT NULL,
  nfe_serie           text NOT NULL,
  nfe_key             text UNIQUE NOT NULL,
  protocol            text,
  emission_date       date NOT NULL,
  exit_date           date,
  total_value         numeric(10,2) NOT NULL,
  natureza_operacao   text,
  raw_data            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_headers_supplier_id ON public.invoice_headers(supplier_id);

-- ============================================================
-- invoice_items
-- ============================================================
CREATE TABLE public.invoice_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    uuid NOT NULL REFERENCES public.invoice_headers(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES public.products(id),
  quantity      numeric(10,3) NOT NULL,
  unit_price    numeric(10,4) NOT NULL,
  total_price   numeric(10,2) NOT NULL,
  icms_base     numeric(10,2),
  icms_value    numeric(10,2),
  icms_aliquot  numeric(5,2),
  p_red_bc      numeric(5,2),
  cst           text,
  cfop          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON public.invoice_items(product_id);
