import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import { mapAgentProfile } from '../mappers'
import { useAuth } from '@/auth'
import type { AgentProfile } from '@/types/domain'

/**
 * GET /agent/profile（文档 §2.1）
 *
 * 返回代理自身三档比例；身份/冻结/等级/agentName 后端尚未提供，
 * 仍走 mock agentConfig（见 AgentContext）。
 *
 * 只在"已通过 Privy + /login 完成业务 JWT 换取"后触发；`enabled` 守卫避免：
 * 1. Privy session 还在恢复期间打出没有 Bearer 的请求 → 后端 401
 * 2. 配合 `apiFetch` "无 token 不 emitUnauthorized" 的逻辑共同阻断死循环
 *
 * `skipAuthEmit`：这个接口是"失败可降级"（UI 会 fallback 到 mock 比例上限），
 * 即使后端 `/agent/profile` 临时 401/errno=104，也不应联动全局登出——这会
 * 把业务 JWT 误清掉，导致其它页面请求也失败。真正的登出应由"用户确实不在
 * 白名单"这类 **全局** 触发点决定。
 *
 * `retry: false`：节流重试，避免后端未就绪时的 exponential backoff 噪音。
 */
export function useAgentProfile() {
  const { isAuthenticated } = useAuth()
  return useQuery<AgentProfile>({
    queryKey: ['agent', 'profile'],
    queryFn: async () => {
      const raw = await apiFetch<Record<string, unknown>>('/agent/profile', {
        skipAuthEmit: true,
      })
      return mapAgentProfile(raw)
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
  })
}
