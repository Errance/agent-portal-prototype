import { useQuery } from '@tanstack/react-query'
import type { InviteCode, InviteStats } from '@/types/domain'
import { mockOrFetch } from '../config'
import { apiFetch } from '../client'

export function useInviteCodes() {
  return useQuery<InviteCode[]>({
    queryKey: ['invite', 'codes'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).inviteCodes,
      () => apiFetch<InviteCode[]>('/agent/invite/codes'),
    ),
    staleTime: 30_000,
  })
}

export function useInviteStats() {
  return useQuery<InviteStats>({
    queryKey: ['invite', 'stats'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).inviteStats,
      () => apiFetch<InviteStats>('/agent/invite/stats'),
    ),
    staleTime: 60_000,
  })
}
