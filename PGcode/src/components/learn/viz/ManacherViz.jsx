import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ManacherViz.css';

const DEFAULT_STRING = 'babad';
const TICK_MS = 850;
const MAX_LEN = 18;

const CELL_W = 34;
const CELL_GAP = 4;
const PAD_X = 36;
const PAD_TOP = 110;
const STRING_ROW_H = 44;
const BAR_AREA_H = 92;
const BAR_GAP = 14;
const PAD_BOTTOM = 110;

function sanitizeInput(raw) {
  if (!raw) return '';
  return raw.replace(/\s+/g, '').slice(0, MAX_LEN);
}

function transformString(s) {
  if (!s) return '#';
  let out = '#';
  for (let i = 0; i < s.length; i += 1) {
    out += s[i];
    out += '#';
  }
  return out;
}

function buildFrames(raw) {
  const frames = [];
  const t = transformString(raw);
  const n = t.length;
  const p = new Array(n).fill(0);

  if (!raw) {
    frames.push({
      i: 0,
      C: 0,
      R: 0,
      p: p.slice(),
      kind: 'idle',
      bestCenter: 0,
      bestRadius: 0,
      note: 'Enter a non-empty string to begin.',
      done: true,
      t,
    });
    return { frames, t };
  }

  frames.push({
    i: -1,
    C: 0,
    R: 0,
    p: p.slice(),
    kind: 'init',
    bestCenter: 0,
    bestRadius: 0,
    note: `Insert "#" between every character and at both ends: "${t}". Now every palindrome — odd or even — has an odd length in the transformed string. Initialize C = 0, R = 0.`,
    done: false,
    t,
  });

  let C = 0;
  let R = 0;
  let bestCenter = 0;
  let bestRadius = 0;

  for (let i = 1; i < n - 1; i += 1) {
    const mirror = 2 * C - i;
    let initial = 0;
    let mirrorUsed = false;
    if (i < R) {
      initial = Math.min(R - i, p[mirror]);
      mirrorUsed = true;
      frames.push({
        i,
        C,
        R,
        p: p.slice(),
        mirror,
        kind: 'mirror',
        bestCenter,
        bestRadius,
        note: `i = ${i} is inside R = ${R}. Mirror index = 2*C - i = ${mirror}. Seed p[${i}] = min(R - i, p[${mirror}]) = min(${R - i}, ${p[mirror]}) = ${initial}.`,
        done: false,
        t,
      });
    } else {
      frames.push({
        i,
        C,
        R,
        p: p.slice(),
        kind: 'outside',
        bestCenter,
        bestRadius,
        note: `i = ${i} is outside R = ${R}. No mirror to borrow from. Start p[${i}] = 0 and expand from scratch.`,
        done: false,
        t,
      });
    }
    p[i] = initial;

    let expansions = 0;
    while (
      i + p[i] + 1 < n &&
      i - p[i] - 1 >= 0 &&
      t[i + p[i] + 1] === t[i - p[i] - 1]
    ) {
      p[i] += 1;
      expansions += 1;
    }

    if (expansions > 0) {
      frames.push({
        i,
        C,
        R,
        p: p.slice(),
        kind: 'expand',
        bestCenter,
        bestRadius,
        note: `Expand around i = ${i}. Match ${expansions} pair${expansions === 1 ? '' : 's'} outward. p[${i}] = ${p[i]}.`,
        done: false,
        expandedTo: p[i],
        t,
      });
    } else if (mirrorUsed && initial > 0) {
      frames.push({
        i,
        C,
        R,
        p: p.slice(),
        kind: 'no-expand',
        bestCenter,
        bestRadius,
        note: `Cannot expand further at i = ${i}. Keep p[${i}] = ${p[i]} from the mirror.`,
        done: false,
        t,
      });
    } else {
      frames.push({
        i,
        C,
        R,
        p: p.slice(),
        kind: 'no-expand',
        bestCenter,
        bestRadius,
        note: `No expansion possible at i = ${i}. p[${i}] = 0.`,
        done: false,
        t,
      });
    }

    if (i + p[i] > R) {
      const prevC = C;
      const prevR = R;
      C = i;
      R = i + p[i];
      frames.push({
        i,
        C,
        R,
        p: p.slice(),
        kind: 'update-cr',
        bestCenter,
        bestRadius,
        note: `i + p[${i}] = ${i + p[i]} extends past R = ${prevR}. Update C = ${C}, R = ${R} (was C = ${prevC}, R = ${prevR}).`,
        done: false,
        t,
      });
    }

    if (p[i] > bestRadius) {
      bestRadius = p[i];
      bestCenter = i;
      frames.push({
        i,
        C,
        R,
        p: p.slice(),
        kind: 'best',
        bestCenter,
        bestRadius,
        note: `New longest palindrome: centered at i = ${i} with radius ${bestRadius}. Length in original string = ${bestRadius}.`,
        done: false,
        t,
      });
    }
  }

  const start = Math.floor((bestCenter - bestRadius) / 2);
  const longest = raw.slice(start, start + bestRadius);

  frames.push({
    i: n - 1,
    C,
    R,
    p: p.slice(),
    kind: 'done',
    bestCenter,
    bestRadius,
    note: bestRadius > 0
      ? `Done. Longest palindromic substring: "${longest}" (length ${bestRadius}, starting at original index ${start}).`
      : 'Done. No palindrome longer than one character.',
    done: true,
    longest,
    longestStart: start,
    t,
  });

  return { frames, t };
}

export default function ManacherViz() {
  const [textInput, setTextInput] = useState(DEFAULT_STRING);

  const raw = useMemo(() => sanitizeInput(textInput), [textInput]);
  const { frames, t } = useMemo(() => buildFrames(raw), [raw]);

  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setStep(0);
    setRunning(false);
  }, [raw]);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    if (step >= frames.length - 1) {
      setRunning(false);
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      setStep((s) => {
        const next = Math.min(s + 1, frames.length - 1);
        if (next >= frames.length - 1) setRunning(false);
        return next;
      });
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, step, frames.length]);

  const handleStep = useCallback(() => {
    setRunning(false);
    setStep((s) => Math.min(s + 1, frames.length - 1));
  }, [frames.length]);

  const handleRun = useCallback(() => {
    if (step >= frames.length - 1) setStep(0);
    setRunning(true);
  }, [step, frames.length]);

  const handlePause = useCallback(() => setRunning(false), []);

  const handleReset = useCallback(() => {
    setRunning(false);
    setStep(0);
  }, []);

  const frame = frames[step] ?? {
    i: -1,
    C: 0,
    R: 0,
    p: new Array(t.length).fill(0),
    kind: 'idle',
    bestCenter: 0,
    bestRadius: 0,
    note: '',
    done: false,
    t,
  };
  const totalSteps = Math.max(frames.length, 1);

  const n = t.length;
  const widthSvg = PAD_X * 2 + n * CELL_W + (n - 1) * CELL_GAP;
  const heightSvg = PAD_TOP + STRING_ROW_H + BAR_GAP + BAR_AREA_H + PAD_BOTTOM;

  const cellX = (i) => PAD_X + i * (CELL_W + CELL_GAP);
  const cellCenter = (i) => cellX(i) + CELL_W / 2;

  const stringRowY = PAD_TOP;
  const barBaseY = stringRowY - BAR_GAP;
  const indexRowY = stringRowY + STRING_ROW_H + 14;

  const maxP = Math.max(1, ...frame.p);
  const barUnit = Math.min(18, BAR_AREA_H / Math.max(maxP, 1));

  const pointerY = stringRowY + STRING_ROW_H + 38;

  const palStart = frame.kind !== 'idle' && frame.bestRadius > 0
    ? frame.bestCenter - frame.bestRadius
    : -1;
  const palEnd = frame.kind !== 'idle' && frame.bestRadius > 0
    ? frame.bestCenter + frame.bestRadius
    : -1;

  const currentPalStart = frame.i >= 0 && frame.p[frame.i] > 0
    ? frame.i - frame.p[frame.i]
    : -1;
  const currentPalEnd = frame.i >= 0 && frame.p[frame.i] > 0
    ? frame.i + frame.p[frame.i]
    : -1;

  const showPointers = frame.kind !== 'idle' && raw.length > 0;
  const iVisible = showPointers && frame.i >= 0 && frame.i < n;
  const RVisible = showPointers && frame.R > 0 && frame.R < n;

  const captionClass = (() => {
    if (frame.kind === 'expand' || frame.kind === 'update-cr') return 'manacher-viz-narration manacher-narr-action';
    if (frame.kind === 'best') return 'manacher-viz-narration manacher-narr-best';
    if (frame.kind === 'mirror') return 'manacher-viz-narration manacher-narr-mirror';
    if (frame.kind === 'done' && frame.bestRadius > 0) return 'manacher-viz-narration manacher-narr-found';
    return 'manacher-viz-narration';
  })();

  const longestText = frame.kind === 'done' && frame.longest ? frame.longest : '';
  const longestStartIdx = frame.kind === 'done' ? frame.longestStart : -1;

  return (
    <div className="manacher-viz" role="region" aria-label="Manacher's algorithm visualization">
      <header className="manacher-viz-head">
        <h3 className="manacher-viz-title">Manacher&apos;s Algorithm</h3>
        <p className="manacher-viz-sub">
          Insert separators so every palindrome has odd length. Maintain the rightmost palindrome boundary R and its center C.
          When the next index sits inside R, mirror gives a free lower bound on its radius — that's the trick that turns O(n^2) into O(n).
        </p>
      </header>

      <div className="manacher-viz-controls">
        <label className="manacher-viz-field">
          <span className="manacher-viz-label">String</span>
          <input
            className="manacher-viz-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. babad"
            spellCheck={false}
            maxLength={MAX_LEN}
          />
        </label>
        <div className="manacher-viz-field manacher-viz-field-readout">
          <span className="manacher-viz-label">Transformed</span>
          <span className="manacher-viz-readout">{t}</span>
        </div>
      </div>

      <div className="manacher-viz-metrics">
        <div className="manacher-viz-metric">
          <span className="manacher-viz-metric-label">i</span>
          <span className="manacher-viz-metric-value">{frame.i >= 0 ? frame.i : '-'}</span>
        </div>
        <div className="manacher-viz-metric">
          <span className="manacher-viz-metric-label">C</span>
          <span className="manacher-viz-metric-value">{frame.C}</span>
        </div>
        <div className="manacher-viz-metric">
          <span className="manacher-viz-metric-label">R</span>
          <span className="manacher-viz-metric-value">{frame.R}</span>
        </div>
        <div className="manacher-viz-metric manacher-viz-metric-accent">
          <span className="manacher-viz-metric-label">Best radius</span>
          <span className="manacher-viz-metric-value">{frame.bestRadius}</span>
        </div>
        <div className="manacher-viz-metric">
          <span className="manacher-viz-metric-label">Step</span>
          <span className="manacher-viz-metric-value">
            {step + 1}
            <span className="manacher-viz-metric-dim"> / {totalSteps}</span>
          </span>
        </div>
      </div>

      <div className="manacher-viz-stage">
        <svg
          className="manacher-viz-svg"
          viewBox={`0 0 ${widthSvg} ${heightSvg}`}
          width="100%"
          role="img"
          aria-label={`Manacher run on transformed string of length ${n}`}
        >
          <defs>
            <marker id="manacher-arrow-down" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 0 L5 10 z" fill="var(--accent)" />
            </marker>
            <marker id="manacher-arrow-up" viewBox="0 0 10 10" refX="5" refY="1" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 10 L10 10 L5 0 z" fill="var(--accent)" />
            </marker>
            <marker id="manacher-arrow-down-c" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 0 L5 10 z" fill="var(--hue-violet, var(--accent))" />
            </marker>
            <marker id="manacher-arrow-down-r" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 0 L5 10 z" fill="var(--hue-mint, var(--easy))" />
            </marker>
          </defs>

          <text x={PAD_X - 6} y={barBaseY - BAR_AREA_H - 6} className="manacher-viz-row-label">
            radius p[i]
          </text>

          {frame.p.map((v, k) => {
            if (v <= 0) return null;
            const h = v * barUnit;
            const isCurrent = k === frame.i;
            const isBest = k === frame.bestCenter && frame.bestRadius > 0;
            return (
              <g
                key={`bar-${k}`}
                className={`manacher-viz-bar ${isCurrent ? 'manacher-bar-current' : ''} ${isBest ? 'manacher-bar-best' : ''}`}
              >
                <rect
                  x={cellX(k) + 4}
                  y={barBaseY - h}
                  width={CELL_W - 8}
                  height={h}
                  rx={3}
                  ry={3}
                  className="manacher-viz-bar-rect"
                />
                <text
                  x={cellCenter(k)}
                  y={barBaseY - h - 4}
                  textAnchor="middle"
                  className="manacher-viz-bar-value"
                >
                  {v}
                </text>
              </g>
            );
          })}

          <line
            x1={PAD_X - 4}
            y1={barBaseY}
            x2={widthSvg - PAD_X + 4}
            y2={barBaseY}
            className="manacher-viz-axis"
          />

          {Array.from(t).map((ch, k) => {
            const isCurrent = showPointers && k === frame.i && !frame.done;
            const isCenter = showPointers && k === frame.C && frame.C > 0;
            const isInBest = palStart >= 0 && k >= palStart && k <= palEnd;
            const isInCurrent = currentPalStart >= 0 && k >= currentPalStart && k <= currentPalEnd && k !== frame.i;
            const isInLongest = frame.kind === 'done' && palStart >= 0 && k >= palStart && k <= palEnd;
            const isMirror = showPointers && frame.kind === 'mirror' && k === frame.mirror;
            const isSeparator = ch === '#';
            return (
              <g
                key={`c-${k}`}
                className={[
                  'manacher-viz-cell',
                  isSeparator ? 'manacher-sep' : '',
                  isInBest ? 'manacher-in-best' : '',
                  isInCurrent ? 'manacher-in-current' : '',
                  isInLongest ? 'manacher-in-longest' : '',
                  isCurrent ? 'manacher-current' : '',
                  isCenter ? 'manacher-center' : '',
                  isMirror ? 'manacher-mirror' : '',
                ].filter(Boolean).join(' ')}
              >
                <rect
                  x={cellX(k)}
                  y={stringRowY}
                  width={CELL_W}
                  height={STRING_ROW_H}
                  rx={6}
                  ry={6}
                  className="manacher-viz-cell-rect"
                />
                <text
                  x={cellCenter(k)}
                  y={stringRowY + STRING_ROW_H / 2 + 6}
                  textAnchor="middle"
                  className="manacher-viz-cell-value"
                >
                  {ch}
                </text>
                <text
                  x={cellCenter(k)}
                  y={indexRowY}
                  textAnchor="middle"
                  className="manacher-viz-cell-index"
                >
                  {k}
                </text>
              </g>
            );
          })}

          {RVisible && frame.R > 0 && (
            <g className="manacher-viz-rwindow">
              <rect
                x={cellX(Math.max(0, 2 * frame.C - frame.R)) - 2}
                y={stringRowY - 6}
                width={Math.max(0,
                  cellX(Math.min(n - 1, frame.R)) + CELL_W + 4 - (cellX(Math.max(0, 2 * frame.C - frame.R)) - 2),
                )}
                height={STRING_ROW_H + 12}
                rx={8}
                ry={8}
                className="manacher-viz-rwindow-rect"
              />
            </g>
          )}

          {iVisible && (
            <g className="manacher-viz-pointer manacher-pointer-i">
              <line
                x1={cellCenter(frame.i)}
                y1={pointerY}
                x2={cellCenter(frame.i)}
                y2={stringRowY + STRING_ROW_H + 22}
                className="manacher-viz-pointer-line"
                markerEnd="url(#manacher-arrow-up)"
              />
              <text
                x={cellCenter(frame.i)}
                y={pointerY - 4}
                textAnchor="middle"
                className="manacher-viz-pointer-label"
              >
                i = {frame.i}
              </text>
            </g>
          )}

          {showPointers && frame.C >= 0 && frame.C < n && (
            <g className="manacher-viz-pointer manacher-pointer-c">
              <text
                x={cellCenter(frame.C)}
                y={pointerY + 38}
                textAnchor="middle"
                className="manacher-viz-pointer-label manacher-viz-pointer-label-c"
              >
                C = {frame.C}
              </text>
              <line
                x1={cellCenter(frame.C)}
                y1={stringRowY + STRING_ROW_H + 30}
                x2={cellCenter(frame.C)}
                y2={pointerY + 28}
                className="manacher-viz-pointer-line manacher-viz-pointer-line-c"
              />
            </g>
          )}

          {RVisible && (
            <g className="manacher-viz-pointer manacher-pointer-r">
              <text
                x={cellCenter(frame.R)}
                y={pointerY + 60}
                textAnchor="middle"
                className="manacher-viz-pointer-label manacher-viz-pointer-label-r"
              >
                R = {frame.R}
              </text>
              <line
                x1={cellCenter(frame.R)}
                y1={stringRowY + STRING_ROW_H + 30}
                x2={cellCenter(frame.R)}
                y2={pointerY + 50}
                className="manacher-viz-pointer-line manacher-viz-pointer-line-r"
              />
            </g>
          )}

          {frame.kind === 'mirror' && (
            <g className="manacher-viz-mirror-pair">
              <line
                x1={cellCenter(frame.mirror)}
                y1={stringRowY - 30}
                x2={cellCenter(frame.i)}
                y2={stringRowY - 30}
                className="manacher-viz-mirror-line"
              />
              <text
                x={(cellCenter(frame.mirror) + cellCenter(frame.i)) / 2}
                y={stringRowY - 36}
                textAnchor="middle"
                className="manacher-viz-mirror-label"
              >
                mirror about C
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className={captionClass} aria-live="polite">
        {frame.note}
      </div>

      {frame.done && raw.length > 0 && (
        <div
          className={`manacher-viz-result ${frame.bestRadius > 0 ? 'manacher-viz-result-success' : 'manacher-viz-result-empty'}`}
          role="status"
        >
          <span className="manacher-viz-result-label">{frame.bestRadius > 0 ? 'Longest palindrome' : 'Result'}</span>
          <span className="manacher-viz-result-value">
            {frame.bestRadius > 0
              ? `"${longestText}" — length ${frame.bestRadius}, starts at index ${longestStartIdx}`
              : 'No palindrome longer than one character'}
          </span>
        </div>
      )}

      <div className="manacher-viz-actions">
        <button type="button" className="manacher-viz-btn" onClick={handleStep} disabled={step >= frames.length - 1}>
          Step
        </button>
        {running ? (
          <button type="button" className="manacher-viz-btn manacher-viz-btn-primary" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="manacher-viz-btn manacher-viz-btn-primary"
            onClick={handleRun}
            disabled={frames.length === 0}
          >
            {step >= frames.length - 1 ? 'Replay' : 'Run'}
          </button>
        )}
        <button type="button" className="manacher-viz-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
