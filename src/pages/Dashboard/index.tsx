import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import StatCard from '@/components/shared/StatCard'
import DataTable, { type Column } from '@/components/shared/DataTable'
import { useAgent } from '@/context/AgentContext'
import { dashboardKPI, inviteCodeSummary } from '@/mock/data'
import type { InviteCodeSummary } from '@/mock/types'
import type { AgentLevel } from '@/mock/types'

const LEVEL_NAMES: Record<AgentLevel, string> = {
  1: '青铜', 2: '白银', 3: '黄金', 4: '钻石', 5: '星耀',
}

const columns: Column<InviteCodeSummary>[] = [
  { key: 'code', label: '邀请码', render: r => <Text color="theme" fontFamily="ISB">{r.code}</Text> },
  { key: 'regs', label: '注册人数', render: r => r.registrations, sortable: true, sortKey: r => r.registrations },
  { key: 'perpRate', label: '永续返佣比例', render: r => `${r.perpRate}%` },
  { key: 'eventRate', label: '事件返佣比例', render: r => `${r.eventRate}%` },
]

export default function Dashboard() {
  const { isNewAgent, setIsNewAgent, agentName, agentLevel } = useAgent()

  return (
    <Box>
      <Flex
        align="center" justify="space-between" mb={4}
        bg="bg.200" border="1px solid" borderColor="border.100"
        borderRadius={{ base: '0', md: 'xl' }} px={5} py={4}
      >
        <Text fontSize="xl" fontFamily="ISB" color="text.100">
          您好，{agentName}
        </Text>
        <Box
          px={3} py={1}
          bg="rgba(10,186,181,0.1)"
          border="1px solid" borderColor="theme"
          borderRadius="full"
          fontSize="xs" fontFamily="ISB" color="theme"
        >
          Lv.{agentLevel} {LEVEL_NAMES[agentLevel]}
        </Box>
      </Flex>

      <Text fontSize="xs" color="gray.200" mb={4}>
        数据统计范围以 UTC+8 时区为准
      </Text>

      {isNewAgent && (
        <Box
          bg="green.200"
          border="1px solid"
          borderColor="theme"
          borderRadius={{ base: '0', md: 'xl' }}
          p={5}
          mb={6}
        >
          <Text fontFamily="ISB" color="text.100" mb={2}>欢迎成为 TurboFlow 代理商！</Text>
          <Text fontSize="sm" color="gray.100" mb={3}>
            创建您的第一个邀请码，开始发展下级用户并获取返佣收益。
          </Text>
          <HStack gap={3}>
            <Link to="/invite">
              <Box
                as="button"
                px={4} py={2}
                bg="theme" color="#fff"
                borderRadius="md" fontSize="sm" fontFamily="ISB"
                cursor="pointer" _hover={{ opacity: 0.85 }}
              >
                创建邀请码
              </Box>
            </Link>
            <Box
              as="button"
              px={4} py={2}
              bg="bg.300" color="text.200"
              border="1px solid" borderColor="border.100"
              borderRadius="md" fontSize="sm"
              cursor="pointer" onClick={() => setIsNewAgent(false)}
              _hover={{ bg: 'bg.400' }}
            >
              我知道了
            </Box>
          </HStack>
        </Box>
      )}

      <Flex gap={4} mb={6} flexWrap="wrap">
        {dashboardKPI.map(kpi => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            changePercent={kpi.changePercent}
          />
        ))}
      </Flex>

      <Box
        bg="bg.200"
        border="1px solid"
        borderColor="border.100"
        borderRadius={{ base: '0', md: 'xl' }}
        p={{ base: 0, md: 5 }}
      >
        <Flex justify="space-between" align="center" mb={4} px={{ base: 3, md: 0 }} pt={{ base: 3, md: 0 }}>
          <Text fontFamily="ISB" fontSize="md" color="text.100">邀请链接</Text>
          <Link to="/invite">
            <Box
              as="button"
              px={4} py={2}
              bg="theme" color="#fff"
              borderRadius="md" fontSize="sm" fontFamily="ISB"
              cursor="pointer" _hover={{ opacity: 0.85 }}
            >
              管理推广码
            </Box>
          </Link>
        </Flex>
        <DataTable data={inviteCodeSummary} columns={columns} pageSize={10} />
      </Box>
    </Box>
  )
}
