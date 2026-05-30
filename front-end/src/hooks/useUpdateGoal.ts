import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Meta } from '@/types'

interface UpdateGoalPayload {
  nombre?: string
  montoObjetivo?: number
  fechaLimite?: string
}

async function updateGoal({
  goalId,
  payload,
}: {
  goalId: string
  payload: UpdateGoalPayload
}): Promise<Meta> {
  const { data } = await apiClient.patch<Meta>(`/goals/${goalId}`, payload)
  return data
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation<
    Meta,
    Error,
    { goalId: string; payload: UpdateGoalPayload }
  >({
    mutationFn: updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
