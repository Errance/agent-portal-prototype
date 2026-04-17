import { Box, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'neutral' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface Props extends Omit<BoxProps, 'onClick' | 'children'> {
  variant?: Variant
  size?: Size
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
  title?: string
}

const VARIANT_STYLE: Record<Variant, { bg: string; color: string; border?: string; hoverBg: string }> = {
  primary: { bg: 'rgba(10,186,181,0.1)', color: 'theme', hoverBg: 'rgba(10,186,181,0.2)' },
  neutral: { bg: 'bg.200', color: 'text.100', border: 'border.200', hoverBg: 'bg.300' },
  danger: { bg: 'rgba(255,73,73,0.1)', color: 'red.100', hoverBg: 'rgba(255,73,73,0.2)' },
  ghost: { bg: 'transparent', color: 'text.100', border: 'border.100', hoverBg: 'bg.100' },
}

const SIZE_STYLE: Record<Size, { px: string; py: string; fontSize: string }> = {
  sm: { px: '12px', py: '4px', fontSize: '12px' },
  md: { px: '16px', py: '6px', fontSize: '13px' },
}

/**
 * 通用胶囊按钮，统一收敛 6+ 处重复写法（见审计 P7）。
 */
export default function PillButton({
  variant = 'neutral', size = 'sm', disabled, onClick, children, title, ...rest
}: Props) {
  const v = VARIANT_STYLE[variant]
  const s = SIZE_STYLE[size]
  return (
    <Box
      as="button"
      px={s.px}
      py={s.py}
      fontSize={s.fontSize}
      fontFamily="ISB"
      borderRadius="full"
      bg={disabled ? 'bg.300' : v.bg}
      color={disabled ? 'gray.200' : v.color}
      border={v.border ? '1px solid' : 'none'}
      borderColor={v.border}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      transition="all 0.2s"
      _hover={disabled ? {} : { bg: v.hoverBg }}
      onClick={disabled ? undefined : onClick}
      title={title}
      {...rest}
    >
      {children}
    </Box>
  )
}
