/**
 * Validates a Brazilian NF-e access key (Chave de Acesso).
 *
 * Structure (44 digits):
 * - Positions 0-1: cUF (IBGE state code, range 11-53)
 * - Positions 2-7: AAMM (year-month of emission)
 * - Positions 8-21: CNPJ of emitter (14 digits)
 * - Position 22-23: mod (fiscal document model, e.g. 55=NF-e)
 * - Positions 24-26: serie
 * - Positions 27-35: numero
 * - Position 36: tpEmis (emission type)
 * - Positions 37-44: cNF (random code, 8 digits)
 * - Position 43: cDV (Módulo-11 check digit of first 43 digits)
 *
 * cDV algorithm:
 * - From position 42 down to 0, multiply each digit by cycling multipliers 2-9
 * - rem = sum % 11
 * - cDV = rem < 2 ? 0 : 11 - rem
 *
 * @param key - NF-e access key string (44 digits)
 * @returns true if key is structurally valid with correct cUF and cDV
 */

// Valid IBGE state codes (cUF) for Brazil
const VALID_CUF = new Set([
  11, 12, 13, 14, 15, 16, 17,         // North: RO, AC, AM, RR, PA, AP, TO
  21, 22, 23, 24, 25, 26, 27, 28, 29, // Northeast: MA, PI, CE, RN, PB, PE, AL, SE, BA
  31, 32, 33, 35,                      // Southeast: MG, ES, RJ, SP
  41, 42, 43,                          // South: PR, SC, RS
  50, 51, 52, 53,                      // Center-West: MS, MT, GO, DF
])

export function validateNfeKey(key: string): boolean {
  if (!/^\d{44}$/.test(key)) return false

  const cuf = Number(key.slice(0, 2))
  if (!VALID_CUF.has(cuf)) return false

  // Módulo-11 check digit on first 43 digits
  const digits = key.split('').map(Number)
  let sum = 0
  let multiplier = 2
  for (let i = 42; i >= 0; i--) {
    sum += digits[i]! * multiplier
    multiplier = multiplier === 9 ? 2 : multiplier + 1
  }
  const rem = sum % 11
  const expectedCdv = rem < 2 ? 0 : 11 - rem

  return digits[43] === expectedCdv
}
