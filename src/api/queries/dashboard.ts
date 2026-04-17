import { useQuery } from '@tanstack/react-query'
import type { DashboardKPI, InviteCodeSummary } from '@/types/domain'

/**
 * Dashboard KPI / InviteCodeSummary 后端目前**没有**对应接口
 * （见 docs/BACKEND_PENDING_INTERFACES.md §5）。继续走 mock，
 * 等后端 `/agent/dashboard/kpi` / `/agent/dashboard/invite-summary` 就绪后
 * 切换为真实 API。
 */

export function useDashboardKpi() {
  return useQuery<DashboardKPI[]>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: async () => (await import('@/mock/data')).dashboardKPI,
    staleTime: 60_000,
  })
}

export function useInviteCodeSummary() {
  return useQuery<InviteCodeSummary[]>({
    queryKey: ['dashboard', 'inviteSummary'],
    queryFn: async () => (await import('@/mock/data')).inviteCodeSummary,
    staleTime: 60_000,
  })
}
