import { API_BASE, BIZ_PF } from '@/api/config'

/**
 * `/login` 专用 HTTP 调用（不走 `apiFetch`，因为 Authorization 格式特殊）。
 *
 * 协议来源：主站 surf-one `web/src/components/Auth/useMyLogin.ts`（Privy 登录完成后换业务 JWT）。
 * 待后端二次确认（见 docs/BACKEND_PENDING_INTERFACES.md §1）。
 *
 * 和 `apiFetch` 不同之处：
 * - Authorization 头是 JSON 字符串（非 Bearer），body 为 `null`
 * - 不重用 `currentTokenGetter`（那是业务 API 的 Bearer，`/login` 阶段还没有 JWT）
 */

export interface LoginPayload {
  method: 'wallet' | 'email' | string
  access_token: string
  address?: string
  identity_token: string
  referral_code?: string | null
}

interface LoginResponse {
  errno: string | number
  msg?: string
  data: string | null
}

export class LoginError extends Error {
  constructor(
    public errno: string | number,
    message: string,
  ) {
    super(message)
    this.name = 'LoginError'
  }
}

/** 登录接口错误码（主站 surf-one 使用，代理后台待确认是否一致） */
export const ERRNO_LOGIN_SUCCESS = '200'
export const ERRNO_WHITELIST_FORBIDDEN = '10010012'

/**
 * 向后端 `/login` 换取业务 JWT。
 *
 * @returns 业务 JWT 字符串（用于后续 `apiFetch` 的 `Authorization: Bearer`）
 * @throws LoginError 包含 errno 便于外层区分白名单拦截等场景
 */
export async function loginToBackend(payload: LoginPayload): Promise<string> {
  const authorization = JSON.stringify({
    pf: 'privy',
    referral_code: null,
    ...payload,
  })

  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'biz-pf': BIZ_PF,
      LANG: 'zh-cn',
      Authorization: authorization,
    },
    // 主站 axios `data: null` 对应 fetch 无 body；部分后端接受字符串 'null'，若后端要求改这里
    body: undefined,
  })

  let json: LoginResponse
  try {
    json = (await res.json()) as LoginResponse
  } catch {
    throw new LoginError(res.status, `登录响应解析失败 (${res.status})`)
  }

  if (String(json.errno) !== ERRNO_LOGIN_SUCCESS || !json.data) {
    throw new LoginError(json.errno, json.msg || `登录失败 (errno=${json.errno})`)
  }
  return json.data
}
