import { Box, Flex, Text, HStack } from '@chakra-ui/react'
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
      {isFrozen && <FrozenBanner />}
      <Box
        as="main"
        maxW="1400px"
        w="100%"
        mx="auto"
        px={{ base: 2.5, sm: 5, xl: 10 }}
        pt={{ base: 4, md: 6, xl: 8 }}
        pb={4}
        flex={1}
      >
        <HStack gap={0} mb={6} borderBottom="1px solid" borderColor="border.100">
          {visibleTabs.map(tab => {
            const isActive = tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path)
            return (
              <Box
                key={tab.path}
                as="button"
                px={4}
                py={3}
                fontSize="sm"
                fontWeight={isActive ? '600' : '400'}
                fontFamily={isActive ? 'ISB' : undefined}
                color={isActive ? 'text.100' : 'gray.100'}
                borderBottom="2px solid"
                borderColor={isActive ? 'theme' : 'transparent'}
                bg="transparent"
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ color: 'text.100' }}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </Box>
            )
          })}
        </HStack>

        <Outlet />
        <GlobalFooter />
      </Box>
      <DemoControls />
    </Flex>
  )
}
