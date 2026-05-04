// Frost Fight lobby setup — difficulty pills + level select grid.
//
// Surfaced from GameIntro only when game.id === 'badicecream'. Picks
// persist to localStorage (pgplay-ff-difficulty / pgplay-ff-progress)
// so the lobby remembers the player's choice between sessions.
//
// Level select: rooms unlock when the previous one is cleared. Room 1
// is always unlocked. The player can click any unlocked room to start
// the run there; otherwise the run begins at room 1.

import { useEffect, useMemo, useState } from 'react';
import {
  readDifficulty, writeDifficulty,
  readTheme, writeTheme,
  readSkin, writeSkin,
  readProgress, isRoomUnlocked,
} from '../games/frost-fight/utils/progress.js';

// Phase 22d — player ice-cream skin choices. Match SKIN_IDS in
// progress.js. The labels are short so all five pills fit one row.
const SKIN_DEFS = {
  default:   { id: 'default',   label: 'Pink',     blurb: 'The classic.' },
  vanilla:   { id: 'vanilla',   label: 'Vanilla',  blurb: 'Cream cone, eyes on.' },
  sundae:    { id: 'sundae',    label: 'Sundae',   blurb: 'Cherry on top.' },
  triple:    { id: 'triple',    label: 'Triple',   blurb: 'Three scoops, all sprinkles.' },
  sandwich:  { id: 'sandwich',  label: 'Sandwich', blurb: 'Brown on cream.' },
};
const SKIN_ORDER = ['default', 'vanilla', 'sundae', 'triple', 'sandwich'];

// Phase 22g — guide modal content. Two columns: pickups on the left
// (timed buffs the player grabs), bots on the right (superpowers each
// enemy kind has). Closes on backdrop click, Esc, or X button.
const PICKUP_GUIDE = [
  { name: 'Kiwi',                blurb: 'Invincible · 2.5 s' },
  { name: 'Lemon',               blurb: 'Invisible · 3 s' },
  { name: 'Apple',               blurb: 'Speed boost · 3 s' },
  { name: 'Cherry',              blurb: 'Slows every bot · 5 s' },
  { name: 'Strawberry / Peach',  blurb: 'Score only' },
];
const BOT_GUIDE = [
  { name: 'Strawberry / Blueberry', blurb: 'Pure chase' },
  { name: 'Orange / Cherry',        blurb: 'Blows a row of ice' },
  { name: 'Banana',                 blurb: 'Slips one extra tile' },
  { name: 'Grape',                  blurb: 'Drops ice trails behind it' },
  { name: 'Eggplant',               blurb: 'Stomps your ice apart' },
  { name: 'Melon',                  blurb: 'Aggressive on shared row/col' },
  { name: 'Plum',                   blurb: 'Teleports every ~8 s' },
  { name: 'Cherrybomb',             blurb: '3×3 detonation on fuse' },
  { name: 'Kiwi / Apple / Peach',   blurb: 'Fast animated chasers' },
  { name: 'Pineapple / Lemon',      blurb: 'Animated ice casters' },
  { name: 'Candle / Teapot',        blurb: 'Trinkets ice casters' },
  { name: 'Lamp',                   blurb: 'Smart predictor — aims where you\'re going' },
  { name: 'Chest',                  blurb: 'Slow heavy Trinkets chaser' },
];

function FrostFightGuideModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ff-guide-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Frost Fight guide">
      <div className="ff-guide-card" onClick={(e) => e.stopPropagation()}>
        <div className="ff-guide-head">
          <h3>Frost Fight — Guide</h3>
          <button type="button" className="ff-guide-close" onClick={onClose} aria-label="Close guide">×</button>
        </div>
        <div className="ff-guide-cols">
          <section>
            <h4>Pickups</h4>
            <ul>
              {PICKUP_GUIDE.map((p) => (
                <li key={p.name}><b>{p.name}</b> — {p.blurb}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4>Bots</h4>
            <ul>
              {BOT_GUIDE.map((b) => (
                <li key={b.name}><b>{b.name}</b> — {b.blurb}</li>
              ))}
            </ul>
          </section>
        </div>
        <p className="ff-guide-foot">
          Tip: difficulty also affects bot intelligence — Hard and above predict where you're heading.
        </p>
      </div>
    </div>
  );
}

// Phase 22 — difficulty pill copy. Keep in sync with DIFFICULTIES in
// FrostFightGame.jsx. No life-pool maths in the labels: each tier
// just describes what changes on death or in bot behavior so all five
// pills fit in a single row.
const DIFFICULTIES = {
  easy:   { id: 'easy',   label: 'Easy',   blurb: 'Respawn in place.' },
  normal: { id: 'normal', label: 'Normal', blurb: 'Standard rules.' },
  hard:   { id: 'hard',   label: 'Hard',   blurb: 'Bots cast more.' },
  expert: { id: 'expert', label: 'Expert', blurb: 'Bots think faster.' },
  insane: { id: 'insane', label: 'Insane', blurb: 'One hit ends it.' },
};
const DIFF_ORDER = ['easy', 'normal', 'hard', 'expert', 'insane'];

// Phase 18 — theme catalogue. Each theme has a 15-room slice. Adding
// a new theme means appending here + appending its 15 levels to LEVELS
// in FrostFightGame.jsx (in startIdx order). Keep in sync with THEMES
// in FrostFightGame.jsx — names key the cleared-rooms lookup, so any
// rename here will desync the level-select tags.
const THEME_DEFS = {
  cold: {
    id: 'cold',
    label: 'Cold Aisle',
    tagline: 'Frozen pantry, fridge, deep cold, then the boss room. 20 rooms.',
    levels: [
      'Pantry', 'Cold Room', 'The Aisle', 'Walk-In', 'Loading Dock',
      'Sub-Basement', 'Cold Storage', 'Conveyor Maze', 'The Vault', 'Frostbite',
      'Frostlock', 'Slush Maze', 'Ice Run', 'Frostfall', 'Glacier',
      'Slipstream', 'Ice Wall', 'Press', 'Apex', 'Frostpeak',
    ],
  },
  orchard: {
    id: 'orchard',
    label: 'Orchard',
    tagline: 'Crystal, citrus, vineyard, final storm — and the boss runs after. 20 rooms.',
    levels: [
      'Crystal Cave', 'Crystal Tunnel', 'Geode Hall',
      'Citrus Yard', 'Lemon Grove', 'Sour Press',
      'Vineyard', 'Cellar', 'Crusher',
      'Frost Gate', 'Storm Hall', 'Final Vortex',
      'Bare Vault', 'Teleport Hall', 'Vortex Crown',
      'Plum Tide', 'Eggplant Court', 'Grape Net', 'Bomb Foundry', 'Annihilation',
    ],
  },
  // Phase 22 — Harvest theme. Animated bot roster (kiwi, pineapple,
  // lemon, peach + animated orange/strawberry/grape) extracted from
  // the user's char1-char7 sheets. Six rooms while the level set
  // grows; names match LEVELS[40..45] in FrostFightGame.jsx.
  harvest: {
    id: 'harvest',
    label: 'Harvest',
    tagline: 'Animated orchard. Every bot reads its mood on its face. 20 rooms.',
    levels: [
      'Orchard Path', 'Citrus Lane', 'Berry Mix',
      'Sour Yard', 'Full Bloom', 'Harvest Storm',
      'Heartwood', 'Bramble', 'Sunset Grove',
      'Old Crusher', 'Witchhazel', 'Last Harvest',
      'Cidery', 'Quince Walk', 'Berry Cellar', 'Rotwood',
      'Ember Field', 'Thicket', 'Mossfall', 'Final Bloom',
    ],
  },
  // Phase 22f — Trinkets era: candles + teapots + lamps + chests.
  trinkets: {
    id: 'trinkets',
    label: 'Trinkets',
    tagline: 'Mantelpiece to vault — twenty rooms of magical objects.',
    levels: [
      'Mantelpiece', 'Tea Time', 'Genie Hall', 'Treasure Vault',
      'Hearthstone', 'Tin Drum', 'Tea Service', 'Brass Bell',
      'Spice Rack', 'Wax Hall', 'Lampblack', 'Carafe',
      'Gilded Mirror', 'Music Box', 'Hourglass', 'Iron Cross',
      'Ash Cellar', 'Crystal Chest', 'Bell Tower', 'Vault Final',
    ],
  },
};
const THEME_ORDER = ['cold', 'orchard', 'harvest', 'trinkets'];

export default function FrostFightSetup({
  difficulty, onDifficultyChange,
  theme, onThemeChange,
  startLevel, onStartLevelChange,
  skin, onSkinChange,
}) {
  // Hydrate persisted picks once on mount so the parent state matches LS.
  // Phase 22b — semantic of 'easy' changed (lives → in-place respawn);
  // any stale 'easy' carried over from prior sessions silently rolls
  // to 'normal' so the lobby always opens on the new default. Players
  // who actually want Easy can re-pick — that's a one-click fix.
  useEffect(() => {
    let persistedDiff = readDifficulty('normal');
    if (persistedDiff === 'easy') {
      writeDifficulty('normal');
      persistedDiff = 'normal';
    }
    if (persistedDiff !== difficulty) onDifficultyChange(persistedDiff);
    const persistedTheme = readTheme('cold');
    if (persistedTheme !== theme) onThemeChange(persistedTheme);
    if (onSkinChange) {
      const persistedSkin = readSkin('default');
      if (persistedSkin !== skin) onSkinChange(persistedSkin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickSkin = (id) => {
    if (!onSkinChange) return;
    onSkinChange(id);
    writeSkin(id);
  };

  const onPickDifficulty = (id) => {
    onDifficultyChange(id);
    writeDifficulty(id);
  };
  const onPickTheme = (id) => {
    onThemeChange(id);
    writeTheme(id);
    // Switching theme resets the start-level pick — picking room 7 in
    // Cold doesn't translate to room 7 in Orchard.
    onStartLevelChange(0);
  };

  const [guideOpen, setGuideOpen] = useState(false);
  const [progressTick, setProgressTick] = useState(0);
  const progress = useMemo(() => readProgress(), [progressTick]);
  const themeDef = THEME_DEFS[theme] || THEME_DEFS.cold;
  const levelNames = themeDef.levels;
  const [levelsOpen, setLevelsOpen] = useState(false);
  // Phase 20 — the admin unlock-all toggle moved to the home Settings
  // drawer (gated by a server-verified password). The lobby still
  // respects the resulting sessionStorage flag, but doesn't show or
  // toggle it. Shift-click on a locked room remains a one-off bypass.
  const [adminAll, setAdminAll] = useState(() => {
    try { return sessionStorage.getItem('pgplay-ff-admin-all') === '1'; }
    catch { return false; }
  });
  // Re-read the flag whenever the lobby panel mounts (e.g. after the
  // user toggled it in Settings and came back here). Cheap one-shot.
  useEffect(() => {
    try { setAdminAll(sessionStorage.getItem('pgplay-ff-admin-all') === '1'); }
    catch { /* ignore */ }
  }, []);

  const onPickLevel = (idx, shiftBypass = false) => {
    if (!shiftBypass && !adminAll && !isRoomUnlocked(idx, levelNames)) return;
    onStartLevelChange(idx);
    setLevelsOpen(false);
    // Re-read progress in case the player just cleared something elsewhere.
    setProgressTick((t) => t + 1);
  };

  return (
    <div className="ff-lobby-setup">
      <div className="ff-lobby-row">
        <span className="ff-lobby-label">Theme</span>
        <div className="ff-lobby-pills" role="radiogroup" aria-label="Theme">
          {THEME_ORDER.map((id) => {
            const def = THEME_DEFS[id];
            const active = theme === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={'ff-lobby-pill' + (active ? ' is-active' : '')}
                onClick={() => onPickTheme(id)}
                title={def.tagline}>
                <b>{def.label}</b>
                <span>{def.levels.length} rooms</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="ff-lobby-row">
        <span className="ff-lobby-label">Skin</span>
        <div className="ff-lobby-pills" role="radiogroup" aria-label="Player skin">
          {SKIN_ORDER.map((id) => {
            const def = SKIN_DEFS[id];
            const active = skin === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={'ff-lobby-pill' + (active ? ' is-active' : '')}
                onClick={() => onPickSkin(id)}
                title={`${def.label} — ${def.blurb}`}>
                <b>{def.label}</b>
                <span>{def.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="ff-lobby-row">
        <span className="ff-lobby-label">Difficulty</span>
        <div className="ff-lobby-pills" role="radiogroup" aria-label="Difficulty">
          {DIFF_ORDER.map((id) => {
            const def = DIFFICULTIES[id];
            const active = difficulty === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={'ff-lobby-pill' + (active ? ' is-active' : '')}
                onClick={() => onPickDifficulty(id)}
                title={`${def.label} — ${def.blurb}`}>
                <b>{def.label}</b>
                <span>{def.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase 22g — guide button. Single trigger that opens a modal
          with both pickup buffs + bot superpowers. Inline legend
          surface was too noisy; popup keeps the lobby clean. */}
      <div className="ff-lobby-row">
        <span className="ff-lobby-label">Guide</span>
        <button
          type="button"
          className="ff-lobby-level-toggle"
          onClick={() => setGuideOpen(true)}
          aria-haspopup="dialog">
          What does each fruit and bot do?
        </button>
      </div>

      {guideOpen && <FrostFightGuideModal onClose={() => setGuideOpen(false)}/>}

      <div className="ff-lobby-row">
        <span className="ff-lobby-label">Start at</span>
        <div className="ff-lobby-levels">
          <button
            type="button"
            className={'ff-lobby-level-btn' + (startLevel === 0 ? ' is-active' : '')}
            onClick={() => onStartLevelChange(0)}>
            Room 1
          </button>
          {startLevel > 0 && (
            <span className="ff-lobby-level-current">
              · current pick: <b>Room {startLevel + 1} — {levelNames[startLevel]}</b>
            </span>
          )}
          <button
            type="button"
            className="ff-lobby-level-toggle"
            onClick={() => setLevelsOpen((o) => !o)}
            aria-expanded={levelsOpen}>
            {levelsOpen ? 'Hide rooms' : 'Pick a cleared room'}
          </button>
        </div>
      </div>

      {levelsOpen && (
        <div className="ff-lobby-grid" role="list">
          {levelNames.map((name, idx) => {
            const cleared = !!progress.cleared[name];
            const unlocked = adminAll || isRoomUnlocked(idx, levelNames);
            const active = idx === startLevel;
            const onClick = (e) => {
              // Shift-click bypasses the gate for a single click — a
              // one-off dev shortcut. The persistent unlock-all flag
              // lives in Settings → Admin (password-gated).
              const shift = e.shiftKey;
              if (unlocked || shift) onPickLevel(idx, shift);
            };
            return (
              <button
                key={name}
                type="button"
                role="listitem"
                className={
                  'ff-lobby-room'
                  + (active ? ' is-active' : '')
                  + (cleared ? ' is-cleared' : '')
                  + (!unlocked ? ' is-locked' : '')
                }
                disabled={!unlocked}
                onClick={onClick}
                title={unlocked
                  ? name
                  : 'Clear the previous room to unlock — Shift-click to bypass'}>
                <span className="ff-lobby-room-idx">{idx + 1}</span>
                <span className="ff-lobby-room-name">{name}</span>
                {cleared && <span className="ff-lobby-room-tag">cleared</span>}
                {!unlocked && <span className="ff-lobby-room-tag is-locked">locked</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
