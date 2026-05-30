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
  const [realCostItemId, setRealCostItemId] = useState<string | null>(null)
  const [realCostValue, setRealCostValue] = useState(0)

  const itemsList = items ?? []
  const totalEstimado = itemsList.reduce((sum, i) => sum + (i.monto ?? 0), 0)
  const totalReal = itemsList
    .filter((i) => i.completado && i.montoReal != null)
    .reduce((sum, i) => sum + (i.montoReal ?? 0), 0)
  const completados = itemsList.filter((i) => i.completado).length
  const total = itemsList.length

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

  const handleToggle = (item: ChecklistItem) => {
    if (item.completado) {
      // Uncheck — no need for real cost
      toggleItem.mutate({ itemId: item.id, newValue: false })
    } else {
      // Completing — ask for real cost
      setRealCostItemId(item.id)
      setRealCostValue(item.monto ?? 0)
    }
  }

  const handleConfirmRealCost = () => {
    if (!realCostItemId) return
    toggleItem.mutate({
      itemId: realCostItemId,
      newValue: true,
      montoReal: realCostValue,
    })
    setRealCostItemId(null)
    setRealCostValue(0)
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Checklist de costos</h3>
          {total > 0 && (
            <p className="mt-0.5 text-xs text-ink-muted">
              {completados}/{total} completado{total !== 1 ? 's' : ''}
              {totalReal > 0 && ` · Real: $${totalReal.toLocaleString()}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-xs font-medium text-ink-muted">
              Est. ${totalEstimado.toLocaleString()} / ${metaMontoObjetivo.toLocaleString()}
            </span>
          )}
          {total > 0 && (
            <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${total > 0 ? (completados / total) * 100 : 0}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Items list */}
      {total > 0 && (
        <ul className="space-y-1">
          {itemsList.map((item) => (
            <ChecklistRow
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item)}
              onDelete={() => deleteItem.mutate(item.id)}
              disabled={toggleItem.isPending || deleteItem.isPending}
            />
          ))}
        </ul>
      )}

      {!isLoading && total === 0 && (
        <p className="text-xs text-ink-muted text-center py-4">
          Agregá ítems con su costo estimado. Al completarlos, podés ingresar el costo real.
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      )}

      {/* Real cost modal */}
      {realCostItemId && (
        <div className="rounded-xl border-2 border-accent bg-accent-subtle/50 p-4 animate-scale-in space-y-3">
          <p className="text-sm font-semibold text-ink">
            ¿Cuál fue el costo real de este ítem?
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-ink-muted">$</span>
              <input
                type="number"
                min={0}
                value={realCostValue || ''}
                onChange={(e) => setRealCostValue(Math.max(0, Number(e.target.value) || 0))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRealCost() }}
                autoFocus
                className="w-full rounded-xl border border-accent/50 bg-white py-2.5 pl-9 pr-4 text-lg font-semibold font-mono focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <button
              type="button"
              onClick={handleConfirmRealCost}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setRealCostItemId(null)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-ink-muted">
            Estimado: ${((itemsList.find((i) => i.id === realCostItemId)?.monto) ?? 0).toLocaleString()}
          </p>
        </div>
      )}

      {/* Add new item form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Nuevo ítem..."
          maxLength={300}
          className="flex-1 rounded-xl border border-border px-3.5 py-2.5 text-sm bg-white placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="relative w-32">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted">$</span>
          <input
            type="number"
            min={0}
            value={newMonto || ''}
            onChange={(e) => setNewMonto(Math.max(0, Number(e.target.value) || 0))}
            placeholder="Est."
            className="w-full rounded-xl border border-border pl-7 pr-2 py-2.5 text-sm bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={!newText.trim() || addItem.isPending}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {addItem.isPending ? '...' : 'Agregar'}
        </button>
      </form>

      {addItem.isError && (
        <p className="text-xs text-danger">
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
  const estimated = item.monto ?? 0
  const real = item.montoReal
  const hasReal = item.completado && real != null
  const diff = hasReal ? real - estimated : 0
  const isOverBudget = diff > 0

  return (
    <li className="group flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-raised transition-colors">
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

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[11px] font-mono text-ink-muted">
          Est. ${estimated.toLocaleString()}
        </span>

        {hasReal && (
          <>
            <svg className="h-3 w-3 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span className={`text-[11px] font-mono font-semibold ${isOverBudget ? 'text-danger' : 'text-success'}`}>
              ${real.toLocaleString()}
            </span>
            <span className={`text-[10px] font-semibold tabular-nums ${isOverBudget ? 'text-danger' : 'text-success'}`}>
              ({diff === 0 ? '=' : isOverBudget ? `+$${diff.toLocaleString()}` : `-$${Math.abs(diff).toLocaleString()}`})
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="flex-shrink-0 rounded p-0.5 text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all"
        title="Eliminar"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}
