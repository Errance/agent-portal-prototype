import { Box, Text } from '@chakra-ui/react'

export default function GlobalFooter() {
  return (
    <Box py="24px" mt="32px" borderTop="1px solid" borderColor="border.100">
      <Text fontSize="12px" color="gray.100" textAlign="center" maxW="900px" mx="auto" lineHeight="1.8">
        本页面涉及的所有金额数据，均根据订单生成时的汇率折算为 USDT 进行展示。展示金额仅供参考，实际结算金额以平台最终结算为准。
      </Text>
    </Box>
  )
}
