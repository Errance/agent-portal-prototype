import { Box, Flex, Text } from '@chakra-ui/react'
import { useAgent } from '@/context/AgentContext'

export default function NotAgent() {
  const { setStatus } = useAgent()

  return (
    <Flex minH="100vh" bg="bg.100" align="center" justify="center">
      <Box textAlign="center" maxW="400px">
        <Text fontSize="4xl" mb={4}>🔒</Text>
        <Text fontFamily="ISB" fontSize="xl" color="text.100" mb={3}>
          您尚未开通代理商权限
        </Text>
        <Text fontSize="sm" color="gray.100" mb={6}>
          如需成为代理商，请联系平台运营团队。
        </Text>
        <Box
          as="a" href="https://t.me/TurboFlow" target="_blank"
          display="inline-block" px={6} py={3}
          bg="theme" color="#fff" borderRadius="md" fontSize="sm" fontFamily="ISB"
          _hover={{ opacity: 0.85 }}
        >
          联系平台
        </Box>
        <Box mt={4}>
          <Text as="button" fontSize="xs" color="gray.200" cursor="pointer"
            onClick={() => setStatus('normal')} _hover={{ color: 'theme' }}>
            [Demo] 切换为代理商
          </Text>
        </Box>
      </Box>
    </Flex>
  )
}
