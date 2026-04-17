/**
 * API 开关与路径配置。
 *
 * USE_MOCK 语义（审计 C3 修复后）：
 * - 显式 VITE_USE_MOCK=true  → 总是 mock
 * - 显式 VITE_USE_MOCK=false → 总是走真实 API
 * - 未设置时：`import.meta.env.DEV` 决定（本地开发默认 mock，生产构建默认真实 API）
 *
 * 这样做的目的：避免 CI 忘记注入环境变量时生产默认"演示模式上线"的风险。
 */

const mockEnv = import.meta.env.VITE_USE_MOCK
export const USE_MOCK =
  mockEnv === undefined ? Boolean(import.meta.env.DEV) : String(mockEnv) === 'true'

/**
 * 真实 API 基址。sit 默认 `https://surfv2-sit-api.nfexinsider.com`，
 * 由 [AGENT_PORTAL_FRONTEND_API.md §1.1](../../docs/AGENT_PORTAL_FRONTEND_API.md) 确认。
 *
 * 注意：`/login` 调用**总是**打向此地址（见 src/auth/loginApi.ts），
 * 不受 USE_MOCK 影响。业务 API `/agent/*` 受 USE_MOCK 控制。
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://surfv2-sit-api.nfexinsider.com'

/**
 * 业务平台标识头 `biz-pf`。主站 surf-one 用 '4'；代理后台值以后端告知为准。
 * 未注入时 fallback 到 '4'（跟主站一致），上线前需后端确认。
 */
export const BIZ_PF = import.meta.env.VITE_BIZ_PF || '4'

/** mock 接口模拟延迟（ms），制造 loading 状态。 */
export const MOCK_LATENCY_MS = 300

export function mockDelay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

/**
 * Query 适配器（审计 H2 修复）：
 * - USE_MOCK=true 时动态 import mock/data，让 Vite 把 mock 数据拆成单独的 on-demand chunk，
 *   生产构建不再把大段 mock 数据塞进主包
 * - USE_MOCK=false 时走真实 API，根本不触发 mock chunk 下载
 */
export async function mockOrFetch<T>(
  mockLoader: () => Promise<T>,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (USE_MOCK) {
    const data = await mockLoader()
    return mockDelay(data)
  }
  return fetcher()
}
