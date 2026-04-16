import { useState, useMemo } from 'react'
import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import StatCard from '@/components/shared/StatCard'
import FilteredStatsPanel from '@/components/shared/FilteredStatsPanel'
import DataTable, { type Column } from '@/components/shared/DataTable'
import { FilterBar, Input, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import { useAgent } from '@/context/AgentContext'
import { inviteCodes as initialCodes, inviteStats } from '@/mock/data'
import type { InviteCode } from '@/mock/types'

export default function InvitePromotion() {
  const { isFrozen, currentPerpRate, currentEventRate } = useAgent()
  const [codes, setCodes] = useState(initialCodes)
  const [showCreate, setShowCreate] = useState(false)
  const [createdCode, setCreatedCode] = useState<InviteCode | null>(null)
  const [perpRate, setPerpRate] = useState('')
  const [eventRate, setEventRate] = useState('')
  const [cRemark, setCRemark] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [fCode, setFCode] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const hasFilter = fCode !== '' || dateFrom !== '' || dateTo !== ''

  const validate = () => {
    const e: Record<string, string> = {}
    const pr = parseFloat(perpRate); const er = parseFloat(eventRate)
    if (!perpRate || isNaN(pr)) e.perp = '请输入永续合约返佣比例'
    else if (pr <= 0) e.perp = '必须大于 0'
    else if (pr >= currentPerpRate) e.perp = `必须小于自身比例 ${currentPerpRate}%`
    else if (Math.round(pr * 100) !== pr * 100) e.perp = '最小步长为 0.01%'
    if (!eventRate || isNaN(er)) e.event = '请输入事件合约返佣比例'
    else if (er <= 0) e.event = '必须大于 0'
    else if (er >= currentEventRate) e.event = `必须小于自身比例 ${currentEventRate}%`
    else if (Math.round(er * 100) !== er * 100) e.event = '最小步长为 0.01%'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = () => {
    if (!validate()) return
    const newCode: InviteCode = {
      code: `TF${String(2000 + codes.length)}`,
      myPerpRate: currentPerpRate, subPerpRate: parseFloat(perpRate),
      myEventRate: currentEventRate, subEventRate: parseFloat(eventRate),
      registrations: 0, firstDepositCount: 0, firstTradeCount: 0,
      tradeDau: 0, tradeVolume: 0, commission: 0,
      linkUrl: `https://app.turboflow.io/r/TF${String(2000 + codes.length)}`,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '), remark: cRemark,
    }
    setCodes(prev => [newCode, ...prev])
    setShowCreate(false)
    setCreatedCode(newCode)
    setPerpRate(''); setEventRate(''); setCRemark('')
  }

  const copyLink = (url: string, code: string) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(code); setTimeout(() => setCopied(null), 2000) })
  }

  const filtered = codes.filter(c => {
    if (fCode && !c.code.includes(fCode)) return false
    return true
  })

  const filteredStatsData = useMemo(() => {
    return [
      { label: '注册人数', value: filtered.reduce((s, c) => s + c.registrations, 0), unit: '人' },
      { label: '充值人数', value: filtered.reduce((s, c) => s + c.firstDepositCount, 0), unit: '人' },
      { label: '交易额', value: filtered.reduce((s, c) => s + c.tradeVolume, 0).toFixed(2), unit: 'USDT' },
      { label: '佣金', value: filtered.reduce((s, c) => s + c.commission, 0).toFixed(2), unit: 'USDT' },
      { label: '交易 DAU', value: filtered.reduce((s, c) => s + c.tradeDau, 0), unit: '人' },
    ]
  }, [filtered])

  const columns: Column<InviteCode>[] = [
    { key: 'code', label: '邀请码', render: r => <Text color="theme" fontFamily="ISB">{r.code}</Text>, minW: '100px' },
    { key: 'perpRate', label: '下级永续返佣比例', render: r => `${r.subPerpRate}%` },
    { key: 'eventRate', label: '下级事件返佣比例', render: r => `${r.subEventRate}%` },
    { key: 'regs', label: '注册', render: r => r.registrations, sortable: true, sortKey: r => r.registrations },
    { key: 'dep', label: '充值', render: r => r.firstDepositCount },
    { key: 'trade', label: '交易', render: r => r.firstTradeCount },
    {
      key: 'action', label: '操作',
      render: r => (
        <HStack gap={2}>
          <Box as="button" fontSize="xs" color="theme" fontFamily="ISB" cursor="pointer" onClick={() => copyLink(r.linkUrl, r.code)}>
            {copied === r.code ? '已复制 ✓' : '复制链接'}
          </Box>
        </HStack>
      ),
    },
  ]

  const formInput = (label: string, val: string, onChange: (v: string) => void, error?: string, extra?: string, type?: string) => (
    <Box>
      <Text fontSize="xs" color="gray.100" mb={1}>{label}{extra && <Text as="span" color="gray.200" fontSize="xs"> {extra}</Text>}</Text>
      <Box as="input" w="100%" h="40px" bg="bg.100" border="1px solid"
        borderColor={error ? 'red.100' : 'border.100'} borderRadius="md" px={3}
        fontSize="sm" color="text.200" outline="none" type={type || 'text'}
        value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        _focus={{ borderColor: error ? 'red.100' : 'theme' }} />
      {error && <Text fontSize="xs" color="red.100" mt={1}>{error}</Text>}
    </Box>
  )

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontFamily="ISB" fontSize="md">邀请链接</Text>
        <Box as="button" px={4} py={2} bg={isFrozen ? 'bg.300' : 'theme'}
          color={isFrozen ? 'gray.200' : '#fff'} borderRadius="md" fontSize="sm" fontFamily="ISB"
          cursor={isFrozen ? 'not-allowed' : 'pointer'} onClick={() => !isFrozen && setShowCreate(true)}
          _hover={isFrozen ? {} : { opacity: 0.85 }} title={isFrozen ? '账号已冻结' : ''}>
          新建邀请码
        </Box>
      </Flex>

      <FilterBar onSearch={() => {}} onReset={() => { setFCode(''); setDateFrom(''); setDateTo('') }}>
        <FilterItem label="邀请码"><Input value={fCode} onChange={setFCode} placeholder="精确搜索" /></FilterItem>
        <FilterItem label="统计时间">
          <DateRangeInput from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </FilterItem>
      </FilterBar>

      <Flex gap={3} mb={4} flexWrap="wrap">
        <StatCard label="我的永续返佣比例" value={`${currentPerpRate}%`} />
        <StatCard label="我的事件返佣比例" value={`${currentEventRate}%`} />
        <StatCard label="注册人数" value={inviteStats.registrations} unit="人" />
        <StatCard label="充值（USDT）" value={inviteStats.depositAmount} unit="USDT" />
        <StatCard label="交易额（USDT）" value={inviteStats.tradeVolume} unit="USDT" />
        <StatCard label="佣金（USDT）" value={inviteStats.commission} unit="USDT" />
        <StatCard label="交易 DAU" value={inviteStats.tradeDau} unit="人" />
      </Flex>

      {hasFilter && (
        <Box mb={4}>
          <FilteredStatsPanel title="筛选结果统计" stats={filteredStatsData} />
        </Box>
      )}

      <DataTable data={filtered} columns={columns} stickyRight />

      {showCreate && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setShowCreate(false)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="xl" p={6} w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.1)" onClick={e => e.stopPropagation()}>
            <Text fontFamily="ISB" fontSize="lg" mb={4}>新建邀请码</Text>
            <Flex direction="column" gap={4}>
              {formInput('永续合约返佣比例（%）', perpRate, setPerpRate, errors.perp, `自身: ${currentPerpRate}%`, 'number')}
              {formInput('事件合约返佣比例（%）', eventRate, setEventRate, errors.event, `自身: ${currentEventRate}%`, 'number')}
              {formInput('备注（可选）', cRemark, setCRemark)}
              <Text fontSize="xs" color="gray.200">如需修改已创建邀请码的返佣比例，请联系平台运营专员。</Text>
            </Flex>
            <Flex justify="flex-end" gap={2} mt={5}>
              <Box as="button" px={5} py={2} bg="bg.300" color="text.200" border="1px solid" borderColor="border.100"
                borderRadius="md" fontSize="sm" cursor="pointer" onClick={() => setShowCreate(false)}>取消</Box>
              <Box as="button" px={5} py={2} bg="theme" color="#fff" borderRadius="md" fontSize="sm"
                fontFamily="ISB" cursor="pointer" onClick={handleCreate}>创建</Box>
            </Flex>
          </Box>
        </Box>
      )}

      {createdCode && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setCreatedCode(null)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="xl" p={6} w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.1)" onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontFamily="ISB" fontSize="lg" color="theme">邀请码创建成功</Text>
              <Box as="button" fontSize="lg" color="gray.200" cursor="pointer" onClick={() => setCreatedCode(null)}
                _hover={{ color: 'text.100' }}>✕</Box>
            </Flex>
            <Flex direction="column" gap={3}>
              <Box>
                <Text fontSize="xs" color="gray.100">邀请码</Text>
                <Text fontFamily="ISB" fontSize="xl" color="theme" mt={1}>{createdCode.code}</Text>
              </Box>
              <Flex gap={6}>
                <Box>
                  <Text fontSize="xs" color="gray.100">下级永续返佣比例</Text>
                  <Text fontFamily="ISB" mt={1}>{createdCode.subPerpRate}%</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.100">下级事件返佣比例</Text>
                  <Text fontFamily="ISB" mt={1}>{createdCode.subEventRate}%</Text>
                </Box>
              </Flex>
              <Box>
                <Text fontSize="xs" color="gray.100">邀请链接</Text>
                <Flex mt={1} align="center" gap={2}>
                  <Text fontSize="sm" color="text.200" flex={1} overflow="hidden" textOverflow="ellipsis">{createdCode.linkUrl}</Text>
                  <Box as="button" px={3} py={1} bg="theme" color="#fff" borderRadius="md" fontSize="xs"
                    fontFamily="ISB" cursor="pointer" onClick={() => copyLink(createdCode.linkUrl, createdCode.code)}
                    _hover={{ opacity: 0.85 }}>
                    {copied === createdCode.code ? '已复制 ✓' : '复制'}
                  </Box>
                </Flex>
              </Box>
              {createdCode.remark && (
                <Box>
                  <Text fontSize="xs" color="gray.100">备注</Text>
                  <Text fontSize="sm" mt={1}>{createdCode.remark}</Text>
                </Box>
              )}
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  )
}
