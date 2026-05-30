import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

async function deleteCatalogoBanco(id: string) {
  const { data } = await apiClient.delete(`/catalogo-bancos/${id}`)
  return data
}

export function useDeleteCatalogoBanco() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCatalogoBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-bancos'] })
    },
  })
}
