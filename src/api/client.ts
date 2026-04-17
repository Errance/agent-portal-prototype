import { API_BASE, BIZ_PF } from './config'

/**
 * 主站风格的统一响应包。
 *
 * 注意：`errno` 在后端实现里**是字符串**（如 `'200'` 成功、`'104'` token 失效、
 * `'10010012'` 不在白名单）。历史 mock 用数字 0，`isApiSuccess` 做兼容判断。
 */
export interface ApiResponse<T> {
  errno: string | number
  msg?: string
  data: T
}

/** token 失效错误码（主站 surf-one 使用，代理后台待后端确认） */
const ERRNO_TOKEN_INVALID = '104'

function isApiSuccess(errno: unknown): boolean {
  // mock 用数字 0；真实后端用字符串 '200'；都算成功
  return errno === 0 || errno === '0' || errno === '200'
}

/**
 * 业务 JWT 注入钩子（Pre-Privy 准备）。
 * 实际 token 由 `src/auth/*Provider` 注册进来，`apiFetch` 不直接依赖 auth 实现，
 * 便于后续把 Stub 换成 Privy 版本。
 */
type TokenGetter = () => Promise<string | null>
let currentTokenGetter: TokenGetter | null = null

export function setAccessTokenGetter(getter: TokenGetter | null) {
  currentTokenGetter = getter
}

export class ApiError extends Error {
  constructor(
    public errno: string | number,
    message: string,
    public raw?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 错误对象归一化（审计 M7）。页面里 react-query 的 `error` 是 `unknown`，
 * 直接 `(q.error as Error).message` 存在真的不是 Error 的风险（比如字符串、object）。
 * 这个守卫：
 * - 是 ApiError / Error → 直接返回
 * - 是字符串 → 包成 Error
 * - 其它 → 返回兜底 Error
 */
export function toError(err: unknown, fallback = '未知错误'): Error {
  if (err instanceof Error) return err
  if (typeof err === 'string') return new Error(err)
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return new Error((err as { message: string }).message)
  }
  return new Error(fallback)
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'signal'> {
  body?: unknown
  signal?: AbortSignal
}

/** 派发 401/Token 失效事件。AuthProvider 订阅并触发登出。 */
function emitUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:unauthorized'))
  }
}

/**
 * 真实 fetch 封装（mock 开启时不会被调用）。统一：
 * - 拼 API_BASE
 * - JSON 化 body
 * - 注入 Authorization / biz-pf / LANG 等主站风格 header
 * - 解包 `ApiResponse<T>`，`isApiSuccess` 失败抛 `ApiError`
 * - HTTP 401 或 `errno === '104'` 都触发 `api:unauthorized` 事件
 */
export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, headers, method = 'GET', ...rest } = opts
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  // 业务 JWT 注入（若 AuthProvider 已注册 getter 则自动附带 Authorization header）
  let authHeader: Record<string, string> = {}
  if (currentTokenGetter) {
    try {
      const token = await currentTokenGetter()
      if (token) authHeader = { Authorization: `Bearer ${token}` }
    } catch {
      // token 获取失败不阻断请求：后端会按未登录处理
    }
  }

  const res = await fetch(url, {
    method,
    // 不带 cookie 凭证：认证走 Authorization: Bearer <JWT>，
    // 与主站 web/ 的 axios 默认行为一致。若后端未在 CORS 响应里
    // 设置 Access-Control-Allow-Credentials: true，也能直接跨域。
    credentials: 'omit',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      'biz-pf': BIZ_PF,
      LANG: 'zh-cn',
      ...authHeader,
      ...(headers as Record<string, string>),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    emitUnauthorized()
    throw new ApiError(401, '未登录或会话已过期')
  }

  let json: ApiResponse<T>
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(res.status, `响应解析失败 (${res.status})`)
  }

  if (!isApiSuccess(json.errno)) {
    // 主站错误码 '104' = token 失效（与 HTTP 401 等价处理）
    if (String(json.errno) === ERRNO_TOKEN_INVALID) emitUnauthorized()
    throw new ApiError(json.errno, json.msg || `请求失败 (errno=${json.errno})`, json)
  }
  return json.data
}
