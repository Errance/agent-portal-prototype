import { useQuery } from '@tanstack/react-query'
import { mockOrFetch } from '../config'
import { apiFetch } from '../client'
import type { DashboardKPI, InviteCodeSummary } from '@/types/domain'

/** GET /agent/dashboard/kpi */
export function useDashboardKpi() {
  return useQuery<DashboardKPI[]>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: () =>
      mockOrFetch(
        async () => (await import('@/mock/data')).dashboardKPI,
        () => apiFetch<DashboardKPI[]>('/agent/dashboard/kpi'),
      ),
    staleTime: 60_000,
  })
}

/** GET /agent/dashboard/invite-summary */
export function useInviteCodeSummary() {
  return useQuery<InviteCodeSummary[]>({
    queryKey: ['dashboard', 'inviteSummary'],
    queryFn: () =>
      mockOrFetch(
        async () => (await import('@/mock/data')).inviteCodeSummary,
        () => apiFetch<InviteCodeSummary[]>('/agent/dashboard/invite-summary'),
      ),
    staleTime: 60_000,
  })
}
