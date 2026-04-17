/**
 * 推广链接安全校验（审计 H5 加固）：
 * - 必须 https
 * - hostname 必须精确命中白名单（而不是 startsWith 字符串前缀，防止子域绕过）
 * - 拒绝包含任何空白 / 控制字符，避免剪贴板被写入多行 payload
 * - 复制时用 `URL` 规范化后的 href，避免原始字符串里的 trailing 内容被一同复制
 */

const ALLOWED_HOSTS = new Set([
  'app.turboflow.io',
  'turboflow.io',
  'www.turboflow.io',
])

/** ASCII 控制字符（0x00-0x1F、0x7F）和全角空白等不可打印字符 */
// eslint-disable-next-line no-control-regex
const CONTROL_OR_WHITESPACE_RE = /[\s\u0000-\u001F\u007F\u00A0\u2000-\u200F\u2028\u2029]/

export function isSafePromotionUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false
  const trimmed = raw.trim()
  if (!trimmed) return false
  // 原串（含 trim 后的中间字符）中不允许任何空白 / 控制字符
  if (CONTROL_OR_WHITESPACE_RE.test(trimmed)) return false
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  if (!ALLOWED_HOSTS.has(parsed.hostname)) return false
  return true
}

/** 返回规范化后的安全 URL；若非法返回 null。 */
export function normalizePromotionUrl(raw: unknown): string | null {
  if (!isSafePromotionUrl(raw)) return null
  // 走过 isSafe 之后一定 parse 成功；再构造一次保证复制内容是 URL 规范化后的 href
  return new URL((raw as string).trim()).href
}

export interface CopyResult {
  ok: boolean
  reason?: 'invalid_url' | 'clipboard_unavailable' | 'clipboard_denied'
}

export async function safeCopyPromotionLink(url: string): Promise<CopyResult> {
  const safe = normalizePromotionUrl(url)
  if (!safe) return { ok: false, reason: 'invalid_url' }
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return { ok: false, reason: 'clipboard_unavailable' }
  }
  try {
    await navigator.clipboard.writeText(safe)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'clipboard_denied' }
  }
}
