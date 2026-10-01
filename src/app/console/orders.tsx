import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Icon } from '@/components/icons'
import { Banner } from '@/components/hearth/ios'
import ApprovalCard from '@/components/primitives/approval-card'
import { Button } from '@/components/ui/button'
import { playSound } from '@/components/ui/sound'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { go } from '@/lib/use-hash-route'

import { useConsole, type Order } from './console-state'
import { Checkbox, Choice, FilterChips, KV, Panel, Pill, Stepper, type StepState } from './web'

const STATUS_TONE: Record<Order['status'], 'brand' | 'vlow' | 'info' | 'inr' | 'high'> = {
  'needs-signature': 'brand',
  'coverage-failed': 'vlow',
  denied: 'vlow',
  shipped: 'info',
  delivered: 'inr',
  sent: 'info',
}
const COLS = '130px minmax(130px,1fr) minmax(160px,1.2fr) 150px 170px minmax(150px,1fr)'

/* D1 · Orders list */
export function Orders() {
  const { s } = useConsole()
  const [f, setF] = useState<'all' | 'action' | 'progress' | 'delivered'>('all')
  const needs = (o: Order) => ['needs-signature', 'coverage-failed', 'denied'].includes(o.status)
  const list = s.orders.filter((o) => (f === 'all' ? true : f === 'action' ? needs(o) : f === 'progress' ? ['shipped', 'sent'].includes(o.status) : o.status === 'delivered'))
  const nAction = s.orders.filter(needs).length
  const route = (o: Order) => (o.patientId === 'denise' && o.status === 'needs-signature' ? 'console/orders/new/denise' : o.patientId === 'denise' ? 'console/orders/new/denise' : `console/orders/${o.patientId}`)
  return (
    <>
      <div className="flex items-center gap-2">
        <FilterChips
          value={f}
          onChange={setF}
          items={[
            { id: 'all', label: 'All', count: 48 },
            { id: 'action', label: 'Needs action', count: nAction },
            { id: 'progress', label: 'In progress', count: 9 },
            { id: 'delivered', label: 'Delivered', count: 36 },
          ]}
        />
        <Button size="web" variant="outline" className="ml-auto">
          Filter
        </Button>
        <Button size="web" onClick={() => go('console/orders/new/denise')}>
          New order
        </Button>
      </div>
      {nAction ? (
        <Banner type="warning" size="web" title={`${nAction} order${nAction === 1 ? '' : 's'} need you`}>
          {s.orders.find((o) => o.status === 'needs-signature') ? '1 needs a signature, ' : ''}
          {s.orders.find((o) => o.status === 'coverage-failed') ? '1 failed a coverage check, ' : ''}
          {s.orders.find((o) => o.status === 'denied') ? '1 was denied by the payer. ' : ''}Sensors run out soon for 2 of these patients.
        </Banner>
      ) : (
        <Banner type="success" size="web" title="Nothing needs you">
          Every open order is moving. You’ll be told if a payer or supplier asks for something.
        </Banner>
      )}
      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="grid gap-3 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2" style={{ gridTemplateColumns: COLS }}>
          <span>Order</span>
          <span>Patient</span>
          <span>Item</span>
          <span>Coverage</span>
          <span>Status</span>
          <span>Supplier</span>
        </div>
        <AnimatePresence initial={false}>
          {list.map((o) => (
            <motion.button
              layout
              key={o.id}
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => (o.status === 'delivered' ? toast(`${o.id} was delivered · nothing to do`) : go(route(o)))}
              className={cn('grid h-[54px] w-full items-center gap-3 border-b border-line px-4 text-left transition-colors last:border-b-0 hover:bg-canvas', o.status === 'needs-signature' && 'bg-tint hover:bg-tint')}
              style={{ gridTemplateColumns: COLS }}
            >
              <span className="flex flex-col">
                <span className="type-wbody-em text-ink">{o.id}</span>
                <span className="type-small text-ink-2">{o.created}</span>
              </span>
              <span className="type-wbody text-ink">{o.patient}</span>
              <span className="type-wbody text-ink">{o.item}</span>
              <span className={cn('type-small-em', o.coverageTone === 'inr' ? 'text-inr' : 'text-vlow')}>{o.coverage}</span>
              <span>
                <Pill tone={STATUS_TONE[o.status]}>{o.statusLabel}</Pill>
              </span>
              <span className="type-wbody text-ink-2">{o.supplier}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </section>
    </>
  )
}

/* ── shared pieces of the order screen ─────────────────────── */
type Crit = { title: string; detail: string; source: string; state: 'ok' | 'fail' | 'checking' | 'waiting' }

function Criteria({ items }: { items: Crit[] }) {
  return (
    <div className="flex flex-col">
      {items.map((c) => (
        <div key={c.title} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={c.state}
              initial={{ opacity: 0, transform: 'scale(0.7)' }}
              animate={{ opacity: 1, transform: 'scale(1)' }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.3 }}
              className={cn(
                'flex size-[22px] shrink-0 items-center justify-center rounded-full text-on-brand',
                c.state === 'ok' && 'bg-inr',
                c.state === 'fail' && 'bg-vlow',
                (c.state === 'checking' || c.state === 'waiting') && 'bg-sunken',
              )}
            >
              {c.state === 'ok' ? <Icon name="check" size={13} weight={1.6} /> : c.state === 'fail' ? <Icon name="x" size={12} weight={2.2} /> : c.state === 'checking' ? (
                <svg width="14" height="14" viewBox="0 0 16 16" className="status-spin text-brand" aria-hidden>
                  <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : null}
            </motion.span>
          </AnimatePresence>
          <span className="flex flex-1 flex-col">
            <span className={cn('type-wbody-em', c.state === 'waiting' ? 'text-ink-3' : 'text-ink')}>{c.title}</span>
            <span className={cn('type-small', c.state === 'fail' ? 'text-vlow' : 'text-ink-2')}>{c.detail}</span>
          </span>
          <Pill tone="nod">From {c.source}</Pill>
        </div>
      ))}
    </div>
  )
}

function ItemCard({ product, qty, start }: { product: string; qty: string; start: string }) {
  return (
    <Panel title="1  Item" right={<span className="mr-auto pl-2 type-small text-ink-2">HCPCS A4239 · monthly supply allowance</span>}>
      <div className="grid grid-cols-4 gap-2.5">
        {[
          ['Product', product],
          ['Quantity', qty],
          ['Refills', '11 (12 months)'],
          ['Start', start],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 rounded-sm bg-canvas p-2.5">
            <span className="type-small text-ink-2">{k}</span>
            <span className="type-wbody-em text-ink">{v}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Docs({ items, note }: { items: [string, string, boolean?][]; note?: string }) {
  return (
    <Panel title="3  Documents" right={note ? <span className="type-small text-ink-2">{note}</span> : undefined}>
      <div className="flex flex-col gap-2">
        {items.map(([t, d, bad]) => (
          <div key={t} className={cn('flex items-center gap-2.5 rounded-sm border px-2.5 py-2', bad ? 'border-low' : 'border-line')}>
            <Icon name="file" size={16} className="text-ink-2" />
            <span className="type-wbody-em text-ink">{t}</span>
            <span className={cn('ml-auto type-small', bad ? 'text-vlow' : 'text-ink-2')}>{d}</span>
          </div>
        ))}
      </div>
      <span className="type-small text-ink-2">The supplier gets the order, notes and coverage proof as one packet. Nothing is faxed.</span>
    </Panel>
  )
}

/* D2 → D4 → D5 (Denise) · D3 (Evelyn) · D6 (Harold) · tracking (Tomás) */
export function OrderFlow({ patientId }: { patientId: string }) {
  if (patientId === 'evelyn') return <EvelynOrder />
  if (patientId === 'harold') return <HaroldOrder />
  if (patientId === 'tomas') return <TrackingOnly />
  return <DeniseOrder />
}

function DeniseOrder() {
  const { set, log, s } = useConsole()
  const alreadySent = s.orders.find((o) => o.id === 'ORD-2291')?.status === 'sent'
  const [phase, setPhase] = useState<'checking' | 'ready' | 'signed' | 'sent'>(alreadySent ? 'sent' : 'checking')
  const [checked, setChecked] = useState(alreadySent ? 4 : 0)
  const [supplier, setSupplier] = useState(0)

  useEffect(() => {
    if (phase !== 'checking') return
    const timers = [1, 2, 3, 4].map((n) => setTimeout(() => setChecked(n), 650 * n))
    const done = setTimeout(() => {
      setPhase('ready')
      playSound('success')
    }, 650 * 4 + 300)
    return () => [...timers, done].forEach(clearTimeout)
  }, [phase])

  const crit: Crit[] = [
    { title: 'Diabetes diagnosis', detail: 'E11.649 · Type 2 diabetes with hypoglycemia', source: 'Problem list', state: checked >= 1 ? 'ok' : 'checking' },
    { title: 'Insulin-treated or problematic hypoglycemia', detail: checked >= 2 ? 'Glargine + lispro · 3 lows under 54 in 14 days' : 'Reading the medication list…', source: 'Med list · CGM', state: checked >= 2 ? 'ok' : checked >= 1 ? 'checking' : 'waiting' },
    { title: 'Visit in the last 6 months', detail: checked >= 3 ? 'In person, Aug 14, 2026 · Dr. Wen Chen' : 'Waiting…', source: 'Visit notes', state: checked >= 3 ? 'ok' : checked >= 2 ? 'checking' : 'waiting' },
    { title: 'Patient cost', detail: checked >= 4 ? 'Part B 20% coinsurance · about $38 a month' : 'Waiting…', source: 'Eligibility check', state: checked >= 4 ? 'ok' : checked >= 3 ? 'checking' : 'waiting' },
  ]

  const sign = () => {
    setPhase('signed')
    toast({ id: 'ord', message: 'Signing and sending to Harbor…', state: 'pending' })
    setTimeout(() => {
      setPhase('sent')
      set((c) => ({ orders: c.orders.map((o) => (o.id === 'ORD-2291' ? { ...o, status: 'sent', statusLabel: 'Sent · tracking' } : o)) }))
      log({ time: '10:16 AM', who: 'Dr. Wen Chen', action: 'Signed order', details: 'ORD-2291 · Dexcom G7 × 3' })
      toast({ id: 'ord', message: 'Order sent · Denise will get shipping updates', state: 'success' })
    }, 1300)
  }

  const steps: { label: string; state: StepState }[] = [
    { label: 'Item', state: 'done' },
    { label: 'Coverage', state: phase === 'checking' ? 'current' : 'done' },
    { label: 'Documents', state: phase === 'checking' ? 'upcoming' : 'done' },
    { label: 'Supplier', state: phase === 'checking' ? 'upcoming' : 'done' },
    { label: 'Sign and send', state: phase === 'sent' ? 'done' : phase === 'checking' ? 'upcoming' : 'current' },
  ]

  return (
    <>
      <Stepper steps={steps} />
      <AnimatePresence initial={false}>
        {phase === 'sent' ? (
          <motion.div initial={{ opacity: 0, transform: 'translateY(-6px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }}>
            <Banner type="success" size="web" title="Order sent to Harbor Home Medical · ORD-2291 · 10:16 AM">
              Order, prescription, visit note and coverage proof went as one packet. Denise will see shipping updates in her app.
            </Banner>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-[2.15] flex-col gap-3.5">
          <ItemCard product="Dexcom G7 sensor" qty="3 sensors / 30 days" start="Oct 5, 2026" />
          <Panel
            title="2  Coverage · Medicare Part B"
            right={
              phase === 'checking' ? (
                <span className="flex items-center gap-1.5 type-small-em text-brand">
                  <svg width="14" height="14" viewBox="0 0 16 16" className="status-spin" aria-hidden>
                    <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Checking Medicare (270/271)…
                </span>
              ) : (
                <Pill tone="inr">Checked live · 10:12 AM</Pill>
              )
            }
          >
            <Criteria items={crit} />
          </Panel>
          <AnimatePresence initial={false}>
            {phase !== 'checking' ? (
              <motion.div initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
                <Panel title="4  Supplier">
                  <div role="radiogroup" className="flex flex-col gap-2">
                    {(
                      [
                        ['Harbor Home Medical', 'In network · ships to 1420 Grand Ave, Apt 3B', '2 days'],
                        ['Keystone DME', 'In network', '4–6 days'],
                      ] as const
                    ).map(([t, d, eta], i) => (
                      <Choice
                        key={t}
                        on={supplier === i}
                        title={t}
                        detail={d}
                        onClick={() => phase === 'ready' && setSupplier(i)}
                        right={
                          <span className="flex items-center gap-1.5 type-small-em text-ink">
                            <Icon name="truck" size={16} className="text-ink-2" /> {eta}
                          </span>
                        }
                      />
                    ))}
                  </div>
                </Panel>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="flex min-w-[340px] flex-1 flex-col gap-3.5">
          <Panel title="Order summary">
            <div className="flex flex-col">
              <KV k="Patient" v="Denise Okafor" />
              <KV k="Medicare ID" v="•••• 4417A" />
              <KV k="Supplier" v={supplier === 0 ? 'Harbor Home Medical' : 'Keystone DME'} />
              <KV k="Patient cost" v="~$38 / month" />
              <KV k="Ordering clinician" v="Dr. Wen Chen, MD" />
            </div>
            {phase !== 'checking' ? (
              <div className="flex flex-col gap-1.5 rounded-sm bg-canvas p-3">
                <span className="type-small text-ink-2">Signature</span>
                <svg viewBox="0 0 220 44" className="h-11 w-[220px] text-ink" aria-hidden>
                  <motion.path
                    d="M6 30c10-18 18-22 22-12s-4 18 4 8 12-20 18-10-2 16 6 8 10-12 16-6 4 10 12 2c8-8 14-8 18-2s10 6 18-2 12-6 18 0 14 4 22-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: phase === 'ready' ? 0 : 1, opacity: phase === 'ready' ? 0 : 1 }}
                    transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                  />
                </svg>
                <span className="type-small text-ink-2">Wen Chen, MD · NPI 1780654321{phase !== 'ready' ? ' · 10:15 AM' : ''}</span>
              </div>
            ) : null}
            {phase === 'sent' ? (
              <Tracking />
            ) : (
              <>
                <Button size="web" className="w-full" disabled={phase !== 'ready'} onClick={sign}>
                  {phase === 'signed' ? 'Sending…' : 'Sign and send order'}
                </Button>
                {phase === 'checking' ? <span className="type-small text-ink-2">We’ll enable this when coverage is confirmed.</span> : null}
              </>
            )}
          </Panel>
          <Docs
            note={phase !== 'checking' ? 'Pulled from chart' : undefined}
            items={[
              ['Visit note', 'Aug 14, 2026'],
              ['CGM report', '14 days · AGP'],
              ['Prescription', phase === 'sent' ? 'Signed 10:15 AM' : 'Draft, awaiting signature'],
            ]}
          />
        </div>
      </div>
    </>
  )
}

function Tracking({ shipped }: { shipped?: boolean }) {
  const steps: [string, string, string][] = [
    ['Sent to supplier', '10:16 AM · ORD-2291', 'bg-inr'],
    ['Supplier accepted', '10:31 AM · Harbor', 'bg-inr'],
    ['Shipped', shipped ? 'Sep 28 · UPS' : 'Est. Oct 1 · UPS', shipped ? 'bg-inr' : 'bg-brand'],
    ['Delivered', shipped ? 'Est. Sep 30' : 'Est. Oct 3', 'bg-line'],
  ]
  return (
    <div className="flex flex-col">
      <span className="pb-1 type-h2 text-ink">Tracking</span>
      {steps.map(([t, d, dot], i) => (
        <motion.div key={t} initial={{ opacity: 0, transform: 'translateX(-6px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2.5 border-t border-line py-2">
          <span className={cn('size-2.5 rounded-full', dot)} />
          <span className="flex flex-col">
            <span className={cn('type-wbody-em', dot === 'bg-line' ? 'text-ink-3' : 'text-ink')}>{t}</span>
            <span className="type-small text-ink-2">{d}</span>
          </span>
        </motion.div>
      ))}
      <Button size="web" variant="outline" className="mt-2" onClick={() => go('console/orders')}>
        Back to orders
      </Button>
    </div>
  )
}

function TrackingOnly() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-[2.15] flex-col gap-3.5">
        <ItemCard product="Omnipod 5 pods" qty="10 pods / 30 days" start="Sep 28, 2026" />
        <Banner type="info" size="web" title="Prior authorization approved · Keystone DME">
          Pediatric pump supplies need prior auth. It was approved Sep 27, so this order shipped the same day.
        </Banner>
      </div>
      <div className="flex min-w-[340px] flex-1 flex-col">
        <Panel>
          <Tracking shipped />
        </Panel>
      </div>
    </div>
  )
}

/* D3 · Evelyn: criteria not met → choose a fix (approval card) */
function EvelynOrder() {
  const { set } = useConsole()
  const [held, setHeld] = useState(false)
  const crit: Crit[] = [
    { title: 'Diabetes diagnosis', detail: 'E11.649 · Type 2 diabetes with hypoglycemia', source: 'Problem list', state: 'ok' },
    { title: 'Insulin-treated or problematic hypoglycemia', detail: 'Glipizide · 2 lows under 54 documented in August', source: 'Med list · CGM', state: 'ok' },
    { title: 'Visit in the last 6 months', detail: 'Last in-person visit Feb 2, 2026 (8 months ago)', source: 'Visit notes', state: 'fail' },
    { title: 'Patient cost', detail: 'Part B 20% coinsurance · about $38 a month', source: 'Eligibility check', state: 'ok' },
  ]
  return (
    <>
      <Stepper
        steps={[
          { label: 'Item', state: 'done' },
          { label: 'Coverage', state: held ? 'current' : 'error' },
          { label: 'Documents', state: 'upcoming' },
          { label: 'Supplier', state: 'upcoming' },
          { label: 'Sign and send', state: 'upcoming' },
        ]}
      />
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-[2.15] flex-col gap-3.5">
          <ItemCard product="FreeStyle Libre 3 sensor" qty="2 sensors / 28 days" start="Oct 2, 2026" />
          <Panel title="2  Coverage · Medicare Part B" right={<Pill tone="vlow">1 criterion not met</Pill>} tone="error">
            <Criteria items={crit} />
          </Panel>
          {held ? (
            <Banner type="info" size="web" title="Visit booked · order on hold">
              Telehealth with Dr. Chen, Oct 1 at 9:30 AM. When the visit note is signed, coverage re-checks and this order unlocks automatically.
            </Banner>
          ) : (
            <ApprovalCard
              density="web"
              title="Fix the coverage gap"
              resettable={false}
              questions={[
                {
                  q: 'How do you want to fix this?',
                  type: 'radio',
                  options: ['Book a telehealth visit', 'Attach a visit note', 'Continue as patient-pay'],
                  hints: [
                    'Counts toward Medicare’s 6-month rule · Dr. Chen, Oct 1 at 9:30 AM',
                    'Upload a note from a visit in the last 6 months',
                    'About $182 a month for Evelyn · not recommended',
                  ],
                },
                {
                  q: 'Tell Evelyn how?',
                  type: 'check',
                  options: ['Text in her app', 'Call her', 'Mail a letter'],
                },
              ]}
              labels={{ send: 'Book visit and hold order', sentMessage: 'Visit booked · order held' }}
              onSubmitted={() => {
                setHeld(true)
                set((c) => ({ orders: c.orders.map((o) => (o.id === 'ORD-2290' ? { ...o, status: 'shipped', statusLabel: 'On hold · visit Oct 1', coverage: 'Visit booked', coverageTone: 'high' } : o)) }))
                toast({ message: 'Telehealth booked · ORD-2290 on hold', state: 'success' })
              }}
            />
          )}
        </div>
        <div className="flex min-w-[340px] flex-1 flex-col gap-3.5">
          <Panel title="Order summary">
            <div className="flex flex-col">
              <KV k="Patient" v="Evelyn Park" />
              <KV k="Medicare ID" v="•••• 8823C" />
              <KV k="Supplier" v="Harbor Home Medical" />
              <KV k="Patient cost" v="~$38 / month" />
              <KV k="Ordering clinician" v="Dr. Wen Chen, MD" />
            </div>
            <Button size="web" className="w-full" disabled>
              Sign and send order
            </Button>
            <span className="type-small text-vlow">{held ? 'Unlocks after the Oct 1 visit note is signed.' : 'Blocked: Medicare would deny this order today.'}</span>
          </Panel>
          <Docs
            items={[
              ['Visit note', 'Feb 2, 2026 · too old', true],
              ['CGM report', '14 days · AGP'],
              ['Prescription', 'Draft, awaiting signature'],
            ]}
          />
        </div>
      </div>
    </>
  )
}

/* D6 · Harold: payer denied CO-16 → fix → resubmit */
function HaroldOrder() {
  const { set, log } = useConsole()
  const [fix, setFix] = useState(true)
  const [state, setState] = useState<'denied' | 'sending' | 'resubmitted'>('denied')
  const resubmit = () => {
    setState('sending')
    toast({ id: 'h', message: 'Resubmitting to Harbor…', state: 'pending' })
    setTimeout(() => {
      setState('resubmitted')
      set((c) => ({ orders: c.orders.map((o) => (o.id === 'ORD-2286' ? { ...o, status: 'sent', statusLabel: 'Resubmitted', coverage: 'Attestation added', coverageTone: 'inr' } : o)) }))
      log({ time: '10:22 AM', who: 'Dr. Wen Chen', action: 'Resubmitted order', details: 'ORD-2286 · insulin attestation added (CO-16 fix)' })
      toast({ id: 'h', message: 'Resubmitted · Harbor will re-bill Medicare', state: 'success' })
    }, 1200)
  }
  return (
    <>
      <Stepper
        steps={[
          { label: 'Item', state: 'done' },
          { label: 'Coverage', state: 'done' },
          { label: 'Documents', state: state === 'resubmitted' ? 'done' : 'error' },
          { label: 'Supplier', state: 'done' },
          { label: 'Resubmit', state: state === 'resubmitted' ? 'done' : 'current' },
        ]}
      />
      {state === 'resubmitted' ? (
        <Banner type="success" size="web" title="Resubmitted to Harbor Home Medical · ORD-2286">
          The prescription now includes the insulin attestation. Harbor re-bills Medicare today; we’ll tell you when it’s paid.
        </Banner>
      ) : (
        <Banner type="error" size="web" title="Medicare denied this order · CO-16 (missing information)">
          Harbor Home Medical’s claim was denied Sep 26: the prescription didn’t say Harold uses insulin. Fix it below and resubmit. Appeal window closes Nov 25.
        </Banner>
      )}
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-[2.15] flex-col gap-3.5">
          <ItemCard product="Dexcom G7 sensor" qty="3 sensors / 30 days" start="Oct 5, 2026" />
          <Panel title="Fix and resubmit">
            <div className={cn('flex items-start gap-2.5 rounded-sm p-3', fix ? 'bg-tint' : 'bg-canvas')}>
              <Checkbox on={fix} onChange={setFix}>
                <span className="flex flex-col">
                  <span className="type-wbody-em text-ink">Add insulin attestation to the prescription</span>
                  <span className="type-small text-ink-2">Pulled from chart: “Patient uses insulin glargine 18 u nightly and lispro with meals.”</span>
                </span>
              </Checkbox>
            </div>
            <Button size="web" className="w-fit" disabled={!fix || state !== 'denied'} onClick={resubmit}>
              {state === 'sending' ? 'Resubmitting…' : state === 'resubmitted' ? 'Resubmitted' : 'Resubmit to Harbor'}
            </Button>
          </Panel>
        </div>
        <div className="flex min-w-[340px] flex-1 flex-col gap-3.5">
          <Panel title="Order summary">
            <div className="flex flex-col">
              <KV k="Patient" v="Harold Kim" />
              <KV k="Medicare ID" v="•••• 2290B" />
              <KV k="Supplier" v="Harbor Home Medical" />
              <KV k="Patient cost" v="~$38 / month" />
              <KV k="Ordering clinician" v="Dr. Wen Chen, MD" />
            </div>
          </Panel>
          <Docs
            items={[
              ['Visit note', 'Aug 14, 2026'],
              ['CGM report', '14 days · AGP'],
              ['Prescription', state === 'resubmitted' ? 'Attestation added' : 'Missing insulin attestation', state !== 'resubmitted'],
            ]}
          />
        </div>
      </div>
    </>
  )
}
