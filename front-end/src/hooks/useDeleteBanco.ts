import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

async function deleteBanco(id: string) {
  const { data } = await apiClient.delete(`/bancos/${id}`)
  return data
}

export function useDeleteBanco() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}
