import { describe, it, expect } from 'vitest'
import { validateRate } from '../validateRate'

const caps = { flatFeeRate: 1.5, profitShareRate: 0.008, eventRate: 1.2 }

describe('validateRate', () => {
  it('正常输入返回 ok:true + 数值', () => {
    const r = validateRate({ flatFee: '1.0', profitShare: '0.005', event: '0.8' }, caps)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.values).toEqual({ flatFee: 1, profitShare: 0.005, event: 0.8 })
  })

  it('空字符串 -> 请输入', () => {
    const r = validateRate({ flatFee: '', profitShare: '0.005', event: '0.8' }, caps)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.ff).toBe('请输入')
  })

  it('非数字 -> 有效数字提示', () => {
    const r = validateRate({ flatFee: 'abc', profitShare: '0.005', event: '0.8' }, caps)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.ff).toBe('请输入有效数字')
  })

  it('0 或负数 -> 必须大于 0', () => {
    const zero = validateRate({ flatFee: '0', profitShare: '0.005', event: '0.8' }, caps)
    const neg = validateRate({ flatFee: '-1', profitShare: '0.005', event: '0.8' }, caps)
    expect(zero.ok).toBe(false); if (!zero.ok) expect(zero.errors.ff).toBe('必须大于 0')
    expect(neg.ok).toBe(false); if (!neg.ok) expect(neg.errors.ff).toBe('必须大于 0')
  })

  it('等于或超过上限 -> 报错', () => {
    const eq = validateRate({ flatFee: '1.5', profitShare: '0.005', event: '0.8' }, caps)
    const over = validateRate({ flatFee: '2.0', profitShare: '0.005', event: '0.8' }, caps)
    expect(eq.ok).toBe(false); if (!eq.ok) expect(eq.errors.ff).toBe('必须 < 1.5%')
    expect(over.ok).toBe(false); if (!over.ok) expect(over.errors.ff).toBe('必须 < 1.5%')
  })

  it('三项同时错 -> 同时报错', () => {
    const r = validateRate({ flatFee: '', profitShare: '', event: '' }, caps)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.ff).toBe('请输入')
      expect(r.errors.ps).toBe('请输入')
      expect(r.errors.event).toBe('请输入')
    }
  })

  it('NaN 与 Infinity 被拒', () => {
    const nan = validateRate({ flatFee: 'NaN', profitShare: '0.005', event: '0.8' }, caps)
    const inf = validateRate({ flatFee: 'Infinity', profitShare: '0.005', event: '0.8' }, caps)
    expect(nan.ok).toBe(false)
    expect(inf.ok).toBe(false)
  })
})
