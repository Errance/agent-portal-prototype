import { Box, type BoxProps } from '@chakra-ui/react'
import { useEffect, type ReactNode } from 'react'

interface Props extends Omit<BoxProps, 'title'> {
  open: boolean
  onClose: () => void
  width?: string | number
  children: ReactNode
  borderColor?: string
  boxShadow?: string
}

/**
 * 居中弹窗外壳，抽离各页面重复的 fixed/backdrop/stopPropagation 模板。
 * 内置 Escape 关闭 + backdrop 点击关闭，宿主只需传 open/onClose。
 * 注意：当前未做焦点陷阱 / role="dialog" / aria-modal，a11y 待后续完善。
 */
export default function ModalShell({
  open, onClose, width = '480px', children,
  borderColor = 'border.200',
  boxShadow = '0 16px 40px rgba(0,0,0,0.1)',
  ...rest
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
        onClick={e => e.stopPropagation()}
        {...rest}
      >
        {children}
      </Box>
    </Box>
  )
}
