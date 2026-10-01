import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'

import { Icon, type IconName } from '@/components/icons'
import { Segmented, Toggle } from '@/components/hearth/ios'
import { SoundToggle } from '@/components/ui/sound'
import { Toasts } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

import * as A from './alerts'
import * as CM from './care-me'
import { HomeIndicator, StatusBar, TabBar } from './chrome'
import * as H from './home'
import * as O from './onboarding'
import { PatientProvider, usePatient, INITIAL, type ScreenId } from './state'
import { NOTES } from './story'

const SCREENS: Record<ScreenId, ComponentType> = {
  launch: O.Launch,
  welcome: O.Welcome,
  account: O.Account,
  join: O.Join,
  'join-found': O.JoinFound,
  consent: O.Consent,
  about: O.About,
  cgm: O.Cgm,
  'cgm-connecting': O.CgmConnecting,
  'cgm-failed': O.CgmFailed,
  'cgm-connected': O.CgmConnected,
  'levels-onb': O.LevelsOnboarding,
  invite: O.Invite,
  'invite-sent': O.InviteSent,
  critical: O.CriticalAlerts,
  'critical-denied': O.CriticalDenied,
  practice: O.Practice,
  'practice-done': O.PracticeDone,
  protected: O.Protected,
  today: H.Today,
  log: H.AddLog,
  trends: H.Trends,
  lows: H.Lows,
  care: CM.Care,
  messages: CM.Messages,
  supplies: CM.Supplies,
  me: CM.Me,
  device: CM.Device,
  'alert-levels': CM.AlertLevels,
  'lock-low': A.LockLow,
  treat: A.Treat,
  recheck: A.Recheck,
  'back-in-range': A.BackInRange,
  'still-low': A.StillLow,
  'lock-critical': A.LockCritical,
  escalating: A.Escalating,
  safe: A.Safe,
  'maria-coming': A.MariaComing,
  ems: A.Ems,
  summary: A.Summary,
  sms: A.Sms,
}

const LIGHT_CHROME: ScreenId[] = ['launch', 'lock-low', 'lock-critical']
const TIME: Partial<Record<ScreenId, string>> = {
  'lock-critical': '3:08',
  escalating: '3:18',
  safe: '3:19',
  'maria-coming': '3:19',
  ems: '3:33',
  sms: '3:18',
  'lock-low': '10:42',
  treat: '10:42',
  recheck: '10:44',
  'back-in-range': '10:57',
  'still-low': '10:57',
}

const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

function Device() {
  const { nav, state } = usePatient()
  const reduce = useReducedMotion()
  const Screen = SCREENS[nav.screen]
  const light = LIGHT_CHROME.includes(nav.screen)
  const dir = reduce ? 0 : nav.dir

  return (
    <div className={cn('relative h-[852px] w-[393px] overflow-hidden rounded-[47px] bg-canvas text-ink', state.night && 'dark')} style={{ colorScheme: state.night ? 'dark' : 'light' }}>
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={nav.stack.length + nav.screen}
          custom={dir}
          className="absolute inset-0 bg-canvas"
          variants={{
            enter: (d: number) => ({ transform: d > 0 ? 'translateX(100%)' : d < 0 ? 'translateX(-28%)' : 'translateX(0)', opacity: d === 0 ? 0 : 1 }),
            center: { transform: 'translateX(0)', opacity: 1 },
            exit: (d: number) => ({ transform: d > 0 ? 'translateX(-28%)' : d < 0 ? 'translateX(100%)' : 'translateX(0)', opacity: d === 0 ? 0 : 1, zIndex: d < 0 ? 2 : 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: dir === 0 ? 0.2 : 0.38, ease: EASE_DRAWER }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      <StatusBar light={light} time={TIME[nav.screen]} bg={light || nav.screen === 'sms' ? 'none' : ['log', 'messages'].includes(nav.screen) ? 'surface' : 'canvas'} />
      <div className="pointer-events-none absolute top-[11px] left-1/2 z-50 h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-black" />
      <TabBar />
      {nav.screen !== 'sms' && !['today', 'trends', 'lows', 'care', 'supplies', 'me', 'device', 'alert-levels'].includes(nav.screen) ? <HomeIndicator light={light} /> : null}
      <Toasts contained position="top-center" />
    </div>
  )
}

/** Scales the 393×852 phone to the space available. */
function PhoneFrame() {
  const host = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const fit = () => setScale(Math.min(1, (el.clientHeight - 16) / 876, (el.clientWidth - 16) / 417))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={host} className="flex min-h-0 flex-1 items-center justify-center">
      <div style={{ width: 417 * scale, height: 876 * scale }} className="relative">
        <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
          <div className="rounded-[59px] bg-[#1a1519] p-3 shadow-[0_30px_80px_rgb(36_27_37/0.28),inset_0_0_0_2px_#3a3038]">
            <Device />
          </div>
        </div>
      </div>
    </div>
  )
}

type Scenario = { n: number; label: string; icon: IconName; run: (ctx: ReturnType<typeof usePatient>) => void }

const SCENARIOS: Scenario[] = [
  { n: 1, label: 'Onboarding', icon: 'play', run: ({ set, nav }) => { set({ ...INITIAL, maria: 'none', connectAttempts: 0, criticalAlerts: 'unknown' }); nav.reset('launch') } },
  { n: 2, label: 'Everyday: Today, log, trends', icon: 'gauge', run: ({ set, nav }) => { set({ night: false, todayMode: 'normal' }); nav.reset('today') } },
  { n: 3, label: 'Low alert → treat → in range', icon: 'bell', run: ({ set, nav }) => { set({ night: false }); nav.reset('lock-low') } },
  { n: 4, label: '3 a.m. very low → hold to confirm', icon: 'moon', run: ({ nav }) => nav.reset('lock-critical') },
  { n: 5, label: 'Maria answered (A10)', icon: 'care', run: ({ set, nav }) => { set({ night: true }); nav.reset('maria-coming') } },
  { n: 6, label: 'Nobody answered → 911', icon: 'siren', run: ({ set, nav }) => { set({ night: true }); nav.reset('ems') } },
  { n: 7, label: 'Caregiver SMS, no app', icon: 'msg', run: ({ nav }) => nav.reset('sms') },
  { n: 8, label: 'Supplies: insurance action', icon: 'box', run: ({ set, nav }) => { set({ supplies: 'action', night: false }); nav.reset('supplies') } },
  { n: 9, label: 'Device disconnected', icon: 'sensor', run: ({ set, nav }) => { set({ device: 'disconnected', night: false }); nav.reset('device') } },
  { n: 10, label: 'Event summary + check-in', icon: 'doc', run: ({ nav }) => nav.reset('summary') },
]

function Sidebar() {
  const ctx = usePatient()
  const { state, set } = ctx
  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-5 overflow-y-auto py-6 pr-2 no-scrollbar">
      <div>
        <div className="type-eyebrow text-ink-2">Prototype flows</div>
        <div className="mt-2 flex flex-col gap-1">
          {SCENARIOS.map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => s.run(ctx)}
              className="group flex items-center gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-surface"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-tint type-small-em text-brand">{s.n}</span>
              <span className="flex-1 type-wbody text-ink">{s.label}</span>
              <Icon name={s.icon} size={16} className="text-ink-3 group-hover:text-brand" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
        <div className="type-eyebrow text-ink-2">States to show</div>
        <div className="flex flex-col gap-1.5">
          <span className="type-small-em text-ink-2">Today screen</span>
          <Segmented
            label="Today state"
            size="sm"
            value={state.todayMode}
            onChange={(v) => {
              set({ todayMode: v })
              ctx.nav.reset('today')
            }}
            options={[
              { value: 'normal', label: 'Live' },
              { value: 'warming', label: 'Warm-up' },
              { value: 'signal', label: 'No signal' },
              { value: 'offline', label: 'Offline' },
            ]}
          />
        </div>
        {(
          [
            ['Night mode (Dark)', state.night, (on: boolean) => set({ night: on })],
            ['Español (M5)', state.lang === 'es', (on: boolean) => set({ lang: on ? 'es' : 'en' })],
            ['Trends ready (off = R2 empty)', state.trendsReady, (on: boolean) => set({ trendsReady: on })],
            ['Fail next message (C3)', state.failNextMessage, (on: boolean) => set({ failNextMessage: on })],
          ] as const
        ).map(([label, on, fn]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="type-wbody text-ink">{label}</span>
            <Toggle label={label} on={on} onChange={fn} />
          </div>
        ))}
      </div>
    </aside>
  )
}

function NotePanel() {
  const { nav } = usePatient()
  const n = NOTES[nav.screen]
  return (
    <aside className="flex w-[320px] shrink-0 flex-col gap-4 overflow-y-auto py-6 pl-2 no-scrollbar">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={n.id}
          initial={{ opacity: 0, transform: 'translateY(6px)' }}
          animate={{ opacity: 1, transform: 'translateY(0)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand px-2.5 py-1 type-small-em text-on-brand">{n.id}</span>
            <span className="type-eyebrow text-ink-2">{n.flow}</span>
          </div>
          <h2 className="type-h1 text-ink">{n.title}</h2>
          <div className="flex flex-col gap-1">
            <span className="type-eyebrow text-brand">What happens here</span>
            <p className="type-wbody text-ink">{n.beat}</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="type-eyebrow text-brand">Design decision</span>
            <p className="type-wbody text-ink">{n.decision}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-md bg-tint p-3">
            <span className="type-eyebrow text-brand">Verse JD connection</span>
            <p className="type-wbody-em text-ink">{n.jd}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <p className="px-1 type-small text-ink-3">Screen IDs match the Figma file (Hearth · 04 iOS app). Sounds play after your first click; mute with the speaker button.</p>
    </aside>
  )
}

export function PatientApp() {
  useEffect(() => {
    document.title = 'GlucoGuard · Patient app'
  }, [])
  return (
    <PatientProvider>
      <div className="flex h-full flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-6">
          <a href="#/" className="flex items-center gap-2 type-wbody-em text-ink">
            <Icon name="chevL" size={18} /> GlucoGuard
          </a>
          <span className="type-wbody text-ink-2">Patient app · iPhone 15</span>
          <span className="ml-auto flex items-center gap-2">
            <a href="#/console" className="rounded-sm border border-line px-3 py-1.5 type-wbody-em text-ink hover:bg-canvas">
              Open Care Console
            </a>
            <SoundToggle />
          </span>
        </header>
        <div className="flex min-h-0 flex-1 justify-center gap-6 px-6">
          <Sidebar />
          <PhoneFrame />
          <NotePanel />
        </div>
      </div>
    </PatientProvider>
  )
}
