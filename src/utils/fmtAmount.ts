import Decimal from 'decimal.js-light'

/**
 * 金额格式化单点入口。所有页面的数字展示（USDT/USDC/手续费/比例等）都应走
 * `fmtAmount` 而非裸 `.toFixed()`，避免 JS 浮点加总误差（见审计 M2）。
 */

export type FmtStyle = 'decimal' | 'thousand'

export interface FmtOptions {
  digits?: number
  style?: FmtStyle
  minDigits?: number
}

export function fmtAmount(
  value: number | string | Decimal | null | undefined,
  opts: FmtOptions = {},
): string {
  const { digits = 2, style = 'decimal', minDigits } = opts
  if (value === null || value === undefined || value === '') return '—'
  let d: Decimal
  try {
    d = value instanceof Decimal ? value : new Decimal(value as number | string)
  } catch {
    return '—'
  }
  const fixed = d.toFixed(digits)
  if (style === 'thousand') {
    const [int, frac] = fixed.split('.')
    const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    if (!frac) return withCommas
    if (minDigits !== undefined && frac.length < minDigits) {
      return `${withCommas}.${frac.padEnd(minDigits, '0')}`
    }
    return `${withCommas}.${frac}`
  }
  return fixed
}

/**
 * 对多个金额做累加，用 Decimal 避免浮点误差。
 */
export function sumAmounts(values: Array<number | string | Decimal | null | undefined>): Decimal {
  return values.reduce<Decimal>((acc, v) => {
    if (v === null || v === undefined || v === '') return acc
    try {
      return acc.plus(v instanceof Decimal ? v : new Decimal(v as number | string))
    } catch {
      return acc
    }
  }, new Decimal(0))
}

export function fmtSum(
  values: Array<number | string | Decimal | null | undefined>,
  opts: FmtOptions = {},
): string {
  return fmtAmount(sumAmounts(values), opts)
}
