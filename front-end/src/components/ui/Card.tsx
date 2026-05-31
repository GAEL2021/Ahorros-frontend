import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'light' | 'dark' | 'purple' | 'cyan' | 'yellow'
}

export function Card({ children, className = '', variant = 'light' }: CardProps) {
  const baseStyles = 'rounded-[2rem] p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg border select-none'
  
  const variants = {
    light: 'bg-white dark:bg-[#161920] text-zinc-950 dark:text-white border-zinc-200/80 dark:border-white/10 shadow-md shadow-zinc-100/50 dark:shadow-none',
    dark: 'bg-[#11141B] dark:bg-[#0b0d12] text-white border-zinc-800 dark:border-white/5 shadow-xl shadow-black/25',
    purple: 'bg-[#6336FF] text-white border-purple-600/40 shadow-lg shadow-purple-500/20',
    cyan: 'bg-[#00D1FF] text-black border-cyan-400/40 shadow-lg shadow-cyan-500/20',
    yellow: 'bg-[#FFC700] text-black border-yellow-400/40 shadow-lg shadow-yellow-500/20',
  }

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}
