import { createContext, useContext } from 'react'
import type { AuthProvider } from './types'

/**
 * Auth Context — 由 PrivyAuthProvider 提供；业务组件只 consume `useAuth()`，
 * 永远不直接依赖 Privy SDK。未来如果换认证方案，只要保持 `AuthProvider`
 * 接口（见 types.ts）即可无感替换。
 */
export const AuthContext = createContext<AuthProvider | null>(null)

export function useAuth(): AuthProvider {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
