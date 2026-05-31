import { useState, useEffect } from 'react'
import { useUpdateGoal } from '@/hooks/useUpdateGoal'
import { sileo } from '@/lib/sileo'
import type { Meta } from '@/types'

interface EditGoalModalProps {
  open: boolean
  onClose: () => void
  meta: Meta
}

export default function EditGoalModal({ open, onClose, meta }: EditGoalModalProps) {
  const updateGoal = useUpdateGoal()
  const [nombre, setNombre] = useState(meta.nombre)
  const [montoObjetivo, setMontoObjetivo] = useState(meta.montoObjetivo)
  const [fechaLimite, setFechaLimite] = useState(meta.fechaLimite.split('T')[0])

  useEffect(() => {
    if (open) {
      setNombre(meta.nombre)
      setMontoObjetivo(meta.montoObjetivo)
      setFechaLimite(meta.fechaLimite.split('T')[0])
    }
  }, [open, meta])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateGoal.mutateAsync({
        goalId: meta.id,
        payload: { nombre, montoObjetivo, fechaLimite },
      })
      sileo.success('Meta actualizada correctamente')
      onClose()
    } catch {
      sileo.error('Error al actualizar la meta')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Editar meta</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Nombre</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Monto objetivo ($)</label>
              <input
                type="number"
                required
                min={1}
                value={montoObjetivo || ''}
                onChange={(e) => setMontoObjetivo(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Fecha límite</label>
              <input
                type="date"
                required
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateGoal.isPending}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {updateGoal.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
