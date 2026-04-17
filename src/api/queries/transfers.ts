import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import { mapTransferRow, mapTransfersSummary } from '../mappers'
import { buildListQuery, mapPagedMeta, type PagedResult, type RawPagedResponse } from './_paging'
import type { TransferRecord, TransfersSummary } from '@/types/domain'

type RawAny = Record<string, unknown>

export interface TransfersFilters {
  uid?: string
  type?: 'deposit' | 'withdrawal'
  sub_type?: 'normal' | 'internal_transfer'
  user_level?: 'regular' | 'sub_agent'
  from?: string
  to?: string
}

/**
 * GET /agent/transfers（文档 §4.1）
 * Summary 分 total（伞下全量）+ filtered（当前筛选）。
 */
export function useTransferRecords(filters: TransfersFilters = {}) {
  return useQuery<PagedResult<TransferRecord, TransfersSummary>>({
    queryKey: ['transfers', 'records', filters],
    queryFn: async () => {
      const qs = buildListQuery(filters)
      const raw = await apiFetch<RawPagedResponse<RawAny, RawAny>>(`/agent/transfers?${qs}`)
      return {
        rows: (raw.data ?? []).map(mapTransferRow),
        meta: mapPagedMeta(raw),
        summary: raw.summary ? mapTransfersSummary(raw.summary) : undefined,
      }
    },
    staleTime: 30_000,
  })
}
