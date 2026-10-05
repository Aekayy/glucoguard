import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { HeldMark, Icon } from '@/components/icons'
import { playSound, SoundToggle } from '@/components/ui/sound'
import { cn } from '@/lib/utils'

import { CHAPTERS, type Step, type Target } from './script'

/* ─────────────────────────────────────────────────────────
 * Watch a Walkthrough
 *
 * A self-playing, narrated tour of the real prototype. The product
 * runs live in a 1440×900 frame; a scripted cursor glides to each
 * control, captions narrate,
 * and chapter cards introduce each part. Built for presenting:
 * play/pause, chapter jumps, speed, full screen, keyboard.
 *
 * Motion choices
 *  · cursor travel: on-screen movement → strong ease-in-out
 *    (0.77, 0, 0.175, 1), 450–900 ms scaled by distance
 *  · click: ring ripple 420 ms ease-out + cursor press 120 ms
 *  · captions / chapter cards: 300 ms ease-out fade-and-rise
 *  · reduced motion: cursor jumps instead of travelling; no ripple
 * ───────────────────────────────────────────────────────── */

const VW = 1440
const VH = 900
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
const EASE_OUT = [0.23, 1, 0.32, 1] as const
const SIGNED_IN_KEY = 'gg-console-signed-in'

type Flat = { step: Step; ch: number; first: boolean }
const FLAT: Flat[] = CHAPTERS.flatMap((c, ch) => c.steps.map((step, i) => ({ step, ch, first: i === 0 })))
const CHAPTER_START = CHAPTERS.map((_, ch) => FLAT.findIndex((f) => f.ch === ch))

class Aborted extends Error {}

const norm = (s: string) => s.replace(/⏎/g, '').replace(/\s+/g, ' ').trim()

function visible(el: Element) {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/* In the phone, a screen that's animating out is still in the DOM. Only the
 * live screen (named on <body data-live-screen>) may be targeted. */
function live(el: Element) {
  const screen = el.closest<HTMLElement>('[data-screen]')
  if (!screen) return true
  const current = el.ownerDocument.body.dataset.liveScreen
  if (screen.dataset.screen !== current) return false
  const same = [...el.ownerDocument.querySelectorAll(`[data-screen="${current}"]`)]
  return same[same.length - 1] === screen
}

function findIn(doc: Document, t: Target): HTMLElement | null {
  if (t.sel) {
    const all = [...doc.querySelectorAll<HTMLElement>(t.sel)].filter((el) => visible(el) && live(el))
    return all[all.length - 1] ?? null
  }
  if (!t.text) return null
  const want = norm(t.text)
  const match = (s: string | null) => {
    const v = norm(s ?? '')
    return t.exact ? v === want : v.includes(want)
  }
  const interactive = [
    ...doc.querySelectorAll<HTMLElement>('button, a[href], [role="button"], [role="tab"], [role="radio"], [role="checkbox"], label'),
  ].filter((el) => match(el.textContent) && visible(el) && live(el))
  if (interactive.length) {
    // prefer the innermost match (a row inside a card), latest in the DOM (the entering screen)
    const inner = interactive.filter((el) => !interactive.some((o) => o !== el && el.contains(o)))
    return inner[inner.length - 1]
  }
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  let found: HTMLElement | null = null
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement
    if (el && match(n.textContent) && visible(el) && live(el)) found = el
  }
  if (!found) {
    // text split across nodes: fall back to the smallest element whose text matches
    const els = [...doc.body.querySelectorAll<HTMLElement>('*')].filter((el) => match(el.textContent) && visible(el) && live(el))
    found = els.filter((el) => !els.some((o) => o !== el && el.contains(o))).pop() ?? null
  }
  return found
}

function readMs(text?: string) {
  if (!text) return 0
  const words = text.split(/\s+/).length
  return Math.min(6500, Math.max(1700, words * 330))
}

/* ── The cursor ────────────────────────────────────────────── */
function Cursor({ pressed }: { pressed: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      className="drop-shadow-[0_2px_4px_rgb(0_0_0/0.35)] transition-transform duration-[120ms] ease-out"
      style={{ transform: pressed ? 'scale(0.86)' : 'scale(1)', transformOrigin: '4px 3px' }}
      aria-hidden
    >
      <path d="M4 2.5 4 19.5 8.6 15.4 11.6 21.8 14.6 20.4 11.7 14.2 17.8 14.2Z" fill="#fff" stroke="#241b25" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function WalkthroughButton({ className, variant = 'primary' }: { className?: string; variant?: 'primary' | 'outline' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        data-sound="open"
        onClick={() => setOpen(true)}
        className={cn(
          'press group inline-flex h-12 items-center gap-2.5 rounded-full pr-5 pl-2 type-wbody-em transition-shadow',
          variant === 'primary' ? 'bg-brand text-on-brand shadow-[0_8px_24px_rgb(90_43_94/0.28)] hover:shadow-[0_10px_30px_rgb(90_43_94/0.36)]' : 'border border-line bg-surface text-ink',
          className,
        )}
      >
        <span className={cn('flex size-8 items-center justify-center rounded-full', variant === 'primary' ? 'bg-on-brand/20' : 'bg-tint text-brand')}>
          <Icon name="play" size={14} />
        </span>
        Watch a Walkthrough
        <span className={cn('type-small', variant === 'primary' ? 'text-on-brand/75' : 'text-ink-3')}>~4 min</span>
      </button>
      {open ? createPortal(<Walkthrough onClose={() => setOpen(false)} />, document.body) : null}
    </>
  )
}

/* ── Player ────────────────────────────────────────────────── */
function Walkthrough({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion() ?? false
  const shell = useRef<HTMLDivElement>(null)
  const stageHost = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)

  const [scale, setScale] = useState(0.6)
  const [stepIdx, setStepIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [cursor, setCursor] = useState({ x: VW / 2, y: VH / 2, dur: 0, shown: false })
  const [pressed, setPressed] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const [caption, setCaption] = useState('')
  const [card, setCard] = useState<number | null>(0)
  const [ended, setEnded] = useState(false)
  const [full, setFull] = useState(false)

  const token = useRef(0)
  const playingRef = useRef(true)
  const speedRef = useRef(1)
  const cursorRef = useRef(cursor)
  playingRef.current = playing
  speedRef.current = speed
  cursorRef.current = cursor

  /* fit the 1440×900 frame into the window (or full screen) */
  useLayoutEffect(() => {
    const el = stageHost.current
    if (!el) return
    const fit = () => setScale(Math.min(el.clientWidth / VW, el.clientHeight / VH))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === shell.current)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  /* ── timing primitives that respect pause, speed and abort ── */
  const sleep = useCallback(async (ms: number, t: number, scaled = true) => {
    /* wall-clock based, so throttled timers in a background tab can't stretch it */
    let left = ms
    let last = performance.now()
    while (left > 0) {
      if (token.current !== t) throw new Aborted()
      await new Promise((r) => setTimeout(r, 50))
      const now = performance.now()
      if (playingRef.current) left -= (now - last) * (scaled ? speedRef.current : 1)
      last = now
    }
    if (token.current !== t) throw new Aborted()
  }, [])

  /* the prototype's own window: events must be built from its constructors */
  const win = () => (frame.current?.contentWindow ?? null) as (Window & typeof globalThis) | null
  const doc = () => frame.current?.contentDocument ?? null

  const waitFor = useCallback(
    async (target: Target, t: number, max = 12000) => {
      const start = performance.now()
      while (performance.now() - start < max) {
        if (token.current !== t) throw new Aborted()
        const d = doc()
        const el = d ? findIn(d, target) : null
        if (el) return el
        await new Promise((r) => setTimeout(r, 120))
      }
      return null
    },
    [],
  )

  const moveTo = useCallback(
    async (el: HTMLElement, t: number) => {
      let r = el.getBoundingClientRect()
      if (r.bottom > VH - 8 || r.top < 8) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        await sleep(650, t, false)
        r = el.getBoundingClientRect()
      }
      const x = r.left + Math.min(r.width / 2, 120)
      const y = r.top + r.height / 2
      const from = cursorRef.current
      const dist = Math.hypot(x - from.x, y - from.y)
      const dur = reduce || !from.shown ? 0 : Math.min(0.9, Math.max(0.45, dist / 1400)) / speedRef.current
      setCursor({ x, y, dur, shown: true })
      await sleep(dur * 1000 + 80, t, false)
      return { x, y }
    },
    [reduce, sleep],
  )

  const exec = useCallback(
    async (step: Step, t: number) => {
      const w = win()
      const d = doc()
      if (step.say) setCaption(step.say)
      if (step.cue) playSound(step.cue)
      const dwell = async (min: number) => sleep(Math.max(min, readMs(step.say)), t)

      switch (step.do) {
        case 'load': {
          try {
            if (step.signedIn === true) sessionStorage.setItem(SIGNED_IN_KEY, '1')
            if (step.signedIn === false) sessionStorage.removeItem(SIGNED_IN_KEY)
          } catch {
            /* storage blocked: the console will just ask to sign in */
          }
          const f = frame.current!
          await new Promise<void>((res) => {
            const done = () => {
              f.removeEventListener('load', done)
              res()
            }
            f.addEventListener('load', done)
            f.src = `${window.location.pathname}?walkthrough=${Date.now()}#${step.route}`
            setTimeout(done, 9000)
          })
          // the page is loaded once its lazily-loaded screen has actually rendered
          const ready = performance.now()
          while (performance.now() - ready < 15000) {
            if (token.current !== t) throw new Aborted()
            const root = frame.current?.contentDocument?.getElementById('root')
            if (root && (root.textContent ?? '').trim().length > 20) break
            await new Promise((r) => setTimeout(r, 120))
          }
          await sleep(900, t, false)
          return
        }
        case 'nav': {
          if (w) w.location.hash = step.route
          await sleep(900, t, false)
          return
        }
        case 'say':
          await dwell(1800)
          return
        case 'wait': {
          const startedAt = performance.now()
          if (step.until) await waitFor(step.until, t)
          const spent = performance.now() - startedAt
          await sleep(Math.max(0, step.ms - spent), t, false)
          if (step.say) await dwell(0)
          return
        }
        case 'key': {
          if (w && d) {
            const target = (d.activeElement as HTMLElement | null) ?? d.body
            const init = { key: step.key, ctrlKey: !!step.ctrl, metaKey: false, bubbles: true, cancelable: true }
            target.dispatchEvent(new w.KeyboardEvent('keydown', init))
            target.dispatchEvent(new w.KeyboardEvent('keyup', init))
            playSound('key')
          }
          await dwell(1100)
          return
        }
      }

      const el = await waitFor(step, t)
      if (!el || !w) {
        console.warn('[walkthrough] target not found, skipping', step)
        return // a missing target never stalls the tour
      }

      switch (step.do) {
        case 'point':
          await moveTo(el, t)
          await dwell(1500)
          return
        case 'scroll':
          el.scrollIntoView({ block: 'center', behavior: 'smooth' })
          await sleep(800, t, false)
          await moveTo(el, t)
          await dwell(1500)
          return
        case 'click': {
          const p = await moveTo(el, t)
          setPressed(true)
          if (!reduce) setRipple({ x: p.x, y: p.y, id: Date.now() })
          playSound('tap')
          await sleep(120, t, false)
          setPressed(false)
          el.click()
          await dwell(1000)
          return
        }
        case 'type': {
          await moveTo(el, t)
          const input = (el.matches('input, textarea') ? el : el.querySelector('input, textarea')) as HTMLInputElement | null
          if (!input) return
          input.focus()
          const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')!.set!
          let value = step.clear ? '' : input.value
          if (step.clear) {
            setter.call(input, '')
            input.dispatchEvent(new w.Event('input', { bubbles: true }))
          }
          for (const ch of step.value) {
            value += ch
            setter.call(input, value)
            input.dispatchEvent(new w.Event('input', { bubbles: true }))
            playSound('key', { detune: value.length * 30 })
            await sleep(85, t)
          }
          await dwell(900)
          return
        }
        case 'hold': {
          const p = await moveTo(el, t)
          setPressed(true)
          if (!reduce) setRipple({ x: p.x, y: p.y, id: Date.now() })
          const init = { bubbles: true, pointerId: 1, button: 0, isPrimary: true, pointerType: 'mouse', clientX: p.x, clientY: p.y }
          el.dispatchEvent(new w.PointerEvent('pointerdown', init))
          for (let i = 0; i < step.holdMs / 500; i++) {
            playSound('holdTick', { detune: i * 120 })
            await sleep(Math.min(500, step.holdMs - i * 500), t, false)
          }
          el.dispatchEvent(new w.PointerEvent('pointerup', init))
          setPressed(false)
          playSound('success')
          await dwell(1200)
          return
        }
      }
    },
    [moveTo, reduce, sleep, waitFor],
  )

  /* ── the run loop ── */
  const run = useCallback(
    async (from: number) => {
      const t = ++token.current
      setEnded(false)
      try {
        for (let i = from; i < FLAT.length; i++) {
          setStepIdx(i)
          const { step, ch, first } = FLAT[i]
          if (first) {
            setCard(ch)
            setCaption('')
            setCursor((c) => ({ ...c, shown: false, dur: 0 }))
            const shownAt = performance.now()
            await exec(step, t) // the chapter's load happens behind its title card
            await sleep(Math.max(0, 2100 - (performance.now() - shownAt)), t, false)
            setCard(null)
            await sleep(250, t, false)
            continue
          }
          await exec(step, t)
        }
        setEnded(true)
        playSound('success')
      } catch (e) {
        if (!(e instanceof Aborted)) throw e
      }
    },
    [exec, sleep],
  )

  useEffect(() => {
    void run(0)
    return () => {
      token.current++
    }
  }, [run])

  const chapter = FLAT[stepIdx]?.ch ?? 0
  const jump = useCallback(
    (ch: number) => {
      const c = Math.max(0, Math.min(CHAPTERS.length - 1, ch))
      setPlaying(true)
      void run(CHAPTER_START[c])
    },
    [run],
  )

  /* keyboard: space play/pause, ←/→ chapters, esc close */
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'ArrowRight') jump(chapter + 1)
      else if (e.key === 'ArrowLeft') jump(chapter - 1)
      else if (e.key === 'Escape' && !document.fullscreenElement) onClose()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [chapter, jump, onClose])

  /* switching tabs mid-presentation pauses the tour instead of letting it run unseen */
  useEffect(() => {
    const on = () => {
      if (document.hidden) setPlaying(false)
    }
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  /* lock page scroll while open */
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const progress = useMemo(() => {
    const start = CHAPTER_START[chapter]
    const end = CHAPTER_START[chapter + 1] ?? FLAT.length
    return Math.min(1, (stepIdx - start + 1) / (end - start))
  }, [chapter, stepIdx])

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void shell.current?.requestFullscreen()
  }

  const C = CHAPTERS[chapter]
  const cardCh = card !== null ? CHAPTERS[card] : null

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgb(20_14_23/0.72)] p-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={shell}
        role="dialog"
        aria-modal="true"
        aria-label="Product walkthrough"
        initial={{ opacity: 0, transform: 'translateY(16px) scale(0.97)' }}
        animate={{ opacity: 1, transform: 'translateY(0) scale(1)' }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className={cn(
          'flex flex-col overflow-hidden bg-[#1a1519] text-white shadow-[0_40px_120px_rgb(0_0_0/0.5)]',
          full ? 'h-full w-full' : 'rounded-[18px]',
        )}
        /* the window hugs a 16:10 stage: chrome 44 px + controls 88 px */
        style={full ? undefined : { width: 'min(94vw, calc((92vh - 132px) * 1.6), 1320px)' }}
      >
        {/* window chrome */}
        <div className="flex h-11 shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="flex items-center gap-2 type-small-em text-white/85">
            <HeldMark size={16} /> GlucoGuard · Product walkthrough
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 type-small-em text-white/80">{C.surface}</span>
          <button type="button" data-slot="dialog-close" aria-label="Close walkthrough" onClick={onClose} className="ml-auto flex size-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* stage */}
        <div ref={stageHost} className={cn('relative flex min-h-0 items-center justify-center bg-[#0f0b10]', full ? 'flex-1' : 'aspect-[16/10] w-full')}>
          <div className="relative overflow-hidden" style={{ width: VW * scale, height: VH * scale }}>
            <iframe
              ref={frame}
              title="GlucoGuard prototype"
              tabIndex={-1}
              className="pointer-events-none absolute top-0 left-0 origin-top-left border-0 bg-canvas"
              style={{ width: VW, height: VH, transform: `scale(${scale})` }}
            />

            {/* click ripple */}
            <AnimatePresence>
              {ripple ? (
                <motion.span
                  key={ripple.id}
                  className="pointer-events-none absolute top-0 left-0 size-10 rounded-full border-2 border-[#dba8de]"
                  initial={{ opacity: 0.9, transform: `translate(${ripple.x * scale - 20}px, ${ripple.y * scale - 20}px) scale(0.4)` }}
                  animate={{ opacity: 0, transform: `translate(${ripple.x * scale - 20}px, ${ripple.y * scale - 20}px) scale(1.6)` }}
                  transition={{ duration: 0.42, ease: EASE_OUT }}
                  onAnimationComplete={() => setRipple(null)}
                />
              ) : null}
            </AnimatePresence>

            {/* cursor */}
            <motion.div
              className="pointer-events-none absolute top-0 left-0 z-20"
              initial={false}
              animate={{ transform: `translate(${cursor.x * scale - 4}px, ${cursor.y * scale - 3}px)`, opacity: cursor.shown && !card ? 1 : 0 }}
              transition={{ transform: { duration: cursor.dur, ease: EASE_IN_OUT }, opacity: { duration: 0.2 } }}
            >
              <Cursor pressed={pressed} />
            </motion.div>

            {/* caption */}
            <AnimatePresence mode="wait">
              {caption && !card && !ended ? (
                <motion.div
                  key={caption}
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-6 pb-5"
                  initial={{ opacity: 0, transform: 'translateY(8px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0)' }}
                  exit={{ opacity: 0, transform: 'translateY(4px)' }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  <div className="flex max-w-[780px] items-start gap-3 rounded-[16px] bg-[rgb(26_21_25/0.9)] px-5 py-3.5 shadow-[0_12px_40px_rgb(0_0_0/0.35)] ring-1 ring-white/10 backdrop-blur-md">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dba8de] text-[#1a1519]">
                      <HeldMark size={14} />
                    </span>
                    <span className="text-[17px] leading-[24px] font-medium text-white" style={{ fontFamily: 'var(--font-sans)' }}>
                      {caption}
                    </span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* chapter card */}
            <AnimatePresence>
              {cardCh ? (
                <motion.div
                  key={card}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[rgb(20_14_23/0.86)] text-center backdrop-blur-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ delay: 0.08, duration: 0.35, ease: EASE_OUT }} className="rounded-full bg-white/10 px-3 py-1 type-small-em text-white/80">
                    Chapter {card! + 1} of {CHAPTERS.length} · {cardCh.surface}
                  </motion.span>
                  {cardCh.time ? (
                    <motion.span initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ delay: 0.11, duration: 0.35, ease: EASE_OUT }} className="font-[var(--font-rounded)] text-[22px] font-semibold text-[#dba8de] tabular-nums">
                      {cardCh.time}
                    </motion.span>
                  ) : null}
                  <motion.span initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ delay: 0.14, duration: 0.35, ease: EASE_OUT }} className="font-[var(--font-rounded)] text-[44px] leading-[50px] font-bold">
                    {cardCh.title}
                  </motion.span>
                  <motion.span initial={{ opacity: 0, transform: 'translateY(8px)' }} animate={{ opacity: 1, transform: 'translateY(0)' }} transition={{ delay: 0.2, duration: 0.35, ease: EASE_OUT }} className="type-callout text-white/70">
                    {cardCh.blurb}
                  </motion.span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* end card */}
            <AnimatePresence>
              {ended ? (
                <motion.div key="end" className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[rgb(20_14_23/0.88)] text-center backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <HeldMark size={56} className="text-[#dba8de]" />
                  <span className="font-[var(--font-rounded)] text-[40px] leading-[46px] font-bold">Every alert, followed through.</span>
                  <span className="max-w-[560px] type-callout text-white/70">
                    One low, six people, one record: from Denise’s phone to Maria’s texts, Priya’s queue, Dr. Chen’s order, the supplier and Medicare.
                  </span>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => jump(0)} className="flex h-10 items-center gap-2 rounded-full bg-[#dba8de] px-4 type-wbody-em text-[#1a1519]">
                      <Icon name="reset" size={16} /> Watch again
                    </button>
                    <button type="button" onClick={onClose} className="h-10 rounded-full border border-white/20 px-4 type-wbody-em text-white">
                      Close
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {!playing && !ended ? (
              <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 z-40 flex items-center justify-center bg-black/25" aria-label="Resume">
                <span className="flex items-center gap-2 rounded-full bg-[rgb(26_21_25/0.9)] px-5 py-3 type-wbody-em text-white ring-1 ring-white/15">
                  <Icon name="play" size={14} /> Paused · press Space or click to resume
                </span>
              </button>
            ) : null}
          </div>
        </div>

        {/* controls */}
        <div className="flex shrink-0 flex-col gap-2.5 border-t border-white/10 px-4 pt-3 pb-3.5">
          <div className="flex gap-1">
            {CHAPTERS.map((c, n) => (
              <button key={c.title} type="button" onClick={() => jump(n)} className="group flex flex-1 flex-col gap-1.5 text-left" aria-label={`Chapter ${n + 1}: ${c.title}`} aria-current={n === chapter ? 'step' : undefined}>
                <span className="relative h-1 overflow-hidden rounded-full bg-white/15 group-hover:bg-white/25">
                  <span
                    className="absolute inset-0 origin-left bg-[#dba8de] transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${n < chapter ? 1 : n === chapter ? progress : 0})` }}
                  />
                </span>
                <span className={cn('truncate type-small-em transition-colors', n === chapter ? 'text-white' : 'text-white/45 group-hover:text-white/75')}>{c.title}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous chapter" onClick={() => jump(chapter - 1)} className="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10">
              <Icon name="chevL" size={18} />
            </button>
            <button
              type="button"
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => (ended ? jump(0) : setPlaying((p) => !p))}
              className="flex h-9 items-center gap-2 rounded-full bg-white px-4 type-small-em text-[#1a1519]"
            >
              {playing && !ended ? (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
                  <rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <Icon name="play" size={12} />
              )}
              {ended ? 'Replay' : playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" aria-label="Next chapter" onClick={() => jump(chapter + 1)} className="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10">
              <Icon name="chevR" size={18} />
            </button>
            <span className="ml-2 truncate type-small text-white/70">
              <span className="type-small-em text-white">
                {chapter + 1}. {C.time ? `${C.time} · ` : ''}
                {C.title}
              </span>{' '}
              · {C.blurb}
            </span>
            <span className="ml-auto flex items-center gap-1">
              {[1, 1.5, 2].map((s) => (
                <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)} className={cn('h-7 rounded-full px-2.5 type-small-em', speed === s ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white')}>
                  {s}×
                </button>
              ))}
              <span className="mx-1 h-5 w-px bg-white/15" />
              <SoundToggle className="size-8 border-white/15 bg-transparent text-white/70 hover:text-white" />
              <button type="button" aria-label={full ? 'Exit full screen' : 'Full screen'} onClick={toggleFull} className="flex size-8 items-center justify-center rounded-sm text-white/70 hover:bg-white/10 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  {full ? <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" /> : <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />}
                </svg>
              </button>
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
