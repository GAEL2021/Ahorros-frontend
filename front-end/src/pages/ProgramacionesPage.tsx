import { useState } from 'react'
import { useFetchProgramaciones } from '@/hooks/useFetchProgramaciones'
import { useCreateProgramacion } from '@/hooks/useCreateProgramacion'
import { useDeleteProgramacion } from '@/hooks/useDeleteProgramacion'
import { useToggleProgramacion } from '@/hooks/useToggleProgramacion'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { sileo } from '@/lib/sileo'
import type { CreateProgramacionPayload } from '@/types'

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center animate-fade-in">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink">Sin programaciones</h3>
      <p className="mt-1.5 text-sm text-ink-muted">
        Programa aportes automaticos desde tus carteras hacia tus metas.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nueva programacion
      </button>
    </div>
  )
}

function CreateProgramacionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProgramacion()
  const { data: bancos } = useFetchBancos()
  const { data: goals } = useFetchGoals()

  const [carteraId, setCarteraId] = useState('')
  const [metaId, setMetaId] = useState('')
  const [tipo, setTipo] = useState<'fijo' | 'porcentaje'>('fijo')
  const [monto, setMonto] = useState(0)
  const [porcentaje, setPorcentaje] = useState(10)
  const [diaDelMes, setDiaDelMes] = useState(1)

  if (!open) return null

  const activeGoals = goals?.filter((g) => g.estado === 'activo') ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreateProgramacionPayload = {
      carteraId,
      metaId,
      tipo,
      diaDelMes,
    }
    if (tipo === 'fijo') payload.monto = monto
    else payload.porcentaje = porcentaje

    try {
      await create.mutateAsync(payload)
      const cartera = bancos?.find((b) => b.id === carteraId)
      const meta = goals?.find((g) => g.id === metaId)
      sileo.success(`Programacion creada: ${cartera?.nombre ?? '?'} -> ${meta?.nombre ?? '?'}`)
      onClose()
      resetForm()
    } catch {
      sileo.error('Error al crear programacion')
    }
  }

  const resetForm = () => {
    setCarteraId('')
    setMetaId('')
    setTipo('fijo')
    setMonto(0)
    setPorcentaje(10)
    setDiaDelMes(1)
  }

  const handleClose = () => {
    onClose()
    if (!create.isPending) resetForm()
  }

  const days = Array.from({ length: 28 }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0">
          <h2 className="text-base font-semibold text-ink">Nueva Programacion</h2>
          <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {(!bancos || bancos.length === 0) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Necesitas crear al menos una cartera primero.
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Cartera origen</label>
            <select value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
              <option value="" disabled>Seleccionar cartera</option>
              {bancos?.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre} (${b.saldo.toLocaleString()})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Meta destino</label>
            <select value={metaId} onChange={(e) => setMetaId(e.target.value)} required className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
              <option value="" disabled>Seleccionar meta activa</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Tipo de aporte</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button type="button" onClick={() => setTipo('fijo')} className={`flex-1 px-3 py-2 text-[11px] font-semibold transition-colors ${tipo === 'fijo' ? 'bg-amber-100 text-amber-700' : 'bg-white text-ink-muted hover:bg-surface-raised'}`}>
                Monto fijo
              </button>
              <button type="button" onClick={() => setTipo('porcentaje')} className={`flex-1 px-3 py-2 text-[11px] font-semibold transition-colors ${tipo === 'porcentaje' ? 'bg-amber-100 text-amber-700' : 'bg-white text-ink-muted hover:bg-surface-raised'}`}>
                Porcentaje
              </button>
            </div>
          </div>
          {tipo === 'fijo' ? (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Monto a transferir ($)</label>
              <input type="number" min={1} value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} required placeholder="50000" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Porcentaje del saldo (%)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={1} max={100} value={porcentaje} onChange={(e) => setPorcentaje(Number(e.target.value))} className="flex-1" />
                <span className="text-sm font-semibold text-ink w-10 text-right">{porcentaje}%</span>
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Dia del mes</label>
            <select value={diaDelMes} onChange={(e) => setDiaDelMes(Number(e.target.value))} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {create.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {create.error instanceof Error ? create.error.message : 'Error al crear'}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            <button type="submit" disabled={create.isPending || !carteraId || !metaId} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
              {create.isPending ? 'Creando...' : 'Crear programacion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProgramacionesPage() {
  const { data: programaciones, isLoading } = useFetchProgramaciones()
  const { data: bancos } = useFetchBancos()
  const { data: goals } = useFetchGoals()
  const deleteProg = useDeleteProgramacion()
  const toggleProg = useToggleProgramacion()
  const [showCreate, setShowCreate] = useState(false)

  const getBancoName = (id: string) => bancos?.find((b) => b.id === id)?.nombre ?? id
  const getBancoColor = (id: string) => bancos?.find((b) => b.id === id)?.color ?? '#94a3b8'
  const getMetaName = (id: string) => goals?.find((g) => g.id === id)?.nombre ?? id

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-ink">Programaciones</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {programaciones && programaciones.length > 0
              ? `${programaciones.length} programacion(es) configurada(s)`
              : 'Automatiza aportes desde tus carteras a tus metas'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva programacion
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-border bg-white py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-amber-600" />
            <p className="text-sm text-ink-muted">Cargando programaciones...</p>
          </div>
        </div>
      )}

      {!isLoading && programaciones && programaciones.length === 0 && (
        <EmptyState onCreateClick={() => setShowCreate(true)} />
      )}

      {!isLoading && programaciones && programaciones.length > 0 && (
        <div className="space-y-3">
          {programaciones.map((prog) => {
            const bancoColor = getBancoColor(prog.carteraId)
            return (
              <div
                key={prog.id}
                className="rounded-lg border border-border bg-white border-l-4 animate-slide-up overflow-hidden"
                style={{ borderLeftColor: bancoColor }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: bancoColor }}>
                      {getBancoName(prog.carteraId).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink truncate">{getBancoName(prog.carteraId)}</span>
                        <svg className="h-3 w-3 flex-shrink-0 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="text-sm font-medium text-ink truncate">{getMetaName(prog.metaId)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-ink-muted">
                          {prog.tipo === 'fijo'
                            ? `$${prog.monto?.toLocaleString() ?? 0} fijo`
                            : `${prog.porcentaje ?? 0}% del saldo`}
                        </span>
                        <span className="text-[10px] text-ink-muted">·</span>
                        <span className="text-[11px] text-ink-muted">Dia {prog.diaDelMes} de cada mes</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleProg.mutate(prog.id, {
                        onError: () => sileo.error('Error al cambiar estado'),
                      })}
                      className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${prog.activo ? 'bg-amber-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${prog.activo ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProg.mutate(prog.id, {
                        onSuccess: () => sileo.info('Programacion eliminada'),
                        onError: () => sileo.error('Error al eliminar'),
                      })}
                      className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateProgramacionModal open={showCreate} onClose={() => setShowCreate(false)} />
    </main>
  )
}
