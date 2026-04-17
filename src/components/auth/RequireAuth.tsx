import { useEffect, type ReactNode } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useAuth } from '@/auth'

/**
 * 路由守卫：未登录时触发 `auth.login()`，未登录期间渲染模糊背景占位。
 *
 * 设计参考（用户已确认）：代理后台独立域名，未登录用户访问 Dashboard 时
 * 直接弹 Privy modal，而不是导航到独立登录页。模糊占位让用户看见"背后有
 * 内容但被挡住"的层次感。
 *
 * Privy 接入后，`auth.login()` 内部会打开 Privy modal，此处无须感知。
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // 触发登录流程（Privy modal 或其它实现）
      void auth.login()
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
    // 模糊背景占位。待 Privy modal 接入后，modal 会覆盖在这一层之上。
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
          borderColor="border.100"
          borderRadius="8px"
          p="32px"
          textAlign="center"
          maxW="360px"
        >
          <Text fontFamily="ISB" fontSize="18px" color="text.100" mb="8px">
            需要登录
          </Text>
          <Text fontSize="13px" color="gray.100">
            请在弹出窗口中完成登录以继续访问代理后台
          </Text>
        </Box>
      </Flex>
    )
  }

  return <>{children}</>
}
