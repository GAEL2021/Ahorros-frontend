import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { useJoinGoal } from '@/hooks/useJoinGoal'
import GoalCard from '@/components/GoalCard'
import CreateGoalModal from '@/components/CreateGoalModal'
import { FilterBar } from '@/components/FilterBar'
import { sileo } from '@/lib/sileo'
import ShareCodeModal from '@/components/ShareCodeModal'
import EditGoalModal from '@/components/EditGoalModal'
import ContributeModal from '@/components/ContributeModal'
import ConfirmModal from '@/components/ConfirmModal'
import GoalDetailPanel from '@/components/GoalDetailPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useDeleteGoal } from '@/hooks/useDeleteGoal'

function GoalTableRow({ goal }: { goal: any }) {
  const { user } = useAuth()
  const deleteGoal = useDeleteGoal()
  const [showDetail, setShowDetail] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showContribute, setShowContribute] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const progressPct = Math.min(100, Math.round((goal.montoAcumulado / goal.montoObjetivo) * 100))
  const isComplete = progressPct >= 100 || goal.estado === 'completado'
  const isOwner = user?.uid === goal.creadoPor
  const isActive = goal.estado === 'activo'
  const codigo = goal.codigoCompartir

  const handleDelete = async () => {
    try {
      await deleteGoal.mutateAsync(goal.id)
      sileo.info(`Meta "${goal.nombre}" eliminada`)
      setConfirmDelete(false)
    } catch {
      sileo.error('Error al eliminar la meta')
    }
  }

  return (
    <>
      <tr className="border-b border-border-light hover:bg-surface-raised/50 transition-colors">
        <td className="px-5 py-4 font-semibold text-ink">
          <div className="flex items-center gap-2">
            {isComplete && <span className="text-success text-xs">●</span>}
            <span className={isComplete ? 'text-success font-bold' : ''}>{goal.nombre}</span>
          </div>
        </td>
        <td className="px-5 py-4 text-right">
          <span className={`font-mono ${isComplete ? 'text-success font-bold' : ''}`}>{progressPct}%</span>
        </td>
        <td className="px-5 py-4 text-right font-mono">${goal.montoAcumulado.toLocaleString()}</td>
        <td className="px-5 py-4 text-right font-mono">${goal.montoObjetivo.toLocaleString()}</td>
        <td className="px-5 py-4">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
            goal.estado === 'completado' ? 'bg-success/15 text-success border border-success/20' :
            goal.estado === 'activo' ? 'bg-primary/10 text-primary border border-primary/15' : 'bg-ink/5 text-ink-muted'
          }`}>
            {goal.estado === 'completado' ? 'completada' : goal.estado}
          </span>
        </td>
        <td className="px-5 py-4 text-ink-muted">
          {new Date(goal.fechaLimite).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {isActive && (
              <button onClick={() => setShowContribute(true)} className="rounded p-1.5 text-primary-dark hover:bg-primary-subtle transition-colors" title="Aportar">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
            <button onClick={() => setShowDetail(true)} className="rounded p-1.5 text-ink-muted hover:bg-surface-raised transition-colors" title="Ver Detalle">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button onClick={() => setShowShare(true)} className="rounded p-1.5 text-ink-muted hover:bg-surface-raised transition-colors" title="Compartir">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
            {isOwner && (
              <>
                <button onClick={() => setShowEdit(true)} className="rounded p-1.5 text-ink-muted hover:bg-surface-raised transition-colors" title="Editar">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => setConfirmDelete(true)} className="rounded p-1.5 text-ink-muted hover:bg-danger/10 hover:text-danger transition-colors" title="Eliminar">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {createPortal(<ShareCodeModal open={showShare} onClose={() => setShowShare(false)} codigo={codigo} metaNombre={goal.nombre} />, document.body)}
      {createPortal(<EditGoalModal open={showEdit} onClose={() => setShowEdit(false)} meta={goal} />, document.body)}
      {createPortal(<ContributeModal open={showContribute} onClose={() => setShowContribute(false)} meta={goal} />, document.body)}
      {createPortal(<GoalDetailPanel open={showDetail} onClose={() => setShowDetail(false)} meta={goal} />, document.body)}
      {createPortal(<ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} title="Eliminar meta" message={`¿Eliminar "${goal.nombre}"? No se puede deshacer.`} confirmLabel="Eliminar" danger loading={deleteGoal.isPending} />, document.body)}
    </>
  )
}

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

export default function MetasPage() {
  const { data: goals, isLoading: loadingGoals, isError: errorGoals, refetch: refetchGoals } = useFetchGoals()
  const joinGoal = useJoinGoal()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCodeValue, setJoinCodeValue] = useState('')
  const [filterText, setFilterText] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('viewMode_metas') as 'cards' | 'table') || 'cards'
  })

  useEffect(() => {
    localStorage.setItem('viewMode_metas', viewMode)
  }, [viewMode])

  const filteredGoals = useMemo(() => {
    if (!goals) return []
    // Ordenado por la ultima creada (fecha más nueva primero)
    const sorted = [...goals].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    if (!filterText.trim()) return sorted
    const q = filterText.toLowerCase()
    return sorted.filter((g) => g.nombre.toLowerCase().includes(q) || g.estado.toLowerCase().includes(q))
  }, [goals, filterText])

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Mis Metas</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Administra y colabora en tus metas de ahorro</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva meta
        </button>
      </div>

      {/* Join code bar */}
      <div className="mb-6 animate-fade-in">
        {!showJoinCode ? (
          <button
            type="button"
            onClick={() => setShowJoinCode(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/20 px-4 py-2.5 text-sm font-medium text-ink-muted transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
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
                onClick={() => {
                  setShowJoinCode(false)
                  setJoinCodeValue('')
                  joinGoal.reset()
                }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={joinCodeValue.length !== 8 || joinGoal.isPending}
                onClick={() =>
                  joinGoal.mutate(joinCodeValue, {
                    onSuccess: (data) => {
                      setShowJoinCode(false)
                      setJoinCodeValue('')
                      sileo.success(`Te uniste a "${data.nombre}"`)
                    },
                    onError: () => sileo.error('Error al unirse a la meta'),
                  })
                }
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-[#0a0e14] hover:bg-primary-light disabled:opacity-50 transition-colors"
              >
                {joinGoal.isPending ? 'Uniéndote...' : 'Unirse'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loadingGoals && (
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

      {errorGoals && (
        <div className="glass rounded-2xl px-6 py-12 text-center animate-fade-in">
          <p className="text-sm text-danger">Error al cargar las metas</p>
          <button type="button" onClick={() => refetchGoals()} className="mt-3 text-xs font-semibold text-primary hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {!loadingGoals && !errorGoals && goals && goals.length === 0 && (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      )}

      {!loadingGoals && !errorGoals && goals && goals.length > 0 && (
        <>
          <FilterBar
            filterText={filterText}
            setFilterText={setFilterText}
            viewMode={viewMode}
            setViewMode={setViewMode}
            resultsCount={filteredGoals.length}
          />

          {viewMode === 'cards' ? (
            <div className="space-y-3 stagger animate-fade-in">
              {filteredGoals.map((goal) => (
                <GoalCard key={goal.id} meta={goal} />
              ))}
            </div>
          ) : (
            <div className="savesmart-table-container bg-surface animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left savesmart-table">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised text-[11px] uppercase tracking-wider text-ink-muted">
                      <th className="px-5 py-4 font-semibold">Nombre</th>
                      <th className="px-5 py-4 font-semibold text-right">Progreso</th>
                      <th className="px-5 py-4 font-semibold text-right">Monto Acumulado</th>
                      <th className="px-5 py-4 font-semibold text-right">Monto Objetivo</th>
                      <th className="px-5 py-4 font-semibold">Estado</th>
                      <th className="px-5 py-4">Fecha Límite</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGoals.map((goal) => (
                      <GoalTableRow key={goal.id} goal={goal} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {createPortal(<CreateGoalModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />, document.body)}
    </main>
  )
}
