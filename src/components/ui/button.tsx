import * as React from 'react'

import { cn } from '@/lib/utils'

/* Figma: Button (iOS, 52 pt) and Web Button (38 px) share one component —
 * density is a size, not a different component. */
const VARIANT = {
  primary: 'bg-brand text-on-brand',
  secondary: 'bg-tint text-brand',
  outline: 'bg-surface text-ink border border-line',
  plain: 'bg-transparent text-brand',
  destructive: 'bg-vlow text-on-brand',
  ghost: 'bg-transparent text-ink-2 hover:bg-sunken hover:text-ink',
  accent: 'bg-ink text-surface',
} as const

const SIZE = {
  ios: 'h-[52px] w-full rounded-md px-5 type-headline',
  web: 'h-[38px] rounded-sm px-3.5 type-wbody-em',
  sm: 'h-7 rounded-full px-3 type-small-em',
} as const

export type ButtonProps = React.ComponentProps<'button'> & {
  variant?: keyof typeof VARIANT
  size?: keyof typeof SIZE
}

export function Button({ variant = 'primary', size = 'ios', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      data-variant={variant === 'destructive' ? 'destructive' : variant === 'ghost' || variant === 'plain' ? 'ghost' : variant}
      className={cn(
        'press inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap outline-none',
        'transition-[transform,opacity,background-color,box-shadow] duration-150 ease-out',
        'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-3 disabled:border-transparent',
        size === 'web' && variant === 'primary' && 'hover:shadow-[inset_0_0_0_100px_rgb(0_0_0/0.12)]',
        size === 'web' && variant === 'outline' && 'hover:bg-canvas',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  )
}
