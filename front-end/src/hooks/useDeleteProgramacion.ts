import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

async function deleteProgramacion(id: string) {
  const { data } = await apiClient.delete(`/programaciones/${id}`)
  return data
}

export function useDeleteProgramacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProgramacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] })
    },
  })
}
