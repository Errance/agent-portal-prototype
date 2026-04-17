import { useQuery } from '@tanstack/react-query'
import { mockOrFetch } from '../config'
import { apiFetch } from '../client'
import type { DailyRevenue, CommissionRecord, SettlementConfig } from '@/types/domain'

export function useDailyRevenue() {
  return useQuery<DailyRevenue[]>({
    queryKey: ['revenue', 'daily'],
    queryFn: () =>
      mockOrFetch(
        async () => (await import('@/mock/data')).dailyRevenue,
        () => apiFetch<DailyRevenue[]>('/agent/revenue/daily'),
      ),
    staleTime: 60_000,
  })
}

export function useCommissionRecords() {
  return useQuery<CommissionRecord[]>({
    queryKey: ['revenue', 'commissions'],
    queryFn: () =>
      mockOrFetch(
        async () => (await import('@/mock/data')).commissionRecords,
        () => apiFetch<CommissionRecord[]>('/agent/revenue/commissions'),
      ),
    staleTime: 30_000,
  })
}

export function useSettlementConfig() {
  return useQuery<SettlementConfig>({
    queryKey: ['revenue', 'settlement'],
    queryFn: () =>
      mockOrFetch(
        async () => (await import('@/mock/data')).settlementConfig,
        () => apiFetch<SettlementConfig>('/agent/revenue/settlement-config'),
      ),
    staleTime: 5 * 60_000,
  })
}
