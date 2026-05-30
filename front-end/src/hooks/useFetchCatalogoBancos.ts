import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { CatalogoBanco } from '@/types'

async function fetchCatalogoBancos(): Promise<CatalogoBanco[]> {
  const { data } = await apiClient.get<CatalogoBanco[]>('/catalogo-bancos')
  return data
}

export function useFetchCatalogoBancos() {
  return useQuery<CatalogoBanco[]>({
    queryKey: ['catalogo-bancos'],
    queryFn: fetchCatalogoBancos,
  })
}
