import { motion } from 'motion/react'
import { useEffect } from 'react'

import { NightStory } from '@/app/night-story'
import { WalkthroughButton } from '@/app/walkthrough/walkthrough'
import { CareCircleIllustration } from '@/app/patient/care-circle'
import { HeldMark, Icon } from '@/components/icons'
import { Chip } from '@/components/hearth/ios'
import { SoundToggle } from '@/components/ui/sound'

export function Landing() {
  useEffect(() => {
    document.title = 'GlucoGuard · Prototype'
  }, [])
  return (
    <div className="min-h-full bg-canvas">
      <header className="mx-auto flex max-w-[1200px] items-center gap-3 px-8 pt-8">
        <span className="flex size-9 items-center justify-center rounded-sm bg-brand text-on-brand">
          <HeldMark size={22} />
        </span>
        <span className="type-h1 text-ink">GlucoGuard</span>
        <span className="rounded-full bg-tint px-2.5 py-1 type-small-em text-brand">2.0 · working prototype</span>
        <span className="ml-auto">
          <SoundToggle />
        </span>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-8 pt-14 pb-20">
        <section className="grid grid-cols-[1.1fr_1fr] items-center gap-12 max-lg:grid-cols-1">
          <div className="flex flex-col gap-5">
            <motion.h1
              initial={{ opacity: 0, transform: 'translateY(8px)' }}
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="font-[var(--font-rounded)] text-[52px] leading-[58px] font-bold tracking-[-0.5px] text-ink"
            >
              Every alert, followed through.
            </motion.h1>
            <p className="max-w-[520px] type-callout text-ink-2">
              One 3 a.m. low, followed across six people: the patient, her daughter, a night coordinator, a physician, a
              supplier and a payer. A patient iPhone app and a care-team console, built on one design system.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <WalkthroughButton />
              <a href="#/app" className="inline-flex h-12 items-center rounded-full border border-line bg-surface px-5 type-wbody-em text-ink transition-colors hover:bg-canvas">
                Try it yourself
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip state="veryLow" size="web">Very low</Chip>
              <Chip state="low" size="web">Low</Chip>
              <Chip state="inRange" size="web">In range</Chip>
              <Chip state="high" size="web">High</Chip>
              <Chip state="noData" size="web">No data</Chip>
            </div>
          </div>
          <div className="flex justify-center">
            <CareCircleIllustration className="shadow-[0_20px_60px_rgb(90_43_94/0.15)]" />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
          <a href="#/app" className="group flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 transition-shadow hover:shadow-[0_12px_40px_rgb(36_27_37/0.1)]">
            <span className="flex items-center gap-2 type-eyebrow text-brand">
              <Icon name="phoneDevice" size={16} /> iOS · patient
            </span>
            <span className="type-display text-ink">Patient app</span>
            <span className="type-wbody text-ink-2">
              Onboarding with clinic code, CGM connection, care circle and Critical Alerts. Today, logging, trends, care team,
              supplies. The low and very-low escalation with hold-to-confirm, night mode, Spanish, and Maria’s SMS.
            </span>
            <span className="mt-auto flex items-center gap-1 type-wbody-em text-brand">
              Open the iPhone prototype <Icon name="chevR" size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
          <a href="#/console" className="group flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 transition-shadow hover:shadow-[0_12px_40px_rgb(36_27_37/0.1)]">
            <span className="flex items-center gap-2 type-eyebrow text-brand">
              <Icon name="laptop" size={16} /> MacBook · care team
            </span>
            <span className="type-display text-ink">Care Console</span>
            <span className="type-wbody text-ink-2">
              SSO and MFA sign-in, the alert queue with keyboard triage, take over, resolve and 911. Patients and enrollment
              with live eligibility, CGM orders with Medicare criteria, protocols, RPM billing, audit log and on-call.
            </span>
            <span className="mt-auto flex items-center gap-1 type-wbody-em text-brand">
              Open the console <Icon name="chevR" size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        </section>

        <NightStory />
      </main>
    </div>
  )
}
