import { Box, Text } from '@chakra-ui/react'

export default function FrozenBanner() {
  return (
    <Box bg="red.200" py={2} textAlign="center">
      <Text fontSize="sm" color="red.100" fontWeight="600">
        账号已冻结 — 仅可浏览，无法执行任何操作。如需解冻请联系平台。
      </Text>
    </Box>
  )
}
