import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import type { Presupuesto } from '@/types'
import { MESES } from '@/lib/formatters'
import { useTheme } from '@/contexts/ThemeContext'

interface BudgetSavingsEvolutionProps {
  presupuestos: Presupuesto[]
}

export function BudgetSavingsEvolution({ presupuestos }: BudgetSavingsEvolutionProps) {
  const [chartType, setChartType] = useState<'stack' | 'trend'>('stack')
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const textMutedColor = isDark ? '#a0a5b5' : '#6B5E7E'
  const gridColor = isDark ? '#242a38' : '#D8D0E6'

  const chartData = useMemo(() => {
    if (!presupuestos || presupuestos.length === 0) return []

    // Sort by month
    const sorted = [...presupuestos].sort((a, b) => a.mes - b.mes)

    return sorted.map((p) => {
      const mesNombre = MESES[p.mes - 1] || `Mes ${p.mes}`
      
      // Calculate income
      const salario = p.tipo === 'mensual' 
        ? p.salarioMensual 
        : (p.salarioQ1 + p.salarioQ2)
      const ingresosTotal = salario + p.efectivoExtra + p.sobranteAnterior

      // Calculate categories
      const gastos = p.gastos ?? []
      const fijos = gastos.filter(g => g.categoria === 'fijos').reduce((sum, g) => sum + g.monto, 0)
      const ocio = gastos.filter(g => g.categoria === 'ocio').reduce((sum, g) => sum + g.monto, 0)
      const ahorro = gastos.filter(g => g.categoria === 'ahorro').reduce((sum, g) => sum + g.monto, 0)
      
      const totalGastosSinAhorro = fijos + ocio
      const sobrante = Math.max(0, ingresosTotal - (totalGastosSinAhorro + ahorro))

      return {
        name: mesNombre,
        Ingresos: ingresosTotal,
        Fijos: fijos,
        Ocio: ocio,
        Ahorro: ahorro,
        Sobrante: sobrante,
        Gastos: totalGastosSinAhorro,
      }
    })
  }, [presupuestos])

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-ink-muted">No hay datos de presupuesto suficientes para generar gráficos históricos.</p>
      </div>
    )
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-xl border border-border p-3.5 shadow-lg text-xs space-y-1.5 min-w-[150px]">
          <p className="font-bold text-ink mb-1 border-b border-border pb-1">{label}</p>
          {payload.map((item: any) => (
            <div key={item.name} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-ink-muted">{item.name}:</span>
              </div>
              <span className="font-bold text-ink font-mono">${Math.round(item.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            📈 Evolución Financiera
          </h3>
          <p className="text-[10px] text-ink-muted mt-0.5">Visualización del flujo de tus presupuestos a lo largo del año</p>
        </div>
        
        {/* Toggle buttons */}
        <div className="flex rounded-xl border border-border overflow-hidden self-start sm:self-center">
          <button
            type="button"
            onClick={() => setChartType('stack')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              chartType === 'stack' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'
            }`}
          >
            Distribución de Ingresos
          </button>
          <button
            type="button"
            onClick={() => setChartType('trend')}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              chartType === 'trend' ? 'bg-primary/15 text-primary' : 'text-ink-muted hover:bg-surface'
            }`}
          >
            Gastos vs Ahorro
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'stack' ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} className="opacity-40" />
              <XAxis dataKey="name" stroke={textMutedColor} fontSize={10} tickLine={false} />
              <YAxis stroke={textMutedColor} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={customTooltip} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                formatter={(value) => <span style={{ color: textMutedColor }}>{value}</span>}
              />
              <Bar dataKey="Fijos" name="Gastos Fijos" stackId="a" fill="var(--lilac)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Ocio" name="Gasto Ocio" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Ahorro" name="Ahorro" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Sobrante" name="Sobrante" stackId="a" fill="#00D1FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--lilac)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--lilac)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAhorro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} className="opacity-40" />
              <XAxis dataKey="name" stroke={textMutedColor} fontSize={10} tickLine={false} />
              <YAxis stroke={textMutedColor} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={customTooltip} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                formatter={(value) => <span style={{ color: textMutedColor }}>{value}</span>}
              />
              <Area type="monotone" dataKey="Gastos" name="Gastos Totales" stroke="var(--lilac)" fillOpacity={1} fill="url(#colorGastos)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="Ahorro" name="Ahorro" stroke="var(--success)" fillOpacity={1} fill="url(#colorAhorro)" strokeWidth={2.5} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
