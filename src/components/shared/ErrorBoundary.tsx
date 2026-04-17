import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * 根级 Error Boundary（审计 M10）。
 * - 捕获 React 渲染 / lifecycle / constructor 异常
 * - 渲染降级 UI，提供"刷新页面"恢复入口
 * - 不捕获：事件回调中的异常（仍由业务侧捕获）、async 异常（交由 react-query 的 error 状态）
 *
 * 上线后可在 componentDidCatch 里接 Sentry / 日志。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info)
    }
    // TODO: Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  handleReload = () => {
    this.setState({ error: null })
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <Flex minH="100vh" bg="bg.100" align="center" justify="center" p="24px">
          <Box maxW="520px" bg="bg.200" border="1px solid" borderColor="border.100"
            borderRadius="8px" p="32px" textAlign="center">
            <Text fontSize="40px" mb="16px" role="img" aria-label="错误">⚠️</Text>
            <Text fontFamily="ISB" fontSize="20px" color="text.100" mb="12px">页面出错了</Text>
            <Text fontSize="14px" color="gray.100" mb="24px" wordBreak="break-word">
              {this.state.error.message || '未知错误，请刷新页面重试'}
            </Text>
            <Box
              as="button"
              onClick={this.handleReload}
              px="24px" py="10px"
              bg="theme" color="#FFFFFF"
              borderRadius="4px" fontSize="14px" fontFamily="ISB"
              cursor="pointer" transition="all 0.2s"
              _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}
            >
              刷新页面
            </Box>
          </Box>
        </Flex>
      )
    }
    return this.props.children
  }
}
