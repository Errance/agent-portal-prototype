import { useState, useMemo } from 'react'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import { FilterBar, Select, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { useDailyRevenue, useCommissionRecords, useSettlementConfig } from '@/api/queries/revenue'
import type { DailyRevenue, CommissionRecord } from '@/mock/types'
import { sumAmounts, fmtAmount } from '@/utils/fmtAmount'
import { useSanitizedUrlParam } from '@/hooks/useUrlState'

interface CommissionAgg {
  total: number
  volume: number
  perp: number
  event: number
}

function aggregateCommissions(list: CommissionRecord[], onlyPaid = false): CommissionAgg {
  let total = 0, volume = 0, perp = 0, evt = 0
  for (const r of list) {
    volume += r.tradeVolume ?? 0
    if (onlyPaid) {
      if (r.payoutStatus === 'paid') total += r.commissionAmount
    } else {
      total += r.commissionAmount
    }
    if (r.productLine === 'perpetual') perp += r.commissionAmount
    else if (r.productLine === 'event') evt += r.commissionAmount
  }
  return { total, volume, perp, event: evt }
}

export default function RevenueCenter() {
  // S2：UID 白名单校验，非法值直接忽略
  const preSourceUid = useSanitizedUrlParam('source_uid', /^UID\d{6,}$/)

  const [tab, setTab] = useState('0')
  const [productLine, setProductLine] = useState('all')
  const [settlement, setSettlement] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandVolume, setExpandVolume] = useState(false)
  const [expandFee, setExpandFee] = useState(false)

  const dailyQ = useDailyRevenue()
  const recordsQ = useCommissionRecords()
  const cfgQ = useSettlementConfig()
  const daily = dailyQ.data ?? []
  const records = recordsQ.data ?? []

  const settlementDisabled = productLine === 'event'
  const effectiveSettlement = settlementDisabled ? 'all' : settlement

  const hasFilter = productLine !== 'all' || effectiveSettlement !== 'all'
    || dateFrom !== '' || dateTo !== '' || preSourceUid !== ''

  const totalCommission = useMemo(
    () => aggregateCommissions(records, true).total,
    [records],
  )

  const globalBreakdown = useMemo(() => {
    const a = aggregateCommissions(records)
    return [
      { label: '总交易额', value: fmtAmount(a.volume), unit: 'USDT' },
      { label: '永续合约', value: fmtAmount(a.perp), unit: 'USDT' },
      { label: '事件合约', value: fmtAmount(a.event), unit: 'USDT' },
    ]
  }, [records])

  const filteredRecords = useMemo(() => {
    let data = records
    if (preSourceUid) data = data.filter(r => r.sourceUid === preSourceUid)
    if (productLine !== 'all') data = data.filter(r => r.productLine === (productLine === 'perpetual' ? 'perpetual' : 'event'))
    if (effectiveSettlement !== 'all') data = data.filter(r => r.settlementType === effectiveSettlement)
    return data
  }, [records, productLine, effectiveSettlement, preSourceUid])

  const filteredStatsData = useMemo(() => {
    const a = aggregateCommissions(filteredRecords)
    return [
      { label: '返佣金额', value: fmtAmount(a.total), unit: 'USDT' },
      { label: '交易额', value: fmtAmount(a.volume), unit: 'USDT' },
      { label: '永续合约', value: fmtAmount(a.perp), unit: 'USDT' },
      { label: '事件合约', value: fmtAmount(a.event), unit: 'USDT' },
      { label: '记录数', value: filteredRecords.length },
    ]
  }, [filteredRecords])

  const dailyColumns: Column<DailyRevenue>[] = useMemo(() => {
    const cols: Column<DailyRevenue>[] = [
      { key: 'date', label: '日期', render: r => <Text fontFamily="ISB" color="text.100">{r.date}</Text> },
      {
        key: 'ffComm', label: 'FF 返佣', align: 'right',
        render: r => (
          <Box>
            <Text color="theme" fontFamily="ISB" fontSize="14px">{fmtAmount(r.flatFeeCommUsdt)} USDT</Text>
            <Text color="theme" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.flatFeeCommUsdc)} USDC</Text>
          </Box>
        ),
        sortable: true, sortKey: r => r.flatFeeCommUsdt,
      },
      {
        key: 'psComm', label: 'PS 返佣', align: 'right',
        render: r => (
          <Box>
            <Text color="theme" fontFamily="ISB" fontSize="14px">{fmtAmount(r.profitShareCommUsdt)} USDT</Text>
            <Text color="theme" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.profitShareCommUsdc)} USDC</Text>
          </Box>
        ),
        sortable: true, sortKey: r => r.profitShareCommUsdt,
      },
      {
        key: 'evComm', label: '事件返佣', align: 'right',
        render: r => (
          <Box>
            <Text color="theme" fontFamily="ISB" fontSize="14px">{fmtAmount(r.eventCommission)} USDT</Text>
          </Box>
        ),
        sortable: true, sortKey: r => r.eventCommission,
      },
    ]

    if (expandVolume) {
      cols.push(
        {
          key: 'ffVol', label: 'FF 交易量', align: 'right',
          render: r => (
            <Box>
              <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.ffTradeVolUsdt, { style: 'thousand' })} USDT</Text>
              <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.ffTradeVolUsdc, { style: 'thousand' })} USDC</Text>
            </Box>
          ),
          sortable: true, sortKey: r => r.ffTradeVolUsdt,
        },
        {
          key: 'psVol', label: 'PS 交易量', align: 'right',
          render: r => (
            <Box>
              <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.psTradeVolUsdt, { style: 'thousand' })} USDT</Text>
              <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.psTradeVolUsdc, { style: 'thousand' })} USDC</Text>
            </Box>
          ),
          sortable: true, sortKey: r => r.psTradeVolUsdt,
        },
        {
          key: 'evVol', label: '事件交易量', align: 'right',
          render: r => (
            <Box>
              <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.eventTradeVolume, { style: 'thousand' })} USDT</Text>
            </Box>
          ),
          sortable: true, sortKey: r => r.eventTradeVolume,
        },
      )
    } else {
      cols.push({
        key: 'totalVol', label: '交易量合计 (等值USDT)', align: 'right',
        render: r => (
          <Text fontFamily="ISB" fontSize="15px" color="text.100">
            {fmtAmount(sumAmounts([r.ffTradeVolUsdt, r.ffTradeVolUsdc, r.psTradeVolUsdt, r.psTradeVolUsdc, r.eventTradeVolume]), { style: 'thousand' })}
          </Text>
        ),
        sortable: true,
        sortKey: r => r.ffTradeVolUsdt + r.ffTradeVolUsdc + r.psTradeVolUsdt + r.psTradeVolUsdc + r.eventTradeVolume,
      })
    }

    if (expandFee) {
      cols.push({
        key: 'ffFee', label: 'FF 手续费', align: 'right',
        render: r => (
          <Box>
            <Text color="text.100" fontFamily="ISB" fontSize="14px">{fmtAmount(r.flatFeeFeeUsdt)} USDT</Text>
            <Text color="text.100" fontFamily="ISB" fontSize="14px" mt="4px">{fmtAmount(r.flatFeeFeeUsdc)} USDC</Text>
          </Box>
        ),
        sortable: true, sortKey: r => r.flatFeeFeeUsdt,
      })
    } else {
      cols.push({
        key: 'totalFee', label: 'FF 手续费合计', align: 'right',
        render: r => (
          <Text fontFamily="ISB" fontSize="15px" color="text.100">
            {fmtAmount(sumAmounts([r.flatFeeFeeUsdt, r.flatFeeFeeUsdc]))}
          </Text>
        ),
        sortable: true, sortKey: r => r.flatFeeFeeUsdt + r.flatFeeFeeUsdc,
      })
    }

    cols.push({
      key: 'status', label: '状态',
      render: r => <StatusBadge type="payout" value={r.payoutStatus} />,
    })
    return cols
  }, [expandVolume, expandFee])

  const recordColumns: Column<CommissionRecord>[] = useMemo(() => [
    {
      key: 'user', label: '来源用户',
      render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.sourceUid ?? '—'}</Text>,
    },
    {
      key: 'type', label: '来源类型',
      render: r => <Text fontSize="13px" color="text.100">{r.sourceType === 'direct' ? '直推返佣' : '平台奖励'}</Text>,
    },
    {
      key: 'prod', label: '产品线',
      render: r => <Text color="text.100" fontFamily="ISB" fontSize="14px">{r.productLine === 'perpetual' ? '永续合约' : '事件合约'}</Text>,
    },
    {
      key: 'settle', label: '结算方式',
      render: r => <Text fontSize="13px" color="text.100">{r.settlementType === 'flat_fee' ? 'Flat Fee' : r.settlementType === 'profit_share' ? 'Profit Share' : '—'}</Text>,
    },
    {
      key: 'vol', label: '交易额', align: 'right',
      render: r => (
        <Text fontFamily="ISB" color="text.100" fontSize="14px">
          {r.tradeVolume !== null ? fmtAmount(r.tradeVolume, { style: 'thousand' }) : '—'}
        </Text>
      ),
    },
    {
      key: 'amt', label: '返佣金额', align: 'right',
      render: r => (
        <Box>
          <Text color="theme" fontFamily="ISB" fontSize="14px">{fmtAmount(r.commissionAmount)} {r.settlementCoin}</Text>
        </Box>
      ),
      sortable: true, sortKey: r => r.commissionAmount,
    },
    {
      key: 'status', label: '状态', align: 'right',
      render: r => <StatusBadge type="payout" value={r.payoutStatus} />,
    },
    {
      key: 'time', label: '时间', align: 'right',
      render: r => <Text fontSize="13px" color="gray.200">{r.time}</Text>,
    },
  ], [])

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

  const toggleBtn = (label: string, active: boolean, onClick: () => void) => (
    <Box as="button" px="16px" py="6px" fontSize="13px" fontFamily="ISB"
      bg={active ? 'theme' : 'transparent'}
      color={active ? '#FFFFFF' : 'gray.100'}
      border="1px solid" borderColor={active ? 'theme' : 'border.100'}
      borderRadius="4px" cursor="pointer" onClick={onClick}
      transition="all 0.2s"
      _hover={{ borderColor: 'theme', color: active ? '#FFFFFF' : 'theme' }}>
      {label}
    </Box>
  )

  return (
    <Box>
      <Text fontFamily="ISB" fontSize="24px" color="text.100" letterSpacing="-0.5px" mb="24px">收益中心</Text>

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
        <Box bg="rgba(10,186,181,0.05)" border="1px solid" borderColor="theme" px="16px" py="8px" borderRadius="4px" mb="24px">
          <Text fontSize="14px" color="theme">当前筛选：来源用户 = {preSourceUid}</Text>
        </Box>
      )}

      <Flex align="center" gap="48px" mb="32px" flexWrap="wrap">
        <Box flexShrink={0}>
          <Text fontSize="13px" color="gray.200" mb="8px" textTransform="uppercase" letterSpacing="0.5px">累计返佣（USDT等值）</Text>
          <Text fontSize="36px" fontFamily="ISB" color="theme" lineHeight="1" textShadow="0 0 24px rgba(10,186,181,0.2)">
            {fmtAmount(totalCommission, { style: 'thousand' })}
          </Text>
          <Text fontSize="12px" color="gray.100" mt="8px">返佣实时到账</Text>
        </Box>
        <Box flex={1}>
          <InlineStatsBar stats={globalBreakdown} />
        </Box>
      </Flex>

      {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsData} />}

      <Tabs.Root value={tab} onValueChange={e => setTab(e.value)}>
        <Tabs.List borderBottom="1px solid border.100" mb="24px" gap="16px">
          {tabTrigger('0', '日明细表')}
          {tabTrigger('1', '返佣记录')}
          {tabTrigger('2', '结算方式配置')}
        </Tabs.List>

        <Tabs.Content value="0">
          <Flex gap="12px" mb="16px" align="center">
            {toggleBtn(expandVolume ? '收起交易量明细' : '展开交易量明细', expandVolume, () => setExpandVolume(v => !v))}
            {toggleBtn(expandFee ? '收起手续费明细' : '展开手续费明细', expandFee, () => setExpandFee(v => !v))}
          </Flex>
          <DataTable
            data={daily} columns={dailyColumns}
            getRowKey={r => r.date}
            isLoading={dailyQ.isLoading}
            error={dailyQ.isError ? { message: (dailyQ.error as Error).message, retry: () => dailyQ.refetch() } : null}
            footer={<Text fontSize="12px" color="gray.200" mt="8px">佣金包含直推返佣和平台奖励，交易额仅统计直推用户的交易，两者不构成简单的比例关系。</Text>}
          />
        </Tabs.Content>
        <Tabs.Content value="1">
          <DataTable
            data={filteredRecords} columns={recordColumns}
            getRowKey={r => r.id}
            isLoading={recordsQ.isLoading}
            error={recordsQ.isError ? { message: (recordsQ.error as Error).message, retry: () => recordsQ.refetch() } : null}
          />
        </Tabs.Content>
        <Tabs.Content value="2">
          <Box bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="8px" p="32px">
            <Text fontFamily="ISB" fontSize="18px" mb="24px" color="text.100" letterSpacing="-0.5px">当前结算方式配置</Text>
            <Flex gap="48px">
              <Box><Text fontSize="13px" color="gray.200" mb="4px" textTransform="uppercase">结算方式</Text><Text fontSize="16px" fontFamily="ISB" color="text.100">{cfgQ.data?.method ?? '—'}</Text></Box>
              <Box><Text fontSize="13px" color="gray.200" mb="4px" textTransform="uppercase">结算频率</Text><Text fontSize="16px" fontFamily="ISB" color="text.100">{cfgQ.data?.frequency ?? '—'}</Text></Box>
              <Box><Text fontSize="13px" color="gray.200" mb="4px" textTransform="uppercase">默认结算币种</Text><Text fontSize="16px" fontFamily="ISB" color="theme">{cfgQ.data?.coin ?? '—'}</Text></Box>
            </Flex>
            <Text fontSize="13px" color="gray.200" mt="32px">结算方式由管理员在内部后台设定，代理商前台仅展示、不可修改。</Text>
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
