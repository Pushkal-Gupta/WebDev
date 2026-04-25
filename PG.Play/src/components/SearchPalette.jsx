// SearchPalette — full command-palette modal for PG.Play.
//
// Triggered from Home.jsx by the inline search button or by ⌘K / Ctrl-K.
// Owns search results entirely (Home no longer renders an inline result grid).
//
// Behaviour:
//   • Empty query           → "Recent" (if any), "Hot right now", "Popular searches"
//   • Query with matches    → ranked rows from fuzzyMatch (playable rank ×2)
//   • Query with 0 matches  → friendly headline + nearest-neighbour chips
//   • ↑/↓ moves a highlight, ↵ navigates, Esc closes, Tab is a no-op.
//
// Persistence: last 5 distinct queries → localStorage(`pgplay_recent_queries`).

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../data.js';
import { GAME_COVERS } from '../covers.jsx';
import { Icon } from '../icons.jsx';
import { rankGames, nearestNeighbours } from '../lib/fuzzyMatch.js';
import { sfx } from '../sound.js';

const HOT_IDS = ['grudgewood', 'goalbound', 'slither', 'slipshot'];
const POPULAR_QUERIES = ['io', 'fps', 'puzzle', 'sports', 'chaos'];
const RECENT_KEY = 'pgplay_recent_queries';
const RECENT_MAX = 5;

// Colour cue per category — keeps the palette feeling intentional even
// without the full cover art rendering at 32px.
const CAT_COLOR = {
  Arcade: '#ff5cb6',
  Puzzle: '#7bd3ff',
  FPS: '#ff7a59',
  Shooter: '#ff7a59',
  Rage: '#e0573f',
  Sports: '#5edc8b',
  Classic: '#c9b87a',
  'Co-op': '#b693ff',
  Stealth: '#7c8aa0',
  Strategy: '#f0c869',
  Platformer: '#56e0c8',
  'Time-mgmt': '#ffb15c',
  Action: '#ff8a4c',
  'Tower-Def': '#86c569',
  Physics: '#5db8ff',
  Multiplayer: '#a98bff',
};

function catColor(cat) {
  return CAT_COLOR[cat] || 'rgb(var(--accent-rgb))';
}

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecent(query) {
  const q = (query || '').trim();
  if (!q) return;
  try {
    const cur = loadRecent();
    const next = [q, ...cur.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function RowCover({ game }) {
  const Cover = GAME_COVERS[game.id];
  const tint = catColor(game.cat);
  return (
    <div className="search-row-cover" style={{ background: `radial-gradient(circle at 30% 30%, ${tint}, rgba(0,0,0,0.55))` }}>
      {Cover ? <Cover/> : null}
      <span className="search-row-cover-ring" aria-hidden="true"/>
    </div>
  );
}

export default function SearchPalette({ open, onClose, initialQuery = '' }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const rowRefs = useRef([]);

  const [q, setQ] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState(() => loadRecent());

  // Reset state when the palette opens (so re-opening starts fresh on a new query).
  useEffect(() => {
    if (open) {
      setQ(initialQuery || '');
      setActive(0);
      setRecent(loadRecent());
      // Defer focus until after animation frame so the input is mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
      // Lock body scroll behind the modal.
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open, initialQuery]);

  const playable = useMemo(() => GAMES.filter((g) => g.playable), []);
  const heroes = useMemo(
    () => HOT_IDS.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean),
    []
  );

  // Ranked results. Order matters for keyboard navigation indices.
  const results = useMemo(() => {
    const trimmed = q.trim();
    if (!trimmed) return [];
    return rankGames(GAMES, trimmed).slice(0, 12);
  }, [q]);

  const empty = q.trim().length === 0;
  const noMatch = !empty && results.length === 0;

  const neighbours = useMemo(
    () => (noMatch ? nearestNeighbours(GAMES, q, 3) : []),
    [noMatch, q]
  );

  // Keep highlight in range when result list size changes.
  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results.length, active]);

  const goPlay = useCallback(
    (game) => {
      if (!game) return;
      saveRecent(q);
      try { sfx.open?.(); } catch { /* sfx may not be ready */ }
      window.dispatchEvent(new CustomEvent('pgplay:open', { detail: { gameId: game.id } }));
      onClose?.();
      navigate(`/game/${game.id}`);
    },
    [navigate, onClose, q]
  );

  // Scroll active row into view on highlight change.
  useEffect(() => {
    if (!open || results.length === 0) return;
    const el = rowRefs.current[active];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [active, results, open]);

  // Keyboard handling — palette-scoped while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === 'Tab') {
        // Don't cycle focus into row buttons — keep input focused.
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (results.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => (a + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => (a - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const r = results[active];
        if (r) goPlay(r.game);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, results, active, goPlay]);

  if (!open) return null;

  // Motion presets respect reduced-motion.
  const cardInitial = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 };
  const cardAnim    = reduced ? { opacity: 1 } : { opacity: 1, scale: 1 };
  const cardExit    = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 };
  const transition  = reduced ? { duration: 0.05 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] };

  return (
    <AnimatePresence>
      <motion.div
        key="search-backdrop"
        className="search-palette-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0.05 : 0.16 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        role="presentation"
      >
        <motion.div
          key="search-card"
          className="search-palette-card glass-strong"
          role="dialog"
          aria-modal="true"
          aria-label="Search games"
          initial={cardInitial}
          animate={cardAnim}
          exit={cardExit}
          transition={transition}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="search-palette-input-wrap">
            <span className="search-palette-icon" aria-hidden="true">{Icon.search}</span>
            <input
              ref={inputRef}
              className="search-palette-input"
              type="text"
              spellCheck={false}
              autoComplete="off"
              placeholder="Type to search · ⌘K to open"
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              aria-label="Search games"
              aria-autocomplete="list"
              aria-controls="search-palette-list"
              aria-activedescendant={results[active] ? `search-row-${results[active].game.id}` : undefined}
            />
            {q && (
              <button
                type="button"
                className="search-palette-clear"
                onClick={() => { setQ(''); inputRef.current?.focus(); }}
                aria-label="Clear search"
              >
                {Icon.close}
              </button>
            )}
          </div>

          <div className="search-palette-body" ref={listRef}>
            {empty && (
              <EmptyState
                recent={recent}
                heroes={heroes}
                onPickQuery={(value) => { setQ(value); setActive(0); inputRef.current?.focus(); }}
                onPickGame={goPlay}
                onClearRecent={() => {
                  try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
                  setRecent([]);
                }}
              />
            )}

            {!empty && results.length > 0 && (
              <ul
                id="search-palette-list"
                className="search-palette-list"
                role="listbox"
                aria-label="Search results"
              >
                {results.map((r, i) => {
                  const g = r.game;
                  const isActive = i === active;
                  const stagger = reduced ? 0 : Math.min(0.16, i * 0.02);
                  return (
                    <motion.li
                      key={g.id}
                      ref={(el) => (rowRefs.current[i] = el)}
                      id={`search-row-${g.id}`}
                      role="option"
                      aria-selected={isActive}
                      className={'search-row glass' + (isActive ? ' is-active' : '')}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => goPlay(g)}
                      initial={reduced ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: stagger, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <RowCover game={g}/>
                      <div className="search-row-main">
                        <div className="search-row-title">{g.name}</div>
                        <div className="search-row-meta">
                          <span className="search-row-dot" style={{ background: catColor(g.cat) }} aria-hidden="true"/>
                          <span className="search-row-cat">{g.cat}</span>
                          <span className="search-row-sep" aria-hidden="true">·</span>
                          <span className="search-row-tagline">{g.tagline}</span>
                        </div>
                      </div>
                      <span className={'search-row-pill' + (g.playable ? ' is-playable' : '')}>
                        {g.playable ? 'Playable' : 'Coming soon'}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            )}

            {noMatch && (
              <ZeroResult
                query={q}
                neighbours={neighbours}
                onPickGame={goPlay}
                onPickQuery={(value) => { setQ(value); setActive(0); inputRef.current?.focus(); }}
              />
            )}
          </div>

          <div className="search-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> play</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function EmptyState({ recent, heroes, onPickQuery, onPickGame, onClearRecent }) {
  return (
    <div className="search-empty">
      {recent.length > 0 && (
        <section className="search-section">
          <div className="search-section-head">
            <span className="search-section-kicker">Recent</span>
            <button type="button" className="search-section-clear" onClick={onClearRecent}>
              Clear
            </button>
          </div>
          <div className="search-empty-suggestions">
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                className="search-chip"
                onClick={() => onPickQuery(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="search-section">
        <div className="search-section-head">
          <span className="search-section-kicker">Hot right now</span>
        </div>
        <ul className="search-palette-list" role="list">
          {heroes.map((g) => (
            <li
              key={g.id}
              className="search-row glass"
              role="button"
              tabIndex={-1}
              onClick={() => onPickGame(g)}
            >
              <RowCover game={g}/>
              <div className="search-row-main">
                <div className="search-row-title">{g.name}</div>
                <div className="search-row-meta">
                  <span className="search-row-dot" style={{ background: catColor(g.cat) }} aria-hidden="true"/>
                  <span className="search-row-cat">{g.cat}</span>
                  <span className="search-row-sep" aria-hidden="true">·</span>
                  <span className="search-row-tagline">{g.tagline}</span>
                </div>
              </div>
              <span className="search-row-pill is-playable">Playable</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="search-section">
        <div className="search-section-head">
          <span className="search-section-kicker">Popular searches</span>
        </div>
        <div className="search-empty-suggestions">
          {POPULAR_QUERIES.map((p) => (
            <button
              key={p}
              type="button"
              className="search-chip"
              onClick={() => onPickQuery(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ZeroResult({ query, neighbours, onPickGame, onPickQuery }) {
  return (
    <div className="search-zero">
      <div className="search-empty-headline">
        Nothing matches <code>{query}</code>
      </div>
      {neighbours.length > 0 && (
        <div className="search-empty-suggestions">
          {neighbours.map(({ game }) => (
            <button
              key={game.id}
              type="button"
              className="search-chip search-chip-rich"
              onClick={() => onPickGame(game)}
            >
              <span className="search-chip-dot" style={{ background: catColor(game.cat) }}/>
              {game.name}
            </button>
          ))}
        </div>
      )}
      <div className="search-zero-tip">
        Tip — try a category like <button type="button" className="search-link" onClick={() => onPickQuery('puzzle')}>puzzle</button>, or browse the originals.
      </div>
    </div>
  );
}
