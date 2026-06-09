import { useState } from 'react'
import type { Meta } from '@/types'
import { useGoalChecklist, useToggleChecklistItem } from '@/hooks/useGoalChecklist'

function fmt(n: number) { return `$${n.toLocaleString()}` }

export default function GoalOverview({ meta, onOpenChecklist, onOpenMovements }: { meta: Meta; onOpenChecklist: () => void; onOpenMovements: () => void }) {
  const { data: items } = useGoalChecklist(meta.id)
  const toggleItem = useToggleChecklistItem(meta.id)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const checklist = items ?? meta.checklist ?? []
  const completados = checklist.filter((i) => i.completado).length
  const totalChecklist = checklist.length
  const totalReal = checklist.filter((i) => i.completado && i.montoReal != null).reduce((s, i) => s + (i.montoReal ?? 0), 0)
  const totalEstimado = checklist.reduce((s, i) => s + (i.monto ?? 0), 0)
  const sobrante = Math.max(0, meta.montoAcumulado - totalReal)

  const progressPct = Math.min(100, Math.round((meta.montoAcumulado / meta.montoObjetivo) * 100))
  const pace = meta.montoAcumulado >= meta.montoObjetivo ? 'completado' : progressPct > 0 ? 'activo' : 'pendiente'

  const handleToggle = async (itemId: string, currentValue: boolean) => {
    setTogglingId(itemId)
    try {
      await toggleItem.mutateAsync({ itemId, newValue: !currentValue })
    } catch {}
    setTogglingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="rounded-xl bg-surface border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-lg font-bold text-ink">{fmt(meta.montoAcumulado)}</span>
            <span className="text-xs text-ink-muted ml-1">/ {fmt(meta.montoObjetivo)}</span>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            pace === 'completado' ? 'bg-success/10 text-success' : pace === 'activo' ? 'bg-primary/10 text-primary' : 'bg-border text-ink-muted'
          }`}>
            {pace === 'completado' ? 'Completada' : pace === 'activo' ? `${progressPct}%` : 'Pendiente'}
          </span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${progressPct >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* 3 summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface border border-border px-3 py-2.5 text-center">
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">Ahorrado</span>
          <p className="text-sm font-bold text-ink mt-0.5">{fmt(meta.montoAcumulado)}</p>
        </div>
        <div className="rounded-xl bg-surface border border-border px-3 py-2.5 text-center">
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">Gastado</span>
          <p className="text-sm font-bold text-danger mt-0.5">{fmt(totalReal)}</p>
        </div>
        <div className="rounded-xl bg-surface border border-border px-3 py-2.5 text-center">
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">Disponible</span>
          <p className="text-sm font-bold text-success mt-0.5">{fmt(sobrante)}</p>
        </div>
      </div>

      {/* Compact checklist */}
      <div className="rounded-xl bg-surface border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <span className="text-xs font-semibold text-ink">Checklist</span>
          <span className="text-[10px] text-ink-muted">{completados}/{totalChecklist} · ${totalEstimado.toLocaleString()}</span>
        </div>
        {totalChecklist === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-ink-muted">Sin items en el checklist.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {checklist.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 px-4 py-2">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, item.completado)}
                  disabled={togglingId === item.id}
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${item.completado ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary/50'}`}
                >
                  {item.completado && <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
                <span className={`flex-1 text-xs truncate ${item.completado ? 'text-ink-muted line-through' : 'text-ink'}`}>{item.texto}</span>
                <span className="text-xs text-ink-muted">Est: ${(item.monto ?? 0).toLocaleString()}</span>
                {item.completado && item.montoReal != null && (
                  <span className={`text-xs font-semibold ${item.montoReal > (item.monto ?? 0) ? 'text-danger' : 'text-success'}`}>Real: ${item.montoReal.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-border px-4 py-2">
          <button type="button" onClick={onOpenChecklist} className="text-xs text-primary font-semibold hover:text-primary-light transition-colors">
            {totalChecklist > 4 ? `Ver todo (${totalChecklist} items)` : 'Gestionar checklist'}
          </button>
        </div>
      </div>

      {/* Movements button */}
      <button type="button" onClick={onOpenMovements} className="w-full rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-ink hover:bg-surface transition-colors flex items-center justify-center gap-1.5">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
        Ver movimientos
      </button>
    </div>
  )
}
