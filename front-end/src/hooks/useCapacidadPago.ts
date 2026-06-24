import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { CapacidadPago } from '@/types'

export function useCapacidadPago(id: string) {
  return useQuery<CapacidadPago>({
    queryKey: ['tarjeta-capacidad-pago', id],
    queryFn: async () => {
      const { data } = await apiClient.get<CapacidadPago>(`/tarjetas-credito/${id}/capacidad-pago`)
      return data
    },
    enabled: id.length > 0,
  })
}
