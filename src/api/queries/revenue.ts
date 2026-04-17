import { useQuery } from '@tanstack/react-query'
import type { DailyRevenue, CommissionRecord, SettlementConfig } from '@/mock/types'
import { dailyRevenue, commissionRecords, settlementConfig } from '@/mock/data'
import { USE_MOCK, mockDelay } from '../config'
import { apiFetch } from '../client'

export function useDailyRevenue() {
  return useQuery<DailyRevenue[]>({
    queryKey: ['revenue', 'daily'],
    queryFn: () => USE_MOCK
      ? mockDelay(dailyRevenue)
      : apiFetch<DailyRevenue[]>('/agent/revenue/daily'),
    staleTime: 60_000,
  })
}

export function useCommissionRecords() {
  return useQuery<CommissionRecord[]>({
    queryKey: ['revenue', 'commissions'],
    queryFn: () => USE_MOCK
      ? mockDelay(commissionRecords)
      : apiFetch<CommissionRecord[]>('/agent/revenue/commissions'),
    staleTime: 30_000,
  })
}

export function useSettlementConfig() {
  return useQuery<SettlementConfig>({
    queryKey: ['revenue', 'settlement'],
    queryFn: () => USE_MOCK
      ? mockDelay(settlementConfig)
      : apiFetch<SettlementConfig>('/agent/revenue/settlement-config'),
    staleTime: 5 * 60_000,
  })
}
