import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { RetirarPayload } from '@/types'

interface RetiroResponse {
  saldoAnterior: number
  nuevoSaldo: number
  monto: number
}

async function retirarBanco({ id, payload }: { id: string; payload: RetirarPayload }) {
  const { data } = await apiClient.post<RetiroResponse>(`/bancos/${id}/retirar`, payload)
  return data
}

export function useRetirarBanco() {
  const queryClient = useQueryClient()

  return useMutation<RetiroResponse, Error, { id: string; payload: RetirarPayload }>({
    mutationFn: retirarBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] })
      queryClient.invalidateQueries({ queryKey: ['banco-detail'] })
    },
  })
}
