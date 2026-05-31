import { useState, useEffect, useMemo } from 'react'
import { useFetchBancos, useBancoDetail } from '@/hooks/useFetchBancos'
import { useCreateBanco } from '@/hooks/useCreateBanco'
import { useUpdateBanco } from '@/hooks/useUpdateBanco'
import { useDeleteBanco } from '@/hooks/useDeleteBanco'
import { useDepositarBanco } from '@/hooks/useDepositarBanco'
import { useRetirarBanco } from '@/hooks/useRetirarBanco'
import { useJoinBanco } from '@/hooks/useJoinBanco'
import { useBancosDisponibles } from '@/hooks/useBancosDisponibles'
import { sileo } from '@/lib/sileo'
import { FilterBar } from '@/components/FilterBar'
import type { Cartera } from '@/types'

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20" style={{ animation: 'float 3s ease-in-out infinite' }}>
        <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink">No tienes carteras</h3>
      <p className="mt-1.5 text-sm text-ink-muted">Registra tus cuentas bancarias y administra tus ahorros.</p>
      <button type="button" onClick={onCreateClick} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        Nueva cartera
      </button>
    </div>
  )
}

function CreateCarteraModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createBanco = useCreateBanco()
  const { data: bancosDisponibles } = useBancosDisponibles()
  const [catalogoBancoId, setCatalogoBancoId] = useState('')
  const [saldoInicial, setSaldoInicial] = useState(0)
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<'personal' | 'compartida'>('personal')
  const [invitadoEmail, setInvitadoEmail] = useState('')
  const [invitadosEmails, setInvitadosEmails] = useState<string[]>([])

  if (!open) return null

  const addInvitado = () => {
    const email = invitadoEmail.trim()
    if (email && !invitadosEmails.includes(email)) {
      setInvitadosEmails([...invitadosEmails, email])
      setInvitadoEmail('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catalogoBancoId) return
    try {
      await createBanco.mutateAsync({
        catalogoBancoId,
        saldoInicial: saldoInicial || undefined,
        descripcion: descripcion || undefined,
        tipo,
        invitadosEmails: tipo === 'compartida' && invitadosEmails.length > 0 ? invitadosEmails : undefined,
      })
      const bancoNombre = bancosDisponibles?.find((c) => c.id === catalogoBancoId)?.nombre ?? 'Cartera'
      sileo.success(`Cartera "${bancoNombre}" creada`)
      onClose()
      resetForm()
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al crear la cartera')
    }
  }

  const resetForm = () => {
    setCatalogoBancoId('')
    setSaldoInicial(0)
    setDescripcion('')
    setTipo('personal')
    setInvitadosEmails([])
    setInvitadoEmail('')
  }

  const handleClose = () => { onClose(); if (!createBanco.isPending) resetForm() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Nueva Cartera</h2>
          <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Banco</label>
            <select value={catalogoBancoId} onChange={(e) => setCatalogoBancoId(e.target.value)} required className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="" disabled>Seleccionar banco</option>
              {bancosDisponibles?.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Saldo inicial (opcional)</label>
            <input type="number" min={0} value={saldoInicial || ''} onChange={(e) => setSaldoInicial(Number(e.target.value))} placeholder="0" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Descripción (opcional)</label>
            <input type="text" maxLength={200} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Cuenta de ahorros" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="rounded-lg border border-border bg-surface-raised px-4 py-3">
            <label className="mb-2 block text-[11px] font-semibold text-ink-secondary">Tipo de cartera</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button type="button" onClick={() => setTipo('personal')} className={`flex-1 px-3 py-2 text-[11px] font-semibold transition-colors ${tipo === 'personal' ? 'bg-primary text-white' : 'bg-surface text-ink-muted hover:bg-surface-raised'}`}>Personal</button>
              <button type="button" onClick={() => setTipo('compartida')} className={`flex-1 px-3 py-2 text-[11px] font-semibold transition-colors ${tipo === 'compartida' ? 'bg-accent text-white' : 'bg-surface text-ink-muted hover:bg-surface-raised'}`}>Compartida</button>
            </div>
            {tipo === 'compartida' && (
              <div className="mt-3 space-y-2 pt-3 border-t border-border-light">
                <label className="block text-[10px] font-semibold text-ink-muted">Invitar personas (email)</label>
                <div className="flex gap-2">
                  <input type="email" value={invitadoEmail} onChange={(e) => setInvitadoEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvitado() } }} placeholder="amigo@email.com" className="flex-1 rounded-lg border border-border px-3 py-2 text-[11px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <button type="button" onClick={addInvitado} className="rounded-lg bg-accent px-3 py-2 text-[11px] font-medium text-white hover:bg-accent/90 transition-colors">Agregar</button>
                </div>
                {invitadosEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {invitadosEmails.map((email) => (
                      <span key={email} className="inline-flex items-center gap-1 rounded-md bg-accent-subtle px-2.5 py-1 text-[11px] font-medium text-accent">
                        {email}
                        <button type="button" onClick={() => setInvitadosEmails(invitadosEmails.filter((e) => e !== email))} className="ml-0.5 hover:text-danger transition-colors">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            <button type="submit" disabled={createBanco.isPending || !catalogoBancoId} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {createBanco.isPending ? 'Creando...' : 'Crear cartera'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DepositarModal({ open, onClose, cartera }: { open: boolean; onClose: () => void; cartera: Cartera }) {
  const depositar = useDepositarBanco()
  const [monto, setMonto] = useState(0)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (monto < 1) return
    try {
      await depositar.mutateAsync({ id: cartera.id, payload: { monto } })
      sileo.success(`Depositaste $${monto.toLocaleString()} en "${cartera.nombre}"`)
      setMonto(0)
      onClose()
    } catch (err) { sileo.error(err instanceof Error ? err.message : 'Error al depositar') }
  }

  const handleClose = () => { if (!depositar.isPending) { setMonto(0); onClose() } }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Depositar en {cartera.nombre}</h2>
          <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-primary/10 bg-primary-subtle/50 px-4 py-3">
            <span className="text-[11px] text-ink-muted">Saldo actual</span>
            <p className="text-lg font-bold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${cartera.saldo.toLocaleString()}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Monto a depositar</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-ink-muted">$</span>
              <input type="number" min={1} value={monto || ''} onChange={(e) => setMonto(Math.max(0, Number(e.target.value) || 0))} placeholder="0" className="w-full rounded-lg border border-border bg-surface py-3 pl-9 pr-4 text-lg font-semibold placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={handleClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            <button type="submit" disabled={depositar.isPending || monto < 1} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {depositar.isPending ? 'Depositando...' : 'Depositar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RetirarModal({ open, onClose, cartera }: { open: boolean; onClose: () => void; cartera: Cartera }) {
  const retirar = useRetirarBanco()
  const [monto, setMonto] = useState(0)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (monto < 1) return
    try {
      await retirar.mutateAsync({ id: cartera.id, payload: { monto } })
      sileo.success(`Retiraste $${monto.toLocaleString()} de "${cartera.nombre}"`)
      setMonto(0)
      onClose()
    } catch (err) { sileo.error(err instanceof Error ? err.message : 'Error al retirar') }
  }

  const handleClose = () => { if (!retirar.isPending) { setMonto(0); onClose() } }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Retirar de {cartera.nombre}</h2>
          <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-primary/10 bg-primary-subtle/50 px-4 py-3">
            <span className="text-[11px] text-ink-muted">Saldo actual</span>
            <p className="text-lg font-bold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${cartera.saldo.toLocaleString()}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Monto a retirar</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-ink-muted">$</span>
              <input type="number" min={1} max={cartera.saldo} value={monto || ''} onChange={(e) => setMonto(Math.max(0, Math.min(cartera.saldo, Number(e.target.value) || 0)))} placeholder="0" className="w-full rounded-lg border border-border bg-surface py-3 pl-9 pr-4 text-lg font-semibold placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={handleClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            <button type="submit" disabled={retirar.isPending || monto < 1 || monto > cartera.saldo} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {retirar.isPending ? 'Retirando...' : 'Retirar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditCarteraModal({ open, onClose, cartera }: { open: boolean; onClose: () => void; cartera: Cartera }) {
  const updateBanco = useUpdateBanco()
  const [descripcion, setDescripcion] = useState(cartera.descripcion)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateBanco.mutateAsync({ id: cartera.id, payload: { descripcion: descripcion.trim() } })
      sileo.success(`Cartera "${cartera.nombre}" actualizada`)
      onClose()
    } catch (err) { sileo.error(err instanceof Error ? err.message : 'Error al actualizar') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Editar {cartera.nombre}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Descripción</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            <button type="submit" disabled={updateBanco.isPending} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {updateBanco.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ open, onClose, onConfirm, title, message, danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; danger?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            <button type="button" onClick={() => { onConfirm(); onClose() }} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'}`}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShareCodeModal({ open, onClose, codigo, carteraNombre }: { open: boolean; onClose: () => void; codigo: string; carteraNombre: string }) {
  if (!open) return null
  const copyToClipboard = () => {
    navigator.clipboard.writeText(codigo)
    sileo.info('Código copiado')
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Compartir "{carteraNombre}"</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 text-center">
          <p className="text-sm text-ink-muted mb-4">Comparte este código para que otros se unan a tu cartera</p>
          <div className="rounded-lg border-2 border-dashed border-accent/30 bg-accent-subtle px-4 py-4 mb-4">
            <span className="text-3xl font-bold text-accent tracking-[0.3em]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{codigo}</span>
          </div>
          <button type="button" onClick={copyToClipboard} className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors">
            Copiar código
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CarterasPage() {
  const { data: bancos, isLoading } = useFetchBancos()
  const deleteBanco = useDeleteBanco()
  const joinBanco = useJoinBanco()
  const [showCreate, setShowCreate] = useState(false)
  const [depositTarget, setDepositTarget] = useState<Cartera | null>(null)
  const [retiroTarget, setRetiroTarget] = useState<Cartera | null>(null)
  const [editTarget, setEditTarget] = useState<Cartera | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cartera | null>(null)
  const [shareTarget, setShareTarget] = useState<Cartera | null>(null)
  const [showJoinCode, setShowJoinCode] = useState(false)
  const [joinCodeValue, setJoinCodeValue] = useState('')
  const [selectedCarteraParaMovimientos, setSelectedCarteraParaMovimientos] = useState<Cartera | null>(null)
  const [filterText, setFilterText] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const totalSaldo = bancos?.reduce((sum, b) => sum + b.saldo, 0) ?? 0

  const filteredBancos = useMemo(() => {
    if (!bancos) return []
    const sorted = [...bancos].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    if (!filterText.trim()) return sorted
    const q = filterText.toLowerCase()
    return sorted.filter((b) => b.nombre.toLowerCase().includes(q) || b.descripcion?.toLowerCase().includes(q) || b.tipo.toLowerCase().includes(q))
  }, [bancos, filterText])

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-ink">Mis Carteras</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {bancos && bancos.length > 0
              ? `${bancos.length} cartera(s) · Total: $${totalSaldo.toLocaleString()}`
              : 'Administra tus cuentas bancarias'}
          </p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nueva cartera
        </button>
      </div>

      <div className="mb-6 animate-fade-in">
        {!showJoinCode ? (
          <button type="button" onClick={() => setShowJoinCode(true)} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-accent/30 px-4 py-2.5 text-sm font-medium text-accent hover:border-accent/40 hover:bg-accent-subtle/50 focus:outline-none focus:ring-2 focus:ring-accent/20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Unirse con código
          </button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
              <svg className="h-4 w-4 flex-shrink-0 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              <input type="text" value={joinCodeValue} onChange={(e) => setJoinCodeValue(e.target.value.toUpperCase())} placeholder="Código de 8 caracteres" maxLength={8} className="flex-1 bg-transparent text-sm tracking-[0.2em] text-ink placeholder:text-ink-muted focus:outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowJoinCode(false); setJoinCodeValue('') }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
              <button type="button" disabled={joinCodeValue.length !== 8 || joinBanco.isPending} onClick={() => joinBanco.mutate(joinCodeValue, {
                onSuccess: (data) => { setShowJoinCode(false); setJoinCodeValue(''); sileo.success(`Te uniste a "${data.nombre}"`) },
                onError: () => sileo.error('Error al unirse a la cartera'),
              })} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors">
                {joinBanco.isPending ? 'Uniéndose...' : 'Unirse'}
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3 w-16" />
                </div>
              </div>
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="flex gap-2">
                <div className="skeleton h-8 flex-1 rounded-xl" />
                <div className="skeleton h-8 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!bancos || bancos.length === 0) && <EmptyState onCreateClick={() => setShowCreate(true)} />}

      {!isLoading && bancos && bancos.length > 0 && (
        <>
          <FilterBar
            filterText={filterText}
            setFilterText={setFilterText}
            viewMode={viewMode}
            setViewMode={setViewMode}
            resultsCount={filteredBancos.length}
            typeOptions={[
              { label: 'Personal', value: 'personal' },
              { label: 'Compartida', value: 'compartida' },
            ]}
          />

          {viewMode === 'cards' ? (
            <div className="space-y-3 stagger animate-fade-in">
              {filteredBancos.map((banco) => (
                <div key={banco.id} className="savesmart-card bg-surface overflow-hidden flex flex-col" style={{ borderLeft: `5px solid ${banco.color}` }}>
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ backgroundColor: banco.color }}>
                          {banco.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-ink truncate">{banco.nombre}</h3>
                            {banco.tipo === 'compartida' && (
                              <span className="inline-flex items-center rounded-full bg-accent-subtle px-2 py-0.5 text-[9px] font-bold text-accent border border-accent/20">Compartida</span>
                            )}
                          </div>
                          {banco.descripcion && <p className="text-[11px] text-ink-muted truncate max-w-[140px] mt-0.5">{banco.descripcion}</p>}
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {banco.tipo === 'compartida' && banco.codigoCompartir && (
                          <button onClick={() => setShareTarget(banco)} className="rounded-xl p-1.5 text-ink-muted hover:bg-accent-subtle hover:text-accent transition-colors" title="Compartir">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          </button>
                        )}
                        <button onClick={() => setEditTarget(banco)} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface-raised transition-colors" title="Editar">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setDeleteTarget(banco)} className="rounded-xl p-1.5 text-ink-muted hover:bg-danger/10 hover:text-danger transition-colors" title="Eliminar">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border-light bg-surface-raised px-4 py-3 mb-1">
                      <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Saldo</span>
                      <p className="text-xl font-extrabold text-ink mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${banco.saldo.toLocaleString()}</p>
                    </div>
                  </div>
                  {/* Card Footer */}
                  <div className="mt-auto border-t border-border-light">
                    <div className="grid grid-cols-2">
                      <button onClick={() => setDepositTarget(banco)} className="inline-flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-primary hover:bg-primary-subtle/30 transition-colors border-r border-border-light">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Depositar
                      </button>
                      <button onClick={() => setRetiroTarget(banco)} disabled={banco.saldo <= 0} className="inline-flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-accent hover:bg-accent-subtle/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                        Retirar
                      </button>
                    </div>
                    <div className="border-t border-border-light">
                      <button onClick={() => setSelectedCarteraParaMovimientos(banco)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Ver movimientos
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="savesmart-table-container bg-surface animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left savesmart-table">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised text-[11px] uppercase tracking-wider text-ink-muted">
                      <th className="px-5 py-4 font-semibold">Nombre</th>
                      <th className="px-5 py-4 font-semibold">Tipo</th>
                      <th className="px-5 py-4 font-semibold text-right">Saldo</th>
                      <th className="px-5 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBancos.map((banco) => (
                      <tr key={banco.id} className="border-b border-border-light hover:bg-surface-raised/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: banco.color }}>
                              {banco.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-ink text-sm">{banco.nombre}</span>
                              {banco.descripcion && <p className="text-[10px] text-ink-muted truncate">{banco.descripcion}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${banco.tipo === 'compartida' ? 'bg-accent-subtle text-accent' : 'bg-primary-subtle text-primary-dark'}`}>
                            {banco.tipo === 'compartida' ? 'Compartida' : 'Personal'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-ink">${banco.saldo.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {banco.tipo === 'compartida' && banco.codigoCompartir && (
                              <button onClick={() => setShareTarget(banco)} className="rounded p-1.5 text-ink-muted hover:bg-accent-subtle hover:text-accent transition-colors" title="Compartir">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                              </button>
                            )}
                            <button onClick={() => setDepositTarget(banco)} className="rounded p-1.5 text-primary-dark hover:bg-primary-subtle transition-colors" title="Depositar">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={() => setRetiroTarget(banco)} disabled={banco.saldo <= 0} className="rounded p-1.5 text-accent hover:bg-accent-subtle transition-colors disabled:opacity-40" title="Retirar">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                            </button>
                            <button onClick={() => setSelectedCarteraParaMovimientos(banco)} className="rounded p-1.5 text-ink-muted hover:bg-surface-raised transition-colors" title="Movimientos">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button onClick={() => setEditTarget(banco)} className="rounded p-1.5 text-ink-muted hover:bg-surface-raised transition-colors" title="Editar">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => setDeleteTarget(banco)} className="rounded p-1.5 text-ink-muted hover:bg-danger/10 hover:text-danger transition-colors" title="Eliminar">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <CreateCarteraModal open={showCreate} onClose={() => setShowCreate(false)} />
      {depositTarget && <DepositarModal open={!!depositTarget} onClose={() => setDepositTarget(null)} cartera={depositTarget} />}
      {retiroTarget && <RetirarModal open={!!retiroTarget} onClose={() => setRetiroTarget(null)} cartera={retiroTarget} />}
      {editTarget && <EditCarteraModal open={!!editTarget} onClose={() => setEditTarget(null)} cartera={editTarget} />}
      {deleteTarget && (
        <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={async () => {
          try { await deleteBanco.mutateAsync(deleteTarget.id); sileo.success(`Cartera "${deleteTarget.nombre}" eliminada`) } catch (err) { sileo.error(err instanceof Error ? err.message : 'Error al eliminar') }
          setDeleteTarget(null)
        }} title="Eliminar cartera" message={`¿Eliminar "${deleteTarget.nombre}"? Esta acción no se puede deshacer.`} danger />
      )}
      {shareTarget && <ShareCodeModal open={!!shareTarget} onClose={() => setShareTarget(null)} codigo={shareTarget.codigoCompartir} carteraNombre={shareTarget.nombre} />}
      {selectedCarteraParaMovimientos && (
        <CarteraMovimientosDrawer
          open={!!selectedCarteraParaMovimientos}
          onClose={() => setSelectedCarteraParaMovimientos(null)}
          cartera={selectedCarteraParaMovimientos}
        />
      )}
    </main>
  )
}

function CarteraMovimientosDrawer({ open, onClose, cartera }: { open: boolean; onClose: () => void; cartera: Cartera }) {
  const { data: detail, isLoading } = useBancoDetail(cartera.id)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  const transacciones = detail?.transacciones ?? []
  const totalIngresos = transacciones.filter((t) => t.tipo === 'deposito').reduce((sum, t) => sum + t.monto, 0)
  const totalEgresos = transacciones.filter((t) => t.tipo === 'retiro' || t.tipo === 'aporte_meta' || (t as any).esChecklist).reduce((sum, t) => sum + t.monto, 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" onClick={onClose} />
      <div className="relative z-50 flex h-full w-full flex-col border-l border-border bg-[var(--bg-sidebar)] shadow-2xl transition-transform duration-300 ease-in-out sm:w-[420px] animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: cartera.color }}>
              {cartera.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink truncate">{cartera.nombre}</h2>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Movimientos</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-ink-muted hover:bg-surface hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {/* Balance summary */}
        <div className="border-b border-border bg-surface-raised px-5 py-3 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-success/20 bg-success/5 px-3 py-2.5">
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block mb-0.5">Saldo Real</span>
              <p className="text-base font-bold text-success font-mono">${cartera.saldo.toLocaleString()}</p>
              <p className="text-[9px] text-ink-muted mt-0.5">Disponible en cuenta</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block mb-0.5">Saldo Estimado</span>
              <p className="text-base font-bold text-primary-dark font-mono">${(cartera.saldo + totalEgresos).toLocaleString()}</p>
              <p className="text-[9px] text-ink-muted mt-0.5">Real + egresos acumulados</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 border-b border-border bg-surface px-5 py-3 flex-shrink-0">
          <div className="rounded-xl border border-success/15 bg-success-subtle/30 p-2.5">
            <span className="text-[9px] font-semibold text-ink-muted uppercase tracking-wider">Total Aportado</span>
            <p className="text-sm font-bold text-success font-mono mt-0.5">+${totalIngresos.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-danger/15 bg-danger-subtle/30 p-2.5">
            <span className="text-[9px] font-semibold text-ink-muted uppercase tracking-wider">Total Debitado</span>
            <p className="text-sm font-bold text-danger font-mono mt-0.5">-${totalEgresos.toLocaleString()}</p>
          </div>
        </div>
        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                  <div className="flex justify-between items-center"><div className="skeleton h-3 w-16" /><div className="skeleton h-3.5 w-12" /></div>
                  <div className="skeleton h-3 w-32" />
                </div>
              ))}
            </div>
          ) : transacciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
              <h3 className="text-xs font-semibold text-ink">Sin movimientos</h3>
              <p className="mt-1 text-[11px] text-ink-muted">Esta cartera aún no registra depósitos, retiros ni aportes.</p>
            </div>
          ) : (
            transacciones.map((t) => {
              const isIncome = t.tipo === 'deposito'
              const isChecklist = (t as any).esChecklist === true || t.descripcion?.startsWith('Compra checklist:')
              const metaNombre = (t as any).metaNombre as string | undefined
              return (
                <div key={t.id} className={`rounded-xl border bg-surface p-3 hover:bg-surface-raised transition-colors animate-fade-in ${isChecklist ? 'border-danger/20' : 'border-border'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`h-7 w-7 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-success/10 text-success' : isChecklist ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
                        {isIncome ? (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5-5v12" /></svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink leading-snug">{t.descripcion}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[10px] text-ink-muted">
                            {new Date(t.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {(t as any).usuarioNombre && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised border border-border px-1.5 py-0.5 text-[9px] font-semibold text-ink-muted" title={(t as any).usuarioEmail}>
                              👤 {(t as any).usuarioNombre}
                            </span>
                          )}
                          {isChecklist && <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-[9px] font-bold text-danger border border-danger/20">Checklist</span>}
                          {metaNombre && <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary-dark border border-primary/20 max-w-[120px] truncate">{metaNombre}</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`font-mono text-sm font-bold flex-shrink-0 ${isIncome ? 'text-success' : 'text-danger'}`}>
                      {isIncome ? '+' : '-'}${t.monto.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
