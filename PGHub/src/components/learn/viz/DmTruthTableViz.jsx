import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Play, Pause, StepForward, RotateCcw, Table } from 'lucide-react';
import './DmTruthTableViz.css';

function km(expr) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: false });
}

// Each preset: variable list, KaTeX label, and a deterministic evaluator over an env object.
const PRESETS = [
  { id: 'and', tex: 'p \\land q', vars: ['p', 'q'], fn: (e) => e.p && e.q },
  { id: 'or', tex: 'p \\lor q', vars: ['p', 'q'], fn: (e) => e.p || e.q },
  { id: 'implies', tex: 'p \\to q', vars: ['p', 'q'], fn: (e) => !e.p || e.q },
  { id: 'nand', tex: '\\lnot(p \\land q)', vars: ['p', 'q'], fn: (e) => !(e.p && e.q) },
  { id: 'xor', tex: 'p \\oplus q', vars: ['p', 'q'], fn: (e) => e.p !== e.q },
  { id: 'taut', tex: 'p \\lor \\lnot p', vars: ['p'], fn: (e) => e.p || !e.p },
  { id: 'three', tex: '(p \\lor q) \\land \\lnot r', vars: ['p', 'q', 'r'], fn: (e) => (e.p || e.q) && !e.r },
];

function buildRows(preset) {
  const { vars, fn } = preset;
  const n = vars.length;
  const rows = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const env = {};
    vars.forEach((v, i) => { env[v] = Boolean((mask >> (n - 1 - i)) & 1); });
    rows.push({ env, out: fn(env) });
  }
  return rows;
}

const REDUCED = typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DmTruthTableViz() {
  const [presetId, setPresetId] = useState('implies');
  const [revealed, setRevealed] = useState(REDUCED ? 999 : 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const preset = useMemo(() => PRESETS.find((p) => p.id === presetId), [presetId]);
  const rows = useMemo(() => buildRows(preset), [preset]);
  const total = rows.length;

  const shown = Math.min(revealed, total);
  const done = shown >= total;

  const clearTimer = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  const selectPreset = useCallback((id) => {
    clearTimer();
    setPlaying(false);
    setPresetId(id);
    setRevealed(REDUCED ? 999 : 0);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setPlaying(false);
    setRevealed(REDUCED ? 999 : 0);
  }, [clearTimer]);

  const step = useCallback(() => {
    setPlaying(false);
    clearTimer();
    setRevealed((r) => Math.min(r + 1, total));
  }, [clearTimer, total]);

  const togglePlay = useCallback(() => {
    if (done) { setRevealed(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  }, [done]);

  useEffect(() => {
    if (!playing || REDUCED || revealed >= total) return undefined;
    const delay = 820 / speed;
    timer.current = setTimeout(() => {
      setRevealed((r) => {
        const next = Math.min(r + 1, total);
        if (next >= total) setPlaying(false);
        return next;
      });
    }, delay);
    return () => clearTimer();
  }, [playing, revealed, total, speed, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const trueCount = useMemo(
    () => rows.slice(0, shown).reduce((s, r) => s + (r.out ? 1 : 0), 0),
    [rows, shown],
  );
  const trueTotal = useMemo(() => rows.reduce((s, r) => s + (r.out ? 1 : 0), 0), [rows]);

  const verdict = useMemo(() => {
    if (!done) return { key: 'partial', label: 'building...' };
    if (trueTotal === total) return { key: 'taut', label: 'Tautology' };
    if (trueTotal === 0) return { key: 'contra', label: 'Contradiction' };
    return { key: 'cont', label: 'Contingency' };
  }, [done, trueTotal, total]);

  return (
    <div className="dmtt">
      <div className="dmtt-head">
        <div className="dmtt-head-icon"><Table size={18} /></div>
        <div className="dmtt-head-text">
          <h3 className="dmtt-title">Truth-table builder</h3>
          <p className="dmtt-sub">
            Pick a formula, then step or play to reveal each row of{' '}
            <span dangerouslySetInnerHTML={{ __html: km('2^n') }} /> assignments. Rows where the
            formula is <strong>true</strong> glow; the readout calls it a tautology, contradiction,
            or contingency.
          </p>
        </div>
        <button type="button" className="dmtt-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dmtt-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`dmtt-chip${p.id === presetId ? ' dmtt-chip-on' : ''}`}
            onClick={() => selectPreset(p.id)}
            dangerouslySetInnerHTML={{ __html: km(p.tex) }}
          />
        ))}
      </div>

      <div className="dmtt-controls">
        <button type="button" className="dmtt-btn dmtt-btn-primary" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : done ? 'Replay' : 'Play'}
        </button>
        <button type="button" className="dmtt-btn" onClick={step} disabled={done}>
          <StepForward size={14} /> Step
        </button>
        <label className="dmtt-speed">
          <span>Speed</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <span className="dmtt-speed-val">{speed.toFixed(1)}x</span>
        </label>
        <span className="dmtt-progress">{shown}/{total} rows</span>
      </div>

      <div className="dmtt-body">
        <div className="dmtt-formula">
          <span className="dmtt-formula-cap">Formula</span>
          <span
            className="dmtt-formula-math"
            dangerouslySetInnerHTML={{ __html: km(preset.tex) }}
          />
        </div>

        <table className="dmtt-table">
          <thead>
            <tr>
              {preset.vars.map((v) => (
                <th key={v} dangerouslySetInnerHTML={{ __html: km(v) }} />
              ))}
              <th
                className="dmtt-th-out"
                dangerouslySetInnerHTML={{ __html: km(preset.tex) }}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isShown = i < shown;
              const isLatest = !REDUCED && i === shown - 1;
              const cls = [
                'dmtt-row',
                isShown ? 'dmtt-row-on' : 'dmtt-row-off',
                isShown && r.out ? 'dmtt-row-true' : '',
                isLatest ? 'dmtt-row-latest' : '',
              ].join(' ');
              return (
                <tr key={i} className={cls}>
                  {preset.vars.map((v) => (
                    <td key={v} className={`dmtt-cell dmtt-cell-${r.env[v] ? 't' : 'f'}`}>
                      {isShown ? (r.env[v] ? 'T' : 'F') : ''}
                    </td>
                  ))}
                  <td className={`dmtt-cell dmtt-out dmtt-cell-${r.out ? 't' : 'f'}`}>
                    {isShown ? (r.out ? 'T' : 'F') : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="dmtt-readouts">
        <div className="dmtt-stat">
          <span className="dmtt-stat-label">true rows</span>
          <span className="dmtt-stat-val">{trueCount} / {shown}</span>
        </div>
        <div className="dmtt-stat">
          <span className="dmtt-stat-label">true overall</span>
          <span className="dmtt-stat-val">{trueTotal} / {total}</span>
        </div>
        <div className={`dmtt-stat dmtt-verdict dmtt-verdict-${verdict.key}`}>
          <span className="dmtt-stat-label">classification</span>
          <span className="dmtt-stat-val">{verdict.label}</span>
        </div>
      </div>
    </div>
  );
}
