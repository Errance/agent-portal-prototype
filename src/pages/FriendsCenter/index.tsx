import { useState } from 'react'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import StatCard from '@/components/shared/StatCard'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { FilterBar, Select, FilterItem } from '@/components/shared/FilterBar'
import { useAgent } from '@/context/AgentContext'
import { invitees, subAgents } from '@/mock/data'
import type { Invitee, SubAgent } from '@/mock/types'

const stats = [
  { label: '注册人数', value: invitees.length - 1 },
  { label: '已充值人数', value: invitees.filter(u => !u.isSelf && u.depositStatus === 'deposited').length },
  { label: '已交易人数', value: invitees.filter(u => !u.isSelf && u.depositStatus === 'deposited').length },
]

export default function FriendsCenter() {
  const { selfRebateEnabled, isFrozen } = useAgent()
  const [tab, setTab] = useState('0')
  const [idFilter, setIdFilter] = useState('all')
  const [editUid, setEditUid] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [remarks, setRemarks] = useState<Record<string, string>>({})

  const filteredInvitees = invitees.filter(u => {
    if (!selfRebateEnabled && u.isSelf) return false
    if (idFilter === 'regular' && u.identityType !== 'regular') return false
    if (idFilter === 'sub_agent' && u.identityType !== 'sub_agent' && !u.isSelf) return false
    return true
  })

  const inviteeColumns: Column<Invitee>[] = [
    {
      key: 'uid', label: 'UID',
      render: r => (
        <Text color={r.isSelf ? 'theme' : 'text.200'} fontFamily={r.isSelf ? 'ISB' : undefined}>
          {r.isSelf ? '我自己' : r.uid}
          {r.isSelf && selfRebateEnabled && (
            <Text as="span" fontSize="xs" color="gray.100" ml={2}>
              自返佣: {r.selfRebateAmount?.toFixed(2)} USDT
            </Text>
          )}
        </Text>
      ),
    },
    { key: 'identity', label: '用户身份', render: r => r.isSelf ? '代理商' : r.identityType === 'sub_agent' ? '子代理' : '普通用户' },
    { key: 'deposit', label: '充值状态', render: r => <StatusBadge type="deposit" value={r.depositStatus} /> },
    { key: 'time', label: '注册时间', render: r => r.registeredAt },
    { key: 'remark', label: '备注', render: r => remarks[r.uid] || r.remark || '—' },
    {
      key: 'action', label: '操作',
      render: r => r.isSelf ? null : (
        <Box
          as="button"
          fontSize="xs"
          color={isFrozen ? 'gray.200' : 'theme'}
          fontFamily="ISB"
          cursor={isFrozen ? 'not-allowed' : 'pointer'}
          onClick={() => {
            if (isFrozen) return
            setEditUid(r.uid)
            setEditVal(remarks[r.uid] || r.remark)
          }}
        >
          编辑备注
        </Box>
      ),
    },
  ]

  const subAgentColumns: Column<SubAgent>[] = [
    { key: 'uid', label: 'UID', render: r => r.uid },
    { key: 'nick', label: '昵称', render: r => r.nickname },
    { key: 'perpRate', label: '永续返佣比例', render: r => `${r.perpRate}%` },
    { key: 'eventRate', label: '事件返佣比例', render: r => `${r.eventRate}%` },
    { key: 'time', label: '注册时间', render: r => r.registeredAt },
    {
      key: 'commission', label: '累计直接返佣（USDT）',
      render: r => r.totalDirectCommission.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      sortable: true, sortKey: r => r.totalDirectCommission,
    },
    {
      key: 'action', label: '操作',
      render: r => (
        <Link to={`/revenue?source_uid=${r.uid}`}>
          <Text fontSize="xs" color="theme" fontFamily="ISB" cursor="pointer">查看贡献明细</Text>
        </Link>
      ),
    },
  ]

  return (
    <Box>
      <Tabs.Root value={tab} onValueChange={e => setTab(e.value)}>
        <Tabs.List borderBottom="1px solid" borderColor="border.100" mb={4}>
          <Tabs.Trigger value="0" px={4} py={3} fontSize="sm" color={tab === '0' ? 'text.100' : 'gray.100'}
            fontFamily={tab === '0' ? 'ISB' : undefined}
            borderBottom="2px solid" borderColor={tab === '0' ? 'theme' : 'transparent'} _hover={{ color: 'text.100' }}>
            直接邀请人
          </Tabs.Trigger>
          <Tabs.Trigger value="1" px={4} py={3} fontSize="sm" color={tab === '1' ? 'text.100' : 'gray.100'}
            fontFamily={tab === '1' ? 'ISB' : undefined}
            borderBottom="2px solid" borderColor={tab === '1' ? 'theme' : 'transparent'} _hover={{ color: 'text.100' }}>
            子代理概览
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="0">
          <Flex gap={4} mb={4} flexWrap="wrap">
            {stats.map(s => <StatCard key={s.label} label={s.label} value={s.value} />)}
          </Flex>

          <FilterBar onSearch={() => {}} onReset={() => { setIdFilter('all') }}>
            <FilterItem label="用户身份">
              <Select value={idFilter} onChange={setIdFilter} options={[
                { label: '全部', value: 'all' }, { label: '普通用户', value: 'regular' },
                { label: '子代理', value: 'sub_agent' },
              ]} />
            </FilterItem>
          </FilterBar>

          <DataTable data={filteredInvitees} columns={inviteeColumns} />
        </Tabs.Content>

        <Tabs.Content value="1">
          <DataTable data={subAgents} columns={subAgentColumns} />
        </Tabs.Content>
      </Tabs.Root>

      {editUid && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setEditUid(null)}>
          <Box
            position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="xl" p={6} w="400px"
            boxShadow="0 8px 32px rgba(0,0,0,0.1)"
            onClick={e => e.stopPropagation()}
          >
            <Text fontFamily="ISB" mb={4}>编辑备注 — {editUid}</Text>
            <Box
              as="input" w="100%" h="40px" bg="bg.100" border="1px solid" borderColor="border.100"
              borderRadius="md" px={3} fontSize="sm" color="text.200" outline="none"
              value={editVal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditVal(e.target.value)}
              _focus={{ borderColor: 'theme' }}
            />
            <Flex justify="flex-end" gap={2} mt={4}>
              <Box as="button" px={4} py={2} bg="bg.300" color="text.200" border="1px solid" borderColor="border.100"
                borderRadius="md" fontSize="sm" cursor="pointer" onClick={() => setEditUid(null)}>取消</Box>
              <Box as="button" px={4} py={2} bg="theme" color="#fff" borderRadius="md" fontSize="sm"
                fontFamily="ISB" cursor="pointer" onClick={() => {
                  setRemarks(prev => ({ ...prev, [editUid]: editVal }))
                  setEditUid(null)
                }}>保存</Box>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  )
}
