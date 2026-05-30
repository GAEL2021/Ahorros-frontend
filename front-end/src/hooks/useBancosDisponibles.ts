import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

interface BancoDisponible {
  id: string
  nombre: string
}

async function fetchBancosDisponibles(): Promise<BancoDisponible[]> {
  const { data } = await apiClient.get<BancoDisponible[]>('/catalogo-bancos/disponibles')
  return data
}

export function useBancosDisponibles() {
  return useQuery<BancoDisponible[]>({
    queryKey: ['bancos-disponibles'],
    queryFn: fetchBancosDisponibles,
  })
}
