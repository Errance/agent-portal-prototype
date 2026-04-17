import { describe, it, expect } from 'vitest'
import { fmtAmount, sumAmounts, fmtSum } from '../fmtAmount'

describe('fmtAmount', () => {
  it('普通小数 2 位', () => {
    expect(fmtAmount(1.235, { digits: 2 })).toBe('1.24')
  })
  it('千分位', () => {
    expect(fmtAmount(1234567.891, { digits: 2, style: 'thousand' })).toBe('1,234,567.89')
  })
  it('null / undefined -> —', () => {
    expect(fmtAmount(null)).toBe('—')
    expect(fmtAmount(undefined)).toBe('—')
  })
})

describe('sumAmounts', () => {
  it('0.1 + 0.2 精确', () => {
    expect(sumAmounts([0.1, 0.2]).toNumber()).toBe(0.3)
  })
  it('忽略空值', () => {
    expect(sumAmounts([1, null, 2, undefined, '3']).toNumber()).toBe(6)
  })
})

describe('fmtSum', () => {
  it('联合累加 + 格式化', () => {
    expect(fmtSum([0.1, 0.2, 0.3])).toBe('0.60')
  })
})
