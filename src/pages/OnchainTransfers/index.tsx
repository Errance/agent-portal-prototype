import { useState, useMemo } from 'react'
import { Box, Text } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import { FilterBar, Select, Input, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { transferRecords } from '@/mock/data'
import type { TransferRecord } from '@/mock/types'

export default function OnchainTransfers() {
  const [uid, setUid] = useState('')
  const [type, setType] = useState('all')
  const [subType, setSubType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userLevel, setUserLevel] = useState('all')

  const hasFilter = uid !== '' || type !== 'all' || subType !== 'all' || userLevel !== 'all' || dateFrom !== '' || dateTo !== ''

  const filtered = useMemo(() => {
    let data = transferRecords
    if (uid) data = data.filter(r => r.uid.includes(uid))
    if (type !== 'all') data = data.filter(r => r.type === type)
    if (subType !== 'all') data = data.filter(r => r.subType === subType)
    if (userLevel !== 'all') data = data.filter(r => r.userLevel === userLevel)
    return data
  }, [uid, type, subType, userLevel])

  const globalStats = useMemo(() => {
    const depRecs = transferRecords.filter(r => r.type === 'deposit' && r.status === 'success')
    const withRecs = transferRecords.filter(r => r.type === 'withdrawal' && r.status === 'success')
    return [
      { label: '充值笔数', value: depRecs.length },
      { label: '充值金额', value: depRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
      { label: '提现笔数', value: withRecs.length },
      { label: '提现金额', value: withRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
    ]
  }, [])

  const filteredStatsData = useMemo(() => {
    const depRecs = filtered.filter(r => r.type === 'deposit' && r.status === 'success')
    const withRecs = filtered.filter(r => r.type === 'withdrawal' && r.status === 'success')
    return [
      { label: '充值', value: depRecs.length },
      { label: '充值额', value: depRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
      { label: '提现', value: withRecs.length },
      { label: '提现额', value: withRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
    ]
  }, [filtered])

  const columns: Column<TransferRecord>[] = [
    { key: 'uid', label: '用户 UID', render: r => r.uid },
    { key: 'level', label: '用户等级', render: r => r.userLevel === 'sub_agent' ? '子代理' : '普通用户' },
    { key: 'sub', label: '子代理名称/UID', render: r => r.subAgentUid ?? '—' },
    { key: 'channel', label: '渠道名称', render: r => r.channel },
    { key: 'type', label: '充提类型', render: r => r.type === 'deposit' ? '充值' : '提现' },
    { key: 'subType', label: '充提子类型', render: r => r.subType === 'normal' ? '普通' : '内部转账' },
    { key: 'amt', label: '数量（USDT）', render: r => r.amount.toFixed(2), sortable: true, sortKey: r => r.amount },
    { key: 'status', label: '状态', render: r => <StatusBadge type="transfer" value={r.status} /> },
    { key: 'time', label: '时间', render: r => r.time },
  ]

  return (
    <Box>
      <FilterBar
        onSearch={() => {}}
        onReset={() => { setUid(''); setType('all'); setSubType('all'); setDateFrom(''); setDateTo(''); setUserLevel('all') }}
      >
        <FilterItem label="用户 UID"><Input value={uid} onChange={setUid} placeholder="精确搜索" /></FilterItem>
        <FilterItem label="充提类型">
          <Select value={type} onChange={setType} options={[
            { label: '全部', value: 'all' }, { label: '充值', value: 'deposit' }, { label: '提现', value: 'withdrawal' },
          ]} />
        </FilterItem>
        <FilterItem label="充提子类型">
          <Select value={subType} onChange={setSubType} options={[
            { label: '全部', value: 'all' }, { label: '普通', value: 'normal' }, { label: '内部转账', value: 'internal_transfer' },
          ]} />
        </FilterItem>
        <FilterItem label="统计时间" wide>
          <DateRangeInput from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </FilterItem>
        <FilterItem label="用户等级">
          <Select value={userLevel} onChange={setUserLevel} options={[
            { label: '全部', value: 'all' }, { label: '普通用户', value: 'regular' }, { label: '子代理', value: 'sub_agent' },
          ]} />
        </FilterItem>
      </FilterBar>

      <InlineStatsBar stats={globalStats} />
      {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsData} />}

      <DataTable data={filtered} columns={columns} />
    </Box>
  )
}
