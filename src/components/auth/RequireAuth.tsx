import { useEffect, useRef, type ReactNode } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { useAuth } from '@/auth'

/**
 * 路由守卫：未登录时不渲染任何业务 UI，只展示纯 spinner；同时自动触发一次
 * `auth.login()` 弹出 Privy modal。
 *
 * 配合 Privy `useLogin.onError` 里对 `exited_auth_flow` 的 re-trigger
 * （见 src/auth/privy.tsx），用户关闭 modal 会立刻被再弹一次——效果上等于
 * **modal 不可关闭**，业务 UI 永远不会在"未登录"状态被看到。
 *
 * 防止 effect 重复触发：`autoLoginFiredRef` 一次锁。真正的登出走 UserMenu →
 * `auth.logout()` → `window.location.reload()`，reload 重置 ref，auto-trigger
 * 重新生效，modal 再次弹出。
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const autoLoginFiredRef = useRef(false)

  useEffect(() => {
    if (auth.isLoading) return
    if (auth.isAuthenticated) {
      autoLoginFiredRef.current = true
      return
    }
    if (autoLoginFiredRef.current) return
    autoLoginFiredRef.current = true
    void auth.login()
  }, [auth.isLoading, auth.isAuthenticated, auth])

  if (!auth.isAuthenticated) {
    // 未登录一律纯 spinner。Privy modal 覆盖在上面，spinner 作为"加载态"背景。
    return (
      <Flex minH="100vh" bg="bg.100" align="center" justify="center">
        <Box
          w="36px"
          h="36px"
          border="2px solid"
          borderColor="border.100"
          borderTopColor="theme"
          borderRadius="full"
          animation="spin 0.9s linear infinite"
          css={{ '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }}
          aria-label="正在登录"
        />
      </Flex>
    )
  }

  return <>{children}</>
}
