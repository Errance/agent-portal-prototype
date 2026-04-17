import { useState, useMemo } from 'react'
import { Box, Text, HStack } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import { FilterBar, Select, Input, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { useTransferRecords } from '@/api/queries/transfers'
import { toError } from '@/api/client'
import type { TransferRecord } from '@/types/domain'
import { fmtAmount } from '@/utils/fmtAmount'
import { toNumber } from '@/utils/parse'
import { maskUid } from '@/utils/mask'

interface TransferAgg {
  depositCount: number
  depositAmount: number
  withdrawalCount: number
  withdrawalAmount: number
}

/**
 * 单次 reduce 聚合（审计 P5 / C2：所有金额经 toNumber 防御后端字符串）。
 */
function aggregate(list: TransferRecord[]): TransferAgg {
  let depositCount = 0,
    depositAmount = 0,
    withdrawalCount = 0,
    withdrawalAmount = 0
  for (const r of list) {
    if (r.status !== 'success') continue
    const amt = toNumber(r.amount)
    if (r.type === 'deposit') {
      depositCount++
      depositAmount += amt
    } else if (r.type === 'withdrawal') {
      withdrawalCount++
      withdrawalAmount += amt
    }
  }
  return { depositCount, depositAmount, withdrawalCount, withdrawalAmount }
}

export default function OnchainTransfers() {
  const [uid, setUid] = useState('')
  const [type, setType] = useState('all')
  const [subType, setSubType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userLevel, setUserLevel] = useState('all')

  const q = useTransferRecords()
  const transferRecords = useMemo(() => q.data ?? [], [q.data])

  const hasFilter =
    uid !== '' ||
    type !== 'all' ||
    subType !== 'all' ||
    userLevel !== 'all' ||
    dateFrom !== '' ||
    dateTo !== ''

  const filtered = useMemo(() => {
    let data = transferRecords
    if (uid) data = data.filter(r => r.uid.includes(uid))
    if (type !== 'all') data = data.filter(r => r.type === type)
    if (subType !== 'all') data = data.filter(r => r.subType === subType)
    if (userLevel !== 'all') data = data.filter(r => r.userLevel === userLevel)
    return data
  }, [transferRecords, uid, type, subType, userLevel])

  const globalStats = useMemo(() => {
    const a = aggregate(transferRecords)
    return [
      { label: '充值笔数', value: a.depositCount },
      { label: '充值金额', value: fmtAmount(a.depositAmount), unit: 'USDT' },
      { label: '提现笔数', value: a.withdrawalCount },
      { label: '提现金额', value: fmtAmount(a.withdrawalAmount), unit: 'USDT' },
    ]
  }, [transferRecords])

  const filteredStatsData = useMemo(() => {
    const a = aggregate(filtered)
    return [
      { label: '充值', value: a.depositCount },
      { label: '充值额', value: fmtAmount(a.depositAmount), unit: 'USDT' },
      { label: '提现', value: a.withdrawalCount },
      { label: '提现额', value: fmtAmount(a.withdrawalAmount), unit: 'USDT' },
    ]
  }, [filtered])

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
            {fmtAmount(r.amount, { style: 'thousand' })}
          </Text>
        ),
        sortable: true,
        sortKey: r => toNumber(r.amount),
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
