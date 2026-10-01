import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Glyph, HeldMark, Icon, type IconName } from '@/components/icons'
import { Avatar, Banner, Card, Chip, Field, NavBar, Progress, Row, Rows, Segmented, StatusCircle, Toggle } from '@/components/hearth/ios'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { playSound } from '@/components/ui/sound'
import { cn } from '@/lib/utils'

import { CareCircleIllustration } from './care-circle'
import { Bottom, Screen } from './chrome'
import { usePatient } from './state'

/* O1 · Launch */
export function Launch() {
  const { nav } = usePatient()
  useEffect(() => {
    const t = setTimeout(() => nav.replace('welcome'), 1800)
    return () => clearTimeout(t)
  }, [nav])
  return (
    <button type="button" onClick={() => nav.replace('welcome')} className="absolute inset-0 flex flex-col items-center bg-brand px-8 pb-10 text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, transform: 'scale(0.92)' }}
          animate={{ opacity: 1, transform: 'scale(1)' }}
          transition={{ type: 'spring', duration: 0.7, bounce: 0.2 }}
        >
          <HeldMark size={96} className="text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, transform: 'translateY(6px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="flex flex-col items-center gap-2">
          <span className="type-large-title">GlucoGuard</span>
          <span className="type-body opacity-85">Watching over you, at home.</span>
        </motion.div>
      </div>
      <span className="type-footnote opacity-75">For people using insulin, with a CGM</span>
    </button>
  )
}

/* O2 · Welcome */
export function Welcome() {
  const { nav, state, set } = usePatient()
  const lines: [IconName, string][] = [
    ['sensor', 'Works with Dexcom, FreeStyle Libre and Medtronic'],
    ['care', 'Your care team sees what you see'],
    ['lock', 'Private by default. You choose who’s in.'],
  ]
  return (
    <Screen>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => set({ lang: state.lang === 'en' ? 'es' : 'en' })}
          className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface pr-3 pl-2.5 type-footnote-em text-ink"
        >
          <Icon name="globe" size={16} />
          <span className={state.lang === 'en' ? 'text-ink' : 'text-ink-3'}>English</span>·
          <span className={state.lang === 'es' ? 'text-ink' : 'text-ink-3'}>Español</span>
        </button>
      </div>
      <CareCircleIllustration />
      <h1 className="type-large-title text-ink">Help reaches you, even at 3 a.m.</h1>
      <p className="type-body text-ink-2">
        GlucoGuard watches your CGM. If a low goes unanswered, it calls the people you chose, then your care team.
      </p>
      <div className="flex flex-col gap-3">
        {lines.map(([icon, text]) => (
          <div key={text} className="flex items-start gap-3">
            <Icon name={icon} size={22} className="shrink-0 text-brand" />
            <span className="type-subhead text-ink">{text}</span>
          </div>
        ))}
      </div>
      <Bottom>
        <Button onClick={() => nav.push('account')}>Get started</Button>
        <Button variant="plain" onClick={() => nav.reset('today')}>
          I already have an account
        </Button>
      </Bottom>
    </Screen>
  )
}

/* O3 · Create account (+ O3e errors) */
export function Account() {
  const { nav } = usePatient()
  const [email, setEmail] = useState('denise.okafor@mail.com')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const submit = () => {
    const next: typeof errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter an email like name@example.com.'
    else if (email.trim().toLowerCase() === 'taken@mail.com') next.email = 'This email already has an account. Sign in instead.'
    if (password.length < 8 || !/\d/.test(password)) next.password = 'Use at least 8 characters, including a number.'
    setErrors(next)
    if (!next.email && !next.password) nav.push('join')
  }

  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={1} />
      <h1 className="type-large-title text-ink">Create your account</h1>
      <button
        type="button"
        onClick={() => nav.push('join')}
        className="press flex h-[52px] items-center justify-center gap-2 rounded-md bg-ink type-headline text-surface"
      >
        <svg width="16" height="19" viewBox="0 0 17 20" aria-hidden><path fill="currentColor" d="M14.2 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.8-4.1ZM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" /></svg>
        Continue with Apple
      </button>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="type-footnote text-ink-2">or with email</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Field label="Email" value={email} onChange={setEmail} type="email" error={errors.email} />
      <Field
        label="Password"
        value={password}
        onChange={setPassword}
        type="password"
        placeholder="At least 8 characters"
        helper="At least 8 characters, including a number."
        error={errors.password}
        onEnter={submit}
      />
      <Bottom>
        <p className="type-footnote text-ink-2">By continuing you agree to the Terms and the HIPAA privacy notice.</p>
        <Button onClick={submit}>Create account</Button>
      </Bottom>
    </Screen>
  )
}

/* O4 · Join program — 6-character clinic code (Input OTP) + O4e / O4s */
export function Join() {
  const { nav } = usePatient()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'invalid' | 'ok'>('idle')

  useEffect(() => {
    if (code.length < 6) {
      setStatus('idle')
      return
    }
    setStatus('checking')
    const t = setTimeout(() => {
      if (code === 'NS472K') {
        setStatus('ok')
        setTimeout(() => nav.push('join-found'), 750)
      } else setStatus('invalid')
    }, 900)
    return () => clearTimeout(t)
  }, [code, nav])

  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={2} />
      <h1 className="type-large-title text-ink">Join your care program</h1>
      <p className="type-body text-ink-2">Your clinic gave you a 6-character code on paper or by text.</p>
      <InputOTP
        maxLength={6}
        mode="alphanumeric"
        value={code}
        onChange={setCode}
        autoFocus
        aria-invalid={status === 'invalid' || undefined}
        success={status === 'ok'}
        aria-label="Clinic code"
      >
        <InputOTPGroup>
          {Array.from({ length: 6 }, (_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <AnimatePresence mode="popLayout" initial={false}>
        {status === 'invalid' ? (
          <motion.div
            key="err"
            initial={{ opacity: 0, transform: 'translateY(-4px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 type-footnote text-low"
          >
            <Icon name="alert" size={18} className="shrink-0" />
            This code expired on Sep 20. Ask Northside Health for a new one, or call (312) 555-0142.
          </motion.div>
        ) : (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="type-footnote text-ink-3">
            {status === 'checking' ? 'Checking with Northside…' : 'Demo code: NS472K'}
          </motion.p>
        )}
      </AnimatePresence>
      <Button
        variant="secondary"
        onClick={() => {
          setCode('NS472K')
          playSound('copy')
        }}
      >
        Scan the QR code instead
      </Button>
      <Bottom>
        <Button disabled={status !== 'ok'} onClick={() => nav.push('join-found')}>
          Continue
        </Button>
      </Bottom>
    </Screen>
  )
}

export function JoinFound() {
  const { nav } = usePatient()
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={2} />
      <h1 className="type-large-title text-ink">Is this your clinic?</h1>
      <Card className="flex flex-col gap-3.5 p-[18px]">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-md bg-sage text-ink">
            <Icon name="clinic" size={24} />
          </span>
          <div className="flex flex-col">
            <span className="type-headline text-ink">Northside Health</span>
            <span className="type-footnote text-ink-2">Endocrinology · Remote monitoring</span>
          </div>
        </div>
        <span className="flex w-fit items-center gap-1.5 rounded-full bg-inr-tint py-[5px] pr-2.5 pl-2 type-footnote-em text-ink">
          <Icon name="checkc" size={14} className="text-inr" /> Verified clinic
        </span>
        {[
          ['Your doctor', 'Dr. Wen Chen, MD'],
          ['Care coordinator', 'Priya Shah, RN'],
          ['On call', '24 hours, every day'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-t border-line pt-2.5">
            <span className="type-subhead text-ink-2">{k}</span>
            <span className="type-subhead-em text-ink">{v}</span>
          </div>
        ))}
      </Card>
      <p className="type-subhead text-ink-2">Northside will see your glucose readings, alerts and logs. Next you’ll choose what else to share.</p>
      <Bottom>
        <Button onClick={() => nav.push('consent')}>Yes, join Northside</Button>
        <Button variant="plain" onClick={nav.back}>
          This isn’t my clinic
        </Button>
      </Bottom>
    </Screen>
  )
}

/* O5 · Consent */
export function Consent() {
  const { nav, state, set } = usePatient()
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={3} />
      <h1 className="type-large-title text-ink">Who sees your data</h1>
      <p className="type-body text-ink-2">You’re in control. You can change this any time in Me › Privacy.</p>
      <div className="rounded-lg border border-line bg-surface">
        {[
          { k: 'team', t: 'Northside care team', d: 'Readings, alerts, logs and trends. Needed for the program.', on: true, locked: true },
          { k: 'circle', t: 'Your care circle', d: 'Only urgent alerts, never your history.', on: state.consent.circle },
          { k: 'research', t: 'Research (anonymous)', d: 'Helps improve hypoglycemia care. No name, no contact.', on: state.consent.research },
        ].map((r, i) => (
          <div key={r.k} className={cn('flex items-center gap-3 p-4', i > 0 && 'border-t border-line')}>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 type-headline text-ink">
                {r.t}
                {r.locked ? <Icon name="lock" size={14} className="text-ink-2" /> : null}
              </span>
              <span className="type-footnote text-ink-2">{r.d}</span>
            </div>
            <Toggle
              on={r.on}
              disabled={r.locked}
              label={r.t}
              onChange={(on) => set((s) => ({ consent: { ...s.consent, [r.k]: on } }))}
            />
          </div>
        ))}
      </div>
      <button type="button" className="flex items-center gap-1.5 type-subhead-em text-brand">
        <Icon name="doc" size={16} /> Read the full HIPAA privacy notice
      </button>
      <Bottom>
        <Button onClick={() => nav.push('about')}>I agree</Button>
      </Bottom>
    </Screen>
  )
}

/* O6 · About you */
export function About() {
  const { nav, state, set } = usePatient()
  const [name, setName] = useState('Denise')
  const [dob, setDob] = useState('March 11, 1959')
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={4} />
      <h1 className="type-large-title text-ink">About you</h1>
      <p className="type-body text-ink-2">This helps your care team and sets safe defaults.</p>
      <Field label="First name" value={name} onChange={setName} />
      <Field label="Date of birth" value={dob} onChange={setDob} />
      <div className="flex flex-col gap-1.5">
        <span className="type-footnote-em text-ink-2">Diabetes type</span>
        <Segmented
          label="Diabetes type"
          value={state.profile.type}
          onChange={(v) => set((s) => ({ profile: { ...s.profile, type: v } }))}
          options={[{ value: 'Type 1', label: 'Type 1' }, { value: 'Type 2', label: 'Type 2' }, { value: 'Other', label: 'Other' }]}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="type-footnote-em text-ink-2">Do you use insulin?</span>
        <Segmented
          label="Insulin"
          value={state.profile.insulin}
          onChange={(v) => set((s) => ({ profile: { ...s.profile, insulin: v } }))}
          options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="type-footnote-em text-ink-2">Language</span>
        <Segmented
          label="Language"
          value={state.profile.language}
          onChange={(v) => set((s) => ({ profile: { ...s.profile, language: v }, lang: v === 'Español' ? 'es' : 'en' }))}
          options={[{ value: 'English', label: 'English' }, { value: 'Español', label: 'Español' }]}
        />
      </div>
      <Bottom>
        <Button disabled={!name.trim()} onClick={() => nav.push('cgm')}>
          Continue
        </Button>
      </Bottom>
    </Screen>
  )
}

/* O7 · Connect CGM → O7l → O7f / O7s */
const DEVICES = [
  ['Dexcom', 'G6 · G7 · ONE+'],
  ['FreeStyle Libre', 'Libre 2 · Libre 3'],
  ['Medtronic', 'Guardian 4 · Simplera'],
  ['Eversense', 'Eversense 365'],
] as const

export function Cgm() {
  const { nav } = usePatient()
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={5} />
      <h1 className="type-large-title text-ink">Connect your CGM</h1>
      <p className="type-body text-ink-2">GlucoGuard reads from the app you already use. No new sensor needed.</p>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {DEVICES.map(([name, models], i) => (
          <button
            key={name}
            type="button"
            onClick={() => nav.push('cgm-connecting')}
            className={cn('flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-sunken', i === 0 ? 'bg-tint' : 'border-t border-line')}
          >
            <span className={cn('flex size-10 items-center justify-center rounded-full', i === 0 ? 'bg-surface text-brand' : 'bg-sunken text-ink-2')}>
              <Icon name="sensor" size={18} />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="type-headline text-ink">{name}</span>
              <span className="type-footnote text-ink-2">{models}</span>
            </span>
            <Icon name="chevR" size={18} className={i === 0 ? 'text-brand' : 'text-ink-3'} />
          </button>
        ))}
      </div>
      <button type="button" className="text-left type-subhead-em text-brand">
        My device isn’t listed
      </button>
      <Bottom>
        <div className="flex items-start gap-2 type-footnote text-ink-2">
          <Icon name="lock" size={16} className="shrink-0" />
          We read data through each maker’s official sharing service. We never change your device settings.
        </div>
      </Bottom>
    </Screen>
  )
}

export function CgmConnecting() {
  const { nav, state, set } = usePatient()
  const [step, setStep] = useState(0)
  const fails = state.connectAttempts === 0
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 900),
      setTimeout(() => {
        if (fails) {
          set({ connectAttempts: 1 })
          playSound('error')
          nav.replace('cgm-failed')
        } else setStep(2)
      }, 2100),
      !fails ? setTimeout(() => nav.replace('cgm-connected'), 3200) : undefined,
    ]
    return () => timers.forEach((t) => t && clearTimeout(t))
  }, [fails, nav, set])

  const steps: [string][] = [['Signed in to Dexcom'], ['Checking data sharing is on'], ['Reading your last 24 hours']]
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={5} />
      <div className="flex flex-col items-center gap-4 pt-10 text-center">
        <span className="relative flex size-24 items-center justify-center">
          <svg width="96" height="96" className="status-spin" aria-hidden>
            <circle cx="48" cy="48" r="40" fill="none" stroke="var(--tint)" strokeWidth="8" />
            <path d="M48 8a40 40 0 0 1 40 40" fill="none" stroke="var(--brand)" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="type-title2 text-ink">Connecting to Dexcom…</h1>
        <p className="type-body text-ink-2">This usually takes less than 30 seconds.</p>
      </div>
      <div className="rounded-lg border border-line bg-surface px-4 py-1">
        {steps.map(([label], i) => {
          const done = i < step
          const active = i === step
          return (
            <div key={label} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={done ? 'done' : active ? 'active' : 'idle'}
                  initial={{ opacity: 0, transform: 'scale(0.8)' }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(done ? 'text-inr' : active ? 'text-brand' : 'text-ink-3')}
                >
                  <Icon name={done ? 'checkc' : active ? 'clock' : 'sensor'} size={20} />
                </motion.span>
              </AnimatePresence>
              <span className={cn(active ? 'type-subhead-em text-ink' : done ? 'type-subhead text-ink' : 'type-subhead text-ink-3')}>{label}</span>
            </div>
          )
        })}
      </div>
      <Bottom>
        <Button variant="plain" onClick={nav.back}>
          Cancel
        </Button>
      </Bottom>
    </Screen>
  )
}

export function CgmFailed() {
  const { nav } = usePatient()
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={5} />
      <StatusCircle tone="low" icon="alert" />
      <h1 className="type-large-title text-ink">Dexcom isn’t sharing yet</h1>
      <p className="type-body text-ink-2">Your Dexcom account connected, but data sharing is off, so we can’t see readings.</p>
      <div className="rounded-lg border border-line bg-surface px-4 py-1">
        {['Open the Dexcom app', 'Tap Connections › Partner apps', 'Turn on GlucoGuard, then come back'].map((s, i) => (
          <div key={s} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}>
            <span className="flex size-[26px] items-center justify-center rounded-full bg-tint type-footnote-em text-brand">{i + 1}</span>
            <span className="type-subhead text-ink">{s}</span>
          </div>
        ))}
      </div>
      <Bottom>
        <Button variant="secondary">Open Dexcom</Button>
        <Button onClick={() => nav.replace('cgm-connecting')}>Try again</Button>
        <Button variant="plain">Get help from Northside</Button>
      </Bottom>
    </Screen>
  )
}

export function CgmConnected() {
  const { nav } = usePatient()
  useEffect(() => playSound('success'), [])
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={5} />
      <StatusCircle tone="inr" icon="checkc" />
      <h1 className="type-large-title text-ink">Connected to Dexcom G7</h1>
      <p className="type-body text-ink-2">We’ll check for a new reading every 5 minutes, day and night.</p>
      <Card className="flex flex-col gap-2.5 p-[18px]">
        <div className="flex items-center gap-2">
          <span className="type-num-lg text-ink">112</span>
          <span className="type-subhead text-ink-2">mg/dL</span>
          <Chip state="inRange" className="ml-auto" />
        </div>
        <span className="type-footnote text-ink-2">→ Steady · 2 min ago</span>
        {[
          ['Sensor', 'Day 4 of 10'],
          ['Data sharing', 'On'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between border-t border-line pt-2.5">
            <span className="type-subhead text-ink-2">{k}</span>
            <span className="type-subhead-em text-ink">{v}</span>
          </div>
        ))}
      </Card>
      <Bottom>
        <Button onClick={() => nav.push('levels-onb')}>Continue</Button>
      </Bottom>
    </Screen>
  )
}

/* O8 · Alert levels — stricter, never looser */
function Stepper({ value, min, max, step = 5, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex h-9 items-center rounded-md bg-sunken" role="group" aria-label={label}>
      <button type="button" aria-label={`Lower ${label}`} disabled={value <= min} onClick={() => onChange(value - step)} className="flex h-full w-9 items-center justify-center text-ink disabled:text-ink-3">
        <Icon name="minus" size={16} />
      </button>
      <span className="min-w-10 text-center type-headline text-ink tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label={`Raise ${label}`} disabled={value >= max} onClick={() => onChange(value + step)} className="flex h-full w-9 items-center justify-center text-ink disabled:text-ink-3">
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

export function LevelsOnboarding() {
  const { nav, state, set } = usePatient()
  const L = state.levels
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={6} />
      <h1 className="type-large-title text-ink">When should we alert you?</h1>
      <p className="type-body text-ink-2">Your care team set safe limits. You can make them stricter, not looser.</p>
      <Rows>
        <Row first>
          <div className="flex flex-1 flex-col">
            <span className="flex items-center gap-1.5 type-headline text-ink">
              <Glyph state="low" className="text-low" />Low alert
            </span>
            <span className="type-footnote text-ink-2">Below this, we alert you</span>
          </div>
          <Stepper label="low alert" value={L.low} min={70} max={90} onChange={(v) => set((s) => ({ levels: { ...s.levels, low: v } }))} />
        </Row>
        <Row>
          <div className="flex flex-1 flex-col">
            <span className="flex items-center gap-1.5 type-headline text-ink">
              <Glyph state="veryLow" className="text-vlow" />Urgent low
            </span>
            <span className="type-footnote text-ink-2">Set by Dr. Chen · can’t go lower</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1.5 type-subhead-em text-ink">
            <Icon name="lock" size={14} className="text-ink-2" />
            54
          </span>
        </Row>
        <Row>
          <div className="flex flex-1 flex-col">
            <span className="flex items-center gap-1.5 type-headline text-ink">
              <Glyph state="high" className="text-high" />High alert
            </span>
            <span className="type-footnote text-ink-2">Above this, we alert you</span>
          </div>
          <Stepper label="high alert" value={L.high} min={180} max={250} step={10} onChange={(v) => set((s) => ({ levels: { ...s.levels, high: v } }))} />
        </Row>
        <Row>
          <div className="flex flex-1 flex-col">
            <span className="type-headline text-ink">Signal loss</span>
            <span className="type-footnote text-ink-2">Alert if no reading for 20 min</span>
          </div>
          <Toggle label="Signal loss alert" on={L.signalLoss} onChange={(on) => set((s) => ({ levels: { ...s.levels, signalLoss: on } }))} />
        </Row>
      </Rows>
      <Bottom>
        <Button onClick={() => nav.push('invite')}>Continue</Button>
      </Bottom>
    </Screen>
  )
}

/* O9 · Care circle invite (+ O9e) → O9s */
export function Invite() {
  const { nav, set } = usePatient()
  const [name, setName] = useState('Maria Okafor')
  const [rel, setRel] = useState('Daughter')
  const [phone, setPhone] = useState('(312) 555-018')
  const [sms, setSms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const send = () => {
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a 10-digit US mobile number.')
      return
    }
    setError(null)
    set({ maria: 'pending' })
    nav.push('invite-sent')
  }
  return (
    <Screen>
      <NavBar onBack={nav.back} right={<button type="button" onClick={() => nav.push('critical')} className="type-body text-brand">Skip</button>} />
      <Progress step={7} />
      <h1 className="type-large-title text-ink">Who should we call if you don’t answer?</h1>
      <p className="type-subhead text-ink-2">We only contact them for an urgent low you haven’t responded to.</p>
      <Field label="Name" value={name} onChange={setName} />
      <Field label="Relationship" value={rel} onChange={setRel} />
      <Field label="Mobile number" value={phone} onChange={setPhone} inputMode="tel" error={error} helper="Tip: add the last digit (7) to send" onEnter={send} />
      <div className="flex items-center justify-between">
        <span className="type-body text-ink">Also send a text message</span>
        <Toggle label="Also send a text message" on={sms} onChange={setSms} />
      </div>
      <Bottom>
        <Button onClick={send}>Send invite</Button>
      </Bottom>
    </Screen>
  )
}

export function InviteSent() {
  const { nav, state } = usePatient()
  useEffect(() => playSound('success'), [])
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={7} />
      <StatusCircle tone="inr" icon="msg" />
      <h1 className="type-large-title text-ink">Invite sent to Maria</h1>
      <p className="type-body text-ink-2">She gets a text with a link. She can accept without downloading the app.</p>
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar initials="MO" tone="sage" />
          <div className="flex flex-1 flex-col">
            <span className="type-headline text-ink">Maria Okafor</span>
            <span className="type-footnote text-ink-2">Daughter · (312) 555-0187</span>
          </div>
          <span className={cn('flex items-center gap-1.5 rounded-full py-[5px] pr-2.5 pl-2 type-footnote-em text-ink', state.maria === 'accepted' ? 'bg-inr-tint' : 'bg-high-tint')}>
            <Icon name={state.maria === 'accepted' ? 'checkc' : 'clock'} size={14} className={state.maria === 'accepted' ? 'text-inr' : 'text-high'} />
            {state.maria === 'accepted' ? 'Accepted' : 'Pending'}
          </span>
        </div>
        <Banner type="info" title="Until Maria accepts">
          Your care team is still alerted if a low goes unanswered.
        </Banner>
      </Card>
      <Bottom>
        <Button variant="secondary">Add another person</Button>
        <Button onClick={() => nav.push('critical')}>Continue</Button>
      </Bottom>
    </Screen>
  )
}

/* O10 · Critical Alerts → O10p system prompt → O10d */
function LockIllustration() {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-tint p-[18px]" aria-hidden>
      <div className="flex items-center gap-2 type-footnote-em text-ink-2">
        <Icon name="belloff" size={16} /> Silent mode on · 3:13 AM
      </div>
      <motion.div
        initial={{ opacity: 0, transform: 'translateY(-8px)' }}
        animate={{ opacity: 1, transform: 'translateY(0)' }}
        transition={{ delay: 0.3, type: 'spring', duration: 0.5, bounce: 0.2 }}
        className="flex flex-col gap-1 rounded-md bg-surface p-3 shadow-card"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-[5px] bg-brand text-on-brand">
            <HeldMark size={13} />
          </span>
          <span className="type-caption2 text-ink-2">GLUCOGUARD</span>
          <span className="rounded-[4px] bg-vlow px-1.5 py-px type-caption2 text-white">CRITICAL</span>
          <span className="ml-auto type-caption2 text-ink-3">now</span>
        </div>
        <span className="type-subhead-em text-ink">Urgent low · 49 mg/dL ↓↓</span>
        <span className="type-footnote text-ink-2">Sound plays even on silent.</span>
      </motion.div>
    </div>
  )
}

export function CriticalAlerts() {
  const { nav, set } = usePatient()
  const [prompt, setPrompt] = useState(false)
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={8} />
      <LockIllustration />
      <h1 className="type-large-title text-ink">Let urgent alerts through, even on silent</h1>
      <p className="type-body text-ink-2">Critical Alerts play a sound when your phone is on silent or Focus is on. We only use them for urgent lows.</p>
      <div className="rounded-lg border border-line bg-surface px-4 py-1">
        {[
          ['bell', 'Only urgent lows (under 54)', 'Everything else respects silent mode'],
          ['vibrate', 'Sound and vibration at full volume', 'Until you respond or someone is reached'],
        ].map(([icon, t, d], i) => (
          <div key={t} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}>
            <Icon name={icon as IconName} size={20} className="text-brand" />
            <div className="flex flex-col">
              <span className="type-subhead-em text-ink">{t}</span>
              <span className="type-footnote text-ink-2">{d}</span>
            </div>
          </div>
        ))}
      </div>
      <Bottom>
        <Button onClick={() => setPrompt(true)}>Allow Critical Alerts</Button>
        <Button
          variant="plain"
          onClick={() => {
            set({ criticalAlerts: 'denied' })
            nav.push('critical-denied')
          }}
        >
          Not now
        </Button>
      </Bottom>
      <AnimatePresence>
        {prompt ? (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div
              role="alertdialog"
              aria-label="Allow critical alerts"
              initial={{ opacity: 0, transform: 'scale(1.08)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              exit={{ opacity: 0, transform: 'scale(0.96)' }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="w-[270px] overflow-hidden rounded-[14px] bg-surface/95 text-center backdrop-blur-xl"
            >
              <div className="flex flex-col gap-1 px-4 pt-5 pb-4">
                <span className="type-headline text-ink">“GlucoGuard” Would Like to Send You Critical Alerts</span>
                <span className="type-footnote text-ink">
                  Critical alerts always play a sound and appear on the lock screen, even if the iPhone is muted or Focus is on.
                </span>
              </div>
              <div className="grid grid-cols-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    setPrompt(false)
                    set({ criticalAlerts: 'denied' })
                    nav.push('critical-denied')
                  }}
                  className="border-r border-line py-3 type-body text-info"
                >
                  Don’t Allow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt(false)
                    set({ criticalAlerts: 'allowed' })
                    nav.push('practice')
                  }}
                  className="py-3 type-headline text-info"
                >
                  Allow
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Screen>
  )
}

export function CriticalDenied() {
  const { nav, set } = usePatient()
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <Progress step={8} />
      <StatusCircle tone="high" icon="belloff" />
      <h1 className="type-large-title text-ink">Critical Alerts are off</h1>
      <p className="type-body text-ink-2">
        Silent mode and Focus will mute urgent lows. Maria and your care team will still be called if you don’t respond.
      </p>
      <Banner type="warning" title="You can turn this on any time">
        Settings › GlucoGuard › Notifications › Critical Alerts.
      </Banner>
      <Bottom>
        <Button
          onClick={() => {
            set({ criticalAlerts: 'allowed' })
            nav.push('practice')
          }}
        >
          Open Settings
        </Button>
        <Button variant="plain" onClick={() => nav.push('practice')}>
          Continue without
        </Button>
      </Bottom>
    </Screen>
  )
}

/* O11 · Practice alert → O11s */
export function Practice() {
  const { nav } = usePatient()
  const [sending, setSending] = useState(false)
  const send = () => {
    setSending(true)
    playSound('lowAlert')
    setTimeout(() => nav.replace('practice-done'), 1900)
  }
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <h1 className="type-large-title text-ink">Try a practice alert</h1>
      <p className="type-body text-ink-2">
        We’ll send a test to you and a test text to Maria, clearly marked “practice”. Nobody else is contacted.
      </p>
      <PracticeList done={false} />
      <Bottom>
        <Button onClick={send} disabled={sending}>
          {sending ? 'Sending…' : 'Send practice alert'}
        </Button>
        <Button variant="plain" onClick={() => nav.push('protected')}>
          Skip
        </Button>
      </Bottom>
      <AnimatePresence>
        {sending ? (
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(-110%)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            exit={{ opacity: 0, transform: 'translateY(-110%)' }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="absolute inset-x-2 top-12 z-50 flex flex-col gap-1 rounded-[22px] bg-surface/95 p-3.5 shadow-[0_12px_32px_rgb(0_0_0/0.18)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-[5px] bg-brand text-on-brand">
                <HeldMark size={13} />
              </span>
              <span className="type-caption2 text-ink-2">GLUCOGUARD · PRACTICE</span>
              <span className="ml-auto type-caption2 text-ink-3">now</span>
            </div>
            <span className="type-subhead-em text-ink">Practice: Low · 64 mg/dL ↘</span>
            <span className="type-footnote text-ink-2">This is a test. In a real low you’d see what to do next.</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Screen>
  )
}

function PracticeList({ done }: { done: boolean }) {
  const rows: [string, string, string][] = done
    ? [
        ['You get a practice alert', 'Delivered 10:41 · sound played', 'ok'],
        ['Maria gets a practice text', 'Delivered 10:41 · Maria replied “Got it”', 'ok'],
        ['Your care team is not contacted', 'Practice alerts stay on your phone', 'clinic'],
      ]
    : [
        ['You get a practice alert', 'Sound plays, even on silent', 'bell'],
        ['Maria gets a practice text', 'Marked as a practice, no action needed', 'msg'],
        ['Your care team is not contacted', 'Practice alerts stay on your phone', 'clinic'],
      ]
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-1">
      {rows.map(([t, d, icon], i) => (
        <motion.div
          key={t}
          initial={done ? { opacity: 0, transform: 'translateY(6px)' } : false}
          animate={{ opacity: 1, transform: 'translateY(0)' }}
          transition={{ delay: i * 0.25, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}
        >
          <Icon
            name={icon === 'ok' ? 'checkc' : (icon as IconName)}
            size={20}
            className={icon === 'ok' ? 'text-inr' : icon === 'clinic' ? 'text-ink-2' : 'text-brand'}
          />
          <div className="flex flex-col">
            <span className="type-subhead-em text-ink">{t}</span>
            <span className="type-footnote text-ink-2">{d}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function PracticeDone() {
  const { nav, set } = usePatient()
  useEffect(() => {
    set({ maria: 'accepted' })
    playSound('success')
  }, [set])
  return (
    <Screen>
      <NavBar onBack={nav.back} />
      <h1 className="type-large-title text-ink">Your alerts work</h1>
      <p className="type-body text-ink-2">Here’s what happened, in order. Your real alerts will follow the same path.</p>
      <PracticeList done />
      <Banner type="success" title="Practice complete">
        Maria confirmed she got the text. Your care circle is ready.
      </Banner>
      <Bottom>
        <Button onClick={() => nav.push('protected')}>Continue</Button>
      </Bottom>
    </Screen>
  )
}

/* O12 · You’re protected */
export function Protected() {
  const { nav, state } = usePatient()
  const rows: [string, string, 'ok' | 'wait'][] = [
    ['Dexcom G7 connected', 'New reading every 5 minutes', 'ok'],
    [`Alerts at ${state.levels.low} and 54 mg/dL`, state.criticalAlerts === 'allowed' ? 'Urgent lows get through on silent' : 'Critical Alerts are off', state.criticalAlerts === 'allowed' ? 'ok' : 'wait'],
    [state.maria === 'accepted' ? 'Maria accepted' : 'Maria invited', state.maria === 'accepted' ? 'She’ll be called if you don’t respond' : 'Waiting for her to accept', state.maria === 'accepted' ? 'ok' : 'wait'],
    ['Northside care team linked', 'Dr. Wen Chen · Priya Shah, RN', 'ok'],
  ]
  return (
    <Screen>
      <div className="pt-6">
        <StatusCircle tone="inr" icon="checkc" size={88} />
      </div>
      <h1 className="type-large-title text-ink">You’re protected</h1>
      <p className="type-body text-ink-2">GlucoGuard is watching your readings now, day and night.</p>
      <div className="rounded-lg border border-line bg-surface px-4 py-1">
        {rows.map(([t, d, s], i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, transform: 'translateY(6px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}
          >
            <Icon name={s === 'ok' ? 'checkc' : 'clock'} size={20} className={s === 'ok' ? 'text-inr' : 'text-high'} />
            <div className="flex flex-col">
              <span className="type-subhead-em text-ink">{t}</span>
              <span className="type-footnote text-ink-2">{d}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <Bottom>
        <Button onClick={() => nav.reset('today')}>Go to Today</Button>
      </Bottom>
    </Screen>
  )
}
