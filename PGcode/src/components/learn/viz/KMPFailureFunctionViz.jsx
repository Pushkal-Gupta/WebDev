import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './KMPFailureFunctionViz.css';

const DEFAULT_PATTERN = 'ABABCABAB';
const DEFAULT_TEXT = 'ABABCABABCABAB';

function buildLpsFrames(pattern) {
  const n = pattern.length;
  const lps = new Array(n).fill(0);
  const frames = [];

  frames.push({
    phase: 'init',
    i: 1,
    len: 0,
    lps: [...lps],
    cmpA: -1,
    cmpB: -1,
    note: `Start: lps[0] = 0 (a single char has no proper prefix). Set i = 1, len = 0.`,
  });

  let i = 1;
  let len = 0;
  while (i < n) {
    frames.push({
      phase: 'compare',
      i, len,
      lps: [...lps],
      cmpA: len,
      cmpB: i,
      note: `Compare pattern[len=${len}]='${pattern[len]}' with pattern[i=${i}]='${pattern[i]}'.`,
    });
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      frames.push({
        phase: 'match',
        i, len,
        lps: [...lps],
        cmpA: len - 1,
        cmpB: i,
        note: `Match. Extend prefix length: len = ${len}. Write lps[${i}] = ${len}.`,
      });
      i++;
    } else {
      if (len !== 0) {
        const prev = len;
        len = lps[len - 1];
        frames.push({
          phase: 'fallback',
          i, len,
          lps: [...lps],
          cmpA: -1,
          cmpB: i,
          note: `Mismatch. Fall back: len = lps[${prev - 1}] = ${len}. Stay at i = ${i} and re-compare.`,
        });
      } else {
        lps[i] = 0;
        frames.push({
          phase: 'zero',
          i, len: 0,
          lps: [...lps],
          cmpA: -1,
          cmpB: i,
          note: `Mismatch with len = 0. No prefix matches. lps[${i}] = 0.`,
        });
        i++;
      }
    }
  }

  frames.push({
    phase: 'done',
    i: n,
    len,
    lps: [...lps],
    cmpA: -1,
    cmpB: -1,
    note: `Failure array built: [${lps.join(', ')}].`,
  });

  return { frames, lps };
}

function buildSearchFrames(text, pattern, lps) {
  const n = text.length;
  const m = pattern.length;
  const frames = [];
  const matches = [];

  frames.push({
    phase: 'init',
    i: 0,
    j: 0,
    matches: [],
    cmpText: -1,
    cmpPat: -1,
    note: `Search starts. Align pattern at text index 0. Use the failure array to skip — no backtracking on text.`,
  });

  let i = 0;
  let j = 0;
  while (i < n) {
    frames.push({
      phase: 'compare',
      i, j,
      matches: [...matches],
      cmpText: i,
      cmpPat: j,
      note: `Compare text[${i}]='${text[i]}' with pattern[${j}]='${pattern[j]}'.`,
    });
    if (text[i] === pattern[j]) {
      i++;
      j++;
      if (j === m) {
        matches.push(i - j);
        frames.push({
          phase: 'found',
          i, j,
          matches: [...matches],
          cmpText: -1,
          cmpPat: -1,
          note: `Pattern found at text index ${i - j}. Slide via failure: j = lps[${j - 1}] = ${lps[j - 1]}.`,
        });
        j = lps[j - 1];
      }
    } else if (j !== 0) {
      const prevJ = j;
      j = lps[j - 1];
      frames.push({
        phase: 'skip',
        i, j,
        matches: [...matches],
        cmpText: i,
        cmpPat: -1,
        note: `Mismatch at j = ${prevJ}. Skip via failure: j = lps[${prevJ - 1}] = ${j}. Text pointer stays at ${i}.`,
      });
    } else {
      frames.push({
        phase: 'advance',
        i: i + 1, j: 0,
        matches: [...matches],
        cmpText: -1,
        cmpPat: -1,
        note: `Mismatch with j = 0. Advance text pointer: i = ${i + 1}.`,
      });
      i++;
    }
  }

  frames.push({
    phase: 'done',
    i, j,
    matches: [...matches],
    cmpText: -1,
    cmpPat: -1,
    note: matches.length
      ? `Done. Found ${matches.length} occurrence(s) at indices [${matches.join(', ')}].`
      : `Done. No occurrences of the pattern in the text.`,
  });

  return frames;
}

export default function KMPFailureFunctionViz() {
  const [mode, setMode] = useState('build');
  const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const [pattern, setPattern] = useState(DEFAULT_PATTERN);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames: buildFrames, lps } = useMemo(() => buildLpsFrames(pattern), [pattern]);
  const searchFrames = useMemo(() => buildSearchFrames(text, pattern, lps), [text, pattern, lps]);

  const frames = mode === 'build' ? buildFrames : searchFrames;
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s2) => Math.min(s2 + 1, totalSteps - 1));
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

  const applyMode = (next) => {
    if (next === mode) return;
    reset();
    setMode(next);
  };

  const apply = () => {
    const p = patternInput.trim();
    const t = textInput.trim();
    if (!p) return;
    reset();
    if (p !== pattern) setPattern(p);
    if (t !== text) setText(t);
  };

  const m = pattern.length;
  const n = text.length;

  if (mode === 'build') {
    const cellW = Math.min(44, Math.max(26, 620 / Math.max(m, 6)));
    const padX = 36;
    const rowY = 64;
    const lpsRowY = rowY + cellW + 22;
    const W = padX * 2 + cellW * m;
    const H = lpsRowY + cellW + 70;

    return (
      <div className="kmpv">
        <div className="kmpv-head">
          <h3 className="kmpv-title">KMP — building the failure (LPS) array</h3>
          <p className="kmpv-sub">
            lps[i] is the length of the longest proper prefix of pattern[0..i] that is also a suffix.
            Maintain a pointer len; on mismatch fall back via lps[len − 1] instead of restarting.
          </p>
        </div>

        <div className="kmpv-controls">
          <div className="kmpv-tabs">
            <button type="button" className={`kmpv-tab ${mode === 'build' ? 'kmpv-tab-active' : ''}`} onClick={() => applyMode('build')}>Build LPS</button>
            <button type="button" className={`kmpv-tab ${mode === 'search' ? 'kmpv-tab-active' : ''}`} onClick={() => applyMode('search')}>Search text</button>
          </div>

          <div className="kmpv-field">
            <span className="kmpv-label">pattern</span>
            <input className="kmpv-input" value={patternInput} onChange={(e) => setPatternInput(e.target.value)} spellCheck={false} />
          </div>

          <button type="button" className="kmpv-btn" onClick={apply} disabled={!patternInput.trim() || patternInput.trim() === pattern}>
            Apply
          </button>

          <div className="kmpv-actions">
            <div className="kmpv-buttons">
              <button type="button" className="kmpv-btn kmpv-btn-primary" onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}>
                {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
                {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
              </button>
              <button type="button" className="kmpv-btn" onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
                <ChevronRight size={14} /> Step
              </button>
              <button type="button" className="kmpv-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
                <SkipForward size={14} /> Skip
              </button>
              <button type="button" className="kmpv-btn" onClick={reset}>
                <RotateCcw size={14} /> Reset
              </button>
            </div>
            <label className="kmpv-speed">
              <span className="kmpv-speed-label">speed</span>
              <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="kmpv-speed-range" />
              <span className="kmpv-speed-value">{speed.toFixed(1)}×</span>
            </label>
            <div className="kmpv-stepcount">
              step <strong>{step + 1}</strong> / {totalSteps}
            </div>
          </div>
        </div>

        <div className="kmpv-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="kmpv-svg" preserveAspectRatio="xMidYMid meet">
            <text x={padX - 6} y={32} className="kmpv-row-label" textAnchor="end">pat</text>
            <text x={padX - 6} y={lpsRowY - 6} className="kmpv-row-label" textAnchor="end">lps</text>

            {[...pattern].map((ch, idx) => {
              const x = padX + idx * cellW;
              const isI = idx === current.i;
              const isLen = idx === current.len && current.phase !== 'init';
              const isCmpA = idx === current.cmpA;
              const isCmpB = idx === current.cmpB;
              const isMismatch = current.phase === 'fallback' || current.phase === 'zero';
              let fill = 'var(--surface)';
              let stroke = 'var(--border)';
              let sw = 1;
              if (isCmpA || isCmpB) {
                fill = isMismatch ? 'var(--bg)' : 'rgba(var(--accent-rgb), 0.18)';
                stroke = isMismatch ? 'var(--hard)' : 'var(--easy)';
                sw = 2;
              } else if (isI) {
                fill = 'rgba(var(--accent-rgb), 0.10)';
                stroke = 'var(--accent)';
                sw = 1.5;
              }
              return (
                <g key={`p-${idx}`}>
                  <rect x={x} y={rowY} width={cellW - 4} height={cellW} className="kmpv-cell-rect" fill={fill} stroke={stroke} strokeWidth={sw} />
                  <text x={x + (cellW - 4) / 2} y={rowY + cellW / 2 + 4} className="kmpv-cell-value">{ch}</text>
                  <text x={x + (cellW - 4) / 2} y={rowY + cellW + 14} className="kmpv-cell-index">{idx}</text>
                </g>
              );
            })}

            {current.i >= 0 && current.i < m && (
              <g>
                <line x1={padX + current.i * cellW + (cellW - 4) / 2} y1={rowY - 14} x2={padX + current.i * cellW + (cellW - 4) / 2} y2={rowY - 4} stroke="var(--hue-pink)" strokeWidth="2" markerEnd="url(#kmpv-iarrow)" />
                <text x={padX + current.i * cellW + (cellW - 4) / 2} y={rowY - 18} fontSize="10" fontFamily="var(--mono)" fill="var(--hue-pink)" textAnchor="middle" fontWeight="700">i = {current.i}</text>
              </g>
            )}

            {current.len >= 0 && current.len < m && current.phase !== 'init' && (
              <g>
                <line x1={padX + current.len * cellW + (cellW - 4) / 2} y1={rowY + cellW + 30} x2={padX + current.len * cellW + (cellW - 4) / 2} y2={rowY + cellW + 20} stroke="var(--hue-sky)" strokeWidth="2" markerEnd="url(#kmpv-lenarrow)" />
                <text x={padX + current.len * cellW + (cellW - 4) / 2} y={rowY + cellW + 44} fontSize="10" fontFamily="var(--mono)" fill="var(--hue-sky)" textAnchor="middle" fontWeight="700">len = {current.len}</text>
              </g>
            )}

            <defs>
              <marker id="kmpv-iarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink)" />
              </marker>
              <marker id="kmpv-lenarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-sky)" />
              </marker>
            </defs>

            {current.lps.map((v, idx) => {
              const x = padX + idx * cellW;
              const isWrittenNow = current.phase === 'match' && idx === current.i;
              const isZeroNow = current.phase === 'zero' && idx === current.i;
              return (
                <g key={`l-${idx}`}>
                  <rect
                    x={x}
                    y={lpsRowY + 10}
                    width={cellW - 4}
                    height={cellW}
                    className="kmpv-cell-rect"
                    fill={isWrittenNow || isZeroNow ? 'rgba(var(--accent-rgb), 0.18)' : v > 0 ? 'rgba(var(--accent-rgb), 0.07)' : 'var(--bg)'}
                    stroke={isWrittenNow || isZeroNow ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={isWrittenNow || isZeroNow ? 2 : 1}
                  />
                  <text x={x + (cellW - 4) / 2} y={lpsRowY + 10 + cellW / 2 + 4} className="kmpv-cell-value" fill={v > 0 ? 'var(--accent)' : 'var(--text-dim)'}>
                    {v}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="kmpv-metrics">
          <div className="kmpv-metric">
            <span className="kmpv-metric-label">i</span>
            <span className="kmpv-metric-value">{current.i}</span>
          </div>
          <div className="kmpv-metric">
            <span className="kmpv-metric-label">len</span>
            <span className="kmpv-metric-value">{current.len}</span>
          </div>
          <div className="kmpv-metric">
            <span className="kmpv-metric-label">lps[i]</span>
            <span className="kmpv-metric-value">{current.i < m ? current.lps[current.i] : '—'}</span>
          </div>
          <div className="kmpv-metric kmpv-metric-dim">
            <span className="kmpv-metric-label">phase</span>
            <span className="kmpv-metric-value kmpv-metric-dimval">{current.phase}</span>
          </div>
        </div>

        <div className="kmpv-arith">
          <span className="kmpv-arith-label">trace</span>
          <span className="kmpv-arith-vals">{current.note}</span>
        </div>
      </div>
    );
  }

  // Search mode
  const cellW = Math.min(36, Math.max(22, 700 / Math.max(n, 8)));
  const padX = 36;
  const textRowY = 60;
  const patRowY = textRowY + cellW + 26;
  const W = padX * 2 + cellW * Math.max(n, m);
  const H = patRowY + cellW + 60;
  const patOffset = Math.max(0, current.i - current.j);

  return (
    <div className="kmpv">
      <div className="kmpv-head">
        <h3 className="kmpv-title">KMP — searching text with the failure array</h3>
        <p className="kmpv-sub">
          On mismatch, slide the pattern by j − lps[j − 1] (text pointer never moves backward). Total work is O(n + m).
        </p>
      </div>

      <div className="kmpv-controls">
        <div className="kmpv-tabs">
          <button type="button" className={`kmpv-tab ${mode === 'build' ? 'kmpv-tab-active' : ''}`} onClick={() => applyMode('build')}>Build LPS</button>
          <button type="button" className={`kmpv-tab ${mode === 'search' ? 'kmpv-tab-active' : ''}`} onClick={() => applyMode('search')}>Search text</button>
        </div>

        <div className="kmpv-field">
          <span className="kmpv-label">pattern</span>
          <input className="kmpv-input" value={patternInput} onChange={(e) => setPatternInput(e.target.value)} spellCheck={false} />
        </div>
        <div className="kmpv-field">
          <span className="kmpv-label">text</span>
          <input className="kmpv-input" value={textInput} onChange={(e) => setTextInput(e.target.value)} spellCheck={false} />
        </div>

        <button type="button" className="kmpv-btn" onClick={apply}
          disabled={(!patternInput.trim() || patternInput.trim() === pattern) && (!textInput.trim() || textInput.trim() === text)}>
          Apply
        </button>

        <div className="kmpv-actions">
          <div className="kmpv-buttons">
            <button type="button" className="kmpv-btn kmpv-btn-primary" onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}>
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="kmpv-btn" onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
              <ChevronRight size={14} /> Step
            </button>
            <button type="button" className="kmpv-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="kmpv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="kmpv-speed">
            <span className="kmpv-speed-label">speed</span>
            <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="kmpv-speed-range" />
            <span className="kmpv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="kmpv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="kmpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="kmpv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={padX - 6} y={32} className="kmpv-row-label" textAnchor="end">txt</text>
          <text x={padX - 6} y={patRowY - 6} className="kmpv-row-label" textAnchor="end">pat</text>

          {[...text].map((ch, idx) => {
            const x = padX + idx * cellW;
            const isMatched = current.matches.some((mi) => idx >= mi && idx < mi + m);
            const isCmp = idx === current.cmpText;
            const isMismatch = current.phase === 'skip' || current.phase === 'advance';
            let fill = 'var(--surface)';
            let stroke = 'var(--border)';
            let sw = 1;
            if (isCmp) {
              fill = isMismatch ? 'var(--bg)' : 'rgba(var(--accent-rgb), 0.18)';
              stroke = isMismatch ? 'var(--hard)' : 'var(--easy)';
              sw = 2;
            } else if (isMatched) {
              fill = 'rgba(var(--accent-rgb), 0.12)';
              stroke = 'var(--accent)';
              sw = 1.5;
            }
            return (
              <g key={`t-${idx}`}>
                <rect x={x} y={textRowY} width={cellW - 3} height={cellW} className="kmpv-cell-rect" fill={fill} stroke={stroke} strokeWidth={sw} />
                <text x={x + (cellW - 3) / 2} y={textRowY + cellW / 2 + 4} className="kmpv-cell-value">{ch}</text>
                <text x={x + (cellW - 3) / 2} y={textRowY + cellW + 12} className="kmpv-cell-index">{idx}</text>
              </g>
            );
          })}

          {current.i >= 0 && current.i <= n && current.cmpText >= 0 && (
            <g>
              <line x1={padX + current.cmpText * cellW + (cellW - 3) / 2} y1={textRowY - 14} x2={padX + current.cmpText * cellW + (cellW - 3) / 2} y2={textRowY - 4} stroke="var(--hue-pink)" strokeWidth="2" markerEnd="url(#kmpv-iarrow2)" />
              <text x={padX + current.cmpText * cellW + (cellW - 3) / 2} y={textRowY - 18} fontSize="10" fontFamily="var(--mono)" fill="var(--hue-pink)" textAnchor="middle" fontWeight="700">i = {current.cmpText}</text>
            </g>
          )}

          <defs>
            <marker id="kmpv-iarrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {[...pattern].map((ch, idx) => {
            const realPos = patOffset + idx;
            const x = padX + realPos * cellW;
            const isCmp = idx === current.cmpPat;
            const isMismatch = current.phase === 'skip';
            let fill = 'var(--bg)';
            let stroke = 'var(--accent)';
            let sw = 1.5;
            if (isCmp) {
              fill = isMismatch ? 'var(--bg)' : 'rgba(var(--accent-rgb), 0.18)';
              stroke = isMismatch ? 'var(--hard)' : 'var(--easy)';
              sw = 2;
            } else if (idx < current.j) {
              fill = 'rgba(var(--accent-rgb), 0.10)';
            }
            return (
              <g key={`p-${idx}`}>
                <rect x={x} y={patRowY} width={cellW - 3} height={cellW} fill={fill} stroke={stroke} strokeWidth={sw} className="kmpv-cell-rect" />
                <text x={x + (cellW - 3) / 2} y={patRowY + cellW / 2 + 4} className="kmpv-cell-value">{ch}</text>
                <text x={x + (cellW - 3) / 2} y={patRowY + cellW + 12} className="kmpv-cell-index">{idx}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="kmpv-metrics">
        <div className="kmpv-metric">
          <span className="kmpv-metric-label">i (text)</span>
          <span className="kmpv-metric-value">{current.i}</span>
        </div>
        <div className="kmpv-metric">
          <span className="kmpv-metric-label">j (pat)</span>
          <span className="kmpv-metric-value">{current.j}</span>
        </div>
        <div className="kmpv-metric">
          <span className="kmpv-metric-label">matches</span>
          <span className="kmpv-metric-value">{current.matches.length}</span>
        </div>
        <div className="kmpv-metric kmpv-metric-dim">
          <span className="kmpv-metric-label">lps</span>
          <span className="kmpv-metric-value kmpv-metric-dimval">[{lps.join(',')}]</span>
        </div>
        <div className="kmpv-metric kmpv-metric-dim">
          <span className="kmpv-metric-label">phase</span>
          <span className="kmpv-metric-value kmpv-metric-dimval">{current.phase}</span>
        </div>
      </div>

      <div className="kmpv-arith">
        <span className="kmpv-arith-label">trace</span>
        <span className="kmpv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
