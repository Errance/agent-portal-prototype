import { useQuery } from '@tanstack/react-query'
import type { DashboardKPI, InviteCodeSummary } from '@/mock/types'
import { dashboardKPI, inviteCodeSummary } from '@/mock/data'
import { USE_MOCK, mockDelay } from '../config'
import { apiFetch } from '../client'

/** GET /agent/dashboard/kpi */
export function useDashboardKpi() {
  return useQuery<DashboardKPI[]>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: () => USE_MOCK
      ? mockDelay(dashboardKPI)
      : apiFetch<DashboardKPI[]>('/agent/dashboard/kpi'),
    staleTime: 60_000,
  })
}

/** GET /agent/dashboard/invite-summary */
export function useInviteCodeSummary() {
  return useQuery<InviteCodeSummary[]>({
    queryKey: ['dashboard', 'inviteSummary'],
    queryFn: () => USE_MOCK
      ? mockDelay(inviteCodeSummary)
      : apiFetch<InviteCodeSummary[]>('/agent/dashboard/invite-summary'),
    staleTime: 60_000,
  })
}
