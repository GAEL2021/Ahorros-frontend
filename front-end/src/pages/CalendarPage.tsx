import { useState, useMemo } from 'react'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import type { Meta } from '@/types'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function parseDateStr(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
  }
  return { year: +match[1], month: +match[2] - 1, day: +match[3] }
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

export default function CalendarPage() {
  const { data: goals, isLoading } = useFetchGoals()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Group goals by deadline date (using safe date parsing)
  const goalsByDate = useMemo(() => {
    if (!goals) return new Map<string, Meta[]>()
    const map = new Map<string, Meta[]>()
    goals.forEach((g) => {
      const parsed = parseDateStr(g.fechaLimite)
      if (!parsed) return
      const key = `${parsed.year}-${parsed.month}-${parsed.day}`
      const existing = map.get(key) ?? []
      existing.push(g)
      map.set(key, existing)
    })
    return map
  }, [goals])

  // Which months have goals? For navigation dots
  const monthsWithGoals = useMemo(() => {
    if (!goals) return new Set<string>()
    const set = new Set<string>()
    goals.forEach((g) => {
      const parsed = parseDateStr(g.fechaLimite)
      if (!parsed) return
      set.add(`${parsed.year}-${parsed.month}`)
    })
    return set
  }, [goals])

  // Stats
  const activeGoals = goals?.filter((g) => g.estado === 'activo').length ?? 0
  const completedGoals = goals?.filter((g) => g.estado === 'completado').length ?? 0
  const totalSaved = goals?.reduce((sum, g) => sum + g.montoAcumulado, 0) ?? 0

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl font-semibold text-ink">Calendario de Metas</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Visualiza tus metas en el tiempo y cuándo terminan</p>
      </div>

      {/* Summary cards */}
      {!isLoading && goals && (
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in">
          <div className="rounded-lg border border-primary/10 bg-primary-subtle/50 px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-dark">Activas</span>
            <p className="mt-0.5 text-lg font-bold text-ink">{activeGoals}</p>
          </div>
          <div className="rounded-lg border border-primary/10 bg-primary-subtle/50 px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-dark">Completadas</span>
            <p className="mt-0.5 text-lg font-bold text-ink">{completedGoals}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Ahorrado</span>
            <p className="mt-0.5 text-lg font-bold text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${totalSaved.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-raised hover:text-ink transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-ink">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            type="button"
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
            className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary-subtle hover:border-primary transition-colors"
          >
            Hoy
          </button>
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-surface-raised hover:text-ink transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Month quick nav pills */}
      {goals && goals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto pb-1">
          {Array.from(monthsWithGoals)
            .sort()
            .map((key) => {
              const [y, m] = key.split('-').map(Number)
              const isCurrent = y === viewYear && m === viewMonth
              const count = goals.filter((g) => {
                const p = parseDateStr(g.fechaLimite)
                return p && p.year === y && p.month === m
              }).length
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setViewYear(y); setViewMonth(m) }}
                  className={`flex-shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                    isCurrent
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-border bg-surface text-ink-muted hover:bg-surface-raised hover:border-primary/30'
                  }`}
                >
                  {SHORT_MONTHS[m]} {y}
                  <span className="ml-1 opacity-60">{count}</span>
                </button>
              )
            })}
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-surface-raised">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-border-light bg-surface-raised/50 min-h-[90px] sm:min-h-[110px]" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = `${viewYear}-${viewMonth}-${day}`
            const dayGoals = goalsByDate.get(dateKey) ?? []
            const todayHighlight = isToday(viewYear, viewMonth, day)

            return (
              <div
                key={day}
                className={`border-b border-r border-border-light p-1.5 min-h-[90px] sm:min-h-[110px] ${
                  todayHighlight ? 'bg-accent-subtle/30 ring-1 ring-inset ring-accent/30' : ''
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                    todayHighlight
                      ? 'bg-primary text-white'
                      : 'text-ink-muted'
                  }`}
                >
                  {day}
                </span>

                {/* Goal pills */}
                <div className="mt-1 space-y-1">
                  {dayGoals.map((g) => {
                    const pct = Math.min(100, Math.round((g.montoAcumulado / g.montoObjetivo) * 100))
                    const pillColor =
                      g.estado === 'completado' ? 'bg-primary-subtle text-primary-dark border-primary/20' :
                      g.estado === 'cancelado' ? 'bg-ink/5 text-ink-muted border-border' :
                      'bg-primary-subtle text-primary-dark border-primary/20'

                    return (
                      <div
                        key={g.id}
                        className={`rounded-md border px-1.5 py-1 text-[9px] leading-tight cursor-default ${pillColor}`}
                        title={`${g.nombre} — ${pct}% — $${g.montoAcumulado.toLocaleString()} de $${g.montoObjetivo.toLocaleString()}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold truncate">{g.nombre}</span>
                          <span className="font-bold tabular-nums flex-shrink-0">{pct}%</span>
                        </div>
                        <div className="mt-0.5 h-1 w-full rounded-full bg-surface/60 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-current opacity-70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-border bg-surface py-20 animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-sm text-ink-muted">Cargando metas...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      {goals && goals.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-success" />
            Activa
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            Completada
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-stone-400" />
            Cancelada
          </div>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="h-2.5 w-2.5 rounded-full border border-accent/30 bg-accent-subtle" />
            Hoy
          </span>
        </div>
      )}
    </main>
  )
}
