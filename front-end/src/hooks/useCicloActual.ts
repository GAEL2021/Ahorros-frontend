import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export function useCicloActual(id: string) {
  return useQuery({
    queryKey: ['tarjeta-ciclo', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tarjetas-credito/${id}/ciclo-actual`)
      return data
    },
    enabled: id.length > 0,
  })
}
