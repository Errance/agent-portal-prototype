import { Flex, Text, Box } from '@chakra-ui/react'

interface StatItem {
  label: string
  value: string | number
  unit?: string
}

interface InlineStatsBarProps {
  title?: string
  stats: StatItem[]
}

export default function InlineStatsBar({ title, stats }: InlineStatsBarProps) {
  const fmt = (v: string | number) =>
    typeof v === 'number'
      ? v.toLocaleString('en-US', { minimumFractionDigits: v % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
      : v

  return (
    <Box
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="10px"
      px="20px"
      py="12px"
      mb="12px"
    >
      <Flex align="center" gap="0" flexWrap="wrap" rowGap="8px">
        {title && (
          <Box
            px="10px" py="3px" mr="16px"
            bg="rgba(10,186,181,0.08)"
            border="1px solid"
            borderColor="rgba(10,186,181,0.2)"
            borderRadius="6px"
            fontSize="12px"
            fontFamily="ISB"
            color="theme"
            flexShrink={0}
          >
            {title}
          </Box>
        )}
        {stats.map((s, i) => (
          <Flex key={s.label} align="center">
            {i > 0 && (
              <Box w="1px" h="20px" bg="border.100" mx="20px" flexShrink={0} />
            )}
            <Flex align="baseline" gap="6px" flexShrink={0}>
              <Text fontSize="13px" color="gray.100" whiteSpace="nowrap">{s.label}</Text>
              <Text fontSize="15px" fontWeight="700" fontFamily="ISB" color="text.100" whiteSpace="nowrap">
                {fmt(s.value)}
              </Text>
              {s.unit && <Text fontSize="11px" color="gray.200" whiteSpace="nowrap">{s.unit}</Text>}
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}
