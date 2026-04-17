import { useState, useMemo, useEffect } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import InlineStatsBar from '@/components/shared/InlineStatsBar'
import DataTable, { type Column } from '@/components/shared/DataTable'
import { FilterBar, Input, Select, FilterItem, DateRangeInput } from '@/components/shared/FilterBar'
import PillButton from '@/components/shared/PillButton'
import ModalShell from '@/components/shared/ModalShell'
import RateFormInput from '@/components/shared/RateFormInput'
import { ChakraInput } from '@/components/shared/styled'
import { useAgent } from '@/context/AgentContext'
import { useInviteCodes, useInviteStats } from '@/api/queries/invite'
import { toError } from '@/api/client'
import type { InviteCode } from '@/types/domain'
import { fmtAmount } from '@/utils/fmtAmount'
import { toNumber } from '@/utils/parse'
import { validateRate, type RateErrors } from '@/utils/validateRate'
import { safeCopyPromotionLink } from '@/utils/safeUrl'
import { nowShanghai } from '@/utils/tz'

export default function InvitePromotion() {
  const { isFrozen, currentFlatFeeRate, currentProfitShareRate, currentEventRate } = useAgent()
  const codesQ = useInviteCodes()
  const statsQ = useInviteStats()

  // 本地可变副本：支持新建 / 作废 / 编辑。接入后端后改为 mutation。
  const [codes, setCodes] = useState<InviteCode[]>([])
  useEffect(() => {
    if (codesQ.data) setCodes(codesQ.data)
  }, [codesQ.data])

  const [showCreate, setShowCreate] = useState(false)
  const [createdCode, setCreatedCode] = useState<InviteCode | null>(null)
  const [ffRate, setFfRate] = useState('')
  const [psRate, setPsRate] = useState('')
  const [eventRate, setEventRate] = useState('')
  const [cRemark, setCRemark] = useState('')
  const [errors, setErrors] = useState<RateErrors>({})

  const [editCode, setEditCode] = useState<InviteCode | null>(null)
  const [editFF, setEditFF] = useState('')
  const [editPS, setEditPS] = useState('')
  const [editEvent, setEditEvent] = useState('')
  const [editErrors, setEditErrors] = useState<RateErrors>({})

  const [revokeCode, setRevokeCode] = useState<InviteCode | null>(null)

  const [fCode, setFCode] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)

  const hasFilter = fCode !== '' || statusFilter !== 'all' || dateFrom !== '' || dateTo !== ''

  const rateCaps = {
    flatFeeRate: currentFlatFeeRate,
    profitShareRate: currentProfitShareRate,
    eventRate: currentEventRate,
  }

  const handleCreate = () => {
    const r = validateRate({ flatFee: ffRate, profitShare: psRate, event: eventRate }, rateCaps)
    if (!r.ok) { setErrors(r.errors); return }
    setErrors({})
    const nextSuffix = 2000 + codes.length
    const newCode: InviteCode = {
      code: `TF${String(nextSuffix)}`,
      status: 'active',
      myFlatFeeRate: currentFlatFeeRate, subFlatFeeRate: r.values.flatFee,
      myProfitShareRate: currentProfitShareRate, subProfitShareRate: r.values.profitShare,
      myEventRate: currentEventRate, subEventRate: r.values.event,
      registrations: 0, firstDepositCount: 0, firstTradeCount: 0,
      tradeDau: 0, tradeVolume: 0, commission: 0,
      linkUrl: `https://app.turboflow.io/r/TF${String(nextSuffix)}`,
      // H9：显式 Asia/Shanghai 而不是 dayjs 默认的浏览器 local
      createdAt: nowShanghai(),
      remark: cRemark,
    }
    setCodes(prev => [newCode, ...prev])
    setShowCreate(false)
    setCreatedCode(newCode)
    setFfRate(''); setPsRate(''); setEventRate(''); setCRemark('')
  }

  const handleEdit = () => {
    const r = validateRate({ flatFee: editFF, profitShare: editPS, event: editEvent }, rateCaps)
    if (!r.ok) { setEditErrors(r.errors); return }
    setEditErrors({})
    if (!editCode) return
    setCodes(prev => prev.map(c =>
      c.code === editCode.code
        ? { ...c, subFlatFeeRate: r.values.flatFee, subProfitShareRate: r.values.profitShare, subEventRate: r.values.event }
        : c,
    ))
    setEditCode(null)
  }

  const handleRevoke = () => {
    if (!revokeCode) return
    setCodes(prev => prev.map(c =>
      c.code === revokeCode.code ? { ...c, status: 'revoked' as const } : c,
    ))
    setRevokeCode(null)
  }

  const copyLink = async (url: string, code: string) => {
    setCopyError(null)
    const res = await safeCopyPromotionLink(url)
    if (res.ok) {
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
      return
    }
    if (res.reason === 'invalid_url') {
      setCopyError('链接异常，请联系客服')
    } else if (res.reason === 'clipboard_denied') {
      setCopyError('剪贴板权限被拒绝')
    } else {
      setCopyError('当前环境不支持复制')
    }
    setTimeout(() => setCopyError(null), 3000)
  }

  const filtered = useMemo(() => codes.filter(c => {
    if (fCode && !c.code.includes(fCode)) return false
    if (statusFilter === 'active' && c.status !== 'active') return false
    if (statusFilter === 'revoked' && c.status !== 'revoked') return false
    return true
  }), [codes, fCode, statusFilter])

  const globalStatsData = useMemo(() => {
    const stats = statsQ.data
    if (!stats) return []
    return [
      { label: '注册', value: stats.registrations, unit: '人' },
      { label: '充值', value: fmtAmount(stats.depositAmount), unit: 'USDT' },
      { label: '交易额', value: fmtAmount(stats.tradeVolume), unit: 'USDT' },
      { label: '佣金', value: fmtAmount(stats.commission), unit: 'USDT' },
      { label: 'DAU', value: stats.tradeDau, unit: '人' },
    ]
  }, [statsQ.data])

  const filteredStatsData = useMemo(() => {
    // 审计 C2：toNumber 防御后端字符串返回
    let regs = 0, deps = 0, vol = 0, comm = 0, dau = 0
    for (const c of filtered) {
      regs += toNumber(c.registrations)
      deps += toNumber(c.firstDepositCount)
      vol += toNumber(c.tradeVolume)
      comm += toNumber(c.commission)
      dau += toNumber(c.tradeDau)
    }
    return [
      { label: '注册', value: regs, unit: '人' },
      { label: '充值', value: deps, unit: '人' },
      { label: '交易额', value: fmtAmount(vol), unit: 'USDT' },
      { label: '佣金', value: fmtAmount(comm), unit: 'USDT' },
      { label: 'DAU', value: dau, unit: '人' },
    ]
  }, [filtered])

  const columns: Column<InviteCode>[] = useMemo(() => [
    {
      key: 'code', label: '推广码',
      render: r => (
        <Box>
          <Text color="text.100" fontFamily="ISB" fontSize="15px">{r.code}</Text>
          <Text fontSize="12px" color={r.status === 'active' ? 'theme' : 'gray.200'} mt="2px">
            {r.status === 'active' ? '有效' : '已作废'}
          </Text>
        </Box>
      ),
      minW: '100px',
    },
    {
      key: 'ff', label: 'FF 下级比例', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.subFlatFeeRate.toFixed(2)}%</Text>,
      sortable: true, sortKey: r => r.subFlatFeeRate,
    },
    {
      key: 'ps', label: 'PS 下级比例', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.subProfitShareRate.toFixed(4)}%</Text>,
      sortable: true, sortKey: r => r.subProfitShareRate,
    },
    {
      key: 'ev', label: '事件下级比例', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.subEventRate.toFixed(2)}%</Text>,
      sortable: true, sortKey: r => r.subEventRate,
    },
    {
      key: 'regs', label: '注册', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.registrations}</Text>,
      sortable: true, sortKey: r => r.registrations,
    },
    {
      key: 'dep', label: '充值', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.firstDepositCount}</Text>,
      sortable: true, sortKey: r => r.firstDepositCount,
    },
    {
      key: 'trd', label: '交易', align: 'right',
      render: r => <Text color="text.100" fontFamily="ISB">{r.firstTradeCount}</Text>,
      sortable: true, sortKey: r => r.firstTradeCount,
    },
    {
      key: 'action', label: '操作', align: 'right',
      render: r => (
        <Flex gap="8px" justify="flex-end">
          <PillButton variant="primary" onClick={() => copyLink(r.linkUrl, r.code)}>
            {copied === r.code ? '已复制 ✓' : '复制链接'}
          </PillButton>
          {r.status === 'active' && (
            <>
              <PillButton
                variant="neutral" disabled={isFrozen}
                onClick={() => {
                  setEditCode(r)
                  setEditFF(r.subFlatFeeRate.toFixed(2))
                  setEditPS(r.subProfitShareRate.toFixed(4))
                  setEditEvent(r.subEventRate.toFixed(2))
                  setEditErrors({})
                }}
              >
                编辑
              </PillButton>
              <PillButton
                variant="danger" disabled={isFrozen}
                onClick={() => setRevokeCode(r)}
              >
                作废
              </PillButton>
            </>
          )}
        </Flex>
      ),
      width: '1%',
    },
  ], [copied, isFrozen])

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="24px">
        <Flex align="center" gap="32px">
          <Text fontFamily="ISB" fontSize="24px" color="text.100" letterSpacing="-0.5px">推广管理</Text>
          <Box w="1px" h="24px" bg="border.100" />
          <Flex gap="24px">
            <Box>
              <Text fontSize="11px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="2px">自身 FF 比例</Text>
              <Text fontFamily="ISB" fontSize="18px" color="theme">{currentFlatFeeRate.toFixed(2)}%</Text>
            </Box>
            <Box>
              <Text fontSize="11px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="2px">自身 PS 比例</Text>
              <Text fontFamily="ISB" fontSize="18px" color="theme">{currentProfitShareRate.toFixed(4)}%</Text>
            </Box>
            <Box>
              <Text fontSize="11px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="2px">自身事件比例</Text>
              <Text fontFamily="ISB" fontSize="18px" color="theme">{currentEventRate.toFixed(2)}%</Text>
            </Box>
          </Flex>
        </Flex>
        <Box as="button" px="24px" py="10px" bg={isFrozen ? 'bg.300' : 'theme'}
          color={isFrozen ? 'gray.200' : '#FFFFFF'} borderRadius="4px" fontSize="14px" fontFamily="ISB"
          cursor={isFrozen ? 'not-allowed' : 'pointer'} onClick={() => !isFrozen && setShowCreate(true)}
          transition="all 0.2s"
          _hover={isFrozen ? {} : { bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}
          title={isFrozen ? '账号已冻结' : ''}>
          新建推广码
        </Box>
      </Flex>

      {copyError && (
        <Box bg="red.200" border="1px solid" borderColor="red.100" px="16px" py="8px" borderRadius="4px" mb="16px">
          <Text fontSize="13px" color="red.100">{copyError}</Text>
        </Box>
      )}

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

      {/* 审计 M12：stats loading/error 与 DataTable 对齐 */}
      {statsQ.isError ? (
        <Box bg="red.200" border="1px solid" borderColor="red.100" borderRadius="8px" px="16px" py="12px" mb="16px">
          <Text fontSize="13px" color="red.100">
            全局统计加载失败：{toError(statsQ.error).message}
            <Text as="span" ml="12px" cursor="pointer" textDecoration="underline"
              onClick={() => statsQ.refetch()}>重试</Text>
          </Text>
        </Box>
      ) : statsQ.isLoading ? (
        <Box bg="rgba(0,0,0,0.02)" border="1px solid" borderColor="border.100"
          borderRadius="8px" px="20px" py="14px" mb="16px"
          css={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.03) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '200% 0' },
              '100%': { backgroundPosition: '-200% 0' },
            },
          }}
          h="52px"
        />
      ) : (
        <InlineStatsBar stats={globalStatsData} />
      )}
      {hasFilter && <InlineStatsBar title="筛选结果" stats={filteredStatsData} />}

      <DataTable
        data={filtered}
        columns={columns}
        stickyRight
        getRowKey={r => r.code}
        isLoading={codesQ.isLoading}
        error={codesQ.isError ? { message: toError(codesQ.error).message, retry: () => codesQ.refetch() } : null}
      />

      <ModalShell open={showCreate} onClose={() => setShowCreate(false)} width="480px">
        <Text fontFamily="ISB" fontSize="20px" mb="24px" color="text.100" letterSpacing="-0.5px">新建推广码</Text>
        <Flex direction="column" gap="20px">
          <RateFormInput label="Flat Fee 下级返佣比例（%）" value={ffRate} onChange={setFfRate} step="0.01" error={errors.ff} extra={`上限: ${currentFlatFeeRate}%`} />
          <RateFormInput label="Profit Share 下级返佣比例（%）" value={psRate} onChange={setPsRate} step="0.0001" error={errors.ps} extra={`上限: ${currentProfitShareRate}%`} />
          <RateFormInput label="事件合约下级返佣比例（%）" value={eventRate} onChange={setEventRate} step="0.01" error={errors.event} extra={`上限: ${currentEventRate}%`} />
          <Box>
            <Text fontSize="12px" color="gray.100" mb="8px" textTransform="uppercase" letterSpacing="0.5px">备注（可选）</Text>
            <ChakraInput w="100%" h="40px" bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="4px" px={3}
              fontSize="14px" color="text.100" outline="none"
              value={cRemark} onChange={(e) => setCRemark(e.target.value)}
              transition="all 0.2s"
              _focus={{ borderColor: 'theme', boxShadow: '0 0 0 1px rgba(10,186,181,0.5)' }} />
          </Box>
        </Flex>
        <Flex justify="flex-end" gap="12px" mt="32px">
          <Box as="button" px="24px" py="10px" bg="transparent" color="text.100" border="1px solid" borderColor="border.100"
            borderRadius="4px" fontSize="13px" cursor="pointer" onClick={() => setShowCreate(false)}
            transition="all 0.2s" _hover={{ bg: 'bg.100', borderColor: 'border.200' }}>取消</Box>
          <Box as="button" px="24px" py="10px" bg="theme" color="#FFFFFF" borderRadius="4px" fontSize="13px"
            fontFamily="ISB" cursor="pointer" onClick={handleCreate}
            transition="all 0.2s" _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}>创建</Box>
        </Flex>
      </ModalShell>

      <ModalShell open={!!editCode} onClose={() => setEditCode(null)} width="480px">
        <Text fontFamily="ISB" fontSize="20px" mb="8px" color="text.100" letterSpacing="-0.5px">编辑推广码</Text>
        {editCode && (
          <Text fontSize="13px" color="gray.100" mb="24px">推广码: <Text as="span" color="text.100">{editCode.code}</Text></Text>
        )}
        <Flex direction="column" gap="20px">
          <RateFormInput label="Flat Fee 下级返佣比例（%）" value={editFF} onChange={setEditFF} step="0.01" error={editErrors.ff} extra={`上限: ${currentFlatFeeRate}%`} />
          <RateFormInput label="Profit Share 下级返佣比例（%）" value={editPS} onChange={setEditPS} step="0.0001" error={editErrors.ps} extra={`上限: ${currentProfitShareRate}%`} />
          <RateFormInput label="事件合约下级返佣比例（%）" value={editEvent} onChange={setEditEvent} step="0.01" error={editErrors.event} extra={`上限: ${currentEventRate}%`} />
        </Flex>
        <Text fontSize="13px" color="gray.200" mt="24px">修改不追溯，仅影响后续通过该推广码注册的新用户。</Text>
        <Flex justify="flex-end" gap="12px" mt="32px">
          <Box as="button" px="24px" py="10px" bg="transparent" color="text.100" border="1px solid" borderColor="border.100"
            borderRadius="4px" fontSize="13px" cursor="pointer" onClick={() => setEditCode(null)}
            transition="all 0.2s" _hover={{ bg: 'bg.100', borderColor: 'border.200' }}>取消</Box>
          <Box as="button" px="24px" py="10px" bg="theme" color="#FFFFFF" borderRadius="4px" fontSize="13px"
            fontFamily="ISB" cursor="pointer" onClick={handleEdit}
            transition="all 0.2s" _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}>保存</Box>
        </Flex>
      </ModalShell>

      <ModalShell open={!!revokeCode} onClose={() => setRevokeCode(null)} width="440px">
        <Text fontFamily="ISB" fontSize="20px" mb="16px" color="text.100" letterSpacing="-0.5px">确认作废推广码</Text>
        {revokeCode && (
          <Text fontSize="14px" color="gray.100" mb="24px" lineHeight="1.6">
            确定要作废推广码 <Text as="span" fontFamily="ISB" color="text.100">{revokeCode.code}</Text> 吗？
            <br/><br/>
            <Text as="span" color="gray.200">作废后该推广码将无法再邀请新用户，已通过该推广码注册的用户不受影响。此操作不可撤销。</Text>
          </Text>
        )}
        <Flex justify="flex-end" gap="12px">
          <Box as="button" px="24px" py="10px" bg="transparent" color="text.100" border="1px solid" borderColor="border.100"
            borderRadius="4px" fontSize="13px" cursor="pointer" onClick={() => setRevokeCode(null)}
            transition="all 0.2s" _hover={{ bg: 'bg.100', borderColor: 'border.200' }}>取消</Box>
          <Box as="button" px="24px" py="10px" bg="red.100" color="#FFFFFF" borderRadius="4px" fontSize="13px"
            fontFamily="ISB" cursor="pointer" onClick={handleRevoke}
            transition="all 0.2s" _hover={{ bg: '#E03E3E' }}>确认作废</Box>
        </Flex>
      </ModalShell>

      <ModalShell open={!!createdCode} onClose={() => setCreatedCode(null)} width="480px" borderColor="theme" boxShadow="0 0 40px rgba(10,186,181,0.15)">
        <Flex justify="space-between" align="center" mb="24px">
          <Text fontFamily="ISB" fontSize="20px" color="theme" letterSpacing="-0.5px">推广码创建成功</Text>
          <Box as="button" fontSize="20px" color="gray.200" cursor="pointer" onClick={() => setCreatedCode(null)}
            transition="color 0.2s" _hover={{ color: 'text.100' }}>✕</Box>
        </Flex>
        {createdCode && (
          <Flex direction="column" gap="24px">
            <Box>
              <Text fontSize="12px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="4px">推广码</Text>
              <Text fontFamily="ISB" fontSize="32px" color="text.100" lineHeight="1">{createdCode.code}</Text>
            </Box>
            <Flex gap="32px">
              <Box><Text fontSize="12px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="4px">FF 下级比例</Text><Text fontFamily="ISB" fontSize="16px" color="text.100">{createdCode.subFlatFeeRate.toFixed(2)}%</Text></Box>
              <Box><Text fontSize="12px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="4px">PS 下级比例</Text><Text fontFamily="ISB" fontSize="16px" color="text.100">{createdCode.subProfitShareRate.toFixed(4)}%</Text></Box>
              <Box><Text fontSize="12px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="4px">事件下级比例</Text><Text fontFamily="ISB" fontSize="16px" color="text.100">{createdCode.subEventRate.toFixed(2)}%</Text></Box>
            </Flex>
            <Box>
              <Text fontSize="12px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="8px">推广链接</Text>
              <Flex align="center" gap="12px" bg="bg.200" border="1px solid" borderColor="border.100" borderRadius="4px" p="12px">
                <Text fontSize="14px" color="text.100" flex={1} overflow="hidden" textOverflow="ellipsis">{createdCode.linkUrl}</Text>
                <Box as="button" px="16px" py="6px" bg="transparent" color="theme" border="1px solid" borderColor="theme"
                  borderRadius="4px" fontSize="12px" fontFamily="ISB" cursor="pointer" onClick={() => copyLink(createdCode.linkUrl, createdCode.code)}
                  transition="all 0.2s" _hover={{ bg: 'rgba(10,186,181,0.1)' }}>
                  {copied === createdCode.code ? '已复制 ✓' : '复制'}
                </Box>
              </Flex>
            </Box>
            {createdCode.remark && (
              <Box><Text fontSize="12px" color="gray.200" textTransform="uppercase" letterSpacing="0.5px" mb="4px">备注</Text><Text fontSize="14px" color="text.100">{createdCode.remark}</Text></Box>
            )}
          </Flex>
        )}
      </ModalShell>
    </Box>
  )
}
