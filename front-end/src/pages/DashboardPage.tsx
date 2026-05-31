import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { useJoinGoal } from '@/hooks/useJoinGoal'
import { useFetchBancos, useFetchTransactions } from '@/hooks/useFetchBancos'
import GoalCard from '@/components/GoalCard'
import CreateGoalModal from '@/components/CreateGoalModal'
import { sileo } from '@/lib/sileo'

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20" style={{ animation: 'float 3s ease-in-out infinite' }}>
        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink">No tienes metas aún</h3>
      <p className="mt-1.5 text-sm text-ink-muted">Crea tu primera meta colaborativa y empieza a ahorrar en grupo.</p>
      <button type="button" onClick={onCreateClick} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/30">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        Crear meta
      </button>
    </div>
  )
}

interface FilterState {
  carteraId: string
  metaId: string
  fechaInicio: string
  fechaFin: string
}

export default function DashboardPage() {
  const { data: goals, isLoading: loadingGoals, isError: errorGoals, refetch: refetchGoals } = useFetchGoals()
  const { data: carteras, isLoading: loadingBancos } = useFetchBancos()
  const { data: transactions, isLoading: loadingTrans } = useFetchTransactions()
  const joinGoal = useJoinGoal()

  const [activeTab, setActiveTab] = useState<'metas' | 'financiero'>('metas')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCodeValue, setJoinCodeValue] = useState('')

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    carteraId: '',
    metaId: '',
    fechaInicio: '',
    fechaFin: '',
  })

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: number } | null>(null)

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter((t) => {
      const matchCartera = !filters.carteraId || t.carteraId === filters.carteraId
      const matchMeta = !filters.metaId || t.metaId === filters.metaId
      const matchDateInicio = !filters.fechaInicio || new Date(t.fecha) >= new Date(filters.fechaInicio + 'T00:00:00')
      const matchDateFin = !filters.fechaFin || new Date(t.fecha) <= new Date(filters.fechaFin + 'T23:59:59')
      return matchCartera && matchMeta && matchDateInicio && matchDateFin
    })
  }, [transactions, filters])

  // Financial calculations
  const totalBalance = carteras?.reduce((sum, b) => sum + b.saldo, 0) ?? 0

  const { ingresos, egresos } = useMemo(() => {
    let ing = 0
    let egr = 0
    filteredTransactions.forEach((t) => {
      if (t.tipo === 'deposito' || t.tipo === 'aporte_meta') {
        ing += t.monto
      } else if (t.tipo === 'retiro') {
        egr += t.monto
      }
    })
    return { ingresos: ing, egresos: egr }
  }, [filteredTransactions])

  // Chronological balance history for SVG line chart
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    // Sort chronologically (oldest first)
    const sorted = [...transactions]
      .filter((t) => !filters.carteraId || t.carteraId === filters.carteraId)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    let currentBalance = 0
    const points: Array<{ date: string; balance: number }> = []

    sorted.forEach((t) => {
      if (t.tipo === 'deposito' || t.tipo === 'aporte_meta') {
        currentBalance += t.monto
      } else if (t.tipo === 'retiro') {
        currentBalance -= t.monto
      }
      points.push({
        date: new Date(t.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
        balance: currentBalance,
      })
    })

    // If no points, show flat line with current balance
    if (points.length === 0 && carteras) {
      const selected = carteras.find((c) => c.id === filters.carteraId)
      const balance = selected ? selected.saldo : totalBalance
      points.push({ date: 'Hoy', balance })
    }

    return points
  }, [transactions, carteras, filters.carteraId, totalBalance])

  // SVG drawing logic
  const svgPathData = useMemo(() => {
    if (chartData.length < 2) return { line: '', area: '' }
    const width = 600
    const height = 200
    const padding = 25

    const minVal = 0
    const maxVal = Math.max(...chartData.map((d) => d.balance), 1000)

    const getX = (index: number) => padding + (index * (width - padding * 2)) / (chartData.length - 1)
    const getY = (value: number) => height - padding - ((value - minVal) * (height - padding * 2)) / (maxVal - minVal)

    let linePath = `M ${getX(0)} ${getY(chartData[0].balance)}`
    for (let i = 1; i < chartData.length; i++) {
      linePath += ` L ${getX(i)} ${getY(chartData[i].balance)}`
    }

    const areaPath = `${linePath} L ${getX(chartData.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`

    return { line: linePath, area: areaPath }
  }, [chartData])

  const isLoading = loadingGoals || loadingBancos || loadingTrans

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Header and tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Dashboard General</h1>
          <div className="mt-2 flex rounded-lg border border-border bg-surface-raised p-0.5 w-fit">
            <button
              onClick={() => setActiveTab('metas')}
              className={`rounded-md px-3.5 py-1 text-xs font-semibold transition-colors ${
                activeTab === 'metas' ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              🎯 Mis Metas
            </button>
            <button
              onClick={() => setActiveTab('financiero')}
              className={`rounded-md px-3.5 py-1 text-xs font-semibold transition-colors ${
                activeTab === 'financiero' ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              📊 Salud Financiera
            </button>
          </div>
        </div>

        {activeTab === 'metas' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[#0a0e14] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva meta
          </button>
        )}
      </div>

      {activeTab === 'metas' ? (
        <>
          {/* Join code bar */}
          <div className="mb-6 animate-fade-in">
            {!showJoinCode ? (
              <button
                type="button"
                onClick={() => setShowJoinCode(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/20 px-4 py-2.5 text-sm font-medium text-ink-muted transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Unirse con código
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
                  <svg className="h-4 w-4 flex-shrink-0 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <input
                    type="text"
                    value={joinCodeValue}
                    onChange={(e) => setJoinCodeValue(e.target.value.toUpperCase())}
                    placeholder="Código de 8 caracteres"
                    maxLength={8}
                    className="flex-1 bg-transparent text-sm tracking-[0.2em] text-ink placeholder:text-ink-muted focus:outline-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinCode(false)
                      setJoinCodeValue('')
                      joinGoal.reset()
                    }}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={joinCodeValue.length !== 8 || joinGoal.isPending}
                    onClick={() =>
                      joinGoal.mutate(joinCodeValue, {
                        onSuccess: (data) => {
                          setShowJoinCode(false)
                          setJoinCodeValue('')
                          sileo.success(`Te uniste a "${data.nombre}"`)
                        },
                        onError: () => sileo.error('Error al unirse a la meta'),
                      })
                    }
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-[#0a0e14] hover:bg-primary-light disabled:opacity-50 transition-colors"
                  >
                    {joinGoal.isPending ? 'Uniéndote...' : 'Unirse'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-36" />
                      <div className="skeleton h-3 w-20" />
                    </div>
                  </div>
                  <div className="skeleton h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          )}

          {errorGoals && (
            <div className="glass rounded-2xl px-6 py-12 text-center animate-fade-in">
              <p className="text-sm text-danger">Error al cargar las metas</p>
              <button type="button" onClick={() => refetchGoals()} className="mt-3 text-xs font-semibold text-primary hover:underline">
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !errorGoals && goals && goals.length === 0 && (
            <EmptyState onCreateClick={() => setShowCreateModal(true)} />
          )}

          {!isLoading && !errorGoals && goals && goals.length > 0 && (
            <div className="space-y-3 stagger">
              {goals.map((goal) => (
                <GoalCard key={goal.id} meta={goal} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Dashboard Summary Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface px-5 py-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Saldo Consolidado</span>
              <p className="text-2xl font-bold text-ink mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${totalBalance.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface px-5 py-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-success uppercase tracking-wider">Total Ingresos</span>
              <p className="text-2xl font-bold text-success mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                +${ingresos.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface px-5 py-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Total Egresos</span>
              <p className="text-2xl font-bold text-accent mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                -${egresos.toLocaleString()}
              </p>
            </div>
          </div>

          {/* SVG Line Chart (Financial Behavior) */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Comportamiento del Saldo</h3>
              <span className="text-xs text-ink-muted">Ahorro acumulado cronológicamente</span>
            </div>

            {chartData.length < 2 ? (
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-border-light rounded-xl">
                <p className="text-xs text-ink-muted">No hay suficientes transacciones para graficar.</p>
              </div>
            ) : (
              <div className="relative">
                <svg viewBox="0 0 600 200" className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {Array.from({ length: 4 }).map((_, i) => {
                    const yVal = 25 + (i * 150) / 3
                    return <line key={i} x1="25" y1={yVal} x2="575" y2={yVal} stroke="var(--border-light)" strokeWidth={1} strokeDasharray="3 3" />
                  })}

                  {/* Gradient Area Fill */}
                  <path d={svgPathData.area} fill="url(#areaGrad)" className="transition-all duration-300" />

                  {/* Stroke Line */}
                  <path d={svgPathData.line} fill="none" stroke="var(--gold)" strokeWidth={2.5} className="transition-all duration-300" />

                  {/* Interactive Points */}
                  {chartData.map((d, i) => {
                    const width = 600
                    const height = 200
                    const padding = 25
                    const minVal = 0
                    const maxVal = Math.max(...chartData.map((pt) => pt.balance), 1000)

                    const cx = padding + (i * (width - padding * 2)) / (chartData.length - 1)
                    const cy = height - padding - ((d.balance - minVal) * (height - padding * 2)) / (maxVal - minVal)

                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="var(--bg-surface)"
                        stroke="var(--gold)"
                        strokeWidth={2}
                        className="cursor-pointer hover:r-6 transition-all"
                        onMouseEnter={() => setHoveredPoint({ x: cx, y: cy - 10, label: d.date, value: d.balance })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    )
                  })}
                </svg>

                {/* SVG Tooltip */}
                {hoveredPoint && (
                  <div
                    className="absolute bg-ink text-[10px] text-surface font-semibold px-2 py-1 rounded shadow-md pointer-events-none"
                    style={{ left: `${(hoveredPoint.x / 600) * 100}%`, top: `${(hoveredPoint.y / 200) * 100}%`, transform: 'translate(-50%, -100%)' }}
                  >
                    <div>{hoveredPoint.label}</div>
                    <div>${hoveredPoint.value.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Filters Bar */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <h3 className="text-sm font-semibold text-ink">Filtros de Búsqueda</h3>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-muted uppercase">Cartera / Banco</label>
                <select
                  value={filters.carteraId}
                  onChange={(e) => setFilters({ ...filters, carteraId: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="">Todas las carteras</option>
                  {carteras?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-muted uppercase">Meta de ahorro</label>
                <select
                  value={filters.metaId}
                  onChange={(e) => setFilters({ ...filters, metaId: e.target.value })}
                  className="w-full text-xs"
                >
                  <option value="">Todas las metas</option>
                  {goals?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-muted uppercase">Fecha Inicio</label>
                <input
                  type="date"
                  value={filters.fechaInicio}
                  onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-muted uppercase">Fecha Fin</label>
                <input
                  type="date"
                  value={filters.fechaFin}
                  onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  className="w-full text-xs"
                />
              </div>
            </div>
            {(filters.carteraId || filters.metaId || filters.fechaInicio || filters.fechaFin) && (
              <button
                onClick={() =>
                  setFilters({
                    carteraId: '',
                    metaId: '',
                    fechaInicio: '',
                    fechaFin: '',
                  })
                }
                className="text-xs text-primary font-semibold hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Historial de transacciones (trazabilidad) */}
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-surface-raised px-4 py-3">
              <h3 className="text-sm font-semibold text-ink">Historial de Movimientos</h3>
            </div>
            {filteredTransactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-ink-muted">No se encontraron movimientos.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-ink">
                  <thead className="bg-surface-raised/50 font-semibold text-ink-muted uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">Cartera</th>
                      <th className="px-4 py-2.5">Descripción</th>
                      <th className="px-4 py-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {filteredTransactions.map((t) => {
                      const isIncome = t.tipo === 'deposito' || t.tipo === 'aporte_meta'
                      return (
                        <tr key={t.id} className="hover:bg-surface-raised/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                            {new Date(t.fecha).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.bancoColor }} />
                              {t.bancoNombre}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-ink-secondary">{t.descripcion}</td>
                          <td className={`px-4 py-3 text-right font-bold font-mono ${isIncome ? 'text-success' : 'text-danger'}`}>
                            {isIncome ? '+' : '-'}${t.monto.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {createPortal(<CreateGoalModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />, document.body)}
    </main>
  )
}
