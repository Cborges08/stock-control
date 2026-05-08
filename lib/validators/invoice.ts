import { z } from 'zod'

// --- Supplier Schema (D-01: supplier como objeto completo) ---

export const SupplierSchema = z.object({
  cnpj: z.string().min(1, 'CNPJ do fornecedor obrigatorio'),
  name: z.string().min(1, 'Nome do fornecedor obrigatorio'),
  ie: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
})

// --- Invoice Header Schema ---
// Note: emission_date and exit_date use ISO date regex (YYYY-MM-DD) so that malformed
// dates produce a structured 400 at the API boundary rather than a generic 500 from
// PostgreSQL's DATE type cast. NF-e model confirms dates arrive as 'YYYY-MM-DD'.

export const InvoiceHeaderSchema = z.object({
  nfe_number: z.string().min(1, 'Numero da NF-e obrigatorio'),
  nfe_serie: z.string().min(1, 'Serie da NF-e obrigatoria'),
  nfe_key: z.string().length(44, 'Chave de acesso deve ter 44 digitos').regex(/^\d{44}$/, 'Chave de acesso deve conter apenas digitos'),
  emission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de emissao no formato YYYY-MM-DD'),
  total_value: z.number().positive('Valor total deve ser positivo'),
  protocol: z.string().optional(),
  exit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de saida no formato YYYY-MM-DD').optional(),
  natureza_operacao: z.string().optional(),
  raw_data: z.record(z.unknown()).optional(),
})

// --- Invoice Item Schema (D-02: product_id UUID ja resolvido pela UI) ---

export const InvoiceItemSchema = z.object({
  product_id: z.string().uuid('product_id deve ser UUID valido'),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  unit_price: z.number().positive('Preco unitario deve ser positivo'),
  total_price: z.number().positive('Preco total deve ser positivo'),
  cst: z.string().optional(),
  cfop: z.string().optional(),
  icms_base: z.number().optional(),
  icms_value: z.number().optional(),
  icms_aliquot: z.number().optional(),
  p_red_bc: z.number().optional(),
})

// --- Full Invoice Payload Schema ---

export const InvoicePayloadSchema = z.object({
  supplier: SupplierSchema,
  invoice: InvoiceHeaderSchema,
  items: z.array(InvoiceItemSchema).min(1, 'Pelo menos um item obrigatorio'),
})

export type InvoicePayload = z.infer<typeof InvoicePayloadSchema>
