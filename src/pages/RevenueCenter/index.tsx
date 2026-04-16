import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import FilteredStatsPanel from '@/components/shared/FilteredStatsPanel'
import { FilterBar, Select, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { dailyRevenue, commissionRecords, settlementConfig } from '@/mock/data'
import type { DailyRevenue, CommissionRecord } from '@/mock/types'

export default function RevenueCenter() {
  const [params] = useSearchParams()
  const preSourceUid = params.get('source_uid') || ''

  const [tab, setTab] = useState('0')
  const [productLine, setProductLine] = useState('all')
  const [settlement, setSettlement] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const settlementDisabled = productLine === 'event'
  const effectiveSettlement = settlementDisabled ? 'all' : settlement

  const totalCommission = commissionRecords.reduce((s, r) => r.payoutStatus === 'paid' ? s + r.commissionAmount : s, 0)

  const filteredRecords = useMemo(() => {
    let data = commissionRecords
    if (preSourceUid) data = data.filter(r => r.sourceUid === preSourceUid)
    if (productLine !== 'all') data = data.filter(r => r.productLine === (productLine === 'perpetual' ? 'perpetual' : 'event'))
    if (effectiveSettlement !== 'all') data = data.filter(r => r.settlementType === effectiveSettlement)
    return data
  }, [productLine, effectiveSettlement, preSourceUid])

  const filteredStats = useMemo(() => {
    const total = filteredRecords.reduce((s, r) => s + r.commissionAmount, 0)
    const vol = filteredRecords.reduce((s, r) => s + (r.tradeVolume ?? 0), 0)
    const perp = filteredRecords.filter(r => r.productLine === 'perpetual').reduce((s, r) => s + r.commissionAmount, 0)
    const evt = filteredRecords.filter(r => r.productLine === 'event').reduce((s, r) => s + r.commissionAmount, 0)
    return [
      { label: '总返佣金额', value: total.toFixed(2), unit: 'USDT' },
      { label: '总交易额', value: vol.toFixed(2), unit: 'USDT' },
      { label: '记录条数', value: filteredRecords.length },
      { label: '永续合约返佣', value: perp.toFixed(2), unit: 'USDT' },
      { label: '事件合约返佣', value: evt.toFixed(2), unit: 'USDT' },
    ]
  }, [filteredRecords])

  const dailyColumns: Column<DailyRevenue>[] = [
    { key: 'date', label: '日期', render: r => r.date },
    { key: 'commission', label: '佣金（USDT）', render: r => r.commission.toFixed(2), sortable: true, sortKey: r => r.commission },
    { key: 'volume', label: '交易额（USDT）', render: r => r.tradeVolume.toLocaleString('en-US', { minimumFractionDigits: 2 }), sortable: true, sortKey: r => r.tradeVolume },
    { key: 'perp', label: '永续合约返佣', render: r => r.perpCommission.toFixed(2) },
    { key: 'ff', label: 'Flat Fee 返佣', render: r => r.flatFeeCommission.toFixed(2) },
    { key: 'ps', label: 'Profit Share 返佣', render: r => r.profitShareCommission.toFixed(2) },
    { key: 'event', label: '事件合约返佣', render: r => r.eventCommission.toFixed(2) },
    { key: 'status', label: '发放状态', render: r => <StatusBadge type="payout" value={r.payoutStatus} /> },
  ]

  const recordColumns: Column<CommissionRecord>[] = [
    { key: 'time', label: '时间', render: r => r.time },
    { key: 'type', label: '来源类型', render: r => r.sourceType === 'direct' ? '直推返佣' : '平台奖励' },
    { key: 'source', label: '来源用户', render: r => r.sourceUid ?? '—' },
    { key: 'pl', label: '产品线', render: r => r.productLine === 'perpetual' ? '永续合约' : '事件合约' },
    { key: 'st', label: '结算方式', render: r => r.settlementType === 'flat_fee' ? 'Flat Fee' : r.settlementType === 'profit_share' ? 'Profit Share' : '—' },
    { key: 'vol', label: '交易额（USDT）', render: r => r.tradeVolume !== null ? r.tradeVolume.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—' },
    { key: 'amt', label: '返佣金额', render: r => r.commissionAmount.toFixed(2), sortable: true, sortKey: r => r.commissionAmount },
    { key: 'coin', label: '结算币种', render: r => r.settlementCoin },
    { key: 'status', label: '发放状态', render: r => <StatusBadge type="payout" value={r.payoutStatus} /> },
  ]

  const tabTrigger = (val: string, label: string) => (
    <Tabs.Trigger value={val} px={4} py={3} fontSize="sm"
      color={tab === val ? 'text.100' : 'gray.100'}
      fontFamily={tab === val ? 'ISB' : undefined}
      borderBottom="2px solid" borderColor={tab === val ? 'theme' : 'transparent'}
      _hover={{ color: 'text.100' }}>
      {label}
    </Tabs.Trigger>
  )

  return (
    <Box>
      <FilterBar
        onSearch={() => {}}
        onReset={() => { setProductLine('all'); setSettlement('all'); setDateFrom(''); setDateTo('') }}
      >
        <FilterItem label="产品线">
          <Select value={productLine} onChange={v => { setProductLine(v); if (v === 'event') setSettlement('all') }} options={[
            { label: '全部', value: 'all' }, { label: '永续合约', value: 'perpetual' }, { label: '事件合约', value: 'event' },
          ]} />
        </FilterItem>
        <FilterItem label="结算方式">
          <Select value={effectiveSettlement} onChange={setSettlement} disabled={settlementDisabled} options={[
            { label: '全部', value: 'all' }, { label: 'Flat Fee', value: 'flat_fee' }, { label: 'Profit Share', value: 'profit_share' },
          ]} />
        </FilterItem>
        <FilterItem label="统计时间">
          <DateRangeInput from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </FilterItem>
      </FilterBar>

      {preSourceUid && (
        <Box bg="green.200" border="1px solid" borderColor="theme" px={4} py={2} borderRadius="md" mb={4}>
          <Text fontSize="sm" color="theme">当前筛选：来源用户 = {preSourceUid}</Text>
        </Box>
      )}

      <Box bg="bg.200" border="1px solid" borderColor="border.100" borderRadius={{ base: '0', md: 'xl' }} p={5} mb={4}>
        <Text fontSize="xs" color="gray.100" mb={1}>累计返佣（USDT）</Text>
        <Text fontSize="2xl" fontFamily="ISB" color="text.100">{totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        <Text fontSize="xs" color="gray.200" mt={1}>返佣实时到账</Text>
      </Box>

      <Box mb={6}>
        <FilteredStatsPanel title="数据统计" stats={filteredStats} />
      </Box>

      <Tabs.Root value={tab} onValueChange={e => setTab(e.value)}>
        <Tabs.List borderBottom="1px solid" borderColor="border.100" mb={4}>
          {tabTrigger('0', '日明细表')}
          {tabTrigger('1', '返佣记录')}
          {tabTrigger('2', '结算方式配置')}
        </Tabs.List>

        <Tabs.Content value="0">
          <DataTable
            data={dailyRevenue} columns={dailyColumns}
            footer={<Text fontSize="xs" color="gray.200" mt={2}>佣金包含直推返佣和平台奖励，交易额仅统计直推用户的交易，两者不构成简单的比例关系。</Text>}
          />
        </Tabs.Content>
        <Tabs.Content value="1">
          <DataTable data={filteredRecords} columns={recordColumns} />
        </Tabs.Content>
        <Tabs.Content value="2">
          <Box bg="bg.200" border="1px solid" borderColor="border.100" borderRadius={{ base: '0', md: 'xl' }} p={5}>
            <Text fontFamily="ISB" mb={4}>当前结算方式配置</Text>
            <Flex gap={8}>
              <Box><Text fontSize="xs" color="gray.100">结算方式</Text><Text fontSize="sm" mt={1}>{settlementConfig.method}</Text></Box>
              <Box><Text fontSize="xs" color="gray.100">结算频率</Text><Text fontSize="sm" mt={1}>{settlementConfig.frequency}</Text></Box>
              <Box><Text fontSize="xs" color="gray.100">默认结算币种</Text><Text fontSize="sm" mt={1}>{settlementConfig.coin}</Text></Box>
            </Flex>
            <Text fontSize="xs" color="gray.200" mt={4}>结算方式由管理员在内部后台设定，代理商前台仅展示、不可修改。</Text>
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
