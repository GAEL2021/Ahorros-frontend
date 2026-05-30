import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

async function toggleProgramacion(id: string) {
  const { data } = await apiClient.patch(`/programaciones/${id}/toggle`)
  return data
}

export function useToggleProgramacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleProgramacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] })
    },
  })
}
