import { describe, it, expect } from 'vitest'
import { decodeBusinessJwt, isJwtExpired, isTokenExpired } from '../jwt'

/**
 * 手工构造 JWT 字符串，便于测试。base64url 编码：
 * - `+` → `-`
 * - `/` → `_`
 * - 去掉末尾 `=`
 */
function b64url(obj: unknown): string {
  const json = JSON.stringify(obj)
  // happy-dom 提供 btoa
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const body = b64url(payload)
  return `${header}.${body}.sig`
}

describe('decodeBusinessJwt', () => {
  it('decodes a well-formed JWT payload', () => {
    const token = makeJwt({ userId: '513519754410144768', userRoleType: '0', exp: 1779039163 })
    const payload = decodeBusinessJwt(token)
    expect(payload?.userId).toBe('513519754410144768')
    expect(payload?.userRoleType).toBe('0')
    expect(payload?.exp).toBe(1779039163)
  })

  it('returns null for empty / missing token', () => {
    expect(decodeBusinessJwt(null)).toBeNull()
    expect(decodeBusinessJwt(undefined)).toBeNull()
    expect(decodeBusinessJwt('')).toBeNull()
  })

  it('returns null for non-3-part strings', () => {
    expect(decodeBusinessJwt('not-a-jwt')).toBeNull()
    expect(decodeBusinessJwt('a.b')).toBeNull()
    expect(decodeBusinessJwt('a.b.c.d')).toBeNull()
  })

  it('returns null for invalid base64 in payload', () => {
    expect(decodeBusinessJwt('aaa.!!!.bbb')).toBeNull()
  })

  it('returns null for non-JSON payload', () => {
    const payload = btoa('not json').replace(/=+$/, '')
    expect(decodeBusinessJwt(`aaa.${payload}.bbb`)).toBeNull()
  })
})

describe('isJwtExpired', () => {
  it('returns false for tokens without exp', () => {
    expect(isJwtExpired({ userId: 'x' })).toBe(false)
  })

  it('returns false for future exp', () => {
    const future = Math.floor(Date.now() / 1000) + 3600
    expect(isJwtExpired({ exp: future })).toBe(false)
  })

  it('returns true for past exp', () => {
    const past = Math.floor(Date.now() / 1000) - 3600
    expect(isJwtExpired({ exp: past })).toBe(true)
  })

  it('respects skew: a token that expires in 5s is considered expired by default 30s skew', () => {
    const nearFuture = Math.floor(Date.now() / 1000) + 5
    expect(isJwtExpired({ exp: nearFuture })).toBe(true)
    // 明确传 0 skew 时，5 秒后才过期 → 现在不过期
    expect(isJwtExpired({ exp: nearFuture }, 0)).toBe(false)
  })

  it('returns false for null / undefined payload', () => {
    expect(isJwtExpired(null)).toBe(false)
    expect(isJwtExpired(undefined)).toBe(false)
  })
})

describe('isTokenExpired', () => {
  it('returns true for missing token', () => {
    expect(isTokenExpired(null)).toBe(true)
    expect(isTokenExpired('')).toBe(true)
  })

  it('returns true for corrupted token (decode fails)', () => {
    expect(isTokenExpired('garbage')).toBe(true)
    expect(isTokenExpired('a.!!!.b')).toBe(true)
  })

  it('returns false for valid future token', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(isTokenExpired(token)).toBe(false)
  })

  it('returns true for expired token', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 })
    expect(isTokenExpired(token)).toBe(true)
  })
})
