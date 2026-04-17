import { describe, it, expect } from 'vitest'
import { getAuthCopyableIdentity, getAuthDisplayName } from '../displayName'

describe('getAuthDisplayName', () => {
  it('returns 代理商 for null / undefined user', () => {
    expect(getAuthDisplayName(null)).toBe('代理商')
    expect(getAuthDisplayName(undefined)).toBe('代理商')
  })

  it('prefers email when present', () => {
    const out = getAuthDisplayName({
      userId: 'u',
      email: 'alice@example.com',
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })
    expect(out).toContain('@example.com')
    expect(out).not.toContain('alice') // masked
  })

  it('uses address when no email', () => {
    const out = getAuthDisplayName({
      userId: 'u',
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })
    expect(out).toBe('0x1234...5678')
  })

  it('uses userId when no email/address', () => {
    const out = getAuthDisplayName({ userId: '513519754410144768' })
    expect(out).toContain('5135')
    expect(out).toContain('768')
    expect(out).toContain('*')
  })

  it('returns 代理商 when all three are empty', () => {
    expect(getAuthDisplayName({ userId: '' })).toBe('代理商')
  })
})

describe('getAuthCopyableIdentity', () => {
  it('returns null for null user', () => {
    expect(getAuthCopyableIdentity(null)).toBeNull()
  })

  it('prefers address (more useful for crypto context)', () => {
    const out = getAuthCopyableIdentity({
      userId: 'u',
      email: 'a@b.c',
      address: '0xabc',
    })
    expect(out).toEqual({ label: '钱包地址', value: '0xabc' })
  })

  it('falls back to email when no address', () => {
    const out = getAuthCopyableIdentity({ userId: 'u', email: 'a@b.c' })
    expect(out).toEqual({ label: '邮箱', value: 'a@b.c' })
  })

  it('returns null when only userId is present (userId 不适合对外复制)', () => {
    expect(getAuthCopyableIdentity({ userId: '513519' })).toBeNull()
  })
})
