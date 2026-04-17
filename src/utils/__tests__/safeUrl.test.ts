import { describe, it, expect } from 'vitest'
import { isSafePromotionUrl } from '../safeUrl'

describe('isSafePromotionUrl', () => {
  it('允许 app.turboflow.io 下的 https 链接', () => {
    expect(isSafePromotionUrl('https://app.turboflow.io/r/TF1001')).toBe(true)
  })
  it('拒绝 http 链接', () => {
    expect(isSafePromotionUrl('http://app.turboflow.io/r/TF1001')).toBe(false)
  })
  it('拒绝 javascript: 伪协议', () => {
    expect(isSafePromotionUrl('javascript:alert(1)')).toBe(false)
  })
  it('拒绝钓鱼域名', () => {
    expect(isSafePromotionUrl('https://app.turboflow.io.evil.com/r/TF1001')).toBe(false)
  })
  it('拒绝空字符串 / 非字符串', () => {
    expect(isSafePromotionUrl('')).toBe(false)
    // @ts-expect-error 故意传非 string
    expect(isSafePromotionUrl(null)).toBe(false)
  })
})
