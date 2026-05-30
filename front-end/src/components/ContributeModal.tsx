import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { sileo } from '@/lib/sileo'
import { useGoalDetail } from '@/hooks/useGoalDetail'
import { useAddContribution } from '@/hooks/useAddContribution'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import RangeSlider from '@/components/RangeSlider'
import type { Meta } from '@/types'

interface ContributeModalProps {
  open: boolean
  onClose: () => void
  meta: Meta
}

export default function ContributeModal({ open, onClose, meta }: ContributeModalProps) {
  const { user } = useAuth()
  const { data: detail } = useGoalDetail(open ? meta.id : '')
  const { data: bancos } = useFetchBancos()
  const addContribution = useAddContribution()
  const [monto, setMonto] = useState(0)
  const [carteraId, setCarteraId] = useState<string>('')

  const bancosConSaldo = bancos?.filter((b) => b.saldo > 0) ?? []
  const selectedBanco = bancosConSaldo.find((b) => b.id === carteraId)

  if (!open) return null

  const metaData = detail ?? meta
  const progressPct = Math.min(100, Math.round((metaData.montoAcumulado / metaData.montoObjetivo) * 100))
  const remaining = metaData.montoObjetivo - metaData.montoAcumulado
  const maxContribution = Math.max(1, Math.min(remaining, selectedBanco ? selectedBanco.saldo : remaining))

  const miembroActual = metaData.miembros?.find((m) => m.email === user?.email)
  const sugerido = miembroActual?.cuotaMensual ?? Math.ceil(remaining / Math.max(1, meta.mesesRestantes))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monto || monto < 1) return
    try {
      const result = await addContribution.mutateAsync({
        goalId: meta.id,
        monto,
        carteraId: carteraId || undefined,
      })
      sileo.success(`Aportaste $${monto.toLocaleString()}. Total: $${result.nuevoMontoAcumulado.toLocaleString()}`)
      setMonto(0)
      setCarteraId('')
      onClose()
    } catch {
      sileo.error('Error al realizar el aporte')
    }
  }

  const handleClose = () => {
    if (!addContribution.isPending) {
      setMonto(0)
      setCarteraId('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-ink">Aportar Dinero</h3>
          <button type="button" onClick={handleClose} className="rounded-md p-2 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Goal summary */}
          <div className="rounded-lg border border-border bg-surface-raised px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink truncate max-w-[60%]">{meta.nombre}</span>
              <span className="text-xs font-medium text-ink-muted">{progressPct}% completado</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-muted">
                Ahorrado:{' '}
                <span className="font-semibold text-primary-dark" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${metaData.montoAcumulado.toLocaleString()}
                </span>
              </span>
              <span className="text-ink-muted">
                Restante:{' '}
                <span className="font-semibold text-ink" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ${remaining.toLocaleString()}
                </span>
              </span>
            </div>
          </div>

          {/* Slider */}
          <div>
            <label className="mb-2.5 block text-xs font-semibold text-ink-secondary">Monto a aportar</label>
            <RangeSlider
              min={0}
              max={maxContribution}
              step={Math.max(1, Math.floor(maxContribution / 50))}
              value={monto}
              onChange={setMonto}
            />
          </div>

          {/* Suggested & quick amounts */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMonto(sugerido)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                monto === sugerido
                  ? 'border-primary bg-primary-subtle text-primary-dark'
                  : 'border-primary/20 bg-primary-subtle text-primary hover:bg-primary-subtle'
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Sugerido: ${sugerido.toLocaleString()}
            </button>
            {[sugerido * 2, maxContribution]
              .filter((v) => v > 0 && v !== sugerido)
              .slice(0, 2)
              .map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setMonto(amount)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    monto === amount
                      ? 'border-primary bg-primary-subtle text-primary-dark'
                      : 'border-border bg-surface text-ink-muted hover:bg-surface-raised hover:border-primary/30'
                  }`}
                >
                  ${amount.toLocaleString()}
                </button>
              ))}
          </div>

          {/* Wallet selector */}
          {bancosConSaldo.length > 0 && (
            <div>
              <label className="mb-2.5 block text-xs font-semibold text-ink-secondary">Cartera de origen (opcional)</label>
              <select
                value={carteraId}
                onChange={(e) => {
                  setCarteraId(e.target.value)
                  if (e.target.value) {
                    const banco = bancosConSaldo.find((b) => b.id === e.target.value)
                    if (banco && monto > banco.saldo) setMonto(0)
                  }
                }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Sin cartera (aporte directo)</option>
                {bancosConSaldo.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} (${b.saldo.toLocaleString()} disponible)
                  </option>
                ))}
              </select>
              {selectedBanco && (
                <p className="mt-1.5 text-xs text-ink-muted">
                  Maximo disponible: <span className="font-semibold text-primary">${selectedBanco.saldo.toLocaleString()}</span>
                </p>
              )}
            </div>
          )}

          {/* Manual input for precision */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-medium text-ink-muted">$</span>
            <input
              type="number"
              min={1}
              max={maxContribution}
              value={monto || ''}
              onChange={(e) => setMonto(Math.max(0, Math.min(maxContribution, Number(e.target.value) || 0)))}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
              placeholder="0"
              className="w-full rounded-lg border border-border bg-surface py-3 pl-9 pr-4 text-lg font-semibold placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addContribution.isPending || !monto || monto < 1 || monto > maxContribution}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {addContribution.isPending ? 'Aportando...' : 'Confirmar aporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
