import { rawFetch } from '@/api/client'

/**
 * `/login` 专用调用（不走业务 `apiFetch`，因为 Authorization 头是 JSON 字符串
 * 而不是 `Bearer <jwt>`；此阶段也没有业务 JWT 可用）。
 *
 * 协议来源：主站 surf-one `web/src/components/Auth/useMyLogin.ts`（Privy 登录完成后换业务 JWT）。
 * SIT 实测细节记录在 docs/BACKEND_PENDING_INTERFACES.md §2。
 *
 * 和 `apiFetch` 的区别：
 * - Authorization 头是 JSON 字符串（非 Bearer）
 * - body 为空
 * - 无 `api:unauthorized` 联动（/login 失败不是"会话失效"，而是换取失败）
 */

export interface LoginPayload {
  method: 'wallet' | 'email' | string
  access_token: string
  address?: string
  identity_token: string
  referral_code?: string | null
}

/**
 * 后端 `/login` 的 data 字段实际形状（sit 实测 2026-04-17）：
 *
 * ```json
 * {
 *   "errno": "200",
 *   "msg": "success",
 *   "data": {
 *     "access_token": "eyJ...",
 *     "wallet_approve_state": true
 *   }
 * }
 * ```
 *
 * - `access_token`：业务 JWT（HS256），用作后续 `/agent/*` 的 `Authorization: Bearer`
 * - `wallet_approve_state`：钱包审批状态；当前前端不主动消费，UI 是否分支
 *   展示待 `/agent/me` 明确后统一处理。
 */
interface LoginData {
  access_token?: string
  wallet_approve_state?: boolean
}

interface LoginResponse {
  errno: string | number
  msg?: string
  // 历史协议里 data 是 string，sit 现状是对象；两种都兼容
  data: string | LoginData | null
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

  const { status, json } = await rawFetch<LoginResponse>('/login', {
    method: 'POST',
    headers: { Authorization: authorization },
    // body 主站实现为空；部分后端接受字符串 'null'——如后端要求可改这里
    body: undefined,
  })

  if (!json) {
    throw new LoginError(status, `登录响应解析失败 (${status})`)
  }

  if (String(json.errno) !== ERRNO_LOGIN_SUCCESS || !json.data) {
    throw new LoginError(json.errno, json.msg || `登录失败 (errno=${json.errno})`)
  }

  // 兼容：历史协议 data 是 string；sit 现状是 { access_token, ... } 对象
  const jwt =
    typeof json.data === 'string'
      ? json.data
      : typeof json.data.access_token === 'string'
        ? json.data.access_token
        : ''
  if (!jwt) {
    throw new LoginError(json.errno, '登录响应缺少 access_token')
  }
  return jwt
}
