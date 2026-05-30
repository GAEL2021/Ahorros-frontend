import { useState } from 'react'
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

export default function GoalCard({ meta }: GoalCardProps) {
  const { user } = useAuth()
  const deleteGoal = useDeleteGoal()
  const [showDetail, setShowDetail] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showContribute, setShowContribute] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: detail } = useGoalDetail(meta.id)

  const metaData = detail ?? meta
  const miembros = metaData.miembros
  const isShared = (miembros?.length ?? 0) > 1
  const codigo = metaData.codigoCompartir ?? meta.codigoCompartir
  const isOwner = user?.uid === meta.creadoPor
  const progressPct = Math.min(100, Math.round((metaData.montoAcumulado / metaData.montoObjetivo) * 100))
  const isActive = meta.estado === 'activo'

  const creador = miembros?.find((m) => m.rol === 'creador')
  const creatorName = creador
    ? creador.email === user?.email ? user?.displayName ?? 'Tú' : creador.email.split('@')[0]
    : isOwner ? user?.displayName ?? 'Tú'
    : null

  const typeBorder = isShared ? 'border-l-violet-400' : 'border-l-primary'
  const typeBadge = isShared
    ? 'bg-violet-100 text-violet-700'
    : 'bg-green-100 text-green-700'
  const typeLabel = isShared ? 'Grupal' : 'Individual'
  const progressColor = isShared ? 'bg-violet-400/60' : 'bg-primary/60'

  const statusCfg = meta.estado === 'completado'
    ? { badge: 'bg-blue-100 text-blue-700', label: 'Completada' }
    : meta.estado === 'cancelado'
    ? { badge: 'bg-stone-100 text-stone-500', label: 'Cancelada' }
    : null

  const handleDelete = async () => {
    try {
      await deleteGoal.mutateAsync(meta.id)
      sileo.info(`Meta "${meta.nombre}" eliminada`)
      setConfirmDelete(false)
    } catch { sileo.error('Error al eliminar la meta') }
  }

  return (
    <article className={`rounded-lg border border-border bg-white border-l-4 ${typeBorder} animate-slide-up overflow-hidden`}>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {/* Row 1: Title + creator + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-ink truncate">{meta.nombre}</h3>
            {creatorName && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {creatorName}
              </span>
            )}
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeBadge}`}>
              {typeLabel}
            </span>
            {statusCfg && (
              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusCfg.badge}`}>
                {statusCfg.label}
              </span>
            )}
          </div>

          {/* Row 2: Date range + progress */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-medium text-ink-secondary shrink-0 tabular-nums">{formatDate(meta.creadoEn)}</span>
              <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${progressColor}`} style={{ width: `${progressPct}%` }} />
              </div>
              <span className="font-medium text-ink-secondary shrink-0 tabular-nums">{formatDate(meta.fechaLimite)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-ink-muted">Inicio</span>
              <span className="tabular-nums">
                <span className="font-semibold text-primary">${metaData.montoAcumulado.toLocaleString()}</span>
                <span className="text-ink-muted"> / </span>
                <span className="font-semibold text-ink">${metaData.montoObjetivo.toLocaleString()}</span>
                <span className="font-bold tabular-nums text-ink ml-1.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{progressPct}%</span>
              </span>
              <span className="text-ink-muted">{meta.mesesRestantes} {meta.mesesRestantes === 1 ? 'mes' : 'meses'} rest.</span>
            </div>
          </div>

          {/* Members — avatar pills */}
          {miembros && miembros.length > 0 && isShared && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {miembros.slice(0, 5).map((m) => (
                  <div
                    key={m.email}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white ring-1 ring-border ${m.rol === 'creador' ? 'bg-violet-500' : 'bg-violet-300'}`}
                    title={`${m.email.split('@')[0]} — $${m.saldoAportado.toLocaleString()}`}
                  >
                    {m.email.charAt(0).toUpperCase()}
                  </div>
                ))}
                {miembros.length > 5 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-[9px] font-semibold text-violet-600 ring-1 ring-border">
                    +{miembros.length - 5}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-ink-muted">
                {miembros.length} {miembros.length === 1 ? 'persona' : 'personas'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-start gap-1">
          {isActive && (
            <button onClick={() => setShowContribute(true)} className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-[10px] font-semibold text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Aportar</span>
            </button>
          )}
          <button onClick={() => setShowDetail(true)} className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1.5 text-[10px] font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20" title="Detalle">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="hidden sm:inline">Detalle</span>
          </button>
          <button onClick={() => setShowShare(true)} className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1.5 text-[10px] font-medium text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20" title="Compartir">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
          {isOwner && (
            <>
              <button onClick={() => setShowEdit(true)} className="inline-flex items-center rounded-md border border-border bg-white p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20" title="Editar">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center rounded-md border border-border bg-white p-1.5 text-ink-muted hover:border-danger hover:bg-red-50 hover:text-danger transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20" title="Eliminar">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {deleteGoal.isError && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-danger">
          {deleteGoal.error instanceof Error ? deleteGoal.error.message : 'Error al eliminar'}
        </div>
      )}

      <ShareCodeModal open={showShare} onClose={() => setShowShare(false)} codigo={codigo} metaNombre={meta.nombre} />
      <EditGoalModal open={showEdit} onClose={() => setShowEdit(false)} meta={metaData} />
      <ContributeModal open={showContribute} onClose={() => setShowContribute(false)} meta={metaData} />
      <GoalDetailPanel open={showDetail} onClose={() => setShowDetail(false)} meta={metaData} />
      <ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} title="Eliminar meta" message={`¿Estás seguro de que deseas eliminar "${meta.nombre}"? Esta acción no se puede deshacer.`} confirmLabel="Eliminar" danger loading={deleteGoal.isPending} />
    </article>
  )
}
