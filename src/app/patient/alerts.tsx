import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { GlucoseChart, Ring, TRACES } from '@/components/charts/charts'
import { HeldMark, Icon, type IconName } from '@/components/icons'
import { Avatar, Banner, Chip, Eyebrow, FoodChips, StatusCircle, TimelineRow } from '@/components/hearth/ios'
import ApprovalCard from '@/components/primitives/approval-card'
import { Button } from '@/components/ui/button'
import { playSound } from '@/components/ui/sound'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

import { Bottom, Screen } from './chrome'
import { usePatient } from './state'

/* ── Lock screen (A1 low, A6 critical) ───────────────────── */
function LockScreen({
  date,
  time,
  critical,
  title,
  body,
  onOpen,
}: {
  date: string
  time: string
  critical?: boolean
  title: string
  body: string
  onOpen: () => void
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center bg-[linear-gradient(165deg,#2a1830_0%,#5a2b5e_48%,#a35f7c_100%)] px-4 pt-[70px] text-white">
      <span className="type-headline opacity-90">{date}</span>
      <span className="font-[var(--font-rounded)] text-[86px] leading-[96px] font-semibold tracking-[-1px]">{time}</span>
      <motion.button
        type="button"
        onClick={onOpen}
        initial={{ opacity: 0, transform: 'translateY(-14px) scale(0.98)' }}
        animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
        transition={{ type: 'spring', duration: 0.55, bounce: 0.2, delay: 0.35 }}
        className="press mt-6 flex w-full flex-col gap-1 rounded-[24px] bg-white/85 px-4 py-3.5 text-left text-[#241b25] shadow-[0_10px_30px_rgb(0_0_0/0.25)] backdrop-blur-xl"
      >
        <span className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-[5px] bg-[#5a2b5e] text-white">
            <HeldMark size={13} />
          </span>
          <span className="type-caption2 text-[#6e6270]">GLUCOGUARD</span>
          {critical ? <span className="rounded-[6px] bg-[#9b1c31] px-1.5 py-0.5 type-caption2 text-white">CRITICAL</span> : null}
          <span className="ml-auto type-caption2 text-[#6e6270]">now</span>
        </span>
        <span className="type-headline">{title}</span>
        <span className="type-subhead">{body}</span>
      </motion.button>
      <span className="mt-3 type-footnote opacity-70">Tap the notification to open</span>
      <div className="mt-auto mb-12 flex w-full justify-between px-6">
        {(['torch', 'camera'] as IconName[]).map((i) => (
          <span key={i} className="flex size-[50px] items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <Icon name={i} size={22} />
          </span>
        ))}
      </div>
    </div>
  )
}

export function LockLow() {
  const { nav } = usePatient()
  useEffect(() => playSound('lowAlert'), [])
  return (
    <LockScreen
      date="Tuesday, September 29"
      time="10:42"
      title="Low · 64 mg/dL ↘"
      body="Have 15 g of fast sugar, like ½ cup of juice. Tap to open."
      onOpen={() => nav.replace('treat')}
    />
  )
}

export function LockCritical() {
  const { nav, set } = usePatient()
  useEffect(() => {
    set({ night: true })
    playSound('urgent')
    const repeat = setInterval(() => playSound('urgent'), 5000)
    return () => clearInterval(repeat)
  }, [set])
  return (
    <LockScreen
      date="Wednesday, September 30"
      time="3:08"
      critical
      title="Urgent low · 49 mg/dL ↓↓"
      body="Falling fast. Open now, or we’ll call Maria at 3:18."
      onOpen={() => nav.replace('escalating')}
    />
  )
}

/* ── Low flow ─────────────────────────────────────────────── */
const FOODS = ['½ cup juice', '4 glucose tabs', '1 tbsp honey', '5 hard candies']

export function Treat() {
  const { nav, set } = usePatient()
  return (
    <Screen gap={14}>
      <div className="flex items-center justify-between">
        <span className="type-footnote-em text-ink-2">10:42 AM</span>
        <Chip state="low">Low · 64</Chip>
      </div>
      <h1 className="type-large-title text-ink">Your sugar is low.</h1>
      <p className="type-body text-ink-2">64 mg/dL and falling slowly · Dexcom G7</p>
      <div className="flex flex-col gap-2.5 rounded-lg bg-tint p-4">
        <Eyebrow>Right now</Eyebrow>
        <span className="type-title2 text-ink">Have 15 g of fast sugar</span>
        <FoodChips items={FOODS} />
        <span className="type-footnote text-ink-2">Then rest for 15 minutes. We’ll recheck at 10:57.</span>
      </div>
      <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4">
        <GlucoseChart data={TRACES.lowMorning} nowState="low" height={72} min={40} max={180} />
        <span className="flex justify-between type-caption2 text-ink-3">
          <span>3 h ago</span>
          <span>now</span>
        </span>
      </div>
      <Bottom>
        <Button
          onClick={() => {
            set((s) => ({ logs: [{ time: '10:44', kind: 'sugar', label: 'Fast sugar', value: '15 g' }, ...s.logs] }))
            nav.replace('recheck')
          }}
        >
          I’ve had 15 g
        </Button>
        <Button variant="plain" onClick={() => toast({ message: 'Calling Maria Okafor…', state: 'info' })}>
          Call Maria
        </Button>
      </Bottom>
    </Screen>
  )
}

export function Recheck() {
  const { nav } = usePatient()
  const TOTAL = 15
  const [left, setLeft] = useState(TOTAL)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const mm = Math.floor((left * 51) / 60)
  const ss = String((left * 51) % 60).padStart(2, '0')
  return (
    <Screen>
      <div className="flex justify-center pt-4">
        <Ring progress={1 - left / TOTAL} size={200} stroke={12}>
          <span className="type-num-lg text-ink tabular-nums">{left > 0 ? `${mm}:${ss}` : '0:00'}</span>
          <span className="type-footnote text-ink-2">until recheck</span>
        </Ring>
      </div>
      <h1 className="type-title1 text-ink">Rest for now</h1>
      <p className="type-body text-ink-2">We’ll check your reading at 10:57 and tell you what to do next. Stay where you are if you can.</p>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        <div className="flex justify-between py-3">
          <span className="type-subhead text-ink-2">Logged</span>
          <span className="type-subhead-em text-ink">Fast sugar · 15 g at 10:44</span>
        </div>
        <div className="flex justify-between border-t border-line py-3">
          <span className="type-subhead text-ink-2">Now</span>
          <span className="type-subhead-em text-ink">68 mg/dL ↗ rising slowly</span>
        </div>
      </div>
      <p className="type-footnote text-ink-3">Prototype: the 15-minute wait runs in 15 seconds.</p>
      <Bottom>
        <Button variant="secondary" onClick={() => nav.replace('back-in-range')}>
          {left > 0 ? 'Recheck now' : 'See result'}
        </Button>
        <Button variant="plain" onClick={() => nav.replace('still-low')}>
          I feel worse
        </Button>
      </Bottom>
    </Screen>
  )
}

export function BackInRange() {
  const { nav } = usePatient()
  useEffect(() => playSound('success'), [])
  return (
    <Screen>
      <StatusCircle tone="inr" icon="checkc" />
      <h1 className="type-large-title text-ink">You’re back in range</h1>
      <p className="type-body text-ink-2">84 mg/dL and rising at 10:57. Nicely done.</p>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        <TimelineRow first time="10:42" dot="bg-low">Low alert · 64 mg/dL</TimelineRow>
        <TimelineRow time="10:44" dot="bg-brand">You had 15 g of fast sugar</TimelineRow>
        <TimelineRow time="10:57" dot="bg-inr">Back in range · 84 mg/dL</TimelineRow>
      </div>
      <Banner type="info" title="Shared with your care team">
        Priya Shah, RN will see this low in tomorrow’s review. No action needed.
      </Banner>
      <Bottom>
        <Button onClick={() => nav.reset('today')}>Done</Button>
        <Button variant="plain" onClick={() => nav.push('messages')}>
          Add a note
        </Button>
      </Bottom>
    </Screen>
  )
}

export function StillLow() {
  const { nav } = usePatient()
  useEffect(() => playSound('warning'), [])
  return (
    <Screen gap={14}>
      <StatusCircle tone="low" icon="alert" size={64} />
      <h1 className="type-large-title text-ink">Still low. Have another 15 g.</h1>
      <p className="type-body text-ink-2">61 mg/dL at 10:57 and not rising yet.</p>
      <div className="flex flex-col gap-2.5 rounded-lg bg-tint p-4">
        <Eyebrow>Right now</Eyebrow>
        <FoodChips items={FOODS} />
      </div>
      <Banner type="warning" title="If you’re not above 70 by 11:12">
        We’ll call Maria to check on you. You can call her now if you’d like.
      </Banner>
      <Bottom>
        <Button onClick={() => nav.replace('recheck')}>I’ve had another 15 g</Button>
        <Button variant="secondary" onClick={() => toast({ message: 'Calling Maria Okafor…', state: 'info' })}>
          Call Maria now
        </Button>
      </Bottom>
    </Screen>
  )
}

/* ── Hold to confirm (A7 → A8 → A9) ───────────────────────
 * A tap can't cancel a rescue. 2 s linear fill while held (the deliberate
 * phase), haptic tick every 0.5 s, snap back in 200 ms ease-out on release. */
const HOLD_MS = 2000

function HoldButton({ label, onComplete, helper }: { label: string; onComplete: () => void; helper: string }) {
  const reduce = useReducedMotion()
  const [holding, setHolding] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timers = useRef<{ done?: number; tick?: number; start: number }>({ start: 0 })

  const stop = (completed = false) => {
    window.clearTimeout(timers.current.done)
    window.clearInterval(timers.current.tick)
    setHolding(false)
    if (!completed) setElapsed(0)
  }
  const start = () => {
    if (holding) return
    setHolding(true)
    timers.current.start = performance.now()
    let ticks = 0
    playSound('holdTick')
    timers.current.tick = window.setInterval(() => {
      const e = performance.now() - timers.current.start
      setElapsed(e)
      const n = Math.floor(e / 500)
      if (n > ticks && n < 4) {
        ticks = n
        playSound('holdTick', { detune: n * 120 })
        navigator.vibrate?.(8)
      }
    }, 50)
    timers.current.done = window.setTimeout(() => {
      stop(true)
      onComplete()
    }, HOLD_MS)
  }
  useEffect(() => () => stop(), []) // eslint-disable-line react-hooks/exhaustive-deps

  const left = Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000))
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        data-sound="holdTick"
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* synthetic pointers can't be captured; holding still works */
          }
          start()
        }}
        onPointerUp={() => stop()}
        onPointerCancel={() => stop()}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            start()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') stop()
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={`${label}. Press and hold for 2 seconds.`}
        className="relative h-[52px] w-full touch-none overflow-hidden rounded-md bg-brand type-headline text-on-brand select-none"
      >
        <span
          aria-hidden
          className="absolute inset-0 origin-left bg-on-brand/25"
          style={{
            transform: `scaleX(${holding ? 1 : 0})`,
            transition: reduce
              ? 'none'
              : holding
                ? `transform ${HOLD_MS}ms linear`
                : 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <span className="relative">{holding ? 'Keep holding…' : label}</span>
      </button>
      <span className={cn('type-footnote', holding ? 'type-footnote-em text-brand' : 'text-ink-2')} aria-live="polite">
        {holding ? `${left} more second${left === 1 ? '' : 's'}` : helper}
      </span>
    </div>
  )
}

function CircleStatus({ rows }: { rows: { initials: string; tone: 'sage' | 'neutral'; label: ReactNode; meta: ReactNode; metaClass?: string; live?: boolean; strong?: boolean }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
      {rows.map((r, i) => (
        <motion.div layout key={r.initials} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
          <Avatar initials={r.initials} tone={r.tone} size={34} />
          <span className={cn('flex-1', r.strong ? 'type-subhead-em text-ink' : 'type-subhead text-ink')}>{r.label}</span>
          {r.live ? <span className="live-dot size-2 rounded-full bg-low text-low" /> : null}
          <span className={cn('type-footnote-em', r.metaClass ?? 'text-ink-2')}>{r.meta}</span>
        </motion.div>
      ))}
    </div>
  )
}

function useElapsed() {
  const [s, setS] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setS((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function Escalating() {
  const { nav } = usePatient()
  const calling = useElapsed()
  useEffect(() => playSound('urgent'), [])
  return (
    <Screen gap={12}>
      <div className="flex items-center justify-between">
        <span className="type-footnote-em text-ink-2">Wednesday, 3:18 AM</span>
        <Chip state="veryLow">Very low · 12 min</Chip>
      </div>
      <h1 className="type-title1 text-ink">Your sugar is very low and still dropping.</h1>
      <p className="type-subhead text-ink-2">49 mg/dL · down 3 every minute · Dexcom G7</p>
      <div className="flex flex-col gap-2 rounded-lg bg-tint p-4">
        <Eyebrow>Right now</Eyebrow>
        <span className="type-title2 text-ink">Have 15 g of fast sugar</span>
        <FoodChips items={FOODS.slice(0, 3)} />
      </div>
      <CircleStatus
        rows={[
          { initials: 'MO', tone: 'sage', label: 'Maria is being called', meta: calling, metaClass: 'text-low tabular-nums', live: true, strong: true },
          { initials: 'JH', tone: 'neutral', label: 'Your care team', meta: 'at 3:23' },
          { initials: '911', tone: 'neutral', label: 'Emergency services', meta: 'at 3:33' },
        ]}
      />
      <Bottom>
        <HoldButton label="Hold: I’ve had sugar" helper="Hold for 2 seconds · stops the call to Maria" onComplete={() => nav.replace('safe')} />
        <Button variant="plain" onClick={() => nav.replace('ems')}>
          Call 911 now
        </Button>
      </Bottom>
    </Screen>
  )
}

export function Safe() {
  const { nav } = usePatient()
  useEffect(() => playSound('success'), [])
  return (
    <Screen>
      <StatusCircle tone="inr" icon="checkc" />
      <h1 className="type-large-title text-ink">Thanks, Denise. Calls stopped.</h1>
      <p className="type-body text-ink-2">We told Maria you’re OK. Your care team will still see this event in the morning.</p>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        <div className="flex justify-between py-3">
          <span className="type-subhead text-ink-2">Now</span>
          <span className="type-subhead-em text-ink">52 mg/dL ↗ rising</span>
        </div>
        <div className="flex justify-between border-t border-line py-3">
          <span className="type-subhead text-ink-2">Next recheck</span>
          <span className="type-subhead-em text-ink">3:33 AM · in 14:59</span>
        </div>
      </div>
      <Banner type="info" title="If you’re not above 70 at 3:33">
        We’ll start the alerts again, beginning with you.
      </Banner>
      <Bottom>
        <Button onClick={() => nav.replace('summary')}>Done</Button>
      </Bottom>
    </Screen>
  )
}

export function MariaComing() {
  const { nav } = usePatient()
  useEffect(() => playSound('notification'), [])
  return (
    <Screen gap={12}>
      <div className="flex items-center justify-between">
        <span className="type-footnote-em text-ink-2">Wednesday, 3:19 AM</span>
        <Chip state="veryLow">Very low · 13 min</Chip>
      </div>
      <h1 className="type-title1 text-ink">Maria is on her way.</h1>
      <p className="type-subhead text-ink-2">She answered at 3:19 and is about 12 minutes away. We paused the 911 call because she responded.</p>
      <div className="flex flex-col gap-2 rounded-lg bg-tint p-4">
        <Eyebrow>Right now</Eyebrow>
        <span className="type-title2 text-ink">Have 15 g of fast sugar</span>
        <FoodChips items={FOODS.slice(0, 3)} />
      </div>
      <CircleStatus
        rows={[
          { initials: 'MO', tone: 'sage', label: 'Maria · on her way', meta: 'ETA 3:31', metaClass: 'text-inr' },
          { initials: 'JH', tone: 'neutral', label: 'JHF care team', meta: 'Told 3:23' },
          { initials: '911', tone: 'neutral', label: 'Emergency services', meta: 'Paused' },
        ]}
      />
      <Bottom>
        <HoldButton label="Hold: I’m OK now" helper="Hold for 2 seconds · tells Maria you’re safe" onComplete={() => nav.replace('safe')} />
        <Button variant="plain" onClick={() => toast({ message: 'Calling Maria Okafor…', state: 'info' })}>
          Call Maria
        </Button>
      </Bottom>
    </Screen>
  )
}

export function Ems() {
  const { nav } = usePatient()
  useEffect(() => playSound('urgent'), [])
  return (
    <Screen gap={12}>
      <StatusCircle tone="vlow" icon="siren" size={60} />
      <h1 className="type-large-title text-ink">Help is on the way.</h1>
      <p className="type-subhead text-ink-2">We called 911 at 3:33 because nobody could reach you for 30 minutes.</p>
      <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4">
        <span className="type-eyebrow text-ink-2">What we told 911</span>
        <span className="type-subhead-em text-ink">Denise Okafor, 67 · 1420 Grand Ave, Apt 3B</span>
        <span className="type-subhead text-ink">Type 2 diabetes on insulin. Glucose 41 and falling. No response for 30 minutes. Door code 4417.</span>
      </div>
      <div className="rounded-lg bg-tint px-4 py-0.5">
        {(
          [
            ['drop', 'Eat or drink sugar now'],
            ['door', 'Unlock your front door'],
            ['sofa', 'Sit or lie down somewhere safe'],
          ] as [IconName, string][]
        ).map(([icon, t], i) => (
          <div key={t} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
            <Icon name={icon} size={20} className="text-brand" />
            <span className="type-subhead-em text-ink">{t}</span>
          </div>
        ))}
      </div>
      <p className="type-footnote text-ink-2">Maria and your JHF care team have been told.</p>
      <Bottom>
        <Button variant="destructive" onClick={() => toast({ message: 'Connecting you to 911…', state: 'warning' })}>
          Call 911
        </Button>
        <Button variant="plain" onClick={() => nav.replace('safe')}>
          I’m OK now
        </Button>
      </Bottom>
    </Screen>
  )
}

/* A12 · Event summary + post-event check-in (Approval card) */
export function Summary() {
  const { nav, set } = usePatient()
  useEffect(() => set({ night: false }), [set])
  return (
    <Screen gap={12}>
      <div className="flex justify-end">
        <button type="button" onClick={() => nav.reset('today')} className="type-headline text-brand">
          Done
        </button>
      </div>
      <h1 className="type-title1 text-ink">Very low at 3:03 AM</h1>
      <div className="flex items-center gap-2">
        <Chip state="inRange">Resolved · 32 min</Chip>
        <span className="type-footnote-em text-ink-2">Lowest 47 mg/dL</span>
      </div>
      <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-3.5">
        <GlucoseChart data={TRACES.event} nowState="inRange" height={78} min={40} max={180} />
        <span className="flex justify-between type-caption2 text-ink-3">
          <span>12:30</span>
          <span>2:00</span>
          <span>3:35</span>
        </span>
      </div>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        <TimelineRow first time="3:03" dot="bg-low">Low alert · 58 · no reply</TimelineRow>
        <TimelineRow time="3:13" dot="bg-vlow">Urgent alarm · 49 · no reply</TimelineRow>
        <TimelineRow time="3:18" dot="bg-brand">Maria called · answered</TimelineRow>
        <TimelineRow time="3:19" dot="bg-inr">You confirmed you’re OK</TimelineRow>
        <TimelineRow time="3:35" dot="bg-inr">Back in range · 82</TimelineRow>
      </div>
      <ApprovalCard
        title="For Priya Shah, RN"
        questions={[
          {
            q: 'What happened before this low?',
            type: 'radio',
            options: ['I skipped my snack after dinner', 'I took extra insulin', 'I exercised more than usual', 'I drank alcohol'],
          },
          { q: 'How are you feeling now?', type: 'radio', options: ['Fine', 'Tired or shaky', 'Not well'] },
          {
            q: 'What would help?',
            type: 'check',
            options: ['Priya calls me today', 'Review my evening dose', 'Nothing for now'],
          },
        ]}
        labels={{ sentMessage: 'Sent to Priya · she reads it today', customPlaceholder: 'Something else…' }}
        onSubmitted={() => toast({ message: 'Shared with your JHF care team', state: 'success' })}
      />
    </Screen>
  )
}

/* A13 · Maria's phone — plain SMS, no app */
type Bubble = { from: 'gg' | 'maria'; text: string }
export function Sms() {
  const { nav } = usePatient()
  const [thread, setThread] = useState<Bubble[]>([
    {
      from: 'gg',
      text: 'URGENT from GlucoGuard: Denise’s glucose is 49 and falling. She hasn’t responded for 15 minutes.\n\nReply 1 if you’re going to her. Reply 2 to call 911 now.\n\nLive status: gg.care/d/4K7',
    },
  ])
  const [typing, setTyping] = useState(false)
  const replied = thread.some((b) => b.from === 'maria')

  const reply = (code: '1' | '2') => {
    setThread((t) => [...t, { from: 'maria', text: code }])
    playSound('swoosh')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setThread((t) => [
        ...t,
        {
          from: 'gg',
          text:
            code === '1'
              ? 'Thank you, Maria. We told Denise and paused the 911 call. Her care team at Jewish Healthcare Foundation has been told. We’ll text you when she’s back in range.'
              : 'Calling 911 now with Denise’s address and door code. Her care team has been told. Stay on the line if they call you.',
        },
      ])
      playSound('notification')
      if (code === '1')
        setTimeout(() => {
          setThread((t) => [...t, { from: 'gg', text: '3:35 AM: Denise is back in range (82 mg/dL). Thank you for being there.' }])
          playSound('success')
        }, 1800)
    }, 1100)
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-white text-black">
      <div className="flex flex-col items-center gap-1 bg-[#f6f6f6] pt-[54px] pb-2.5">
        <span className="flex size-11 items-center justify-center rounded-full bg-[#5a2b5e] text-white">
          <HeldMark size={24} />
        </span>
        <span className="text-[11px]">GlucoGuard ›</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3.5 py-4 no-scrollbar">
        <span className="text-center text-[11px] text-[#8e8e93]">Text Message · Today 3:18 AM</span>
        <AnimatePresence initial={false}>
          {thread.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, transform: 'translateY(8px) scale(0.97)' }}
              animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
              className={cn('flex', b.from === 'maria' ? 'justify-end' : 'justify-start')}
            >
              <span
                className={cn(
                  'max-w-[298px] rounded-[18px] px-3.5 py-2.5 text-[16px] leading-[21px] whitespace-pre-line',
                  b.from === 'maria' ? 'bg-[#34c759] text-white' : 'bg-[#e9e9eb] text-black',
                )}
              >
                {b.text}
              </span>
            </motion.div>
          ))}
          {typing ? (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex">
              <span className="flex gap-1 rounded-[18px] bg-[#e9e9eb] px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="size-2 animate-bounce rounded-full bg-[#8e8e93]" style={{ animationDelay: `${d * 120}ms` }} />
                ))}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-2 border-t border-[#e5e5ea] bg-[#f6f6f6] px-3 pt-2.5 pb-[34px]">
        {!replied ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => reply('1')} className="press flex-1 rounded-full bg-white px-3 py-2 text-[15px] font-semibold text-[#007aff] shadow-sm">
              1 · I’m going
            </button>
            <button type="button" onClick={() => reply('2')} className="press flex-1 rounded-full bg-white px-3 py-2 text-[15px] font-semibold text-[#ff3b30] shadow-sm">
              2 · Call 911
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => nav.reset('maria-coming')} className="press rounded-full bg-white px-3 py-2 text-[15px] font-semibold text-[#5a2b5e] shadow-sm">
            See Denise’s phone →
          </button>
        )}
        <span className="text-center text-[11px] text-[#8e8e93]">Maria’s iPhone · Messages · no app installed</span>
      </div>
    </div>
  )
}
