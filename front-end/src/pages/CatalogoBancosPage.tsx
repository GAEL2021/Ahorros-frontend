import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetchCatalogoBancos } from '@/hooks/useFetchCatalogoBancos'
import { useCreateCatalogoBanco } from '@/hooks/useCreateCatalogoBanco'
import { useUpdateCatalogoBanco } from '@/hooks/useUpdateCatalogoBanco'
import { useDeleteCatalogoBanco } from '@/hooks/useDeleteCatalogoBanco'
import { useVerificarAdmin } from '@/hooks/useVerificarAdmin'
import { sileo } from '@/lib/sileo'
import type { CatalogoBanco } from '@/types'

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6']

function BancoFormModal({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: CatalogoBanco }) {
  const create = useCreateCatalogoBanco()
  const update = useUpdateCatalogoBanco()
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [color, setColor] = useState(initial?.color ?? '#3b82f6')

  if (!open) return null

  const isEdit = !!initial

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial.id, payload: { nombre: nombre.trim(), color } })
        sileo.success(`Banco "${nombre}" actualizado`)
      } else {
        await create.mutateAsync({ nombre: nombre.trim(), color })
        sileo.success(`Banco "${nombre}" agregado al catálogo`)
      }
      onClose()
    } catch (err) {
      sileo.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleClose = () => { onClose(); if (!create.isPending && !update.isPending) { setNombre(''); setColor('#3b82f6') } }

  const isPending = create.isPending || update.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="text-base font-extrabold text-zinc-950 dark:text-white tracking-tight">{isEdit ? 'Editar banco' : 'Agregar banco'}</h2>
          <button type="button" onClick={handleClose} className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-400 uppercase tracking-wider">Nombre del banco</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Santander" autoFocus className="w-full rounded-xl border border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 px-4 py-3 text-sm font-medium text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 transition-all" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-400 uppercase tracking-wider">Color</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`h-10 w-10 rounded-xl border-2 transition-all duration-200 ${color === c ? 'border-zinc-950 dark:border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="rounded-xl border border-zinc-200/50 dark:border-white/5 px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">Cancelar</button>
            <button type="submit" disabled={isPending || !nombre.trim()} className="rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#10B981]/20 hover:bg-[#059669] active:scale-[0.97] disabled:opacity-50 transition-all">
              {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar'}
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
  const [editingBanco, setEditingBanco] = useState<CatalogoBanco | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const esAdmin = adminData?.esAdmin ?? false

  if (checkingAdmin) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 dark:border-white/10 border-t-[#10B981]" />
      </main>
    )
  }

  if (!esAdmin) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in max-w-lg mx-auto">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white tracking-tight">Acceso denegado</h3>
          <p className="mt-1.5 text-sm text-zinc-400">No tienes permisos de administrador para acceder a esta sección.</p>
          <button type="button" onClick={() => navigate('/', { replace: true })} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-200/50 dark:border-white/5 px-5 py-2.5 text-sm font-bold text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
            Volver al inicio
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">Catálogo de Bancos</h1>
          <p className="mt-1 text-sm font-medium text-zinc-400">Administra los bancos disponibles para las carteras</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#10B981]/20 transition-all hover:bg-[#059669] active:scale-[0.97]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Agregar banco
        </button>
      </div>

      {isLoading && (
        <div className="glass rounded-2xl flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 dark:border-white/10 border-t-[#10B981]" />
            <p className="text-sm font-medium text-zinc-400">Cargando catálogo...</p>
          </div>
        </div>
      )}

      {!isLoading && bancos && bancos.length === 0 && (
        <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20">
            <svg className="h-8 w-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white tracking-tight">Catálogo vacío</h3>
          <p className="mt-1.5 text-sm text-zinc-400">Agrega bancos para que los usuarios puedan crear sus carteras.</p>
          <button type="button" onClick={() => setShowAdd(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#10B981]/20 transition-all hover:bg-[#059669] active:scale-[0.97]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Agregar banco
          </button>
        </div>
      )}

      {!isLoading && bancos && bancos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {bancos.map((b) => (
            <div key={b.id} className="glass rounded-2xl px-5 py-4 flex items-center justify-between hover:translate-x-1 transition-all duration-300 group">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg" style={{ backgroundColor: b.color }}>
                  {b.icono || b.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-extrabold text-zinc-950 dark:text-white tracking-tight">{b.nombre}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={() => setEditingBanco(b)}
                  className="rounded-xl p-2 text-zinc-400 hover:bg-[#10B981]/10 hover:text-[#10B981] transition-colors"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                {confirmDeleteId === b.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        deleteBanco.mutate(b.id, {
                          onSuccess: () => { sileo.info(`"${b.nombre}" eliminado del catálogo`); setConfirmDeleteId(null) },
                          onError: () => sileo.error('Error al eliminar'),
                        })
                      }}
                      className="rounded-xl px-3 py-1.5 text-[11px] font-extrabold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded-xl p-2 text-zinc-400 hover:bg-white/5 transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(b.id)}
                    className="rounded-xl p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BancoFormModal open={showAdd} onClose={() => setShowAdd(false)} />
      <BancoFormModal open={!!editingBanco} onClose={() => setEditingBanco(null)} initial={editingBanco ?? undefined} />
    </main>
  )
}
