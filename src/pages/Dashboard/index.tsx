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
        align="center" justify="space-between" mb="16px"
        border="1px solid" borderColor="border.100"
        borderRadius="12px" px="20px" py="16px"
      >
        <Text fontSize="20px" fontFamily="ISB" color="text.100">
          您好，{agentName}
        </Text>
        <Box
          px="12px" py="4px"
          bg="rgba(10,186,181,0.1)"
          border="1px solid" borderColor="theme"
          borderRadius="full"
          fontSize="12px" fontFamily="ISB" color="theme"
        >
          Lv.{agentLevel} {LEVEL_NAMES[agentLevel]}
        </Box>
      </Flex>

      <Text fontSize="13px" color="gray.100" mb="16px">
        数据统计范围以 UTC+8 时区为准
      </Text>

      {isNewAgent && (
        <Box
          bg="green.200"
          border="1px solid"
          borderColor="theme"
          borderRadius="12px"
          p="20px"
          mb="24px"
        >
          <Text fontFamily="ISB" fontSize="15px" color="text.100" mb="8px">欢迎成为 TurboFlow 代理商！</Text>
          <Text fontSize="14px" color="gray.100" mb="12px">
            创建您的第一个邀请码，开始发展下级用户并获取返佣收益。
          </Text>
          <HStack gap="12px">
            <Link to="/invite">
              <Box
                as="button"
                px="16px" py="8px"
                bg="nav.bg" color="#fff"
                borderRadius="6px" fontSize="14px" fontFamily="ISB"
                cursor="pointer" _hover={{ opacity: 0.85 }}
              >
                创建邀请码
              </Box>
            </Link>
            <Box
              as="button"
              px="16px" py="8px"
              bg="bg.200" color="text.100"
              border="1px solid" borderColor="border.100"
              borderRadius="6px" fontSize="14px"
              cursor="pointer" onClick={() => setIsNewAgent(false)}
              _hover={{ bg: 'bg.100' }}
            >
              我知道了
            </Box>
          </HStack>
        </Box>
      )}

      <Flex gap="16px" mb="24px" flexWrap="wrap">
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
        border="1px solid"
        borderColor="border.100"
        borderRadius="12px"
        p="20px"
      >
        <Flex justify="space-between" align="center" mb="16px">
          <Text fontFamily="ISB" fontSize="16px" color="text.100">邀请链接</Text>
          <Link to="/invite">
            <Box
              as="button"
              px="16px" py="8px"
              bg="nav.bg" color="#fff"
              borderRadius="6px" fontSize="14px" fontFamily="ISB"
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
