/**
 * 把后端返回的错误 / 提示文本做一层"面向终端用户"的脱敏处理（审计 S3）。
 *
 * 后端 msg 理论上不会放敏感信息，但历史上确实出现过：
 * - 打 goroutine 堆栈 / 文件绝对路径
 * - 打内网 IP / host
 * - 打数据库错误原文（含字段名、SQL 片段）
 * - 过长的二进制 / JSON dump
 *
 * 前端不做 trust boundary 的最后一道防线不合理，但作为"万一出了就别给用户"的
 * 缓解层还是有价值。React 已经自动 HTML 转义，所以这里**不**解决 XSS；只
 * 解决"别把内部细节直接展示给最终用户"。
 *
 * 规则：
 * 1. 非字符串 → '请求异常'
 * 2. 截短到 maxLen（默认 200）
 * 3. 去掉看起来像堆栈 / 内部路径的片段（v8 at 行、POSIX 绝对路径、Windows 绝对路径）
 * 4. 去掉看起来是 IP / 端口的片段（1.2.3.4:9999）
 * 5. 折叠连续空白
 */

const DEFAULT_MAX_LEN = 200

const STACK_PATTERNS = [
  /\s*at\s+[^\s]+:\d+:\d+/g, // node / v8 stack line
  /\([^)]{0,80}:\d+:\d+\)/g, // (file:line:col)
  /\/(?:home|root|var|usr|opt|tmp)\/[^\s]+/g, // POSIX 内部路径
  /[A-Z]:\\(?:[^\s\\]+\\)+[^\s]+/g, // Windows 绝对路径
]

const IP_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?\b/g

export function sanitizeBackendMsg(
  msg: unknown,
  { maxLen = DEFAULT_MAX_LEN }: { maxLen?: number } = {},
): string {
  if (typeof msg !== 'string' || msg.length === 0) return '请求异常'
  let out = msg
  for (const p of STACK_PATTERNS) {
    out = out.replace(p, ' [redacted]')
  }
  out = out.replace(IP_PATTERN, '[ip]')
  out = out.replace(/\s+/g, ' ').trim()
  if (out.length > maxLen) {
    out = `${out.slice(0, maxLen - 1)}…`
  }
  return out || '请求异常'
}
