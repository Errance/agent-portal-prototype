import { describe, it, expect } from 'vitest'
import { maskUid, maskAddress, maskEmail, truncateText } from '../mask'

describe('maskUid', () => {
  it('masks long UIDs', () => {
    expect(maskUid('UID100001')).toBe('UID1***001')
    expect(maskUid('UID12345678901')).toBe('UID1*******901')
  })
  it('returns dash for empty', () => {
    expect(maskUid(null)).toBe('—')
    expect(maskUid('')).toBe('—')
    expect(maskUid(undefined)).toBe('—')
  })
  it('returns as-is when shorter than prefix+suffix', () => {
    expect(maskUid('ABC')).toBe('ABC')
  })
})

describe('maskAddress', () => {
  it('masks long hex address', () => {
    expect(maskAddress('0x1234567890abcdef1234567890abcdef12345678'))
      .toBe('0x1234...5678')
  })
  it('returns as-is when short', () => {
    expect(maskAddress('0x1234')).toBe('0x1234')
  })
  it('handles null', () => {
    expect(maskAddress(null)).toBe('—')
  })
})

describe('maskEmail', () => {
  it('masks typical email', () => {
    expect(maskEmail('alice@example.com')).toBe('a***e@example.com')
  })
  it('handles very short local part', () => {
    expect(maskEmail('ab@x.com')).toBe('a*@x.com')
    expect(maskEmail('a@x.com')).toBe('a*@x.com')
  })
  it('returns as-is when no @', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email')
  })
  it('handles null', () => {
    expect(maskEmail(null)).toBe('—')
  })
})

describe('truncateText', () => {
  it('keeps short text as-is', () => {
    expect(truncateText('短文本')).toBe('短文本')
  })
  it('truncates long text with ellipsis', () => {
    expect(truncateText('这是一段非常长的备注内容需要被截断处理掉后面的', 10)).toBe('这是一段非常长的备注…')
  })
  it('handles null', () => {
    expect(truncateText(null)).toBe('—')
  })
})
