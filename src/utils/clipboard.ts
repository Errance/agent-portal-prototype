/**
 * 通用剪贴板工具（审计 S5）。
 *
 * 与 `safeUrl.ts` 的区别：
 * - `safeUrl.ts` 专门服务于推广链接，带白名单 / 协议 / 控制字符校验
 * - 本文件服务于"任意文本"的复制（钱包地址、邮箱、UID 等），只封装 UX 反馈
 *
 * 原因：以前 `UserMenu` 里的 `navigator.clipboard.writeText().catch(() => {})` 会
 * 把权限被拒的情况静默吞掉，用户点了复制按钮什么都没发生，没有任何提示。
 * 现在调用方 await 这个函数拿到 ok/reason 后，再决定是 toast 还是 inline 提示。
 */

export type CopyTextReason = 'clipboard_unavailable' | 'clipboard_denied' | 'empty'

export interface CopyTextResult {
  ok: boolean
  reason?: CopyTextReason
}

export async function copyText(text: string | null | undefined): Promise<CopyTextResult> {
  if (!text) return { ok: false, reason: 'empty' }
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return { ok: false, reason: 'clipboard_unavailable' }
  }
  try {
    await navigator.clipboard.writeText(text)
    return { ok: true }
  } catch {
    return { ok: false, reason: 'clipboard_denied' }
  }
}

export function copyFailureMessage(reason: CopyTextReason | undefined): string {
  switch (reason) {
    case 'clipboard_unavailable':
      return '当前环境不支持复制到剪贴板，请长按手动选择。'
    case 'clipboard_denied':
      return '剪贴板权限被拒绝，请手动选中文本复制。'
    case 'empty':
      return '没有可复制的内容。'
    default:
      return '复制失败，请手动选中文本复制。'
  }
}
