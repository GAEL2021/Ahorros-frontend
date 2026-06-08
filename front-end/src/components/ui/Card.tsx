import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'light' | 'dark' | 'purple' | 'cyan' | 'yellow'
  delay?: number
}

export function Card({ children, className = '', variant = 'light', delay = 0 }: CardProps) {
  const [isHoverable, setIsHoverable] = useState(false)

  useEffect(() => {
    setIsHoverable(window.matchMedia('(hover: hover)').matches)
  }, [])

  const baseStyles = 'rounded-[2rem] p-4 sm:p-6 border select-none transition-colors duration-300'
  
  const variants = {
    light: 'bg-surface text-ink border-border shadow-sm',
    dark: 'bg-[#F8F6FC] dark:bg-surface-raised text-ink dark:text-white border-border-light dark:border-white/5 shadow-md',
    purple: 'bg-gradient-to-br from-[#6336FF] to-[#7c56ff] text-white border-purple-600/20',
    cyan: 'bg-gradient-to-br from-[#00D1FF] to-[#00b4db] text-black border-cyan-400/20',
    yellow: 'bg-gradient-to-br from-[#FFC700] to-[#e6b300] text-black border-yellow-400/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: isHoverable ? 15 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: isHoverable ? 0.4 : 0.25, delay, ease: [0.25, 0.8, 0.25, 1] }}
      whileHover={isHoverable ? { 
        y: -4, 
        scale: 1.005,
        boxShadow: 'var(--shadow-premium-hover)',
      } : {}}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{
        boxShadow: 'var(--shadow-premium)',
        willChange: 'transform, opacity, box-shadow'
      }}
    >
      {children}
    </motion.div>
  )
}

