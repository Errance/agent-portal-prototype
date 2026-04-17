import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  emitAuthToast,
  onAuthToast,
  __resetAuthToastListeners,
  type AuthToastItem,
} from '../authEvents'

describe('authEvents', () => {
  beforeEach(() => {
    __resetAuthToastListeners()
  })
  afterEach(() => {
    __resetAuthToastListeners()
  })

  it('delivers toast to a registered listener', () => {
    const listener = vi.fn()
    onAuthToast(listener)
    const id = emitAuthToast({ kind: 'error', message: 'oops' })
    expect(listener).toHaveBeenCalledTimes(1)
    const item = listener.mock.calls[0][0] as AuthToastItem
    expect(item.id).toBe(id)
    expect(item.kind).toBe('error')
    expect(item.message).toBe('oops')
    expect(item.autoDismissMs).toBeGreaterThan(0)
  })

  it('defaults autoDismissMs but respects explicit 0', () => {
    const listener = vi.fn()
    onAuthToast(listener)
    emitAuthToast({ kind: 'info', message: 'hi', autoDismissMs: 0 })
    expect((listener.mock.calls[0][0] as AuthToastItem).autoDismissMs).toBe(0)
  })

  it('unsubscribe stops delivery', () => {
    const listener = vi.fn()
    const off = onAuthToast(listener)
    off()
    emitAuthToast({ kind: 'info', message: 'x' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('isolates listeners: a thrown listener does not stop others', () => {
    const bad = vi.fn(() => {
      throw new Error('boom')
    })
    const good = vi.fn()
    onAuthToast(bad)
    onAuthToast(good)
    emitAuthToast({ kind: 'error', message: 'msg' })
    expect(bad).toHaveBeenCalled()
    expect(good).toHaveBeenCalled()
  })

  it('supports action payload', () => {
    const listener = vi.fn()
    onAuthToast(listener)
    const onClick = vi.fn()
    emitAuthToast({ kind: 'error', message: 'x', action: { label: 'Retry', onClick } })
    const item = listener.mock.calls[0][0] as AuthToastItem
    expect(item.action?.label).toBe('Retry')
    void item.action?.onClick()
    expect(onClick).toHaveBeenCalled()
  })
})
