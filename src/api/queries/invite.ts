import { useQuery } from '@tanstack/react-query'
import type { InviteCode, InviteStats } from '@/mock/types'
import { inviteCodes, inviteStats } from '@/mock/data'
import { USE_MOCK, mockDelay } from '../config'
import { apiFetch } from '../client'

export function useInviteCodes() {
  return useQuery<InviteCode[]>({
    queryKey: ['invite', 'codes'],
    queryFn: () => USE_MOCK
      ? mockDelay(inviteCodes)
      : apiFetch<InviteCode[]>('/agent/invite/codes'),
    staleTime: 30_000,
  })
}

export function useInviteStats() {
  return useQuery<InviteStats>({
    queryKey: ['invite', 'stats'],
    queryFn: () => USE_MOCK
      ? mockDelay(inviteStats)
      : apiFetch<InviteStats>('/agent/invite/stats'),
    staleTime: 60_000,
  })
}
