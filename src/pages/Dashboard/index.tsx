import { Box, Flex, Text, HStack, Grid } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import StatCard from '@/components/shared/StatCard'
import DataTable, { type Column } from '@/components/shared/DataTable'
import { useAgent } from '@/context/AgentContext'
import { dashboardKPI, inviteCodeSummary } from '@/mock/data'
import type { InviteCodeSummary } from '@/mock/types'
import type { AgentLevel } from '@/mock/types'

const LEVEL_CONFIG: Record<AgentLevel, { name: string; bg: string; color: string; border: string; glow: string }> = {
  1: { name: '青铜', bg: '#F4F5F7', color: '#57585C', border: '#DEDFE0', glow: 'none' },
  2: { name: '白银', bg: '#EAEAED', color: '#151517', border: '#C0C0C8', glow: '0 2px 4px rgba(0,0,0,0.05)' },
  3: { name: '黄金', bg: 'linear-gradient(135deg, #FFF8D6 0%, #FFE81A 100%)', color: '#5C4A00', border: '#E6C800', glow: '0 4px 12px rgba(255,232,26,0.3)' },
  4: { name: '钻石', bg: 'linear-gradient(135deg, #E0F2FE 0%, #0ABAB5 100%)', color: '#003A38', border: '#0ABAB5', glow: '0 4px 12px rgba(10,186,181,0.3)' },
  5: { name: '星耀', bg: 'linear-gradient(135deg, #F3E8FF 0%, #A855F7 100%)', color: '#3B0764', border: '#9333EA', glow: '0 4px 12px rgba(168,85,247,0.3)' },
}

const columns: Column<InviteCodeSummary>[] = [
  { key: 'code', label: '推广码', render: r => <Text color="theme" fontFamily="ISB" fontSize="15px">{r.code}</Text> },
  { key: 'regs', label: '注册人数', align: 'right', render: r => <Text color="text.100" fontFamily="ISB">{r.registrations}</Text>, sortable: true, sortKey: r => r.registrations },
  { key: 'ff', label: 'FF 返佣比例', align: 'right', render: r => <Text color="text.100" fontFamily="ISB">{r.flatFeeRate.toFixed(2)}%</Text>, sortable: true, sortKey: r => r.flatFeeRate },
  { key: 'ps', label: 'PS 返佣比例', align: 'right', render: r => <Text color="text.100" fontFamily="ISB">{r.profitShareRate.toFixed(4)}%</Text>, sortable: true, sortKey: r => r.profitShareRate },
  { key: 'event', label: '事件返佣比例', align: 'right', render: r => <Text color="text.100" fontFamily="ISB">{r.eventRate.toFixed(2)}%</Text>, sortable: true, sortKey: r => r.eventRate },
]

export default function Dashboard() {
  const { isNewAgent, setIsNewAgent, agentName, agentLevel } = useAgent()
  const levelStyle = LEVEL_CONFIG[agentLevel]

  return (
    <Box>
      <Flex align="center" gap="16px" mb="32px">
        <Text fontSize="28px" fontFamily="ISB" color="text.100" letterSpacing="-0.5px">
          您好，{agentName}
        </Text>
        <Flex
          align="center"
          px="12px" py="4px"
          bg={levelStyle.bg}
          border="1px solid" borderColor={levelStyle.border}
          borderRadius="full"
          boxShadow={levelStyle.glow}
        >
          <Text fontSize="13px" fontFamily="ISB" color={levelStyle.color} lineHeight="1">
            Lv.{agentLevel} {levelStyle.name}
          </Text>
        </Flex>
      </Flex>

      <Text fontSize="12px" color="gray.200" mb="16px" textTransform="uppercase" letterSpacing="0.5px">
        数据统计范围以 UTC+8 时区为准
      </Text>

      {isNewAgent && (
        <Box
          bg="bg.200"
          border="1px solid"
          borderColor="border.100"
          borderRadius="8px"
          p="24px"
          mb="32px"
        >
          <Text fontFamily="ISB" fontSize="18px" color="text.100" mb="8px" letterSpacing="-0.5px">开启您的推广之旅</Text>
          <Text fontSize="14px" color="gray.100" mb="20px">
            创建您的第一个推广码，开始发展下级用户并获取返佣收益。
          </Text>
          <HStack gap="12px">
            <Link to="/invite">
              <Box
                as="button"
                px="24px" py="10px"
                bg="theme" color="#FFFFFF"
                borderRadius="4px" fontSize="13px" fontFamily="ISB"
                cursor="pointer" transition="all 0.2s"
                _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}
              >
                创建推广码
              </Box>
            </Link>
            <Box
              as="button"
              px="24px" py="10px"
              bg="transparent" color="text.100"
              border="1px solid" borderColor="border.100"
              borderRadius="4px" fontSize="13px"
              cursor="pointer" onClick={() => setIsNewAgent(false)}
              transition="all 0.2s" _hover={{ bg: 'bg.100', borderColor: 'border.200' }}
            >
              我知道了
            </Box>
          </HStack>
        </Box>
      )}

      <Grid templateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap="24px" mb="48px">
        {dashboardKPI.map(kpi => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            changePercent={kpi.changePercent}
          />
        ))}
      </Grid>

      <Box>
        <Flex justify="space-between" align="center" mb="24px">
          <Text fontFamily="ISB" fontSize="20px" color="text.100" letterSpacing="-0.5px">推广概览</Text>
          <Link to="/invite">
            <Box
              as="button"
              px="20px" py="8px"
              bg="transparent" color="text.100"
              border="1px solid" borderColor="border.100"
              borderRadius="4px" fontSize="13px" fontFamily="ISB"
              cursor="pointer" transition="all 0.2s"
              _hover={{ bg: 'bg.200', borderColor: 'border.200' }}
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
