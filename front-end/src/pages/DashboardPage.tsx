import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { useFetchBancos, useFetchTransactions } from '@/hooks/useFetchBancos'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AnimateNumbers } from '@/components/ui/AnimateNumbers'
import { MultiRingProgress } from '@/components/ui/MultiRingProgress'
import { useFetchControles } from '@/hooks/usePresupuestos'
import { BudgetSavingsEvolution } from '@/components/ui/BudgetSavingsEvolution'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: goals, isLoading: loadingGoals, isError: errorGoals } = useFetchGoals()
  const { data: carteras, isLoading: loadingBancos } = useFetchBancos()
  const { data: transactions, isLoading: loadingTrans } = useFetchTransactions()
  const { data: controles } = useFetchControles()

  const currentYearControl = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return controles?.find((c) => c.year === currentYear) || controles?.[0]
  }, [controles])

  // Financial calculations
  const totalBalance = carteras?.reduce((sum, b) => sum + b.saldo, 0) ?? 0

  // Extra metrics for concentric radial gauge
  const { metasProgress, saldoPct, checklistPct, savingsRate, totalSpentChecklist } = useMemo(() => {
    // 1. Progreso de Metas
    const activeGoals = goals?.filter(g => g.estado === 'activo') ?? []
    const totalObjetivo = activeGoals.reduce((sum, g) => sum + g.montoObjetivo, 0)
    const totalAcumulado = activeGoals.reduce((sum, g) => sum + g.montoAcumulado, 0)
    const metasProgressVal = totalObjetivo > 0 ? Math.min(100, Math.round((totalAcumulado / totalObjetivo) * 100)) : 0

    // 2. Saldo Disponible
    const targetSaldo = totalObjetivo > 0 ? totalObjetivo : 15000
    const saldoPctVal = Math.min(100, Math.round((totalBalance / targetSaldo) * 100))

    // 3. Checklist Completados
    const checklistItems = activeGoals.flatMap(g => g.checklist ?? [])
    const completedItems = checklistItems.filter(item => item.completado).length
    const totalItems = checklistItems.length
    const checklistPctVal = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    const totalSpentChecklistVal = checklistItems.filter(item => item.completado).reduce((sum, item) => sum + (item.montoReal ?? item.monto), 0)

    // 4. Tasa de Ahorro
    const totalDep = transactions?.filter(t => t.tipo === 'deposito').reduce((sum, t) => sum + t.monto, 0) ?? 0
    const totalRet = transactions?.filter(t => t.tipo === 'retiro').reduce((sum, t) => sum + t.monto, 0) ?? 0
    const savingsRateVal = (totalDep + totalRet) > 0 ? Math.round((totalDep / (totalDep + totalRet)) * 100) : 0

    return {
      metasProgress: metasProgressVal,
      saldoPct: saldoPctVal,
      checklistPct: checklistPctVal,
      savingsRate: savingsRateVal,
      totalSpentChecklist: totalSpentChecklistVal
    }
  }, [goals, carteras, transactions, totalBalance])

  const { ingresos, egresos } = useMemo(() => {
    let ing = 0
    let egr = 0
    const list = transactions || []
    list.forEach((t) => {
      if (t.tipo === 'deposito') {
        ing += t.monto
      } else {
        egr += t.monto
      }
    })
    return { ingresos: ing, egresos: egr }
  }, [transactions])

  const getTransactionEmoji = (desc: string) => {
    const d = desc.toLowerCase()
    if (d.includes('spotify') || d.includes('netflix') || d.includes('youtube') || d.includes('music') || d.includes('streaming') || d.includes('suscrip')) return '🎵'
    if (d.includes('figma') || d.includes('adobe') || d.includes('design') || d.includes('diseño') || d.includes('canva')) return '🎨'
    if (d.includes('shop') || d.includes('ropa') || d.includes('tienda') || d.includes('zara') || d.includes('amazon') || d.includes('compras')) return '🛍️'
    if (d.includes('comida') || d.includes('food') || d.includes('super') || d.includes('market') || d.includes('restaurante') || d.includes('grocer') || d.includes('coca')) return '🍔'
    if (d.includes('luz') || d.includes('agua') || d.includes('renta') || d.includes('housing') || d.includes('casa') || d.includes('servicio')) return '🏠'
    return '💰'
  }

  // Active goals list helper
  const firstGoal = goals?.filter(g => g.estado === 'activo')?.[0]
  const secondGoal = goals?.filter(g => g.estado === 'activo')?.[1]



  const isLoading = loadingGoals || loadingBancos || loadingTrans

  // Ring data for circular radial chart representation
  const ringProgressData = [
    { name: 'Metas', percentage: metasProgress, color: '#6336FF' },
    { name: 'Saldo', percentage: saldoPct, color: '#FFC700' },
    { name: 'Checklist', percentage: checklistPct, color: '#00D1FF' },
    { name: 'Ahorro', percentage: savingsRate, color: '#EC4899' },
  ]

  // Dynamic Activity Feed Data representing member contributions from transactions
  const dynamicActivityFeed = useMemo(() => {
    if (!transactions) return []
    const contributions = transactions.filter(t => t.tipo === 'deposito' || t.tipo === 'aporte_meta')
    const sorted = [...contributions].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    
    return sorted.slice(0, 4).map((t) => {
      const uName = (t as any).usuarioNombre || 'Usuario'
      const initials = uName.substring(0, 2).toUpperCase()
      
      const colors = [
        'bg-purple-500/10 text-purple-400',
        'bg-yellow-500/10 text-yellow-400',
        'bg-cyan-500/10 text-cyan-400',
        'bg-green-500/10 text-green-400',
      ]
      const hash = uName.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      const colorClass = colors[hash % colors.length]

      return {
        id: t.id,
        initials,
        name: uName,
        amount: t.monto,
        msg: t.descripcion || 'Aporte a la cartera / meta',
        bg: colorClass,
      }
    })
  }, [transactions])

  const containerVariants = { visible: { transition: { staggerChildren: 0.08 } } }
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }
  const cardItemVariants = { hidden: { opacity: 0, y: 12, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } } }

  return (
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full font-sans space-y-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">Panel de Control</h1>
          <p className="mt-1 text-sm text-ink-muted">Bienvenido, {user?.displayName || user?.email || 'Usuario'}. Aquí tenés tu resumen financiero.</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/presupuestos')} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-[var(--bg)] shadow-lg shadow-primary/25 hover:bg-primary-light transition-all active:scale-[0.97]">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Ir a Presupuestos
        </motion.button>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="h-10 w-10 rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-ink-muted animate-pulse">Cargando tu información...</p>
        </div>
      ) : errorGoals ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-surface rounded-2xl border border-border px-6 py-12 text-center">
          <p className="text-sm text-danger">Error al cargar estadísticas</p>
        </motion.div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
          
          <motion.section variants={itemVariants} className="space-y-4">
            <motion.div className="border-b border-border/60 pb-2">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Resumen General</h2>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={containerVariants} className="grid gap-5 grid-cols-1 lg:grid-cols-3 items-stretch">
              {[
                <Card key="welcome" variant="dark" className="relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                  <div className="absolute top-3 right-3 text-primary/20">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3.091 15 8.187 14.1l.813-5.096 1.813 5.096 5.096.9-5.096.904z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-4">
                    <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }} className="w-16 h-16 bg-gradient-to-br from-[#6336FF] to-[#8750FF] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <span className="text-3xl">🦉</span>
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-extrabold text-ink tracking-tight">Panel</h2>
                      <p className="text-[10px] text-ink-muted/80">Tu centro financiero</p>
                    </div>
                  </div>
                  <div className="my-4">
                    <p className="text-xs text-ink-muted/90 leading-relaxed">
                      Gestioná tus ingresos, gastos y metas desde un solo lugar. Mantené el control total de tus finanzas personales.
                    </p>
                  </div>
                  <Button variant="yellow" onClick={() => navigate('/metas')} className="w-full text-center">Ver mis Metas</Button>
                </Card>,

                <Card key="balance" variant="light" className="space-y-4 flex flex-col justify-between min-h-[260px]">
                  <div>
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Balance General</span>
                    <h1 className="text-4xl font-extrabold text-ink mt-1 font-mono tracking-tight">
                      $<AnimateNumbers value={totalBalance} decimals={2} />
                    </h1>
                  </div>
                  <motion.div whileHover={{ scale: 1.01 }} className="bg-gradient-to-br from-[#FFC700] to-[#FFB300] rounded-[1.5rem] p-5 flex justify-between gap-2 shadow-sm text-black">
                    <div className="flex-1 border-r border-black/15 pr-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Ingresos</span>
                      <p className="text-lg font-extrabold font-mono mt-0.5">+$<AnimateNumbers value={ingresos} decimals={0} /></p>
                    </div>
                    <div className="flex-1 border-r border-black/15 px-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Egresos</span>
                      <p className="text-lg font-extrabold font-mono mt-0.5">-$<AnimateNumbers value={egresos} decimals={0} /></p>
                    </div>
                    <div className="flex-1 pl-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Gastado</span>
                      <p className="text-lg font-extrabold font-mono mt-0.5">-$<AnimateNumbers value={totalSpentChecklist} decimals={0} /></p>
                    </div>
                  </motion.div>
                </Card>,

                <Card key="health" variant="dark" className="space-y-4 flex flex-col justify-between min-h-[260px]">
                  <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <h3 className="text-sm font-bold text-ink">Salud Financiera</h3>
                    <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Metas Activas</span>
                  </div>
                  <MultiRingProgress data={ringProgressData} centerLabel="Balance Total" centerValue={`$${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                </Card>,
              ].map((card, i) => (
                <motion.div key={i} variants={cardItemVariants} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                  {card}
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section variants={itemVariants} className="space-y-4">
            <motion.div className="border-b border-border/60 pb-2">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Planificación y Avance</h2>
            </motion.div>
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
              <motion.div initial="hidden" animate="visible" variants={containerVariants} className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  <motion.div key="add-meta" whileHover={{ scale: 1.02, borderColor: 'var(--primary)' }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/metas')} className="rounded-[1.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center p-6 min-h-[130px] hover:bg-surface transition-all cursor-pointer">
                    <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }} className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-lg shadow-sm">+</motion.div>
                    <span className="text-[10px] font-bold text-ink-muted mt-2">Agregar Meta</span>
                  </motion.div>,

                  <motion.div key="presupuestos" whileHover={{ scale: 1.02, borderColor: 'var(--primary)' }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/presupuestos')} className="rounded-[1.5rem] border-2 border-border bg-surface flex flex-col items-center justify-center p-6 min-h-[130px] hover:bg-surface-raised transition-all cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-lg shadow-sm">📊</div>
                    <span className="text-[10px] font-bold text-ink mt-2">Control de Gastos</span>
                    <span className="text-[8px] text-ink-muted mt-0.5">Registrá y controlá tus gastos</span>
                  </motion.div>,

                  ...((!carteras || carteras.length === 0) ? [(
                    <motion.div key="bancos" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/bancos')} className="rounded-[1.5rem] border-2 border-dashed border-success/30 flex flex-col items-center justify-center p-6 min-h-[130px] hover:bg-success-subtle transition-all cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center font-extrabold text-lg shadow-sm text-white">+</div>
                      <span className="text-[10px] font-bold text-success mt-2">Agregar Banco</span>
                    </motion.div>
                  )] : []),

                  <Card key="purple" variant="purple" className="flex flex-col justify-between min-h-[130px] border-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate">{firstGoal ? firstGoal.nombre : 'Sin Metas'}</span>
                    <div>
                      <span className="text-2xl font-bold font-mono text-white">$<AnimateNumbers value={firstGoal ? firstGoal.montoAcumulado : 0} decimals={0} /></span>
                      <p className="text-[9px] opacity-75 mt-0.5 text-white/95">Acumulado en tu meta principal</p>
                    </div>
                  </Card>,

                  <Card key="cyan" variant="cyan" className="flex flex-col justify-between min-h-[130px] border-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate text-black">{secondGoal ? secondGoal.nombre : (carteras?.[0]?.nombre || 'Bancos')}</span>
                    <div>
                      <span className="text-2xl font-bold font-mono text-black">$<AnimateNumbers value={secondGoal ? secondGoal.montoAcumulado : (carteras?.[0]?.saldo || 0)} decimals={0} /></span>
                      <p className="text-[9px] opacity-75 mt-0.5 text-black/80">{secondGoal ? 'Total en meta secundaria' : 'Total en banco'}</p>
                    </div>
                  </Card>,

                  <Card key="progress" variant="light" className="flex flex-col justify-between min-h-[130px]">
                    <div>
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Avance</span>
                      <span className="text-xl font-bold text-ink mt-1 block">{firstGoal ? `${Math.round((firstGoal.montoAcumulado / firstGoal.montoObjetivo) * 100)}%` : '0%'}</span>
                    </div>
                    {firstGoal && (
                      <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden mt-3">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.round((firstGoal.montoAcumulado / firstGoal.montoObjetivo) * 100))}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="bg-gradient-to-r from-[#6336FF] to-[#00D1FF] h-full rounded-full" />
                      </div>
                    )}
                  </Card>,
                ].map((el, i) => (
                  <motion.div key={i} variants={cardItemVariants} whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                    {el}
                  </motion.div>
                ))}
              </motion.div>

              <div className="lg:col-span-1">
                <motion.div variants={cardItemVariants} custom={5} whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                  <Card variant="light" className="space-y-4 h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <h3 className="text-sm font-bold text-ink flex items-center gap-2">📊 Control vs Metas</h3>
                      <span className="text-[9px] bg-primary/10 px-2 py-0.5 rounded-full font-bold text-primary">Análisis</span>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
                          <span>Asignado a Metas</span>
                          <span className="text-ink font-bold">${goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoAcumulado : 0), 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${metasProgress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="bg-primary h-full rounded-full" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
                          <span>Disponible</span>
                          <span className="text-ink font-bold">${Math.max(0, totalBalance - (goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoAcumulado : 0), 0) ?? 0)).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${totalBalance > 0 ? Math.round((Math.max(0, totalBalance - (goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoAcumulado : 0), 0) ?? 0)) / totalBalance) * 100) : 0}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="bg-success h-full rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-raised border border-border/60 p-3.5 rounded-xl mt-2">
                      <div className="flex justify-between items-center text-[10px] text-ink-muted font-bold mb-1">
                        <span>Estado:</span>
                        <span className="text-danger font-mono font-bold">${(goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoObjetivo - g.montoAcumulado : 0), 0) ?? 0).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-ink-muted leading-relaxed">
                        {totalBalance >= (goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoObjetivo - g.montoAcumulado : 0), 0) ?? 0) 
                          ? '🎯 Saldo suficiente para completar objetivos.' 
                          : `Faltan $${((goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoObjetivo - g.montoAcumulado : 0), 0) ?? 0) - totalBalance).toLocaleString()} para tus metas.`}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {currentYearControl && currentYearControl.presupuestos && currentYearControl.presupuestos.length > 0 && (
            <motion.section variants={itemVariants} className="space-y-4 animate-fade-in">
              <BudgetSavingsEvolution presupuestos={currentYearControl.presupuestos} />
            </motion.section>
          )}

          <motion.section variants={itemVariants} custom={2} className="space-y-4">
            <motion.div className="border-b border-border/60 pb-2">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Flujo de Caja</h2>
            </motion.div>
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
              <motion.div variants={cardItemVariants} custom={0} className="lg:col-span-1">
                <Card variant="light" className="space-y-4 h-full">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h4 className="text-xs font-extrabold text-ink-secondary uppercase tracking-wider">Actividad</h4>
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[9px] bg-green-500/15 px-2.5 py-0.5 rounded-full font-bold text-green-600 dark:text-green-400">En Vivo</motion.span>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {dynamicActivityFeed.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <motion.div whileHover={{ scale: 1.1 }} className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${item.bg}`}>{item.initials}</motion.div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-bold text-ink leading-tight truncate">{item.name}</h5>
                            <p className="text-[9px] text-ink-muted truncate mt-0.5">{item.msg}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-green-600 font-mono flex-shrink-0">+${item.amount.toLocaleString()}</span>
                      </motion.div>
                    ))}
                    {dynamicActivityFeed.length === 0 && <p className="text-center text-[10px] text-ink-muted py-6">Sin actividad reciente.</p>}
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={cardItemVariants} custom={1} className="lg:col-span-2">
                <Card variant="light" className="space-y-4 h-full">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h4 className="text-xs font-extrabold text-ink-secondary uppercase tracking-wider">Egresos Recientes</h4>
                    <motion.span whileHover={{ x: 3 }} onClick={() => navigate('/presupuestos')} className="text-[10px] text-ink-muted font-bold hover:text-primary hover:underline cursor-pointer transition-colors">Ver Todos →</motion.span>
                  </div>
                  <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                    {transactions?.filter(t => t.tipo === 'retiro').slice(0, 3).map((t, i) => (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-border/70 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-border/50 text-ink-muted flex items-center justify-center text-xs flex-shrink-0">{getTransactionEmoji(t.descripcion)}</div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-bold text-ink leading-tight truncate">{t.descripcion}</h5>
                            <p className="text-[9px] text-ink-muted truncate">{t.bancoNombre}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-danger font-mono flex-shrink-0">-${t.monto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </motion.div>
                    ))}
                    {transactions?.filter(t => t.tipo === 'retiro').length === 0 && <p className="text-center text-[10px] text-ink-muted py-4 col-span-3">Sin egresos recientes.</p>}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </main>
  )
}

