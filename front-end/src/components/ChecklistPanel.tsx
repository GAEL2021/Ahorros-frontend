import { useState, useRef } from 'react'
import type { ChecklistItem } from '@/types'
import { useGoalChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem, useUpdateChecklistItem } from '@/hooks/useGoalChecklist'
import { sileo } from '@/lib/sileo'

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
  const [realCostDate, setRealCostDate] = useState(new Date().toISOString().split('T')[0])
  const [realCostUrl, setRealCostUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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

  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); if (!newText.trim() || addItem.isPending) return; try { await addItem.mutateAsync({ texto: newText.trim(), monto: newMonto }); setNewText(''); setNewMonto(0) } catch {} }
  const handleToggle = (item: ChecklistItem) => { if (item.completado) { toggleItem.mutate({ itemId: item.id, newValue: false }) } else { setRealCostItemId(item.id); setRealCostValue(item.monto ?? 0); setRealCostDate(new Date().toISOString().split('T')[0]); setRealCostUrl(item.comprobante ?? ''); setUploadProgress(0) } }
  const handleConfirmRealCost = async () => {
    if (!realCostItemId) return
    setRealCostItemId(null)
    toggleItem.mutate({ itemId: realCostItemId, newValue: true, montoReal: realCostValue, fechaReal: realCostDate, comprobante: realCostUrl || undefined }, {
      onSuccess: () => sileo.success(`✅ $${realCostValue.toLocaleString()} aportado a la meta`),
      onError: (err) => sileo.error(err instanceof Error ? err.message : 'Error al guardar'),
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) { sileo.error('El archivo no puede superar 500KB'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onprogress = (ev) => { if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100)) }
    reader.onload = () => { setRealCostUrl(reader.result as string); setUploading(false) }
    reader.onerror = () => { sileo.error('Error al leer el archivo'); setUploading(false) }
    reader.readAsDataURL(file)
  }
  const openEdit = (item: ChecklistItem) => { setEditingItem(item); setEditText(item.texto); setEditMonto(item.monto ?? 0); setEditUrl(item.comprobante ?? ''); setEditUploadProgress(0) }
  const saveEdit = async () => { if (!editingItem || !editText.trim() || updateItem.isPending) return; try { await updateItem.mutateAsync({ itemId: editingItem.id, payload: { texto: editText.trim(), monto: editMonto, comprobante: editUrl || undefined } }); setEditingItem(null) } catch {} }

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) { sileo.error('El archivo no puede superar 500KB'); return }
    setEditUploading(true)
    const reader = new FileReader()
    reader.onprogress = (ev) => { if (ev.lengthComputable) setEditUploadProgress(Math.round((ev.loaded / ev.total) * 100)) }
    reader.onload = () => { setEditUrl(reader.result as string); setEditUploading(false) }
    reader.onerror = () => { sileo.error('Error al leer el archivo'); setEditUploading(false) }
    reader.readAsDataURL(file)
  }

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
          {/* Headers */}
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
                  {item.comprobante && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewUrl(item.comprobante ?? null) }} className="rounded p-1 text-primary hover:bg-primary/10 transition-colors" title="Ver comprobante">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                  )}
                  {confirmDeleteId === item.id ? (<><button type="button" onClick={() => { deleteItem.mutate(item.id); setConfirmDeleteId(null) }} className="rounded px-2 py-1 text-[10px] font-semibold text-white bg-danger hover:bg-red-600">Eliminar</button><button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded p-1 text-ink-muted hover:bg-surface"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>) : (<><button type="button" onClick={() => openEdit(item)} className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button type="button" onClick={() => setConfirmDeleteId(item.id)} className="rounded p-1 text-ink-muted hover:bg-danger/10 hover:text-danger"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></>)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && total === 0 && <div className="px-4 py-8 text-center"><p className="text-xs text-ink-muted">Sin ítems aún. Agregá tareas con su costo estimado.</p></div>}
      {isLoading && <div className="flex items-center justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" /></div>}

      {realCostItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setRealCostItemId(null)}>
          <div className="glass rounded-2xl shadow-xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-ink">Costo real</h3>
              <button type="button" onClick={() => setRealCostItemId(null)} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-xs text-ink-muted">Estimado: <span className="font-semibold text-ink">${(itemsList.find((i) => i.id === realCostItemId)?.monto ?? 0).toLocaleString()}</span></p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Monto real</label>
                <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">$</span><input type="number" min={0} value={realCostValue || ''} onChange={(e) => setRealCostValue(Number(e.target.value))} autoFocus className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-4 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Fecha de pago</label>
                <input type="date" value={realCostDate} onChange={(e) => setRealCostDate(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Comprobante</label>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                {realCostUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs text-success truncate">✅ Archivo subido</span>
                    <button type="button" onClick={() => { setRealCostUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs text-danger hover:underline">Quitar</button>
                  </div>
                ) : uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                    <span className="text-xs text-ink-muted">{uploadProgress}%</span>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-border px-4 py-5 text-sm text-ink-muted hover:border-primary/50 hover:text-primary transition-colors text-center">
                    <svg className="h-6 w-6 mx-auto mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Adjuntar imagen o PDF
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRealCostItemId(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button>
                <button type="button" onClick={handleConfirmRealCost} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light">Confirmar</button>
              </div>
            </div>
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
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Comprobante</label>
                <input ref={editFileRef} type="file" accept="image/*,.pdf" onChange={handleEditFileChange} className="hidden" />
                {editUrl ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs text-success truncate">✅ Archivo adjunto</span>
                    <button type="button" onClick={() => { setEditUrl(''); if (editFileRef.current) editFileRef.current.value = '' }} className="text-xs text-danger hover:underline">Quitar</button>
                  </div>
                ) : editUploading ? (
                  <div className="flex items-center gap-2"><div className="flex-1 h-2 rounded-full bg-border overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${editUploadProgress}%` }} /></div><span className="text-xs text-ink-muted">{editUploadProgress}%</span></div>
                ) : (
                  <button type="button" onClick={() => editFileRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-border px-4 py-3 text-xs text-ink-muted hover:border-primary/50 hover:text-primary transition-colors text-center">Adjuntar imagen o PDF</button>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setEditingItem(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button><button type="button" onClick={saveEdit} disabled={updateItem.isPending || !editText.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{updateItem.isPending ? 'Guardando...' : 'Guardar'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Comprobante</span>
              <button type="button" onClick={() => setPreviewUrl(null)} className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {previewUrl.startsWith('data:image/') ? (
              <img src={previewUrl} alt="Comprobante" className="w-full rounded-2xl max-h-[75vh] object-contain" />
            ) : (
              <iframe src={previewUrl} className="w-full h-[75vh] rounded-2xl bg-white" title="Comprobante" />
            )}
            <a href={previewUrl} download="comprobante" className="mt-3 self-center inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light" onClick={(e) => e.stopPropagation()}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Descargar
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
