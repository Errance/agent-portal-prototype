/**
 * 后端 DTO 字段解析防御层（审计 C2 修复）。
 *
 * 背景：mock 用 `number`，但后端按 `docs/BACKEND_API_SCHEMA.md §0.1` 可能按 `string`
 * 返回金额字段以保精度。如果前端直接用 `+` 做累加，遇到字符串会走字符串拼接
 * （例如 `0 + "42.5" === "042.5"`），且 NaN 检测抓不到，KPI 会静默算错。
 *
 * 所有 aggregate / sum / reduce 分支都应当先用 `toNumber` 把金额字段归一化。
 */

/** 把任意后端可能返回的金额值安全转为 number。null/undefined/NaN 时返回 0。 */
export function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '') return 0
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : 0
  }
  if (typeof v === 'boolean') return v ? 1 : 0
  return 0
}

/**
 * 把 object 的指定字段全部 `toNumber` 后浅合并返回新对象。
 * 用法：
 *   ```ts
 *   const clean = parseMoneyFields(record, ['commissionAmount', 'tradeVolume'])
 *   ```
 */
export function parseMoneyFields<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T)[],
): T {
  const out = { ...obj }
  for (const k of keys) {
    out[k] = toNumber(obj[k]) as T[typeof k]
  }
  return out
}
