import { useQuery } from '@tanstack/react-query'
import type { Invitee, SubAgent } from '@/types/domain'
import { mockOrFetch } from '../config'
import { apiFetch } from '../client'

/** GET /agent/friends/invitees */
export function useInvitees() {
  return useQuery<Invitee[]>({
    queryKey: ['friends', 'invitees'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).invitees,
      () => apiFetch<Invitee[]>('/agent/friends/invitees'),
    ),
    staleTime: 30_000,
  })
}

/** GET /agent/friends/sub-agents */
export function useSubAgents() {
  return useQuery<SubAgent[]>({
    queryKey: ['friends', 'subAgents'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).subAgents,
      () => apiFetch<SubAgent[]>('/agent/friends/sub-agents'),
    ),
    staleTime: 30_000,
  })
}
