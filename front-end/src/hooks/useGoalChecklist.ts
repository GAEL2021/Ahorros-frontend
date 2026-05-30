import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { ChecklistItem, CreateChecklistItemPayload } from '@/types'

async function fetchChecklist(goalId: string): Promise<ChecklistItem[]> {
  const { data } = await apiClient.get<ChecklistItem[]>(`/goals/${goalId}/checklist`)
  return data
}

export function useGoalChecklist(goalId: string) {
  return useQuery<ChecklistItem[]>({
    queryKey: ['goal-checklist', goalId],
    queryFn: () => fetchChecklist(goalId),
    enabled: goalId.length > 0,
  })
}

export function useAddChecklistItem(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation<ChecklistItem, Error, CreateChecklistItemPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<ChecklistItem>(`/goals/${goalId}/checklist`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-checklist', goalId] })
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] })
    },
  })
}

export function useToggleChecklistItem(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    { id: string; completado: boolean },
    Error,
    { itemId: string; newValue: boolean },
    { prev: ChecklistItem[] | undefined }
  >({
    mutationFn: async ({ itemId, newValue }) => {
      const { data } = await apiClient.patch<{ id: string; completado: boolean }>(
        `/goals/${goalId}/checklist/${itemId}`,
        { completado: newValue },
      )
      return data
    },
    onMutate: async ({ itemId, newValue }) => {
      await queryClient.cancelQueries({ queryKey: ['goal-checklist', goalId] })
      const prev = queryClient.getQueryData<ChecklistItem[]>(['goal-checklist', goalId])
      if (prev) {
        queryClient.setQueryData<ChecklistItem[]>(['goal-checklist', goalId], (old) =>
          old?.map((item) =>
            item.id === itemId ? { ...item, completado: newValue } : item,
          ),
        )
      }
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['goal-checklist', goalId], context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-checklist', goalId] })
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] })
    },
  })
}

export function useDeleteChecklistItem(goalId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (itemId) => {
      await apiClient.delete(`/goals/${goalId}/checklist/${itemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-checklist', goalId] })
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] })
    },
  })
}
