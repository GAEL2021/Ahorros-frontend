import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ChecklistItem } from '@/types'
import { useGoalChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem, useUpdateChecklistItem } from '@/hooks/useGoalChecklist'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { sileo } from '@/lib/sileo'

interface ChecklistPanelProps { goalId: string; metaMontoObjetivo: number; metaMontoAcumulado: number }

function FullModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--bg-sidebar)] rounded-2xl border border-border shadow-2xl w-full sm:w-[80%] max-h-[90vh] flex flex-col animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default function ChecklistPanel({ goalId, metaMontoObjetivo, metaMontoAcumulado }: ChecklistPanelProps) {
  const { data: items, isLoading } = useGoalChecklist(goalId)
  const addItem = useAddChecklistItem(goalId)
  const toggleItem = useToggleChecklistItem(goalId)
  const deleteItem = useDeleteChecklistItem(goalId)
  const updateItem = useUpdateChecklistItem(goalId)
  const { data: bancos } = useFetchBancos()
  const [newText, setNewText] = useState('')
  const [newMonto, setNewMonto] = useState(0)
  const [realCostItemId, setRealCostItemId] = useState<string | null>(null)
  const [realCostValue, setRealCostValue] = useState(0)
  const [realCostDate, setRealCostDate] = useState(new Date().toISOString().split('T')[0])
  const [realCostUrl, setRealCostUrl] = useState('')
  const [realCostCarteraId, setRealCostCarteraId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null)
  const [editText, setEditText] = useState('')
  const [editMonto, setEditMonto] = useState(0)
  const [editUrl, setEditUrl] = useState('')
  const [editUploading, setEditUploading] = useState(false)
  const [editUploadProgress, setEditUploadProgress] = useState(0)
  const editFileRef = useRef<HTMLInputElement>(null)

  const itemsList = items ?? []
  const totalEstimado = itemsList.reduce((sum, i) => sum + (i.monto ?? 0), 0)
  const totalReal = itemsList.filter((i) => i.completado && i.montoReal != null).reduce((sum, i) => sum + (i.montoReal ?? 0), 0)
  const completados = itemsList.filter((i) => i.completado).length
  const total = itemsList.length

  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); if (!newText.trim() || addItem.isPending) return; try { await addItem.mutateAsync({ texto: newText.trim(), monto: newMonto }); setNewText(''); setNewMonto(0); setShowAddModal(false) } catch {} }
  const handleToggle = (item: ChecklistItem) => { if (item.completado) { toggleItem.mutate({ itemId: item.id, newValue: false }) } else { if (metaMontoAcumulado < (item.monto ?? 0)) { sileo.error(`Necesitás $${(item.monto ?? 0).toLocaleString()} ahorrados. Tenés $${metaMontoAcumulado.toLocaleString()}.`); return }; setRealCostItemId(item.id); setRealCostValue(item.monto ?? 0); setRealCostDate(new Date().toISOString().split('T')[0]); setRealCostUrl(item.comprobante ?? ''); setRealCostCarteraId(''); setUploadProgress(0) } }
  const handleConfirmRealCost = async () => {
    if (!realCostItemId) return
    if (!realCostCarteraId) { sileo.error('Seleccioná una cartera para el gasto'); return }
    setRealCostItemId(null)
    try {
      await toggleItem.mutateAsync({ itemId: realCostItemId, newValue: true, montoReal: realCostValue, fechaReal: realCostDate, comprobante: realCostUrl || undefined })
      sileo.success(`✅ Gasto registrado: $${realCostValue.toLocaleString()}`)
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }
  const openEdit = (item: ChecklistItem) => { setEditingItem(item); setEditText(item.texto); setEditMonto(item.monto ?? 0); setEditUrl(item.comprobante ?? ''); setEditUploadProgress(0) }
  const saveEdit = async () => { if (!editingItem || !editText.trim() || updateItem.isPending) return; try { await updateItem.mutateAsync({ itemId: editingItem.id, payload: { texto: editText.trim(), monto: editMonto, comprobante: editUrl || undefined } }); setEditingItem(null) } catch {} }
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return;     if (file.size > 5000 * 1024) { sileo.error('Máximo 5MB'); return }; setUploading(true); const r = new FileReader(); r.onprogress = (ev) => { if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100)) }; r.onload = () => { setRealCostUrl(r.result as string); setUploading(false) }; r.onerror = () => { sileo.error('Error al leer'); setUploading(false) }; r.readAsDataURL(file) }
  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return;     if (file.size > 5000 * 1024) { sileo.error('Máximo 5MB'); return }; setEditUploading(true); const r = new FileReader(); r.onprogress = (ev) => { if (ev.lengthComputable) setEditUploadProgress(Math.round((ev.loaded / ev.total) * 100)) }; r.onload = () => { setEditUrl(r.result as string); setEditUploading(false) }; r.onerror = () => { sileo.error('Error al leer'); setEditUploading(false) }; r.readAsDataURL(file) }

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
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[auto_1fr_90px_90px_80px] gap-2 items-center px-4 py-2 border-b border-border bg-surface-raised/50 text-[10px] font-semibold uppercase tracking-wider text-ink-muted min-w-[500px]">
            <span className="w-5" /><span>Descripción</span><span className="text-right">Estimado</span><span className="text-right">Real</span><span />
          </div>
          <ul className="divide-y divide-border min-w-[500px]">
            {itemsList.map((item) => (
              <li key={item.id} className="grid grid-cols-[auto_1fr_90px_90px_80px] gap-2 items-center px-4 py-2 hover:bg-surface-raised/50 transition-colors">
                <button type="button" onClick={() => handleToggle(item)} disabled={toggleItem.isPending} className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${item.completado ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary/50'}`}>
                  {item.completado && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
                <span className={`text-xs leading-tight truncate ${item.completado ? 'text-ink-muted line-through' : 'text-ink'}`}>{item.texto}</span>
                <span className="text-[11px] text-ink-muted text-right font-mono">${(item.monto ?? 0).toLocaleString()}</span>
                <span className="text-[11px] text-right font-mono">{item.completado && item.montoReal != null ? <span className={item.montoReal > (item.monto ?? 0) ? 'text-danger font-semibold' : item.montoReal < (item.monto ?? 0) ? 'text-success font-semibold' : 'text-ink-muted'}>${item.montoReal.toLocaleString()}</span> : <span className="text-ink-muted/30">—</span>}</span>
                <div className="flex items-center justify-end gap-0.5">
                  {item.comprobante && <button type="button" onClick={(ev) => { ev.stopPropagation(); setPreviewUrl(item.comprobante ?? null) }} className="rounded p-1 text-primary hover:bg-primary/10" title="Ver comprobante"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>}
                  {confirmDeleteId === item.id ? (<><button type="button" onClick={() => { deleteItem.mutate(item.id, { onError: (err) => sileo.error(err instanceof Error ? err.message : 'Error al eliminar') }); setConfirmDeleteId(null) }} className="rounded px-2 py-1 text-[10px] font-semibold text-white bg-danger hover:bg-red-600">Eliminar</button><button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded p-1 text-ink-muted hover:bg-surface"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>) : (<><button type="button" onClick={() => openEdit(item)} className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button type="button" onClick={() => setConfirmDeleteId(item.id)} className="rounded p-1 text-ink-muted hover:bg-danger/10 hover:text-danger"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && total === 0 && <div className="px-4 py-8 text-center"><p className="text-xs text-ink-muted">Sin ítems aún. Agregá tareas con su costo estimado.</p></div>}
      {isLoading && <div className="flex items-center justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" /></div>}

      <div className="border-t border-border px-4 py-3 bg-surface-raised/50">
        <button type="button" onClick={() => { setNewText(''); setNewMonto(0); setShowAddModal(true) }} className="w-full rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-ink-muted hover:border-primary/50 hover:text-primary transition-colors text-center">
          <svg className="h-5 w-5 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Agregar ítem
        </button>
      </div>
      {addItem.isError && <p className="px-4 py-2 text-xs text-danger border-t border-border">{addItem.error instanceof Error ? addItem.error.message : 'Error'}</p>}

      {/* Full-screen modals */}
      {createPortal(<FullModal open={!!realCostItemId} onClose={() => setRealCostItemId(null)} title="Costo real">
        <div className="p-5 space-y-4 sm:max-w-[80%] sm:mx-auto">
          <p className="text-sm text-ink-muted">Estimado: <span className="font-semibold text-ink">${(itemsList.find((i) => i.id === realCostItemId)?.monto ?? 0).toLocaleString()}</span> · Ahorrado: <span className="font-semibold text-ink">${metaMontoAcumulado.toLocaleString()}</span></p>
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Monto real</label><div className="flex items-center rounded-xl border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden"><span className="pl-4 pr-1 text-base text-ink-muted">$</span><input type="number" min={0} value={realCostValue || ''} onChange={(e) => setRealCostValue(Number(e.target.value))} autoFocus className="flex-1 py-3 pr-4 text-base font-mono bg-transparent placeholder:text-ink-muted/40 focus:outline-none" /></div></div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Cartera de origen</label>
            <select value={realCostCarteraId} onChange={(e) => setRealCostCarteraId(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="" disabled>Seleccionar cartera</option>
              {bancos?.map((b) => <option key={b.id} value={b.id}>{b.nombre} (${b.saldo.toLocaleString()})</option>)}
            </select>
            {!realCostCarteraId && <p className="mt-1 text-xs text-ink-muted">El aporte se descontará de esta cartera</p>}
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Fecha de pago</label><input type="date" value={realCostDate} onChange={(e) => setRealCostDate(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Comprobante</label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
            {realCostUrl ? (
              <div className="flex items-center gap-2"><span className="flex-1 text-sm text-success">✅ Archivo adjunto</span><button type="button" onClick={() => { setRealCostUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-sm text-danger hover:underline">Quitar</button></div>
            ) : uploading ? (
              <div className="flex items-center gap-3"><div className="flex-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} /></div><span className="text-xs text-ink-muted">{uploadProgress}%</span></div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-border px-4 py-6 text-sm text-ink-muted hover:border-primary/50 hover:text-primary transition-colors text-center"><svg className="h-6 w-6 mx-auto mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Adjuntar imagen o PDF</button>
            )}
          </div>
          <button type="button" onClick={handleConfirmRealCost} className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98]">Confirmar y aportar</button>
        </div>
      </FullModal>, document.body)}

      {createPortal(<FullModal open={!!editingItem} onClose={() => setEditingItem(null)} title="Editar ítem">
        <form onSubmit={(e) => { e.preventDefault(); saveEdit() }} className="p-5 space-y-4 sm:max-w-[80%] sm:mx-auto">
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Descripción</label><input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={300} autoFocus className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Monto estimado</label><div className="flex items-center rounded-xl border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden"><span className="pl-4 pr-1 text-base text-ink-muted">$</span><input type="number" min={0} value={editMonto || ''} onChange={(e) => setEditMonto(Number(e.target.value))} className="flex-1 py-3 pr-4 text-base font-mono bg-transparent placeholder:text-ink-muted/40 focus:outline-none" /></div></div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Comprobante</label>
            <input ref={editFileRef} type="file" accept="image/*,.pdf" onChange={handleEditFileChange} className="hidden" />
            {editUrl ? (
              <div className="flex items-center gap-2"><span className="flex-1 text-sm text-success">✅ Archivo adjunto</span><button type="button" onClick={() => { setEditUrl(''); if (editFileRef.current) editFileRef.current.value = '' }} className="text-sm text-danger hover:underline">Quitar</button></div>
            ) : editUploading ? (
              <div className="flex items-center gap-3"><div className="flex-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${editUploadProgress}%` }} /></div><span className="text-xs text-ink-muted">{editUploadProgress}%</span></div>
            ) : (
              <button type="button" onClick={() => editFileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm text-ink-muted hover:border-primary/50 hover:text-primary transition-colors text-center">Adjuntar imagen o PDF</button>
            )}
          </div>
          <button type="submit" disabled={updateItem.isPending || !editText.trim()} className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98] disabled:opacity-50">Guardar cambios</button>
        </form>
      </FullModal>, document.body)}

      {createPortal(<FullModal open={showAddModal} onClose={() => setShowAddModal(false)} title="Nuevo ítem">
        <form onSubmit={handleAdd} className="p-5 space-y-4 sm:max-w-[80%] sm:mx-auto">
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Descripción</label><input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} maxLength={300} autoFocus placeholder="Ej. Pasajes de avión" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base placeholder:text-ink-muted/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Monto estimado</label><div className="flex items-center rounded-xl border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden"><span className="pl-4 pr-1 text-base text-ink-muted">$</span><input type="number" min={0} value={newMonto || ''} onChange={(e) => setNewMonto(Number(e.target.value))} placeholder="0" className="flex-1 py-3 pr-4 text-base font-mono bg-transparent placeholder:text-ink-muted/40 focus:outline-none" /></div></div>
          <button type="submit" disabled={!newText.trim() || addItem.isPending} className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 hover:bg-primary-light active:scale-[0.98] disabled:opacity-50">Agregar ítem</button>
        </form>
      </FullModal>, document.body)}

      {/* Preview modal */}
      {previewUrl && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewUrl(null)}>
          <div className="bg-[var(--bg-sidebar)] rounded-2xl w-full sm:w-[80%] max-h-[90vh] flex flex-col animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3 flex-shrink-0">
              <span className="text-sm font-semibold text-ink">Comprobante</span>
              <div className="flex items-center gap-2">
                <a href={previewUrl} download="comprobante" className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20" onClick={(e) => e.stopPropagation()}><svg className="h-3.5 w-3.5 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Descargar</a>
                <button type="button" onClick={() => setPreviewUrl(null)} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              {previewUrl.startsWith('data:image/') ? <img src={previewUrl} alt="Comprobante" className="max-w-full max-h-full object-contain rounded-xl" /> : <iframe src={previewUrl} className="w-full h-full min-h-[60vh] rounded-xl bg-white" title="Comprobante" />}
            </div>
          </div>
        </div>, document.body)}
    </div>
  )
}
