import { useState, useMemo } from 'react'
import { Box, Text, HStack } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import {
  FilterBar,
  Select,
  Input,
  FilterItem,
  DateRangeInput,
} from '@/components/shared/FilterBar'
import { useTransferRecords } from '@/api/queries/transfers'
import { toError } from '@/api/client'
import type { TransferRecord, TransfersSummaryBucket } from '@/types/domain'
import { fmtAmount } from '@/utils/fmtAmount'
import { toNumber } from '@/utils/parse'
import { maskUid } from '@/utils/mask'

/**
 * 将 TransfersSummaryBucket 映射为页面用的 4 列 KPI 条。
 * 用在 global（summary.total）和 filtered（summary.filtered）两处；
 * summary 不存在时返回 "—"，避免读到 NaN。
 */
function bucketToStats(b: TransfersSummaryBucket | undefined, labelPrefix = '') {
  const prefix = labelPrefix ? `${labelPrefix} ` : ''
  return [
    { label: `${prefix}充值笔数`, value: b ? b.depositCount : '—' },
    {
      label: `${prefix}充值金额`,
      value: b ? fmtAmount(b.depositAmountUsdt) : '—',
      unit: 'USDT',
    },
    { label: `${prefix}提现笔数`, value: b ? b.withdrawCount : '—' },
    {
      label: `${prefix}提现金额`,
      value: b ? fmtAmount(b.withdrawAmountUsdt) : '—',
      unit: 'USDT',
    },
  ]
}

export default function OnchainTransfers() {
  const [uid, setUid] = useState('')
  const [type, setType] = useState('all')
  const [subType, setSubType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userLevel, setUserLevel] = useState('all')

  const q = useTransferRecords()
  const transferRecords = useMemo(() => q.data?.rows ?? [], [q.data])
  const summary = q.data?.summary

  const hasFilter =
    uid !== '' ||
    type !== 'all' ||
    subType !== 'all' ||
    userLevel !== 'all' ||
    dateFrom !== '' ||
    dateTo !== ''

  const filtered = useMemo(() => {
    let data: TransferRecord[] = [...transferRecords]
    if (uid) data = data.filter(r => r.uid.includes(uid))
    if (type !== 'all') data = data.filter(r => r.type === type)
    if (subType !== 'all') data = data.filter(r => r.subType === subType)
    if (userLevel !== 'all') data = data.filter(r => r.userLevel === userLevel)
    if (dateFrom) data = data.filter(r => r.time >= dateFrom)
    if (dateTo) data = data.filter(r => r.time <= `${dateTo}T23:59:59`)
    return data
  }, [transferRecords, uid, type, subType, userLevel, dateFrom, dateTo])

  // 全局 KPI 直接取后端 summary.total（伞下全量，Q5/文档 §4.1）。
  const globalStats = useMemo(() => bucketToStats(summary?.total), [summary])

  // 筛选结果统计条：优先用后端 summary.filtered；没有时本地 reduce 兜底。
  const filteredStatsData = useMemo(() => {
    if (summary?.filtered) return bucketToStats(summary.filtered)
    let dc = 0,
      da = 0,
      wc = 0,
      wa = 0
    for (const r of filtered) {
      if (r.status !== 'success') continue
      const amt = toNumber(r.amountUsdt)
      if (r.type === 'deposit') {
        dc++
        da += amt
      } else {
        wc++
        wa += amt
      }
    }
    return bucketToStats({
      depositCount: dc,
      depositAmountUsdt: da,
      withdrawCount: wc,
      withdrawAmountUsdt: wa,
    })
  }, [summary, filtered])

  const columns: Column<TransferRecord>[] = useMemo(
    () => [
      {
        key: 'user',
        label: '用户 (UID)',
        render: r => (
          <Box>
            <Text color="text.100" fontFamily="ISB" fontSize="15px" title={r.uid}>
              {maskUid(r.uid)}
            </Text>
            <Text fontSize="12px" color="gray.200" mt="2px">
              {r.userLevel === 'sub_agent' ? '子代理' : '普通用户'}
            </Text>
          </Box>
        ),
      },
      {
        key: 'sub',
        label: '归属子代理',
        render: r => (
          <Text color="text.100" title={r.subAgentUid ?? ''}>
            {r.subAgentUid ? maskUid(r.subAgentUid) : '—'}
          </Text>
        ),
      },
      {
        key: 'type',
        label: '充提类型',
        render: r => (
          <HStack gap="6px" align="center">
            <Text
              color={r.type === 'deposit' ? 'theme' : 'text.100'}
              fontFamily="ISB"
              fontSize="15px"
            >
              {r.type === 'deposit' ? '充值' : '提现'}
            </Text>
            {r.subType === 'internal_transfer' && (
              <Text
                fontSize="10px"
                bg="bg.200"
                border="1px solid"
                borderColor="border.100"
                color="gray.100"
                px="4px"
                py="2px"
                borderRadius="2px"
              >
                内部转账
              </Text>
            )}
          </HStack>
        ),
      },
      {
        key: 'channel',
        label: '渠道',
        render: r => (
          <Text fontSize="13px" color="text.100">
            {r.channel}
          </Text>
        ),
      },
      {
        key: 'amt',
        label: '数量 (USDT)',
        align: 'right',
        render: r => (
          <Text fontFamily="ISB" fontSize="16px" color="text.100">
            {fmtAmount(r.amountUsdt, { style: 'thousand' })}
          </Text>
        ),
        sortable: true,
        sortKey: r => toNumber(r.amountUsdt),
        minW: '140px',
      },
      {
        key: 'status',
        label: '状态',
        align: 'right',
        render: r => <StatusBadge type="transfer" value={r.status} />,
      },
      {
        key: 'time',
        label: '时间',
        align: 'right',
        render: r => (
          <Text fontSize="13px" color="gray.200">
            {r.time}
          </Text>
        ),
      },
    ],
    [],
  )

  return (
    <Box>
      <Text fontFamily="ISB" fontSize="24px" color="text.100" letterSpacing="-0.5px" mb="24px">
        链上充提
      </Text>

      <FilterBar
        onSearch={() => {}}
        onReset={() => {
          setUid('')
          setType('all')
          setSubType('all')
          setDateFrom('')
          setDateTo('')
          setUserLevel('all')
        }}
      >
        <FilterItem label="用户 UID">
          <Input value={uid} onChange={setUid} placeholder="精确搜索" />
        </FilterItem>
        <FilterItem label="充提类型">
          <Select
            value={type}
            onChange={setType}
            options={[
              { label: '全部', value: 'all' },
              { label: '充值', value: 'deposit' },
              { label: '提现', value: 'withdrawal' },
            ]}
          />
        </FilterItem>
        <FilterItem label="充提子类型">
          <Select
            value={subType}
            onChange={setSubType}
            options={[
              { label: '全部', value: 'all' },
              { label: '普通', value: 'normal' },
              { label: '内部转账', value: 'internal_transfer' },
            ]}
          />
        </FilterItem>
        <FilterItem label="统计时间" wide>
          <DateRangeInput
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
          />
        </FilterItem>
        <FilterItem label="用户等级">
          <Select
            value={userLevel}
            onChange={setUserLevel}
            options={[
              { label: '全部', value: 'all' },
              { label: '普通用户', value: 'regular' },
              { label: '子代理', value: 'sub_agent' },
            ]}
          />
        </FilterItem>
      </FilterBar>

      <InlineStatsBar stats={globalStats} />
      {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsData} />}

      <Box mt="24px">
        <DataTable
          data={filtered}
          columns={columns}
          getRowKey={(r, i) => `${r.uid}-${r.time}-${i}`}
          isLoading={q.isLoading}
          error={q.isError ? { message: toError(q.error).message, retry: () => q.refetch() } : null}
        />
      </Box>
    </Box>
  )
}
