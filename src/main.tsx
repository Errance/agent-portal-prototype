import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as ChakraProvider } from './components/ui/provider'
import App from './App'

/**
 * 路由策略（见审计 A5）：
 * - 默认 HashRouter：GitHub Pages 子路径部署直接工作。
 * - 设置 VITE_ROUTER=browser 切到 BrowserRouter（需要宿主支持 SPA fallback，
 *   如 nginx `try_files $uri /index.html` 或 GitHub Pages 的 404.html 重定向）。
 */
const ROUTER_KIND = (import.meta.env.VITE_ROUTER as string | undefined) === 'browser'
  ? 'browser' as const
  : 'hash' as const

const BASENAME = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

const Router = ROUTER_KIND === 'browser' ? BrowserRouter : HashRouter
const routerProps = ROUTER_KIND === 'browser' ? { basename: BASENAME || undefined } : {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router {...routerProps}>
        <ChakraProvider forcedTheme="light">
          <App />
        </ChakraProvider>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
)
