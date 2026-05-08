-- Seed: 5 produtos placeholder (D-04, D-05, D-06)
-- Roda com service_role (bypassa RLS automaticamente per D-09)
-- ON CONFLICT (code) DO NOTHING para idempotencia

INSERT INTO public.products (code, description, slug, ncm, unit, min_stock_alert, status)
VALUES
  ('120',  'ACAI POLPA 12% (MEDIO) 01 KG',       'ACAI', '08119000', 'KG', 5, 'active'),
  ('121',  'MARACUJA POLPA INTEGRAL 01 KG',       'MARA', '08119000', 'KG', 5, 'active'),
  ('122',  'MORANGO POLPA INTEGRAL 01 KG',        'MORA', '08119000', 'KG', 5, 'active'),
  ('123',  'COCO POLPA INTEGRAL 01 KG',           'COCO', '08119000', 'KG', 5, 'active'),
  ('124',  'LIMAO TAHITI POLPA INTEGRAL 01 KG',   'LIMO', '08119000', 'KG', 5, 'active')
ON CONFLICT (code) DO NOTHING;
