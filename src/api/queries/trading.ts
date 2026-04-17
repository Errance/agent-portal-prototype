import { useQuery } from '@tanstack/react-query'
import type { PerpPosition, PerpOrder, EventOrder } from '@/types/domain'
import { mockOrFetch } from '../config'
import { apiFetch } from '../client'

export function usePerpPositions() {
  return useQuery<PerpPosition[]>({
    queryKey: ['trading', 'perpPositions'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).perpPositions,
      () => apiFetch<PerpPosition[]>('/agent/trading/perp/positions'),
    ),
    staleTime: 15_000,
  })
}

export function usePerpHistory() {
  return useQuery<PerpOrder[]>({
    queryKey: ['trading', 'perpHistory'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).perpHistory,
      () => apiFetch<PerpOrder[]>('/agent/trading/perp/history'),
    ),
    staleTime: 30_000,
  })
}

export function useEventHistory() {
  return useQuery<EventOrder[]>({
    queryKey: ['trading', 'eventHistory'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).eventHistory,
      () => apiFetch<EventOrder[]>('/agent/trading/event/history'),
    ),
    staleTime: 30_000,
  })
}
