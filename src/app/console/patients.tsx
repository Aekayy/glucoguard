import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { AGPChart, TIRBar } from '@/components/charts/charts'
import { Icon } from '@/components/icons'
import { Avatar, Banner, Chip } from '@/components/hearth/ios'
import { Button } from '@/components/ui/button'
import { playSound } from '@/components/ui/sound'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { go } from '@/lib/use-hash-route'

import { KV, Panel, Pill, Stat, Stepper, Tabs, WebField, type StepState } from './web'

type Risk = ['vlow' | 'high' | 'inr' | 'nod', string]
const PATIENTS: { id: string; name: string; meta: string; risk: Risk; tir: [number, number, number, number, number]; tirPct: string; under54: string; u54Bad?: boolean; last: string; device: string; days: string; daysRisk?: boolean; next: string; nextGo?: string }[] = [
  { id: 'denise', name: 'Denise Okafor', meta: '67 · T2 · insulin · Dr. Chen', risk: ['vlow', 'High risk'], tir: [2, 5, 58, 25, 10], tirPct: '58%', under54: '2.1%', u54Bad: true, last: '49 · now', device: 'Dexcom G7', days: '24/30', next: 'Review dose', nextGo: 'console/patients/denise' },
  { id: 'rosa', name: 'Rosa Delgado', meta: '71 · T2 · insulin · ES', risk: ['vlow', 'High risk'], tir: [2, 6, 61, 23, 8], tirPct: '61%', under54: '1.4%', u54Bad: true, last: '58 · 2m', device: 'Libre 3', days: '27/30', next: 'Call today' },
  { id: 'harold', name: 'Harold Kim', meta: '79 · T2 · insulin', risk: ['high', 'Watch'], tir: [1, 2, 54, 29, 14], tirPct: '54%', under54: '0.2%', last: '214 · 4m', device: 'Dexcom G7', days: '29/30', next: 'Fix denial', nextGo: 'console/orders/harold' },
  { id: 'aisha', name: 'Aisha Johnson', meta: '45 · T1 · injections', risk: ['high', 'Watch'], tir: [1, 4, 69, 20, 6], tirPct: '69%', under54: '0.8%', last: '62 · 1m', device: 'Dexcom G7', days: '30/30', next: '—' },
  { id: 'tomas', name: 'Tomás Rivera', meta: '16 · T1 · pump · pediatric', risk: ['high', 'Watch'], tir: [1, 2, 57, 25, 15], tirPct: '57%', under54: '0.3%', last: '312 · 2m', device: 'Omnipod 5', days: '30/30', next: '—' },
  { id: 'marcus', name: 'Marcus Bell', meta: '34 · T1 · pump', risk: ['inr', 'Stable'], tir: [1, 3, 78, 15, 3], tirPct: '78%', under54: '0.4%', last: '66 · 1m', device: 'Dexcom G7', days: '30/30', next: '—' },
  { id: 'evelyn', name: 'Evelyn Park', meta: '58 · T2 · orals', risk: ['nod', 'No data'], tir: [1, 1, 74, 19, 5], tirPct: '74%', under54: '0.0%', last: '— · 3h', device: 'Libre 3', days: '14/30', daysRisk: true, next: 'Reorder sensor', nextGo: 'console/orders/evelyn' },
  { id: 'grace', name: 'Grace Liu', meta: '62 · T2 · insulin', risk: ['inr', 'Stable'], tir: [1, 1, 83, 13, 2], tirPct: '83%', under54: '0.1%', last: '118 · 3m', device: 'Dexcom G7', days: '30/30', next: '—' },
  { id: 'samuel', name: 'Samuel Ortiz', meta: '52 · T2 · insulin · ES', risk: ['inr', 'Stable'], tir: [1, 1, 76, 18, 4], tirPct: '76%', under54: '0.2%', last: '131 · 5m', device: 'Libre 3', days: '22/30', next: '—' },
]
const COLS = 'minmax(170px,1.6fr) 100px minmax(150px,1.3fr) 70px 90px 90px 90px minmax(110px,1fr)'

/* P1 · Patient panel */
export function Patients() {
  const [q, setQ] = useState('')
  const [pill, setPill] = useState<string | null>(null)
  const list = PATIENTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).filter((p) =>
    pill === 'risk' ? p.risk[0] === 'vlow' : pill === 'reorder' ? p.id === 'evelyn' || p.id === 'denise' : pill === 'data' ? p.daysRisk : pill === 'es' ? p.meta.includes('ES') : true,
  )
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-[38px] w-[300px] items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand">
          <Icon name="search" size={16} className="text-ink-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 214 patients" aria-label="Search patients" className="flex-1 bg-transparent type-wbody text-ink outline-none placeholder:text-ink-3" />
        </label>
        {(
          [
            ['risk', 'vlow', 'High risk 12'],
            ['reorder', 'high', 'Reorder due 5'],
            ['data', 'nod', 'Under 16 data days 23'],
            ['es', 'info', 'Spanish 31'],
          ] as const
        ).map(([id, tone, label]) => (
          <button key={id} type="button" aria-pressed={pill === id} onClick={() => setPill(pill === id ? null : id)} className={cn('rounded-full transition-shadow', pill === id && 'ring-2 ring-brand')}>
            <Pill tone={tone}>{label}</Pill>
          </button>
        ))}
        <Button size="web" className="ml-auto" onClick={() => go('console/enroll')}>
          Enroll patient
        </Button>
      </div>
      <div className="flex gap-3">
        <Stat label="Enrolled" value="214" sub="6 new this month" />
        <Stat label="Average time in range" value="68%" sub="goal 70%" />
        <Stat label="Lows this week" value="41" sub="9 very low" valueClass="text-vlow" />
        <Stat label="16+ data days" value="182" sub="85% billable" />
      </div>
      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="grid items-center gap-3 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2" style={{ gridTemplateColumns: COLS }}>
          <span>Patient</span>
          <span>Risk</span>
          <span>Time in range · 14 d</span>
          <span>Under 54</span>
          <span>Last reading</span>
          <span>Device</span>
          <span>Data days</span>
          <span>Next</span>
        </div>
        <AnimatePresence initial={false}>
          {list.map((p) => (
            <motion.button
              layout
              key={p.id}
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => (p.id === 'denise' ? go('console/patients/denise') : p.nextGo ? go(p.nextGo) : toast(`${p.name}’s chart isn’t part of this prototype`))}
              className={cn('grid h-[54px] w-full items-center gap-3 border-b border-line px-4 text-left transition-colors last:border-b-0 hover:bg-canvas', p.id === 'denise' && 'bg-tint hover:bg-tint')}
              style={{ gridTemplateColumns: COLS }}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate type-wbody-em text-ink">{p.name}</span>
                <span className="truncate type-small text-ink-2">{p.meta}</span>
              </span>
              <span>
                <Pill tone={p.risk[0]}>{p.risk[1]}</Pill>
              </span>
              <span className="flex items-center gap-2">
                <TIRBar parts={p.tir} height={10} className="w-[110px]" />
                <span className="type-wbody-em text-ink">{p.tirPct}</span>
              </span>
              <span className={cn('type-wbody-em', p.u54Bad ? 'text-vlow' : 'text-ink')}>{p.under54}</span>
              <span className="type-wbody text-ink">{p.last}</span>
              <span className="type-wbody text-ink">{p.device}</span>
              <span className="flex items-baseline gap-1.5">
                <span className={cn('type-wbody-em', p.daysRisk ? 'text-high' : 'text-ink')}>{p.days}</span>
                {p.daysRisk ? <span className="type-small text-high">at risk</span> : null}
              </span>
              <span className={cn('type-small-em', p.next === '—' ? 'text-ink-3' : 'text-brand')}>{p.next}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </section>
    </>
  )
}

/* P2 · Patient chart — Denise */
type ChartTab = 'Overview' | 'Readings' | 'Care plan' | 'Care circle' | 'Orders' | 'Notes' | 'Audit'
export function Chart() {
  const [tab, setTab] = useState<ChartTab>('Overview')
  return (
    <>
      <section className="flex items-center gap-4 rounded-md border border-line bg-surface p-[18px]">
        <Avatar initials="DO" size={56} className="type-h2" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h2 className="type-display text-ink">Denise Okafor</h2>
            <Chip state="veryLow" size="web">49 · alert open</Chip>
          </div>
          <span className="type-small text-ink-2">
            67 · Female · Type 2 on insulin · MRN 0048213 · Medicare Part B · Dr. Wen Chen · Care circle: Maria (daughter) · English
          </span>
        </div>
        <Button size="web" variant="outline" onClick={() => toast({ message: 'Message sent to Denise’s app', state: 'success' })}>
          Message
        </Button>
        <Button size="web" variant="outline" onClick={() => go('console/orders/new/denise')}>
          Order supplies
        </Button>
        <Button size="web" onClick={() => go('console/queue')}>
          Open alert
        </Button>
      </section>
      <Tabs tabs={['Overview', 'Readings', 'Care plan', 'Care circle', 'Orders', 'Notes', 'Audit'] as ChartTab[]} value={tab} onChange={setTab} />
      {tab !== 'Overview' ? (
        <Panel>
          <p className="type-wbody text-ink-2">
            The {tab} tab is designed in Figma (P2) but only the Overview is built in this prototype. The same data shows on Overview: readings, care plan, care circle and orders.
          </p>
        </Panel>
      ) : (
        <div className="flex gap-4">
          <div className="flex min-w-0 flex-[2.15] flex-col gap-4">
            <Panel title="Daily pattern · last 14 days" right={<Pill tone="vlow">Lows cluster 2–4 AM</Pill>}>
              <AGPChart height={200} />
              <div className="flex justify-between type-small text-ink-3">
                {['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'].map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-2.5">
                {[
                  ['58%', 'In range', ''],
                  ['7.1%', 'Under 70', 'text-vlow'],
                  ['2.1%', 'Under 54', 'text-vlow'],
                  ['7.4%', 'GMI', ''],
                  ['38%', 'Variability (CV)', 'text-high'],
                  ['96%', 'Sensor wear', ''],
                ].map(([v, l, c]) => (
                  <div key={l} className="flex flex-col gap-0.5 rounded-sm bg-canvas px-3 py-2.5">
                    <span className={cn('type-wnum', c || 'text-ink')}>{v}</span>
                    <span className="type-small text-ink-2">{l}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <section className="overflow-hidden rounded-md border border-line bg-surface">
              <div className="grid grid-cols-[1.3fr_0.7fr_0.6fr_2fr_1.1fr] gap-3 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2">
                <span>Low event</span>
                <span>Lowest</span>
                <span>Lasted</span>
                <span>Who responded</span>
                <span>Outcome</span>
              </div>
              {(
                [
                  ['Wed, Sep 30', '3:03 AM', '47', 'text-vlow', '32 min', 'Maria (caregiver) · 3:19', ['vlow', 'Open']],
                  ['Sat, Sep 26', '2:40 AM', '61', 'text-low', '21 min', 'Patient · 2:44', ['inr', 'Resolved']],
                  ['Tue, Sep 22', '10:42 AM', '64', 'text-low', '15 min', 'Patient · 10:44', ['inr', 'Resolved']],
                ] as const
              ).map(([d, t, low, c, lasted, who, [tone, out]]) => (
                <div key={d} className="grid grid-cols-[1.3fr_0.7fr_0.6fr_2fr_1.1fr] items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                  <span className="flex flex-col">
                    <span className="type-wbody-em text-ink">{d}</span>
                    <span className="type-small text-ink-2">{t}</span>
                  </span>
                  <span className={cn('type-wnum', c)}>{low}</span>
                  <span className="type-wbody text-ink">{lasted}</span>
                  <span className="type-wbody text-ink">{who}</span>
                  <span>
                    <Pill tone={tone}>{out}</Pill>
                  </span>
                </div>
              ))}
            </section>
          </div>
          <div className="flex min-w-[340px] flex-1 flex-col gap-4">
            <Panel title="Care plan" right={<span className="type-small text-ink-2">Updated Sep 30</span>}>
              <div className="flex flex-col">
                <KV k="Basal" v="Glargine 22 u · 9 PM" />
                <KV k="Correction" v="Lispro 2 u per 50 over 150" />
              </div>
              <div className="flex items-start gap-1.5 rounded-sm bg-high-tint px-2.5 py-2">
                <Icon name="clock" size={16} className="shrink-0 text-high" />
                <span className="type-small-em text-ink">Evening correction lowered from 4 to 2 u by Dr. Chen</span>
              </div>
            </Panel>
            <Panel title="Care circle">
              <div className="flex flex-col">
                <KV k="Maria Okafor · daughter" v={<Pill tone="inr">Accepted · SMS</Pill>} />
                <KV k="Order" v="You → Maria → on-call RN → 911" />
              </div>
            </Panel>
            <Panel title="Devices and supplies">
              <div className="flex flex-col">
                <KV k="Dexcom G7" v="Day 4 of 10 · sharing on" />
                <KV k="Sensors" v="Run out Oct 5" />
              </div>
              <Button size="web" variant="outline" onClick={() => go('console/orders/new/denise')}>
                Reorder sensors
              </Button>
            </Panel>
            <Panel title="Open follow-ups">
              <KV k="Review evening dose" v="Dr. Chen · due today" vClass="text-brand" />
            </Panel>
          </div>
        </div>
      )}
    </>
  )
}

/* P3 / P4 / P5 · Enroll with live eligibility */
export function Enroll() {
  const [mbi, setMbi] = useState('1EG4-TE5-MK27')
  const [check, setCheck] = useState<'idle' | 'checking' | 'eligible' | 'notfound'>('notfound')
  const [step, setStep] = useState<'insurance' | 'invite'>('insurance')
  const recheck = () => {
    setCheck('checking')
    setTimeout(() => {
      const ok = mbi.replace(/\W/g, '').toUpperCase() === '1EG4TE5MK72'
      setCheck(ok ? 'eligible' : 'notfound')
      playSound(ok ? 'success' : 'error')
    }, 1200)
  }
  const insState: StepState = step === 'invite' ? 'done' : check === 'notfound' ? 'error' : 'current'
  const steps: { label: string; state: StepState }[] = [
    { label: 'Patient', state: 'done' },
    { label: 'Insurance', state: insState },
    { label: 'CGM device', state: step === 'invite' ? 'done' : 'upcoming' },
    { label: 'Care circle', state: step === 'invite' ? 'done' : 'upcoming' },
    { label: 'Invite', state: step === 'invite' ? 'current' : 'upcoming' },
  ]
  return (
    <>
      <Stepper steps={steps} />
      <div className="flex gap-4">
        <div className="flex min-w-0 flex-[2.15] flex-col gap-4">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'insurance' ? (
              <motion.div key="ins" initial={{ opacity: 0, transform: 'translateX(-8px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} exit={{ opacity: 0, transform: 'translateX(-8px)' }} className="flex flex-col gap-4">
                <Panel title="Insurance" right={<span className="type-small text-ink-2">Required for RPM billing</span>} tone={check === 'notfound' ? 'error' : undefined}>
                  <div className="grid grid-cols-2 gap-3">
                    <WebField label="Primary payer" value="Medicare Part B" readOnly />
                    <WebField
                      label="Medicare ID (MBI)"
                      value={mbi}
                      onChange={(v) => {
                        setMbi(v)
                        if (check === 'notfound') setCheck('idle')
                      }}
                      error={check === 'notfound' ? 'Medicare returned “member not found”. Check the ID on the card.' : null}
                      helper="Demo: the card says 1EG4-TE5-MK72 (last two digits were swapped)."
                    />
                    <WebField label="Secondary insurance" value="None" readOnly />
                    <WebField label="Consent for RPM" value="Signed today · Spanish form" readOnly />
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={check} initial={{ opacity: 0, transform: 'translateY(4px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} exit={{ opacity: 0 }}>
                      {check === 'eligible' ? (
                        <Banner type="success" size="web" title="Eligible · Medicare Part B active">
                          RPM codes 99453, 99454 and 99457 are covered. Rosa’s 20% coinsurance is about $19 a month. Checked 10:02 AM.
                        </Banner>
                      ) : check === 'notfound' ? (
                        <Banner type="error" size="web" title="Coverage not found">
                          We couldn’t confirm Rosa’s Medicare coverage. Fix the ID and re-check, or enroll as self-pay and re-check later.
                        </Banner>
                      ) : check === 'checking' ? (
                        <Banner type="info" size="web" title="Checking Medicare (270/271)…">
                          Usually under 3 seconds.
                        </Banner>
                      ) : (
                        <Banner type="info" size="web" title="Ready to check">
                          We’ll ask Medicare in real time. No fax, no phone call.
                        </Banner>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  {check !== 'eligible' ? (
                    <div className="flex gap-2.5">
                      <Button size="web" onClick={recheck} disabled={check === 'checking'}>
                        {check === 'checking' ? 'Checking…' : 'Re-check coverage'}
                      </Button>
                      <Button size="web" variant="outline" onClick={() => toast('Enrolled as self-pay · we’ll re-check in 7 days')}>
                        Enroll as self-pay
                      </Button>
                    </div>
                  ) : null}
                </Panel>
                <div className="flex gap-2.5">
                  <Button size="web" variant="outline" onClick={() => go('console/patients')}>
                    Back
                  </Button>
                  <Button size="web" disabled={check !== 'eligible'} onClick={() => setStep('invite')}>
                    Continue to device
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="inv" initial={{ opacity: 0, transform: 'translateX(8px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} className="flex flex-col gap-4">
                <Panel title="Rosa is invited" right={<span className="type-small text-ink-2">Sent 10:06 AM</span>}>
                  <div className="flex items-center gap-6">
                    <div className="grid size-[154px] shrink-0 grid-cols-9 gap-[3px] rounded-sm border border-line bg-white p-2.5" aria-label="Join QR code" role="img">
                      {Array.from({ length: 81 }, (_, i) => {
                        const r = Math.floor(i / 9)
                        const c = i % 9
                        const finder = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3)
                        const on = finder ? !(r % 3 === 1 && c % 3 === 1) : (r * 3 + c * 5 + r * c) % 4 < 2
                        return <span key={i} className={on ? 'bg-[#241b25]' : 'bg-white'} />
                      })}
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="type-small text-ink-2">Join code</span>
                      <span className="type-display tracking-[2px] text-ink">JH4 · 72K</span>
                      <span className="type-wbody text-ink-2">Texted in Spanish to (773) 555-0149. Rosa can also scan this code at her next visit.</span>
                    </div>
                  </div>
                </Panel>
                <Panel title="What happens next">
                  {[
                    ['Rosa connects her Libre 3', 'We’ll let you know if it fails'],
                    ['She adds her care circle', 'Her son Luis is suggested from intake'],
                    ['First reading arrives', 'Starts the 99453 setup and 99454 device clock'],
                  ].map(([t, d]) => (
                    <div key={t} className="flex items-center gap-2.5 border-t border-line pt-2.5 first-of-type:border-t-0">
                      <Icon name="checkc" size={20} className="text-ink-3" />
                      <span className="flex flex-col">
                        <span className="type-wbody-em text-ink">{t}</span>
                        <span className="type-small text-ink-2">{d}</span>
                      </span>
                    </div>
                  ))}
                </Panel>
                <div className="flex gap-2.5">
                  <Button size="web" variant="outline" onClick={() => toast({ message: 'Welcome sheet sent to printer (Español)', state: 'success' })}>
                    Print welcome sheet (Español)
                  </Button>
                  <Button
                    size="web"
                    onClick={() => {
                      toast({ message: 'Rosa Delgado enrolled · invite sent', state: 'success' })
                      go('console/patients')
                    }}
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex min-w-[340px] flex-1 flex-col gap-4">
          <Panel title="Patient">
            <div className="flex flex-col">
              <KV k="Name" v="Rosa Delgado" />
              <KV k="Date of birth" v="Jun 2, 1955 · 71" />
              <KV k="Mobile" v="(773) 555-0149" />
              <KV k="Diabetes" v="Type 2 · insulin" />
              <KV k="CGM" v="FreeStyle Libre 3" />
            </div>
            <div className="flex items-start gap-2 rounded-sm bg-info-tint px-2.5 py-2">
              <Icon name="globe" size={16} className="shrink-0 text-info" />
              <span className="type-small-em text-ink">Prefers Spanish. Invites and alerts will be in Spanish.</span>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
