interface RingData {
  name: string
  percentage: number
  color: string
}

interface MultiRingProgressProps {
  data: RingData[]
  centerLabel: string
  centerValue: string
}

export function MultiRingProgress({ data, centerLabel, centerValue }: MultiRingProgressProps) {
  const size = 180
  const center = size / 2

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
      {/* SVG rings */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {data.map((ring, index) => {
            const radius = 76 - index * 12 // concentric radius
            const strokeWidth = 8
            const circumference = 2 * Math.PI * radius
            const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, ring.percentage))) / 100

            return (
              <g key={ring.name}>
                {/* Background rail */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth={strokeWidth}
                />
                {/* Active progress ring */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </g>
            )
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none">{centerLabel}</span>
          <span className="text-base font-extrabold font-mono text-white mt-1">{centerValue}</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-2.5 text-xs text-zinc-400 font-bold min-w-[120px] w-full">
        {data.map((ring) => (
          <div key={ring.name} className="flex items-center gap-2 justify-between border-b border-white/5 pb-1">
            <div className="flex items-center gap-1.5 text-white">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: ring.color }} />
              <span className="truncate max-w-[80px]">{ring.name}</span>
            </div>
            <span className="font-mono">{ring.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
