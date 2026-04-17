import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import {
  mapCommissionRecordRow,
  mapDailyRevenueRow,
  mapRevenueDailySummary,
  mapSettlementConfig,
} from '../mappers'
import { buildListQuery, mapPagedMeta, type PagedResult, type RawPagedResponse } from './_paging'
import type {
  CommissionRecord,
  DailyRevenue,
  RevenueDailySummary,
  SettlementConfig,
} from '@/types/domain'

type RawAny = Record<string, unknown>

export interface RevenueFilters {
  from?: string
  to?: string
  product_line?: 'perpetual' | 'event'
  settlement_type?: 'flat_fee' | 'profit_share'
}

/**
 * GET /agent/revenue/daily（文档 §5.1）
 *
 * 返回值：rows（按日）+ meta + summary（区间合计，含 total_rebate_usdt_equiv
 * 等；Q5 全局口径、Q6 用作"累计返佣 USDT 等价"KPI）。
 *
 * 不传 from/to 时后端使用默认区间（一般近 30 天，文档 §5.1）。
 */
export function useDailyRevenue(filters: RevenueFilters = {}) {
  return useQuery<PagedResult<DailyRevenue, RevenueDailySummary>>({
    queryKey: ['revenue', 'daily', filters],
    queryFn: async () => {
      const qs = buildListQuery(filters)
      const raw = await apiFetch<RawPagedResponse<RawAny, RawAny>>(`/agent/revenue/daily?${qs}`)
      return {
        rows: (raw.data ?? []).map(mapDailyRevenueRow),
        meta: mapPagedMeta(raw),
        summary: raw.summary ? mapRevenueDailySummary(raw.summary) : undefined,
      }
    },
    staleTime: 60_000,
  })
}

/**
 * GET /agent/revenue/history（文档 §5.2）
 * 按"代理商本人"视角返回每笔返佣流水。无 summary。
 */
export function useCommissionRecords(filters: RevenueFilters = {}) {
  return useQuery<PagedResult<CommissionRecord>>({
    queryKey: ['revenue', 'history', filters],
    queryFn: async () => {
      const qs = buildListQuery(filters)
      const raw = await apiFetch<RawPagedResponse<RawAny>>(`/agent/revenue/history?${qs}`)
      return {
        rows: (raw.data ?? []).map(mapCommissionRecordRow),
        meta: mapPagedMeta(raw),
      }
    },
    staleTime: 30_000,
  })
}

/** GET /agent/settlement-config（文档 §5.3） */
export function useSettlementConfig() {
  return useQuery<SettlementConfig>({
    queryKey: ['revenue', 'settlement'],
    queryFn: async () => {
      const raw = await apiFetch<RawAny>('/agent/settlement-config')
      return mapSettlementConfig(raw)
    },
    staleTime: 5 * 60_000,
  })
}
