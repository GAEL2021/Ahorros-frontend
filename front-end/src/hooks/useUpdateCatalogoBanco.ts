import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export function useUpdateCatalogoBanco() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nombre?: string; color?: string } }) =>
      apiClient.patch(`/catalogo-bancos/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogo-bancos'] })
    },
  })
}
