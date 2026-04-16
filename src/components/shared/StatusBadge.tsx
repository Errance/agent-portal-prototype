import { Box } from '@chakra-ui/react'
import type { PayoutStatus, TransferStatus, DepositStatus, EventResult } from '@/mock/types'

const payoutMap: Record<PayoutStatus, { label: string; color: string; bg: string }> = {
  paid: { label: '已发放', color: '#0ABAB5', bg: 'rgba(10,186,181,0.1)' },
  frozen_pending: { label: '冻结待发', color: '#FF4949', bg: 'rgba(255,73,73,0.08)' },
}

const transferMap: Record<TransferStatus, { label: string; color: string; bg: string }> = {
  success: { label: '成功', color: '#0ABAB5', bg: 'rgba(10,186,181,0.1)' },
  processing: { label: '处理中', color: '#E5A000', bg: 'rgba(229,160,0,0.1)' },
  failed: { label: '失败', color: '#FF4949', bg: 'rgba(255,73,73,0.08)' },
}

const depositMap: Record<DepositStatus, { label: string; color: string; bg: string }> = {
  deposited: { label: '已充值', color: '#0ABAB5', bg: 'rgba(10,186,181,0.1)' },
  not_deposited: { label: '未充值', color: '#777E90', bg: 'rgba(119,126,144,0.1)' },
}

const eventResultMap: Record<EventResult, { label: string; color: string; bg: string }> = {
  win: { label: '胜', color: '#0ABAB5', bg: 'rgba(10,186,181,0.1)' },
  lose: { label: '负', color: '#FF4949', bg: 'rgba(255,73,73,0.08)' },
  pending: { label: '待结算', color: '#E5A000', bg: 'rgba(229,160,0,0.1)' },
}

type BadgeType = 'payout' | 'transfer' | 'deposit' | 'eventResult'

export default function StatusBadge({ type, value }: { type: BadgeType; value: string }) {
  let info: { label: string; color: string; bg: string } | undefined

  switch (type) {
    case 'payout': info = payoutMap[value as PayoutStatus]; break
    case 'transfer': info = transferMap[value as TransferStatus]; break
    case 'deposit': info = depositMap[value as DepositStatus]; break
    case 'eventResult': info = eventResultMap[value as EventResult]; break
  }

  if (!info) return <>{value}</>

  return (
    <Box
      as="span"
      px={2}
      py={0.5}
      borderRadius="md"
      fontSize="xs"
      fontFamily="ISB"
      color={info.color}
      bg={info.bg}
      fontWeight="500"
    >
      {info.label}
    </Box>
  )
}
