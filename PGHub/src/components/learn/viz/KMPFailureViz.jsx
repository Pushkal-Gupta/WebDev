import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, ChevronRight, SkipForward, RotateCcw, RefreshCw } from 'lucide-react';
import './KMPFailureViz.css';

// Knuth-Morris-Pratt: the prefix function (failure / LPS table) and the search.
//
// Phase 1 ("Build LPS"): two pointers run over the pattern. `len` tracks the
// length of the longest proper prefix that is also a suffix ending at i-1; `i`
// scans forward. On a match p[i]==p[len] both advance and lps[i]=len. On a
// mismatch with len>0 we fall back len = lps[len-1] (the next-best border) WITHOUT
// moving i. With len==0 we record lps[i]=0 and advance i.
//
// Phase 2 ("Search"): slide the pattern over the text. On a mismatch after some
// matched chars we jump the pattern by lps[j-1] instead of restarting at 0.
// Theme tokens only, no inner scroll, SVG reflows via viewBox.

const DEFAULT_PAT = 'ababaca';
const DEFAULT_TEXT = 'abababacaababacaba';

function buildLpsSteps(pat) {
  const steps = [];
  const m = pat.length;
  const lps = new Array(m).fill(0);

  if (m === 0) {
    steps.push({
      phase: 'build', lps: [], i: 0, len: 0, cmp: null, status: 'idle', matchAt: -1,
      note: 'Empty pattern — nothing to build.',
    });
    return { steps, lps };
  }

  lps[0] = 0;
  steps.push({
    phase: 'build', lps: [...lps], i: 1, len: 0, cmp: null, status: 'seed', matchAt: -1,
    note: `lps[0] = 0 always — a single char has no proper prefix that is also a suffix. Start i=1, len=0.`,
  });

  let i = 1;
  let len = 0;
  while (i < m) {
    if (pat[i] === pat[len]) {
      len += 1;
      lps[i] = len;
      steps.push({
        phase: 'build', lps: [...lps], i, len, cmp: [i, len - 1], status: 'match', matchAt: -1,
        note: `p[${i}]='${pat[i]}' == p[${len - 1}]='${pat[len - 1]}' — extend the border. lps[${i}] = len = ${len}. Advance i.`,
      });
      i += 1;
    } else if (len > 0) {
      const prev = len;
      len = lps[len - 1];
      steps.push({
        phase: 'build', lps: [...lps], i, len, cmp: [i, prev], status: 'fallback', matchAt: -1,
        note: `p[${i}]='${pat[i]}' != p[${prev}]='${pat[prev]}'; fall back len = lps[${prev - 1}] = ${len}. Keep i fixed and retry.`,
      });
    } else {
      lps[i] = 0;
      steps.push({
        phase: 'build', lps: [...lps], i, len: 0, cmp: [i, 0], status: 'zero', matchAt: -1,
        note: `p[${i}]='${pat[i]}' != p[0]='${pat[0]}' and len=0 — no border. lps[${i}] = 0. Advance i.`,
      });
      i += 1;
    }
  }

  steps.push({
    phase: 'build', lps: [...lps], i: m, len, cmp: null, status: 'built', matchAt: -1,
    note: `LPS table complete: [${lps.join(', ')}]. Each lps[k] is the longest proper prefix of p[0..k] that is also a suffix.`,
  });

  return { steps, lps };
}

function buildSearchSteps(text, pat, lps) {
  const steps = [];
  const n = text.length;
  const m = pat.length;
  const matches = [];

  if (m === 0 || n === 0 || m > n) {
    steps.push({
      phase: 'search', i: 0, j: 0, cmp: null, status: 'idle', matches: [], align: 0,
      note: m === 0 ? 'Empty pattern — nothing to search.'
        : m > n ? `Pattern (length ${m}) longer than text (length ${n}) — no match possible.`
          : 'Empty text — nothing to scan.',
    });
    return steps;
  }

  steps.push({
    phase: 'search', i: 0, j: 0, cmp: null, status: 'place', matches: [], align: 0,
    note: `Slide the pattern under the text. i scans text, j scans pattern. Compare text[0] with p[0].`,
  });

  let i = 0;
  let j = 0;
  while (i < n) {
    if (text[i] === pat[j]) {
      steps.push({
        phase: 'search', i, j, cmp: [i, j], status: 'match', matches: [...matches], align: i - j,
        note: `text[${i}]='${text[i]}' == p[${j}]='${pat[j]}' — chars agree. Advance both.`,
      });
      i += 1;
      j += 1;
      if (j === m) {
        const at = i - j;
        matches.push(at);
        const next = lps[j - 1];
        steps.push({
          phase: 'search', i, j: next, cmp: null, status: 'full-match', matches: [...matches], align: at,
          note: `Full match at index ${at}. Jump j = lps[${j - 1}] = ${next} to keep scanning without rewinding i.`,
        });
        j = next;
      }
    } else if (j > 0) {
      const prev = j;
      j = lps[j - 1];
      steps.push({
        phase: 'search', i, j, cmp: [i, prev], status: 'fallback', matches: [...matches], align: i - j,
        note: `text[${i}]='${text[i]}' != p[${prev}]='${pat[prev]}'; jump j = lps[${prev - 1}] = ${j}. i stays put — no backtracking.`,
      });
    } else {
      steps.push({
        phase: 'search', i, j: 0, cmp: [i, 0], status: 'zero', matches: [...matches], align: i,
        note: `text[${i}]='${text[i]}' != p[0]='${pat[0]}' and j=0 — slide the pattern one step right.`,
      });
      i += 1;
    }
  }

  steps.push({
    phase: 'search', i: n, j, cmp: null, status: 'done', matches: [...matches], align: Math.min(i - j, n - m),
    note: matches.length
      ? `Scan complete. Found ${matches.length} match(es) at index ${matches.join(', ')} — i never moved backward.`
      : `Scan complete. Pattern not found in the text.`,
  });

  return steps;
}

function sanitize(raw, fallback) {
  const cleaned = raw.replace(/\s+/g, '').slice(0, 24);
  return cleaned.length ? cleaned : fallback;
}

export default function KMPFailureViz() {
  const [mode, setMode] = useState('build'); // 'build' | 'search'
  const [text, setText] = useState(DEFAULT_TEXT);
  const [pat, setPat] = useState(DEFAULT_PAT);
  const [textDraft, setTextDraft] = useState(DEFAULT_TEXT);
  const [patDraft, setPatDraft] = useState(DEFAULT_PAT);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { steps: buildSteps, lps } = useMemo(() => buildLpsSteps(pat), [pat]);
  const searchSteps = useMemo(() => buildSearchSteps(text, pat, lps), [text, pat, lps]);

  const steps = mode === 'build' ? buildSteps : searchSteps;
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

  const switchMode = (next) => {
    if (next === mode) return;
    setIsRunningRaw(false);
    setStep(0);
    setMode(next);
  };

  const applyDraft = () => {
    const p = sanitize(patDraft, DEFAULT_PAT);
    const t = sanitize(textDraft, DEFAULT_TEXT);
    setIsRunningRaw(false);
    setStep(0);
    setPat(p);
    setText(t);
    setPatDraft(p);
    setTextDraft(t);
  };

  const loadSample = () => {
    setIsRunningRaw(false);
    setStep(0);
    setPat(DEFAULT_PAT);
    setText(DEFAULT_TEXT);
    setPatDraft(DEFAULT_PAT);
    setTextDraft(DEFAULT_TEXT);
  };

  // ---- SVG geometry ----
  const m = pat.length;
  const n = text.length;
  const CELL = 34;
  const GAP = 4;
  const PAD_X = 26;
  const stride = CELL + GAP;
  const cols = mode === 'build' ? Math.max(m, 1) : Math.max(n, 1);
  const stageW = PAD_X * 2 + cols * stride - GAP + 8;

  const cellX = (k) => PAD_X + k * stride;

  // Live LPS array for the readout (frozen result for search mode).
  const liveLps = mode === 'build' ? current.lps : lps;

  const statusLabel = {
    idle: 'idle', seed: 'seed', match: 'chars agree', fallback: 'fall back',
    zero: 'no border', built: 'table ready', place: 'align',
    'full-match': 'match found', done: 'done',
  }[current.status] || current.status;

  const matchSet = useMemo(
    () => new Set(mode === 'search' ? (current.matches || []) : []),
    [mode, current.matches],
  );

  // ---- BUILD-mode rendering ----
  const buildRowYIdx = 24;
  const buildPatY = 36;
  const buildLpsY = 96;
  const buildPtrY = buildPatY + CELL + 30;
  const buildStageH = buildPtrY + 30;

  // ---- SEARCH-mode rendering ----
  const searchIdxY = 24;
  const searchTextY = 38;
  const searchPatY = 104;
  const searchStageH = searchPatY + CELL + 34;

  const stageH = mode === 'build' ? buildStageH : searchStageH;

  // Fallback arrow (build mode): from old len to new len along the lps row.
  const showBuildFallback = mode === 'build' && current.status === 'fallback' && current.cmp;
  const fbFromX = showBuildFallback ? cellX(current.cmp[1] - 1) + CELL / 2 : 0;
  const fbToX = showBuildFallback ? cellX(current.len - 1) + CELL / 2 : 0;

  // Jump arrow (search mode): how far the pattern's left edge moves on fallback.
  const showSearchJump = mode === 'search' && current.status === 'fallback';

  return (
    <div className="kmpf">
      <div className="kmpf-head">
        <h3 className="kmpf-title">KMP — the failure function (LPS table)</h3>
        <p className="kmpf-sub">
          Build the longest-prefix-also-suffix table for a pattern, then use it to search a text without ever
          rewinding the text pointer. On a mismatch the pattern jumps by the precomputed border instead of restarting.
        </p>
      </div>

      <div className="kmpf-modes">
        <button
          type="button"
          className={`kmpf-mode ${mode === 'build' ? 'is-active' : ''}`}
          onClick={() => switchMode('build')}
        >
          1 · Build LPS table
        </button>
        <button
          type="button"
          className={`kmpf-mode ${mode === 'search' ? 'is-active' : ''}`}
          onClick={() => switchMode('search')}
        >
          2 · Search with LPS
        </button>
      </div>

      <div className="kmpf-controls">
        <div className="kmpf-field">
          <span className="kmpf-label">pattern</span>
          <input
            className="kmpf-input kmpf-input-pat"
            type="text"
            value={patDraft}
            spellCheck={false}
            onChange={(e) => setPatDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyDraft(); }}
            aria-label="Pattern"
          />
        </div>
        {mode === 'search' && (
          <div className="kmpf-field">
            <span className="kmpf-label">text</span>
            <input
              className="kmpf-input"
              type="text"
              value={textDraft}
              spellCheck={false}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyDraft(); }}
              aria-label="Text to search"
            />
          </div>
        )}
        <button type="button" className="kmpf-btn" onClick={applyDraft}>apply</button>
        <button type="button" className="kmpf-btn" onClick={loadSample}>
          <RefreshCw size={13} /> sample
        </button>

        <div className="kmpf-actions">
          <div className="kmpf-buttons">
            <button
              type="button"
              className="kmpf-btn kmpf-btn-primary"
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
              className="kmpf-btn"
              onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="kmpf-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="kmpf-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="kmpf-speed">
            <span className="kmpf-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="kmpf-speed-range"
            />
            <span className="kmpf-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="kmpf-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="kmpf-stage">
        <svg
          viewBox={`0 0 ${stageW} ${stageH}`}
          className="kmpf-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={mode === 'build' ? 'LPS table build stage' : 'KMP search stage'}
        >
          {mode === 'build' && (
            <>
              <text className="kmpf-row-label" x={6} y={buildPatY + CELL / 2 + 4}>p[]</text>
              <text className="kmpf-row-label" x={6} y={buildLpsY + CELL / 2 + 4}>lps</text>

              {pat.split('').map((ch, k) => {
                const x = cellX(k);
                const isCmpI = current.cmp && k === current.cmp[0];
                const isCmpLen = current.cmp && k === current.cmp[1];
                const isMatch = current.status === 'match' && (isCmpI || isCmpLen);
                const isMis = (current.status === 'fallback' || current.status === 'zero') && isCmpI;
                const cls = [
                  'kmpf-cell',
                  isMatch && 'agree',
                  isMis && 'mismatch',
                ].filter(Boolean).join(' ');
                return (
                  <g key={`p-${k}`}>
                    <text className="kmpf-idx" x={x + CELL / 2} y={buildRowYIdx}>{k}</text>
                    <rect className={cls} x={x} y={buildPatY} width={CELL} height={CELL} rx={5} />
                    <text className="kmpf-ch" x={x + CELL / 2} y={buildPatY + CELL / 2 + 1}>{ch}</text>
                    {/* lps row */}
                    <rect
                      className={`kmpf-lcell ${k < current.i ? 'filled' : ''} ${k === current.i && current.status === 'match' ? 'just-set' : ''} ${k === current.i && current.status === 'zero' ? 'just-set' : ''}`}
                      x={x}
                      y={buildLpsY}
                      width={CELL}
                      height={CELL}
                      rx={5}
                    />
                    <text className="kmpf-lval" x={x + CELL / 2} y={buildLpsY + CELL / 2 + 1}>
                      {k < current.i || (k === current.i && (current.status === 'match' || current.status === 'zero'))
                        ? current.lps[k]
                        : '·'}
                    </text>
                  </g>
                );
              })}

              {/* i pointer */}
              {current.i < m && (
                <g className="kmpf-ptr">
                  <path
                    className="kmpf-ptr-i"
                    d={`M ${cellX(current.i) + CELL / 2} ${buildPtrY - 4} l -5 -7 l 10 0 z`}
                  />
                  <text className="kmpf-ptr-label kmpf-ptr-label-i" x={cellX(current.i) + CELL / 2} y={buildPtrY + 10}>
                    i={current.i}
                  </text>
                </g>
              )}
              {/* len pointer */}
              {current.len > 0 && current.len <= m && current.status !== 'built' && (
                <g className="kmpf-ptr">
                  <path
                    className="kmpf-ptr-len"
                    d={`M ${cellX(current.len) + CELL / 2} ${buildPatY - 4} l -5 -7 l 10 0 z`}
                  />
                  <text className="kmpf-ptr-label kmpf-ptr-label-len" x={cellX(current.len) + CELL / 2} y={buildPatY - 14}>
                    len={current.len}
                  </text>
                </g>
              )}

              {/* fallback arrow on the lps row */}
              {showBuildFallback && fbFromX !== fbToX && (
                <g className="kmpf-fb">
                  <line className="kmpf-fb-line" x1={fbFromX} y1={buildLpsY + CELL + 14} x2={fbToX} y2={buildLpsY + CELL + 14} />
                  <path
                    className="kmpf-fb-arrow"
                    d={`M ${fbToX} ${buildLpsY + CELL + 14} l 7 -4 l 0 8 z`}
                  />
                  <text className="kmpf-fb-text" x={(fbFromX + fbToX) / 2} y={buildLpsY + CELL + 28}>
                    len = lps[{current.cmp[1] - 1}] = {current.len}
                  </text>
                </g>
              )}
            </>
          )}

          {mode === 'search' && (
            <>
              <text className="kmpf-row-label" x={6} y={searchTextY + CELL / 2 + 4}>txt</text>
              <text className="kmpf-row-label" x={6} y={searchPatY + CELL / 2 + 4}>pat</text>

              {/* text row */}
              {text.split('').map((ch, k) => {
                const x = cellX(k);
                const inWindow = m > 0 && k >= current.align && k < current.align + m;
                const isCmp = current.cmp && k === current.cmp[0];
                const isAgree = isCmp && current.status === 'match';
                const isMis = isCmp && (current.status === 'fallback' || current.status === 'zero');
                const isMatchStart = matchSet.has(k);
                const cls = [
                  'kmpf-cell',
                  inWindow && 'in-window',
                  isAgree && 'agree',
                  isMis && 'mismatch',
                  isMatchStart && 'match-found',
                ].filter(Boolean).join(' ');
                return (
                  <g key={`t-${k}`}>
                    <text className="kmpf-idx" x={x + CELL / 2} y={searchIdxY}>{k}</text>
                    <rect className={cls} x={x} y={searchTextY} width={CELL} height={CELL} rx={5} />
                    <text className="kmpf-ch" x={x + CELL / 2} y={searchTextY + CELL / 2 + 1}>{ch}</text>
                  </g>
                );
              })}

              {/* pattern row aligned under text[align] */}
              {pat.split('').map((ch, jdx) => {
                const x = cellX(current.align + jdx);
                const isCur = current.cmp && jdx === current.cmp[1];
                const isAgree = isCur && current.status === 'match';
                const isMis = isCur && (current.status === 'fallback' || current.status === 'zero');
                const matched = jdx < current.j;
                const cls = [
                  'kmpf-pcell',
                  matched && 'matched',
                  isAgree && 'agree',
                  isMis && 'mismatch',
                ].filter(Boolean).join(' ');
                return (
                  <g key={`sp-${jdx}`}>
                    <rect className={cls} x={x} y={searchPatY} width={CELL} height={CELL} rx={5} />
                    <text className="kmpf-ch kmpf-pch" x={x + CELL / 2} y={searchPatY + CELL / 2 + 1}>{ch}</text>
                    <text className="kmpf-pidx" x={x + CELL / 2} y={searchPatY + CELL + 12}>{jdx}</text>
                  </g>
                );
              })}

              {/* jump caption */}
              {showSearchJump && (
                <text className="kmpf-jump-text" x={cellX(current.align) + CELL / 2} y={searchPatY - 12}>
                  jump j -&gt; {current.j}
                </text>
              )}
            </>
          )}
        </svg>
      </div>

      <div className="kmpf-lpsbar">
        <span className="kmpf-lpsbar-label">lps[]</span>
        <div className="kmpf-lpsbar-chips">
          {liveLps.length === 0 && <span className="kmpf-chip-empty">—</span>}
          {pat.split('').map((ch, k) => {
            const known = mode === 'search' || k < current.i
              || (k === current.i && (current.status === 'match' || current.status === 'zero'));
            const isHot = mode === 'build' && k === current.i
              && (current.status === 'match' || current.status === 'zero');
            return (
              <span key={`lp-${k}`} className={`kmpf-chip ${isHot ? 'is-hot' : ''}`}>
                <span className="kmpf-chip-key">{ch}</span>
                <span className="kmpf-chip-val">{known ? liveLps[k] : '·'}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="kmpf-metrics">
        <div className="kmpf-metric">
          <span className="kmpf-metric-label">status</span>
          <span className="kmpf-metric-value">{statusLabel}</span>
        </div>
        {mode === 'build' ? (
          <>
            <div className="kmpf-metric">
              <span className="kmpf-metric-label">i (scan)</span>
              <span className="kmpf-metric-value">{Math.min(current.i, m)}</span>
            </div>
            <div className="kmpf-metric">
              <span className="kmpf-metric-label">len (border)</span>
              <span className="kmpf-metric-value">{current.len}</span>
            </div>
            <div className="kmpf-metric kmpf-metric-dim">
              <span className="kmpf-metric-label">cells filled</span>
              <span className="kmpf-metric-value kmpf-metric-dimval">
                {Math.min(current.status === 'built' ? m : current.i + (current.status === 'match' || current.status === 'zero' ? 1 : 0), m)} / {m}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="kmpf-metric">
              <span className="kmpf-metric-label">i (text)</span>
              <span className="kmpf-metric-value">{Math.min(current.i, n)}</span>
            </div>
            <div className="kmpf-metric">
              <span className="kmpf-metric-label">j (pattern)</span>
              <span className="kmpf-metric-value">{current.j}</span>
            </div>
            <div className="kmpf-metric">
              <span className="kmpf-metric-label">matches</span>
              <span className="kmpf-metric-value">{(current.matches || []).length}</span>
            </div>
            <div className="kmpf-metric kmpf-metric-dim">
              <span className="kmpf-metric-label">match indices</span>
              <span className="kmpf-metric-value kmpf-metric-dimval">
                {(current.matches || []).length ? current.matches.join(', ') : '—'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="kmpf-arith">
        <span className="kmpf-arith-label">trace</span>
        <span className="kmpf-arith-vals">{current.note}</span>
      </div>

      <div className="kmpf-legend" aria-hidden="true">
        {mode === 'build' ? (
          <>
            <span className="kmpf-legend-item"><span className="kmpf-sw agree" /> p[i] == p[len] (extend)</span>
            <span className="kmpf-legend-item"><span className="kmpf-sw mismatch" /> mismatch (fall back / zero)</span>
            <span className="kmpf-legend-item"><span className="kmpf-sw filled" /> lps cell written</span>
          </>
        ) : (
          <>
            <span className="kmpf-legend-item"><span className="kmpf-sw in-window" /> pattern window</span>
            <span className="kmpf-legend-item"><span className="kmpf-sw agree" /> chars agree</span>
            <span className="kmpf-legend-item"><span className="kmpf-sw mismatch" /> mismatch (jump by lps)</span>
            <span className="kmpf-legend-item"><span className="kmpf-sw match-found" /> match start</span>
          </>
        )}
      </div>
    </div>
  );
}
