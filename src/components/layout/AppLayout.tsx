import { Box, Flex, Text } from '@chakra-ui/react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import FrozenBanner from './FrozenBanner'
import GlobalFooter from './GlobalFooter'
import DemoControls from './DemoControls'
import { useAgent } from '@/context/AgentContext'

const tabs = [
  { label: '首页', path: '/' },
  { label: '好友中心', path: '/friends' },
  { label: '收益中心', path: '/revenue' },
  { label: '交易中心', path: '/trading' },
  { label: '邀请推广', path: '/invite' },
  { label: '链上充提', path: '/transfers' },
]

export default function AppLayout() {
  const { isFrozen, isAgent, tradeVisibility } = useAgent()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isAgent) return <Navigate to="/not-agent" replace />

  const visibleTabs = tabs.filter(t => {
    if (t.path === '/trading' && tradeVisibility === 'hidden') return false
    return true
  })

  return (
    <Flex minH="100vh" flexDir="column" bg="bg.100">
      <Box as="header" bg="bg.200" w="100%" h="72px" flexShrink={0}>
        <Flex h="100%" align="center" px="40px" maxW="100%">
          <Text
            fontFamily="ISB"
            fontSize="20px"
            color="theme"
            letterSpacing="-0.5px"
            cursor="pointer"
            onClick={() => navigate('/')}
            flexShrink={0}
          >
            TurboFlow
          </Text>

          <Box w="1px" h="24px" bg="border.200" mx="28px" flexShrink={0} />

          <Flex gap="32px" align="center" flex={1} overflow="auto">
            {visibleTabs.map(tab => {
              const isActive = tab.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(tab.path)
              return (
                <Text
                  key={tab.path}
                  as="button"
                  fontSize="16px"
                  fontFamily="ISB"
                  color={isActive ? 'nav.active' : 'nav.inactive'}
                  bg="transparent"
                  border="none"
                  cursor="pointer"
                  whiteSpace="nowrap"
                  lineHeight="16px"
                  transition="color 0.15s"
                  _hover={{ color: 'nav.active' }}
                  onClick={() => navigate(tab.path)}
                >
                  {tab.label}
                </Text>
              )
            })}
          </Flex>
        </Flex>
      </Box>

      {isFrozen && <FrozenBanner />}

      <Box
        as="main"
        maxW="1920px"
        w="100%"
        mx="auto"
        px="120px"
        pt="24px"
        pb={4}
        flex={1}
      >
        <Outlet />
        <GlobalFooter />
      </Box>
      <DemoControls />
    </Flex>
  )
}
