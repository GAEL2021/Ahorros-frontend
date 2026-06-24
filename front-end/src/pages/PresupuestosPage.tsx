// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useFetchControles, useCreatePresupuesto, useDeletePresupuesto, usePresupuestoDetail, useAddGasto, useDeleteGasto, useUpdateGasto, useUpdateGastoFecha, usePagarGasto, useCerrarMes, useCarryToNewYear, useDeleteControl, useUpdatePresupuesto } from '@/hooks/usePresupuestos'
import { useFetchBancos } from '@/hooks/useFetchBancos'
import { sileo } from '@/lib/sileo'
import type { Presupuesto, Gasto } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import ConfirmModal from '@/components/ConfirmModal'
import CalendarBudget from '@/components/CalendarBudget'
import EditGastoModal from '@/components/EditGastoModal'
import GastoActionModal from '@/components/GastoActionModal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { MESES, CATEGORIAS, CAT_LABELS, CAT_ICONS, fmt } from '@/lib/formatters'
import { useFetchTarjetas } from '@/hooks/useFetchTarjetas'
import { BudgetSavingsEvolution } from '@/components/ui/BudgetSavingsEvolution'



function ingresos(p: Presupuesto) {
  return p.tipo === 'mensual'
    ? p.sobranteAnterior + p.salarioMensual + p.efectivoExtra
    : p.sobranteAnterior + p.salarioQ1 + p.salarioQ2 + p.efectivoExtra
}

function CalcSummary({ p, gastos: gastosProp }: { p: Presupuesto; gastos?: Gasto[] }) {
  const gastos = gastosProp ?? p.gastos ?? []
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

function DonutCard({ p, gastos: gastosProp }: { p: Presupuesto; gastos?: Gasto[] }) {
  const gastos = gastosProp ?? p.gastos ?? []
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

function GastoCard({ g, presupuestoId, tipo, onGastoAction }: { g: Gasto; presupuestoId: string; tipo?: 'mensual' | 'quincenal'; onGastoAction?: (gasto: Gasto, presupuestoId: string) => void }) {
  const updateGasto = useUpdateGasto(presupuestoId)
  const deleteGasto = useDeleteGasto(presupuestoId)
  const [editDesc, setEditDesc] = useState(false)
  const [descVal, setDescVal] = useState(g.descripcion)
  const [actualEdit, setActualEdit] = useState(false)
  const [actualVal, setActualVal] = useState(g.montoFinal || g.monto)
  const [editPresup, setEditPresup] = useState(false)
  const [presupVal, setPresupVal] = useState(g.montoEstimado || g.monto)

  const hasFinal = g.montoFinal != null && g.montoFinal > 0
  const diff = hasFinal ? (g.montoEstimado || g.monto) - g.montoFinal : 0
  const quincenaActual = new Date().getDate() <= 15 ? 'Q1' : 'Q2'
  const bloqueadoQuincena = tipo === 'quincenal' && g.quincena && g.quincena !== quincenaActual

  useEffect(() => { setActualVal(g.montoFinal || g.monto) }, [g.montoFinal, g.monto])
  useEffect(() => { setDescVal(g.descripcion) }, [g.descripcion])
  useEffect(() => { setPresupVal(g.montoEstimado || g.monto) }, [g.montoEstimado, g.monto])

  const toggleConciliado = async () => {
    if (!hasFinal) return
    try {
      await updateGasto.mutateAsync({ gastoId: g.id, data: { estaConciliado: !g.estaConciliado } })
      sileo.success(g.estaConciliado ? 'Gasto desmarcado' : 'Gasto conciliado ✅')
    } catch { sileo.error('Error al conciliar') }
  }

  const commitDesc = async () => {
    setEditDesc(false)
    if (descVal.trim() && descVal !== g.descripcion) {
      try {
        await updateGasto.mutateAsync({ gastoId: g.id, data: { descripcion: descVal.trim() } })
        sileo.success('Descripción actualizada')
      } catch { sileo.error('Error al actualizar') }
    }
  }

  const changeCategoria = async (cat: string) => {
    try {
      await updateGasto.mutateAsync({ gastoId: g.id, data: { categoria: cat as 'fijos' | 'ocio' | 'ahorro' } })
      sileo.success(`Categoría cambiada a ${cat === 'fijos' ? 'Fijos' : cat === 'ocio' ? 'Ocio' : 'Ahorro'}`)
    } catch { sileo.error('Error al cambiar categoría') }
  }

  const commitActual = async () => {
    setActualEdit(false)
    const num = Number(actualVal)
    if (isNaN(num) || num < 0) { setActualVal(g.montoFinal || g.monto); return }
    try {
      await updateGasto.mutateAsync({ gastoId: g.id, data: { montoFinal: num, estaConciliado: true } })
      sileo.success(`Monto real: $${num.toLocaleString()}`)
    } catch { sileo.error('Error al actualizar') }
  }

  const commitPresup = async () => {
    setEditPresup(false)
    const num = Number(presupVal)
    if (isNaN(num) || num < 1) { setPresupVal(g.montoEstimado || g.monto); return }
    try {
      await updateGasto.mutateAsync({ gastoId: g.id, data: { monto: num, montoEstimado: num } })
      sileo.success(`Presupuesto: $${num.toLocaleString()}`)
    } catch { sileo.error('Error al actualizar') }
  }

  const handleDelete = async () => {
    try { await deleteGasto.mutateAsync(g.id); sileo.info('Gasto eliminado') }
    catch { sileo.error('Error') }
  }

  const handleRevert = async () => {
    try {
      await updateGasto.mutateAsync({ gastoId: g.id, data: { montoFinal: 0, estaConciliado: false } })
      sileo.success('Pago revertido')
    } catch { sileo.error('Error al revertir') }
  }

  const catInfo = CATEGORIAS.find(c => c.id === g.categoria)
  const catBg = catInfo?.bgClass ?? 'bg-surface text-ink'

  return (
    <div className={`rounded-xl border p-3 bg-surface space-y-2 ${g.estaConciliado ? 'border-success/30 opacity-60' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button type="button" onClick={toggleConciliado} disabled={!hasFinal || bloqueadoQuincena} className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all ${g.estaConciliado ? 'border-success bg-success text-white' : hasFinal ? 'border-border hover:border-primary' : 'border-border/30 cursor-not-allowed'}`}>
            {g.estaConciliado && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          </button>
          {editDesc ? (
            <input type="text" value={descVal} onChange={(e) => setDescVal(e.target.value)} onBlur={commitDesc} onKeyDown={(e) => { if (e.key === 'Enter') commitDesc(); if (e.key === 'Escape') { setEditDesc(false); setDescVal(g.descripcion) } }} className="flex-1 rounded border border-primary/40 bg-surface px-1.5 py-0.5 text-xs text-ink focus:outline-none" autoFocus />
          ) : (
            <><button type="button" onClick={() => setEditDesc(true)} className={`text-xs text-left truncate ${g.estaConciliado ? 'text-ink-muted line-through' : 'text-ink'} hover:text-primary transition-colors flex-1`}>{g.descripcion}</button>
            {g.esFijo && <span className="flex-shrink-0 rounded bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:text-amber-200">Fijo</span>}
            {g.medioDePago && <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${g.medioDePago === 'tarjeta_credito' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200' : g.medioDePago === 'debito' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'}`}>{g.medioDePago === 'tarjeta_credito' ? '🏦 TC' : g.medioDePago === 'debito' ? '💳 Déb' : '💵 Efe'}</span>}</>
          )}
        </div>
        <motion.button type="button" onClick={handleDelete} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-ink-muted hover:text-danger transition-colors p-1 flex-shrink-0" title="Eliminar gasto">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </motion.button>
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SearchableSelect
              options={CATEGORIAS.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` }))}
              value={g.categoria}
              onChange={(v) => changeCategoria(v)}
              disabled={bloqueadoQuincena}
              className="w-28"
            />
            {g.esFijo && g.cuotasOriginales > 0 && (
              <span className="text-[10px] text-ink-muted font-medium">Cuota {g.cuotasRestantes}/{g.cuotasOriginales}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            {editPresup ? (
              <input type="number" inputMode="decimal" min={1} step="0.01" value={presupVal || ''} autoFocus onChange={(e) => setPresupVal(Number(e.target.value))} onBlur={commitPresup} onKeyDown={(e) => { if (e.key === 'Enter') commitPresup(); if (e.key === 'Escape') { setEditPresup(false); setPresupVal(g.montoEstimado || g.monto) } }} className="w-20 rounded border border-primary/40 bg-surface px-1.5 py-0.5 text-xs text-ink text-right focus:outline-none" />
            ) : (
              <button type="button" onClick={() => setEditPresup(true)} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                <svg className="h-3 w-3 text-ink-muted hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Presup: <strong className="text-ink">{fmt(g.montoEstimado || g.monto)}</strong>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          {hasFinal && diff !== 0 && (
            <span className={`text-xs font-semibold ${diff > 0 ? 'text-success' : 'text-danger'}`}>
              {diff > 0 ? 'Ahorro +' : 'Perdida '}{fmt(Math.abs(diff))}
            </span>
          )}
          {!hasFinal && <span />}
          {hasFinal ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-success">Pagado: {fmt(g.montoFinal)}</span>
              <button type="button" onClick={handleRevert} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-danger/70 hover:text-danger hover:bg-danger/5 transition-colors">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6M23 20v-6h-6" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
                Revertir
              </button>
            </div>
          ) : bloqueadoQuincena ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-border/30 text-ink-muted cursor-not-allowed">
              🔒 Quincena cerrada
            </span>
          ) : onGastoAction ? (
            <button type="button" onClick={() => onGastoAction(g, presupuestoId)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-success/10 text-success hover:bg-success/20 transition-colors">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Pagar
            </button>
          ) : actualEdit ? (
            <div className="flex items-center gap-1.5">
              <input type="number" inputMode="decimal" min={0} step="0.01" value={actualVal || ''} autoFocus onChange={(e) => setActualVal(Number(e.target.value))} onKeyDown={(e) => { if (e.key === 'Enter') commitActual(); if (e.key === 'Escape') { setActualEdit(false); setActualVal(g.montoFinal || g.monto) } }} className="w-24 rounded-lg border border-primary/40 bg-surface px-2 py-1 text-xs text-ink text-right focus:outline-none" />
              <button type="button" onClick={commitActual} className="rounded-lg bg-success px-2.5 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition-all">Pagar</button>
              <button type="button" onClick={() => { setActualEdit(false); setActualVal(g.montoFinal || g.monto) }} className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink transition-colors">Cancelar</button>
            </div>
          ) : (
            <button type="button" onClick={() => setActualEdit(true)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-success/10 text-success hover:bg-success/20 transition-colors">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Pagar
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
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">¿Cómo cobrás?</label>
            <p className="text-[10px] text-ink-muted mb-2">Esto define cómo se organizan tus ingresos en el mes.</p>
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button type="button" onClick={() => setTipo('mensual')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'mensual' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>
                <span className="block">📅 Mensual</span>
                <span className="block text-[9px] font-normal mt-0.5 opacity-70">1 ingreso al mes</span>
              </button>
              <button type="button" onClick={() => setTipo('quincenal')} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tipo === 'quincenal' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>
                <span className="block">📆 Quincenal</span>
                <span className="block text-[9px] font-normal mt-0.5 opacity-70">2 ingresos al mes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Año del control</label>
              <input type="number" min={2020} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">💰 Ingreso total mensual</label>
              <input type="number" min={0} inputMode="decimal" step="0.01" value={salario || ''} onChange={(e) => setSalario(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" />
              {tipo === 'quincenal' && salario > 0 && <p className="text-[9px] text-ink-muted mt-1">Se divide en dos: Q1 ${(salario / 2).toLocaleString()} + Q2 ${(salario / 2).toLocaleString()}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-secondary">¿Desde cuándo querés empezar?</label>
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button type="button" onClick={() => setModoAnual(true)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${modoAnual ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Enero - Diciembre</button>
              <button type="button" onClick={() => setModoAnual(false)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${!modoAnual ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'}`}>Desde un mes en particular</button>
            </div>
          </div>
          {!modoAnual && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">Mes de inicio</label>
              <select value={mesDesde} onChange={(e) => setMesDesde(Number(e.target.value))} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          )}

          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-3 space-y-2">
            <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">💰 Dinero extra disponible</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-muted">Sobrante del mes anterior</label>
                <input type="number" min={0} inputMode="decimal" step="0.01" value={sobrante || ''} onChange={(e) => setSobrante(Number(e.target.value))} placeholder="$ 0" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-ink-muted">Efectivo extra (bonos, etc)</label>
                <input type="number" min={0} inputMode="decimal" step="0.01" value={efectivo || ''} onChange={(e) => setEfectivo(Number(e.target.value))} placeholder="$ 0" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-primary/50 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Gastos Fijos</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-semibold text-primary">Opcional</span>
            </div>
            <p className="text-[10px] text-ink-muted mb-2">Estos gastos se repiten todos los meses (renta, Netflix, gym, etc.). Se crearán automáticamente en cada mes del año.</p>
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

function AddGastoModal({ open, onClose, presupuestoId, mostrarQ, fechaPreset }: { open: boolean; onClose: () => void; presupuestoId: string; mostrarQ: boolean; fechaPreset?: string }) {
  const addGasto = useAddGasto(presupuestoId)
  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState(0)
  const [cat, setCat] = useState<'fijos' | 'ocio' | 'ahorro'>('fijos')
  const [quincena, setQuincena] = useState<'Q1' | 'Q2' | ''>('')
  const [fecha, setFecha] = useState(fechaPreset || new Date().toISOString().split('T')[0])
  const [esRecurrente, setEsRecurrente] = useState(false)
  const [recurrenciaTipo, setRecurrenciaTipo] = useState<'mensual' | 'quincenal'>('mensual')
  const [cuotas, setCuotas] = useState(0)


  useEffect(() => { if (fechaPreset) setFecha(fechaPreset) }, [fechaPreset])

  useEffect(() => {
    if (mostrarQ && fecha) {
      const dia = parseInt(fecha.split('-')[2], 10)
      setQuincena(dia <= 15 ? 'Q1' : 'Q2')
    }
  }, [fecha, mostrarQ])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desc.trim() || monto < 1 || addGasto.isPending) return
    try {
      const payload: any = { descripcion: desc.trim(), monto, montoEstimado: monto, categoria: cat, fecha }
      if (quincena) payload.quincena = quincena
      if (esRecurrente) {
        payload.esRecurrente = true
        payload.recurrenciaTipo = recurrenciaTipo
        payload.cuotas = cuotas
        payload.fechaOrigen = fecha
      }
      await addGasto.mutateAsync(payload)
      setDesc(''); setMonto(0); setCat('fijos'); setQuincena(''); setFecha(new Date().toISOString().split('T')[0]); setEsRecurrente(false); setRecurrenciaTipo('mensual'); setCuotas(0)
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
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">📝 Descripción</label>
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: Comida del mes, Netflix, Gasolina..." maxLength={200} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">💰 Monto</label>
            <input type="number" min={1} inputMode="decimal" step="0.01" value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} placeholder="$ 0" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary/50 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">🏷️ Tipo de gasto</label>
            <SearchableSelect
              options={CATEGORIAS.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` }))}
              value={cat}
              onChange={(v) => setCat(v as any)}
              placeholder="Seleccionar categoría"
            />
            <p className="text-[9px] text-ink-muted mt-1">
              {cat === 'fijos' ? 'Gastos necesarios: renta, servicios, comida, transporte, etc.' :
               cat === 'ocio' ? 'Gastos discrecionales: salidas, entretenimiento, compras no esenciales.' :
               'Dinero que apartas para tu futuro. Se deposita automáticamente en tu cartera de Ahorros.'}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-ink-muted">📅 Fecha del gasto</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary/50 focus:outline-none" />
          </div>
          {mostrarQ && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink-muted">📆 Quincena</label>
              <p className="text-[9px] text-ink-muted mb-1">Se asignó automáticamente según la fecha. Podés cambiarlo si querés.</p>
              <select value={quincena} onChange={(e) => setQuincena(e.target.value as 'Q1' | 'Q2' | '')} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none">
                <option value="Q1">Q1 - Primera quincena (días 1-15)</option>
                <option value="Q2">Q2 - Segunda quincena (días 16-31)</option>
              </select>
            </div>
          )}
          <div className="border-t border-border pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={esRecurrente} onChange={(e) => setEsRecurrente(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/30" />
              <span className="text-xs font-semibold text-ink">🔄 Repetir este gasto</span>
            </label>
            <p className="text-[9px] text-ink-muted ml-6">Se creará automáticamente en los próximos meses.</p>
            {esRecurrente && (
              <div className="mt-2 space-y-2 pl-6">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button type="button" onClick={() => setRecurrenciaTipo('mensual')} className={`flex-1 py-1.5 text-xs font-semibold ${recurrenciaTipo === 'mensual' ? 'bg-primary/15 text-primary' : 'text-ink-muted'}`}>Cada mes</button>
                  <button type="button" onClick={() => setRecurrenciaTipo('quincenal')} className={`flex-1 py-1.5 text-xs font-semibold ${recurrenciaTipo === 'quincenal' ? 'bg-primary/15 text-primary' : 'text-ink-muted'}`}>Cada quincena</button>
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] font-semibold text-ink-muted">¿Cuántas veces? (0 = siempre)</label>
                  <input type="number" min={0} value={cuotas || ''} onChange={(e) => setCuotas(Number(e.target.value))} className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-primary/50" />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-1"><button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm text-ink-muted hover:bg-surface">Cancelar</button><button type="submit" disabled={!desc.trim() || monto < 1 || addGasto.isPending} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-[var(--bg)] hover:bg-primary-light disabled:opacity-50">{addGasto.isPending ? 'Guardando...' : '💾 Agregar gasto'}</button></div>
        </form>
      </div>
    </div>
  )
}

function PresupuestoDetail({ presupuestoId, onClose }: { presupuestoId: string; onClose: () => void }) {
  const { data: p, isLoading } = usePresupuestoDetail(presupuestoId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [tabQuincena, setTabQuincena] = useState<'Q1' | 'Q2' | 'todas'>('todas')
  const [catFiltro, setCatFiltro] = useState<'todas' | 'fijos' | 'ocio' | 'ahorro'>('todas')
  const [medioFiltro, setMedioFiltro] = useState<string>('todos')
  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState(0)
  const [editQ1, setEditQ1] = useState(0)
  const [editQ2, setEditQ2] = useState(0)
  const cerrarMes = useCerrarMes()
  const updatePresupuesto = useUpdatePresupuesto()
  const qAuto = new Date().getDate() <= 15 ? 'Q2' : 'Q1'

  if (isLoading || !p) return <div className="flex items-center justify-center py-20"><div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" /></div>

  const gastos: Gasto[] = p.gastos ?? []
  const mostrarQ = p.tipo === 'quincenal'
  const gastosFiltrados = gastos
    .filter((g) => !mostrarQ || tabQuincena === 'todas' || g.quincena === tabQuincena)
    .filter((g) => catFiltro === 'todas' || g.categoria === catFiltro)
    .filter((g) => medioFiltro === 'todos' || g.medioDePago === medioFiltro)
  const totalesPorCat: Record<string, { estimado: number; actual: number; meta: number }> = { fijos: { estimado: 0, actual: 0, meta: p.metaFijos }, ocio: { estimado: 0, actual: 0, meta: p.metaOcio }, ahorro: { estimado: 0, actual: 0, meta: p.metaAhorro } }
  gastosFiltrados.forEach((g) => { totalesPorCat[g.categoria].estimado += g.montoEstimado || g.monto; totalesPorCat[g.categoria].actual += g.estaConciliado ? (g.montoFinal || g.monto) : 0 })
  const totalEstimado = Object.values(totalesPorCat).reduce((s, t) => s + t.estimado, 0)
  const totalActual = Object.values(totalesPorCat).reduce((s, t) => s + t.actual, 0)
  const inc = ingresos(p)
  const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0)

  const handleCerrarMes = async (quincena?: 'Q1' | 'Q2') => {
    try {
      const res: any = await cerrarMes.mutateAsync({ presupuestoId, quincena })
      sileo.success(quincena ? `Q${quincena === 'Q1' ? '1' : '2'} cerrado. Remanente: ${fmt(res.remainder)}` : `Mes cerrado. Remanente: ${fmt(res.remainder)}`)
    } catch { sileo.error('Error al cerrar') }
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
            {p.tipo === 'quincenal' && !p.cerrado ? (
              (() => {
                const puedeQ1 = quincenaAuto === 'Q1' && !p.cerradoQ1
                const puedeQ2 = quincenaAuto === 'Q2' && !p.cerradoQ2
                if (!puedeQ1 && !puedeQ2) return null
                return (
                  <button type="button" onClick={() => handleCerrarMes(puedeQ2 ? 'Q2' : 'Q1')} disabled={cerrarMes.isPending} className="inline-flex items-center gap-1.5 rounded-xl bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Cerrar {puedeQ2 ? 'Q2' : 'Q1'}
                  </button>
                )
              })()
            ) : (
              !p.cerrado && (
                <button type="button" onClick={() => handleCerrarMes()} disabled={cerrarMes.isPending} className="inline-flex items-center gap-1.5 rounded-xl bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Cerrar Mes
                </button>
              )
            )}
            {p.cerrado && <span className="inline-flex items-center gap-1 rounded-xl bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">Cerrado</span>}
            <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-ink-muted hover:bg-surface hover:text-ink"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {(() => {
            const fields = [
              { key: 'salario', label: 'Salario', value: p.tipo === 'mensual' ? p.salarioMensual : p.salarioQ1 + p.salarioQ2 },
              { key: 'efectivoExtra', label: 'Efectivo Extra', value: p.efectivoExtra },
              { key: 'sobrante', label: 'Sobrante', value: p.sobranteAnterior },
            ]
            const renderEditInput = (key: string) => {
              if (key === 'salario' && p.tipo === 'quincenal') return (
                <div className="flex items-center gap-1.5">
                  <input type="number" inputMode="decimal" min={0} step="0.01" value={editQ1 || ''} onChange={(e) => setEditQ1(Number(e.target.value))} className="w-20 rounded border border-primary/40 bg-surface px-1.5 py-1 text-xs text-ink text-right focus:outline-none" placeholder="Q1" />
                  <span className="text-[10px] text-ink-muted">Q1</span>
                  <input type="number" inputMode="decimal" min={0} step="0.01" value={editQ2 || ''} onChange={(e) => setEditQ2(Number(e.target.value))} className="w-20 rounded border border-primary/40 bg-surface px-1.5 py-1 text-xs text-ink text-right focus:outline-none" placeholder="Q2" />
                  <span className="text-[10px] text-ink-muted">Q2</span>
                </div>
              )
              return (
                <input type="number" inputMode="decimal" min={0} step="0.01" value={editVal || ''} onChange={(e) => setEditVal(Number(e.target.value))} className="w-24 rounded border border-primary/40 bg-surface px-1.5 py-1 text-xs text-ink text-right focus:outline-none" />
              )
            }
            return (
              <div className="rounded-xl bg-surface border border-border divide-y divide-border">
                {fields.map((f) => {
                  const puedeEditar = f.key === 'sobrante' ? (p.mes === 1 && !p.cerrado) : !p.cerrado
                  return (
                  <div key={f.key} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">{f.label}</span>
                    {puedeEditar && editField === f.key ? (
                      <div className="flex items-center gap-1.5">
                        {renderEditInput(f.key)}
                        <button type="button" onClick={async () => {
                          const payload: any = f.key === 'salario'
                            ? (p.tipo === 'mensual' ? { salarioMensual: editVal } : { salarioQ1: editQ1, salarioQ2: editQ2 })
                            : f.key === 'efectivoExtra' ? { efectivoExtra: editVal }
                            : { sobranteAnterior: editVal }
                          await updatePresupuesto.mutateAsync({ id: presupuestoId, data: payload })
                          setEditField(null)
                        }} className="rounded bg-primary px-2 py-1 text-[10px] font-semibold text-white hover:bg-primary-light">Guardar</button>
                        <button type="button" onClick={() => setEditField(null)} className="rounded border border-border px-2 py-1 text-[10px] text-ink-muted hover:bg-surface">Cancelar</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => {
                        if (puedeEditar) {
                          if (f.key === 'salario') {
                            if (p.tipo === 'mensual') setEditVal(p.salarioMensual)
                            else { setEditQ1(p.salarioQ1); setEditQ2(p.salarioQ2) }
                          } else {
                            setEditVal(f.value)
                          }
                          setEditField(f.key)
                        }
                      }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-primary transition-colors disabled:opacity-50" disabled={!puedeEditar}>
                        {fmt(f.value)}
                        {puedeEditar && (
                          <svg className="h-3 w-3 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        )}
                      </button>
                    )}
                  </div>
                  )
                })}
              </div>
            )
          })()}
          <CalcSummary p={p} gastos={gastosFiltrados} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DonutCard p={p} gastos={gastosFiltrados} />
            <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Presupuestado</span><span className="font-semibold text-ink">{fmt(totalEstimado)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Conciliado</span><span className="font-semibold text-success">{fmt(totalActual)}</span></div>
              <div className="border-t border-border pt-2"><div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Total disponible</span><span className="font-semibold text-ink">{fmt(inc)}</span></div></div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Consumo por Categoría</h4>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {(['fijos', 'ocio', 'ahorro'] as const).map((c) => {
                const t = totalesPorCat[c]
                const limit = t.meta || 0
                const actual = t.estimado || 0
                const pct = limit > 0 ? Math.min(100, Math.round((actual / limit) * 100)) : 0
                const catDetails = CATEGORIAS.find(cat => cat.id === c)
                
                // Color states for consumption alerts
                const strokeColor = pct >= 90 
                  ? 'bg-danger animate-pulse' 
                  : pct >= 70 
                  ? 'bg-amber-500' 
                  : c === 'ahorro' 
                  ? 'bg-success' 
                  : 'bg-primary'

                return (
                  <div key={c} className="rounded-2xl border border-border bg-surface-raised p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <span>{catDetails?.icon}</span>
                        <span>{catDetails?.label}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${catDetails?.bgClass}`}>
                        {pct}%
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-ink-muted">
                        <span>Estimado: <strong>{fmt(actual)}</strong></span>
                        {!p.cerrado && editField === `limit_${c}` ? (
                          <input
                            type="number"
                            inputMode="decimal"
                            defaultValue={limit || ''}
                            autoFocus
                            onBlur={async (e) => {
                              const val = Number(e.target.value)
                              if (!isNaN(val) && val >= 0) {
                                const payloadKey = c === 'fijos' ? 'metaFijos' : c === 'ocio' ? 'metaOcio' : 'metaAhorro'
                                await updatePresupuesto.mutateAsync({ id: presupuestoId, data: { [payloadKey]: val } })
                                sileo.success('Límite actualizado')
                              }
                              setEditField(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditField(null)
                            }}
                            className="w-16 rounded border border-primary/40 bg-surface px-1 py-0.5 text-[9px] text-ink text-right focus:outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={p.cerrado}
                            onClick={() => setEditField(`limit_${c}`)}
                            className="hover:text-primary transition-colors flex items-center gap-0.5 disabled:opacity-85"
                          >
                            <span>Límite: <strong>{limit > 0 ? fmt(limit) : 'Sin límite'}</strong></span>
                            {!p.cerrado && (
                              <svg className="h-2.5 w-2.5 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Modern progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${limit > 0 ? pct : 0}%` }} 
                          transition={{ duration: 0.8, ease: 'easeOut' }} 
                          className={`h-full rounded-full ${strokeColor}`} 
                        />
                      </div>

                      {limit > 0 && (
                        <p className="text-[9px] text-ink-muted text-right mt-0.5">
                          {limit - actual >= 0 
                            ? `Restan ${fmt(limit - actual)}` 
                            : `Excedido por ${fmt(actual - limit)}`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
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
                {(tabQuincena === 'todas' || tabQuincena === 'Q1') && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold">Q1</p>
                    <div className="flex justify-between"><span className="text-ink-muted">Saldo inicial</span><span className="font-semibold text-ink">{fmt(p.sobranteAnterior)}</span></div>
                    <div className="flex justify-between"><span className="text-ink-muted">Salario</span><span className="font-semibold text-ink">+{fmt(p.salarioQ1)}</span></div>
                    {(() => { const t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); return <div className="flex justify-between"><span className="text-ink-muted">Gastos+Ocio</span><span className="font-semibold text-danger">-{fmt(t)}</span></div> })()}
                    {(() => { const t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); return <div className="flex justify-between border-t border-border pt-1"><span className="text-ink-muted">Pasa a Q2</span><span className={`font-semibold ${p.sobranteAnterior + p.salarioQ1 - t >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(p.sobranteAnterior + p.salarioQ1 - t)}</span></div> })()}
                  </div>
                )}
                {tabQuincena === 'todas' && <hr className="border-border" />}
                {(tabQuincena === 'todas' || tabQuincena === 'Q2') && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold">Q2</p>
                    {(() => { const q1t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); const r1 = p.sobranteAnterior + p.salarioQ1 - q1t; return <div className="flex justify-between"><span className="text-ink-muted">Recibe de Q1</span><span className="font-semibold text-ink">{fmt(r1)}</span></div> })()}
                    <div className="flex justify-between"><span className="text-ink-muted">Salario</span><span className="font-semibold text-ink">+{fmt(p.salarioQ2)}</span></div>
                    {(() => { const t = gastos.filter(g => g.quincena === 'Q2').reduce((s, g) => s + g.monto, 0); return <div className="flex justify-between"><span className="text-ink-muted">Gastos+Ocio</span><span className="font-semibold text-danger">-{fmt(t)}</span></div> })()}
                    {(() => { const q1t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); const q2t = gastos.filter(g => g.quincena === 'Q2').reduce((s, g) => s + g.monto, 0); const r2 = p.sobranteAnterior + p.salarioQ1 - q1t + p.salarioQ2 - q2t; return <div className="flex justify-between border-t border-border pt-1"><span className="text-ink-muted">Final del mes</span><span className={`font-semibold ${r2 >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(r2)}</span></div> })()}
                  </div>
                )}
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

                    <div className="mb-3 flex items-center gap-2">
              <motion.button type="button" onClick={() => setShowAddModal(true)} disabled={p.cerrado} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light transition-colors disabled:opacity-50" title="Agregar un nuevo gasto a este mes">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Agregar Gasto
              </motion.button>
              <SearchableSelect
                options={[{ value: 'todas', label: 'Todos' }, ...CATEGORIAS.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` }))]}
                value={catFiltro}
                onChange={(v) => setCatFiltro(v as any)}
                className="w-36"
              />
              <SearchableSelect
                options={[
                  { value: 'todos', label: 'Todos medios' },
                  { value: 'efectivo', label: '💵 Efectivo' },
                  { value: 'debito', label: '💳 Débito' },
                  { value: 'tarjeta_credito', label: '🏦 Tarjeta' },
                ]}
                value={medioFiltro}
                onChange={(v) => setMedioFiltro(v)}
                className="w-32"
              />
            </div>

            {gastosFiltrados.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-8">Sin gastos registrados aún.</p>
            ) : (
              <div className="space-y-2">{gastosFiltrados.map((g) => <GastoCard key={g.id} g={g} presupuestoId={presupuestoId} tipo={p.tipo} />)}</div>
            )}
          </div>
        </div>
        <AddGastoModal open={showAddModal} onClose={() => setShowAddModal(false)} presupuestoId={presupuestoId} mostrarQ={mostrarQ} />
      </div>
    </div>
  )
}

function ControlDetail({ control, onClose, onGastoAction }: { control: any; onClose: () => void; onGastoAction?: (gasto: Gasto, presupuestoId: string) => void }) {
  const presupuestos = (control.presupuestos ?? []).sort((a: any, b: any) => a.mes - b.mes)
  const [mesActivo, setMesActivo] = useState(presupuestos[0]?.mes ?? 1)
  const p = presupuestos.find((x: any) => x.mes === mesActivo)
  const [showAddModal, setShowAddModal] = useState(false)
  const [tabQuincena, setTabQuincena] = useState<'Q1' | 'Q2' | 'todas'>('todas')
  const [catFiltro, setCatFiltro] = useState<'todas' | 'fijos' | 'ocio' | 'ahorro'>('todas')
  const [medioFiltro, setMedioFiltro] = useState<string>('todos')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState(0)
  const [editQ1, setEditQ1] = useState(0)
  const [editQ2, setEditQ2] = useState(0)
  const cerrarMes = useCerrarMes()
  const deleteControl = useDeleteControl()
  const updatePresupuesto = useUpdatePresupuesto()
  const { data: detalle } = usePresupuestoDetail(p?.id ?? '')
  const qAuto = new Date().getDate() <= 15 ? 'Q2' : 'Q1'

  const mesData = detalle ?? p
  if (!p) return null

  const gastos: Gasto[] = mesData.gastos ?? []
  const mostrarQ = control.tipo === 'quincenal'
  const gastosFiltrados = gastos
    .filter((g) => !mostrarQ || tabQuincena === 'todas' || g.quincena === tabQuincena)
    .filter((g) => catFiltro === 'todas' || g.categoria === catFiltro)
    .filter((g) => medioFiltro === 'todos' || g.medioDePago === medioFiltro)
  const totalesPorCat: Record<string, { estimado: number; actual: number; meta: number }> = { fijos: { estimado: 0, actual: 0, meta: mesData.metaFijos || 0 }, ocio: { estimado: 0, actual: 0, meta: mesData.metaOcio || 0 }, ahorro: { estimado: 0, actual: 0, meta: mesData.metaAhorro || 0 } }
  gastosFiltrados.forEach((g) => { totalesPorCat[g.categoria].estimado += g.montoEstimado || g.monto; totalesPorCat[g.categoria].actual += g.estaConciliado ? (g.montoFinal || g.monto) : 0 })
  const totalEstimado = Object.values(totalesPorCat).reduce((s, t) => s + t.estimado, 0)
  const totalActual = Object.values(totalesPorCat).reduce((s, t) => s + t.actual, 0)
  const inc = ingresos(mesData)
  const totalGastado = gastos.reduce((s: number, g) => s + g.monto, 0)

  const handleCerrarMes = async (quincena?: 'Q1' | 'Q2') => {
    try {
      const res: any = await cerrarMes.mutateAsync({ presupuestoId: p.id, quincena })
      sileo.success(quincena ? `Q${quincena === 'Q1' ? '1' : '2'} cerrado. Remanente: ${fmt(res.remainder)}` : `Mes cerrado. Remanente: ${fmt(res.remainder)}`)
    } catch { sileo.error('Error al cerrar') }
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
              {!mesData.cerrado && mesData.cerradoQ1 && <span className="rounded bg-amber-100 dark:bg-amber-900/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Q1 Cerrado</span>}
            </div>
            {control.tipo === 'quincenal' ? (
              (() => {
                const puedeQ1 = qAuto === 'Q1' && !mesData.cerradoQ1
                const puedeQ2 = qAuto === 'Q2' && !mesData.cerradoQ2
                if (!puedeQ1 && !puedeQ2) return null
                return (
                  <button type="button" onClick={() => handleCerrarMes(puedeQ2 ? 'Q2' : 'Q1')} disabled={cerrarMes.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Cerrar {puedeQ2 ? 'Q2' : 'Q1'}
                  </button>
                )
              })()
            ) : (
              !mesData.cerrado && (
                <button type="button" onClick={() => handleCerrarMes()} disabled={cerrarMes.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Cerrar Mes
                </button>
              )
            )}
          </div>
          {(() => {
            const fields = [
              { key: 'salario', label: 'Salario', value: control.tipo === 'mensual' ? mesData.salarioMensual : mesData.salarioQ1 + mesData.salarioQ2 },
              { key: 'efectivoExtra', label: 'Efectivo Extra', value: mesData.efectivoExtra },
              { key: 'sobrante', label: 'Sobrante', value: mesData.sobranteAnterior },
            ]
            const renderEditInput = (key: string) => {
              if (key === 'salario' && control.tipo === 'quincenal') return (
                <div className="flex items-center gap-1.5">
                  <input type="number" inputMode="decimal" min={0} step="0.01" value={editQ1 || ''} onChange={(e) => setEditQ1(Number(e.target.value))} className="w-20 rounded border border-primary/40 bg-surface px-1.5 py-1 text-xs text-ink text-right focus:outline-none" placeholder="Q1" />
                  <span className="text-[10px] text-ink-muted">Q1</span>
                  <input type="number" inputMode="decimal" min={0} step="0.01" value={editQ2 || ''} onChange={(e) => setEditQ2(Number(e.target.value))} className="w-20 rounded border border-primary/40 bg-surface px-1.5 py-1 text-xs text-ink text-right focus:outline-none" placeholder="Q2" />
                  <span className="text-[10px] text-ink-muted">Q2</span>
                </div>
              )
              return (
                <input type="number" inputMode="decimal" min={0} step="0.01" value={editVal || ''} onChange={(e) => setEditVal(Number(e.target.value))} className="w-24 rounded border border-primary/40 bg-surface px-1.5 py-1 text-xs text-ink text-right focus:outline-none" />
              )
            }
            return (
              <div className="rounded-xl bg-surface border border-border divide-y divide-border">
                {fields.map((f) => {
                  const puedeEditar = f.key === 'sobrante' ? (mesData.mes === 1 && !mesData.cerrado) : !mesData.cerrado
                  return (
                  <div key={f.key} className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">{f.label}</span>
                    {puedeEditar && editField === f.key ? (
                      <div className="flex items-center gap-1.5">
                        {renderEditInput(f.key)}
                        <button type="button" onClick={async () => {
                          if (p) {
                            const payload: any = f.key === 'salario'
                              ? (control.tipo === 'mensual' ? { salarioMensual: editVal } : { salarioQ1: editQ1, salarioQ2: editQ2 })
                              : f.key === 'efectivoExtra' ? { efectivoExtra: editVal }
                              : { sobranteAnterior: editVal }
                            await updatePresupuesto.mutateAsync({ id: p.id, data: payload })
                            setEditField(null)
                          }
                        }} className="rounded bg-primary px-2 py-1 text-[10px] font-semibold text-white hover:bg-primary-light">Guardar</button>
                        <button type="button" onClick={() => setEditField(null)} className="rounded border border-border px-2 py-1 text-[10px] text-ink-muted hover:bg-surface">Cancelar</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => {
                        if (puedeEditar) {
                          if (f.key === 'salario') {
                            if (control.tipo === 'mensual') setEditVal(mesData.salarioMensual)
                            else { setEditQ1(mesData.salarioQ1); setEditQ2(mesData.salarioQ2) }
                          } else {
                            setEditVal(f.value)
                          }
                          setEditField(f.key)
                        }
                      }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-primary transition-colors disabled:opacity-50" disabled={!puedeEditar}>
                        {fmt(f.value)}
                        {puedeEditar && (
                          <svg className="h-3 w-3 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        )}
                      </button>
                    )}
                  </div>
                  )
                })}
              </div>
            )
          })()}
          <CalcSummary p={mesData} gastos={gastosFiltrados} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DonutCard p={mesData} gastos={gastosFiltrados} />
            <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Presupuestado</span><span className="font-semibold text-ink">{fmt(totalEstimado)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Conciliado</span><span className="font-semibold text-success">{fmt(totalActual)}</span></div>
              <div className="border-t border-border pt-2"><div className="flex items-center justify-between text-xs"><span className="text-ink-muted">Total disponible</span><span className="font-semibold text-ink">{fmt(inc)}</span></div></div>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Consumo por Categoría</h4>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {(['fijos', 'ocio', 'ahorro'] as const).map((c) => {
                const t = totalesPorCat[c]
                const limit = t.meta || 0
                const actual = t.estimado || 0
                const pct = limit > 0 ? Math.min(100, Math.round((actual / limit) * 100)) : 0
                const catDetails = CATEGORIAS.find(cat => cat.id === c)
                
                const strokeColor = pct >= 90 
                  ? 'bg-danger animate-pulse' 
                  : pct >= 70 
                  ? 'bg-amber-500' 
                  : c === 'ahorro' 
                  ? 'bg-success' 
                  : 'bg-primary'

                return (
                  <div key={c} className="rounded-2xl border border-border bg-surface-raised p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <span>{catDetails?.icon}</span>
                        <span>{catDetails?.label}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${catDetails?.bgClass}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-ink-muted">
                        <span>Estimado: <strong>{fmt(actual)}</strong></span>
                        {!mesData.cerrado && editField === `limit_${c}` ? (
                          <input
                            type="number"
                            inputMode="decimal"
                            defaultValue={limit || ''}
                            autoFocus
                            onBlur={async (e) => {
                              const val = Number(e.target.value)
                              if (!isNaN(val) && val >= 0) {
                                const payloadKey = c === 'fijos' ? 'metaFijos' : c === 'ocio' ? 'metaOcio' : 'metaAhorro'
                                await updatePresupuesto.mutateAsync({ id: p.id, data: { [payloadKey]: val } })
                                sileo.success('Límite actualizado')
                              }
                              setEditField(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur()
                              if (e.key === 'Escape') setEditField(null)
                            }}
                            className="w-16 rounded border border-primary/40 bg-surface px-1 py-0.5 text-[9px] text-ink text-right focus:outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={mesData.cerrado}
                            onClick={() => setEditField(`limit_${c}`)}
                            className="hover:text-primary transition-colors flex items-center gap-0.5 disabled:opacity-85"
                          >
                            <span>Límite: <strong>{limit > 0 ? fmt(limit) : 'Sin límite'}</strong></span>
                            {!mesData.cerrado && (
                              <svg className="h-2.5 w-2.5 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${limit > 0 ? pct : 0}%` }} 
                          transition={{ duration: 0.8, ease: 'easeOut' }} 
                          className={`h-full rounded-full ${strokeColor}`} 
                        />
                      </div>
                      {limit > 0 && (
                        <p className="text-[9px] text-ink-muted text-right mt-0.5">
                          {limit - actual >= 0 ? `Restan ${fmt(limit - actual)}` : `Excedido por ${fmt(actual - limit)}`}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
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
                {(tabQuincena === 'todas' || tabQuincena === 'Q1') && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold">Q1</p>
                    <div className="flex justify-between"><span className="text-ink-muted">Saldo inicial</span><span className="font-semibold text-ink">{fmt(mesData.sobranteAnterior)}</span></div>
                    <div className="flex justify-between"><span className="text-ink-muted">Salario</span><span className="font-semibold text-ink">+{fmt(mesData.salarioQ1)}</span></div>
                    {(() => { const t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); return <div className="flex justify-between"><span className="text-ink-muted">Gastos+Ocio</span><span className="font-semibold text-danger">-{fmt(t)}</span></div> })()}
                    {(() => { const t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); return <div className="flex justify-between border-t border-border pt-1"><span className="text-ink-muted">Pasa a Q2</span><span className={`font-semibold ${mesData.sobranteAnterior + mesData.salarioQ1 - t >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(mesData.sobranteAnterior + mesData.salarioQ1 - t)}</span></div> })()}
                  </div>
                )}
                {tabQuincena === 'todas' && <hr className="border-border" />}
                {(tabQuincena === 'todas' || tabQuincena === 'Q2') && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold">Q2</p>
                    {(() => { const q1t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); const r1 = mesData.sobranteAnterior + mesData.salarioQ1 - q1t; return <div className="flex justify-between"><span className="text-ink-muted">Recibe de Q1</span><span className="font-semibold text-ink">{fmt(r1)}</span></div> })()}
                    <div className="flex justify-between"><span className="text-ink-muted">Salario</span><span className="font-semibold text-ink">+{fmt(mesData.salarioQ2)}</span></div>
                    {(() => { const t = gastos.filter(g => g.quincena === 'Q2').reduce((s, g) => s + g.monto, 0); return <div className="flex justify-between"><span className="text-ink-muted">Gastos+Ocio</span><span className="font-semibold text-danger">-{fmt(t)}</span></div> })()}
                    {(() => { const q1t = gastos.filter(g => g.quincena === 'Q1').reduce((s, g) => s + g.monto, 0); const q2t = gastos.filter(g => g.quincena === 'Q2').reduce((s, g) => s + g.monto, 0); const r2 = mesData.sobranteAnterior + mesData.salarioQ1 - q1t + mesData.salarioQ2 - q2t; return <div className="flex justify-between border-t border-border pt-1"><span className="text-ink-muted">Final del mes</span><span className={`font-semibold ${r2 >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(r2)}</span></div> })()}
                  </div>
                )}
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
            <div className="mb-3 flex items-center gap-2">
              <button type="button" onClick={() => setShowAddModal(true)} disabled={mesData.cerrado} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-[var(--bg)] hover:bg-primary-light transition-colors disabled:opacity-50">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Agregar Gasto
              </button>
              <SearchableSelect
                options={[{ value: 'todas', label: 'Todos' }, ...CATEGORIAS.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` }))]}
                value={catFiltro}
                onChange={(v) => setCatFiltro(v as any)}
                className="w-36"
              />
              <SearchableSelect
                options={[
                  { value: 'todos', label: 'Todos medios' },
                  { value: 'efectivo', label: '💵 Efectivo' },
                  { value: 'debito', label: '💳 Débito' },
                  { value: 'tarjeta_credito', label: '🏦 Tarjeta' },
                ]}
                value={medioFiltro}
                onChange={(v) => setMedioFiltro(v)}
                className="w-32"
              />
            </div>
            {gastosFiltrados.length === 0 ? <p className="text-xs text-ink-muted text-center py-8">Sin gastos registrados aún.</p>
              : <div className="space-y-2">{gastosFiltrados.map((g) => <GastoCard key={g.id} g={g} presupuestoId={p.id} tipo={p.tipo} onGastoAction={onGastoAction} />)}</div>}
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
  const [quincenaView, setQuincenaView] = useState<'Q1' | 'Q2' | 'todas'>('todas')
  const [controlDetail, setControlDetail] = useState<any | null>(null)
  const [gastoAction, setGastoAction] = useState<{ gasto: Gasto; presupuestoId: string } | null>(null)
  const [editGasto, setEditGasto] = useState<{ gasto: Gasto; presupuestoId: string } | null>(null)
  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState(0)
  const [editQ1, setEditQ1] = useState(0)
  const [editQ2, setEditQ2] = useState(0)
  const updateGastoFecha = useUpdateGastoFecha('')
  const pagarGasto = usePagarGasto()
  const updatePresupuesto = useUpdatePresupuesto()

  const controlActual = controles?.[0]
  const presupuestoMes = controlActual?.presupuestos?.find((p: any) => p.mes === currentMonth + 1)
  const cerrarMes = useCerrarMes()
  const carry = useCarryToNewYear()
  const yaTieneControlEsteAnio = controles?.some((c: any) => c.year === currentYear)
  const diciembreCerrado = controlActual?.presupuestos?.find((p: any) => p.mes === 12)?.cerrado
  const mostrarCrearNuevoAnio = diciembreCerrado && controles && !controles.some((c: any) => c.year === currentYear + 1)
  const quincenaAuto = today.getDate() <= 15 ? 'Q1' : 'Q2'

  const handleCerrarMes = async (quincena?: 'Q1' | 'Q2') => {
    if (!presupuestoMes) return
    const yaCerrado = quincena ? (quincena === 'Q1' ? presupuestoMes.cerradoQ1 : presupuestoMes.cerradoQ2) : presupuestoMes.cerrado
    if (yaCerrado) return
    const label = quincena ? `Q${quincena === 'Q1' ? '1' : '2'}` : 'Mes'
    try {
      const res: any = await cerrarMes.mutateAsync({ presupuestoId: presupuestoMes.id, quincena })
      if (quincena === 'Q1') {
        sileo.success(`Q1 cerrado. Remanente: ${fmt(res.remainder)}`)
      } else if (quincena === 'Q2' || presupuestoMes.tipo !== 'quincenal') {
        sileo.success(`${label} cerrado. Remanente: ${fmt(res.remainder)}`)
        if (presupuestoMes.mes === 12 && controlActual) {
          try {
            const newYear = await carry.mutateAsync(controlActual.controlId)
            sileo.success(`🎉 Año cerrado. Control ${newYear.year} creado con $${newYear.sobranteInicial.toLocaleString()} de remanente`)
          } catch { sileo.info('Diciembre cerrado. Creá un nuevo control si querés continuar.') }
        }
      }
    } catch { sileo.error(`Error al cerrar ${label}`) }
  }

  const handleGastoClick = (gasto: Gasto, presupuestoId: string) => {
    setGastoAction({ gasto, presupuestoId })
  }

  const handlePayGasto = async (data: { montoReal: number; medioDePago?: string; tarjetaCreditoId?: string; fechaPago?: string }) => {
    if (!gastoAction) return
    try {
      const { gasto, presupuestoId } = gastoAction
      const payload: any = { gastoId: gasto.id, presupuestoId, montoReal: data.montoReal }
      if (data.medioDePago) payload.medioDePago = data.medioDePago
      if (data.tarjetaCreditoId) payload.tarjetaCreditoId = data.tarjetaCreditoId
      if (data.fechaPago) payload.fechaPago = data.fechaPago
      await pagarGasto.mutateAsync(payload)
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

      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 space-y-4">
              <motion.div className="skeleton h-4 w-48 rounded-lg" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
              <motion.div className="skeleton h-8 w-full rounded-xl" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
              <motion.div className="skeleton h-8 w-3/4 rounded-xl" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }} />
            </div>
          ))}
        </motion.div>
      )}

      {!isLoading && (!controles || controles.length === 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          <div className="glass rounded-2xl px-6 py-10 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <motion.svg animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></motion.svg>
            </motion.div>
            <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-lg font-semibold text-ink">¡Bienvenido a tu Control de Finanzas!</motion.h3>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
              Un control anual te ayuda a organizar tus ingresos y gastos mes por mes. 
              Elegí cómo querés manejarlo:
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
              {[
                { icon: '📅', title: 'Mensual', desc: 'Un solo ingreso mensual. Todos los gastos se descuentan del mismo saldo. Ideal si cobrás una vez al mes.', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                { icon: '📆', title: 'Quincenal', desc: 'Dos ingresos al mes (Q1 y Q2). Los gastos se dividen por quincena. Ideal si cobras dos veces al mes.', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
              ].map((item, i) => (
                <motion.div key={i} variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { delay: 0.25 + i * 0.1 } } }} whileHover={{ y: -2 }} className="rounded-xl border border-border bg-surface p-4">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color} mb-2 text-base`}>{item.icon}</span>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-xs text-ink-muted mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="button" onClick={() => setShowCreate(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light active:scale-[0.97]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Crear mi primer control
            </motion.button>
          </div>
        </motion.div>
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
          {presupuestoMes && (presupuestoMes.gastos ?? []).length === 0 && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex items-start gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold flex-shrink-0 mt-0.5">i</span>
              <div>
                <p className="text-xs font-semibold text-ink">¡Empezá a registrar tus gastos!</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {controlActual?.tipo === 'quincenal'
                    ? 'Hacé clic en un día del calendario para agregar un gasto en esa fecha. Cada gasto se asigna automáticamente a Q1 (días 1-15) o Q2 (días 16+).'
                    : 'Hacé clic en un día del calendario para agregar un gasto en esa fecha. También podés arrastrar gastos entre días para reasignarlos.'}
                </p>
              </div>
            </div>
          )}
          <CalendarBudget
            presupuestos={controlActual?.presupuestos ?? []}
            currentMonth={currentMonth}
            currentYear={currentYear}
            tipo={controlActual?.tipo ?? 'mensual'}
            quincenaActiva={quincenaView}
            onQuincenaChange={setQuincenaView}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
            onDayClick={handleDayClick}
            onGastoClick={handleGastoClick}
            onGastoDrop={handleGastoDrop}
          />
          {controlActual && (
            <BudgetSavingsEvolution presupuestos={controlActual.presupuestos ?? []} />
          )}
          {presupuestoMes && (() => {
            const gastos = presupuestoMes.gastos ?? []
            const ingresosTotal = ingresos(presupuestoMes)
            const gastosSinAhorro = gastos.reduce((s: number, g: any) => s + (g.categoria !== 'ahorro' ? g.monto : 0), 0)
            const disponible = ingresosTotal - gastosSinAhorro
            const totalAhorro = gastos.filter((g: any) => g.categoria === 'ahorro').reduce((s: number, g: any) => s + g.monto, 0)

            const editIngreso = (field: string) => {
              if (!presupuestoMes.cerrado) {
                if (field === 'salario') {
                  if (controlActual?.tipo === 'mensual') setEditVal(presupuestoMes.salarioMensual)
                  else { setEditQ1(presupuestoMes.salarioQ1); setEditQ2(presupuestoMes.salarioQ2) }
                } else if (field === 'efectivoExtra') setEditVal(presupuestoMes.efectivoExtra)
                else setEditVal(presupuestoMes.sobranteAnterior)
                setEditField(field)
              }
            }

            return (
              <div className="space-y-3">
                <div className="rounded-xl bg-surface border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Resumen del Mes</h3>
                      {controlActual?.tipo === 'quincenal' && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${quincenaAuto === 'Q1' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${quincenaAuto === 'Q1' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                          Estás en {quincenaAuto}
                        </span>
                      )}
                    </div>
                    {controlActual && (
                      <button type="button" onClick={() => setControlDetail(controlActual)} className="text-[10px] text-primary hover:underline font-semibold">
                        Ver control {controlActual.year} →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-surface-raised border border-border p-3 text-center">
                      <span className="text-[10px] uppercase tracking-wider text-ink-muted">Ingresos</span>
                      <p className="text-lg font-bold text-ink mt-0.5">{fmt(ingresosTotal)}</p>
                      {!presupuestoMes.cerrado && editField === 'salario' ? (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {controlActual?.tipo === 'quincenal' ? (
                            <>
                              <input type="number" value={editQ1 || ''} onChange={(e) => setEditQ1(Number(e.target.value))} className="w-16 rounded border border-primary/40 bg-surface px-1 py-0.5 text-[10px] text-ink text-right focus:outline-none" placeholder="Q1" />
                              <span className="text-[9px] text-ink-muted">Q1</span>
                              <input type="number" value={editQ2 || ''} onChange={(e) => setEditQ2(Number(e.target.value))} className="w-16 rounded border border-primary/40 bg-surface px-1 py-0.5 text-[10px] text-ink text-right focus:outline-none" placeholder="Q2" />
                              <span className="text-[9px] text-ink-muted">Q2</span>
                            </>
                          ) : (
                            <input type="number" value={editVal || ''} onChange={(e) => setEditVal(Number(e.target.value))} className="w-20 rounded border border-primary/40 bg-surface px-1 py-0.5 text-[10px] text-ink text-right focus:outline-none" />
                          )}
                          <button onClick={async () => {
                            const payload = controlActual?.tipo === 'mensual' ? { salarioMensual: editVal } : { salarioQ1: editQ1, salarioQ2: editQ2 }
                            await updatePresupuesto.mutateAsync({ id: presupuestoMes.id, data: payload })
                            setEditField(null)
                          }} className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-white">Ok</button>
                          <button onClick={() => setEditField(null)} className="rounded border border-border px-1.5 py-0.5 text-[9px] text-ink-muted">X</button>
                        </div>
                      ) : (
                        <button onClick={() => editIngreso('salario')} disabled={presupuestoMes.cerrado} className="mt-1 inline-flex items-center gap-1 text-[9px] text-ink-muted hover:text-primary disabled:opacity-30">
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          {controlActual?.tipo === 'mensual' ? 'Editar salario' : 'Editar Q1/Q2'}
                        </button>
                      )}
                      {editField !== 'salario' && (
                        <div className="flex items-center justify-center gap-2 mt-1.5 text-[9px] text-ink-muted">
                          {!presupuestoMes.cerrado && (
                            <button onClick={() => editIngreso('efectivoExtra')} className="hover:text-primary flex items-center gap-0.5">
                              Extra: <strong>{fmt(presupuestoMes.efectivoExtra)}</strong>
                            </button>
                          )}
                          <span>Sobrante: <strong>{fmt(presupuestoMes.sobranteAnterior)}</strong></span>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-surface-raised border border-border p-3 text-center">
                      <span className="text-[10px] uppercase tracking-wider text-ink-muted">Gastos + Ocio</span>
                      <p className="text-lg font-bold text-danger mt-0.5">{fmt(gastosSinAhorro)}</p>
                      {totalAhorro > 0 && <p className="text-[9px] text-ink-muted mt-0.5">Ahorro: <strong className="text-success">{fmt(totalAhorro)}</strong> (en cartera Ahorros)</p>}
                    </div>
                    <div className={`rounded-lg border p-3 text-center ${disponible >= 0 ? 'bg-success-subtle border-success/30' : 'bg-danger-subtle border-danger/30'}`}>
                      <span className="text-[10px] uppercase tracking-wider text-ink-muted">Disponible</span>
                      <p className={`text-lg font-bold mt-0.5 ${disponible >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(disponible)}</p>
                      <p className="text-[9px] text-ink-muted mt-0.5">Ingresos - Gastos (sin ahorro)</p>
                    </div>
                  </div>
                </div>

                {controlActual?.tipo === 'quincenal' && (() => {
                  const q1gastos = gastos.filter((g: any) => g.quincena === 'Q1' || !g.quincena).reduce((s: number, g: any) => s + (g.categoria !== 'ahorro' ? g.monto : 0), 0)
                  const q2gastos = gastos.filter((g: any) => g.quincena === 'Q2' || !g.quincena).reduce((s: number, g: any) => s + (g.categoria !== 'ahorro' ? g.monto : 0), 0)
                  const q1restante = presupuestoMes.sobranteAnterior + presupuestoMes.salarioQ1 - q1gastos
                  const q2restante = q1restante + presupuestoMes.salarioQ2 - q2gastos
                  return (
                    <div className="rounded-xl bg-surface border border-border overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-border">
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">1</span>
                            <span className="text-xs font-semibold text-ink">Q1 · Días 1-15</span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between"><span className="text-ink-muted">Saldo anterior</span><span className="font-semibold text-ink">{fmt(presupuestoMes.sobranteAnterior)}</span></div>
                            <div className="flex justify-between"><span className="text-ink-muted">Salario Q1</span><span className="font-semibold text-ink">+{fmt(presupuestoMes.salarioQ1)}</span></div>
                            <div className="flex justify-between"><span className="text-ink-muted">Gastos + Ocio</span><span className="font-semibold text-danger">-{fmt(q1gastos)}</span></div>
                            <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-ink-muted">Pasa a Q2</span><span className={`font-semibold ${q1restante >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(q1restante)}</span></div>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">2</span>
                            <span className="text-xs font-semibold text-ink">Q2 · Días 16-{new Date(presupuestoMes.year, presupuestoMes.mes, 0).getDate()}</span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between"><span className="text-ink-muted">Recibe de Q1</span><span className="font-semibold text-ink">{fmt(q1restante)}</span></div>
                            <div className="flex justify-between"><span className="text-ink-muted">Salario Q2</span><span className="font-semibold text-ink">+{fmt(presupuestoMes.salarioQ2)}</span></div>
                            <div className="flex justify-between"><span className="text-ink-muted">Gastos + Ocio</span><span className="font-semibold text-danger">-{fmt(q2gastos)}</span></div>
                            <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-ink-muted">Final del mes</span><span className={`font-semibold ${q2restante >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(q2restante)}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })()}
          <div className="flex items-center justify-end gap-2">
            {presupuestoMes?.cerrado ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Mes Cerrado
              </span>
            ) : controlActual?.tipo === 'quincenal' ? (
              (() => {
                const puedeCerrarQ1 = quincenaAuto === 'Q1' && !presupuestoMes?.cerradoQ1
                const puedeCerrarQ2 = quincenaAuto === 'Q2' && !presupuestoMes?.cerradoQ2
                if (!puedeCerrarQ1 && !puedeCerrarQ2) return null
                const q = puedeCerrarQ2 ? 'Q2' : 'Q1'
                return (
                  <motion.button type="button" onClick={() => handleCerrarMes(q)} disabled={cerrarMes.isPending} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50" title={`Cerrar ${q} para calcular el remanente`}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Cerrar {q}
                  </motion.button>
                )
              })()
            ) : (
              presupuestoMes && !presupuestoMes.cerrado && (
                <motion.button type="button" onClick={() => handleCerrarMes()} disabled={cerrarMes.isPending} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/25 transition-colors disabled:opacity-50" title="Cerrar el mes y calcular el remanente">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {cerrarMes.isPending ? 'Cerrando...' : 'Cerrar Mes'}
                </motion.button>
              )
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
        />
      )}

      {gastoAction && (
        <GastoActionModal
          open={!!gastoAction}
          gasto={gastoAction.gasto}
          presupuestoId={gastoAction.presupuestoId}
          tipo={controlActual?.tipo ?? 'mensual'}
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
        <ControlDetail control={controlDetail} onClose={() => setControlDetail(null)} onGastoAction={(gasto, presupuestoId) => setGastoAction({ gasto, presupuestoId })} />
      )}
    </main>
  )
}

