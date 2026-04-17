import Decimal from 'decimal.js-light'

/**
 * Branded types 区分"链上最小单位字符串"与"人类可读小数"。
 * 后端主站 API 多数返回 Raw（如 "1250000" = 1.25 USDC @6 位精度），
 * agent-portal 前端展示始终用 Human。所有金额在接入后端 DTO 层必须经过
 * `fromWei`/`toWei` 的转换，不允许裸 number 直连。
 */
export type Raw = string & { readonly __raw: unique symbol }
export type Human = number & { readonly __human: unique symbol }

export function asRaw(v: string): Raw {
  return v as Raw
}

export function asHuman(v: number): Human {
  return v as Human
}

export function fromWei(raw: Raw | string, decimals: number): Human {
  const s = String(raw ?? '0').trim()
  if (!s) return 0 as Human
  try {
    return new Decimal(s).dividedBy(new Decimal(10).pow(decimals)).toNumber() as Human
  } catch {
    return 0 as Human
  }
}

export function toWei(human: Human | number, decimals: number): Raw {
  if (!Number.isFinite(human as number)) return '0' as Raw
  return new Decimal(human as number).times(new Decimal(10).pow(decimals)).toFixed(0) as Raw
}

export const COIN_DECIMALS: Record<string, number> = {
  USDT: 6,
  USDC: 6,
  BTC: 8,
  ETH: 18,
}

export function fromWeiByCoin(raw: Raw | string, coin: string): Human {
  const d = COIN_DECIMALS[coin.toUpperCase()] ?? 6
  return fromWei(raw, d)
}
