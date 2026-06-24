import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { TarjetaCredito } from '@/types'

async function fetchTarjetas(): Promise<TarjetaCredito[]> {
  const { data } = await apiClient.get<TarjetaCredito[]>('/tarjetas-credito')
  return data
}

export function useFetchTarjetas() {
  return useQuery<TarjetaCredito[]>({
    queryKey: ['tarjetas-credito'],
    queryFn: fetchTarjetas,
  })
}
