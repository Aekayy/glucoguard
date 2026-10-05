import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { Glyph, Icon, type IconName } from '@/components/icons'
import { Avatar, Banner, Chip, IconTile, NavBar, Toggle } from '@/components/hearth/ios'
import { Button } from '@/components/ui/button'
import { playSound } from '@/components/ui/sound'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

import { Bottom, Screen } from './chrome'
import { usePatient } from './state'

/* C1 · Care home */
export function Care() {
  const { nav, state } = usePatient()
  return (
    <Screen tabs gap={14}>
      <h1 className="type-large-title text-ink">Care</h1>
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-sage type-subhead-em text-ink">JH</span>
          <div className="flex flex-col">
            <span className="type-headline text-ink">Jewish Healthcare Foundation</span>
            <span className="type-footnote text-ink-2">Dr. Wen Chen · Priya Shah, RN</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => nav.push('messages')}>
            <Icon name="msg" size={18} /> Message
          </Button>
          <Button variant="secondary" onClick={() => toast({ message: 'Calling the JHF on-call nurse…', state: 'info' })}>
            <Icon name="phone" size={18} /> Call
          </Button>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-canvas px-3 py-2.5">
          <Icon name="plan" size={16} className="shrink-0 text-brand" />
          <span className="type-footnote-em text-ink">Care plan updated Sep 30 · evening dose lowered</span>
        </div>
      </div>
      <h2 className="type-headline text-ink">Care circle</h2>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        <div className="flex items-center gap-3 py-3">
          <Avatar initials="DO" />
          <div className="flex flex-1 flex-col">
            <span className="type-subhead-em text-ink">You</span>
            <span className="type-footnote text-ink-2">First alert, always</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line py-3">
          <Avatar initials="MO" tone="sage" />
          <div className="flex flex-1 flex-col">
            <span className="type-subhead-em text-ink">Maria Okafor</span>
            <span className="type-footnote text-ink-2">Daughter · called after 10 min</span>
          </div>
          <span className={cn('type-footnote-em', state.maria === 'accepted' ? 'text-inr' : 'text-high')}>
            {state.maria === 'accepted' ? 'Accepted' : state.maria === 'pending' ? 'Pending' : 'Not invited'}
          </span>
        </div>
        <button type="button" onClick={() => nav.push('invite')} className="flex w-full items-center gap-3 border-t border-line py-3 text-left">
          <span className="flex size-10 items-center justify-center rounded-full bg-tint text-brand">
            <Icon name="plus" size={18} />
          </span>
          <span className="flex flex-col">
            <span className="type-subhead-em text-ink">Add a person</span>
            <span className="type-footnote text-ink-2">Up to 4 people</span>
          </span>
        </button>
      </div>
      <h2 className="type-headline text-ink">Supplies</h2>
      <button type="button" onClick={() => nav.push('supplies')} className="press flex items-center gap-3 rounded-lg border border-line bg-surface p-4 text-left">
        <span className={cn('flex size-10 items-center justify-center rounded-full', state.supplies === 'action' ? 'bg-high-tint text-high' : 'bg-tint text-brand')}>
          <Icon name={state.supplies === 'action' ? 'alert' : 'box'} size={18} />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="type-subhead-em text-ink">Dexcom G7 sensors × 3</span>
          <span className="type-footnote text-ink-2">
            {state.supplies === 'action' ? 'Action needed · insurance card' : state.supplies === 'sent' ? 'Ships tomorrow · arrives by Oct 3' : 'Out for delivery · Oct 3'}
          </span>
        </span>
        <Icon name="chevR" size={18} className="text-ink-3" />
      </button>
    </Screen>
  )
}

/* C2 · Messages (+ C3 not delivered) */
export function Messages() {
  const { nav, state, set } = usePatient()
  const [draft, setDraft] = useState('Will do. Should I still check at bedtime?')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [state.messages.length])

  const deliver = (index: number) => {
    set((s) => ({ messages: s.messages.map((m, i) => (i === index ? { ...m, status: 'sending' } : m)) }))
    setTimeout(() => {
      set((s) => ({ messages: s.messages.map((m, i) => (i === index ? { ...m, status: 'sent' } : m)) }))
    }, 700)
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const fail = state.failNextMessage
    const index = state.messages.length
    set((s) => ({ messages: [...s.messages, { from: 'me', text, time: '9:41 AM', status: 'sending' }], failNextMessage: false }))
    setDraft('')
    setTimeout(() => {
      set((s) => ({ messages: s.messages.map((m, i) => (i === index ? { ...m, status: fail ? 'failed' : 'sent' } : m)) }))
      if (fail) playSound('error')
    }, 800)
  }

  return (
    <Screen bg="surface" gap={10} className="px-4">
      <NavBar onBack={nav.back} back="Care" title="Priya Shah, RN" />
      <p className="text-center type-caption1 text-ink-2">Jewish Healthcare Foundation · usually replies within 1 business day</p>
      <div className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {state.messages.map((m, i) =>
            m.plan ? (
              <motion.div key={i} className="flex" layout>
                <div className="flex w-[270px] items-center gap-2.5 rounded-md bg-tint p-3">
                  <Icon name="plan" size={16} className="text-brand" />
                  <span className="flex flex-1 flex-col">
                    <span className="type-footnote-em text-ink">Care plan updated</span>
                    <span className="type-caption1 text-ink-2">Evening correction: 2 u (was 4)</span>
                  </span>
                  <Icon name="chevR" size={18} className="text-brand" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
                animate={{ opacity: m.status === 'sending' ? 0.7 : 1, transform: 'translateY(0) scale(1)' }}
                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                className={cn('flex flex-col', m.from === 'me' ? 'items-end' : 'items-start')}
              >
                <div className={cn('flex max-w-[288px] flex-col gap-1 rounded-[18px] px-3.5 py-2.5', m.from === 'me' ? 'bg-brand text-on-brand' : 'bg-canvas text-ink')}>
                  <span className="type-subhead">{m.text}</span>
                  <span className={cn('type-caption2', m.from === 'me' ? 'text-on-brand/80' : 'text-ink-3')}>
                    {m.status === 'sending' ? 'Sending…' : m.time}
                  </span>
                </div>
                {m.status === 'failed' ? (
                  <button type="button" onClick={() => deliver(i)} className="mt-1 flex items-center gap-1 type-caption1 text-low">
                    <Icon name="alert" size={14} /> Not delivered. Tap to try again.
                  </button>
                ) : null}
              </motion.div>
            ),
          )}
        </AnimatePresence>
        <div ref={end} />
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-3">
        <p className="text-center type-caption1 text-ink-2">For emergencies, call 911. Messages are not monitored overnight.</p>
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message"
            aria-label="Message"
            className="h-[42px] min-w-0 flex-1 rounded-full border border-line bg-canvas px-3.5 type-subhead text-ink outline-none placeholder:text-ink-3 focus:border-brand"
          />
          <button
            type="button"
            aria-label="Send"
            onClick={send}
            disabled={!draft.trim()}
            className="press flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand disabled:bg-sunken disabled:text-ink-3"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </Screen>
  )
}

/* C4 / C5 / C6 · Supplies */
function StepDot({ tone, icon }: { tone: 'inr' | 'high' | 'brand' | 'none'; icon?: IconName }) {
  return (
    <span
      className={cn(
        'flex size-[22px] shrink-0 items-center justify-center rounded-full text-on-brand',
        tone === 'inr' && 'bg-inr',
        tone === 'high' && 'bg-high',
        tone === 'brand' && 'bg-brand',
        tone === 'none' && 'bg-sunken',
      )}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
    </span>
  )
}

export function Supplies() {
  const { nav, state, set } = usePatient()
  const [shots, setShots] = useState<{ front: boolean; back: boolean }>({ front: false, back: false })
  const [sending, setSending] = useState(false)
  const s = state.supplies

  const takePhotos = () => {
    setShots({ front: true, back: false })
    playSound('tap')
    setTimeout(() => {
      setShots({ front: true, back: true })
      playSound('tap')
    }, 600)
  }
  const sendCard = () => {
    setSending(true)
    toast({ id: 'card', message: 'Re-checking coverage…', state: 'pending' })
    setTimeout(() => {
      set({ supplies: 'sent' })
      setSending(false)
      toast({ id: 'card', message: 'Card uploaded · coverage approved', state: 'success' })
    }, 1600)
  }

  const steps: [string, string, 'inr' | 'high' | 'brand' | 'none', IconName | undefined][] =
    s === 'ontheway'
      ? [
          ['Ordered by Dr. Chen', 'Sep 29 · you didn’t need to do anything', 'inr', 'check'],
          ['Coverage approved', 'Medicare Part B · you pay about $38', 'inr', 'check'],
          ['Shipped', 'Oct 1 · UPS 1Z84X2E0', 'inr', 'check'],
          ['Out for delivery', 'Oct 3 · by 8 PM', 'brand', undefined],
        ]
      : s === 'action'
        ? [
            ['Ordered by Dr. Chen', 'Sep 29', 'inr', 'check'],
            ['Coverage check', 'Needs your new Medicare card', 'high', 'alert'],
            ['Ships after coverage is approved', 'Usually within 1 day', 'none', undefined],
          ]
        : [
            ['Ordered by Dr. Chen', 'Sep 29', 'inr', 'check'],
            ['Coverage approved', 'Medicare Part B · re-checked 10:14 AM', 'inr', 'check'],
            ['Ships tomorrow', 'Arrives by Oct 3', 'brand', undefined],
          ]

  return (
    <Screen tabs gap={14}>
      <NavBar onBack={nav.back} back="Care" title="Supplies" />
      {s === 'action' ? (
        <Banner type="warning" title="Your insurance needs an update">
          Medicare asked for your new card before shipping. Your sensor ends in 6 days.
        </Banner>
      ) : null}
      {s === 'sent' ? (
        <Banner type="success" title="Card sent to Harbor Home Medical">
          Coverage was re-checked in 2 minutes. You’re approved.
        </Banner>
      ) : null}
      {s === 'ontheway' ? (
        <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-tint text-brand">
              <Icon name="box" size={22} />
            </span>
            <span className="flex flex-col">
              <span className="type-headline text-ink">Dexcom G7 sensors × 3</span>
              <span className="type-footnote text-ink-2">30-day supply · Harbor Home Medical</span>
            </span>
          </div>
          <Chip state="inRange" className="w-fit">Arriving Saturday, Oct 3</Chip>
        </div>
      ) : null}
      <div className="rounded-lg border border-line bg-surface px-4 py-1.5">
        {steps.map(([t, d, tone, icon], i) => (
          <motion.div
            key={t}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex items-center gap-3 py-2.5"
          >
            {i < steps.length - 1 ? <span className="absolute top-[38px] left-[10.5px] h-[26px] w-px bg-line" /> : null}
            <StepDot tone={tone} icon={icon} />
            <span className="flex flex-col">
              <span className={cn('type-subhead-em', tone === 'none' ? 'text-ink-3' : 'text-ink')}>{t}</span>
              <span className="type-footnote text-ink-2">{d}</span>
            </span>
          </motion.div>
        ))}
      </div>
      {s === 'ontheway' ? (
        <Banner type="info" title="Your current sensor ends in 6 days">
          Your new box arrives with 3 days to spare.
        </Banner>
      ) : null}
      {s === 'action' ? (
        <>
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
            <span className="type-headline text-ink">Add photos of your Medicare card</span>
            <div className="grid grid-cols-2 gap-2.5">
              {(['front', 'back'] as const).map((side) => (
                <div
                  key={side}
                  className={cn(
                    'relative flex h-[91px] flex-col items-center justify-center gap-2 overflow-hidden rounded-md border',
                    shots[side] ? 'border-inr bg-inr-tint' : 'border-line bg-canvas',
                  )}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={String(shots[side])}
                      initial={{ opacity: 0, transform: 'scale(0.9)' }}
                      animate={{ opacity: 1, transform: 'scale(1)' }}
                      className={shots[side] ? 'text-inr' : 'text-ink-2'}
                    >
                      <Icon name={shots[side] ? 'checkc' : 'card'} size={26} />
                    </motion.span>
                  </AnimatePresence>
                  <span className="type-footnote-em text-ink-2">{side === 'front' ? 'Front' : 'Back'}</span>
                </div>
              ))}
            </div>
            <span className="type-footnote text-ink-2">We send them securely to Harbor Home Medical. Nothing is faxed.</span>
          </div>
          <Bottom>
            {shots.front && shots.back ? (
              <Button onClick={sendCard} disabled={sending}>
                {sending ? 'Sending…' : 'Send card'}
              </Button>
            ) : (
              <Button onClick={takePhotos}>Take photos</Button>
            )}
          </Bottom>
        </>
      ) : null}
      {s === 'sent' ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
          <IconTile name="card" />
          <span className="flex flex-1 flex-col">
            <span className="type-subhead-em text-ink">Medicare card</span>
            <span className="type-footnote text-ink-2">Updated Sep 30 · front and back</span>
          </span>
          <span className="type-footnote-em text-inr">Saved</span>
        </div>
      ) : null}
    </Screen>
  )
}

/* M1 · Me (+ M6 sign-out sheet) */
export function Me() {
  const { nav, state, set, restart } = usePatient()
  const [sheet, setSheet] = useState(false)
  const row = (icon: IconName, title: string, detail: string | null, onClick?: () => void, tone: 'brand' | 'inr' | 'low' = 'brand', value?: string) => (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-t border-line py-3 text-left first:border-t-0">
      <IconTile name={icon} tone={tone} />
      <span className="flex flex-1 flex-col">
        <span className="type-subhead-em text-ink">{title}</span>
        {detail ? <span className="type-footnote text-ink-2">{detail}</span> : null}
      </span>
      {value ? <span className="type-footnote-em text-ink-2">{value}</span> : null}
      <Icon name="chevR" size={18} className="text-ink-3" />
    </button>
  )
  return (
    <Screen tabs gap={14}>
      <h1 className="type-large-title text-ink">Me</h1>
      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
        <Avatar initials="DO" size={56} className="type-title3" />
        <div className="flex flex-col">
          <span className="type-title3 text-ink">Denise Okafor</span>
          <span className="type-footnote text-ink-2">Type 2 · insulin · Jewish Healthcare Foundation</span>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        {row('sensor', 'Dexcom G7', state.device === 'connected' ? 'Connected · sensor day 4 of 10' : 'Not connected since 9:14 AM', () => nav.push('device'), state.device === 'connected' ? 'inr' : 'low')}
        {row('bell', 'Alert levels', `Low ${state.levels.low} · urgent 54 · high ${state.levels.high}`, () => nav.push('alert-levels'))}
        {row('care', 'Care circle', 'Maria Okafor', () => nav.reset('care'))}
      </div>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        {row('globe', 'Language', null, () => set({ lang: state.lang === 'en' ? 'es' : 'en' }), 'brand', state.lang === 'en' ? 'English' : 'Español')}
        {row('text', 'Text size and contrast', null, undefined, 'brand', 'Larger')}
        {row('lock', 'Privacy and sharing', null)}
        {row('help', 'Help and support', null)}
      </div>
      <button type="button" onClick={() => setSheet(true)} className="press rounded-lg border border-line bg-surface py-3 type-headline text-vlow">
        Sign out
      </button>
      <AnimatePresence>
        {sheet ? (
          <>
            <motion.div key="scrim" className="absolute inset-0 z-50 bg-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div
              key="sheet"
              role="dialog"
              aria-label="Sign out"
              className="absolute inset-x-2 bottom-[34px] z-50 flex flex-col gap-2"
              initial={{ transform: 'translateY(110%)' }}
              animate={{ transform: 'translateY(0)' }}
              exit={{ transform: 'translateY(110%)' }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="overflow-hidden rounded-[14px] bg-surface/95 backdrop-blur-xl">
                <div className="flex flex-col gap-1 px-4 py-3.5 text-center">
                  <span className="type-footnote-em text-ink-2">Sign out of GlucoGuard?</span>
                  <span className="type-footnote text-ink-2">While you’re signed out, we can’t alert you, Maria or your care team about lows.</span>
                </div>
                <button type="button" data-variant="destructive" onClick={restart} className="w-full border-t border-line py-4 type-body text-vlow">
                  Sign out
                </button>
              </div>
              <button type="button" onClick={() => setSheet(false)} className="rounded-[14px] bg-surface py-4 type-headline text-info">
                Cancel
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </Screen>
  )
}

/* M2 / M3 · Device */
export function Device() {
  const { nav, state, set } = usePatient()
  const ok = state.device === 'connected'
  const [busy, setBusy] = useState(false)
  return (
    <Screen tabs gap={14}>
      <NavBar onBack={nav.back} back="Me" title="Dexcom G7" />
      {!ok ? (
        <Banner type="error" title="Dexcom stopped sharing data">
          Since 9:14 AM we can’t see readings, so we can’t alert you or your care team.
        </Banner>
      ) : null}
      <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <span className={cn('flex size-12 items-center justify-center rounded-full', ok ? 'bg-inr-tint text-inr' : 'bg-low-tint text-low')}>
            <Icon name="sensor" size={22} />
          </span>
          <span className="flex flex-col">
            <span className="type-headline text-ink">Dexcom G7</span>
            <span className={cn('type-footnote', ok ? 'text-ink-2' : 'text-low')}>{ok ? 'Connected · last reading 2 min ago' : 'Not connected · last reading 9:14 AM'}</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="type-footnote-em text-ink">Sensor day 4 of 10</span>
          <span className="type-footnote text-ink-2">Ends Oct 5</span>
        </div>
        <div className="flex gap-[3px]">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < 4 ? (ok ? 'bg-brand' : 'bg-ink-3') : 'bg-sunken')} />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        {[
          ['Data sharing', ok ? 'On' : 'Off', ok ? 'text-inr' : 'text-low'],
          ['Reading every', '5 minutes', 'text-ink-2'],
          ['Source', 'Dexcom Share API', 'text-ink-2'],
        ].map(([k, v, c], i) => (
          <div key={k} className={cn('flex items-center justify-between py-3', i > 0 && 'border-t border-line')}>
            <span className="type-subhead-em text-ink">{k}</span>
            <span className={cn('type-footnote-em', c)}>{v}</span>
          </div>
        ))}
      </div>
      {!ok ? (
        <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
          {['1. Open the Dexcom app', '2. Check Connections › Partner apps', '3. Turn GlucoGuard back on'].map((s, i) => (
            <div key={s} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}>
              <IconTile name="checkc" />
              <span className="type-subhead-em text-ink">{s}</span>
            </div>
          ))}
        </div>
      ) : null}
      <Bottom>
        {ok ? (
          <>
            <Button variant="secondary">Start a new sensor</Button>
            <Button
              variant="plain"
              onClick={() => {
                set({ device: 'disconnected' })
                playSound('error')
              }}
            >
              Disconnect Dexcom
            </Button>
          </>
        ) : (
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true)
              toast({ id: 'dex', message: 'Reconnecting to Dexcom…', state: 'pending' })
              setTimeout(() => {
                set({ device: 'connected' })
                setBusy(false)
                toast({ id: 'dex', message: 'Dexcom reconnected', state: 'success' })
              }, 1500)
            }}
          >
            {busy ? 'Reconnecting…' : 'Reconnect Dexcom'}
          </Button>
        )}
      </Bottom>
    </Screen>
  )
}

/* M4 · Alert levels settings */
export function AlertLevels() {
  const { nav, state, set } = usePatient()
  const L = state.levels
  const toggle = (k: 'signalLoss' | 'risingFast' | 'quietHours') => (on: boolean) => set((s) => ({ levels: { ...s.levels, [k]: on } }))
  return (
    <Screen tabs gap={14}>
      <NavBar onBack={nav.back} back="Me" title="Alert levels" />
      <p className="type-subhead text-ink-2">Your care team set the safe limits. You can make alerts stricter, not looser.</p>
      <div className="rounded-lg border border-line bg-surface px-4">
        {(
          [
            ['low', 'Low', 'Alert once, repeat after 15 min', `${L.low} mg/dL`, false],
            ['veryLow', 'Urgent low', 'Set by Dr. Chen · always on', '54 mg/dL', true],
            ['high', 'High', 'Alert after 30 min above', `${L.high} mg/dL`, false],
          ] as const
        ).map(([s, t, d, v, locked], i) => (
          <div key={t} className={cn('flex items-center gap-3 py-3.5', i > 0 && 'border-t border-line')}>
            <Glyph state={s} className={s === 'low' ? 'text-low' : s === 'veryLow' ? 'text-vlow' : 'text-high'} />
            <span className="flex flex-1 flex-col">
              <span className="type-headline text-ink">{t}</span>
              <span className="type-footnote text-ink-2">{d}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1.5 type-subhead-em text-ink">
              {locked ? <Icon name="lock" size={14} className="text-ink-2" /> : null}
              {v}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-surface px-4">
        {(
          [
            ['signalLoss', 'Signal loss', 'Alert if no reading for 20 min'],
            ['risingFast', 'Rising fast', 'Alert if rising 3 mg/dL each minute'],
            ['quietHours', 'Quiet hours', 'Never mutes urgent lows'],
          ] as const
        ).map(([k, t, d], i) => (
          <div key={k} className={cn('flex items-center gap-3 py-3.5', i > 0 && 'border-t border-line')}>
            <span className="flex flex-1 flex-col">
              <span className="type-headline text-ink">{t}</span>
              <span className="type-footnote text-ink-2">{d}</span>
            </span>
            <Toggle label={t} on={L[k]} onChange={toggle(k)} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 type-footnote text-ink-2">
        <Icon name="clock" size={16} /> Last changed Sep 30 by Dr. Wen Chen
      </div>
    </Screen>
  )
}
