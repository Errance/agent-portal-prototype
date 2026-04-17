/**
 * 业务 JWT（HS256，后端 /login 签发）的轻量解码。
 *
 * 只读 payload，不校验签名——签名校验是后端中间件的事，前端只用这里的
 * 字段做 UI 展示（比如 `userId` 做"您好"标题、过期时间做可选的本地过期
 * 提示）。
 *
 * 示例 payload（sit 实测 2026-04-17）：
 * ```json
 * {
 *   "exp": 1779039163,
 *   "jwtId": "907ee0c0-9c58-4339-b1ab-f80cb22ba9ab",
 *   "origIat": 1776447163,
 *   "tkValSta": true,
 *   "userId": "513519754410144768",
 *   "userLastLoginAt": "2026-04-17T17:32:43.261215557Z",
 *   "userRoleType": "0"
 * }
 * ```
 */

export interface BusinessJwtPayload {
  userId?: string
  userRoleType?: string
  exp?: number
  origIat?: number
  tkValSta?: boolean
  userLastLoginAt?: string
  jwtId?: string
}

function base64UrlDecode(s: string): string {
  // base64url → base64：替换字符 + 补齐 padding
  const pad = (s + '==='.slice((s.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return atob(pad)
}

export function decodeBusinessJwt(token: string | null | undefined): BusinessJwtPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const json = base64UrlDecode(parts[1])
    const payload = JSON.parse(json) as BusinessJwtPayload
    return payload
  } catch {
    return null
  }
}

/**
 * JWT 是否过期。`skewSec` 默认允许 30s 时钟偏差，避免刚签发的 token 因本地
 * 时钟慢几秒被误判过期。
 *
 * - payload 缺失或 `exp` 不是数字时返回 `false`（无 exp 视为不过期，和服务端判断一致）
 * - 当前时间（秒）>= `exp - skewSec` 视为过期
 *
 * 通过 storage.readStoredToken 被动消费：读 localStorage 时若 token 已过期
 * 直接清掉 + 返回 null，避免拿过期 token 去业务 API 打一圈 401 再登出。
 */
export function isJwtExpired(
  payload: BusinessJwtPayload | null | undefined,
  skewSec = 30,
): boolean {
  if (!payload || typeof payload.exp !== 'number') return false
  const now = Math.floor(Date.now() / 1000)
  return now >= payload.exp - skewSec
}

/** 从 raw token 直接判断是否过期。解码失败视为过期（坏数据直接清）。 */
export function isTokenExpired(token: string | null | undefined, skewSec = 30): boolean {
  if (!token) return true
  const payload = decodeBusinessJwt(token)
  if (!payload) return true
  return isJwtExpired(payload, skewSec)
}
