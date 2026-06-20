import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database } from 'lucide-react';
import './DigitDPViz.css';

// Digit DP — count integers in [0, N] with NO two equal adjacent digits.
// We walk the decimal digits of N left to right. State = (pos, tight, prev).
//   pos   : which digit position we're choosing (0 = most significant).
//   tight : is the prefix so far exactly equal to N's prefix? If so, the next
//           digit is capped at N[pos]; otherwise it ranges 0..9.
//   prev  : the previous digit placed (-1 before any nonzero digit), so we can
//           reject d === prev (the adjacency constraint).
//   started : have we placed a leading nonzero digit yet (skip leading zeros).
// Only (pos, prev) free states (tight=false, started=true) are memoized — the
// tight path is unique and never repeats, so caching it would be wrong.

const PRESETS = ['355', '1234', '2024'];

function buildFrames(nStr) {
  const digits = nStr.split('').map(Number);
  const L = digits.length;
  const frames = [];
  // memo[pos][prev+1] for free states; store value once computed.
  const memo = Array.from({ length: L }, () => new Array(11).fill(null));
  let memoHits = 0;
  let total = 0;

  frames.push({
    phase: 'init',
    pos: -1,
    tight: true,
    prev: -1,
    started: false,
    hi: null,
    digit: null,
    pathDigits: [],
    total: 0,
    memoHits: 0,
    memoStore: null,
    memoHit: null,
    note:
      `Goal: count integers in [0, ${nStr}] with no two equal adjacent digits. ` +
      `Walk the ${L} digits left to right, tracking tight (prefix capped by N) and prev (last digit placed).`,
  });

  // path holds the digits chosen on the way down for display.
  const path = [];

  function rec(pos, tight, prev, started) {
    if (pos === L) {
      total += 1;
      frames.push({
        phase: 'leaf',
        pos,
        tight,
        prev,
        started,
        hi: null,
        digit: null,
        pathDigits: [...path],
        total,
        memoHits,
        memoStore: null,
        memoHit: null,
        note:
          `Reached the end: the number ${started ? path.join('') : '0'} is valid (no equal neighbours). ` +
          `count is now ${total}.`,
      });
      return 1;
    }

    const free = !tight && started;
    if (free && memo[pos][prev + 1] !== null) {
      memoHits += 1;
      const cached = memo[pos][prev + 1];
      total += cached;
      frames.push({
        phase: 'memo-hit',
        pos,
        tight,
        prev,
        started,
        hi: null,
        digit: null,
        pathDigits: [...path],
        total,
        memoHits,
        memoStore: null,
        memoHit: { pos, prev },
        note:
          `State (pos ${pos}, tight=false, prev=${prev < 0 ? '-' : prev}) was solved before -> reuse memo = ${cached}. ` +
          `Skip the whole subtree, adding ${cached} valid numbers -> count is now ${total}. memo hits = ${memoHits}.`,
      });
      return cached;
    }

    const hi = tight ? digits[pos] : 9;
    frames.push({
      phase: 'enter',
      pos,
      tight,
      prev,
      started,
      hi,
      digit: null,
      pathDigits: [...path],
      total,
      memoHits,
      memoStore: null,
      memoHit: null,
      note: tight
        ? `pos ${pos}, tight=true: prefix still equals N, so the next digit can only be 0..${hi} (N[${pos}] = ${digits[pos]}).`
        : `pos ${pos}, tight=false: prefix is already below N, so the next digit is free, 0..9.`,
    });

    let sub = 0;
    for (let d = 0; d <= hi; d++) {
      const nowStarted = started || d !== 0;
      const blocked = nowStarted && started && d === prev;
      path.push(d);
      frames.push({
        phase: blocked ? 'reject' : 'choose',
        pos,
        tight,
        prev,
        started,
        hi,
        digit: d,
        pathDigits: [...path],
        total,
        memoHits,
        memoStore: null,
        memoHit: null,
        note: blocked
          ? `Try digit ${d} at pos ${pos}: equals prev (${prev}) -> adjacent duplicate, reject this branch.`
          : `Try digit ${d} at pos ${pos}: ok (prev = ${prev < 0 ? 'none' : prev}). ` +
            `tight stays ${tight && d === hi ? 'true' : 'false'} ` +
            `(d ${d === hi ? '=' : '<'} cap ${hi}). Recurse to pos ${pos + 1}.`,
      });
      if (!blocked) {
        sub += rec(pos + 1, tight && d === hi, d, nowStarted);
      }
      path.pop();
    }

    if (free) {
      memo[pos][prev + 1] = sub;
      frames.push({
        phase: 'memo-store',
        pos,
        tight,
        prev,
        started,
        hi,
        digit: null,
        pathDigits: [...path],
        total,
        memoHits,
        memoStore: { pos, prev, value: sub },
        memoHit: null,
        note:
          `Done with free state (pos ${pos}, prev=${prev < 0 ? '-' : prev}): subtree count = ${sub}. ` +
          `Store it so any later identical state is O(1).`,
      });
    }
    return sub;
  }

  rec(0, true, -1, false);

  frames.push({
    phase: 'done',
    pos: -1,
    tight: false,
    prev: -1,
    started: false,
    hi: null,
    digit: null,
    pathDigits: [],
    total,
    memoHits,
    memoStore: null,
    memoHit: null,
    note:
      `Final answer: ${total} integers in [0, ${nStr}] have no two equal adjacent digits. ` +
      `Memo reused ${memoHits} subtree${memoHits === 1 ? '' : 's'} — this is why digit DP is fast, not exponential.`,
  });

  return { frames, L, digits };
}

export default function DigitDPViz() {
  const [nStr, setNStr] = useState('355');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, L, digits } = useMemo(() => buildFrames(nStr), [nStr]);
  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const pickPreset = (p) => {
    setIsRunningRaw(false);
    setStep(0);
    setNStr(p);
  };

  // ---- geometry ----
  const W = 940;
  const H = 430;

  // Digit cells of N across the top.
  const cellW = 56;
  const cellGap = 10;
  const cellsTotalW = L * cellW + (L - 1) * cellGap;
  const cellsX0 = (W - cellsTotalW) / 2;
  const cellsY = 70;
  const cellH = 56;
  const cellX = (i) => cellsX0 + i * (cellW + cellGap);

  // Memo grid: rows = pos (0..L-1), cols = prev (-1..9) -> 11 cols.
  const gridTop = 210;
  const gridLabelW = 64;
  const memoCols = 11;
  const gridColW = Math.min(58, (W - gridLabelW - 40) / memoCols);
  const gridRowH = Math.min(34, (H - gridTop - 30) / Math.max(L, 1));
  const memoGridW = gridLabelW + memoCols * gridColW;
  const gridX0 = (W - memoGridW) / 2;
  const memoColX = (c) => gridX0 + gridLabelW + c * gridColW;
  const memoRowY = (r) => gridTop + r * gridRowH;

  // Reconstruct the memo state for grid rendering from the frame stream:
  // replay store/hit markers up to safeStep is overkill; instead mark only the
  // active store/hit cell. Filled cells are tracked by scanning prior frames.
  const filled = new Set();
  for (let k = 0; k <= safeStep; k++) {
    const f = frames[k];
    if (f.memoStore) filled.add(`${f.memoStore.pos}-${f.memoStore.prev + 1}`);
  }

  const pathDigits = current.pathDigits || [];

  return (
    <div className="ddp">
      <div className="ddp-head">
        <h3 className="ddp-title">Digit DP — count integers in [0, N] with no equal adjacent digits</h3>
        <p className="ddp-sub">
          Build the number digit by digit. The <strong>tight</strong> flag says whether the prefix still
          equals N&apos;s prefix (so the next digit is capped at N[pos]); once a smaller digit is chosen it
          drops to false and every later position runs 0..9. Free states are memoized on (pos, prev).
        </p>
      </div>

      <div className="ddp-controls">
        <div className="ddp-buttons">
          <button
            type="button"
            className="ddp-btn ddp-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="ddp-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="ddp-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ddp-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="ddp-presets">
          <span className="ddp-presets-label">N =</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`ddp-preset ${p === nStr ? 'ddp-preset-active' : ''}`}
              onClick={() => pickPreset(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <label className="ddp-speed">
          <span className="ddp-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ddp-speed-range"
          />
          <span className="ddp-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="ddp-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="ddp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ddp-svg" preserveAspectRatio="xMidYMid meet">
          {/* ---- digit cells of N ---- */}
          <text x={cellsX0} y={cellsY - 16} className="ddp-panel-label">
            digits of N — pointer at the current position
          </text>
          {digits.map((d, i) => {
            const isCur = i === current.pos;
            const isPast = current.pos >= 0 ? i < current.pos : current.phase === 'done';
            const chosen = pathDigits[i];
            let fill = 'var(--bg)';
            let stroke = 'var(--border)';
            if (isCur) {
              fill = 'var(--accent)';
              stroke = 'var(--accent)';
            } else if (isPast) {
              fill = 'rgba(var(--accent-rgb), 0.16)';
              stroke = 'rgba(var(--accent-rgb), 0.45)';
            }
            const digitFill = isCur ? 'var(--bg)' : 'var(--text-main)';
            return (
              <g key={`dc-${i}`}>
                <rect
                  x={cellX(i)}
                  y={cellsY}
                  width={cellW}
                  height={cellH}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isCur ? 3 : 1.4}
                />
                <text x={cellX(i) + cellW / 2} y={cellsY + 36} className="ddp-digit" style={{ fill: digitFill }}>
                  {d}
                </text>
                <text x={cellX(i) + cellW / 2} y={cellsY - 4} className="ddp-pos-label">
                  pos {i}
                </text>
                {/* chosen digit on the current partial number */}
                {chosen != null && (
                  <text
                    x={cellX(i) + cellW / 2}
                    y={cellsY + cellH + 18}
                    className="ddp-chosen"
                    style={{ fill: i === current.pos && current.digit != null ? 'var(--hue-sky)' : 'var(--hue-mint)' }}
                  >
                    {chosen}
                  </text>
                )}
              </g>
            );
          })}
          <text x={cellsX0} y={cellsY + cellH + 18} className="ddp-built-label">
            built:
          </text>

          {/* ---- tight indicator band ---- */}
          {current.pos >= 0 && current.pos < L && (
            <g>
              <rect
                x={cellX(current.pos) - 4}
                y={cellsY + cellH + 30}
                width={cellW + 8}
                height={26}
                rx={6}
                fill={current.tight ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--surface)'}
                stroke={current.tight ? 'var(--accent)' : 'var(--hue-mint)'}
                strokeWidth={1.4}
              />
              <text
                x={cellX(current.pos) + cellW / 2}
                y={cellsY + cellH + 47}
                className="ddp-tight-tag"
                style={{ fill: current.tight ? 'var(--accent)' : 'var(--hue-mint)' }}
              >
                {current.tight ? `tight d 0..${current.hi}` : 'free 0..9'}
              </text>
            </g>
          )}

          {/* ---- memo grid ---- */}
          <text x={gridX0} y={gridTop - 14} className="ddp-panel-label">
            memo[pos][prev] — free states only (tight=false). Stored once, reused on revisit.
          </text>
          {/* column headers: prev = -1 (none), 0..9 */}
          {Array.from({ length: memoCols }).map((_, c) => {
            const prevVal = c - 1;
            return (
              <text key={`mh-${c}`} x={memoColX(c) + gridColW / 2} y={gridTop - 1} className="ddp-grid-colh">
                {prevVal < 0 ? '·' : prevVal}
              </text>
            );
          })}
          <text x={gridX0 + 2} y={gridTop - 1} className="ddp-grid-corner">
            prev→
          </text>
          {Array.from({ length: L }).map((_, r) => (
            <g key={`mr-${r}`}>
              <text x={gridX0 + 2} y={memoRowY(r) + gridRowH / 2 + 4} className="ddp-grid-rowlabel">
                pos {r}
              </text>
              {Array.from({ length: memoCols }).map((_, c) => {
                const prevVal = c - 1;
                const isFilled = filled.has(`${r}-${c}`);
                const isStore = current.memoStore && current.memoStore.pos === r && current.memoStore.prev === prevVal;
                const isHit = current.memoHit && current.memoHit.pos === r && current.memoHit.prev === prevVal;
                let fill = 'var(--bg)';
                let stroke = 'var(--border)';
                if (isHit) {
                  fill = 'var(--hue-pink)';
                  stroke = 'var(--hue-pink)';
                } else if (isStore) {
                  fill = 'var(--hue-sky)';
                  stroke = 'var(--hue-sky)';
                } else if (isFilled) {
                  fill = 'rgba(var(--accent-rgb), 0.16)';
                  stroke = 'rgba(var(--accent-rgb), 0.4)';
                }
                return (
                  <rect
                    key={`mc-${r}-${c}`}
                    x={memoColX(c) + 1}
                    y={memoRowY(r) + 1}
                    width={gridColW - 2}
                    height={gridRowH - 2}
                    rx={4}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isStore || isHit ? 2 : 0.8}
                  />
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      <div className="ddp-metrics">
        <div className="ddp-metric">
          <span className="ddp-metric-label">position</span>
          <span className="ddp-metric-value">
            {current.pos < 0 ? '—' : current.pos >= L ? 'end' : current.pos}
          </span>
        </div>
        <div className="ddp-metric">
          <span className="ddp-metric-label">tight</span>
          <span
            className="ddp-metric-value"
            style={{ color: current.tight ? 'var(--accent)' : 'var(--hue-mint)' }}
          >
            {current.pos < 0 ? '—' : String(current.tight)}
          </span>
        </div>
        <div className="ddp-metric">
          <span className="ddp-metric-label">prev digit</span>
          <span className="ddp-metric-value">{current.prev < 0 ? 'none' : current.prev}</span>
        </div>
        <div className="ddp-metric">
          <span className="ddp-metric-label">trying digit</span>
          <span className="ddp-metric-value" style={{ color: 'var(--hue-sky)' }}>
            {current.digit == null ? '—' : current.digit}
          </span>
        </div>
        <div className="ddp-metric ddp-metric-count">
          <span className="ddp-metric-label">count so far</span>
          <span className="ddp-metric-value">{current.total}</span>
        </div>
        <div className="ddp-metric ddp-metric-memo">
          <span className="ddp-metric-label">
            <Database size={11} /> memo hits
          </span>
          <span className="ddp-metric-value">{current.memoHits}</span>
        </div>
      </div>

      <div className="ddp-arith">
        <span className="ddp-arith-label">trace</span>
        <span className="ddp-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
