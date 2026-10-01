import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Icon, type IconName } from '@/components/icons'
import { Avatar, Banner } from '@/components/hearth/ios'
import { Button } from '@/components/ui/button'
import { playSound } from '@/components/ui/sound'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { go } from '@/lib/use-hash-route'

import { useConsole } from './console-state'
import { FilterChips, KV, Modal, Panel, Pill, Stat } from './web'

/* ── PR1 / PR2 / PR3 · Protocol builder ─────────────────────── */
function Token({ children, bad, onClick }: { children: React.ReactNode; bad?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('inline-flex h-[26px] items-center rounded-[6px] px-2 type-wbody-em transition-colors', bad ? 'bg-vlow-tint text-vlow ring-1 ring-low' : 'bg-tint text-brand hover:bg-brand/15')}
    >
      {children}
    </button>
  )
}

export function Protocols() {
  const { s, set, log } = useConsole()
  const p = s.protocol
  const [tried, setTried] = useState(false)
  const [sim, setSim] = useState(false)
  const errors = [!p.weekendCovered && 'Step 3 has no on-call coordinator on weekend nights', p.step4Wait < 10 && 'step 4 waits less than the 10-minute minimum before calling 911'].filter(Boolean) as string[]
  const showErrors = tried && errors.length > 0 && !p.publishedV4

  const cycleWait = () => set((c) => ({ protocol: { ...c.protocol, step4Wait: c.protocol.step4Wait === 10 ? 5 : c.protocol.step4Wait === 5 ? 15 : 10 } }))
  const publish = () => {
    setTried(true)
    if (errors.length) {
      playSound('error')
      return
    }
    set((c) => ({ protocol: { ...c.protocol, publishedV4: true } }))
    setSim(true)
    log({ time: '10:42 AM', who: 'Dr. Wen Chen', action: 'Published protocol', details: `Overnight urgent low v4 · 911 wait ${p.step4Wait} min` })
    toast({ message: 'Published v4 · applies to 188 patients from 10 PM tonight', state: 'success' })
  }
  const t911 = 18 + p.step4Wait

  const steps: { n: number; icon: IconName; tint?: boolean; title: string; detail: string; detailBad?: boolean; wait: string; waitBad?: boolean; label: string; onWait?: () => void }[] = [
    { n: 1, icon: 'bell', title: 'You (the patient)', detail: 'Critical Alert with sound, even on silent', wait: '10 min', label: 'Wait' },
    { n: 2, icon: 'care', title: 'Care circle, in order', detail: 'Call, then text · Maria Okafor first', wait: '5 min', label: 'Wait' },
    { n: 3, icon: 'nurse', title: 'On-call coordinator', detail: showErrors && !p.weekendCovered ? 'No coordinator on call Sat–Sun, 10 PM–7 AM' : 'Page the RN on call · Priya (day), Marcus (night)', detailBad: showErrors && !p.weekendCovered, wait: '10 min', label: 'Wait' },
    { n: 4, icon: 'siren', tint: true, title: '911', detail: 'Address, summary and door code · only if nobody has confirmed', wait: `${p.step4Wait} min`, waitBad: showErrors && p.step4Wait < 10, label: 'Wait before', onWait: cycleWait },
  ]

  return (
    <div className="flex gap-4">
      <aside className="flex w-[240px] shrink-0 flex-col gap-1 self-start rounded-md border border-line bg-surface p-2.5">
        <span className="px-2 pt-1 pb-1.5 type-eyebrow text-ink-2">Protocols</span>
        {[
          ['Overnight urgent low', p.publishedV4 ? 'v4 live · 188 patients' : 'v3 live · 188 patients', true],
          ['Daytime low', 'v5 live · 214'],
          ['High over 250 for 2 h', 'v2 live · 214'],
          ['Signal loss over 1 h', 'v1 live · 214'],
          ['Pediatric (under 18)', 'v2 live · 9'],
        ].map(([t, d, on]) => (
          <button key={t as string} type="button" className={cn('flex flex-col gap-0.5 rounded-sm px-2.5 py-2 text-left', on ? 'bg-tint' : 'hover:bg-canvas')}>
            <span className={cn('type-wbody-em', on ? 'text-brand' : 'text-ink')}>{t}</span>
            <span className="type-small text-ink-2">{d}</span>
          </button>
        ))}
        <button type="button" className="flex items-center gap-1.5 px-2.5 py-2 type-wbody-em text-brand">
          <Icon name="plus" size={16} /> New protocol
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2.5">
          {p.publishedV4 ? <Pill tone="inr">v4 published 10:42 AM</Pill> : <Pill tone="high">Draft v4 · not published</Pill>}
          <span className="ml-auto" />
          <Button size="web" variant="outline" onClick={() => setSim(true)}>
            Test this protocol
          </Button>
          <Button size="web" onClick={publish} disabled={p.publishedV4 || showErrors}>
            {p.publishedV4 ? 'Published' : 'Publish v4'}
          </Button>
        </div>
        <AnimatePresence initial={false}>
          {showErrors ? (
            <motion.div initial={{ opacity: 0, transform: 'translateY(-6px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} exit={{ opacity: 0 }}>
              <Banner
                type="error"
                size="web"
                title={`${errors.length} problem${errors.length > 1 ? 's' : ''} block${errors.length > 1 ? '' : 's'} publishing`}
                action={
                  !p.weekendCovered ? (
                    <Button size="web" variant="outline" onClick={() => go('console/team')}>
                      Fix in on-call schedule
                    </Button>
                  ) : undefined
                }
              >
                {errors.join(', and ')}.
              </Banner>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <section className="flex flex-col gap-2.5 rounded-md border border-line bg-surface p-4">
          <span className="type-eyebrow text-brand">When</span>
          <p className="flex flex-wrap items-center gap-1.5 type-wbody text-ink">
            Glucose is under <Token>54 mg/dL</Token> for <Token>10 min</Token> or under 70 and falling faster than <Token>3 mg/dL/min</Token>
          </p>
          <p className="flex flex-wrap items-center gap-1.5 type-wbody text-ink">
            AND the time is between <Token>10 PM</Token> and <Token>7 AM</Token> <span className="text-ink-2">· applies to</span> <Token>Patients on insulin (188)</Token>
          </p>
        </section>
        {steps.map((st) => (
          <motion.section
            layout
            key={st.n}
            className={cn('flex items-center gap-3.5 rounded-md border bg-surface p-3.5', st.detailBad || st.waitBad ? 'border-low' : 'border-line')}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tint type-wbody-em text-brand">{st.n}</span>
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-sm', st.tint ? 'bg-vlow-tint text-vlow' : 'bg-canvas text-brand')}>
              <Icon name={st.icon} size={18} />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="type-wbody-em text-ink">{st.title}</span>
              <span className={cn('type-small', st.detailBad ? 'text-vlow' : 'text-ink-2')}>{st.detail}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="type-small text-ink-2">{st.label}</span>
              <Token bad={st.waitBad} onClick={st.onWait}>
                {st.wait}
              </Token>
            </span>
          </motion.section>
        ))}
        <button type="button" className="flex items-center gap-1.5 rounded-md border border-dashed border-line px-3.5 py-2.5 type-wbody-em text-brand">
          <Icon name="plus" size={16} /> Add a step
        </button>
        <p className="type-small text-ink-3">Demo: click step 4’s wait to change it (5 min breaks the 10-minute rule), then Publish.</p>
      </div>

      <div className="flex w-[340px] shrink-0 flex-col gap-3">
        <AnimatePresence initial={false}>
          {sim ? (
            <motion.div initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} exit={{ opacity: 0 }}>
              <Panel title="Simulation" right={errors.length ? <Pill tone="vlow">Gaps found</Pill> : <Pill tone="inr">Passed</Pill>}>
                <span className="type-small text-ink-2">Denise, 49 mg/dL at 3:03 AM, nobody responds:</span>
                {[
                  ['3:03', 'Critical Alert to Denise'],
                  ['3:13', 'Call Maria, then text'],
                  ['3:18', p.weekendCovered ? 'Page Marcus Lee, RN (night)' : 'Page on-call RN · nobody on Sat–Sun'],
                  [`3:${String(t911).padStart(2, '0')}`, '911 with address and door code'],
                ].map(([t, d], i) => (
                  <motion.div key={d} initial={{ opacity: 0, transform: 'translateX(-6px)' }} animate={{ opacity: 1, transform: 'translateX(0)' }} transition={{ delay: i * 0.12 }} className="flex gap-2.5 border-t border-line pt-2">
                    <span className="w-9 type-small-em text-ink-2">{t}</span>
                    <span className={cn('type-wbody', i === 2 && !p.weekendCovered ? 'text-vlow' : 'text-ink')}>{d}</span>
                  </motion.div>
                ))}
                <div className="flex items-center gap-1.5 rounded-sm bg-canvas px-2.5 py-2">
                  <Icon name="clock" size={16} className="text-ink-2" />
                  <span className="type-small-em text-ink">Worst case to 911: {t911 - 3} minutes</span>
                </div>
              </Panel>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <Panel title="On-call coverage" right={p.weekendCovered ? <Pill tone="inr">Covered</Pill> : <Pill tone="vlow">Gap</Pill>}>
          <div className="grid grid-cols-7 gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="type-small text-ink-2">{d}</span>
                <span className="h-7 w-full rounded-[6px] bg-inr-tint" />
                <span className={cn('h-7 w-full rounded-[6px]', i > 4 && !p.weekendCovered ? 'bg-vlow-tint ring-1 ring-low' : 'bg-tint')} />
              </div>
            ))}
          </div>
          <span className="type-small text-ink-2">Day 7 AM–7 PM · Night 7 PM–7 AM</span>
          {!p.weekendCovered ? (
            <Button size="web" variant="outline" onClick={() => go('console/team')}>
              Fix in on-call schedule
            </Button>
          ) : null}
        </Panel>
        <Panel title="Applies to">
          <div className="flex flex-col">
            <KV k="Patients on insulin" v="188" />
            <KV k="Care circles reached" v="171" />
            <KV k="Excludes pediatric" v="9 (own protocol)" />
          </div>
        </Panel>
        <Panel title="Version history">
          <div className="flex flex-col">
            {p.publishedV4 ? <KV k={<span className="type-wbody-em text-brand">v4</span>} v={<span className="type-small text-ink-2">Today · Dr. Chen · simulated</span>} /> : null}
            <KV k={<span className="type-wbody-em text-brand">v3</span>} v={<span className="type-small text-ink-2">Sep 2 · Dr. Chen · wait 15→10 min</span>} />
            <KV k={<span className="type-wbody-em text-brand">v2</span>} v={<span className="type-small text-ink-2">Jul 18 · added care circle step</span>} />
            <KV k={<span className="type-wbody-em text-brand">v1</span>} v={<span className="type-small text-ink-2">May 3 · created</span>} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ── B1 / B2 · RPM billing ──────────────────────────────────── */
type BillRow = { name: string; status: string; tone: 'inr' | 'high' | 'vlow'; days: string; daysBad?: boolean; minutes: string; codes: string; action?: string }
const READY: BillRow[] = [
  { name: 'Denise Okafor', status: 'Ready', tone: 'inr', days: '24/30', minutes: '48 min', codes: '99454, 99457, 99458' },
  { name: 'Rosa Delgado', status: 'Ready', tone: 'inr', days: '27/30', minutes: '26 min', codes: '99454, 99457' },
  { name: 'Harold Kim', status: 'Ready', tone: 'inr', days: '29/30', minutes: '21 min', codes: '99454, 99457' },
  { name: 'Aisha Johnson', status: 'Needs 6 more minutes', tone: 'high', days: '30/30', minutes: '14 min', codes: '99454', action: 'Log call' },
  { name: 'Evelyn Park', status: 'Needs 2 more data days', tone: 'high', days: '14/30', daysBad: true, minutes: '22 min', codes: '99457', action: 'Remind' },
  { name: 'Tomás Rivera', status: 'Ready', tone: 'inr', days: '30/30', minutes: '41 min', codes: '99454, 99457, 99458' },
  { name: 'Marcus Bell', status: 'Ready', tone: 'inr', days: '30/30', minutes: '20 min', codes: '99454, 99457' },
]
const FIXES: BillRow[] = [
  { name: 'Evelyn Park', status: 'Missing consent signature', tone: 'vlow', days: '14/30', minutes: '22 min', codes: '99454, 99457', action: 'Upload consent' },
  { name: 'Samuel Ortiz', status: 'Duplicate 99457 with outside clinic', tone: 'vlow', days: '22/30', minutes: '31 min', codes: '99457', action: 'Review' },
  { name: 'Grace Liu', status: 'MBI doesn’t match Medicare', tone: 'vlow', days: '30/30', minutes: '24 min', codes: '99454, 99457', action: 'Fix ID' },
]
const BCOLS = 'minmax(150px,1fr) minmax(200px,1.4fr) 110px 120px minmax(150px,1fr) 150px'

export function Billing() {
  const { s, set, log } = useConsole()
  const [rows, setRows] = useState(READY)
  const [fixes, setFixes] = useState(FIXES)
  const [confirm, setConfirm] = useState(false)
  const [filter, setFilter] = useState<'ready' | 'data' | 'time' | 'all' | 'fixes'>('ready')
  const submitted = s.billingSubmitted
  const readyCount = 141 + rows.filter((r) => r.status === 'Ready').length - 5

  const act = (r: BillRow) => {
    if (r.action === 'Log call') {
      setRows((all) => all.map((x) => (x.name === r.name ? { ...x, status: 'Ready', tone: 'inr', minutes: '21 min', codes: '99454, 99457', action: undefined } : x)))
      toast({ message: 'Logged 7-minute call with Aisha · now billable', state: 'success' })
    } else if (r.action === 'Remind') {
      setRows((all) => all.map((x) => (x.name === r.name ? { ...x, status: 'Reminder sent · can still reach 16', action: undefined } : x)))
      toast({ message: 'Sensor reminder sent to Evelyn (app + SMS)', state: 'success' })
    } else {
      setFixes((all) => all.filter((x) => x.name !== r.name))
      toast({ message: `${r.name}: fixed and re-queued for billing`, state: 'success' })
    }
  }

  const list = submitted ? fixes : rows
  return (
    <>
      <div className="flex gap-3">
        <Stat label="99453 · setup" value="6" sub="new patients" />
        <Stat label="99454 · 16+ data days" value="182" sub="of 214" />
        <Stat label="99457 · first 20 min" value="141" sub="interactive" />
        <Stat label="99458 · extra 20 min" value="57" />
      </div>
      {submitted ? (
        <Banner type="success" size="web" title="141 claims sent to Northside billing · batch RPM-2026-09">
          Sent Sep 30 at 4:12 PM. {fixes.length ? `${fixes.length} claim${fixes.length > 1 ? 's' : ''} need fixes before they can go.` : 'Every claim is through.'}
        </Banner>
      ) : (
        <Banner type="warning" size="web" title="23 patients have under 16 data days">
          9 can still reach 16 by Sep 30. Send them a reminder to wear their sensor.
        </Banner>
      )}
      <div className="flex items-center gap-2">
        <FilterChips
          value={submitted ? 'fixes' : filter}
          onChange={setFilter}
          items={
            submitted
              ? [
                  { id: 'fixes', label: 'Needs fixes', count: fixes.length },
                  { id: 'data', label: 'Needs data', count: 23 },
                  { id: 'time', label: 'Needs time', count: 14 },
                  { id: 'all', label: 'All', count: 214 },
                ]
              : [
                  { id: 'ready', label: 'Ready', count: readyCount },
                  { id: 'data', label: 'Needs data', count: 23 },
                  { id: 'time', label: 'Needs time', count: 14 },
                  { id: 'all', label: 'All', count: 214 },
                ]
          }
        />
        <Button size="web" variant="outline" className="ml-auto" onClick={() => toast({ message: 'RPM-2026-09.csv exported', state: 'success' })}>
          Export CSV
        </Button>
        {!submitted ? (
          <Button size="web" onClick={() => setConfirm(true)}>
            Review and submit {readyCount} claims
          </Button>
        ) : null}
      </div>
      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="grid gap-3 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2" style={{ gridTemplateColumns: BCOLS }}>
          <span>Patient</span>
          <span>Status</span>
          <span>Data days</span>
          <span>Interactive min</span>
          <span>Codes</span>
          <span>Action</span>
        </div>
        <AnimatePresence initial={false}>
          {list.map((r) => (
            <motion.div
              layout
              key={r.name + r.status}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transform: 'translateX(24px)' }}
              className="grid h-[52px] items-center gap-3 border-b border-line px-4 last:border-b-0"
              style={{ gridTemplateColumns: BCOLS }}
            >
              <span className="type-wbody-em text-ink">{r.name}</span>
              <span>
                <Pill tone={r.tone}>{r.status}</Pill>
              </span>
              <span className={cn('type-wbody-em', r.daysBad ? 'text-high' : 'text-ink')}>{r.days}</span>
              <span className="type-wbody text-ink">{r.minutes}</span>
              <span className="type-small-em text-ink-2">{r.codes}</span>
              <span>
                {r.action ? (
                  <button type="button" onClick={() => act(r)} className="type-small-em text-brand hover:underline">
                    {r.action}
                  </button>
                ) : (
                  <span className="type-small text-ink-3">—</span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {submitted && fixes.length === 0 ? <p className="p-6 text-center type-wbody text-ink-2">All fixes done. The re-queued claims go out in tonight’s batch.</p> : null}
      </section>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Submit ${readyCount} claims to Northside billing?`}
        description="Each claim includes the data days and interactive minutes as evidence. You can still fix individual claims afterwards."
        footer={
          <>
            <span className="flex-1 type-small text-ink-2">Batch RPM-2026-09 · logged for audit</span>
            <Button size="web" variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              size="web"
              onClick={() => {
                setConfirm(false)
                set({ billingSubmitted: true })
                log({ time: '4:12 PM', who: 'Priya Shah, RN', action: 'Submitted claims', details: `Batch RPM-2026-09 · ${readyCount} claims` })
                toast({ message: `${readyCount} claims sent · 3 need fixes`, state: 'success' })
              }}
            >
              Submit claims
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            ['99453', '6'],
            ['99454', '182'],
            ['99457', '141'],
            ['99458', '57'],
          ].map(([c, n]) => (
            <div key={c} className="flex flex-col rounded-sm bg-canvas p-2.5">
              <span className="type-wnum text-ink">{n}</span>
              <span className="type-small text-ink-2">{c}</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}

/* ── AU1 · Audit log ─────────────────────────────────────────── */
export function Audit() {
  const { s } = useConsole()
  const [who, setWho] = useState<'all' | 'people' | 'system'>('all')
  const list = s.audit.filter((e) => (who === 'all' ? true : who === 'system' ? e.who === 'System' : e.who !== 'System'))
  const COLS = '100px 170px 170px minmax(220px,1fr) 190px'
  return (
    <>
      <div className="flex items-center gap-2">
        {['Sep 29–30', 'Denise Okafor ×'].map((f) => (
          <span key={f} className="flex h-9 items-center rounded-sm border border-line bg-surface px-3 type-wbody text-ink">
            {f}
          </span>
        ))}
        <FilterChips
          value={who}
          onChange={setWho}
          items={[
            { id: 'all', label: 'All actions' },
            { id: 'people', label: 'People' },
            { id: 'system', label: 'System' },
          ]}
        />
        <span className="ml-auto type-small text-ink-2">Kept 6 years (HIPAA)</span>
        <Button size="web" variant="outline" onClick={() => toast({ message: 'Audit export ready · signed PDF', state: 'success' })}>
          Export
        </Button>
      </div>
      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="grid gap-3 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2" style={{ gridTemplateColumns: COLS }}>
          <span>Time</span>
          <span>Who</span>
          <span>Action</span>
          <span>Details</span>
          <span>Device</span>
        </div>
        <AnimatePresence initial={false}>
          {list.map((e, i) => (
            <motion.div
              layout
              key={`${e.time}-${e.action}-${e.details}`}
              initial={{ opacity: 0, backgroundColor: 'var(--tint)' }}
              animate={{ opacity: 1, backgroundColor: 'var(--surface)' }}
              transition={{ backgroundColor: { duration: 1.6 } }}
              className="grid min-h-12 items-center gap-3 border-b border-line px-4 py-2 last:border-b-0"
              style={{ gridTemplateColumns: COLS }}
            >
              <span className="type-wbody text-ink-2 tabular-nums">{e.time}</span>
              <span className={cn('type-wbody-em', e.who === 'System' ? 'text-ink-2' : 'text-ink')}>{e.who}</span>
              <span className="type-wbody text-ink">{e.action}</span>
              <span className="type-wbody text-ink-2">{e.details}</span>
              <span className="type-small text-ink-2">{e.device}</span>
              {i === 0 ? null : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
      <p className="type-small text-ink-3">Actions you take in this prototype (take over, resolve, 911, sign, publish, submit) appear here at the top.</p>
    </>
  )
}

/* ── ST1 · On-call schedule ─────────────────────────────────── */
export function Team() {
  const { s, set, log } = useConsole()
  const [sat, setSat] = useState(s.protocol.weekendCovered)
  const [sun, setSun] = useState(s.protocol.weekendCovered)
  const covered = sat && sun
  const assign = (day: 'sat' | 'sun') => {
    if (day === 'sat') setSat(true)
    else setSun(true)
    playSound('select')
  }
  const days = ['MON 28', 'TUE 29', 'WED 30', 'THU 1', 'FRI 2', 'SAT 3', 'SUN 4']
  const rows: [string, string[]][] = [
    ['Day · 7 AM–7 PM', ['PS', 'PS', 'PS', 'JK', 'JK', 'PS', 'JK']],
    ['Night · 7 PM–7 AM', ['ML', 'ML', 'ML', 'ML', 'ML', sat ? 'ML' : '', sun ? 'JK' : '']],
    ['Physician backup', ['C', 'C', 'C', 'P', 'P', 'P', 'P']],
  ]
  const NAMES: Record<string, string> = { PS: 'Priya Shah', JK: 'Jordan Kim', ML: 'Marcus Lee', C: 'Dr. Chen', P: 'Dr. Patel' }
  return (
    <>
      <div className="flex items-center gap-2">
        <FilterChips value="oncall" onChange={() => undefined} items={[{ id: 'oncall', label: 'On-call' }, { id: 'members', label: 'Members', count: 12 }, { id: 'roles', label: 'Roles' }, { id: 'org', label: 'Organization' }]} />
        <span className="ml-auto type-wbody-em text-ink">Week of Sep 28</span>
        <Button
          size="web"
          disabled={!covered || s.protocol.weekendCovered}
          onClick={() => {
            set((c) => ({ protocol: { ...c.protocol, weekendCovered: true } }))
            log({ time: '10:38 AM', who: 'Priya Shah, RN', action: 'Published schedule', details: 'Weekend nights covered · Marcus Lee, Jordan Kim' })
            toast({ message: 'Schedule published · protocol can now publish', state: 'success', action: { label: 'Open protocol', run: () => go('console/protocols') } })
          }}
        >
          {s.protocol.weekendCovered ? 'Published' : 'Publish schedule'}
        </Button>
      </div>
      <AnimatePresence initial={false} mode="wait">
        {!s.protocol.weekendCovered ? (
          <motion.div key="warn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Banner type="warning" size="web" title="Weekend nights are uncovered">
              Sat–Sun 7 PM–7 AM has no coordinator. The Overnight urgent low protocol can’t publish until this is filled. Click an empty shift to assign it.
            </Banner>
          </motion.div>
        ) : (
          <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Banner type="success" size="web" title="Every shift is covered this week">
              The Overnight urgent low protocol is unblocked.
            </Banner>
          </motion.div>
        )}
      </AnimatePresence>
      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="grid grid-cols-[150px_repeat(7,1fr)] gap-2 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2">
          <span>Shift</span>
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        {rows.map(([shift, people]) => (
          <div key={shift} className="grid grid-cols-[150px_repeat(7,1fr)] items-center gap-2 border-b border-line px-4 py-2.5 last:border-b-0">
            <span className="type-wbody-em text-ink">{shift}</span>
            {people.map((p, i) =>
              p ? (
                <motion.span key={i + p} initial={{ opacity: 0, transform: 'scale(0.96)' }} animate={{ opacity: 1, transform: 'scale(1)' }} className="flex items-center gap-1.5 rounded-sm bg-tint p-2">
                  <Avatar initials={p.length > 1 ? p : p} size={22} />
                  <span className="truncate type-small-em text-ink">{NAMES[p]}</span>
                </motion.span>
              ) : (
                <button key={i} type="button" onClick={() => assign(i === 5 ? 'sat' : 'sun')} className="flex items-center gap-1.5 rounded-sm bg-vlow-tint p-2 text-left ring-1 ring-low hover:bg-vlow-tint/70">
                  <Icon name="alert" size={16} className="text-vlow" />
                  <span className="type-small-em text-vlow">Unassigned</span>
                </button>
              ),
            )}
          </div>
        ))}
      </section>
      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="grid grid-cols-[1fr_1fr_2fr_120px] gap-3 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2">
          <span>Member</span>
          <span>Role</span>
          <span>Can do</span>
          <span>Status</span>
        </div>
        {[
          ['Priya Shah, RN', 'Care coordinator', 'Triage, resolve, message, create orders', 'Active'],
          ['Marcus Lee, RN', 'Care coordinator (night)', 'Triage, resolve, message', 'Active'],
          ['Dr. Wen Chen, MD', 'Physician', 'Everything above + sign orders, publish protocols', 'Active'],
          ['Jordan Kim, RN', 'Care coordinator', 'Triage, resolve, message', 'Invited'],
        ].map(([m, r, c, st]) => (
          <div key={m} className="grid grid-cols-[1fr_1fr_2fr_120px] items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
            <span className="type-wbody-em text-ink">{m}</span>
            <span className="type-wbody text-ink">{r}</span>
            <span className="type-wbody text-ink-2">{c}</span>
            <span>
              <Pill tone={st === 'Active' ? 'inr' : 'high'}>{st}</Pill>
            </span>
          </div>
        ))}
      </section>
    </>
  )
}
