import { describe, it, expect } from 'vitest'
import { toNumber, parseMoneyFields } from '../parse'

describe('toNumber', () => {
  it('returns number as-is when finite', () => {
    expect(toNumber(42)).toBe(42)
    expect(toNumber(0)).toBe(0)
    expect(toNumber(-3.14)).toBe(-3.14)
  })

  it('coerces numeric strings', () => {
    expect(toNumber('42.5')).toBe(42.5)
    expect(toNumber('0')).toBe(0)
    expect(toNumber('-1.25')).toBe(-1.25)
    expect(toNumber('  12  ')).toBe(12)
  })

  it('returns 0 for null/undefined/empty', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber('')).toBe(0)
    expect(toNumber('  ')).toBe(0)
  })

  it('returns 0 for unparseable strings', () => {
    expect(toNumber('abc')).toBe(0)
    expect(toNumber('1.2.3')).toBe(0)
    expect(toNumber(NaN)).toBe(0)
    expect(toNumber(Infinity)).toBe(0)
  })

  it('handles booleans', () => {
    expect(toNumber(true)).toBe(1)
    expect(toNumber(false)).toBe(0)
  })

  it('prevents string-concatenation bugs in reduce', () => {
    const rows = [
      { v: '10.5' as unknown as number },
      { v: '20' as unknown as number },
      { v: 5 },
    ]
    const bad = rows.reduce((a, r) => a + r.v, 0 as unknown as number)
    expect(typeof bad).toBe('string')
    const good = rows.reduce((a, r) => a + toNumber(r.v), 0)
    expect(good).toBe(35.5)
  })
})

describe('parseMoneyFields', () => {
  it('coerces the listed keys', () => {
    const input = { id: 'x', amount: '12.5' as unknown as number, count: 3 }
    const out = parseMoneyFields(input, ['amount'])
    expect(out.amount).toBe(12.5)
    expect(out.count).toBe(3)
    expect(out.id).toBe('x')
  })

  it('does not mutate input', () => {
    const input = { a: '1' as unknown as number, b: '2' as unknown as number }
    parseMoneyFields(input, ['a', 'b'])
    expect(input.a as unknown).toBe('1')
  })
})
