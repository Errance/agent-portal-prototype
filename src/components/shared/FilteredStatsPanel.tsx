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
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="xl"
      p={4}
    >
      <Text fontSize="xs" color="gray.200" mb={3} fontWeight="600">{title}</Text>
      <Flex gap={6} flexWrap="wrap">
        {stats.map((s) => (
          <Box key={s.label} minW="120px">
            <Text fontSize="xs" color="gray.200">{s.label}</Text>
            <Flex align="baseline" gap={1} mt={1}>
              <Text fontSize="md" fontWeight="700" fontFamily="ISB" color="text.100">
                {fmt(s.value)}
              </Text>
              {s.unit && <Text fontSize="xs" color="gray.200">{s.unit}</Text>}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Box>
  )
}
