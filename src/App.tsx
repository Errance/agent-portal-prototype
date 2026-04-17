import { lazy, Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { AgentProvider } from '@/context/AgentContext'
import AppLayout from '@/components/layout/AppLayout'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const FriendsCenter = lazy(() => import('@/pages/FriendsCenter'))
const RevenueCenter = lazy(() => import('@/pages/RevenueCenter'))
const TradingCenter = lazy(() => import('@/pages/TradingCenter'))
const InvitePromotion = lazy(() => import('@/pages/InvitePromotion'))
const OnchainTransfers = lazy(() => import('@/pages/OnchainTransfers'))
const NotAgent = lazy(() => import('@/pages/NotAgent'))

function PageLoader() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Box
        w="36px"
        h="36px"
        border="2px solid"
        borderColor="border.100"
        borderTopColor="theme"
        borderRadius="full"
        animation="spin 0.9s linear infinite"
        css={{ '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }}
      />
      <Text ml={3} fontSize="13px" color="gray.200">加载中</Text>
    </Flex>
  )
}

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'friends', element: <FriendsCenter /> },
      { path: 'revenue', element: <RevenueCenter /> },
      { path: 'trading', element: <TradingCenter /> },
      { path: 'invite', element: <InvitePromotion /> },
      { path: 'transfers', element: <OnchainTransfers /> },
    ],
  },
  { path: '/not-agent', element: <NotAgent /> },
]

export default function App() {
  const element = useRoutes(routes)
  return (
    <ErrorBoundary>
      <AgentProvider>
        <Suspense fallback={<PageLoader />}>{element}</Suspense>
      </AgentProvider>
    </ErrorBoundary>
  )
}
