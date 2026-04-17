import { describe, it, expect } from 'vitest'
import { isSafePromotionUrl, normalizePromotionUrl } from '../safeUrl'

describe('isSafePromotionUrl', () => {
  it('允许 app.turboflow.io 下的 https 链接', () => {
    expect(isSafePromotionUrl('https://app.turboflow.io/r/TF1001')).toBe(true)
  })
  it('允许根域与 www 子域', () => {
    expect(isSafePromotionUrl('https://turboflow.io/promo')).toBe(true)
    expect(isSafePromotionUrl('https://www.turboflow.io/promo')).toBe(true)
  })
  it('拒绝 http 链接', () => {
    expect(isSafePromotionUrl('http://app.turboflow.io/r/TF1001')).toBe(false)
  })
  it('拒绝 javascript: 伪协议', () => {
    expect(isSafePromotionUrl('javascript:alert(1)')).toBe(false)
  })
  it('拒绝钓鱼域名（hostname 精确匹配）', () => {
    expect(isSafePromotionUrl('https://app.turboflow.io.evil.com/r/TF1001')).toBe(false)
    expect(isSafePromotionUrl('https://turboflow.io.evil.com/r/TF1001')).toBe(false)
    expect(isSafePromotionUrl('https://fakeapp.turboflow.io/r/TF1001')).toBe(false)
  })
  it('拒绝空字符串 / 非字符串', () => {
    expect(isSafePromotionUrl('')).toBe(false)
    expect(isSafePromotionUrl(null)).toBe(false)
    expect(isSafePromotionUrl(undefined)).toBe(false)
    expect(isSafePromotionUrl(42 as unknown)).toBe(false)
  })
  it('拒绝含空白 / 控制字符（防剪贴板多行注入）', () => {
    expect(isSafePromotionUrl('https://app.turboflow.io/r/TF1001\nmalicious')).toBe(false)
    expect(isSafePromotionUrl('https://app.turboflow.io/r/TF1001 https://evil.com')).toBe(false)
    expect(isSafePromotionUrl('https://app.turboflow.io/r/TF1001\u0000')).toBe(false)
    expect(isSafePromotionUrl('https://app.turboflow.io/r/TF1001\u2028next')).toBe(false)
  })
})

describe('normalizePromotionUrl', () => {
  it('合法链接返回 URL.href 规范化形式', () => {
    expect(normalizePromotionUrl('https://app.turboflow.io/r/TF1001')).toBe(
      'https://app.turboflow.io/r/TF1001',
    )
  })
  it('合法链接被 trim', () => {
    expect(normalizePromotionUrl('  https://app.turboflow.io/r/TF1001  ')).toBe(
      'https://app.turboflow.io/r/TF1001',
    )
  })
  it('非法链接返回 null', () => {
    expect(normalizePromotionUrl('not a url')).toBeNull()
    expect(normalizePromotionUrl('https://evil.com/phish')).toBeNull()
  })
})
