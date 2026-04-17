import { Box, Flex, Text } from '@chakra-ui/react'
import { useAgent } from '@/context/AgentContext'
import { useAuth } from '@/auth'
import PillButton from '@/components/shared/PillButton'
import { ChakraAnchor } from '@/components/shared/styled'
import { maskAddress, maskEmail } from '@/utils/mask'

export default function NotAgent() {
  const { setStatus } = useAgent()
  const auth = useAuth()

  // 展示当前登录标识：优先 email，再 address
  const loginLabel = auth.user?.email
    ? maskEmail(auth.user.email)
    : auth.user?.address
      ? maskAddress(auth.user.address)
      : ''

  return (
    <Flex minH="100vh" bg="bg.100" align="center" justify="center">
      <Box textAlign="center" maxW="400px">
        <Text fontSize="48px" mb="16px">
          🔒
        </Text>
        <Text fontFamily="ISB" fontSize="20px" color="text.100" mb="12px">
          您尚未开通代理商权限
        </Text>
        {loginLabel && (
          <Text fontSize="13px" color="gray.200" mb="12px">
            当前登录：<Text as="span" color="text.100">{loginLabel}</Text>
          </Text>
        )}
        <Text fontSize="14px" color="gray.100" mb="24px">
          如需成为代理商，请联系平台运营团队。
        </Text>
        <Flex justify="center" gap="12px" flexWrap="wrap">
          <ChakraAnchor
            href="https://t.me/TurboFlow"
            target="_blank"
            rel="noopener noreferrer"
            display="inline-block"
            px="24px"
            py="12px"
            bg="nav.bg"
            color="#fff"
            borderRadius="6px"
            fontSize="14px"
            fontFamily="ISB"
            _hover={{ opacity: 0.85 }}
          >
            联系平台
          </ChakraAnchor>
          <PillButton
            variant="ghost"
            size="lg"
            shape="rect"
            onClick={() => {
              void auth.logout()
            }}
          >
            退出登录
          </PillButton>
        </Flex>
        {import.meta.env.DEV && (
          <Box mt="16px">
            <Text
              as="button"
              fontSize="12px"
              color="gray.100"
              cursor="pointer"
              onClick={() => setStatus('normal')}
              _hover={{ color: 'theme' }}
            >
              [Demo] 切换为代理商
            </Text>
          </Box>
        )}
      </Box>
    </Flex>
  )
}
