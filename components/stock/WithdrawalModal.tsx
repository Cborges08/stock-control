'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BatchTag } from '@/components/stock/BatchTag'
import type { ProductStockParsed, FifoBatchInfo, CreateMovementResult } from '@/lib/types'

interface WithdrawalModalProps {
  product: ProductStockParsed | null
  fifoBatch: FifoBatchInfo | null
  open: boolean
  onClose: () => void
}

export function WithdrawalModal({ product, fifoBatch, open, onClose }: WithdrawalModalProps) {
  const router = useRouter()

  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [showReason, setShowReason] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<CreateMovementResult | null>(null)

  // Reset state when modal opens or product changes (D-02, D-03)
  useEffect(() => {
    if (open) {
      setQuantity('1')
      setReason('')
      setShowReason(false)
      setIsSubmitting(false)
      setError(null)
      setSuccessData(null)
    }
  }, [open, product?.id])

  // Quantity validation per D-02
  const maxQty = fifoBatch?.available_stock ?? product?.current_stock ?? 0
  const numQty = Number(quantity)
  const isValidQuantity = !isNaN(numQty) && numQty >= 1 && numQty <= maxQty

  async function handleConfirm() {
    if (!product) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: Number(quantity),
          reason: reason || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()

        if (body.code === 'insufficient_stock') {
          setError(
            `Estoque insuficiente \u2014 disponivel: ${body.available} ${product.unit}, solicitado: ${body.requested} ${product.unit}`
          )
          return
        }

        if (body.code === 'product_archived') {
          toast.error('Produto indisponivel. Tente novamente.')
          onClose()
          router.refresh()
          return
        }

        if (body.code === 'batch_not_found') {
          toast.error('Nenhum lote aberto para o produto.')
          onClose()
          router.refresh()
          return
        }

        toast.error(body.message ?? 'Erro ao registrar retirada')
        return
      }

      // 201 Success per D-04
      const data = (await res.json()) as CreateMovementResult
      setSuccessData(data)

      // Auto-close after 1500ms per D-04 — order: onClose → toast → refresh (Pitfall 5)
      setTimeout(() => {
        onClose()
        toast.success('Retirada registrada')
        router.refresh()
      }, 1500)
    } catch {
      toast.error('Erro de conexao. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open: boolean) => { if (!open && !isSubmitting) onClose() }}>
      <DialogContent showCloseButton={!isSubmitting} className="relative sm:max-w-md">
        {/* Loading overlay per D-08 */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {successData ? (
          /* Success summary per D-04 */
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="font-semibold text-base">Retirada registrada</p>
            <p className="text-sm">{successData.quantity} {product?.unit} de {product?.description}</p>
            <p className="text-sm text-muted-foreground">Lote: {successData.batch_number}</p>
          </div>
        ) : (
          /* Normal form state */
          <>
            <DialogHeader>
              <DialogTitle>{product?.description}</DialogTitle>
              <DialogDescription>
                Confirme a retirada de estoque
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* FIFO batch display per D-01 */}
              {fifoBatch && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lote FIFO:</span>
                  <BatchTag batchNumber={fifoBatch.batch_number} openedAt={fifoBatch.opened_at} />
                </div>
              )}

              {/* Available stock display */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estoque disponivel:</span>
                <span className="font-medium">
                  {(fifoBatch?.available_stock ?? product?.current_stock ?? 0).toLocaleString('pt-BR')} {product?.unit}
                </span>
              </div>

              {/* Quantity input per D-02 */}
              <div>
                <label htmlFor="withdrawal-qty" className="text-sm text-muted-foreground block mb-1">
                  Quantidade ({product?.unit})
                </label>
                <Input
                  id="withdrawal-qty"
                  type="number"
                  min={1}
                  max={fifoBatch?.available_stock ?? product?.current_stock ?? 0}
                  step="any"
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setError(null) }}
                />
              </div>

              {/* Inline error per D-07 */}
              {error && (
                <p role="alert" className="text-sm text-destructive">{error}</p>
              )}

              {/* Collapsible reason per D-03 */}
              {!showReason ? (
                <button
                  type="button"
                  onClick={() => setShowReason(true)}
                  className="text-sm text-muted-foreground underline cursor-pointer"
                >
                  Adicionar observacao
                </button>
              ) : (
                <Textarea
                  placeholder="Motivo da retirada (opcional)"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
            </div>

            <DialogFooter className="sticky bottom-0">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={isSubmitting || !isValidQuantity}>
                Confirmar Retirada
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
