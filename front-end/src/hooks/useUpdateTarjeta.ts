import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { UpdateTarjetaCreditoPayload } from '@/types'

export function useUpdateTarjeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTarjetaCreditoPayload }) => {
      const res = await apiClient.patch(`/tarjetas-credito/${id}`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tarjetas-credito'] })
      qc.invalidateQueries({ queryKey: ['tarjeta-credito', variables.id] })
    },
  })
}
