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

interface GoalCardProps { meta: Meta }

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GoldSparkles({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full" style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%`, backgroundColor: i % 2 === 0 ? '#c9a84c' : '#d4b86a', animation: `sparkle ${0.4 + Math.random() * 0.6}s ease-out ${Math.random() * 0.4}s forwards`, opacity: 0 }} />
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

  useEffect(() => { if (isComplete && isActive) setCelebrating(true) }, [isComplete, isActive])
  useEffect(() => { if (celebrating) { const t = setTimeout(() => setCelebrating(false), 2500); return () => clearTimeout(t) } }, [celebrating])

  const creador = miembros?.find((m) => m.rol === 'creador')
  const creatorName = creador ? creador.email === user?.email ? user?.displayName ?? 'Tú' : creador.email.split('@')[0] : isOwner ? user?.displayName ?? 'Tú' : null
  const accentBadge = isShared ? 'bg-accent/15 text-accent-light border-accent/20' : 'bg-primary/10 text-primary border-primary/15'
  const typeLabel = isShared ? 'Grupal' : 'Individual'
  const progressBar = isComplete ? 'bg-success' : isShared ? 'bg-accent' : 'progress-gold'
  const statusCfg = meta.estado === 'completado' ? { badge: 'bg-success/15 text-success border-success/20', label: 'Completada' } : meta.estado === 'cancelado' ? { badge: 'bg-ink/5 text-ink-muted border-border', label: 'Cancelada' } : null
  const paceEmoji = isComplete ? '🏆' : progressPct >= 75 ? '🔥' : progressPct >= 50 ? '⚡' : progressPct >= 25 ? '🌱' : '🪙'

  const handleDelete = async () => { try { await deleteGoal.mutateAsync(meta.id); sileo.info(`Meta "${meta.nombre}" eliminada`); setConfirmDelete(false) } catch { sileo.error('Error al eliminar la meta') } }

  return (
    <article className={`relative savesmart-card bg-surface overflow-hidden flex flex-col justify-between p-5 ${celebrating ? 'vault-glow' : ''}`} style={{ borderLeft: `5px solid ${isComplete ? 'var(--success)' : isShared ? 'var(--purple)' : 'var(--lilac)'}` }}>
      <GoldSparkles show={celebrating && isComplete} />

      <div>
        {/* Header: Title + badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-base font-bold text-ink truncate leading-tight">{meta.nombre}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${accentBadge}`}>{typeLabel}</span>
              {statusCfg && <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusCfg.badge}`}>{statusCfg.label}</span>}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-extrabold rounded-full px-2.5 py-1 flex-shrink-0 ml-2 ${isComplete ? 'text-success bg-success/10' : 'text-primary bg-primary/10'}`}>{paceEmoji} {progressPct}%</span>
        </div>

        {/* Money bar */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-2xl font-extrabold tabular-nums text-ink tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${metaData.montoAcumulado.toLocaleString()}</span>
            <span className="text-xs text-ink-muted" style={{ fontFamily: "'JetBrains Mono', monospace" }}>/ ${metaData.montoObjetivo.toLocaleString()}</span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-ink/5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${progressBar}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted mb-4 border-t border-border/40 pt-3">
          {creatorName && (
            <span className="inline-flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {creatorName}
            </span>
          )}
          <span>{formatDate(meta.fechaLimite)}</span>
          <span className="bg-ink/5 px-2 py-0.5 rounded-md">{meta.mesesRestantes} {meta.mesesRestantes === 1 ? 'mes' : 'meses'}</span>
          {miembros && miembros.length > 0 && isShared && (
            <span className="bg-accent-subtle/40 text-accent px-2 py-0.5 rounded-md font-semibold">{miembros.length} miembros 👥</span>
          )}
          {metaData.checklist && metaData.checklist.length > 0 && (
            <span className="bg-success-subtle text-success px-2 py-0.5 rounded-md font-semibold">{metaData.checklist.filter((i) => i.completado).length}/{metaData.checklist.length} ✅</span>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/30">
        {isActive && (
          <button onClick={() => setShowContribute(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.96]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Aportar
          </button>
        )}
        <button onClick={() => setShowDetail(true)} className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink transition-all active:scale-[0.96]" title="Detalle">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          Detalle
        </button>
        <button onClick={() => setShowShare(true)} className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink-muted hover:bg-surface-raised hover:text-ink transition-all active:scale-[0.96]" title="Compartir">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Compartir
        </button>
        {isOwner && (
          <button onClick={() => setShowEdit(true)} className="inline-flex items-center justify-center rounded-2xl border border-border bg-surface p-2.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-all active:scale-[0.96]" title="Editar">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        )}
      </div>

      {createPortal(<ShareCodeModal open={showShare} onClose={() => setShowShare(false)} codigo={codigo} metaNombre={meta.nombre} />, document.body)}
      {createPortal(<EditGoalModal open={showEdit} onClose={() => setShowEdit(false)} meta={metaData} />, document.body)}
      {createPortal(<ContributeModal open={showContribute} onClose={() => setShowContribute(false)} meta={metaData} />, document.body)}
      {createPortal(<GoalDetailPanel open={showDetail} onClose={() => setShowDetail(false)} meta={metaData} />, document.body)}
      {createPortal(<ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} title="Eliminar meta" message={`¿Eliminar "${meta.nombre}"? No se puede deshacer.`} confirmLabel="Eliminar" danger loading={deleteGoal.isPending} />, document.body)}
    </article>
  )
}
