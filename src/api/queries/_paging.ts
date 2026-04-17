/**
 * 后端列表接口的响应外壳。
 *
 * 后端 GET /agent/* 的列表类返回（见 docs/AGENT_PORTAL_FRONTEND_API.md §1.3）：
 *   ApiResponse<T> = { errno, msg, data: {
 *     count, page_count, page_num, page_size,
 *     data: TRow[],
 *     summary?: TSummary,
 *   } }
 *
 * 本文件提供：
 * - RawPagedResponse<TRow, TSummary>：后端列表响应的 snake_case 结构（`apiFetch` 解包 ApiResponse 后拿到的就是它）
 * - PagedMeta：前端侧的分页元信息（camelCase）
 * - PagedResult<TRow, TSummary>：前端 hooks 对外暴露的结构（rows / meta / summary）
 * - mapPagedMeta：snake → camel 的 meta 转换
 *
 * 本轮客户端分页保留（page_size=200 一次拿齐），`pageNum` 字段主要用于调试。
 */

export interface RawPagedResponse<TRow, TSummary = undefined> {
  count: number
  page_count: number
  page_num: number
  page_size: number
  data: TRow[]
  summary?: TSummary
}

export interface PagedMeta {
  count: number
  pageCount: number
  pageNum: number
  pageSize: number
}

export interface PagedResult<TRow, TSummary = undefined> {
  rows: TRow[]
  meta: PagedMeta
  summary?: TSummary
}

/** 默认 page_size：一次拿到前端，UI 继续用 DataTable 客户端分页。 */
export const DEFAULT_PAGE_SIZE = 200

export function mapPagedMeta(raw: {
  count: number
  page_count: number
  page_num: number
  page_size: number
}): PagedMeta {
  return {
    count: raw.count,
    pageCount: raw.page_count,
    pageNum: raw.page_num,
    pageSize: raw.page_size,
  }
}

/**
 * 根据前端传入的 filter 对象构造 query string 片段。
 * - 值为 undefined / null / 'all' / '' 的键直接忽略
 * - 其余值 String() 转串放入
 * - 始终附带 page_num / page_size
 *
 * 返回形如 `page_num=1&page_size=200&from=2026-04-01` 的字符串（不含前缀 ?）。
 */
export function buildListQuery(
  filters: object = {},
  pageNum = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): string {
  const params = new URLSearchParams()
  params.set('page_num', String(pageNum))
  params.set('page_size', String(pageSize))
  for (const [k, v] of Object.entries(filters as Record<string, unknown>)) {
    if (v === undefined || v === null) continue
    const s = String(v)
    if (s === '' || s === 'all') continue
    params.set(k, s)
  }
  return params.toString()
}
