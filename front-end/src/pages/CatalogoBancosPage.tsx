import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetchCatalogoBancos } from '@/hooks/useFetchCatalogoBancos'
import { useCreateCatalogoBanco } from '@/hooks/useCreateCatalogoBanco'
import { useDeleteCatalogoBanco } from '@/hooks/useDeleteCatalogoBanco'
import { useVerificarAdmin } from '@/hooks/useVerificarAdmin'
import { sileo } from '@/lib/sileo'

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6']

function AddBancoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateCatalogoBanco()
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('#3b82f6')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    try {
      await create.mutateAsync({ nombre: nombre.trim(), color })
      sileo.success(`Banco "${nombre}" agregado al catálogo`)
      setNombre('')
      setColor('#3b82f6')
      onClose()
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al agregar el banco')
    }
  }

  const handleClose = () => { onClose(); if (!create.isPending) { setNombre(''); setColor('#3b82f6') } }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface shadow-xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Agregar Banco</h2>
          <button type="button" onClick={handleClose} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-raised hover:text-ink transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Nombre del banco</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Santander" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-ink-secondary">Color</label>
            <div className="flex gap-1.5">
              {DEFAULT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? 'border-ink scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {create.isError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {create.error instanceof Error ? create.error.message : 'Error al agregar'}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">Cancelar</button>
            <button type="submit" disabled={create.isPending || !nombre.trim()} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors">
              {create.isPending ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CatalogoBancosPage() {
  const { data: adminData, isLoading: checkingAdmin } = useVerificarAdmin()
  const { data: bancos, isLoading } = useFetchCatalogoBancos()
  const deleteBanco = useDeleteCatalogoBanco()
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)

  const esAdmin = adminData?.esAdmin ?? false

  if (checkingAdmin) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-violet-600" />
      </main>
    )
  }

  if (!esAdmin) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-6 py-16 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/15">
            <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink">Acceso denegado</h3>
          <p className="mt-1.5 text-sm text-ink-muted">No tienes permisos para acceder a esta seccion.</p>
          <button type="button" onClick={() => navigate('/', { replace: true })} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors">
            Volver al inicio
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-ink">Catálogo de Bancos</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Administra los bancos disponibles para las carteras</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Agregar banco
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-border bg-surface py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-violet-600" />
            <p className="text-sm text-ink-muted">Cargando catálogo...</p>
          </div>
        </div>
      )}

      {!isLoading && bancos && bancos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-subtle">
            <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink">Catálogo vacío</h3>
          <p className="mt-1.5 text-sm text-ink-muted">Agrega bancos para que los usuarios puedan crear sus carteras.</p>
        </div>
      )}

      {!isLoading && bancos && bancos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bancos.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: b.color }}>
                  {b.icono || b.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-ink">{b.nombre}</span>
              </div>
              <button
                type="button"
                onClick={() => deleteBanco.mutate(b.id, {
                  onSuccess: () => sileo.info(`"${b.nombre}" eliminado del catálogo`),
                  onError: () => sileo.error('Error al eliminar'),
                })}
                className="rounded p-1 text-ink-muted hover:bg-danger/10 hover:text-danger transition-colors"
                title="Eliminar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <AddBancoModal open={showAdd} onClose={() => setShowAdd(false)} />
    </main>
  )
}
