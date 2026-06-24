// @ts-nocheck
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useFetchTarjetas } from '@/hooks/useFetchTarjetas'
import { useCreateTarjeta } from '@/hooks/useCreateTarjeta'
import { useUpdateTarjeta } from '@/hooks/useUpdateTarjeta'
import { useDeleteTarjeta } from '@/hooks/useDeleteTarjeta'
import { usePagarTarjeta } from '@/hooks/usePagarTarjeta'
import { useDashboardTarjeta } from '@/hooks/useDashboardTarjeta'
import { useCapacidadPago } from '@/hooks/useCapacidadPago'
import { useSimularPago } from '@/hooks/useSimularPago'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { useResumenBancos } from '@/hooks/useResumenBancos'
import { sileo } from '@/lib/sileo'
import { fmt } from '@/lib/formatters'
import SearchableSelect from '@/components/ui/SearchableSelect'
import type { TarjetaCredito, CreateTarjetaCreditoPayload } from '@/types'

function CreateTarjetaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateTarjeta()
  const [nombre, setNombre] = useState('')
  const [bancoEmisor, setBancoEmisor] = useState('')
  const [limiteCredito, setLimiteCredito] = useState(0)
  const [fechaCorte, setFechaCorte] = useState(1)
  const [fechaPago, setFechaPago] = useState(1)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !bancoEmisor.trim() || limiteCredito < 1) return
    try {
      await create.mutateAsync({ nombre: nombre.trim(), bancoEmisor: bancoEmisor.trim(), limiteCredito, fechaCorte, fechaPago } as CreateTarjetaCreditoPayload)
      sileo.success('Tarjeta registrada')
      setNombre(''); setBancoEmisor(''); setLimiteCredito(0); setFechaCorte(1); setFechaPago(1)
      onClose()
    } catch { sileo.error('Error al crear tarjeta') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Nueva Tarjeta de Crédito</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5 px-5 py-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Nombre de la tarjeta</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: BAC Cash Back" maxLength={100} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Banco emisor</label>
            <input type="text" value={bancoEmisor} onChange={(e) => setBancoEmisor(e.target.value)} placeholder="Ej: BAC" maxLength={100} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Límite de crédito</label>
            <input type="number" min={1} step="0.01" value={limiteCredito || ''} onChange={(e) => setLimiteCredito(Number(e.target.value))} placeholder="$ 0" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Día de corte</label>
              <input type="number" min={1} max={31} value={fechaCorte} onChange={(e) => setFechaCorte(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Día de pago</label>
              <input type="number" min={1} max={31} value={fechaPago} onChange={(e) => setFechaPago(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button>
            <button type="submit" disabled={!nombre.trim() || !bancoEmisor.trim() || limiteCredito < 1 || create.isPending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{create.isPending ? 'Guardando...' : '💳 Registrar tarjeta'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditTarjetaModal({ open, onClose, tarjeta }: { open: boolean; onClose: () => void; tarjeta: TarjetaCredito | null }) {
  const update = useUpdateTarjeta()
  const [nombre, setNombre] = useState(tarjeta?.nombre || '')
  const [bancoEmisor, setBancoEmisor] = useState(tarjeta?.bancoEmisor || '')
  const [limiteCredito, setLimiteCredito] = useState(tarjeta?.limiteCredito || 0)
  const [fechaCorte, setFechaCorte] = useState(tarjeta?.fechaCorte || 1)
  const [fechaPago, setFechaPago] = useState(tarjeta?.fechaPago || 1)

  if (!open || !tarjeta) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await update.mutateAsync({ id: tarjeta.id, data: { nombre: nombre.trim(), bancoEmisor: bancoEmisor.trim(), limiteCredito, fechaCorte, fechaPago } })
      sileo.success('Tarjeta actualizada')
      onClose()
    } catch { sileo.error('Error al actualizar') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Editar Tarjeta</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5 px-5 py-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Banco emisor</label>
            <input type="text" value={bancoEmisor} onChange={(e) => setBancoEmisor(e.target.value)} maxLength={100} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Límite de crédito</label>
            <input type="number" min={1} step="0.01" value={limiteCredito || ''} onChange={(e) => setLimiteCredito(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Día de corte</label>
              <input type="number" min={1} max={31} value={fechaCorte} onChange={(e) => setFechaCorte(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Día de pago</label>
              <input type="number" min={1} max={31} value={fechaPago} onChange={(e) => setFechaPago(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button>
            <button type="submit" disabled={update.isPending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-ink">Eliminar tarjeta</h3>
          <p className="text-sm text-ink-muted">¿Estás seguro? Se eliminarán todos los datos asociados a esta tarjeta.</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface">Cancelar</button>
            <button type="button" onClick={onConfirm} className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-white hover:bg-red-600">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreditCardDashboard({ tarjetaId, onClose }: { tarjetaId: string; onClose: () => void }) {
  const { data: dashboard, isLoading } = useDashboardTarjeta(tarjetaId)
  const { data: capacidad } = useCapacidadPago(tarjetaId)
  const { data: bancos } = useFetchBancos()
  const pagarTarjeta = usePagarTarjeta()
  const simular = useSimularPago()

  const [showPago, setShowPago] = useState(false)
  const [montoPago, setMontoPago] = useState(0)
  const [carteraIdPago, setCarteraIdPago] = useState('')
  const [showSimulacion, setShowSimulacion] = useState(false)
  const [montoSim, setMontoSim] = useState(0)
  const [carteraIdSim, setCarteraIdSim] = useState('')
  const [simResult, setSimResult] = useState<any>(null)

  const handlePagar = async () => {
    if (!carteraIdPago || montoPago < 1) { sileo.error('Completá todos los campos'); return }
    try {
      await pagarTarjeta.mutateAsync({ id: tarjetaId, monto: montoPago, carteraId: carteraIdPago })
      sileo.success('Pago registrado')
      setShowPago(false); setMontoPago(0); setCarteraIdPago('')
    } catch { sileo.error('Error al pagar') }
  }

  const handleSimular = async () => {
    if (montoSim < 1) { sileo.error('Ingresá un monto'); return }
    try {
      const result = await simular.mutateAsync({ id: tarjetaId, monto: montoSim, carteraId: carteraIdSim || undefined })
      setSimResult(result)
    } catch { sileo.error('Error en simulación') }
  }

  if (isLoading || !dashboard) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </div>
    )
  }

  const { tarjeta, creditDisponible, porcentajeUtilizacion, colorUtilizacion, proximoCorte, proximoPago, totalCicloActual, comprasCicloActual, historialCompras, historialPagos } = dashboard
  const colorClasses = { verde: 'text-success bg-success/10 border-success/30', amarillo: 'text-amber-500 bg-amber-500/10 border-amber-500/30', rojo: 'text-danger bg-danger/10 border-danger/30' }
  const colorBar = { verde: 'bg-success', amarillo: 'bg-amber-500', rojo: 'bg-danger' }
  const capEstado = capacidad?.estado
  const capIcon = capEstado === 'cubierto' ? '✅' : capEstado === 'parcial' ? '⚠️' : '❌'

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col h-full animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-ink">{tarjeta.nombre}</h2>
            <p className="text-xs text-ink-muted mt-0.5">{tarjeta.bancoEmisor}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Utilization bar */}
          <div className="rounded-xl bg-surface border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Utilización</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClasses[colorUtilizacion]}`}>{porcentajeUtilizacion}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-border overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${porcentajeUtilizacion}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${colorBar[colorUtilizacion]}`} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><span className="text-[10px] text-ink-muted block">Límite</span><span className="text-sm font-bold text-ink">{fmt(tarjeta.limiteCredito)}</span></div>
              <div><span className="text-[10px] text-ink-muted block">Utilizado</span><span className="text-sm font-bold text-ink">{fmt(tarjeta.saldoUtilizado)}</span></div>
              <div><span className="text-[10px] text-ink-muted block">Disponible</span><span className="text-sm font-bold text-success">{fmt(creditDisponible)}</span></div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface border border-border p-3">
              <span className="text-[10px] text-ink-muted block">Próximo corte</span>
              <span className="text-sm font-bold text-ink">{proximoCorte}</span>
            </div>
            <div className="rounded-xl bg-surface border border-border p-3">
              <span className="text-[10px] text-ink-muted block">Próximo pago</span>
              <span className="text-sm font-bold text-ink">{proximoPago}</span>
            </div>
          </div>

          {/* Ciclo actual */}
          <div className="rounded-xl bg-surface border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Ciclo actual</span>
              <span className="text-sm font-bold text-ink">{fmt(totalCicloActual)}</span>
            </div>
            {comprasCicloActual.length === 0 ? (
              <p className="text-xs text-ink-muted py-2">Sin compras en este ciclo</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {comprasCicloActual.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <span className="text-xs text-ink truncate flex-1">{c.descripcion}</span>
                    <span className="text-xs font-semibold text-ink">{fmt(c.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capacidad de pago */}
          {capacidad && (
            <div className="rounded-xl bg-surface border border-border p-3 space-y-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Capacidad de pago {capIcon}</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-ink-muted">Saldo pendiente:</span> <strong className="text-ink">{fmt(capacidad.saldoPendiente)}</strong></div>
                <div><span className="text-ink-muted">En carteras:</span> <strong className="text-ink">{fmt(capacidad.totalCarteras)}</strong></div>
                <div><span className="text-ink-muted">Comprometido:</span> <strong className="text-ink">{fmt(capacidad.dineroComprometido)}</strong></div>
                <div><span className="text-ink-muted">Libre:</span> <strong className="text-ink">{fmt(capacidad.dineroLibre)}</strong></div>
              </div>
              <div className={`text-xs font-semibold ${capacidad.estado === 'cubierto' ? 'text-success' : capacidad.estado === 'parcial' ? 'text-amber-500' : 'text-danger'}`}>
                {capacidad.estado === 'cubierto' ? '✅ Pago cubierto' : capacidad.estado === 'parcial' ? '⚠️ Pago parcial' : '❌ Fondos insuficientes'} — {capacidad.porcentajeCubierto}% cubierto
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowPago(true); setMontoPago(tarjeta.saldoUtilizado) }} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light">Pagar tarjeta</button>
            <button type="button" onClick={() => { setShowSimulacion(true); setMontoSim(0); setSimResult(null) }} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-ink-muted hover:bg-surface">Simular pago</button>
          </div>

          {/* Historial de pagos */}
          {historialPagos.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-3">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-2">Historial de pagos</span>
              {historialPagos.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <div><span className="text-xs text-ink">{fmt(p.monto)}</span><span className="text-[10px] text-ink-muted ml-2">desde {p.carteraNombre}</span></div>
                  <span className="text-[10px] text-ink-muted">{new Date(p.fecha).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Historial de compras */}
          {historialCompras.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-3">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-2">Historial de compras</span>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {historialCompras.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0"><span className="text-xs text-ink truncate block">{c.descripcion}</span><span className="text-[10px] text-ink-muted">{new Date(c.fecha).toLocaleDateString()}</span></div>
                    <span className="text-xs font-semibold text-ink">{fmt(c.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pago modal */}
      {showPago && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowPago(false)}>
          <div className="glass rounded-2xl shadow-xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold text-ink">Pagar tarjeta</h3>
              <button type="button" onClick={() => setShowPago(false)} className="rounded-xl p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-ink-muted">Saldo utilizado: <strong className="text-ink">{fmt(tarjeta.saldoUtilizado)}</strong></p>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Monto a pagar</label>
                <input type="number" min={1} step="0.01" value={montoPago || ''} onChange={(e) => setMontoPago(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Cartera origen</label>
                <SearchableSelect
                  options={(bancos ?? []).map((b) => ({ value: b.id, label: `${b.nombre} (${fmt(b.saldo)})` }))}
                  value={carteraIdPago}
                  onChange={setCarteraIdPago}
                  placeholder="Seleccionar cartera"
                />
              </div>
              <button type="button" onClick={handlePagar} disabled={pagarTarjeta.isPending || !carteraIdPago || montoPago < 1} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{pagarTarjeta.isPending ? 'Procesando...' : 'Confirmar pago'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Simulación modal */}
      {showSimulacion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => { setShowSimulacion(false); setSimResult(null) }}>
          <div className="glass rounded-2xl shadow-xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold text-ink">Simular pago</h3>
              <button type="button" onClick={() => { setShowSimulacion(false); setSimResult(null) }} className="rounded-xl p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-ink-muted">Saldo actual: <strong className="text-ink">{fmt(tarjeta.saldoUtilizado)}</strong></p>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Monto a simular</label>
                <input type="number" min={1} step="0.01" value={montoSim || ''} onChange={(e) => setMontoSim(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Cartera origen (opcional)</label>
                <SearchableSelect
                  options={(bancos ?? []).map((b) => ({ value: b.id, label: `${b.nombre} (${fmt(b.saldo)})` }))}
                  value={carteraIdSim}
                  onChange={setCarteraIdSim}
                  placeholder="Seleccionar cartera"
                />
              </div>
              <button type="button" onClick={handleSimular} disabled={simular.isPending || montoSim < 1} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">Simular</button>
              {simResult && (
                <div className="rounded-xl bg-surface border border-border p-3 space-y-1.5 text-xs">
                  <p>Saldo restante tarjeta: <strong className="text-ink">{fmt(simResult.saldoRestanteTarjeta)}</strong></p>
                  <p>Nuevo saldo utilizado: <strong className="text-ink">{fmt(simResult.nuevoSaldoUtilizado)}</strong></p>
                  {simResult.carteraOrigen && <p>Saldo en {simResult.carteraOrigen}: <strong className="text-ink">{fmt(simResult.saldoCarteraRestante)}</strong></p>}
                  <p className="text-ink-muted text-[10px]">* Esta simulación no afecta datos reales</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TarjetasCreditoPage() {
  const { data: tarjetas, isLoading } = useFetchTarjetas()
  const { data: resumen } = useResumenBancos()
  const deleteTarjeta = useDeleteTarjeta()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarjeta, setEditTarjeta] = useState<TarjetaCredito | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedTarjetaId, setSelectedTarjetaId] = useState<string | null>(null)

  const tarjetaList = tarjetas ?? []

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Tarjetas de Crédito</h1>
          <p className="mt-1 text-sm text-ink-muted">Administrá tus tarjetas y controlá tu deuda</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nueva tarjeta
        </button>
      </div>

      {/* Resumen comprometido vs disponible */}
      {resumen && (
        <div className="rounded-xl bg-surface border border-border p-4 grid grid-cols-3 gap-4 text-center">
          <div><span className="text-[10px] text-ink-muted uppercase tracking-wider block">Total Carteras</span><span className="text-lg font-bold text-ink">{fmt(resumen.totalCarteras)}</span></div>
          <div><span className="text-[10px] text-ink-muted uppercase tracking-wider block">Comprometido</span><span className="text-lg font-bold text-amber-500">{fmt(resumen.dineroComprometido)}</span></div>
          <div><span className="text-[10px] text-ink-muted uppercase tracking-wider block">Disponible</span><span className="text-lg font-bold text-success">{fmt(resumen.dineroLibre)}</span></div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" /></div>
      ) : tarjetaList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
          <div className="text-4xl mb-3">💳</div>
          <h3 className="text-base font-semibold text-ink">No tenés tarjetas registradas</h3>
          <p className="text-sm text-ink-muted mt-1">Registrá tu primera tarjeta de crédito para empezar a controlar tus gastos.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light">Registrar tarjeta</button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tarjetaList.map((t) => {
            const pct = t.limiteCredito > 0 ? Math.round((t.saldoUtilizado / t.limiteCredito) * 100) : 0
            const colorBar = pct < 30 ? 'bg-success' : pct <= 70 ? 'bg-amber-500' : 'bg-danger'
            const colorText = pct < 30 ? 'text-success' : pct <= 70 ? 'text-amber-500' : 'text-danger'
            return (
              <motion.div key={t.id} whileHover={{ y: -2 }} className="rounded-2xl bg-surface border border-border p-4 space-y-3 cursor-pointer" onClick={() => setSelectedTarjetaId(t.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">{t.nombre}</h3>
                    <p className="text-[10px] text-ink-muted">{t.bancoEmisor}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditTarjeta(t) }} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteId(t.id) }} className="rounded-lg p-1.5 text-ink-muted hover:text-danger"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">{fmt(t.saldoUtilizado)} / {fmt(t.limiteCredito)}</span>
                    <span className={`font-bold ${colorText}`}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${colorBar}`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-muted">
                    <span>Corte: {t.fechaCorte}</span>
                    <span>Pago: {t.fechaPago}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <CreateTarjetaModal open={showCreate} onClose={() => setShowCreate(false)} />
      <EditTarjetaModal open={!!editTarjeta} onClose={() => setEditTarjeta(null)} tarjeta={editTarjeta} />
      <ConfirmDeleteModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteTarjeta.mutate(deleteId); setDeleteId(null); sileo.success('Tarjeta eliminada') } }} />
      {selectedTarjetaId && <CreditCardDashboard tarjetaId={selectedTarjetaId} onClose={() => setSelectedTarjetaId(null)} />}
    </main>
  )
}
