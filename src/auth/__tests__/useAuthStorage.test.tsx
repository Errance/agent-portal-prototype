import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAuthStorage } from '../useAuthStorage'

function b64url(obj: unknown): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function futureJwt(): string {
  const h = b64url({ alg: 'HS256', typ: 'JWT' })
  const p = b64url({ userId: 'u', exp: Math.floor(Date.now() / 1000) + 3600 })
  return `${h}.${p}.sig`
}

describe('useAuthStorage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('hydrates initial snapshot from localStorage', () => {
    const t = futureJwt()
    localStorage.setItem('tf.agent.token', t)
    localStorage.setItem('tf.agent.address', '0xabc')
    const { result } = renderHook(() => useAuthStorage())
    expect(result.current.snapshot).toEqual({ token: t, address: '0xabc' })
  })

  it('persist({ token, address }) updates both localStorage and React state', () => {
    const { result } = renderHook(() => useAuthStorage())
    const t = futureJwt()
    act(() => {
      result.current.persist({ token: t, address: '0xnew' })
    })
    expect(result.current.snapshot).toEqual({ token: t, address: '0xnew' })
    expect(localStorage.getItem('tf.agent.token')).toBe(t)
    expect(localStorage.getItem('tf.agent.address')).toBe('0xnew')
  })

  it('clear() wipes both sides', () => {
    const t = futureJwt()
    localStorage.setItem('tf.agent.token', t)
    localStorage.setItem('tf.agent.address', '0x')
    const { result } = renderHook(() => useAuthStorage())
    act(() => result.current.clear())
    expect(result.current.snapshot).toEqual({ token: null, address: null })
    expect(localStorage.getItem('tf.agent.token')).toBeNull()
    expect(localStorage.getItem('tf.agent.address')).toBeNull()
  })

  it('reacts to cross-tab storage events', () => {
    const { result } = renderHook(() => useAuthStorage())
    const t = futureJwt()
    // 模拟其它 tab 往 localStorage 里写了 token
    act(() => {
      localStorage.setItem('tf.agent.token', t)
      localStorage.setItem('tf.agent.address', '0xtab')
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'tf.agent.token',
          newValue: t,
        }),
      )
    })
    expect(result.current.snapshot.token).toBe(t)
    expect(result.current.snapshot.address).toBe('0xtab')
  })

  it('ignores unrelated storage events', () => {
    const { result } = renderHook(() => useAuthStorage())
    const initial = result.current.snapshot
    act(() => {
      localStorage.setItem('some-other-key', 'x')
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'some-other-key', newValue: 'x' }),
      )
    })
    expect(result.current.snapshot).toEqual(initial)
  })
})
