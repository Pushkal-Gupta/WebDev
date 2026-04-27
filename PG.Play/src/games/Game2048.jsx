import { useCallback, useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';

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
};

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

// Slide + merge a single row to the left. Returns { row, gained }.
const slideRow = (row) => {
  const filtered = row.filter((v) => v !== 0);
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
  return { row: out, gained };
};

const rotate = (grid) => {
  // 90° clockwise
  const out = empty();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) out[c][SIZE - 1 - r] = grid[r][c];
  return out;
};

const move = (grid, dir) => {
  // dir: 0=left, 1=up, 2=right, 3=down. Normalize to "left" by rotating.
  let g = grid;
  for (let i = 0; i < dir; i++) g = rotate(g);
  let totalGained = 0;
  g = g.map((row) => {
    const { row: next, gained } = slideRow(row);
    totalGained += gained;
    return next;
  });
  for (let i = 0; i < (4 - dir) % 4; i++) g = rotate(g);
  return { grid: g, gained: totalGained };
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

const hasTile = (grid, v) => grid.some((row) => row.some((x) => x === v));

export default function Game2048() {
  const [grid, setGrid] = useState(newGame);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('pd-2048-best') || 0));
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const over = !hasMoves(grid);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      localStorage.setItem('pd-2048-best', String(score));
    }
  }, [score, best]);

  const submittedRef = useRef(0);

  const tryMove = useCallback((dir) => {
    if (over || (won && !keepPlaying)) return;
    const { grid: moved, gained } = move(grid, dir);
    if (equal(moved, grid)) return;
    const next = addTile(moved);
    setGrid(next);
    setScore((s) => s + gained);
    if (!won && hasTile(next, 2048)) setWon(true);
  }, [grid, over, won, keepPlaying]);

  // Submit on game over (once per run)
  useEffect(() => {
    if (over && score > 0 && submittedRef.current !== score) {
      submittedRef.current = score;
      submitScore('g2048', score);
    }
  }, [over, score]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      // dir codes: 0=left, 1=down, 2=right, 3=up. The rotate() helper is
      // CW, so a single rotation+slide-left+unrotate moves tiles DOWN
      // (not up). The keymap reflects that — earlier versions had up/down
      // inverted because the comment in move() lied.
      const dir = { ArrowLeft: 0, ArrowUp: 3, ArrowRight: 2, ArrowDown: 1,
                    a: 0, w: 3, d: 2, s: 1, A: 0, W: 3, D: 2, S: 1 }[e.key];
      if (dir === undefined) return;
      e.preventDefault();
      tryMove(dir);
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
    if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 2 : 0);
    else tryMove(dy > 0 ? 1 : 3);
  };

  const reset = () => {
    setGrid(newGame());
    setScore(0);
    setWon(false);
    setKeepPlaying(false);
    submittedRef.current = 0;
  };

  return (
    <div className="g2048" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="g2048-bar">
        <div className="g2048-scores">
          <div className="g2048-score">
            <div className="g2048-score-label">Score</div>
            <div className="g2048-score-value">{score}</div>
          </div>
          <div className="g2048-score">
            <div className="g2048-score-label">Best</div>
            <div className="g2048-score-value">{best}</div>
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
        {(over || (won && !keepPlaying)) && (
          <div className="g2048-overlay">
            <div className="g2048-overlay-title">{won && !over ? 'You win!' : 'Game over'}</div>
            <div className="g2048-overlay-sub">
              {won && !over ? `You reached 2048 with ${score} points.` : `Final score ${score}.`}
            </div>
            <div className="g2048-overlay-ctas">
              {won && !over && (
                <button className="btn btn-ghost" onClick={() => setKeepPlaying(true)}>Keep playing</button>
              )}
              <button className="btn btn-primary" onClick={reset}>New game</button>
            </div>
          </div>
        )}
      </div>
      <div className="g2048-hint">Arrow keys / WASD · swipe on touch</div>
    </div>
  );
}
