import { Box, Flex, Text } from '@chakra-ui/react'

interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <Flex direction="column" align="center" justify="center" py="64px" gap="12px">
      <Text fontSize="14px" color="red.100">
        {message || '数据加载失败'}
      </Text>
      {onRetry && (
        <Box
          as="button"
          px="16px"
          py="6px"
          fontSize="13px"
          fontFamily="ISB"
          color="text.100"
          bg="transparent"
          border="1px solid"
          borderColor="border.100"
          borderRadius="4px"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ bg: 'bg.100', borderColor: 'border.200' }}
          onClick={onRetry}
        >
          重试
        </Box>
      )}
    </Flex>
  )
}
