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
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full font-sans">
      {/* Header section */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-ink tracking-tight">Gestión de Presupuestos</h1>
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
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 items-start animate-fade-in">
          
          {/* COLUMNA 1: Welcome & Radial Progress */}
          <div className="space-y-6">
            {/* Welcome Splash Card */}
            <Card variant="dark" className="relative overflow-hidden flex flex-col justify-between min-h-[280px]">
              <div className="absolute top-2 right-2 text-xl animate-pulse">✨</div>
              <div className="absolute bottom-4 left-2 text-xl animate-pulse delay-100">💰</div>

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
                  <h2 className="text-xl font-extrabold text-ink tracking-tight">Gestión de Presupuestos</h2>
                  <p className="text-[10px] text-ink-muted">Tu panel financiero inteligente</p>
                </div>
              </div>

              <div className="my-5">
                <h3 className="text-lg font-bold text-ink leading-tight">
                  ¡Hola, {user?.displayName || user?.email || 'Usuario'}!
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Gestiona tus presupuestos, carteras de ahorro y colabora con tu grupo de forma interactiva.
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

            {/* SVG Concentric Progress Gauge */}
            <Card variant="dark" className="space-y-4">
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

          {/* COLUMNA 2: Bento Grid Financials */}
          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card variant="light" className="space-y-4 flex flex-col justify-between">
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

              {/* Activity Feed (Now Dynamic from Backend) */}
              <Card variant="light" className="space-y-4">
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

            {/* Bento Sub-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Card variant="purple" className="flex flex-col justify-between min-h-[140px] border-none">
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
              <Card variant="cyan" className="flex flex-col justify-between min-h-[140px] border-none">
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
              <Card variant="light" className="flex flex-col justify-between min-h-[140px]">
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

            {/* Recent Transactions List */}
            <Card variant="light" className="space-y-4">
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
      )}
    </main>
  )
}
