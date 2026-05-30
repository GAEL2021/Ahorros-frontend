import { useRef, useEffect, useCallback } from 'react'

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  markers?: { value: number; label: string }[]
}

export default function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0

  const updateFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const rawPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      let rawValue = min + rawPct * (max - min)
      rawValue = Math.round(rawValue / step) * step
      rawValue = Math.max(min, Math.min(max, rawValue))
      onChange(rawValue)
    },
    [min, max, step, onChange],
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    updateFromPosition(e.clientX)
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current) return
      updateFromPosition(e.clientX)
    }
    const handleUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [updateFromPosition])

  return (
    <div className="w-full">
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className="relative h-2 w-full cursor-pointer rounded-full bg-border select-none touch-none"
      >
        {/* Filled track */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-primary bg-white shadow-md cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Value display */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] font-medium text-ink-muted">${min.toLocaleString()}</span>
        <span
          className="text-xs font-bold tabular-nums text-primary"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ${value.toLocaleString()}
        </span>
        <span className="text-[10px] font-medium text-ink-muted">${max.toLocaleString()}</span>
      </div>
    </div>
  )
}
