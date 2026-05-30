import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { CreateProgramacionPayload, Programacion } from '@/types'

async function createProgramacion(payload: CreateProgramacionPayload): Promise<Programacion> {
  const { data } = await apiClient.post<Programacion>('/programaciones', payload)
  return data
}

export function useCreateProgramacion() {
  const queryClient = useQueryClient()

  return useMutation<Programacion, Error, CreateProgramacionPayload>({
    mutationFn: createProgramacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programaciones'] })
    },
  })
}
