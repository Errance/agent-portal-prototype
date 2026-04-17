import { useEffect, useRef, type ReactNode } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useAuth } from '@/auth'

/**
 * 路由守卫：未登录时触发 `auth.login()`，未登录期间渲染"极轻 blur 背景页"作为
 * modal 的幕布；登录错误通过全局 `AuthToast` 展示（参见 src/auth/AuthToast.tsx），
 * 不再在此渲染卡片。
 *
 * 审计 F1/F3 修复：
 * - 旧版在未登录时总是渲染一张"需要登录"卡片作为 modal 背景，视觉上和 Privy
 *   modal 功能重复；modal 关闭后又得靠卡片上的按钮重新打开，体验反直觉。
 * - 新版：未登录一律显示极简幕布（logo + 一行指引），自动触发一次 modal；
 *   用户主动取消或发生错误时，点击任意背景区域即可重弹 modal（backdrop click）。
 *   详细的错误文案和"重新登录"按钮由 Toast 承担。
 *
 * 防循环：effect 用 `useRef` 一次性锁 auto-trigger；`auth.isLoading` 期间等待，
 * 由 PrivyAuthBridge 在 `auto-exchange` / `loginError` 逻辑里决定是否继续。
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const triggered = useRef(false)

  useEffect(() => {
    if (auth.isLoading) return
    if (auth.isAuthenticated) {
      triggered.current = false
      return
    }
    if (triggered.current) return
    triggered.current = true
    void auth.login()
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
          aria-label="正在校验登录状态"
        />
      </Flex>
    )
  }

  if (!auth.isAuthenticated) {
    // 幕布点击 = 再次打开 Privy modal。对"用户关闭了 modal"或"换取失败后"的
    // 重试场景都适用；真正的错误文案由 Toast 发出。
    const handleBackdropClick = () => {
      void auth.login()
    }
    return (
      <Flex
        minH="100vh"
        bg="bg.100"
        align="center"
        justify="center"
        cursor="pointer"
        onClick={handleBackdropClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') handleBackdropClick()
        }}
        role="button"
        tabIndex={0}
        aria-label="登录"
        css={{ backdropFilter: 'blur(8px)' }}
      >
        <Box textAlign="center" maxW="400px" px="24px">
          <Text
            fontFamily="ISB"
            fontSize="28px"
            color="theme"
            letterSpacing="-0.5px"
            mb="12px"
            userSelect="none"
          >
            TurboFlow
          </Text>
          <Text fontSize="13px" color="gray.100" lineHeight="1.6">
            请在弹出窗口中完成登录以访问代理后台
          </Text>
          <Text fontSize="12px" color="gray.200" mt="8px" lineHeight="1.6">
            若弹窗未出现，点击页面任意位置重试
          </Text>
        </Box>
      </Flex>
    )
  }

  return <>{children}</>
}
