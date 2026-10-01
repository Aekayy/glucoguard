import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'

import { Glyph, Icon, type GlucoseState, type IconName } from '@/components/icons'
import { cn } from '@/lib/utils'

/* ── Glucose chip ─────────────────────────────────────────── */
export const GLUCOSE_TINT: Record<GlucoseState, string> = {
  veryLow: 'bg-vlow-tint',
  low: 'bg-low-tint',
  inRange: 'bg-inr-tint',
  high: 'bg-high-tint',
  veryHigh: 'bg-vhigh-tint',
  noData: 'bg-nod-tint',
}
export const GLUCOSE_INK: Record<GlucoseState, string> = {
  veryLow: 'text-vlow',
  low: 'text-low',
  inRange: 'text-inr',
  high: 'text-high',
  veryHigh: 'text-vhigh',
  noData: 'text-nod',
}
const GLUCOSE_LABEL: Record<GlucoseState, string> = {
  veryLow: 'Very low',
  low: 'Low',
  inRange: 'In range',
  high: 'High',
  veryHigh: 'Very high',
  noData: 'No data',
}

export function stateFor(mgdl: number | null): GlucoseState {
  if (mgdl === null) return 'noData'
  if (mgdl < 54) return 'veryLow'
  if (mgdl < 70) return 'low'
  if (mgdl <= 180) return 'inRange'
  if (mgdl <= 250) return 'high'
  return 'veryHigh'
}

export function Chip({
  state,
  children,
  size = 'ios',
  className,
}: {
  state: GlucoseState
  children?: ReactNode
  size?: 'ios' | 'web'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full text-ink',
        size === 'ios' ? 'h-[30px] pr-[11px] pl-[9px] type-footnote-em' : 'h-[26px] pr-2.5 pl-2 type-small-em',
        GLUCOSE_TINT[state],
        className,
      )}
    >
      <Glyph state={state} className={GLUCOSE_INK[state]} />
      {children ?? GLUCOSE_LABEL[state]}
    </span>
  )
}

/* ── Banner ───────────────────────────────────────────────── */
type BannerType = 'info' | 'warning' | 'error' | 'success' | 'offline'
const BANNER: Record<BannerType, { bg: string; ink: string; icon: IconName }> = {
  info: { bg: 'bg-info-tint', ink: 'text-info', icon: 'info' },
  warning: { bg: 'bg-high-tint', ink: 'text-high', icon: 'alert' },
  error: { bg: 'bg-vlow-tint', ink: 'text-vlow', icon: 'alert' },
  success: { bg: 'bg-inr-tint', ink: 'text-inr', icon: 'checkc' },
  offline: { bg: 'bg-nod-tint', ink: 'text-nod', icon: 'wifioff' },
}

export function Banner({
  type,
  title,
  children,
  size = 'ios',
  action,
  className,
}: {
  type: BannerType
  title: ReactNode
  children?: ReactNode
  size?: 'ios' | 'web'
  action?: ReactNode
  className?: string
}) {
  const b = BANNER[type]
  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md p-3.5', b.bg, className)}
    >
      <Icon name={b.icon} size={20} className={cn('mt-px shrink-0', b.ink)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className={cn('text-ink', size === 'ios' ? 'type-subhead-em' : 'type-wbody-em')}>{title}</div>
        {children ? <div className={cn('text-ink-2', size === 'ios' ? 'type-footnote' : 'type-small')}>{children}</div> : null}
      </div>
      {action}
    </div>
  )
}

/* ── Toggle (switch) ─────────────────────────────────────── */
export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean
  onChange?: (on: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      data-slot="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cn(
        'relative h-[31px] w-[51px] shrink-0 rounded-full p-0.5 transition-colors duration-200 ease-out disabled:opacity-50',
        on ? 'bg-inr' : 'bg-line',
      )}
    >
      <span
        className="block size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-transform duration-200"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)', transitionTimingFunction: 'var(--ease-out)' }}
      />
    </button>
  )
}

/* ── Avatar ───────────────────────────────────────────────── */
export function Avatar({
  initials,
  tone = 'brand',
  size = 40,
  className,
}: {
  initials: string
  tone?: 'brand' | 'sage' | 'neutral'
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        size >= 36 ? 'type-subhead-em' : 'type-small-em',
        tone === 'brand' && 'bg-brand text-on-brand',
        tone === 'sage' && 'bg-sage text-ink',
        tone === 'neutral' && 'bg-sunken text-ink',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  )
}

/* ── Text field ───────────────────────────────────────────── */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  helper,
  error,
  type = 'text',
  inputMode,
  autoFocus,
  suffix,
  multiline,
  onEnter,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  helper?: ReactNode
  error?: string | null
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoFocus?: boolean
  suffix?: ReactNode
  multiline?: boolean
  onEnter?: () => void
}) {
  const id = useId()
  const invalid = Boolean(error)
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="type-footnote-em text-ink-2">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md border bg-surface px-4 transition-[border-color,box-shadow] duration-150',
          multiline ? 'py-3' : 'h-[54px]',
          invalid
            ? 'border-low shadow-[inset_0_0_0_0.5px_var(--low)]'
            : 'border-line focus-within:border-brand focus-within:shadow-[inset_0_0_0_1px_var(--brand)]',
        )}
      >
        {multiline ? (
          <textarea
            id={id}
            value={value}
            rows={2}
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            onChange={(e) => onChange?.(e.target.value)}
            className="min-w-0 flex-1 resize-none bg-transparent type-body text-ink outline-none placeholder:text-ink-3"
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            inputMode={inputMode}
            autoFocus={autoFocus}
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEnter?.()
            }}
            className="min-w-0 flex-1 bg-transparent type-body text-ink outline-none placeholder:text-ink-3"
          />
        )}
        {suffix}
      </div>
      {error ? (
        <div className="flex items-start gap-1.5 type-footnote text-low">
          <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : helper ? (
        <div className="type-footnote text-ink-2">{helper}</div>
      ) : null}
    </div>
  )
}

/* ── Segmented control ───────────────────────────────────── */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
  size?: 'md' | 'sm'
}) {
  const group = useId()
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-md bg-sunken p-[3px]">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            data-slot="toggle-group-item"
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex flex-1 items-center justify-center rounded-[12px] transition-colors duration-150',
              size === 'md' ? 'h-10 type-subhead' : 'h-[34px] type-footnote',
              on ? 'text-ink' : 'text-ink-2',
            )}
          >
            {on ? (
              <motion.span
                layoutId={`seg-${group}`}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
                className="absolute inset-0 rounded-[12px] bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.08)]"
              />
            ) : null}
            <span className={cn('relative', on && (size === 'md' ? 'type-subhead-em' : 'type-footnote-em'))}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Surfaces ─────────────────────────────────────────────── */
export function Card({ className, children, tint }: { className?: string; children: ReactNode; tint?: boolean }) {
  return (
    <div className={cn('rounded-lg', tint ? 'bg-tint' : 'border border-line bg-surface', className)}>
      {children}
    </div>
  )
}

export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg border border-line bg-surface px-4 py-0.5', className)}>{children}</div>
}

export function Row({
  children,
  className,
  onClick,
  first,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  first?: boolean
}) {
  const cls = cn(
    'flex w-full items-center gap-3 py-3 text-left',
    !first && 'border-t border-line',
    onClick && 'transition-opacity active:opacity-60',
    className,
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  )
}

export function IconTile({ name, tone = 'brand', size = 32 }: { name: IconName; tone?: 'brand' | 'inr' | 'low' | 'neutral'; size?: number }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-sm',
        tone === 'brand' && 'bg-tint text-brand',
        tone === 'inr' && 'bg-inr-tint text-inr',
        tone === 'low' && 'bg-low-tint text-low',
        tone === 'neutral' && 'bg-sunken text-ink-2',
      )}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={size * 0.56} />
    </span>
  )
}

export function StatusCircle({ tone, icon, size = 72 }: { tone: 'inr' | 'low' | 'high' | 'vlow' | 'brand'; icon: IconName; size?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, transform: 'scale(0.9)' }}
      animate={{ opacity: 1, transform: 'scale(1)' }}
      transition={{ type: 'spring', duration: 0.45, bounce: 0.25 }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        tone === 'inr' && 'bg-inr-tint text-inr',
        tone === 'low' && 'bg-low-tint text-low',
        tone === 'high' && 'bg-high-tint text-high',
        tone === 'vlow' && 'bg-vlow-tint text-vlow',
        tone === 'brand' && 'bg-tint text-brand',
      )}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={size * 0.46} />
    </motion.span>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('type-eyebrow text-brand', className)}>{children}</div>
}

/* ── Navigation chrome ────────────────────────────────────── */
export function NavBar({
  back,
  onBack,
  title,
  right,
}: {
  back?: string
  onBack?: () => void
  title?: string
  right?: ReactNode
}) {
  return (
    <div className="relative flex h-[30px] shrink-0 items-center">
      {onBack ? (
        <button
          type="button"
          data-slot="nav-back-link"
          onClick={onBack}
          className="-ml-1.5 flex items-center gap-0.5 type-body text-brand transition-opacity active:opacity-50"
        >
          <Icon name="chevL" size={22} />
          {back ?? 'Back'}
        </button>
      ) : null}
      {title ? (
        <div className="pointer-events-none absolute inset-x-16 text-center type-headline text-ink">{title}</div>
      ) : null}
      <div className="ml-auto">{right}</div>
    </div>
  )
}

export function Progress({ step, total = 8 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step} aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
          <motion.span
            className="absolute inset-0 origin-left rounded-full bg-brand"
            initial={false}
            animate={{ transform: i < step ? 'scaleX(1)' : 'scaleX(0)' }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          />
        </span>
      ))}
    </div>
  )
}

export function FoodChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((f) => (
        <span key={f} className="rounded-full bg-surface px-[11px] py-[7px] type-footnote-em text-ink">
          {f}
        </span>
      ))}
    </div>
  )
}

/* A timeline line used across alerts and summaries */
export function TimelineRow({
  time,
  dot,
  children,
  first,
  live,
}: {
  time: string
  dot: string
  children: ReactNode
  first?: boolean
  live?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 py-2.5', !first && 'border-t border-line')}>
      <span className="w-10 shrink-0 type-footnote text-ink-2 tabular-nums">{time}</span>
      <span className={cn('size-2 shrink-0 rounded-full', dot, live && 'live-dot')} />
      <span className="type-subhead text-ink">{children}</span>
    </div>
  )
}
