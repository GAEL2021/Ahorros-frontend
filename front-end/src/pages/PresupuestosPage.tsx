// @ts-nocheck
import { useState } from 'react'
import { useFetchPresupuestos, useCreatePresupuesto, useDeletePresupuesto, usePresupuestoDetail, useAddGasto, useDeleteGasto } from '@/hooks/usePresupuestos'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { sileo } from '@/lib/sileo'
import type { Presupuesto, CreatePresupuestoPayload } from '@/types'

const CAT_LABELS: Record<string, string> = { fijos: 'Gastos Fijos', ocio: 'Ocio', ahorro: 'Ahorro' }

function fmt(n: number) { return `$${n.toLocaleString()}` }

function CalcSummary({ p }: { p: Presupuesto }) {
  const gastos = p.gastos ?? []
  const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0)
  const ingresos = p.tipo === 'mensual'
    ? p.sobranteAnterior + p.salarioMensual + p.efectivoExtra
    : (() => {
        const gQ1 = gastos.filter((g) => g.quincena === 'Q1').reduce((s: number, g) => s + g.monto, 0)
        return p.sobranteAnterior + p.salarioQ1 + p.efectivoExtra - gQ1 + p.salarioQ2
      })()
  const queda = Math.max(0, ingresos - totalGastado)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
      <div className="rounded-xl bg-surface border border-border px-3 py-2.5"><span className="text-[10px] uppercase tracking-wider text-ink-muted">Ingresos</span><p className="text-sm font-bold text-ink">{fmt(ingresos)}</p></div>
      <div className="rounded-xl bg-surface border border-border px-3 py-2.5"><span className="text-[10px] uppercase tracking-wider text-ink-muted">Gastado</span><p className="text-sm font-bold text-danger">{fmt(totalGastado)}</p></div>
      <div className="rounded-xl bg-surface border border-border px-3 py-2.5"><span className="text-[10px] uppercase tracking-wider text-ink-muted">Presupuesto</span><p className="text-sm font-bold text-ink">{fmt(p.metaFijos + p.metaOcio + p.metaAhorro)}</p></div>
      <div className={`rounded-xl border px-3 py-2.5 ${queda >= 0 ? 'bg-success-subtle border-success/30' : 'bg-danger-subtle border-danger/30'}`}><span className="text-[10px] uppercase tracking-wider text-ink-muted">Queda</span><p className={`text-sm font-bold ${queda >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(queda)}</p></div>
    </div>
  )
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: bancos } = useFetchBancos()
  const create = useCreatePresupuesto()
  const [tipo, setTipo] = useState<'mensual' | 'quincenal'>('mensual')
  const [carteraId, setCarteraId] = useState('')
  const [sobrante, setSobrante] = useState(0)
  const [efectivo, setEfectivo] = useState(0)
  const [salario, setSalario] = useState(0)
  const [salarioQ1, setSalarioQ1] = useState(0)
  const [salarioQ2, setSalarioQ2] = useState(0)
  const [metaFijos, setMetaFijos] = useState(0)
  const [metaOcio, setMetaOcio] = useState(0)
  const [metaAhorro, setMetaAhorro] = useState(0)
  if (!open) return null
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!carteraId) return; try { const payload: CreatePresupuestoPayload = { carteraId, tipo, sobranteAnterior: sobrante, efectivoExtra: efectivo, metaFijos, metaOcio, metaAhorro }; if (tipo === 'mensual') payload.salarioMensual = salario; else { payload.salarioQ1 = salarioQ1; payload.salarioQ2 = salarioQ2 } await create.mutateAsync(payload); sileo.success('Presupuesto creado'); onClose() } catch { sileo.error('Error') } }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4"><h2 className="text-base font-semibold text-ink">Nuevo Presupuesto</h2><button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Cartera</label><select value={carteraId} onChange={(e) => setCarteraId(e.target.value)} required className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"><option value="" disabled>Seleccionar cartera</option>{bancos?.map((b) => <option key={b.id} value={b.id}>{b.nombre} ({fmt(b.saldo)})</option>)}</select></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Frecuencia</label><div className="flex rounded-xl border border-border overflow-hidden"><button type="button" onClick={() => setTipo('mensual')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'mensual' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Mensual</button><button type="button" onClick={() => setTipo('quincenal')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'quincenal' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Quincenal</button></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Sobrante anterior</label><input type="number" min={0} value={sobrante || ''} onChange={(e) => setSobrante(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Efectivo extra</label><input type="number" min={0} value={efectivo || ''} onChange={(e) => setEfectivo(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div></div>
          {tipo === 'mensual' ? <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Salario mensual</label><input type="number" min={0} value={salario || ''} onChange={(e) => setSalario(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div> : <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Salario Q1</label><input type="number" min={0} value={salarioQ1 || ''} onChange={(e) => setSalarioQ1(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Salario Q2</label><input type="number" min={0} value={salarioQ2 || ''} onChange={(e) => setSalarioQ2(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div></div>}
          <div className="border-t border-border pt-4"><span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Metas del presupuesto</span><div className="grid grid-cols-3 gap-2 mt-2"><div><label className="mb-1 block text-[10px] text-ink-muted">Gastos Fijos</label><input type="number" min={0} value={metaFijos || ''} onChange={(e) => setMetaFijos(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div><div><label className="mb-1 block text-[10px] text-ink-muted">Ocio</label><input type="number" min={0} value={metaOcio || ''} onChange={(e) => setMetaOcio(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent/50 focus:outline-none" /></div><div><label className="mb-1 block text-[10px] text-ink-muted">Ahorro</label><input type="number" min={0} value={metaAhorro || ''} onChange={(e) => setMetaAhorro(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-success/50 focus:outline-none" /></div></div></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button><button type="submit" disabled={create.isPending || !carteraId} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{create.isPending ? 'Creando...' : 'Crear presupuesto'}</button></div>
        </form>
      </div>
    </div>
  )
}

function PresupuestoDetail({ presupuestoId, onClose }: { presupuestoId: string; onClose: () => void }) {
  const { data: p, isLoading } = usePresupuestoDetail(presupuestoId)
  const addGasto = useAddGasto(presupuestoId)
  const deleteGasto = useDeleteGasto(presupuestoId)
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState(0)
  const [cat, setCat] = useState<'fijos' | 'ocio' | 'ahorro'>('fijos')
  const [quincena, setQuincena] = useState<'Q1' | 'Q2' | ''>('')

  if (isLoading || !p) return <div className="flex items-center justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" /></div>
  const gastos: typeof p.gastos = p.gastos ?? []
  const totalesPorCat: Record<string, number> = { fijos: 0, ocio: 0, ahorro: 0 }
  gastos.forEach((g) => { totalesPorCat[g.categoria] += g.monto })

  const handleAdd = async (e: React.FormEvent) => { e.preventDefault(); if (!desc.trim() || monto < 1 || addGasto.isPending) return; try { await addGasto.mutateAsync({ descripcion: desc.trim(), monto, categoria: cat, quincena: quincena || undefined }); setDesc(''); setMonto(0); sileo.success('Gasto registrado') } catch { sileo.error('Error') } }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--bg-sidebar)] border-l border-border shadow-2xl flex flex-col h-full animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0"><div><h2 className="text-base font-semibold text-ink">Presupuesto {p.tipo === 'mensual' ? 'Mensual' : 'Quincenal'}</h2><p className="text-xs text-ink-muted mt-0.5">{p.tipo === 'mensual' ? `Salario: ${fmt(p.salarioMensual)}` : `Q1: ${fmt(p.salarioQ1)} | Q2: ${fmt(p.salarioQ2)}`}</p></div><button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <CalcSummary p={p} />
          <div className="grid grid-cols-3 gap-2">
            {(['fijos', 'ocio', 'ahorro'] as const).map((c) => { const meta = c === 'fijos' ? p.metaFijos : c === 'ocio' ? p.metaOcio : p.metaAhorro; const pct = meta > 0 ? Math.min(100, Math.round((totalesPorCat[c] / meta) * 100)) : 0; return <div key={c} className="rounded-xl bg-surface border border-border px-3 py-2.5 text-center"><span className="text-[10px] uppercase tracking-wider text-ink-muted">{CAT_LABELS[c]}</span><p className="text-xs font-bold text-ink mt-0.5">{fmt(totalesPorCat[c])} / {fmt(meta)}</p><div className="h-1 w-full rounded-full bg-border mt-1"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${pct}%` }} /></div></div> })}
          </div>
          <div><h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Registro de Gastos</h3>
            <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-3">
              <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" maxLength={200} className="flex-1 min-w-[140px] rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" />
              <input type="number" min={1} value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} placeholder="$" className="w-24 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" />
              <select value={cat} onChange={(e) => setCat(e.target.value as 'fijos' | 'ocio' | 'ahorro')} className="rounded-xl border border-border bg-surface px-2 py-2 text-xs text-ink focus:outline-none"><option value="fijos">Fijos</option><option value="ocio">Ocio</option><option value="ahorro">Ahorro</option></select>
              {p.tipo === 'quincenal' && <select value={quincena} onChange={(e) => setQuincena(e.target.value as 'Q1' | 'Q2' | '')} className="rounded-xl border border-border bg-surface px-2 py-2 text-xs text-ink focus:outline-none"><option value="">Sin Q</option><option value="Q1">Q1</option><option value="Q2">Q2</option></select>}
              <button type="submit" disabled={!desc.trim() || monto < 1 || addGasto.isPending} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{addGasto.isPending ? '...' : 'Agregar'}</button>
            </form>
            {gastos.length === 0 ? <p className="text-xs text-ink-muted text-center py-8">Sin gastos registrados aún.</p> : <div className="space-y-1">{gastos.map((g) => <div key={g.id} className="flex items-center gap-2 rounded-xl border-l-4 px-3 py-2 bg-surface border-border" style={{ borderLeftColor: g.categoria === 'fijos' ? 'var(--gold)' : g.categoria === 'ocio' ? 'var(--copper)' : 'var(--success)' }}><div className="flex-1 min-w-0"><p className="text-xs font-medium text-ink truncate">{g.descripcion}</p><p className="text-[10px] text-ink-muted">{new Date(g.creadoEn).toLocaleDateString('es-CL')} · {CAT_LABELS[g.categoria]}{g.quincena ? ` · ${g.quincena}` : ''}</p></div><span className="text-xs font-bold text-ink">{fmt(g.monto)}</span><button onClick={() => deleteGasto.mutate(g.id, { onError: () => sileo.error('Error al eliminar') })} className="text-ink-muted hover:text-danger transition-colors p-0.5"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PresupuestosPage() {
  const { data: presupuestos, isLoading } = useFetchPresupuestos()
  const deleteP = useDeletePresupuesto()
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in"><div><h1 className="text-2xl font-semibold text-ink tracking-tight">Presupuestos</h1><p className="mt-1 text-sm text-ink-muted">Controlá tus gastos basado en tu frecuencia de salario</p></div><button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo presupuesto</button></div>
      {isLoading && <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="glass rounded-2xl p-5 space-y-3"><div className="skeleton h-4 w-48" /><div className="skeleton h-8 w-full rounded-xl" /></div>)}</div>}
      {!isLoading && (!presupuestos || presupuestos.length === 0) && <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20" style={{ animation: 'float 3s ease-in-out infinite' }}><svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div><h3 className="text-lg font-semibold text-ink">Sin presupuestos</h3><p className="mt-1.5 text-sm text-ink-muted">Creá tu primer presupuesto vinculado a una cartera.</p><button type="button" onClick={() => setShowCreate(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Crear presupuesto</button></div>}
      {!isLoading && presupuestos && presupuestos.length > 0 && <div className="space-y-3 stagger">{presupuestos.map((p) => { const gastos = p.gastos ?? []; const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0); const ingresos = p.tipo === 'mensual' ? p.sobranteAnterior + p.salarioMensual + p.efectivoExtra : p.sobranteAnterior + p.salarioQ1 + p.salarioQ2 + p.efectivoExtra; const queda = Math.max(0, ingresos - totalGastado); return <div key={p.id} className="glass rounded-2xl border-l-4 border-l-primary card-hover p-5 cursor-pointer" onClick={() => setDetailId(p.id)}><div className="flex items-center justify-between mb-3"><div><h3 className="text-sm font-semibold text-ink">Presupuesto {p.tipo === 'mensual' ? 'Mensual' : 'Quincenal'}</h3><p className="text-[11px] text-ink-muted mt-0.5">{p.tipo === 'mensual' ? `Salario: ${fmt(p.salarioMensual)}` : `Q1: ${fmt(p.salarioQ1)} | Q2: ${fmt(p.salarioQ2)}`} · {gastos.length} gastos</p></div><button type="button" onClick={(e) => { e.stopPropagation(); deleteP.mutate(p.id, { onSuccess: () => sileo.info('Presupuesto eliminado'), onError: () => sileo.error('Error') }) }} className="text-ink-muted hover:text-danger transition-colors p-1"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div><div className="grid grid-cols-3 gap-2">{(['fijos', 'ocio', 'ahorro'] as const).map((c) => { const catTotal = gastos.filter((g) => g.categoria === c).reduce((s: number, g) => s + g.monto, 0); const meta = c === 'fijos' ? p.metaFijos : c === 'ocio' ? p.metaOcio : p.metaAhorro; const pct = meta > 0 ? Math.min(100, Math.round((catTotal / meta) * 100)) : 0; return <div key={c} className="text-center"><span className="text-[10px] text-ink-muted">{CAT_LABELS[c]}</span><div className="h-1.5 w-full rounded-full bg-border mt-1"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${pct}%` }} /></div><span className="text-[10px] text-ink-muted mt-0.5">{fmt(catTotal)} / {fmt(meta)}</span></div> })}</div><div className="flex items-center justify-between mt-3 pt-3 border-t border-border"><span className="text-[11px] text-ink-muted">Gastado: <span className="font-semibold text-ink">{fmt(totalGastado)}</span></span><span className={`text-[11px] font-semibold ${queda >= 0 ? 'text-success' : 'text-danger'}`}>Queda: {fmt(queda)}</span></div></div> })}</div>}
      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} />
      {detailId && <PresupuestoDetail presupuestoId={detailId} onClose={() => setDetailId(null)} />}
    </main>
  )
}
