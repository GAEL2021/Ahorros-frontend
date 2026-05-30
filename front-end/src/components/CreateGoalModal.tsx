import { useState } from 'react'
import { useCreateGoal } from '@/hooks/useCreateGoal'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { sileo } from '@/lib/sileo'
import type { CreateGoalPayload } from '@/types'

interface CreateGoalModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateGoalModal({ open, onClose }: CreateGoalModalProps) {
  const createGoal = useCreateGoal()
  const { data: bancos } = useFetchBancos()
  const [nombre, setNombre] = useState('')
  const [montoObjetivo, setMontoObjetivo] = useState(0)
  const [fechaLimite, setFechaLimite] = useState('')
  const [invitadoEmail, setInvitadoEmail] = useState('')
  const [invitadosEmails, setInvitadosEmails] = useState<string[]>([])
  const [modoAporte, setModoAporte] = useState<'manual' | 'automatico'>('manual')
  const [carteraId, setCarteraId] = useState('')
  const [progTipo, setProgTipo] = useState<'fijo' | 'porcentaje'>('fijo')
  const [progMonto, setProgMonto] = useState(0)
  const [progPorcentaje, setProgPorcentaje] = useState(10)
  const [progDia, setProgDia] = useState(1)

  if (!open) return null

  const addInvitado = () => {
    const email = invitadoEmail.trim()
    if (email && !invitadosEmails.includes(email)) {
      setInvitadosEmails([...invitadosEmails, email])
      setInvitadoEmail('')
    }
  }

  const removeInvitado = (email: string) => {
    setInvitadosEmails(invitadosEmails.filter((e) => e !== email))
  }

  const resetForm = () => {
    setNombre('')
    setMontoObjetivo(0)
    setFechaLimite('')
    setInvitadosEmails([])
    setInvitadoEmail('')
    setModoAporte('manual')
    setCarteraId('')
    setProgTipo('fijo')
    setProgMonto(0)
    setProgPorcentaje(10)
    setProgDia(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreateGoalPayload = {
      nombre,
      montoObjetivo,
      fechaLimite: fechaLimite || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      invitadosEmails: invitadosEmails.length > 0 ? invitadosEmails : undefined,
      modoAporte,
    }
    if (modoAporte === 'automatico' && carteraId) {
      payload.carteraId = carteraId
      payload.programacionTipo = progTipo
      if (progTipo === 'fijo') {
        payload.programacionMonto = progMonto
      } else {
        payload.programacionPorcentaje = progPorcentaje
      }
      payload.programacionDia = progDia
    }
    try {
      await createGoal.mutateAsync(payload)
      sileo.success(`Meta "${nombre}" creada correctamente`)
      onClose()
      resetForm()
    } catch {
      sileo.error('Error al crear la meta')
    }
  }

  const handleClose = () => {
    onClose()
    if (!createGoal.isPending) resetForm()
  }

  const days = Array.from({ length: 28 }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-lg border border-border bg-white shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Nueva Meta</h2>
          <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Nombre</label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Fondo de emergencia grupal"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Monto objetivo ($)</label>
              <input
                type="number"
                required
                min={1}
                value={montoObjetivo || ''}
                onChange={(e) => setMontoObjetivo(Number(e.target.value))}
                placeholder="1000000"
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Fecha limite</label>
              <input
                type="date"
                required
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">
              Invitados (email) — opcional
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={invitadoEmail}
                onChange={(e) => setInvitadoEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvitado() } }}
                placeholder="amigo@email.com"
                className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <button type="button" onClick={addInvitado} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
                Agregar
              </button>
            </div>
            {invitadosEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {invitadosEmails.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 rounded-md bg-primary-subtle px-2.5 py-1 text-[11px] font-medium text-primary">
                    {email}
                    <button type="button" onClick={() => removeInvitado(email)} className="ml-0.5 hover:text-danger transition-colors">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modo de Aporte */}
          <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
            <label className="mb-2 block text-[11px] font-semibold text-ink-secondary">Modo de aporte</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setModoAporte('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold transition-colors ${
                  modoAporte === 'manual'
                    ? 'bg-primary text-white'
                    : 'bg-white text-ink-muted hover:bg-surface-raised'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Manual
              </button>
              <button
                type="button"
                onClick={() => setModoAporte('automatico')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold transition-colors ${
                  modoAporte === 'automatico'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-ink-muted hover:bg-surface-raised'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Automatico
              </button>
            </div>

            {modoAporte === 'automatico' && (
              <div className="mt-3 space-y-3 pt-3 border-t border-border-light">
                {(!bancos || bancos.length === 0) ? (
                  <p className="text-[11px] text-amber-700">
                    No tienes carteras. Crea una en la seccion "Carteras" primero para usar aporte automatico.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold text-ink-muted">Cartera origen</label>
                      <select
                        value={carteraId}
                        onChange={(e) => setCarteraId(e.target.value)}
                        required
                        className="w-full rounded-lg border border-border px-3 py-2 text-[11px] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="" disabled>Seleccionar cartera</option>
                        {bancos.map((b) => (
                          <option key={b.id} value={b.id}>{b.nombre} (${b.saldo.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold text-ink-muted">Tipo de aporte automatico</label>
                      <div className="flex rounded-lg border border-border overflow-hidden">
                        <button type="button" onClick={() => setProgTipo('fijo')} className={`flex-1 px-2.5 py-2 text-[10px] font-semibold transition-colors ${progTipo === 'fijo' ? 'bg-amber-100 text-amber-700' : 'bg-white text-ink-muted'}`}>Monto fijo</button>
                        <button type="button" onClick={() => setProgTipo('porcentaje')} className={`flex-1 px-2.5 py-2 text-[10px] font-semibold transition-colors ${progTipo === 'porcentaje' ? 'bg-amber-100 text-amber-700' : 'bg-white text-ink-muted'}`}>Porcentaje</button>
                      </div>
                    </div>

                    {progTipo === 'fijo' ? (
                      <div>
                        <label className="mb-1.5 block text-[10px] font-semibold text-ink-muted">Monto a transferir ($)</label>
                        <input type="number" min={1} value={progMonto || ''} onChange={(e) => setProgMonto(Number(e.target.value))} placeholder="Ej. 50000" className="w-full rounded-lg border border-border px-3 py-2 text-[11px] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1.5 block text-[10px] font-semibold text-ink-muted">Porcentaje del saldo (%)</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min={1} max={100} value={progPorcentaje} onChange={(e) => setProgPorcentaje(Number(e.target.value))} className="flex-1" />
                          <span className="text-[11px] font-semibold text-ink w-9 text-right">{progPorcentaje}%</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold text-ink-muted">Dia del mes</label>
                      <select value={progDia} onChange={(e) => setProgDia(Number(e.target.value))} className="w-full rounded-lg border border-border px-3 py-2 text-[11px] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                        {days.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {createGoal.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {createGoal.error instanceof Error ? createGoal.error.message : 'Error al crear la meta'}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createGoal.isPending || (modoAporte === 'automatico' && bancos && bancos.length > 0 && !carteraId)}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/30"
            >
              {createGoal.isPending ? 'Creando...' : 'Crear meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
