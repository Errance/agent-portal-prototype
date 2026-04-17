import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import {
  mapEventHistorySummary,
  mapEventOrderRow,
  mapPerpOrderRow,
  mapPerpPositionRow,
  mapPositionsSummary,
  mapTradeHistorySummary,
} from '../mappers'
import { buildListQuery, mapPagedMeta, type PagedResult, type RawPagedResponse } from './_paging'
import type {
  EventHistorySummary,
  EventOrder,
  PerpOrder,
  PerpPosition,
  PositionsSummary,
  TradeHistorySummary,
} from '@/types/domain'

type RawAny = Record<string, unknown>

export interface PositionsFilters {
  uid?: string
  remark?: string
  referral_code?: string
  side?: 'long' | 'short'
  symbol?: string
  from?: string
  to?: string
}

/** GET /agent/positions（文档 §3.1） */
export function usePerpPositions(filters: PositionsFilters = {}) {
  return useQuery<PagedResult<PerpPosition, PositionsSummary>>({
    queryKey: ['trading', 'perpPositions', filters],
    queryFn: async () => {
      const qs = buildListQuery(filters)
      const raw = await apiFetch<RawPagedResponse<RawAny, RawAny>>(`/agent/positions?${qs}`)
      return {
        rows: (raw.data ?? []).map(mapPerpPositionRow),
        meta: mapPagedMeta(raw),
        summary: raw.summary ? mapPositionsSummary(raw.summary) : undefined,
      }
    },
    staleTime: 15_000,
  })
}

export interface TradeHistoryFilters extends PositionsFilters {
  trade_sub_type?: 'open' | 'close' | 'liquidation'
}

/** GET /agent/trade-history（文档 §3.2） */
export function usePerpHistory(filters: TradeHistoryFilters = {}) {
  return useQuery<PagedResult<PerpOrder, TradeHistorySummary>>({
    queryKey: ['trading', 'perpHistory', filters],
    queryFn: async () => {
      const qs = buildListQuery(filters)
      const raw = await apiFetch<RawPagedResponse<RawAny, RawAny>>(`/agent/trade-history?${qs}`)
      return {
        rows: (raw.data ?? []).map(mapPerpOrderRow),
        meta: mapPagedMeta(raw),
        summary: raw.summary ? mapTradeHistorySummary(raw.summary) : undefined,
      }
    },
    staleTime: 30_000,
  })
}

export interface EventHistoryFilters {
  uid?: string
  remark?: string
  referral_code?: string
}

/** GET /agent/event-history（文档 §3.3） */
export function useEventHistory(filters: EventHistoryFilters = {}) {
  return useQuery<PagedResult<EventOrder, EventHistorySummary>>({
    queryKey: ['trading', 'eventHistory', filters],
    queryFn: async () => {
      const qs = buildListQuery(filters)
      const raw = await apiFetch<RawPagedResponse<RawAny, RawAny>>(`/agent/event-history?${qs}`)
      return {
        rows: (raw.data ?? []).map(mapEventOrderRow),
        meta: mapPagedMeta(raw),
        summary: raw.summary ? mapEventHistorySummary(raw.summary) : undefined,
      }
    },
    staleTime: 30_000,
  })
}
