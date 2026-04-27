# Era Siege — Audio Wishlist

Audio strategy in v7:

- **Procedural mixer stays.** The platform `src/sound.js` synth covers
  every cue today. Volume buses (master / music / sfx) gate it.
- **Sample-based audio is opt-in.** Drop OGG / WAV files at the listed
  paths and `engine/audio.js` will start preferring them over the
  procedural cue. The procedural fallback is the contract — every cue
  always has a sound, even with zero asset files.
- **Loudness target**: -14 LUFS integrated for music, -10 LUFS for
  one-shot SFX. Per-cue gain ceiling: -6 dBFS to leave headroom.
- **Format**: OGG Vorbis 96 kbps for SFX, OGG Vorbis 128 kbps for
  music. Provide a WAV master alongside if possible.

Each entry maps 1:1 to a cue ID consumed by `engine/audio.js`.

---

## 1. UI sounds (8)

### ui-hover
- File name: `era-siege/audio/sfx/ui-hover.ogg`
- Purpose: cursor hover on actionable HUD button (desktop only)
- Duration: 80–120 ms
- Style: very soft tick, low-passed, organic
- Layering: one-shot
- Priority: optional

### ui-click
- File name: `era-siege/audio/sfx/ui-click.ogg`
- Purpose: HUD button press confirm
- Duration: 100–160 ms
- Style: crisp tick + small body
- Priority: important

### ui-confirm
- File name: `era-siege/audio/sfx/ui-confirm.ogg`
- Purpose: spawn / build success
- Duration: 200–300 ms
- Style: rising two-tone tick
- Priority: important

### ui-cancel
- File name: `era-siege/audio/sfx/ui-cancel.ogg`
- Purpose: closing a modal / cancel build
- Duration: 200–300 ms
- Style: soft falling tone
- Priority: optional

### ui-error
- File name: `era-siege/audio/sfx/ui-error.ogg`
- Purpose: insufficient gold / cooldown / locked
- Duration: 180–240 ms
- Style: dry double-blip, low contrast
- Priority: important

### ui-unlock
- File name: `era-siege/audio/sfx/ui-unlock.ogg`
- Purpose: difficulty unlock, achievement unlock
- Duration: 600–900 ms
- Style: warm chord up
- Priority: optional

### ui-evolve-stinger
- File name: `era-siege/audio/sfx/ui-evolve-stinger.ogg`
- Purpose: era-up moment (stronger than achievement)
- Duration: 1.0–1.4 s
- Style: cinematic chord rise + brass / synth swell to taste of era
- Priority: important

### ui-purchase
- File name: `era-siege/audio/sfx/ui-purchase.ogg`
- Purpose: power-up unlock confirm
- Duration: 300–400 ms
- Style: coin-stack drop + soft chime
- Priority: important

---

## 2. Unit sounds (15+ — one shared per role + per-era flavour optional)

### unit-spawn-light / unit-spawn-heavy
- File name: `era-siege/audio/sfx/unit-spawn-light.ogg` / `…heavy.ogg`
- Purpose: unit spawn (light = frontline/ranged, heavy = heavy)
- Duration: 200–300 ms / 300–500 ms
- Style: light = quick whoosh; heavy = ground thud + brace
- Layering: one-shot, throttled per-unit-id 90 ms
- Priority: important

### unit-melee-hit-light / unit-melee-hit-heavy
- File name: `…/unit-melee-hit-light.ogg` / `…heavy.ogg`
- Purpose: melee impact (light unit / heavy unit)
- Duration: 150–250 ms
- Style: dry transient (light = wood/leather thwack; heavy = metal-on-metal clang)
- Priority: important

### unit-ranged-fire-era<N> for N=1..5
- File name: `era-siege/audio/sfx/unit-ranged-fire-era<N>.ogg`
- Purpose: ranged unit fire — per-era flavour
- Duration: 150–300 ms
- Style:
  - Era 1: bone-shard sling
  - Era 2: crossbow twang
  - Era 3: steam release + click
  - Era 4: tesla arc snap
  - Era 5: void resonance
- Priority: important (era-1 + era-3 + era-5 critical, era-2 + era-4 nice-to-have)

### unit-projectile-impact
- File name: `era-siege/audio/sfx/unit-projectile-impact.ogg`
- Purpose: arrow / bolt / shard hits
- Duration: 100–180 ms
- Style: dry crack + small body
- Priority: important

### unit-death-light / unit-death-heavy
- File name: `era-siege/audio/sfx/unit-death-light.ogg` / `…heavy.ogg`
- Purpose: unit removal moment
- Duration: 200–400 ms / 400–800 ms
- Style: light = grunt + ragdoll; heavy = collapse + crumble
- Priority: optional (procedural fallback works)

---

## 3. Turret sounds (8)

### turret-build
- File name: `era-siege/audio/sfx/turret-build.ogg`
- Duration: 400–700 ms
- Style: layered thud + metal lock; cohesive across eras
- Priority: important

### turret-sell
- File name: `era-siege/audio/sfx/turret-sell.ogg`
- Duration: 250–350 ms
- Style: coin scoop + dismantle creak
- Priority: optional

### turret-fire-era<N> for N=1..5
- File name: `era-siege/audio/sfx/turret-fire-era<N>.ogg`
- Duration: 150–500 ms (mortar/cannon/lance heavier)
- Style:
  - 1: ballista click
  - 2: heavy crossbow twang
  - 3: brass mortar thump + reverb
  - 4: tesla arc + crack
  - 5: void lance hum + shock
- Priority: important (1, 3, 5 critical)

### turret-slot-unlock
- File name: `era-siege/audio/sfx/turret-slot-unlock.ogg`
- Duration: 600–900 ms
- Style: chime + grounding thud
- Priority: optional (no slot unlock content yet, but reserve)

---

## 4. Battlefield sounds (10)

### base-hit-light / base-hit-heavy
- File name: `era-siege/audio/sfx/base-hit-light.ogg` / `…heavy.ogg`
- Duration: 200–400 ms / 400–700 ms
- Style: stone splinter (light), cannon-impact (heavy)
- Priority: important

### special-charge
- File name: `era-siege/audio/sfx/special-charge.ogg`
- Duration: 800–1200 ms
- Style: slow rising whine matching telegraph length
- Priority: important

### special-impact-era<N> for N=1..5
- File name: `era-siege/audio/sfx/special-impact-era<N>.ogg`
- Duration: 600–1000 ms
- Style:
  - 1: rain of impacts + ember crackle
  - 2: salvo of bolts hitting + screams
  - 3: forge-roar + buff swell
  - 4: thunderclap forked
  - 5: low rumble + glass shimmer
- Priority: important (1, 3, 5 critical)

### explosion-small / explosion-medium
- File name: `…/explosion-small.ogg` / `…medium.ogg`
- Duration: 300–500 ms / 500–900 ms
- Style: warm thud + decay
- Priority: important

### ambient-battle-loop
- File name: `era-siege/audio/sfx/ambient-battle-loop.ogg`
- Type: looping bed
- Duration: 30–60 s loop
- Style: distant crowd / wind / metallic shuffle, very low; sits under everything
- Priority: optional

---

## 5. Music (4)

### music-menu-loop
- File name: `era-siege/audio/music/menu.ogg`
- Type: loop
- Duration: 60–90 s
- Style: pensive, era-neutral, sparse strings + bass
- Priority: optional

### music-battle-early-loop
- File name: `era-siege/audio/music/battle-early.ogg`
- Type: loop
- Duration: 90–120 s
- Style: low-energy ostinato; era 1–2 mood
- Priority: important

### music-battle-late-loop
- File name: `era-siege/audio/music/battle-late.ogg`
- Type: loop
- Duration: 90–120 s
- Style: high-energy, brass / synth; era 3–5 mood
- Priority: important

### music-victory-sting / music-defeat-sting
- File name: `era-siege/audio/music/victory.ogg` / `…/defeat.ogg`
- Type: one-shot
- Duration: 6–10 s
- Style: triumphant chord (victory) / bass drop minor (defeat)
- Priority: important

---

## Format / delivery rules

- **OGG Vorbis** preferred, MP3 acceptable for music if needed.
- **Sample rate 44.1 kHz**, 16-bit, mono SFX, stereo music.
- **Trim silence** from heads/tails — no leading 100ms of nothing.
- **Loop points** for music must be sample-perfect (no audible click).
- **Normalize** to peaks at -1 dBFS with the loudness targets above.
- **Stems / project files** kept alongside in case we need a remix later.

## Wiring contract (for `engine/audio.js`)

When `engine/audio.js` resolves a cue id:

1. If `assets.has('audio/sfx/<id>')` and the buffer is ready → play the buffer through the SFX bus.
2. Else fall back to the procedural cue from `src/sound.js`.

The buses (`master`, `music`, `sfx`) live in `utils/settings.js` and the
sliders persist via the storage adapter. The procedural mixer multiplies
its internal gain by `master * sfx`. The HTMLAudio / WebAudio sample
playback path multiplies by the same.

## Loudness QA checklist

- All SFX peak-aligned within 3 dB of each other.
- No cue exceeds -3 dBFS peak.
- Music ducks to 60% under SFX hits if a duck node is added (v2 — not in
  phase 7).
- Tab-hidden suspends the AudioContext (already done in `src/sound.js`).
