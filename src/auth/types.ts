/**
 * 认证抽象层类型定义（Privy 接入前铺路）。
 *
 * 当前只有 StubAuthProvider 一个实现；Privy 接入时新增 `src/auth/privy.tsx`
 * 实现相同的 AuthProvider 接口，`main.tsx` 换 Provider 即可，业务层零感知。
 */

export interface AuthUser {
  /** 主站业务 uid（后端 /login 返回） */
  userId: string
  /** 钱包地址（Privy wallet 登录时必有） */
  address?: string
  /** 邮箱（Privy email 登录时有） */
  email?: string
  /** Privy 内部用户 id；Privy 模式下存在，stub 模式下为 undefined */
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
