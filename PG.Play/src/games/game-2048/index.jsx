import { useCallback, useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import Celebration from '../../components/Celebration.jsx';

const SIZE = 4;

const TILE_COLORS = {
  2:    { bg: '#eee4da', fg: '#776e65' },
  4:    { bg: '#ede0c8', fg: '#776e65' },
  8:    { bg: '#f2b179', fg: '#f9f6f2' },
  16:   { bg: '#f59563', fg: '#f9f6f2' },
  32:   { bg: '#f67c5f', fg: '#f9f6f2' },
  64:   { bg: '#f65e3b', fg: '#f9f6f2' },
  128:  { bg: '#edcf72', fg: '#f9f6f2' },
  256:  { bg: '#edcc61', fg: '#f9f6f2' },
  512:  { bg: '#edc850', fg: '#f9f6f2' },
  1024: { bg: '#edc53f', fg: '#f9f6f2' },
  2048: { bg: '#edc22e', fg: '#f9f6f2' },
  4096: { bg: '#3c3a32', fg: '#f9f6f2' },
  8192: { bg: '#3c3a32', fg: '#f9f6f2' },
  16384:{ bg: '#3c3a32', fg: '#f9f6f2' },
  32768:{ bg: '#3c3a32', fg: '#f9f6f2' },
  65536:{ bg: '#3c3a32', fg: '#f9f6f2' },
};

// Each entry is a milestone we celebrate the first time the player reaches it
// in a run. Intensity escalates so 4096 feels bigger than 2048, etc.
const TIERS = [
  { value: 2048,  intensity: 2, title: '2048!',
    sub: 'You merged the legend. Keep going — there\'s more.' },
  { value: 4096,  intensity: 3, title: '4096!',
    sub: 'Beyond legendary. The grid bows.' },
  { value: 8192,  intensity: 4, title: '8192!',
    sub: 'You shouldn\'t even be here. Push onward.' },
  { value: 16384, intensity: 5, title: '16,384!',
    sub: 'A digit you didn\'t need today.' },
  { value: 32768, intensity: 6, title: '32,768!',
    sub: 'This is statistically improbable.' },
  { value: 65536, intensity: 6, title: '65,536 — MAX TILE',
    sub: 'Nothing higher exists on a 4×4. Take a bow.' },
];

const empty = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const randomEmpty = (grid) => {
  const cells = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) cells.push([r, c]);
  return cells[Math.floor(Math.random() * cells.length)];
};

const addTile = (grid) => {
  const spot = randomEmpty(grid);
  if (!spot) return grid;
  const [r, c] = spot;
  const next = grid.map((row) => row.slice());
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
};

const newGame = () => addTile(addTile(empty()));

// Compact a line toward index 0: drop zeros, merge adjacent equal pairs once,
// pad zeros at the end. Caller flips the line for the opposite direction.
const compact = (line) => {
  const filtered = line.filter((v) => v !== 0);
  const out = [];
  let gained = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      out.push(merged);
      gained += merged;
      i++;
    } else {
      out.push(filtered[i]);
    }
  }
  while (out.length < SIZE) out.push(0);
  return { line: out, gained };
};

// Each direction is implemented directly so the mapping from key → motion is
// unambiguous. ArrowDown moves tiles toward the bottom row, ArrowUp toward the
// top, etc.
const moveLeft = (grid) => {
  let gained = 0;
  const out = grid.map((row) => {
    const { line, gained: g } = compact(row);
    gained += g;
    return line;
  });
  return { grid: out, gained };
};

const moveRight = (grid) => {
  let gained = 0;
  const out = grid.map((row) => {
    const reversed = row.slice().reverse();
    const { line, gained: g } = compact(reversed);
    gained += g;
    return line.reverse();
  });
  return { grid: out, gained };
};

const moveUp = (grid) => {
  let gained = 0;
  const out = empty();
  for (let c = 0; c < SIZE; c++) {
    const col = [];
    for (let r = 0; r < SIZE; r++) col.push(grid[r][c]);
    const { line, gained: g } = compact(col);
    gained += g;
    for (let r = 0; r < SIZE; r++) out[r][c] = line[r];
  }
  return { grid: out, gained };
};

const moveDown = (grid) => {
  let gained = 0;
  const out = empty();
  for (let c = 0; c < SIZE; c++) {
    const col = [];
    for (let r = SIZE - 1; r >= 0; r--) col.push(grid[r][c]);
    const { line, gained: g } = compact(col);
    gained += g;
    for (let r = 0; r < SIZE; r++) out[SIZE - 1 - r][c] = line[r];
  }
  return { grid: out, gained };
};

const equal = (a, b) => {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
};

const hasMoves = (grid) => {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (!grid[r][c]) return true;
    if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
    if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
  }
  return false;
};

const maxTile = (grid) => {
  let m = 0;
  for (const row of grid) for (const v of row) if (v > m) m = v;
  return m;
};

export default function Game2048() {
  const [grid, setGrid]                 = useState(newGame);
  // Score is the highest tile currently on the board — the merge target the
  // game is named for. Best tracks the largest tile the player has ever
  // reached (under a separate localStorage key from the old cumulative score).
  const score = maxTile(grid);
  const [best, setBest] = useState(() => Number(localStorage.getItem('pd-2048-best-tile') || 0));
  const [celebratedTiers, setCelebrated] = useState(() => new Set());
  const [celebrating, setCelebrating]   = useState(null);
  const over = !hasMoves(grid);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      localStorage.setItem('pd-2048-best-tile', String(score));
    }
  }, [score, best]);

  const submittedRef = useRef(0);

  const tryMove = useCallback((mover) => {
    if (over || celebrating) return;
    const { grid: moved } = mover(grid);
    if (equal(moved, grid)) return;
    const next = addTile(moved);
    setGrid(next);
    // First uncelebrated tier the player has now reached.
    const max = maxTile(next);
    for (const tier of TIERS) {
      if (max >= tier.value && !celebratedTiers.has(tier.value)) {
        setCelebrated((prev) => {
          const nx = new Set(prev);
          nx.add(tier.value);
          return nx;
        });
        setCelebrating(tier);
        break;
      }
    }
  }, [grid, over, celebrating, celebratedTiers]);

  // Submit on game over (once per run)
  useEffect(() => {
    if (over && score > 0 && submittedRef.current !== score) {
      submittedRef.current = score;
      submitScore('g2048', score);
    }
  }, [over, score]);

  // Keyboard — direct motion, no rotation tricks.
  useEffect(() => {
    const KEY_MAP = {
      ArrowLeft:  moveLeft,
      ArrowRight: moveRight,
      ArrowUp:    moveUp,
      ArrowDown:  moveDown,
      a: moveLeft,  A: moveLeft,
      d: moveRight, D: moveRight,
      w: moveUp,    W: moveUp,
      s: moveDown,  S: moveDown,
    };
    const onKey = (e) => {
      const fn = KEY_MAP[e.key];
      if (!fn) return;
      e.preventDefault();
      tryMove(fn);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove]);

  // Touch swipe
  const touchRef = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? moveRight : moveLeft);
    else tryMove(dy > 0 ? moveDown : moveUp);
  };

  const reset = () => {
    setGrid(newGame());
    setCelebrated(new Set());
    setCelebrating(null);
    submittedRef.current = 0;
  };

  return (
    <div className="g2048" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="g2048-bar">
        <div className="g2048-scores">
          <div className="g2048-score">
            <div className="g2048-score-label">Top tile</div>
            <div className="g2048-score-value">{score || 0}</div>
          </div>
          <div className="g2048-score">
            <div className="g2048-score-label">Best</div>
            <div className="g2048-score-value">{best || 0}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reset}>New game</button>
      </div>
      <div className="g2048-board">
        {grid.map((row, r) =>
          row.map((v, c) => {
            const color = TILE_COLORS[v];
            return (
              <div key={`${r}-${c}`}
                className={'g2048-tile' + (v ? ' is-filled' : '')}
                style={color ? { background: color.bg, color: color.fg } : undefined}>
                {v !== 0 && (
                  <span className={v >= 1000 ? 'is-small' : v >= 100 ? 'is-mid' : ''}>{v}</span>
                )}
              </div>
            );
          })
        )}
        {over && !celebrating && (
          <div className="g2048-overlay">
            <div className="g2048-overlay-title">Game over</div>
            <div className="g2048-overlay-sub">Highest tile reached: {score || 0}.</div>
            <div className="g2048-overlay-ctas">
              <button className="btn btn-primary" onClick={reset}>New game</button>
            </div>
          </div>
        )}
      </div>
      <div className="g2048-hint">Arrow keys / WASD · swipe on touch</div>
      {celebrating && (
        <Celebration
          intensity={celebrating.intensity}
          title={celebrating.title}
          subtitle={celebrating.sub}
          ctaLabel="Keep playing"
          onDismiss={() => setCelebrating(null)}
        />
      )}
    </div>
  );
}
