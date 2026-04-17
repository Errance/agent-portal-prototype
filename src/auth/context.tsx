import { createContext, useContext } from 'react'
import type { AuthProvider } from './types'

/**
 * Auth Context — 实现由 StubAuthProvider 或将来 PrivyAuthProvider 提供。
 * 业务组件只 consume `useAuth()`，永远不直接依赖具体实现。
 */
export const AuthContext = createContext<AuthProvider | null>(null)

export function useAuth(): AuthProvider {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
