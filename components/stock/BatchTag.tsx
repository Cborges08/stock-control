interface BatchTagProps {
  batchNumber: string
  openedAt: string | Date
}

export function BatchTag({ batchNumber, openedAt }: BatchTagProps) {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(openedAt))

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
      {batchNumber} &mdash; {formatted}
    </span>
  )
}
