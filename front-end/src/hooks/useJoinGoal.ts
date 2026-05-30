import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

interface JoinResult {
  id: string
  nombre: string
  montoObjetivo: number
}

async function joinGoalByCode(codigo: string): Promise<JoinResult> {
  const { data } = await apiClient.post<JoinResult>('/goals/join-by-code', { codigo })
  return data
}

export function useJoinGoal() {
  const queryClient = useQueryClient()

  return useMutation<JoinResult, Error, string>({
    mutationFn: joinGoalByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
