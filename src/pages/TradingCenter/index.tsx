import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, Flex, Text, Tabs, HStack } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import { FilterBar, Select, Input, FilterItem } from '@/components/shared/FilterBar'
import { useAgent } from '@/context/AgentContext'
import { perpPositions, perpHistory, eventHistory } from '@/mock/data'
import type { PerpPosition, PerpOrder, EventOrder } from '@/mock/types'

const allPerpPosCols: Column<PerpPosition>[] = [
  {
    key: 'user', label: '用户 (UID)',
    render: r => (
      <Box>
        <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.uid}</Text>
        {r.remark && <Text fontSize="12px" color="gray.200" mt="2px">{r.remark}</Text>}
      </Box>
    ),
  },
  {
    key: 'pair', label: '交易对',
    render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.pair}</Text>,
  },
  {
    key: 'side', label: '方向 / 杠杆',
    render: r => <Text fontSize="13px" color={r.side === 'long' ? 'theme' : 'red.100'}>{r.side === 'long' ? '多头' : '空头'} · {r.leverage}x</Text>,
  },
  {
    key: 'qty', label: '持仓数量',
    align: 'right',
    render: r => <Text fontFamily="ISB" fontSize="15px">{r.quantity.toFixed(4)}</Text>,
  },
  {
    key: 'avgPrice', label: '开仓均价',
    align: 'right',
    render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>,
  },
  {
    key: 'markPrice', label: '标记价格',
    align: 'right',
    render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.markPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>,
  },
  {
    key: 'pnl', label: '未实现盈亏',
    align: 'right',
    render: r => <Text color={r.unrealizedPnl >= 0 ? 'theme' : 'red.100'} fontFamily="ISB" fontSize="16px">{r.unrealizedPnl.toFixed(2)}</Text>,
    sortable: true, sortKey: r => r.unrealizedPnl,
  },
]

const allPerpHistCols: Column<PerpOrder>[] = [
  {
    key: 'user', label: '用户 (UID)',
    render: r => (
      <Box>
        <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.uid}</Text>
        {r.remark && <Text fontSize="12px" color="gray.200" mt="2px">{r.remark}</Text>}
      </Box>
    ),
  },
  {
    key: 'pair', label: '交易对',
    render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.pair}</Text>,
  },
  {
    key: 'op', label: '方向 / 类型',
    render: r => (
      <HStack gap="4px">
        <Text fontSize="13px" color={r.side === 'buy' ? 'theme' : 'red.100'}>{r.side === 'buy' ? '买入' : '卖出'}</Text>
        <Text fontSize="13px" color="gray.200">· {({ open: '开仓', close: '平仓', liquidation: '强平' })[r.subType]}</Text>
      </HStack>
    ),
  },
  {
    key: 'price', label: '成交价格',
    align: 'right',
    render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>,
  },
  {
    key: 'qty', label: '成交数量',
    align: 'right',
    render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.quantity.toFixed(4)}</Text>,
  },
  {
    key: 'fee', label: '手续费',
    align: 'right',
    render: r => <Text fontFamily="ISB" fontSize="15px">{r.fee.toFixed(2)}</Text>,
    sortable: true, sortKey: r => r.fee,
  },
  {
    key: 'time', label: '成交时间',
    render: r => <Text color="text.100" fontSize="13px">{r.time}</Text>,
  },
]

const allEventCols: Column<EventOrder>[] = [
  {
    key: 'user', label: '用户 (UID)',
    render: r => (
      <Box>
        <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.uid}</Text>
        {r.remark && <Text fontSize="12px" color="gray.200" mt="2px">{r.remark}</Text>}
      </Box>
    ),
  },
  {
    key: 'event', label: '事件标的',
    render: r => <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.eventName}</Text>,
  },
  {
    key: 'dir', label: '投注方向',
    render: r => <Text fontSize="13px" color={r.direction === '看涨' ? 'theme' : 'red.100'}>{r.direction}</Text>,
  },
  {
    key: 'amt', label: '投注金额',
    align: 'right',
    render: r => <Text fontFamily="ISB" fontSize="15px">{r.amount.toFixed(2)}</Text>,
    sortable: true, sortKey: r => r.amount,
  },
  {
    key: 'result', label: '结算结果',
    align: 'right',
    render: r => <StatusBadge type="eventResult" value={r.result} />,
  },
  {
    key: 'pnl', label: '盈亏',
    align: 'right',
    render: r => (
      r.result !== 'pending' ? (
        <Text color={r.pnl >= 0 ? 'theme' : 'red.100'} fontFamily="ISB" fontSize="15px">
          {r.pnl >= 0 ? '+' : ''}{r.pnl.toFixed(2)}
        </Text>
      ) : <Text color="gray.200">—</Text>
    ),
  },
  {
    key: 'time', label: '投注时间',
    render: r => <Text color="text.100" fontSize="13px">{r.time}</Text>,
  },
]

function computeStatsForTab(tab: string, positions: PerpPosition[], orders: PerpOrder[], events: EventOrder[]) {
  if (tab === '0') {
    return [
      { label: '持仓数', value: positions.length },
      { label: '持仓市值', value: positions.reduce((s, r) => s + r.quantity * r.markPrice, 0).toFixed(2), unit: 'USDT' },
      { label: '未实现盈亏', value: positions.reduce((s, r) => s + r.unrealizedPnl, 0).toFixed(2), unit: 'USDT' },
    ]
  } else if (tab === '1') {
    return [
      { label: '订单数', value: orders.length },
      { label: '交易量', value: orders.reduce((s, r) => s + r.price * r.quantity, 0).toFixed(2), unit: 'USDT' },
      { label: '手续费', value: orders.reduce((s, r) => s + r.fee, 0).toFixed(2), unit: 'USDT' },
    ]
  } else {
    return [
      { label: '订单数', value: events.length },
      { label: '下注额', value: events.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
      { label: '盈亏', value: events.reduce((s, r) => s + r.pnl, 0).toFixed(2), unit: 'USDT' },
    ]
  }
}

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

  const hasFilter = uid !== '' || remark !== '' || code !== '' || direction !== 'all' || pair !== 'all' || subType !== 'all'

  const filterFn = <T extends { uid: string; remark: string }>(list: T[]) => {
    let res = list
    if (uid) res = res.filter(r => r.uid.includes(uid))
    if (remark) res = res.filter(r => r.remark.toLowerCase().includes(remark.toLowerCase()))
    return res
  }

  const filteredPerpPos = useMemo(() => filterFn(perpPositions), [uid, remark])
  const filteredPerpHist = useMemo(() => filterFn(perpHistory), [uid, remark])
  const filteredEvent = useMemo(() => filterFn(eventHistory), [uid, remark])

  const globalStatsForTab = useMemo(() =>
    computeStatsForTab(tab, perpPositions, perpHistory, eventHistory),
  [tab])

  const filteredStatsForTab = useMemo(() =>
    computeStatsForTab(tab, filteredPerpPos, filteredPerpHist, filteredEvent),
  [tab, filteredPerpPos, filteredPerpHist, filteredEvent])

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

  const summaryView = (
    <Box bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="8px" p="32px">
      <Text fontFamily="ISB" fontSize="20px" mb="24px" color="text.100">汇总数据</Text>
      <Flex gap="48px">
        <Box>
          <Text fontSize="13px" color="gray.100" textTransform="uppercase" letterSpacing="0.5px" mb="8px">交易笔数</Text>
          <Text fontSize="32px" fontFamily="ISB" color="text.100" lineHeight="1">{perpPositions.length + perpHistory.length + eventHistory.length}</Text>
        </Box>
        <Box>
          <Text fontSize="13px" color="gray.100" textTransform="uppercase" letterSpacing="0.5px" mb="8px">总交易额（USDT）</Text>
          <Text fontSize="32px" fontFamily="ISB" color="text.100" lineHeight="1">{(perpHistory.reduce((s, r) => s + r.price * r.quantity, 0) + eventHistory.reduce((s, r) => s + r.amount, 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        </Box>
      </Flex>
      <Text fontSize="13px" color="gray.200" mt="24px">当前数据可见深度为"汇总"，具体持仓和盈亏明细不可见。</Text>
    </Box>
  )

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="24px">
        <Text fontFamily="ISB" fontSize="24px" color="text.100" letterSpacing="-0.5px">交易中心</Text>
        {!isSummary && (
          <Box position="relative">
            <Box as="button" px="16px" py="8px" bg="transparent" border="1px solid" borderColor="border.100"
              borderRadius="4px" fontSize="13px" color="text.100" cursor="pointer"
              onClick={() => setShowColPicker(!showColPicker)}
              transition="all 0.2s"
              _hover={{ bg: 'bg.200', borderColor: 'border.200' }}>自定义列</Box>
            {showColPicker && (
              <>
                <Box position="fixed" inset={0} zIndex={49} onClick={() => setShowColPicker(false)} />
                <Box position="absolute" right={0} top="100%" mt="8px" bg="bg.200" border="1px solid"
                  borderColor="border.200" borderRadius="8px" p="16px" zIndex={50} minW="200px"
                  boxShadow="0 16px 40px rgba(0,0,0,0.1)">
                  <Text fontSize="12px" color="gray.100" mb="12px" textTransform="uppercase" letterSpacing="0.5px">隐藏列</Text>
                  <Flex direction="column" gap="8px">
                    {currentCols.map(col => (
                      <Flex key={col.key} align="center" gap="12px" py="4px" cursor="pointer"
                        onClick={() => setHiddenCols(prev => {
                          const next = new Set(prev)
                          next.has(col.key) ? next.delete(col.key) : next.add(col.key)
                          return next
                        })}>
                        <Box w="16px" h="16px" borderRadius="4px" border="1px solid"
                          borderColor={hiddenCols.has(col.key) ? 'border.100' : 'theme'}
                          bg={hiddenCols.has(col.key) ? 'transparent' : 'rgba(10,186,181,0.1)'}
                          display="flex" alignItems="center" justifyContent="center"
                        >
                          {!hiddenCols.has(col.key) && <Text fontSize="10px" color="theme">✓</Text>}
                        </Box>
                        <Text fontSize="13px" color={hiddenCols.has(col.key) ? 'gray.100' : 'text.100'}>
                          {typeof col.label === 'string' ? col.label : col.key}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </Box>
              </>
            )}
          </Box>
        )}
      </Flex>

      {isSummary ? summaryView : (
        <>
          <Tabs.Root value={tab} onValueChange={e => { setTab(e.value); setHiddenCols(new Set()) }}>
            <Tabs.List borderBottom="1px solid" borderColor="border.100" mb="24px" gap="16px">
              {tabTrigger('0', '永续合约当前持仓')}
              {tabTrigger('1', '永续合约历史委托')}
              {tabTrigger('2', '事件合约历史委托')}
            </Tabs.List>

            <FilterBar onSearch={() => {}} onReset={() => { setUid(''); setRemark(''); setCode(''); setDirection('all'); setPair('all'); setSubType('all') }}>
              <FilterItem label="用户 UID"><Input value={uid} onChange={setUid} placeholder="精确搜索" /></FilterItem>
              <FilterItem label="备注"><Input value={remark} onChange={setRemark} placeholder="模糊搜索" /></FilterItem>
              <FilterItem label="推广码"><Input value={code} onChange={setCode} placeholder="精确搜索" /></FilterItem>
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

            <InlineStatsBar stats={globalStatsForTab} />
            {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsForTab} />}

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
