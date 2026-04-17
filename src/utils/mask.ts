/**
 * 敏感字段脱敏工具（审计 H8）。
 *
 * 策略：列表默认掩码展示，详情抽屉 / hover / 复制按钮再给出完整值。
 * 所有函数对 null/undefined 容错，返回 '—' 占位符。
 */

const PLACEHOLDER = '—'

/**
 * UID 掩码：保留前 prefix 位、后 suffix 位，中间 * 填充。
 * 例：`UID100001` → `UID1****001`
 * 长度不足时返回原字符串。
 */
export function maskUid(uid: string | null | undefined, prefix = 4, suffix = 3): string {
  if (!uid) return PLACEHOLDER
  const s = String(uid)
  if (s.length <= prefix + suffix) return s
  const head = s.slice(0, prefix)
  const tail = s.slice(-suffix)
  return `${head}${'*'.repeat(Math.max(3, s.length - prefix - suffix))}${tail}`
}

/** 钱包地址掩码：保留 6 前 4 后，中间省略。 */
export function maskAddress(addr: string | null | undefined): string {
  if (!addr) return PLACEHOLDER
  const s = String(addr)
  if (s.length <= 10) return s
  return `${s.slice(0, 6)}...${s.slice(-4)}`
}

/** 邮箱掩码：用户名只保留首尾各 1 位。 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return PLACEHOLDER
  const s = String(email)
  const at = s.indexOf('@')
  if (at <= 0) return s
  const name = s.slice(0, at)
  const domain = s.slice(at)
  if (name.length <= 2) return `${name[0] ?? ''}*${domain}`
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name.slice(-1)}${domain}`
}

/** 昵称 / 备注通用掩码：超长时只显示前 8 字符加省略号。 */
export function truncateText(s: string | null | undefined, max = 20): string {
  if (!s) return PLACEHOLDER
  const str = String(s)
  if (str.length <= max) return str
  return `${str.slice(0, max)}…`
}
