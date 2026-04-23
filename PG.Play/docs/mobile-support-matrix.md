# PG.Play — mobile support matrix

*Per-game verdict on mobile playability. Drives the registry field
`mobileSupport` in `src/data.js` and what we badge on cards.*

## Support levels

- **`native`** — designed for touch first. Works perfectly on a phone.
- **`touch-ok`** — plays fine on touch with minor adaptations
  (on-screen buttons or gesture mapping). Needs work but shippable.
- **`desktop-first`** — mostly keyboard/mouse; phone works but is a second
  experience. Needs a virtual-controls layer before claiming "mobile."
- **`desktop-only`** — don't try on a phone. Show a "best on desktop"
  warning in the intro.

## Matrix

| ID | Title | Genre | Status | Mobile level | Orientation | Primary mobile input | Notes |
|---|---|---|---|---|---|---|---|
| g2048 | 2048 | Puzzle | playable | `native` | portrait | swipe | Swipe already implemented. |
| connect4 | Connect 4 | Classic | playable | `native` | any | tap column | Drop-to-column via tap; works as-is. |
| cutrope | Cut the Rope | Puzzle | playable | `native` | landscape | tap to cut rope | Already supports `onTouchStart`. |
| slither | Slither-lite | Arcade | *this session* | `native` | any | follow-finger | Touch is the primary input target. |
| eightball | 8-Ball Pool | Classic | playable | `touch-ok` | landscape | drag aim + release | Aim line + power ring mapped to touch drag. |
| basket | Basket Champs-like | Sports | stub | `touch-ok` | landscape | drag to aim arc | Whole genre is touch-native; scope as `native` when built. |
| bloons | Bloons-style TD | Tower-Def | stub | `native` | landscape | tap place, tap upgrade | Classic TD maps to touch. |
| papa | Papa's-style | Time-mgmt | stub | `native` | landscape | drag/drop stations | Kitchen workflow wants touch. |
| arena | Arena (top-down) | Multiplayer | playable | `touch-ok` | landscape | virtual twin-stick | Needs left-thumb move + right-thumb aim overlay. |
| hook | Stickman Hook | Platformer | playable | `touch-ok` | landscape | press-and-release tap | Single-button; easy adapt. |
| vex | Vex-like | Platformer | stub | `desktop-first` | landscape | virtual d-pad | Precision platformer hurts on touch without good buttons. |
| fps | Raycaster FPS | Shooter | playable | `desktop-first` | landscape | dual-thumb + auto-fire | Works with overlay; ship only after virtual-controls wave. |
| slipshot | Slipshot | FPS | playable | `desktop-only` | landscape | — | Slidehop timing needs keyboard + mouse; don't pretend otherwise. |
| grudgewood | Grudgewood | Rage | playable | `touch-ok` | landscape | virtual d-pad | Reaction-speed trap dodging viable on touch with good pad. |
| nightcap | Nightcap | Rage | playable | `touch-ok` | landscape | virtual d-pad | Same constraints as Grudgewood. |
| aow | Age-of-War-like | Strategy | stub | `native` | landscape | tap to spawn/upgrade | Lane strategy is tap-friendly. |
| bob | Bob-the-Robber-like | Stealth | stub | `touch-ok` | landscape | tap-to-path + action buttons | Point-and-click variant works on touch. |
| football | Football Legends-like | Sports | stub | `touch-ok` | landscape | virtual d-pad + shoot | Couch feel is the target — local versus. |
| happywheels | Happy Wheels-like | Physics | stub | `desktop-first` | landscape | virtual lean + brake | Physics sims are fiddly on phones. |
| fbwg | Fireboy & Watergirl-like | Co-op | stub | `desktop-only` | landscape | — | Same-device real-time co-op is awful on a shared phone. |
| badicecream | Bad-Ice-Cream-like | Co-op | stub | `desktop-only` | landscape | — | Same as above. |
| connect4 | *(see above)* | | | | | | |

## Platform affordances to build

1. **Mobile-supported badge** on cards (surfaces the `mobileSupport` field).
2. **"Best on desktop" intro banner** when `mobileSupport === 'desktop-only'`
   and the user's viewport is < 820px.
3. **`src/input/useVirtualControls.jsx`** — shared on-screen d-pad + buttons
   with configurable slot layout, used by Grudgewood/Nightcap/Arena/Hook first.
4. **Orientation hint** on cards whose `orientation === 'landscape'` and the
   device is portrait. Suggest rotating.

## Principles (for whoever implements the touch layer)

- Fingers are not mice — 44 × 44 px minimum hit target.
- Button layout follows genre: platformers want d-pad left + jump right.
- Don't auto-hide controls during gameplay; fade them 40% when not pressed.
- Left-handed variant is a pref toggle, not a mode switch.
- Haptic feedback (`navigator.vibrate([…])`) is supported on mobile Safari
  iOS 18+ and all Android Chrome — wire for hits/deaths/wins only.
- Gyro aim is tempting but usually worse than a thumb stick. Skip for v1.
