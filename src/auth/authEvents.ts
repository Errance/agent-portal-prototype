/**
 * 登录 / 会话相关的全局 toast 事件总线。
 *
 * 设计原因（审计 F1 + F3）：
 * - 旧版 UX 用一张"需要登录"大卡片做错误/重试入口，和 Privy modal 功能重复
 * - 现在改成"modal-only + 顶部 toast"：UI 层不再有独立的登录错误卡片，
 *   所有登录/会话失效错误都通过这里发的 toast 告知用户，并带上"重新登录"
 *   这种可点击的 action
 *
 * 实现刻意用 module-scope Set 而不是 `window.dispatchEvent`：
 * - 更容易在 Vitest 中 mock 和断言（不需要 happy-dom 真的构造 CustomEvent）
 * - 跨 bundle 边界（SSR / 多 React root）不会出现事件丢失问题
 * - listener 注册/取消的语义与 React `useEffect` cleanup 对齐
 */

export type AuthToastKind = 'error' | 'info' | 'success'

export interface AuthToastAction {
  label: string
  onClick: () => void | Promise<void>
}

export interface AuthToastInput {
  kind: AuthToastKind
  message: string
  action?: AuthToastAction
  /** 自动消失毫秒，`0` / 负数 表示需要用户手动关闭。默认 5000。 */
  autoDismissMs?: number
}

export interface AuthToastItem extends AuthToastInput {
  id: string
  autoDismissMs: number
}

type Listener = (toast: AuthToastItem) => void

const DEFAULT_DISMISS_MS = 5000

const listeners = new Set<Listener>()

/** 触发一条 toast。返回 id，可用于后续手动 `dismissAuthToast(id)`（如需）。 */
export function emitAuthToast(input: AuthToastInput): string {
  const id = `auth-toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const item: AuthToastItem = {
    ...input,
    autoDismissMs: input.autoDismissMs ?? DEFAULT_DISMISS_MS,
    id,
  }
  listeners.forEach(l => {
    try {
      l(item)
    } catch {
      // 单个 listener 出错不影响其它
    }
  })
  return id
}

export function onAuthToast(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 测试专用：清空所有 listener，避免单测之间的污染。 */
export function __resetAuthToastListeners(): void {
  listeners.clear()
}
