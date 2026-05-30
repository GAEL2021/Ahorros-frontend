import { useState } from 'react'
import type { ChecklistItem } from '@/types'
import { useGoalChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem, useUpdateChecklistItem } from '@/hooks/useGoalChecklist'

interface ChecklistPanelProps { goalId: string; metaMontoObjetivo: number }

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editMonto, setEditMonto] = useState(0)

  const itemsList = items ?? []
  const totalEstimado = itemsList.reduce((sum, i) => sum + (i.monto ?? 0), 0)
  const completados = itemsList.filter((i) => i.completado).length
  const total = itemsList.length

  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); if (!newText.trim() || addItem.isPending) return; try { await addItem.mutateAsync({ texto: newText.trim(), monto: newMonto }); setNewText(''); setNewMonto(0) } catch {} }

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
    toggleItem.mutate({ itemId: realCostItemId, newValue: true, montoReal: realCostValue })
    setRealCostItemId(null)
  }

  const saveEdit = async () => { if (!editingId || !editText.trim() || updateItem.isPending) return; try { await updateItem.mutateAsync({ itemId: editingId, payload: { texto: editText.trim(), monto: editMonto } }); setEditingId(null) } catch {} }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-raised px-4 py-3">
        <div><h3 className="text-sm font-semibold text-ink">Checklist</h3>{total > 0 && <p className="mt-0.5 text-xs text-ink-muted">{completados}/{total} completado{total !== 1 ? 's' : ''}</p>}</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">Est. ${totalEstimado.toLocaleString()} / ${metaMontoObjetivo.toLocaleString()}</span>
          {total > 0 && <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completados / total) * 100}%` }} /></div>}
        </div>
      </div>

      {total > 0 && (
        <ul className="divide-y divide-border">
          {itemsList.map((item) => (
            <li key={item.id} className="group">
              {editingId === item.id ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-subtle/20">
                  <div className="h-4 w-4 rounded border-2 border-primary/30 flex-shrink-0" />
                  <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={300} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }} className="flex-1 rounded-md border border-primary/30 bg-surface px-2 py-1 text-xs focus:border-primary focus:outline-none" />
                  <input type="number" min={0} value={editMonto || ''} onChange={(e) => setEditMonto(Number(e.target.value))} className="w-24 rounded-md border border-primary/30 bg-surface px-2 py-1 text-xs text-right focus:border-primary focus:outline-none" />
                  <button type="button" onClick={saveEdit} className="rounded p-1 text-success hover:bg-success/10"><svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                  <button type="button" onClick={() => setEditingId(null)} className="rounded p-1 text-ink-muted hover:bg-surface"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 hover:bg-surface-raised/50 transition-colors">
                  <button type="button" onClick={() => handleToggle(item)} disabled={toggleItem.isPending} className={`flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${item.completado ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary/50'}`}>
                    {item.completado && <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className={`flex-1 text-xs leading-tight truncate ${item.completado ? 'text-ink-muted line-through' : 'text-ink'}`}>{item.texto}</span>
                  <span className="text-xs text-ink-muted w-20 text-right font-mono">${(item.monto ?? 0).toLocaleString()}</span>
                  <button type="button" onClick={() => { setEditingId(item.id); setEditText(item.texto); setEditMonto(item.monto ?? 0) }} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface hover:text-ink active:scale-95 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <span className="sm:hidden">Editar</span>
                  </button>
                  <button type="button" onClick={() => deleteItem.mutate(item.id)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-muted hover:bg-danger/10 hover:text-danger active:scale-95 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    <span className="sm:hidden">Eliminar</span>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isLoading && total === 0 && <div className="px-4 py-8 text-center"><p className="text-xs text-ink-muted">Sin ítems aún. Agregá tareas con su costo estimado.</p></div>}
      {isLoading && <div className="flex items-center justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" /></div>}

      {realCostItemId && (
        <div className="border-t border-border bg-accent-subtle/30 p-4 animate-scale-in">
          <p className="text-xs font-semibold text-ink mb-2">¿Costo real del ítem?</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">$</span>
            <input type="number" min={0} value={realCostValue || ''} onChange={(e) => setRealCostValue(Number(e.target.value))} onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRealCost() }} autoFocus className="flex-1 rounded-md border border-accent/50 bg-surface px-3 py-1.5 text-sm font-mono focus:border-accent focus:outline-none" />
            <button type="button" onClick={handleConfirmRealCost} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark">OK</button>
            <button type="button" onClick={() => setRealCostItemId(null)} className="rounded-md border border-border px-3 py-1.5 text-xs text-ink-muted hover:bg-surface">Cancelar</button>
          </div>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 border-t border-border px-4 py-3 bg-surface-raised/50">
        <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Nuevo ítem..." maxLength={300} className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-xs placeholder:text-ink-muted focus:border-primary focus:outline-none" />
        <div className="relative w-24"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted">$</span><input type="number" min={0} value={newMonto || ''} onChange={(e) => setNewMonto(Number(e.target.value))} placeholder="0" className="w-full rounded-md border border-border bg-surface pl-5 pr-2 py-2 text-xs focus:border-primary focus:outline-none" /></div>
        <button type="submit" disabled={!newText.trim() || addItem.isPending} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50">{addItem.isPending ? '...' : 'Agregar'}</button>
      </form>
      {addItem.isError && <p className="px-4 py-2 text-xs text-danger border-t border-border">{addItem.error instanceof Error ? addItem.error.message : 'Error'}</p>}
    </div>
  )
}
