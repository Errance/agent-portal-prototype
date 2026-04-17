import { Box, Text, Flex } from '@chakra-ui/react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  changePercent?: number
  isLoading?: boolean
  error?: string
}

export default function StatCard({ label, value, unit, changePercent, isLoading, error }: StatCardProps) {
  const isPositive = changePercent !== undefined && changePercent >= 0
  const formatted = typeof value === 'number'
    ? value.toLocaleString('en-US', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
    : value

  return (
    <Box
      bg="bg.200"
      border="1px solid"
      borderColor={error ? 'red.100' : 'border.100'}
      borderRadius="8px"
      p="16px"
      minW="180px"
      transition="all 0.2s"
      _hover={error ? {} : { borderColor: 'theme', boxShadow: '0 0 12px rgba(10,186,181,0.1)', transform: 'translateY(-1px)' }}
    >
      <Flex align="center" justify="space-between" mb="8px">
        <Flex align="center" gap="6px">
          <Text fontSize="14px" color="gray.100" lineHeight="1">{label}</Text>
        </Flex>
      </Flex>

      {error ? (
        <Text fontSize="14px" color="red.100">{error}</Text>
      ) : isLoading ? (
        <Box
          h="28px"
          w="70%"
          borderRadius="4px"
          css={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '200% 0' },
              '100%': { backgroundPosition: '-200% 0' },
            },
          }}
        />
      ) : (
        <Flex align="baseline" gap={2}>
          <Text fontSize="26px" fontWeight="500" fontFamily="ISB" color="text.100" lineHeight="1.2" letterSpacing="-0.5px">
            {formatted}
          </Text>
          {unit && <Text fontSize="12px" color="gray.200">{unit}</Text>}
        </Flex>
      )}

      {!isLoading && !error && changePercent !== undefined && (
        <Flex align="center" gap={1} mt="6px">
          <Text fontSize="12px" color="gray.200">较昨日</Text>
          <Text fontSize="12px" color={isPositive ? 'theme' : 'red.100'} fontFamily="ISB">
            {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
          </Text>
        </Flex>
      )}
    </Box>
  )
}
