import { useQuery } from '@tanstack/react-query'
import type { PerpPosition, PerpOrder, EventOrder } from '@/mock/types'
import { perpPositions, perpHistory, eventHistory } from '@/mock/data'
import { USE_MOCK, mockDelay } from '../config'
import { apiFetch } from '../client'

export function usePerpPositions() {
  return useQuery<PerpPosition[]>({
    queryKey: ['trading', 'perpPositions'],
    queryFn: () => USE_MOCK
      ? mockDelay(perpPositions)
      : apiFetch<PerpPosition[]>('/agent/trading/perp/positions'),
    staleTime: 15_000,
  })
}

export function usePerpHistory() {
  return useQuery<PerpOrder[]>({
    queryKey: ['trading', 'perpHistory'],
    queryFn: () => USE_MOCK
      ? mockDelay(perpHistory)
      : apiFetch<PerpOrder[]>('/agent/trading/perp/history'),
    staleTime: 30_000,
  })
}

export function useEventHistory() {
  return useQuery<EventOrder[]>({
    queryKey: ['trading', 'eventHistory'],
    queryFn: () => USE_MOCK
      ? mockDelay(eventHistory)
      : apiFetch<EventOrder[]>('/agent/trading/event/history'),
    staleTime: 30_000,
  })
}
