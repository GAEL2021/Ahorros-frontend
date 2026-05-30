import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { CreateGoalPayload, Meta } from '@/types'

async function createGoal(payload: CreateGoalPayload): Promise<Meta> {
  const { data } = await apiClient.post<Meta>('/goals', payload)
  return data
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation<Meta, Error, CreateGoalPayload>({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['programaciones'] })
    },
  })
}
