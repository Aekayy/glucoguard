import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import type { GlucoseState } from '@/components/icons'

/* ─────────────────────────────────────────────────────────
 * Care Console state. Same people, same night as the patient app:
 * Denise's 3:03 AM low is the top row here.
 * ───────────────────────────────────────────────────────── */

export type QueueAlert = {
  id: string
  name: string
  meta: string
  glucose: number | null
  trend: string
  state: GlucoseState
  minutes: string
  esc: string
  escSub: string
  escLive?: boolean
  owner: 'auto' | 'you' | 'other'
  ownerName?: string
  ownerInitials?: string
  mrn?: string
  device?: string
}

export const ALERTS: QueueAlert[] = [
  { id: 'denise', name: 'Denise Okafor', meta: '67 · T2 · insulin', glucose: 49, trend: '↓↓', state: 'veryLow', minutes: '12m', esc: 'Caregiver', escSub: 'calling Maria', escLive: true, owner: 'auto', mrn: '0048213', device: 'Dexcom G7' },
  { id: 'aisha', name: 'Aisha Johnson', meta: '45 · T1 · injections', glucose: 62, trend: '↘', state: 'low', minutes: '3m', esc: 'Patient', escSub: 'alerting now', owner: 'auto', mrn: '0051102', device: 'Dexcom G7' },
  { id: 'rosa', name: 'Rosa Delgado', meta: '71 · T2 · insulin', glucose: 58, trend: '→', state: 'low', minutes: '21m', esc: 'Coordinator', escSub: 'assigned', owner: 'you', mrn: '0049987', device: 'Libre 3' },
  { id: 'marcus', name: 'Marcus Bell', meta: '34 · T1 · pump', glucose: 66, trend: '↗', state: 'low', minutes: '6m', esc: 'Patient', escSub: 'treating', owner: 'auto', mrn: '0050331', device: 'Dexcom G7' },
  { id: 'tomas', name: 'Tomás Rivera', meta: '16 · T1 · pump', glucose: 312, trend: '↑', state: 'veryHigh', minutes: '40m', esc: 'Parent', escSub: 'acknowledged', owner: 'other', ownerName: 'J. Ortiz', ownerInitials: 'JO', mrn: '0052210', device: 'Omnipod 5' },
  { id: 'harold', name: 'Harold Kim', meta: '79 · T2 · insulin', glucose: 214, trend: '→', state: 'high', minutes: '55m', esc: 'Patient', escSub: 'acknowledged', owner: 'auto', mrn: '0047719', device: 'Dexcom G7' },
  { id: 'evelyn', name: 'Evelyn Park', meta: '58 · T2 · orals', glucose: null, trend: '', state: 'noData', minutes: '3h', esc: 'Sensor expired', escSub: 'reorder due', owner: 'you', mrn: '0046652', device: 'Libre 3' },
]

export type OrderStatus = 'needs-signature' | 'coverage-failed' | 'denied' | 'shipped' | 'delivered' | 'sent'
export type Order = { id: string; created: string; patient: string; patientId: string; item: string; coverage: string; coverageTone: 'inr' | 'vlow' | 'high'; status: OrderStatus; statusLabel: string; supplier: string }

export const ORDERS: Order[] = [
  { id: 'ORD-2291', created: 'Created 10:14 AM', patient: 'Denise Okafor', patientId: 'denise', item: 'Dexcom G7 sensor × 3', coverage: 'Criteria met', coverageTone: 'inr', status: 'needs-signature', statusLabel: 'Needs signature', supplier: 'Harbor Home Medical' },
  { id: 'ORD-2290', created: 'Created 9:52 AM', patient: 'Evelyn Park', patientId: 'evelyn', item: 'Libre 3 sensor × 2', coverage: 'Visit too old', coverageTone: 'vlow', status: 'coverage-failed', statusLabel: 'Coverage check failed', supplier: '—' },
  { id: 'ORD-2286', created: 'Sep 24', patient: 'Harold Kim', patientId: 'harold', item: 'Dexcom G7 sensor × 3', coverage: 'Denied CO-16', coverageTone: 'vlow', status: 'denied', statusLabel: 'Payer denied', supplier: 'Harbor Home Medical' },
  { id: 'ORD-2288', created: 'Sep 27', patient: 'Tomás Rivera', patientId: 'tomas', item: 'Omnipod 5 pods × 10', coverage: 'Prior auth approved', coverageTone: 'inr', status: 'shipped', statusLabel: 'Shipped', supplier: 'Keystone DME' },
  { id: 'ORD-2285', created: 'Sep 25', patient: 'Rosa Delgado', patientId: 'rosa', item: 'Libre 3 sensor × 2', coverage: 'Criteria met', coverageTone: 'inr', status: 'delivered', statusLabel: 'Delivered Sep 28', supplier: 'Harbor Home Medical' },
  { id: 'ORD-2281', created: 'Sep 22', patient: 'Marcus Bell', patientId: 'marcus', item: 'Dexcom G7 sensor × 3', coverage: 'Criteria met', coverageTone: 'inr', status: 'delivered', statusLabel: 'Delivered Sep 25', supplier: 'Harbor Home Medical' },
  { id: 'ORD-2279', created: 'Sep 21', patient: 'Grace Liu', patientId: 'grace', item: 'Dexcom G7 receiver', coverage: 'Criteria met', coverageTone: 'inr', status: 'delivered', statusLabel: 'Delivered Sep 24', supplier: 'Keystone DME' },
]

export type AuditEntry = { time: string; who: string; action: string; details: string; device: string }

const AUDIT: AuditEntry[] = [
  { time: '3:19 AM', who: 'System', action: 'Caregiver answered', details: 'Maria Okafor pressed 1 (going)', device: 'Server' },
  { time: '3:18 AM', who: 'System', action: 'Called caregiver', details: 'Maria Okafor · (312) 555-0187', device: 'Server' },
  { time: '3:13 AM', who: 'System', action: 'Urgent alarm', details: 'Patient did not respond', device: 'Server' },
  { time: '3:03 AM', who: 'System', action: 'Low alert', details: '58 mg/dL · Overnight urgent low v3', device: 'Server' },
  { time: '9:40 AM', who: 'Priya Shah, RN', action: 'Viewed chart', details: 'Overview tab · 4 min', device: 'MacBook · JHF VPN' },
  { time: '9:34 AM', who: 'Priya Shah, RN', action: 'Sent message', details: 'Care plan change explained', device: 'MacBook · JHF VPN' },
]

export type ConsoleState = {
  alerts: QueueAlert[]
  selected: string
  taken: string[]
  resolved: string[]
  dispatched: string[]
  feedDelayed: boolean
  loaded: boolean
  orders: Order[]
  protocol: { step4Wait: number; weekendCovered: boolean; publishedV4: boolean }
  billingSubmitted: boolean
  audit: AuditEntry[]
}

const INITIAL: ConsoleState = {
  alerts: ALERTS,
  selected: 'denise',
  taken: [],
  resolved: [],
  dispatched: [],
  feedDelayed: false,
  loaded: false,
  orders: ORDERS,
  protocol: { step4Wait: 10, weekendCovered: false, publishedV4: false },
  billingSubmitted: false,
  audit: AUDIT,
}

type Ctx = {
  s: ConsoleState
  set: (patch: Partial<ConsoleState> | ((s: ConsoleState) => Partial<ConsoleState>)) => void
  log: (e: Omit<AuditEntry, 'device'> & { device?: string }) => void
  reset: () => void
}

const C = createContext<Ctx | null>(null)

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState(INITIAL)
  const set = useCallback<Ctx['set']>((patch) => setS((cur) => ({ ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) })), [])
  const log = useCallback<Ctx['log']>(
    (e) => setS((cur) => ({ ...cur, audit: [{ device: 'MacBook · JHF VPN', ...e }, ...cur.audit] })),
    [],
  )
  const reset = useCallback(() => setS(INITIAL), [])
  return <C.Provider value={{ s, set, log, reset }}>{children}</C.Provider>
}

export function useConsole() {
  const ctx = useContext(C)
  if (!ctx) throw new Error('useConsole outside ConsoleProvider')
  return ctx
}
