import { Flex, Text } from '@chakra-ui/react'

export default function EmptyState({ text = '暂无数据' }: { text?: string }) {
  return (
    <Flex py="64px" justify="center" align="center">
      <Text color="gray.100" fontSize="14px">{text}</Text>
    </Flex>
  )
}
