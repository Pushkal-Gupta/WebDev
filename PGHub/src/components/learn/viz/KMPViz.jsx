import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './KMPViz.css';

const DEFAULT_TEXT = 'ABABDABACDABABCABAB';
const DEFAULT_PATTERN = 'ABABCABAB';
const TICK_MS = 700;

const CELL_W = 36;
const CELL_H = 44;
const CELL_GAP = 4;
const PAD_X = 28;
const PAD_TOP = 70;
const ROW_GAP = 64;
const LPS_GAP = 18;
const PAD_BOTTOM = 80;

function sanitizeInput(raw) {
  if (!raw) return '';
  return raw.replace(/\s+/g, '').slice(0, 40);
}

function buildLPS(pattern) {
  const n = pattern.length;
  const lps = new Array(n).fill(0);
  if (n === 0) return lps;
  let len = 0;
  let i = 1;
  while (i < n) {
    if (pattern[i] === pattern[len]) {
      len += 1;
      lps[i] = len;
      i += 1;
    } else if (len > 0) {
      len = lps[len - 1];
    } else {
      lps[i] = 0;
      i += 1;
    }
  }
  return lps;
}

function buildFrames(text, pattern, lps) {
  const frames = [];
  const n = text.length;
  const m = pattern.length;

  if (!n || !m) {
    frames.push({
      i: 0,
      j: 0,
      kind: 'idle',
      matches: [],
      note: !m ? 'Enter a non-empty pattern to begin.' : 'Enter non-empty text to begin.',
      done: true,
    });
    return frames;
  }

  frames.push({
    i: 0,
    j: 0,
    kind: 'init',
    matches: [],
    note: `Start with i = 0, j = 0. LPS array built for pattern of length ${m}.`,
    done: false,
  });

  let i = 0;
  let j = 0;
  const matches = [];

  while (i < n) {
    if (text[i] === pattern[j]) {
      frames.push({
        i,
        j,
        kind: 'match',
        matches: matches.slice(),
        note: `Match at i=${i}, j=${j} (text[${i}]='${text[i]}' = pattern[${j}]='${pattern[j]}'). Advance both.`,
        done: false,
      });
      i += 1;
      j += 1;
      if (j === m) {
        const start = i - j;
        matches.push(start);
        frames.push({
          i,
          j,
          kind: 'found',
          matches: matches.slice(),
          note: `Full pattern matched. Found at index ${start}. Fall back j = LPS[${j - 1}] = ${lps[j - 1]} to search for next occurrence.`,
          done: false,
          foundAt: start,
        });
        j = lps[j - 1];
      }
    } else if (j > 0) {
      const oldJ = j;
      const newJ = lps[j - 1];
      frames.push({
        i,
        j,
        kind: 'mismatch',
        matches: matches.slice(),
        note: `Mismatch! i=${i}, j=${oldJ} (text[${i}]='${text[i]}' != pattern[${oldJ}]='${pattern[oldJ]}'). LPS[${oldJ - 1}]=${newJ}, fall back j to ${newJ}, don't move i.`,
        done: false,
        fallbackTo: newJ,
      });
      j = newJ;
    } else {
      frames.push({
        i,
        j,
        kind: 'mismatch-zero',
        matches: matches.slice(),
        note: `Mismatch! i=${i}, j=0 (text[${i}]='${text[i]}' != pattern[0]='${pattern[0]}'). Advance i, j stays 0.`,
        done: false,
      });
      i += 1;
    }
  }

  frames.push({
    i,
    j,
    kind: 'done',
    matches: matches.slice(),
    note: matches.length
      ? `Scan complete. Found ${matches.length} occurrence${matches.length === 1 ? '' : 's'} at index${matches.length === 1 ? '' : 'es'} ${matches.join(', ')}.`
      : 'Scan complete. No occurrences found.',
    done: true,
  });

  return frames;
}

export default function KMPViz() {
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);

  const text = useMemo(() => {
    const cleaned = sanitizeInput(textInput);
    return cleaned;
  }, [textInput]);

  const pattern = useMemo(() => {
    const cleaned = sanitizeInput(patternInput);
    return cleaned;
  }, [patternInput]);

  const lps = useMemo(() => buildLPS(pattern), [pattern]);
  const frames = useMemo(() => buildFrames(text, pattern, lps), [text, pattern, lps]);

  const [step, setStep] = useState(0);
  const [runningRaw, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  // Reset playhead when the input changes. Comparing prev state during render is
  // the React-recommended pattern over a setState-in-effect cascade.
  const [prevText, setPrevText] = useState(text);
  const [prevPattern, setPrevPattern] = useState(pattern);
  if (prevText !== text || prevPattern !== pattern) {
    setPrevText(text);
    setPrevPattern(pattern);
    setStep(0);
    setRunning(false);
  }

  const running = runningRaw && step < frames.length - 1;
  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, frames.length - 1));
    }, Math.round(TICK_MS / speed));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, frames.length, step, speed]);

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
    i: 0,
    j: 0,
    kind: 'idle',
    matches: [],
    note: '',
    done: false,
  };
  const totalSteps = Math.max(frames.length, 1);

  const textLen = Math.max(text.length, 1);

  const widthSvg = PAD_X * 2 + textLen * CELL_W + (textLen - 1) * CELL_GAP;
  const heightSvg = PAD_TOP + CELL_H + ROW_GAP + CELL_H + LPS_GAP + CELL_H + PAD_BOTTOM;

  const cellX = (i) => PAD_X + i * (CELL_W + CELL_GAP);

  const patternRowY = PAD_TOP + CELL_H + ROW_GAP;
  const lpsRowY = patternRowY + CELL_H + LPS_GAP;

  const patternOffset = Math.max(0, frame.i - frame.j);

  const matchStarts = new Set(frame.matches);
  const matchedCells = new Set();
  frame.matches.forEach((start) => {
    for (let k = 0; k < pattern.length; k += 1) matchedCells.add(start + k);
  });

  const showPointers = frame.kind !== 'idle' && pattern.length > 0 && text.length > 0;
  const iPointerX = frame.i < text.length ? cellX(frame.i) + CELL_W / 2 : cellX(text.length - 1) + CELL_W + 4;
  const jCellIndex = patternOffset + frame.j;
  const jPointerX = jCellIndex < text.length ? cellX(jCellIndex) + CELL_W / 2 : cellX(text.length - 1) + CELL_W + 4;

  const captionClass = (() => {
    if (frame.kind === 'match' || frame.kind === 'found') return 'kmp-viz-narration kmp-narr-match';
    if (frame.kind === 'mismatch' || frame.kind === 'mismatch-zero') return 'kmp-viz-narration kmp-narr-mismatch';
    if (frame.kind === 'done' && frame.matches.length) return 'kmp-viz-narration kmp-narr-found';
    return 'kmp-viz-narration';
  })();

  return (
    <div className="kmp-viz" role="region" aria-label="KMP string matching visualization">
      <header className="kmp-viz-head">
        <h3 className="kmp-viz-title">KMP String Matching</h3>
        <p className="kmp-viz-sub">
          The LPS array lets the pattern skip ahead on a mismatch without ever re-scanning text. Match advances both pointers;
          mismatch slides the pattern forward to the next viable prefix.
        </p>
      </header>

      <div className="kmp-viz-controls">
        <label className="kmp-viz-field">
          <span className="kmp-viz-label">Text</span>
          <input
            className="kmp-viz-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="haystack"
            spellCheck={false}
            maxLength={40}
          />
        </label>
        <label className="kmp-viz-field">
          <span className="kmp-viz-label">Pattern</span>
          <input
            className="kmp-viz-input"
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            placeholder="needle"
            spellCheck={false}
            maxLength={20}
          />
        </label>
      </div>

      <div className="kmp-viz-metrics">
        <div className="kmp-viz-metric">
          <span className="kmp-viz-metric-label">i (text)</span>
          <span className="kmp-viz-metric-value">{Math.min(frame.i, text.length)}</span>
        </div>
        <div className="kmp-viz-metric">
          <span className="kmp-viz-metric-label">j (pattern)</span>
          <span className="kmp-viz-metric-value">{frame.j}</span>
        </div>
        <div className="kmp-viz-metric kmp-viz-metric-accent">
          <span className="kmp-viz-metric-label">Matches</span>
          <span className="kmp-viz-metric-value">{frame.matches.length}</span>
        </div>
        <div className="kmp-viz-metric">
          <span className="kmp-viz-metric-label">Step</span>
          <span className="kmp-viz-metric-value">
            {step + 1}
            <span className="kmp-viz-metric-dim"> / {totalSteps}</span>
          </span>
        </div>
      </div>

      <div className="kmp-viz-stage">
        <svg
          className="kmp-viz-svg"
          viewBox={`0 0 ${widthSvg} ${heightSvg}`}
          width="100%"
          role="img"
          aria-label={`KMP matching: text length ${text.length}, pattern length ${pattern.length}`}
        >
          <defs>
            <marker id="kmp-arrow-down" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 0 L5 10 z" fill="var(--accent)" />
            </marker>
            <marker id="kmp-arrow-up" viewBox="0 0 10 10" refX="5" refY="1" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 10 L10 10 L5 0 z" fill="var(--hue-violet, var(--accent))" />
            </marker>
          </defs>

          <text x={PAD_X - 6} y={PAD_TOP - 28} className="kmp-viz-row-label">
            text
          </text>

          {Array.from(text).map((ch, i) => {
            const isCurrent = showPointers && i === frame.i && !frame.done;
            const isMatched = matchedCells.has(i);
            const isMatchStart = matchStarts.has(i);
            return (
              <g
                key={`t-${i}`}
                className={`kmp-viz-cell ${isCurrent ? 'kmp-current' : ''} ${isMatched ? 'kmp-matched' : ''} ${isMatchStart ? 'kmp-match-start' : ''}`}
              >
                <rect
                  x={cellX(i)}
                  y={PAD_TOP}
                  width={CELL_W}
                  height={CELL_H}
                  rx={6}
                  ry={6}
                  className="kmp-viz-cell-rect"
                />
                <text
                  x={cellX(i) + CELL_W / 2}
                  y={PAD_TOP + CELL_H / 2 + 6}
                  textAnchor="middle"
                  className="kmp-viz-cell-value"
                >
                  {ch}
                </text>
                <text
                  x={cellX(i) + CELL_W / 2}
                  y={PAD_TOP + CELL_H + 14}
                  textAnchor="middle"
                  className="kmp-viz-cell-index"
                >
                  {i}
                </text>
              </g>
            );
          })}

          {showPointers && frame.i < text.length && (
            <g className="kmp-viz-pointer kmp-pointer-i">
              <text x={iPointerX} y={PAD_TOP - 36} textAnchor="middle" className="kmp-viz-pointer-label">
                i = {frame.i}
              </text>
              <line
                x1={iPointerX}
                y1={PAD_TOP - 28}
                x2={iPointerX}
                y2={PAD_TOP - 6}
                className="kmp-viz-pointer-line"
                markerEnd="url(#kmp-arrow-down)"
              />
            </g>
          )}

          <text x={PAD_X - 6} y={patternRowY - 8} className="kmp-viz-row-label">
            pattern
          </text>

          {Array.from(pattern).map((ch, k) => {
            const isCurrentJ = showPointers && k === frame.j && !frame.done && frame.kind !== 'mismatch-zero';
            const isMisJ = showPointers && frame.kind === 'mismatch-zero' && k === 0;
            const isMatched = showPointers && k < frame.j;
            return (
              <g
                key={`p-${k}`}
                className={`kmp-viz-cell kmp-viz-pcell ${isCurrentJ || isMisJ ? 'kmp-current-j' : ''} ${isMatched ? 'kmp-pmatched' : ''}`}
              >
                <rect
                  x={cellX(patternOffset + k)}
                  y={patternRowY}
                  width={CELL_W}
                  height={CELL_H}
                  rx={6}
                  ry={6}
                  className="kmp-viz-cell-rect kmp-viz-pcell-rect"
                />
                <text
                  x={cellX(patternOffset + k) + CELL_W / 2}
                  y={patternRowY + CELL_H / 2 + 6}
                  textAnchor="middle"
                  className="kmp-viz-cell-value"
                >
                  {ch}
                </text>
              </g>
            );
          })}

          {showPointers && (
            <g className="kmp-viz-pointer kmp-pointer-j">
              <line
                x1={jPointerX}
                y1={patternRowY + CELL_H + 6}
                x2={jPointerX}
                y2={patternRowY + CELL_H + 28}
                className="kmp-viz-pointer-line kmp-viz-pointer-line-j"
                markerEnd="url(#kmp-arrow-up)"
              />
              <text
                x={jPointerX}
                y={patternRowY + CELL_H + 44}
                textAnchor="middle"
                className="kmp-viz-pointer-label kmp-viz-pointer-label-j"
              >
                j = {frame.j}
              </text>
            </g>
          )}

          <text x={PAD_X - 6} y={lpsRowY - 4} className="kmp-viz-row-label kmp-viz-row-label-lps">
            LPS
          </text>

          {lps.map((v, k) => {
            const isUsed = showPointers && (frame.kind === 'mismatch' || frame.kind === 'found') && k === frame.j - 1;
            return (
              <g key={`l-${k}`} className={`kmp-viz-lps-cell ${isUsed ? 'kmp-lps-used' : ''}`}>
                <rect
                  x={cellX(patternOffset + k)}
                  y={lpsRowY}
                  width={CELL_W}
                  height={CELL_H * 0.7}
                  rx={5}
                  ry={5}
                  className="kmp-viz-lps-rect"
                />
                <text
                  x={cellX(patternOffset + k) + CELL_W / 2}
                  y={lpsRowY + (CELL_H * 0.7) / 2 + 5}
                  textAnchor="middle"
                  className="kmp-viz-lps-value"
                >
                  {v}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={captionClass} aria-live="polite">
        {frame.note}
      </div>

      {frame.done && pattern.length > 0 && text.length > 0 && (
        <div className={`kmp-viz-result ${frame.matches.length ? 'kmp-viz-result-success' : 'kmp-viz-result-empty'}`} role="status">
          <span className="kmp-viz-result-label">{frame.matches.length ? 'Result' : 'No match'}</span>
          <span className="kmp-viz-result-value">
            {frame.matches.length
              ? `Found at index${frame.matches.length === 1 ? '' : 'es'} ${frame.matches.join(', ')}`
              : 'Pattern does not occur in text'}
          </span>
        </div>
      )}

      <div className="kmp-viz-actions">
        <button type="button" className="kmp-viz-btn" onClick={handleStep} disabled={step >= frames.length - 1}>
          Step
        </button>
        {running ? (
          <button type="button" className="kmp-viz-btn kmp-viz-btn-primary" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="kmp-viz-btn kmp-viz-btn-primary"
            onClick={handleRun}
            disabled={frames.length === 0}
          >
            {step >= frames.length - 1 ? 'Replay' : 'Run'}
          </button>
        )}
        <button type="button" className="kmp-viz-btn" onClick={handleReset}>
          Reset
        </button>
        <label className="kmp-viz-speed">
          <span className="kmp-viz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="kmp-viz-speed-range"
            aria-label="Playback speed"
          />
          <span className="kmp-viz-speed-value">{speed.toFixed(1)}×</span>
        </label>
      </div>
    </div>
  );
}
