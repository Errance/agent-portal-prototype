import { type ReactNode } from 'react'
import { Box, Flex, Text, Grid } from '@chakra-ui/react'
import { ChakraInput, ChakraSelect } from './styled'

interface FilterItemProps {
  label: string
  children: ReactNode
  required?: boolean
  wide?: boolean
}

export function FilterItem({ label, children, required, wide }: FilterItemProps) {
  return (
    <Box gridColumn={wide ? 'span 2' : undefined} minW="0">
      <Text fontSize="12px" color="gray.200" mb="8px" textTransform="uppercase" letterSpacing="0.5px">
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
    <ChakraSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
  value, onChange, placeholder, type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <ChakraInput
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
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

export function FilterBar({ children, onSearch, onReset }: {
  children: ReactNode
  onSearch?: () => void
  onReset?: () => void
}) {
  return (
    <Box mb="24px">
      <Grid
        templateColumns="repeat(auto-fill, minmax(180px, 1fr))"
        gap="16px"
        alignItems="end"
      >
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
      <Text fontSize="13px" color="gray.200" flexShrink={0}>—</Text>
      <Box flex={1} minW="0">
        <Input type="date" value={to} onChange={onToChange} />
      </Box>
    </Flex>
  )
}
