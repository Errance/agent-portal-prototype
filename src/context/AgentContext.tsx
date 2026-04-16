import { createContext, useContext, type ReactNode } from 'react'
import { useAgentStatus } from '@/hooks/useAgentStatus'

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
