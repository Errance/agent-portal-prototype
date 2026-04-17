import { Box, Flex, Text, HStack, Grid } from '@chakra-ui/react'
import { useState } from 'react'
import StatCard from '@/components/shared/StatCard'
import DataTable, { type Column } from '@/components/shared/DataTable'
import PillButton from '@/components/shared/PillButton'
import { ChakraLink } from '@/components/shared/styled'
import { useAgent } from '@/context/AgentContext'
import { useAuth, getAuthDisplayName, getAuthCopyableIdentity } from '@/auth'
import { emitAuthToast } from '@/auth/authEvents'
import { useDashboardKpi, useInviteCodeSummary } from '@/api/queries/dashboard'
import { toError } from '@/api/client'
import { copyFailureMessage, copyText } from '@/utils/clipboard'
import type { InviteCodeSummary, AgentLevel } from '@/types/domain'

// 代理等级徽章的配色表。等 `/agent/me` 接入后在 header 处恢复徽章渲染会重新用到。
// 在徽章隐藏期间 eslint 会标记为 unused：下面这条 disable 只影响这两个常量。
/* eslint-disable @typescript-eslint/no-unused-vars */
const LEVEL_CONFIG: Record<
  AgentLevel,
  { name: string; bg: string; color: string; border: string; glow: string }
> = {
  1: { name: '青铜', bg: '#F4F5F7', color: '#57585C', border: '#DEDFE0', glow: 'none' },
  2: {
    name: '白银',
    bg: '#EAEAED',
    color: '#151517',
    border: '#C0C0C8',
    glow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  3: {
    name: '黄金',
    bg: 'linear-gradient(135deg, #FFF8D6 0%, #FFE81A 100%)',
    color: '#5C4A00',
    border: '#E6C800',
    glow: '0 4px 12px rgba(255,232,26,0.3)',
  },
  4: {
    name: '钻石',
    bg: 'linear-gradient(135deg, #E0F2FE 0%, #0ABAB5 100%)',
    color: '#003A38',
    border: '#0ABAB5',
    glow: '0 4px 12px rgba(10,186,181,0.3)',
  },
  5: {
    name: '星耀',
    bg: 'linear-gradient(135deg, #F3E8FF 0%, #A855F7 100%)',
    color: '#3B0764',
    border: '#9333EA',
    glow: '0 4px 12px rgba(168,85,247,0.3)',
  },
}

const LEVEL_FALLBACK = LEVEL_CONFIG[1]
/* eslint-enable @typescript-eslint/no-unused-vars */

const columns: Column<InviteCodeSummary>[] = [
  {
    key: 'code',
    label: '推广码',
    render: r => (
      <Text color="theme" fontFamily="ISB" fontSize="15px">
        {r.code}
      </Text>
    ),
  },
  {
    key: 'regs',
    label: '注册人数',
    align: 'right',
    render: r => (
      <Text color="text.100" fontFamily="ISB">
        {r.registrations}
      </Text>
    ),
    sortable: true,
    sortKey: r => r.registrations,
  },
  {
    key: 'ff',
    label: 'FF 返佣比例',
    align: 'right',
    render: r => (
      <Text color="text.100" fontFamily="ISB">
        {r.flatFeeRate.toFixed(2)}%
      </Text>
    ),
    sortable: true,
    sortKey: r => r.flatFeeRate,
  },
  {
    key: 'ps',
    label: 'PS 返佣比例',
    align: 'right',
    render: r => (
      <Text color="text.100" fontFamily="ISB">
        {r.profitShareRate.toFixed(4)}%
      </Text>
    ),
    sortable: true,
    sortKey: r => r.profitShareRate,
  },
  {
    key: 'event',
    label: '事件返佣比例',
    align: 'right',
    render: r => (
      <Text color="text.100" fontFamily="ISB">
        {r.eventRate.toFixed(2)}%
      </Text>
    ),
    sortable: true,
    sortKey: r => r.eventRate,
  },
]

export default function Dashboard() {
  const { isNewAgent, setIsNewAgent } = useAgent()
  const auth = useAuth()

  // 统一走 auth 层的 displayName helper（email > address > userId > 代理商）。
  // `/agent/me` 接入后如果要显示后端返回的 `agent_name`，在 helper 里加一层即可。
  const displayName = getAuthDisplayName(auth.user)
  // 可复制身份：只有真的是邮箱 / 地址才展示复制按钮；userId 兜底情况下不展示
  const copyable = getAuthCopyableIdentity(auth.user)
  const [copied, setCopied] = useState(false)
  const handleCopyIdentity = async () => {
    if (!copyable) return
    const res = await copyText(copyable.value)
    if (res.ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }
    emitAuthToast({ kind: 'error', message: copyFailureMessage(res.reason) })
  }

  const kpiQ = useDashboardKpi()
  const summaryQ = useInviteCodeSummary()

  return (
    <Box>
      <Flex align="center" gap="12px" mb="32px">
        <Text fontSize="28px" fontFamily="ISB" color="text.100" letterSpacing="-0.5px">
          您好，{displayName}
        </Text>
        {copyable && (
          <Box
            as="button"
            fontSize="11px"
            color={copied ? 'theme' : 'gray.200'}
            border="1px solid"
            borderColor={copied ? 'theme' : 'border.100'}
            borderRadius="4px"
            px="8px"
            py="2px"
            bg="transparent"
            cursor="pointer"
            aria-label={`复制${copyable.label}`}
            title={copyable.value}
            onClick={handleCopyIdentity}
            _hover={{ color: 'theme', borderColor: 'theme' }}
            transition="all 0.15s"
          >
            {copied ? '已复制 ✓' : `复制${copyable.label}`}
          </Box>
        )}
        {/*
          代理等级徽章：等级 / 黄金 / 钻石 等是由后端 `/agent/me` 里的 `agent_level`
          派生的（见 docs/BACKEND_PENDING_INTERFACES.md §2）。/agent/me 未接入前
          徽章全部走 mock，对真实用户误导性太强，这里先隐藏。接入后去掉这条注释、
          把 `LEVEL_CONFIG` / `LEVEL_FALLBACK` / 徽章 JSX 还原即可，逻辑不变。
        */}
      </Flex>

      <Text
        fontSize="12px"
        color="gray.200"
        mb="16px"
        textTransform="uppercase"
        letterSpacing="0.5px"
      >
        数据统计范围以 UTC+8 时区为准
      </Text>

      {isNewAgent && (
        <Box
          bg="bg.200"
          border="1px solid"
          borderColor="border.100"
          borderRadius="8px"
          p="24px"
          mb="32px"
        >
          <Text fontFamily="ISB" fontSize="18px" color="text.100" mb="8px" letterSpacing="-0.5px">
            开启您的推广之旅
          </Text>
          <Text fontSize="14px" color="gray.100" mb="20px">
            创建您的第一个推广码，开始发展下级用户并获取返佣收益。
          </Text>
          <HStack gap="12px">
            {/* H3 修复：不再把 Box as="button" 包在 Link 里；ChakraLink 渲染为 <a> 并套按钮样式 */}
            <ChakraLink
              to="/invite"
              display="inline-block"
              textDecoration="none"
              px="24px"
              py="10px"
              bg="theme"
              color="#FFFFFF"
              borderRadius="4px"
              fontSize="13px"
              fontFamily="ISB"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ bg: '#089995', boxShadow: '0 0 12px rgba(10,186,181,0.3)' }}
            >
              创建推广码
            </ChakraLink>
            <PillButton variant="ghost" size="lg" shape="rect" onClick={() => setIsNewAgent(false)}>
              我知道了
            </PillButton>
          </HStack>
        </Box>
      )}

      <Grid templateColumns="repeat(auto-fill, minmax(260px, 1fr))" gap="24px" mb="48px">
        {kpiQ.isLoading &&
          Array.from({ length: 6 }).map((_, i) => <StatCard key={i} label="" value="" isLoading />)}
        {kpiQ.isError && !kpiQ.isLoading && (
          <StatCard label="加载失败" value="" error={toError(kpiQ.error).message} />
        )}
        {kpiQ.data?.map(kpi => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            changePercent={kpi.changePercent}
          />
        ))}
      </Grid>

      <Box>
        <Flex justify="space-between" align="center" mb="24px">
          <Text fontFamily="ISB" fontSize="20px" color="text.100" letterSpacing="-0.5px">
            推广概览
          </Text>
          <ChakraLink
            to="/invite"
            display="inline-block"
            textDecoration="none"
            px="20px"
            py="8px"
            bg="transparent"
            color="text.100"
            border="1px solid"
            borderColor="border.100"
            borderRadius="4px"
            fontSize="13px"
            fontFamily="ISB"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: 'bg.200', borderColor: 'border.200' }}
          >
            管理推广码
          </ChakraLink>
        </Flex>
        <DataTable
          data={summaryQ.data ?? []}
          columns={columns}
          pageSize={10}
          getRowKey={r => r.code}
          isLoading={summaryQ.isLoading}
          error={
            summaryQ.isError
              ? { message: toError(summaryQ.error).message, retry: () => summaryQ.refetch() }
              : null
          }
        />
      </Box>
    </Box>
  )
}
