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
 * 业务 JWT 注入钩子。实际 token 由 `src/auth/*Provider` 注册进来，`apiFetch`
 * 不直接依赖 auth 实现，便于 hook 拆分 / 单测。
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

/* ========== 底层 fetch 层（rawFetch） ========== */

export interface RawFetchOptions {
  method?: string
  /** 任意对象（JSON.stringify）或 string 原样发出；`undefined` / `null` 表示无 body */
  body?: unknown
  /** 自定义 header；会覆盖默认 Content-Type / biz-pf / LANG（同名时） */
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface RawFetchResult<T = unknown> {
  status: number
  ok: boolean
  /** JSON 解析结果；无 body 或非 JSON 时为 null */
  json: T | null
}

/**
 * 低层 HTTP 调用统一层（审计 A1）。
 *
 * 职责：
 * - 拼 `API_BASE`（`path` 以 `http` 开头的绝对地址原样）
 * - 默认 header：`Content-Type` / `biz-pf` / `LANG`，由 caller header 覆盖
 * - `credentials: 'omit'`（主站风格；业务鉴权通过 Authorization 头，不走 cookie）
 * - body 自动 `JSON.stringify`（string 原样，undefined / null 跳过）
 * - 返回 `{ status, ok, json }`；不做业务语义（不 emit 事件、不抛 ApiError）
 *
 * **不接受 Bearer 注入**——业务 API 的 `Authorization` 由 `apiFetch` 负责；
 * `/login` 的 JSON 字符串 `Authorization` 由 `loginApi.ts` 自己拼。这样
 * rawFetch 只管"正确发出一个 HTTP 请求并拿到 JSON 响应"，不承担认证语义。
 */
export async function rawFetch<T = unknown>(
  path: string,
  opts: RawFetchOptions = {},
): Promise<RawFetchResult<T>> {
  const { method = 'GET', body, headers, signal } = opts
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'biz-pf': BIZ_PF,
    LANG: 'zh-cn',
    ...headers,
  }

  let serializedBody: string | undefined
  if (body !== undefined && body !== null) {
    serializedBody = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const res = await fetch(url, {
    method,
    credentials: 'omit',
    headers: mergedHeaders,
    body: serializedBody,
    signal,
  })

  let json: T | null = null
  try {
    // 某些 204 / 空 body 的接口 `res.json()` 会抛，正常情况下这里返回 null
    json = (await res.json()) as T
  } catch {
    json = null
  }

  return { status: res.status, ok: res.ok, json }
}

/* ========== 业务 API 层（apiFetch） ========== */

export interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /**
   * 静默 401 / errno=104：出错时照常抛 `ApiError`，但**不触发**全局 `api:unauthorized`
   * 事件（即不会联动登出）。用于"失败可降级"的辅助请求，如 `/agent/profile`——
   * 就算拿不到，UI 也能 fallback 到 mock，不应该因此把整个会话清了。
   */
  skipAuthEmit?: boolean
}

/**
 * 未授权事件的"语义分类"，用于 AuthProvider 决定后续动作：
 * - `http_401`：HTTP 状态 401（极少见；网关层面拒绝）
 * - `token_invalid`：业务响应 `errno='104'`（主站 token 失效）
 * - `future: account_frozen` / `permission_denied` 等 —— 预留给后端 errno 表扩展
 *
 * 前端默认都当作"会话失效 → 清 token → 提示用户重登"；有新 kind 时 AuthBridge
 * 内部可按 kind 做分支（比如"账号冻结"时跳 /not-agent 而不是重弹 modal）。
 */
export type ApiUnauthorizedKind = 'http_401' | 'token_invalid'

export interface ApiUnauthorizedDetail {
  kind: ApiUnauthorizedKind
  errno?: string | number
  msg?: string
  path?: string
}

/** 派发 401/Token 失效事件。AuthProvider 订阅并触发登出。 */
function emitUnauthorized(detail: ApiUnauthorizedDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:unauthorized', { detail }))
  }
}

/**
 * 业务 API 封装。在 rawFetch 之上加：
 * - 自动注入 `Authorization: Bearer <业务JWT>`（从 AuthProvider 注册的 getter 获取）
 * - HTTP 401 或 `errno === '104'` → 派发 `api:unauthorized` 事件
 *   （调用方可传 `skipAuthEmit: true` 静默）
 * - 解包 `ApiResponse<T>.data` 后返回；失败抛 `ApiError`
 */
export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, headers, method = 'GET', skipAuthEmit = false, signal } = opts

  // 业务 JWT 注入：若 AuthProvider 已注册 getter 则自动附带
  let authHeader: Record<string, string> = {}
  let hasBearer = false
  if (currentTokenGetter) {
    try {
      const token = await currentTokenGetter()
      if (token) {
        authHeader = { Authorization: `Bearer ${token}` }
        hasBearer = true
      }
    } catch {
      // token 获取失败不阻断请求：后端会按未登录处理
    }
  }

  const { status, json } = await rawFetch<ApiResponse<T>>(path, {
    method,
    body,
    signal,
    headers: { ...authHeader, ...headers },
  })

  if (status === 401) {
    // 只有在"带着 token 还是 401"时才视为会话失效并派发登出事件。
    // 没有 token 就收到 401 只说明用户尚未登录，RequireAuth 会处理登录引导，
    // 这里再 emit 会和 RequireAuth 触发的 Privy login 打架，形成死循环。
    if (hasBearer && !skipAuthEmit) {
      emitUnauthorized({ kind: 'http_401', errno: 401, msg: 'HTTP 401', path })
    }
    throw new ApiError(401, '未登录或会话已过期')
  }

  if (!json) {
    throw new ApiError(status, `响应解析失败 (${status})`)
  }

  if (!isApiSuccess(json.errno)) {
    // 主站错误码 '104' = token 失效（与 HTTP 401 等价处理）
    // 同样：只在带着 token 的请求上才认为是会话失效
    if (String(json.errno) === ERRNO_TOKEN_INVALID && hasBearer && !skipAuthEmit) {
      emitUnauthorized({ kind: 'token_invalid', errno: json.errno, msg: json.msg, path })
    }
    throw new ApiError(json.errno, json.msg || `请求失败 (errno=${json.errno})`, json)
  }
  return json.data
}
