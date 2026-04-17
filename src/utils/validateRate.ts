/**
 * 统一校验「下级返佣比例」三项表单（FF / PS / Event）。
 * 覆盖 InvitePromotion 新建/编辑推广码 与 FriendsCenter 修改子代理比例。
 *
 * 规则（审计 M5：严格小于，待产品确认是否允许"持平"）：
 * 1. 非空、可解析为有限数字
 * 2. > 0
 * 3. < 代理自身该项比例（上限，严格小于）
 *
 * 若产品决定允许子级 == 上级，需要把下面 `n >= cap` 改为 `n > cap`，并同步后端
 * 写接口校验逻辑，见 docs/BACKEND_API_SCHEMA.md §0.6。
 */

export interface RateCaps {
  flatFeeRate: number
  profitShareRate: number
  eventRate: number
}

export interface RateInput {
  flatFee: string
  profitShare: string
  event: string
}

export type RateErrors = Partial<Record<'ff' | 'ps' | 'event', string>>

export interface RateValues {
  flatFee: number
  profitShare: number
  event: number
}

export type RateResult =
  | { ok: true; values: RateValues }
  | { ok: false; errors: RateErrors }

function validOne(raw: string, cap: number, label: string): { value: number | null; error?: string } {
  if (raw === '' || raw === null || raw === undefined) return { value: null, error: '请输入' }
  const n = Number(raw)
  if (!Number.isFinite(n)) return { value: null, error: '请输入有效数字' }
  if (n <= 0) return { value: null, error: '必须大于 0' }
  if (n >= cap) return { value: null, error: `必须 < ${label}` }
  return { value: n }
}

export function validateRate(input: RateInput, caps: RateCaps): RateResult {
  const errors: RateErrors = {}
  const ff = validOne(input.flatFee, caps.flatFeeRate, `${caps.flatFeeRate}%`)
  if (ff.error) errors.ff = ff.error
  const ps = validOne(input.profitShare, caps.profitShareRate, `${caps.profitShareRate}%`)
  if (ps.error) errors.ps = ps.error
  const ev = validOne(input.event, caps.eventRate, `${caps.eventRate}%`)
  if (ev.error) errors.event = ev.error

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    values: {
      flatFee: ff.value as number,
      profitShare: ps.value as number,
      event: ev.value as number,
    },
  }
}
