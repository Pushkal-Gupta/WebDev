# PG.Play — mobile support notes

*Companion to `mobile-support-matrix.md`, which is the per-game
verdict list. This note records the platform-level decisions that
drove the current mobile strategy.*

## Decision 1 — virtual controls belong on the shell, not the games

The existing `src/input/useVirtualControls.jsx` was written as a
layer that dispatches synthetic `KeyboardEvent`s. That is the right
call. Games already listen for keys; forcing them to opt into a
different input API would fork the codebase.

GameShell now mounts `<VirtualControls gameId={game.id}/>` inside
the viewport whenever `hasBinding(game.id)` returns true. Games
require zero input-layer edits.

The alternative — a `useVirtualControls` hook that each game pulls
and wires — was rejected because it leaks input-layer knowledge
into every game. The synthetic-key approach keeps the boundary
clean.

## Decision 2 — don't pretend versus works on one phone

Local Versus on Goalbound is desktop-only. Two simultaneous
thumb-stick-and-button inputs on a single phone are cramped and
low-quality. Instead, mobile gets:

1. **Quick Match vs AI** — full mobile support with virtual
   controls.
2. **Penalty Shootout** — 5 alternating rounds of single-input
   (kicker or keeper, never both at once). Works cleanly on one
   phone. Mobile-native hotseat.

On mobile, the Local Versus CTA is rendered in a disabled state
with a "desktop" chip and a title hint ("Best on desktop — pass the
laptop for local versus"). This is the honest move.

The same principle applies to Fireboy & Watergirl (and Bad Ice
Cream): real-time same-device co-op is worse on a shared phone than
it is on a shared keyboard. Those titles stay `desktop-only` and
trigger the DeviceHint card when opened on a narrow viewport.

## Decision 3 — DeviceHint over silent degradation

When a `desktop-only` game opens on `< 820px`, the shell renders
`components/DeviceHint.jsx` instead of the game canvas. The card
explains the mismatch, keeps the user from a bad first session,
and offers an explicit "Play anyway" escape hatch.

The hint is dismissible per-session. It does not store a "always
play anyway" flag — by design, we want users to re-read it when
they come back.

## Decision 4 — touch-ok = native + noise

The registry splits mobile support into four buckets. The two
middle buckets (`touch-ok`, `desktop-first`) are where expectations
most often go wrong. For clarity:

- `native`: designed for touch. No hedging.
- `touch-ok`: ships a playable mobile experience after the virtual
  controls layer is applied. Minor friction is acceptable.
- `desktop-first`: mobile works mechanically but feels like a
  keyboard game on a phone. Recommend desktop in the intro copy but
  don't block.
- `desktop-only`: blocking DeviceHint below 820px.

## Decision 5 — no gyro, no gesture stunts

Gyro aim was tempting for shootout mode. Skipped — it's worse than
a thumb stick once novelty wears off. Swipe gestures for Goalbound
kick were also skipped — tap-to-aim is readable, precise, and works
consistently whether the user is standing or sitting.

## What's still missing

- Haptics. `navigator.vibrate([...])` for hits/kicks/goals would
  add real heft on Android Chrome and iOS 18+ Safari. Three-line
  addition to `sound.js`, deferred to keep this pass scoped.
- Orientation hint on narrow portrait-mode mobile for landscape
  games. The browser's default is fine; a toast saying "rotate for
  a better view" would be nicer.
- A "large touch targets" accessibility pref. Virtual controls
  default to 44x44 but some fingers want 56.
