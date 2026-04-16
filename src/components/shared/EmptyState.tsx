import { Flex, Text } from '@chakra-ui/react'

export default function EmptyState({ text = '暂无数据' }: { text?: string }) {
  return (
    <Flex py={16} justify="center" align="center">
      <Text color="gray.200" fontSize="sm">{text}</Text>
    </Flex>
  )
}
