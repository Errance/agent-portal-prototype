/**
 * 业务 JWT 本地存储（localStorage）。
 *
 * - key 命名空间带项目前缀，避免和主站 / 其它应用冲突
 * - 所有调用包 try/catch：Safari 隐私模式 / 存储配额满等情况下不抛异常
 * - 跨标签同步可用 `window.addEventListener('storage', ...)`（本文件不处理，留给 AuthProvider）
 */

const KEY = 'tf.agent.token'

export function readStoredToken(): string | null {
  try {
    return typeof window === 'undefined' ? null : localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function writeStoredToken(token: string): void {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, token)
  } catch {
    // ignore
  }
}

export function clearStoredToken(): void {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export const STORED_TOKEN_KEY = KEY
