import { describe, it, expect } from 'vitest'
import { sanitizeBackendMsg } from '../sanitize'

describe('sanitizeBackendMsg', () => {
  it('returns fallback for non-string / empty', () => {
    expect(sanitizeBackendMsg(undefined)).toBe('请求异常')
    expect(sanitizeBackendMsg(null)).toBe('请求异常')
    expect(sanitizeBackendMsg(42)).toBe('请求异常')
    expect(sanitizeBackendMsg('')).toBe('请求异常')
  })

  it('strips v8-style stack lines', () => {
    const msg = '错误 at /home/app/server.js:10:5 at inner (/home/app/lib.js:3:1)'
    const out = sanitizeBackendMsg(msg)
    expect(out).not.toContain('/home/app/server.js')
    expect(out).toContain('[redacted]')
  })

  it('strips Windows absolute paths', () => {
    const out = sanitizeBackendMsg(`bad C:\\Users\\app\\main.exe boom`)
    expect(out).not.toContain('C:\\Users')
    expect(out).toContain('[redacted]')
  })

  it('masks internal IP / port', () => {
    const out = sanitizeBackendMsg('upstream 10.0.1.2:8080 timeout')
    expect(out).toContain('[ip]')
    expect(out).not.toContain('10.0.1.2')
  })

  it('truncates long msg with ellipsis', () => {
    const long = 'a'.repeat(500)
    const out = sanitizeBackendMsg(long, { maxLen: 50 })
    expect(out).toHaveLength(50)
    expect(out.endsWith('…')).toBe(true)
  })

  it('collapses whitespace', () => {
    expect(sanitizeBackendMsg('foo   bar\n\nbaz')).toBe('foo bar baz')
  })

  it('keeps short safe messages intact', () => {
    expect(sanitizeBackendMsg('无效token')).toBe('无效token')
  })
})
