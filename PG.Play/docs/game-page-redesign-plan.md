# PG.Play — game page redesign plan

*The play shell upgrade that shipped with this pass. Pairs with
`ui-audit.md` and `home-redesign-plan.md`. Mobile strategy for
individual games lives in `mobile-support-notes.md`.*

## Goal

Stop treating the playing screen as a debug shell. Every game now
mounts inside a shared `<GameShell>` with a productized topbar, a
companion panel, and a set of overlays that behave the same across
every title.

## The GameShell component

File: `src/components/GameShell.jsx`. Accepts:

```js
<GameShell
  game={game}
  mode={mode}            // 'bot' | '2p' | 'start' | 'shootout' | custom
  best={best}
  onExit={onClose}
  onRestart={() => ...}  // remount game by bumping a key in GameIntro
  goals={{ lead, bullets }}
  controls={[{ title, items: [{ keys, label }] }]}
  tips={[string]}
  helpTitle="Game name — how to play">
  {/* game canvas component renders here */}
</GameShell>
```

### Regions

- **Topbar** — Back chip, title, mode + device + best chips, Toolbar
  (Restart · Pause · Help · Mute · Fullscreen).
- **Viewport** — bordered, radius-xl, inset glow. Shell applies a
  subtle blur+dim filter when paused. `requestFullscreen` attaches
  to the shell root, not the window.
- **Companion panel** — 320px on desktop; collapses below 900px. Tabs:
  Goals, Controls, Tips, Stats, Related. Games opt in via `goals`,
  `controls`, `tips` props; a `SHELL_CONFIG` dict in `GameIntro`
  maps each game id to its content.
- **Overlays** — `PauseOverlay`, `HelpOverlay`, `EndOverlay` (in
  `components/game-shell/Overlays.jsx`). Focus trap, Esc closes.
- **Device hint** — when viewport < 820px and the game is
  `desktop-only`, `components/DeviceHint.jsx` blocks play with a
  "Play anyway" escape hatch.

### Keyboard shortcuts (shell-owned)

| Key | Action      |
|-----|-------------|
| P   | Pause / resume |
| R   | Restart     |
| M   | Mute toggle |
| F   | Fullscreen  |
| ?   | Help overlay |
| Esc | Close overlay, then exit |

The shell ignores these keys when typing into an input or
contenteditable element.

## Virtual controls

`src/input/useVirtualControls.jsx` provides declarative bindings per
game id. The shell auto-mounts `<VirtualControls/>` inside the
viewport when `hasBinding(game.id)` is true. Touch presses dispatch
synthetic `KeyboardEvent`s so games keep their existing keyboard
handlers without any input-layer edits.

Existing bindings (ship as-is): `grudgewood`, `nightcap`, `hook`,
`vex`, `bob`, `goalbound`, `fps`.

## Migration cost per game

Games currently in the repo continue to work — mounting via
`GameIntro.jsx` now wraps them in `<GameShell>` automatically.
To enrich a game's companion panel:

1. Add an entry to `SHELL_CONFIG` in `GameIntro.jsx` keyed by game id.
2. Provide `goals`, `controls`, and `tips` (all optional).

Games that currently reference `R` or `P` as gameplay keys should
pick alternates — the shell owns those now.

## Not in this pass

- In-viewport HUDs (Goalbound's is hand-rolled for the shootout
  overlay pattern; the Stats tab in the companion panel covers the
  rest).
- Achievements surface on the end overlay — only `EndOverlay` has a
  slot for `extras`, not a list view.
- Gamepad bindings. Virtual controls are touch-only.
