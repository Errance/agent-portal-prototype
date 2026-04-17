import { createContext, useContext, type ReactNode } from 'react'
import { useAgentStatus } from '@/hooks/useAgentStatus'

/**
 * Agent 身份 / 状态 / 费率的全局上下文。
 *
 * 审计 H7（待 Privy + 真实 API 接入后重构）：
 * 当前实现由 `useAgentStatus` 基于 mock `agentConfig` 提供 useState，属于
 * **演示期可变本地态**，允许 DemoControls 修改 status / visibility 做调试。
 *
 * 后续重构方向：
 * 1. 新增 `useAgentMe()` React Query，查询 `/agent/me`（字段：status、level、
 *    selfRebateEnabled、tradeVisibility、currentXxxRate、agentName 等）。
 * 2. AgentProvider 只消费 Query 结果，不再持有 useState；冻结/等级这类服务端事实
 *    单一来源改为 Query 缓存，避免"双源"同步 bug（本地 state + 服务器响应漂移）。
 * 3. DemoControls 仅开发期有效，上线后只能靠后端 /admin 或 /agent/me 响应改变状态。
 * 4. 401 处理链路：apiFetch 抛 401 → main.tsx 监听 api:unauthorized → queryClient.clear()
 *    → `useAgentMe` 重新拉取失败 → 路由切到登录入口（或 Privy modal）。
 */

type AgentContextType = ReturnType<typeof useAgentStatus>

const AgentContext = createContext<AgentContextType | null>(null)

export function AgentProvider({ children }: { children: ReactNode }) {
  const value = useAgentStatus()
  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgent must be used within AgentProvider')
  return ctx
}
