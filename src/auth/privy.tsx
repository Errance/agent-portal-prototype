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
import { emitAuthToast } from './authEvents'
import { decodeBusinessJwt } from './jwt'
import { loginToBackend, LoginError, ERRNO_WHITELIST_FORBIDDEN } from './loginApi'
import { privyConfig, resolvePrivyAppId } from './privyConfig'
import { useAuthStorage } from './useAuthStorage'
import { useAuthUnauthorizedListener } from './useAuthEvents'
import type { AuthProvider as AuthProviderIface, AuthUser } from './types'
import { setAccessTokenGetter, type ApiUnauthorizedDetail } from '@/api/client'
import { sanitizeBackendMsg } from '@/utils/sanitize'

/**
 * Privy AuthProvider 实现（实现 `AuthProvider` 接口）。
 *
 * 职责分层：
 * - `PrivyAuthProvider` —— 挂 `<PrivyProvider>` SDK + `<PrivyAuthBridge>`
 * - `PrivyAuthBridge` —— 用以下三个 hook 组装 AuthContext：
 *   - `useAuthStorage`（src/auth/useAuthStorage.ts）: 管 localStorage + cross-tab
 *   - `useAuthUnauthorizedListener`（src/auth/useAuthEvents.ts）: 监听 `api:unauthorized`
 *   - 本文件内的 `usePrivyExchange`: Privy token → 业务 JWT 换取 + auto-exchange
 *
 * 流程（见 docs/BACKEND_PENDING_INTERFACES.md §1）：
 * 1. RequireAuth / UI → `auth.login()` → 打开 Privy modal
 * 2. Privy 登录成功 → `useLogin.onComplete` → exchangeJwt
 * 3. `/login` 换取业务 JWT → persist(token + address)
 * 4. 业务 API 通过 `setAccessTokenGetter` 注入 Bearer
 * 5. HTTP 401 / errno=104 → `api:unauthorized` → 被动登出 + toast
 */

/* ========== helpers ========== */

function pickPrivyAddress(user: User | null | undefined): string | undefined {
  if (!user) return undefined
  if (user.wallet?.address) return user.wallet.address
  const linked = (user as unknown as { linkedAccounts?: Array<Record<string, unknown>> })
    .linkedAccounts
  if (Array.isArray(linked)) {
    for (const acc of linked) {
      const addr = acc?.address
      if (typeof addr === 'string' && addr.length > 0) return addr
    }
  }
  return undefined
}

function mapPrivyUserToAuthUser(
  user: User | null,
  hasJwt: boolean,
  businessUserId?: string,
  cachedAddress?: string | null,
): AuthUser | null {
  // 有业务 JWT 就认作已登录；Privy SDK 的 `user` 对象可能在初次加载 /
  // hot-reload / StrictMode 下稍晚 hydrate，此时只要有 JWT 里的 userId
  // 就足以构造一个"最小 AuthUser"，避免 UI 退回到 '代理商' 兜底。
  if (!hasJwt) return null
  const id = businessUserId || user?.id
  if (!id) return null
  return {
    userId: id,
    // 地址优先级：Privy user hydrated 的实时值 > 登录时缓存的地址 > undefined
    address: pickPrivyAddress(user) ?? cachedAddress ?? undefined,
    email: user?.email?.address,
    privyId: user?.id,
  }
}

/**
 * DEV-only JWT 调试日志（S1 脱敏）：
 * - 不打印完整 `sub`（Privy DID）和 `aud`（App ID 前缀保留 8 位识别即可）
 * - `exp` 换算成"距现在秒数"，便于判断是否即将过期
 * - 只在 DEV 构建生效；prod 构建 Vite 会把 DEV 分支整块删掉
 */
function debugLogPrivyJwt(token: string, label: string): void {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      aud?: string
      iss?: string
      sub?: string
      exp?: number
    }
    const now = Math.floor(Date.now() / 1000)
    console.info(`[auth/privy] ${label}`, {
      iss: payload.iss,
      audPrefix: payload.aud?.slice(0, 8),
      subSuffix: payload.sub?.slice(-8),
      expInSec: payload.exp ? payload.exp - now : undefined,
    })
  } catch {
    // ignore decode errors
  }
}

function debugLogBusinessJwt(
  payload: ReturnType<typeof decodeBusinessJwt> | null | undefined,
): void {
  if (!payload) return
  const now = Math.floor(Date.now() / 1000)
  console.info('[auth/privy] business JWT', {
    userIdSuffix: payload.userId?.slice(-4),
    userRoleType: payload.userRoleType,
    expInSec: payload.exp ? payload.exp - now : undefined,
    tkValSta: payload.tkValSta,
  })
}

/* ========== usePrivyExchange (local hook) ========== */

interface UsePrivyExchangeOptions {
  /** 当前是否已经有有效 JWT；true 时 auto-exchange 跳过 */
  hasToken: boolean
  /** 换取成功，写入 token + address */
  onExchanged: (params: { token: string; address: string }) => void
  /** 换取失败 */
  onExchangeError: (error: Error) => void
}

/**
 * Privy 登录入口 + /login 换取 hook。
 *
 * 封装 Privy SDK 的 `usePrivy/useLogin/useLogout/useIdentityToken`，对外暴露：
 * - `login()`：打开 Privy modal（或直接触发 cached session 的登录流）
 * - `logout()`：清 Privy 会话
 * - `isExchanging`：/login 进行中
 * - `isPrivyReady` / `isPrivyAuthed`：透传 SDK 状态
 *
 * 注意：此 hook 只能在 `<PrivyProvider>` 树内调用。
 */
function usePrivyExchange(options: UsePrivyExchangeOptions) {
  const { hasToken, onExchanged, onExchangeError } = options
  const privy = usePrivy()
  const { logout: privyLogout } = useLogout()
  const { identityToken } = useIdentityToken()

  const [isExchanging, setIsExchanging] = useState(false)
  const [lastError, setLastError] = useState<Error | null>(null)
  // justLoggedOut：用户"主动登出"后的 sticky flag，阻断 auto-exchange，防止
  // `/sessions/logout` CORS 失败 (privy.authenticated 残留 true) 时后续 render
  // 立刻 re-exchange 导致"登出无效"的体验。下一次用户显式 `login()` 时重置。
  const [justLoggedOut, setJustLoggedOut] = useState(false)

  const identityTokenRef = useRef<string | null>(identityToken ?? null)
  useEffect(() => {
    identityTokenRef.current = identityToken ?? null
  }, [identityToken])

  // 用 ref 存回调，避免回调引用变化重建 exchangeJwt
  const onExchangedRef = useRef(onExchanged)
  const onExchangeErrorRef = useRef(onExchangeError)
  useEffect(() => {
    onExchangedRef.current = onExchanged
    onExchangeErrorRef.current = onExchangeError
  }, [onExchanged, onExchangeError])

  const exchangeJwt = useCallback(
    async (
      loginMethod: string | null,
      loginAccount: { type?: string; address?: string } | null,
    ) => {
      if (isExchanging) return
      setIsExchanging(true)
      try {
        const accessToken = await privy.getAccessToken()
        const idToken = identityTokenRef.current
        if (!accessToken || !idToken) {
          throw new LoginError('privy_token_missing', 'Privy token 未就绪')
        }
        if (import.meta.env.DEV) {
          debugLogPrivyJwt(accessToken, 'access_token')
          debugLogPrivyJwt(idToken, 'identity_token')
        }
        const method =
          (loginAccount?.type as 'email' | 'wallet' | undefined) ??
          (loginMethod === 'email' ? 'email' : 'wallet')
        const address = loginAccount?.address ?? pickPrivyAddress(privy.user)
        if (!address) {
          throw new LoginError(
            'privy_address_missing',
            '无法从 Privy 账户解析钱包地址；若使用邮箱登录请检查 embeddedWallets 配置',
          )
        }
        const jwt = await loginToBackend({
          method,
          access_token: accessToken,
          address,
          identity_token: idToken,
          referral_code: null,
        })
        setLastError(null)
        onExchangedRef.current({ token: jwt, address })
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err))
        setLastError(wrapped)
        // 白名单拒绝 → 清 Privy 会话（永久失败），避免反复自动重试。
        // 其它错误保留 Privy 会话让用户主动点"重新登录"。
        if (err instanceof LoginError && String(err.errno) === ERRNO_WHITELIST_FORBIDDEN) {
          await privyLogout().catch(() => undefined)
        }
        onExchangeErrorRef.current(wrapped)
      } finally {
        setIsExchanging(false)
      }
    },
    [privy, privyLogout, isExchanging],
  )

  useLogin({
    onComplete: async ({ loginMethod, loginAccount, wasAlreadyAuthenticated }) => {
      // Privy cached session 恢复且我们已经有 JWT → 跳过换取
      if (wasAlreadyAuthenticated && hasToken) return
      await exchangeJwt(loginMethod, loginAccount)
    },
    onError: err => {
      const message = typeof err === 'string' ? err : (err as Error)?.message || 'Privy 登录出错'
      // `exited_auth_flow` = 用户主动关闭 Privy modal，不是真正的错误；
      // 直接忽略（不打 toast、不置 lastError），让用户点击背景页任意位置
      // 即可重新唤起 modal（见 RequireAuth onClick）。
      if (message === 'exited_auth_flow') {
        console.info('[auth/privy] user closed Privy modal before completion')
        return
      }
      console.error('[auth/privy] useLogin onError:', err)
      const wrapped = new Error(message)
      setLastError(wrapped)
      onExchangeErrorRef.current(wrapped)
    },
  })

  // 页面刷新 / 跨 tab：Privy SDK 缓存 session 恢复 `privy.authenticated = true`
  // 但本地 `token` 可能已过期或被清掉。onComplete 只在"新一次登录"时触发，
  // 缓存 session 恢复**不会**触发。auto-exchange 监听这个状态差兜底。
  // 防循环：失败后 `lastError` 被置位，effect 跳出；用户通过 RequireAuth / toast
  // 显式重试（logout → login）才会清除 lastError。
  const autoExchangeRef = useRef(false)
  useEffect(() => {
    if (!privy.ready) return
    if (!privy.authenticated) {
      autoExchangeRef.current = false
      return
    }
    if (hasToken) return
    if (isExchanging) return
    if (lastError) return
    // justLoggedOut：用户刚手动登出，`/sessions/logout` 失败时 privy.authenticated
    // 可能仍为 true；此处必须跳过，否则会立即 re-exchange 登回同一账号。
    // 用户显式点 login() 时 `justLoggedOut` 置 false 才会再次触发。
    if (justLoggedOut) return
    if (autoExchangeRef.current) return
    autoExchangeRef.current = true
    const wallet = privy.user?.wallet
    void exchangeJwt(
      wallet ? 'wallet' : 'email',
      wallet ? { type: 'wallet', address: wallet.address } : null,
    ).finally(() => {
      autoExchangeRef.current = false
    })
  }, [
    privy.ready,
    privy.authenticated,
    privy.user,
    hasToken,
    isExchanging,
    lastError,
    justLoggedOut,
    exchangeJwt,
  ])

  const openLoginModal = useCallback(() => {
    setLastError(null)
    // 用户显式 login：解除 logout sticky 锁，让 auto-exchange 重新放行
    setJustLoggedOut(false)
    // 若 Privy session 还活着（CORS logout 失败时常见），privy.login() 会打
    // "already logged in" 的 warning 但不会弹 modal。此时直接 return 让
    // auto-exchange effect 自动拿新 JWT 登回去——不然用户点 login 什么都不发生。
    if (privy.authenticated) return
    privy.login()
  }, [privy])

  const resetPrivySession = useCallback(async () => {
    setLastError(null)
    // 登出后阻断 auto-exchange：即使 privy.authenticated 仍为 true，也不要
    // 立刻 re-exchange 把用户拉回来。下一次用户显式 login() 时解除。
    setJustLoggedOut(true)
    await privyLogout().catch(() => undefined)
    // 兜底：Privy 的 `/sessions/logout` 在 dev / 特定配置下会 CORS 400，
    // 导致 SDK 本地状态 `privy.authenticated` 残留为 true，下次 `privy.login()`
    // 直接报 "already logged in" 不会弹 modal。手动清掉 Privy 写入的 localStorage
    // key（`privy:*`），让 SDK 下次自举时失去 session 依据、正常弹 modal。
    // 注意：这不保证内存中 `privy.authenticated` 同步变 false，但至少在下次
    // 页面刷新 / SDK 再初始化时会生效；配合我们的 `openLoginModal` 对
    // `privy.authenticated=true` 的兼容处理，实际效果覆盖 99%。
    try {
      if (typeof window !== 'undefined') {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const key = window.localStorage.key(i)
          if (key && key.startsWith('privy:')) window.localStorage.removeItem(key)
        }
      }
    } catch {
      // ignore storage errors (Safari 隐私模式等)
    }
  }, [privyLogout])

  return {
    openLoginModal,
    resetPrivySession,
    isExchanging,
    isPrivyReady: privy.ready,
    privyUser: privy.user,
  }
}

/* ========== PrivyAuthBridge ========== */

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { snapshot, persist, clear } = useAuthStorage()

  // retryLogin 需要在 exchange hook 设置之前定义——但它又需要 exchange 的 logout，
  // 所以用 ref 绕一圈 forward-declare：hook 内部先定义 callback，
  // 在 exchange hook 初始化之后再把 ref 填好。
  const retryRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const onExchanged = useCallback(
    ({ token, address }: { token: string; address: string }) => {
      persist({ token, address })
    },
    [persist],
  )

  const onExchangeError = useCallback(
    (err: Error) => {
      // 换取失败：清 local 快照（保持 react state ↔ storage 一致），
      // toast 把具体错误告诉用户，附"重新登录"按钮
      persist({ token: null, address: null })
      emitAuthToast({
        kind: 'error',
        message: `登录失败：${sanitizeBackendMsg(err.message)}`,
        action: { label: '重新登录', onClick: () => retryRef.current() },
      })
    },
    [persist],
  )

  const { openLoginModal, resetPrivySession, isExchanging, isPrivyReady, privyUser } =
    usePrivyExchange({
      hasToken: !!snapshot.token,
      onExchanged,
      onExchangeError,
    })

  const login = useCallback(async () => {
    openLoginModal()
  }, [openLoginModal])

  const logout = useCallback(async () => {
    clear()
    await resetPrivySession()
    queryClient.clear()
  }, [clear, resetPrivySession, queryClient])

  // 填充 retryRef（toast action 要用）。useEffect 避免渲染时直接赋值。
  useEffect(() => {
    retryRef.current = async () => {
      await logout()
      void login()
    }
  }, [login, logout])

  // 被动失效：业务 API 带着 Bearer 依然拿到 401 / errno=104
  const handlePassiveUnauthorized = useCallback(
    (detail: ApiUnauthorizedDetail) => {
      clear()
      queryClient.clear()
      // kind 当前仅 http_401 / token_invalid 两种，都按"会话失效"处理。
      // 未来后端加 account_frozen 之类时，这里按 kind 分支（比如跳 /not-agent）。
      const parts: string[] = [
        detail.kind === 'token_invalid' ? '登录已失效（token 无效）。' : '登录已失效（HTTP 401）。',
      ]
      if (detail.path) parts.push(`接口：${detail.path}`)
      if (detail.errno !== undefined) parts.push(`errno=${detail.errno}`)
      if (detail.msg) parts.push(`msg=${sanitizeBackendMsg(detail.msg)}`)
      emitAuthToast({
        kind: 'error',
        message: parts.join(' '),
        action: { label: '重新登录', onClick: () => retryRef.current() },
        autoDismissMs: 0, // 不自动消失，等待用户处理
      })
    },
    [clear, queryClient],
  )
  useAuthUnauthorizedListener(handlePassiveUnauthorized)

  // 业务 JWT → AuthUser
  const businessUserId = useMemo(() => {
    const payload = decodeBusinessJwt(snapshot.token)
    if (import.meta.env.DEV && snapshot.token) {
      debugLogBusinessJwt(payload)
    }
    return payload?.userId
  }, [snapshot.token])

  const user = useMemo(
    () =>
      mapPrivyUserToAuthUser(privyUser, !!snapshot.token, businessUserId, snapshot.address),
    [privyUser, snapshot.token, snapshot.address, businessUserId],
  )

  // Bearer 注入：注册 token getter 到 apiFetch
  const getAccessToken = useCallback(async () => snapshot.token, [snapshot.token])
  useEffect(() => {
    setAccessTokenGetter(getAccessToken)
    return () => setAccessTokenGetter(null)
  }, [getAccessToken])

  const value: AuthProviderIface = useMemo(
    () => ({
      isAuthenticated: !!snapshot.token,
      isLoading: !isPrivyReady || isExchanging,
      user,
      login,
      logout,
      getAccessToken,
    }),
    [snapshot.token, isPrivyReady, isExchanging, user, login, logout, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ========== PrivyAuthProvider ========== */

/**
 * Privy 真实 AuthProvider（唯一 AuthProvider 实现，在 main.tsx 挂根）。
 */
export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  const appId = resolvePrivyAppId()
  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  )
}

export default PrivyAuthProvider
