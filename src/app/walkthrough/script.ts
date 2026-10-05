/* ─────────────────────────────────────────────────────────
 * Walkthrough script — the night story, told through the product.
 *
 * Written for someone with no medical background: plain words,
 * one idea per caption, and only what happens, where, and how.
 * It follows the same beats as "The story in one night" on the
 * home page. Each chapter starts with a `load`, so any chapter can
 * be played on its own.
 *
 * Targets are found by visible text (or a CSS selector) inside the
 * live prototype, so the tour drives the real screens.
 * ───────────────────────────────────────────────────────── */

import type { SoundName } from '@/components/ui/sound'

export type Target = { text?: string; exact?: boolean; sel?: string }

type Say = { say?: string; ms?: number; cue?: SoundName }

export type Step =
  | ({ do: 'load'; route: string; signedIn?: boolean } & Say)
  | ({ do: 'nav'; route: string } & Say)
  | ({ do: 'say' } & Say)
  | ({ do: 'point' } & Target & Say)
  | ({ do: 'click' } & Target & Say)
  | ({ do: 'type'; value: string; clear?: boolean } & Target & Say)
  | ({ do: 'hold'; holdMs: number } & Target & Say)
  | ({ do: 'key'; key: string; ctrl?: boolean } & Say)
  | ({ do: 'scroll' } & Target & Say)
  | ({ do: 'wait'; ms: number; until?: Target } & Say)

export type Chapter = {
  /** when it happens in the story, shown on the chapter card */
  time?: string
  title: string
  surface: 'Overview' | 'Denise’s phone' | 'Maria’s phone' | 'Care team laptop'
  blurb: string
  steps: Step[]
}

export const CHAPTERS: Chapter[] = [
  {
    title: 'Meet the people',
    surface: 'Overview',
    blurb: 'One night, six people, one problem to solve.',
    steps: [
      { do: 'load', route: '/' },
      { do: 'point', text: 'Every alert, followed through.', say: 'GlucoGuard helps people whose blood sugar can suddenly drop too low, which is dangerous, especially at night while they sleep.' },
      { do: 'scroll', text: 'Meet the people', say: 'This is the story of one night, and the six people in it.' },
      { do: 'point', text: 'Denise Okafor, 67', say: 'Denise, 67, lives alone. She takes insulin, a medicine that lowers blood sugar. Sometimes it drops too far.' },
      { do: 'point', text: 'Maria Okafor', say: 'Maria is her daughter. She lives 12 minutes away.' },
      { do: 'point', text: 'Priya Shah, RN', say: 'Priya is a night nurse. From her laptop, she looks after many patients at once.' },
      { do: 'point', text: 'Dr. Wen Chen', say: 'Dr. Chen is Denise’s doctor.' },
      { do: 'point', text: 'Harbor Home Medical', say: 'Harbor sends Denise her medical supplies, and Medicare is her health insurance.' },
      { do: 'scroll', text: 'An alarm that only one sleeping person can hear', say: 'The problem: if Denise’s blood sugar drops while she sleeps, only her phone knows. Nobody else finds out until morning.' },
    ],
  },
  {
    title: 'Her phone keeps watch',
    surface: 'Denise’s phone',
    blurb: 'A small sensor sends her blood sugar to the app.',
    steps: [
      { do: 'load', route: '/app' },
      { do: 'click', text: 'Everyday: Today, log, trends' },
      { do: 'point', text: 'You’re in range and steady.', say: 'Denise wears a small sensor on her arm. Every 5 minutes it sends her blood sugar to this app.' },
      { do: 'point', text: '112', exact: true, say: 'This is her number right now. The app says it in plain words first: she’s fine.' },
      { do: 'point', sel: 'svg[aria-label="Glucose over time"]', say: 'The line shows the last 24 hours. The green band is safe. Below the red dotted line is too low.' },
    ],
  },
  {
    time: '3:13 a.m.',
    title: 'The alarm gets louder',
    surface: 'Denise’s phone',
    blurb: 'Denise is asleep and doesn’t answer.',
    steps: [
      { do: 'load', route: '/app' },
      { do: 'click', text: '3 a.m. very low' },
      { do: 'point', text: 'Urgent low · 49 mg/dL', cue: 'urgent', say: 'At 3:03 her blood sugar started falling. She’s asleep and didn’t answer. Now it’s dangerously low, so a loud alarm plays, even with her phone on silent.' },
      { do: 'click', text: 'Urgent low · 49 mg/dL' },
      { do: 'point', text: 'Have 15 g of fast sugar', say: 'The app tells her exactly what to do: have something sugary, like juice.' },
      { do: 'point', text: 'Maria is being called', say: 'She still hasn’t answered, so the app calls for help on its own: Maria first, then the nurse, and 911 only if nobody responds.' },
    ],
  },
  {
    time: '3:18 a.m.',
    title: 'Maria gets a text',
    surface: 'Maria’s phone',
    blurb: 'No app needed, just a text message.',
    steps: [
      { do: 'load', route: '/app' },
      { do: 'click', text: 'Caregiver SMS, no app' },
      { do: 'point', text: 'URGENT from GlucoGuard', say: 'This is Maria’s phone. She doesn’t need the app: she gets an ordinary text message saying her mother needs help.' },
      { do: 'click', text: '1 · I’m going', say: 'She replies 1 to say she’s on her way.' },
      { do: 'wait', ms: 3200, until: { text: 'back in range (82' }, cue: 'notification', say: 'Because someone is coming, the 911 call is put on hold. Maria will get another text once her mother is safe.' },
    ],
  },
  {
    time: '3:18 a.m.',
    title: 'The night nurse sees it',
    surface: 'Care team laptop',
    blurb: 'Every alert in one list, most urgent first.',
    steps: [
      { do: 'load', route: '/console/queue', signedIn: true },
      { do: 'wait', ms: 1300, until: { text: 'Sorted by clinical urgency' } },
      { do: 'point', text: 'Denise Okafor', say: 'At the same moment, Priya’s laptop shows every patient who needs attention, most urgent first. Denise is at the top.' },
      { do: 'point', text: 'Why this fired:', say: 'It explains why in one line, so Priya doesn’t have to dig: very low for 15 minutes, and still dropping.' },
      { do: 'key', key: 'a', say: 'With one key, Priya takes charge of Denise’s case. While she handles it, the 911 call waits.' },
      { do: 'point', text: 'You’re handling this alert', say: 'Now everyone can see that a nurse is on it.' },
    ],
  },
  {
    time: '3:19 a.m.',
    title: 'Denise says she’s OK',
    surface: 'Denise’s phone',
    blurb: 'A hold, not a tap, so help is never cancelled by accident.',
    steps: [
      { do: 'load', route: '/app' },
      { do: 'click', text: '3 a.m. very low' },
      { do: 'click', text: 'Urgent low · 49 mg/dL', say: 'Denise wakes up and drinks some juice.' },
      { do: 'point', sel: '[aria-label^="Hold:"]', say: 'To stop the calls, she presses and holds this button for 2 seconds. A quick tap won’t do it, so a confused person can’t cancel help by accident.' },
      { do: 'hold', sel: '[aria-label^="Hold:"]', holdMs: 2400, say: 'Holding…' },
      { do: 'point', text: 'Calls stopped', say: 'The calls stop and Maria is told. The app will check her number again soon, just in case.' },
    ],
  },
  {
    time: '3:34 a.m.',
    title: 'Case closed',
    surface: 'Care team laptop',
    blurb: 'One note, saved everywhere it’s needed.',
    steps: [
      { do: 'load', route: '/console/queue', signedIn: true },
      { do: 'wait', ms: 1300, until: { text: 'Sorted by clinical urgency' } },
      { do: 'key', key: 'a' },
      { do: 'click', text: 'Resolve alert', exact: true, say: 'Denise is safe and Maria is with her. Priya closes the case.' },
      { do: 'click', text: 'Fill example', say: 'She picks what happened and writes a short note.' },
      { do: 'click', text: 'Resolve alert', exact: true, say: 'It’s saved to Denise’s record automatically, and her doctor gets a reminder to follow up. Nobody types it twice.' },
    ],
  },
  {
    time: '10:12 a.m.',
    title: 'New sensors, no fax',
    surface: 'Care team laptop',
    blurb: 'The insurance is checked while the doctor orders, and Denise can track the box.',
    steps: [
      { do: 'load', route: '/console/orders/new/denise', signedIn: true, say: 'In the morning, Dr. Chen sees Denise’s sensors run out in 6 days, so he orders more.' },
      { do: 'wait', ms: 500, until: { text: 'Checked live' }, say: 'While he orders, the system checks with her insurance that it will pay. Each check turns green.' },
      { do: 'click', text: 'Sign and send order', exact: true, say: 'Everything passes, so he signs and sends it.' },
      { do: 'wait', ms: 400, until: { text: 'Order sent to Harbor' }, say: 'Everything the supply company needs goes in one package. No fax machines, no phone calls back and forth.' },
      { do: 'load', route: '/app' },
      { do: 'click', text: 'Everyday: Today, log, trends' },
      { do: 'click', text: 'Care', exact: true, say: 'On her phone, Denise opens Care…' },
      { do: 'click', text: 'Dexcom G7 sensors × 3', say: '…and can follow her new sensors all the way to her door.' },
      { do: 'point', text: 'Out for delivery', say: 'They arrive with days to spare.' },
    ],
  },
  {
    time: 'Sep 30',
    title: 'The work counts',
    surface: 'Care team laptop',
    blurb: 'The clinic is paid for watching over Denise.',
    steps: [
      { do: 'load', route: '/console/billing', signedIn: true },
      { do: 'point', text: 'Remote monitoring claims', say: 'At the end of the month, the time the care team spent looking after patients like Denise is sent to the insurance.' },
      { do: 'click', text: 'Review and submit', say: 'One click sends it, so the clinic can keep doing this every night.' },
      { do: 'click', text: 'Submit claims', exact: true },
      { do: 'say', say: 'That’s GlucoGuard: one alarm, and everyone who can help, working from the same information. Denise was safe in 16 minutes.' },
    ],
  },
]
