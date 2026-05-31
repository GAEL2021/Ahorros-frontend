import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'yellow'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all text-xs tracking-tight rounded-full select-none'
  
  const variants = {
    primary: 'bg-[#6336FF] hover:bg-[#5225e6] text-white py-3 px-6 shadow-md shadow-purple-500/10',
    secondary: 'bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 py-3 px-6 shadow-xs',
    ghost: 'bg-transparent hover:bg-zinc-100/50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 py-2.5 px-4',
    yellow: 'bg-[#FFC700] hover:bg-[#ebd056] text-black py-4 px-8 shadow-lg shadow-yellow-500/10',
  }

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </motion.button>
  )
}
