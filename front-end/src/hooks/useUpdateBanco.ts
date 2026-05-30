import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { UpdateCarteraPayload } from '@/types'

async function updateBanco({ id, payload }: { id: string; payload: UpdateCarteraPayload }) {
  const { data } = await apiClient.patch(`/bancos/${id}`, payload)
  return data
}

export function useUpdateBanco() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] })
      queryClient.invalidateQueries({ queryKey: ['banco-detail'] })
    },
  })
}
