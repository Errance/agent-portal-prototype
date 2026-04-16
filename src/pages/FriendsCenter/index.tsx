import { useState, useMemo } from 'react'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import StatCard from '@/components/shared/StatCard'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import FilteredStatsPanel from '@/components/shared/FilteredStatsPanel'
import { FilterBar, Select, FilterItem } from '@/components/shared/FilterBar'
import { useAgent } from '@/context/AgentContext'
import { invitees, subAgents } from '@/mock/data'
import type { Invitee, SubAgent } from '@/mock/types'

const globalStats = [
  { label: '注册人数', value: invitees.filter(u => !u.isSelf).length },
  { label: '已充值人数', value: invitees.filter(u => !u.isSelf && u.depositStatus === 'deposited').length },
  { label: '已交易人数', value: invitees.filter(u => !u.isSelf && u.tradeStatus === 'traded').length },
]

const subAgentGlobalStats = [
  { label: '子代理总数', value: subAgents.length, unit: '人' },
  { label: '累计贡献返佣', value: subAgents.reduce((s, a) => s + a.totalDirectCommission, 0).toFixed(2), unit: 'USDT' },
]

export default function FriendsCenter() {
  const { selfRebateEnabled, isFrozen } = useAgent()
  const [tab, setTab] = useState('0')
  const [idFilter, setIdFilter] = useState('all')
  const [editUid, setEditUid] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [remarks, setRemarks] = useState<Record<string, string>>({})

  const hasFilter = idFilter !== 'all'

  const filteredInvitees = invitees.filter(u => {
    if (!selfRebateEnabled && u.isSelf) return false
    if (idFilter === 'regular' && u.identityType !== 'regular') return false
    if (idFilter === 'sub_agent' && u.identityType !== 'sub_agent' && !u.isSelf) return false
    return true
  })

  const filteredStats = useMemo(() => {
    const nonSelf = filteredInvitees.filter(u => !u.isSelf)
    return [
      { label: '人数', value: nonSelf.length, unit: '人' },
      { label: '已充值', value: nonSelf.filter(u => u.depositStatus === 'deposited').length, unit: '人' },
      { label: '已交易', value: nonSelf.filter(u => u.tradeStatus === 'traded').length, unit: '人' },
    ]
  }, [filteredInvitees])

  const inviteeColumns: Column<Invitee>[] = [
    {
      key: 'uid', label: 'UID',
      render: r => (
        <Text color={r.isSelf ? 'theme' : 'text.100'} fontFamily={r.isSelf ? 'ISB' : undefined}>
          {r.isSelf ? '我自己' : r.uid}
          {r.isSelf && selfRebateEnabled && (
            <Text as="span" fontSize="12px" color="gray.100" ml={2}>
              自返佣: {r.selfRebateAmount?.toFixed(2)} USDT
            </Text>
          )}
        </Text>
      ),
    },
    { key: 'identity', label: '用户身份', render: r => r.isSelf ? '代理商' : r.identityType === 'sub_agent' ? '子代理' : '普通用户' },
    { key: 'deposit', label: '充值状态', render: r => <StatusBadge type="deposit" value={r.depositStatus} /> },
    { key: 'trade', label: '交易状态', render: r => <StatusBadge type="trade" value={r.tradeStatus} /> },
    { key: 'time', label: '注册时间', render: r => r.registeredAt },
    { key: 'remark', label: '备注', render: r => remarks[r.uid] || r.remark || '—' },
    {
      key: 'action', label: '操作',
      render: r => r.isSelf ? null : (
        <Box
          as="button"
          fontSize="14px"
          color={isFrozen ? 'gray.100' : 'theme'}
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
          <Text fontSize="14px" color="theme" fontFamily="ISB" cursor="pointer">查看贡献明细</Text>
        </Link>
      ),
    },
  ]

  const tabTrigger = (val: string, label: string) => (
    <Tabs.Trigger value={val} px="16px" py="12px" fontSize="14px"
      color={tab === val ? 'nav.active' : 'nav.inactive'}
      fontFamily="ISB" bg="transparent" border="none"
      _hover={{ color: 'nav.active' }}>
      {label}
    </Tabs.Trigger>
  )

  return (
    <Box>
      <Tabs.Root value={tab} onValueChange={e => setTab(e.value)}>
        <Tabs.List borderBottom="1px solid" borderColor="border.100" mb="16px">
          {tabTrigger('0', '直接邀请人')}
          {tabTrigger('1', '子代理概览')}
        </Tabs.List>

        <Tabs.Content value="0">
          <Flex gap="16px" mb="16px" flexWrap="wrap">
            {globalStats.map(s => <StatCard key={s.label} label={s.label} value={s.value} />)}
          </Flex>

          <FilterBar onSearch={() => {}} onReset={() => { setIdFilter('all') }}>
            <FilterItem label="用户身份">
              <Select value={idFilter} onChange={setIdFilter} options={[
                { label: '全部', value: 'all' }, { label: '普通用户', value: 'regular' },
                { label: '子代理', value: 'sub_agent' },
              ]} />
            </FilterItem>
          </FilterBar>

          {hasFilter && (
            <Box mb="16px">
              <FilteredStatsPanel title="筛选结果统计" stats={filteredStats} />
            </Box>
          )}

          <DataTable data={filteredInvitees} columns={inviteeColumns} />
        </Tabs.Content>

        <Tabs.Content value="1">
          <Box mb="16px">
            <FilteredStatsPanel title="全局统计" stats={subAgentGlobalStats} />
          </Box>
          <DataTable data={subAgents} columns={subAgentColumns} />
        </Tabs.Content>
      </Tabs.Root>

      {editUid && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setEditUid(null)}>
          <Box
            position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="400px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)"
            onClick={e => e.stopPropagation()}
          >
            <Text fontFamily="ISB" fontSize="16px" mb="16px">编辑备注 — {editUid}</Text>
            <Box
              as="input" w="100%" h="40px" bg="bg.100" border="1px solid" borderColor="border.100"
              borderRadius="6px" px={3} fontSize="14px" color="text.100" outline="none"
              value={editVal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditVal(e.target.value)}
              _focus={{ borderColor: 'theme' }}
            />
            <Flex justify="flex-end" gap="8px" mt="16px">
              <Box as="button" px="16px" py="8px" bg="bg.200" color="text.100" border="1px solid" borderColor="border.100"
                borderRadius="6px" fontSize="14px" cursor="pointer" onClick={() => setEditUid(null)}
                _hover={{ bg: 'bg.100' }}>取消</Box>
              <Box as="button" px="16px" py="8px" bg="nav.bg" color="#fff" borderRadius="6px" fontSize="14px"
                fontFamily="ISB" cursor="pointer" onClick={() => {
                  setRemarks(prev => ({ ...prev, [editUid]: editVal }))
                  setEditUid(null)
                }} _hover={{ opacity: 0.85 }}>保存</Box>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  )
}
