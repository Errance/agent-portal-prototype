import { useQuery } from '@tanstack/react-query'
import type { TransferRecord } from '@/mock/types'
import { transferRecords } from '@/mock/data'
import { USE_MOCK, mockDelay } from '../config'
import { apiFetch } from '../client'

export function useTransferRecords() {
  return useQuery<TransferRecord[]>({
    queryKey: ['transfers', 'records'],
    queryFn: () => USE_MOCK
      ? mockDelay(transferRecords)
      : apiFetch<TransferRecord[]>('/agent/transfers/records'),
    staleTime: 30_000,
  })
}
