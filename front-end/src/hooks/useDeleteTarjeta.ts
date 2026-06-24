import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export function useDeleteTarjeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tarjetas-credito/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarjetas-credito'] })
    },
  })
}
