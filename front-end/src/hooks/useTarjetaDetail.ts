import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export function useTarjetaDetail(id: string) {
  return useQuery({
    queryKey: ['tarjeta-credito', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tarjetas-credito/${id}`)
      return data
    },
    enabled: id.length > 0,
  })
}
