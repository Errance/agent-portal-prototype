/**
 * API 开关与路径配置。
 *
 * USE_MOCK 仅对 **dashboard / friends 两组尚未上线的后端接口** 的 mock 延迟起作用
 * （见 src/mock/data.ts 注释）。10 个正式 GET 接口（/agent/positions、/agent/transfers、
 * /agent/revenue/* 等）已全部直连真实 API，不再受 USE_MOCK 影响。
 *
 * 取值语义：
 * - 显式 VITE_USE_MOCK=true  → dashboard / friends 仍走 mock
 * - 显式 VITE_USE_MOCK=false → 直接调用真实 API（后端就绪后）
 * - 未设置时：`import.meta.env.DEV` 决定（本地开发默认 mock）
 */

const mockEnv = import.meta.env.VITE_USE_MOCK
export const USE_MOCK =
  mockEnv === undefined ? Boolean(import.meta.env.DEV) : String(mockEnv) === 'true'

/**
 * 真实 API 基址。sit 默认 `https://surfv2-sit-api.nfexinsider.com`，
 * 由 [AGENT_PORTAL_FRONTEND_API.md §1.1](../../docs/AGENT_PORTAL_FRONTEND_API.md) 确认。
 *
 * 注意：`/login` 调用**总是**打向此地址（见 src/auth/loginApi.ts），不受 USE_MOCK 影响。
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://surfv2-sit-api.nfexinsider.com'

/**
 * 业务平台标识头 `biz-pf`。后端 `GetPlatformByValue` 枚举：
 *   1 = MGT
 *   2 = CLIENT
 *   3 = BOT
 *   4 = SURFV2_CEX_TRADE      # surf-one 主站交易
 *   5 = SURFV2_CEX_REBATE
 *   6 = SURFV2_DEX_TRADE      # agent-portal 使用这个（后端映射到对应 Privy App ID）
 *   7 = SURFV2_DEX_REBATE
 */
export const BIZ_PF = import.meta.env.VITE_BIZ_PF || '6'

/** mock 接口模拟延迟（ms），制造 loading 状态。 */
export const MOCK_LATENCY_MS = 300

export function mockDelay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}
