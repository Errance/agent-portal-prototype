import { useState, useMemo } from 'react'
import { Box, Flex, Text, Tabs, HStack } from '@chakra-ui/react'
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
      key: 'user', label: '用户 (UID)',
      render: r => (
        <Box>
          <Text color={r.isSelf ? 'theme' : 'text.100'} fontFamily="ISB" fontSize="15px">
            {r.isSelf ? '我自己' : r.uid}
          </Text>
          <Text fontSize="12px" color="gray.200" mt="2px">
            {r.isSelf ? '代理商' : r.identityType === 'sub_agent' ? '子代理' : '普通用户'} · {r.registeredAt.split(' ')[0]}
          </Text>
          {r.isSelf && selfRebateEnabled && (
            <Text fontSize="12px" color="gray.100" mt="2px">
              自返佣: {r.selfRebateAmount?.toFixed(2)} USDT
            </Text>
          )}
        </Box>
      ),
    },
    {
      key: 'status', label: '用户状态',
      render: r => (
        <Flex direction="column" gap="4px" align="flex-start">
          <StatusBadge type="deposit" value={r.depositStatus} />
          <StatusBadge type="trade" value={r.tradeStatus} />
        </Flex>
      ),
    },
    {
      key: 'ffComm', label: 'FF 返佣',
      align: 'right',
      render: r => r.isSelf ? '—' : (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{r.flatFeeCommUsdt.toFixed(2)} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{r.flatFeeCommUsdc.toFixed(2)} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => r.flatFeeCommUsdt,
      minW: '140px',
    },
    {
      key: 'psComm', label: 'PS 返佣',
      align: 'right',
      render: r => r.isSelf ? '—' : (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{r.profitShareCommUsdt.toFixed(2)} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{r.profitShareCommUsdc.toFixed(2)} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => r.profitShareCommUsdt,
      minW: '140px',
    },
    {
      key: 'evComm', label: '事件返佣',
      align: 'right',
      render: r => r.isSelf ? '—' : (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{r.eventCommission.toFixed(2)} USDT</Text>
        </Box>
      ),
      sortable: true, sortKey: r => r.eventCommission,
      minW: '120px',
    },
    {
      key: 'totalComm', label: '总返佣(等值)',
      align: 'right',
      render: r => r.isSelf ? '—' : (
        <Text fontFamily="ISB" color="theme" fontSize="16px">
          {(r.flatFeeCommUsdt + r.flatFeeCommUsdc + r.profitShareCommUsdt + r.profitShareCommUsdc + r.eventCommission).toFixed(2)}
        </Text>
      ),
      sortable: true,
      sortKey: r => r.flatFeeCommUsdt + r.flatFeeCommUsdc + r.profitShareCommUsdt + r.profitShareCommUsdc + r.eventCommission,
      minW: '120px',
    },
    {
      key: 'remark', label: '备注',
      render: r => (
        <Box>
          <Text color="text.100">{remarks[r.uid] || r.remark || '—'}</Text>
          {!r.isSelf && (
            <Box mt="6px">
              <Box
                as="button" px="10px" py="2px" borderRadius="full" fontSize="11px" fontFamily="ISB"
                bg="bg.200" border="1px solid" borderColor="border.200"
                color={isFrozen ? 'gray.200' : 'text.100'} cursor={isFrozen ? 'not-allowed' : 'pointer'}
                onClick={() => {
                  if (isFrozen) return
                  setEditUid(r.uid)
                  setEditVal(remarks[r.uid] || r.remark)
                }}
                transition="all 0.2s" _hover={isFrozen ? {} : { bg: 'bg.300' }}
              >
                编辑备注
              </Box>
            </Box>
          )}
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
    {
      key: 'user', label: '子代理',
      render: r => (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.uid}</Text>
          <Text fontSize="12px" color="gray.200" mt="2px">{r.nickname} · {r.registeredAt.split(' ')[0]}</Text>
        </Box>
      ),
    },
    {
      key: 'ff', label: 'FF 返佣比例', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.flatFeeRate.toFixed(2)}%</Text>,
      sortable: true, sortKey: r => r.flatFeeRate,
    },
    {
      key: 'ps', label: 'PS 返佣比例', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.profitShareRate.toFixed(4)}%</Text>,
      sortable: true, sortKey: r => r.profitShareRate,
    },
    {
      key: 'ev', label: '事件返佣比例', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.eventRate.toFixed(2)}%</Text>,
      sortable: true, sortKey: r => r.eventRate,
    },
    {
      key: 'direct', label: '子代理返佣',
      align: 'right',
      render: r => (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{r.directCommUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{r.directCommUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => r.directCommUsdt,
      minW: '160px',
    },
    {
      key: 'reward', label: '平台奖励',
      align: 'right',
      render: r => (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{r.platformRewardUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{r.platformRewardUsdc.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => r.platformRewardUsdt,
      minW: '160px',
    },
    {
      key: 'action', label: '操作',
      align: 'right',
      render: r => (
        <Flex gap="8px" justify="flex-end">
          <Box
            as="button" px="12px" py="4px" borderRadius="full" fontSize="12px" fontFamily="ISB"
            bg="bg.200" border="1px solid" borderColor="border.200" color={isFrozen ? 'gray.200' : 'text.100'}
            cursor={isFrozen ? 'not-allowed' : 'pointer'}
            onClick={() => {
              if (isFrozen) return
              setEditRateAgent(r)
              setEditFF(r.flatFeeRate.toFixed(2))
              setEditPS(r.profitShareRate.toFixed(4))
              setEditEvent(r.eventRate.toFixed(2))
            }}
            transition="all 0.2s" _hover={isFrozen ? {} : { bg: 'bg.300' }}
          >
            修改比例
          </Box>
          <Link to={`/revenue?source_uid=${r.uid}`}>
            <Box as="button" px="12px" py="4px" borderRadius="full" fontSize="12px" fontFamily="ISB"
              bg="rgba(10,186,181,0.1)" color="theme" cursor="pointer"
              transition="all 0.2s" _hover={{ bg: 'rgba(10,186,181,0.2)' }}>
              贡献明细
            </Box>
          </Link>
        </Flex>
      ),
      width: '1%',
    },
  ]

  const tabTrigger = (val: string, label: string) => (
    <Tabs.Trigger value={val} px="16px" py="16px" fontSize="15px"
      color={tab === val ? 'theme' : 'gray.100'}
      fontFamily="ISB" bg="transparent" border="none"
      borderBottom="2px solid"
      borderColor={tab === val ? 'theme' : 'transparent'}
      _hover={{ color: tab === val ? 'theme' : 'text.100' }}
      transition="all 0.2s">
      {label}
    </Tabs.Trigger>
  )

  const rateFormInput = (label: string, val: string, onChange: (v: string) => void, step: string, error?: string, extra?: string) => (
    <Box>
      <Text fontSize="12px" color="gray.100" mb="8px" textTransform="uppercase" letterSpacing="0.5px">
        {label}{extra && <Text as="span" color="gray.200"> {extra}</Text>}
      </Text>
      <Box as="input" w="100%" h="40px" bg="bg.200" border="1px solid"
        borderColor={error ? 'red.100' : 'border.100'} borderRadius="4px" px={3}
        fontSize="14px" color="text.100" outline="none" type="number" step={step}
        value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        transition="all 0.2s"
        _focus={{ borderColor: error ? 'red.100' : 'theme', boxShadow: error ? 'none' : '0 0 0 1px rgba(10,186,181,0.5)' }} />
      {error && <Text fontSize="12px" color="red.100" mt="4px">{error}</Text>}
    </Box>
  )

  return (
    <Box>
      <Tabs.Root value={tab} onValueChange={e => setTab(e.value)}>
        <Tabs.List borderBottom="1px solid" borderColor="border.100" mb="24px" gap="16px">
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
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.5)" backdropFilter="blur(4px)" zIndex={300} onClick={() => setEditUid(null)}>
          <Box
            position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.200" borderRadius="8px" p="32px" w="440px"
            boxShadow="0 16px 40px rgba(0,0,0,0.1)"
            onClick={e => e.stopPropagation()}
          >
            <Text fontFamily="ISB" fontSize="20px" mb="24px" color="text.100" letterSpacing="-0.5px">编辑备注</Text>
            <Text fontSize="13px" color="gray.100" mb="8px">UID: {editUid}</Text>
            <Box
              as="input" w="100%" h="40px" bg="bg.200" border="1px solid" borderColor="border.100"
              borderRadius="4px" px={3} fontSize="14px" color="text.100" outline="none"
              value={editVal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditVal(e.target.value)}
              transition="all 0.2s"
              _focus={{ borderColor: 'theme', boxShadow: '0 0 0 1px rgba(10,186,181,0.5)' }}
            />
            <Flex justify="flex-end" gap="12px" mt="32px">
              <Box as="button" px="24px" py="10px" bg="transparent" color="text.100" border="1px solid" borderColor="border.100"
                borderRadius="4px" fontSize="13px" cursor="pointer" onClick={() => setEditUid(null)}
                transition="all 0.2s" _hover={{ bg: 'bg.100', borderColor: 'border.200' }}>取消</Box>
              <Box as="button" px="24px" py="10px" bg="theme" color="#FFFFFF" borderRadius="4px" fontSize="13px"
                fontFamily="ISB" cursor="pointer" onClick={() => {
                  setRemarks(prev => ({ ...prev, [editUid]: editVal }))
                  setEditUid(null)
                }} transition="all 0.2s" _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}>保存</Box>
            </Flex>
          </Box>
        </Box>
      )}

      {editRateAgent && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.5)" backdropFilter="blur(4px)" zIndex={300} onClick={() => setEditRateAgent(null)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.200" borderRadius="8px" p="32px" w="480px"
            boxShadow="0 16px 40px rgba(0,0,0,0.1)" onClick={e => e.stopPropagation()}>
            <Text fontFamily="ISB" fontSize="20px" mb="8px" color="text.100" letterSpacing="-0.5px">修改返佣比例</Text>
            <Text fontSize="13px" color="gray.100" mb="24px">子代理: <Text as="span" color="text.100">{editRateAgent.nickname}</Text> ({editRateAgent.uid})</Text>
            <Flex direction="column" gap="20px">
              {rateFormInput('Flat Fee 返佣比例（%）', editFF, setEditFF, '0.01', rateErrors.ff, `上限: ${currentFlatFeeRate}%`)}
              {rateFormInput('Profit Share 返佣比例（%）', editPS, setEditPS, '0.0001', rateErrors.ps, `上限: ${currentProfitShareRate}%`)}
              {rateFormInput('事件合约返佣比例（%）', editEvent, setEditEvent, '0.01', rateErrors.event, `上限: ${currentEventRate}%`)}
            </Flex>
            <Flex justify="flex-end" gap="12px" mt="32px">
              <Box as="button" px="24px" py="10px" bg="transparent" color="text.100" border="1px solid" borderColor="border.100"
                borderRadius="4px" fontSize="13px" cursor="pointer" onClick={() => setEditRateAgent(null)}
                transition="all 0.2s" _hover={{ bg: 'bg.100', borderColor: 'border.200' }}>取消</Box>
              <Box as="button" px="24px" py="10px" bg="theme" color="#FFFFFF" borderRadius="4px" fontSize="13px"
                fontFamily="ISB" cursor="pointer" onClick={handleSaveRate}
                transition="all 0.2s" _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}>保存</Box>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  )
}
