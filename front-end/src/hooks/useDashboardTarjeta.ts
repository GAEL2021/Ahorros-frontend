import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { DashboardTarjeta } from '@/types'

export function useDashboardTarjeta(id: string) {
  return useQuery<DashboardTarjeta>({
    queryKey: ['tarjeta-dashboard', id],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardTarjeta>(`/tarjetas-credito/${id}/dashboard`)
      return data
    },
    enabled: id.length > 0,
  })
}
