import { useQuery } from '@tanstack/react-query'
import type { Invitee, SubAgent } from '@/mock/types'
import { invitees, subAgents } from '@/mock/data'
import { USE_MOCK, mockDelay } from '../config'
import { apiFetch } from '../client'

/** GET /agent/friends/invitees */
export function useInvitees() {
  return useQuery<Invitee[]>({
    queryKey: ['friends', 'invitees'],
    queryFn: () => USE_MOCK
      ? mockDelay(invitees)
      : apiFetch<Invitee[]>('/agent/friends/invitees'),
    staleTime: 30_000,
  })
}

/** GET /agent/friends/sub-agents */
export function useSubAgents() {
  return useQuery<SubAgent[]>({
    queryKey: ['friends', 'subAgents'],
    queryFn: () => USE_MOCK
      ? mockDelay(subAgents)
      : apiFetch<SubAgent[]>('/agent/friends/sub-agents'),
    staleTime: 30_000,
  })
}
