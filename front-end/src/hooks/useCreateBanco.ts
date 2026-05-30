import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Cartera, CreateCarteraPayload } from '@/types'

async function createBanco(payload: CreateCarteraPayload): Promise<Cartera> {
  const { data } = await apiClient.post<Cartera>('/bancos', payload)
  return data
}

export function useCreateBanco() {
  const queryClient = useQueryClient()

  return useMutation<Cartera, Error, CreateCarteraPayload>({
    mutationFn: createBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}
