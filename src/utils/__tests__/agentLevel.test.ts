import { describe, it, expect } from 'vitest'
import { clampAgentLevel } from '../agentLevel'

describe('clampAgentLevel', () => {
  it.each([
    [0, 1], [1, 1], [3, 3], [5, 5], [6, 5], [100, 5],
    [-1, 1], [NaN, 1], [Infinity, 5], [-Infinity, 1],
  ])('clampAgentLevel(%s) = %s', (input, out) => {
    expect(clampAgentLevel(input)).toBe(out)
  })
  it('字符串可解析', () => {
    expect(clampAgentLevel('3')).toBe(3)
  })
  it('字符串不可解析 fallback 到 1', () => {
    expect(clampAgentLevel('abc')).toBe(1)
  })
})
