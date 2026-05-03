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
  readProgress, isRoomUnlocked,
} from '../games/frost-fight/utils/progress.js';

// Phase 19 — difficulty pill copy. Keep in sync with DIFFICULTIES in
// FrostFightGame.jsx; the duplication is so the lobby doesn't pull in
// the whole game module just to render five pills. Lives counts here
// are formulas applied per theme length L (15 for both shipped themes).
const DIFFICULTIES = {
  easy:   { id: 'easy',   label: 'Easy',   livesText: '∞ lives',          iceMul: 1,   blurb: 'Full respawn allowed.' },
  normal: { id: 'normal', label: 'Normal', livesText: '2L lives (≈ 40)',  iceMul: 1,   blurb: 'Two lives per level.' },
  hard:   { id: 'hard',   label: 'Hard',   livesText: '~4L/3 (≈ 27)',     iceMul: 1.2, blurb: 'Tighter pool, faster ice.' },
  expert: { id: 'expert', label: 'Expert', livesText: '~2L/3 (≈ 13)',     iceMul: 1.5, blurb: 'Tight margin.' },
  insane: { id: 'insane', label: 'Insane', livesText: 'No respawn',       iceMul: 2,   blurb: 'One hit ends the run.' },
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
};
const THEME_ORDER = ['cold', 'orchard'];

export default function FrostFightSetup({
  difficulty, onDifficultyChange,
  theme, onThemeChange,
  startLevel, onStartLevelChange,
}) {
  // Hydrate persisted picks once on mount so the parent state matches LS.
  useEffect(() => {
    const persistedDiff = readDifficulty('normal');
    if (persistedDiff !== difficulty) onDifficultyChange(persistedDiff);
    const persistedTheme = readTheme('cold');
    if (persistedTheme !== theme) onThemeChange(persistedTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <span className="ff-lobby-label">Difficulty</span>
        <div className="ff-lobby-pills" role="radiogroup" aria-label="Difficulty">
          {DIFF_ORDER.map((id) => {
            const def = DIFFICULTIES[id];
            const active = difficulty === id;
            const ice = def.iceMul > 1 ? ` · ${def.iceMul}× ice` : '';
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={'ff-lobby-pill' + (active ? ' is-active' : '')}
                onClick={() => onPickDifficulty(id)}
                title={`${def.label} — ${def.livesText}${ice} · ${def.blurb}`}>
                <b>{def.label}</b>
                <span>{def.livesText}{ice}</span>
              </button>
            );
          })}
        </div>
      </div>

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
