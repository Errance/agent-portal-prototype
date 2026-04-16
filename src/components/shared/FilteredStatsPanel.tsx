import { Box, Flex, Text } from '@chakra-ui/react'

interface StatItem {
  label: string
  value: string | number
  unit?: string
}

interface FilteredStatsPanelProps {
  title: string
  stats: StatItem[]
}

export default function FilteredStatsPanel({ title, stats }: FilteredStatsPanelProps) {
  const fmt = (v: string | number) =>
    typeof v === 'number'
      ? v.toLocaleString('en-US', { minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
      : v

  return (
    <Box
      border="1px solid"
      borderColor="border.100"
      borderRadius="12px"
      p="17px"
    >
      <Text fontSize="14px" color="gray.100" mb="12px" fontWeight="600">{title}</Text>
      <Flex gap="24px" flexWrap="wrap">
        {stats.map((s) => (
          <Box key={s.label} minW="120px">
            <Text fontSize="13px" color="gray.100">{s.label}</Text>
            <Flex align="baseline" gap="4px" mt="4px">
              <Text fontSize="18px" fontWeight="700" fontFamily="ISB" color="text.100">
                {fmt(s.value)}
              </Text>
              {s.unit && <Text fontSize="12px" color="gray.200">{s.unit}</Text>}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Box>
  )
}
