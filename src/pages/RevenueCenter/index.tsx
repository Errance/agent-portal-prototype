import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
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
  const [expandVolume, setExpandVolume] = useState(false)
  const [expandFee, setExpandFee] = useState(false)

  const settlementDisabled = productLine === 'event'
  const effectiveSettlement = settlementDisabled ? 'all' : settlement

  const hasFilter = productLine !== 'all' || effectiveSettlement !== 'all' || dateFrom !== '' || dateTo !== '' || preSourceUid !== ''

  const totalCommission = commissionRecords.reduce((s, r) => r.payoutStatus === 'paid' ? s + r.commissionAmount : s, 0)

  const globalBreakdown = useMemo(() => {
    const vol = commissionRecords.reduce((s, r) => s + (r.tradeVolume ?? 0), 0)
    const perp = commissionRecords.filter(r => r.productLine === 'perpetual').reduce((s, r) => s + r.commissionAmount, 0)
    const evt = commissionRecords.filter(r => r.productLine === 'event').reduce((s, r) => s + r.commissionAmount, 0)
    return [
      { label: '总交易额', value: vol.toFixed(2), unit: 'USDT' },
      { label: '永续合约', value: perp.toFixed(2), unit: 'USDT' },
      { label: '事件合约', value: evt.toFixed(2), unit: 'USDT' },
    ]
  }, [])

  const filteredRecords = useMemo(() => {
    let data = commissionRecords
    if (preSourceUid) data = data.filter(r => r.sourceUid === preSourceUid)
    if (productLine !== 'all') data = data.filter(r => r.productLine === (productLine === 'perpetual' ? 'perpetual' : 'event'))
    if (effectiveSettlement !== 'all') data = data.filter(r => r.settlementType === effectiveSettlement)
    return data
  }, [productLine, effectiveSettlement, preSourceUid])

  const filteredStatsData = useMemo(() => {
    const total = filteredRecords.reduce((s, r) => s + r.commissionAmount, 0)
    const vol = filteredRecords.reduce((s, r) => s + (r.tradeVolume ?? 0), 0)
    const perp = filteredRecords.filter(r => r.productLine === 'perpetual').reduce((s, r) => s + r.commissionAmount, 0)
    const evt = filteredRecords.filter(r => r.productLine === 'event').reduce((s, r) => s + r.commissionAmount, 0)
    return [
      { label: '返佣金额', value: total.toFixed(2), unit: 'USDT' },
      { label: '交易额', value: vol.toFixed(2), unit: 'USDT' },
      { label: '永续合约', value: perp.toFixed(2), unit: 'USDT' },
      { label: '事件合约', value: evt.toFixed(2), unit: 'USDT' },
      { label: '记录数', value: filteredRecords.length },
    ]
  }, [filteredRecords])

  const fmtNum = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2 })

  const dailyColumns: Column<DailyRevenue>[] = useMemo(() => {
    const cols: Column<DailyRevenue>[] = [
      { key: 'date', label: '日期', render: r => r.date },
      { key: 'ffCommUsdt', label: 'FF 返佣(USDT)', render: r => r.flatFeeCommUsdt.toFixed(2), sortable: true, sortKey: r => r.flatFeeCommUsdt },
      { key: 'ffCommUsdc', label: 'FF 返佣(USDC)', render: r => r.flatFeeCommUsdc.toFixed(2), sortable: true, sortKey: r => r.flatFeeCommUsdc },
      { key: 'psCommUsdt', label: 'PS 返佣(USDT)', render: r => r.profitShareCommUsdt.toFixed(2), sortable: true, sortKey: r => r.profitShareCommUsdt },
      { key: 'psCommUsdc', label: 'PS 返佣(USDC)', render: r => r.profitShareCommUsdc.toFixed(2), sortable: true, sortKey: r => r.profitShareCommUsdc },
      { key: 'evComm', label: '事件返佣(USDT)', render: r => r.eventCommission.toFixed(2), sortable: true, sortKey: r => r.eventCommission },
    ]

    if (expandVolume) {
      cols.push(
        { key: 'ffVolUsdt', label: 'FF 交易量(USDT)', render: r => fmtNum(r.ffTradeVolUsdt), sortable: true, sortKey: r => r.ffTradeVolUsdt },
        { key: 'ffVolUsdc', label: 'FF 交易量(USDC)', render: r => fmtNum(r.ffTradeVolUsdc), sortable: true, sortKey: r => r.ffTradeVolUsdc },
        { key: 'psVolUsdt', label: 'PS 交易量(USDT)', render: r => fmtNum(r.psTradeVolUsdt), sortable: true, sortKey: r => r.psTradeVolUsdt },
        { key: 'psVolUsdc', label: 'PS 交易量(USDC)', render: r => fmtNum(r.psTradeVolUsdc), sortable: true, sortKey: r => r.psTradeVolUsdc },
        { key: 'evVol', label: '事件交易量(USDT)', render: r => fmtNum(r.eventTradeVolume), sortable: true, sortKey: r => r.eventTradeVolume },
      )
    } else {
      cols.push({
        key: 'totalVol', label: '交易量合计(USDT)',
        render: r => fmtNum(r.ffTradeVolUsdt + r.ffTradeVolUsdc + r.psTradeVolUsdt + r.psTradeVolUsdc + r.eventTradeVolume),
        sortable: true,
        sortKey: r => r.ffTradeVolUsdt + r.ffTradeVolUsdc + r.psTradeVolUsdt + r.psTradeVolUsdc + r.eventTradeVolume,
      })
    }

    if (expandFee) {
      cols.push(
        { key: 'ffFeeUsdt', label: 'FF 手续费(USDT)', render: r => r.flatFeeFeeUsdt.toFixed(2), sortable: true, sortKey: r => r.flatFeeFeeUsdt },
        { key: 'ffFeeUsdc', label: 'FF 手续费(USDC)', render: r => r.flatFeeFeeUsdc.toFixed(2), sortable: true, sortKey: r => r.flatFeeFeeUsdc },
      )
    } else {
      cols.push({
        key: 'totalFee', label: 'FF 手续费合计',
        render: r => (r.flatFeeFeeUsdt + r.flatFeeFeeUsdc).toFixed(2),
        sortable: true,
        sortKey: r => r.flatFeeFeeUsdt + r.flatFeeFeeUsdc,
      })
    }

    cols.push({ key: 'status', label: '发放状态', render: r => <StatusBadge type="payout" value={r.payoutStatus} /> })
    return cols
  }, [expandVolume, expandFee])

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
    <Tabs.Trigger value={val} px="16px" py="12px" fontSize="14px"
      color={tab === val ? 'nav.active' : 'nav.inactive'}
      fontFamily="ISB" bg="transparent" border="none"
      _hover={{ color: 'nav.active' }}>
      {label}
    </Tabs.Trigger>
  )

  const toggleBtn = (label: string, active: boolean, onClick: () => void) => (
    <Box as="button" px="10px" py="4px" fontSize="12px" fontFamily="ISB"
      bg={active ? 'rgba(10,186,181,0.1)' : 'bg.100'}
      color={active ? 'theme' : 'gray.100'}
      border="1px solid" borderColor={active ? 'theme' : 'border.100'}
      borderRadius="6px" cursor="pointer" onClick={onClick}
      _hover={{ borderColor: 'theme' }}>
      {label}
    </Box>
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
        <FilterItem label="统计时间" wide>
          <DateRangeInput from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </FilterItem>
      </FilterBar>

      {preSourceUid && (
        <Box bg="green.200" border="1px solid" borderColor="theme" px="16px" py="8px" borderRadius="6px" mb="16px">
          <Text fontSize="14px" color="theme">当前筛选：来源用户 = {preSourceUid}</Text>
        </Box>
      )}

      <Flex align="baseline" gap="32px" mb="16px" flexWrap="wrap">
        <Box flexShrink={0}>
          <Text fontSize="13px" color="gray.100" mb="2px">累计返佣（USDT）</Text>
          <Text fontSize="28px" fontFamily="ISB" color="text.100" lineHeight="1.2">
            {totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text fontSize="11px" color="gray.200" mt="2px">返佣实时到账</Text>
        </Box>
        <Box flex={1}>
          <InlineStatsBar stats={globalBreakdown} />
        </Box>
      </Flex>

      {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsData} />}

      <Tabs.Root value={tab} onValueChange={e => setTab(e.value)}>
        <Tabs.List borderBottom="1px solid" borderColor="border.100" mb="16px">
          {tabTrigger('0', '日明细表')}
          {tabTrigger('1', '返佣记录')}
          {tabTrigger('2', '结算方式配置')}
        </Tabs.List>

        <Tabs.Content value="0">
          <Flex gap="8px" mb="12px" align="center">
            <Text fontSize="13px" color="gray.100">列展开：</Text>
            {toggleBtn(expandVolume ? '收起交易量' : '展开交易量', expandVolume, () => setExpandVolume(v => !v))}
            {toggleBtn(expandFee ? '收起手续费' : '展开手续费', expandFee, () => setExpandFee(v => !v))}
          </Flex>
          <DataTable
            data={dailyRevenue} columns={dailyColumns}
            footer={<Text fontSize="12px" color="gray.100" mt="8px">佣金包含直推返佣和平台奖励，交易额仅统计直推用户的交易，两者不构成简单的比例关系。</Text>}
          />
        </Tabs.Content>
        <Tabs.Content value="1">
          <DataTable data={filteredRecords} columns={recordColumns} />
        </Tabs.Content>
        <Tabs.Content value="2">
          <Box border="1px solid" borderColor="border.100" borderRadius="12px" p="20px">
            <Text fontFamily="ISB" fontSize="16px" mb="16px">当前结算方式配置</Text>
            <Flex gap="32px">
              <Box><Text fontSize="14px" color="gray.100">结算方式</Text><Text fontSize="14px" mt="4px">{settlementConfig.method}</Text></Box>
              <Box><Text fontSize="14px" color="gray.100">结算频率</Text><Text fontSize="14px" mt="4px">{settlementConfig.frequency}</Text></Box>
              <Box><Text fontSize="14px" color="gray.100">默认结算币种</Text><Text fontSize="14px" mt="4px">{settlementConfig.coin}</Text></Box>
            </Flex>
            <Text fontSize="12px" color="gray.100" mt="16px">结算方式由管理员在内部后台设定，代理商前台仅展示、不可修改。</Text>
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
