import { useState } from 'react'
import { useCreateGoal } from '@/hooks/useCreateGoal'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { sileo } from '@/lib/sileo'
import SearchableSelect from '@/components/ui/SearchableSelect'
import type { CreateGoalPayload } from '@/types'

interface CreateGoalModalProps { open: boolean; onClose: () => void }

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
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!open) return null

  const addInvitado = () => { const e = invitadoEmail.trim(); if (e && !invitadosEmails.includes(e)) { setInvitadosEmails([...invitadosEmails, e]); setInvitadoEmail('') } }
  const removeInvitado = (e: string) => setInvitadosEmails(invitadosEmails.filter((x) => x !== e))
  const resetForm = () => { setNombre(''); setMontoObjetivo(0); setFechaLimite(''); setInvitadosEmails([]); setInvitadoEmail(''); setModoAporte('manual'); setCarteraId(''); setProgTipo('fijo'); setProgMonto(0); setProgPorcentaje(10); setProgDia(1); setShowAdvanced(false) }
  const days = Array.from({ length: 28 }, (_, i) => i + 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreateGoalPayload = { nombre, montoObjetivo, fechaLimite: fechaLimite || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0], invitadosEmails: invitadosEmails.length > 0 ? invitadosEmails : undefined, modoAporte }
    if (modoAporte === 'automatico' && carteraId) { payload.carteraId = carteraId; payload.programacionTipo = progTipo; if (progTipo === 'fijo') payload.programacionMonto = progMonto; else payload.programacionPorcentaje = progPorcentaje; payload.programacionDia = progDia }
    try { await createGoal.mutateAsync(payload); sileo.success(`Meta "${nombre}" creada`); onClose(); resetForm() } catch { sileo.error('Error al crear la meta') }
  }

  const handleClose = () => { onClose(); if (!createGoal.isPending) resetForm() }

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col animate-fade-in">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-ink">Nueva Meta</h2>
        <button type="button" onClick={handleClose} className="rounded-xl p-2 text-ink-muted hover:bg-surface hover:text-ink transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-5 sm:max-w-[80%] sm:mx-auto">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">¿Qué querés ahorrar?</label>
            <input type="text" required minLength={3} maxLength={120} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Viaje a la playa, Auto nuevo..." className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Monto objetivo</label>
              <div className="flex items-center rounded-xl border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden">
                <span className="pl-3.5 pr-1 text-base text-ink-muted">$</span>
                <input type="number" required min={1} inputMode="decimal" step="0.01" value={montoObjetivo || ''} onChange={(e) => setMontoObjetivo(Number(e.target.value))} placeholder="1,000,000" className="flex-1 py-3 pr-4 text-base font-mono bg-transparent placeholder:text-ink-muted/40 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Fecha límite</label>
              <input type="date" required value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          {/* Invitados */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Invitados (opcional)</label>
            <div className="flex gap-2">
              <input type="email" value={invitadoEmail} onChange={(e) => setInvitadoEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvitado() } }} placeholder="amigo@email.com" className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="button" onClick={addInvitado} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light transition-colors flex-shrink-0">Agregar</button>
            </div>
            {invitadosEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {invitadosEmails.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/15 px-2.5 py-1 text-xs font-medium text-primary">{email}<button type="button" onClick={() => removeInvitado(email)} className="hover:text-danger transition-colors">&times;</button></span>
                ))}
              </div>
            )}
          </div>

          {/* Advanced: Modo de aporte automático */}
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors w-full">
            <svg className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            Configuración avanzada
          </button>

          {showAdvanced && (
            <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-4 animate-slide-up">
              <label className="block text-sm font-semibold text-ink">Modo de aporte</label>
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button type="button" onClick={() => setModoAporte('manual')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${modoAporte === 'manual' ? 'bg-primary text-[var(--bg)]' : 'bg-surface text-ink-muted hover:bg-surface-raised'}`}>Manual</button>
                <button type="button" onClick={() => setModoAporte('automatico')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${modoAporte === 'automatico' ? 'bg-accent text-[var(--bg)]' : 'bg-surface text-ink-muted hover:bg-surface-raised'}`}>Automático</button>
              </div>

              {modoAporte === 'automatico' && (
                (!bancos || bancos.length === 0) ? (
                  <p className="text-sm text-ink-muted">Necesitás crear una cartera primero para usar aporte automático.</p>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-muted">Cartera origen</label>
                      <SearchableSelect options={(bancos ?? []).map((b) => ({ value: b.id, label: `${b.nombre}-${b.creadoPorNombre}-${b.tipoCuenta === 'credito' ? 'C' : 'D'}` }))} value={carteraId} onChange={setCarteraId} placeholder="Seleccionar cartera" required />
                    </div>
                    <div className="flex rounded-xl border border-border overflow-hidden">
                      <button type="button" onClick={() => setProgTipo('fijo')} className={`flex-1 py-2.5 text-xs font-semibold ${progTipo === 'fijo' ? 'bg-primary/10 text-primary' : 'text-ink-muted'}`}>Monto fijo</button>
                      <button type="button" onClick={() => setProgTipo('porcentaje')} className={`flex-1 py-2.5 text-xs font-semibold ${progTipo === 'porcentaje' ? 'bg-primary/10 text-primary' : 'text-ink-muted'}`}>Porcentaje</button>
                    </div>
                    {progTipo === 'fijo' ? (
                      <div className="flex items-center rounded-xl border border-border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 overflow-hidden"><span className="pl-3.5 pr-1 text-sm text-ink-muted">$</span><input type="number" min={1} inputMode="decimal" step="0.01" value={progMonto || ''} onChange={(e) => setProgMonto(Number(e.target.value))} placeholder="50,000" className="flex-1 py-3 pr-4 text-sm font-mono bg-transparent placeholder:text-ink-muted/40 focus:outline-none" /></div>
                    ) : (
                      <div className="flex items-center gap-3"><input type="range" min={1} max={100} value={progPorcentaje} onChange={(e) => setProgPorcentaje(Number(e.target.value))} className="flex-1 accent-primary" /><span className="text-sm font-bold text-ink w-10 text-right">{progPorcentaje}%</span></div>
                    )}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-muted">Día del mes</label>
                      <SearchableSelect options={days.map((d) => ({ value: String(d), label: `${d}` }))} value={String(progDia)} onChange={(v) => setProgDia(Number(v))} placeholder="Día del mes" />
                    </div>
                  </div>
                )
              )}
            </div>
          )}


          <button type="submit" disabled={createGoal.isPending || (modoAporte === 'automatico' && bancos && bancos.length > 0 && !carteraId)} className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30">
            {createGoal.isPending ? 'Creando...' : 'Crear meta'}
          </button>
        </form>
      </div>
    </div>
  )
}
