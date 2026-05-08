-- Migration 009: RLS Enable + SELECT Policies
-- Source: D-07 (SELECT authenticated), D-08 (no write policies), D-10 (cold storage same policy)
-- SECURITY: T-02-03 (unauthenticated access blocked)
--
-- Com RLS ativo e sem policies de INSERT/UPDATE/DELETE, toda escrita direta
-- e bloqueada pela ausencia de policy (comportamento padrao do PostgreSQL RLS).
-- As funcoes SECURITY DEFINER (fn_create_invoice, fn_create_movement) bypassam
-- RLS automaticamente por executar como o role que as criou (postgres).

-- ============================================================
-- ENABLE RLS em todas as tabelas
-- ============================================================

-- Hot storage
ALTER TABLE public.suppliers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_headers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_number_counters    ENABLE ROW LEVEL SECURITY;

-- Cold storage (D-10)
ALTER TABLE public.archived_batches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_stock_movements  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SELECT policies para authenticated (D-07)
-- ============================================================

CREATE POLICY "authenticated_select" ON public.suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.invoice_headers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.invoice_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.stock_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.product_lifecycle_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.batch_number_counters
  FOR SELECT TO authenticated USING (true);

-- Cold storage (D-10: mesma policy de SELECT)
CREATE POLICY "authenticated_select" ON public.archived_batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_select" ON public.archived_stock_movements
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- INSERT/UPDATE/DELETE: SEM policies = bloqueado para todos os roles via API
-- As funcoes SECURITY DEFINER bypassam RLS automaticamente.
-- ============================================================
