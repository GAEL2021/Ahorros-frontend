import { useMemo } from 'react'
import { useFetchGoals } from '@/hooks/useFetchGoals'
import { useFetchBancos, useFetchTransactions } from '@/hooks/useFetchBancos'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AnimateNumbers } from '@/components/ui/AnimateNumbers'
import { MultiRingProgress } from '@/components/ui/MultiRingProgress'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: goals, isLoading: loadingGoals, isError: errorGoals } = useFetchGoals()
  const { data: carteras, isLoading: loadingBancos } = useFetchBancos()
  const { data: transactions, isLoading: loadingTrans } = useFetchTransactions()

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

  const firstGoalSpent = useMemo(() => {
    return firstGoal?.checklist?.filter(item => item.completado).reduce((sum, item) => sum + (item.montoReal ?? item.monto), 0) ?? 0
  }, [firstGoal])

  const secondGoalSpent = useMemo(() => {
    return secondGoal?.checklist?.filter(item => item.completado).reduce((sum, item) => sum + (item.montoReal ?? item.monto), 0) ?? 0
  }, [secondGoal])

  const isLoading = loadingGoals || loadingBancos || loadingTrans

  // Ring data for circular radial chart representation
  const ringProgressData = [
    { name: 'Metas', percentage: metasProgress > 0 ? metasProgress : 40, color: '#6336FF' },
    { name: 'Saldo', percentage: saldoPct > 0 ? saldoPct : 31, color: '#FFC700' },
    { name: 'Checklist', percentage: checklistPct > 0 ? checklistPct : 30, color: '#00D1FF' },
    { name: 'Ahorro', percentage: savingsRate > 0 ? savingsRate : 11, color: '#EC4899' },
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

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full font-sans space-y-10">
      {/* Header section */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Equilibra</h1>
        <p className="mt-1 text-sm text-ink-muted">Tu panel interactivo con visualización concéntrica y microinteracciones</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : errorGoals ? (
        <div className="bg-surface rounded-2xl border border-border px-6 py-12 text-center animate-fade-in">
          <p className="text-sm text-danger">Error al cargar estadísticas</p>
        </div>
      ) : (
        <div className="space-y-10 animate-fade-in">
          
          {/* SECCIÓN 1: Resumen General y Salud Financiera */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Resumen General y Salud Financiera</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-stretch">
              <Card variant="dark" delay={0.1} className="relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                <div className="absolute top-3 right-3 text-primary/30 animate-pulse">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3.091 15 8.187 14.1l.813-5.096 1.813 5.096 5.096.9-5.096.904z" />
                  </svg>
                </div>
                <div className="absolute bottom-16 left-3 text-primary/20 animate-pulse" style={{ animationDelay: '1.5s' }}>
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div className="flex items-center gap-4">
                  {/* Mascot Frame */}
                  <div className="w-16 h-16 bg-gradient-to-tr from-[#6336FF] to-[#7043F6] rounded-full flex items-center justify-center relative shadow-md">
                    <svg className="w-12 h-12 text-white" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="50" r="30" fill="#FFC700" />
                      <path d="M35 42 L38 48 L44 48 L39 52 L41 58 L35 54 L29 58 L31 52 L26 48 L32 48 Z" fill="black" />
                      <path d="M65 42 L68 48 L74 48 L69 52 L71 58 L65 54 L59 58 L61 52 L56 48 L62 48 Z" fill="black" />
                      <path d="M42 66 Q50 72 58 66" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-ink tracking-tight">Equilibra</h2>
                    <p className="text-[10px] text-ink-muted">Tu panel financiero inteligente</p>
                  </div>
                </div>

                <div className="my-5">
                  <h3 className="text-lg font-bold text-ink leading-tight">
                    ¡Hola, {user?.displayName || user?.email || 'Usuario'}!
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Gestiona tus finanzas, carteras de ahorro y colabora con tu grupo de forma interactiva.
                  </p>
                </div>

                <Button
                  variant="yellow"
                  onClick={() => navigate('/metas')}
                  className="w-full text-center"
                >
                  Ver mis Metas
                </Button>
              </Card>

              {/* Balance General Card */}
              <Card variant="light" delay={0.2} className="space-y-4 flex flex-col justify-between min-h-[280px]">
                <div>
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Balance General</span>
                  <h1 className="text-4xl font-extrabold text-ink mt-1 font-mono tracking-tight">
                    $<AnimateNumbers value={totalBalance} decimals={2} />
                  </h1>
                </div>

                {/* Yellow Triple-Column Card */}
                <div className="bg-[#FFC700] rounded-[2rem] p-5 flex justify-between gap-2 shadow-sm text-black">
                  <div className="flex-1 border-r border-black/10 pr-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Ingresos</span>
                    <p className="text-lg font-extrabold font-mono mt-0.5">+$<AnimateNumbers value={ingresos} decimals={0} /></p>
                  </div>
                  <div className="flex-1 border-r border-black/10 px-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Egresos</span>
                    <p className="text-lg font-extrabold font-mono mt-0.5">-$<AnimateNumbers value={egresos} decimals={0} /></p>
                  </div>
                  <div className="flex-1 pl-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">Gastado</span>
                    <p className="text-lg font-extrabold font-mono mt-0.5">-$<AnimateNumbers value={totalSpentChecklist} decimals={0} /></p>
                  </div>
                </div>
              </Card>

              {/* SVG Concentric Progress Gauge */}
              <Card variant="dark" delay={0.3} className="space-y-4 flex flex-col justify-between min-h-[280px]">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-ink">Salud Financiera</h3>
                  <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Metas Activas</span>
                </div>
                <MultiRingProgress
                  data={ringProgressData}
                  centerLabel="Balance Total"
                  centerValue={`$${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
              </Card>
            </div>
          </section>

          {/* SECCIÓN 2: Planificación y Avance de Metas */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Planificación y Avance de Metas</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Bento Sub-Grid */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dashed Add Card */}
                <div 
                  onClick={() => navigate('/metas')}
                  className="rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center p-6 min-h-[140px] hover:bg-surface transition-colors cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                    +
                  </div>
                  <span className="text-[10px] font-bold text-ink-muted mt-2">Agregar Nueva Meta</span>
                </div>

                {(!carteras || carteras.length === 0) && (
                  <div
                    onClick={() => navigate('/carteras')}
                    className="rounded-[2rem] border-2 border-dashed border-success/30 flex flex-col items-center justify-center p-6 min-h-[140px] hover:bg-success-subtle transition-colors cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center font-extrabold text-lg shadow-sm text-white">
                      +
                    </div>
                    <span className="text-[10px] font-bold text-success mt-2">Ir a agregar cartera</span>
                  </div>
                )}

                {/* Purple card */}
                <Card variant="purple" delay={0.4} className="flex flex-col justify-between min-h-[140px] border-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate">
                    {firstGoal ? firstGoal.nombre : 'Sin Metas'}
                  </span>
                  <div>
                    <span className="text-2xl font-bold font-mono text-white">
                      $<AnimateNumbers value={firstGoal ? firstGoal.montoAcumulado : 0} decimals={0} />
                    </span>
                    <p className="text-[9px] opacity-75 mt-1 text-white/95">Acumulado en tu meta principal</p>
                    {firstGoal && (
                      <p className="text-[9px] font-semibold text-white/90 mt-1">
                        Gastado (checklist): ${firstGoalSpent.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Card>

                {/* Cyan Card */}
                <Card variant="cyan" delay={0.5} className="flex flex-col justify-between min-h-[140px] border-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate text-black">
                    {secondGoal ? secondGoal.nombre : (carteras?.[0]?.nombre || 'Carteras')}
                  </span>
                  <div>
                    <span className="text-2xl font-bold font-mono text-black">
                      $<AnimateNumbers value={secondGoal ? secondGoal.montoAcumulado : (carteras?.[0]?.saldo || 0)} decimals={0} />
                    </span>
                    <p className="text-[9px] opacity-75 mt-1 text-black/80">
                      {secondGoal ? 'Total en cartera / meta secundaria' : 'Total en cartera'}
                    </p>
                    {secondGoal && (
                      <p className="text-[9px] font-semibold text-black/85 mt-1">
                        Gastado (checklist): ${secondGoalSpent.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Card>

                {/* Budget Progress Card */}
                <Card variant="light" delay={0.6} className="flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Avance de Objetivo</span>
                    <span className="text-xl font-bold text-ink mt-1 block">
                      {firstGoal ? `${Math.round((firstGoal.montoAcumulado / firstGoal.montoObjetivo) * 100)}%` : '0%'}
                    </span>
                  </div>
                  {firstGoal && (
                    <div className="w-full bg-border h-2.5 rounded-full overflow-hidden mt-4">
                      <div 
                        className="bg-gradient-to-r from-[#6336FF] to-[#00D1FF] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, Math.round((firstGoal.montoAcumulado / firstGoal.montoObjetivo) * 100))}%` }}
                      />
                    </div>
                  )}
                </Card>
              </div>

              {/* Widget: Presupuesto vs Metas Comparison */}
              <div className="lg:col-span-1">
                <Card variant="light" delay={0.7} className="space-y-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                      <span>📊</span> Control vs Metas
                    </h3>
                    <span className="text-[9px] bg-primary/10 px-2 py-0.5 rounded-full font-bold text-primary">Análisis</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
                        <span>Asignado a Metas</span>
                        <span className="text-ink font-bold">${goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoAcumulado : 0), 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${metasProgress}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
                        <span>Disponible</span>
                        <span className="text-ink font-bold">${Math.max(0, totalBalance - (goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoAcumulado : 0), 0) ?? 0)).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                        <div className="bg-success h-full rounded-full transition-all duration-1000" style={{ width: `${totalBalance > 0 ? Math.round((Math.max(0, totalBalance - (goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoAcumulado : 0), 0) ?? 0)) / totalBalance) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-raised border border-border p-3.5 rounded-2xl flex flex-col justify-between mt-3">
                    <div className="flex justify-between items-center text-[10px] text-ink-muted font-bold mb-1">
                      <span>Estado de Ahorro:</span>
                      <span className="text-danger font-mono font-bold">${(goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoObjetivo - g.montoAcumulado : 0), 0) ?? 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-ink-muted leading-relaxed">
                      {totalBalance >= (goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoObjetivo - g.montoAcumulado : 0), 0) ?? 0) 
                        ? '🎯 Saldo suficiente para completar objetivos.' 
                        : `Faltan $${((goals?.reduce((sum, g) => sum + (g.estado === 'activo' ? g.montoObjetivo - g.montoAcumulado : 0), 0) ?? 0) - totalBalance).toLocaleString()} para tus metas.`}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: Flujo de Caja y Transacciones */}
          <section className="space-y-4">
            <div className="border-b border-border/60 pb-2">
              <h2 className="text-xs font-bold text-ink-muted uppercase tracking-widest">Flujo de Caja y Transacciones</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Activity Feed */}
              <div className="lg:col-span-1">
                <Card variant="light" delay={0.8} className="space-y-4 h-full">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-extrabold text-ink-secondary uppercase tracking-wider">Actividad de Ahorro</h4>
                    <span className="text-[9px] bg-green-500/15 px-2.5 py-0.5 rounded-full font-bold text-green-600 dark:text-green-400">En Vivo</span>
                  </div>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {dynamicActivityFeed.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${item.bg}`}>
                            {item.initials}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-bold text-ink leading-tight truncate">{item.name}</h5>
                            <p className="text-[9px] text-ink-muted truncate mt-0.5">{item.msg}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-green-600 font-mono flex-shrink-0">+${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    {dynamicActivityFeed.length === 0 && (
                      <p className="text-center text-[10px] text-ink-muted py-6">Sin aportes recientes.</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Recent Transactions List */}
              <div className="lg:col-span-2">
                <Card variant="light" delay={0.9} className="space-y-4 h-full">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-extrabold text-ink-secondary uppercase tracking-wider">Egresos Recientes</h4>
                    <span onClick={() => navigate('/carteras')} className="text-[10px] text-ink-muted font-bold hover:underline cursor-pointer">Ver Todos</span>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    {transactions?.filter(t => t.tipo === 'retiro').slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-border">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-border text-ink-muted flex items-center justify-center text-xs flex-shrink-0">
                            {getTransactionEmoji(t.descripcion)}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-[11px] font-bold text-ink leading-tight truncate">{t.descripcion}</h5>
                            <p className="text-[9px] text-ink-muted truncate">{t.bancoNombre}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-danger font-mono flex-shrink-0">-${t.monto.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                    {transactions?.filter(t => t.tipo === 'retiro').length === 0 && (
                      <p className="text-center text-[10px] text-ink-muted py-4 col-span-3">Sin egresos recientes.</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
