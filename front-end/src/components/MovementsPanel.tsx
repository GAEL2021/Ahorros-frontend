import { useGoalCalendar } from '@/hooks/useGoalCalendar'
import type { MetaMember } from '@/types'

interface MovementsPanelProps {
  goalId: string
  totalMonths: number
  members: MetaMember[]
}

type StatusKey = 'PAGADO' | 'PARCIAL' | 'PENDIENTE'

const STATUS_STYLE: Record<StatusKey, { bg: string; text: string; dot: string; label: string }> = {
  PAGADO: { bg: 'bg-success/10', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Pagado' },
  PARCIAL: { bg: 'bg-accent-subtle', text: 'text-accent', dot: 'bg-accent', label: 'Parcial' },
  PENDIENTE: { bg: 'bg-ink/5', text: 'text-ink-muted', dot: 'bg-ink-muted', label: 'Pendiente' },
}

function MonthNames(monthNum: number): string {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return months[(monthNum - 1) % 12]
}

export default function MovementsPanel({ goalId, totalMonths, members }: MovementsPanelProps) {
  const { data: cuotas, isLoading, isError, error } = useGoalCalendar(goalId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-xs text-ink-muted">Cargando movimientos...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-5 text-center">
        <p className="text-xs text-danger">{error instanceof Error ? error.message : 'Error al cargar movimientos'}</p>
      </div>
    )
  }

  const cuotasList = cuotas ?? []

  // Group cuotas by month for chronological view
  const months = Array.from({ length: totalMonths }, (_, i) => i + 1)

  // Calculate totals per member
  const memberTotals = members.map((m) => {
    const memberCuotas = cuotasList.filter((c) => c.usuarioEmail === m.email)
    const pagadas = memberCuotas.filter((c) => c.estado === 'PAGADO').length
    const parciales = memberCuotas.filter((c) => c.estado === 'PARCIAL').length
    const pendientes = memberCuotas.filter((c) => c.estado === 'PENDIENTE').length
    return { ...m, pagadas, parciales, pendientes }
  })

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Header with member summary */}
      <div className="border-b border-border bg-surface-raised px-5 py-3.5">
        <h3 className="text-sm font-semibold text-ink">Movimientos</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Historial de aportes por mes &middot; {totalMonths} {totalMonths === 1 ? 'mes' : 'meses'}
        </p>
      </div>

      {/* Member summary cards */}
      <div className="border-b border-border-light px-5 py-3">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {memberTotals.map((m) => (
            <div key={m.email} className="rounded-lg border border-border bg-surface-raised px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-ink">{m.email.split('@')[0]}</span>
                <span className="text-[10px] font-medium text-ink-muted">
                  ${m.saldoAportado.toLocaleString()} / ${(m.cuotaMensual * totalMonths).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 font-semibold">{m.pagadas}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-accent font-semibold">{m.parciales}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                  <span className="text-stone-500 font-semibold">{m.pendientes}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline list */}
      <div className="divide-y divide-border-light">
        {months.map((mes) => {
          const monthCuotas = cuotasList.filter((c) => c.mes === mes)
          const hasActivity = monthCuotas.some((c) => c.estado !== 'PENDIENTE')
          const allPaid = monthCuotas.length > 0 && monthCuotas.every((c) => c.estado === 'PAGADO')

          return (
            <div key={mes} className="px-5 py-3">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-xs font-bold text-ink">{MonthNames(mes)}</span>
                <span className="h-px flex-1 bg-border" />
                <span className={`text-[10px] font-semibold ${allPaid ? 'text-emerald-600' : hasActivity ? 'text-accent' : 'text-ink-muted'}`}>
                  Mes {mes}
                </span>
              </div>

              {monthCuotas.length === 0 ? (
                <p className="text-[11px] text-ink-muted italic pl-5 border-l-2 border-border ml-1.5 py-0.5">
                  Sin registros
                </p>
              ) : (
                <div className="space-y-1.5">
                  {monthCuotas.map((c) => {
                    const st = STATUS_STYLE[c.estado as StatusKey] ?? STATUS_STYLE.PENDIENTE
                    const memberName = members.find((m) => m.email === c.usuarioEmail)?.email.split('@')[0] ?? c.usuarioEmail
                    return (
                      <div key={c.id} className="flex items-center justify-between pl-5 border-l-2 border-border ml-1.5 py-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                          <span className="text-[11px] font-medium text-ink-secondary">{memberName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] tabular-nums text-ink-muted" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            ${c.cuotaEsperada.toLocaleString()}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
