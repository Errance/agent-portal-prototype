import { type ReactNode } from 'react'
import { Box, Flex, Text, Grid } from '@chakra-ui/react'

interface FilterItemProps {
  label: string
  children: ReactNode
  required?: boolean
  wide?: boolean
}

export function FilterItem({ label, children, required, wide }: FilterItemProps) {
  return (
    <Box gridColumn={wide ? 'span 2' : undefined} minW="0">
      <Text fontSize="13px" color="gray.100" mb="6px" lineHeight="20px">
        {required && <Text as="span" color="red.100">* </Text>}
        {label}
      </Text>
      {children}
    </Box>
  )
}

export function Select({
  value, onChange, options, disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  disabled?: boolean
}) {
  return (
    <Box
      as="select"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      disabled={disabled}
      w="100%"
      h="36px"
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="6px"
      px={3}
      fontSize="13px"
      color={disabled ? 'gray.200' : 'text.100'}
      outline="none"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      _focus={{ borderColor: 'theme' }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: '#fff' }}>
          {o.label}
        </option>
      ))}
    </Box>
  )
}

export function Input({
  value, onChange, placeholder, type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <Box
      as="input"
      type={type}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      w="100%"
      h="36px"
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="6px"
      px={3}
      fontSize="13px"
      color="text.100"
      outline="none"
      _focus={{ borderColor: 'theme' }}
      _placeholder={{ color: 'gray.100' }}
    />
  )
}

export function FilterBar({ children, onSearch, onReset }: {
  children: ReactNode
  onSearch?: () => void
  onReset?: () => void
}) {
  return (
    <Box
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="10px"
      p="16px"
      mb="12px"
    >
      <Grid
        templateColumns="repeat(auto-fill, minmax(180px, 1fr))"
        gap="12px"
        alignItems="end"
      >
        {children}
        <Flex gap="8px" alignSelf="end" pt="20px">
          {onSearch && (
            <Box
              as="button"
              px="16px"
              h="36px"
              bg="nav.bg"
              color="#fff"
              borderRadius="6px"
              fontSize="13px"
              fontFamily="ISB"
              cursor="pointer"
              whiteSpace="nowrap"
              _hover={{ opacity: 0.85 }}
              onClick={onSearch}
            >
              查询
            </Box>
          )}
          {onReset && (
            <Box
              as="button"
              px="16px"
              h="36px"
              bg="bg.200"
              color="text.100"
              border="1px solid"
              borderColor="border.100"
              borderRadius="6px"
              fontSize="13px"
              cursor="pointer"
              whiteSpace="nowrap"
              _hover={{ bg: 'bg.100' }}
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

export function DateRangeInput({
  from, to, onFromChange, onToChange,
}: {
  from: string; to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
}) {
  return (
    <Flex gap="8px" align="center" minW="0">
      <Box flex={1} minW="0">
        <Input type="date" value={from} onChange={onFromChange} />
      </Box>
      <Text fontSize="13px" color="gray.200" flexShrink={0}>至</Text>
      <Box flex={1} minW="0">
        <Input type="date" value={to} onChange={onToChange} />
      </Box>
    </Flex>
  )
}
