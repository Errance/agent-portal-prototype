import { useState } from 'react'
import type { AgentStatus, AgentLevel, TradeVisibility } from '@/mock/types'
import { agentConfig } from '@/mock/data'

export function useAgentStatus() {
  const [status, setStatus] = useState<AgentStatus>(agentConfig.status)
  const [selfRebateEnabled, setSelfRebateEnabled] = useState(agentConfig.selfRebateEnabled)
  const [tradeVisibility, setTradeVisibility] = useState<TradeVisibility>(agentConfig.tradeVisibility)
  const [isNewAgent, setIsNewAgent] = useState(agentConfig.isNewAgent)

  const isFrozen = status === 'frozen'
  const isAgent = status !== 'not_agent'

  return {
    status, setStatus,
    selfRebateEnabled, setSelfRebateEnabled,
    tradeVisibility, setTradeVisibility,
    isNewAgent, setIsNewAgent,
    isFrozen, isAgent,
    currentPerpRate: agentConfig.currentPerpRate,
    currentEventRate: agentConfig.currentEventRate,
    agentName: agentConfig.agentName,
    agentLevel: agentConfig.agentLevel as AgentLevel,
  }
}
