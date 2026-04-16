import { useState, useMemo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { FilterBar, Select, Input, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { transferRecords } from '@/mock/data'
import type { TransferRecord } from '@/mock/types'

export default function OnchainTransfers() {
  const [uid, setUid] = useState('')
  const [transferId, setTransferId] = useState('')
  const [type, setType] = useState('all')
  const [subType, setSubType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userLevel, setUserLevel] = useState('all')
  const [remark, setRemark] = useState('')
  const [expandDeposit, setExpandDeposit] = useState(false)
  const [expandWithdraw, setExpandWithdraw] = useState(false)

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

  const totalDeposit = filtered.filter(r => r.type === 'deposit' && r.status === 'success').reduce((s, r) => s + r.amount, 0)
  const totalWithdraw = filtered.filter(r => r.type === 'withdrawal' && r.status === 'success').reduce((s, r) => s + r.amount, 0)

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

  const collapsibleSection = (label: string, amount: number, expanded: boolean, toggle: () => void, filterType: string) => (
    <Box
      bg="bg.200" border="1px solid" borderColor="border.100" borderRadius={{ base: '0', md: 'lg' }} px={5} py={3}
      cursor="pointer" onClick={toggle}
    >
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color="text.200">{label}: <Text as="span" fontFamily="ISB" color="text.100">{amount.toFixed(2)} USDT</Text></Text>
        <Text fontSize="xs" color="gray.200">{expanded ? '收起 ▲' : '展开 ▼'}</Text>
      </Flex>
      {expanded && (
        <Box mt={3} onClick={e => e.stopPropagation()}>
          <DataTable data={filtered.filter(r => r.type === filterType)} columns={columns} pageSize={5} />
        </Box>
      )}
    </Box>
  )

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

      <Flex direction="column" gap={2} mb={6}>
        {collapsibleSection('链上充值', totalDeposit, expandDeposit, () => setExpandDeposit(!expandDeposit), 'deposit')}
        {collapsibleSection('链上提现', totalWithdraw, expandWithdraw, () => setExpandWithdraw(!expandWithdraw), 'withdrawal')}
      </Flex>

      <DataTable data={filtered} columns={columns} />
    </Box>
  )
}
