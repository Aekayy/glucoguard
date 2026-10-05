# GlucoGuard 2.0 — working prototype

A patient iPhone app and a care-team console that follow **one 3 a.m. low across six people**: Denise (patient), Maria (daughter, no app), Priya (night coordinator), Dr. Chen (physician), Harbor Home Medical (supplier) and Medicare (payer).

Built from the Figma file *GlucoGuard-Upgraded* (Hearth direction, Held logo). Screen IDs in the code and in the prototype's side panel match the Figma frames (O1–O12, T1–T4, A1–A13, Q1–Q10, D1–D6…).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

| Route | What it is |
|---|---|
| `#/` | Landing page with the night's story |
| `#/app` | Patient app in an iPhone 15 frame, with flow launcher, state toggles and a note card per screen |
| `#/console` | Care Console (sign in → queue). Best at 1440 px wide or more |

## Stack

React 19 · TypeScript · Tailwind CSS v4 · Motion · Base UI (direction provider) · input-otp · @tabler/icons-react · @web-kits/audio. Hash routing, so it runs on any static host.

## Design system in code

- `src/styles.css` holds the Hearth tokens from the Figma variables, with the same names and both Light and Dark modes, plus the text styles as `type-*` utilities (`type-large-title`, `type-wbody-em`, `type-num-hero`…). Dark mode is the Figma *Night mode*: the whole phone switches with one `.dark` class.
- `src/components/hearth/ios.tsx` contains Chip, Banner, Toggle, Avatar, Field, Segmented, Progress, NavBar and the timeline rows.
- `src/app/console/web.tsx` contains WebField, Pill, Stat, Stepper, Tabs, FilterChips, Modal, Choice, Checkbox, Sidebar and TopBar.
- `src/components/icons.tsx` has the icon set exported from Figma, with the glucose glyphs and the Held mark.
- `src/components/charts/charts.tsx` has the glucose chart (target band, dashed thresholds, low segments recoloured), AGP, the TIR bar and the ring.

## The four supplied components, customised to Hearth

| Component | Where it's used | What changed from the reference |
|---|---|---|
| **Input OTP** (`components/ui/input-otp.tsx`) | O4 clinic code (`JH472K`), S3 MFA code | Added `mode="alphanumeric"` because clinic codes are printed with letters (the reference forces digits). Slots use Hearth sizes (52×60, radius 16), the ring is brand, errors use `glucose/low`, the success sweep is in-range green. The ring measurement divides by the phone frame's CSS scale. |
| **Toast** (`components/ui/toast.tsx`) | Log saved (L1s), card uploaded (C6), alert resolved (Q8), 911 called (Q9s), order sent (D5), protocol published (PR3)… | Restyled to the Figma toast: a 44 px ink pill with a surface label. Lifetime is 3 s (Hearth motion spec). Tone glyphs use the tint colours so they read on the inverted pill. Added `contained` so toasts live inside the phone frame. The paid `@kobra/alert`, `@kobra/button` and `@kobra/spinner` dependencies are replaced with Hearth equivalents (`ui/alert.tsx`, `ui/button.tsx`, `ui/spinner.tsx`). |
| **Sound** (`components/ui/sound.tsx`) | Wraps the whole app once (`main.tsx`); toggle in every header | Kept all `data-slot` / `data-sound` wiring. Added four clinical cues: `lowAlert` (gentle falling third), `urgent` (Critical Alert, three rising pulses, under 54 only), `holdTick` (hold-to-confirm haptics) and `heartbeat`. Added `playSound()` for cues that aren't presses, such as an alert arriving. Mute and volume still apply. |
| **Approval card** (`components/primitives/approval-card.tsx`) | A12 post-event check-in sent to Priya; D3 "How do you want to fix this?" coverage chooser | Hearth tokens instead of the beautifui foundation. Brand primary Continue with ⏎. Optional per-option hints and a `density` (`ios` / `web`). A single choice on the **last** question no longer auto-sends, because these answers become part of a clinical record. |

## Motion notes

- **Care circle (Welcome · O2).** The circle of people revolves (48 s, linear, CSS). Names counter-rotate so they stay upright. "You" beats lub-dub every 1.4 s with a faint ripple, and each person glows faintly as the ripple reaches them. With reduced motion the orbit stops and the heartbeat becomes a soft opacity pulse.
- **The story in one night (landing page).** A 9-beat animated storyboard with six people in three places (home, clinic, supplier and payer). Each beat lights who's involved, draws the signal between them with a travelling dot, and shows the real UI moment. The sky goes from 3 a.m. night (the stage switches to the Dark token mode) to morning to day. It autoplays 5.5 s per beat only while in view, pauses on hover, and has play/pause, arrows and a clickable timeline. With reduced motion: no autoplay or travelling dots.
- **Hold to confirm (A7 → A9).** A 2 s linear fill while held, a haptic tick every 0.5 s, and a 200 ms ease-out snap back on release. A tap can't cancel a rescue.
- **Screen push.** 380 ms on the iOS drawer curve. Tab switches cross-fade.
- **Command palette (⌘K).** Opened 100+ times a day, so it deliberately doesn't animate.

## Honest scope

- This is a clickable prototype with local state. There's no backend, no real CGM, SMS, Medicare or EHR integration, and no PHI.
- The patient chart (P2) builds the **Overview** tab only. The other tabs explain that they're designed in Figma.
- Times run faster than real life where waiting would stall a demo (the 15-minute recheck runs in 15 s).
