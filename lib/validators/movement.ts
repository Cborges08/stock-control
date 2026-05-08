import { z } from 'zod'

export const MovementPayloadSchema = z.object({
  product_id: z.string().uuid('product_id deve ser UUID valido'),
  quantity: z.number().positive('Quantidade deve ser maior que zero'),
  reason: z.string().optional(),
})

export type MovementPayload = z.infer<typeof MovementPayloadSchema>
