import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './SuffixArrayViz.css';

const DEFAULT_TEXT = 'banana';
const TICK_MS = 750;
const MAX_LEN = 12;

const CELL_W = 30;
const CELL_H = 32;
const ROW_GAP = 6;
const PAD_X = 110;
const PAD_TOP = 56;
const PAD_BOTTOM = 28;
const INDEX_W = 46;

function sanitizeInput(raw) {
  if (!raw) return '';
  return raw.replace(/[^A-Za-z0-9]/g, '').toLowerCase().slice(0, MAX_LEN);
}

function buildSuffixes(text) {
  const out = [];
  for (let i = 0; i < text.length; i += 1) {
    out.push({ idx: i, str: text.slice(i) });
  }
  return out;
}

function compareSuffixes(a, b) {
  const len = Math.max(a.length, b.length);
  for (let k = 0; k < len; k += 1) {
    const ca = a.charCodeAt(k);
    const cb = b.charCodeAt(k);
    if (Number.isNaN(ca) && Number.isNaN(cb)) return { cmp: 0, at: k };
    if (Number.isNaN(ca)) return { cmp: -1, at: k };
    if (Number.isNaN(cb)) return { cmp: 1, at: k };
    if (ca < cb) return { cmp: -1, at: k };
    if (ca > cb) return { cmp: 1, at: k };
  }
  return { cmp: 0, at: len };
}

function lcpLength(a, b) {
  const len = Math.min(a.length, b.length);
  let k = 0;
  while (k < len && a[k] === b[k]) k += 1;
  return k;
}

function buildFrames(text) {
  const frames = [];
  if (!text.length) {
    frames.push({
      kind: 'idle',
      order: [],
      compareA: -1,
      compareB: -1,
      compareAt: -1,
      verdict: null,
      pass: 0,
      lcp: [],
      done: true,
      note: 'Enter a non-empty string to build its suffix array.',
    });
    return frames;
  }

  const suffixes = buildSuffixes(text);
  const order = suffixes.slice();
  const n = order.length;

  frames.push({
    kind: 'init',
    order: order.slice(),
    compareA: -1,
    compareB: -1,
    compareAt: -1,
    verdict: null,
    pass: 0,
    lcp: [],
    done: false,
    note: `Build all ${n} suffixes of "${text}". Each row is a starting index paired with the suffix it produces.`,
  });

  // Bubble sort so each comparison is a visible frame.
  for (let pass = 0; pass < n - 1; pass += 1) {
    let swapped = false;
    for (let i = 0; i < n - 1 - pass; i += 1) {
      const a = order[i];
      const b = order[i + 1];
      const { cmp, at } = compareSuffixes(a.str, b.str);

      frames.push({
        kind: 'compare',
        order: order.slice(),
        compareA: i,
        compareB: i + 1,
        compareAt: at,
        verdict: cmp <= 0 ? 'keep' : 'swap',
        pass: pass + 1,
        lcp: [],
        done: false,
        note: cmp <= 0
          ? `Compare "${a.str}" vs "${b.str}". Differ at position ${at} (chars '${a.str[at] ?? '∅'}' vs '${b.str[at] ?? '∅'}') — already in order.`
          : `Compare "${a.str}" vs "${b.str}". Differ at position ${at} (chars '${a.str[at] ?? '∅'}' vs '${b.str[at] ?? '∅'}') — needs swap.`,
      });

      if (cmp > 0) {
        order[i] = b;
        order[i + 1] = a;
        swapped = true;
        frames.push({
          kind: 'swap',
          order: order.slice(),
          compareA: i,
          compareB: i + 1,
          compareAt: at,
          verdict: 'swap',
          pass: pass + 1,
          lcp: [],
          done: false,
          note: `Swap rows ${i} and ${i + 1}. "${b.str}" now precedes "${a.str}".`,
        });
      }
    }
    if (!swapped) break;
  }

  // Final sorted state.
  frames.push({
    kind: 'sorted',
    order: order.slice(),
    compareA: -1,
    compareB: -1,
    compareAt: -1,
    verdict: null,
    pass: 0,
    lcp: [],
    done: false,
    note: `Sorted lexicographically. Suffix array = [${order.map((s) => s.idx).join(', ')}].`,
  });

  // LCP reveal — one entry per frame.
  const lcp = new Array(n).fill(0);
  for (let i = 1; i < n; i += 1) {
    lcp[i] = lcpLength(order[i - 1].str, order[i].str);
    frames.push({
      kind: 'lcp',
      order: order.slice(),
      compareA: i - 1,
      compareB: i,
      compareAt: lcp[i],
      verdict: null,
      pass: 0,
      lcp: lcp.slice(),
      lcpUpTo: i,
      done: false,
      note: `LCP("${order[i - 1].str}", "${order[i].str}") = ${lcp[i]}. Shared prefix of length ${lcp[i]} between adjacent sorted suffixes.`,
    });
  }

  frames.push({
    kind: 'done',
    order: order.slice(),
    compareA: -1,
    compareB: -1,
    compareAt: -1,
    verdict: null,
    pass: 0,
    lcp: lcp.slice(),
    lcpUpTo: n - 1,
    done: true,
    note: `Suffix array complete. SA = [${order.map((s) => s.idx).join(', ')}]. LCP = [${lcp.map((v) => v).join(', ')}].`,
  });

  return frames;
}

export default function SuffixArrayViz() {
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const text = useMemo(() => sanitizeInput(textInput), [textInput]);
  const frames = useMemo(() => buildFrames(text), [text]);

  const [step, setStep] = useState(0);
  const [runningRaw, setRunning] = useState(false);
  const timerRef = useRef(null);

  const [prevText, setPrevText] = useState(text);
  if (prevText !== text) {
    setPrevText(text);
    setStep(0);
    setRunning(false);
  }

  // Derive `running` so the effect never has to call setRunning(false) when we
  // hit the last frame — avoids cascading-render.
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
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, frames.length]);

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

  const handleSort = useCallback(() => {
    // Jump animation back to start and begin running.
    setStep(0);
    setRunning(true);
  }, []);

  const frame = frames[step] ?? {
    kind: 'idle',
    order: [],
    compareA: -1,
    compareB: -1,
    compareAt: -1,
    verdict: null,
    pass: 0,
    lcp: [],
    done: false,
    note: '',
  };
  const totalSteps = Math.max(frames.length, 1);

  const n = Math.max(text.length, 1);
  const widthSvg = PAD_X + INDEX_W + n * CELL_W + 40;
  const heightSvg = PAD_TOP + n * (CELL_H + ROW_GAP) + PAD_BOTTOM;

  const rowY = (i) => PAD_TOP + i * (CELL_H + ROW_GAP);
  const cellX = (k) => PAD_X + INDEX_W + k * CELL_W;

  const captionClass = (() => {
    if (frame.kind === 'compare' && frame.verdict === 'swap') return 'sa-viz-narration sa-narr-swap';
    if (frame.kind === 'swap') return 'sa-viz-narration sa-narr-swap';
    if (frame.kind === 'compare' && frame.verdict === 'keep') return 'sa-viz-narration sa-narr-keep';
    if (frame.kind === 'sorted' || frame.kind === 'done') return 'sa-viz-narration sa-narr-done';
    if (frame.kind === 'lcp') return 'sa-viz-narration sa-narr-lcp';
    return 'sa-viz-narration';
  })();

  const sortedShown = frame.kind === 'sorted' || frame.kind === 'lcp' || frame.kind === 'done';
  const lcpShown = frame.kind === 'lcp' || frame.kind === 'done';

  const compareSet = new Set();
  if (frame.compareA >= 0) compareSet.add(frame.compareA);
  if (frame.compareB >= 0) compareSet.add(frame.compareB);

  return (
    <div className="sa-viz" role="region" aria-label="Suffix array construction visualization">
      <header className="sa-viz-head">
        <h3 className="sa-viz-title">Suffix Array Construction</h3>
        <p className="sa-viz-sub">
          Every suffix of the input listed, then sorted lexicographically. The starting indices in sorted order form the
          suffix array; the LCP array records the longest common prefix between adjacent sorted suffixes.
        </p>
      </header>

      <div className="sa-viz-controls">
        <label className="sa-viz-field">
          <span className="sa-viz-label">String</span>
          <input
            className="sa-viz-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. banana"
            spellCheck={false}
            maxLength={MAX_LEN}
          />
        </label>
        <button
          type="button"
          className="sa-viz-btn sa-viz-btn-primary sa-viz-btn-sort"
          onClick={handleSort}
          disabled={!text.length}
        >
          Sort
        </button>
      </div>

      <div className="sa-viz-metrics">
        <div className="sa-viz-metric">
          <span className="sa-viz-metric-label">Length n</span>
          <span className="sa-viz-metric-value">{text.length}</span>
        </div>
        <div className="sa-viz-metric">
          <span className="sa-viz-metric-label">Pass</span>
          <span className="sa-viz-metric-value">{frame.pass || 0}</span>
        </div>
        <div className="sa-viz-metric sa-viz-metric-accent">
          <span className="sa-viz-metric-label">Phase</span>
          <span className="sa-viz-metric-value sa-viz-metric-phase">
            {frame.kind === 'init' && 'Build'}
            {frame.kind === 'compare' && 'Compare'}
            {frame.kind === 'swap' && 'Swap'}
            {frame.kind === 'sorted' && 'Sorted'}
            {frame.kind === 'lcp' && 'LCP'}
            {frame.kind === 'done' && 'Done'}
            {frame.kind === 'idle' && 'Idle'}
          </span>
        </div>
        <div className="sa-viz-metric">
          <span className="sa-viz-metric-label">Step</span>
          <span className="sa-viz-metric-value">
            {step + 1}
            <span className="sa-viz-metric-dim"> / {totalSteps}</span>
          </span>
        </div>
      </div>

      <div className="sa-viz-stage">
        <svg
          className="sa-viz-svg"
          viewBox={`0 0 ${widthSvg} ${heightSvg}`}
          width="100%"
          role="img"
          aria-label={`Suffix array of ${text || 'empty'}: ${frame.order.length} rows`}
        >
          <defs>
            <linearGradient id="sa-row-grad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.06)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0)" />
            </linearGradient>
          </defs>

          <text x={PAD_X - 8} y={PAD_TOP - 18} className="sa-viz-row-label" textAnchor="end">
            i
          </text>
          <text x={PAD_X + INDEX_W - 2} y={PAD_TOP - 18} className="sa-viz-row-label" textAnchor="end">
            suffix[i]
          </text>
          <text x={cellX(0)} y={PAD_TOP - 18} className="sa-viz-row-label">
            characters
          </text>

          {frame.order.map((row, i) => {
            const inCompare = compareSet.has(i);
            const isA = frame.compareA === i;
            const isB = frame.compareB === i;
            const isSwap = (frame.kind === 'swap') && inCompare;
            const cls = [
              'sa-viz-row',
              inCompare ? 'sa-row-compare' : '',
              isSwap ? 'sa-row-swap' : '',
              isA ? 'sa-row-a' : '',
              isB ? 'sa-row-b' : '',
            ].filter(Boolean).join(' ');

            return (
              <g key={`row-${row.idx}`} className={cls} transform={`translate(0, ${rowY(i)})`}>
                <rect
                  x={PAD_X - 6}
                  y={-2}
                  width={INDEX_W + n * CELL_W + 12}
                  height={CELL_H + 4}
                  rx={6}
                  ry={6}
                  className="sa-viz-row-bg"
                />

                <text
                  x={PAD_X + 8}
                  y={CELL_H / 2 + 5}
                  className="sa-viz-pos-index"
                  textAnchor="start"
                >
                  {i}
                </text>

                <text
                  x={PAD_X + INDEX_W - 6}
                  y={CELL_H / 2 + 5}
                  className="sa-viz-orig-index"
                  textAnchor="end"
                >
                  {row.idx}
                </text>

                {Array.from(row.str).map((ch, k) => {
                  const highlight =
                    inCompare && k === frame.compareAt && frame.compareAt >= 0 && k < row.str.length;
                  const prefixShared =
                    frame.kind === 'lcp' &&
                    i === frame.compareB &&
                    k < (frame.lcp[i] ?? 0);
                  const prevPrefixShared =
                    frame.kind === 'lcp' &&
                    i === frame.compareA &&
                    k < (frame.lcp[frame.compareB] ?? 0);
                  const cellCls = [
                    'sa-viz-cell',
                    highlight ? 'sa-cell-diff' : '',
                    (prefixShared || prevPrefixShared) ? 'sa-cell-lcp' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <g key={`c-${k}`} className={cellCls}>
                      <rect
                        x={cellX(k)}
                        y={2}
                        width={CELL_W - 2}
                        height={CELL_H - 4}
                        rx={4}
                        ry={4}
                        className="sa-viz-cell-rect"
                      />
                      <text
                        x={cellX(k) + (CELL_W - 2) / 2}
                        y={CELL_H / 2 + 5}
                        textAnchor="middle"
                        className="sa-viz-cell-value"
                      >
                        {ch}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={captionClass} aria-live="polite">
        {frame.note}
      </div>

      {sortedShown && (
        <div className="sa-viz-arrays">
          <div className="sa-viz-array">
            <div className="sa-viz-array-label">Suffix Array (SA)</div>
            <div className="sa-viz-array-row">
              {frame.order.map((row, i) => (
                <div key={`sa-${i}`} className="sa-viz-array-cell sa-viz-array-cell-sa">
                  <span className="sa-viz-array-cell-top">{i}</span>
                  <span className="sa-viz-array-cell-val">{row.idx}</span>
                </div>
              ))}
            </div>
          </div>

          {lcpShown && (
            <div className="sa-viz-array">
              <div className="sa-viz-array-label">LCP Array</div>
              <div className="sa-viz-array-row">
                {frame.order.map((_, i) => {
                  const known = i <= (frame.lcpUpTo ?? 0);
                  return (
                    <div
                      key={`lcp-${i}`}
                      className={`sa-viz-array-cell sa-viz-array-cell-lcp ${known ? 'sa-viz-array-cell-known' : 'sa-viz-array-cell-pending'}`}
                    >
                      <span className="sa-viz-array-cell-top">{i}</span>
                      <span className="sa-viz-array-cell-val">{known ? (frame.lcp[i] ?? 0) : '·'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="sa-viz-actions">
        <button type="button" className="sa-viz-btn" onClick={handleStep} disabled={step >= frames.length - 1}>
          Step
        </button>
        {running ? (
          <button type="button" className="sa-viz-btn sa-viz-btn-primary" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className="sa-viz-btn sa-viz-btn-primary"
            onClick={handleRun}
            disabled={frames.length === 0}
          >
            {step >= frames.length - 1 ? 'Replay' : 'Run'}
          </button>
        )}
        <button type="button" className="sa-viz-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
