import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export function useSimularPago() {
  return useMutation({
    mutationFn: async ({ id, monto, carteraId }: { id: string; monto: number; carteraId?: string }) => {
      const { data } = await apiClient.post(`/tarjetas-credito/${id}/simular`, { monto, carteraId })
      return data
    },
  })
}
