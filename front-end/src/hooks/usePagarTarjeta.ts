import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export function usePagarTarjeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, monto, carteraId }: { id: string; monto: number; carteraId: string }) => {
      const { data } = await apiClient.post(`/tarjetas-credito/${id}/pagar`, { monto, carteraId })
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tarjetas-credito'] })
      qc.invalidateQueries({ queryKey: ['tarjeta-credito', variables.id] })
      qc.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}
