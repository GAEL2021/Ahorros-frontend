import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { CatalogoBanco, CreateCatalogoBancoPayload } from '@/types'

async function createCatalogoBanco(payload: CreateCatalogoBancoPayload): Promise<CatalogoBanco> {
  const { data } = await apiClient.post<CatalogoBanco>('/catalogo-bancos', payload)
  return data
}

export function useCreateCatalogoBanco() {
  const queryClient = useQueryClient()

  return useMutation<CatalogoBanco, Error, CreateCatalogoBancoPayload>({
    mutationFn: createCatalogoBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-bancos'] })
    },
  })
}
