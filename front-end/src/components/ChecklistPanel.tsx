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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null)
  const [editText, setEditText] = useState('')
  const [editMonto, setEditMonto] = useState(0)

  const itemsList = items ?? []
  const totalEstimado = itemsList.reduce((sum, i) => sum + (i.monto ?? 0), 0)
  const totalReal = itemsList.filter((i) => i.completado && i.montoReal != null).reduce((sum, i) => sum + (i.montoReal ?? 0), 0)
  const completados = itemsList.filter((i) => i.completado).length
  const total = itemsList.length

  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); if (!newText.trim() || addItem.isPending) return; try { await addItem.mutateAsync({ texto: newText.trim(), monto: newMonto }); setNewText(''); setNewMonto(0) } catch {} }
  const handleToggle = (item: ChecklistItem) => { if (item.completado) { toggleItem.mutate({ itemId: item.id, newValue: false }) } else { setRealCostItemId(item.id); setRealCostValue(item.monto ?? 0) } }
  const handleConfirmRealCost = () => { if (!realCostItemId) return; toggleItem.mutate({ itemId: realCostItemId, newValue: true, montoReal: realCostValue }); setRealCostItemId(null) }
  const openEdit = (item: ChecklistItem) => { setEditingItem(item); setEditText(item.texto); setEditMonto(item.monto ?? 0) }
  const saveEdit = async () => { if (!editingItem || !editText.trim() || updateItem.isPending) return; try { await updateItem.mutateAsync({ itemId: editingItem.id, payload: { texto: editText.trim(), monto: editMonto } }); setEditingItem(null) } catch {} }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-raised px-4 py-3">
        <div><h3 className="text-sm font-semibold text-ink">Checklist</h3>{total > 0 && <p className="mt-0.5 text-xs text-ink-muted">{completados}/{total} completado{total !== 1 ? 's' : ''}</p>}</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-muted">${totalEstimado.toLocaleString()} / ${metaMontoObjetivo.toLocaleString()}</span>
          {totalReal > 0 && <span className="text-[11px] font-semibold text-success">Real ${totalReal.toLocaleString()}</span>}
          {total > 0 && <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(completados / total) * 100}%` }} /></div>}
        </div>
      </div>

      {total > 0 && (
        <div>
          <div className="hidden sm:grid grid-cols-[auto_1fr_90px_90px_80px] gap-2 items-center px-4 py-2 border-b border-border bg-surface-raised/50 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="w-5" /><span>Descripción</span><span className="text-right">Estimado</span><span className="text-right">Real</span><span />
          </div>
          <ul className="divide-y divide-border">
            {itemsList.map((item) => (
              <li key={item.id}>
                <div className="hidden sm:grid grid-cols-[auto_1fr_90px_90px_80px] gap-2 items-center px-4 py-2 hover:bg-surface-raised/50 transition-colors">
                  <button type="button" onClick={() => handleToggle(item)} disabled={toggleItem.isPending} className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${item.completado ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary/50'}`}>
                    {item.completado && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className={`text-xs leading-tight truncate ${item.completado ? 'text-ink-muted line-through' : 'text-ink'}`}>{item.texto}</span>
                  <span className="text-[11px] text-ink-muted text-right font-mono">${(item.monto ?? 0).toLocaleString()}</span>
                  <span className="text-[11px] text-right font-mono">{item.completado && item.montoReal != null ? <span className={item.montoReal > (item.monto ?? 0) ? 'text-danger font-semibold' : item.montoReal < (item.monto ?? 0) ? 'text-success font-semibold' : 'text-ink-muted'}>${item.montoReal.toLocaleString()}</span> : <span className="text-ink-muted/30">—</span>}</span>
                  <div className="flex items-center justify-end gap-0.5">
                    {confirmDeleteId === item.id ? (<><button type="button" onClick={() => { deleteItem.mutate(item.id); setConfirmDeleteId(null) }} className="rounded px-2 py-1 text-[10px] font-semibold text-white bg-danger hover:bg-red-600">Eliminar</button><button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded p-1 text-ink-muted hover:bg-surface"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>) : (<><button type="button" onClick={() => openEdit(item)} className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button type="button" onClick={() => setConfirmDeleteId(item.id)} className="rounded p-1 text-ink-muted hover:bg-danger/10 hover:text-danger"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>)}
                  </div>
                </div>
                <div className="sm:hidden px-4 py-2.5 hover:bg-surface-raised/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleToggle(item)} disabled={toggleItem.isPending} className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${item.completado ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary/50'}`}>
                      {item.completado && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`flex-1 text-xs leading-tight ${item.completado ? 'text-ink-muted line-through' : 'text-ink'}`}>{item.texto}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-ink-muted">Est. <span className="font-mono font-medium">${(item.monto ?? 0).toLocaleString()}</span></span>
                      {item.completado && item.montoReal != null && <span className={item.montoReal > (item.monto ?? 0) ? 'text-danger font-semibold' : item.montoReal < (item.monto ?? 0) ? 'text-success font-semibold' : 'text-ink-muted'}>Real <span className="font-mono">${item.montoReal.toLocaleString()}</span></span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {confirmDeleteId === item.id ? (<><button type="button" onClick={() => { deleteItem.mutate(item.id); setConfirmDeleteId(null) }} className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-white bg-danger">Eliminar</button><button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded-lg p-1.5 text-ink-muted"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>) : (<><button type="button" onClick={() => openEdit(item)} className="rounded-lg p-2 text-ink-muted active:scale-95"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button type="button" onClick={() => setConfirmDeleteId(item.id)} className="rounded-lg p-2 text-ink-muted active:scale-95"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
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

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setEditingItem(null)}>
          <div className="glass rounded-2xl shadow-xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><h3 className="text-base font-semibold text-ink">Editar ítem</h3><button type="button" onClick={() => setEditingItem(null)} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
            <div className="px-5 py-4 space-y-4">
              <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Descripción</label><input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={300} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit() }} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Monto estimado</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span><input type="number" min={0} value={editMonto || ''} onChange={(e) => setEditMonto(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-4 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div></div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setEditingItem(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button><button type="button" onClick={saveEdit} disabled={updateItem.isPending || !editText.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{updateItem.isPending ? 'Guardando...' : 'Guardar'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
