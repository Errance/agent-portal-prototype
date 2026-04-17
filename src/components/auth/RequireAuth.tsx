import { useEffect, useRef, type ReactNode } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import PillButton from '@/components/shared/PillButton'
import { useAuth } from '@/auth'

/**
 * 路由守卫：未登录时触发 `auth.login()`，未登录期间渲染模糊背景占位。
 *
 * 设计参考（用户已确认）：代理后台独立域名，未登录用户访问 Dashboard 时
 * 直接弹 Privy modal，而不是导航到独立登录页。
 *
 * 防循环：useRef 锁一次性触发 login，modal 关闭 / /login 失败后
 * 用户可点"重新登录"主动重试，避免 effect 死循环调用 login()。
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const triggered = useRef(false)

  // 初次未登录时自动触发一次 login；成功后重置
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !triggered.current) {
      triggered.current = true
      void auth.login()
    }
    if (auth.isAuthenticated) {
      triggered.current = false
    }
  }, [auth.isLoading, auth.isAuthenticated, auth])

  if (auth.isLoading) {
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
        />
      </Flex>
    )
  }

  if (!auth.isAuthenticated) {
    // PrivyAuthProvider 会把 loginError 放到 context value（PrivyAuthBridge 的 useMemo 中扩展了）
    const loginError = (auth as unknown as { loginError?: Error | null }).loginError ?? null
    return (
      <Flex
        minH="100vh"
        bg="bg.100"
        align="center"
        justify="center"
        css={{ backdropFilter: 'blur(8px)' }}
      >
        <Box
          bg="bg.200"
          border="1px solid"
          borderColor={loginError ? 'red.100' : 'border.100'}
          borderRadius="8px"
          p="32px"
          textAlign="center"
          maxW="360px"
        >
          <Text fontFamily="ISB" fontSize="18px" color="text.100" mb="8px">
            {loginError ? '登录失败' : '需要登录'}
          </Text>
          <Text fontSize="13px" color="gray.100" mb="20px" wordBreak="break-word">
            {loginError
              ? loginError.message
              : '请在弹出窗口中完成登录以继续访问代理后台'}
          </Text>
          <PillButton
            variant="solid"
            size="md"
            shape="rect"
            onClick={() => {
              triggered.current = false
              void auth.login()
            }}
          >
            {loginError ? '重新登录' : '打开登录窗口'}
          </PillButton>
        </Box>
      </Flex>
    )
  }

  return <>{children}</>
}
