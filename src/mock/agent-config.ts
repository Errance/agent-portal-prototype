import type { AgentStatus, AgentLevel, TradeVisibility } from '@/types/domain'

/**
 * 代理账户基础配置 mock（审计 H2 拆分）。
 *
 * 独立一个文件，避免 `useAgentStatus` 的静态 import 把整个 mock/data.ts（连同所有大数组）
 * 都拉进主 bundle。mock/data.ts 只应被 queries 通过 `await import()` 动态加载。
 *
 * 上线后此处由 `useAgentMe` query 从 `/agent/me` 替换。
 */
export const agentConfig = {
  status: 'normal' as AgentStatus,
  selfRebateEnabled: true,
  tradeVisibility: 'full' as TradeVisibility,
  isNewAgent: false,
  currentFlatFeeRate: 1.50,
  currentProfitShareRate: 0.0080,
  currentEventRate: 1.20,
  agentName: '王大拿BG',
  agentLevel: 3 as AgentLevel,
}
