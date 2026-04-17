import { cloneElement, isValidElement, useId, type ReactNode, type ReactElement } from 'react'
import { Box, Flex, Text, Grid } from '@chakra-ui/react'
import { ChakraInput, ChakraSelect, ChakraLabel } from './styled'

interface FilterItemProps {
  label: string
  children: ReactNode
  required?: boolean
  wide?: boolean
}

/**
 * 审计 H4 修复：FilterItem 生成唯一 id，通过 `<label htmlFor>` + 克隆 children 注入 id 属性，
 * 使屏幕阅读器 / 点击 label 聚焦输入。
 *
 * 约束：children 必须是单一 React element（例如 <Input>, <Select>, <DateRangeInput>）；
 * 这些组件的根节点会收到 `id` prop。
 */
export function FilterItem({ label, children, required, wide }: FilterItemProps) {
  const inputId = useId()
  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, { id: inputId })
    : children
  return (
    <Box gridColumn={wide ? 'span 2' : undefined} minW="0">
      <ChakraLabel
        htmlFor={inputId}
        display="block"
        fontSize="12px"
        color="gray.200"
        mb="8px"
        textTransform="uppercase"
        letterSpacing="0.5px"
        cursor="pointer"
      >
        {required && (
          <Text as="span" color="red.100">
            *{' '}
          </Text>
        )}
        {label}
      </ChakraLabel>
      {child}
    </Box>
  )
}

export function Select({
  id,
  value,
  onChange,
  options,
  disabled,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  disabled?: boolean
}) {
  return (
    <ChakraSelect
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      w="100%"
      h="36px"
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="4px"
      px={3}
      fontSize="13px"
      color={disabled ? 'gray.200' : 'text.100'}
      outline="none"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      transition="all 0.2s"
      _focus={{ borderColor: 'theme', boxShadow: '0 0 0 1px rgba(10,186,181,0.5)' }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: '#FFFFFF', color: '#151517' }}>
          {o.label}
        </option>
      ))}
    </ChakraSelect>
  )
}

export function Input({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <ChakraInput
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      w="100%"
      h="36px"
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="4px"
      px={3}
      fontSize="13px"
      color="text.100"
      outline="none"
      transition="all 0.2s"
      _focus={{ borderColor: 'theme', boxShadow: '0 0 0 1px rgba(10,186,181,0.5)' }}
      _placeholder={{ color: 'gray.200' }}
    />
  )
}

export function FilterBar({
  children,
  onSearch,
  onReset,
}: {
  children: ReactNode
  onSearch?: () => void
  onReset?: () => void
}) {
  return (
    <Box mb="24px">
      <Grid templateColumns="repeat(auto-fill, minmax(180px, 1fr))" gap="16px" alignItems="end">
        {children}
        <Flex gap="12px" alignSelf="end">
          {onSearch && (
            <Box
              as="button"
              px="20px"
              h="36px"
              bg="theme"
              color="#FFFFFF"
              borderRadius="4px"
              fontSize="13px"
              fontFamily="ISB"
              cursor="pointer"
              whiteSpace="nowrap"
              transition="all 0.2s"
              _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}
              onClick={onSearch}
            >
              查询
            </Box>
          )}
          {onReset && (
            <Box
              as="button"
              px="20px"
              h="36px"
              bg="transparent"
              color="text.100"
              border="1px solid"
              borderColor="border.100"
              borderRadius="4px"
              fontSize="13px"
              cursor="pointer"
              whiteSpace="nowrap"
              transition="all 0.2s"
              _hover={{ bg: 'bg.100', borderColor: 'border.200' }}
              onClick={onReset}
            >
              重置
            </Box>
          )}
        </Flex>
      </Grid>
    </Box>
  )
}

/**
 * 日期范围输入。DateRangeInput 由两个 Input 组成，不能由外部 id 统一绑定；
 * 若需要 a11y 可再拆分为两个 FilterItem。
 */
export function DateRangeInput({
  id,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  id?: string
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
}) {
  return (
    <Flex gap="8px" align="center" minW="0">
      <Box flex={1} minW="0">
        <Input id={id} type="date" value={from} onChange={onFromChange} />
      </Box>
      <Text fontSize="13px" color="gray.200" flexShrink={0}>
        —
      </Text>
      <Box flex={1} minW="0">
        <Input type="date" value={to} onChange={onToChange} />
      </Box>
    </Flex>
  )
}
