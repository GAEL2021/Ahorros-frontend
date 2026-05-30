import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { DepositarPayload } from '@/types'

interface DepositoResponse {
  saldoAnterior: number
  nuevoSaldo: number
  monto: number
}

async function depositarBanco({ id, payload }: { id: string; payload: DepositarPayload }) {
  const { data } = await apiClient.post<DepositoResponse>(`/bancos/${id}/depositar`, payload)
  return data
}

export function useDepositarBanco() {
  const queryClient = useQueryClient()

  return useMutation<DepositoResponse, Error, { id: string; payload: DepositarPayload }>({
    mutationFn: depositarBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bancos'] })
      queryClient.invalidateQueries({ queryKey: ['banco-detail'] })
    },
  })
}
