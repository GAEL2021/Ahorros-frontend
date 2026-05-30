import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { useJoinGoal } from '@/hooks/useJoinGoal'
import GoalCard from '@/components/GoalCard'
import CreateGoalModal from '@/components/CreateGoalModal'
import AchievementBadge, { computeAchievements } from '@/components/AchievementBadge'
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

export default function DashboardPage() {
  const { data: goals, isLoading, isError, error, refetch } = useFetchGoals()
  const joinGoal = useJoinGoal()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCodeValue, setJoinCodeValue] = useState('')

  const achievements = goals ? computeAchievements(goals) : []

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Mis Metas</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {goals && goals.length > 0
              ? `${goals.length} meta(s) activa(s)`
              : 'Gestiona tus ahorros colaborativos'}
          </p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[#0a0e14] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/30">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nueva meta
        </button>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Logros</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {achievements.map((a, i) => (
              <AchievementBadge key={a.id} achievement={a} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Join code bar */}
      <div className="mb-6 animate-fade-in">
        {!showJoinCode ? (
          <button type="button" onClick={() => setShowJoinCode(true)} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/20 px-4 py-2.5 text-sm font-medium text-ink-muted transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20">
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
                type="text" value={joinCodeValue} onChange={(e) => setJoinCodeValue(e.target.value.toUpperCase())}
                placeholder="Código de 8 caracteres" maxLength={8}
                className="flex-1 bg-transparent text-sm tracking-[0.2em] text-ink placeholder:text-ink-muted focus:outline-none"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowJoinCode(false); setJoinCodeValue(''); joinGoal.reset() }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface transition-colors">Cancelar</button>
              <button type="button" disabled={joinCodeValue.length !== 8 || joinGoal.isPending}
                onClick={() => joinGoal.mutate(joinCodeValue, {
                  onSuccess: (data) => { setShowJoinCode(false); setJoinCodeValue(''); sileo.success(`Te uniste a "${data.nombre}"`) },
                  onError: () => sileo.error('Error al unirse a la meta'),
                })}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-[#0a0e14] hover:bg-primary-light disabled:opacity-50 transition-colors">
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

      {isError && (
        <div className="glass rounded-2xl px-6 py-12 text-center animate-fade-in">
          <p className="text-sm text-danger">{error instanceof Error ? error.message : 'Error al cargar'}</p>
          <button type="button" onClick={() => refetch()} className="mt-3 text-xs font-semibold text-primary hover:underline">Reintentar</button>
        </div>
      )}

      {!isLoading && !isError && goals && goals.length === 0 && (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {!isLoading && !isError && goals && goals.length > 0 && (
        <div className="space-y-3 stagger">
          {goals.map((goal) => (
            <GoalCard key={goal.id} meta={goal} />
          ))}
        </div>
      )}

      {createPortal(<CreateGoalModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />, document.body)}
    </main>
  )
}
