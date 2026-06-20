import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './EditDistanceViz.css';

// Levenshtein edit-distance DP.
//   dp[i][j] = edit distance between word a[0..i) and word b[0..j).
//   dp[0][j] = j (insert j chars), dp[i][0] = i (delete i chars).
//   dp[i][j] = dp[i-1][j-1]                       if a[i-1] === b[j-1] (match)
//            = 1 + min(dp[i-1][j]  delete,
//                      dp[i][j-1]  insert,
//                      dp[i-1][j-1] replace)      otherwise.
// Backtrace from dp[m][n] to dp[0][0] reconstructs the edit script.

const MAX_LEN = 7;

function sanitize(s) {
  return (s || '').replace(/[^a-zA-Z]/g, '').slice(0, MAX_LEN);
}

function buildFrames(a, b) {
  const m = a.length;
  const n = b.length;
  const frames = [];
  const dp = [];
  for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(null));

  const snap = () => dp.map((r) => r.slice());

  // Base row / column.
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  frames.push({
    table: snap(),
    i: null,
    j: null,
    sources: [],
    op: null,
    value: null,
    phase: 'base',
    path: [],
    ops: [],
    distance: null,
    note:
      `Base cases: dp[0][j] = j (insert j characters to build "${b || '∅'}" from empty), ` +
      `dp[i][0] = i (delete i characters). These seed the first row and column.`,
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const ac = a[i - 1];
      const bc = b[j - 1];
      const same = ac === bc;
      const delC = dp[i - 1][j] + 1;
      const insC = dp[i][j - 1] + 1;
      const repC = dp[i - 1][j - 1] + (same ? 0 : 1);
      let value;
      let op;
      if (same) {
        value = dp[i - 1][j - 1];
        op = 'match';
      } else {
        value = Math.min(delC, insC, repC);
        if (value === repC) op = 'replace';
        else if (value === delC) op = 'delete';
        else op = 'insert';
      }
      dp[i][j] = value;
      const opLabel =
        op === 'match'
          ? `match '${ac}' (carry dp[${i - 1}][${j - 1}]=${dp[i - 1][j - 1]})`
          : op === 'replace'
            ? `replace '${ac}'→'${bc}' (dp[${i - 1}][${j - 1}]+1=${repC})`
            : op === 'delete'
              ? `delete '${ac}' (dp[${i - 1}][${j}]+1=${delC})`
              : `insert '${bc}' (dp[${i}][${j - 1}]+1=${insC})`;
      frames.push({
        table: snap(),
        i,
        j,
        sources: [
          { r: i - 1, c: j, kind: 'delete' },
          { r: i, c: j - 1, kind: 'insert' },
          { r: i - 1, c: j - 1, kind: same ? 'match' : 'replace' },
        ],
        op,
        value,
        phase: 'fill',
        path: [],
        ops: [],
        distance: null,
        note:
          `dp[${i}][${j}]: compare a[${i - 1}]='${ac}' vs b[${j - 1}]='${bc}' → ` +
          `${same ? 'equal, ' : 'differ, '}${opLabel}. ` +
          `min(del ${delC}, ins ${insC}, ${same ? 'match' : 'rep'} ${same ? repC : repC}) = ${value}.`,
      });
    }
  }

  // Backtrace.
  const distance = dp[m][n];
  const path = [];
  const editOps = [];
  let ci = m;
  let cj = n;
  while (ci > 0 || cj > 0) {
    path.push({ r: ci, c: cj });
    if (ci > 0 && cj > 0 && a[ci - 1] === b[cj - 1] && dp[ci][cj] === dp[ci - 1][cj - 1]) {
      editOps.push({ kind: 'match', text: `keep '${a[ci - 1]}'` });
      ci -= 1;
      cj -= 1;
    } else if (ci > 0 && cj > 0 && dp[ci][cj] === dp[ci - 1][cj - 1] + 1) {
      editOps.push({ kind: 'replace', text: `replace '${a[ci - 1]}'→'${b[cj - 1]}'` });
      ci -= 1;
      cj -= 1;
    } else if (ci > 0 && dp[ci][cj] === dp[ci - 1][cj] + 1) {
      editOps.push({ kind: 'delete', text: `delete '${a[ci - 1]}'` });
      ci -= 1;
    } else {
      editOps.push({ kind: 'insert', text: `insert '${b[cj - 1]}'` });
      cj -= 1;
    }
  }
  path.push({ r: 0, c: 0 });
  editOps.reverse();
  const orderedPath = path.slice().reverse();

  for (let step = 0; step < orderedPath.length; step++) {
    const sub = orderedPath.slice(0, step + 1);
    const cell = orderedPath[step];
    const shownOps = editOps.slice(0, step);
    frames.push({
      table: snap(),
      i: cell.r,
      j: cell.c,
      sources: [],
      op: null,
      value: dp[cell.r][cell.c],
      phase: 'trace',
      path: sub,
      ops: shownOps,
      distance,
      note:
        step === 0
          ? `Backtrace starts at dp[0][0]. Walk forward along the chosen-operation path to dp[${m}][${n}].`
          : `Path cell dp[${cell.r}][${cell.c}] = ${dp[cell.r][cell.c]}. ` +
            (shownOps.length
              ? `Edit so far: ${shownOps.map((o) => o.text).join(', ')}.`
              : 'Begin reading the edit script.'),
    });
  }

  frames.push({
    table: snap(),
    i: m,
    j: n,
    sources: [],
    op: null,
    value: distance,
    phase: 'done',
    path: orderedPath,
    ops: editOps,
    distance,
    note:
      `Edit distance dp[${m}][${n}] = ${distance}. ` +
      `Script: ${editOps.length ? editOps.map((o) => o.text).join(' · ') : 'no edits (strings equal)'}. ` +
      `DP runs in O(m·n) time and space.`,
  });

  return frames;
}

const VAL = (v) => (v == null ? '·' : v);

export default function EditDistanceViz() {
  const [wordA, setWordA] = useState('sitting');
  const [wordB, setWordB] = useState('kitten');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const a = sanitize(wordA);
  const b = sanitize(wordB);

  const frames = useMemo(() => buildFrames(a, b), [a, b]);
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

  const changeWord = (setter) => (e) => {
    setter(e.target.value);
    setIsRunningRaw(false);
    setStep(0);
  };

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  const m = a.length;
  const n = b.length;

  // ---- geometry ----
  const W = 940;
  const labelTop = 40;
  const tblTop = labelTop + 36;
  const headPad = 30; // room for header row/col of characters
  const tblX = 70;
  const cols = n + 1;
  const rows = m + 1;
  const avail = W - tblX - 24;
  const cellSize = Math.min(56, (avail - headPad) / cols);
  const gridH = headPad + rows * cellSize;
  const H = tblTop + gridH + 24;
  const cellPad = 3;

  const colX = (c) => tblX + headPad + c * cellSize;
  const rowY = (r) => tblTop + headPad + r * cellSize;

  const dp = current.table;

  const sourceMap = new Map();
  (current.sources || []).forEach((s) => sourceMap.set(`${s.r}-${s.c}`, s.kind));
  const targetKey = current.i != null && current.phase === 'fill' ? `${current.i}-${current.j}` : null;
  const pathSet = new Set((current.path || []).map((p) => `${p.r}-${p.c}`));
  const traceHead =
    current.phase === 'trace' || current.phase === 'done'
      ? `${current.i}-${current.j}`
      : null;

  const opTokenColor = {
    match: 'var(--hue-mint)',
    replace: 'var(--hue-violet)',
    delete: 'var(--hard)',
    insert: 'var(--hue-sky)',
  };

  return (
    <div className="edv">
      <div className="edv-head">
        <h3 className="edv-title">Edit distance — Levenshtein DP table</h3>
        <p className="edv-sub">
          dp[i][j] is the fewest insert / delete / replace edits to turn the first i letters of word A
          into the first j letters of word B. Fill the grid, then backtrace the path to read the edits.
        </p>
      </div>

      <div className="edv-words">
        <label className="edv-wordfield">
          <span className="edv-wordlabel">word A</span>
          <input
            type="text"
            className="edv-wordinput"
            value={wordA}
            maxLength={MAX_LEN}
            onChange={changeWord(setWordA)}
            spellCheck={false}
          />
        </label>
        <label className="edv-wordfield">
          <span className="edv-wordlabel">word B</span>
          <input
            type="text"
            className="edv-wordinput"
            value={wordB}
            maxLength={MAX_LEN}
            onChange={(e) => setWordB(e.target.value)}
            spellCheck={false}
          />
        </label>
        <span className="edv-wordhint">letters only, up to {MAX_LEN} each</span>
      </div>

      <div className="edv-controls">
        <div className="edv-buttons">
          <button
            type="button"
            className="edv-btn edv-btn-primary"
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
            className="edv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="edv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="edv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="edv-speed">
          <span className="edv-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="edv-speed-range"
          />
          <span className="edv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="edv-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="edv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="edv-svg" preserveAspectRatio="xMidYMid meet">
          <text x={tblX} y={labelTop} className="edv-panel-label">
            dp[i][j] — rows = word A "{a || '∅'}", cols = word B "{b || '∅'}"
          </text>

          {/* corner label */}
          <text x={colX(0) - headPad / 2} y={rowY(0) - headPad / 2 + 4} className="edv-corner">
            ε
          </text>

          {/* column character headers (b) */}
          {Array.from({ length: cols }).map((_, c) => (
            <text
              key={`colh-${c}`}
              x={colX(c) + cellSize / 2}
              y={tblTop + headPad / 2 + 5}
              className="edv-axh"
            >
              {c === 0 ? 'ε' : b[c - 1]}
            </text>
          ))}
          {/* row character headers (a) */}
          {Array.from({ length: rows }).map((_, r) => (
            <text
              key={`rowh-${r}`}
              x={tblX + headPad / 2}
              y={rowY(r) + cellSize / 2 + 5}
              className="edv-axh"
            >
              {r === 0 ? 'ε' : a[r - 1]}
            </text>
          ))}

          {/* backtrace path connectors */}
          {(current.phase === 'trace' || current.phase === 'done') &&
            (current.path || []).length > 1 &&
            current.path.slice(1).map((p, idx) => {
              const prev = current.path[idx];
              return (
                <line
                  key={`pl-${p.r}-${p.c}`}
                  x1={colX(prev.c) + cellSize / 2}
                  y1={rowY(prev.r) + cellSize / 2}
                  x2={colX(p.c) + cellSize / 2}
                  y2={rowY(p.r) + cellSize / 2}
                  stroke="var(--hue-pink)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              );
            })}

          {/* cells */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => {
              const val = dp[r][c];
              const known = val != null;
              const key = `${r}-${c}`;
              const isTarget = key === targetKey;
              const srcKind = sourceMap.get(key);
              const onPath = pathSet.has(key);
              const isTraceHead = key === traceHead;
              let fill = 'var(--bg)';
              let stroke = 'var(--border)';
              if (isTarget) {
                fill = 'var(--accent)';
                stroke = 'var(--accent)';
              } else if (srcKind) {
                fill =
                  srcKind === 'match'
                    ? 'var(--hue-mint)'
                    : srcKind === 'replace'
                      ? 'var(--hue-violet)'
                      : srcKind === 'delete'
                        ? 'var(--hard)'
                        : 'var(--hue-sky)';
                stroke = fill;
              } else if (isTraceHead) {
                fill = 'var(--hue-pink)';
                stroke = 'var(--hue-pink)';
              } else if (onPath) {
                fill = 'rgba(var(--accent-rgb), 0.20)';
                stroke = 'var(--hue-pink)';
              } else if (known) {
                fill = 'rgba(var(--accent-rgb), 0.10)';
                stroke = 'rgba(var(--accent-rgb), 0.35)';
              }
              const onFill = isTarget || srcKind || isTraceHead;
              const txtFill = onFill ? 'var(--bg)' : known ? 'var(--text-main)' : 'var(--border)';
              return (
                <g key={`cell-${key}`}>
                  <rect
                    x={colX(c) + cellPad}
                    y={rowY(r) + cellPad}
                    width={cellSize - cellPad * 2}
                    height={cellSize - cellPad * 2}
                    rx={5}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isTarget || srcKind || onPath || isTraceHead ? 2.4 : 1}
                  />
                  <text
                    x={colX(c) + cellSize / 2}
                    y={rowY(r) + cellSize / 2 + 4}
                    className="edv-cellval"
                    style={{ fill: txtFill }}
                  >
                    {VAL(val)}
                  </text>
                </g>
              );
            }),
          )}
        </svg>
      </div>

      <div className="edv-metrics">
        <div className="edv-metric">
          <span className="edv-metric-label">cell dp[i][j]</span>
          <span className="edv-metric-value">
            {current.i != null ? `[${current.i}, ${current.j}]` : '—'}
          </span>
        </div>
        <div className="edv-metric">
          <span className="edv-metric-label">operation</span>
          <span className="edv-metric-value">{current.op || (current.phase === 'fill' ? '—' : current.phase)}</span>
        </div>
        <div className="edv-metric">
          <span className="edv-metric-label">cell value</span>
          <span className="edv-metric-value">{current.value == null ? '—' : current.value}</span>
        </div>
        <div className="edv-metric edv-metric-dist">
          <span className="edv-metric-label">edit distance</span>
          <span className="edv-metric-value">
            {current.distance == null ? '—' : current.distance}
          </span>
        </div>
      </div>

      <div className="edv-ops">
        <span className="edv-ops-label">edit script</span>
        <span className="edv-ops-vals">
          {current.ops && current.ops.length ? (
            current.ops.map((o, idx) => (
              <span
                key={`op-${idx}`}
                className="edv-op-chip"
                style={{ color: opTokenColor[o.kind], borderColor: opTokenColor[o.kind] }}
              >
                {o.text}
              </span>
            ))
          ) : (
            <span className="edv-op-empty">
              {current.phase === 'done' ? 'no edits — strings equal' : 'run to the backtrace to read edits'}
            </span>
          )}
        </span>
      </div>

      <div className="edv-arith">
        <span className="edv-arith-label">trace</span>
        <span className="edv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
