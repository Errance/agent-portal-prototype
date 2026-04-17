import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../client'
import { mapInviteCodeRow, mapInviteStats } from '../mappers'
import { buildListQuery, mapPagedMeta, type PagedResult, type RawPagedResponse } from './_paging'
import type { InviteCode, InviteStats } from '@/types/domain'

type RawAny = Record<string, unknown>

/**
 * GET /agent/invite-stats（文档 §2.2）
 * 顶部统计条：注册 / 充值 / 交易额 / 佣金 / DAU。
 */
export function useInviteStats() {
  return useQuery<InviteStats>({
    queryKey: ['invite', 'stats'],
    queryFn: async () => {
      const raw = await apiFetch<RawAny>('/agent/invite-stats')
      return mapInviteStats(raw)
    },
    staleTime: 60_000,
  })
}

export interface InviteCodesFilters {
  code?: string
  status?: 'active' | 'revoked'
  from?: string
  to?: string
}

/**
 * GET /agent/invite-codes（文档 §2.3）
 * 列表接口，page_size=200 一次拿齐；后续 UI 继续客户端分页。
 */
export function useInviteCodes(filters: InviteCodesFilters = {}) {
  return useQuery<PagedResult<InviteCode>>({
    queryKey: ['invite', 'codes', filters],
    queryFn: async () => {
      const qs = buildListQuery(filters)
      const raw = await apiFetch<RawPagedResponse<RawAny>>(`/agent/invite-codes?${qs}`)
      return {
        rows: (raw.data ?? []).map(mapInviteCodeRow),
        meta: mapPagedMeta(raw),
      }
    },
    staleTime: 30_000,
  })
}
