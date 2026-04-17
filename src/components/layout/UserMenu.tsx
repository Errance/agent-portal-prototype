import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import PillButton from '@/components/shared/PillButton'
import { useAuth, getAuthDisplayName } from '@/auth'
import { emitAuthToast } from '@/auth/authEvents'
import { copyFailureMessage, copyText } from '@/utils/clipboard'

/**
 * 顶栏右侧：用户身份 + 下拉菜单（含完整邮箱/地址 + 复制 + 退出登录）。
 *
 * 交互：
 * - 点 trigger 开关 open
 * - 点背后 backdrop / 按 ESC / 点 trigger 关闭
 * - 复制钱包地址后 2s 内文案变 "已复制 ✓"
 *
 * 待 `/agent/profile` 接入后可把 trigger 展示文本改为 agentName，这里先用 Privy 身份占位。
 */
export default function UserMenu() {
  const auth = useAuth()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // 组件卸载时清 copy timer
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  if (!auth.user) return null

  const email = auth.user.email
  const address = auth.user.address
  // 统一 displayName（含 userId 兜底，避免 Privy user 未 hydrate 时显示"已登录"）
  const triggerLabel = getAuthDisplayName(auth.user)

  const handleCopy = async () => {
    if (!address) return
    const res = await copyText(address)
    if (res.ok) {
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
      return
    }
    // 失败不再静默（S5）：弹 toast 让用户知道发生了什么 / 可以做什么
    emitAuthToast({ kind: 'error', message: copyFailureMessage(res.reason) })
  }

  const handleLogout = async () => {
    setOpen(false)
    await auth.logout()
  }

  return (
    <Box position="relative" flexShrink={0}>
      <Flex
        as="button"
        align="center"
        gap="8px"
        h="36px"
        px="12px"
        bg={open ? 'bg.200' : 'transparent'}
        border="1px solid"
        borderColor={open ? 'border.200' : 'border.100'}
        borderRadius="full"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: 'bg.200', borderColor: 'border.200' }}
        onClick={() => setOpen(v => !v)}
        title={email || address || '已登录用户'}
      >
        {/* 圆点头像（占位）*/}
        <Box
          w="20px"
          h="20px"
          borderRadius="full"
          bg="theme"
          opacity={0.85}
          flexShrink={0}
        />
        <Text fontSize="13px" fontFamily="ISB" color="text.100" whiteSpace="nowrap">
          {triggerLabel}
        </Text>
        <Text fontSize="10px" color="gray.200" lineHeight="1">
          {open ? '▲' : '▼'}
        </Text>
      </Flex>

      {open && (
        <>
          <Box
            position="fixed"
            inset={0}
            zIndex={150}
            onClick={() => setOpen(false)}
          />
          <Box
            position="absolute"
            right={0}
            top="100%"
            mt="8px"
            minW="280px"
            bg="bg.200"
            border="1px solid"
            borderColor="border.200"
            borderRadius="8px"
            p="16px"
            zIndex={151}
            boxShadow="0 16px 40px rgba(0,0,0,0.1)"
          >
            {email && (
              <Box mb="12px">
                <Text
                  fontSize="11px"
                  color="gray.200"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb="4px"
                >
                  邮箱
                </Text>
                <Text fontSize="13px" color="text.100" wordBreak="break-all">
                  {email}
                </Text>
              </Box>
            )}

            {address && (
              <Box mb="12px">
                <Text
                  fontSize="11px"
                  color="gray.200"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb="4px"
                >
                  钱包地址
                </Text>
                <Flex align="center" gap="8px">
                  <Text
                    fontSize="12px"
                    color="text.100"
                    fontFamily="monospace"
                    wordBreak="break-all"
                    flex={1}
                  >
                    {address}
                  </Text>
                  <PillButton
                    variant={copied ? 'primary' : 'neutral'}
                    size="sm"
                    shape="rect"
                    onClick={handleCopy}
                  >
                    {copied ? '已复制 ✓' : '复制'}
                  </PillButton>
                </Flex>
              </Box>
            )}

            <Box h="1px" bg="border.100" my="12px" />

            <Flex justify="flex-end">
              <PillButton variant="danger" size="md" shape="rect" onClick={handleLogout}>
                退出登录
              </PillButton>
            </Flex>
          </Box>
        </>
      )}
    </Box>
  )
}
