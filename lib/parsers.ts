export function parseNumeric(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(String(value).replace(',', '.'))
  return isNaN(n) ? 0 : n
}
