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
      border="1px solid"
      borderColor="border.100"
      borderRadius="12px"
      p="17px"
      minW="180px"
    >
      <Box
        borderBottom="1px solid"
        borderColor="border.100"
        pb="9px"
        mb="2px"
      >
        <Text fontSize="14px" color="gray.100" lineHeight="22px">{label}</Text>
      </Box>

      <Flex align="baseline" gap={2} pt="5px">
        <Text fontSize="24px" fontWeight="700" fontFamily="ISB" color="text.100" lineHeight="33.6px">
          {formatted}
        </Text>
        {unit && <Text fontSize="12px" color="gray.200">{unit}</Text>}
      </Flex>

      {changePercent !== undefined && (
        <Flex align="center" gap={1} mt="2px">
          <Text fontSize="12px" color="gray.200">较昨日</Text>
          <Text fontSize="11px" color="gray.200" fontFamily="ISB">
            {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
          </Text>
        </Flex>
      )}
    </Box>
  )
}
