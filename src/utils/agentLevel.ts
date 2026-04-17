import type { AgentLevel } from '@/mock/types'

export const AGENT_LEVEL_MIN: AgentLevel = 1
export const AGENT_LEVEL_MAX: AgentLevel = 5

export function clampAgentLevel(raw: unknown): AgentLevel {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (Number.isNaN(n)) return AGENT_LEVEL_MIN
  if (n === Infinity) return AGENT_LEVEL_MAX
  if (n === -Infinity) return AGENT_LEVEL_MIN
  const rounded = Math.round(n)
  if (rounded <= AGENT_LEVEL_MIN) return AGENT_LEVEL_MIN
  if (rounded >= AGENT_LEVEL_MAX) return AGENT_LEVEL_MAX
  return rounded as AgentLevel
}
