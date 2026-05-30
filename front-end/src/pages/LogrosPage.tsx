import { useFetchGoals } from '@/hooks/useFetchGoals'
import { computeAchievements } from '@/components/AchievementBadge'

export default function LogrosPage() {
  const { data: goals, isLoading } = useFetchGoals()
  const achievements = goals ? computeAchievements(goals) : []
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Logros</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {unlocked}/{achievements.length} medallas desbloqueadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-40 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full progress-gold transition-all duration-700" style={{ width: `${achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0}%` }} />
          </div>
          <span className="text-xs font-semibold text-primary">{Math.round(achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0)}%</span>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-3 text-center">
              <div className="skeleton h-16 w-16 rounded-2xl mx-auto" />
              <div className="skeleton h-3 w-24 mx-auto" />
              <div className="skeleton h-1.5 w-16 mx-auto" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && achievements.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {achievements.map((a, i) => (
            <div
              key={a.id}
              className={`glass rounded-2xl p-6 text-center transition-all duration-500 card-hover ${
                a.unlocked ? 'border-primary/20' : 'opacity-40 border-border'
              }`}
              style={{ animation: a.unlocked ? `medal-unlock 0.6s ease-out ${0.1 * i}s both` : undefined }}
            >
              <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-all ${
                a.unlocked ? 'bg-primary/10 border border-primary/20 medal-ring unlocked' : 'bg-white/5 border border-border'
              }`}
                style={{ animation: a.unlocked ? 'float 3s ease-in-out infinite' : undefined }}
              >
                {a.icon}
              </div>
              <h3 className={`text-sm font-semibold mb-1 ${a.unlocked ? 'text-ink' : 'text-ink-muted'}`}>
                {a.unlocked ? a.title : '???'}
              </h3>
              <p className={`text-[11px] leading-relaxed ${a.unlocked ? 'text-ink-muted' : 'text-ink-muted/50'}`}>
                {a.unlocked ? a.description : 'Sigue ahorrando para desbloquear'}
              </p>
              {a.unlocked && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Desbloqueado</span>
                </div>
              )}
              {!a.unlocked && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/5 border border-border px-3 py-1">
                  <svg className="h-3 w-3 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Bloqueado</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && achievements.length === 0 && (
        <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20" style={{ animation: 'float 3s ease-in-out infinite' }}>
            <span className="text-3xl">🏆</span>
          </div>
          <h3 className="text-lg font-semibold text-ink">Sin logros aún</h3>
          <p className="mt-1.5 text-sm text-ink-muted">Creá metas y empezá a ahorrar para desbloquear medallas.</p>
        </div>
      )}
    </main>
  )
}
