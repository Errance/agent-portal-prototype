import { useRoutes } from 'react-router-dom'
import { AgentProvider } from '@/context/AgentContext'
import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import FriendsCenter from '@/pages/FriendsCenter'
import RevenueCenter from '@/pages/RevenueCenter'
import TradingCenter from '@/pages/TradingCenter'
import InvitePromotion from '@/pages/InvitePromotion'
import OnchainTransfers from '@/pages/OnchainTransfers'
import NotAgent from '@/pages/NotAgent'

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
  return <AgentProvider>{element}</AgentProvider>
}
