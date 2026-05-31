import { useState, useMemo } from 'react'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { useFetchBancos, useFetchTransactions } from '@/hooks/useFetchBancos'

interface FilterState {
  carteraId: string
  metaId: string
  fechaInicio: string
  fechaFin: string
}

export default function DashboardPage() {
  const { data: goals, isLoading: loadingGoals, isError: errorGoals } = useFetchGoals()
  const { data: carteras, isLoading: loadingBancos } = useFetchBancos()
  const { data: transactions, isLoading: loadingTrans } = useFetchTransactions()

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
      } else {
        egr += t.monto
      }
    })
    return { ingresos: ing, egresos: egr }
  }, [filteredTransactions])

  // Chart coordinate mappings
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []
    
    // Sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    
    let currentBalance = 0
    return sorted.map((t) => {
      const isIncome = t.tipo === 'deposito' || t.tipo === 'aporte_meta'
      currentBalance += isIncome ? t.monto : -t.monto
      return {
        date: new Date(t.fecha).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
        balance: currentBalance
      }
    })
  }, [transactions])

  const svgPathData = useMemo(() => {
    if (chartData.length < 2) return { line: '', area: '' }

    const width = 600
    const height = 200
    const padding = 25
    const minVal = 0
    const maxVal = Math.max(...chartData.map((pt) => pt.balance), 1000)

    const getX = (index: number) => padding + (index * (width - padding * 2)) / (chartData.length - 1)
    const getY = (val: number) => height - padding - ((val - minVal) * (height - padding * 2)) / (maxVal - minVal)

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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Estadísticas y salud financiera general</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : errorGoals ? (
        <div className="glass rounded-2xl px-6 py-12 text-center animate-fade-in">
          <p className="text-sm text-danger">Error al cargar estadísticas</p>
        </div>
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
              <div>
                {/* Mobile Viewports: Bento-like compact cards */}
                <div className="block sm:hidden divide-y divide-border-light">
                  {filteredTransactions.map((t) => {
                    const isIncome = t.tipo === 'deposito' || t.tipo === 'aporte_meta'
                    return (
                      <div key={t.id} className="p-4 space-y-2 hover:bg-surface-raised/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-ink-muted">
                            {new Date(t.fecha).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          <span className={`text-xs font-bold font-mono ${isIncome ? 'text-success' : 'text-danger'}`}>
                            {isIncome ? '+' : '-'}${t.monto.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-ink font-medium truncate flex-1">{t.descripcion}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-border">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.bancoColor }} />
                            {t.bancoNombre}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Tablet & Desktop Viewports: Standard Structured Table */}
                <div className="hidden sm:block overflow-x-auto">
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
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
