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
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/** mock 接口模拟延迟（ms），制造 loading 状态。 */
export const MOCK_LATENCY_MS = 300

export function mockDelay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}
