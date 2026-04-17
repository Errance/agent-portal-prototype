import { useMemo, useState } from 'react'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import { FilterBar, Select, FilterItem } from '@/components/shared/FilterBar'
import PillButton from '@/components/shared/PillButton'
import ModalShell from '@/components/shared/ModalShell'
import RateFormInput from '@/components/shared/RateFormInput'
import { ChakraInput } from '@/components/shared/styled'
import { useAgent } from '@/context/AgentContext'
import { useInvitees, useSubAgents } from '@/api/queries/friends'
import { toError } from '@/api/client'
import type { Invitee, SubAgent } from '@/types/domain'
import { fmtAmount } from '@/utils/fmtAmount'
import { toNumber } from '@/utils/parse'
import { maskUid, truncateText } from '@/utils/mask'
import { validateRate, type RateErrors } from '@/utils/validateRate'
import Decimal from 'decimal.js-light'

interface InviteeAggregate {
  count: number
  deposited: number
  traded: number
}

/**
 * 单次 reduce 聚合 Invitee 统计（见审计 P5）。
 */
function aggregateInvitees(list: Invitee[]): InviteeAggregate {
  let count = 0, deposited = 0, traded = 0
  for (const u of list) {
    if (u.isSelf) continue
    count++
    if (u.depositStatus === 'deposited') deposited++
    if (u.tradeStatus === 'traded') traded++
  }
  return { count, deposited, traded }
}

interface SubAgentAggregate {
  total: number
  directUsdt: Decimal
  directUsdc: Decimal
  rewardUsdt: Decimal
  rewardUsdc: Decimal
}

function aggregateSubAgents(list: SubAgent[]): SubAgentAggregate {
  let directUsdt = new Decimal(0), directUsdc = new Decimal(0)
  let rewardUsdt = new Decimal(0), rewardUsdc = new Decimal(0)
  for (const a of list) {
    directUsdt = directUsdt.plus(a.directCommUsdt)
    directUsdc = directUsdc.plus(a.directCommUsdc)
    rewardUsdt = rewardUsdt.plus(a.platformRewardUsdt)
    rewardUsdc = rewardUsdc.plus(a.platformRewardUsdc)
  }
  return { total: list.length, directUsdt, directUsdc, rewardUsdt, rewardUsdc }
}

export default function FriendsCenter() {
  const { selfRebateEnabled, isFrozen, currentFlatFeeRate, currentProfitShareRate, currentEventRate } = useAgent()
  const inviteesQ = useInvitees()
  const subAgentsQ = useSubAgents()
  const invitees = inviteesQ.data ?? []
  const subAgents = subAgentsQ.data ?? []

  const [tab, setTab] = useState('0')
  const [idFilter, setIdFilter] = useState('all')
  const [editUid, setEditUid] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [remarks, setRemarks] = useState<Record<string, string>>({})

  const [editRateAgent, setEditRateAgent] = useState<SubAgent | null>(null)
  const [editFF, setEditFF] = useState('')
  const [editPS, setEditPS] = useState('')
  const [editEvent, setEditEvent] = useState('')
  const [rateErrors, setRateErrors] = useState<RateErrors>({})

  const hasFilter = idFilter !== 'all'

  const filteredInvitees = useMemo(() => invitees.filter(u => {
    if (!selfRebateEnabled && u.isSelf) return false
    if (idFilter === 'regular' && u.identityType !== 'regular') return false
    // 修复 S3：SELF 仅在自返佣开关开启时保留；其余用户按 identityType 严格过滤
    if (idFilter === 'sub_agent' && u.identityType !== 'sub_agent') return false
    return true
  }), [invitees, selfRebateEnabled, idFilter])

  const globalStats = useMemo(() => {
    const a = aggregateInvitees(invitees)
    return [
      { label: '注册人数', value: a.count },
      { label: '已充值', value: a.deposited },
      { label: '已交易', value: a.traded },
    ]
  }, [invitees])

  const subAgentGlobalStats = useMemo(() => {
    const a = aggregateSubAgents(subAgents)
    return [
      { label: '子代理总数', value: a.total, unit: '人' },
      { label: '子代理返佣(USDT)', value: fmtAmount(a.directUsdt), unit: 'USDT' },
      { label: '子代理返佣(USDC)', value: fmtAmount(a.directUsdc), unit: 'USDC' },
      { label: '平台奖励(USDT)', value: fmtAmount(a.rewardUsdt), unit: 'USDT' },
      { label: '平台奖励(USDC)', value: fmtAmount(a.rewardUsdc), unit: 'USDC' },
    ]
  }, [subAgents])

  const filteredStats = useMemo(() => {
    const a = aggregateInvitees(filteredInvitees)
    return [
      { label: '人数', value: a.count, unit: '人' },
      { label: '已充值', value: a.deposited, unit: '人' },
      { label: '已交易', value: a.traded, unit: '人' },
    ]
  }, [filteredInvitees])

  const inviteeColumns: Column<Invitee>[] = useMemo(() => [
    {
      key: 'user', label: '用户 (UID)',
      render: r => (
        <Box>
          <Text color={r.isSelf ? 'theme' : 'text.100'} fontFamily="ISB" fontSize="15px"
            title={r.isSelf ? undefined : r.uid}>
            {r.isSelf ? '我自己' : maskUid(r.uid)}
          </Text>
          <Text fontSize="12px" color="gray.200" mt="2px">
            {r.isSelf ? '代理商' : r.identityType === 'sub_agent' ? '子代理' : '普通用户'} · {r.registeredAt.split(' ')[0]}
          </Text>
          {r.isSelf && selfRebateEnabled && (
            <Text fontSize="12px" color="gray.100" mt="2px">
              自返佣: {fmtAmount(r.selfRebateAmount ?? 0)} USDT
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
      key: 'ffComm', label: 'FF 返佣', align: 'right',
      render: r => r.isSelf ? '—' : (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.flatFeeCommUsdt)} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.flatFeeCommUsdc)} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => toNumber(r.flatFeeCommUsdt), minW: '140px',
    },
    {
      key: 'psComm', label: 'PS 返佣', align: 'right',
      render: r => r.isSelf ? '—' : (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.profitShareCommUsdt)} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.profitShareCommUsdc)} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => toNumber(r.profitShareCommUsdt), minW: '140px',
    },
    {
      key: 'evComm', label: '事件返佣', align: 'right',
      render: r => r.isSelf ? '—' : (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.eventCommission)} USDT</Text>
        </Box>
      ),
      sortable: true, sortKey: r => toNumber(r.eventCommission), minW: '120px',
    },
    {
      key: 'remark', label: '备注',
      render: r => (
        <Box>
          <Text color="text.100" title={remarks[r.uid] || r.remark || ''}>{truncateText(remarks[r.uid] || r.remark, 18)}</Text>
          {!r.isSelf && (
            <Box mt="6px">
              <PillButton
                variant="neutral"
                disabled={isFrozen}
                onClick={() => {
                  setEditUid(r.uid)
                  setEditVal(remarks[r.uid] || r.remark)
                }}
              >
                编辑备注
              </PillButton>
            </Box>
          )}
        </Box>
      ),
    },
  ], [selfRebateEnabled, remarks, isFrozen])

  const handleSaveRate = () => {
    const r = validateRate({ flatFee: editFF, profitShare: editPS, event: editEvent }, {
      flatFeeRate: currentFlatFeeRate,
      profitShareRate: currentProfitShareRate,
      eventRate: currentEventRate,
    })
    if (!r.ok) {
      setRateErrors(r.errors)
      return
    }
    if (!editRateAgent) return
    setRateErrors({})
    setEditRateAgent(null)
    setEditFF(''); setEditPS(''); setEditEvent('')
  }

  const subAgentColumns: Column<SubAgent>[] = useMemo(() => [
    {
      key: 'user', label: '子代理',
      render: r => (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="15px" title={r.uid}>{maskUid(r.uid)}</Text>
          <Text fontSize="12px" color="gray.200" mt="2px" title={r.nickname}>{truncateText(r.nickname, 16)} · {r.registeredAt.split(' ')[0]}</Text>
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
      key: 'direct', label: '子代理返佣', align: 'right',
      render: r => (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.directCommUsdt, { style: 'thousand' })} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.directCommUsdc, { style: 'thousand' })} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => toNumber(r.directCommUsdt), minW: '160px',
    },
    {
      key: 'reward', label: '平台奖励', align: 'right',
      render: r => (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.platformRewardUsdt, { style: 'thousand' })} USDT</Text>
          <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.platformRewardUsdc, { style: 'thousand' })} USDC</Text>
        </Box>
      ),
      sortable: true, sortKey: r => toNumber(r.platformRewardUsdt), minW: '160px',
    },
    {
      key: 'action', label: '操作', align: 'right',
      render: r => (
        <Flex gap="8px" justify="flex-end">
          <PillButton
            variant="neutral" disabled={isFrozen}
            onClick={() => {
              setEditRateAgent(r)
              setEditFF(r.flatFeeRate.toFixed(2))
              setEditPS(r.profitShareRate.toFixed(4))
              setEditEvent(r.eventRate.toFixed(2))
              setRateErrors({})
            }}
          >
            修改比例
          </PillButton>
          <PillButton variant="primary" to={`/revenue?source_uid=${r.uid}`}>贡献明细</PillButton>
        </Flex>
      ),
      width: '1%',
    },
  ], [isFrozen])

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

          <DataTable
            data={filteredInvitees}
            columns={inviteeColumns}
            getRowKey={r => r.uid}
            isLoading={inviteesQ.isLoading}
            error={inviteesQ.isError ? { message: toError(inviteesQ.error).message, retry: () => inviteesQ.refetch() } : null}
          />
        </Tabs.Content>

        <Tabs.Content value="1">
          <InlineStatsBar stats={subAgentGlobalStats} />
          <DataTable
            data={subAgents}
            columns={subAgentColumns}
            getRowKey={r => r.uid}
            isLoading={subAgentsQ.isLoading}
            error={subAgentsQ.isError ? { message: toError(subAgentsQ.error).message, retry: () => subAgentsQ.refetch() } : null}
          />
        </Tabs.Content>
      </Tabs.Root>

      <ModalShell open={!!editUid} onClose={() => setEditUid(null)} width="440px">
        <Text fontFamily="ISB" fontSize="20px" mb="24px" color="text.100" letterSpacing="-0.5px">编辑备注</Text>
        <Text fontSize="13px" color="gray.100" mb="8px">UID: {editUid}</Text>
        <ChakraInput w="100%" h="40px" bg="bg.200" border="1px solid" borderColor="border.100"
          borderRadius="4px" px={3} fontSize="14px" color="text.100" outline="none"
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          transition="all 0.2s"
          _focus={{ borderColor: 'theme', boxShadow: '0 0 0 1px rgba(10,186,181,0.5)' }}
        />
        <Flex justify="flex-end" gap="12px" mt="32px">
          <PillButton variant="ghost" size="lg" shape="rect" onClick={() => setEditUid(null)}>取消</PillButton>
          <PillButton variant="solid" size="lg" shape="rect" onClick={() => {
            if (!editUid) return
            setRemarks(prev => ({ ...prev, [editUid]: editVal }))
            setEditUid(null)
          }}>保存</PillButton>
        </Flex>
      </ModalShell>

      <ModalShell open={!!editRateAgent} onClose={() => setEditRateAgent(null)} width="480px">
        <Text fontFamily="ISB" fontSize="20px" mb="8px" color="text.100" letterSpacing="-0.5px">修改返佣比例</Text>
        {editRateAgent && (
          <Text fontSize="13px" color="gray.100" mb="24px">
            子代理: <Text as="span" color="text.100">{editRateAgent.nickname}</Text> ({editRateAgent.uid})
          </Text>
        )}
        <Flex direction="column" gap="20px">
          <RateFormInput label="Flat Fee 返佣比例（%）" value={editFF} onChange={setEditFF} step="0.01" error={rateErrors.ff} extra={`上限: ${currentFlatFeeRate}%`} />
          <RateFormInput label="Profit Share 返佣比例（%）" value={editPS} onChange={setEditPS} step="0.0001" error={rateErrors.ps} extra={`上限: ${currentProfitShareRate}%`} />
          <RateFormInput label="事件合约返佣比例（%）" value={editEvent} onChange={setEditEvent} step="0.01" error={rateErrors.event} extra={`上限: ${currentEventRate}%`} />
        </Flex>
        <Flex justify="flex-end" gap="12px" mt="32px">
          <PillButton variant="ghost" size="lg" shape="rect" onClick={() => setEditRateAgent(null)}>取消</PillButton>
          <PillButton variant="solid" size="lg" shape="rect" onClick={handleSaveRate}>保存</PillButton>
        </Flex>
      </ModalShell>
    </Box>
  )
}
