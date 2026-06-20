import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './RabinKarpViz.css';

// Rabin-Karp rolling-hash string search — step-through visualization.
// Standalone — render anywhere as <RabinKarpViz />.

const DEFAULT_TEXT = 'ABCBABCBABA';
const DEFAULT_PATTERN = 'BCBAB';
const BASE = 11;
const PRIME = 101;

// Small-alphabet ord — keeps the modular arithmetic readable in the readout.
const ord = (ch) => ch.charCodeAt(0) - 'A'.charCodeAt(0);

const CELL_W = 38;
const CELL_GAP = 4;
const CELL_H = 46;
const PAD_X = 28;
const PAD_TOP = 32;
const TEXT_ROW_Y = PAD_TOP + 18;
const PATTERN_ROW_GAP = 38;
const PAD_BOTTOM = 28;

function modPow(base, exp, mod) {
  let r = 1 % mod;
  let b = base % mod;
  let e = exp;
  while (e > 0) {
    if (e & 1) r = (r * b) % mod;
    b = (b * b) % mod;
    e >>= 1;
  }
  return r;
}

function patternHash(pattern) {
  let h = 0;
  for (let k = 0; k < pattern.length; k += 1) {
    h = (h * BASE + ord(pattern[k])) % PRIME;
  }
  return h;
}

function initialWindowHash(text, m) {
  let h = 0;
  for (let k = 0; k < m; k += 1) {
    h = (h * BASE + ord(text[k])) % PRIME;
  }
  return h;
}

function rollHash(prevHash, outChar, inChar, highPow) {
  // ((prev - outChar * b^(m-1)) * b + inChar) mod q, with positive mod
  let h = prevHash - ((ord(outChar) * highPow) % PRIME);
  h = ((h % PRIME) + PRIME) % PRIME;
  h = (h * BASE + ord(inChar)) % PRIME;
  return h;
}

function buildFrames(text, pattern) {
  const frames = [];
  const n = text.length;
  const m = pattern.length;

  if (!n || !m || m > n) {
    frames.push({
      kind: 'idle',
      windowStart: 0,
      windowHash: 0,
      patHash: 0,
      compareIdx: -1,
      compareMatches: 0,
      hashChecks: 0,
      charChecks: 0,
      naiveChecks: 0,
      matches: [],
      note: !m ? 'Pattern is empty.' : !n ? 'Text is empty.' : 'Pattern is longer than the text.',
      done: true,
    });
    return frames;
  }

  const patHash = patternHash(pattern);
  const highPow = modPow(BASE, m - 1, PRIME);
  let windowHash = initialWindowHash(text, m);
  let hashChecks = 0;
  let charChecks = 0;
  let naiveChecks = 0;
  const matches = [];

  frames.push({
    kind: 'init',
    windowStart: 0,
    windowHash,
    patHash,
    highPow,
    compareIdx: -1,
    compareMatches: 0,
    hashChecks,
    charChecks,
    naiveChecks,
    matches: [],
    note: `Precompute: pattern hash = ${patHash}, b^(m-1) mod q = ${highPow}. First window hash = ${windowHash}.`,
    done: false,
  });

  for (let s = 0; s <= n - m; s += 1) {
    hashChecks += 1;
    // The naive algorithm would compare up to m chars per position.
    const naiveForThis = (() => {
      let c = 0;
      for (let k = 0; k < m; k += 1) {
        c += 1;
        if (text[s + k] !== pattern[k]) break;
      }
      return c;
    })();
    naiveChecks += naiveForThis;

    frames.push({
      kind: 'hash-check',
      windowStart: s,
      windowHash,
      patHash,
      highPow,
      compareIdx: -1,
      compareMatches: 0,
      hashChecks,
      charChecks,
      naiveChecks,
      matches: matches.slice(),
      note:
        windowHash === patHash
          ? `Window [${s}..${s + m - 1}] hash = ${windowHash} matches pattern hash ${patHash}. Verify char by char.`
          : `Window [${s}..${s + m - 1}] hash = ${windowHash} != ${patHash}. Skip — no char comparisons needed.`,
      done: false,
    });

    if (windowHash === patHash) {
      // Slow per-char verification.
      let k = 0;
      let mismatched = false;
      for (k = 0; k < m; k += 1) {
        charChecks += 1;
        const isMatch = text[s + k] === pattern[k];
        frames.push({
          kind: isMatch ? 'compare-match' : 'compare-mismatch',
          windowStart: s,
          windowHash,
          patHash,
          highPow,
          compareIdx: k,
          compareMatches: k + (isMatch ? 1 : 0),
          hashChecks,
          charChecks,
          naiveChecks,
          matches: matches.slice(),
          note: isMatch
            ? `text[${s + k}] = '${text[s + k]}' matches pattern[${k}] = '${pattern[k]}'.`
            : `text[${s + k}] = '${text[s + k]}' != pattern[${k}] = '${pattern[k]}'. Spurious hit (collision).`,
          done: false,
        });
        if (!isMatch) {
          mismatched = true;
          break;
        }
      }
      if (!mismatched) {
        matches.push(s);
        frames.push({
          kind: 'found',
          windowStart: s,
          windowHash,
          patHash,
          highPow,
          compareIdx: m - 1,
          compareMatches: m,
          hashChecks,
          charChecks,
          naiveChecks,
          matches: matches.slice(),
          foundAt: s,
          note: `All ${m} characters matched. Pattern found at index ${s}.`,
          done: false,
        });
      }
    } else {
      frames.push({
        kind: 'skip',
        windowStart: s,
        windowHash,
        patHash,
        highPow,
        compareIdx: -1,
        compareMatches: 0,
        hashChecks,
        charChecks,
        naiveChecks,
        matches: matches.slice(),
        note: `Hashes differ — the substring cannot equal the pattern. Move the window right by 1.`,
        done: false,
      });
    }

    // Roll the hash forward if there's another window.
    if (s + m < n) {
      const outChar = text[s];
      const inChar = text[s + m];
      const before = windowHash;
      windowHash = rollHash(windowHash, outChar, inChar, highPow);
      frames.push({
        kind: 'roll',
        windowStart: s + 1,
        windowHash,
        patHash,
        highPow,
        compareIdx: -1,
        compareMatches: 0,
        hashChecks,
        charChecks,
        naiveChecks,
        matches: matches.slice(),
        prevHash: before,
        outChar,
        inChar,
        note: `Roll: h = ((${before} − ord('${outChar}')·${highPow})·${BASE} + ord('${inChar}')) mod ${PRIME} = ${windowHash}.`,
        done: false,
      });
    }
  }

  frames.push({
    kind: 'done',
    windowStart: n - m,
    windowHash,
    patHash,
    highPow,
    compareIdx: -1,
    compareMatches: 0,
    hashChecks,
    charChecks,
    naiveChecks,
    matches: matches.slice(),
    note: matches.length
      ? `Scan complete. ${matches.length} occurrence${matches.length === 1 ? '' : 's'} at index${matches.length === 1 ? '' : 'es'} ${matches.join(', ')}. ${charChecks} char check${charChecks === 1 ? '' : 's'} vs ${naiveChecks} for the naive scan.`
      : `Scan complete. No occurrences. ${charChecks} char check${charChecks === 1 ? '' : 's'} vs ${naiveChecks} for the naive scan.`,
    done: true,
  });

  return frames;
}

function sanitize(raw, max) {
  if (!raw) return '';
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, max);
}

export default function RabinKarpViz() {
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);

  const text = useMemo(() => sanitize(textInput, 24), [textInput]);
  const pattern = useMemo(() => sanitize(patternInput, 10), [patternInput]);
  const frames = useMemo(() => buildFrames(text, pattern), [text, pattern]);

  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speedMs, setSpeedMs] = useState(750);
  const timerRef = useRef(null);

  // Reset on input change — render-time comparison avoids a setState-in-effect cascade.
  const [prevText, setPrevText] = useState(text);
  const [prevPattern, setPrevPattern] = useState(pattern);
  if (prevText !== text || prevPattern !== pattern) {
    setPrevText(text);
    setPrevPattern(pattern);
    setStep(0);
    setIsRunningRaw(false);
  }

  const totalSteps = Math.max(frames.length, 1);
  const isRunning = isRunningRaw && step < frames.length - 1;

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, frames.length - 1));
    }, speedMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, speedMs, frames.length]);

  const handleStep = useCallback(() => {
    setIsRunningRaw(false);
    setStep((s) => Math.min(s + 1, frames.length - 1));
  }, [frames.length]);

  const handleRun = useCallback(() => {
    if (step >= frames.length - 1) setStep(0);
    setIsRunningRaw(true);
  }, [step, frames.length]);

  const handlePause = useCallback(() => setIsRunningRaw(false), []);

  const handleReset = useCallback(() => {
    setIsRunningRaw(false);
    setStep(0);
  }, []);

  const frame = frames[step] ?? frames[0];

  const m = pattern.length;
  const n = text.length;
  const textLen = Math.max(n, 1);

  const widthSvg = PAD_X * 2 + textLen * CELL_W + (textLen - 1) * CELL_GAP;
  const heightSvg = TEXT_ROW_Y + CELL_H + PATTERN_ROW_GAP + CELL_H + PAD_BOTTOM;
  const patternRowY = TEXT_ROW_Y + CELL_H + PATTERN_ROW_GAP;
  const cellX = (i) => PAD_X + i * (CELL_W + CELL_GAP);

  const matchedCells = new Set();
  frame.matches.forEach((start) => {
    for (let k = 0; k < m; k += 1) matchedCells.add(start + k);
  });

  const windowStart = Math.max(0, Math.min(frame.windowStart, n - m));
  const inWindow = (i) => i >= windowStart && i < windowStart + m;

  const showCompare = frame.kind === 'compare-match' || frame.kind === 'compare-mismatch';
  const showFound = frame.kind === 'found';
  const showSkip = frame.kind === 'skip';
  const isHashMatch = frame.kind === 'hash-check' && frame.windowHash === frame.patHash;

  const captionClass = (() => {
    if (frame.kind === 'compare-match' || frame.kind === 'found') return 'rkv-narration rkv-narr-match';
    if (frame.kind === 'compare-mismatch' || frame.kind === 'skip') return 'rkv-narration rkv-narr-mismatch';
    if (frame.kind === 'roll' || frame.kind === 'init') return 'rkv-narration rkv-narr-info';
    return 'rkv-narration';
  })();

  const speedup = frame.charChecks > 0 ? (frame.naiveChecks / frame.charChecks).toFixed(2) : '—';

  return (
    <div className="rkv" role="region" aria-label="Rabin-Karp rolling hash visualization">
      <header className="rkv-head">
        <h3 className="rkv-title">Rabin–Karp Rolling Hash</h3>
        <p className="rkv-sub">
          Slide a window across the text and roll its hash forward in O(1). Only when a hash matches the pattern&apos;s hash do we
          fall back to a real char-by-char check — most positions are dismissed instantly.
        </p>
      </header>

      <div className="rkv-controls">
        <label className="rkv-field">
          <span className="rkv-label">Text</span>
          <input
            className="rkv-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="haystack"
            spellCheck={false}
            maxLength={24}
          />
        </label>
        <label className="rkv-field">
          <span className="rkv-label">Pattern</span>
          <input
            className="rkv-input"
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            placeholder="needle"
            spellCheck={false}
            maxLength={10}
          />
        </label>
      </div>

      <div className="rkv-metrics">
        <div className={`rkv-metric ${isHashMatch ? 'rkv-metric-accent' : ''}`}>
          <span className="rkv-metric-label">Pattern hash</span>
          <span className="rkv-metric-value">{frame.patHash}</span>
        </div>
        <div className={`rkv-metric ${isHashMatch ? 'rkv-metric-accent' : ''}`}>
          <span className="rkv-metric-label">Window hash</span>
          <span className="rkv-metric-value">{frame.windowHash}</span>
        </div>
        <div className="rkv-metric">
          <span className="rkv-metric-label">Char checks</span>
          <span className="rkv-metric-value">{frame.charChecks}</span>
        </div>
        <div className="rkv-metric">
          <span className="rkv-metric-label">Naive would be</span>
          <span className="rkv-metric-value rkv-metric-dimval">{frame.naiveChecks}</span>
        </div>
        <div className="rkv-metric">
          <span className="rkv-metric-label">Speedup</span>
          <span className="rkv-metric-value">
            {speedup}
            {speedup !== '—' ? <span className="rkv-metric-dim">×</span> : null}
          </span>
        </div>
        <div className="rkv-metric">
          <span className="rkv-metric-label">Found</span>
          <span className="rkv-metric-value">{frame.matches.length}</span>
        </div>
      </div>

      <div className="rkv-stage">
        <svg
          className="rkv-svg"
          viewBox={`0 0 ${widthSvg} ${heightSvg}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Rabin-Karp step ${step + 1} of ${totalSteps}`}
        >
          <defs>
            <linearGradient id="rkv-window-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.18)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.06)" />
            </linearGradient>
          </defs>

          {n > 0 && m > 0 && m <= n && (
            <rect
              x={cellX(windowStart) - 4}
              y={TEXT_ROW_Y - 8}
              width={m * CELL_W + (m - 1) * CELL_GAP + 8}
              height={CELL_H + 16}
              rx={8}
              ry={8}
              className={`rkv-window-band ${showFound ? 'rkv-window-found' : showSkip ? 'rkv-window-skip' : ''}`}
              fill="url(#rkv-window-fill)"
            />
          )}

          {Array.from(text).map((ch, i) => {
            const inWin = inWindow(i);
            const isCompareCell = showCompare && i === windowStart + frame.compareIdx;
            const isCompareMatchedPrefix = showCompare && inWin && i < windowStart + frame.compareIdx;
            const isFoundCell = showFound && inWin;
            const isMatchedFinal = matchedCells.has(i);
            const stateClass = [
              'rkv-cell',
              inWin ? 'rkv-cell-in-window' : '',
              isCompareCell ? (frame.kind === 'compare-match' ? 'rkv-cell-match' : 'rkv-cell-mismatch') : '',
              isCompareMatchedPrefix ? 'rkv-cell-match' : '',
              isFoundCell ? 'rkv-cell-found' : '',
              isMatchedFinal && !inWin ? 'rkv-cell-found-prior' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={`t-${i}`} className={stateClass}>
                <rect
                  x={cellX(i)}
                  y={TEXT_ROW_Y}
                  width={CELL_W}
                  height={CELL_H}
                  rx={6}
                  ry={6}
                  className="rkv-cell-rect"
                />
                <text
                  x={cellX(i) + CELL_W / 2}
                  y={TEXT_ROW_Y + CELL_H / 2 + 6}
                  textAnchor="middle"
                  className="rkv-cell-value"
                >
                  {ch}
                </text>
                <text
                  x={cellX(i) + CELL_W / 2}
                  y={TEXT_ROW_Y + CELL_H + 12}
                  textAnchor="middle"
                  className="rkv-cell-index"
                >
                  {i}
                </text>
              </g>
            );
          })}

          <text x={PAD_X - 6} y={TEXT_ROW_Y - 12} className="rkv-row-label">
            text
          </text>

          {m > 0 && n > 0 && m <= n && (
            <>
              <text x={PAD_X - 6} y={patternRowY - 8} className="rkv-row-label">
                pattern
              </text>
              {Array.from(pattern).map((ch, k) => {
                const isCompareK = showCompare && k === frame.compareIdx;
                const isComparePrefix = showCompare && k < frame.compareIdx;
                const isFoundCell = showFound;
                const stateClass = [
                  'rkv-pcell',
                  isCompareK ? (frame.kind === 'compare-match' ? 'rkv-pcell-match' : 'rkv-pcell-mismatch') : '',
                  isComparePrefix ? 'rkv-pcell-match' : '',
                  isFoundCell ? 'rkv-pcell-found' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <g key={`p-${k}`} className={stateClass}>
                    <rect
                      x={cellX(windowStart + k)}
                      y={patternRowY}
                      width={CELL_W}
                      height={CELL_H}
                      rx={6}
                      ry={6}
                      className="rkv-pcell-rect"
                    />
                    <text
                      x={cellX(windowStart + k) + CELL_W / 2}
                      y={patternRowY + CELL_H / 2 + 6}
                      textAnchor="middle"
                      className="rkv-cell-value"
                    >
                      {ch}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      <div className={captionClass} aria-live="polite">
        {frame.note}
      </div>

      <div className="rkv-arith">
        <span className="rkv-arith-label">Hash recurrence</span>
        <code className="rkv-arith-code">
          h<sub>new</sub> = ((h<sub>old</sub> − T[i]·b<sup>m−1</sup>) · b + T[i+m]) mod q
          <span className="rkv-arith-vals">
            {'  '}b={BASE}, q={PRIME}, m={m || '—'}, b<sup>m−1</sup>={frame.highPow ?? '—'}
          </span>
        </code>
      </div>

      <div className="rkv-actions">
        <div className="rkv-speed">
          <label htmlFor="rkv-speed-range" className="rkv-speed-label">Speed</label>
          <input
            id="rkv-speed-range"
            className="rkv-speed-range"
            type="range"
            min="200"
            max="1400"
            step="50"
            value={1400 - (speedMs - 200)}
            onChange={(e) => setSpeedMs(1400 - (Number(e.target.value) - 200))}
            aria-label="Playback speed"
          />
          <span className="rkv-speed-value">{(1000 / speedMs).toFixed(2)}×</span>
        </div>

        <div className="rkv-buttons">
          <button
            type="button"
            className="rkv-btn"
            onClick={handleStep}
            disabled={step >= frames.length - 1}
            aria-label="Step forward"
          >
            <ChevronRight size={14} /> Step
          </button>
          {isRunning ? (
            <button
              type="button"
              className="rkv-btn rkv-btn-primary"
              onClick={handlePause}
              aria-label="Pause"
            >
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button
              type="button"
              className="rkv-btn rkv-btn-primary"
              onClick={handleRun}
              disabled={frames.length <= 1}
              aria-label={step >= frames.length - 1 ? 'Replay' : 'Play'}
            >
              <Play size={14} />
              {step >= frames.length - 1 ? 'Replay' : 'Play'}
            </button>
          )}
          <button
            type="button"
            className="rkv-btn"
            onClick={() => {
              setIsRunningRaw(false);
              setStep(frames.length - 1);
            }}
            disabled={step >= frames.length - 1}
            aria-label="Skip to end"
          >
            <SkipForward size={14} /> End
          </button>
          <button type="button" className="rkv-btn" onClick={handleReset} aria-label="Reset">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="rkv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>
    </div>
  );
}
