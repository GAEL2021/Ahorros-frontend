import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { CreateTarjetaCreditoPayload } from '@/types'

export function useCreateTarjeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTarjetaCreditoPayload) => {
      const { data } = await apiClient.post('/tarjetas-credito', payload)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarjetas-credito'] })
    },
  })
}
