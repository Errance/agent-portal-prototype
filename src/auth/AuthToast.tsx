import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { onAuthToast, type AuthToastItem, type AuthToastKind } from './authEvents'
import PillButton from '@/components/shared/PillButton'

/**
 * 顶部悬浮的登录/会话 toast 容器。
 *
 * 审计背景（F1/F3）：登录错误不再挤在 RequireAuth 的卡片里，而是通过全局 toast 告知，
 * 这样 "模态弹出 / 错误信息 / 重新登录" 三者解耦，UI 干净很多。
 *
 * 交互：
 * - 同时最多显示 3 条，旧的被挤下来时直接消失（不做过渡队列，减少状态复杂度）
 * - 每条带 5s 自动消失（可配）；带 `action` 按钮的点击后立即 dismiss
 * - 手动关闭 `✕` 按钮保留 a11y（aria-label）
 * - 容器 `role=status aria-live=polite`：屏幕阅读器会在 toast 出现时朗读
 */

const MAX_VISIBLE = 3

const BORDER_COLOR: Record<AuthToastKind, string> = {
  error: 'red.100',
  info: 'border.200',
  success: 'theme',
}

const LABEL: Record<AuthToastKind, string> = {
  error: '错误',
  info: '提示',
  success: '成功',
}

export default function AuthToast() {
  const [items, setItems] = useState<AuthToastItem[]>([])
  // 用 ref 存定时器，避免组件因 setState 重新渲染丢失 timer 引用
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setItems(prev => prev.filter(x => x.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthToast(item => {
      setItems(prev => {
        const next = [...prev, item]
        // 超出时直接丢老的（同时清掉它们的 timer，避免泄漏）
        if (next.length > MAX_VISIBLE) {
          const dropped = next.splice(0, next.length - MAX_VISIBLE)
          dropped.forEach(d => {
            const timer = timersRef.current.get(d.id)
            if (timer) {
              clearTimeout(timer)
              timersRef.current.delete(d.id)
            }
          })
        }
        return next
      })
      if (item.autoDismissMs > 0) {
        const timer = setTimeout(() => dismiss(item.id), item.autoDismissMs)
        timersRef.current.set(item.id, timer)
      }
    })
    const timers = timersRef.current
    return () => {
      unsubscribe()
      timers.forEach(t => clearTimeout(t))
      timers.clear()
    }
  }, [dismiss])

  if (items.length === 0) return null

  return (
    <Box
      position="fixed"
      top="16px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={2000}
      role="status"
      aria-live="polite"
      // 触控点击穿透：toast 自身接收点击，其它位置点击能透过去
      pointerEvents="none"
    >
      <Flex direction="column" gap="8px" align="center">
        {items.map(t => (
          <Flex
            key={t.id}
            minW="320px"
            maxW="560px"
            bg="bg.200"
            border="1px solid"
            borderColor={BORDER_COLOR[t.kind]}
            borderRadius="8px"
            px="16px"
            py="12px"
            boxShadow="0 16px 40px rgba(0,0,0,0.12)"
            align="flex-start"
            gap="12px"
            pointerEvents="auto"
          >
            <Box flex={1}>
              <Text
                fontSize="11px"
                color="gray.200"
                textTransform="uppercase"
                letterSpacing="0.5px"
                mb="2px"
              >
                {LABEL[t.kind]}
              </Text>
              <Text fontSize="13px" color="text.100" wordBreak="break-word" lineHeight="1.5">
                {t.message}
              </Text>
            </Box>
            {t.action && (
              <PillButton
                variant={t.kind === 'error' ? 'danger' : 'primary'}
                size="sm"
                shape="rect"
                onClick={() => {
                  void t.action?.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </PillButton>
            )}
            <Box
              as="button"
              fontSize="14px"
              color="gray.200"
              cursor="pointer"
              lineHeight="1"
              aria-label="关闭"
              onClick={() => dismiss(t.id)}
              _hover={{ color: 'text.100' }}
              mt="2px"
            >
              ✕
            </Box>
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}
