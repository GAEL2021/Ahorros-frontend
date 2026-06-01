import { useMemo, useState } from 'react'
import type { Meta, TimelinePace } from '@/types'
import { motion } from 'framer-motion'

interface GoalTimelineProps { meta: Meta }

function getPaceConfig(pace: TimelinePace) {
  switch (pace) {
    case 'adelantado': return { label: 'Adelantado', badge: 'bg-green-500/10 text-green-500 border-green-500/20', dot: 'bg-green-500', bar: '#10B981' }
    case 'retrasado': return { label: 'Retrasado', badge: 'bg-red-500/10 text-red-500 border-red-500/20', dot: 'bg-red-500', bar: '#EF4444' }
    default: return { label: 'A tiempo', badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', dot: 'bg-yellow-500', bar: '#FFC700' }
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

function ProgressRing({
  pct,
  checklistPct,
  sobranteFinal,
  montoAcumulado,
}: {
  pct: number
  checklistPct: number
  sobranteFinal: number
  montoAcumulado: number
}) {
  const remanentePct = montoAcumulado > 0 ? Math.min(100, Math.round((sobranteFinal / montoAcumulado) * 100)) : 0

  const sw = 8
  const r1 = 96
  const r2 = 81
  const r3 = 66

  const circ1 = 2 * Math.PI * r1
  const offset1 = circ1 * (1 - Math.min(100, pct) / 100)

  const circ2 = 2 * Math.PI * r2
  const offset2 = circ2 * (1 - Math.min(100, checklistPct) / 100)

  const circ3 = 2 * Math.PI * r3
  const offset3 = circ3 * (1 - Math.min(100, remanentePct) / 100)

  return (
    <div className="relative inline-flex select-none">
      <svg width={240} height={240} viewBox="0 0 240 240" className="-rotate-90 w-48 h-48 sm:w-[240px] sm:h-[240px] overflow-visible">
        <defs>
          <linearGradient id="abonoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="gastadoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#FF9F43" />
          </linearGradient>
          <linearGradient id="remanenteRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC700" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <filter id="glowOuter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ring 1 - Ahorrado Total (Green) */}
        <circle cx={120} cy={120} r={r1} fill="none" stroke="var(--border)" strokeWidth={sw} className="opacity-15 dark:opacity-10" />
        <circle cx={120} cy={120} r={r1} fill="none" stroke="url(#abonoRingGrad)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={circ1} strokeDashoffset={offset1}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: 'url(#glowOuter)' }} />

        {/* Ring 2 - Gastado (Pink) */}
        <circle cx={120} cy={120} r={r2} fill="none" stroke="var(--border)" strokeWidth={sw} className="opacity-15 dark:opacity-10" />
        <circle cx={120} cy={120} r={r2} fill="none" stroke={checklistPct > 0 ? 'url(#gastadoRingGrad)' : 'transparent'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={circ2} strokeDashoffset={checklistPct > 0 ? offset2 : circ2}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />

        {/* Ring 3 - Disponible (Yellow) */}
        <circle cx={120} cy={120} r={r3} fill="none" stroke="var(--border)" strokeWidth={sw} className="opacity-15 dark:opacity-10" />
        <circle cx={120} cy={120} r={r3} fill="none" stroke={remanentePct > 0 ? 'url(#remanenteRingGrad)' : 'transparent'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={circ3} strokeDashoffset={remanentePct > 0 ? offset3 : circ3}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
      </svg>
      
      {/* Center Values */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-xl sm:text-2xl font-black tabular-nums text-zinc-950 dark:text-white leading-none tracking-tight" 
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          ${montoAcumulado.toLocaleString()}
        </motion.span>
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Ahorrado Total</span>
        <div className="mt-2.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 px-2.5 py-0.5 text-[8px] font-extrabold text-[#10B981] dark:text-[#6EE7B7] tabular-nums tracking-wide shadow-sm shadow-[#10B981]/5">
          {pct}% de Meta
        </div>
      </div>
    </div>
  )
}

export default function GoalTimeline({ meta }: GoalTimelineProps) {
  const pace = useMemo(() => calcPace(meta), [meta])
  const paceConfig = getPaceConfig(pace)
  const progressPct = Math.min(100, Math.round((meta.montoAcumulado / meta.montoObjetivo) * 100))
  const checklist = meta.checklist ?? []
  
  const totalReal = useMemo(() => checklist.filter((i) => i.completado).reduce((s: number, i) => s + (i.montoReal ?? i.monto ?? 0), 0), [checklist])
  const totalSpent = useMemo(() => checklist.filter((i) => i.completado).reduce((s: number, i) => s + (i.montoReal ?? i.monto ?? 0), 0), [checklist])
  
  const checklistPct = useMemo(() => {
    if (meta.montoAcumulado <= 0) return 0
    return Math.min(100, Math.round((totalSpent / meta.montoAcumulado) * 100))
  }, [totalSpent, meta.montoAcumulado])

  const sobranteFinal = Math.max(0, meta.montoAcumulado - totalReal)

  // Sobregiro (Budget Overrun) calculations
  const { totalEstCompletados, totalRealCompletados, sobregiroChecklist, errorFondosInsuficientes, deficitFondos } = useMemo(() => {
    const completedItems = checklist.filter((i) => i.completado)
    const est = completedItems.reduce((s, i) => s + (i.monto ?? 0), 0)
    const real = completedItems.reduce((s, i) => s + (i.montoReal ?? i.monto ?? 0), 0)
    const sobregiroVal = real > est ? real - est : 0
    const deficitVal = totalReal > meta.montoAcumulado ? totalReal - meta.montoAcumulado : 0
    
    return {
      totalEstCompletados: est,
      totalRealCompletados: real,
      sobregiroChecklist: sobregiroVal,
      errorFondosInsuficientes: totalReal > meta.montoAcumulado,
      deficitFondos: deficitVal
    }
  }, [checklist, meta.montoAcumulado, totalReal])

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; ahorrado: number; disponible: number } | null>(null)

  // Chart data calculations
  const chartPoints = useMemo(() => {
    const cuotas = meta.controlCuotas ?? []
    const items = meta.checklist ?? []

    const savingsEvents = cuotas
      .filter((c) => c.estado === 'PAGADO')
      .map((c) => ({
        date: new Date(c.fechaInicio),
        monto: c.cuotaEsperada,
        tipo: 'ahorro',
      }))

    const spendingEvents = items
      .filter((item) => item.completado)
      .map((item) => ({
        date: item.fechaReal ? new Date(item.fechaReal) : new Date(item.creadoEn),
        monto: item.montoReal ?? item.monto ?? 0,
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

    // Generate smooth bezier curves
    let pathAhorro = `M ${getX(0)} ${getY(chartPoints[0].ahorrado)}`
    let pathDisp = `M ${getX(0)} ${getY(chartPoints[0].disponible)}`

    for (let i = 0; i < chartPoints.length - 1; i++) {
      const x0 = getX(i)
      const y0_a = getY(chartPoints[i].ahorrado)
      const y0_d = getY(chartPoints[i].disponible)
      const x1 = getX(i + 1)
      const y1_a = getY(chartPoints[i + 1].ahorrado)
      const y1_d = getY(chartPoints[i + 1].disponible)
      
      const xc = (x0 + x1) / 2
      
      pathAhorro += ` C ${xc} ${y0_a}, ${xc} ${y1_a}, ${x1} ${y1_a}`
      pathDisp += ` C ${xc} ${y0_d}, ${xc} ${y1_d}, ${x1} ${y1_d}`
    }

    const areaAhorro = `${pathAhorro} L ${getX(chartPoints.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`

    return { lineAhorro: pathAhorro, lineDisp: pathDisp, areaAhorro }
  }, [chartPoints, meta.montoObjetivo])

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/5 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-zinc-950 dark:text-white tracking-tight">{meta.nombre}</h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">Progreso y Análisis de Meta</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold tracking-wide uppercase ${paceConfig.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${paceConfig.dot}`} />
          {paceConfig.label}
        </span>
      </div>

      {/* Ring + Breakdown Details */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ProgressRing pct={progressPct} checklistPct={checklistPct} sobranteFinal={sobranteFinal} montoAcumulado={meta.montoAcumulado} />
        
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-baseline justify-center sm:justify-start gap-1.5 text-center sm:text-left">
            <span className="text-xs font-semibold text-zinc-400 font-mono">
              Ahorro
            </span>
            <span className="text-3xl font-black tabular-nums text-zinc-950 dark:text-white font-mono tracking-tight">
              ${meta.montoAcumulado.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-zinc-400 font-mono">
              de ${meta.montoObjetivo.toLocaleString()}
            </span>
          </div>

          {/* Premium Glass-Style Bento Rows */}
          <div className="space-y-2 pt-1">
            {/* Ahorrado Total - Siempre verde */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 px-4 py-3 hover:translate-x-1 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Ahorrado Total</span>
                  <span className="text-[9px] text-zinc-400">Total abonado a la meta</span>
                </div>
              </div>
              <span className="rounded-xl bg-[#10B981]/10 px-3 py-1 text-xs font-black text-[#10B981] dark:text-[#6EE7B7] font-mono border border-[#10B981]/25">
                ${meta.montoAcumulado.toLocaleString()}
              </span>
            </div>

            {/* Gastado (Checklist) */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 px-4 py-3 hover:translate-x-1 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899]" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Gastado (Checklist)</span>
                  <span className="text-[9px] text-zinc-400">Total en compras finalizadas</span>
                </div>
              </div>
              <span className="rounded-xl bg-[#EC4899]/10 px-3 py-1 text-xs font-black text-[#EC4899] font-mono border border-[#EC4899]/15">
                ${totalReal.toLocaleString()}
              </span>
            </div>

            {/* Disponible - Amarillo */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 px-4 py-3 hover:translate-x-1 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#FFC700] shadow-[0_0_8px_#FFC700]" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Disponible</span>
                  <span className="text-[9px] text-zinc-400">Saldo disponible después de gastos</span>
                </div>
              </div>
              <span className="rounded-xl bg-[#FFC700]/10 px-3 py-1 text-xs font-black text-[#B8860B] dark:text-[#FFC700] font-mono border border-[#FFC700]/25">
                ${sobranteFinal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ruedas explicadas */}
      <div className="rounded-2xl border border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-[#161920]/40 p-4 space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Explicación de los 3 Anillos</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="h-4 w-4 rounded-full bg-gradient-to-r from-[#10B981] to-[#34D399] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-zinc-800 dark:text-white">Anillo 1 · Ahorrado Total (Verde)</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">Muestra el progreso de tus abonos hacia la meta. Representa el porcentaje acumulado (`${meta.montoAcumulado.toLocaleString()}`) sobre el objetivo total (`${meta.montoObjetivo.toLocaleString()}`).</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="h-4 w-4 rounded-full bg-gradient-to-r from-[#EC4899] to-[#FF9F43] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-zinc-800 dark:text-white">Anillo 2 · Gastado (Rosa)</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">Muestra qué porción del total abonado se ha consumido en compras del checklist (`${totalReal.toLocaleString()}`).</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="h-4 w-4 rounded-full bg-gradient-to-r from-[#FFC700] to-[#FBBF24] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-zinc-800 dark:text-white">Anillo 3 · Disponible (Amarillo)</p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">Representa el saldo disponible después de gastos. Es lo que queda (`${sobranteFinal.toLocaleString()}`) = ahorrado total − gastado.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Banners de Alerta por Sobregiro o Fondos Insuficientes */}
      {(sobregiroChecklist > 0 || errorFondosInsuficientes) && (
        <div className="space-y-2">
          {sobregiroChecklist > 0 && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex gap-3 text-xs text-yellow-600 dark:text-yellow-400">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-extrabold uppercase tracking-wide">Alerta de Sobregiro en Compras</p>
                <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Se ha gastado **${sobregiroChecklist.toLocaleString()}** más de lo estimado en las tareas cerradas. 
                  (Estimado original: `${totalEstCompletados.toLocaleString()}` · Costo Real: `${totalRealCompletados.toLocaleString()}`).
                </p>
              </div>
            </div>
          )}

          {errorFondosInsuficientes && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex gap-3 text-xs text-red-600 dark:text-red-400">
              <span className="text-lg">🚨</span>
              <div>
                <p className="font-extrabold uppercase tracking-wide">Fondo en Déficit</p>
                <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-300">
                  ¡Atención! El dinero gastado de tu checklist (**${totalReal.toLocaleString()}**) supera la cantidad total ahorrada (**${meta.montoAcumulado.toLocaleString()}**) por un déficit de **${deficitFondos.toLocaleString()}**. 
                  Debes agregar aportes a tu meta para cubrir esta diferencia.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crecimiento vs Consumo Line Chart */}
      <div className="rounded-3xl bg-zinc-50 dark:bg-[#161920] border border-zinc-200/60 dark:border-white/5 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Crecimiento vs Consumo</span>
          <div className="flex items-center gap-3.5 text-[9px] font-extrabold tracking-wider">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10B981]" /> AHORRADO</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#FFC700]" /> DISPONIBLE</span>
          </div>
        </div>

        {chartPoints.length < 2 ? (
          <div className="h-[130px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-2xl">
            <span className="text-xl">📈</span>
            <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-wide">Esperando datos de aportes...</p>
          </div>
        ) : (
          <div className="relative">
            <svg viewBox="0 0 500 150" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="smoothAhorroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Dotted Grid lines */}
              {Array.from({ length: 4 }).map((_, i) => {
                const yVal = 20 + (i * 110) / 3
                return <line key={i} x1="20" y1={yVal} x2="480" y2={yVal} stroke="var(--border-light)" strokeWidth={1} strokeDasharray="3 3" className="opacity-40" />
              })}

              {/* Area Fills */}
              <path d={lineChartPaths.areaAhorro} fill="url(#smoothAhorroGrad)" />

              {/* Ahorrado Line */}
              <path d={lineChartPaths.lineAhorro} fill="none" stroke="#10B981" strokeWidth={3} strokeLinecap="round" />

              {/* Disponible Line */}
              <path d={lineChartPaths.lineDisp} fill="none" stroke="#FFC700" strokeWidth={2.5} strokeDasharray="5 3" strokeLinecap="round" />

              {/* Glowing Interactive Data Nodes */}
              {chartPoints.map((pt, i) => {
                const width = 500
                const height = 150
                const padding = 20
                const maxVal = Math.max(...chartPoints.map((p) => p.ahorrado), meta.montoObjetivo, 1000)

                const cx = padding + (i * (width - padding * 2)) / (chartPoints.length - 1)
                const cyAhorro = height - padding - (pt.ahorrado * (height - padding * 2)) / maxVal
                const cyDisp = height - padding - (pt.disponible * (height - padding * 2)) / maxVal

                return (
                  <g key={i} className="group">
                    {/* Ahorrado Node */}
                    <circle
                      cx={cx}
                      cy={cyAhorro}
                      r={3.5}
                      fill="#10B981"
                      stroke="var(--bg)"
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all duration-200 hover:r-6 hover:stroke-white"
                      onMouseEnter={() => setHoveredPoint({ x: cx, y: cyAhorro - 10, label: pt.dateLabel, ahorrado: pt.ahorrado, disponible: pt.disponible })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Disponible Node */}
                    <circle
                      cx={cx}
                      cy={cyDisp}
                      r={3.5}
                      fill="#FFC700"
                      stroke="var(--bg)"
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all duration-200 hover:r-6 hover:stroke-white"
                      onMouseEnter={() => setHoveredPoint({ x: cx, y: cyDisp - 10, label: pt.dateLabel, ahorrado: pt.ahorrado, disponible: pt.disponible })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                )
              })}
            </svg>

            {hoveredPoint && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bg-zinc-950/95 dark:bg-black/95 text-[11px] text-white font-extrabold px-3 py-2 rounded-xl shadow-xl border border-white/10 pointer-events-none space-y-1 z-10"
                style={{ left: `${(hoveredPoint.x / 500) * 100}%`, top: `${(hoveredPoint.y / 150) * 100}%`, transform: 'translate(-50%, -100%)' }}
              >
                <div className="text-zinc-400 font-bold border-b border-white/5 pb-1 text-[10px] uppercase tracking-wider">{hoveredPoint.label}</div>
                <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> Ahorrado: <span className="font-mono text-zinc-100">${hoveredPoint.ahorrado.toLocaleString()}</span></div>
                <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#FFC700]" /> Disponible: <span className="font-mono text-zinc-100">${hoveredPoint.disponible.toLocaleString()}</span></div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Costo Estimado vs Real Double Bars */}
      {checklist.length > 0 && (
        <div className="rounded-3xl bg-zinc-50 dark:bg-[#161920] border border-zinc-200/60 dark:border-white/5 p-5 space-y-4 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Costo Estimado vs Real</span>
          
          <div className="space-y-4.5">
            {checklist.slice(0, 4).map((item) => {
              const est = item.monto ?? 0
              const real = item.montoReal ?? 0
              const isCompleted = item.completado
              const maxVal = Math.max(est, real, 1)
              const estPct = (est / maxVal) * 100
              const realPct = (real / maxVal) * 100

              return (
                <div key={item.id} className="space-y-1.5 group select-none">
                  <div className="flex justify-between text-xs font-extrabold text-zinc-800 dark:text-zinc-100 truncate">
                    <span>{item.texto}</span>
                    <span className="text-[10px] text-zinc-400 font-bold font-mono">
                      Est: ${est.toLocaleString()} {isCompleted && real > 0 && `· Real: $${real.toLocaleString()}`}
                    </span>
                  </div>
                  
                  {/* Glassmorphic progress track */}
                  <div className="space-y-2 bg-white/60 dark:bg-[#11141B]/40 p-3 rounded-2xl border border-zinc-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black w-7 text-zinc-400 tracking-wider">EST.</span>
                      <div className="flex-1 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-850 overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-[#6336FF] to-[#00D1FF] rounded-full" style={{ width: `${estPct}%` }} />
                      </div>
                    </div>
                    {isCompleted && real > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black w-7 text-zinc-400 tracking-wider">REAL</span>
                        <div className="flex-1 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-850 overflow-hidden relative">
                          <div className={`h-full rounded-full bg-gradient-to-r ${real > est ? 'from-red-500 to-[#EC4899]' : 'from-[#10B981] to-[#00D1FF]'}`} style={{ width: `${realPct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {checklist.length > 4 && (
              <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-wider">Mostrando los primeros 4 elementos.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
