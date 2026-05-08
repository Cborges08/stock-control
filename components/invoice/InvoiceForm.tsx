'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { InvoicePayloadSchema, type InvoicePayload } from '@/lib/validators/invoice'
import { validateCnpj } from '@/lib/validators/cnpj'
import { applyCnpjMask } from '@/lib/utils/cnpj-mask'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InvoiceItemsTable } from './InvoiceItemsTable'

interface InvoiceFormProps {
  products: Array<{ id: string; description: string; code: string; ncm: string | null }>
}

export function InvoiceForm({ products }: InvoiceFormProps) {
  const router = useRouter()
  const [cnpjDisplay, setCnpjDisplay] = useState('')
  const [supplierHint, setSupplierHint] = useState<string | null>(null)

  const form = useForm<InvoicePayload>({
    resolver: zodResolver(InvoicePayloadSchema),
    defaultValues: {
      supplier: { cnpj: '', name: '', ie: '', address: '', phone: '' },
      invoice: {
        nfe_number: '',
        nfe_serie: '',
        nfe_key: '',
        emission_date: '',
        total_value: 0,
        protocol: '',
        exit_date: '',
        natureza_operacao: '',
      },
      items: [{ product_id: '', quantity: 0, unit_price: 0, total_price: 0 }],
    },
  })

  // CNPJ onChange handler (per D-10)
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCnpjMask(e.target.value)
    setCnpjDisplay(masked)
    const digits = masked.replace(/\D/g, '')
    form.setValue('supplier.cnpj', digits)
    form.clearErrors('supplier.cnpj')
    setSupplierHint(null)
  }

  // CNPJ onBlur handler (per D-11, D-12 — validation + autocomplete)
  const handleCnpjBlur = async () => {
    const digits = form.getValues('supplier.cnpj')
    if (digits.length !== 14) return
    if (!validateCnpj(digits)) {
      form.setError('supplier.cnpj', {
        type: 'manual',
        message: 'CNPJ inválido — verifique os dígitos verificadores.',
      })
      return
    }
    // Autocomplete from suppliers table
    const supabase = createClient()
    const { data } = await supabase
      .from('suppliers')
      .select('name, ie, phone, address')
      .eq('cnpj', digits)
      .maybeSingle()
    if (data) {
      form.setValue('supplier.name', data.name)
      form.setValue('supplier.ie', data.ie ?? '')
      form.setValue('supplier.phone', data.phone ?? '')
      form.setValue('supplier.address', data.address ?? '')
      setSupplierHint('Fornecedor encontrado — campos preenchidos automaticamente.')
    } else {
      setSupplierHint(null)
    }
  }

  // NF-e key onChange handler: strip non-digits, write to form
  const handleNfeKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 44)
    form.setValue('invoice.nfe_key', digits)
    form.clearErrors('invoice.nfe_key')
  }

  // Submit handler (per D-07, D-08, D-09, D-12)
  const onSubmit = async (data: InvoicePayload) => {
    // D-12: ensure CNPJ is digits-only before sending
    const payload = {
      ...data,
      supplier: { ...data.supplier, cnpj: data.supplier.cnpj.replace(/\D/g, '') },
    }

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.status === 201) {
      // D-08: simple success toast
      toast.success('NF-e registrada com sucesso', {
        description: `${data.items.length} item(ns). Estoque atualizado.`,
      })
      // D-07: full reset — call toast and reset BEFORE router.refresh() (Pitfall 7)
      form.reset()
      setCnpjDisplay('')
      setSupplierHint(null)
      // D-09: sidebar refresh
      router.refresh()
      return
    }

    if (res.status === 409) {
      form.setError('invoice.nfe_key', {
        type: 'manual',
        message: 'Esta NF-e já está registrada no sistema.',
      })
      return
    }

    const body = await res.json().catch(() => ({}))

    if (res.status === 400 && body.code === 'cnpj_invalid') {
      form.setError('supplier.cnpj', { message: body.message })
      return
    }
    if (res.status === 400 && body.code === 'product_not_found') {
      toast.error('Produto não encontrado no sistema.')
      return
    }
    if (res.status === 400 && body.code === 'validation_error') {
      // Map field-level error from path array
      if (body.path && body.path.length > 0) {
        const fieldPath = body.path.join('.') as keyof InvoicePayload
        form.setError(fieldPath as any, { message: body.message })
      } else {
        toast.error(body.message || 'Erro de validação.')
      }
      return
    }

    // 500 or unexpected
    toast.error('Erro interno. Tente novamente ou contate o administrador.')
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Section 1: Dados do Fornecedor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Dados do Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {/* Row 1: CNPJ + Razao Social */}
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="supplier-cnpj">CNPJ</Label>
              <Input
                id="supplier-cnpj"
                type="text"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={cnpjDisplay}
                onChange={handleCnpjChange}
                onBlur={handleCnpjBlur}
                maxLength={18}
              />
              {supplierHint && (
                <p className="text-xs text-muted-foreground">{supplierHint}</p>
              )}
              {form.formState.errors.supplier?.cnpj && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.supplier.cnpj.message}
                </p>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="supplier-name">Razão Social</Label>
              <Input
                id="supplier-name"
                type="text"
                placeholder="Nome do fornecedor"
                {...form.register('supplier.name')}
              />
              {form.formState.errors.supplier?.name && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.supplier.name.message}
                </p>
              )}
            </div>

            {/* Row 2: IE + Telefone */}
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="supplier-ie">Inscrição Estadual</Label>
              <Input
                id="supplier-ie"
                type="text"
                placeholder="Opcional"
                {...form.register('supplier.ie')}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="supplier-phone">Telefone</Label>
              <Input
                id="supplier-phone"
                type="text"
                placeholder="Opcional"
                {...form.register('supplier.phone')}
              />
            </div>

            {/* Row 3: Endereco */}
            <div className="col-span-4 flex flex-col gap-2">
              <Label htmlFor="supplier-address">Endereço</Label>
              <Input
                id="supplier-address"
                type="text"
                placeholder="Opcional"
                {...form.register('supplier.address')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 2: Cabecalho da NF-e */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Cabeçalho da NF-e</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {/* Row 1: Chave de Acesso */}
            <div className="col-span-4 flex flex-col gap-2">
              <Label htmlFor="invoice-nfe-key">Chave de Acesso (44 dígitos)</Label>
              <Input
                id="invoice-nfe-key"
                type="text"
                inputMode="numeric"
                placeholder="44 dígitos numéricos"
                value={form.watch('invoice.nfe_key')}
                onChange={handleNfeKeyChange}
                maxLength={44}
              />
              {form.formState.errors.invoice?.nfe_key && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.invoice.nfe_key.message}
                </p>
              )}
            </div>

            {/* Row 2: Numero + Serie + Data Emissao + Valor Total */}
            <div className="col-span-1 flex flex-col gap-2">
              <Label htmlFor="invoice-nfe-number">Número</Label>
              <Input
                id="invoice-nfe-number"
                type="text"
                placeholder="Ex: 000001"
                {...form.register('invoice.nfe_number')}
              />
              {form.formState.errors.invoice?.nfe_number && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.invoice.nfe_number.message}
                </p>
              )}
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <Label htmlFor="invoice-nfe-serie">Série</Label>
              <Input
                id="invoice-nfe-serie"
                type="text"
                placeholder="Ex: 1"
                {...form.register('invoice.nfe_serie')}
              />
              {form.formState.errors.invoice?.nfe_serie && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.invoice.nfe_serie.message}
                </p>
              )}
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <Label htmlFor="invoice-emission-date">Data de Emissão</Label>
              <Input
                id="invoice-emission-date"
                type="date"
                {...form.register('invoice.emission_date')}
              />
              {form.formState.errors.invoice?.emission_date && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.invoice.emission_date.message}
                </p>
              )}
            </div>
            <div className="col-span-1 flex flex-col gap-2">
              <Label htmlFor="invoice-total-value">Valor Total (R$)</Label>
              <Input
                id="invoice-total-value"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...form.register('invoice.total_value', { valueAsNumber: true })}
              />
              {form.formState.errors.invoice?.total_value && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.invoice.total_value.message}
                </p>
              )}
            </div>

            {/* Row 3: Protocolo + Data Saida */}
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="invoice-protocol">Protocolo</Label>
              <Input
                id="invoice-protocol"
                type="text"
                placeholder="Opcional"
                {...form.register('invoice.protocol')}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="invoice-exit-date">Data de Saída</Label>
              <Input
                id="invoice-exit-date"
                type="date"
                {...form.register('invoice.exit_date')}
              />
              {form.formState.errors.invoice?.exit_date && (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.invoice.exit_date.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 3: Itens da Nota */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Itens da Nota</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceItemsTable
            control={form.control}
            products={products}
            register={form.register}
            setValue={form.setValue}
            watch={form.watch}
            errors={form.formState.errors}
          />
          {form.formState.errors.items?.root && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {form.formState.errors.items.root.message}
            </p>
          )}
          {form.formState.errors.items?.message && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {form.formState.errors.items.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full"
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          'Registrar NF-e'
        )}
      </Button>
    </form>
  )
}
