import { useMemo } from 'react'
import { clsx } from 'clsx'
import type { TrendPointDTO } from '../lib/types'

const pointColorByProgress: Record<TrendPointDTO['progress'], string> = {
  progress: '#16a34a', // green-600
  same: '#a1a1aa', // zinc-400
  regression: '#dc2626', // red-600
}

export function Sparkline({
  points,
  width = 220,
  height = 64,
  className,
}: {
  points: TrendPointDTO[]
  width?: number
  height?: number
  className?: string
}) {
  if (!points || points.length === 0) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/30 text-xs text-zinc-400',
          className,
        )}
        style={{ width, height }}
      >
        אין נתונים
      </div>
    )
  }

  const ys = points.map((p) => p.y)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const range = Math.max(1, maxY - minY)

  const padX = 8
  const padY = 10
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const xAt = (i: number) =>
    padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)

  const yAt = (y: number) => {
    const t = (y - minY) / range
    return padY + (1 - t) * innerH
  }

  const polyline = points
    .map((p, i) => `${xAt(i).toFixed(2)},${yAt(p.y).toFixed(2)}`)
    .join(' ')

  const area = `${padX},${padY + innerH} ${polyline} ${padX + innerW},${padY + innerH}`
  const uid = useMemo(() => Math.random().toString(16).slice(2), [])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={clsx('rounded-xl border border-zinc-800 bg-zinc-950/30', className)}
      role="img"
      aria-label="Progress chart"
    >
      <defs>
        <linearGradient id={`sparkFill-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`softGlow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.55 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* subtle baseline grid */}
      <line
        x1={padX}
        x2={padX + innerW}
        y1={padY + innerH}
        y2={padY + innerH}
        stroke="#ffffff"
        strokeOpacity="0.08"
        strokeWidth="1"
      />

      {/* area fill */}
      <polygon points={area} fill={`url(#sparkFill-${uid})`} />

      {/* contrast under-stroke (helps black line on dark bg) */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.16"
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* black line (as requested) */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#000000"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* points */}
      {points.map((p, i) => (
        <circle
          key={`${p.occurred_at}-${i}`}
          cx={xAt(i)}
          cy={yAt(p.y)}
          r="4"
          fill={pointColorByProgress[p.progress]}
          stroke="#000000"
          strokeWidth="1"
          filter={`url(#softGlow-${uid})`}
        />
      ))}
    </svg>
  )
}

