'use client'

import { useState } from 'react'
import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  type FieldErrors,
} from 'react-hook-form'
import type { InvoicePayload } from '@/lib/validators/invoice'
import { Trash2, Plus, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

interface InvoiceItemsTableProps {
  control: Control<InvoicePayload>
  products: Array<{ id: string; description: string; code: string; ncm: string | null }>
  register: UseFormRegister<InvoicePayload>
  setValue: UseFormSetValue<InvoicePayload>
  watch: UseFormWatch<InvoicePayload>
  errors: FieldErrors<InvoicePayload>
}

export function InvoiceItemsTable({
  control,
  products,
  register,
  setValue,
  watch,
  errors,
}: InvoiceItemsTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  // Track which row's popover is open (by row index, null = none open)
  const [openPopover, setOpenPopover] = useState<number | null>(null)

  // Recompute total_price and write it to form state (D-02, Pitfall 3)
  const updateTotal = (index: number) => {
    const qty = watch(`items.${index}.quantity`) || 0
    const price = watch(`items.${index}.unit_price`) || 0
    setValue(`items.${index}.total_price`, qty * price)
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: '30%' }}>Produto</TableHead>
            <TableHead style={{ width: '12%' }}>NCM</TableHead>
            <TableHead style={{ width: '12%' }}>Quantidade</TableHead>
            <TableHead style={{ width: '15%' }}>Preco Unit.</TableHead>
            <TableHead style={{ width: '12%' }}>Total</TableHead>
            <TableHead style={{ width: '8%' }}>CST</TableHead>
            <TableHead style={{ width: '8%' }}>CFOP</TableHead>
            <TableHead style={{ width: '3%' }}>Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => {
            const selectedProductId = watch(`items.${index}.product_id`)
            const selectedProduct = products.find((p) => p.id === selectedProductId)

            return (
              // Pitfall 5: key={field.id} NOT index
              <TableRow key={field.id}>
                {/* Column 1: Produto — Popover+Command combobox (D-04, D-05, D-06) */}
                <TableCell>
                  <Popover
                    open={openPopover === index}
                    onOpenChange={(open: boolean) =>
                      setOpenPopover(open ? index : null)
                    }
                  >
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={openPopover === index}
                          className="w-full justify-between font-normal"
                        />
                      }
                    >
                      {selectedProduct?.description ?? 'Selecionar...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar produto..." />
                        <CommandList>
                          {/* D-06: empty state message */}
                          <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                          <CommandGroup>
                            {products.map((product) => (
                              <CommandItem
                                key={product.id}
                                value={product.description}
                                data-checked={
                                  selectedProductId === product.id
                                    ? 'true'
                                    : undefined
                                }
                                onSelect={() => {
                                  setValue(`items.${index}.product_id`, product.id)
                                  // Auto-fill NCM if product has it
                                  if (product.ncm) {
                                    setValue(
                                      `items.${index}.ncm` as Parameters<typeof setValue>[0],
                                      product.ncm as never
                                    )
                                  }
                                  setOpenPopover(null)
                                }}
                              >
                                {/* D-04: filter by description — CommandItem value={product.description} */}
                                {product.description}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.items?.[index]?.product_id && (
                    <p role="alert" className="text-xs text-destructive mt-1">
                      {errors.items[index].product_id?.message}
                    </p>
                  )}
                </TableCell>

                {/* Column 2: NCM */}
                <TableCell>
                  <Input
                    {...register(`items.${index}.ncm` as Parameters<typeof register>[0])}
                    placeholder="NCM"
                  />
                </TableCell>

                {/* Column 3: Quantidade — D-03: step=0.001 min=0.001 */}
                <TableCell>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    onChange={(e) => {
                      // Call RHF onChange first so form state is updated
                      register(`items.${index}.quantity`, { valueAsNumber: true }).onChange(e)
                      // Defer total update so RHF state is current (Pitfall 3)
                      setTimeout(() => updateTotal(index), 0)
                    }}
                  />
                  {errors.items?.[index]?.quantity && (
                    <p role="alert" className="text-xs text-destructive mt-1">
                      {errors.items[index].quantity?.message}
                    </p>
                  )}
                </TableCell>

                {/* Column 4: Preco Unit. — D-01: type=number, step=0.01 */}
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    onChange={(e) => {
                      register(`items.${index}.unit_price`, { valueAsNumber: true }).onChange(e)
                      setTimeout(() => updateTotal(index), 0)
                    }}
                  />
                  {errors.items?.[index]?.unit_price && (
                    <p role="alert" className="text-xs text-destructive mt-1">
                      {errors.items[index].unit_price?.message}
                    </p>
                  )}
                </TableCell>

                {/* Column 5: Total — D-02: read-only, pt-BR currency format, written to form state */}
                <TableCell className="text-sm">
                  {(watch(`items.${index}.total_price`) || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCell>

                {/* Column 6: CST */}
                <TableCell>
                  <Input
                    {...register(`items.${index}.cst` as Parameters<typeof register>[0])}
                    placeholder="CST"
                  />
                </TableCell>

                {/* Column 7: CFOP */}
                <TableCell>
                  <Input
                    {...register(`items.${index}.cfop` as Parameters<typeof register>[0])}
                    placeholder="CFOP"
                  />
                </TableCell>

                {/* Column 8: Acoes — remove button, disabled when only 1 row */}
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remover item ${index + 1}`}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Add row button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={() =>
          append({ product_id: '', quantity: 0, unit_price: 0, total_price: 0 })
        }
      >
        <Plus className="h-4 w-4 mr-1" />
        Adicionar Item
      </Button>
    </div>
  )
}
