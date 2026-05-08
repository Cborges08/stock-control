/**
 * Validates a Brazilian CNPJ using the Módulo-11 algorithm.
 *
 * Accepts both formatted (XX.XXX.XXX/XXXX-XX) and raw digit strings.
 * Strips all non-digit characters before validation (per D-03).
 *
 * @param raw - CNPJ string (formatted or digits only)
 * @returns true if CNPJ is valid
 */

const INVALID_CNPJS = new Set([
  '00000000000000', '11111111111111', '22222222222222', '33333333333333',
  '44444444444444', '55555555555555', '66666666666666', '77777777777777',
  '88888888888888', '99999999999999',
])

export function validateCnpj(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (INVALID_CNPJS.has(digits)) return false

  const calc = (weights: number[]): number => {
    const sum = weights.reduce((acc, w, i) => acc + Number(digits[i]) * w, 0)
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }

  const d1 = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return Number(digits[12]) === d1 && Number(digits[13]) === d2
}
