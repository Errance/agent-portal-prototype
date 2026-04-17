import { useState } from 'react'
import type { AgentStatus, TradeVisibility } from '@/types/domain'
import { agentConfig } from '@/mock/agent-config'
import { clampAgentLevel } from '@/utils/agentLevel'

export function useAgentStatus() {
  const [status, setStatus] = useState<AgentStatus>(agentConfig.status)
  const [selfRebateEnabled, setSelfRebateEnabled] = useState(agentConfig.selfRebateEnabled)
  const [tradeVisibility, setTradeVisibility] = useState<TradeVisibility>(
    agentConfig.tradeVisibility,
  )
  const [isNewAgent, setIsNewAgent] = useState(agentConfig.isNewAgent)

  const isFrozen = status === 'frozen'
  const isAgent = status !== 'not_agent'

  return {
    status,
    setStatus,
    selfRebateEnabled,
    setSelfRebateEnabled,
    tradeVisibility,
    setTradeVisibility,
    isNewAgent,
    setIsNewAgent,
    isFrozen,
    isAgent,
    currentFlatFeeRate: agentConfig.currentFlatFeeRate,
    currentProfitShareRate: agentConfig.currentProfitShareRate,
    currentEventRate: agentConfig.currentEventRate,
    agentName: agentConfig.agentName,
    agentLevel: clampAgentLevel(agentConfig.agentLevel),
  }
}
