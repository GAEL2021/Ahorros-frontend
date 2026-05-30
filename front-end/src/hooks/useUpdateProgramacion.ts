import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { UpdateProgramacionPayload } from '@/types'

async function updateProgramacion({ id, payload }: { id: string; payload: UpdateProgramacionPayload }) {
  const { data } = await apiClient.patch(`/programaciones/${id}`, payload)
  return data
}

export function useUpdateProgramacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProgramacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] })
    },
  })
}
