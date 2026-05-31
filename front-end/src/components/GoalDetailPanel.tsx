import { useState, useEffect, useRef } from 'react'
import type { Meta } from '@/types'
import { useGoalDetail } from '@/hooks/useGoalDetail'
import GoalTimeline from '@/components/GoalTimeline'
import MovementsPanel from '@/components/MovementsPanel'
import ChecklistPanel from '@/components/ChecklistPanel'

interface GoalDetailPanelProps {
  open: boolean
  onClose: () => void
  meta: Meta
}

type Tab = 'progress' | 'checklist' | 'movements'

export default function GoalDetailPanel({ open, onClose, meta }: GoalDetailPanelProps) {
  const [tab, setTab] = useState<Tab>('progress')
  const panelRef = useRef<HTMLDivElement>(null)
  const { data: detail, isLoading } = useGoalDetail(open ? meta.id : '')
  const metaData = detail ?? meta
  const miembros = metaData.miembros

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg bg-surface border-l border-border shadow-2xl flex flex-col h-full animate-slide-up"
        style={{ animation: 'sil-panel-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink truncate">{meta.nombre}</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {meta.estado === 'activo' ? 'Activa' : meta.estado === 'completado' ? 'Completada' : 'Cancelada'}
              {(miembros?.length ?? 0) > 1 && ` · ${miembros!.length} participantes`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors flex-shrink-0"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light flex-shrink-0">
          <button
            type="button"
            onClick={() => setTab('progress')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[12px] font-medium transition-colors focus:outline-none ${
              tab === 'progress'
                ? 'text-primary border-b-2 border-primary bg-primary-subtle/30'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Progreso
          </button>
          <button
            type="button"
            onClick={() => setTab('checklist')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[12px] font-medium transition-colors focus:outline-none ${
              tab === 'checklist'
                ? 'text-primary border-b-2 border-primary bg-primary-subtle/30'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Checklist
          </button>
          <button
            type="button"
            onClick={() => setTab('movements')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[12px] font-medium transition-colors focus:outline-none ${
              tab === 'movements'
                ? 'text-primary border-b-2 border-primary bg-primary-subtle/30'
                : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Movimientos
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && !detail ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
                <p className="text-xs text-ink-muted">Cargando...</p>
              </div>
            </div>
          ) : (
            <>
              {tab === 'progress' && <GoalTimeline meta={metaData} />}
              {tab === 'checklist' && <ChecklistPanel goalId={meta.id} metaMontoObjetivo={meta.montoObjetivo} metaMontoAcumulado={meta.montoAcumulado} />}
              {tab === 'movements' && (
                miembros && miembros.length > 0 ? (
                  <MovementsPanel goalId={meta.id} totalMonths={meta.mesesRestantes} members={miembros} />
                ) : (
                  <div className="rounded-lg border border-border bg-surface-raised px-4 py-10 text-center">
                    <p className="text-xs text-ink-muted">Sin movimientos aún</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
