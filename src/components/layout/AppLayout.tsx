import { Box, Flex, Text } from '@chakra-ui/react'
import { lazy, Suspense } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import FrozenBanner from './FrozenBanner'
import GlobalFooter from './GlobalFooter'
import { useAgent } from '@/context/AgentContext'

const DemoControls = import.meta.env.DEV
  ? lazy(() => import('./DemoControls'))
  : null

const tabs = [
  { label: '首页', path: '/' },
  { label: '好友中心', path: '/friends' },
  { label: '收益中心', path: '/revenue' },
  { label: '交易中心', path: '/trading' },
  { label: '推广管理', path: '/invite' },
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
      <Box as="header" w="100%" h="72px" flexShrink={0} position="sticky" top={0} zIndex={100}
           bg="rgba(255, 255, 255, 0.85)" backdropFilter="blur(12px)" borderBottom="1px solid" borderColor="border.100">
        <Flex h="100%" align="center" px={{ base: "24px", lg: "40px", xl: "80px" }} maxW="1920px" mx="auto">
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

          <Box w="1px" h="24px" bg="border.200" mx="32px" flexShrink={0} />

          <Flex gap="32px" align="center" flex={1} overflow="auto" h="100%">
            {visibleTabs.map(tab => {
              const isActive = tab.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(tab.path)
              return (
                <Flex
                  key={tab.path}
                  as="button"
                  h="100%"
                  align="center"
                  fontSize="16px"
                  fontFamily="ISB"
                  color={isActive ? 'nav.active' : 'nav.inactive'}
                  bg="transparent"
                  border="none"
                  cursor="pointer"
                  whiteSpace="nowrap"
                  transition="color 0.15s"
                  _hover={{ color: 'nav.active' }}
                  onClick={() => navigate(tab.path)}
                  position="relative"
                >
                  {tab.label}
                  {isActive && (
                    <Box position="absolute" bottom={0} left={0} right={0} h="2px" bg="theme" boxShadow="0 -2px 10px rgba(10,186,181,0.2)" />
                  )}
                </Flex>
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
        px={{ base: "24px", lg: "40px", xl: "80px" }}
        pt="32px"
        pb="120px"
        flex={1}
      >
        <Outlet />
        <GlobalFooter />
      </Box>
      {DemoControls && (
        <Suspense fallback={null}>
          <DemoControls />
        </Suspense>
      )}
    </Flex>
  )
}
