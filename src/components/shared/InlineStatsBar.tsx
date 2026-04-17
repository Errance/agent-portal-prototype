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
      bg="rgba(0, 0, 0, 0.02)"
      border="1px solid"
      borderColor="border.100"
      borderRadius="8px"
      px="20px"
      py="14px"
      mb="16px"
    >
      <Flex align="center" gap="0" flexWrap="wrap" rowGap="12px">
        {title && (
          <Box
            px="10px" py="4px" mr="24px"
            bg="rgba(10,186,181,0.1)"
            border="1px solid"
            borderColor="rgba(10,186,181,0.3)"
            borderRadius="4px"
            fontSize="12px"
            fontFamily="ISB"
            color="theme"
            flexShrink={0}
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            {title}
          </Box>
        )}
        {stats.map((s, i) => (
          <Flex key={s.label} align="center">
            {i > 0 && (
              <Box w="1px" h="24px" bg="border.100" mx="24px" flexShrink={0} />
            )}
            <Flex align="baseline" gap="8px" flexShrink={0}>
              <Text fontSize="13px" color="gray.100" whiteSpace="nowrap">{s.label}</Text>
              <Text fontSize="18px" fontWeight="500" fontFamily="ISB" color="text.100" whiteSpace="nowrap" letterSpacing="-0.5px">
                {fmt(s.value)}
              </Text>
              {s.unit && <Text fontSize="12px" color="gray.200" whiteSpace="nowrap">{s.unit}</Text>}
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}
