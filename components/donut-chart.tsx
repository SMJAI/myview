'use client'

interface DonutChartProps {
  used: number
  total: number
  color: string
  size?: number
  strokeWidth?: number
}

export function DonutChart({ used, total, color, size = 72, strokeWidth = 9 }: DonutChartProps) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(used / total, 1) : 0
  const filled = pct * c
  const center = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      {/* Track */}
      <circle
        cx={center} cy={center} r={r}
        fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${c - filled}`}
        strokeLinecap="round"
      />
    </svg>
  )
}
