import { Box, Flex } from '@chakra-ui/react'

interface Props {
  rows?: number
  cols?: number
}

export default function TableSkeleton({ rows = 6, cols = 5 }: Props) {
  return (
    <Box
      borderTop="1px solid"
      borderBottom="1px solid"
      borderColor="border.100"
      overflow="hidden"
    >
      {Array.from({ length: rows }).map((_, r) => (
        <Flex
          key={r}
          borderBottom={r === rows - 1 ? 'none' : '1px solid'}
          borderColor="border.100"
          px="16px"
          py="18px"
          gap="24px"
          align="center"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Box
              key={c}
              flex={c === 0 ? 2 : 1}
              h="14px"
              borderRadius="3px"
              css={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s infinite',
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '200% 0' },
                  '100%': { backgroundPosition: '-200% 0' },
                },
              }}
            />
          ))}
        </Flex>
      ))}
    </Box>
  )
}
