import { useQuery } from '@tanstack/react-query'
import type { Invitee, SubAgent } from '@/types/domain'

/**
 * 好友中心接口后端暂未提供（见 docs/BACKEND_PENDING_INTERFACES.md §1）。
 * 继续走 mock。
 */

export function useInvitees() {
  return useQuery<Invitee[]>({
    queryKey: ['friends', 'invitees'],
    queryFn: async () => (await import('@/mock/data')).invitees,
    staleTime: 30_000,
  })
}

export function useSubAgents() {
  return useQuery<SubAgent[]>({
    queryKey: ['friends', 'subAgents'],
    queryFn: async () => (await import('@/mock/data')).subAgents,
    staleTime: 30_000,
  })
}
