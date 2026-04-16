import { useState } from 'react'
import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import { useAgent } from '@/context/AgentContext'
import type { AgentStatus, TradeVisibility } from '@/mock/types'

function Btn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      as="button"
      px="8px"
      py="4px"
      fontSize="11px"
      borderRadius="4px"
      fontFamily="ISB"
      bg={active ? 'theme' : 'bg.100'}
      color={active ? '#fff' : 'gray.100'}
      border="1px solid"
      borderColor={active ? 'theme' : 'border.100'}
      onClick={onClick}
      cursor="pointer"
      _hover={{ opacity: 0.85 }}
    >
      {label}
    </Box>
  )
}

export default function DemoControls() {
  const {
    status, setStatus,
    selfRebateEnabled, setSelfRebateEnabled,
    tradeVisibility, setTradeVisibility,
    isNewAgent, setIsNewAgent,
  } = useAgent()

  const [collapsed, setCollapsed] = useState(false)

  return (
    <Box
      position="fixed"
      bottom="16px"
      right="16px"
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="10px"
      zIndex={200}
      boxShadow="0 4px 16px rgba(0,0,0,0.08)"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        px="12px"
        py="6px"
        cursor="pointer"
        onClick={() => setCollapsed(!collapsed)}
        _hover={{ bg: 'bg.100' }}
      >
        <Text fontSize="11px" color="theme" fontWeight="600" fontFamily="ISB">
          Demo 控制面板
        </Text>
        <Text fontSize="12px" color="gray.100" ml="8px">{collapsed ? '▲' : '▼'}</Text>
      </Flex>

      {!collapsed && (
        <Flex direction="column" gap="6px" px="12px" pb="10px">
          <Box>
            <Text fontSize="11px" color="gray.100" mb="3px">账号状态</Text>
            <HStack gap="3px">
              {(['normal', 'frozen', 'not_agent'] as AgentStatus[]).map(s => (
                <Btn key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
              ))}
            </HStack>
          </Box>

          <Box>
            <Text fontSize="11px" color="gray.100" mb="3px">交易可见深度</Text>
            <HStack gap="3px">
              {(['full', 'summary', 'hidden'] as TradeVisibility[]).map(v => (
                <Btn key={v} label={v} active={tradeVisibility === v} onClick={() => setTradeVisibility(v)} />
              ))}
            </HStack>
          </Box>

          <HStack gap="6px">
            <Btn
              label={`自推自算: ${selfRebateEnabled ? 'ON' : 'OFF'}`}
              active={selfRebateEnabled}
              onClick={() => setSelfRebateEnabled(!selfRebateEnabled)}
            />
            <Btn
              label={`新手: ${isNewAgent ? 'ON' : 'OFF'}`}
              active={isNewAgent}
              onClick={() => setIsNewAgent(!isNewAgent)}
            />
          </HStack>
        </Flex>
      )}
    </Box>
  )
}
