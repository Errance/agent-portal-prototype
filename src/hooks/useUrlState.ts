import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * 把单个筛选项绑定到 URL query，使筛选状态可分享 / 可后退。
 * 空值 === defaultValue 时会把 key 从 URL 中移除，保持链接整洁。
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key)
  const value = (raw ?? defaultValue) as T
  const setValue = useCallback(
    (next: T) => {
      setParams(
        prev => {
          const np = new URLSearchParams(prev)
          if (next === defaultValue || next === '' || next === undefined || next === null) {
            np.delete(key)
          } else {
            np.set(key, String(next))
          }
          return np
        },
        { replace: true },
      )
    },
    [key, defaultValue, setParams],
  )
  return [value, setValue]
}

/**
 * 读取一个只读 URL 参数并做 sanitize（例如 UID 格式校验）。
 * 非法值直接返回 fallback，避免脏数据传入 filter 或未来的 API 请求。
 */
export function useSanitizedUrlParam(
  key: string,
  pattern: RegExp,
  fallback = '',
): string {
  const [params] = useSearchParams()
  return useMemo(() => {
    const raw = params.get(key)
    if (!raw) return fallback
    return pattern.test(raw) ? raw : fallback
  }, [params, key, pattern, fallback])
}
