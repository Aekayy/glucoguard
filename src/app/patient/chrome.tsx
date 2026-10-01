import type { ReactNode } from 'react'

import { Icon, type IconName } from '@/components/icons'
import { cn } from '@/lib/utils'

import { TAB_OF, usePatient, type ScreenId } from './state'

export function StatusBar({ time = '9:41', light, bg }: { time?: string; light?: boolean; bg?: 'canvas' | 'surface' | 'none' }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[54px] items-center justify-between px-[34px] pt-1.5',
        light ? 'text-white' : 'text-ink',
        bg === 'canvas' && 'bg-canvas/80 backdrop-blur-md',
        bg === 'surface' && 'bg-surface/80 backdrop-blur-md',
      )}
    >
      <span className="w-[54px] text-center font-[var(--font-sans)] text-[17px] font-semibold tracking-[-0.4px]">{time}</span>
      <span className="flex items-center gap-[6px]">
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden>
          <path d="M8 2.6c2.2 0 4.2.9 5.7 2.3l1.1-1.2A9.6 9.6 0 0 0 8 1 9.6 9.6 0 0 0 1.2 3.7l1.1 1.2A8 8 0 0 1 8 2.6Zm0 3.2c1.3 0 2.5.5 3.4 1.3l1.1-1.2A6.4 6.4 0 0 0 8 4.2c-1.7 0-3.3.6-4.5 1.7l1.1 1.2c.9-.8 2.1-1.3 3.4-1.3Zm0 3.2c-.5 0-1 .2-1.3.5L8 11l1.3-1.5c-.3-.3-.8-.5-1.3-.5Z" fill="currentColor" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden>
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  )
}

export function HomeIndicator({ light }: { light?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 z-40 flex justify-center">
      <span className={cn('h-[5px] w-[139px] rounded-full', light ? 'bg-white' : 'bg-ink')} />
    </div>
  )
}

const TABS: { id: 'today' | 'trends' | 'care' | 'me'; icon: IconName; en: string; es: string }[] = [
  { id: 'today', icon: 'gauge', en: 'Today', es: 'Hoy' },
  { id: 'trends', icon: 'chart', en: 'Trends', es: 'Tendencias' },
  { id: 'care', icon: 'care', en: 'Care', es: 'Cuidado' },
  { id: 'me', icon: 'me', en: 'Me', es: 'Yo' },
]

export function TabBar() {
  const { nav, state } = usePatient()
  const active = TAB_OF[nav.screen]
  if (!active) return null
  return (
    <nav aria-label="Main" className="absolute inset-x-0 bottom-0 z-30 h-[83px] border-t border-line bg-surface/95 backdrop-blur-md">
      <div className="flex px-2 pt-[7px]">
        {TABS.map((t) => {
          const on = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              data-slot="tabs-trigger"
              aria-current={on ? 'page' : undefined}
              onClick={() => {
                if (!on || nav.screen !== t.id) nav.reset(t.id as ScreenId)
              }}
              className={cn('flex h-[42px] flex-1 flex-col items-center gap-[3px] transition-colors duration-150', on ? 'text-brand' : 'text-ink-3')}
            >
              <Icon name={t.icon} size={26} />
              <span className="type-caption2">{state.lang === 'es' ? t.es : t.en}</span>
            </button>
          )
        })}
      </div>
      <HomeIndicator />
    </nav>
  )
}

/** Standard screen body: status-bar inset, 20 pt margins, 16 pt rhythm. */
export function Screen({
  children,
  className,
  gap = 16,
  tabs,
  bg = 'canvas',
  pad = true,
}: {
  children: ReactNode
  className?: string
  gap?: number
  tabs?: boolean
  bg?: 'canvas' | 'surface'
  pad?: boolean
}) {
  return (
    <div className={cn('absolute inset-0 overflow-y-auto overscroll-contain no-scrollbar', bg === 'surface' ? 'bg-surface' : 'bg-canvas')}>
      <div
        className={cn('flex min-h-full flex-col pt-[62px]', pad && 'px-5', tabs ? 'pb-[100px]' : 'pb-[34px]', className)}
        style={{ gap }}
      >
        {children}
      </div>
    </div>
  )
}

/** Pushes what follows to the bottom of the screen (primary actions). */
export function Bottom({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-auto flex flex-col gap-2 pt-2', className)}>{children}</div>
}
