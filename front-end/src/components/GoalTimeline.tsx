import { useMemo } from 'react'
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
        <circle cx={75} cy={75} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
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
  const now = Date.now()
  const start = calcStartDate(meta).getTime()
  const end = new Date(meta.fechaLimite).getTime()
  const totalDuration = end - start
  const elapsed = Math.max(0, now - start)
  const timePct = totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 0
  const remaining = meta.montoObjetivo - meta.montoAcumulado

  const checklist = meta.checklist ?? []
  const totalReal = checklist.filter((i) => i.completado && i.montoReal != null).reduce((s: number, i) => s + (i.montoReal ?? 0), 0)

  return (
    <div className="space-y-4">
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
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Restante</span>
              <p className="mt-0.5 text-sm font-bold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${remaining.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Tiempo</span>
              <p className="mt-0.5 text-sm font-bold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timePct}%</p>
            </div>
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Meses rest.</span>
              <p className="mt-0.5 text-sm font-bold text-ink">{meta.mesesRestantes}</p>
            </div>
            <div className="rounded-xl bg-surface-raised border border-border px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Participantes</span>
              <p className="mt-0.5 text-sm font-bold text-ink">{meta.miembros?.length ?? 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings vs Time bar */}
      <div className="rounded-xl bg-surface-raised border border-border px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-2 block">Ahorro vs Tiempo</span>
        <svg width={260} height={64} viewBox="0 0 260 64" className="w-full h-auto">
          <defs>
            <linearGradient id="gbar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b8940c" /><stop offset="50%" stopColor="#c9a84c" /><stop offset="100%" stopColor="#d4b86a" />
            </linearGradient>
          </defs>
          <text x={0} y={9} fill="var(--text-muted)" fontSize="7" fontWeight="700">AHORRO</text>
          <rect x={0} y={12} width={260} height={16} rx="4" fill="var(--border)" />
          <rect x={0} y={12} width={Math.max(4, (progressPct / 100) * 260)} height={16} rx="4" fill="url(#gbar)" style={{ transition: 'width 1s ease-out' }} />
          <text x={Math.max(4, (progressPct / 100) * 260 - 6)} y={23} textAnchor={progressPct > 15 ? 'end' : 'start'} fill={progressPct > 15 ? 'var(--bg)' : 'var(--text-secondary)'} fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700">${meta.montoAcumulado.toLocaleString()}</text>

          <text x={0} y={40} fill="var(--text-muted)" fontSize="7" fontWeight="700">TIEMPO</text>
          <rect x={0} y={43} width={260} height={16} rx="4" fill="var(--border)" />
          <rect x={0} y={43} width={Math.max(4, (timePct / 100) * 260)} height={16} rx="4" fill="var(--text-muted)" opacity="0.6" style={{ transition: 'width 1s ease-out' }} />
          <text x={Math.max(4, (timePct / 100) * 260 - 6)} y={54} textAnchor={timePct > 15 ? 'end' : 'start'} fill={timePct > 15 ? 'white' : 'var(--text-secondary)'} fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700">{timePct}%</text>
        </svg>
      </div>

      {/* Ahorro vs Gastado (Checklist) */}
      {checklist.length > 0 && (
        <div className="rounded-xl bg-surface-raised border border-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Ahorro vs Gastado</span>
            {totalReal > 0 && (
              <span className={`text-[10px] font-semibold ${totalReal > meta.montoAcumulado ? 'text-danger' : 'text-success'}`}>
                {totalReal > meta.montoAcumulado ? `⚠️ -$${(totalReal - meta.montoAcumulado).toLocaleString()}` : `✅ $${(meta.montoAcumulado - totalReal).toLocaleString()} libre`}
              </span>
            )}
          </div>
          <svg width={260} height={64} viewBox="0 0 260 64" className="w-full h-auto">
            <defs>
              <linearGradient id="ahorrobar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c9a84c" /><stop offset="100%" stopColor="#d4b86a" />
              </linearGradient>
              <linearGradient id="gastobar" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={totalReal > meta.montoAcumulado ? '#e74c3c' : '#2ecc71'} />
                <stop offset="100%" stopColor={totalReal > meta.montoAcumulado ? '#c0392b' : '#27ae60'} />
              </linearGradient>
            </defs>
            <text x={0} y={9} fill="var(--text-muted)" fontSize="7" fontWeight="700">AHORRADO</text>
            <rect x={0} y={12} width={260} height={16} rx="4" fill="var(--border)" />
            <rect x={0} y={12} width={Math.max(4, (meta.montoAcumulado / Math.max(meta.montoAcumulado, totalReal, 1)) * 260)} height={16} rx="4" fill="url(#ahorrobar)" style={{ transition: 'width 1s ease-out' }} />
            <text x={Math.max(4, (meta.montoAcumulado / Math.max(meta.montoAcumulado, totalReal, 1)) * 260 - 6)} y={23} textAnchor={(Math.max(meta.montoAcumulado, totalReal) > 0 && meta.montoAcumulado / Math.max(meta.montoAcumulado, totalReal) > 0.15) ? 'end' : 'start'} fill={(Math.max(meta.montoAcumulado, totalReal) > 0 && meta.montoAcumulado / Math.max(meta.montoAcumulado, totalReal) > 0.15) ? 'var(--bg)' : 'var(--text-secondary)'} fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700">${meta.montoAcumulado.toLocaleString()}</text>

            <text x={0} y={40} fill="var(--text-muted)" fontSize="7" fontWeight="700">GASTADO</text>
            <rect x={0} y={43} width={260} height={16} rx="4" fill="var(--border)" />
            <rect x={0} y={43} width={Math.max(4, (totalReal / Math.max(meta.montoAcumulado, totalReal, 1)) * 260)} height={16} rx="4" fill="url(#gastobar)" style={{ transition: 'width 1s ease-out' }} />
            <text x={Math.max(4, (totalReal / Math.max(meta.montoAcumulado, totalReal, 1)) * 260 - 6)} y={54} textAnchor={(Math.max(meta.montoAcumulado, totalReal) > 0 && totalReal / Math.max(meta.montoAcumulado, totalReal) > 0.15) ? 'end' : 'start'} fill={(Math.max(meta.montoAcumulado, totalReal) > 0 && totalReal / Math.max(meta.montoAcumulado, totalReal) > 0.15) ? 'white' : 'var(--text-secondary)'} fontSize="8" fontFamily="'JetBrains Mono', monospace" fontWeight="700">${totalReal.toLocaleString()}</text>
          </svg>
        </div>
      )}
    </div>
  )
}
