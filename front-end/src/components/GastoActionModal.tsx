import { useState } from 'react'
import type { Gasto } from '@/types'
import { fmt } from '@/lib/formatters'

interface GastoActionModalProps {
  open: boolean
  gasto: Gasto
  presupuestoId: string
  tipo: 'mensual' | 'quincenal'
  onEdit: () => void
  onPay: (data: { montoReal: number }) => void
  onClose: () => void
}

export default function GastoActionModal({ open, gasto, tipo, onEdit, onPay, onClose }: GastoActionModalProps) {
  const [montoReal, setMontoReal] = useState(gasto.montoFinal || gasto.monto)
  const yaPagado = gasto.estaConciliado || !!gasto.montoFinal

  const hoy = new Date().getDate()
  const quincenaActual = hoy <= 15 ? 'Q2' : 'Q1'
  const esQuincenal = tipo === 'quincenal'
  const puedeLiquidar = !esQuincenal || !gasto.quincena || gasto.quincena === quincenaActual

  if (!open) return null

  const handleLiquidar = () => {
    onPay({ montoReal: Number(montoReal) || gasto.monto })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1a2e] rounded-3xl shadow-2xl border border-border/60 overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between mb-5">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink leading-tight truncate">{gasto.descripcion}</h3>
              <div className="flex items-center gap-2.5 mt-2">
                <span className="text-2xl font-bold text-ink tracking-tight">{fmt(gasto.monto)}</span>
                {yaPagado ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Pagado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200/50 dark:border-amber-700/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pendiente
                  </span>
                )}
              </div>
              {esQuincenal && gasto.quincena && (
                <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-semibold ${gasto.quincena === 'Q1' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {gasto.quincena === 'Q1' ? '📆' : '📆'} {gasto.quincena}
                </span>
              )}
            </div>
            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors -mr-1 -mt-1">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {yaPagado && (
            <div className="space-y-3 mb-4">
              <div className="rounded-xl bg-success/5 border border-success/10 divide-y divide-success/10">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-ink-muted">Presupuestado</span>
                  <span className="text-sm font-semibold text-ink">{fmt(gasto.monto)}</span>
                </div>
                {gasto.montoFinal && gasto.montoFinal !== gasto.monto && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-ink-muted">Real</span>
                    <span className="text-sm font-semibold text-ink">{fmt(gasto.montoFinal)}</span>
                  </div>
                )}
                {gasto.montoFinal && gasto.monto !== gasto.montoFinal && (
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-ink-muted">Diferencia</span>
                    <span className={`text-sm font-semibold ${gasto.montoFinal < gasto.monto ? 'text-success' : 'text-danger'}`}>
                      {gasto.montoFinal < gasto.monto ? 'Sobrante +' : 'Excedente -'}{fmt(Math.abs(gasto.monto - gasto.montoFinal))}
                    </span>
                  </div>
                )}
              </div>
              {gasto.esRecurrente && (
                <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                  <span>🔄</span>
                  <span>{gasto.recurrenciaTipo === 'quincenal' ? 'Quincenal' : 'Mensual'}{gasto.cuotasOriginales > 0 ? ` · ${gasto.cuotasRestantes}/${gasto.cuotasOriginales} cuotas` : ' · Recurrente'}</span>
                </div>
              )}
            </div>
          )}

          {!yaPagado && (
            <div className="space-y-4">
              {!puedeLiquidar && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">⏰ {gasto.quincena} ya cerró</p>
                  <p className="text-[11px] text-ink-muted mt-1">Estás en {quincenaActual}. Los gastos de {gasto.quincena} ya no se pueden liquidar, solo registrarlos para llevar el control.</p>
                </div>
              )}

              {puedeLiquidar && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-muted tracking-wide uppercase">💰 ¿Cuánto gastaste realmente?</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <span className="text-sm font-medium text-ink-muted/60">$</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={montoReal || ''}
                        onChange={(e) => setMontoReal(Number(e.target.value))}
                        placeholder={String(gasto.monto)}
                        className="w-full pl-8 pr-4 py-3 text-sm font-mono font-semibold text-ink bg-surface border border-border rounded-xl placeholder:text-ink-muted/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                    </div>
                    {Number(montoReal) !== gasto.monto && Number(montoReal) > 0 && (
                      <p className="text-[11px] text-ink-muted/70">
                        {Number(montoReal) > gasto.monto ? '⚠️ Gastaste más de lo presupuestado' : '💡 Gastaste menos de lo presupuestado'}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleLiquidar}
                    className="w-full py-3 px-4 rounded-xl bg-success text-sm font-semibold text-white shadow-lg shadow-success/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Marcar como pagado
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-3">
            <button
              type="button"
              onClick={onEdit}
              className="w-full py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface transition-all flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Editar gasto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
