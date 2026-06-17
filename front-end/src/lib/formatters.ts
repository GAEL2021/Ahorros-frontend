export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
export const SHORT_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export interface CategoriaInfo {
  id: string; label: string; icon: string; color: string; bgClass: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  { id: 'fijos', label: 'Gastos Fijos', icon: '📋', color: '#F59E0B', bgClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' },
  { id: 'ocio', label: 'Ocio', icon: '🎮', color: '#F97316', bgClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' },
  { id: 'ahorro', label: 'Ahorro', icon: '🐷', color: '#10B981', bgClass: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' },
]

export const CAT_LABELS: Record<string, string> = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.label]))
export const CAT_ICONS: Record<string, string> = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.icon]))

export function fmt(n: number) { return '$' + n.toLocaleString() }
