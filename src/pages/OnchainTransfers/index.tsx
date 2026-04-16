import { useState, useMemo } from 'react'
import { Box } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import FilteredStatsPanel from '@/components/shared/FilteredStatsPanel'
import { FilterBar, Select, Input, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { transferRecords } from '@/mock/data'
import type { TransferRecord } from '@/mock/types'
import { Text } from '@chakra-ui/react'

export default function OnchainTransfers() {
  const [uid, setUid] = useState('')
  const [transferId, setTransferId] = useState('')
  const [type, setType] = useState('all')
  const [subType, setSubType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userLevel, setUserLevel] = useState('all')
  const [remark, setRemark] = useState('')

  const hasFilter = uid !== '' || transferId !== '' || type !== 'all' || subType !== 'all' || userLevel !== 'all' || remark !== '' || dateFrom !== '' || dateTo !== ''

  const filtered = useMemo(() => {
    let data = transferRecords
    if (uid) data = data.filter(r => r.uid.includes(uid))
    if (transferId) data = data.filter(r => r.transferId.includes(transferId))
    if (type !== 'all') data = data.filter(r => r.type === type)
    if (subType !== 'all') data = data.filter(r => r.subType === subType)
    if (userLevel !== 'all') data = data.filter(r => r.userLevel === userLevel)
    if (remark) data = data.filter(r => r.remark.toLowerCase().includes(remark.toLowerCase()))
    return data
  }, [uid, transferId, type, subType, userLevel, remark])

  const globalStats = useMemo(() => {
    const depRecs = transferRecords.filter(r => r.type === 'deposit' && r.status === 'success')
    const withRecs = transferRecords.filter(r => r.type === 'withdrawal' && r.status === 'success')
    return [
      { label: '总充值笔数', value: depRecs.length },
      { label: '总充值金额', value: depRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
      { label: '总提现笔数', value: withRecs.length },
      { label: '总提现金额', value: withRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
    ]
  }, [])

  const filteredStatsData = useMemo(() => {
    const depRecs = filtered.filter(r => r.type === 'deposit' && r.status === 'success')
    const withRecs = filtered.filter(r => r.type === 'withdrawal' && r.status === 'success')
    return [
      { label: '充值笔数', value: depRecs.length },
      { label: '充值金额', value: depRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
      { label: '提现笔数', value: withRecs.length },
      { label: '提现金额', value: withRecs.reduce((s, r) => s + r.amount, 0).toFixed(2), unit: 'USDT' },
    ]
  }, [filtered])

  const columns: Column<TransferRecord>[] = [
    { key: 'uid', label: '用户 UID', render: r => r.uid },
    { key: 'level', label: '用户等级', render: r => r.userLevel === 'sub_agent' ? '子代理' : '普通用户' },
    { key: 'sub', label: '子代理名称/UID', render: r => r.subAgentUid ?? '—' },
    { key: 'remark', label: '备注', render: r => r.remark || '—' },
    { key: 'channel', label: '渠道名称', render: r => r.channel },
    { key: 'tid', label: '充提 ID', render: r => <Text fontSize="xs" maxW="120px" overflow="hidden" textOverflow="ellipsis">{r.transferId}</Text> },
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
        onReset={() => { setUid(''); setTransferId(''); setType('all'); setSubType('all'); setDateFrom(''); setDateTo(''); setUserLevel('all'); setRemark('') }}
      >
        <FilterItem label="用户 UID"><Input value={uid} onChange={setUid} placeholder="精确搜索" /></FilterItem>
        <FilterItem label="充提 ID"><Input value={transferId} onChange={setTransferId} placeholder="精确搜索" /></FilterItem>
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
        <FilterItem label="统计时间">
          <DateRangeInput from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </FilterItem>
        <FilterItem label="用户等级">
          <Select value={userLevel} onChange={setUserLevel} options={[
            { label: '全部', value: 'all' }, { label: '普通用户', value: 'regular' }, { label: '子代理', value: 'sub_agent' },
          ]} />
        </FilterItem>
        <FilterItem label="备注"><Input value={remark} onChange={setRemark} placeholder="模糊搜索" /></FilterItem>
      </FilterBar>

      <Box mb={4}>
        <FilteredStatsPanel title="全局统计" stats={globalStats} />
      </Box>

      {hasFilter && (
        <Box mb={4}>
          <FilteredStatsPanel title="筛选结果统计" stats={filteredStatsData} />
        </Box>
      )}

      <DataTable data={filtered} columns={columns} />
    </Box>
  )
}
