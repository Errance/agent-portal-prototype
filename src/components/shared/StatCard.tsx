import { Box, Text, Flex } from '@chakra-ui/react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  changePercent?: number
}

export default function StatCard({ label, value, unit, changePercent }: StatCardProps) {
  const isPositive = changePercent !== undefined && changePercent >= 0
  const formatted = typeof value === 'number'
    ? value.toLocaleString('en-US', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
    : value

  return (
    <Box
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="xl"
      p={5}
      flex={1}
      minW="180px"
    >
      <Text fontSize="xs" color="gray.100" mb={2}>{label}</Text>
      <Flex align="baseline" gap={2}>
        <Text fontSize="2xl" fontWeight="700" fontFamily="ISB" color="text.100">
          {formatted}
        </Text>
        {unit && <Text fontSize="xs" color="gray.200">{unit}</Text>}
      </Flex>
      {changePercent !== undefined && (
        <Flex align="center" gap={1} mt={2}>
          <Text fontSize="xs" color={isPositive ? 'theme' : 'red.100'} fontFamily="ISB">
            {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(1)}%
          </Text>
          <Text fontSize="xs" color="gray.200">较昨日</Text>
        </Flex>
      )}
    </Box>
  )
}
