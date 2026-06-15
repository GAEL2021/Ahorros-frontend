import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const stagger = {
  animate: { transition: { staggerChildren: 0.015 } },
}

const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const cellVariants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
}

const pillVariants = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2 } },
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

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

  const handleDayClick = (day: number) => {
    if (bloqueado) return
    setSelectedDay(day === selectedDay ? null : day)
  }

  const handlePrev = () => {
    onPrevMonth()
    setSelectedDay(null)
  }

  const handleNext = () => {
    onNextMonth()
    setSelectedDay(null)
  }

  const gastosDelDia = selectedDay ? gastosByDay.get(selectedDay) ?? [] : []
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyCells = Array.from({ length: firstDay }, (_, i) => i)

  const mesAnterior = presupuestos.find((p: any) => p.mes === currentMonth)
  const mesAnteriorCerrado = currentMonth === 0 ? true : mesAnterior?.cerrado === true
  const bloqueado = !mesAnteriorCerrado && currentMonth > 0

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          type="button" onClick={handlePrev}
          className="rounded-lg border border-border px-2.5 py-2 text-sm text-ink-secondary hover:bg-surface-raised transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </motion.button>
        <div className="flex items-center gap-2">
          <motion.h2
            key={`${currentYear}-${currentMonth}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-base md:text-lg font-semibold text-ink"
          >
            {MESES[currentMonth]} {currentYear}
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            type="button" onClick={onToday}
            className="rounded-full border border-border px-2.5 py-0.5 text-[10px] md:text-xs font-semibold text-primary hover:bg-primary-subtle transition-colors"
          >
            Hoy
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          type="button" onClick={handleNext}
          className="rounded-lg border border-border px-2.5 py-2 text-sm text-ink-secondary hover:bg-surface-raised transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </motion.button>
      </div>

      <motion.div
        className="rounded-xl border border-border bg-surface overflow-hidden"
        key={`grid-${currentYear}-${currentMonth}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-7 border-b border-border bg-surface-raised">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-0.5 py-1.5 md:py-2 text-center text-[10px] md:text-xs font-semibold uppercase tracking-wider text-ink-muted">{d}</div>
          ))}
        </div>
        <motion.div className="grid grid-cols-7" variants={stagger} initial="initial" animate="animate">
          {emptyCells.map((i) => (
            <div key={`empty-${i}`} className="border-b border-r border-border-light bg-surface-raised/50 min-h-[48px] md:min-h-[90px]" />
          ))}
          {daysArray.map((day) => {
            const gastos = gastosByDay.get(day) ?? []
            const today = isToday(currentYear, currentMonth, day)
            const selected = selectedDay === day
            return (
              <motion.div
                key={day}
                variants={cellVariants}
                layout
                className={`border-b border-r border-border-light p-0.5 md:p-1 min-h-[48px] md:min-h-[90px] relative group cursor-pointer transition-colors ${
                  today ? 'bg-accent-subtle/30 ring-1 ring-inset ring-accent/30' : ''
                } ${dragOverDay === day ? 'bg-primary/10 ring-2 ring-primary/30' : ''} ${
                  selected ? 'ring-2 ring-primary/40 bg-primary/5' : ''
                }`}
                onClick={() => handleDayClick(day)}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={() => setDragOverDay(null)}
                onDrop={() => handleDrop(day)}
                transition={{ duration: 0.15 }}
              >
                <motion.span
                  className={`inline-flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full text-[11px] md:text-xs font-semibold ${
                    today ? 'bg-primary text-white' : 'text-ink-muted'
                  }`}
                  whileHover={today ? { scale: 1.1 } : {}}
                >
                  {day}
                </motion.span>

                <div className="hidden md:block mt-1 space-y-0.5">
                  <AnimatePresence>
                    {gastos.slice(0, 3).map(({ gasto, presupuestoId }) => (
                      <motion.div
                        key={gasto.id}
                        variants={pillVariants}
                        initial="initial"
                        animate="animate"
                        exit={{ opacity: 0, x: -6, transition: { duration: 0.12 } }}
                        layout
                        draggable
                        onDragStart={() => { if (!bloqueado) handleDragStart(gasto.id, presupuestoId) }}
                        onClick={(e) => { e.stopPropagation(); if (!bloqueado) onGastoClick(gasto, presupuestoId) }}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.96 }}
                        className={`rounded px-1 py-0.5 text-[10px] leading-tight cursor-grab active:cursor-grabbing transition-all flex items-center gap-1 ${
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {gastos.length > 3 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[9px] text-ink-muted font-medium px-1"
                    >
                      +{gastos.length - 3} más
                    </motion.div>
                  )}
                </div>

                <div className="md:hidden flex flex-wrap gap-0.5 mt-0.5">
                  {gastos.length > 0 && gastos.slice(0, 4).map(({ gasto }) => (
                    <motion.span
                      key={gasto.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        gasto.estaConciliado || gasto.montoFinal
                          ? 'bg-success/40'
                          : gasto.categoria === 'fijos' ? 'bg-amber-400' : gasto.categoria === 'ocio' ? 'bg-orange-400' : 'bg-green-400'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      {bloqueado && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 flex items-center gap-2"
        >
          <span className="text-sm">🔒</span>
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            Cerrajá {MESES[currentMonth - 1]} primero para gestionar {MESES[currentMonth]}
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            key={`detail-${selectedDay}`}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 rounded-xl border border-border bg-surface overflow-hidden"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">{selectedDay} de {MESES[currentMonth]}</p>
                <motion.span
                  key={gastosDelDia.length}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-xs text-ink-muted"
                >
                  {gastosDelDia.length} gastos
                </motion.span>
              </div>
              {gastosDelDia.length > 0 ? (
                <motion.div className="space-y-1.5 mb-3" variants={stagger} initial="initial" animate="animate">
                  {gastosDelDia.map(({ gasto, presupuestoId }) => {
                    const pagado = gasto.estaConciliado || !!gasto.montoFinal
                    const difiere = pagado && gasto.montoFinal && gasto.montoFinal !== gasto.monto
                    return (
                      <motion.div
                        key={gasto.id}
                        variants={fadeSlide}
                        layout
                        onClick={() => onGastoClick(gasto, presupuestoId)}
                        whileHover={{ scale: 1.005, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          pagado ? 'opacity-70' : ''
                        } ${
                          gasto.categoria === 'fijos' ? 'bg-amber-50 dark:bg-amber-900/10' :
                          gasto.categoria === 'ocio' ? 'bg-orange-50 dark:bg-orange-900/10' : 'bg-green-50 dark:bg-green-900/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <motion.span
                              animate={{ backgroundColor: pagado ? 'rgb(34,197,94)' : undefined }}
                              className={`h-2 w-2 rounded-full flex-shrink-0 ${
                                pagado ? 'bg-success' :
                                gasto.categoria === 'fijos' ? 'bg-amber-400' : gasto.categoria === 'ocio' ? 'bg-orange-400' : 'bg-green-400'
                              }`}
                            />
                            <span className="text-xs font-medium text-ink truncate">{gasto.descripcion}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {pagado ? (
                              <motion.span
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[10px] font-semibold text-success"
                              >
                                Pagado
                              </motion.span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Pendiente</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1 ml-4">
                          <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                            <span className="font-semibold tabular-nums text-ink text-xs">${gasto.monto.toLocaleString()}</span>
                            {difiere && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="line-through opacity-50"
                              >
                                ${gasto.montoFinal!.toLocaleString()}
                              </motion.span>
                            )}
                            {gasto.esRecurrente && <span>· 🔄</span>}
                            {gasto.cuotasOriginales > 0 && <span>· {gasto.cuotasRestantes}/{gasto.cuotasOriginales}</span>}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-ink-muted text-center py-2"
                >
                  Sin gastos este día
                </motion.p>
              )}
              {!bloqueado && (
                <motion.button
                  whileHover={{ scale: 1.01, borderColor: 'var(--primary)' }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => onDayClick(selectedDay)}
                  className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-ink-muted hover:text-primary hover:border-primary/40 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Agregar gasto
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="mt-3 flex items-center justify-between text-xs text-ink-muted px-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[11px] md:text-xs">YTD: <strong className="text-ink">{fmt(totalIngresos)}</strong></span>
          <span className="text-[11px] md:text-xs">Gastos: <strong className="text-danger">{fmt(totalGastos)}</strong></span>
          <span className="text-[11px] md:text-xs">Balance: <strong className={totalIngresos - totalGastos >= 0 ? 'text-success' : 'text-danger'}>{fmt(totalIngresos - totalGastos)}</strong></span>
        </div>
      </motion.div>
    </div>
  )
}

