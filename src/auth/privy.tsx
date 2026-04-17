import {
  PrivyProvider,
  usePrivy,
  useLogin,
  useLogout,
  useIdentityToken,
  type User,
} from '@privy-io/react-auth'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AuthContext } from './context'
import { loginToBackend, LoginError, ERRNO_WHITELIST_FORBIDDEN } from './loginApi'
import { privyConfig, DEFAULT_PRIVY_APP_ID } from './privyConfig'
import { clearStoredToken, readStoredToken, writeStoredToken } from './storage'
import type { AuthProvider as AuthProviderIface, AuthUser } from './types'
import { setAccessTokenGetter } from '@/api/client'

/**
 * Privy AuthProvider 真实实现（对应 AuthProvider 接口）。
 *
 * 职责分层：
 * - `PrivyAuthProvider`（默认导出）—— 挂 `<PrivyProvider>` SDK + `<PrivyAuthBridge>`
 * - `PrivyAuthBridge` —— 用 Privy hooks 实现 AuthContext，做业务 JWT 换取 / 持久化 / 登出
 *
 * 主要流程（见 docs/BACKEND_PENDING_INTERFACES.md §1）：
 * 1. 用户点 RequireAuth → `auth.login()` → 打开 Privy modal
 * 2. Privy 登录成功 → `useLogin.onComplete` → 拿 `accessToken + identityToken`
 * 3. 调 `/login` 换业务 JWT → 存 localStorage + state
 * 4. 业务 API 通过 `setAccessTokenGetter` 注入 Bearer
 * 5. 401 / errno=='104' → `api:unauthorized` → logout（清 JWT + Privy logout + query cache）
 */

function mapPrivyUserToAuthUser(user: User | null, hasJwt: boolean): AuthUser | null {
  if (!user || !hasJwt) return null
  return {
    userId: user.id, // 占位：主站业务 uid 等 /agent/me 接入后覆盖
    address: user.wallet?.address,
    email: user.email?.address,
    privyId: user.id,
  }
}

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy()
  const { logout: privyLogout } = useLogout()
  const { identityToken } = useIdentityToken()
  const queryClient = useQueryClient()

  // 初始值从 localStorage 读，刷新后保持登录
  const [businessToken, setBusinessToken] = useState<string | null>(() => readStoredToken())
  const [loginError, setLoginError] = useState<Error | null>(null)
  const [exchanging, setExchanging] = useState(false)

  // 取最新的 identityToken（Privy 可能在 Provider 挂载后异步刷出来）
  const identityTokenRef = useRef<string | null>(identityToken ?? null)
  useEffect(() => {
    identityTokenRef.current = identityToken ?? null
  }, [identityToken])

  /**
   * 把 Privy token 换成业务 JWT。幂等：内部用 exchanging 锁避免重复触发。
   */
  const exchangeJwt = useCallback(
    async (loginMethod: string | null, loginAccount: { type?: string; address?: string } | null) => {
      if (exchanging) return
      setExchanging(true)
      try {
        const accessToken = await privy.getAccessToken()
        const idToken = identityTokenRef.current
        if (!accessToken || !idToken) {
          throw new LoginError('privy_token_missing', 'Privy token 未就绪')
        }
        // 调试：DEV 下打印将发送给后端的 JWT aud/iss/exp，便于核对 App ID 是否一致
        if (import.meta.env.DEV) {
          const debugPayload = (tok: string, label: string) => {
            try {
              const part = tok.split('.')[1]
              const json = JSON.parse(
                atob(part.replace(/-/g, '+').replace(/_/g, '/')),
              )
              console.info(`[auth/privy] ${label} JWT payload:`, {
                aud: json.aud,
                iss: json.iss,
                sub: json.sub,
                exp: json.exp,
                expectedFrontendAppId: import.meta.env.VITE_PRIVY_APP_ID,
              })
            } catch {
              // ignore decode errors
            }
          }
          debugPayload(accessToken, 'access_token')
          debugPayload(idToken, 'identity_token')
        }
        // loginAccount?.type 主站实测为 'email' / 'wallet' 等；两种 fallback 都加
        const method =
          (loginAccount?.type as 'email' | 'wallet' | undefined) ??
          (loginMethod === 'email' ? 'email' : 'wallet')
        const jwt = await loginToBackend({
          method,
          access_token: accessToken,
          address: loginAccount?.address,
          identity_token: idToken,
          referral_code: null,
        })
        writeStoredToken(jwt)
        setBusinessToken(jwt)
        setLoginError(null)
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err))
        setLoginError(wrapped)
        // 对应主站 `10010012`（不在白名单）：直接清 Privy 会话，避免反复触发
        if (err instanceof LoginError && String(err.errno) === ERRNO_WHITELIST_FORBIDDEN) {
          await privyLogout().catch(() => undefined)
        } else {
          // 其它错误也清 Privy 会话，让用户能重试
          await privyLogout().catch(() => undefined)
        }
        clearStoredToken()
        setBusinessToken(null)
      } finally {
        setExchanging(false)
      }
    },
    [privy, privyLogout, exchanging],
  )

  useLogin({
    onComplete: async ({ loginMethod, loginAccount, wasAlreadyAuthenticated }) => {
      // wasAlreadyAuthenticated = true 且我们已有 jwt → 跳过换取
      if (wasAlreadyAuthenticated && readStoredToken()) return
      await exchangeJwt(loginMethod, loginAccount)
    },
    onError: err => {
       
      console.error('[auth/privy] useLogin onError:', err)
      setLoginError(new Error(String(err)))
    },
  })

  // 主动触发登录（RequireAuth 会调用）
  const login = useCallback(async () => {
    setLoginError(null)
    privy.login()
  }, [privy])

  // 登出：清业务 JWT + Privy 会话 + query 缓存
  const logout = useCallback(async () => {
    clearStoredToken()
    setBusinessToken(null)
    setLoginError(null)
    await privyLogout().catch(() => undefined)
    queryClient.clear()
  }, [privyLogout, queryClient])

  // 把 token getter 注册到 api/client
  const getAccessToken = useCallback(async () => businessToken, [businessToken])
  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
    return () => setAccessTokenGetter(null)
  }, [getAccessToken])

  // 订阅 401/errno=104 事件 → logout
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onUnauthorized = () => {
      void logout()
    }
    window.addEventListener('api:unauthorized', onUnauthorized)
    return () => window.removeEventListener('api:unauthorized', onUnauthorized)
  }, [logout])

  // 跨 tab 同步：某一 tab 登出后清其它 tab 的本地 state
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('tf.agent.token')) {
        setBusinessToken(readStoredToken())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const user = useMemo(
    () => mapPrivyUserToAuthUser(privy.user, !!businessToken),
    [privy.user, businessToken],
  )

  const value: AuthProviderIface & { loginError: Error | null } = useMemo(
    () => ({
      isAuthenticated: !!businessToken,
      // Privy SDK 未就绪或正在换取 JWT 都视为 loading
      isLoading: !privy.ready || exchanging,
      user,
      login,
      logout,
      getAccessToken,
      loginError,
    }),
    [businessToken, privy.ready, exchanging, user, login, logout, getAccessToken, loginError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Privy 真实 AuthProvider。接入后 main.tsx 用它替换 StubAuthProvider。
 */
export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  const appId = import.meta.env.VITE_PRIVY_APP_ID || DEFAULT_PRIVY_APP_ID
  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  )
}

export default PrivyAuthProvider
