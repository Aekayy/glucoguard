import { motion } from 'motion/react'
import { useState } from 'react'

import { AGPChart, GlucoseChart, TIRBar, TRACES } from '@/components/charts/charts'
import { Glyph, Icon, type GlucoseState, type IconName } from '@/components/icons'
import { Avatar, Banner, Chip, Field, NavBar, Segmented } from '@/components/hearth/ios'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

import { Screen } from './chrome'
import { usePatient, type Log } from './state'

const KIND_ICON: Record<Log['kind'], IconName> = { meal: 'meal', insulin: 'pen', activity: 'walk', sugar: 'drop' }

const T = {
  en: {
    date: 'Tuesday, Sep 29',
    hello: 'Good morning, Denise',
    inRange: 'You’re in range and steady.',
    steady: '→ Steady · Dexcom G7 · 2 min ago',
    ago: '24 h ago',
    now: 'now',
    tir: 'In range, 14 days',
    lows: 'Lows today',
    sensor: 'Sensor left',
    days: '6 days',
    today: 'Today',
    add: 'Add',
    chip: 'In range',
  },
  es: {
    date: 'Martes, 29 sep',
    hello: 'Buenos días, Denise',
    inRange: 'Estás en rango y estable.',
    steady: '→ Estable · Dexcom G7 · hace 2 min',
    ago: 'hace 24 h',
    now: 'ahora',
    tir: 'En rango, 14 días',
    lows: 'Bajas hoy',
    sensor: 'Días de sensor',
    days: '6 días',
    today: 'Hoy',
    add: 'Agregar',
    chip: 'En rango',
  },
}

const LOG_ES: Record<string, string> = { Breakfast: 'Desayuno', Walk: 'Caminata', '6 units': '6 unidades' }

/* T1 · Today (+ T2 warming, T3 signal lost, T4 offline, M5 Spanish, L1s saved) */
export function Today() {
  const { nav, state } = usePatient()
  const t = T[state.lang]
  const mode = state.todayMode
  const es = state.lang === 'es'
  const noReading = mode === 'warming' || mode === 'signal'

  return (
    <Screen tabs gap={14}>
      <header className="flex items-center gap-2.5">
        <Avatar initials="DO" />
        <div className="flex flex-1 flex-col">
          <span className="type-footnote text-ink-2">{t.date}</span>
          <span className="type-title3 text-ink">{t.hello}</span>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => nav.push('lock-low')}
          className="press flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink"
        >
          <Icon name="bell" size={20} />
        </button>
      </header>

      {mode === 'signal' ? (
        <Banner type="warning" title="No reading for 24 minutes">
          Keep your phone within 20 ft of your sensor. Your care team is told if this lasts an hour.
        </Banner>
      ) : null}
      {mode === 'offline' ? (
        <Banner type="offline" title="You’re offline">
          Readings still arrive from your sensor, but Maria and your care team can’t be reached. We’ll send everything when you’re back.
        </Banner>
      ) : null}

      <button
        type="button"
        onClick={() => nav.reset('trends')}
        className={cn(
          'press flex flex-col gap-2 rounded-lg p-4 text-left',
          noReading ? 'border border-line bg-surface' : 'bg-tint',
        )}
      >
        <span className="type-headline text-ink">
          {mode === 'warming' ? 'Your sensor is warming up.' : mode === 'signal' ? 'We lost your sensor signal.' : t.inRange}
        </span>
        <span className="flex items-end gap-2">
          <motion.span
            key={noReading ? 'none' : 'val'}
            initial={{ opacity: 0, transform: 'translateY(6px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={cn('type-num-hero', noReading ? 'text-ink-3' : 'text-ink')}
          >
            {noReading ? '—' : '112'}
          </motion.span>
          <span className="pb-2 type-subhead text-ink-2">mg/dL</span>
          <span className="ml-auto pb-2">
            {noReading ? <Chip state="noData">{mode === 'warming' ? 'Warming up' : 'No signal'}</Chip> : <Chip state="inRange">{t.chip}</Chip>}
          </span>
        </span>
        <span className="type-footnote text-ink-2">
          {mode === 'warming'
            ? 'First reading in about 27 minutes · Dexcom G7'
            : mode === 'signal'
              ? 'Last reading 94 mg/dL at 10:18 · Dexcom G7'
              : mode === 'offline'
                ? '→ Steady · 2 min ago · last synced 10:31'
                : t.steady}
        </span>
        <GlucoseChart
          data={mode === 'warming' ? TRACES.warming : TRACES.today}
          gapFrom={mode === 'signal' ? 82 : mode === 'warming' ? 70 : undefined}
          height={84}
        />
        <span className="flex justify-between type-caption2 text-ink-3">
          <span>{t.ago}</span>
          <span>12 h</span>
          <span>{t.now}</span>
        </span>
        {mode === 'warming' ? (
          <span className="h-1.5 overflow-hidden rounded-full bg-sunken">
            <motion.span className="block h-full origin-left rounded-full bg-brand" initial={{ transform: 'scaleX(0)' }} animate={{ transform: 'scaleX(0.1)' }} transition={{ duration: 0.8 }} />
          </span>
        ) : null}
      </button>

      {mode === 'signal' ? (
        <Button variant="secondary">Troubleshoot signal</Button>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            ['74%', t.tir],
            [mode === 'warming' ? '—' : '0', t.lows],
            [t.days, t.sensor],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col gap-0.5 rounded-md border border-line bg-surface px-3.5 py-3">
              <span className="type-num-md text-ink">{v}</span>
              <span className="type-caption1 text-ink-2">{l}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-line bg-surface px-4 pt-1 pb-1">
        <div className="flex items-center justify-between pt-2.5 pb-1.5">
          <span className="type-headline text-ink">{t.today}</span>
          <button type="button" onClick={() => nav.push('log')} className="flex items-center gap-1 type-subhead-em text-brand">
            <Icon name="plus" size={16} /> {t.add}
          </button>
        </div>
        {state.logs.map((l, i) => (
          <motion.div
            key={`${l.time}-${l.label}`}
            layout
            initial={i === 0 && state.logs.length > 3 ? { opacity: 0, transform: 'translateY(-6px)' } : false}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-3 border-t border-line py-2.5"
          >
            <span className="w-9 type-footnote text-ink-2 tabular-nums">{l.time}</span>
            <Icon name={KIND_ICON[l.kind]} size={18} className="text-ink" />
            <span className="flex-1 type-subhead text-ink">{es ? (LOG_ES[l.label] ?? l.label) : l.label}</span>
            <span className="type-subhead-em text-ink">{es ? (LOG_ES[l.value] ?? l.value) : l.value}</span>
          </motion.div>
        ))}
      </div>
    </Screen>
  )
}

/* L1 · Add log (+ L1e validation → L1s toast) */
export function AddLog() {
  const { nav, set } = usePatient()
  const [kind, setKind] = useState<Log['kind']>('meal')
  const [what, setWhat] = useState('Oatmeal with berries')
  const [carbs, setCarbs] = useState('45')
  const [time, setTime] = useState('Today, 8:05 AM')
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    const n = Number(carbs.replace(/[^\d.]/g, ''))
    if (kind === 'meal' && (!carbs.trim() || Number.isNaN(n) || n < 0 || n > 300)) {
      setError('Enter a number from 0 to 300 g. Split big meals into two logs.')
      return
    }
    const entry: Log =
      kind === 'meal'
        ? { time: '8:05', kind, label: 'Breakfast', value: `${n} g carbs` }
        : kind === 'insulin'
          ? { time: '8:10', kind, label: what || 'Lispro', value: `${carbs || 4} units` }
          : kind === 'activity'
            ? { time: '7:30', kind, label: what || 'Walk', value: `${carbs || 20} min` }
            : { time: '10:44', kind, label: 'Fast sugar', value: `${carbs || 15} g` }
    set((s) => ({ logs: [entry, ...s.logs] }))
    nav.back()
    toast({ message: `${entry.label} logged · ${entry.value}`, state: 'success' })
  }

  const labels: Record<Log['kind'], [string, string, string]> = {
    meal: ['What did you eat?', 'Carbs', 'g'],
    insulin: ['Which insulin?', 'Units', 'u'],
    activity: ['What did you do?', 'Minutes', 'min'],
    sugar: ['What did you have?', 'Grams of sugar', 'g'],
  }
  const [l1, l2, unit] = labels[kind]

  return (
    <Screen bg="surface">
      <NavBar
        onBack={nav.back}
        back="Cancel"
        title="Add to today"
        right={
          <button type="button" onClick={save} className="type-headline text-brand">
            Save
          </button>
        }
      />
      <Segmented
        label="Log type"
        size="sm"
        value={kind}
        onChange={(k) => {
          setKind(k)
          setError(null)
          setWhat(k === 'meal' ? 'Oatmeal with berries' : k === 'insulin' ? 'Lispro' : k === 'activity' ? 'Walk' : '½ cup juice')
          setCarbs(k === 'meal' ? '45' : k === 'insulin' ? '4' : k === 'activity' ? '25' : '15')
        }}
        options={[
          { value: 'meal', label: 'Food' },
          { value: 'insulin', label: 'Insulin' },
          { value: 'activity', label: 'Activity' },
          { value: 'sugar', label: 'Fast sugar' },
        ]}
      />
      <Field label={l1} value={what} onChange={setWhat} />
      <Field
        label={l2}
        value={carbs}
        onChange={(v) => {
          setCarbs(v)
          if (error) setError(null)
        }}
        inputMode="decimal"
        error={error}
        helper={kind === 'meal' ? 'Not sure? Tap to see common foods. (Try 450 to see the error.)' : undefined}
        suffix={<span className="type-body text-ink-2">{unit}</span>}
        onEnter={save}
      />
      <Field label="Time" value={time} onChange={setTime} />
      <div className="flex items-start gap-2.5 rounded-md bg-canvas p-3.5">
        <Icon name="care" size={20} className="shrink-0 text-ink-2" />
        <span className="type-footnote text-ink-2">Logs are shared with Jewish Healthcare Foundation so your care team can spot patterns.</span>
      </div>
    </Screen>
  )
}

/* R1 · Trends (+ R2 empty) */
const TIR_BY_RANGE = {
  '7': { tir: 74, parts: [0, 3, 74, 18, 5] as [number, number, number, number, number] },
  '14': { tir: 71, parts: [1, 4, 71, 19, 5] as [number, number, number, number, number] },
  '30': { tir: 69, parts: [1, 4, 69, 20, 6] as [number, number, number, number, number] },
  '90': { tir: 66, parts: [1, 5, 66, 21, 7] as [number, number, number, number, number] },
}

export function Trends() {
  const { nav, state } = usePatient()
  const [range, setRange] = useState<'7' | '14' | '30' | '90'>('14')
  if (!state.trendsReady) return <TrendsEmpty />
  const r = TIR_BY_RANGE[range]
  const legend: [GlucoseState, string, string, number][] = [
    ['veryHigh', 'Very high', 'over 250', r.parts[4]],
    ['high', 'High', '181–250', r.parts[3]],
    ['inRange', 'In range', '70–180', r.parts[2]],
    ['low', 'Low', '54–69', r.parts[1]],
    ['veryLow', 'Very low', 'under 54', r.parts[0]],
  ]
  const ink: Record<GlucoseState, string> = { veryHigh: 'text-vhigh', high: 'text-high', inRange: 'text-inr', low: 'text-low', veryLow: 'text-vlow', noData: 'text-nod' }
  return (
    <Screen tabs gap={10}>
      <div className="flex items-center justify-between">
        <h1 className="type-large-title text-ink">Trends</h1>
        <button type="button" onClick={() => toast({ message: 'Report shared with your JHF care team', state: 'success' })} className="flex items-center gap-1 type-subhead-em text-brand">
          <Icon name="share" size={18} /> Share
        </button>
      </div>
      <Segmented
        label="Range"
        size="sm"
        value={range}
        onChange={setRange}
        options={[
          { value: '7', label: '7 days' },
          { value: '14', label: '14 days' },
          { value: '30', label: '30 days' },
          { value: '90', label: '90 days' },
        ]}
      />
      <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-baseline gap-2">
          <motion.span key={r.tir} initial={{ opacity: 0, transform: 'translateY(4px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} className="type-num-lg text-ink">
            {r.tir}%
          </motion.span>
          <span className="type-subhead text-ink-2">time in range</span>
          <span className={cn('ml-auto type-footnote-em', r.tir >= 70 ? 'text-inr' : 'text-high')}>{r.tir >= 70 ? 'Goal over 70%' : 'Goal is 70%'}</span>
        </div>
        <TIRBar key={range} parts={r.parts} />
        {legend.map(([s, label, band, pct]) => (
          <div key={s} className="flex items-center gap-2">
            <Glyph state={s} className={ink[s]} />
            <span className="type-footnote-em text-ink">{label}</span>
            <span className="type-footnote text-ink-2">{band}</span>
            <span className="ml-auto type-footnote-em text-ink tabular-nums">{pct}%</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="type-headline text-ink">Daily pattern</span>
          <span className="type-caption1 text-ink-2">median · 25–75% · 5–95%</span>
        </div>
        <AGPChart />
        <span className="flex justify-between type-caption2 text-ink-3">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </span>
      </div>
      <div className="flex flex-col gap-1.5 rounded-lg bg-tint p-4">
        <span className="type-eyebrow text-brand">Pattern found</span>
        <span className="type-headline text-ink">Lows cluster between 2 and 4 AM</span>
        <span className="type-footnote text-ink-2">
          3 of your 4 lows came 4–5 hours after an evening correction dose. Talk to your care team before changing a dose.
        </span>
        <button type="button" onClick={() => nav.push('messages')} className="mt-1 flex items-center gap-1.5 type-footnote-em text-brand">
          <Icon name="msg" size={16} /> Ask Priya about this
        </button>
      </div>
      <button type="button" onClick={() => nav.push('lows')} className="flex items-center justify-between py-1 type-subhead-em text-brand">
        See all 4 lows
        <Icon name="chevR" size={18} />
      </button>
    </Screen>
  )
}

function TrendsEmpty() {
  return (
    <Screen tabs>
      <h1 className="type-large-title text-ink">Trends</h1>
      <span className="flex size-[88px] items-center justify-center rounded-full bg-tint text-brand">
        <Icon name="chart" size={40} />
      </span>
      <h2 className="type-title2 text-ink">Your trends appear after 5 days</h2>
      <p className="type-body text-ink-2">We need a few days of readings to show patterns you can trust. Alerts already work.</p>
      <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-4">
        <div className="flex justify-between">
          <span className="type-headline text-ink">2 of 5 days</span>
          <span className="type-footnote text-ink-2">Ready Friday</span>
        </div>
        <div className="flex gap-1">
          {[1, 1, 0, 0, 0].map((on, i) => (
            <span key={i} className={cn('h-2 flex-1 rounded-full', on ? 'bg-brand' : 'bg-sunken')} />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface px-4 py-1">
        {['Time in range and your goal', 'When lows tend to happen', 'A report to share with your doctor'].map((s, i) => (
          <div key={s} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}>
            <Icon name="checkc" size={20} className="text-ink-3" />
            <span className="type-subhead-em text-ink">{s}</span>
          </div>
        ))}
      </div>
    </Screen>
  )
}

/* R3 · Lows history */
export function Lows() {
  const { nav } = usePatient()
  const rows: [GlucoseState, string, string][] = [
    ['veryLow', 'Wed, Sep 30 · 3:03 AM', 'Lowest 47 mg/dL · lasted 32 min'],
    ['low', 'Sat, Sep 26 · 2:40 AM', 'Lowest 61 mg/dL · lasted 21 min'],
    ['low', 'Tue, Sep 22 · 10:42 AM', 'Lowest 64 mg/dL · lasted 15 min'],
    ['low', 'Sun, Sep 20 · 3:15 AM', 'Lowest 66 mg/dL · lasted 18 min'],
  ]
  return (
    <Screen tabs>
      <NavBar onBack={nav.back} back="Trends" title="Lows" />
      <h1 className="type-title1 text-ink">4 lows in 14 days</h1>
      <p className="type-subhead text-ink-2">1 very low · 3 low. Each one was shared with your care team.</p>
      <div className="rounded-lg border border-line bg-surface px-4 py-0.5">
        {rows.map(([s, d, m], i) => (
          <button
            key={d}
            type="button"
            onClick={() => (i === 0 ? nav.push('summary') : undefined)}
            className={cn('flex w-full items-center gap-3 py-3 text-left', i > 0 && 'border-t border-line')}
          >
            <Glyph state={s} size={14} className={s === 'veryLow' ? 'text-vlow' : 'text-low'} />
            <span className="flex flex-1 flex-col">
              <span className="type-subhead-em text-ink">{d}</span>
              <span className="type-footnote text-ink-2">{m}</span>
            </span>
            <Icon name="chevR" size={18} className="text-ink-3" />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 rounded-lg bg-tint p-4">
        <span className="flex items-center gap-2 type-headline text-ink">
          <Icon name="moon" size={18} className="text-brand" /> 3 of 4 lows were overnight
        </span>
        <span className="type-footnote text-ink-2">Dr. Chen changed your evening correction dose on Sep 30. We’ll show you whether it helped.</span>
      </div>
    </Screen>
  )
}
