/**
 * 业务 JWT + 钱包地址本地存储（localStorage）。
 *
 * 设计原则（审计 A3）：对外只暴露一个 "AuthStoredState" 快照 API，内部仍
 * 使用两个 key 分别存（便于人工调试和跨 tab storage 事件定位），外层消费方
 * 不需要关心底层 key 布局。
 *
 * 已知风险（审计 S4）：业务 JWT 存 localStorage 暴露在 XSS 攻击面下。
 * 主站 surf-one 同方案，本轮沿用；缓解：
 * - `readStoredAuthState` 做三段式 + `exp` 过滤，清理历史坏值 / 过期 token
 * - `writeStoredAuthState` 拒绝写入非 JWT 格式的值
 *
 * 所有 storage 访问 try/catch：Safari 隐私模式 / 存储配额满等场景不抛异常。
 */

import { isTokenExpired } from './jwt'

const TOKEN_KEY = 'tf.agent.token'
const ADDRESS_KEY = 'tf.agent.address'

/** 本文件涉及的所有 localStorage key 前缀——跨 tab 同步判定用。 */
export const AUTH_STORAGE_PREFIX = 'tf.agent.'

/** 读取到的 auth 快照。`null` 字段表示未登录 / 缺失。 */
export interface AuthStoredState {
  token: string | null
  address: string | null
}

/**
 * JWT 结构快速校验：HS256 JWT 是 `header.payload.signature` 三段 base64url。
 * 防御历史上因 `loginApi` 把 response.data（对象）当字符串写进来造成的垃圾值，
 * 避免刷新后第一轮请求用坏 token 空转一圈。
 */
function looksLikeJwt(s: string | null): boolean {
  if (!s) return false
  const parts = s.split('.')
  if (parts.length !== 3) return false
  return parts.every(p => p.length > 0)
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * 读取当前 auth 快照。自带自愈：
 * - token 不是三段式 / 已过期 → 顺带清掉，返回 null
 * - address 长度为 0 → 视为 null
 */
export function readStoredAuthState(): AuthStoredState {
  const rawToken = safeGetItem(TOKEN_KEY)
  let token: string | null = null
  if (rawToken) {
    if (!looksLikeJwt(rawToken) || isTokenExpired(rawToken)) {
      // 坏值或过期：清掉，避免污染下一次读
      safeRemoveItem(TOKEN_KEY)
    } else {
      token = rawToken
    }
  }
  const rawAddr = safeGetItem(ADDRESS_KEY)
  const address = rawAddr && rawAddr.length > 0 ? rawAddr : null
  return { token, address }
}

/**
 * 写入 auth 快照。参数里字段为 `undefined` 表示"不动"，`null` 表示"清掉"，
 * 具体值表示"写入"。token 会做 JWT 格式校验，非 JWT 直接忽略。
 */
export function writeStoredAuthState(patch: {
  token?: string | null
  address?: string | null
}): void {
  if (patch.token !== undefined) {
    if (patch.token === null) {
      safeRemoveItem(TOKEN_KEY)
    } else if (looksLikeJwt(patch.token)) {
      safeSetItem(TOKEN_KEY, patch.token)
    }
  }
  if (patch.address !== undefined) {
    if (patch.address === null || patch.address.length === 0) {
      safeRemoveItem(ADDRESS_KEY)
    } else {
      safeSetItem(ADDRESS_KEY, patch.address)
    }
  }
}

/** 清空 auth 快照（主动 logout / 被动失效统一用这个）。 */
export function clearStoredAuthState(): void {
  safeRemoveItem(TOKEN_KEY)
  safeRemoveItem(ADDRESS_KEY)
}

/* ========== 兼容薄层（保留旧名字，内部转发到快照 API） ========== */

/** @deprecated 请使用 `readStoredAuthState().token` */
export function readStoredToken(): string | null {
  return readStoredAuthState().token
}

/** @deprecated 请使用 `writeStoredAuthState({ token })` */
export function writeStoredToken(token: string): void {
  writeStoredAuthState({ token })
}

/** @deprecated 请使用 `writeStoredAuthState({ token: null })` */
export function clearStoredToken(): void {
  writeStoredAuthState({ token: null })
}

/** @deprecated 请使用 `readStoredAuthState().address` */
export function readStoredAddress(): string | null {
  return readStoredAuthState().address
}

/** @deprecated 请使用 `writeStoredAuthState({ address })` */
export function writeStoredAddress(address: string): void {
  writeStoredAuthState({ address })
}

/** @deprecated 请使用 `writeStoredAuthState({ address: null })` */
export function clearStoredAddress(): void {
  writeStoredAuthState({ address: null })
}

/** 旧 API 兼容：导出 token key 便于 storage 事件过滤，新代码用 `AUTH_STORAGE_PREFIX`。 */
export const STORED_TOKEN_KEY = TOKEN_KEY

/**
 * storage 事件过滤：判断一条 `StorageEvent` 是否影响当前 auth 快照。
 * 新代码推荐用这个判定，取代以前"硬匹配 tf.agent.token / tf.agent.address 两条规则"。
 */
export function isAuthStorageEvent(e: StorageEvent): boolean {
  return !!e.key && e.key.startsWith(AUTH_STORAGE_PREFIX)
}
