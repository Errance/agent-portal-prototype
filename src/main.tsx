import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Provider as ChakraProvider } from './components/ui/provider'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ChakraProvider forcedTheme="light">
        <App />
      </ChakraProvider>
    </HashRouter>
  </StrictMode>,
)
