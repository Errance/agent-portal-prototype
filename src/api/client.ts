import { API_BASE } from './config'

/** 主站 web/ 风格的统一响应包。 */
export interface ApiResponse<T> {
  errno: number
  msg?: string
  data: T
}

export class ApiError extends Error {
  constructor(public errno: number, message: string, public raw?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body' | 'signal'> {
  body?: unknown
  signal?: AbortSignal
}

/**
 * 真实 fetch 封装（mock 开启时不会被调用）。统一：
 * - 拼 API_BASE
 * - JSON 化 body
 * - 解包 ApiResponse<T>，errno !== 0 抛 ApiError
 * - 401 以自定义事件广播，交给外层跳登录（避免硬耦合路由）
 */
export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, headers, method = 'GET', ...rest } = opts
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    method,
    credentials: 'include',
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:unauthorized'))
    }
    throw new ApiError(401, '未登录或会话已过期')
  }

  let json: ApiResponse<T>
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiError(res.status, `响应解析失败 (${res.status})`)
  }

  if (json.errno !== 0) {
    throw new ApiError(json.errno, json.msg || '请求失败', json)
  }
  return json.data
}
