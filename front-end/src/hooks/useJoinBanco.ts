import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

interface JoinBancoResponse {
  id: string
  nombre: string
}

async function joinBancoByCode(codigo: string): Promise<JoinBancoResponse> {
  const { data } = await apiClient.post<JoinBancoResponse>('/bancos/join-by-code', { codigo })
  return data
}

export function useJoinBanco() {
  const queryClient = useQueryClient()

  return useMutation<JoinBancoResponse, Error, string>({
    mutationFn: joinBancoByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}
