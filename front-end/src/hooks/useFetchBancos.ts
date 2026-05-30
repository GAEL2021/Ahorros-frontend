import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Cartera, CarteraDetail } from '@/types'

async function fetchBancos(): Promise<Cartera[]> {
  const { data } = await apiClient.get<Cartera[]>('/bancos')
  return data
}

export function useFetchBancos() {
  return useQuery<Cartera[]>({
    queryKey: ['bancos'],
    queryFn: fetchBancos,
    refetchInterval: 15_000,
  })
}

async function fetchBancoDetail(id: string): Promise<CarteraDetail> {
  const { data } = await apiClient.get<CarteraDetail>(`/bancos/${id}`)
  return data
}

export function useBancoDetail(id: string) {
  return useQuery<CarteraDetail>({
    queryKey: ['banco-detail', id],
    queryFn: () => fetchBancoDetail(id),
    enabled: !!id,
  })
}
