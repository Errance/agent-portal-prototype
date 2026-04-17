import { useState, useMemo } from 'react'
import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import DataTable, { type Column } from '@/components/shared/DataTable'
import StatusBadge from '@/components/shared/StatusBadge'
import { FilterBar, Input, Select, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { useAgent } from '@/context/AgentContext'
import { inviteCodes as initialCodes, inviteStats } from '@/mock/data'
import type { InviteCode } from '@/mock/types'

export default function InvitePromotion() {
  const { isFrozen, currentFlatFeeRate, currentProfitShareRate, currentEventRate } = useAgent()
  const [codes, setCodes] = useState(initialCodes)
  const [showCreate, setShowCreate] = useState(false)
  const [createdCode, setCreatedCode] = useState<InviteCode | null>(null)
  const [ffRate, setFfRate] = useState('')
  const [psRate, setPsRate] = useState('')
  const [eventRate, setEventRate] = useState('')
  const [cRemark, setCRemark] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [editCode, setEditCode] = useState<InviteCode | null>(null)
  const [editFF, setEditFF] = useState('')
  const [editPS, setEditPS] = useState('')
  const [editEvent, setEditEvent] = useState('')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [revokeCode, setRevokeCode] = useState<InviteCode | null>(null)

  const [fCode, setFCode] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const hasFilter = fCode !== '' || statusFilter !== 'all' || dateFrom !== '' || dateTo !== ''

  const validateCreate = () => {
    const e: Record<string, string> = {}
    const f = parseFloat(ffRate); const p = parseFloat(psRate); const ev = parseFloat(eventRate)
    if (!ffRate || isNaN(f)) e.ff = '请输入'
    else if (f <= 0) e.ff = '必须大于 0'
    else if (f >= currentFlatFeeRate) e.ff = `必须 < ${currentFlatFeeRate}%`
    if (!psRate || isNaN(p)) e.ps = '请输入'
    else if (p <= 0) e.ps = '必须大于 0'
    else if (p >= currentProfitShareRate) e.ps = `必须 < ${currentProfitShareRate}%`
    if (!eventRate || isNaN(ev)) e.event = '请输入'
    else if (ev <= 0) e.event = '必须大于 0'
    else if (ev >= currentEventRate) e.event = `必须 < ${currentEventRate}%`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateEdit = () => {
    const e: Record<string, string> = {}
    const f = parseFloat(editFF); const p = parseFloat(editPS); const ev = parseFloat(editEvent)
    if (!editFF || isNaN(f)) e.ff = '请输入'
    else if (f <= 0) e.ff = '必须大于 0'
    else if (f >= currentFlatFeeRate) e.ff = `必须 < ${currentFlatFeeRate}%`
    if (!editPS || isNaN(p)) e.ps = '请输入'
    else if (p <= 0) e.ps = '必须大于 0'
    else if (p >= currentProfitShareRate) e.ps = `必须 < ${currentProfitShareRate}%`
    if (!editEvent || isNaN(ev)) e.event = '请输入'
    else if (ev <= 0) e.event = '必须大于 0'
    else if (ev >= currentEventRate) e.event = `必须 < ${currentEventRate}%`
    setEditErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = () => {
    if (!validateCreate()) return
    const newCode: InviteCode = {
      code: `TF${String(2000 + codes.length)}`,
      status: 'active',
      myFlatFeeRate: currentFlatFeeRate, subFlatFeeRate: parseFloat(ffRate),
      myProfitShareRate: currentProfitShareRate, subProfitShareRate: parseFloat(psRate),
      myEventRate: currentEventRate, subEventRate: parseFloat(eventRate),
      registrations: 0, firstDepositCount: 0, firstTradeCount: 0,
      tradeDau: 0, tradeVolume: 0, commission: 0,
      linkUrl: `https://app.turboflow.io/r/TF${String(2000 + codes.length)}`,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '), remark: cRemark,
    }
    setCodes(prev => [newCode, ...prev])
    setShowCreate(false)
    setCreatedCode(newCode)
    setFfRate(''); setPsRate(''); setEventRate(''); setCRemark('')
  }

  const handleEdit = () => {
    if (!validateEdit() || !editCode) return
    setCodes(prev => prev.map(c =>
      c.code === editCode.code
        ? { ...c, subFlatFeeRate: parseFloat(editFF), subProfitShareRate: parseFloat(editPS), subEventRate: parseFloat(editEvent) }
        : c
    ))
    setEditCode(null)
  }

  const handleRevoke = () => {
    if (!revokeCode) return
    setCodes(prev => prev.map(c =>
      c.code === revokeCode.code ? { ...c, status: 'revoked' as const } : c
    ))
    setRevokeCode(null)
  }

  const copyLink = (url: string, code: string) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(code); setTimeout(() => setCopied(null), 2000) })
  }

  const filtered = codes.filter(c => {
    if (fCode && !c.code.includes(fCode)) return false
    if (statusFilter === 'active' && c.status !== 'active') return false
    if (statusFilter === 'revoked' && c.status !== 'revoked') return false
    return true
  })

  const globalStatsData = [
    { label: '注册', value: inviteStats.registrations, unit: '人' },
    { label: '充值', value: inviteStats.depositAmount.toFixed(2), unit: 'USDT' },
    { label: '交易额', value: inviteStats.tradeVolume.toFixed(2), unit: 'USDT' },
    { label: '佣金', value: inviteStats.commission.toFixed(2), unit: 'USDT' },
    { label: 'DAU', value: inviteStats.tradeDau, unit: '人' },
  ]

  const filteredStatsData = useMemo(() => [
    { label: '注册', value: filtered.reduce((s, c) => s + c.registrations, 0), unit: '人' },
    { label: '充值', value: filtered.reduce((s, c) => s + c.firstDepositCount, 0), unit: '人' },
    { label: '交易额', value: filtered.reduce((s, c) => s + c.tradeVolume, 0).toFixed(2), unit: 'USDT' },
    { label: '佣金', value: filtered.reduce((s, c) => s + c.commission, 0).toFixed(2), unit: 'USDT' },
    { label: 'DAU', value: filtered.reduce((s, c) => s + c.tradeDau, 0), unit: '人' },
  ], [filtered])

  const columns: Column<InviteCode>[] = [
    { key: 'code', label: '推广码', render: r => <Text color="theme" fontFamily="ISB">{r.code}</Text>, minW: '80px' },
    {
      key: 'status', label: '状态',
      render: r => (
        <Text fontSize="13px" fontFamily="ISB" color={r.status === 'active' ? 'theme' : 'gray.100'}>
          {r.status === 'active' ? '有效' : '已作废'}
        </Text>
      ),
    },
    { key: 'ffRate', label: 'FF 下级比例', render: r => `${r.subFlatFeeRate.toFixed(2)}%` },
    { key: 'psRate', label: 'PS 下级比例', render: r => `${r.subProfitShareRate.toFixed(4)}%` },
    { key: 'eventRate', label: '事件下级比例', render: r => `${r.subEventRate.toFixed(2)}%` },
    { key: 'regs', label: '注册', render: r => r.registrations, sortable: true, sortKey: r => r.registrations },
    { key: 'dep', label: '充值', render: r => r.firstDepositCount },
    { key: 'trade', label: '交易', render: r => r.firstTradeCount },
    {
      key: 'action', label: '操作',
      render: r => (
        <HStack gap="8px">
          <Box as="button" fontSize="14px" color="theme" fontFamily="ISB" cursor="pointer" onClick={() => copyLink(r.linkUrl, r.code)}>
            {copied === r.code ? '已复制 ✓' : '复制链接'}
          </Box>
          {r.status === 'active' && (
            <>
              <Box as="button" fontSize="14px" color={isFrozen ? 'gray.100' : 'theme'} fontFamily="ISB"
                cursor={isFrozen ? 'not-allowed' : 'pointer'}
                onClick={() => {
                  if (isFrozen) return
                  setEditCode(r)
                  setEditFF(r.subFlatFeeRate.toFixed(2))
                  setEditPS(r.subProfitShareRate.toFixed(4))
                  setEditEvent(r.subEventRate.toFixed(2))
                }}>
                编辑
              </Box>
              <Box as="button" fontSize="14px" color={isFrozen ? 'gray.100' : 'red.100'} fontFamily="ISB"
                cursor={isFrozen ? 'not-allowed' : 'pointer'}
                onClick={() => { if (!isFrozen) setRevokeCode(r) }}>
                作废
              </Box>
            </>
          )}
        </HStack>
      ),
    },
  ]

  const formInput = (label: string, val: string, onChange: (v: string) => void, step: string, error?: string, extra?: string) => (
    <Box>
      <Text fontSize="14px" color="gray.100" mb="6px">{label}{extra && <Text as="span" color="gray.200" fontSize="12px"> {extra}</Text>}</Text>
      <Box as="input" w="100%" h="40px" bg="bg.100" border="1px solid"
        borderColor={error ? 'red.100' : 'border.100'} borderRadius="6px" px={3}
        fontSize="14px" color="text.100" outline="none" type="number" step={step}
        value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        _focus={{ borderColor: error ? 'red.100' : 'theme' }} />
      {error && <Text fontSize="12px" color="red.100" mt="4px">{error}</Text>}
    </Box>
  )

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="4px">
        <Flex align="baseline" gap="24px">
          <Text fontFamily="ISB" fontSize="16px">推广链接</Text>
          <Flex gap="16px" fontSize="13px" color="gray.100">
            <Text>FF <Text as="span" fontFamily="ISB" color="text.100">{currentFlatFeeRate.toFixed(2)}%</Text></Text>
            <Text>PS <Text as="span" fontFamily="ISB" color="text.100">{currentProfitShareRate.toFixed(4)}%</Text></Text>
            <Text>事件 <Text as="span" fontFamily="ISB" color="text.100">{currentEventRate.toFixed(2)}%</Text></Text>
          </Flex>
        </Flex>
        <Box as="button" px="16px" py="8px" bg={isFrozen ? 'bg.300' : 'nav.bg'}
          color={isFrozen ? 'gray.100' : '#fff'} borderRadius="6px" fontSize="14px" fontFamily="ISB"
          cursor={isFrozen ? 'not-allowed' : 'pointer'} onClick={() => !isFrozen && setShowCreate(true)}
          _hover={isFrozen ? {} : { opacity: 0.85 }} title={isFrozen ? '账号已冻结' : ''}>
          新建推广码
        </Box>
      </Flex>

      <FilterBar onSearch={() => {}} onReset={() => { setFCode(''); setStatusFilter('all'); setDateFrom(''); setDateTo('') }}>
        <FilterItem label="推广码"><Input value={fCode} onChange={setFCode} placeholder="精确搜索" /></FilterItem>
        <FilterItem label="状态">
          <Select value={statusFilter} onChange={setStatusFilter} options={[
            { label: '全部', value: 'all' }, { label: '有效', value: 'active' }, { label: '已作废', value: 'revoked' },
          ]} />
        </FilterItem>
        <FilterItem label="统计时间" wide>
          <DateRangeInput from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </FilterItem>
      </FilterBar>

      <InlineStatsBar stats={globalStatsData} />
      {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsData} />}

      <DataTable data={filtered} columns={columns} stickyRight />

      {/* 新建推广码弹窗 */}
      {showCreate && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setShowCreate(false)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)" onClick={e => e.stopPropagation()}>
            <Text fontFamily="ISB" fontSize="18px" mb="16px">新建推广码</Text>
            <Flex direction="column" gap="16px">
              {formInput('Flat Fee 下级返佣比例（%）', ffRate, setFfRate, '0.01', errors.ff, `上限: ${currentFlatFeeRate}%`)}
              {formInput('Profit Share 下级返佣比例（%）', psRate, setPsRate, '0.0001', errors.ps, `上限: ${currentProfitShareRate}%`)}
              {formInput('事件合约下级返佣比例（%）', eventRate, setEventRate, '0.01', errors.event, `上限: ${currentEventRate}%`)}
              <Box>
                <Text fontSize="14px" color="gray.100" mb="6px">备注（可选）</Text>
                <Box as="input" w="100%" h="40px" bg="bg.100" border="1px solid"
                  borderColor="border.100" borderRadius="6px" px={3}
                  fontSize="14px" color="text.100" outline="none"
                  value={cRemark} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCRemark(e.target.value)}
                  _focus={{ borderColor: 'theme' }} />
              </Box>
            </Flex>
            <Flex justify="flex-end" gap="8px" mt="20px">
              <Box as="button" px="20px" py="8px" bg="bg.200" color="text.100" border="1px solid" borderColor="border.100"
                borderRadius="6px" fontSize="14px" cursor="pointer" onClick={() => setShowCreate(false)}
                _hover={{ bg: 'bg.100' }}>取消</Box>
              <Box as="button" px="20px" py="8px" bg="nav.bg" color="#fff" borderRadius="6px" fontSize="14px"
                fontFamily="ISB" cursor="pointer" onClick={handleCreate} _hover={{ opacity: 0.85 }}>创建</Box>
            </Flex>
          </Box>
        </Box>
      )}

      {/* 编辑推广码弹窗 */}
      {editCode && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setEditCode(null)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)" onClick={e => e.stopPropagation()}>
            <Text fontFamily="ISB" fontSize="18px" mb="4px">编辑推广码</Text>
            <Text fontSize="13px" color="gray.100" mb="16px">推广码: {editCode.code}</Text>
            <Flex direction="column" gap="16px">
              {formInput('Flat Fee 下级返佣比例（%）', editFF, setEditFF, '0.01', editErrors.ff, `上限: ${currentFlatFeeRate}%`)}
              {formInput('Profit Share 下级返佣比例（%）', editPS, setEditPS, '0.0001', editErrors.ps, `上限: ${currentProfitShareRate}%`)}
              {formInput('事件合约下级返佣比例（%）', editEvent, setEditEvent, '0.01', editErrors.event, `上限: ${currentEventRate}%`)}
            </Flex>
            <Text fontSize="12px" color="gray.100" mt="12px">修改不追溯，仅影响后续通过该推广码注册的新用户。</Text>
            <Flex justify="flex-end" gap="8px" mt="16px">
              <Box as="button" px="20px" py="8px" bg="bg.200" color="text.100" border="1px solid" borderColor="border.100"
                borderRadius="6px" fontSize="14px" cursor="pointer" onClick={() => setEditCode(null)}
                _hover={{ bg: 'bg.100' }}>取消</Box>
              <Box as="button" px="20px" py="8px" bg="nav.bg" color="#fff" borderRadius="6px" fontSize="14px"
                fontFamily="ISB" cursor="pointer" onClick={handleEdit} _hover={{ opacity: 0.85 }}>保存</Box>
            </Flex>
          </Box>
        </Box>
      )}

      {/* 作废确认弹窗 */}
      {revokeCode && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setRevokeCode(null)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="420px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)" onClick={e => e.stopPropagation()}>
            <Text fontFamily="ISB" fontSize="18px" mb="12px">确认作废推广码</Text>
            <Text fontSize="14px" color="gray.100" mb="4px">
              确定要作废推广码 <Text as="span" fontFamily="ISB" color="theme">{revokeCode.code}</Text> 吗？
            </Text>
            <Text fontSize="13px" color="gray.200" mb="16px">
              作废后该推广码将无法再邀请新用户，已通过该推广码注册的用户不受影响。此操作不可撤销。
            </Text>
            <Flex justify="flex-end" gap="8px">
              <Box as="button" px="20px" py="8px" bg="bg.200" color="text.100" border="1px solid" borderColor="border.100"
                borderRadius="6px" fontSize="14px" cursor="pointer" onClick={() => setRevokeCode(null)}
                _hover={{ bg: 'bg.100' }}>取消</Box>
              <Box as="button" px="20px" py="8px" bg="red.100" color="#fff" borderRadius="6px" fontSize="14px"
                fontFamily="ISB" cursor="pointer" onClick={handleRevoke} _hover={{ opacity: 0.85 }}>确认作废</Box>
            </Flex>
          </Box>
        </Box>
      )}

      {/* 创建成功弹窗 */}
      {createdCode && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setCreatedCode(null)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)" onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" mb="16px">
              <Text fontFamily="ISB" fontSize="18px" color="theme">推广码创建成功</Text>
              <Box as="button" fontSize="18px" color="gray.100" cursor="pointer" onClick={() => setCreatedCode(null)}
                _hover={{ color: 'text.100' }}>✕</Box>
            </Flex>
            <Flex direction="column" gap="12px">
              <Box>
                <Text fontSize="14px" color="gray.100">推广码</Text>
                <Text fontFamily="ISB" fontSize="24px" color="theme" mt="4px">{createdCode.code}</Text>
              </Box>
              <Flex gap="24px" flexWrap="wrap">
                <Box><Text fontSize="13px" color="gray.100">FF 下级比例</Text><Text fontFamily="ISB" mt="2px">{createdCode.subFlatFeeRate.toFixed(2)}%</Text></Box>
                <Box><Text fontSize="13px" color="gray.100">PS 下级比例</Text><Text fontFamily="ISB" mt="2px">{createdCode.subProfitShareRate.toFixed(4)}%</Text></Box>
                <Box><Text fontSize="13px" color="gray.100">事件下级比例</Text><Text fontFamily="ISB" mt="2px">{createdCode.subEventRate.toFixed(2)}%</Text></Box>
              </Flex>
              <Box>
                <Text fontSize="14px" color="gray.100">推广链接</Text>
                <Flex mt="4px" align="center" gap="8px">
                  <Text fontSize="14px" color="text.100" flex={1} overflow="hidden" textOverflow="ellipsis">{createdCode.linkUrl}</Text>
                  <Box as="button" px="12px" py="4px" bg="nav.bg" color="#fff" borderRadius="6px" fontSize="12px"
                    fontFamily="ISB" cursor="pointer" onClick={() => copyLink(createdCode.linkUrl, createdCode.code)}
                    _hover={{ opacity: 0.85 }}>
                    {copied === createdCode.code ? '已复制 ✓' : '复制'}
                  </Box>
                </Flex>
              </Box>
              {createdCode.remark && (
                <Box><Text fontSize="14px" color="gray.100">备注</Text><Text fontSize="14px" mt="4px">{createdCode.remark}</Text></Box>
              )}
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  )
}
