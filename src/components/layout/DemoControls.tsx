import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import { useAgent } from '@/context/AgentContext'
import type { AgentStatus, TradeVisibility } from '@/mock/types'

function Btn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      as="button"
      px={2}
      py={1}
      fontSize="xs"
      borderRadius="md"
      fontFamily="ISB"
      bg={active ? 'theme' : 'bg.300'}
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

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      bg="bg.200"
      border="1px solid"
      borderColor="border.100"
      borderRadius="xl"
      p={3}
      zIndex={200}
      maxW="320px"
      boxShadow="0 4px 16px rgba(0,0,0,0.08)"
    >
      <Text fontSize="xs" color="theme" fontWeight="600" fontFamily="ISB" mb={2}>Demo 控制面板</Text>

      <Flex direction="column" gap={2}>
        <Box>
          <Text fontSize="xs" color="gray.100" mb={1}>账号状态</Text>
          <HStack gap={1}>
            {(['normal', 'frozen', 'not_agent'] as AgentStatus[]).map(s => (
              <Btn key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
            ))}
          </HStack>
        </Box>

        <Box>
          <Text fontSize="xs" color="gray.100" mb={1}>交易可见深度</Text>
          <HStack gap={1}>
            {(['full', 'summary', 'hidden'] as TradeVisibility[]).map(v => (
              <Btn key={v} label={v} active={tradeVisibility === v} onClick={() => setTradeVisibility(v)} />
            ))}
          </HStack>
        </Box>

        <HStack gap={2}>
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
    </Box>
  )
}
