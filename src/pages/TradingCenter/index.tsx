import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, Flex, Text, Tabs } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import FilteredStatsPanel from '@/components/shared/FilteredStatsPanel'
import { FilterBar, Select, Input, FilterItem } from '@/components/shared/FilterBar'
import { useAgent } from '@/context/AgentContext'
import { perpPositions, perpHistory, eventHistory } from '@/mock/data'
import type { PerpPosition, PerpOrder, EventOrder } from '@/mock/types'

const allPerpPosCols: Column<PerpPosition>[] = [
  { key: 'uid', label: '用户 UID', render: r => r.uid },
  { key: 'remark', label: '备注', render: r => r.remark || '—' },
  { key: 'pair', label: '交易对', render: r => r.pair },
  { key: 'side', label: '持仓方向', render: r => <Text color={r.side === 'long' ? 'theme' : 'red.100'}>{r.side === 'long' ? '多头' : '空头'}</Text> },
  { key: 'qty', label: '持仓数量', render: r => r.quantity.toFixed(4) },
  { key: 'avg', label: '开仓均价', render: r => r.avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) },
  { key: 'mark', label: '标记价格', render: r => r.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) },
  { key: 'pnl', label: '未实现盈亏', render: r => <Text color={r.unrealizedPnl >= 0 ? 'theme' : 'red.100'} fontFamily="ISB">{r.unrealizedPnl.toFixed(2)}</Text>, sortable: true, sortKey: r => r.unrealizedPnl },
  { key: 'lev', label: '杠杆倍数', render: r => `${r.leverage}x` },
]

const allPerpHistCols: Column<PerpOrder>[] = [
  { key: 'uid', label: '用户 UID', render: r => r.uid },
  { key: 'remark', label: '备注', render: r => r.remark || '—' },
  { key: 'pair', label: '交易对', render: r => r.pair },
  { key: 'sub', label: '交易子类型', render: r => ({ open: '开仓', close: '平仓', liquidation: '强平' }[r.subType]) },
  { key: 'side', label: '方向', render: r => r.side === 'buy' ? '买入' : '卖出' },
  { key: 'price', label: '成交价格', render: r => r.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) },
  { key: 'qty', label: '成交数量', render: r => r.quantity.toFixed(4) },
  { key: 'fee', label: '手续费', render: r => r.fee.toFixed(2), sortable: true, sortKey: r => r.fee },
  { key: 'time', label: '成交时间', render: r => r.time },
]

const allEventCols: Column<EventOrder>[] = [
  { key: 'uid', label: '用户 UID', render: r => r.uid },
  { key: 'remark', label: '备注', render: r => r.remark || '—' },
  { key: 'event', label: '事件标的', render: r => r.eventName },
  { key: 'dir', label: '投注方向', render: r => r.direction },
  { key: 'amt', label: '投注金额', render: r => r.amount.toFixed(2), sortable: true, sortKey: r => r.amount },
  { key: 'result', label: '结算结果', render: r => <StatusBadge type="eventResult" value={r.result} /> },
  { key: 'pnl', label: '盈亏金额', render: r => <Text color={r.pnl >= 0 ? 'theme' : 'red.100'} fontFamily="ISB">{r.pnl.toFixed(2)}</Text> },
  { key: 'time', label: '投注时间', render: r => r.time },
]

export default function TradingCenter() {
  const { tradeVisibility } = useAgent()
  const [tab, setTab] = useState('0')
  const [uid, setUid] = useState('')
  const [remark, setRemark] = useState('')
  const [code, setCode] = useState('')
  const [direction, setDirection] = useState('all')
  const [pair, setPair] = useState('all')
  const [subType, setSubType] = useState('all')
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [showColPicker, setShowColPicker] = useState(false)

  if (tradeVisibility === 'hidden') return <Navigate to="/" replace />

  const isSummary = tradeVisibility === 'summary'
  const currentCols = tab === '0' ? allPerpPosCols : tab === '1' ? allPerpHistCols : allEventCols

  const filterFn = <T extends { uid: string; remark: string }>(list: T[]) => {
    let res = list
    if (uid) res = res.filter(r => r.uid.includes(uid))
    if (remark) res = res.filter(r => r.remark.toLowerCase().includes(remark.toLowerCase()))
    return res
  }

  const filteredPerpPos = useMemo(() => filterFn(perpPositions), [uid, remark])
  const filteredPerpHist = useMemo(() => filterFn(perpHistory), [uid, remark])
  const filteredEvent = useMemo(() => filterFn(eventHistory), [uid, remark])

  const statsForTab = useMemo(() => {
    if (tab === '0') {
      const data = filteredPerpPos
      return [
        { label: '总持仓数', value: data.length },
        { label: '总数量', value: +data.reduce((s, r) => s + r.quantity, 0).toFixed(4) },
        { label: '总未实现盈亏', value: data.reduce((s, r) => s + r.unrealizedPnl, 0).toFixed(2), unit: 'USDT' },
      ]
    } else if (tab === '1') {
      const data = filteredPerpHist
      return [
        { label: '总订单数', value: data.length },
        { label: '总交易量', value: data.reduce((s, r) => s + r.price * r.quantity, 0).toFixed(2), unit: 'USDT' },
        { label: '总手续费', value: data.reduce((s, r) => s + r.fee, 0).toFixed(2), unit: 'USDT' },
      ]
    } else {
      const data = filteredEvent
      return [
        { label: '总订单数', value: data.length },
        { label: '总下注额', value: data.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
        { label: '总盈亏', value: data.reduce((s, r) => s + r.pnl, 0).toFixed(2), unit: 'USDT' },
      ]
    }
  }, [tab, filteredPerpPos, filteredPerpHist, filteredEvent])

  const tabTrigger = (val: string, label: string) => (
    <Tabs.Trigger value={val} px={4} py={3} fontSize="sm"
      color={tab === val ? 'text.100' : 'gray.100'}
      fontFamily={tab === val ? 'ISB' : undefined}
      borderBottom="2px solid" borderColor={tab === val ? 'theme' : 'transparent'}
      _hover={{ color: 'text.100' }}>
      {label}
    </Tabs.Trigger>
  )

  const summaryView = (
    <Box bg="bg.200" border="1px solid" borderColor="border.100" borderRadius={{ base: '0', md: 'xl' }} p={5}>
      <Text fontFamily="ISB" mb={3}>汇总数据</Text>
      <Flex gap={8}>
        <Box><Text fontSize="xs" color="gray.100">交易笔数</Text><Text fontSize="xl" fontFamily="ISB">{perpPositions.length + perpHistory.length + eventHistory.length}</Text></Box>
        <Box><Text fontSize="xs" color="gray.100">总交易额（USDT）</Text><Text fontSize="xl" fontFamily="ISB">{(perpHistory.reduce((s, r) => s + r.price * r.quantity, 0) + eventHistory.reduce((s, r) => s + r.amount, 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text></Box>
      </Flex>
      <Text fontSize="xs" color="gray.200" mt={4}>当前数据可见深度为"汇总"，具体持仓和盈亏不可见。</Text>
    </Box>
  )

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontFamily="ISB" fontSize="md">交易中心</Text>
        {!isSummary && (
          <Box position="relative">
            <Box as="button" px={3} py={1.5} bg="bg.300" border="1px solid" borderColor="border.100"
              borderRadius="md" fontSize="xs" color="text.200" cursor="pointer"
              onClick={() => setShowColPicker(!showColPicker)}>自定义列</Box>
            {showColPicker && (
              <Box position="absolute" right={0} top="100%" mt={1} bg="bg.200" border="1px solid"
                borderColor="border.100" borderRadius="md" p={3} zIndex={50} minW="180px"
                boxShadow="0 4px 16px rgba(0,0,0,0.08)">
                {currentCols.map(col => (
                  <Flex key={col.key} align="center" gap={2} py={1} cursor="pointer"
                    onClick={() => setHiddenCols(prev => {
                      const next = new Set(prev)
                      next.has(col.key) ? next.delete(col.key) : next.add(col.key)
                      return next
                    })}>
                    <Box w={4} h={4} borderRadius="sm" border="1px solid"
                      borderColor={hiddenCols.has(col.key) ? 'border.100' : 'theme'}
                      bg={hiddenCols.has(col.key) ? 'transparent' : 'theme'} />
                    <Text fontSize="xs" color="text.200">{typeof col.label === 'string' ? col.label : col.key}</Text>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Flex>

      {isSummary ? summaryView : (
        <>
          <Tabs.Root value={tab} onValueChange={e => { setTab(e.value); setHiddenCols(new Set()) }}>
            <Tabs.List borderBottom="1px solid" borderColor="border.100" mb={4}>
              {tabTrigger('0', '永续合约当前持仓')}
              {tabTrigger('1', '永续合约历史委托')}
              {tabTrigger('2', '事件合约历史委托')}
            </Tabs.List>

            <FilterBar onSearch={() => {}} onReset={() => { setUid(''); setRemark(''); setCode(''); setDirection('all'); setPair('all'); setSubType('all') }}>
              <FilterItem label="用户 UID"><Input value={uid} onChange={setUid} placeholder="精确搜索" /></FilterItem>
              <FilterItem label="备注"><Input value={remark} onChange={setRemark} placeholder="模糊搜索" /></FilterItem>
              <FilterItem label="Referral Code"><Input value={code} onChange={setCode} placeholder="精确搜索" /></FilterItem>
              {tab === '0' && (
                <FilterItem label="持仓方向">
                  <Select value={direction} onChange={setDirection} options={[
                    { label: '全部', value: 'all' }, { label: '多头', value: 'long' }, { label: '空头', value: 'short' },
                  ]} />
                </FilterItem>
              )}
              {(tab === '0' || tab === '1') && (
                <FilterItem label="交易对">
                  <Select value={pair} onChange={setPair} options={[
                    { label: '全部', value: 'all' }, { label: 'BTC/USDT', value: 'BTC/USDT' }, { label: 'ETH/USDT', value: 'ETH/USDT' }, { label: 'SOL/USDT', value: 'SOL/USDT' },
                  ]} />
                </FilterItem>
              )}
              {tab === '1' && (
                <FilterItem label="交易子类型">
                  <Select value={subType} onChange={setSubType} options={[
                    { label: '全部', value: 'all' }, { label: '开仓', value: 'open' }, { label: '平仓', value: 'close' }, { label: '强平', value: 'liquidation' },
                  ]} />
                </FilterItem>
              )}
            </FilterBar>

            <Box mb={4}>
              <FilteredStatsPanel title="数据统计" stats={statsForTab} />
            </Box>

            <Tabs.Content value="0">
              {tab === '0' && <DataTable data={filteredPerpPos} columns={allPerpPosCols.filter(c => !hiddenCols.has(c.key))} />}
            </Tabs.Content>
            <Tabs.Content value="1">
              {tab === '1' && <DataTable data={filteredPerpHist} columns={allPerpHistCols.filter(c => !hiddenCols.has(c.key))} />}
            </Tabs.Content>
            <Tabs.Content value="2">
              {tab === '2' && <DataTable data={filteredEvent} columns={allEventCols.filter(c => !hiddenCols.has(c.key))} />}
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}
    </Box>
  )
}
