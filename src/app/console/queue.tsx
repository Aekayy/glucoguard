import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { GlucoseChart, TRACES } from '@/components/charts/charts'
import { Icon } from '@/components/icons'
import { Avatar, Banner, Chip } from '@/components/hearth/ios'
import { Button } from '@/components/ui/button'
import { playSound } from '@/components/ui/sound'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { go } from '@/lib/use-hash-route'

import { useConsole, type QueueAlert } from './console-state'
import { Checkbox, Choice, FilterChips, Modal, Stat, WebField } from './web'

const COLS = 'minmax(150px,1.5fr) 74px 112px 40px minmax(120px,1.25fr) 76px'
const STATE_RAIL: Record<string, string> = { veryLow: 'bg-vlow', low: 'bg-low', veryHigh: 'bg-vhigh', high: 'bg-high', noData: 'bg-nod', inRange: 'bg-inr' }
const STATE_NUM: Record<string, string> = { veryLow: 'text-vlow', low: 'text-ink', veryHigh: 'text-ink', high: 'text-ink', noData: 'text-ink', inRange: 'text-ink' }

type Filter = 'all' | 'veryLow' | 'low' | 'high' | 'noData' | 'mine'

function useTicker(active: boolean) {
  const [s, setS] = useState(0)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setS((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [active])
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function Queue({ onPalette }: { onPalette: () => void }) {
  const { s, set, log } = useConsole()
  const [filter, setFilter] = useState<Filter>('all')
  const [resolveOpen, setResolveOpen] = useState(false)
  const [emsOpen, setEmsOpen] = useState(false)

  /* Q2: the first load shows skeletons that match the real layout */
  useEffect(() => {
    if (s.loaded) return
    const t = setTimeout(() => set({ loaded: true }), 1100)
    return () => clearTimeout(t)
  }, [s.loaded, set])

  const open = s.alerts.filter((a) => !s.resolved.includes(a.id))
  const mine = (a: QueueAlert) => a.owner === 'you' || s.taken.includes(a.id)
  const counts = {
    all: open.length,
    veryLow: open.filter((a) => a.state === 'veryLow').length,
    low: open.filter((a) => a.state === 'low').length,
    high: open.filter((a) => a.state === 'high' || a.state === 'veryHigh').length,
    noData: open.filter((a) => a.state === 'noData').length,
    mine: open.filter(mine).length,
  }
  const rows = useMemo(
    () =>
      open.filter((a) =>
        filter === 'all' ? true : filter === 'mine' ? mine(a) : filter === 'high' ? a.state === 'high' || a.state === 'veryHigh' : a.state === filter,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open.length, filter, s.taken],
  )
  const selected = rows.find((r) => r.id === s.selected) ?? rows[0]
  const taken = selected ? s.taken.includes(selected.id) : false

  const takeOver = useCallback(
    (id: string) => {
      if (s.taken.includes(id)) return
      set((c) => ({ taken: [...c.taken, id] }))
      const a = s.alerts.find((x) => x.id === id)
      log({ time: '3:22 AM', who: 'Priya Shah, RN', action: 'Took over alert', details: `${a?.name} · 911 paused` })
      toast({ message: `You’re handling ${a?.name.split(' ')[0]}’s alert · 911 paused`, state: 'info' })
    },
    [s.taken, s.alerts, set, log],
  )

  /* keyboard triage: J/K move, A take over, E escalate */
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (resolveOpen || emsOpen || e.metaKey || e.ctrlKey) return
      const t = e.target as HTMLElement
      if (t instanceof Element && t.closest('input, textarea, [contenteditable]')) return
      const idx = rows.findIndex((r) => r.id === selected?.id)
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        const n = rows[Math.min(rows.length - 1, idx + 1)]
        if (n) set({ selected: n.id })
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        const n = rows[Math.max(0, idx - 1)]
        if (n) set({ selected: n.id })
      } else if (e.key === 'a' && selected) takeOver(selected.id)
      else if (e.key === 'e' && selected) setEmsOpen(true)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [rows, selected, resolveOpen, emsOpen, set, takeOver])

  const loading = !s.loaded

  return (
    <>
      <div className="flex items-center justify-end gap-2 -mt-1 -mb-1">
        <span className="type-small text-ink-3">Demo states:</span>
        <button type="button" onClick={() => set((c) => ({ feedDelayed: !c.feedDelayed }))} className={cn('rounded-full border px-2.5 py-1 type-small-em', s.feedDelayed ? 'border-vlow bg-vlow-tint text-ink' : 'border-line text-ink-2 hover:bg-surface')}>
          Dexcom feed delay
        </button>
        <button type="button" onClick={() => set({ loaded: false })} className="rounded-full border border-line px-2.5 py-1 type-small-em text-ink-2 hover:bg-surface">
          Reload (skeleton)
        </button>
        <button type="button" onClick={() => set({ resolved: s.alerts.map((a) => a.id) })} className="rounded-full border border-line px-2.5 py-1 type-small-em text-ink-2 hover:bg-surface">
          All clear
        </button>
        <button type="button" onClick={() => set({ resolved: [], taken: [], dispatched: [], selected: 'denise' })} className="rounded-full border border-line px-2.5 py-1 type-small-em text-ink-2 hover:bg-surface">
          Reset night
        </button>
      </div>

      <AnimatePresence initial={false}>
        {s.feedDelayed ? (
          <motion.div initial={{ opacity: 0, transform: 'translateY(-6px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} exit={{ opacity: 0 }}>
            <Banner type="error" size="web" title="Dexcom data is delayed for 38 patients">
              Dexcom’s partner feed has been 18 minutes behind since 2:04 AM. Alerts for these patients may be late. We retry every minute and page the on-call engineer.
            </Banner>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex gap-3">
        <Stat loading={loading} label="Open alerts" value={open.length} sub={counts.veryLow ? `${counts.veryLow} very low` : undefined} valueClass={open.length === 0 ? 'text-inr' : undefined} />
        <Stat loading={loading} label="Median time to acknowledge" value="2m 40s" sub="today" />
        <Stat loading={loading} label="Sent to 911 this week" value={s.dispatched.length} />
        <Stat loading={loading} label="Patients reporting" value="214" sub={s.feedDelayed ? '38 delayed' : 'all normal'} valueClass={s.feedDelayed ? 'text-high' : undefined} />
      </div>

      <div className="flex min-h-[640px] gap-4">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-line bg-surface">
          <div className="flex items-center gap-3 border-b border-line px-3.5 py-3">
            <FilterChips
              value={filter}
              onChange={setFilter}
              items={[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'veryLow', label: 'Very low', count: counts.veryLow },
                { id: 'low', label: 'Low', count: counts.low },
                { id: 'high', label: 'High', count: counts.high },
                { id: 'noData', label: 'No data', count: counts.noData },
                { id: 'mine', label: 'Mine', count: counts.mine },
              ]}
            />
            <span className="ml-auto type-small text-ink-3 max-2xl:hidden">J/K move · A take over · E escalate · ⌘K</span>
          </div>
          <div className="grid items-center gap-3 border-b border-line bg-canvas px-3.5 py-2.5 type-eyebrow text-ink-2" style={{ gridTemplateColumns: COLS }}>
            <span>Patient</span>
            <span>Glucose</span>
            <span>State</span>
            <span>For</span>
            <span>Escalation</span>
            <span>Owner</span>
          </div>
          {loading ? (
            Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="grid h-14 items-center gap-3 border-b border-line px-3.5" style={{ gridTemplateColumns: COLS }}>
                {[150, 50, 80, 30, 110, 60].map((w, j) => (
                  <span key={j} className="skeleton h-3 rounded-full" style={{ width: w }} />
                ))}
              </div>
            ))
          ) : rows.length === 0 ? (
            <motion.div initial={{ opacity: 0, transform: 'scale(0.98)' }} animate={{ opacity: 1, transform: 'scale(1)' }} className="flex flex-1 flex-col items-center justify-center gap-2.5 p-10 text-center">
              <span className="flex size-[72px] items-center justify-center rounded-full bg-inr-tint text-inr">
                <Icon name="checkc" size={34} />
              </span>
              <h3 className="type-h1 text-ink">{filter === 'all' ? 'All clear. No open alerts.' : 'Nothing in this filter.'}</h3>
              <p className="max-w-[420px] type-wbody text-ink-2">
                {filter === 'all' ? 'The last alert was resolved a moment ago by Priya Shah. 214 patients are reporting normally.' : 'Switch to All to see every open alert.'}
              </p>
              {filter === 'all' ? (
                <Button size="web" variant="outline" onClick={() => go('console/audit')}>
                  View resolved in audit log
                </Button>
              ) : null}
            </motion.div>
          ) : (
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {rows.map((a) => {
                  const on = selected?.id === a.id
                  const isTaken = s.taken.includes(a.id)
                  const sent = s.dispatched.includes(a.id)
                  return (
                    <motion.button
                      layout
                      key={a.id}
                      type="button"
                      data-slot="table-row-item"
                      onClick={() => set({ selected: a.id })}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transform: 'translateX(24px)', transition: { duration: 0.2 } }}
                      transition={{ layout: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }}
                      className={cn('relative grid h-14 items-center gap-3 border-b border-line px-3.5 text-left transition-colors', on ? 'bg-tint' : 'hover:bg-canvas')}
                      style={{ gridTemplateColumns: COLS }}
                    >
                      {on ? <motion.span layoutId="queue-rail" className={cn('absolute inset-y-0 left-0 w-[3px]', STATE_RAIL[a.state])} /> : null}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate type-wbody-em text-ink">{a.name}</span>
                        <span className="truncate type-small text-ink-2">{a.meta}</span>
                      </span>
                      <span className="flex items-baseline gap-1">
                        <span className={cn('type-wnum', STATE_NUM[a.state])}>{a.glucose ?? '—'}</span>
                        <span className="type-small text-ink-2">{a.trend}</span>
                      </span>
                      <span>
                        <Chip state={a.state} size="web" />
                      </span>
                      <span className="type-small-em text-ink-2">{a.minutes}</span>
                      <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5 truncate type-wbody-em text-ink">
                          {a.escLive && !isTaken && !sent ? <span className="live-dot size-[7px] shrink-0 rounded-full bg-low text-low" /> : null}
                          {sent ? '911' : isTaken ? 'Coordinator' : a.esc}
                        </span>
                        <span className={cn('truncate type-small', a.escLive && !isTaken && !sent ? 'text-low' : sent ? 'text-vlow' : 'text-ink-2')}>
                          {sent ? 'EMS dispatched' : isTaken ? 'you · 911 paused' : a.escSub}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {a.owner === 'you' || isTaken ? (
                          <>
                            <Avatar initials="PS" size={22} />
                            <span className="type-small-em text-ink">You</span>
                          </>
                        ) : a.owner === 'other' ? (
                          <>
                            <Avatar initials={a.ownerInitials ?? ''} tone="neutral" size={22} />
                            <span className="truncate type-small-em text-ink">{a.ownerName}</span>
                          </>
                        ) : (
                          <span className="type-small text-ink-3">Auto</span>
                        )}
                      </span>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
              <p className="px-3.5 py-3 type-small text-ink-2">Sorted by clinical urgency, then time unacknowledged.</p>
            </div>
          )}
        </section>

        <section className="flex w-[clamp(400px,34vw,504px)] shrink-0 flex-col gap-3.5 rounded-md border border-line bg-surface p-[18px]">
          {loading ? (
            <div className="flex flex-col gap-3">
              <span className="skeleton h-3.5 w-[200px] rounded-full" />
              <span className="skeleton h-3.5 w-[300px] rounded-full" />
              <span className="skeleton h-[90px] w-full rounded-sm" />
              <span className="skeleton h-[90px] w-full rounded-sm" />
              <span className="skeleton h-3.5 w-[260px] rounded-full" />
            </div>
          ) : open.length === 0 ? (
            <ShiftSummary />
          ) : selected ? (
            <Detail alert={selected} taken={taken} onTake={() => takeOver(selected.id)} onResolve={() => setResolveOpen(true)} onEms={() => setEmsOpen(true)} onPalette={onPalette} />
          ) : null}
        </section>
      </div>

      {selected ? (
        <>
          <ResolveModal
            open={resolveOpen}
            alert={selected}
            onClose={() => setResolveOpen(false)}
            onDone={() => {
              setResolveOpen(false)
              const next = rows.find((r) => r.id !== selected.id)
              set((c) => ({ resolved: [...c.resolved, selected.id], selected: next?.id ?? c.selected }))
            }}
          />
          <EmsModal
            open={emsOpen}
            alert={selected}
            onClose={() => setEmsOpen(false)}
            onDone={() => {
              setEmsOpen(false)
              set((c) => ({ dispatched: [...c.dispatched, selected.id] }))
              log({ time: '3:34 AM', who: 'Priya Shah, RN', action: 'Called 911', details: `${selected.name} · address, summary and door code shared` })
              toast({ message: '911 called · we’ll update this alert when EMS arrives', state: 'warning' })
            }}
          />
        </>
      ) : null}
    </>
  )
}

function ShiftSummary() {
  const { s } = useConsole()
  return (
    <>
      <h3 className="type-h2 text-ink">Tonight so far</h3>
      {[
        ['Alerts resolved', String(5 + s.resolved.length)],
        ['Median time to acknowledge', '2m 40s'],
        ['Caregiver reached', '3 of 3'],
        ['Escalated to 911', String(s.dispatched.length)],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between border-t border-line py-2.5">
          <span className="type-wbody text-ink-2">{k}</span>
          <span className="type-wbody-em text-ink">{v}</span>
        </div>
      ))}
    </>
  )
}

function Detail({ alert, taken, onTake, onResolve, onEms, onPalette }: { alert: QueueAlert; taken: boolean; onTake: () => void; onResolve: () => void; onEms: () => void; onPalette: () => void }) {
  const { s } = useConsole()
  const handling = useTicker(taken)
  const sent = s.dispatched.includes(alert.id)
  const isDenise = alert.id === 'denise'

  const steps: [string, string, string, string, boolean?][] = isDenise
    ? [
        ['3:03', 'bg-ink-2', 'Low alert to patient', 'no reply'],
        ['3:13', 'bg-ink-2', 'Urgent alarm to patient', 'no reply'],
        taken || sent ? ['3:18', 'bg-inr', 'Calling Maria Okafor (daughter)', 'answered'] : ['3:18', 'bg-low', 'Calling Maria Okafor (daughter)', 'ringing', true],
        sent ? ['3:34', 'bg-vlow', '911 with address and summary', 'dispatched'] : taken ? ['3:33', 'bg-line', '911 with address and summary', 'paused'] : ['3:33', 'bg-line', '911 with address and summary', 'in 15:00'],
      ]
    : [
        ['now', 'bg-low', `Alert to ${alert.name.split(' ')[0]}`, alert.escSub, alert.escLive],
        ['+10m', 'bg-line', 'Care circle, in order', 'next'],
        ['+20m', 'bg-line', 'On-call coordinator', 'then'],
      ]

  return (
    <motion.div key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="flex flex-1 flex-col gap-3.5">
      <div className="flex items-start gap-2.5">
        <div className="flex flex-1 flex-col gap-0.5">
          <button type="button" onClick={() => isDenise && go('console/patients/denise')} className="w-fit type-h1 text-ink hover:underline">
            {alert.name}
          </button>
          <span className="type-small text-ink-2">
            {alert.meta.replace(' · ', ' · Type ').replace('T1', '1').replace('T2', '2')} · MRN {alert.mrn} · {alert.device}
          </span>
        </div>
        <Chip state={alert.state} size="web">
          {alert.glucose ?? '—'} · {alert.minutes.replace('m', ' min')}
        </Chip>
      </div>
      <AnimatePresence initial={false}>
        {taken && !sent ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Banner type="info" size="web" title={`You’re handling this alert · ${handling}`}>
              911 is paused while you work. Resolve or hand off within 15 minutes.
            </Banner>
          </motion.div>
        ) : null}
        {sent ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <Banner type="error" size="web" title="911 dispatched at 3:34 AM">
              Chicago Fire Department EMS · we’ll update this alert when they arrive.
            </Banner>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex flex-col gap-1.5 rounded-sm bg-canvas p-3">
        <div className="flex justify-between type-eyebrow text-ink-2">
          <span>Last 24 h</span>
          <span>Target 70–180</span>
        </div>
        <GlucoseChart
          key={alert.id}
          data={isDenise ? TRACES.consoleDenise : alert.state === 'low' ? TRACES.lowMorning : TRACES.today}
          nowState={alert.state}
          height={120}
          min={40}
          max={320}
          markers={isDenise ? [{ at: 88, label: '4 u 10:40 PM' }] : []}
          gapFrom={alert.state === 'noData' ? 70 : undefined}
        />
        <div className="flex justify-between type-small text-ink-3">
          <span>3:18 PM</span>
          <span>9:18 PM</span>
          <span>3:18 AM</span>
        </div>
      </div>
      <p className="type-small text-ink">
        <span className="type-small-em">Why this fired:</span>{' '}
        {isDenise
          ? 'under 54 for 15 min, falling 3 mg/dL/min. 4 u correction at 10:40 PM (dashed line).'
          : alert.state === 'noData'
            ? 'no reading for 3 hours; the sensor session ended and no new one started.'
            : alert.state === 'low'
              ? `under 70 for ${alert.minutes.replace('m', ' min')}, trend ${alert.trend || 'flat'}.`
              : `over 250 for ${alert.minutes.replace('m', ' min')}.`}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {(isDenise
          ? [['58%', 'In range', ''], ['7.1%', 'Under 70', 'text-vlow'], ['2.1%', 'Under 54', 'text-vlow'], ['7.4%', 'GMI', '']]
          : [['69%', 'In range', ''], ['3.2%', 'Under 70', ''], ['0.8%', 'Under 54', ''], ['7.0%', 'GMI', '']]
        ).map(([v, l, c]) => (
          <div key={l} className="flex flex-col">
            <span className={cn('type-wnum', c || 'text-ink')}>{v}</span>
            <span className="type-small text-ink-2">{l}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="pb-1 type-eyebrow text-ink-2">Escalation</span>
        {steps.map(([t, dot, label, status, live], i) => (
          <motion.div layout key={label} className="flex items-center gap-2.5 border-t border-line py-2">
            <span className="w-9 type-small text-ink-2 tabular-nums">{t}</span>
            <span className={cn('size-2 shrink-0 rounded-full', dot, live && 'live-dot text-low')} />
            <span className={cn('flex-1', i === 2 && live ? 'type-wbody-em text-ink' : 'type-wbody text-ink')}>{label}</span>
            <span className={cn('type-small-em', status === 'ringing' ? 'text-low' : status === 'answered' ? 'text-inr' : status === 'dispatched' ? 'text-vlow' : 'text-ink-2')}>{status}</span>
          </motion.div>
        ))}
      </div>
      {isDenise ? (
        <button type="button" onClick={() => go('console/orders/new/denise')} className="flex items-center gap-2 rounded-sm bg-inr-tint px-3 py-2 text-left">
          <Icon name="box" size={16} className="text-inr" />
          <span className="flex-1 type-small-em text-ink">Sensors run out in 6 days. Medicare criteria met.</span>
          <span className="type-small-em text-brand">Reorder →</span>
        </button>
      ) : null}
      <div className="mt-auto flex gap-2 pt-2">
        {taken && !sent ? (
          <>
            <Button size="web" variant="outline" className="flex-1" onClick={() => toast({ message: 'Calling Maria Okafor · (312) 555-0187', state: 'info' })}>
              Call Maria
            </Button>
            <Button size="web" variant="destructive" className="flex-1" onClick={onEms}>
              Escalate to 911
            </Button>
            <Button size="web" className="flex-1" onClick={onResolve}>
              Resolve alert
            </Button>
          </>
        ) : sent ? (
          <Button size="web" className="flex-1" onClick={onResolve}>
            Resolve when EMS confirms
          </Button>
        ) : (
          <>
            <Button size="web" variant="outline" className="flex-1" onClick={() => toast({ message: `Calling ${alert.name}…`, state: 'info' })}>
              Call patient
            </Button>
            <Button size="web" variant="outline" className="flex-1" onClick={onPalette}>
              More ⌘K
            </Button>
            <Button size="web" className="flex-1" onClick={onTake}>
              Take over alert
            </Button>
          </>
        )}
      </div>
    </motion.div>
  )
}

const OUTCOMES = [
  ['Patient treated and recovered', 'Confirmed back above 70'],
  ['Caregiver on site', 'A care-circle member is with the patient'],
  ['EMS dispatched', '911 was called'],
  ['Sensor error (false alarm)', 'Reading was wrong, fingerstick confirmed'],
] as const

function ResolveModal({ open, alert, onClose, onDone }: { open: boolean; alert: QueueAlert; onClose: () => void; onDone: () => void }) {
  const { log } = useConsole()
  const [outcome, setOutcome] = useState<number | null>(null)
  const [glucose, setGlucose] = useState('')
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState(true)
  const [tried, setTried] = useState(false)
  useEffect(() => {
    if (open) {
      setOutcome(null)
      setGlucose('')
      setNote('')
      setTried(false)
    }
  }, [open])
  const needsNote = outcome === 1 || outcome === 2
  const outcomeError = tried && outcome === null
  const noteError = tried && needsNote && !note.trim()

  const submit = () => {
    setTried(true)
    if (outcome === null || (needsNote && !note.trim())) {
      playSound('error')
      return
    }
    log({ time: '3:34 AM', who: 'Priya Shah, RN', action: 'Resolved alert', details: `${OUTCOMES[outcome][0]} · note${followUp ? ' · follow-up created' : ''}` })
    toast({ message: `Alert resolved · ${alert.name}${followUp ? ' · follow-up for Dr. Chen' : ''}`, state: 'success' })
    onDone()
  }
  const fill = () => {
    setOutcome(1)
    setGlucose('76 mg/dL ↗')
    setNote('Maria arrived 3:31. Denise had juice, now 76 and rising. Skipped dinner snack.')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Resolve alert · ${alert.name}`}
      description={`${alert.state === 'veryLow' ? 'Very low' : 'Alert'} · ${alert.glucose ?? '—'} mg/dL · open 16 min. This closes the alert for everyone.`}
      footer={
        <>
          <span className="flex-1 type-small text-ink-2">Saved to the audit log and {alert.name.split(' ')[0]}’s chart.</span>
          <Button size="web" variant="ghost" onClick={fill}>
            Fill example
          </Button>
          <Button size="web" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="web" onClick={submit}>
            Resolve alert
          </Button>
        </>
      }
    >
      <span className="type-wbody-em text-ink">What happened?</span>
      <div role="radiogroup" aria-label="Outcome" aria-invalid={outcomeError || undefined} className="flex flex-col gap-2">
        {OUTCOMES.map(([t, d], i) => (
          <Choice key={t} on={outcome === i} invalid={outcomeError} title={t} detail={d} onClick={() => setOutcome(i)} />
        ))}
      </div>
      {outcomeError ? (
        <span className="flex items-center gap-1.5 type-small text-low">
          <Icon name="alert" size={13} /> Choose what happened. It’s required for the patient’s RPM record.
        </span>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <WebField label="Glucose at resolution" value={glucose} onChange={setGlucose} placeholder="e.g. 82 mg/dL" />
        <WebField label="Resolved at" value="3:34 AM" readOnly />
      </div>
      <WebField
        label={needsNote ? 'Note (required when a caregiver or EMS was involved)' : 'Note'}
        value={note}
        onChange={setNote}
        placeholder="What happened, who helped"
        multiline
        error={noteError ? 'Add a note when a caregiver or EMS was involved.' : null}
      />
      <Checkbox on={followUp} onChange={setFollowUp}>
        Create follow-up: review evening correction dose with Dr. Chen
      </Checkbox>
    </Modal>
  )
}

function EmsModal({ open, alert, onClose, onDone }: { open: boolean; alert: QueueAlert; onClose: () => void; onDone: () => void }) {
  const [typed, setTyped] = useState('')
  const word = alert.name.split(' ')[0].toUpperCase()
  useEffect(() => {
    if (open) setTyped('')
  }, [open])
  const ok = typed.trim().toUpperCase() === word
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={560}
      icon={
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-vlow-tint text-vlow">
          <Icon name="siren" size={22} />
        </span>
      }
      title={`Call 911 for ${alert.name}?`}
      description="You can’t undo this. Dispatch gets the following:"
      footer={
        <>
          <span className="flex-1" />
          <Button size="web" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="web" variant="destructive" disabled={!ok} onClick={onDone}>
            Call 911 now
          </Button>
        </>
      }
    >
      <div className="rounded-sm bg-canvas px-3.5 py-1">
        {(
          [
            ['pin', 'Address', '1420 Grand Ave, Apt 3B, Chicago · door code 4417'],
            ['doc', 'Summary', 'T2 on insulin · glucose 49 and falling · no response 16 min'],
            ['user', 'On scene', 'Maria Okafor (daughter) · ETA 3:31'],
            ['phone', 'Callback', 'Priya Shah, RN · (312) 555-0100'],
          ] as const
        ).map(([icon, k, v], i) => (
          <div key={k} className={cn('flex items-center gap-2.5 py-2.5', i > 0 && 'border-t border-line')}>
            <Icon name={icon} size={16} className="text-ink-2" />
            <span className="flex flex-col">
              <span className="type-small text-ink-2">{k}</span>
              <span className="type-wbody-em text-ink">{v}</span>
            </span>
          </div>
        ))}
      </div>
      <WebField label={`Type ${word} to confirm`} value={typed} onChange={setTyped} autoFocus helper="This prevents calling 911 for the wrong patient." />
    </Modal>
  )
}
