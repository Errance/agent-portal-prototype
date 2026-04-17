/**
 * 认证抽象层类型定义。
 *
 * 目前由 `PrivyAuthProvider`（src/auth/privy.tsx）实现；业务组件只 consume
 * `useAuth()`，不依赖 Privy SDK 本身。更换认证方案时只要保持此接口。
 */

export interface AuthUser {
  /** 主站业务 uid（后端 /login 返回的业务 JWT 里的 `userId`） */
  userId: string
  /** 钱包地址（Privy wallet 登录时必有；email 登录时取 embedded Solana 钱包） */
  address?: string
  /** 邮箱（Privy email 登录时有） */
  email?: string
  /** Privy DID；Privy 模式下存在 */
  privyId?: string
}

export interface AuthProvider {
  /** 是否已认证（已拿到后端业务 JWT） */
  isAuthenticated: boolean
  /** Privy SDK 初始化中 / token 校验中 */
  isLoading: boolean
  user: AuthUser | null
  /** 触发登录弹窗 / 重定向，调用方无需关心是 Privy modal 还是其它 */
  login: () => Promise<void>
  /** 登出 + 清 token + 清 query 缓存由实现内部完成 */
  logout: () => Promise<void>
  /**
   * 同步/异步获取当前业务 JWT。apiFetch 在每次请求前调用，用于注入 Authorization。
   * 未认证返回 null（apiFetch 不加 Authorization header）。
   */
  getAccessToken: () => Promise<string | null>
}
