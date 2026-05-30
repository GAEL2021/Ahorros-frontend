import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Programacion } from '@/types'

async function fetchProgramaciones(): Promise<Programacion[]> {
  const { data } = await apiClient.get<Programacion[]>('/programaciones')
  return data
}

export function useFetchProgramaciones() {
  return useQuery<Programacion[]>({
    queryKey: ['programaciones'],
    queryFn: fetchProgramaciones,
    refetchInterval: 20_000,
  })
}
