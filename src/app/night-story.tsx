import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { HeldMark, Icon, type IconName } from '@/components/icons'
import { Chip } from '@/components/hearth/ios'
import type { GlucoseState } from '@/components/icons'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
 * The story in one night — an animated storyboard.
 *
 * Gate: seen once per visit on a marketing/landing page → the
 * "explanation" tier, where longer, narrative motion is allowed.
 * Purpose: explanation. One event travels across six people; each
 * beat lights who's involved, draws the signal between them and
 * shows the real UI moment from the product.
 *
 * Ingredients
 *  · beat timer: CSS animation on the progress bar (5.5 s linear),
 *    paused with animation-play-state on hover/focus or ⏸, so the
 *    timer never drifts from what the viewer sees
 *  · links: SVG pathLength draw, 600 ms ease-out, then a dot travels
 *    the path (SMIL animateMotion, 1.4 s linear loop)
 *  · actors: spring (0.45 s, bounce 0.2) between lit and dimmed
 *  · sky: two background layers cross-fade (700 ms); night beats put
 *    the stage in the Dark token mode, exactly like the app's night mode
 *  · reduced motion: no autoplay, no travelling dots, cross-fades only
 * ───────────────────────────────────────────────────────── */

type ActorId = 'denise' | 'maria' | 'priya' | 'chen' | 'harbor' | 'medicare'
type Sky = 'night' | 'morning' | 'day'
type Snip = 'notify' | 'critical' | 'sms' | 'queue' | 'hold' | 'resolved' | 'criteria' | 'shipped' | 'claims'

const ACTORS: Record<ActorId, { x: number; y: number; initials: string; name: string; role: string; icon: IconName; tone: 'brand' | 'sage' | 'neutral' }> = {
  maria: { x: 110, y: 118, initials: 'MO', name: 'Maria', role: 'daughter · no app', icon: 'msg', tone: 'sage' },
  denise: { x: 110, y: 262, initials: 'DO', name: 'Denise', role: 'patient · 67', icon: 'sensor', tone: 'brand' },
  priya: { x: 360, y: 118, initials: 'PS', name: 'Priya, RN', role: 'night coordinator', icon: 'laptop', tone: 'neutral' },
  chen: { x: 360, y: 262, initials: 'WC', name: 'Dr. Chen', role: 'physician', icon: 'pen', tone: 'neutral' },
  harbor: { x: 610, y: 118, initials: 'HH', name: 'Harbor', role: 'DME supplier', icon: 'truck', tone: 'neutral' },
  medicare: { x: 610, y: 262, initials: 'MC', name: 'Medicare', role: 'payer', icon: 'shield', tone: 'neutral' },
}

type Beat = {
  time: string
  meridiem?: string
  sky: Sky
  who: string
  title: string
  body: string
  active: ActorId[]
  alarm?: ActorId
  links: [ActorId, ActorId][]
  glucose: { value: string; state: GlucoseState }
  snip: Snip
}

const BEATS: Beat[] = [
  {
    time: '3:03', meridiem: 'AM', sky: 'night', who: 'Patient app',
    title: 'A low starts while she sleeps',
    body: 'Denise’s CGM reads 58 and falling. GlucoGuard alerts her phone first, with what to do in the notification itself.',
    active: ['denise'], links: [], glucose: { value: '58 ↘', state: 'low' }, snip: 'notify',
  },
  {
    time: '3:13', meridiem: 'AM', sky: 'night', who: 'Patient app',
    title: 'No reply. The alarm gets louder',
    body: 'Ten minutes, no response, now 49. A Critical Alert sounds through silent mode and says who will be called next, and when.',
    active: ['denise'], alarm: 'denise', links: [], glucose: { value: '49 ↓↓', state: 'veryLow' }, snip: 'critical',
  },
  {
    time: '3:18', meridiem: 'AM', sky: 'night', who: 'Caregiver',
    title: 'Maria is called and texted',
    body: 'Her daughter gets a call and a plain SMS with reply codes. She doesn’t need the app to help.',
    active: ['denise', 'maria'], alarm: 'denise', links: [['denise', 'maria']], glucose: { value: '49 ↓↓', state: 'veryLow' }, snip: 'sms',
  },
  {
    time: '3:18', meridiem: 'AM', sky: 'night', who: 'Care Console',
    title: 'Priya sees why it fired',
    body: 'The night coordinator’s queue puts Denise on top with the reason: under 54 for 15 minutes, falling fast. She takes over, which pauses 911.',
    active: ['denise', 'maria', 'priya'], alarm: 'denise', links: [['denise', 'priya']], glucose: { value: '49 ↓↓', state: 'veryLow' }, snip: 'queue',
  },
  {
    time: '3:19', meridiem: 'AM', sky: 'night', who: 'Everyone at once',
    title: 'Maria replies 1. Denise holds to confirm',
    body: 'Maria is on her way, so 911 stays paused. Denise holds the button for 2 seconds: a tap can’t cancel a rescue.',
    active: ['denise', 'maria', 'priya'], links: [['maria', 'priya'], ['denise', 'priya']], glucose: { value: '52 ↗', state: 'veryLow' }, snip: 'hold',
  },
  {
    time: '3:34', meridiem: 'AM', sky: 'night', who: 'Care Console',
    title: 'Resolved, and the record writes itself',
    body: 'Priya picks what happened and adds a note. It lands in the audit log, Denise’s chart, and a follow-up for Dr. Chen.',
    active: ['denise', 'priya', 'chen'], links: [['priya', 'chen']], glucose: { value: '76 ↗', state: 'inRange' }, snip: 'resolved',
  },
  {
    time: '10:12', meridiem: 'AM', sky: 'morning', who: 'Care Console',
    title: 'Dr. Chen reorders sensors',
    body: 'Denise’s sensors run out in 6 days. Medicare’s criteria are checked live while he orders, so it won’t be denied weeks later.',
    active: ['chen', 'medicare'], links: [['chen', 'medicare']], glucose: { value: '112 →', state: 'inRange' }, snip: 'criteria',
  },
  {
    time: '10:16', meridiem: 'AM', sky: 'morning', who: 'Supplier',
    title: 'One packet to the supplier. No fax',
    body: 'Order, prescription, visit note and coverage proof go to Harbor Home Medical together. Denise sees the shipment in her app.',
    active: ['chen', 'harbor', 'denise'], links: [['chen', 'harbor'], ['harbor', 'denise']], glucose: { value: '112 →', state: 'inRange' }, snip: 'shipped',
  },
  {
    time: 'Sep 30', sky: 'day', who: 'Payer',
    title: 'The work counts',
    body: 'Data days and Priya’s minutes add up to remote-monitoring claims (99454, 99457), so the night shift that saved Denise is paid for.',
    active: ['priya', 'medicare', 'denise'], links: [['priya', 'medicare']], glucose: { value: '74% TIR', state: 'inRange' }, snip: 'claims',
  },
]

const DURATION = 5.5

function curve(a: ActorId, b: ActorId) {
  const A = ACTORS[a]
  const B = ACTORS[b]
  const mx = (A.x + B.x) / 2
  const my = (A.y + B.y) / 2
  const dx = B.x - A.x
  const dy = B.y - A.y
  const len = Math.hypot(dx, dy) || 1
  const bend = Math.abs(dx) < 10 ? 62 : Math.min(46, len * 0.22)
  const cx = mx - (dy / len) * bend
  const cy = my + (dx / len) * bend
  return `M${A.x} ${A.y} Q${cx} ${cy} ${B.x} ${B.y}`
}

/* ── Stage ─────────────────────────────────────────────────── */
function Stage({ beat, reduce }: { beat: Beat; reduce: boolean }) {
  const night = beat.sky === 'night'
  const alarm = beat.alarm
  return (
    <div className={cn('relative aspect-[720/400] w-full overflow-hidden rounded-lg', night && 'dark')}>
      {/* sky layers cross-fade */}
      <div className="absolute inset-0 bg-[linear-gradient(170deg,#140e17_0%,#24162b_55%,#3a2240_100%)]" />
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(170deg,#fbefe6_0%,#f6e6ea_60%,#f3eeea_100%)]"
        initial={false}
        animate={{ opacity: beat.sky === 'morning' ? 1 : 0 }}
        transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
      />
      <motion.div
        className="absolute inset-0 bg-canvas"
        initial={false}
        animate={{ opacity: beat.sky === 'day' ? 1 : 0 }}
        transition={{ duration: 0.7, ease: [0.77, 0, 0.175, 1] }}
      />
      {/* stars + moon at night, sun by morning */}
      <motion.div className="pointer-events-none absolute inset-0" initial={false} animate={{ opacity: night ? 1 : 0 }} transition={{ duration: 0.7 }}>
        {[[8, 9], [22, 5], [47, 7], [63, 4], [79, 10], [91, 6], [34, 3], [70, 13]].map(([x, y], i) => (
          <span
            key={i}
            className="story-twinkle absolute size-[3px] rounded-full bg-white/70"
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </motion.div>

      <svg viewBox="0 0 720 400" className="absolute inset-0 h-full w-full" aria-hidden>
        {/* places */}
        {(
          [
            [22, 'Home', 'Chicago · Grand Ave'],
            [272, 'JHF care team', 'Jewish Healthcare Foundation'],
            [522, 'Supplier & payer', 'outside the clinic'],
          ] as const
        ).map(([x, label, sub]) => (
          <g key={label}>
            <rect x={x} y={44} width={176} height={334} rx={22} fill="var(--surface)" fillOpacity={night ? 0.06 : 0.55} stroke="var(--line)" strokeOpacity={night ? 0.5 : 1} />
            <text x={x + 16} y={68} fontSize="11" fontWeight="600" letterSpacing="0.66" fill="var(--ink-2)" style={{ fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>
              {label.toUpperCase()}
            </text>
            <text x={x + 16} y={84} fontSize="10" fill="var(--ink-3)" style={{ fontFamily: 'var(--font-sans)' }}>
              {sub}
            </text>
          </g>
        ))}

        {/* signals travelling between people */}
        <AnimatePresence>
          {beat.links.map(([a, b], i) => {
            const d = curve(a, b)
            const color = alarm ? 'var(--low)' : 'var(--brand)'
            return (
              <motion.g key={`${a}-${b}`} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4 5"
                  strokeLinecap="round"
                  initial={reduce ? { opacity: 0 } : { pathLength: 0, opacity: 0.9 }}
                  animate={reduce ? { opacity: 0.9 } : { pathLength: 1, opacity: 0.9 }}
                  transition={{ duration: reduce ? 0.2 : 0.6, delay: i * 0.25, ease: [0.23, 1, 0.32, 1] }}
                />
                {!reduce ? (
                  <circle r="5" fill={color}>
                    <animateMotion dur="1.4s" begin={`${0.6 + i * 0.25}s`} repeatCount="indefinite" path={d} />
                  </circle>
                ) : null}
              </motion.g>
            )
          })}
        </AnimatePresence>
      </svg>

      {/* the six people */}
      {(Object.keys(ACTORS) as ActorId[]).map((id) => {
        const a = ACTORS[id]
        const on = beat.active.includes(id)
        const ringing = alarm === id
        return (
          <motion.div
            key={id}
            className="absolute flex flex-col items-center"
            style={{ left: `${(a.x / 720) * 100}%`, top: `${(a.y / 400) * 100}%`, translate: '-50% -28px' }}
            initial={false}
            animate={{ opacity: on ? 1 : 0.32, scale: on ? 1 : 0.92, filter: on ? 'grayscale(0)' : 'grayscale(1)' }}
            transition={reduce ? { duration: 0.2 } : { type: 'spring', duration: 0.45, bounce: 0.2 }}
          >
            <span className="relative">
              {ringing && !reduce ? (
                <>
                  <span className="story-ring absolute inset-0 rounded-full border-2 border-low" />
                  <span className="story-ring absolute inset-0 rounded-full border-2 border-low" style={{ animationDelay: '0.5s' }} />
                </>
              ) : null}
              <span
                className={cn(
                  'relative flex size-14 items-center justify-center rounded-full type-headline shadow-[0_6px_18px_rgb(0_0_0/0.18)]',
                  a.tone === 'brand' && 'bg-brand text-on-brand',
                  a.tone === 'sage' && 'bg-sage text-ink',
                  a.tone === 'neutral' && 'bg-surface text-ink',
                  ringing && 'ring-2 ring-low',
                )}
              >
                {a.initials}
                <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-surface bg-surface text-brand">
                  <Icon name={a.icon} size={13} />
                </span>
              </span>
            </span>
            <span className="mt-2 whitespace-nowrap type-footnote-em text-ink">{a.name}</span>
            <span className="whitespace-nowrap type-caption1 text-ink-2">{a.role}</span>
            {id === 'denise' ? (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={beat.glucose.value}
                  initial={{ opacity: 0, transform: 'translateY(4px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0)' }}
                  exit={{ opacity: 0, transform: 'translateY(-4px)' }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  className="mt-1.5"
                >
                  <Chip state={beat.glucose.state} size="web">
                    {beat.glucose.value}
                  </Chip>
                </motion.span>
              </AnimatePresence>
            ) : null}
          </motion.div>
        )
      })}

      {/* clock */}
      <div className="absolute top-3 right-4 flex items-center gap-1.5 rounded-full bg-surface/80 px-2.5 py-1 type-small-em text-ink backdrop-blur-md">
        <Icon name={night ? 'moon' : 'sun'} size={14} className={night ? 'text-brand' : 'text-high'} />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={beat.time} initial={{ opacity: 0, transform: 'translateY(6px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} exit={{ opacity: 0, transform: 'translateY(-6px)' }} transition={{ duration: 0.25 }} className="tabular-nums">
            {beat.time} {beat.meridiem}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="absolute top-3 left-4 rounded-full bg-surface/80 px-2.5 py-1 type-small-em text-ink-2 backdrop-blur-md">Night of Sep 29 → 30</div>
    </div>
  )
}

/* ── The UI moment for each beat ───────────────────────────── */
function Phone({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={cn('rounded-[22px] border border-line bg-canvas p-3 shadow-card', dark && 'dark')}>
      <div className="mb-2 flex items-center justify-between px-1 type-caption2 text-ink-2">
        <span>{dark ? 'Denise’s iPhone' : 'iPhone'}</span>
        <span className="h-1.5 w-10 rounded-full bg-ink/80" />
      </div>
      {children}
    </div>
  )
}

function Notification({ critical, title, body }: { critical?: boolean; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, transform: 'translateY(-14px) scale(0.98)' }}
      animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
      transition={{ type: 'spring', duration: 0.55, bounce: 0.2, delay: 0.15 }}
      className="flex flex-col gap-1 rounded-[16px] bg-surface p-3 shadow-[0_8px_24px_rgb(0_0_0/0.18)]"
    >
      <span className="flex items-center gap-1.5">
        <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-brand text-on-brand">
          <HeldMark size={12} />
        </span>
        <span className="type-caption2 text-ink-2">GLUCOGUARD</span>
        {critical ? <span className="rounded-[4px] bg-vlow px-1.5 py-px type-caption2 text-white">CRITICAL</span> : null}
        <span className="ml-auto type-caption2 text-ink-3">now</span>
      </span>
      <span className="type-subhead-em text-ink">{title}</span>
      <span className="type-footnote text-ink-2">{body}</span>
    </motion.div>
  )
}

function Snippet({ snip }: { snip: Snip }) {
  switch (snip) {
    case 'notify':
      return (
        <Phone dark>
          <Notification title="Low · 58 mg/dL ↘" body="Have 15 g of fast sugar, like ½ cup of juice. Tap to open." />
        </Phone>
      )
    case 'critical':
      return (
        <Phone dark>
          <Notification critical title="Urgent low · 49 mg/dL ↓↓" body="Falling fast. Open now, or we’ll call Maria at 3:18." />
          <div className="mt-2 flex items-center justify-center gap-1.5 type-caption1 text-ink-2">
            <Icon name="belloff" size={14} /> Phone on silent · sound plays anyway
          </div>
        </Phone>
      )
    case 'sms':
      return (
        <div className="rounded-[22px] border border-line bg-white p-3 text-black shadow-card">
          <div className="mb-2 text-center text-[11px] text-[#8e8e93]">Maria’s iPhone · Messages</div>
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(8px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            transition={{ type: 'spring', duration: 0.45, bounce: 0.2, delay: 0.2 }}
            className="max-w-[92%] rounded-[16px] bg-[#e9e9eb] px-3 py-2 text-[13px] leading-[18px]"
          >
            URGENT: Denise’s glucose is 49 and falling. Reply <b>1</b> if you’re going to her. Reply <b>2</b> to call 911.
          </motion.div>
          <motion.div
            initial={{ opacity: 0, transform: 'scale(0.9)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.3, delay: 1.6 }}
            className="mt-2 ml-auto w-fit rounded-[16px] bg-[#34c759] px-3 py-1.5 text-[13px] font-semibold text-white"
          >
            typing…
          </motion.div>
        </div>
      )
    case 'queue':
      return (
        <div className="overflow-hidden rounded-md border border-line bg-surface shadow-card">
          <div className="border-b border-line bg-canvas px-3 py-2 type-eyebrow text-ink-2">Alert queue · Care Console</div>
          {[
            ['Denise Okafor', '49 ↓↓', 'veryLow', true],
            ['Aisha Johnson', '62 ↘', 'low', false],
            ['Marcus Bell', '66 ↗', 'low', false],
          ].map(([n, v, s, top], i) => (
            <motion.div
              key={n as string}
              initial={{ opacity: 0, transform: 'translateX(-8px)' }}
              animate={{ opacity: 1, transform: 'translateX(0)' }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={cn('relative flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0', top && 'bg-tint')}
            >
              {top ? <span className="absolute inset-y-0 left-0 w-[3px] bg-vlow" /> : null}
              <span className="flex-1 type-wbody-em text-ink">{n}</span>
              <span className={cn('type-wnum', top ? 'text-vlow' : 'text-ink')}>{v}</span>
              <Chip state={s as GlucoseState} size="web" />
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-2 px-3 py-2.5">
            <span className="flex-1 type-small text-ink">
              <b>Why this fired:</b> under 54 for 15 min, falling 3 mg/dL/min
            </span>
            <span className="rounded-sm bg-brand px-2.5 py-1 type-small-em text-on-brand">Take over</span>
          </motion.div>
        </div>
      )
    case 'hold':
      return (
        <Phone dark>
          <div className="flex flex-col gap-2 rounded-[16px] bg-surface p-3">
            <span className="flex items-center gap-2 type-footnote text-ink">
              <span className="size-2 rounded-full bg-inr" /> Maria · on her way · ETA 3:31
            </span>
            <span className="flex items-center gap-2 type-footnote text-ink-2">
              <span className="size-2 rounded-full bg-ink-3" /> 911 · paused, a person responded
            </span>
          </div>
          <div className="relative mt-2 flex h-11 items-center justify-center overflow-hidden rounded-md bg-brand type-subhead-em text-on-brand">
            <span className="story-hold absolute inset-0 origin-left bg-on-brand/25" />
            <span className="relative">Hold: I’m OK now</span>
          </div>
          <div className="mt-1.5 text-center type-caption1 text-ink-2">2-second hold · a tap can’t cancel a rescue</div>
        </Phone>
      )
    case 'resolved':
      return (
        <div className="flex flex-col gap-2">
          <div className="rounded-md border border-line bg-surface p-3 shadow-card">
            <div className="type-eyebrow text-ink-2">Resolve alert · what happened?</div>
            <div className="mt-2 flex items-center gap-2 rounded-sm border border-brand bg-tint px-2.5 py-2 type-wbody-em text-ink">
              <span className="flex size-4 items-center justify-center rounded-full border border-brand">
                <span className="size-2 rounded-full bg-brand" />
              </span>
              Caregiver on site
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(8px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15, delay: 0.7 }}
            className="mx-auto flex w-fit items-center gap-2 rounded-full bg-ink px-3.5 py-2 type-footnote-em text-surface shadow-toast"
          >
            <Icon name="checkc" size={16} /> Alert resolved · follow-up for Dr. Chen
          </motion.div>
          <div className="flex justify-center gap-1.5">
            {['Audit log', 'Denise’s chart', 'RPM minutes'].map((t, i) => (
              <motion.span key={t} initial={{ opacity: 0, transform: 'scale(0.9)' }} animate={{ opacity: 1, transform: 'scale(1)' }} transition={{ delay: 1.1 + i * 0.12 }} className="rounded-full bg-inr-tint px-2 py-0.5 type-small-em text-ink">
                ✓ {t}
              </motion.span>
            ))}
          </div>
        </div>
      )
    case 'criteria':
      return (
        <div className="rounded-md border border-line bg-surface p-3 shadow-card">
          <div className="flex items-center justify-between">
            <span className="type-wbody-em text-ink">Coverage · Medicare Part B</span>
            <span className="type-small-em text-brand">checking live</span>
          </div>
          {['Diabetes diagnosis · E11.649', 'Insulin-treated · 3 lows under 54', 'Visit in last 6 months · Aug 14', 'Patient cost · about $38/mo'].map((t, i) => (
            <div key={t} className="flex items-center gap-2 border-t border-line py-1.5 first-of-type:mt-1.5">
              <motion.span
                initial={{ opacity: 0, transform: 'scale(0.6)' }}
                animate={{ opacity: 1, transform: 'scale(1)' }}
                transition={{ type: 'spring', duration: 0.35, bounce: 0.35, delay: 0.3 + i * 0.45 }}
                className="flex size-[18px] items-center justify-center rounded-full bg-inr text-white"
              >
                <Icon name="check" size={11} weight={1.6} />
              </motion.span>
              <span className="type-small text-ink">{t}</span>
            </div>
          ))}
        </div>
      )
    case 'shipped':
      return (
        <div className="flex flex-col gap-2">
          <div className="rounded-md border border-line bg-surface p-3 shadow-card">
            <div className="type-wbody-em text-ink">ORD-2291 · Dexcom G7 × 3</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {['Order', 'Prescription', 'Visit note', 'Coverage proof'].map((t, i) => (
                <motion.span key={t} initial={{ opacity: 0, transform: 'translateY(6px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center gap-1 rounded-full bg-tint px-2 py-0.5 type-small-em text-ink">
                  <Icon name="file" size={12} className="text-brand" /> {t}
                </motion.span>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5 type-small text-ink-2">
              <Icon name="x" size={12} className="text-vlow" /> No fax · sent as one packet
            </div>
          </div>
          <Phone>
            <div className="flex items-center gap-2 rounded-[14px] bg-surface p-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-tint text-brand">
                <Icon name="box" size={16} />
              </span>
              <span className="flex flex-col">
                <span className="type-footnote-em text-ink">Sensors ship tomorrow</span>
                <span className="type-caption1 text-ink-2">Arrives Oct 3 · 3 days to spare</span>
              </span>
            </div>
          </Phone>
        </div>
      )
    case 'claims':
      return (
        <div className="rounded-md border border-line bg-surface p-3 shadow-card">
          <div className="type-eyebrow text-ink-2">RPM billing · September</div>
          {[
            ['99454', '16+ days of readings', '24 / 30 days'],
            ['99457', 'First 20 min with the care team', '48 min'],
            ['99458', 'Each extra 20 min', '+1'],
          ].map(([code, what, val], i) => (
            <motion.div key={code} initial={{ opacity: 0, transform: 'translateX(-6px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} transition={{ delay: 0.2 + i * 0.15 }} className="flex items-center gap-2 border-t border-line py-1.5 first-of-type:mt-1.5">
              <span className="rounded-[6px] bg-tint px-1.5 py-0.5 type-small-em text-brand">{code}</span>
              <span className="flex-1 type-small text-ink">{what}</span>
              <span className="type-small-em text-inr">{val} ✓</span>
            </motion.div>
          ))}
        </div>
      )
  }
}

/* ── Player ────────────────────────────────────────────────── */
function Player() {
  const reduce = useReducedMotion() ?? false
  const root = useRef<HTMLElement>(null)
  const inView = useInView(root, { amount: 0.35 })
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(!reduce)
  const [hovered, setHovered] = useState(false)
  const beat = BEATS[i]
  const running = playing && inView && !hovered

  const go = useCallback((n: number) => setI((n + BEATS.length) % BEATS.length), [])

  useEffect(() => {
    if (reduce) setPlaying(false)
  }, [reduce])

  return (
    <section
      ref={root}
      aria-roledescription="carousel"
      aria-label="The story in one night"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1)
        if (e.key === 'ArrowLeft') go(i - 1)
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-end justify-between gap-4">
        <StepHeading n={2} eyebrow="What happens" title="The night, moment by moment" />
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Previous moment" onClick={() => go(i - 1)} className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink hover:bg-canvas">
            <Icon name="chevL" size={18} />
          </button>
          <button
            type="button"
            aria-label={playing ? 'Pause story' : 'Play story'}
            aria-pressed={playing}
            onClick={() => setPlaying((p) => !p)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 type-small-em text-surface"
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
                <rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
              </svg>
            ) : (
              <Icon name="play" size={12} />
            )}
            {playing ? (hovered ? 'Paused while you read' : 'Pause') : 'Play'}
          </button>
          <button type="button" aria-label="Next moment" onClick={() => go(i + 1)} className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink hover:bg-canvas">
            <Icon name="chevR" size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1.55fr_1fr] gap-5 rounded-lg border border-line bg-surface p-4 max-lg:grid-cols-1">
        <Stage beat={beat} reduce={reduce} />
        <div className="flex min-h-[380px] flex-col gap-4 py-1" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={i}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(10px)' }}
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-6px)' }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-1 flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="type-display text-ink tabular-nums">
                  {beat.time}
                  {beat.meridiem ? <span className="ml-1 type-h2 text-ink-2">{beat.meridiem}</span> : null}
                </span>
                <span className="rounded-full bg-tint px-2.5 py-1 type-small-em text-brand">{beat.who}</span>
                <span className="ml-auto type-small text-ink-3 tabular-nums">
                  {i + 1} / {BEATS.length}
                </span>
              </div>
              <h3 className="type-h1 text-ink">{beat.title}</h3>
              <p className="type-wbody text-ink-2">{beat.body}</p>
              <div className="mt-auto">
                <Snippet snip={beat.snip} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* timeline: one segment per beat, the current one fills */}
      <div className="flex gap-1.5" role="tablist" aria-label="Moments">
        {BEATS.map((b, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={`${b.time} ${b.meridiem ?? ''} — ${b.title}`}
            onClick={() => go(n)}
            className="group flex flex-1 flex-col gap-1.5 text-left"
          >
            <span className="relative h-1 overflow-hidden rounded-full bg-line">
              {n < i ? <span className="absolute inset-0 bg-brand" /> : null}
              {n === i ? (
                <span
                  key={i}
                  className="story-progress absolute inset-0 origin-left bg-brand"
                  style={{
                    animationDuration: `${DURATION}s`,
                    animationPlayState: running ? 'running' : 'paused',
                    ...(reduce ? { animationName: 'none', transform: 'scaleX(1)' } : {}),
                  }}
                  onAnimationEnd={() => go(i + 1)}
                />
              ) : null}
            </span>
            <span className={cn('type-small-em tabular-nums transition-colors', n === i ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2')}>{b.time}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

/* ── Cast, problem, solution ──────────────────────────────── */
const CAST: { id: ActorId; full: string; role: string; part: string }[] = [
  { id: 'denise', full: 'Denise Okafor, 67', role: 'Patient', part: 'Has type 2 diabetes, uses insulin and lives alone. Her blood sugar drops dangerously low while she sleeps.' },
  { id: 'maria', full: 'Maria Okafor', role: 'Daughter · caregiver', part: 'Lives 12 minutes away and doesn’t have the app. She gets a text and goes to help.' },
  { id: 'priya', full: 'Priya Shah, RN', role: 'Night care coordinator', part: 'A nurse at Jewish Healthcare Foundation watching alerts for 214 patients. She sees the low and takes charge.' },
  { id: 'chen', full: 'Dr. Wen Chen', role: 'Physician', part: 'Denise’s doctor. The next morning he adjusts her dose and reorders her glucose sensors.' },
  { id: 'harbor', full: 'Harbor Home Medical', role: 'Medical supply company', part: 'Ships Denise’s sensors once the order is signed. No fax, no phone calls.' },
  { id: 'medicare', full: 'Medicare', role: 'Insurer (payer)', part: 'Confirms the sensors are covered and pays for the remote monitoring that kept Denise safe.' },
]

function StepHeading({ n, eyebrow, title }: { n: number; eyebrow: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink type-wbody-em text-surface">{n}</span>
      <div className="flex flex-col">
        <span className="type-eyebrow text-ink-2">{eyebrow}</span>
        <span className="type-h1 text-ink">{title}</span>
      </div>
    </div>
  )
}

const reveal = {
  initial: { opacity: 0, transform: 'translateY(10px)' },
  whileInView: { opacity: 1, transform: 'translateY(0)' },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
}

function Cast() {
  return (
    <div className="flex flex-col gap-3">
      <span className="type-eyebrow text-ink-2">Meet the people</span>
      <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {CAST.map((c, i) => {
          const a = ACTORS[c.id]
          return (
            <motion.div
              key={c.id}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.05 }}
              className="flex gap-3 rounded-md border border-line bg-surface p-4"
            >
              <span
                className={cn(
                  'relative flex size-11 shrink-0 items-center justify-center rounded-full type-subhead-em',
                  a.tone === 'brand' && 'bg-brand text-on-brand',
                  a.tone === 'sage' && 'bg-sage text-ink',
                  a.tone === 'neutral' && 'bg-sunken text-ink',
                )}
              >
                {a.initials}
                <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-surface bg-surface text-brand">
                  <Icon name={a.icon} size={11} />
                </span>
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="type-wbody-em text-ink">{c.full}</span>
                <span className="w-fit rounded-full bg-tint px-2 py-px type-small-em text-brand">{c.role}</span>
                <span className="mt-1 type-small text-ink-2">{c.part}</span>
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function PointCards({ points, tone }: { points: [IconName, string, string][]; tone: 'problem' | 'solution' }) {
  return (
    <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
      {points.map(([icon, t, d]) => (
        <div key={t} className={cn('flex gap-3 rounded-md p-3.5', tone === 'problem' ? 'bg-vlow-tint/60' : 'bg-inr-tint/70')}>
          <Icon name={icon} size={20} className={cn('mt-0.5 shrink-0', tone === 'problem' ? 'text-vlow' : 'text-inr')} />
          <span className="flex flex-col gap-0.5">
            <span className="type-wbody-em text-ink">{t}</span>
            <span className="type-small text-ink-2">{d}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function Problem() {
  return (
    <motion.div {...reveal} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      <StepHeading n={1} eyebrow="The problem" title="An alarm that only one sleeping person can hear" />
      <PointCards
        tone="problem"
        points={[
          ['belloff', 'One phone, often on silent', 'A low at 3 a.m. can turn dangerous in minutes, and the alert only reaches Denise.'],
          ['people', 'Nobody else knows', 'Maria finds out in the morning. The clinic sees it days later.'],
          ['file', 'Follow-up gets stuck', 'Her sensor reorder bounces between fax, phone and insurer while supplies run out.'],
        ]}
      />
    </motion.div>
  )
}

function Solution() {
  return (
    <motion.div {...reveal} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      <StepHeading n={3} eyebrow="The solution" title="GlucoGuard turns one alert into a shared plan" />
      <PointCards
        tone="solution"
        points={[
          ['bell', 'Alerts escalate on their own', 'Denise first, then Maria, then the care team, and 911 only if nobody answers.'],
          ['care', 'Everyone sees the same facts', 'Maria’s text, Denise’s phone and Priya’s queue all show one shared record.'],
          ['checkc', 'Follow-up without paperwork', 'Dose change, sensor order and billing flow through the same system. No fax.'],
        ]}
      />
      <div className="flex items-center gap-2.5 rounded-md bg-tint px-4 py-3">
        <Icon name="checkc" size={20} className="shrink-0 text-brand" />
        <span className="type-wbody-em text-ink">
          The result: Denise was confirmed safe 16 minutes after the first alert, and 911 never had to come.
        </span>
      </div>
    </motion.div>
  )
}

export function NightStory() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="type-eyebrow text-ink-2">The story in one night</span>
        <span className="type-display text-ink">One low, six people, one record</span>
      </div>
      <Cast />
      <Problem />
      <Player />
      <Solution />
    </div>
  )
}
