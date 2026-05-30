import { useState } from 'react'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { useJoinGoal } from '@/hooks/useJoinGoal'
import GoalCard from '@/components/GoalCard'
import CreateGoalModal from '@/components/CreateGoalModal'
import { sileo } from '@/lib/sileo'

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center animate-fade-in">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink">No tienes metas aún</h3>
      <p className="mt-1.5 text-sm text-ink-muted">
        Crea tu primera meta colaborativa y empieza a ahorrar en grupo.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-green-500/30"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Crear meta
      </button>
    </div>
  )
}

function GoalsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center animate-fade-in">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-danger">{message}</p>
      <button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold text-danger underline hover:text-red-700">
        Reintentar
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const { data: goals, isLoading, isError, error, refetch } = useFetchGoals()
  const joinGoal = useJoinGoal()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCodeValue, setJoinCodeValue] = useState('')

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-ink">Mis Metas</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {goals && goals.length > 0
              ? `${goals.length} meta(s) activa(s)`
              : 'Gestiona tus ahorros colaborativos'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-green-500/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva meta
        </button>
      </div>

      {/* Color legend */}
      {goals && goals.length > 0 && (
        <div className="mb-5 rounded-lg border border-border bg-white px-4 py-3 animate-fade-in">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            <span className="text-ink-muted font-medium">Colores:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-green-400 bg-green-400" />
              <span className="text-ink-secondary">Borde verde = Meta individual</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-violet-400 bg-violet-400" />
              <span className="text-ink-secondary">Borde violeta = Meta grupal</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-blue-400 bg-blue-400" />
              <span className="text-ink-secondary">Completada</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-stone-400 bg-stone-400" />
              <span className="text-ink-secondary">Cancelada</span>
            </span>
          </div>
        </div>
      )}

      {/* Join by code bar */}
      <div className="mb-6 animate-fade-in">
        {!showJoinCode ? (
          <button
            type="button"
            onClick={() => setShowJoinCode(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-primary hover:text-primary hover:bg-green-50/50 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Unirse a una meta con código
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5">
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
                onClick={() => { setShowJoinCode(false); setJoinCodeValue(''); joinGoal.reset() }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={joinCodeValue.length !== 8 || joinGoal.isPending}
                onClick={() => joinGoal.mutate(joinCodeValue, {
                  onSuccess: (data) => {
                    setShowJoinCode(false)
                    setJoinCodeValue('')
                    sileo.success(`Te uniste a "${data.nombre}" correctamente`)
                  },
                  onError: () => sileo.error('Error al unirse a la meta'),
                })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30"
              >
                {joinGoal.isPending ? 'Uniéndote...' : 'Unirse'}
              </button>
            </div>
          </div>
        )}
        {joinGoal.isError && (
          <p className="mt-2 text-xs text-danger">
            {joinGoal.error instanceof Error ? joinGoal.error.message : 'Error al unirse'}
          </p>
        )}
        {joinGoal.isSuccess && joinGoal.data && (
          <p className="mt-2 text-xs font-medium text-success">
            Te uniste a "{joinGoal.data.nombre}" correctamente
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-border bg-white py-20 animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-sm text-ink-muted">Cargando metas...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <GoalsErrorState
          message={error instanceof Error ? error.message : 'Error al cargar las metas'}
          onRetry={() => refetch()}
        />
      )}

      {/* Empty */}
      {!isLoading && !isError && goals && goals.length === 0 && (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {/* Goals list */}
      {!isLoading && !isError && goals && goals.length > 0 && (
        <div className="space-y-5">
          {goals.map((goal) => (
            <GoalCard key={goal.id} meta={goal} />
          ))}
        </div>
      )}

      <CreateGoalModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </main>
  )
}
