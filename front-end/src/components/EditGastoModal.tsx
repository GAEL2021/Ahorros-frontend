import { useState } from 'react'
import { sileo } from '@/lib/sileo'
import { useUpdateGasto, useDeleteGasto } from '@/hooks/usePresupuestos'
import type { Gasto } from '@/types'
import SearchableSelect from '@/components/ui/SearchableSelect'

interface EditGastoModalProps {
  open: boolean
  onClose: () => void
  gasto: Gasto
  presupuestoId: string
}

export default function EditGastoModal({ open, onClose, gasto, presupuestoId }: EditGastoModalProps) {
  const updateGasto = useUpdateGasto(presupuestoId)
  const deleteGasto = useDeleteGasto(presupuestoId)
  const [monto, setMonto] = useState(gasto.monto)
  const [desc, setDesc] = useState(gasto.descripcion)
  const [cat, setCat] = useState(gasto.categoria)
  const [fecha, setFecha] = useState(gasto.fecha || '')
  const [editAll, setEditAll] = useState(false)

  if (!open) return null

  const handleUpdate = async () => {
    if (!desc.trim() || monto < 1) return
    try {
      const data: Record<string, unknown> = { descripcion: desc.trim(), monto, categoria: cat }
      if (fecha) data.fecha = fecha
      if (gasto.esRecurrente && !editAll) {
        data.recurrenciaGrupoId = null
      }
      await updateGasto.mutateAsync({ gastoId: gasto.id, data })
      sileo.success('Gasto actualizado')
      onClose()
    } catch { sileo.error('Error al actualizar') }
  }

  const handleDelete = async () => {
    try {
      await deleteGasto.mutateAsync(gasto.id)
      sileo.info('Gasto eliminado')
      onClose()
    } catch { sileo.error('Error al eliminar') }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Editar Gasto</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-3.5 px-5 py-4">
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Descripción</label><input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Monto</label><input type="number" min={1} inputMode="decimal" step="0.01" value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Categoría</label>
            <SearchableSelect
              options={[
                { value: 'fijos', label: '📋 Gastos Fijos' },
                { value: 'ocio', label: '🎮 Ocio' },
                { value: 'ahorro', label: '🐷 Ahorro' },
              ]}
              value={cat}
              onChange={(v) => setCat(v as any)}
            />
          </div>
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Fecha</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div>

          {gasto.esRecurrente && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editAll} onChange={(e) => setEditAll(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/30" />
                <span className="text-xs text-amber-800 dark:text-amber-200">Aplicar a todos los meses</span>
              </label>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Si no marcás, solo se edita este mes.</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <button type="button" onClick={handleDelete} className="rounded-xl border border-danger/30 px-4 py-2.5 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors">
              Eliminar
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button>
              <button type="button" onClick={handleUpdate} disabled={updateGasto.isPending || !desc.trim() || monto < 1} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">
                {updateGasto.isPending ? '...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
