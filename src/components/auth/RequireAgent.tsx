import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAgent } from '@/context/AgentContext'

/**
 * 路由守卫：已登录前提下，非代理用户跳转到 /not-agent。
 * 假定上游已被 RequireAuth 包裹（已登录），此处只关心代理身份。
 *
 * 审计 C4 提醒：这是 UX 层防呆，后端每个敏感接口仍需独立校验代理身份。
 */
export default function RequireAgent({ children }: { children: ReactNode }) {
  const { isAgent } = useAgent()
  if (!isAgent) return <Navigate to="/not-agent" replace />
  return <>{children}</>
}
