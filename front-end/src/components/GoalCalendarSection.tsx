import { useGoalCalendar } from '@/hooks/useGoalCalendar'
import SharedPaymentCalendar from '@/components/SharedPaymentCalendar'
import type { MetaMember, Cuota } from '@/types'

interface CalendarParticipant {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

interface GoalCalendarSectionProps {
  goalId: string
  totalMonths: number
  members: MetaMember[]
}

function toCalendarParticipants(members: MetaMember[]): CalendarParticipant[] {
  return members.map((m) => ({
    uid: m.uid,
    email: m.email,
    displayName: m.email.split('@')[0],
    photoURL: null,
  }))
}

function toCalendarCuotas(cuotas: Cuota[]): Cuota[] {
  return cuotas.map((c) => ({
    ...c,
    estado: c.estado as Cuota['estado'],
  }))
}

export default function GoalCalendarSection({
  goalId,
  totalMonths,
  members,
}: GoalCalendarSectionProps) {
  const { data: cuotas, isLoading, isError, error } = useGoalCalendar(goalId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-white px-4 py-10">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-xs text-ink-muted">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
        <p className="text-sm text-danger">
          {error instanceof Error ? error.message : 'Error al cargar el calendario'}
        </p>
      </div>
    )
  }

  return (
    <SharedPaymentCalendar
      totalMonths={totalMonths}
      cuotas={toCalendarCuotas(cuotas ?? [])}
      participants={toCalendarParticipants(members)}
    />
  )
}
