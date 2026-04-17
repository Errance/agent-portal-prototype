import { useState, useMemo } from 'react'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import { FilterBar, Select, FilterItem } from '@/components/shared/FilterBar'
import { useAgent } from '@/context/AgentContext'
import { invitees, subAgents } from '@/mock/data'
import type { Invitee, SubAgent } from '@/mock/types'

const globalStats = [
  { label: '注册人数', value: invitees.filter(u => !u.isSelf).length },
  { label: '已充值', value: invitees.filter(u => !u.isSelf && u.depositStatus === 'deposited').length },
  { label: '已交易', value: invitees.filter(u => !u.isSelf && u.tradeStatus === 'traded').length },
]

const subAgentGlobalStats = [
  { label: '子代理总数', value: subAgents.length, unit: '人' },
  { label: '子代理返佣(USDT)', value: subAgents.reduce((s, a) => s + a.directCommUsdt, 0).toFixed(2), unit: 'USDT' },
  { label: '子代理返佣(USDC)', value: subAgents.reduce((s, a) => s + a.directCommUsdc, 0).toFixed(2), unit: 'USDC' },
  { label: '平台奖励(USDT)', value: subAgents.reduce((s, a) => s + a.platformRewardUsdt, 0).toFixed(2), unit: 'USDT' },
  { label: '平台奖励(USDC)', value: subAgents.reduce((s, a) => s + a.platformRewardUsdc, 0).toFixed(2), unit: 'USDC' },
]

export default function FriendsCenter() {
  const { selfRebateEnabled, isFrozen, currentFlatFeeRate, currentProfitShareRate, currentEventRate } = useAgent()
  const [tab, setTab] = useState('0')
  const [idFilter, setIdFilter] = useState('all')
  const [editUid, setEditUid] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [remarks, setRemarks] = useState<Record<string, string>>({})

  const [editRateAgent, setEditRateAgent] = useState<SubAgent | null>(null)
  const [editFF, setEditFF] = useState('')
  const [editPS, setEditPS] = useState('')
  const [editEvent, setEditEvent] = useState('')
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({})

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
    {
      key: 'ffUsdt', label: 'FF 返佣(USDT)',
      render: r => r.isSelf ? '—' : r.flatFeeCommUsdt.toFixed(2),
      sortable: true, sortKey: r => r.flatFeeCommUsdt,
    },
    {
      key: 'ffUsdc', label: 'FF 返佣(USDC)',
      render: r => r.isSelf ? '—' : r.flatFeeCommUsdc.toFixed(2),
      sortable: true, sortKey: r => r.flatFeeCommUsdc,
    },
    {
      key: 'psUsdt', label: 'PS 返佣(USDT)',
      render: r => r.isSelf ? '—' : r.profitShareCommUsdt.toFixed(2),
      sortable: true, sortKey: r => r.profitShareCommUsdt,
    },
    {
      key: 'psUsdc', label: 'PS 返佣(USDC)',
      render: r => r.isSelf ? '—' : r.profitShareCommUsdc.toFixed(2),
      sortable: true, sortKey: r => r.profitShareCommUsdc,
    },
    {
      key: 'evComm', label: '事件返佣(USDT)',
      render: r => r.isSelf ? '—' : r.eventCommission.toFixed(2),
      sortable: true, sortKey: r => r.eventCommission,
    },
    {
      key: 'totalComm', label: '总返佣(USDT等值)',
      render: r => r.isSelf ? '—' : (
        <Text fontFamily="ISB" color="theme">
          {(r.flatFeeCommUsdt + r.flatFeeCommUsdc + r.profitShareCommUsdt + r.profitShareCommUsdc + r.eventCommission).toFixed(2)}
        </Text>
      ),
      sortable: true,
      sortKey: r => r.flatFeeCommUsdt + r.flatFeeCommUsdc + r.profitShareCommUsdt + r.profitShareCommUsdc + r.eventCommission,
    },
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

  const validateRate = () => {
    const e: Record<string, string> = {}
    const f = parseFloat(editFF); const p = parseFloat(editPS); const ev = parseFloat(editEvent)
    if (!editFF || isNaN(f)) e.ff = '请输入'
    else if (f <= 0) e.ff = '必须大于 0'
    else if (f >= currentFlatFeeRate) e.ff = `必须 < ${currentFlatFeeRate}%`
    if (!editPS || isNaN(p)) e.ps = '请输入'
    else if (p <= 0) e.ps = '必须大于 0'
    else if (p >= currentProfitShareRate) e.ps = `必须 < ${currentProfitShareRate}%`
    if (!editEvent || isNaN(ev)) e.event = '请输入'
    else if (ev <= 0) e.event = '必须大于 0'
    else if (ev >= currentEventRate) e.event = `必须 < ${currentEventRate}%`
    setRateErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSaveRate = () => {
    if (!validateRate() || !editRateAgent) return
    setEditRateAgent(null)
    setEditFF(''); setEditPS(''); setEditEvent('')
  }

  const subAgentColumns: Column<SubAgent>[] = [
    { key: 'uid', label: 'UID', render: r => r.uid },
    { key: 'nick', label: '昵称', render: r => r.nickname },
    { key: 'ffRate', label: 'FF 比例', render: r => `${r.flatFeeRate.toFixed(2)}%` },
    { key: 'psRate', label: 'PS 比例', render: r => `${r.profitShareRate.toFixed(4)}%` },
    { key: 'eventRate', label: '事件比例', render: r => `${r.eventRate.toFixed(2)}%` },
    { key: 'time', label: '注册时间', render: r => r.registeredAt },
    {
      key: 'directUsdt', label: '子代理返佣(USDT)',
      render: r => r.directCommUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      sortable: true, sortKey: r => r.directCommUsdt,
    },
    {
      key: 'directUsdc', label: '子代理返佣(USDC)',
      render: r => r.directCommUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      sortable: true, sortKey: r => r.directCommUsdc,
    },
    {
      key: 'rewardUsdt', label: '平台奖励(USDT)',
      render: r => r.platformRewardUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      sortable: true, sortKey: r => r.platformRewardUsdt,
    },
    {
      key: 'rewardUsdc', label: '平台奖励(USDC)',
      render: r => r.platformRewardUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      sortable: true, sortKey: r => r.platformRewardUsdc,
    },
    {
      key: 'action', label: '操作',
      render: r => (
        <Flex gap="12px">
          <Link to={`/revenue?source_uid=${r.uid}`}>
            <Text fontSize="14px" color="theme" fontFamily="ISB" cursor="pointer">贡献明细</Text>
          </Link>
          <Box
            as="button" fontSize="14px" fontFamily="ISB" cursor={isFrozen ? 'not-allowed' : 'pointer'}
            color={isFrozen ? 'gray.100' : 'theme'}
            onClick={() => {
              if (isFrozen) return
              setEditRateAgent(r)
              setEditFF(r.flatFeeRate.toFixed(2))
              setEditPS(r.profitShareRate.toFixed(4))
              setEditEvent(r.eventRate.toFixed(2))
            }}
          >
            修改比例
          </Box>
        </Flex>
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

  const rateFormInput = (label: string, val: string, onChange: (v: string) => void, step: string, error?: string, extra?: string) => (
    <Box>
      <Text fontSize="14px" color="gray.100" mb="6px">{label}{extra && <Text as="span" color="gray.200" fontSize="12px"> {extra}</Text>}</Text>
      <Box as="input" w="100%" h="40px" bg="bg.100" border="1px solid"
        borderColor={error ? 'red.100' : 'border.100'} borderRadius="6px" px={3}
        fontSize="14px" color="text.100" outline="none" type="number" step={step}
        value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        _focus={{ borderColor: error ? 'red.100' : 'theme' }} />
      {error && <Text fontSize="12px" color="red.100" mt="4px">{error}</Text>}
    </Box>
  )

  return (
    <Box>
      <Tabs.Root value={tab} onValueChange={e => setTab(e.value)}>
        <Tabs.List borderBottom="1px solid" borderColor="border.100" mb="16px">
          {tabTrigger('0', '直接邀请人')}
          {tabTrigger('1', '子代理概览')}
        </Tabs.List>

        <Tabs.Content value="0">
          <InlineStatsBar stats={globalStats} />

          <FilterBar onSearch={() => {}} onReset={() => { setIdFilter('all') }}>
            <FilterItem label="用户身份">
              <Select value={idFilter} onChange={setIdFilter} options={[
                { label: '全部', value: 'all' }, { label: '普通用户', value: 'regular' },
                { label: '子代理', value: 'sub_agent' },
              ]} />
            </FilterItem>
          </FilterBar>

          {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStats} />}

          <DataTable data={filteredInvitees} columns={inviteeColumns} />
        </Tabs.Content>

        <Tabs.Content value="1">
          <InlineStatsBar stats={subAgentGlobalStats} />
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

      {editRateAgent && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setEditRateAgent(null)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)" onClick={e => e.stopPropagation()}>
            <Text fontFamily="ISB" fontSize="18px" mb="4px">修改返佣比例</Text>
            <Text fontSize="13px" color="gray.100" mb="16px">子代理: {editRateAgent.nickname}（{editRateAgent.uid}）</Text>
            <Flex direction="column" gap="16px">
              {rateFormInput('Flat Fee 返佣比例（%）', editFF, setEditFF, '0.01', rateErrors.ff, `上限: ${currentFlatFeeRate}%`)}
              {rateFormInput('Profit Share 返佣比例（%）', editPS, setEditPS, '0.0001', rateErrors.ps, `上限: ${currentProfitShareRate}%`)}
              {rateFormInput('事件合约返佣比例（%）', editEvent, setEditEvent, '0.01', rateErrors.event, `上限: ${currentEventRate}%`)}
            </Flex>
            <Flex justify="flex-end" gap="8px" mt="20px">
              <Box as="button" px="20px" py="8px" bg="bg.200" color="text.100" border="1px solid" borderColor="border.100"
                borderRadius="6px" fontSize="14px" cursor="pointer" onClick={() => setEditRateAgent(null)}
                _hover={{ bg: 'bg.100' }}>取消</Box>
              <Box as="button" px="20px" py="8px" bg="nav.bg" color="#fff" borderRadius="6px" fontSize="14px"
                fontFamily="ISB" cursor="pointer" onClick={handleSaveRate} _hover={{ opacity: 0.85 }}>保存</Box>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  )
}
