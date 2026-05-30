import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

interface ContributeResponse {
  nuevoSaldoAportado: number
  nuevoMontoAcumulado: number
  metaMontoObjetivo: number
}

async function addContribution({
  goalId,
  monto,
  carteraId,
}: {
  goalId: string
  monto: number
  carteraId?: string
}): Promise<ContributeResponse> {
  const { data } = await apiClient.post<ContributeResponse>(
    `/goals/${goalId}/contribuir`,
    { monto, carteraId },
  )
  return data
}

export function useAddContribution() {
  const queryClient = useQueryClient()

  return useMutation<
    ContributeResponse,
    Error,
    { goalId: string; monto: number; carteraId?: string }
  >({
    mutationFn: addContribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal-detail'] })
      queryClient.invalidateQueries({ queryKey: ['goal-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}
