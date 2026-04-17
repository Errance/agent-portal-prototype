import { useEffect } from 'react'
import type { ApiUnauthorizedDetail } from '@/api/client'

/**
 * 订阅 `api:unauthorized` 全局事件。
 *
 * 由 `apiFetch` 在"带 Bearer 的请求收到 HTTP 401 / errno=104"时派发（见
 * src/api/client.ts）。AuthProvider 订阅这个事件做被动登出——此 hook 抽出来
 * 是为了：
 * 1. 让 Auth Bridge 逻辑更扁平：只保留"拿到 detail 后做什么"
 * 2. 可以独立单测：mock 一个 window + dispatchEvent 即可断言 handler 被调用
 *
 * 注意：`handler` 在每次 render 都会被订阅一次，但 effect 的清理函数会取消
 * 上一次订阅，避免多监听。
 */
export function useAuthUnauthorizedListener(
  handler: (detail: ApiUnauthorizedDetail) => void,
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onEvent = (ev: Event) => {
      const detail = (ev as CustomEvent<ApiUnauthorizedDetail | undefined>).detail
      if (!detail) return // 事件没有 detail 或形状不对 → 忽略
      handler(detail)
    }
    window.addEventListener('api:unauthorized', onEvent)
    return () => window.removeEventListener('api:unauthorized', onEvent)
  }, [handler])
}
