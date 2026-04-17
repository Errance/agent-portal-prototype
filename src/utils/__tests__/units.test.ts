import { describe, it, expect } from 'vitest'
import { fromWei, toWei, fromWeiByCoin } from '../units'

describe('units', () => {
  it('fromWei 6 位精度', () => {
    expect(fromWei('1250000', 6)).toBe(1.25)
  })
  it('toWei 6 位精度', () => {
    expect(toWei(1.25, 6)).toBe('1250000')
  })
  it('fromWei 空/无效输入返回 0', () => {
    expect(fromWei('', 6)).toBe(0)
    expect(fromWei('abc', 6)).toBe(0)
  })
  it('fromWeiByCoin 按币种取精度', () => {
    expect(fromWeiByCoin('1000000', 'USDC')).toBe(1)
    expect(fromWeiByCoin('100000000', 'BTC')).toBe(1)
  })
})
