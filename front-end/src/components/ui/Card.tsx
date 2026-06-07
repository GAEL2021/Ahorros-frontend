import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'light' | 'dark' | 'purple' | 'cyan' | 'yellow'
}

export function Card({ children, className = '', variant = 'light' }: CardProps) {
  const baseStyles = 'rounded-[2rem] p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg border select-none'
  
  const variants = {
    light: 'bg-white dark:bg-[#161920] text-ink dark:text-white border-border dark:border-white/10 shadow-sm shadow-black/5 dark:shadow-none',
    dark: 'bg-white dark:bg-[#0b0d12] text-ink dark:text-white border-l-4 border-l-primary border-border dark:border-white/5 shadow-md shadow-black/5 dark:shadow-black/25',
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
