import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Cuota } from '@/types'

async function fetchGoalCalendar(goalId: string): Promise<Cuota[]> {
  const { data } = await apiClient.get<Cuota[]>(`/goals/${goalId}/control_cuotas`)
  return data
}

export function useGoalCalendar(goalId: string) {
  return useQuery<Cuota[]>({
    queryKey: ['goal-calendar', goalId],
    queryFn: () => fetchGoalCalendar(goalId),
    refetchInterval: 10_000,
    enabled: goalId.length > 0,
  })
}
