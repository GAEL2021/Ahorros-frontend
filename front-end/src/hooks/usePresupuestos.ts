import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { Presupuesto, CreatePresupuestoPayload, CreateGastoPayload, UpdateGastoPayload, UpdatePresupuestoPayload } from '@/types'

async function fetchPresupuestos(): Promise<Presupuesto[]> {
  const { data } = await apiClient.get<Presupuesto[]>('/presupuestos')
  return data
}

export function useFetchPresupuestos() {
  return useQuery<Presupuesto[]>({ queryKey: ['presupuestos'], queryFn: fetchPresupuestos })
}

export function usePresupuestoDetail(id: string) {
  return useQuery<Presupuesto>({
    queryKey: ['presupuesto', id],
    queryFn: async () => { const { data } = await apiClient.get<Presupuesto>(`/presupuestos/${id}`); return data },
    enabled: id.length > 0,
  })
}

export function useCreatePresupuesto() {
  const qc = useQueryClient()
  return useMutation<Presupuesto, Error, CreatePresupuestoPayload>({
    mutationFn: async (p) => { const { data } = await apiClient.post<Presupuesto>('/presupuestos', p); return data },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['presupuestos'] }); qc.invalidateQueries({ queryKey: ['controles'] }) },
  })
}

export function useDeleteControl() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (controlId) => { await apiClient.delete(`/presupuestos/controles/${controlId}`) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['controles'] }); qc.invalidateQueries({ queryKey: ['presupuestos'] }) },
  })
}

export function useDeletePresupuesto() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id) => { await apiClient.delete(`/presupuestos/${id}`) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['presupuestos'] }) },
  })
}

export function useAddGasto(presupuestoId: string) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, CreateGastoPayload>({
    mutationFn: async (g) => { const { data } = await apiClient.post(`/presupuestos/${presupuestoId}/gastos`, g); return data },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      qc.invalidateQueries({ queryKey: ['controles'] })
      qc.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}

export function useDeleteGasto(presupuestoId: string) {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (gastoId) => { await apiClient.delete(`/presupuestos/${presupuestoId}/gastos/${gastoId}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      qc.invalidateQueries({ queryKey: ['controles'] })
      qc.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}

export function useUpdateGasto(presupuestoId: string) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { gastoId: string; data: UpdateGastoPayload }>({
    mutationFn: async ({ gastoId, data }) => {
      const res = await apiClient.patch(`/presupuestos/${presupuestoId}/gastos/${gastoId}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      qc.invalidateQueries({ queryKey: ['controles'] })
    },
  })
}

export interface Control {
  controlId: string
  year: number
  tipo: 'mensual' | 'quincenal'
  presupuestos: Presupuesto[]
  totalPresupuestos: number
  cerrados: number
}

export function useFetchControles() {
  return useQuery<Control[]>({
    queryKey: ['controles'],
    queryFn: async () => { const { data } = await apiClient.get<Control[]>('/presupuestos/controles'); return data },
  })
}

export function useCarryToNewYear() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: async (controlId) => { const { data } = await apiClient.post(`/presupuestos/${controlId}/carry-to-new-year`); return data },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['controles'] }); qc.invalidateQueries({ queryKey: ['presupuestos'] }) },
  })
}

export function useCerrarMes() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, string>({
    mutationFn: async (presupuestoId) => { const { data } = await apiClient.post(`/presupuestos/${presupuestoId}/cerrar-mes`); return data },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['presupuestos'] }); qc.invalidateQueries({ queryKey: ['controles'] }) },
  })
}

export function usePagarGasto() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { gastoId: string; presupuestoId: string; montoReal?: number; carteraId?: string }>({
    mutationFn: async ({ gastoId, presupuestoId, montoReal, carteraId }) => {
      const { data } = await apiClient.post(`/presupuestos/${presupuestoId}/gastos/${gastoId}/pagar`, { montoReal, carteraId })
      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['presupuesto', variables.presupuestoId] })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      qc.invalidateQueries({ queryKey: ['controles'] })
      qc.invalidateQueries({ queryKey: ['bancos'] })
    },
  })
}

export function useUpdateGastoFecha(presupuestoId: string) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { gastoId: string; fecha: string }>({
    mutationFn: async ({ gastoId, fecha }) => {
      const { data } = await apiClient.patch(`/presupuestos/${presupuestoId}/gastos/${gastoId}/fecha`, { fecha })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      qc.invalidateQueries({ queryKey: ['controles'] })
    },
  })
}

export function useUpdatePresupuesto() {
  const qc = useQueryClient()
  return useMutation<unknown, Error, { id: string; data: UpdatePresupuestoPayload }>({
    mutationFn: async ({ id, data }) => {
      const res = await apiClient.patch(`/presupuestos/${id}`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
      qc.invalidateQueries({ queryKey: ['controles'] })
      qc.invalidateQueries({ queryKey: ['presupuesto', variables.id] })
    },
  })
}
