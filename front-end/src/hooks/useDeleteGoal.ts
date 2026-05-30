import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

async function deleteGoal(goalId: string): Promise<void> {
  await apiClient.delete(`/goals/${goalId}`)
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
