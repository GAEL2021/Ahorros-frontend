import { useMemo, useState } from 'react'
import type { Meta, TimelinePace } from '@/types'

interface GoalTimelineProps { meta: Meta }

function getPaceConfig(pace: TimelinePace) {
  switch (pace) {
    case 'adelantado': return { label: 'Adelantado', badge: 'bg-success/10 text-success border-success/20', dot: 'bg-success', bar: '#2ecc71' }
    case 'retrasado': return { label: 'Retrasado', badge: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger', bar: '#e74c3c' }
    default: return { label: 'A tiempo', badge: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary', bar: '#c9a84c' }
  }
}

function calcStartDate(meta: Meta): Date {
  const ahora = new Date(meta.creadoEn)
  const limite = new Date(meta.fechaLimite)
  const inicio = new Date(limite)
  inicio.setMonth(inicio.getMonth() - meta.mesesRestantes)
  return inicio < ahora ? inicio : ahora
}

function calcPace(meta: Meta): TimelinePace {
  if (meta.montoObjetivo <= 0) return 'a_tiempo'
  const now = Date.now()
  const start = calcStartDate(meta).getTime()
  const end = new Date(meta.fechaLimite).getTime()
  if (end <= start) return 'a_tiempo'
  const totalDuration = end - start
  const elapsed = Math.max(0, now - start)
  const timeRatio = Math.min(1, elapsed / totalDuration)
  const moneyRatio = Math.min(1, meta.montoAcumulado / meta.montoObjetivo)
  const diff = moneyRatio - timeRatio
  if (diff > 0.05) return 'adelantado'
  if (diff < -0.05) return 'retrasado'
  return 'a_tiempo'
}

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 64; const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(100, pct) / 100)
  return (
    <div className="relative inline-flex">
      <svg width={150} height={150} viewBox="0 0 150 150" className="-rotate-90 w-32 h-32 sm:w-[150px] sm:h-[150px]">
        <circle cx={75} cy={75} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle cx={75} cy={75} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${color}40)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold tabular-nums text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest mt-0.5">Completado</span>
      </div>
    </div>
  )
}

export default function GoalTimeline({ meta }: GoalTimelineProps) {
  const pace = useMemo(() => calcPace(meta), [meta])
  const paceConfig = getPaceConfig(pace)
  const progressPct = Math.min(100, Math.round((meta.montoAcumulado / meta.montoObjetivo) * 100))
  const checklist = meta.checklist ?? []
  const totalReal = useMemo(() => checklist.filter((i) => i.completado && i.montoReal != null).reduce((s: number, i) => s + (i.montoReal ?? 0), 0), [checklist])
  const sobranteFinal = Math.max(0, meta.montoAcumulado - totalReal)

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; ahorrado: number; disponible: number } | null>(null)

  // Chart data calculations
  const chartPoints = useMemo(() => {
    const cuotas = meta.controlCuotas ?? []
    const items = meta.checklist ?? []

    const savingsEvents = cuotas
      .filter((c) => c.estado === 'PAGADO' || c.estado === 'PARCIAL')
      .map((c) => ({
        date: new Date(c.fechaInicio),
        monto: c.cuotaEsperada,
        tipo: 'ahorro',
      }))

    const spendingEvents = items
      .filter((item) => item.completado && item.montoReal != null)
      .map((item) => ({
        date: item.fechaReal ? new Date(item.fechaReal) : new Date(item.creadoEn),
        monto: item.montoReal ?? 0,
        tipo: 'gasto',
      }))

    const allEvents = [...savingsEvents, ...spendingEvents].sort((a, b) => a.date.getTime() - b.date.getTime())

    let currentAhorrado = 0
    let currentGastado = 0
    const points: Array<{ dateLabel: string; ahorrado: number; disponible: number }> = []

    const startD = calcStartDate(meta)
    points.push({
      dateLabel: startD.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      ahorrado: 0,
      disponible: 0,
    })

    allEvents.forEach((ev) => {
      if (ev.tipo === 'ahorro') {
        currentAhorrado += ev.monto
      } else {
        currentGastado += ev.monto
      }
      points.push({
        dateLabel: ev.date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }),
        ahorrado: currentAhorrado,
        disponible: Math.max(0, currentAhorrado - currentGastado),
      })
    })

    if (points.length === 1) {
      points.push({
        dateLabel: 'Hoy',
        ahorrado: meta.montoAcumulado,
        disponible: Math.max(0, meta.montoAcumulado - totalReal),
      })
    }

    return points
  }, [meta, totalReal])

  // SVG dimensions for Line Chart
  const lineChartPaths = useMemo(() => {
    if (chartPoints.length < 2) return { lineAhorro: '', lineDisp: '', areaAhorro: '' }
    const width = 500
    const height = 150
    const padding = 20

    const maxVal = Math.max(...chartPoints.map((p) => p.ahorrado), meta.montoObjetivo, 1000)

    const getX = (index: number) => padding + (index * (width - padding * 2)) / (chartPoints.length - 1)
    const getY = (val: number) => height - padding - (val * (height - padding * 2)) / maxVal

    let pathAhorro = `M ${getX(0)} ${getY(chartPoints[0].ahorrado)}`
    let pathDisp = `M ${getX(0)} ${getY(chartPoints[0].disponible)}`

    for (let i = 1; i < chartPoints.length; i++) {
      pathAhorro += ` L ${getX(i)} ${getY(chartPoints[i].ahorrado)}`
      pathDisp += ` L ${getX(i)} ${getY(chartPoints[i].disponible)}`
    }

    const areaAhorro = `${pathAhorro} L ${getX(chartPoints.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`

    return { lineAhorro: pathAhorro, lineDisp: pathDisp, areaAhorro }
  }, [chartPoints, meta.montoObjetivo])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">{meta.nombre}</h3>
          <p className="text-xs text-ink-muted mt-0.5">Progreso de la meta</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paceConfig.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${paceConfig.dot}`} />
          {paceConfig.label}
        </span>
      </div>

      {/* Ring + Big money */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <ProgressRing pct={progressPct} color={paceConfig.bar} />
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ${meta.montoAcumulado.toLocaleString()}
            </span>
            <span className="text-sm text-ink-muted" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              / ${meta.montoObjetivo.toLocaleString()}
            </span>
          </div>
          <div className="h-3 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full progress-gold transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }} />
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Ahorrado</span>
              <p className="mt-0.5 text-sm font-bold text-success" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${meta.montoAcumulado.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Gastado Real</span>
              <p className="mt-0.5 text-sm font-bold text-danger" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${totalReal.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Sobrante Final</span>
              <p className="mt-0.5 text-sm font-bold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${sobranteFinal.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Porcentaje Rest.</span>
              <p className="mt-0.5 text-sm font-bold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{100 - progressPct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Interactive Line Chart for Savings and Consumption (HU-05) */}
      <div className="rounded-xl bg-surface-raised border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Crecimiento vs Consumo</span>
          <div className="flex items-center gap-3 text-[9px] font-semibold">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Ahorrado</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Disponible</span>
          </div>
        </div>

        {chartPoints.length < 2 ? (
          <div className="h-[120px] flex items-center justify-center border border-dashed border-border-light rounded-lg">
            <p className="text-xs text-ink-muted">Esperando datos de aportes...</p>
          </div>
        ) : (
          <div className="relative">
            <svg viewBox="0 0 500 150" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="chartAhorroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2ecc71" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2ecc71" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                const yVal = 20 + (i * 110) / 3
                return <line key={i} x1="20" y1={yVal} x2="480" y2={yVal} stroke="var(--border-light)" strokeWidth={1} strokeDasharray="3 3" />
              })}

              {/* Area Under Savings Line */}
              <path d={lineChartPaths.areaAhorro} fill="url(#chartAhorroGrad)" />

              {/* Savings Line (Ahorrado) */}
              <path d={lineChartPaths.lineAhorro} fill="none" stroke="#2ecc71" strokeWidth={2} />

              {/* Consumption Line (Disponible) */}
              <path d={lineChartPaths.lineDisp} fill="none" stroke="var(--gold)" strokeWidth={2} strokeDasharray="4 2" />

              {/* Circles on Hover */}
              {chartPoints.map((pt, i) => {
                const width = 500
                const height = 150
                const padding = 20
                const maxVal = Math.max(...chartPoints.map((p) => p.ahorrado), meta.montoObjetivo, 1000)

                const cx = padding + (i * (width - padding * 2)) / (chartPoints.length - 1)
                const cyAhorro = height - padding - (pt.ahorrado * (height - padding * 2)) / maxVal
                const cyDisp = height - padding - (pt.disponible * (height - padding * 2)) / maxVal

                return (
                  <g key={i}>
                    <circle
                      cx={cx}
                      cy={cyAhorro}
                      r={3}
                      fill="#2ecc71"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() => setHoveredPoint({ x: cx, y: cyAhorro - 10, label: pt.dateLabel, ahorrado: pt.ahorrado, disponible: pt.disponible })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <circle
                      cx={cx}
                      cy={cyDisp}
                      r={3}
                      fill="var(--gold)"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() => setHoveredPoint({ x: cx, y: cyDisp - 10, label: pt.dateLabel, ahorrado: pt.ahorrado, disponible: pt.disponible })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                )
              })}
            </svg>

            {hoveredPoint && (
              <div
                className="absolute bg-ink text-[10px] text-surface font-semibold px-2 py-1 rounded shadow-md pointer-events-none space-y-0.5"
                style={{ left: `${(hoveredPoint.x / 500) * 100}%`, top: `${(hoveredPoint.y / 150) * 100}%`, transform: 'translate(-50%, -100%)' }}
              >
                <div className="text-ink-muted border-b border-border-light pb-0.5">{hoveredPoint.label}</div>
                <div>Ahorrado: ${hoveredPoint.ahorrado.toLocaleString()}</div>
                <div>Disponible: ${hoveredPoint.disponible.toLocaleString()}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SVG Bar Chart: Costo Estimado vs Costo Real (HU-05) */}
      {checklist.length > 0 && (
        <div className="rounded-xl bg-surface-raised border border-border p-4 space-y-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Costo Estimado vs Real</span>
          
          <div className="space-y-4">
            {checklist.slice(0, 4).map((item) => {
              const est = item.monto ?? 0
              const real = item.montoReal ?? 0
              const isCompleted = item.completado
              const maxVal = Math.max(est, real, 1)
              const estPct = (est / maxVal) * 100
              const realPct = (real / maxVal) * 100

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-ink truncate">
                    <span>{item.texto}</span>
                    <span className="text-[10px] text-ink-muted">
                      Est: ${est.toLocaleString()} {isCompleted && real > 0 && `· Real: $${real.toLocaleString()}`}
                    </span>
                  </div>
                  {/* Custom horizontal dual bars */}
                  <div className="space-y-1 bg-surface/50 p-1.5 rounded-lg border border-border-light/40">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] w-6 text-ink-muted">Est.</span>
                      <div className="flex-1 h-2 rounded-full bg-border-light overflow-hidden">
                        <div className="h-full bg-primary-light rounded-full" style={{ width: `${estPct}%` }} />
                      </div>
                    </div>
                    {isCompleted && real > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] w-6 text-ink-muted">Real</span>
                        <div className="flex-1 h-2 rounded-full bg-border-light overflow-hidden">
                          <div className={`h-full rounded-full ${real > est ? 'bg-danger' : 'bg-success'}`} style={{ width: `${realPct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {checklist.length > 4 && (
              <p className="text-[10px] text-ink-muted text-center">Mostrando los primeros 4 elementos.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
