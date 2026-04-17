import { Box, type BoxProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { ChakraLink } from './styled'

type Variant = 'primary' | 'solid' | 'neutral' | 'danger' | 'dangerSolid' | 'ghost'
type Size = 'sm' | 'md' | 'lg'
type Shape = 'pill' | 'rect'

interface Props extends Omit<BoxProps, 'onClick' | 'children'> {
  variant?: Variant
  size?: Size
  /** 外形：pill=全圆角（列表行操作），rect=4px 圆角（CTA / 弹窗按钮） */
  shape?: Shape
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
  title?: string
  /** 给出 `to` 时按 react-router Link 渲染 <a>，避免嵌套 `<a><button>`（见 H3）。 */
  to?: string
}

const VARIANT_STYLE: Record<
  Variant,
  { bg: string; color: string; border?: string; hoverBg: string }
> = {
  primary: { bg: 'rgba(10,186,181,0.1)', color: 'theme', hoverBg: 'rgba(10,186,181,0.2)' },
  solid: { bg: 'theme', color: '#FFFFFF', hoverBg: '#089995' },
  neutral: { bg: 'bg.200', color: 'text.100', border: 'border.200', hoverBg: 'bg.300' },
  danger: { bg: 'rgba(255,73,73,0.1)', color: 'red.100', hoverBg: 'rgba(255,73,73,0.2)' },
  dangerSolid: { bg: 'red.100', color: '#FFFFFF', hoverBg: '#E03E3E' },
  ghost: { bg: 'transparent', color: 'text.100', border: 'border.100', hoverBg: 'bg.100' },
}

const SIZE_STYLE: Record<Size, { px: string; py: string; fontSize: string }> = {
  sm: { px: '12px', py: '4px', fontSize: '12px' },
  md: { px: '16px', py: '6px', fontSize: '13px' },
  lg: { px: '24px', py: '10px', fontSize: '14px' },
}

/**
 * 通用胶囊按钮，统一收敛 6+ 处重复写法（见审计 P7 / M1）。
 * 传入 `to` 时渲染为 react-router Link（<a>），其它情况渲染为 <button>。
 */
export default function PillButton({
  variant = 'neutral',
  size = 'sm',
  shape = 'pill',
  disabled,
  onClick,
  children,
  title,
  to,
  ...rest
}: Props) {
  const v = VARIANT_STYLE[variant]
  const s = SIZE_STYLE[size]
  const commonStyle = {
    px: s.px,
    py: s.py,
    fontSize: s.fontSize,
    fontFamily: 'ISB',
    borderRadius: shape === 'pill' ? 'full' : '4px',
    bg: disabled ? 'bg.300' : v.bg,
    color: disabled ? 'gray.200' : v.color,
    border: v.border ? '1px solid' : 'none',
    borderColor: v.border,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-block',
    textDecoration: 'none',
    _hover: disabled ? {} : { bg: v.hoverBg },
    title,
  } as const
  if (to) {
    // rest 来自 BoxProps（div 元素事件类型），ChakraLink 是 anchor，忽略事件泛型差异即可
    return (
      <ChakraLink to={to} {...commonStyle} {...(rest as unknown as Record<string, unknown>)}>
        {children}
      </ChakraLink>
    )
  }
  return (
    <Box as="button" {...commonStyle} onClick={disabled ? undefined : onClick} {...rest}>
      {children}
    </Box>
  )
}
