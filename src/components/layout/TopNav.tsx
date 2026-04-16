import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { useAgent } from '@/context/AgentContext'

const navItems = [
  { label: '首页', path: '/' },
  { label: '好友中心', path: '/friends' },
  { label: '收益中心', path: '/revenue' },
  { label: '交易中心', path: '/trading' },
  { label: '邀请推广', path: '/invite' },
  { label: '链上充提', path: '/transfers' },
]

export default function TopNav() {
  const location = useLocation()
  const { tradeVisibility } = useAgent()

  const visibleItems = navItems.filter(item => {
    if (item.path === '/trading' && tradeVisibility === 'hidden') return false
    return true
  })

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={100}
      h="72px"
      bg="bg.200"
      borderBottom="1px solid"
      borderColor="border.100"
      px={8}
    >
      <Flex h="100%" align="center" justify="space-between" maxW="1680px" mx="auto">
        <HStack gap={8}>
          <Text fontWeight="bold" fontSize="xl" color="theme">
            TurboFlow
          </Text>
          <HStack gap={1}>
            {visibleItems.map(item => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
              return (
                <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                  <Box
                    px={4}
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight={isActive ? '600' : '400'}
                    color={isActive ? 'white.100' : 'gray.100'}
                    bg={isActive ? 'bg.400' : 'transparent'}
                    _hover={{ bg: 'bg.300' }}
                    transition="all 0.15s"
                  >
                    {item.label}
                  </Box>
                </Link>
              )
            })}
          </HStack>
        </HStack>
        <HStack gap={4}>
          <Text fontSize="xs" color="gray.200">UTC+8</Text>
          <Box px={3} py={1.5} bg="bg.400" borderRadius="md" fontSize="sm" color="white.200">
            Agent Demo
          </Box>
        </HStack>
      </Flex>
    </Box>
  )
}
