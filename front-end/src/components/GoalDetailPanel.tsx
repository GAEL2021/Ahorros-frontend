import { useState, useEffect } from 'react'
import type { Meta } from '@/types'
import { useGoalDetail } from '@/hooks/useGoalDetail'
import GoalOverview from '@/components/GoalOverview'
import MovementsPanel from '@/components/MovementsPanel'
import ChecklistPanel from '@/components/ChecklistPanel'

interface GoalDetailPanelProps {
  open: boolean
  onClose: () => void
  meta: Meta
}

function fmt(n: number) { return `$${n.toLocaleString()}` }

export default function GoalDetailPanel({ open, onClose, meta }: GoalDetailPanelProps) {
  const [section, setSection] = useState<'checklist' | 'movements' | null>(null)
  const { data: detail, isLoading } = useGoalDetail(open ? meta.id : '')
  const metaData = detail ?? meta
  const miembros = metaData.miembros

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (section) setSection(null); else onClose() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, section])

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden' }
    else { document.body.style.overflow = ''; setSection(null) }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (section) setSection(null); else onClose() }} />
      <div className="relative w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col h-full animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink truncate">{meta.nombre}</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {meta.estado === 'activo' ? 'Activa' : meta.estado === 'completado' ? 'Completada' : 'Cancelada'}
              {(miembros?.length ?? 0) > 1 && ` · ${miembros!.length} participantes`} · ${fmt(meta.montoObjetivo)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {isLoading && !detail ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="text-xs text-ink-muted">Cargando...</p>
            </div>
          </div>
        ) : section ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-surface px-5 py-2.5 flex-shrink-0">
              <button type="button" onClick={() => setSection(null)} className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Volver
              </button>
              <span className="text-xs font-semibold text-ink">{section === 'checklist' ? 'Checklist' : 'Movimientos'}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {section === 'checklist' && <div className="px-5 py-4"><ChecklistPanel goalId={meta.id} metaMontoObjetivo={meta.montoObjetivo} metaMontoAcumulado={meta.montoAcumulado} /></div>}
              {section === 'movements' && (
                miembros && miembros.length > 0 ? (
                  <div className="px-5 py-4"><MovementsPanel goalId={meta.id} totalMonths={meta.mesesRestantes} members={miembros} /></div>
                ) : (
                  <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center">
                    <p className="text-xs text-ink-muted">Sin movimientos aún</p>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <GoalOverview meta={metaData} onOpenChecklist={() => setSection('checklist')} onOpenMovements={() => setSection('movements')} />
          </div>
        )}
      </div>
    </div>
  )
}
