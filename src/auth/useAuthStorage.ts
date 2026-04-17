import { useCallback, useEffect, useState } from 'react'
import {
  clearStoredAuthState,
  isAuthStorageEvent,
  readStoredAuthState,
  writeStoredAuthState,
  type AuthStoredState,
} from './storage'

/**
 * Auth storage 快照 + cross-tab 同步 Hook（审计 A3）。
 *
 * 职责：
 * - 把 `readStoredAuthState()` 暴露成 React state，组件可直接订阅
 * - 提供 `persist(patch)` / `clear()` 封装 storage 写入并同步 React state
 * - 监听 `storage` 事件，跨 tab 的登录/登出变更同步进来
 *
 * **不做**的事：
 * - 不和 Privy SDK 交互
 * - 不派发 toast / 事件
 * - 不做 loginError 守卫
 *
 * 这样可以单独 happy-dom 测试：修改 localStorage → state 更新；
 * 跨 tab 事件 → state 更新；persist → localStorage 同步。
 */
export function useAuthStorage(): {
  snapshot: AuthStoredState
  persist: (patch: { token?: string | null; address?: string | null }) => void
  clear: () => void
} {
  // 初始值直接从 localStorage 读（同步），避免首帧 `snapshot.token = null`
  // 而引起路由守卫误判未登录。
  const [snapshot, setSnapshot] = useState<AuthStoredState>(() => readStoredAuthState())

  const persist = useCallback((patch: { token?: string | null; address?: string | null }) => {
    writeStoredAuthState(patch)
    setSnapshot(readStoredAuthState())
  }, [])

  const clear = useCallback(() => {
    clearStoredAuthState()
    setSnapshot({ token: null, address: null })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (!isAuthStorageEvent(e)) return
      setSnapshot(readStoredAuthState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { snapshot, persist, clear }
}
