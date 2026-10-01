import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, type ReactNode } from 'react'

import { HeldMark, Icon, type IconName } from '@/components/icons'
import { Avatar } from '@/components/hearth/ios'
import { cn } from '@/lib/utils'
import { go } from '@/lib/use-hash-route'

/* ── Web input ────────────────────────────────────────────── */
export function WebField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  error,
  type = 'text',
  className,
  autoFocus,
  readOnly,
  multiline,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  helper?: ReactNode
  error?: string | null
  type?: string
  className?: string
  autoFocus?: boolean
  readOnly?: boolean
  multiline?: boolean
}) {
  const id = useId()
  const invalid = Boolean(error)
  const field = cn(
    'w-full rounded-sm border bg-surface px-3 type-wbody text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3',
    invalid ? 'border-low shadow-[inset_0_0_0_0.5px_var(--low)]' : 'border-line focus:border-brand focus:shadow-[inset_0_0_0_1px_var(--brand)]',
    readOnly && 'bg-canvas',
  )
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="type-small-em text-ink-2">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} value={value} rows={2} placeholder={placeholder} aria-invalid={invalid || undefined} onChange={(e) => onChange?.(e.target.value)} className={cn(field, 'resize-none py-2.5')} />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(field, 'h-10')}
        />
      )}
      {error ? (
        <span className="flex items-start gap-1.5 type-small text-low">
          <Icon name="alert" size={13} className="mt-px shrink-0" />
          {error}
        </span>
      ) : helper ? (
        <span className="type-small text-ink-2">{helper}</span>
      ) : null}
    </div>
  )
}

/* ── Status pill (web) ────────────────────────────────────── */
type Tone = 'vlow' | 'low' | 'inr' | 'high' | 'nod' | 'info' | 'brand'
const PILL: Record<Tone, [string, string]> = {
  vlow: ['bg-vlow-tint', 'bg-vlow'],
  low: ['bg-low-tint', 'bg-low'],
  inr: ['bg-inr-tint', 'bg-inr'],
  high: ['bg-high-tint', 'bg-high'],
  nod: ['bg-nod-tint', 'bg-nod'],
  info: ['bg-info-tint', 'bg-info'],
  brand: ['bg-tint', 'bg-brand'],
}
export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full pr-2.5 pl-2 type-small-em whitespace-nowrap text-ink', PILL[tone][0], className)}>
      <span className={cn('size-[7px] rounded-full', PILL[tone][1])} />
      {children}
    </span>
  )
}

/* ── Stat tile ────────────────────────────────────────────── */
export function Stat({ label, value, sub, valueClass, loading }: { label: string; value: ReactNode; sub?: ReactNode; valueClass?: string; loading?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md border border-line bg-surface px-4 py-3.5">
      {loading ? (
        <>
          <span className="skeleton h-2.5 w-[90px] rounded-full" />
          <span className="skeleton mt-2 h-[22px] w-[60px] rounded-full" />
        </>
      ) : (
        <>
          <span className="type-small text-ink-2">{label}</span>
          <span className="flex items-baseline gap-2">
            <motion.span key={String(value)} initial={{ opacity: 0, transform: 'translateY(4px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} className={cn('type-display tabular-nums', valueClass ?? 'text-ink')}>
              {value}
            </motion.span>
            {sub ? <span className="type-small text-ink-2">{sub}</span> : null}
          </span>
        </>
      )}
    </div>
  )
}

/* ── Stepper ──────────────────────────────────────────────── */
export type StepState = 'done' | 'current' | 'error' | 'upcoming'
export function Stepper({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-line bg-surface px-[18px] py-3.5">
      {steps.map((s, i) => (
        <div key={s.label} className={cn('flex items-center gap-2.5', i < steps.length - 1 && 'flex-1')}>
          <span className="flex shrink-0 items-center gap-2">
            <motion.span
              layout
              className={cn(
                'flex size-6 items-center justify-center rounded-full type-small-em',
                s.state === 'done' && 'bg-brand text-on-brand',
                s.state === 'error' && 'bg-vlow text-on-brand',
                s.state === 'current' && 'border-2 border-brand bg-surface text-brand',
                s.state === 'upcoming' && 'border border-line bg-surface text-ink-2',
              )}
            >
              {s.state === 'done' ? <Icon name="check" size={13} weight={1.6} /> : s.state === 'error' ? '!' : i + 1}
            </motion.span>
            <span className={cn(s.state === 'current' ? 'type-wbody-em text-ink' : s.state === 'upcoming' ? 'type-wbody text-ink-2' : 'type-wbody text-ink')}>{s.label}</span>
          </span>
          {i < steps.length - 1 ? (
            <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.span
                className="absolute inset-0 origin-left bg-brand"
                initial={false}
                animate={{ transform: s.state === 'done' ? 'scaleX(1)' : 'scaleX(0)' }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

/* ── Tabs ─────────────────────────────────────────────────── */
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: T[]; value: T; onChange: (t: T) => void }) {
  const id = useId()
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map((t) => {
        const on = t === value
        return (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={on}
            data-slot="tabs-trigger"
            onClick={() => onChange(t)}
            className={cn('relative px-3 pt-2 pb-2.5', on ? 'type-wbody-em text-brand' : 'type-wbody text-ink-2 hover:text-ink')}
          >
            {t}
            {on ? <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }} /> : null}
          </button>
        )
      })}
    </div>
  )
}

/* ── Filter chips ─────────────────────────────────────────── */
export function FilterChips<T extends string>({ items, value, onChange }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((it) => {
        const on = it.id === value
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={on}
            data-slot="toggle-group-item"
            onClick={() => onChange(it.id)}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-full px-2.5 transition-colors duration-150',
              on ? 'bg-ink text-surface' : 'border border-line bg-surface text-ink hover:bg-canvas',
            )}
          >
            <span className="type-small-em">{it.label}</span>
            {it.count !== undefined ? <span className={cn('type-small', on ? 'text-surface/80' : 'text-ink-2')}>{it.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

/* ── Card + key/value row ─────────────────────────────────── */
export function Panel({ title, right, children, className, tone }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; tone?: 'error' }) {
  return (
    <section className={cn('flex flex-col gap-3 rounded-md border bg-surface p-[18px]', tone === 'error' ? 'border-low' : 'border-line', className)}>
      {title ? (
        <div className="flex items-center justify-between gap-2">
          <h3 className="type-h2 text-ink">{title}</h3>
          {right}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function KV({ k, v, vClass }: { k: ReactNode; v: ReactNode; vClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line py-2 first-of-type:border-t-0">
      <span className="type-wbody text-ink-2">{k}</span>
      <span className={cn('text-right type-wbody-em', vClass ?? 'text-ink')}>{v}</span>
    </div>
  )
}

/* ── Modal ────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  width = 600,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, transform: 'translateY(16px) scale(0.98)' }}
            animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex max-h-full flex-col gap-4 overflow-y-auto rounded-lg bg-surface p-6 shadow-modal"
            style={{ width }}
          >
            <div className="flex items-start gap-3">
              {icon}
              <div className="flex flex-1 flex-col gap-0.5">
                <h2 className="type-h1 text-ink">{title}</h2>
                {description ? <p className="type-wbody text-ink-2">{description}</p> : null}
              </div>
              <button type="button" data-slot="dialog-close" aria-label="Close" onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-sunken hover:text-ink">
                <Icon name="x" size={20} />
              </button>
            </div>
            {children}
            {footer ? <div className="flex items-center gap-2.5">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/* ── Choice row (radio card) ──────────────────────────────── */
export function Choice({ on, invalid, title, detail, onClick, right }: { on: boolean; invalid?: boolean; title: string; detail?: string; onClick: () => void; right?: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      data-slot="radio-group-item"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-sm border p-3 text-left transition-colors duration-150',
        on ? 'border-brand bg-tint' : invalid ? 'border-low bg-surface' : 'border-line bg-surface hover:bg-canvas',
      )}
    >
      <span className={cn('flex size-[18px] shrink-0 items-center justify-center rounded-full border', on ? 'border-brand' : 'border-line')}>
        <motion.span className="size-2 rounded-full bg-brand" initial={false} animate={{ transform: on ? 'scale(1)' : 'scale(0)' }} transition={{ duration: 0.15 }} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="type-wbody-em text-ink">{title}</span>
        {detail ? <span className="type-small text-ink-2">{detail}</span> : null}
      </span>
      {right}
    </button>
  )
}

export function Checkbox({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} data-slot="checkbox" onClick={() => onChange(!on)} className="flex items-center gap-2.5 text-left">
      <span className={cn('flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border transition-colors', on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface')}>
        {on ? <Icon name="check" size={12} weight={1.6} /> : null}
      </span>
      <span className="type-wbody text-ink">{children}</span>
    </button>
  )
}

/* ── Shell: sidebar + top bar ─────────────────────────────── */
export type NavId = 'queue' | 'patients' | 'orders' | 'protocols' | 'billing' | 'audit' | 'team'
const NAV: { id: NavId; label: string; icon: IconName; path: string }[] = [
  { id: 'queue', label: 'Alert queue', icon: 'queue', path: 'console/queue' },
  { id: 'patients', label: 'Patients', icon: 'people', path: 'console/patients' },
  { id: 'orders', label: 'Orders', icon: 'box', path: 'console/orders' },
  { id: 'protocols', label: 'Protocols', icon: 'flow', path: 'console/protocols' },
  { id: 'billing', label: 'RPM billing', icon: 'bill', path: 'console/billing' },
  { id: 'audit', label: 'Audit log', icon: 'log', path: 'console/audit' },
  { id: 'team', label: 'Team & settings', icon: 'settings', path: 'console/team' },
]

export function Sidebar({ active, counts }: { active: NavId; counts: { queue: number; orders: number } }) {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col gap-1 border-r border-line bg-canvas px-3.5 pt-5 pb-[18px]">
      <a href="#/" className="flex items-center gap-2.5 px-1.5 pb-3.5">
        <HeldMark size={28} className="text-brand" />
        <span className="type-h1 text-ink">GlucoGuard</span>
      </a>
      <div className="flex items-center gap-2.5 rounded-sm border border-line bg-surface p-2.5">
        <span className="flex size-8 items-center justify-center rounded-[8px] bg-sage type-small-em text-ink">NE</span>
        <span className="flex flex-1 flex-col">
          <span className="type-wbody-em text-ink">Northside Health</span>
          <span className="type-small text-ink-2">Endocrine RPM · 214</span>
        </span>
        <Icon name="chevD" size={16} className="text-ink-2" />
      </div>
      <nav className="mt-3 flex flex-col gap-0.5">
        {NAV.map((n) => {
          const on = n.id === active
          return (
            <button
              key={n.id}
              type="button"
              data-slot="sidebar-menu-item"
              onClick={() => go(n.path)}
              className={cn('relative flex h-[38px] items-center gap-2.5 rounded-sm px-2.5 text-left transition-colors', on ? 'text-brand' : 'text-ink hover:bg-surface')}
            >
              {on ? <motion.span layoutId="nav-active" className="absolute inset-0 rounded-sm bg-tint" transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }} /> : null}
              <Icon name={n.icon} size={18} className={cn('relative', on ? 'text-brand' : 'text-ink-2')} />
              <span className={cn('relative flex-1', on ? 'type-wbody-em' : 'type-wbody')}>{n.label}</span>
              {n.id === 'queue' && counts.queue > 0 ? (
                <motion.span key={counts.queue} initial={{ transform: 'scale(0.8)' }} animate={{ transform: 'scale(1)' }} className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-vlow px-1.5 type-small-em text-on-brand">
                  {counts.queue}
                </motion.span>
              ) : null}
              {n.id === 'patients' ? <span className="relative type-small text-ink-2">214</span> : null}
              {n.id === 'orders' && counts.orders > 0 ? <span className="relative type-small text-ink-2">{counts.orders}</span> : null}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1.5 rounded-sm bg-sage p-3">
        <span className="type-eyebrow text-ink-2">On call now</span>
        <span className="type-wbody-em text-ink">Priya Shah, RN · until 19:00</span>
        <span className="type-small text-ink-2">Next: Marcus Lee, RN (night)</span>
      </div>
      <div className="flex items-center gap-2.5 px-1.5 pt-3">
        <Avatar initials="PS" size={32} />
        <span className="flex flex-col">
          <span className="type-wbody-em text-ink">Priya Shah, RN</span>
          <span className="type-small text-ink-2">Care coordinator</span>
        </span>
      </div>
    </aside>
  )
}

export function TopBar({ eyebrow, title, onSearch, right }: { eyebrow: string; title: string; onSearch: () => void; right?: ReactNode }) {
  return (
    <div className="flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-surface px-7">
      <div className="flex flex-col gap-0.5">
        <span className="type-eyebrow text-ink-2">{eyebrow}</span>
        <span className="type-h1 text-ink">{title}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {right}
        <button type="button" onClick={onSearch} className="flex h-9 w-[340px] items-center gap-2 rounded-sm border border-line bg-canvas px-3 text-left">
          <Icon name="search" size={16} className="text-ink-2" />
          <span className="flex-1 type-wbody text-ink-3">Search patients, MRN, orders</span>
          <kbd className="rounded-[4px] border border-line px-1.5 py-0.5 type-small-em text-ink-2">⌘K</kbd>
        </button>
        <button type="button" aria-label="Notifications" className="flex size-9 items-center justify-center rounded-sm border border-line text-ink">
          <Icon name="bell" size={18} />
        </button>
      </div>
    </div>
  )
}

/* ── Table helpers ────────────────────────────────────────── */
export function TH({ cols, children }: { cols: string; children: ReactNode }) {
  return (
    <div className="grid items-center gap-3 border-b border-line bg-canvas px-4 py-2.5 type-eyebrow text-ink-2" style={{ gridTemplateColumns: cols }}>
      {children}
    </div>
  )
}
