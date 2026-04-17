import { Box, type BoxProps } from '@chakra-ui/react'
import { useEffect, useRef, type ReactNode } from 'react'

interface Props extends Omit<BoxProps, 'title'> {
  open: boolean
  onClose: () => void
  width?: string | number
  children: ReactNode
  borderColor?: string
  boxShadow?: string
  /** 无障碍：若传入则挂到 aria-labelledby */
  ariaLabelledBy?: string
  /** 无障碍：若传入则挂到 aria-label（没有可视标题时） */
  ariaLabel?: string
}

/**
 * 居中弹窗外壳（审计 H4 补 a11y）。
 * - 内置 Escape 关闭 + backdrop 点击关闭
 * - role="dialog" + aria-modal="true"
 * - 打开时把焦点移入面板，关闭时归还给触发元素
 * - 注意：本实现尚未做完整焦点陷阱，只保证 Tab 起点在面板内
 */
export default function ModalShell({
  open,
  onClose,
  width = '480px',
  children,
  borderColor = 'border.200',
  boxShadow = '0 16px 40px rgba(0,0,0,0.1)',
  ariaLabelledBy,
  ariaLabel,
  ...rest
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    // 记录触发元素以便关闭时还原焦点
    prevFocusRef.current = document.activeElement as HTMLElement | null
    // 把焦点移入面板（下一个 tick 等挂载完成）
    const id = setTimeout(() => {
      panelRef.current?.focus()
    }, 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(id)
      // 归还焦点
      prevFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0,0,0,0.5)"
      backdropFilter="blur(4px)"
      zIndex={300}
      onClick={onClose}
    >
      <Box
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        tabIndex={-1}
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%,-50%)"
        bg="bg.200"
        border="1px solid"
        borderColor={borderColor}
        borderRadius="8px"
        p="32px"
        w={width}
        boxShadow={boxShadow}
        outline="none"
        onClick={e => e.stopPropagation()}
        {...rest}
      >
        {children}
      </Box>
    </Box>
  )
}
