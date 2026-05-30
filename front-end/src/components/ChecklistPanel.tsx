import { useState } from 'react'
import type { ChecklistItem } from '@/types'
import {
  useGoalChecklist,
  useAddChecklistItem,
  useToggleChecklistItem,
  useDeleteChecklistItem,
  useUpdateChecklistItem,
} from '@/hooks/useGoalChecklist'

interface ChecklistPanelProps {
  goalId: string
  metaMontoObjetivo: number
}

export default function ChecklistPanel({ goalId, metaMontoObjetivo }: ChecklistPanelProps) {
  const { data: items, isLoading } = useGoalChecklist(goalId)
  const addItem = useAddChecklistItem(goalId)
  const toggleItem = useToggleChecklistItem(goalId)
  const deleteItem = useDeleteChecklistItem(goalId)
  const updateItem = useUpdateChecklistItem(goalId)

  const [newText, setNewText] = useState('')
  const [newMonto, setNewMonto] = useState(0)
  const [realCostItemId, setRealCostItemId] = useState<string | null>(null)
  const [realCostValue, setRealCostValue] = useState(0)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editMonto, setEditMonto] = useState(0)

  const itemsList = items ?? []
  const totalEstimado = itemsList.reduce((sum, i) => sum + (i.monto ?? 0), 0)
  const totalReal = itemsList
    .filter((i) => i.completado && i.montoReal != null)
    .reduce((sum, i) => sum + (i.montoReal ?? 0), 0)
  const completados = itemsList.filter((i) => i.completado).length
  const total = itemsList.length
  const diffTotal = totalReal > 0 ? totalReal - totalEstimado : 0

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
      toggleItem.mutate({ itemId: item.id, newValue: false })
    } else {
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

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id)
    setEditText(item.texto)
    setEditMonto(item.monto ?? 0)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
    setEditMonto(0)
  }

  const saveEdit = async () => {
    if (!editingId || !editText.trim() || updateItem.isPending) return
    try {
      await updateItem.mutateAsync({
        itemId: editingId,
        payload: { texto: editText.trim(), monto: editMonto },
      })
      cancelEdit()
    } catch {}
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-raised px-5 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-ink"><span className="truncate">Checklist de costos</span></h3>
          {total > 0 && (
            <p className="mt-0.5 text-xs text-ink-muted">
              {completados}/{total} completado{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-ink-muted">
            Est. ${totalEstimado.toLocaleString()} / ${metaMontoObjetivo.toLocaleString()}
          </span>
          {totalReal > 0 && (
            <span className={`text-xs font-semibold font-mono ${diffTotal > 0 ? 'text-danger' : diffTotal < 0 ? 'text-success' : 'text-ink-muted'}`}>
              Real ${totalReal.toLocaleString()} ({diffTotal === 0 ? 'igual' : diffTotal > 0 ? `+$${diffTotal.toLocaleString()}` : `-$${Math.abs(diffTotal).toLocaleString()}`})
            </span>
          )}
          {total > 0 && (
            <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completados / total) * 100}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Table body */}
      {total > 0 && (
        <div className="overflow-x-auto min-w-[560px]">
          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_140px_160px_60px] gap-3 px-5 py-2 border-b border-border-light bg-surface-raised/50 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="w-5" />
            <span>Descripción</span>
            <span className="text-right">Estimado</span>
            <span className="text-right">Real</span>
            <span className="text-center">Acciones</span>
          </div>

          <ul className="divide-y divide-border-light">
            {itemsList.map((item) => (
              <li key={item.id} className="group">
                {editingId === item.id ? (
                  <div className="grid grid-cols-[auto_1fr_140px_160px_60px] gap-3 items-center px-5 py-2 bg-primary-subtle/30">
                    <div className="flex-shrink-0 h-4 w-4 rounded border-2 border-primary/30 bg-primary-subtle" />
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={300}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                      className="w-full rounded-lg border border-primary/30 bg-white px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted">$</span>
                      <input
                        type="number"
                        min={0}
                        value={editMonto || ''}
                        onChange={(e) => setEditMonto(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full rounded-lg border border-primary/30 bg-white pl-6 pr-2 py-1.5 text-xs text-right font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <span className="text-xs text-ink-muted text-right font-mono">
                      {item.completado && item.montoReal != null ? `$${item.montoReal.toLocaleString()}` : '—'}
                    </span>
                    <div className="flex items-center justify-center gap-0.5">
                      <button type="button" onClick={saveEdit} disabled={updateItem.isPending || !editText.trim()} className="rounded-lg p-1.5 text-success hover:bg-success/10 transition-colors" title="Guardar">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </button>
                      <button type="button" onClick={cancelEdit} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-raised transition-colors" title="Cancelar">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <ChecklistRow
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onEdit={() => startEdit(item)}
                    onDelete={() => deleteItem.mutate(item.id)}
                    disabled={toggleItem.isPending || deleteItem.isPending || updateItem.isPending}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="px-5 py-10 text-center">
          <svg className="mx-auto h-10 w-10 text-ink-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="mt-2 text-sm text-ink-muted">Sin ítems aún</p>
          <p className="mt-1 text-xs text-ink-muted">Agregá tareas con su costo estimado.</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      )}

      {/* Real cost modal */}
      {realCostItemId && (
        <div className="border-t border-border bg-accent-subtle/30 p-5 animate-scale-in">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-ink">Costo real:</p>
            <div className="relative flex-1 min-w-[160px]">
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
            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmRealCost} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">Confirmar</button>
              <button type="button" onClick={() => setRealCostItemId(null)} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-muted">Estimado: ${((itemsList.find((i) => i.id === realCostItemId)?.monto) ?? 0).toLocaleString()}</p>
        </div>
      )}

      {/* Add row */}
      <form onSubmit={handleAdd} className="flex gap-2 border-t border-border-light px-5 py-3 bg-surface-raised/50">
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
        <button type="submit" disabled={!newText.trim() || addItem.isPending} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors flex-shrink-0">
          {addItem.isPending ? '...' : 'Agregar'}
        </button>
      </form>

      {addItem.isError && <p className="px-5 py-2 text-xs text-danger border-t border-border-light">{addItem.error instanceof Error ? addItem.error.message : 'Error al agregar'}</p>}
    </div>
  )
}

function ChecklistRow({
  item,
  onToggle,
  onEdit,
  onDelete,
  disabled,
}: {
  item: ChecklistItem
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  disabled: boolean
}) {
  const estimated = item.monto ?? 0
  const real = item.montoReal
  const hasReal = item.completado && real != null
  const diff = hasReal ? real - estimated : 0
  const isOverBudget = diff > 0
  const isUnderBudget = diff < 0

  return (
    <div className="grid grid-cols-[auto_1fr_140px_160px_60px] gap-3 items-center px-5 py-2.5 hover:bg-surface-raised/50 transition-colors">
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
          item.completado ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary/50'
        }`}
      >
        {item.completado && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Text */}
      <span className={`text-xs leading-tight truncate ${item.completado ? 'text-ink-muted line-through' : 'text-ink font-medium'}`}>
        {item.texto}
      </span>

      {/* Estimated */}
      <span className="text-xs font-mono text-ink-muted text-right">${estimated.toLocaleString()}</span>

      {/* Real + diff */}
      <div className="flex items-center justify-end gap-1.5">
        {hasReal ? (
          <>
            <span className={`text-xs font-mono font-semibold ${isOverBudget ? 'text-danger' : isUnderBudget ? 'text-success' : 'text-ink-muted'}`}>
              ${real.toLocaleString()}
            </span>
            <span className={`text-[11px] font-semibold tabular-nums ${isOverBudget ? 'text-danger' : isUnderBudget ? 'text-success' : 'text-ink-muted'}`}>
              ({diff === 0 ? '=' : isOverBudget ? `+$${diff.toLocaleString()}` : `-$${Math.abs(diff).toLocaleString()}`})
            </span>
          </>
        ) : (
          <span className="text-xs text-ink-muted/40">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="rounded-lg p-1 text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-surface-raised hover:text-ink transition-all"
          title="Editar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="rounded-lg p-1 text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all"
          title="Eliminar"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
