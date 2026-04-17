/**
 * 时区与时间格式化（审计 H9 修复）。
 *
 * 全链路统一 Asia/Shanghai (UTC+8)：
 * - 后端如返回 UTC epoch / ISO → 用 fromServer 换算回 UTC+8 展示
 * - 前端生成时间戳（如 createdAt）→ 用 nowShanghai 产出 UTC+8 字符串
 * - mock 层目前用本地时间生成（开发机器通常就是 UTC+8 或 UTC），上线前应由后端下发 UTC epoch
 *
 * 依赖：dayjs utc + timezone 插件
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export const TZ = 'Asia/Shanghai'

/** 把服务器时间（epoch ms / epoch s / ISO 字符串）格式化为 UTC+8。 */
export function fromServer(input: number | string | Date, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  if (input === null || input === undefined || input === '') return '—'
  let d: dayjs.Dayjs
  if (typeof input === 'number') {
    // 粗略判定 epoch 精度：10 位 = 秒，13 位 = 毫秒
    d = dayjs(input > 1e12 ? input : input * 1000)
  } else {
    d = dayjs(input)
  }
  if (!d.isValid()) return '—'
  return d.tz(TZ).format(pattern)
}

/** 获取 UTC+8 的当前时间戳字符串。 */
export function nowShanghai(pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs().tz(TZ).format(pattern)
}

/** 获取 UTC+8 的今日日期（不含时间）。 */
export function todayShanghai(): string {
  return dayjs().tz(TZ).format('YYYY-MM-DD')
}

/** 获取 UTC+8 下 N 天前的 'YYYY-MM-DD'。 */
export function dateDaysAgoShanghai(days: number): string {
  return dayjs().tz(TZ).subtract(days, 'day').format('YYYY-MM-DD')
}
