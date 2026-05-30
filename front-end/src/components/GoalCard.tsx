import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Meta } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { sileo } from '@/lib/sileo'
import { useDeleteGoal } from '@/hooks/useDeleteGoal'
import { useGoalDetail } from '@/hooks/useGoalDetail'
import ShareCodeModal from '@/components/ShareCodeModal'
import EditGoalModal from '@/components/EditGoalModal'
import ContributeModal from '@/components/ContributeModal'
import ConfirmModal from '@/components/ConfirmModal'
import GoalDetailPanel from '@/components/GoalDetailPanel'

interface GoalCardProps {
  meta: Meta
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GoldSparkles({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            backgroundColor: i % 2 === 0 ? '#c9a84c' : '#d4b86a',
            animation: `sparkle ${0.4 + Math.random() * 0.6}s ease-out ${Math.random() * 0.4}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

export default function GoalCard({ meta }: GoalCardProps) {
  const { user } = useAuth()
  const deleteGoal = useDeleteGoal()
  const [showDetail, setShowDetail] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showContribute, setShowContribute] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const { data: detail } = useGoalDetail(meta.id)

  const metaData = detail ?? meta
  const miembros = metaData.miembros
  const isShared = (miembros?.length ?? 0) > 1
  const codigo = metaData.codigoCompartir ?? meta.codigoCompartir
  const isOwner = user?.uid === meta.creadoPor
  const progressPct = Math.min(100, Math.round((metaData.montoAcumulado / metaData.montoObjetivo) * 100))
  const isActive = meta.estado === 'activo'
  const isComplete = progressPct >= 100

  useEffect(() => {
    if (isComplete && isActive) setCelebrating(true)
  }, [isComplete, isActive])

  useEffect(() => {
    if (celebrating) {
      const t = setTimeout(() => setCelebrating(false), 2500)
      return () => clearTimeout(t)
    }
  }, [celebrating])

  const creador = miembros?.find((m) => m.rol === 'creador')
  const creatorName = creador
    ? creador.email === user?.email ? user?.displayName ?? 'Tú' : creador.email.split('@')[0]
    : isOwner ? user?.displayName ?? 'Tú'
    : null

  const accentBorder = isShared ? 'border-l-accent' : 'border-l-primary'
  const accentBadge = isShared
    ? 'bg-accent/15 text-accent-light border-accent/20'
    : 'bg-primary/10 text-primary border-primary/15'
  const typeLabel = isShared ? 'Grupal' : 'Individual'
  const progressBar = isShared ? 'bg-accent' : 'progress-gold'

  const statusCfg = meta.estado === 'completado'
    ? { badge: 'bg-success/15 text-success border-success/20', label: 'Completada' }
    : meta.estado === 'cancelado'
    ? { badge: 'bg-white/5 text-ink-muted border-border', label: 'Cancelada' }
    : null

  const handleDelete = async () => {
    try {
      await deleteGoal.mutateAsync(meta.id)
      sileo.info(`Meta "${meta.nombre}" eliminada`)
      setConfirmDelete(false)
    } catch { sileo.error('Error al eliminar la meta') }
  }

  const paceEmoji = isComplete ? '🏆' : progressPct >= 75 ? '🔥' : progressPct >= 50 ? '⚡' : progressPct >= 25 ? '🌱' : '🪙'

  return (
    <article className={`relative glass rounded-2xl border-l-4 ${accentBorder} card-hover ${celebrating ? 'vault-glow' : ''}`} style={{ animation: celebrating ? 'vault-glow 1s ease-in-out 2' : undefined }}>
      <GoldSparkles show={celebrating && isComplete} />

      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink truncate">{meta.nombre}</h3>
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${accentBadge}`}>
              {typeLabel}
            </span>
            {statusCfg && (
              <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusCfg.badge}`}>
                {statusCfg.label}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold tabular-nums text-ink tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ${metaData.montoAcumulado.toLocaleString()}
              </span>
              <span className="text-xs text-ink-muted" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                / ${metaData.montoObjetivo.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                {paceEmoji} {progressPct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${progressBar}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            {creatorName && (
              <span className="inline-flex items-center gap-1 text-ink-muted">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {creatorName}
              </span>
            )}
            <span className="text-ink-muted">{formatDate(meta.fechaLimite)}</span>
            <span className="text-ink-muted">{meta.mesesRestantes} {meta.mesesRestantes === 1 ? 'mes' : 'meses'}</span>
          </div>

          {miembros && miembros.length > 0 && isShared && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {miembros.slice(0, 5).map((m) => (
                  <div
                    key={m.email}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0a0e14] text-[9px] font-bold text-white ring-1 ring-border ${m.rol === 'creador' ? 'bg-accent' : 'bg-accent-light'}`}
                    title={`${m.email.split('@')[0]} — $${m.saldoAportado.toLocaleString()}`}
                  >
                    {m.email.charAt(0).toUpperCase()}
                  </div>
                ))}
                {miembros.length > 5 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0a0e14] bg-accent/15 text-[9px] font-semibold text-accent-light ring-1 ring-border">
                    +{miembros.length - 5}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-ink-muted">
                {miembros.length} {miembros.length === 1 ? 'persona' : 'personas'}
              </span>
            </div>
          )}

          {metaData.checklist && metaData.checklist.length > 0 && (
            <div className="flex items-center gap-2">
              <svg className="h-3 w-3 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-[10px] text-ink-muted">
                {metaData.checklist.filter((i) => i.completado).length}/{metaData.checklist.length} tareas
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-start gap-1">
          {isActive && (
            <button onClick={() => setShowContribute(true)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-[#0a0e14] shadow-sm transition-all hover:bg-primary-light active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-primary/30">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Aportar</span>
            </button>
          )}
          <button onClick={() => setShowDetail(true)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-[10px] font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition-all active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-primary/20" title="Detalle">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="hidden sm:inline">Detalle</span>
          </button>
          {isShared && (
            <button onClick={() => setShowShare(true)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-[10px] font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition-all active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-primary/20" title="Compartir">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          )}
          {isOwner && (
            <>
              <button onClick={() => setShowEdit(true)} className="inline-flex items-center rounded-lg border border-border bg-surface p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-all active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-primary/20" title="Editar">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center rounded-lg border border-border bg-surface p-1.5 text-ink-muted hover:border-danger/50 hover:bg-danger/10 hover:text-danger transition-all active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-danger/20" title="Eliminar">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {deleteGoal.isError && (
        <div className="border-t border-danger/30 bg-danger/10 px-4 py-2 text-[11px] text-danger">
          {deleteGoal.error instanceof Error ? deleteGoal.error.message : 'Error al eliminar'}
        </div>
      )}

      {createPortal(<ShareCodeModal open={showShare} onClose={() => setShowShare(false)} codigo={codigo} metaNombre={meta.nombre} />, document.body)}
      {createPortal(<EditGoalModal open={showEdit} onClose={() => setShowEdit(false)} meta={metaData} />, document.body)}
      {createPortal(<ContributeModal open={showContribute} onClose={() => setShowContribute(false)} meta={metaData} />, document.body)}
      {createPortal(<GoalDetailPanel open={showDetail} onClose={() => setShowDetail(false)} meta={metaData} />, document.body)}
      {createPortal(<ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} title="Eliminar meta" message={`¿Eliminar "${meta.nombre}"? No se puede deshacer.`} confirmLabel="Eliminar" danger loading={deleteGoal.isPending} />, document.body)}
    </article>
  )
}
