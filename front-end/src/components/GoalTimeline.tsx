import { useMemo } from 'react'
import type { Meta, TimelinePace } from '@/types'

interface GoalTimelineProps {
  meta: Meta
}

function getPaceConfig(pace: TimelinePace) {
  switch (pace) {
    case 'adelantado':
      return {
        label: 'Adelantado',
        main: '#059669',
        mainBg: '#d1fae5',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      }
    case 'retrasado':
      return {
        label: 'Retrasado',
        main: '#e11d48',
        mainBg: '#ffe4e6',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      }
    case 'a_tiempo':
    default:
      return {
        label: 'A tiempo',
        main: '#0d6b46',
        mainBg: '#d1fae5',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      }
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

function CoinRing({ progress, paceColor }: { progress: number; paceColor: string }) {
  const r = 52
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(100, progress) / 100)
  const gradId = `coin-grad-${Math.random().toString(36).slice(2, 8)}`

  return (
    <div className="relative inline-flex">
      <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90 drop-shadow-sm">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor={paceColor} />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        {/* Outer rim - coin edge */}
        <circle cx="65" cy="65" r="58" fill="none" stroke="#e5e7e4" strokeWidth="2" />
        {/* Track */}
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7e4" strokeWidth="8" />
        {/* Progress arc with gradient */}
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        {/* Inner glow ring */}
        <circle cx="65" cy="65" r="44" fill="none" stroke="#e5e7e4" strokeWidth="0.5" opacity="0.5" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold tabular-nums text-ink leading-none"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {Math.min(100, progress)}%
        </span>
        <span className="mt-0.5 text-[10px] font-medium text-ink-muted tracking-wide">COMPLETADO</span>
      </div>
    </div>
  )
}

function MoneyBars({
  progress,
  timePct,
  montoAcumulado,
  montoObjetivo,
}: {
  progress: number
  timePct: number
  montoAcumulado: number
  montoObjetivo: number
}) {
  const width = 260
  const height = 72
  const barH = 18
  const barGap = 8
  const padX = 0
  const barW = width - padX * 2

  const savingsW = (progress / 100) * barW
  const timeW = (timePct / 100) * barW

  // Build stripe pattern for gold bar effect
  const stripeId = `stripe-${Math.random().toString(36).slice(2, 6)}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <pattern id={stripeId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="8" fill="white" opacity="0.15" />
          <rect x="4" width="4" height="8" fill="black" opacity="0.08" />
        </pattern>
        <linearGradient id={`gold-bar`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b7870a" />
          <stop offset="40%" stopColor="#c5a344" />
          <stop offset="60%" stopColor="#b7870a" />
          <stop offset="100%" stopColor="#9a6e04" />
        </linearGradient>
      </defs>

      {/* Savings bar - gold/money look */}
      <text x={padX} y={10} fill="#a3a3a3" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="0.5">AHORRO</text>
      <rect x={padX} y={14} width={barW} height={barH} rx="3" fill="#e5e7e4" />
      <rect x={padX} y={14} width={Math.max(4, savingsW)} height={barH} rx="3" fill={`url(#gold-bar)`} style={{ transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <rect x={padX} y={14} width={Math.max(4, savingsW)} height={barH} rx="3" fill={`url(#${stripeId})`} style={{ transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      <text
        x={Math.max(padX + 6, savingsW - 4)}
        y={14 + barH / 2 + 1.5}
        textAnchor={progress > 15 ? 'end' : 'start'}
        fill={progress > 15 ? 'white' : '#525252'}
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
      >
        ${montoAcumulado.toLocaleString()}
      </text>

      {/* Time bar */}
      <text x={padX} y={14 + barH + barGap + 10} fill="#a3a3a3" fontSize="8" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="0.5">TIEMPO</text>
      <rect x={padX} y={14 + barH + barGap + 14} width={barW} height={barH} rx="3" fill="#e5e7e4" />
      <rect
        x={padX}
        y={14 + barH + barGap + 14}
        width={Math.max(4, timeW)}
        height={barH}
        rx="3"
        fill="#a3a3a3"
        style={{ transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text
        x={Math.max(padX + 6, timeW - 4)}
        y={14 + barH + barGap + 14 + barH / 2 + 1.5}
        textAnchor={timePct > 15 ? 'end' : 'start'}
        fill={timePct > 15 ? 'white' : '#525252'}
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
      >
        {timePct}%
      </text>

      {/* Meta line on savings bar */}
      <line x1={barW - 0.5} y1={14} x2={barW - 0.5} y2={14 + barH + barGap + 14 + barH} stroke="#0d6b46" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      <text x={barW + 4} y={14 + barH / 2 + 1.5} fill="#0d6b46" fontSize="7" fontFamily="Inter, sans-serif" fontWeight="700">META</text>
      <text x={barW + 4} y={14 + barH / 2 + 11} fill="#525252" fontSize="7" fontFamily="Inter, sans-serif" fontWeight="500">${montoObjetivo.toLocaleString()}</text>
    </svg>
  )
}

export default function GoalTimeline({ meta }: GoalTimelineProps) {
  const pace = useMemo(() => calcPace(meta), [meta])
  const paceConfig = getPaceConfig(pace)
  const progressPct = Math.min(100, Math.round((meta.montoAcumulado / meta.montoObjetivo) * 100))

  const now = Date.now()
  const start = calcStartDate(meta).getTime()
  const end = new Date(meta.fechaLimite).getTime()
  const totalDuration = end - start
  const elapsed = Math.max(0, now - start)
  const timePct = totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 0
  const remaining = meta.montoObjetivo - meta.montoAcumulado

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Progreso de la Meta</h3>
          <p className="mt-0.5 text-xs text-ink-muted">{meta.nombre}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paceConfig.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${paceConfig.dot}`} />
          {paceConfig.label}
        </span>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Coin ring */}
        <div className="flex justify-center sm:flex-shrink-0">
          <CoinRing progress={progressPct} paceColor={paceConfig.main} />
        </div>

        {/* KPI grid + money bars */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* 4 KPI cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-primary/10 bg-primary-subtle/50 px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-dark">Meta Total</span>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${meta.montoObjetivo.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-primary/10 bg-primary-subtle/50 px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-dark">Ahorrado</span>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-primary-dark" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${meta.montoAcumulado.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-raised px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Restante</span>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${remaining.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-raised px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">T. Transcurrido</span>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {timePct}%
              </p>
            </div>
          </div>

          {/* Money bars chart */}
          <div className="rounded-lg border border-border bg-surface-raised px-3 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Ahorro acumulado vs Tiempo</span>
            <div className="mt-2">
              <MoneyBars
                progress={progressPct}
                timePct={timePct}
                montoAcumulado={meta.montoAcumulado}
                montoObjetivo={meta.montoObjetivo}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
