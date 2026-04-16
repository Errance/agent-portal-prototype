import { useState, useMemo } from 'react'
import { Box, Flex, Text, HStack } from '@chakra-ui/react'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import DataTable, { type Column } from '@/components/shared/DataTable'
import { FilterBar, Input, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
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

  const [fCode, setFCode] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const hasFilter = fCode !== '' || dateFrom !== '' || dateTo !== ''

  const validate = () => {
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

  const handleCreate = () => {
    if (!validate()) return
    const newCode: InviteCode = {
      code: `TF${String(2000 + codes.length)}`,
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

  const copyLink = (url: string, code: string) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(code); setTimeout(() => setCopied(null), 2000) })
  }

  const filtered = codes.filter(c => {
    if (fCode && !c.code.includes(fCode)) return false
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
    { key: 'code', label: '邀请码', render: r => <Text color="theme" fontFamily="ISB">{r.code}</Text>, minW: '80px' },
    { key: 'ffRate', label: 'FF(我/下级)', render: r => `${r.myFlatFeeRate}% / ${r.subFlatFeeRate}%` },
    { key: 'psRate', label: 'PS(我/下级)', render: r => `${r.myProfitShareRate}% / ${r.subProfitShareRate}%` },
    { key: 'eventRate', label: '事件(我/下级)', render: r => `${r.myEventRate}% / ${r.subEventRate}%` },
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
        </HStack>
      ),
    },
  ]

  const formInput = (label: string, val: string, onChange: (v: string) => void, error?: string, extra?: string) => (
    <Box>
      <Text fontSize="14px" color="gray.100" mb="6px">{label}{extra && <Text as="span" color="gray.200" fontSize="12px"> {extra}</Text>}</Text>
      <Box as="input" w="100%" h="40px" bg="bg.100" border="1px solid"
        borderColor={error ? 'red.100' : 'border.100'} borderRadius="6px" px={3}
        fontSize="14px" color="text.100" outline="none" type="number"
        value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        _focus={{ borderColor: error ? 'red.100' : 'theme' }} />
      {error && <Text fontSize="12px" color="red.100" mt="4px">{error}</Text>}
    </Box>
  )

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="4px">
        <Flex align="baseline" gap="24px">
          <Text fontFamily="ISB" fontSize="16px">邀请链接</Text>
          <Flex gap="16px" fontSize="13px" color="gray.100">
            <Text>FF <Text as="span" fontFamily="ISB" color="text.100">{currentFlatFeeRate}%</Text></Text>
            <Text>PS <Text as="span" fontFamily="ISB" color="text.100">{currentProfitShareRate}%</Text></Text>
            <Text>事件 <Text as="span" fontFamily="ISB" color="text.100">{currentEventRate}%</Text></Text>
          </Flex>
        </Flex>
        <Box as="button" px="16px" py="8px" bg={isFrozen ? 'bg.300' : 'nav.bg'}
          color={isFrozen ? 'gray.100' : '#fff'} borderRadius="6px" fontSize="14px" fontFamily="ISB"
          cursor={isFrozen ? 'not-allowed' : 'pointer'} onClick={() => !isFrozen && setShowCreate(true)}
          _hover={isFrozen ? {} : { opacity: 0.85 }} title={isFrozen ? '账号已冻结' : ''}>
          新建邀请码
        </Box>
      </Flex>

      <FilterBar onSearch={() => {}} onReset={() => { setFCode(''); setDateFrom(''); setDateTo('') }}>
        <FilterItem label="邀请码"><Input value={fCode} onChange={setFCode} placeholder="精确搜索" /></FilterItem>
        <FilterItem label="统计时间" wide>
          <DateRangeInput from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
        </FilterItem>
      </FilterBar>

      <InlineStatsBar stats={globalStatsData} />
      {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsData} />}

      <DataTable data={filtered} columns={columns} stickyRight />

      {showCreate && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setShowCreate(false)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)" onClick={e => e.stopPropagation()}>
            <Text fontFamily="ISB" fontSize="18px" mb="16px">新建邀请码</Text>
            <Flex direction="column" gap="16px">
              {formInput('Flat Fee 返佣比例（%）', ffRate, setFfRate, errors.ff, `自身: ${currentFlatFeeRate}%`)}
              {formInput('Profit Share 返佣比例（%）', psRate, setPsRate, errors.ps, `自身: ${currentProfitShareRate}%`)}
              {formInput('事件合约返佣比例（%）', eventRate, setEventRate, errors.event, `自身: ${currentEventRate}%`)}
              <Box>
                <Text fontSize="14px" color="gray.100" mb="6px">备注（可选）</Text>
                <Box as="input" w="100%" h="40px" bg="bg.100" border="1px solid"
                  borderColor="border.100" borderRadius="6px" px={3}
                  fontSize="14px" color="text.100" outline="none"
                  value={cRemark} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCRemark(e.target.value)}
                  _focus={{ borderColor: 'theme' }} />
              </Box>
              <Text fontSize="12px" color="gray.100">如需修改已创建邀请码的返佣比例，请联系平台运营专员。</Text>
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

      {createdCode && (
        <Box position="fixed" inset={0} bg="rgba(0,0,0,0.3)" zIndex={300} onClick={() => setCreatedCode(null)}>
          <Box position="fixed" top="50%" left="50%" transform="translate(-50%,-50%)"
            bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="12px" p="24px" w="480px"
            boxShadow="0 8px 32px rgba(0,0,0,0.08)" onClick={e => e.stopPropagation()}>
            <Flex justify="space-between" align="center" mb="16px">
              <Text fontFamily="ISB" fontSize="18px" color="theme">邀请码创建成功</Text>
              <Box as="button" fontSize="18px" color="gray.100" cursor="pointer" onClick={() => setCreatedCode(null)}
                _hover={{ color: 'text.100' }}>✕</Box>
            </Flex>
            <Flex direction="column" gap="12px">
              <Box>
                <Text fontSize="14px" color="gray.100">邀请码</Text>
                <Text fontFamily="ISB" fontSize="24px" color="theme" mt="4px">{createdCode.code}</Text>
              </Box>
              <Flex gap="24px" flexWrap="wrap">
                <Box><Text fontSize="13px" color="gray.100">FF 比例</Text><Text fontFamily="ISB" mt="2px">{createdCode.subFlatFeeRate}%</Text></Box>
                <Box><Text fontSize="13px" color="gray.100">PS 比例</Text><Text fontFamily="ISB" mt="2px">{createdCode.subProfitShareRate}%</Text></Box>
                <Box><Text fontSize="13px" color="gray.100">事件比例</Text><Text fontFamily="ISB" mt="2px">{createdCode.subEventRate}%</Text></Box>
              </Flex>
              <Box>
                <Text fontSize="14px" color="gray.100">邀请链接</Text>
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
