import { describe, it, expect, beforeEach } from 'vitest'
import {
  readStoredAuthState,
  writeStoredAuthState,
  clearStoredAuthState,
  isAuthStorageEvent,
  AUTH_STORAGE_PREFIX,
} from '../storage'

// happy-dom 提供 localStorage & btoa

function b64url(obj: unknown): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function futureJwt(): string {
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const body = b64url({ userId: 'abc', exp: Math.floor(Date.now() / 1000) + 3600 })
  return `${header}.${body}.sig`
}

function expiredJwt(): string {
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const body = b64url({ userId: 'abc', exp: Math.floor(Date.now() / 1000) - 3600 })
  return `${header}.${body}.sig`
}

describe('readStoredAuthState', () => {
  beforeEach(() => localStorage.clear())

  it('returns null for empty storage', () => {
    expect(readStoredAuthState()).toEqual({ token: null, address: null })
  })

  it('returns valid token + address', () => {
    const t = futureJwt()
    localStorage.setItem('tf.agent.token', t)
    localStorage.setItem('tf.agent.address', '0xabc')
    expect(readStoredAuthState()).toEqual({ token: t, address: '0xabc' })
  })

  it('self-heals corrupted token value (non-JWT shape)', () => {
    localStorage.setItem('tf.agent.token', '[object Object]')
    expect(readStoredAuthState().token).toBeNull()
    expect(localStorage.getItem('tf.agent.token')).toBeNull()
  })

  it('self-heals expired token', () => {
    localStorage.setItem('tf.agent.token', expiredJwt())
    expect(readStoredAuthState().token).toBeNull()
    expect(localStorage.getItem('tf.agent.token')).toBeNull()
  })

  it('keeps address even when token is corrupted', () => {
    localStorage.setItem('tf.agent.token', 'garbage')
    localStorage.setItem('tf.agent.address', '0xkeep')
    const s = readStoredAuthState()
    expect(s.token).toBeNull()
    expect(s.address).toBe('0xkeep')
  })
})

describe('writeStoredAuthState', () => {
  beforeEach(() => localStorage.clear())

  it('only writes token when address is omitted', () => {
    const t = futureJwt()
    writeStoredAuthState({ token: t })
    expect(localStorage.getItem('tf.agent.token')).toBe(t)
    expect(localStorage.getItem('tf.agent.address')).toBeNull()
  })

  it('writes both token and address', () => {
    const t = futureJwt()
    writeStoredAuthState({ token: t, address: '0xnew' })
    expect(localStorage.getItem('tf.agent.token')).toBe(t)
    expect(localStorage.getItem('tf.agent.address')).toBe('0xnew')
  })

  it('ignores non-JWT tokens (defensive)', () => {
    writeStoredAuthState({ token: 'not-a-jwt' })
    expect(localStorage.getItem('tf.agent.token')).toBeNull()
  })

  it('removes token when passed null', () => {
    localStorage.setItem('tf.agent.token', futureJwt())
    writeStoredAuthState({ token: null })
    expect(localStorage.getItem('tf.agent.token')).toBeNull()
  })

  it('removes address when passed empty string', () => {
    localStorage.setItem('tf.agent.address', '0xold')
    writeStoredAuthState({ address: '' })
    expect(localStorage.getItem('tf.agent.address')).toBeNull()
  })
})

describe('clearStoredAuthState', () => {
  it('clears both token and address', () => {
    localStorage.setItem('tf.agent.token', futureJwt())
    localStorage.setItem('tf.agent.address', '0x')
    clearStoredAuthState()
    expect(localStorage.getItem('tf.agent.token')).toBeNull()
    expect(localStorage.getItem('tf.agent.address')).toBeNull()
  })
})

describe('isAuthStorageEvent', () => {
  it('matches keys with auth prefix', () => {
    const ev = new StorageEvent('storage', { key: `${AUTH_STORAGE_PREFIX}token` })
    expect(isAuthStorageEvent(ev)).toBe(true)
  })
  it('ignores unrelated keys', () => {
    const ev = new StorageEvent('storage', { key: 'some.other.key' })
    expect(isAuthStorageEvent(ev)).toBe(false)
  })
  it('ignores events without a key', () => {
    const ev = new StorageEvent('storage', { key: null })
    expect(isAuthStorageEvent(ev)).toBe(false)
  })
})
