import { useEffect, useState } from 'react'

interface AnimateNumbersProps {
  value: number
  prefix?: string
  decimals?: number
}

export function AnimateNumbers({ value, prefix = '', decimals = 2 }: AnimateNumbersProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const duration = 800 // ms
    const startVal = 0

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setCurrent(progress * (value - startVal) + startVal)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }, [value])

  return (
    <span className="font-mono font-extrabold">
      {prefix}
      {current.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}
