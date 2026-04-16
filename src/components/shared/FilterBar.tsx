import { type ReactNode } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'

interface FilterItemProps {
  label: string
  children: ReactNode
  required?: boolean
}

export function FilterItem({ label, children, required }: FilterItemProps) {
  return (
    <Box minW="180px" flex={1}>
      <Text fontSize="xs" color="gray.100" mb={1}>
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
      h="32px"
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="md"
      px={3}
      fontSize="sm"
      color={disabled ? 'gray.200' : 'text.200'}
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
      h="32px"
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="md"
      px={3}
      fontSize="sm"
      color="text.200"
      outline="none"
      _focus={{ borderColor: 'theme' }}
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
    <Box
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="xl"
      p={5}
      mb={4}
    >
      <Flex gap={4} flexWrap="wrap" align="flex-end">
        {children}
        <Flex gap={2} mt="auto" pb={0}>
          {onSearch && (
            <Box
              as="button"
              px={4}
              h="32px"
              bg="theme"
              color="#fff"
              borderRadius="md"
              fontSize="sm"
              fontFamily="ISB"
              cursor="pointer"
              _hover={{ opacity: 0.85 }}
              onClick={onSearch}
            >
              查询
            </Box>
          )}
          {onReset && (
            <Box
              as="button"
              px={4}
              h="32px"
              bg="bg.300"
              color="text.200"
              border="1px solid"
              borderColor="border.100"
              borderRadius="md"
              fontSize="sm"
              cursor="pointer"
              _hover={{ bg: 'bg.400' }}
              onClick={onReset}
            >
              重置
            </Box>
          )}
        </Flex>
      </Flex>
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
    <Flex gap={2} align="center">
      <Input type="date" value={from} onChange={onFromChange} />
      <Text fontSize="xs" color="gray.200">至</Text>
      <Input type="date" value={to} onChange={onToChange} />
    </Flex>
  )
}
