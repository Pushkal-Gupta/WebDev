import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './NQueensViz.css';

const MIN_N = 4;
const MAX_N = 8;
const STEP_MS = 520;

function buildSteps(n) {
  const steps = [];
  const cols = new Array(n).fill(-1);
  let solutionsFound = 0;

  const snapshot = ({
    kind,
    row,
    col,
    queens,
    caption,
    flashRow = null,
    flashCol = null,
  }) => {
    steps.push({
      kind,
      row,
      col,
      queens: queens.slice(),
      solutions: solutionsFound,
      caption,
      flashRow,
      flashCol,
    });
  };

  snapshot({
    kind: 'init',
    row: 0,
    col: -1,
    queens: cols,
    caption: `Start at row 0. Place queens one row at a time on an ${n}×${n} board.`,
  });

  const isSafe = (row, col) => {
    for (let r = 0; r < row; r += 1) {
      const c = cols[r];
      if (c === col) return false;
      if (Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
  };

  const solve = (row) => {
    if (row === n) {
      solutionsFound += 1;
      snapshot({
        kind: 'solution',
        row: row - 1,
        col: cols[row - 1],
        queens: cols,
        caption: `Solution #${solutionsFound} found. All ${n} queens placed safely.`,
      });
      return;
    }

    for (let col = 0; col < n; col += 1) {
      snapshot({
        kind: 'try',
        row,
        col,
        queens: cols,
        caption: `Row ${row}: try column ${col}.`,
      });

      if (!isSafe(row, col)) {
        snapshot({
          kind: 'conflict',
          row,
          col,
          queens: cols,
          caption: `Column ${col} conflicts with a placed queen — share a column or diagonal. Skip.`,
          flashRow: row,
          flashCol: col,
        });
        continue;
      }

      cols[row] = col;
      snapshot({
        kind: 'place',
        row,
        col,
        queens: cols,
        caption: `Place queen at (${row}, ${col}). Recurse into row ${row + 1}.`,
      });

      solve(row + 1);

      const removedCol = cols[row];
      cols[row] = -1;
      snapshot({
        kind: 'backtrack',
        row,
        col: removedCol,
        queens: cols,
        caption: `Backtrack: remove queen at (${row}, ${removedCol}). Try next column.`,
        flashRow: row,
        flashCol: removedCol,
      });
    }
  };

  solve(0);

  snapshot({
    kind: 'done',
    row: -1,
    col: -1,
    queens: new Array(n).fill(-1),
    caption: `Search complete. Found ${solutionsFound} solution${solutionsFound === 1 ? '' : 's'} for n = ${n}.`,
  });

  return steps;
}

function computeAttacks(queens, n) {
  const grid = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let r = 0; r < n; r += 1) {
    const c = queens[r];
    if (c < 0) continue;
    for (let i = 0; i < n; i += 1) {
      grid[r][i] = true;
      grid[i][c] = true;
    }
    for (let d = 1; d < n; d += 1) {
      if (r + d < n && c + d < n) grid[r + d][c + d] = true;
      if (r + d < n && c - d >= 0) grid[r + d][c - d] = true;
      if (r - d >= 0 && c + d < n) grid[r - d][c + d] = true;
      if (r - d >= 0 && c - d >= 0) grid[r - d][c - d] = true;
    }
  }
  return grid;
}

const BOARD_PX = 480;

export default function NQueensViz() {
  const [n, setN] = useState(5);
  const [steps, setSteps] = useState(() => buildSteps(5));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setSteps(buildSteps(n));
    setIdx(0);
    setPlaying(false);
  }, [n]);

  const step = steps[idx];

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= steps.length - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      next();
    }, STEP_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  useEffect(() => {
    if (idx >= steps.length - 1 && playing) setPlaying(false);
  }, [idx, steps.length, playing]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(0);
  };

  const atEnd = idx >= steps.length - 1;

  const attacks = useMemo(
    () => computeAttacks(step.queens, n),
    [step.queens, n],
  );

  const cellSize = BOARD_PX / n;
  const justPlaced = step.kind === 'place' ? { r: step.row, c: step.col } : null;
  const conflictCell = step.kind === 'conflict' ? { r: step.flashRow, c: step.flashCol } : null;
  const backtrackCell = step.kind === 'backtrack' ? { r: step.flashRow, c: step.flashCol } : null;
  const tryingCell = step.kind === 'try' ? { r: step.row, c: step.col } : null;

  return (
    <div className="nqviz">
      <div className="nqviz-header">
        <div className="nqviz-title">N-Queens backtracking</div>
        <div className="nqviz-size">
          <label htmlFor="nqviz-n">N</label>
          <input
            id="nqviz-n"
            type="range"
            min={MIN_N}
            max={MAX_N}
            step={1}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value, 10))}
          />
          <span className="nqviz-size-value">{n}</span>
        </div>
      </div>

      <div className="nqviz-legend">
        <span className="nqviz-legend-item">
          <span className="nqviz-swatch nqviz-swatch-light" /> light square
        </span>
        <span className="nqviz-legend-item">
          <span className="nqviz-swatch nqviz-swatch-dark" /> dark square
        </span>
        <span className="nqviz-legend-item">
          <span className="nqviz-swatch nqviz-swatch-attack" /> attacked
        </span>
        <span className="nqviz-legend-item">
          <span className="nqviz-swatch nqviz-swatch-try" /> trying
        </span>
        <span className="nqviz-legend-item">
          <span className="nqviz-swatch nqviz-swatch-queen" /> queen
        </span>
      </div>

      <div className="nqviz-stage">
        <svg
          className="nqviz-svg"
          viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`}
          role="img"
          aria-label={`N-Queens ${n} by ${n} board visualization`}
        >
          <g className="nqviz-cells">
            {Array.from({ length: n }).flatMap((_, r) =>
              Array.from({ length: n }).map((__, c) => {
                const isDark = (r + c) % 2 === 1;
                const x = c * cellSize;
                const y = r * cellSize;
                const attacked = attacks[r][c] && step.queens[r] !== c;
                const isTry = tryingCell && tryingCell.r === r && tryingCell.c === c;
                const isConflict = conflictCell && conflictCell.r === r && conflictCell.c === c;
                const isBacktrack = backtrackCell && backtrackCell.r === r && backtrackCell.c === c;
                let cellClass = `nqviz-cell ${isDark ? 'nqviz-cell-dark' : 'nqviz-cell-light'}`;
                if (attacked) cellClass += ' nqviz-cell-attacked';
                if (isTry) cellClass += ' nqviz-cell-try';
                if (isConflict) cellClass += ' nqviz-cell-conflict';
                if (isBacktrack) cellClass += ' nqviz-cell-backtrack';
                return (
                  <rect
                    key={`${r}-${c}`}
                    className={cellClass}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                  />
                );
              }),
            )}
          </g>

          <g className="nqviz-rowlabels">
            {Array.from({ length: n }).map((_, r) => (
              <text
                key={`rl-${r}`}
                className="nqviz-axis-text"
                x={6}
                y={r * cellSize + 14}
              >
                {r}
              </text>
            ))}
          </g>
          <g className="nqviz-collabels">
            {Array.from({ length: n }).map((_, c) => (
              <text
                key={`cl-${c}`}
                className="nqviz-axis-text"
                x={c * cellSize + cellSize - 14}
                y={BOARD_PX - 6}
                textAnchor="end"
              >
                {c}
              </text>
            ))}
          </g>

          <g className="nqviz-queens">
            {step.queens.map((c, r) => {
              if (c < 0) return null;
              const cx = c * cellSize + cellSize / 2;
              const cy = r * cellSize + cellSize / 2;
              const radius = cellSize * 0.32;
              const isJustPlaced = justPlaced && justPlaced.r === r && justPlaced.c === c;
              return (
                <g
                  key={`q-${r}`}
                  className={`nqviz-queen ${isJustPlaced ? 'nqviz-queen-just-placed' : ''}`}
                  transform={`translate(${cx},${cy})`}
                >
                  {isJustPlaced && (
                    <circle className="nqviz-queen-pulse" r={radius + 6} />
                  )}
                  <circle className="nqviz-queen-disc" r={radius} />
                  <text
                    className="nqviz-queen-label"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontSize: `${cellSize * 0.38}px` }}
                  >
                    Q
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="nqviz-status">
        <div className="nqviz-status-row">
          <span className="nqviz-status-label">Step</span>
          <span className="nqviz-status-value">{idx} / {steps.length - 1}</span>
        </div>
        <div className="nqviz-status-row">
          <span className="nqviz-status-label">Row</span>
          <span className="nqviz-status-value">
            {step.row >= 0 ? step.row : <span className="nqviz-muted">—</span>}
          </span>
        </div>
        <div className="nqviz-status-row">
          <span className="nqviz-status-label">Solutions</span>
          <span className="nqviz-status-value nqviz-status-solutions">{step.solutions}</span>
        </div>
      </div>

      <p className={`nqviz-caption nqviz-caption-${step.kind}`}>{step.caption}</p>

      <div className="nqviz-controls">
        <button
          type="button"
          className="nqviz-btn nqviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="nqviz-btn nqviz-btn-primary"
          onClick={() => {
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="nqviz-btn nqviz-btn-secondary"
          onClick={next}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
      </div>
    </div>
  );
}
