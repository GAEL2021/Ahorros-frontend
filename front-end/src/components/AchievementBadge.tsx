import type { Meta } from '@/types'

interface Achievement {
  id: string
  icon: string
  title: string
  description: string
  unlocked: boolean
  color: string
}

export function computeAchievements(metas: Meta[]): Achievement[] {
  const completadas = metas.filter((m) => m.estado === 'completado').length
  const activas = metas.filter((m) => m.estado === 'activo').length
  const total = metas.length
  const totalAhorrado = metas.reduce((sum, m) => sum + m.montoAcumulado, 0)
  const tieneGrupal = metas.some((m) => (m.miembros?.length ?? 0) > 1)
  const alguna100 = metas.some((m) => m.montoAcumulado >= m.montoObjetivo && m.estado === 'activo')

  return [
    {
      id: 'first-goal',
      icon: '🪙',
      title: 'Primera Meta',
      description: 'Creaste tu primera meta de ahorro',
      unlocked: total >= 1,
      color: '#c9a84c',
    },
    {
      id: 'first-complete',
      icon: '🏆',
      title: 'Meta Cumplida',
      description: 'Completaste una meta al 100%',
      unlocked: completadas >= 1 || alguna100,
      color: '#c9a84c',
    },
    {
      id: 'three-goals',
      icon: '👑',
      title: 'Coleccionista',
      description: 'Tienes 3 o más metas creadas',
      unlocked: total >= 3,
      color: '#d4b86a',
    },
    {
      id: 'saver-100k',
      icon: '💎',
      title: 'Ahorrador',
      description: 'Acumulaste más de $100,000 en total',
      unlocked: totalAhorrado >= 100000,
      color: '#d4b86a',
    },
    {
      id: 'saver-1m',
      icon: '🌟',
      title: 'Gran Ahorrador',
      description: 'Acumulaste más de $1,000,000 en total',
      unlocked: totalAhorrado >= 1000000,
      color: '#f0d78c',
    },
    {
      id: 'team-player',
      icon: '🤝',
      title: 'Jugador en Equipo',
      description: 'Participas en una meta grupal',
      unlocked: tieneGrupal,
      color: '#b87333',
    },
    {
      id: 'five-complete',
      icon: '🎖️',
      title: 'Veterano',
      description: 'Completaste 5 o más metas',
      unlocked: completadas >= 5,
      color: '#f0d78c',
    },
    {
      id: 'active-three',
      icon: '⚡',
      title: 'Multitarea',
      description: 'Tienes 3 metas activas al mismo tiempo',
      unlocked: activas >= 3,
      color: '#c9a84c',
    },
  ]
}

interface AchievementBadgeProps {
  achievement: Achievement
  index: number
}

export default function AchievementBadge({ achievement, index }: AchievementBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-500 ${
        achievement.unlocked
          ? 'bg-surface border border-primary/15 medal-ring unlocked'
          : 'bg-surface border border-border opacity-40'
      }`}
      style={{
        animation: achievement.unlocked ? `medal-unlock 0.6s ease-out ${0.1 * index}s both` : undefined,
      }}
      title={achievement.description}
    >
      <span className="text-2xl">{achievement.icon}</span>
      <span className={`text-[10px] font-semibold text-center leading-tight ${achievement.unlocked ? 'text-ink' : 'text-ink-muted'}`}>
        {achievement.title}
      </span>
      {!achievement.unlocked && (
        <div className="h-1 w-6 rounded-full bg-primary/10" />
      )}
    </div>
  )
}
