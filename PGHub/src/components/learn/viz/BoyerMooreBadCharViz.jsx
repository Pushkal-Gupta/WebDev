import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, ChevronRight, SkipForward, RotateCcw, RefreshCw } from 'lucide-react';
import './BoyerMooreBadCharViz.css';

// Boyer-Moore string matching with the BAD CHARACTER heuristic.
// Right-to-left compare within an alignment; on a mismatch, shift the pattern so
// the last occurrence of the text's mismatched char in the pattern lines up
// (or past it if absent). Theme tokens only, no inner scroll, SVG reflows.

const DEFAULT_TEXT = 'abacaabadcabacabaabb';
const DEFAULT_PAT = 'abacab';

// Last-occurrence table: char -> rightmost index in pattern.
function buildBadCharTable(pat) {
  const table = {};
  for (let i = 0; i < pat.length; i++) table[pat[i]] = i;
  return table;
}

function buildSteps(text, pat) {
  const steps = [];
  const n = text.length;
  const m = pat.length;
  const table = buildBadCharTable(pat);
  const matches = [];
  let comparisons = 0;

  if (m === 0 || n === 0 || m > n) {
    steps.push({
      align: 0, cmp: -1, status: 'idle', comparisons: 0, matches: [],
      lastChar: null, lastIdx: null, shift: 0,
      note: m === 0
        ? 'Empty pattern — nothing to search for.'
        : m > n
          ? `Pattern (length ${m}) is longer than text (length ${n}) — no match possible.`
          : 'Empty text — nothing to scan.',
    });
    return { steps, table };
  }

  let s = 0; // alignment: pattern's left edge sits at text[s]
  steps.push({
    align: s, cmp: -1, status: 'place', comparisons, matches: [...matches],
    lastChar: null, lastIdx: null, shift: 0,
    note: `Align the pattern at text[${s}]. Compare right-to-left starting from pattern[${m - 1}].`,
  });

  while (s <= n - m) {
    let j = m - 1;
    while (j >= 0 && pat[j] === text[s + j]) {
      comparisons++;
      steps.push({
        align: s, cmp: j, status: 'match-char', comparisons, matches: [...matches],
        lastChar: null, lastIdx: null, shift: 0,
        note: `text[${s + j}]='${text[s + j]}' == pattern[${j}]='${pat[j]}' — chars agree, step left.`,
      });
      j--;
    }

    if (j < 0) {
      matches.push(s);
      steps.push({
        align: s, cmp: -1, status: 'full-match', comparisons, matches: [...matches],
        lastChar: null, lastIdx: null, shift: 1,
        note: `Full match at index ${s}. Shift by 1 to keep scanning for overlapping matches.`,
      });
      s += 1;
      if (s <= n - m) {
        steps.push({
          align: s, cmp: -1, status: 'place', comparisons, matches: [...matches],
          lastChar: null, lastIdx: null, shift: 0,
          note: `Re-align at text[${s}]. Compare right-to-left from pattern[${m - 1}].`,
        });
      }
    } else {
      comparisons++;
      const badChar = text[s + j];
      const lastIdx = table[badChar] === undefined ? -1 : table[badChar];
      const shift = Math.max(1, j - lastIdx);
      const reason = lastIdx === -1
        ? `'${badChar}' is not in the pattern, so jump the whole pattern past it`
        : `'${badChar}' last occurs in pattern at index ${lastIdx}, so slide it under text[${s + j}]`;
      steps.push({
        align: s, cmp: j, status: 'mismatch', comparisons, matches: [...matches],
        lastChar: badChar, lastIdx, shift,
        note: `mismatch text[${s + j}]='${badChar}' vs pattern[${j}]='${pat[j]}'; ${reason} -> shift ${shift}.`,
      });
      s += shift;
      if (s <= n - m) {
        steps.push({
          align: s, cmp: -1, status: 'place', comparisons, matches: [...matches],
          lastChar: null, lastIdx: null, shift: 0,
          note: `Re-align at text[${s}]. Compare right-to-left from pattern[${m - 1}].`,
        });
      }
    }
  }

  steps.push({
    align: Math.min(s, n - m), cmp: -1, status: 'done', comparisons, matches: [...matches],
    lastChar: null, lastIdx: null, shift: 0,
    note: matches.length
      ? `Scan complete in ${comparisons} comparisons. Found ${matches.length} match(es) at index ${matches.join(', ')}.`
      : `Scan complete in ${comparisons} comparisons. Pattern not found in the text.`,
  });

  return { steps, table };
}

function sanitize(raw, fallback) {
  const cleaned = raw.replace(/\s+/g, '').slice(0, 28);
  return cleaned.length ? cleaned : fallback;
}

export default function BoyerMooreBadCharViz() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [pat, setPat] = useState(DEFAULT_PAT);
  const [textDraft, setTextDraft] = useState(DEFAULT_TEXT);
  const [patDraft, setPatDraft] = useState(DEFAULT_PAT);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { steps, table } = useMemo(() => buildSteps(text, pat), [text, pat]);

  const totalSteps = steps.length;
  const current = steps[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

  useEffect(() => {
    if (!isRunning) return;
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

  useEffect(() => {
    return () => {
      if (runTimer.current) clearTimeout(runTimer.current);
    };
  }, []);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const applyDraft = () => {
    const t = sanitize(textDraft, DEFAULT_TEXT);
    const p = sanitize(patDraft, DEFAULT_PAT);
    setIsRunningRaw(false);
    setStep(0);
    setText(t);
    setPat(p);
    setTextDraft(t);
    setPatDraft(p);
  };

  const loadSample = () => {
    setIsRunningRaw(false);
    setStep(0);
    setText(DEFAULT_TEXT);
    setPat(DEFAULT_PAT);
    setTextDraft(DEFAULT_TEXT);
    setPatDraft(DEFAULT_PAT);
  };

  // SVG geometry
  const n = text.length;
  const m = pat.length;
  const CELL = 34;
  const GAP = 3;
  const PAD_X = 24;
  const stride = CELL + GAP;
  const stageW = PAD_X * 2 + Math.max(n, 1) * stride - GAP;

  const idxRowY = 30;
  const textRowY = 48;
  const patRowY = 108;
  const labelX = 6;
  const stageH = patRowY + CELL + 30;

  const cellX = (i) => PAD_X + i * stride;
  const align = current.align;

  const matchSet = useMemo(() => new Set(current.matches), [current.matches]);

  const statusLabel = {
    idle: 'idle',
    place: 'align',
    'match-char': 'chars agree',
    mismatch: 'mismatch',
    'full-match': 'match found',
    done: 'done',
  }[current.status] || current.status;

  // Bad-char table entries sorted by index for stable readout.
  const tableEntries = useMemo(
    () => Object.entries(table).sort((a, b) => a[1] - b[1]),
    [table],
  );

  const showShift =
    (current.status === 'mismatch' || current.status === 'full-match') && current.shift > 0;
  const shiftFromX = current.status === 'mismatch'
    ? cellX(align) + CELL / 2
    : cellX(align) + CELL / 2;
  const shiftToX = cellX(align + current.shift) + CELL / 2;

  return (
    <div className="bmbc">
      <div className="bmbc-head">
        <h3 className="bmbc-title">Boyer-Moore — bad character heuristic</h3>
        <p className="bmbc-sub">
          Compare each alignment right to left. On a mismatch, jump the pattern so its last copy of the
          offending text character lines up — or clear past the character entirely when it never appears.
        </p>
      </div>

      <div className="bmbc-controls">
        <div className="bmbc-field">
          <span className="bmbc-label">text</span>
          <input
            className="bmbc-input"
            type="text"
            value={textDraft}
            spellCheck={false}
            onChange={(e) => setTextDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyDraft(); }}
            aria-label="Text to search"
          />
        </div>
        <div className="bmbc-field">
          <span className="bmbc-label">pattern</span>
          <input
            className="bmbc-input bmbc-input-pat"
            type="text"
            value={patDraft}
            spellCheck={false}
            onChange={(e) => setPatDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyDraft(); }}
            aria-label="Pattern to find"
          />
        </div>
        <button type="button" className="bmbc-btn" onClick={applyDraft}>apply</button>
        <button type="button" className="bmbc-btn" onClick={loadSample}>
          <RefreshCw size={13} /> sample
        </button>

        <div className="bmbc-actions">
          <div className="bmbc-buttons">
            <button
              type="button"
              className="bmbc-btn bmbc-btn-primary"
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
              className="bmbc-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="bmbc-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="bmbc-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="bmbc-speed">
            <span className="bmbc-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bmbc-speed-range"
            />
            <span className="bmbc-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="bmbc-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="bmbc-stage">
        <svg
          viewBox={`0 0 ${stageW} ${stageH}`}
          className="bmbc-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Boyer-Moore bad-character matching stage"
        >
          <text className="bmbc-row-label" x={labelX} y={textRowY + CELL / 2 + 4}>text</text>
          <text className="bmbc-row-label" x={labelX} y={patRowY + CELL / 2 + 4}>pat</text>

          {/* text row */}
          {text.split('').map((ch, i) => {
            const x = cellX(i);
            const inWindow = m > 0 && i >= align && i < align + m;
            const isCompare = current.cmp >= 0 && i === align + current.cmp;
            const isMismatch = isCompare && current.status === 'mismatch';
            const isAgree = isCompare && current.status === 'match-char';
            const isMatchStart = matchSet.has(i);
            const cls = [
              'bmbc-cell',
              inWindow && 'in-window',
              isAgree && 'agree',
              isMismatch && 'mismatch',
              isMatchStart && 'match-found',
            ].filter(Boolean).join(' ');
            return (
              <g key={`t-${i}`}>
                <text className="bmbc-idx" x={x + CELL / 2} y={idxRowY}>{i}</text>
                <rect className={cls} x={x} y={textRowY} width={CELL} height={CELL} rx={5} />
                <text className="bmbc-ch" x={x + CELL / 2} y={textRowY + CELL / 2 + 1}>{ch}</text>
              </g>
            );
          })}

          {/* pattern row, aligned under text[align] */}
          {pat.split('').map((ch, j) => {
            const x = cellX(align + j);
            const isCompare = current.cmp >= 0 && j === current.cmp;
            const isMismatch = isCompare && current.status === 'mismatch';
            const isAgree = isCompare && current.status === 'match-char';
            const isLast = current.status === 'mismatch' && current.lastIdx === j;
            const cls = [
              'bmbc-pcell',
              isAgree && 'agree',
              isMismatch && 'mismatch',
              isLast && 'last-occ',
            ].filter(Boolean).join(' ');
            return (
              <g key={`p-${j}`}>
                <rect className={cls} x={x} y={patRowY} width={CELL} height={CELL} rx={5} />
                <text className="bmbc-ch bmbc-pch" x={x + CELL / 2} y={patRowY + CELL / 2 + 1}>{ch}</text>
                <text className="bmbc-pidx" x={x + CELL / 2} y={patRowY + CELL + 12}>{j}</text>
              </g>
            );
          })}

          {/* shift arrow */}
          {showShift && shiftToX > shiftFromX && (
            <g className="bmbc-shift">
              <line
                className="bmbc-shift-line"
                x1={shiftFromX}
                y1={patRowY - 10}
                x2={shiftToX}
                y2={patRowY - 10}
              />
              <path
                className="bmbc-shift-arrow"
                d={`M ${shiftToX} ${patRowY - 10} L ${shiftToX - 7} ${patRowY - 14} L ${shiftToX - 7} ${patRowY - 6} Z`}
              />
              <text className="bmbc-shift-text" x={(shiftFromX + shiftToX) / 2} y={patRowY - 16}>
                shift {current.shift}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="bmbc-metrics">
        <div className="bmbc-metric">
          <span className="bmbc-metric-label">status</span>
          <span className="bmbc-metric-value">{statusLabel}</span>
        </div>
        <div className="bmbc-metric">
          <span className="bmbc-metric-label">alignment</span>
          <span className="bmbc-metric-value">s = {align}</span>
        </div>
        <div className="bmbc-metric">
          <span className="bmbc-metric-label">comparisons</span>
          <span className="bmbc-metric-value">{current.comparisons}</span>
        </div>
        <div className="bmbc-metric">
          <span className="bmbc-metric-label">matches found</span>
          <span className="bmbc-metric-value">{current.matches.length}</span>
        </div>
        <div className="bmbc-metric bmbc-metric-dim">
          <span className="bmbc-metric-label">match indices</span>
          <span className="bmbc-metric-value bmbc-metric-dimval">
            {current.matches.length ? current.matches.join(', ') : '—'}
          </span>
        </div>
      </div>

      <div className="bmbc-table">
        <span className="bmbc-table-label">bad-char table (char → last index in pattern)</span>
        <div className="bmbc-table-chips">
          {tableEntries.length === 0 && <span className="bmbc-chip-empty">—</span>}
          {tableEntries.map(([ch, idx]) => {
            const isHot = current.status === 'mismatch' && current.lastChar === ch;
            return (
              <span key={ch} className={`bmbc-chip ${isHot ? 'is-hot' : ''}`}>
                <span className="bmbc-chip-key">{ch}</span>
                <span className="bmbc-chip-val">{idx}</span>
              </span>
            );
          })}
          {current.status === 'mismatch' && current.lastIdx === -1 && (
            <span className="bmbc-chip is-hot is-absent">
              <span className="bmbc-chip-key">{current.lastChar}</span>
              <span className="bmbc-chip-val">absent</span>
            </span>
          )}
        </div>
      </div>

      <div className="bmbc-arith">
        <span className="bmbc-arith-label">trace</span>
        <span className="bmbc-arith-vals">{current.note}</span>
      </div>

      <div className="bmbc-legend" aria-hidden="true">
        <span className="bmbc-legend-item"><span className="bmbc-sw in-window" /> current window</span>
        <span className="bmbc-legend-item"><span className="bmbc-sw agree" /> chars agree</span>
        <span className="bmbc-legend-item"><span className="bmbc-sw mismatch" /> mismatch</span>
        <span className="bmbc-legend-item"><span className="bmbc-sw last-occ" /> last occurrence in pattern</span>
        <span className="bmbc-legend-item"><span className="bmbc-sw match-found" /> match start</span>
      </div>
    </div>
  );
}
