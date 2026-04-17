const ALLOWED_PREFIXES = [
  'https://app.turboflow.io/',
  'https://turboflow.io/',
  'https://www.turboflow.io/',
]

export function isSafePromotionUrl(raw: string): boolean {
  if (typeof raw !== 'string') return false
  const trimmed = raw.trim()
  if (!trimmed) return false
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  return ALLOWED_PREFIXES.some(p => trimmed.startsWith(p))
}

export interface CopyResult {
  ok: boolean
  reason?: 'invalid_url' | 'clipboard_unavailable' | 'clipboard_denied'
}

export async function safeCopyPromotionLink(url: string): Promise<CopyResult> {
  if (!isSafePromotionUrl(url)) {
    return { ok: false, reason: 'invalid_url' }
  }
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return { ok: false, reason: 'clipboard_unavailable' }
  }
  try {
    await navigator.clipboard.writeText(url)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'clipboard_denied' }
  }
}
