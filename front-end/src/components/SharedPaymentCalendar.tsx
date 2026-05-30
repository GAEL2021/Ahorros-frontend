import type { PaymentState, Cuota } from '@/types'

interface CalendarParticipant {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

interface SharedPaymentCalendarProps {
  totalMonths: number
  cuotas: Cuota[]
  participants: CalendarParticipant[]
}

function getHeatColor(estado: PaymentState): { bg: string; border: string; label: string; dot: string } {
  switch (estado) {
    case 'PAGADO':
      return { bg: 'bg-success/15', border: 'border-success/40', label: 'Pagado', dot: 'bg-success' }
    case 'PARCIAL':
      return { bg: 'bg-accent-subtle', border: 'border-accent/30', label: 'Parcial', dot: 'bg-accent' }
    case 'PENDIENTE':
    default:
      return { bg: 'bg-ink/5', border: 'border-border', label: 'Pendiente', dot: 'bg-ink-muted' }
  }
}

export default function SharedPaymentCalendar({
  totalMonths,
  cuotas,
  participants,
}: SharedPaymentCalendarProps) {
  const months = Array.from({ length: totalMonths }, (_, i) => i + 1)

  if (participants.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised px-6 py-10 text-center">
        <svg className="mx-auto h-8 w-8 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-ink-muted">No hay participantes registrados en este grupo.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="border-b border-border bg-surface-raised px-5 py-3.5">
        <h3 className="text-sm font-semibold text-ink">Calendario de Pagos</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Estado de cuotas mensuales &middot; {totalMonths} {totalMonths === 1 ? 'mes' : 'meses'}
        </p>
      </div>

      {/* Desktop heatmap grid */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface w-20 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-muted border-b border-border">
                Mes
              </th>
              {participants.map((p) => (
                <th key={p.email} className="px-2 py-2.5 text-center border-b border-border">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
                      {p.displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[64px] truncate text-[9px] font-medium text-ink-secondary">
                      {p.displayName}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((mes) => (
              <tr key={mes} className="group">
                <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 border-b border-border-light group-hover:bg-surface-raised">
                  <span className="text-xs font-semibold tabular-nums text-ink">Mes {mes}</span>
                </td>
                {participants.map((p) => {
                  const cuota = cuotas.find((c) => c.usuarioEmail === p.email && c.mes === mes)
                  const estado = cuota?.estado ?? 'PENDIENTE'
                  const colors = getHeatColor(estado)
                  return (
                    <td key={`${p.email}-${mes}`} className="px-1 py-2.5 text-center border-b border-border-light group-hover:bg-surface-raised">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${colors.bg} ${colors.border}`}
                        style={{ color: colors.dot.replace('bg-', '').replace('-500', '-700') }}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                        {colors.label}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="divide-y divide-border-light sm:hidden">
        {months.map((mes) => (
          <div key={mes} className="px-4 py-3.5">
            <h4 className="mb-2.5 text-xs font-semibold text-ink">Mes {mes}</h4>
            <div className="grid grid-cols-2 gap-2">
              {participants.map((p) => {
                const cuota = cuotas.find((c) => c.usuarioEmail === p.email && c.mes === mes)
                const estado = cuota?.estado ?? 'PENDIENTE'
                const colors = getHeatColor(estado)
                return (
                  <div key={`${p.email}-${mes}`} className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${colors.bg} ${colors.border}`}>
                    <span className="truncate text-[11px] font-medium text-ink-secondary">{p.displayName}</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: colors.dot.replace('bg-', '').replace('-500', '-700') }}>
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      {colors.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-border bg-surface-raised px-5 py-3">
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Pagado
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
            Parcial
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-stone-400" />
            Pendiente
          </div>
        </div>
      </div>
    </div>
  )
}
