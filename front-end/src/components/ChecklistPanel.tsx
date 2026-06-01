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
  const [showConfirmExcessModal, setShowConfirmExcessModal] = useState<{ type: 'add' | 'edit'; action: () => void } | null>(null)

  const itemsList = items ?? []
  const totalEstimado = itemsList.reduce((sum, i) => sum + (i.monto ?? 0), 0)
  const totalReal = itemsList.filter((i) => i.completado && i.montoReal != null).reduce((sum, i) => sum + (i.montoReal ?? 0), 0)
  const completados = itemsList.filter((i) => i.completado).length
  const total = itemsList.length
  const exceso = totalEstimado - metaMontoObjetivo

  const handleAdd = async (e: React.FormEvent | null, ignoreExcesoConfirm = false) => {
    if (e) e.preventDefault();
    if (!newText.trim() || addItem.isPending) return;
    if (!ignoreExcesoConfirm && (totalEstimado + newMonto > metaMontoObjetivo)) {
      setShowConfirmExcessModal({
        type: 'add',
        action: () => handleAdd(null, true)
      });
      return;
    }
    try {
      await addItem.mutateAsync({ texto: newText.trim(), monto: newMonto, ignorarExceso: true });
      setNewText('');
      setNewMonto(0);
      setShowAddModal(false);
      setShowConfirmExcessModal(null);
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al agregar');
    }
  }
  const handleToggle = (item: ChecklistItem) => {
    if (item.completado) {
      toggleItem.mutate({ itemId: item.id, newValue: false })
      return
    }
    if (metaMontoAcumulado < metaMontoObjetivo) {
      const pct = Math.round((metaMontoAcumulado / metaMontoObjetivo) * 100)
      sileo.error(`La meta no está completa. Ahorro: ${pct}%. Necesitás $${metaMontoObjetivo.toLocaleString()} y tenés $${metaMontoAcumulado.toLocaleString()}.`)
      return
    }
    setRealCostItemId(item.id)
    setRealCostValue(item.monto ?? 0)
    setRealCostDate(new Date().toISOString().split('T')[0])
    setRealCostUrl(item.comprobante ?? '')
    setRealCostCarteraId('')
    setUploadProgress(0)
  }
  const handleConfirmRealCost = async () => {
    if (!realCostItemId) return
    if (!realCostCarteraId) { sileo.error('Seleccioná una cartera para el gasto'); return }
    const targetCarteraId = realCostCarteraId
    setRealCostItemId(null)
    try {
      await toggleItem.mutateAsync({
        itemId: realCostItemId,
        newValue: true,
        montoReal: realCostValue,
        fechaReal: realCostDate,
        comprobante: realCostUrl || undefined,
        carteraId: targetCarteraId
      })
      sileo.success(`✅ Gasto registrado y debitado: $${realCostValue.toLocaleString()}`)
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }
  const openEdit = (item: ChecklistItem) => { setEditingItem(item); setEditText(item.texto); setEditMonto(item.monto ?? 0); setEditUrl(item.comprobante ?? ''); setEditUploadProgress(0) }
  const saveEdit = async (ignoreExcesoConfirm = false) => {
    if (!editingItem || !editText.trim() || updateItem.isPending) return;
    const currentItemMonto = editingItem.monto ?? 0;
    if (!ignoreExcesoConfirm && (totalEstimado - currentItemMonto + editMonto > metaMontoObjetivo)) {
      setShowConfirmExcessModal({
        type: 'edit',
        action: () => saveEdit(true)
      });
      return;
    }
    try {
      await updateItem.mutateAsync({
        itemId: editingItem.id,
        payload: { texto: editText.trim(), monto: editMonto, comprobante: editUrl || undefined, ignorarExceso: true }
      });
      setEditingItem(null);
      setShowConfirmExcessModal(null);
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  }
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si es muy grande (máximo 1200px de ancho/alto)
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Comprimir como JPEG con calidad del 70%
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen para compresión'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      sileo.error('Los archivos deben ser menores a 5MB');
      setUploading(false);
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      if (file.type.startsWith('image/')) {
        setUploadProgress(30);
        const compressedDataUrl = await compressImage(file);
        setUploadProgress(90);
        setRealCostUrl(compressedDataUrl);
        setUploadProgress(100);
      } else {
        const r = new FileReader();
        r.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        r.onload = () => {
          setRealCostUrl(r.result as string);
          setUploading(false);
        };
        r.onerror = () => {
          sileo.error('Error al leer el archivo');
          setUploading(false);
        };
        r.readAsDataURL(file);
        return;
      }
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      sileo.error('Los archivos deben ser menores a 5MB');
      setEditUploading(false);
      return;
    }

    setEditUploading(true);
    setEditUploadProgress(10);

    try {
      if (file.type.startsWith('image/')) {
        setEditUploadProgress(30);
        const compressedDataUrl = await compressImage(file);
        setEditUploadProgress(90);
        setEditUrl(compressedDataUrl);
        setEditUploadProgress(100);
      } else {
        const r = new FileReader();
        r.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setEditUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        r.onload = () => {
          setEditUrl(r.result as string);
          setEditUploading(false);
        };
        r.onerror = () => {
          sileo.error('Error al leer el archivo');
          setEditUploading(false);
        };
        r.readAsDataURL(file);
        return;
      }
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setEditUploading(false);
    }
  };

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

      {exceso > 0 && (
        <div className="mx-4 mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs text-warning animate-fade-in flex flex-col gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <svg className="h-4 w-4 text-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>Advertencia: Presupuesto Excedido</span>
          </div>
          <p>
            El total de tus ítems estimado en el checklist ($<strong>{totalEstimado.toLocaleString()}</strong>) supera el monto objetivo de la meta ($<strong>{metaMontoObjetivo.toLocaleString()}</strong>) por $<strong>{exceso.toLocaleString()}</strong>.
          </p>
          <p className="text-ink-muted">
            <strong>Sugerencias:</strong> Puedes aumentar la meta desde la edición de la meta, o bien ajustar/eliminar elementos del checklist para mantener el presupuesto.
          </p>
        </div>
      )}

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

      {/* Full-screen modals */}
      {createPortal(<FullModal open={!!realCostItemId} onClose={() => setRealCostItemId(null)} title="Costo real">
        <div className="p-5 space-y-4 sm:max-w-[80%] sm:mx-auto">
          <p className="text-sm text-ink-muted">Estimado: <span className="font-semibold text-ink">${(itemsList.find((i) => i.id === realCostItemId)?.monto ?? 0).toLocaleString()}</span> · Ahorrado: <span className="font-semibold text-ink">${metaMontoAcumulado.toLocaleString()}</span></p>
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Monto real</label><div className="flex items-center rounded-xl border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden"><span className="pl-4 pr-1 text-base text-ink-muted">$</span><input type="number" min={0} value={realCostValue || ''} onChange={(e) => setRealCostValue(Number(e.target.value))} autoFocus className="flex-1 py-3 pr-4 text-base font-mono bg-transparent placeholder:text-ink-muted/40 focus:outline-none" /></div></div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Cartera de destino</label>
            <select value={realCostCarteraId} onChange={(e) => setRealCostCarteraId(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="" disabled>Seleccionar cartera</option>
              {bancos?.map((b) => <option key={b.id} value={b.id}>{b.tipo === 'compartida' ? `${b.nombre}-${b.creadoPorNombre}-${b.tipoCuenta === 'credito' ? 'C' : 'D'}` : b.nombre} (${b.saldo.toLocaleString()})</option>)}
            </select>
            {!realCostCarteraId && <p className="mt-1 text-xs text-ink-muted">El aporte se sumará a esta cartera</p>}
          </div>
          <div><label className="mb-1.5 block text-sm font-semibold text-ink">Fecha de pago</label><input type="date" value={realCostDate} onChange={(e) => setRealCostDate(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Comprobante</label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
            {realCostUrl ? (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-raised p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-success font-semibold">✅ Archivo adjunto</span>
                  <button type="button" onClick={() => setPreviewUrl(realCostUrl)} className="text-xs text-primary font-semibold hover:underline">Ver archivo</button>
                  <span className="text-ink-muted">·</span>
                  <button type="button" onClick={() => { setRealCostUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }} className="text-xs text-danger hover:underline">Quitar</button>
                </div>
                {realCostUrl.startsWith('data:image/') ? (
                  <div onClick={() => setPreviewUrl(realCostUrl)} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border mt-1 cursor-pointer hover:opacity-85 transition-opacity">
                    <img src={realCostUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div onClick={() => setPreviewUrl(realCostUrl)} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-2.5 mt-1 w-fit cursor-pointer hover:bg-surface-raised transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h1.5m-1.5 3h4m-4 3h4" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink">Documento PDF</p>
                      <p className="text-[10px] text-ink-muted">Clic para previsualizar</p>
                    </div>
                  </div>
                )}
              </div>
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
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-raised p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-success font-semibold">✅ Archivo adjunto</span>
                  <button type="button" onClick={() => setPreviewUrl(editUrl)} className="text-xs text-primary font-semibold hover:underline">Ver archivo</button>
                  <span className="text-ink-muted">·</span>
                  <button type="button" onClick={() => { setEditUrl(''); if (editFileRef.current) editFileRef.current.value = '' }} className="text-xs text-danger hover:underline">Quitar</button>
                </div>
                {editUrl.startsWith('data:image/') ? (
                  <div onClick={() => setPreviewUrl(editUrl)} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border mt-1 cursor-pointer hover:opacity-85 transition-opacity">
                    <img src={editUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div onClick={() => setPreviewUrl(editUrl)} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-2.5 mt-1 w-fit cursor-pointer hover:bg-surface-raised transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h1.5m-1.5 3h4m-4 3h4" /></svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink">Documento PDF</p>
                      <p className="text-[10px] text-ink-muted">Clic para previsualizar</p>
                    </div>
                  </div>
                )}
              </div>
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

      {showConfirmExcessModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowConfirmExcessModal(null)}>
          <div className="bg-[var(--bg-sidebar)] rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Confirmar Exceso
              </h3>
              <p className="mt-3 text-xs text-ink-secondary leading-relaxed">
                El total de los elementos del checklist superará el presupuesto objetivo de la meta de ahorro. ¿Deseas guardar este elemento de todos modos?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowConfirmExcessModal(null)} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-raised transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={showConfirmExcessModal.action} className="rounded-xl bg-warning px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors">
                  Sí, guardar
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  )
}
