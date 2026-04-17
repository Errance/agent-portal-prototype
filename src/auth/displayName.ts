import type { AuthUser } from './types'
import { maskAddress, maskEmail, maskUid } from '@/utils/mask'

/**
 * 统一的"登录身份展示文本"算法（审计 F2）。
 *
 * 优先级：
 * 1. 邮箱（mask）—— Privy 邮箱登录用户
 * 2. 钱包地址（mask）—— Privy 钱包登录 / 邮箱用户的 embedded Solana 钱包
 * 3. 业务 userId（mask）—— 后端 `/login` 返回的业务 uid（JWT payload）
 * 4. 兜底字符串 `'代理商'`
 *
 * 以前 Dashboard / UserMenu / NotAgent 各写了一套优先级（Dashboard 有 userId
 * fallback，另外两处没有），容易出现同一用户在不同页面显示不同身份标签。
 * 现在统一走这个函数。
 */
export function getAuthDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return '代理商'
  if (user.email) return maskEmail(user.email)
  if (user.address) return maskAddress(user.address)
  if (user.userId) return maskUid(user.userId)
  return '代理商'
}

/**
 * 当用户身份可以被"完整文本复制"时（邮箱 / 地址），返回那段完整文本；
 * 仅通过 userId 兜底展示时返回 null（userId 不适合复制给第三方使用）。
 *
 * 用在 UserMenu / Dashboard 的"复制"按钮：只有真正有值可复制才显示按钮。
 */
export function getAuthCopyableIdentity(
  user: AuthUser | null | undefined,
): { label: string; value: string } | null {
  if (!user) return null
  if (user.address) return { label: '钱包地址', value: user.address }
  if (user.email) return { label: '邮箱', value: user.email }
  return null
}
