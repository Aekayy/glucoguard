import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/* ─────────────────────────────────────────────────────────
 * Patient app state + navigation.
 * One small store, because every screen in the story reads the
 * same facts (Denise, Maria, Jewish Healthcare Foundation) — the prototype never
 * contradicts itself.
 * ───────────────────────────────────────────────────────── */

export type ScreenId =
  | 'launch' | 'welcome' | 'account' | 'join' | 'join-found' | 'consent' | 'about'
  | 'cgm' | 'cgm-connecting' | 'cgm-failed' | 'cgm-connected' | 'levels-onb'
  | 'invite' | 'invite-sent' | 'critical' | 'critical-denied' | 'practice' | 'practice-done' | 'protected'
  | 'today' | 'log' | 'trends' | 'lows' | 'care' | 'messages' | 'supplies'
  | 'me' | 'device' | 'alert-levels'
  | 'lock-low' | 'treat' | 'recheck' | 'back-in-range' | 'still-low'
  | 'lock-critical' | 'escalating' | 'safe' | 'maria-coming' | 'ems' | 'summary' | 'sms'

export type Log = { time: string; kind: 'meal' | 'insulin' | 'activity' | 'sugar'; label: string; value: string }
export type Msg = { from: 'priya' | 'me'; text: string; time: string; status?: 'sent' | 'failed' | 'sending'; plan?: boolean }

export type PatientState = {
  lang: 'en' | 'es'
  night: boolean
  todayMode: 'normal' | 'warming' | 'signal' | 'offline'
  trendsReady: boolean
  logs: Log[]
  levels: { low: number; high: number; signalLoss: boolean; risingFast: boolean; quietHours: boolean }
  consent: { circle: boolean; research: boolean }
  profile: { type: 'Type 1' | 'Type 2' | 'Other'; insulin: 'Yes' | 'No'; language: 'English' | 'Español' }
  device: 'connected' | 'disconnected'
  connectAttempts: number
  maria: 'none' | 'pending' | 'accepted'
  criticalAlerts: 'unknown' | 'allowed' | 'denied'
  supplies: 'ontheway' | 'action' | 'sent'
  messages: Msg[]
  failNextMessage: boolean
  eventNote: string
}

export const INITIAL: PatientState = {
  lang: 'en',
  night: false,
  todayMode: 'normal',
  trendsReady: true,
  logs: [
    { time: '8:05', kind: 'meal', label: 'Breakfast', value: '45 g carbs' },
    { time: '8:10', kind: 'insulin', label: 'Lispro', value: '6 units' },
    { time: '7:30', kind: 'activity', label: 'Walk', value: '25 min' },
  ],
  levels: { low: 70, high: 250, signalLoss: true, risingFast: false, quietHours: false },
  consent: { circle: true, research: false },
  profile: { type: 'Type 2', insulin: 'Yes', language: 'English' },
  device: 'connected',
  connectAttempts: 0,
  maria: 'accepted',
  criticalAlerts: 'allowed',
  supplies: 'ontheway',
  messages: [
    { from: 'priya', text: 'Hi Denise, I saw last night’s low at 3 AM. How are you feeling today?', time: '9:12 AM' },
    { from: 'me', text: 'Better, thanks. I skipped my snack after dinner.', time: '9:20 AM', status: 'sent' },
    { from: 'priya', text: 'Thanks for telling me. Dr. Chen lowered your evening correction dose from 4 to 2 units, starting tonight.', time: '9:34 AM' },
    { from: 'priya', text: '', time: '9:34 AM', plan: true },
  ],
  failNextMessage: false,
  eventNote: '',
}

type Dir = 1 | -1 | 0

type Nav = {
  stack: ScreenId[]
  screen: ScreenId
  dir: Dir
  push: (id: ScreenId) => void
  replace: (id: ScreenId) => void
  back: () => void
  /** jump to a screen with a fresh history (tab switches, scenario starts) */
  reset: (id: ScreenId, dir?: Dir) => void
}

type Ctx = {
  state: PatientState
  set: (patch: Partial<PatientState> | ((s: PatientState) => Partial<PatientState>)) => void
  restart: () => void
  nav: Nav
}

const PatientCtx = createContext<Ctx | null>(null)

export function PatientProvider({ children, start = 'launch' }: { children: ReactNode; start?: ScreenId }) {
  const [state, setState] = useState<PatientState>(INITIAL)
  const [stack, setStack] = useState<ScreenId[]>([start])
  const [dir, setDir] = useState<Dir>(0)

  const set = useCallback<Ctx['set']>((patch) => {
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  }, [])

  /* actions are stable, so a screen's timers never restart when another
   * screen navigates (a screen animating out keeps its effects alive) */
  const push = useCallback((id: ScreenId) => {
    setDir(1)
    setStack((s) => [...s, id])
  }, [])
  const replace = useCallback((id: ScreenId) => {
    setDir(1)
    setStack((s) => [...s.slice(0, -1), id])
  }, [])
  const back = useCallback(() => {
    setDir(-1)
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])
  const reset = useCallback((id: ScreenId, d: Dir = 0) => {
    setDir(d)
    setStack([id])
  }, [])

  const nav = useMemo<Nav>(
    () => ({ stack, screen: stack[stack.length - 1], dir, push, replace, back, reset }),
    [stack, dir, push, replace, back, reset],
  )

  const restart = useCallback(() => {
    setState(INITIAL)
    setDir(0)
    setStack(['launch'])
  }, [])

  return <PatientCtx.Provider value={{ state, set, restart, nav }}>{children}</PatientCtx.Provider>
}

export function usePatient() {
  const ctx = useContext(PatientCtx)
  if (!ctx) throw new Error('usePatient must be used inside PatientProvider')
  return ctx
}

/* Screens that show the tab bar, and which tab they belong to */
export const TAB_OF: Partial<Record<ScreenId, 'today' | 'trends' | 'care' | 'me'>> = {
  today: 'today',
  trends: 'trends',
  lows: 'trends',
  care: 'care',
  supplies: 'care',
  me: 'me',
  device: 'me',
  'alert-levels': 'me',
}
