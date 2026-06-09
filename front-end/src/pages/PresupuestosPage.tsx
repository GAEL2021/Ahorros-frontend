// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFetchPresupuestos, useCreatePresupuesto, useDeletePresupuesto, usePresupuestoDetail, useAddGasto, useDeleteGasto, useUpdateGasto } from '@/hooks/usePresupuestos'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { sileo } from '@/lib/sileo'
import type { Presupuesto, CreatePresupuestoPayload, Gasto } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import SearchableSelect from '@/components/ui/SearchableSelect'
import ConfirmModal from '@/components/ConfirmModal'

const CAT_LABELS: Record<string, string> = { fijos: 'Gastos Fijos', ocio: 'Ocio', ahorro: 'Ahorro' }

function fmt(n: number) { return `$${n.toLocaleString()}` }

function CalcSummary({ p }: { p: Presupuesto }) {
  const gastos = p.gastos ?? []
  const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0)
  const ingresos = p.tipo === 'mensual'
    ? p.sobranteAnterior + p.salarioMensual + p.efectivoExtra
    : p.sobranteAnterior + p.salarioQ1 + p.salarioQ2 + p.efectivoExtra
  const queda = Math.max(0, ingresos - totalGastado)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
      <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">Salario</span>
        <p className="text-sm font-bold text-ink">{fmt(p.tipo === 'mensual' ? p.salarioMensual : p.salarioQ1 + p.salarioQ2)}</p>
      </div>
      <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">Efectivo Extra</span>
        <p className="text-sm font-bold text-ink">{fmt(p.efectivoExtra)}</p>
      </div>
      <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">Sobrante</span>
        <p className="text-sm font-bold text-ink">{fmt(p.sobranteAnterior)}</p>
      </div>
      <div className={`rounded-xl border px-3 py-2.5 ${queda >= 0 ? 'bg-success-subtle border-success/30' : 'bg-danger-subtle border-danger/30'}`}>
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">Disponible</span>
        <p className={`text-sm font-bold ${queda >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(ingresos)}</p>
      </div>
    </div>
  )
}

function DonutCard({ p }: { p: Presupuesto }) {
  const gastos = p.gastos ?? []
  const colors = ['var(--lilac)', '#F59E0B', 'var(--success)']
  const data = (['fijos', 'ocio', 'ahorro'] as const).map((c, i) => {
    const total = gastos.filter((g) => g.categoria === c).reduce((s, g) => s + g.monto, 0)
    return { name: CAT_LABELS[c], value: total || 0.1, color: colors[i] }
  })
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="rounded-xl bg-surface border border-border p-4 flex items-center gap-4">
      <div className="w-28 h-28 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={44} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-ink-muted flex-1 truncate">{d.name}</span>
            <span className="font-semibold text-ink">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GastoCard({ g, presupuestoId }: { g: Gasto; presupuestoId: string }) {
  const updateGasto = useUpdateGasto(presupuestoId)
  const deleteGasto = useDeleteGasto(presupuestoId)
  const [editDesc, setEditDesc] = useState(false)
  const [descVal, setDescVal] = useState(g.descripcion)
  const [actualEdit, setActualEdit] = useState(false)
  const [actualVal, setActualVal] = useState(g.montoFinal || g.monto)

  const hasFinal = g.montoFinal != null && g.montoFinal > 0
  const diff = hasFinal ? (g.montoEstimado || g.monto) - g.montoFinal : 0

  useEffect(() => { setActualVal(g.montoFinal || g.monto) }, [g.montoFinal, g.monto])
  useEffect(() => { setDescVal(g.descripcion) }, [g.descripcion])

  const toggleConciliado = async () => {
    if (!hasFinal) return
    try { await updateGasto.mutateAsync({ gastoId: g.id, data: { estaConciliado: !g.estaConciliado } }) }
    catch { sileo.error('Error al conciliar') }
  }

  const commitDesc = async () => {
    setEditDesc(false)
    if (descVal.trim() && descVal !== g.descripcion) {
      try { await updateGasto.mutateAsync({ gastoId: g.id, data: { descripcion: descVal.trim() } }) }
      catch { sileo.error('Error') }
    }
  }

  const changeCategoria = async (cat: string) => {
    try { await updateGasto.mutateAsync({ gastoId: g.id, data: { categoria: cat as 'fijos' | 'ocio' | 'ahorro' } }) }
    catch { sileo.error('Error') }
  }

  const commitActual = async () => {
    setActualEdit(false)
    const num = Number(actualVal)
    if (isNaN(num) || num < 0) { setActualVal(g.montoFinal || g.monto); return }
    try { await updateGasto.mutateAsync({ gastoId: g.id, data: { montoFinal: num, estaConciliado: true } }) }
    catch { sileo.error('Error') }
  }

  const handleDelete = async () => {
    try { await deleteGasto.mutateAsync(g.id); sileo.info('Gasto eliminado') }
    catch { sileo.error('Error') }
  }

  const catBg = g.categoria === 'fijos' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : g.categoria === 'ocio' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'

  return (
    <div className={`rounded-xl border p-3 bg-surface space-y-2 ${g.estaConciliado ? 'border-success/30 opacity-60' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button type="button" onClick={toggleConciliado} disabled={!hasFinal} className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${g.estaConciliado ? 'border-success bg-success text-white' : hasFinal ? 'border-border hover:border-primary' : 'border-border/30 cursor-not-allowed'}`}>
            {g.estaConciliado && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </button>
          {editDesc ? (
            <input type="text" value={descVal} onChange={(e) => setDescVal(e.target.value)} onBlur={commitDesc} onKeyDown={(e) => { if (e.key === 'Enter') commitDesc(); if (e.key === 'Escape') { setEditDesc(false); setDescVal(g.descripcion) } }} className="flex-1 rounded border border-primary/40 bg-surface px-1.5 py-0.5 text-xs text-ink focus:outline-none" autoFocus />
          ) : (
            <button type="button" onClick={() => setEditDesc(true)} className={`text-xs text-left truncate ${g.estaConciliado ? 'text-ink-muted line-through' : 'text-ink'} hover:text-primary transition-colors flex-1`}>{g.descripcion}</button>
          )}
        </div>
        <button type="button" onClick={handleDelete} className="text-ink-muted hover:text-danger transition-colors p-1 flex-shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <select value={g.categoria} onChange={(e) => changeCategoria(e.target.value)} className={`rounded-lg border-0 px-1.5 py-0.5 text-[10px] font-semibold ${catBg} focus:outline-none cursor-pointer`}>
            <option value="fijos">Fijos</option><option value="ocio">Ocio</option><option value="ahorro">Ahorro</option>
          </select>
          <span className="text-ink-muted">P: {fmt(g.montoEstimado || g.monto)}</span>
        </div>
        <div className="flex items-center gap-1">
          {hasFinal && diff !== 0 && (
            <span className={`font-semibold ${diff > 0 ? 'text-success' : 'text-danger'}`}>
              {diff > 0 ? '+' : ''}{fmt(diff)}
            </span>
          )}
          {actualEdit ? (
            <input type="number" inputMode="decimal" min={0} step="0.01" value={actualVal || ''} autoFocus onChange={(e) => setActualVal(Number(e.target.value))} onBlur={commitActual} onKeyDown={(e) => { if (e.key === 'Enter') commitActual(); if (e.key === 'Escape') { setActualEdit(false); setActualVal(g.montoFinal || g.monto) } }} className="w-16 rounded border border-primary/40 bg-surface px-1 py-0.5 text-xs text-ink text-right focus:outline-none" />
          ) : (
            <button type="button" onClick={() => setActualEdit(true)} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              R: {fmt(g.montoFinal || 0)}
            </button>
          )}
        </div>
      </div>
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
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!carteraId) return; try { const payload: CreatePresupuestoPayload = { carteraId, tipo, sobranteAnterior: sobrante, efectivoExtra: efectivo, metaFijos, metaOcio, metaAhorro }; if (tipo === 'mensual') payload.salarioMensual = salario; else { payload.salarioQ1 = salarioQ1; payload.salarioQ2 = salarioQ2 } await create.mutateAsync(payload); sileo.success('Control creado'); onClose() } catch { sileo.error('Error') } }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4"><h2 className="text-base font-semibold text-ink">Nuevo Control</h2><button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Cartera</label><SearchableSelect options={(bancos ?? []).map((b) => ({ value: b.id, label: `${b.nombre}-${b.creadoPorNombre}-${b.tipoCuenta === 'credito' ? 'C' : 'D'}` }))} value={carteraId} onChange={setCarteraId} placeholder="Seleccionar cartera" required /></div>
          <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Frecuencia</label><div className="flex rounded-xl border border-border overflow-hidden"><button type="button" onClick={() => setTipo('mensual')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'mensual' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Mensual</button><button type="button" onClick={() => setTipo('quincenal')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'quincenal' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Quincenal</button></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Sobrante anterior</label><input type="number" min={0} inputMode="decimal" step="0.01" value={sobrante || ''} onChange={(e) => setSobrante(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Efectivo extra</label><input type="number" min={0} inputMode="decimal" step="0.01" value={efectivo || ''} onChange={(e) => setEfectivo(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div></div>
          {tipo === 'mensual' ? <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Salario mensual</label><input type="number" min={0} inputMode="decimal" step="0.01" value={salario || ''} onChange={(e) => setSalario(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div> : <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Salario Q1</label><input type="number" min={0} inputMode="decimal" step="0.01" value={salarioQ1 || ''} onChange={(e) => setSalarioQ1(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Salario Q2</label><input type="number" min={0} inputMode="decimal" step="0.01" value={salarioQ2 || ''} onChange={(e) => setSalarioQ2(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div></div>}
          <div className="border-t border-border pt-4"><span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Metas del control</span><div className="grid grid-cols-3 gap-2 mt-2"><div><label className="mb-1 block text-[10px] text-ink-muted">Gastos Fijos</label><input type="number" min={0} inputMode="decimal" step="0.01" value={metaFijos || ''} onChange={(e) => setMetaFijos(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div><div><label className="mb-1 block text-[10px] text-ink-muted">Ocio</label><input type="number" min={0} inputMode="decimal" step="0.01" value={metaOcio || ''} onChange={(e) => setMetaOcio(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent/50 focus:outline-none" /></div><div><label className="mb-1 block text-[10px] text-ink-muted">Ahorro</label><input type="number" min={0} inputMode="decimal" step="0.01" value={metaAhorro || ''} onChange={(e) => setMetaAhorro(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-success/50 focus:outline-none" /></div></div></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button><button type="submit" disabled={create.isPending || !carteraId} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{create.isPending ? 'Creando...' : 'Crear control'}</button></div>
        </form>
      </div>
    </div>
  )
}

function AddGastoModal({ open, onClose, presupuestoId, mostrarQ }: { open: boolean; onClose: () => void; presupuestoId: string; mostrarQ: boolean }) {
  const addGasto = useAddGasto(presupuestoId)
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState(0)
  const [cat, setCat] = useState<'fijos' | 'ocio' | 'ahorro'>('fijos')
  const [quincena, setQuincena] = useState<'Q1' | 'Q2' | ''>('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc.trim() || monto < 1 || addGasto.isPending) return
    try {
      const payload: any = { descripcion: desc.trim(), monto, montoEstimado: monto, categoria: cat }
      if (quincena) payload.quincena = quincena
      await addGasto.mutateAsync(payload)
      setDesc(''); setMonto(0); setCat('fijos'); setQuincena('')
      sileo.success('Gasto registrado')
      onClose()
    } catch { sileo.error('Error') }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Agregar Gasto</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-ink-muted hover:bg-surface hover:text-ink">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5 px-5 py-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Descripción</label>
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: Comida del mes" maxLength={200} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Monto</label>
            <input type="number" min={1} inputMode="decimal" step="0.01" value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} placeholder="$ 0" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Categoría</label>
            <select value={cat} onChange={(e) => setCat(e.target.value as 'fijos' | 'ocio' | 'ahorro')} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none">
              <option value="fijos">Gastos Fijos</option><option value="ocio">Ocio</option><option value="ahorro">Ahorro</option>
            </select>
          </div>
          {mostrarQ && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Quincena</label>
              <select value={quincena} onChange={(e) => setQuincena(e.target.value as 'Q1' | 'Q2' | '')} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none">
                <option value="">Sin quincena</option><option value="Q1">Q1</option><option value="Q2">Q2</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button>
            <button type="submit" disabled={!desc.trim() || monto < 1 || addGasto.isPending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{addGasto.isPending ? '...' : 'Agregar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PresupuestoDetail({ presupuestoId, onClose }: { presupuestoId: string; onClose: () => void }) {
  const { data: p, isLoading } = usePresupuestoDetail(presupuestoId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [tabQuincena, setTabQuincena] = useState<'Q1' | 'Q2' | 'todas'>('todas')

  if (isLoading || !p) return <div className="flex items-center justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" /></div>
  
  const exportToCSV = () => {
    if (!p) return
    const headers = ['Descripcion', 'Categoria', 'Monto Estimado', 'Monto Actual', 'Estado']
    const rows = (p.gastos ?? []).map((g) => [
      g.descripcion,
      CAT_LABELS[g.categoria] || g.categoria,
      g.montoEstimado || g.monto,
      g.estaConciliado ? (g.montoFinal || g.monto) : '-',
      g.estaConciliado ? 'Conciliado' : 'Pendiente'
    ])
    
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `presupuesto_${p.tipo}_${p.id.slice(0, 8)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    sileo.success('CSV descargado')
  }

  const gastos: Gasto[] = p.gastos ?? []
  const mostrarQ = p.tipo === 'quincenal'
  const gastosFiltrados = mostrarQ && tabQuincena !== 'todas' ? gastos.filter((g) => g.quincena === tabQuincena) : gastos
  const totalesPorCat: Record<string, { estimado: number; actual: number; meta: number }> = { fijos: { estimado: 0, actual: 0, meta: p.metaFijos }, ocio: { estimado: 0, actual: 0, meta: p.metaOcio }, ahorro: { estimado: 0, actual: 0, meta: p.metaAhorro } }
  gastosFiltrados.forEach((g) => { totalesPorCat[g.categoria].estimado += g.montoEstimado || g.monto; totalesPorCat[g.categoria].actual += g.estaConciliado ? (g.montoFinal || g.monto) : 0 })

  const totalEstimado = Object.values(totalesPorCat).reduce((s, t) => s + t.estimado, 0)
  const totalActual = Object.values(totalesPorCat).reduce((s, t) => s + t.actual, 0)

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col h-full animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-ink">Control {p.tipo === 'mensual' ? 'Mensual' : 'Quincenal'}</h2>
            <p className="text-xs text-ink-muted mt-0.5">{p.tipo === 'mensual' ? `Salario: ${fmt(p.salarioMensual)}` : `Q1: ${fmt(p.salarioQ1)} | Q2: ${fmt(p.salarioQ2)}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportToCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface transition-colors" title="Exportar a CSV">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exportar CSV
            </button>
            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <CalcSummary p={p} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DonutCard p={p} />
            <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Presupuestado</span><span className="font-semibold text-ink">{fmt(totalEstimado)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Conciliado</span><span className="font-semibold text-success">{fmt(totalActual)}</span></div>
              <div className="border-t border-border pt-2"><div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Total disponible</span><span className="font-semibold text-ink">{fmt(p.sobranteAnterior + p.efectivoExtra + (p.tipo === 'mensual' ? p.salarioMensual : p.salarioQ1 + p.salarioQ2))}</span></div></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['fijos', 'ocio', 'ahorro'] as const).map((c) => {
              const t = totalesPorCat[c]; const pct = t.meta > 0 ? Math.min(100, Math.round((t.estimado / t.meta) * 100)) : 0
              return <div key={c} className="rounded-xl bg-surface border border-border px-3 py-2.5 text-center">
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">{CAT_LABELS[c]}</span>
                <p className="text-xs font-bold text-ink mt-0.5">{fmt(t.estimado)} / {fmt(t.meta)}</p>
                <div className="h-1 w-full rounded-full bg-border mt-1"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${pct}%` }} /></div>
              </div>
            })}
          </div>

          {mostrarQ && (
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button type="button" onClick={() => setTabQuincena('todas')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'todas' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Todas</button>
              <button type="button" onClick={() => setTabQuincena('Q1')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'Q1' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Q1</button>
              <button type="button" onClick={() => setTabQuincena('Q2')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'Q2' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Q2</button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Gastos</h3>
              <div className="flex items-center gap-3 text-[10px] text-ink-muted">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-border" /> Presupuesto</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-success" /> Actual</span>
              </div>
            </div>

            <div className="mb-3">
              <button type="button" onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Agregar Gasto
              </button>
            </div>

            {gastosFiltrados.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-8">Sin gastos registrados aún.</p>
            ) : (
              <div className="space-y-2">
                {gastosFiltrados.map((g) => <GastoCard key={g.id} g={g} presupuestoId={presupuestoId} />)}
              </div>
            )}
          </div>
        </div>
        <AddGastoModal open={showAddModal} onClose={() => setShowAddModal(false)} presupuestoId={presupuestoId} mostrarQ={mostrarQ} />
      </div>
    </div>
  )
}

export default function PresupuestosPage() {
  const { data: presupuestos, isLoading } = useFetchPresupuestos()
  const deleteP = useDeletePresupuesto()
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Control de Finanzas</h1>
          <p className="mt-1 text-sm text-ink-muted">Controlá tus gastos basado en tu frecuencia de salario</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo control
        </button>
      </div>
      {isLoading && <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="glass rounded-2xl p-5 space-y-3"><div className="skeleton h-4 w-48" /><div className="skeleton h-8 w-full rounded-xl" /></div>)}</div>}
      {!isLoading && (!presupuestos || presupuestos.length === 0) && (
        <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20" style={{ animation: 'float 3s ease-in-out infinite' }}>
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-ink">Sin controles</h3>
          <p className="mt-1.5 text-sm text-ink-muted">Creá tu primer control financiero vinculado a una cartera.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Crear control
          </button>
        </div>
      )}
      {!isLoading && presupuestos && presupuestos.length > 0 && (
        <div className="space-y-3 stagger">
          {presupuestos.map((p) => {
            const gastos = p.gastos ?? [];
            const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0);
            const ingresos = p.tipo === 'mensual' ? p.sobranteAnterior + p.salarioMensual + p.efectivoExtra : p.sobranteAnterior + p.salarioQ1 + p.salarioQ2 + p.efectivoExtra;
            const queda = Math.max(0, ingresos - totalGastado);
            return (
              <div key={p.id} className="glass rounded-2xl border-l-4 border-l-primary card-hover p-5 cursor-pointer" onClick={() => setDetailId(p.id)}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Control {p.tipo === 'mensual' ? 'Mensual' : 'Quincenal'}</h3>
                    <p className="text-[11px] text-ink-muted mt-0.5">{p.tipo === 'mensual' ? `Salario: ${fmt(p.salarioMensual)}` : `Q1: ${fmt(p.salarioQ1)} | Q2: ${fmt(p.salarioQ2)}`} · {gastos.length} gastos</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id) }} className="text-ink-muted hover:text-danger transition-colors p-1" title="Eliminar control">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['fijos', 'ocio', 'ahorro'] as const).map((c) => {
                    const catTotal = gastos.filter((g) => g.categoria === c).reduce((s: number, g) => s + g.monto, 0);
                    const meta = c === 'fijos' ? p.metaFijos : c === 'ocio' ? p.metaOcio : p.metaAhorro;
                    const pct = meta > 0 ? Math.min(100, Math.round((catTotal / meta) * 100)) : 0;
                    return <div key={c} className="text-center"><span className="text-[10px] text-ink-muted">{CAT_LABELS[c]}</span><div className="h-1.5 w-full rounded-full bg-border mt-0.5"><div className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${pct}%` }} /></div><span className="text-[10px] font-medium text-ink">{fmt(catTotal)}/{fmt(meta)}</span></div>
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Disponible</span>
                  <span className={`font-semibold ${queda >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(ingresos)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} />
      {detailId && <PresupuestoDetail presupuestoId={detailId} onClose={() => setDetailId(null)} />}
      {confirmDeleteId && createPortal(
        <ConfirmModal
          open={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={async () => {
            try {
              await deleteP.mutateAsync(confirmDeleteId)
              sileo.info('Control eliminado')
              setConfirmDeleteId(null)
            } catch {
              sileo.error('Error al eliminar')
            }
          }}
          title="Eliminar Control"
          message="¿Estás seguro de que deseas eliminar este control? Se perderán todos los gastos asociados de forma permanente."
          confirmLabel="Eliminar"
          danger
          loading={deleteP.isPending}
        />,
        document.body
      )}
    </main>
  )
}
