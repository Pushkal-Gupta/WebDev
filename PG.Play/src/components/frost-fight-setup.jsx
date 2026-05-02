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

// Difficulty config — duplicated from FrostFightGame.jsx so the lobby
// doesn't have to load the whole game module to render the pills.
// Keep in sync with DIFFICULTIES in FrostFightGame.jsx.
const DIFFICULTIES = {
  easy:   { id: 'easy',   label: 'Easy',   lives: 5, iceMul: 1 },
  normal: { id: 'normal', label: 'Normal', lives: 3, iceMul: 1 },
  hard:   { id: 'hard',   label: 'Hard',   lives: 2, iceMul: 1 },
  expert: { id: 'expert', label: 'Expert', lives: 1, iceMul: 1 },
  insane: { id: 'insane', label: 'Insane', lives: 0, iceMul: 2 },
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
    tagline: 'Frozen pantry, fridge, and the deep cold beyond. 15 rooms.',
    levels: [
      'Pantry', 'Cold Room', 'The Aisle', 'Walk-In', 'Loading Dock',
      'Sub-Basement', 'Cold Storage', 'Conveyor Maze', 'The Vault', 'Frostbite',
      'Frostlock', 'Slush Maze', 'Ice Run', 'Frostfall', 'Glacier',
    ],
  },
  orchard: {
    id: 'orchard',
    label: 'Orchard',
    tagline: 'Crystal cave, citrus yard, vineyard, final storm. 15 rooms.',
    levels: [
      'Crystal Cave', 'Crystal Tunnel', 'Geode Hall',
      'Citrus Yard', 'Lemon Grove', 'Sour Press',
      'Vineyard', 'Cellar', 'Crusher',
      'Frost Gate', 'Storm Hall', 'Final Vortex',
      'Bare Vault', 'Teleport Hall', 'Vortex Crown',
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
  // Admin unlock-all (session-scoped). Shift-click on a locked room
  // also bypasses the gate for that single click without flipping the
  // session flag — handy for one-off testing.
  const [adminAll, setAdminAll] = useState(() => {
    try { return sessionStorage.getItem('pgplay-ff-admin-all') === '1'; }
    catch { return false; }
  });
  const toggleAdminAll = () => {
    setAdminAll((v) => {
      const next = !v;
      try {
        if (next) sessionStorage.setItem('pgplay-ff-admin-all', '1');
        else sessionStorage.removeItem('pgplay-ff-admin-all');
      } catch { /* ignore */ }
      return next;
    });
  };

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
            const livesText = def.lives === 0 ? '0 lives' : `${def.lives} ${def.lives === 1 ? 'life' : 'lives'}`;
            const ice = def.iceMul > 1 ? ` · ${def.iceMul}× ice` : '';
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                className={'ff-lobby-pill' + (active ? ' is-active' : '')}
                onClick={() => onPickDifficulty(id)}
                title={`${def.label} — ${livesText}${ice}`}>
                <b>{def.label}</b>
                <span>{livesText}{ice}</span>
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
        <>
          <div className="ff-lobby-grid" role="list">
            {levelNames.map((name, idx) => {
              const cleared = !!progress.cleared[name];
              const unlocked = adminAll || isRoomUnlocked(idx, levelNames);
              const active = idx === startLevel;
              const onClick = (e) => {
                // Shift-click bypasses the gate for a single click —
                // handy for testing without flipping the session flag.
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
          <div className="ff-lobby-admin-row">
            <button
              type="button"
              className={'ff-lobby-admin-link' + (adminAll ? ' is-active' : '')}
              onClick={toggleAdminAll}
              aria-pressed={adminAll}>
              {adminAll
                ? 'Admin: all rooms unlocked (this session) — click to disable'
                : 'Admin: unlock all rooms (this session)'}
            </button>
            <span className="ff-lobby-admin-hint">
              Shift-click a locked room to bypass once.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
