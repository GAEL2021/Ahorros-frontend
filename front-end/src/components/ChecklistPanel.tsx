import { useState } from 'react'
import type { ChecklistItem } from '@/types'
import { useGoalChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem } from '@/hooks/useGoalChecklist'

interface ChecklistPanelProps {
  goalId: string
  metaMontoObjetivo: number
}

export default function ChecklistPanel({ goalId, metaMontoObjetivo }: ChecklistPanelProps) {
  const { data: items, isLoading } = useGoalChecklist(goalId)
  const addItem = useAddChecklistItem(goalId)
  const toggleItem = useToggleChecklistItem(goalId)
  const deleteItem = useDeleteChecklistItem(goalId)
  const [newText, setNewText] = useState('')
  const [newMonto, setNewMonto] = useState(0)

  const totalMonto = items?.reduce((sum, i) => sum + (i.monto ?? 0), 0) ?? 0
  const completados = items?.filter((i) => i.completado).length ?? 0
  const total = items?.length ?? 0

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = newText.trim()
    if (!text || addItem.isPending) return
    try {
      await addItem.mutateAsync({ texto: text, monto: newMonto })
      setNewText('')
      setNewMonto(0)
    } catch {}
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Checklist</h3>
          {total > 0 && (
            <p className="mt-0.5 text-xs text-ink-muted">
              {completados}/{total} completado{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-[11px] font-medium text-ink-muted">
              ${totalMonto.toLocaleString()} / ${metaMontoObjetivo.toLocaleString()}
            </span>
          )}
          {total > 0 && (
            <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completados === total ? 'bg-success' : 'bg-primary/60'}`}
                style={{ width: `${total > 0 ? (completados / total) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {total > 0 && (
        <ul className="space-y-0.5 mb-3">
          {items!.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={() => toggleItem.mutate({ itemId: item.id, newValue: !item.completado })}
              onDelete={() => deleteItem.mutate(item.id)}
              disabled={toggleItem.isPending || deleteItem.isPending}
            />
          ))}
        </ul>
      )}

      {!isLoading && total === 0 && (
        <p className="text-xs text-ink-muted text-center py-3">
          Sin ítems aún. Agregá elementos para completar tu meta.
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Nuevo ítem..."
          maxLength={300}
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm bg-surface-raised focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-ink-muted"
        />
        <div className="relative w-28">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted">$</span>
          <input
            type="number"
            min={0}
            value={newMonto || ''}
            onChange={(e) => setNewMonto(Math.max(0, Number(e.target.value) || 0))}
            placeholder="0"
            className="w-full rounded-md border border-border pl-5 pr-2 py-2 text-sm bg-surface-raised focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={!newText.trim() || addItem.isPending}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {addItem.isPending ? '...' : 'Agregar'}
        </button>
      </form>

      {addItem.isError && (
        <p className="mt-2 text-xs text-danger">
          {addItem.error instanceof Error ? addItem.error.message : 'Error al agregar'}
        </p>
      )}
    </div>
  )
}

function ChecklistRow({
  item,
  onToggle,
  onDelete,
  disabled,
}: {
  item: ChecklistItem
  onToggle: () => void
  onDelete: () => void
  disabled: boolean
}) {
  return (
    <li className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-raised transition-colors">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
          item.completado
            ? 'bg-primary border-primary text-white'
            : 'border-border hover:border-primary/50'
        }`}
      >
        {item.completado && (
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-xs leading-tight ${
          item.completado ? 'text-ink-muted line-through' : 'text-ink'
        }`}
      >
        {item.texto}
      </span>
      <span className="text-[11px] font-medium text-ink-muted tabular-nums">
        ${(item.monto ?? 0).toLocaleString()}
      </span>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="flex-shrink-0 rounded p-0.5 text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-danger transition-all"
        title="Eliminar"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}
