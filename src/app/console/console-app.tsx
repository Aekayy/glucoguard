import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { HeldMark, Icon, type IconName } from '@/components/icons'
import { Banner } from '@/components/hearth/ios'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { SoundToggle } from '@/components/ui/sound'
import { Toasts, toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { go } from '@/lib/use-hash-route'

import { Billing, Audit, Protocols, Team } from './admin'
import { ConsoleProvider, useConsole } from './console-state'
import { OrderFlow, Orders } from './orders'
import { Chart, Enroll, Patients } from './patients'
import { Queue } from './queue'
import { Checkbox, Sidebar, TopBar, WebField, type NavId } from './web'

/* ── Sign in (S1 / S2 / S3) ───────────────────────────────── */
function SignIn({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'creds' | 'mfa'>('creds')
  const [email, setEmail] = useState('priya.shah@northside.org')
  const [password, setPassword] = useState('')
  const [ssoError, setSsoError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [codeState, setCodeState] = useState<'idle' | 'bad' | 'ok'>('idle')
  const [trust, setTrust] = useState(true)

  const sso = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (!email.trim().toLowerCase().startsWith('priya')) setSsoError(true)
      else {
        setSsoError(false)
        setStep('mfa')
      }
    }, 700)
  }

  useEffect(() => {
    if (code.length < 6) {
      setCodeState('idle')
      return
    }
    const t = setTimeout(() => {
      if (code === '000000') setCodeState('bad')
      else {
        setCodeState('ok')
        setTimeout(onDone, 700)
      }
    }, 450)
    return () => clearTimeout(t)
  }, [code, onDone])

  return (
    <div className="flex h-full">
      <div className="flex w-[620px] shrink-0 flex-col gap-5 bg-brand p-16 text-white max-xl:w-[480px]">
        <div className="flex items-center gap-3">
          <HeldMark size={32} />
          <span className="type-h1">GlucoGuard Care Console</span>
        </div>
        <div className="mt-auto flex flex-col gap-5">
          <h1 className="font-[var(--font-rounded)] text-[44px] leading-[50px] font-bold">Every alert, followed through.</h1>
          <p className="max-w-[460px] type-callout opacity-85">
            Triage hypoglycemia alerts, run escalation protocols and order CGM supplies in one place. No fax, no phone tag.
          </p>
          <div className="flex gap-10 border-t border-white/20 pt-4">
            {[
              ['214', 'patients monitored'],
              ['2m 40s', 'median time to acknowledge'],
              ['0', 'missed urgent lows this quarter'],
            ].map(([v, l]) => (
              <div key={l} className="flex flex-col gap-0.5">
                <span className="type-display">{v}</span>
                <span className="type-small opacity-80">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <span className="mt-auto type-small opacity-70">Northside Health · Endocrinology remote monitoring</span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-canvas">
        <motion.div key={step} initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="flex w-[400px] flex-col gap-[18px]">
          {step === 'creds' ? (
            <>
              <h2 className="type-display text-ink">Sign in to Care Console</h2>
              <p className="type-wbody text-ink-2">Use your Northside Health account.</p>
              {ssoError ? (
                <Banner type="error" size="web" title="Your account isn’t set up for GlucoGuard yet">
                  Ask your admin to add you to the “GlucoGuard RPM” group in Okta. Reference SSO-403.
                </Banner>
              ) : null}
              <Button size="web" className="w-full" onClick={sso} disabled={busy}>
                {busy ? 'Redirecting to Okta…' : 'Continue with Northside SSO'}
              </Button>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="type-small text-ink-2">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <WebField
                label="Work email"
                value={email}
                onChange={(v) => {
                  setEmail(v)
                  setSsoError(false)
                }}
                error={ssoError ? 'This account isn’t in the GlucoGuard RPM group.' : null}
                helper="Demo: try new.hire@northside.org to see the SSO error."
              />
              <WebField label="Password" type="password" value={password} onChange={setPassword} placeholder="Password" />
              <Button size="web" variant="outline" className="w-full" onClick={sso}>
                Sign in with email
              </Button>
              <button type="button" className="w-fit type-wbody-em text-brand">
                Forgot password?
              </button>
            </>
          ) : (
            <>
              <h2 className="type-display text-ink">Check your authenticator</h2>
              <p className="type-wbody text-ink-2">Enter the 6-digit code for {email}.</p>
              <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus aria-invalid={codeState === 'bad' || undefined} success={codeState === 'ok'} aria-label="Authenticator code">
                <InputOTPGroup>
                  {[0, 1, 2].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-14 w-[58px] rounded-sm" />
                  ))}
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  {[3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-14 w-[58px] rounded-sm" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {codeState === 'bad' ? (
                <span className="flex items-center gap-1.5 type-small text-low">
                  <Icon name="alert" size={13} /> That code didn’t match. Codes refresh every 30 seconds.
                </span>
              ) : (
                <span className="type-small text-ink-3">Demo: any 6 digits work; 000000 shows the error. Paste works too.</span>
              )}
              <Checkbox on={trust} onChange={setTrust}>
                Trust this Mac for 12 hours
              </Checkbox>
              <Button size="web" className="w-full" disabled={code.length < 6} onClick={() => code !== '000000' && onDone()}>
                Verify and continue
              </Button>
              <button type="button" className="w-fit type-wbody-em text-brand">
                Use a backup code instead
              </button>
            </>
          )}
          <div className="flex items-center gap-2 pt-6 type-small text-ink-2">
            <Icon name="shield" size={16} /> HIPAA-compliant. Every sign-in and chart view is logged.
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ── Command palette (Q10) — opened 100+ times a day, so it does not animate ── */
type Cmd = { id: string; group: 'Patients' | 'Actions'; icon: IconName; title: string; detail: string; key?: string; run: () => void }

function Palette({ open, onClose, commands }: { open: boolean; onClose: () => void; commands: Cmd[] }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
      setTimeout(() => input.current?.focus(), 0)
    }
  }, [open])
  const list = useMemo(() => commands.filter((c) => (c.title + ' ' + c.detail).toLowerCase().includes(q.toLowerCase())), [commands, q])
  if (!open) return null
  const groups = (['Patients', 'Actions'] as const).map((g) => [g, list.filter((c) => c.group === g)] as const)
  return (
    <div className="command-overlay fixed inset-0 z-50 flex items-start justify-center bg-scrim pt-[14vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label="Command palette" className="w-[640px] overflow-hidden rounded-lg bg-surface shadow-modal">
        <div className="flex items-center gap-2.5 border-b border-line px-[18px] py-4">
          <Icon name="search" size={20} className="text-ink-2" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setI(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setI((v) => Math.min(list.length - 1, v + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setI((v) => Math.max(0, v - 1))
              } else if (e.key === 'Enter' && list[i]) {
                list[i].run()
                onClose()
              } else if (e.key === 'Escape') onClose()
            }}
            aria-activedescendant={list[i] ? `cmd-${list[i].id}` : undefined}
            placeholder="Search patients or type an action"
            className="flex-1 bg-transparent type-h2 text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="type-small text-ink-3">esc</kbd>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2.5">
          {list.length === 0 ? <p className="px-3 py-6 text-center type-wbody text-ink-2">No matches. Try a name or MRN.</p> : null}
          {groups.map(([g, items]) =>
            items.length ? (
              <div key={g} className="flex flex-col gap-0.5 pb-1.5">
                <span className="px-2.5 pt-1.5 pb-1 type-eyebrow text-ink-2">{g}</span>
                {items.map((c) => {
                  const idx = list.indexOf(c)
                  const on = idx === i
                  return (
                    <button
                      key={c.id}
                      id={`cmd-${c.id}`}
                      type="button"
                      onMouseEnter={() => setI(idx)}
                      onClick={() => {
                        c.run()
                        onClose()
                      }}
                      className={cn('command-option flex items-center gap-3 rounded-sm p-2.5 text-left', on && 'bg-tint')}
                    >
                      <Icon name={c.icon} size={18} className={on ? 'text-brand' : 'text-ink-2'} />
                      <span className="flex flex-1 flex-col">
                        <span className="type-wbody-em text-ink">{c.title}</span>
                        <span className="type-small text-ink-2">{c.detail}</span>
                      </span>
                      {c.key ? <kbd className="rounded-[4px] border border-line px-1.5 py-0.5 type-small-em text-ink-2">{c.key}</kbd> : on ? <kbd className="type-small-em text-ink-2">↵</kbd> : null}
                    </button>
                  )
                })}
              </div>
            ) : null,
          )}
        </div>
        <div className="flex gap-4 border-t border-line bg-canvas px-[18px] py-2.5 type-small text-ink-2">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  )
}

/* ── Shell ─────────────────────────────────────────────────── */
const TITLES: Record<NavId, [string, string]> = {
  queue: ['Care Console · Tuesday 3:18 AM', 'Alert queue'],
  patients: ['Care Console', 'Patients'],
  orders: ['Care Console', 'Orders'],
  protocols: ['Protocols', 'Overnight urgent low'],
  billing: ['RPM billing · September 2026', 'Remote monitoring claims'],
  audit: ['Compliance', 'Audit log'],
  team: ['Team & settings', 'On-call schedule'],
}

function Shell({ route }: { route: string }) {
  const { s, set, log } = useConsole()
  const [palette, setPalette] = useState(false)
  const [section, ...rest] = route.split('/')
  const active: NavId = (['queue', 'patients', 'orders', 'protocols', 'billing', 'audit', 'team'] as NavId[]).includes(section as NavId)
    ? (section as NavId)
    : section === 'enroll'
      ? 'patients'
      : 'queue'

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const commands: Cmd[] = [
    { id: 'p-denise', group: 'Patients', icon: 'user', title: 'Denise Okafor', detail: 'MRN 0048213 · very low now · 49 mg/dL', run: () => go('console/patients/denise') },
    { id: 'p-dennis', group: 'Patients', icon: 'user', title: 'Dennis Walker', detail: 'MRN 0051377 · in range', run: () => toast('Dennis Walker’s chart is not in this prototype') },
    { id: 'p-rosa', group: 'Patients', icon: 'user', title: 'Rosa Delgado', detail: 'MRN 0049987 · low · 58', run: () => go('console/enroll') },
    {
      id: 'a-take',
      group: 'Actions',
      icon: 'hand',
      title: 'Take over Denise’s alert',
      detail: 'Pauses 911 while you work',
      key: 'A',
      run: () => {
        go('console/queue')
        if (!s.taken.includes('denise')) {
          set((c) => ({ taken: [...c.taken, 'denise'], selected: 'denise' }))
          log({ time: '3:22 AM', who: 'Priya Shah, RN', action: 'Took over alert', details: 'Denise Okafor · 911 paused' })
          toast({ message: 'You’re handling Denise’s alert · 911 paused', state: 'info' })
        }
      },
    },
    { id: 'a-order', group: 'Actions', icon: 'box', title: 'Order CGM sensors for Denise', detail: 'Coverage checked automatically', run: () => go('console/orders/new/denise') },
    { id: 'a-proto', group: 'Actions', icon: 'flow', title: 'Open protocol: Overnight urgent low', detail: 'Published v3 · used by 188 patients', run: () => go('console/protocols') },
    { id: 'a-enroll', group: 'Actions', icon: 'plus', title: 'Enroll a patient', detail: 'Live Medicare eligibility (270/271)', run: () => go('console/enroll') },
    { id: 'a-bill', group: 'Actions', icon: 'bill', title: 'Review September RPM claims', detail: '141 ready to submit', run: () => go('console/billing') },
  ]

  const open = s.alerts.filter((a) => !s.resolved.includes(a.id)).length
  const ordersNeeding = s.orders.filter((o) => ['needs-signature', 'coverage-failed', 'denied'].includes(o.status)).length

  let body: ReactNode
  let title = TITLES[active]
  if (section === 'patients' && rest[0] === 'denise') {
    body = <Chart />
    title = ['Patients / Denise Okafor', 'Denise Okafor']
  } else if (section === 'enroll') {
    body = <Enroll />
    title = ['Patients / Enroll a patient', 'Enroll Rosa Delgado']
  } else if (section === 'orders' && rest.length) {
    const who = rest[rest.length - 1]
    body = <OrderFlow patientId={who} key={who} />
    title = [`Orders / ${who === 'evelyn' ? 'Evelyn Park' : who === 'harold' ? 'Harold Kim' : who === 'tomas' ? 'Tomás Rivera' : 'Denise Okafor'} / ${who === 'harold' ? 'Fix denial' : 'New order'}`, 'CGM supply order']
  } else {
    body = {
      queue: <Queue onPalette={() => setPalette(true)} />,
      patients: <Patients />,
      orders: <Orders />,
      protocols: <Protocols />,
      billing: <Billing />,
      audit: <Audit />,
      team: <Team />,
    }[active]
  }

  return (
    <div className="flex h-full min-w-[1280px]">
      <Sidebar active={active} counts={{ queue: open, orders: ordersNeeding }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar eyebrow={title[0]} title={title[1]} onSearch={() => setPalette(true)} right={<SoundToggle />} />
        <main className="min-h-0 flex-1 overflow-y-auto px-7 py-[22px]">
          <motion.div key={route} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">
            {body}
          </motion.div>
        </main>
      </div>
      <Palette open={palette} onClose={() => setPalette(false)} commands={commands} />
    </div>
  )
}

function SignedIn({ route }: { route: string }) {
  const read = () => {
    try {
      return sessionStorage.getItem('gg-console-signed-in') === '1'
    } catch {
      return false
    }
  }
  const [signedIn, setSignedIn] = useState(read)
  if (!signedIn || route === 'signin')
    return (
      <SignIn
        onDone={() => {
          try {
            sessionStorage.setItem('gg-console-signed-in', '1')
          } catch {
            /* private mode: stay signed in for this view only */
          }
          setSignedIn(true)
          if (route === 'signin' || route === '') go('console/queue')
          toast({ message: 'Signed in · Northside Health', state: 'success' })
        }}
      />
    )
  return <Shell route={route || 'queue'} />
}

export function ConsoleApp({ route }: { route: string }) {
  useEffect(() => {
    document.title = 'GlucoGuard · Care Console'
  }, [])
  return (
    <ConsoleProvider>
      <div className="h-full overflow-x-auto bg-canvas">
        <SignedIn route={route} />
      </div>
      <Toasts position="bottom-center" />
    </ConsoleProvider>
  )
}
