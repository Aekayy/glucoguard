import { motion, useReducedMotion } from 'motion/react'
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { GlucoseState } from '@/components/icons'
import { cn } from '@/lib/utils'

/* Seeded noise so every render of the prototype draws the same day. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Builds a plausible CGM trace through the given anchor points. */
export function trace(anchors: [number, number][], points = 96, seed = 7, jitter = 4) {
  const r = rng(seed)
  const out: number[] = []
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    let k = 0
    while (k < anchors.length - 2 && anchors[k + 1][0] < t) k++
    const [t0, v0] = anchors[k]
    const [t1, v1] = anchors[k + 1]
    const u = t1 === t0 ? 0 : Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
    const eased = u * u * (3 - 2 * u)
    out.push(v0 + (v1 - v0) * eased + (r() - 0.5) * jitter)
  }
  return out
}

const STATE_FILL: Record<GlucoseState, string> = {
  veryLow: 'var(--vlow)',
  low: 'var(--low)',
  inRange: 'var(--ink)',
  high: 'var(--high)',
  veryHigh: 'var(--vhigh)',
  noData: 'var(--nod)',
}

type Marker = { at: number; label: string }

/**
 * Glucose chart — one anatomy everywhere (Today, alerts, console):
 * target band 70–180, dashed 54/70 thresholds, ink line that turns
 * the low colour under 70, now-dot in the current state colour.
 */
export function GlucoseChart({
  data,
  height = 84,
  min = 40,
  max = 260,
  nowState = 'inRange',
  markers = [],
  gapFrom,
  className,
  animate = true,
  showHigh = false,
}: {
  data: number[]
  height?: number
  min?: number
  max?: number
  nowState?: GlucoseState
  markers?: Marker[]
  /** index after which the sensor stopped reporting (drawn as dashed no-data) */
  gapFrom?: number
  className?: string
  animate?: boolean
  showHigh?: boolean
}) {
  const id = useId()
  const reduce = useReducedMotion()
  /* draw in the container's own width so wide panels don't letterbox */
  const host = useRef<SVGSVGElement>(null)
  const [W, setW] = useState(320)
  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const fit = () => setW(Math.max(120, el.clientWidth || 320))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = height
  const pad = 6
  const x = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2)
  const y = (v: number) => pad + (1 - (Math.min(max, Math.max(min, v)) - min) / (max - min)) * (H - pad * 2)
  const live = gapFrom === undefined ? data : data.slice(0, gapFrom + 1)
  const path = useMemo(
    () => live.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, W, H, min, max],
  )
  const lastI = live.length - 1
  const y70 = y(70)

  return (
    <svg ref={host} viewBox={`0 0 ${W} ${H}`} className={cn('block w-full overflow-visible', className)} style={{ height: H }} role="img" aria-label="Glucose over time">
      <defs>
        <clipPath id={`${id}-below`}>
          <rect x="0" y={y70} width={W} height={H - y70} />
        </clipPath>
      </defs>
      <rect x="0" y={y(180)} width={W} height={y(70) - y(180)} fill="var(--inr-tint)" />
      <line x1="0" x2={W} y1={y(70)} y2={y(70)} stroke="var(--low)" strokeDasharray="3 3" strokeWidth="1" opacity="0.8" />
      <line x1="0" x2={W} y1={y(54)} y2={y(54)} stroke="var(--vlow)" strokeDasharray="3 3" strokeWidth="1" opacity="0.8" />
      <line x1="0" x2={W} y1={y(180)} y2={y(180)} stroke="var(--ink-3)" strokeDasharray="2 4" strokeWidth="1" opacity={showHigh ? 1 : 0.6} />
      {markers.map((m) => (
        <g key={m.label}>
          <line x1={x(m.at)} x2={x(m.at)} y1={pad} y2={H - pad} stroke="var(--ink-2)" strokeDasharray="2 3" strokeWidth="1" />
          <text x={x(m.at) + 4} y={pad + 9} fontSize="9" fill="var(--ink-2)" style={{ fontFamily: 'var(--font-sans)' }}>
            {m.label}
          </text>
        </g>
      ))}
      <motion.path
        d={path}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={animate && !reduce ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="var(--low)"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        clipPath={`url(#${id}-below)`}
        initial={animate && !reduce ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      />
      {gapFrom !== undefined ? (
        <line
          x1={x(lastI)}
          x2={W - pad}
          y1={y(live[lastI])}
          y2={y(live[lastI])}
          stroke="var(--nod)"
          strokeDasharray="3 4"
          strokeWidth="1.6"
        />
      ) : (
        <motion.circle
          cx={x(lastI)}
          cy={y(live[lastI])}
          r="4.5"
          fill={STATE_FILL[nowState]}
          stroke="var(--surface)"
          strokeWidth="2"
          initial={animate && !reduce ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.2 }}
        />
      )}
    </svg>
  )
}

/** AGP — median with 25–75% and 5–95% bands over a 24 h day. */
export function AGPChart({ height = 92, lowDip = true, className }: { height?: number; lowDip?: boolean; className?: string }) {
  const W = 320
  const H = height
  const pad = 4
  const min = 40
  const max = 300
  const n = 48
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (H - pad * 2)
  const x = (i: number) => (i / (n - 1)) * W
  const median = Array.from({ length: n }, (_, i) => {
    const h = (i / (n - 1)) * 24
    let v = 135 + 35 * Math.sin(((h - 9) / 24) * Math.PI * 2) + 22 * Math.exp(-((h - 13.5) ** 2) / 3) + 26 * Math.exp(-((h - 19.5) ** 2) / 2.5)
    if (lowDip) v -= 38 * Math.exp(-((h - 3) ** 2) / 1.6)
    return v
  })
  const band = (spread: number, lowBias = 1) =>
    median.map((m, i) => {
      const h = (i / (n - 1)) * 24
      const night = lowDip ? Math.exp(-((h - 3) ** 2) / 2) * 18 * lowBias : 0
      return [m + spread, m - spread - night] as const
    })
  const area = (pts: readonly (readonly [number, number])[]) =>
    `M${pts.map((p, i) => `${x(i).toFixed(1)} ${y(p[0]).toFixed(1)}`).join(' L')} L${pts
      .map((p, i) => [i, p] as const)
      .reverse()
      .map(([i, p]) => `${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`)
      .join(' L')} Z`
  const line = median.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn('block w-full [&_*]:[vector-effect:non-scaling-stroke]', className)} style={{ height: H }} role="img" aria-label="Daily pattern">
      <rect x="0" y={y(180)} width={W} height={y(70) - y(180)} fill="var(--inr-tint)" />
      <path d={area(band(70, 1.4))} fill="var(--brand)" opacity="0.1" />
      <path d={area(band(32))} fill="var(--brand)" opacity="0.22" />
      <line x1="0" x2={W} y1={y(70)} y2={y(70)} stroke="var(--low)" strokeDasharray="3 3" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2" />
    </svg>
  )
}

/** Time-in-range stacked bar (percent values, very low → very high). */
export function TIRBar({ parts, height = 12, className }: { parts: [number, number, number, number, number]; height?: number; className?: string }) {
  const colors = ['bg-vlow', 'bg-low', 'bg-inr', 'bg-high', 'bg-vhigh']
  const order = [0, 1, 2, 3, 4]
  return (
    <div className={cn('flex gap-0.5 overflow-hidden rounded-[4px]', className)} style={{ height }}>
      {order.map((i) => (
        <motion.span
          key={i}
          className={cn('h-full origin-left', colors[i])}
          style={{ width: `${Math.max(parts[i], 1)}%` }}
          initial={{ transform: 'scaleX(0)' }}
          animate={{ transform: 'scaleX(1)' }}
          transition={{ duration: 0.5, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
        />
      ))}
    </div>
  )
}

/** Circular ring, used for the recheck timer and loading states. */
export function Ring({
  progress,
  size = 200,
  stroke = 12,
  track = 'var(--tint)',
  color = 'var(--brand)',
  children,
  spin,
}: {
  progress: number
  size?: number
  stroke?: number
  track?: string
  color?: string
  children?: React.ReactNode
  spin?: boolean
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={cn('-rotate-90', spin && 'status-spin')}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

/* Ready-made traces for the story */
export const TRACES = {
  today: trace([[0, 128], [0.12, 142], [0.2, 118], [0.33, 122], [0.42, 168], [0.47, 186], [0.52, 152], [0.6, 128], [0.75, 118], [0.86, 116], [0.92, 132], [0.96, 120], [1, 112]], 96, 11, 5),
  warming: trace([[0, 130], [0.3, 124], [0.5, 140], [0.7, 118], [0.86, 112], [1, 108]], 96, 5, 4),
  lowMorning: trace([[0, 118], [0.3, 104], [0.6, 92], [0.8, 78], [0.92, 70], [1, 64]], 48, 3, 2),
  overnight: trace([[0, 156], [0.18, 172], [0.35, 150], [0.55, 118], [0.7, 92], [0.82, 66], [0.9, 54], [1, 49]], 72, 9, 3),
  event: trace([[0, 142], [0.3, 118], [0.55, 84], [0.66, 58], [0.72, 48], [0.78, 47], [0.85, 56], [0.92, 70], [1, 82]], 64, 4, 2),
  consoleDenise: trace([[0, 132], [0.15, 118], [0.3, 124], [0.38, 168], [0.45, 152], [0.6, 176], [0.66, 190], [0.72, 162], [0.82, 108], [0.9, 72], [0.95, 58], [1, 49]], 120, 21, 4),
}
