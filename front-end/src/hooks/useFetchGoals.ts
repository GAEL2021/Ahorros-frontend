import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Meta } from '@/types'

async function fetchGoals(): Promise<Meta[]> {
  const { data } = await apiClient.get<Meta[]>('/goals')
  return data
}

export function useFetchGoals() {
  return useQuery<Meta[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    refetchInterval: 10_000,
  })
}
