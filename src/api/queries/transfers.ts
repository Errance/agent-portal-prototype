import { useQuery } from '@tanstack/react-query'
import type { TransferRecord } from '@/types/domain'
import { mockOrFetch } from '../config'
import { apiFetch } from '../client'

export function useTransferRecords() {
  return useQuery<TransferRecord[]>({
    queryKey: ['transfers', 'records'],
    queryFn: () => mockOrFetch(
      async () => (await import('@/mock/data')).transferRecords,
      () => apiFetch<TransferRecord[]>('/agent/transfers/records'),
    ),
    staleTime: 30_000,
  })
}
