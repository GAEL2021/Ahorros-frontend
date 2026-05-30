import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Meta } from '@/types'

async function fetchGoalDetail(goalId: string): Promise<Meta> {
  const { data } = await apiClient.get<Meta>(`/goals/${goalId}`)
  return data
}

export function useGoalDetail(goalId: string) {
  return useQuery<Meta>({
    queryKey: ['goal-detail', goalId],
    queryFn: () => fetchGoalDetail(goalId),
    enabled: goalId.length > 0,
    staleTime: 5_000,
  })
}
