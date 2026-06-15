// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFetchControles, useCreatePresupuesto, useDeletePresupuesto, usePresupuestoDetail, useAddGasto, useDeleteGasto, useUpdateGasto, useUpdateGastoFecha, usePagarGasto, useCerrarMes, useCarryToNewYear, useDeleteControl } from '@/hooks/usePresupuestos'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { sileo } from '@/lib/sileo'
import type { Presupuesto, CreatePresupuestoPayload, Gasto } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import ConfirmModal from '@/components/ConfirmModal'
import CalendarBudget from '@/components/CalendarBudget'
import EditGastoModal from '@/components/EditGastoModal'
import GastoActionModal from '@/components/GastoActionModal'
import { MESES, CAT_LABELS, fmt } from '@/lib/formatters'



function ingresos(p: Presupuesto) {
  return p.tipo === 'mensual'
    ? p.sobranteAnterior + p.salarioMensual + p.efectivoExtra
    : p.sobranteAnterior + p.salarioQ1 + p.salarioQ2 + p.efectivoExtra
}

function CalcSummary({ p }: { p: Presupuesto }) {
  const gastos = p.gastos ?? []
  const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0)
  const inc = ingresos(p)
  const queda = Math.max(0, inc - totalGastado)
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
        <p className={`text-sm font-bold ${queda >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(inc)}</p>
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
      <div className="h-20 w-20 flex-shrink-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart><Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={32} dataKey="value" stroke="none">
            {data.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie></PieChart>
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
            <><button type="button" onClick={() => setEditDesc(true)} className={`text-xs text-left truncate ${g.estaConciliado ? 'text-ink-muted line-through' : 'text-ink'} hover:text-primary transition-colors flex-1`}>{g.descripcion}</button>
            {g.esFijo && <span className="flex-shrink-0 rounded bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-200">Fijo</span>}</>
          )}
        </div>
        <button type="button" onClick={handleDelete} className="text-ink-muted hover:text-danger transition-colors p-1 flex-shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select value={g.categoria} onChange={(e) => changeCategoria(e.target.value)} className={`rounded-lg border-0 px-1.5 py-0.5 text-[10px] font-semibold ${catBg} focus:outline-none cursor-pointer`}>
              <option value="fijos">Fijos</option><option value="ocio">Ocio</option><option value="ahorro">Ahorro</option>
            </select>
            {g.esFijo && g.cuotasOriginales > 0 && (
              <span className="text-[10px] text-ink-muted font-medium">Cuota {g.cuotasRestantes}/{g.cuotasOriginales}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <span>Presup: <strong className="text-ink">{fmt(g.montoEstimado || g.monto)}</strong></span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          {hasFinal && diff !== 0 && (
            <span className={`text-xs font-semibold ${diff > 0 ? 'text-success' : 'text-danger'}`}>
              {diff > 0 ? 'Ahorro +' : 'Perdida '}{fmt(Math.abs(diff))}
            </span>
          )}
          {!hasFinal && <span />}
          {actualEdit ? (
            <input type="number" inputMode="decimal" min={0} step="0.01" value={actualVal || ''} autoFocus onChange={(e) => setActualVal(Number(e.target.value))} onBlur={commitActual} onKeyDown={(e) => { if (e.key === 'Enter') commitActual(); if (e.key === 'Escape') { setActualEdit(false); setActualVal(g.montoFinal || g.monto) } }} className="w-24 rounded-lg border border-primary/40 bg-surface px-2 py-1 text-xs text-ink text-right focus:outline-none" />
          ) : (
            <button type="button" onClick={() => setActualEdit(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Real: <strong>{fmt(g.montoFinal || 0)}</strong>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreatePresupuesto()
  const currentYear = new Date().getFullYear()
  const [tipo, setTipo] = useState<'mensual' | 'quincenal'>('mensual')
  const [year, setYear] = useState(currentYear)
  const [sobrante, setSobrante] = useState(0)
  const [efectivo, setEfectivo] = useState(0)
  const [salario, setSalario] = useState(0)
  const [mesDesde, setMesDesde] = useState(1)
  const [modoAnual, setModoAnual] = useState(true)
  const [gastosFijos, setGastosFijos] = useState<{ desc: string; monto: number; cat: 'fijos' | 'ocio' | 'ahorro'; quincena: string; cuotas: number; fechaPago: string }[]>([])

  const addGastoFijo = () => setGastosFijos([...gastosFijos, { desc: '', monto: 0, cat: 'fijos', quincena: '', cuotas: 0, fechaPago: '' }])
  const removeGastoFijo = (i: number) => setGastosFijos(gastosFijos.filter((_, idx) => idx !== i))
  const updateGastoFijo = (i: number, field: string, val: any) => {
    const copy = [...gastosFijos]; (copy[i] as any)[field] = val; setGastosFijos(copy)
  }

  if (!open) return null
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); try {
      const payload: any = { tipo, year, sobranteAnterior: sobrante, efectivoExtra: efectivo, mesDesde: modoAnual ? undefined : mesDesde }
      if (tipo === 'mensual') payload.salarioMensual = salario
      else { payload.salarioQ1 = salario / 2; payload.salarioQ2 = salario / 2 }
      const fijos = gastosFijos.filter(g => g.desc.trim() && g.monto > 0).map(g => ({
        descripcion: g.desc.trim(), monto: g.monto,
        categoria: g.cat, esFijo: true,
        cuotas: g.cuotas || 0,
        quincena: g.quincena || undefined,
        fechaPago: g.fechaPago || undefined,
      }))
      if (fijos.length) payload.gastosFijos = fijos
      await create.mutateAsync(payload); sileo.success('Control anual creado'); onClose()
    } catch { sileo.error('Error') }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4"><h2 className="text-base font-semibold text-ink">Nuevo Control Anual</h2><button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Frecuencia</label><div className="flex rounded-xl border border-border overflow-hidden"><button type="button" onClick={() => setTipo('mensual')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'mensual' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Mensual</button><button type="button" onClick={() => setTipo('quincenal')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'quincenal' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Quincenal</button></div></div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Año</label><input type="number" min={2020} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div>
            <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Salario total</label><input type="number" min={0} inputMode="decimal" step="0.01" value={salario || ''} onChange={(e) => setSalario(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div>
          </div>

          <div><label className="mb-1.5 block text-xs font-semibold text-ink-secondary">Inicio</label><div className="flex rounded-xl border border-border overflow-hidden"><button type="button" onClick={() => setModoAnual(true)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${modoAnual ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Enero - Diciembre</button><button type="button" onClick={() => setModoAnual(false)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${!modoAnual ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Desde mes específico</button></div></div>
          {!modoAnual && (
            <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Mes de inicio</label>
              <select value={mesDesde} onChange={(e) => setMesDesde(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select></div>
          )}
          {salario > 0 && tipo === 'quincenal' && <p className="text-[10px] text-ink-muted -mt-2">Se divide automáticamente: Q1 ${(salario / 2).toLocaleString()} · Q2 ${(salario / 2).toLocaleString()}</p>}

          <div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Sobrante anterior</label><input type="number" min={0} inputMode="decimal" step="0.01" value={sobrante || ''} onChange={(e) => setSobrante(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div><div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Efectivo extra</label><input type="number" min={0} inputMode="decimal" step="0.01" value={efectivo || ''} onChange={(e) => setEfectivo(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div></div>

          <div className="border-t border-border pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Gastos Fijos Recurrentes</span>
            <p className="text-[10px] text-ink-muted mt-1 mb-2">Se crearán en los 12 meses automáticamente.</p>
            {gastosFijos.map((g, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-3 mb-2 relative">
                <button type="button" onClick={() => removeGastoFijo(i)} className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-ink-muted hover:bg-danger hover:text-white hover:border-danger transition-all shadow-sm z-10">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="mb-2">
                  <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-ink-muted">Descripción</label>
                  <input type="text" value={g.desc} onChange={(e) => updateGastoFijo(i, 'desc', e.target.value)} placeholder="Ej: Netflix, Renta, Gym..." className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-ink-muted">Monto</label>
                    <input type="number" min={0} step="0.01" value={g.monto || ''} onChange={(e) => updateGastoFijo(i, 'monto', Number(e.target.value))} placeholder="$ 0.00" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-ink-muted">Categoría</label>
                    <select value={g.cat} onChange={(e) => updateGastoFijo(i, 'cat', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                      <option value="fijos">Fijos</option><option value="ocio">Ocio</option><option value="ahorro">Ahorro</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-ink-muted">Fecha de pago</label>
                    <input type="date" value={g.fechaPago} onChange={(e) => updateGastoFijo(i, 'fechaPago', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  </div>
                  {tipo === 'quincenal' && (
                    <div>
                      <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-ink-muted">Quincena</label>
                      <select value={g.quincena} onChange={(e) => updateGastoFijo(i, 'quincena', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
                        <option value="">Ambas</option><option value="Q1">Q1</option><option value="Q2">Q2</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className={tipo === 'quincenal' ? '' : 'col-span-2'}>
                    <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-ink-muted">Cuotas (0 = ilimitado)</label>
                    <input type="number" min={0} step={1} value={g.cuotas || ''} onChange={(e) => updateGastoFijo(i, 'cuotas', Number(e.target.value))} placeholder="0" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addGastoFijo} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-ink-muted hover:border-primary/50 hover:text-primary transition-colors w-full justify-center mt-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Agregar gasto fijo
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button><button type="submit" disabled={create.isPending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{create.isPending ? 'Creando...' : 'Crear control anual'}</button></div>
        </form>
      </div>
    </div>
  )
}

function AddGastoModal({ open, onClose, presupuestoId, mostrarQ, fechaPreset, defaultCarteraId }: { open: boolean; onClose: () => void; presupuestoId: string; mostrarQ: boolean; fechaPreset?: string; defaultCarteraId?: string }) {
  const addGasto = useAddGasto(presupuestoId)
  const { data: bancos } = useFetchBancos()
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState(0)
  const [cat, setCat] = useState<'fijos' | 'ocio' | 'ahorro'>('fijos')
  const [quincena, setQuincena] = useState<'Q1' | 'Q2' | ''>('')
  const [fecha, setFecha] = useState(fechaPreset || new Date().toISOString().split('T')[0])
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [recurrenciaTipo, setRecurrenciaTipo] = useState<'mensual' | 'semanal'>('mensual')
  const [cuotas, setCuotas] = useState(0)
  const [carteraId, setCarteraId] = useState(defaultCarteraId || '')

  useEffect(() => { if (fechaPreset) setFecha(fechaPreset) }, [fechaPreset])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc.trim() || monto < 1 || addGasto.isPending) return
    try {
      const payload: any = { descripcion: desc.trim(), monto, montoEstimado: monto, categoria: cat, fecha }
      if (quincena) payload.quincena = quincena
      if (carteraId) payload.carteraId = carteraId
      if (esRecurrente) {
        payload.esRecurrente = true
        payload.recurrenciaTipo = recurrenciaTipo
        payload.cuotas = cuotas
        payload.fechaOrigen = fecha
      }
      await addGasto.mutateAsync(payload)
      setDesc(''); setMonto(0); setCat('fijos'); setQuincena(''); setFecha(new Date().toISOString().split('T')[0]); setEsRecurrente(false); setRecurrenciaTipo('mensual'); setCuotas(0); setCarteraId('')
      sileo.success('Gasto registrado')
      onClose()
    } catch { sileo.error('Error') }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass rounded-2xl shadow-xl w-full max-w-sm animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">Agregar Gasto</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-1 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5 px-5 py-4">
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Descripción</label><input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: Comida del mes" maxLength={200} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" autoFocus /></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Monto</label><input type="number" min={1} inputMode="decimal" step="0.01" value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} placeholder="$ 0" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" /></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Categoría</label><select value={cat} onChange={(e) => setCat(e.target.value as 'fijos' | 'ocio' | 'ahorro')} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none"><option value="fijos">Gastos Fijos</option><option value="ocio">Ocio</option><option value="ahorro">Ahorro</option></select></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Fecha</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" /></div>
          {bancos && bancos.length > 0 && (
            <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Pagado desde</label><select value={carteraId} onChange={(e) => setCarteraId(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none"><option value="">Sin cartera (efectivo)</option>{bancos.map((b: any) => <option key={b.id} value={b.id}>{b.nombre} - ${b.saldo.toLocaleString()}</option>)}</select></div>
          )}
          {mostrarQ && <div><label className="mb-1 block text-[11px] font-semibold text-ink-muted">Quincena</label><select value={quincena} onChange={(e) => setQuincena(e.target.value as 'Q1' | 'Q2' | '')} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none"><option value="">Sin quincena</option><option value="Q1">Q1</option><option value="Q2">Q2</option></select></div>}
          <div className="border-t border-border pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={esRecurrente} onChange={(e) => setEsRecurrente(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/30" />
              <span className="text-xs font-semibold text-ink">¿Es recurrente?</span>
            </label>
            {esRecurrente && (
              <div className="mt-2 space-y-2 pl-6">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button type="button" onClick={() => setRecurrenciaTipo('mensual')} className={`flex-1 py-1.5 text-xs font-semibold ${recurrenciaTipo === 'mensual' ? 'bg-primary/15 text-primary' : 'text-ink-muted'}`}>Mensual</button>
                  <button type="button" onClick={() => setRecurrenciaTipo('semanal')} className={`flex-1 py-1.5 text-xs font-semibold ${recurrenciaTipo === 'semanal' ? 'bg-primary/15 text-primary' : 'text-ink-muted'}`}>Semanal</button>
                </div>
                <div><label className="mb-0.5 block text-[10px] font-semibold text-ink-muted">Cuotas (0 = indefinido)</label><input type="number" min={0} value={cuotas || ''} onChange={(e) => setCuotas(Number(e.target.value))} className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-primary/50" /></div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-1"><button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button><button type="submit" disabled={!desc.trim() || monto < 1 || addGasto.isPending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{addGasto.isPending ? '...' : 'Agregar'}</button></div>
        </form>
      </div>
    </div>
  )
}

function PresupuestoDetail({ presupuestoId, onClose }: { presupuestoId: string; onClose: () => void }) {
  const { data: p, isLoading } = usePresupuestoDetail(presupuestoId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [tabQuincena, setTabQuincena] = useState<'Q1' | 'Q2' | 'todas'>('todas')
  const cerrarMes = useCerrarMes()

  if (isLoading || !p) return <div className="flex items-center justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" /></div>

  const gastos: Gasto[] = p.gastos ?? []
  const mostrarQ = p.tipo === 'quincenal'
  const gastosFiltrados = mostrarQ && tabQuincena !== 'todas' ? gastos.filter((g) => g.quincena === tabQuincena) : gastos
  const totalesPorCat: Record<string, { estimado: number; actual: number; meta: number }> = { fijos: { estimado: 0, actual: 0, meta: p.metaFijos }, ocio: { estimado: 0, actual: 0, meta: p.metaOcio }, ahorro: { estimado: 0, actual: 0, meta: p.metaAhorro } }
  gastosFiltrados.forEach((g) => { totalesPorCat[g.categoria].estimado += g.montoEstimado || g.monto; totalesPorCat[g.categoria].actual += g.estaConciliado ? (g.montoFinal || g.monto) : 0 })
  const totalEstimado = Object.values(totalesPorCat).reduce((s, t) => s + t.estimado, 0)
  const totalActual = Object.values(totalesPorCat).reduce((s, t) => s + t.actual, 0)
  const inc = ingresos(p)
  const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0)

  const handleCerrarMes = async () => {
    try {
      const res: any = await cerrarMes.mutateAsync(presupuestoId)
      if (res.canClose === false) {
        sileo.error(`⚠️ ${res.unpaidGastos.length} gastos sin método de pago`)
        res.unpaidGastos.forEach((g: any) => sileo.info(`• ${g.descripcion}: $${g.monto.toLocaleString()}`))
        return
      }
      sileo.success(`Mes cerrado. Remanente: ${fmt(res.remainder)}`)
    } catch { sileo.error('Error al cerrar mes') }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col h-full animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-ink">{MESES[p.mes - 1] || `Mes ${p.mes}`} {p.year > 0 ? p.year : ''}</h2>
            <p className="text-xs text-ink-muted mt-0.5">{p.tipo === 'mensual' ? `Salario: ${fmt(p.salarioMensual)}` : `Q1: ${fmt(p.salarioQ1)} | Q2: ${fmt(p.salarioQ2)}`} · {gastos.length} gastos</p>
          </div>
          <div className="flex items-center gap-2">
            {!p.cerrado && (
              <button type="button" onClick={handleCerrarMes} disabled={cerrarMes.isPending} className="inline-flex items-center gap-1.5 rounded-xl bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Cerrar Mes
              </button>
            )}
            {p.cerrado && <span className="inline-flex items-center gap-1 rounded-xl bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">Cerrado</span>}
            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <CalcSummary p={p} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DonutCard p={p} />
            <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Presupuestado</span><span className="font-semibold text-ink">{fmt(totalEstimado)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Conciliado</span><span className="font-semibold text-success">{fmt(totalActual)}</span></div>
              <div className="border-t border-border pt-2"><div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Total disponible</span><span className="font-semibold text-ink">{fmt(inc)}</span></div></div>
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
            <>
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button type="button" onClick={() => setTabQuincena('todas')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'todas' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Todas</button>
                <button type="button" onClick={() => setTabQuincena('Q1')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'Q1' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Q1</button>
                <button type="button" onClick={() => setTabQuincena('Q2')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'Q2' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Q2</button>
              </div>
              <div className="rounded-xl bg-surface border border-border p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between"><span className="text-ink-muted">Q1 · Saldo inicial</span><span className="font-semibold text-ink">{fmt(p.sobranteAnterior)}</span></div>
                <div className="flex items-center justify-between"><span className="text-ink-muted">Q1 · Salario</span><span className="font-semibold text-ink">+{fmt(p.salarioQ1)}</span></div>
                {(() => { const q1Gastos = gastos.filter(g => g.quincena === 'Q1'); const q1Total = q1Gastos.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); return <div className="flex items-center justify-between"><span className="text-ink-muted">Q1 · Gastos</span><span className="font-semibold text-danger">-{fmt(q1Total)}</span></div> })()}
                {(() => { const q1Gastos = gastos.filter(g => g.quincena === 'Q1'); const q1Total = q1Gastos.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); const q1Restante = p.sobranteAnterior + p.salarioQ1 - q1Total; return <div className="flex items-center justify-between border-t border-border pt-1"><span className="text-ink-muted">Q1 · Pasa a Q2</span><span className={`font-semibold ${q1Restante >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(q1Restante)}</span></div> })()}
                <div className="flex items-center justify-between"><span className="text-ink-muted">Q2 · Salario</span><span className="font-semibold text-ink">+{fmt(p.salarioQ2)}</span></div>
                {(() => { const q2Gastos = gastos.filter(g => g.quincena === 'Q2'); const q2Total = q2Gastos.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); return <div className="flex items-center justify-between"><span className="text-ink-muted">Q2 · Gastos</span><span className="font-semibold text-danger">-{fmt(q2Total)}</span></div> })()}
                {(() => { const q1Gastos = gastos.filter(g => g.quincena === 'Q1'); const q1Total = q1Gastos.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); const q2Gastos = gastos.filter(g => g.quincena === 'Q2'); const q2Total = q2Gastos.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); const q1Restante = p.sobranteAnterior + p.salarioQ1 - q1Total; const q2Restante = q1Restante + p.salarioQ2 - q2Total; return <div className="flex items-center justify-between border-t border-border pt-1"><span className="text-ink-muted">Q2 · Final del mes</span><span className={`font-semibold ${q2Restante >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(q2Restante)}</span></div> })()}
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Gastos</h3>
                {p.cerrado && <span className="text-[10px] text-ink-muted">· Remanente: {fmt(inc - totalGastado)}</span>}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-ink-muted">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-border" /> Presupuesto</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-success" /> Actual</span>
              </div>
            </div>

            <div className="mb-3">
              <button type="button" onClick={() => setShowAddModal(true)} disabled={p.cerrado} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light transition-colors disabled:opacity-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Agregar Gasto
              </button>
            </div>

            {gastosFiltrados.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-8">Sin gastos registrados aún.</p>
            ) : (
              <div className="space-y-2">{gastosFiltrados.map((g) => <GastoCard key={g.id} g={g} presupuestoId={presupuestoId} />)}</div>
            )}
          </div>
        </div>
        <AddGastoModal open={showAddModal} onClose={() => setShowAddModal(false)} presupuestoId={presupuestoId} mostrarQ={mostrarQ} />
      </div>
    </div>
  )
}

function ControlDetail({ control, onClose }: { control: any; onClose: () => void }) {
  const presupuestos = (control.presupuestos ?? []).sort((a: any, b: any) => a.mes - b.mes)
  const [mesActivo, setMesActivo] = useState(presupuestos[0]?.mes ?? 1)
  const p = presupuestos.find((x: any) => x.mes === mesActivo)
  const [showAddModal, setShowAddModal] = useState(false)
  const [tabQuincena, setTabQuincena] = useState<'Q1' | 'Q2' | 'todas'>('todas')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const cerrarMes = useCerrarMes()
  const deleteControl = useDeleteControl()
  const { data: detalle } = usePresupuestoDetail(p?.id ?? '')

  const mesData = detalle ?? p
  if (!p) return null

  const gastos: Gasto[] = mesData.gastos ?? []
  const mostrarQ = control.tipo === 'quincenal'
  const gastosFiltrados = mostrarQ && tabQuincena !== 'todas' ? gastos.filter((g) => g.quincena === tabQuincena) : gastos
  const totalesPorCat: Record<string, { estimado: number; actual: number }> = { fijos: { estimado: 0, actual: 0 }, ocio: { estimado: 0, actual: 0 }, ahorro: { estimado: 0, actual: 0 } }
  gastosFiltrados.forEach((g) => { totalesPorCat[g.categoria].estimado += g.montoEstimado || g.monto; totalesPorCat[g.categoria].actual += g.estaConciliado ? (g.montoFinal || g.monto) : 0 })
  const totalEstimado = Object.values(totalesPorCat).reduce((s, t) => s + t.estimado, 0)
  const totalActual = Object.values(totalesPorCat).reduce((s, t) => s + t.actual, 0)
  const inc = ingresos(mesData)
  const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0)

  const handleCerrarMes = async () => {
    try {
      const res: any = await cerrarMes.mutateAsync(p.id)
      if (res.canClose === false) {
        sileo.error(`⚠️ ${res.unpaidGastos.length} gastos sin método de pago`)
        res.unpaidGastos.forEach((g: any) => sileo.info(`• ${g.descripcion}: $${g.monto.toLocaleString()}`))
        return
      }
      sileo.success(`Mes cerrado. Remanente: ${fmt(res.remainder)}`)
    } catch { sileo.error('Error al cerrar mes') }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col h-full animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <h2 className="text-base font-semibold text-ink">Control {control.year}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">{control.cerrados}/{control.totalPresupuestos} cerrados</span>
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl p-1.5 text-ink-muted hover:bg-danger hover:text-white transition-colors" title="Eliminar control">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
        <div className="border-b border-border px-5 py-2.5 flex gap-1 overflow-x-auto flex-shrink-0">
          {presupuestos.map((m: any) => (
            <button key={m.mes} type="button" onClick={() => { setMesActivo(m.mes); setTabQuincena('todas') }}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mesActivo === m.mes ? 'bg-primary/15 text-primary shadow-sm' : 'text-ink-muted hover:bg-surface hover:text-ink'} ${m.cerrado ? 'ring-1 ring-success/30' : ''}`}>
              {MESES[m.mes - 1]}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">{MESES[mesActivo - 1]} {control.year}</h3>
              {mesData.cerrado && <span className="rounded bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Cerrado</span>}
            </div>
            {!mesData.cerrado && (
              <button type="button" onClick={handleCerrarMes} disabled={cerrarMes.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Cerrar Mes
              </button>
            )}
          </div>
          <CalcSummary p={mesData} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DonutCard p={mesData} />
            <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Presupuestado</span><span className="font-semibold text-ink">{fmt(totalEstimado)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Conciliado</span><span className="font-semibold text-success">{fmt(totalActual)}</span></div>
              <div className="border-t border-border pt-2"><div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Total disponible</span><span className="font-semibold text-ink">{fmt(inc)}</span></div></div>
            </div>
          </div>
          {mostrarQ && (
            <>
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button type="button" onClick={() => setTabQuincena('todas')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'todas' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Todas</button>
                <button type="button" onClick={() => setTabQuincena('Q1')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'Q1' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Q1</button>
                <button type="button" onClick={() => setTabQuincena('Q2')} className={`flex-1 py-2 text-xs font-semibold transition-colors ${tabQuincena === 'Q2' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Q2</button>
              </div>
              <div className="rounded-xl bg-surface border border-border p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between"><span className="text-ink-muted">Q1 · Saldo inicial</span><span className="font-semibold text-ink">{fmt(mesData.sobranteAnterior)}</span></div>
                <div className="flex items-center justify-between"><span className="text-ink-muted">Q1 · Salario</span><span className="font-semibold text-ink">+{fmt(mesData.salarioQ1)}</span></div>
                {(() => { const q1g = gastos.filter(g => g.quincena === 'Q1'); const t = q1g.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); return <div className="flex items-center justify-between"><span className="text-ink-muted">Q1 · Gastos</span><span className="font-semibold text-danger">-{fmt(t)}</span></div> })()}
                {(() => { const q1g = gastos.filter(g => g.quincena === 'Q1'); const t = q1g.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); const r = mesData.sobranteAnterior + mesData.salarioQ1 - t; return <div className="flex items-center justify-between border-t border-border pt-1"><span className="text-ink-muted">Q1 · Pasa a Q2</span><span className={`font-semibold ${r >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(r)}</span></div> })()}
                <div className="flex items-center justify-between"><span className="text-ink-muted">Q2 · Salario</span><span className="font-semibold text-ink">+{fmt(mesData.salarioQ2)}</span></div>
                {(() => { const q2g = gastos.filter(g => g.quincena === 'Q2'); const t = q2g.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); return <div className="flex items-center justify-between"><span className="text-ink-muted">Q2 · Gastos</span><span className="font-semibold text-danger">-{fmt(t)}</span></div> })()}
                {(() => { const q1g = gastos.filter(g => g.quincena === 'Q1'); const q2g = gastos.filter(g => g.quincena === 'Q2'); const q1t = q1g.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); const q2t = q2g.reduce((s, g) => s + (g.estaConciliado ? (g.montoFinal || g.monto) : g.monto), 0); const r = mesData.sobranteAnterior + mesData.salarioQ1 - q1t + mesData.salarioQ2 - q2t; return <div className="flex items-center justify-between border-t border-border pt-1"><span className="text-ink-muted">Q2 · Final del mes</span><span className={`font-semibold ${r >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(r)}</span></div> })()}
              </div>
            </>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Gastos</h3>
                {mesData.cerrado && <span className="text-[10px] text-ink-muted">· Remanente: {fmt(inc - totalGastado)}</span>}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-ink-muted">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-border" /> Presupuesto</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-success" /> Actual</span>
              </div>
            </div>
            <div className="mb-3">
              <button type="button" onClick={() => setShowAddModal(true)} disabled={mesData.cerrado} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light transition-colors disabled:opacity-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Agregar Gasto
              </button>
            </div>
            {gastosFiltrados.length === 0 ? <p className="text-xs text-ink-muted text-center py-8">Sin gastos registrados aún.</p>
              : <div className="space-y-2">{gastosFiltrados.map((g) => <GastoCard key={g.id} g={g} presupuestoId={p.id} />)}</div>}
          </div>
        </div>
        <AddGastoModal open={showAddModal} onClose={() => setShowAddModal(false)} presupuestoId={p.id} mostrarQ={mostrarQ} />
        <ConfirmModal
          open={showDeleteConfirm}
          title="Eliminar control anual"
          message={`¿Estás seguro? Se eliminarán todos los meses (${control.totalPresupuestos}) y sus gastos del control ${control.year}. Esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          onConfirm={async () => {
            try { await deleteControl.mutateAsync(control.controlId); sileo.success('Control eliminado'); setShowDeleteConfirm(false); onClose() }
            catch { sileo.error('Error al eliminar'); setShowDeleteConfirm(false) }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  )
}

function ControlCard({ control }: { control: any }) {
  const [open, setOpen] = useState(false)
  const todos = (control.presupuestos ?? []).sort((a: any, b: any) => a.mes - b.mes)
  const mesActual = new Date().getMonth() + 1
  const primerCerrado = todos.find((p: any) => p.cerrado)?.mes ?? 1
  const desde = Math.min(primerCerrado, mesActual)
  const presupuestos = todos.filter((p: any) => p.mes >= desde && p.mes <= mesActual)
  const ingresosAnuales = presupuestos.reduce((s: number, p: any) => s + ingresos(p), 0)
  const gastosAnuales = presupuestos.reduce((s: number, p: any) => {
    const gs = p.gastos ?? []; return s + gs.reduce((ss: number, g: any) => ss + g.monto, 0)
  }, 0)
  const carry = useCarryToNewYear()

  const handleCarry = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res: any = await carry.mutateAsync(control.controlId)
      sileo.success(`Nuevo control ${res.year} creado con sobrante $${res.sobranteInicial.toLocaleString()}`)
    } catch { sileo.error('Error al llevar saldo') }
  }

  return (
    <>
      <div className="glass rounded-2xl border-l-4 border-l-primary/40 card-hover p-5 cursor-pointer" onClick={() => setOpen(true)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-ink">Control {control.year}</h3>
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{control.tipo === 'mensual' ? 'Mensual' : 'Quincenal'}</span>
          </div>
          <span className="text-xs text-ink-muted">{control.cerrados}/{control.totalPresupuestos} meses cerrados</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(control.cerrados / control.totalPresupuestos) * 100}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-ink-muted">
          <span className="text-ink-muted">YTD ({MESES[desde - 1]} - {MESES[mesActual - 1]})</span>
          <span>Ingresos: <strong className="text-ink">{fmt(ingresosAnuales)}</strong></span>
          <span>Gastos: <strong className="text-ink">{fmt(gastosAnuales)}</strong></span>
          <span>Balance: <strong className={ingresosAnuales - gastosAnuales >= 0 ? 'text-success' : 'text-danger'}>{fmt(ingresosAnuales - gastosAnuales)}</strong></span>
        </div>
        {control.cerrados === control.totalPresupuestos && (
          <button type="button" onClick={handleCarry} disabled={carry.isPending} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            Llevar saldo a {control.year + 1}
          </button>
        )}
      </div>
      {open && <ControlDetail control={control} onClose={() => setOpen(false)} />}
    </>
  )
}

export default function PresupuestosPage() {
  const { data: controles, isLoading } = useFetchControles()
  const create = useCreatePresupuesto()
  const [showCreate, setShowCreate] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar')
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [controlDetail, setControlDetail] = useState<any | null>(null)
  const [gastoAction, setGastoAction] = useState<{ gasto: Gasto; presupuestoId: string } | null>(null)
  const [editGasto, setEditGasto] = useState<{ gasto: Gasto; presupuestoId: string } | null>(null)
  const updateGastoFecha = useUpdateGastoFecha('')
  const pagarGasto = usePagarGasto()

  const controlActual = controles?.[0]
  const presupuestoMes = controlActual?.presupuestos?.find((p: any) => p.mes === currentMonth + 1)
  const cerrarMes = useCerrarMes()
  const carry = useCarryToNewYear()
  const yaTieneControlEsteAnio = controles?.some((c: any) => c.year === currentYear)
  const diciembreCerrado = controlActual?.presupuestos?.find((p: any) => p.mes === 12)?.cerrado
  const mostrarCrearNuevoAnio = diciembreCerrado && controles && !controles.some((c: any) => c.year === currentYear + 1)

  const handleCerrarMes = async () => {
    if (!presupuestoMes || presupuestoMes.cerrado) return
    try {
      const res: any = await cerrarMes.mutateAsync(presupuestoMes.id)
      if (res.canClose === false) {
        sileo.error(`⚠️ ${res.unpaidGastos.length} gastos sin método de pago`)
        res.unpaidGastos.forEach((g: any) => sileo.info(`• ${g.descripcion}: $${g.monto.toLocaleString()}`))
        return
      }
      sileo.success(`Mes cerrado. Remanente: ${fmt(res.remainder)}`)
      if (presupuestoMes.mes === 12 && controlActual) {
        try {
          const newYear = await carry.mutateAsync(controlActual.controlId)
          sileo.success(`🎉 Año cerrado. Control ${newYear.year} creado con $${newYear.sobranteInicial.toLocaleString()} de remanente`)
        } catch { sileo.info('Diciembre cerrado. Creá un nuevo control si querés continuar.') }
      }
    } catch { sileo.error('Error al cerrar mes') }
  }

  const handleGastoClick = (gasto: Gasto, presupuestoId: string) => {
    setGastoAction({ gasto, presupuestoId })
  }

  const handlePayGasto = async (data: { montoReal: number; carteraId: string }) => {
    if (!gastoAction) return
    try {
      const { gasto, presupuestoId } = gastoAction
      await pagarGasto.mutateAsync({ gastoId: gasto.id, presupuestoId, montoReal: data.montoReal, carteraId: data.carteraId })
      sileo.success(`✅ "${gasto.descripcion}" liquidado por $${data.montoReal.toLocaleString()}`)
      setGastoAction(null)
    } catch { sileo.error('Error al liquidar') }
  }

  const handleEditGasto = () => {
    if (gastoAction) {
      setEditGasto(gastoAction)
      setGastoAction(null)
    }
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
  }

  const handleGastoDrop = (gastoId: string, presupuestoId: string, newDay: number) => {
    const fecha = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`
    updateGastoFecha.mutate({ gastoId, fecha })
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11) }
    else { setCurrentMonth(currentMonth - 1) }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0) }
    else { setCurrentMonth(currentMonth + 1) }
  }

  const handleToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Control de Finanzas</h1>
          <p className="mt-1 text-sm text-ink-muted">Controlá tus gastos anuales, mes por mes</p>
        </div>
        <div className="flex items-center gap-2">
          {controles && controles.length > 0 && (
            <button type="button" onClick={() => setViewMode(viewMode === 'calendar' ? 'cards' : 'calendar')} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-raised transition-colors">
              {viewMode === 'calendar' ? '📋 Ver controles' : '📅 Ver calendario'}
            </button>
          )}
          {!yaTieneControlEsteAnio && (
            <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nuevo control anual
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="glass rounded-2xl p-5 space-y-3"><div className="skeleton h-4 w-48" /><div className="skeleton h-8 w-full rounded-xl" /></div>)}</div>}

      {!isLoading && (!controles || controles.length === 0) && (
        <div className="glass rounded-2xl px-6 py-16 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20" style={{ animation: 'float 3s ease-in-out infinite' }}>
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-ink">Sin controles</h3>
          <p className="mt-1.5 text-sm text-ink-muted">Creá tu primer control anual para gestionar tus finanzas mes a mes.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Crear control anual
          </button>
        </div>
      )}

      {mostrarCrearNuevoAnio && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-5 py-4 flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-sm font-semibold text-ink">🎉 {currentYear} cerrado</p>
            <p className="text-xs text-ink-muted mt-0.5">¿Querés crear un control para {currentYear + 1}?</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-light transition-colors">Crear control {currentYear + 1}</button>
        </div>
      )}

      {!isLoading && controles && controles.length > 0 && viewMode === 'calendar' && (
        <div className="space-y-4 animate-fade-in">
          <CalendarBudget
            presupuestos={controlActual?.presupuestos ?? []}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            onDayClick={handleDayClick}
            onGastoClick={handleGastoClick}
            onGastoDrop={handleGastoDrop}
          />
          <div className="flex items-center justify-between">
            {controlActual && (
              <button type="button" onClick={() => setControlDetail(controlActual)} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold">
                Ver control anual {controlActual.year} →
              </button>
            )}
            {presupuestoMes && !presupuestoMes.cerrado && (
              <button type="button" onClick={handleCerrarMes} disabled={cerrarMes.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {cerrarMes.isPending ? 'Cerrando...' : 'Cerrar Mes'}
              </button>
            )}
            {presupuestoMes?.cerrado && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">Mes Cerrado</span>
            )}
          </div>
        </div>
      )}

      {!isLoading && controles && controles.length > 0 && viewMode === 'cards' && (
        <div className="space-y-4 stagger">
          {controles.map((c: any) => <ControlCard key={c.controlId} control={c} />)}
        </div>
      )}

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} />

      {selectedDay && presupuestoMes && (
        <AddGastoModal
          open={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          presupuestoId={presupuestoMes.id}
          mostrarQ={controlActual?.tipo === 'quincenal'}
          fechaPreset={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
          defaultCarteraId={presupuestoMes.carteraId}
        />
      )}

      {gastoAction && (
        <GastoActionModal
          open={!!gastoAction}
          gasto={gastoAction.gasto}
          presupuestoId={gastoAction.presupuestoId}
          onEdit={handleEditGasto}
          onPay={handlePayGasto}
          onClose={() => setGastoAction(null)}
        />
      )}

      {editGasto && !gastoAction && (
        <EditGastoModal
          open={!!editGasto}
          onClose={() => setEditGasto(null)}
          gasto={editGasto.gasto}
          presupuestoId={editGasto.presupuestoId}
        />
      )}

      {controlDetail && (
        <ControlDetail control={controlDetail} onClose={() => setControlDetail(null)} />
      )}
    </main>
  )
}

