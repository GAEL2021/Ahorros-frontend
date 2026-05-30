import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

interface AdminVerifyResponse {
  esAdmin: boolean
}

async function verificarAdmin(): Promise<AdminVerifyResponse> {
  const { data } = await apiClient.get<AdminVerifyResponse>('/admin/verificar')
  return data
}

export function useVerificarAdmin() {
  return useQuery<AdminVerifyResponse>({
    queryKey: ['admin-verify'],
    queryFn: verificarAdmin,
    staleTime: 60_000,
  })
}
