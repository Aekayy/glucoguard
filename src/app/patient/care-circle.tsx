import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
 * Illustration · care circle  (Welcome · O2)
 *
 * Gate: first-run screen, seen once → the delight tier is allowed.
 * Purpose: explanation — "the people you chose are always around you."
 *
 * Motion, all CSS (runs off the main thread while onboarding loads):
 *  · the circle of people revolves on the dashed orbit, 48 s per turn,
 *    linear (constant motion); each person counter-rotates so names
 *    stay upright
 *  · the orbit's dashes drift, so the ring reads as "alive"
 *  · "You" beats lub-dub every 1.4 s (~43 bpm at rest, deliberately calm),
 *    with a faint ripple; each person glows faintly as the ripple reaches
 *    them — the heartbeat is what the circle is listening for
 *  · entrance: people fade in one by one (spring, 80 ms stagger)
 * Reduced motion: no orbit or ripple; the heartbeat becomes a soft
 * opacity pulse.
 * ───────────────────────────────────────────────────────── */

const W = 353
const H = 250
const CX = W / 2
const CY = 118
const ORBIT = 96
const INNER = 70

type Person = { initials: string; label: string; angle: number; tone: 'sage' | 'neutral'; reach: number }

const PEOPLE: Person[] = [
  { initials: 'MO', label: 'Maria', angle: -146, tone: 'sage', reach: 0.18 },
  { initials: 'NR', label: 'Care team', angle: -26, tone: 'neutral', reach: 0.24 },
  { initials: '911', label: '911', angle: 46, tone: 'neutral', reach: 0.3 },
]

export function CareCircleIllustration({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div
      role="img"
      aria-label="You at the centre, with Maria, your care team and 911 around you"
      className={cn('relative overflow-hidden rounded-lg bg-tint', className)}
      style={{ width: W, height: H }}
    >
      {/* rings */}
      <svg width={W} height={H} className="absolute inset-0" aria-hidden>
        <circle cx={CX} cy={CY} r={INNER} fill="none" stroke="var(--brand)" strokeWidth="1.5" />
        <circle
          className="orbit-dash"
          cx={CX}
          cy={CY}
          r={ORBIT}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>

      {/* heartbeat ripple behind "You" */}
      <span
        aria-hidden
        className="beat-ripple absolute rounded-full border-[1.5px] border-brand"
        style={{ width: 64, height: 64, left: CX - 32, top: CY - 32 }}
      />
      <span
        aria-hidden
        className="beat-ripple absolute rounded-full bg-brand/10"
        style={{ width: 64, height: 64, left: CX - 32, top: CY - 32, animationDelay: '0.18s' }}
      />

      {/* You */}
      <div
        className="heartbeat absolute flex items-center justify-center rounded-full bg-brand type-subhead-em text-on-brand"
        style={{ width: 64, height: 64, left: CX - 32, top: CY - 32 }}
      >
        You
      </div>

      {/* the circle of people, revolving */}
      <div className="orbit-spin absolute inset-0" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        {PEOPLE.map((p, i) => (
          <div
            key={p.initials}
            className="absolute"
            style={{
              left: CX,
              top: CY,
              transform: `rotate(${p.angle}deg) translate(${ORBIT}px) rotate(${-p.angle}deg)`,
            }}
          >
            <div className="orbit-counter" style={{ transformOrigin: '0 0' }}>
              <motion.div
                className="flex flex-col items-center gap-0.5"
                style={{ transform: 'translate(-50%, -20px)' }}
                initial={reduce ? false : { opacity: 0, transform: 'translate(-50%, -20px) scale(0.9)' }}
                animate={{ opacity: 1, transform: 'translate(-50%, -20px) scale(1)' }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2, delay: 0.15 + i * 0.08 }}
              >
                <span
                  className={cn(
                    'beat-reach flex size-10 items-center justify-center rounded-full type-subhead-em text-ink',
                    p.tone === 'sage' ? 'bg-sage' : 'bg-sunken',
                  )}
                  style={{ animationDelay: `${p.reach}s` }}
                >
                  {p.initials}
                </span>
                <span className="type-caption2 whitespace-nowrap text-ink-2">{p.label}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
