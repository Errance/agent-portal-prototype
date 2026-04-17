import { useQuery } from '@tanstack/react-query'
import { mockOrFetch } from '../config'
import { apiFetch } from '../client'
import type { TransferRecord } from '@/types/domain'

export function useTransferRecords() {
  return useQuery<TransferRecord[]>({
    queryKey: ['transfers', 'records'],
    queryFn: () =>
      mockOrFetch(
        async () => (await import('@/mock/data')).transferRecords,
        () => apiFetch<TransferRecord[]>('/agent/transfers/records'),
      ),
    staleTime: 30_000,
  })
}
