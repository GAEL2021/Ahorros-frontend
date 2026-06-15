import { useState, useRef, useCallback } from 'react'
import type { Gasto, Presupuesto } from '@/types'
import { MESES, DIAS_SEMANA, fmt } from '@/lib/formatters'

interface CalendarBudgetProps {
  presupuestos: Presupuesto[]
  currentMonth: number
  currentYear: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDayClick: (day: number) => void
  onGastoClick: (gasto: Gasto, presupuestoId: string) => void
  onGastoDrop: (gastoId: string, fromPresupuestoId: string, newDay: number) => void
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date()
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day
}

export default function CalendarBudget({
  presupuestos, currentMonth, currentYear,
  onPrevMonth, onNextMonth, onToday,
  onDayClick, onGastoClick, onGastoDrop,
}: CalendarBudgetProps) {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const dragRef = useRef<{ gastoId: string; presupuestoId: string } | null>(null)
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)

  function gastoFecha(g: Gasto, p: Presupuesto): { year: number; month: number; day: number } | null {
    if (g.fecha) {
      const parts = g.fecha.split('-').map(Number)
      if (parts.length === 3) return { year: parts[0], month: parts[1] - 1, day: parts[2] }
    }
    if (g.fechaPago) {
      const parts = g.fechaPago.split('-').map(Number)
      const day = parts.length === 3 ? parts[2] : 1
      return { year: currentYear, month: currentMonth, day }
    }
    if (p.mes && p.year) return { year: p.year, month: p.mes - 1, day: 1 }
    return null
  }

  const gastosByDay = new Map<number, { gasto: Gasto; presupuestoId: string }[]>()
  presupuestos.forEach((p) => {
    ;(p.gastos ?? []).forEach((g) => {
      const parsed = gastoFecha(g, p)
      if (!parsed) return
      if (parsed.month !== currentMonth || parsed.year !== currentYear) return
      const day = parsed.day
      const list = gastosByDay.get(day) ?? []
      list.push({ gasto: g, presupuestoId: p.id })
      gastosByDay.set(day, list)
    })
  })

  const totalIngresos = presupuestos.reduce((s, p) => {
    const ing = p.tipo === 'mensual'
      ? (p.sobranteAnterior || 0) + (p.salarioMensual || 0) + (p.efectivoExtra || 0)
      : (p.sobranteAnterior || 0) + (p.salarioQ1 || 0) + (p.salarioQ2 || 0) + (p.efectivoExtra || 0)
    return s + ing
  }, 0)
  const totalGastos = presupuestos.reduce((s, p) => s + (p.gastos ?? []).reduce((ss, g) => ss + g.monto, 0), 0)

  const handleDragStart = useCallback((gastoId: string, presupuestoId: string) => {
    dragRef.current = { gastoId, presupuestoId }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, day: number) => {
    e.preventDefault()
    setDragOverDay(day)
  }, [])

  const handleDrop = useCallback((day: number) => {
    setDragOverDay(null)
    if (dragRef.current) {
      onGastoDrop(dragRef.current.gastoId, dragRef.current.presupuestoId, day)
      dragRef.current = null
    }
  }, [onGastoDrop])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onPrevMonth} className="rounded-lg border border-border px-3 py-2 text-sm text-ink-secondary hover:bg-surface-raised transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-ink">{MESES[currentMonth]} {currentYear}</h2>
          <button type="button" onClick={onToday} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-subtle transition-colors">Hoy</button>
        </div>
        <button type="button" onClick={onNextMonth} className="rounded-lg border border-border px-3 py-2 text-sm text-ink-secondary hover:bg-surface-raised transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-surface-raised">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-1 py-2 text-center text-xs font-semibold uppercase tracking-wider text-ink-muted">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-border-light bg-surface-raised/50 min-h-[90px] sm:min-h-[110px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const gastos = gastosByDay.get(day) ?? []
            const today = isToday(currentYear, currentMonth, day)
            return (
              <div
                key={day}
                className={`border-b border-r border-border-light p-1 min-h-[90px] sm:min-h-[110px] relative group cursor-pointer transition-colors ${
                  today ? 'bg-accent-subtle/30 ring-1 ring-inset ring-accent/30' : ''
                } ${dragOverDay === day ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}
                onClick={() => onDayClick(day)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={() => setDragOverDay(null)}
                onDrop={() => handleDrop(day)}
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                  today ? 'bg-primary text-white' : 'text-ink-muted'
                }`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {gastos.slice(0, 3).map(({ gasto, presupuestoId }) => (
                    <div
                      key={gasto.id}
                      draggable
                      onDragStart={() => handleDragStart(gasto.id, presupuestoId)}
                      onClick={(e) => { e.stopPropagation(); onGastoClick(gasto, presupuestoId) }}
                      className={`rounded px-1 py-0.5 text-[10px] leading-tight cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity flex items-center gap-1 ${
                        gasto.estaConciliado || gasto.montoFinal ? 'opacity-60 line-through' : ''
                      } ${
                        gasto.categoria === 'fijos' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
                        gasto.categoria === 'ocio' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                      }`}
                      title={gasto.descripcion}
                    >
                      <span className="truncate flex-1">{gasto.descripcion}</span>
                      <span className="font-semibold tabular-nums flex-shrink-0">${gasto.monto.toLocaleString()}</span>
                      {gasto.esRecurrente && <span className="flex-shrink-0">🔄</span>}
                      {gasto.cuotasOriginales > 0 && <span className="flex-shrink-0 text-[8px] opacity-70">{gasto.cuotasRestantes}/{gasto.cuotasOriginales}</span>}
                    </div>
                  ))}
                  {gastos.length > 3 && (
                    <div className="text-[9px] text-ink-muted font-medium px-1">+{gastos.length - 3} más</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted px-1">
        <div className="flex items-center gap-4">
          <span>YTD: <strong className="text-ink">{fmt(totalIngresos)}</strong></span>
          <span>Gastos: <strong className="text-danger">{fmt(totalGastos)}</strong></span>
          <span>Balance: <strong className={totalIngresos - totalGastos >= 0 ? 'text-success' : 'text-danger'}>{fmt(totalIngresos - totalGastos)}</strong></span>
        </div>
      </div>
    </div>
  )
}
