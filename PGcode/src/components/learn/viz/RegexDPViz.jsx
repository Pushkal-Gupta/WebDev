import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import './RegexDPViz.css';

const MAX_S_LEN = 8;
const MAX_P_LEN = 10;
const TICK_MS = 520;
const DEFAULT_S = 'aab';
const DEFAULT_P = 'c*a*b';

function sanitizeString(raw) {
  if (!raw) return '';
  const lower = String(raw).toLowerCase();
  let out = '';
  for (const ch of lower) {
    if (/[a-z]/.test(ch)) out += ch;
    if (out.length >= MAX_S_LEN) break;
  }
  return out;
}

function sanitizePattern(raw) {
  if (!raw) return '';
  const lower = String(raw).toLowerCase();
  let out = '';
  for (let k = 0; k < lower.length; k += 1) {
    const ch = lower[k];
    if (/[a-z.*]/.test(ch)) {
      // Disallow leading '*' or '**' — invalid regex per LC10
      if (ch === '*') {
        if (out.length === 0) continue;
        if (out[out.length - 1] === '*') continue;
      }
      out += ch;
    }
    if (out.length >= MAX_P_LEN) break;
  }
  return out;
}

function patternMatches(sCh, pCh) {
  if (pCh === '.') return true;
  return sCh === pCh;
}

function buildSteps(s, p) {
  const m = s.length;
  const n = p.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  const steps = [];

  for (let i = 0; i <= m; i += 1) {
    for (let j = 0; j <= n; j += 1) {
      let kind;
      let value;
      const deps = [];
      let detail = '';

      if (i === 0 && j === 0) {
        value = true;
        kind = 'base-true';
        detail = 'empty string matches empty pattern';
      } else if (j === 0) {
        // non-empty s vs empty p
        value = false;
        kind = 'base-false';
        detail = 'empty pattern cannot match non-empty string';
      } else {
        const pCh = p[j - 1];
        if (pCh !== '*') {
          // normal char or '.'
          const sCh = i > 0 ? s[i - 1] : null;
          if (i === 0) {
            value = false;
            kind = 'no-char';
            detail = `s is empty but p[${j - 1}]='${pCh}' needs a character`;
          } else if (patternMatches(sCh, pCh)) {
            const prev = dp[i - 1][j - 1];
            value = prev;
            kind = 'match';
            deps.push({ i: i - 1, j: j - 1, role: 'diag' });
            detail = `s[${i - 1}]='${sCh}' matches p[${j - 1}]='${pCh}' → dp[${i - 1}][${j - 1}] = ${prev ? 'T' : 'F'}`;
          } else {
            value = false;
            kind = 'mismatch';
            detail = `s[${i - 1}]='${sCh}' ≠ p[${j - 1}]='${pCh}' → F`;
          }
        } else {
          // p[j-1] === '*'
          const precIdx = j - 2;
          const precCh = p[precIdx];
          // Option A: zero of preceding → dp[i][j-2]
          const zero = dp[i][j - 2];
          deps.push({ i, j: j - 2, role: 'zero' });
          let oneOrMore = false;
          const sCh = i > 0 ? s[i - 1] : null;
          const precMatches = i > 0 && patternMatches(sCh, precCh);
          if (precMatches) {
            oneOrMore = dp[i - 1][j];
            deps.push({ i: i - 1, j, role: 'more' });
          }
          value = zero || oneOrMore;
          kind = 'star';
          const zeroStr = `dp[${i}][${j - 2}] = ${zero ? 'T' : 'F'}`;
          if (precMatches) {
            detail = `'*' on '${precCh}': zero → ${zeroStr}  OR  one-more (s[${i - 1}]='${sCh}' matches '${precCh}') → dp[${i - 1}][${j}] = ${oneOrMore ? 'T' : 'F'}`;
          } else if (i === 0) {
            detail = `'*' on '${precCh}': s is empty, only zero-of-preceding applies → ${zeroStr}`;
          } else {
            detail = `'*' on '${precCh}': s[${i - 1}]='${sCh}' does not match '${precCh}', only zero-of-preceding applies → ${zeroStr}`;
          }
        }
      }

      dp[i][j] = value;
      steps.push({
        idx: steps.length,
        i,
        j,
        kind,
        value,
        deps,
        detail,
        pChar: j > 0 ? p[j - 1] : null,
        sChar: i > 0 ? s[i - 1] : null,
        precChar: j >= 2 && p[j - 1] === '*' ? p[j - 2] : null,
      });
    }
  }

  return { steps, finalDp: dp };
}

function cellId(i, j) {
  return `${i}-${j}`;
}

function formulaForStep(step) {
  if (!step) return "char/'.': dp[i-1][j-1]    '*': dp[i][j-2]  OR  (match ⇒ dp[i-1][j])";
  const { i, j, kind, pChar, sChar, precChar, value } = step;
  const v = value ? 'T' : 'F';
  if (kind === 'base-true') return `dp[0][0] = T   (empty matches empty)`;
  if (kind === 'base-false') return `dp[${i}][0] = F   (empty pattern, non-empty s)`;
  if (kind === 'no-char') return `dp[0][${j}] = F   ('${pChar}' needs a char, s is empty)`;
  if (kind === 'match') return `match: s[${i - 1}]='${sChar}' ~ p[${j - 1}]='${pChar}'  ⇒  dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${v}`;
  if (kind === 'mismatch') return `mismatch: s[${i - 1}]='${sChar}' ≠ p[${j - 1}]='${pChar}'  ⇒  dp[${i}][${j}] = F`;
  if (kind === 'star') {
    return `'*': dp[${i}][${j}] = dp[${i}][${j - 2}] OR (s[${i - 1}]~'${precChar}' ⇒ dp[${i - 1}][${j}])  =  ${v}`;
  }
  return '';
}

function describeStep(step) {
  if (!step) return '';
  const { i, j, kind, value, detail } = step;
  const v = value ? 'T' : 'F';
  if (kind === 'base-true') return `Base case: an empty pattern matches an empty string. dp[0][0] = T.`;
  if (kind === 'base-false') return `Empty pattern cannot match a non-empty prefix of s. dp[${i}][0] = F.`;
  if (kind === 'no-char') return `Row 0 means s is empty. p[${j - 1}] consumes a character, so this cell is F. (Note: '*' cells in row 0 may still be T via zero-of-preceding.)`;
  if (kind === 'match') return `Single-character match. ${detail}. dp[${i}][${j}] = ${v}.`;
  if (kind === 'mismatch') return `Single-character mismatch. ${detail}. dp[${i}][${j}] = F.`;
  if (kind === 'star') return `Star case. ${detail}. dp[${i}][${j}] = ${v}.`;
  return '';
}

export default function RegexDPViz() {
  const [sRaw, setSRaw] = useState(DEFAULT_S);
  const [pRaw, setPRaw] = useState(DEFAULT_P);
  const s = useMemo(() => sanitizeString(sRaw), [sRaw]);
  const p = useMemo(() => sanitizePattern(pRaw), [pRaw]);
  const effectiveS = s || DEFAULT_S;
  const effectiveP = p || DEFAULT_P;

  const built = useMemo(() => buildSteps(effectiveS, effectiveP), [effectiveS, effectiveP]);
  const { steps, finalDp } = built;
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setIdx(-1);
    setPlaying(false);
  }, [effectiveS, effectiveP]);

  const total = steps.length;
  const current = idx >= 0 ? steps[idx] : null;
  const atEnd = idx >= total - 1;
  const finalAnswer = finalDp[effectiveS.length][effectiveP.length];

  const next = useCallback(() => {
    setIdx((i) => {
      if (i >= total - 1) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [total]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setInterval(() => {
      next();
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next]);

  useEffect(() => {
    if (idx >= total - 1 && playing) setPlaying(false);
  }, [idx, total, playing]);

  const handleReset = () => {
    setPlaying(false);
    setIdx(-1);
  };

  const handleRun = () => {
    if (atEnd) {
      setIdx(-1);
      setPlaying(true);
      return;
    }
    setPlaying((play) => !play);
  };

  const handleStep = () => {
    setPlaying(false);
    if (idx < total - 1) setIdx(idx + 1);
  };

  const handlePause = () => setPlaying(false);

  const handleRunAll = () => {
    setPlaying(false);
    setIdx(total - 1);
  };

  const filledMap = useMemo(() => {
    const map = new Map();
    if (idx < 0) return map;
    for (let k = 0; k <= idx; k += 1) {
      const step = steps[k];
      map.set(cellId(step.i, step.j), step.value);
    }
    return map;
  }, [idx, steps]);

  const depMap = useMemo(() => {
    const map = new Map();
    if (!current) return map;
    current.deps.forEach((d) => map.set(cellId(d.i, d.j), d.role));
    return map;
  }, [current]);

  const m = effectiveS.length;
  const n = effectiveP.length;
  const rows = m + 1;
  const cols = n + 1;
  const PADDING_L = 64;
  const PADDING_T = 60;
  const PADDING_R = 16;
  const PADDING_B = 16;
  const cellSize = useMemo(() => {
    const maxCanvasW = 780;
    const maxCanvasH = 470;
    const availW = maxCanvasW - PADDING_L - PADDING_R;
    const availH = maxCanvasH - PADDING_T - PADDING_B;
    return Math.max(34, Math.floor(Math.min(availW / cols, availH / rows)));
  }, [cols, rows]);

  const gridW = cellSize * cols;
  const gridH = cellSize * rows;
  const viewW = gridW + PADDING_L + PADDING_R;
  const viewH = gridH + PADDING_T + PADDING_B;

  const cellX = (j) => PADDING_L + j * cellSize;
  const cellY = (i) => PADDING_T + i * cellSize;
  const cellCx = (j) => cellX(j) + cellSize / 2;
  const cellCy = (i) => cellY(i) + cellSize / 2;

  const liveS = current && current.sChar !== null ? current.i - 1 : -1;
  const liveP = current && current.pChar !== null ? current.j - 1 : -1;
  const livePrec = current && current.kind === 'star' ? current.j - 2 : -1;

  return (
    <div className="regexdpviz">
      <div className="regexdpviz-header">
        <div className="regexdpviz-title">Regex matching — DP fill (LC10)</div>
      </div>

      <div className="regexdpviz-inputs">
        <label className="regexdpviz-input">
          <span className="regexdpviz-input-label">string s</span>
          <input
            type="text"
            value={sRaw}
            maxLength={MAX_S_LEN}
            spellCheck={false}
            onChange={(e) => setSRaw(sanitizeString(e.target.value))}
            aria-label="string s"
          />
        </label>
        <label className="regexdpviz-input">
          <span className="regexdpviz-input-label">pattern p</span>
          <input
            type="text"
            value={pRaw}
            maxLength={MAX_P_LEN}
            spellCheck={false}
            onChange={(e) => setPRaw(sanitizePattern(e.target.value))}
            aria-label="pattern p"
          />
        </label>
        <span className="regexdpviz-input-note">
          s: a-z up to {MAX_S_LEN}   ·   p: a-z, '.', '*' up to {MAX_P_LEN}
        </span>
      </div>

      <div className="regexdpviz-strings">
        <div className="regexdpviz-strings-row">
          <span className="regexdpviz-strings-tag">s</span>
          <div className="regexdpviz-strings-cells">
            {effectiveS.split('').map((ch, k) => {
              const live = k === liveS;
              let cls = 'regexdpviz-char';
              if (live) cls += ' regexdpviz-char-live';
              return (
                <span key={`s-${k}`} className={cls}>
                  <span className="regexdpviz-char-glyph">{ch}</span>
                  <span className="regexdpviz-char-idx">{k}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="regexdpviz-strings-row">
          <span className="regexdpviz-strings-tag">p</span>
          <div className="regexdpviz-strings-cells">
            {effectiveP.split('').map((ch, k) => {
              const live = k === liveP;
              const prec = k === livePrec;
              let cls = 'regexdpviz-char';
              if (ch === '*') cls += ' regexdpviz-char-star';
              if (ch === '.') cls += ' regexdpviz-char-dot';
              if (live) cls += ' regexdpviz-char-live';
              else if (prec) cls += ' regexdpviz-char-prec';
              return (
                <span key={`p-${k}`} className={cls}>
                  <span className="regexdpviz-char-glyph">{ch}</span>
                  <span className="regexdpviz-char-idx">{k}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="regexdpviz-legend">
        <span className="regexdpviz-legend-item">
          <span className="regexdpviz-dot regexdpviz-dot-true" /> true
        </span>
        <span className="regexdpviz-legend-item">
          <span className="regexdpviz-dot regexdpviz-dot-false" /> false
        </span>
        <span className="regexdpviz-legend-item">
          <span className="regexdpviz-dot regexdpviz-dot-diag" /> match (diag)
        </span>
        <span className="regexdpviz-legend-item">
          <span className="regexdpviz-dot regexdpviz-dot-zero" /> '*' zero (left 2)
        </span>
        <span className="regexdpviz-legend-item">
          <span className="regexdpviz-dot regexdpviz-dot-more" /> '*' one-more (up)
        </span>
        <span className="regexdpviz-legend-item">
          <span className="regexdpviz-dot regexdpviz-dot-current" /> filling now
        </span>
      </div>

      <div className="regexdpviz-stage">
        <svg
          className="regexdpviz-svg"
          viewBox={`0 0 ${viewW} ${viewH}`}
          role="img"
          aria-label={`Regex DP table ${rows} by ${cols}`}
        >
          <defs>
            <marker
              id="regexdpviz-arrow-diag"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="regexdpviz-arrow-head-diag" />
            </marker>
            <marker
              id="regexdpviz-arrow-zero"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="regexdpviz-arrow-head-zero" />
            </marker>
            <marker
              id="regexdpviz-arrow-more"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="regexdpviz-arrow-head-more" />
            </marker>
          </defs>

          <g className="regexdpviz-axes">
            <text
              className="regexdpviz-axis-corner"
              x={PADDING_L / 2}
              y={PADDING_T / 2}
              textAnchor="middle"
              dominantBaseline="central"
            >
              i\j
            </text>
            <text
              className="regexdpviz-axis-strlabel"
              x={PADDING_L + gridW / 2}
              y={16}
              textAnchor="middle"
            >
              p
            </text>
            <text
              className="regexdpviz-axis-strlabel"
              x={18}
              y={PADDING_T + gridH / 2}
              textAnchor="middle"
            >
              s
            </text>
            <text
              className="regexdpviz-axis-label"
              x={cellCx(0)}
              y={PADDING_T - 30}
              textAnchor="middle"
            >
              0
            </text>
            <text
              className="regexdpviz-axis-label regexdpviz-axis-empty"
              x={cellCx(0)}
              y={PADDING_T - 14}
              textAnchor="middle"
            >
              ε
            </text>
            {effectiveP.split('').map((ch, j) => {
              const live = liveP === j;
              const prec = livePrec === j;
              let axisCls = 'regexdpviz-axis-char';
              if (ch === '*') axisCls += ' regexdpviz-axis-char-star';
              if (ch === '.') axisCls += ' regexdpviz-axis-char-dot';
              if (live) axisCls += ' regexdpviz-axis-char-live';
              else if (prec) axisCls += ' regexdpviz-axis-char-prec';
              return (
                <g key={`col-${j}`}>
                  <text
                    className="regexdpviz-axis-label"
                    x={cellCx(j + 1)}
                    y={PADDING_T - 30}
                    textAnchor="middle"
                  >
                    {j + 1}
                  </text>
                  <text
                    className={axisCls}
                    x={cellCx(j + 1)}
                    y={PADDING_T - 14}
                    textAnchor="middle"
                  >
                    {ch}
                  </text>
                </g>
              );
            })}
            <text
              className="regexdpviz-axis-label"
              x={PADDING_L - 28}
              y={cellCy(0)}
              textAnchor="end"
              dominantBaseline="central"
            >
              0
            </text>
            <text
              className="regexdpviz-axis-label regexdpviz-axis-empty"
              x={PADDING_L - 10}
              y={cellCy(0)}
              textAnchor="end"
              dominantBaseline="central"
            >
              ε
            </text>
            {effectiveS.split('').map((ch, i) => (
              <g key={`row-${i}`}>
                <text
                  className="regexdpviz-axis-label"
                  x={PADDING_L - 28}
                  y={cellCy(i + 1)}
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {i + 1}
                </text>
                <text
                  className={`regexdpviz-axis-char${liveS === i ? ' regexdpviz-axis-char-live' : ''}`}
                  x={PADDING_L - 10}
                  y={cellCy(i + 1)}
                  textAnchor="end"
                  dominantBaseline="central"
                >
                  {ch}
                </text>
              </g>
            ))}
          </g>

          <g className="regexdpviz-cells">
            {Array.from({ length: rows }).flatMap((_, i) =>
              Array.from({ length: cols }).map((__, j) => {
                const id = cellId(i, j);
                const isFilled = filledMap.has(id);
                const cellValue = filledMap.get(id);
                const isCurrent = current && current.i === i && current.j === j;
                const depRole = depMap.get(id);
                const isGoal = i === m && j === n;
                let cls = 'regexdpviz-cell';
                if (isFilled && !isCurrent) {
                  cls += ' regexdpviz-cell-filled';
                  cls += cellValue ? ' regexdpviz-cell-true' : ' regexdpviz-cell-false';
                }
                if (isCurrent) {
                  cls += ' regexdpviz-cell-current';
                  cls += current.value ? ' regexdpviz-cell-current-true' : ' regexdpviz-cell-current-false';
                }
                if (depRole === 'diag') cls += ' regexdpviz-cell-dep-diag';
                if (depRole === 'zero') cls += ' regexdpviz-cell-dep-zero';
                if (depRole === 'more') cls += ' regexdpviz-cell-dep-more';
                if (isGoal && atEnd) cls += ' regexdpviz-cell-goal';
                return (
                  <g key={id} className={cls}>
                    <rect
                      x={cellX(j)}
                      y={cellY(i)}
                      width={cellSize}
                      height={cellSize}
                      rx={5}
                      ry={5}
                    />
                    {isFilled || isCurrent ? (
                      <text
                        x={cellCx(j)}
                        y={cellCy(i)}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {(isCurrent ? current.value : cellValue) ? 'T' : 'F'}
                      </text>
                    ) : (
                      <text
                        className="regexdpviz-cell-placeholder"
                        x={cellCx(j)}
                        y={cellCy(i)}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        ·
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </g>

          {current && current.deps.length > 0 && (
            <g className="regexdpviz-arrows">
              {current.deps.map((d) => {
                const x1 = cellCx(d.j);
                const y1 = cellCy(d.i);
                const x2 = cellCx(current.j);
                const y2 = cellCy(current.i);
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const inset = cellSize * 0.36;
                const sx = x1 + (dx / len) * inset;
                const sy = y1 + (dy / len) * inset;
                const ex = x2 - (dx / len) * inset;
                const ey = y2 - (dy / len) * inset;
                const markerId =
                  d.role === 'diag'
                    ? 'regexdpviz-arrow-diag'
                    : d.role === 'zero'
                      ? 'regexdpviz-arrow-zero'
                      : 'regexdpviz-arrow-more';
                return (
                  <line
                    key={`arrow-${d.role}-${d.i}-${d.j}`}
                    className={`regexdpviz-arrow regexdpviz-arrow-${d.role}`}
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    markerEnd={`url(#${markerId})`}
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      <div className="regexdpviz-status">
        <div className="regexdpviz-status-row">
          <span className="regexdpviz-status-label">Step</span>
          <span className="regexdpviz-status-value">
            {Math.max(idx + 1, 0)} / {total}
          </span>
        </div>
        <div className="regexdpviz-status-row">
          <span className="regexdpviz-status-label">Cell</span>
          <span className="regexdpviz-status-value">
            {current ? (
              <>dp[{current.i}][{current.j}]</>
            ) : (
              <span className="regexdpviz-muted">not started</span>
            )}
          </span>
        </div>
        <div className="regexdpviz-status-row">
          <span className="regexdpviz-status-label">Table</span>
          <span className="regexdpviz-status-value">
            {rows} × {cols}
          </span>
        </div>
      </div>

      <div className="regexdpviz-formula">
        <span className="regexdpviz-formula-label">Recurrence</span>
        <code className="regexdpviz-formula-body">{formulaForStep(current)}</code>
      </div>

      <p className="regexdpviz-caption">
        {current
          ? describeStep(current)
          : `Press Step or Run to fill the (m+1) × (n+1) table. dp[i][j] is true when s[:i] matches p[:j]. The bottom-right cell holds the answer for "${effectiveS}" against "${effectiveP}".`}
      </p>

      {atEnd && (
        <div className={`regexdpviz-answer ${finalAnswer ? 'regexdpviz-answer-true' : 'regexdpviz-answer-false'}`}>
          <div className="regexdpviz-answer-line">
            <span className="regexdpviz-answer-label">isMatch</span>
            <span className="regexdpviz-answer-value">{finalAnswer ? 'T' : 'F'}</span>
          </div>
          <span className="regexdpviz-answer-note">
            "{effectiveS}" {finalAnswer ? 'matches' : 'does not match'} "{effectiveP}"  ·  read from dp[{m}][{n}]
          </span>
        </div>
      )}

      <div className="regexdpviz-controls">
        <button
          type="button"
          className="regexdpviz-btn regexdpviz-btn-secondary"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          type="button"
          className="regexdpviz-btn regexdpviz-btn-primary"
          onClick={handleRun}
          aria-label={playing ? 'Pause' : 'Run'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="regexdpviz-btn regexdpviz-btn-secondary"
          onClick={handlePause}
          disabled={!playing}
          aria-label="Pause"
        >
          <Pause size={16} />
          <span>Pause</span>
        </button>
        <button
          type="button"
          className="regexdpviz-btn regexdpviz-btn-secondary"
          onClick={handleStep}
          disabled={atEnd}
          aria-label="Step"
        >
          <SkipForward size={16} />
          <span>Step</span>
        </button>
        <button
          type="button"
          className="regexdpviz-btn regexdpviz-btn-secondary"
          onClick={handleRunAll}
          disabled={atEnd}
          aria-label="Run to end"
        >
          <span>Skip to end</span>
        </button>
      </div>
    </div>
  );
}
