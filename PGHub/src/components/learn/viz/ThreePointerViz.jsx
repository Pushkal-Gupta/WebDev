import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './ThreePointerViz.css';

const ARR = [-4, -1, -1, 0, 1, 2];
const TARGET = 0;

function buildFrames(arr, target) {
  const n = arr.length;
  const frames = [];
  const found = [];
  const snap = (i, l, r, extra) => ({
    i, l, r,
    sum: extra.sum,
    found: found.map((t) => t.slice()),
    note: extra.note,
    cmp: extra.cmp,
  });
  frames.push(snap(-1, -1, -1, { sum: null, cmp: 'init', note: `Sorted array, target = ${target}. Fix outer i, then two-pointer l/r inward on the rest. O(n²).` }));
  for (let i = 0; i < n - 2; i += 1) {
    if (i > 0 && arr[i] === arr[i - 1]) {
      frames.push(snap(i, -1, -1, { sum: null, cmp: 'skip', note: `i=${i}: arr[i]=${arr[i]} equals arr[i-1] — skip to avoid duplicate triplets.` }));
      continue;
    }
    let l = i + 1;
    let r = n - 1;
    frames.push(snap(i, l, r, { sum: null, cmp: 'fix', note: `Fix i=${i} (arr[i]=${arr[i]}). Set l=${l}, r=${r}. Walk them inward.` }));
    while (l < r) {
      const sum = arr[i] + arr[l] + arr[r];
      if (sum < target) {
        frames.push(snap(i, l, r, { sum, cmp: 'low', note: `${arr[i]} + ${arr[l]} + ${arr[r]} = ${sum} < ${target} → need larger, l++.` }));
        l += 1;
      } else if (sum > target) {
        frames.push(snap(i, l, r, { sum, cmp: 'high', note: `${arr[i]} + ${arr[l]} + ${arr[r]} = ${sum} > ${target} → need smaller, r--.` }));
        r -= 1;
      } else {
        found.push([arr[i], arr[l], arr[r]]);
        frames.push(snap(i, l, r, { sum, cmp: 'hit', note: `${arr[i]} + ${arr[l]} + ${arr[r]} = ${target} match, emit triplet ( ${arr[i]}, ${arr[l]}, ${arr[r]} ).` }));
        const lv = arr[l];
        const rv = arr[r];
        while (l < r && arr[l] === lv) l += 1;
        while (l < r && arr[r] === rv) r -= 1;
        frames.push(snap(i, l, r, { sum: null, cmp: 'dedup', note: 'Advance l and r past duplicate values so the same triplet is not emitted twice.' }));
      }
    }
  }
  frames.push(snap(-1, -1, -1, { sum: null, cmp: 'done', note: `Done. ${found.length} unique triplet${found.length === 1 ? '' : 's'} summing to ${target}.` }));
  return frames;
}

export default function ThreePointerViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const frames = useMemo(() => buildFrames(ARR, TARGET), []);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(880 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => { setIsRunningRaw(false); setStep(0); };

  const W = 940;
  const H = 300;
  const n = ARR.length;
  const cellW = 96;
  const gap = 14;
  const totalW = n * cellW + (n - 1) * gap;
  const startX = (W - totalW) / 2;
  const cellY = 96;
  const cellH = 80;

  const cmpColor = current.cmp === 'hit' ? 'var(--easy)'
    : current.cmp === 'low' ? 'var(--hue-sky)'
    : current.cmp === 'high' ? 'var(--hard)'
    : 'var(--accent)';

  return (
    <div className="tpv">
      <div className="tpv-head">
        <h3 className="tpv-title">Three pointers — the 3-Sum walk</h3>
        <p className="tpv-sub">
          Sort, then fix outer index i and squeeze l (left) and r (right) inward: sum too small → l++, too big → r--, exact → record and skip duplicates.
        </p>
      </div>

      <div className="tpv-controls">
        <div className="tpv-buttons">
          <button type="button" className="tpv-btn tpv-btn-primary" onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunningRaw((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="tpv-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="tpv-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="tpv-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <label className="tpv-speed">
          <span className="tpv-speed-label">speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="tpv-speed-range" />
          <span className="tpv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="tpv-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="tpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tpv-svg" preserveAspectRatio="xMidYMid meet">
          {ARR.map((v, idx) => {
            const x = startX + idx * (cellW + gap);
            const isI = idx === current.i;
            const isL = idx === current.l;
            const isR = idx === current.r;
            const inRange = current.i >= 0 && idx > current.i && idx >= current.l && idx <= current.r && current.l >= 0;
            const fill = isI ? 'rgba(var(--accent-rgb), 0.22)'
              : isL ? 'color-mix(in srgb, var(--hue-sky) 14%, var(--bg))'
              : isR ? 'color-mix(in srgb, var(--hard) 14%, var(--bg))'
              : inRange ? 'var(--surface)' : 'var(--bg)';
            const stroke = isI ? 'var(--accent)' : isL ? 'var(--hue-sky)' : isR ? 'var(--hard)' : 'var(--border)';
            return (
              <g key={`c-${idx}`}>
                <rect x={x} y={cellY} width={cellW} height={cellH} rx={8} fill={fill} stroke={stroke} strokeWidth={isI || isL || isR ? 3 : 1.5} />
                <text x={x + cellW / 2} y={cellY + cellH / 2 + 9} className="tpv-cell">{v}</text>
                <text x={x + cellW / 2} y={cellY + cellH + 18} className="tpv-idx">{idx}</text>
                {isI && <text x={x + cellW / 2} y={cellY - 12} className="tpv-ptr" style={{ fill: 'var(--accent)' }}>i</text>}
                {isL && <text x={x + cellW / 2} y={cellY - 12} className="tpv-ptr" style={{ fill: 'var(--hue-sky)' }}>l</text>}
                {isR && <text x={x + cellW / 2} y={cellY - 12} className="tpv-ptr" style={{ fill: 'var(--hard)' }}>r</text>}
              </g>
            );
          })}

          {current.sum != null && (
            <g>
              <rect x={W / 2 - 150} y={cellY + cellH + 40} width={300} height={40} rx={8} fill="var(--surface)" stroke={cmpColor} strokeWidth={2} />
              <text x={W / 2} y={cellY + cellH + 65} className="tpv-sum" style={{ fill: cmpColor }}>
                sum = {current.sum} {current.cmp === 'hit' ? `= ${TARGET}` : current.cmp === 'low' ? `< ${TARGET}` : current.cmp === 'high' ? `> ${TARGET}` : ''}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="tpv-metrics">
        <div className="tpv-metric">
          <span className="tpv-metric-label">phase</span>
          <span className="tpv-metric-value">{current.cmp}</span>
        </div>
        <div className="tpv-metric">
          <span className="tpv-metric-label">triplets found</span>
          <span className="tpv-metric-value">{current.found.length}</span>
        </div>
        <div className="tpv-metric tpv-metric-wide">
          <span className="tpv-metric-label">result set</span>
          <span className="tpv-metric-value tpv-metric-dimval">
            {current.found.length ? current.found.map((t) => `(${t.join(',')})`).join('  ') : '—'}
          </span>
        </div>
      </div>

      <div className="tpv-trace">
        <span className="tpv-trace-label">trace</span>
        <span className="tpv-trace-val">{current.note}</span>
      </div>
    </div>
  );
}
