import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './context'
import type { AuthProvider, AuthUser } from './types'
import { setAccessTokenGetter } from '@/api/client'

const DEMO_USER: AuthUser = {
  userId: 'SELF',
  address: '0xDemo0000000000000000000000000000000DEMO',
}
const DEMO_TOKEN = 'mock-dev-token'

/**
 * Stub AuthProvider（Privy 接入前的过渡实现）：
 * - 开发期默认"已登录"，避免未接入 Privy 时每次访问都被拦
 * - `login()` / `logout()` 切本地 state，便于调试未登录态（配合 `?unauth=1` 查询参数可启动未登录视图）
 * - `getAccessToken()` 永远返回 mock token，真实后端接入前仅占位
 *
 * URL `?unauth=1` 启动时初始化为未登录，供手动测试 RequireAuth 分支。
 */
export function StubAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const initial = useMemo(() => {
    if (typeof window === 'undefined') return true
    try {
      // ?unauth=1 在 Hash / Browser 两种路由模式下都生效（检 window.location.search）
      const search = window.location.search || ''
      return !/\bunauth=1\b/.test(search)
    } catch {
      return true
    }
  }, [])
  const [isAuthenticated, setIsAuthenticated] = useState(initial)

  const getAccessToken = useCallback(async () => {
    return isAuthenticated ? DEMO_TOKEN : null
  }, [isAuthenticated])

  const login = useCallback(async () => {
    if (import.meta.env.DEV) console.info('[auth/stub] login()')
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    if (import.meta.env.DEV) console.info('[auth/stub] logout()')
    setIsAuthenticated(false)
    queryClient.clear()
  }, [queryClient])

  // 把 token getter 注册到 api/client，让 apiFetch 能拿到
  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
    return () => setAccessTokenGetter(null)
  }, [getAccessToken])

  // 401 统一处理：apiFetch 抛 401 → 触发登出流程（清 token + query 缓存）
  // Privy 接入后，logout 内部会进一步清 privy 会话并弹 login modal
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onUnauthorized = () => { void logout() }
    window.addEventListener('api:unauthorized', onUnauthorized)
    return () => window.removeEventListener('api:unauthorized', onUnauthorized)
  }, [logout])

  const value: AuthProvider = useMemo(
    () => ({
      isAuthenticated,
      isLoading: false,
      user: isAuthenticated ? DEMO_USER : null,
      login,
      logout,
      getAccessToken,
    }),
    [isAuthenticated, login, logout, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
