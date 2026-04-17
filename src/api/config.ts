/**
 * API 开关与路径配置。
 * VITE_USE_MOCK=true（默认）：所有 hooks 走 mock adapter。
 * VITE_USE_MOCK=false：走 VITE_API_BASE 下的真实 REST，DTO 层按 units.ts 转换。
 */

const mockEnv = import.meta.env.VITE_USE_MOCK
export const USE_MOCK = mockEnv === undefined ? true : String(mockEnv) !== 'false'
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/** mock 接口模拟延迟（ms），制造 loading 状态。 */
export const MOCK_LATENCY_MS = 300

export function mockDelay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}
