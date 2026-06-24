import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { ResumenBancos } from '@/types'

export function useResumenBancos() {
  return useQuery<ResumenBancos>({
    queryKey: ['resumen-bancos'],
    queryFn: async () => {
      const { data } = await apiClient.get<ResumenBancos>('/tarjetas-credito/resumen')
      return data
    },
  })
}
