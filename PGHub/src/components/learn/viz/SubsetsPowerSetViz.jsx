import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Binary, GitBranch } from 'lucide-react';
import './SubsetsPowerSetViz.css';

const NUMS = [1, 2, 3, 4];

function buildBitmaskFrames(nums) {
  const n = nums.length;
  const frames = [];
  const collected = [];
  frames.push({
    mode: 'bitmask', mask: -1, bits: [], subset: [], collected: [],
    note: `Bitmask enumeration: every integer in [0, 2^${n}=${1 << n}) maps to one subset. Bit i set means include nums[i].`,
  });
  for (let m = 0; m < (1 << n); m += 1) {
    const bits = [];
    const subset = [];
    for (let i = 0; i < n; i += 1) {
      const on = (m >> i) & 1;
      bits.push(on);
      if (on) subset.push(nums[i]);
    }
    collected.push(subset.slice());
    frames.push({
      mode: 'bitmask',
      mask: m,
      bits,
      subset,
      collected: collected.map((s) => s.slice()),
      note: `mask = ${m.toString(2).padStart(n, '0')} (=${m}) -> read bits low to high -> subset {${subset.join(', ') || '∅'}}.`,
    });
  }
  frames.push({
    mode: 'bitmask', mask: (1 << n) - 1, bits: new Array(n).fill(1),
    subset: nums.slice(), collected: collected.map((s) => s.slice()),
    note: `All ${1 << n} subsets enumerated. One nested loop, O(n·2^n) total — the smallest constant factor.`,
  });
  return frames;
}

function buildDfsFrames(nums) {
  const n = nums.length;
  const frames = [];
  const path = [];
  const collected = [];
  const snap = (extra) => ({
    mode: 'dfs',
    path: path.slice(),
    depth: extra.depth,
    decision: extra.decision,
    collected: collected.map((s) => s.slice()),
    note: extra.note,
  });
  frames.push(snap({ depth: 0, decision: 'start', note: 'Include / exclude DFS: at each index branch into skip then take. A leaf at depth n records the current path.' }));
  function dfs(i) {
    if (i === n) {
      collected.push(path.slice());
      frames.push(snap({ depth: i, decision: 'leaf', note: `Leaf at depth ${n}: record subset {${path.join(', ') || '∅'}}. ${collected.length} so far.` }));
      return;
    }
    frames.push(snap({ depth: i, decision: 'exclude', note: `index ${i}: EXCLUDE nums[${i}]=${nums[i]} — recurse without it.` }));
    dfs(i + 1);
    path.push(nums[i]);
    frames.push(snap({ depth: i, decision: 'include', note: `index ${i}: INCLUDE nums[${i}]=${nums[i]} — push and recurse.` }));
    dfs(i + 1);
    path.pop();
  }
  dfs(0);
  frames.push(snap({ depth: 0, decision: 'done', note: `Tree fully walked: ${collected.length} = 2^${n} leaves, one per subset.` }));
  return frames;
}

export default function SubsetsPowerSetViz() {
  const uid = useId().replace(/:/g, '');
  const [mode, setMode] = useState('bitmask');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const frames = useMemo(
    () => (mode === 'bitmask' ? buildBitmaskFrames(NUMS) : buildDfsFrames(NUMS)),
    [mode],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(820 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => { setIsRunningRaw(false); setStep(0); };
  const switchMode = (m) => { if (m === mode) return; setMode(m); setStep(0); setIsRunningRaw(false); };

  const W = 940;
  const H = 320;
  const n = NUMS.length;

  return (
    <div className="sps">
      <div className="sps-head">
        <h3 className="sps-title">The power set — 2<sup>n</sup> subsets of {`{${NUMS.join(', ')}}`}</h3>
        <p className="sps-sub">
          Each element is one binary choice: include or skip. Toggle between bitmask enumeration and include/exclude DFS — they produce the same {1 << n} subsets.
        </p>
      </div>

      <div className="sps-controls">
        <div className="sps-modes">
          <button type="button" className={`sps-mode ${mode === 'bitmask' ? 'sps-mode-on' : ''}`} onClick={() => switchMode('bitmask')}>
            <Binary size={14} /> bitmask
          </button>
          <button type="button" className={`sps-mode ${mode === 'dfs' ? 'sps-mode-on' : ''}`} onClick={() => switchMode('dfs')}>
            <GitBranch size={14} /> include / exclude DFS
          </button>
        </div>
        <div className="sps-buttons">
          <button type="button" className="sps-btn sps-btn-primary" onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunningRaw((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="sps-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="sps-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="sps-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <label className="sps-speed">
          <span className="sps-speed-label">speed</span>
          <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="sps-speed-range" />
          <span className="sps-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="sps-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="sps-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sps-svg" preserveAspectRatio="xMidYMid meet">
          {mode === 'bitmask' ? (
            <g>
              <text x={32} y={36} className="sps-label">bit register (low → high)</text>
              {NUMS.map((v, i) => {
                const on = current.bits[i] === 1;
                const x = 36 + i * 130;
                return (
                  <g key={`bit-${i}`}>
                    <rect x={x} y={56} width={108} height={90} rx={8}
                      fill={on ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                      stroke={on ? 'var(--accent)' : 'var(--border)'} strokeWidth={on ? 2.5 : 1.5} />
                    <text x={x + 54} y={92} className="sps-bit" style={{ fill: on ? 'var(--accent)' : 'var(--text-dim)' }}>{current.bits[i] ?? 0}</text>
                    <text x={x + 54} y={122} className="sps-bit-meta">nums[{i}]={v}</text>
                    {on && <text x={x + 54} y={140} className="sps-bit-take">take</text>}
                  </g>
                );
              })}
              <text x={36} y={196} className="sps-label">resulting subset</text>
              <rect x={36} y={208} width={W / 2 - 60} height={56} rx={8} fill="var(--surface)" stroke="var(--border)" />
              <text x={50} y={242} className="sps-subset-text">{`{ ${current.subset && current.subset.length ? current.subset.join(', ') : '∅'} }`}</text>
              <text x={W / 2 + 8} y={196} className="sps-label">collected ({current.collected.length} / {1 << n})</text>
              <foreignObject x={W / 2 + 8} y={204} width={W / 2 - 32} height={H - 210}>
                <div className="sps-collected" xmlns="http://www.w3.org/1999/xhtml">
                  {current.collected.map((s, idx) => (
                    <span key={`c-${idx}`} className="sps-chip">{`{${s.join(',') || '∅'}}`}</span>
                  ))}
                </div>
              </foreignObject>
            </g>
          ) : (
            <g>
              <text x={32} y={36} className="sps-label">current DFS path (length = depth)</text>
              {NUMS.map((v, i) => {
                const inPath = current.path.length > i;
                const isCursor = i === current.depth && current.decision !== 'done' && current.decision !== 'leaf';
                const x = 36 + i * 130;
                const incl = inPath;
                return (
                  <g key={`slot-${i}`}>
                    <rect x={x} y={56} width={108} height={90} rx={8}
                      fill={incl ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                      stroke={isCursor ? 'var(--hue-pink)' : incl ? 'var(--accent)' : 'var(--border)'}
                      strokeWidth={isCursor ? 3 : incl ? 2.5 : 1.5} />
                    <text x={x + 54} y={98} className="sps-bit" style={{ fill: incl ? 'var(--accent)' : 'var(--text-dim)' }}>{incl ? v : '·'}</text>
                    <text x={x + 54} y={124} className="sps-bit-meta">i={i}</text>
                  </g>
                );
              })}
              <rect x={36} y={166} width={210} height={34} rx={6}
                fill={current.decision === 'leaf' ? 'var(--mint-bg, rgba(var(--accent-rgb),0.12))' : 'var(--surface)'}
                stroke={current.decision === 'include' ? 'var(--accent)' : current.decision === 'exclude' ? 'var(--hue-violet)' : current.decision === 'leaf' ? 'var(--easy)' : 'var(--border)'} />
              <text x={48} y={188} className="sps-decision">decision: {current.decision}</text>
              <text x={W / 2 + 8} y={196 - 160 + 36} className="sps-label" />
              <text x={W / 2 + 8} y={36} className="sps-label">collected leaves ({current.collected.length} / {1 << n})</text>
              <foreignObject x={W / 2 + 8} y={48} width={W / 2 - 32} height={H - 56}>
                <div className="sps-collected" xmlns="http://www.w3.org/1999/xhtml">
                  {current.collected.map((s, idx) => (
                    <span key={`c-${idx}`} className="sps-chip">{`{${s.join(',') || '∅'}}`}</span>
                  ))}
                </div>
              </foreignObject>
            </g>
          )}
          <linearGradient id={`spsg-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--hue-violet)" />
          </linearGradient>
        </svg>
      </div>

      <div className="sps-metrics">
        <div className="sps-metric">
          <span className="sps-metric-label">mode</span>
          <span className="sps-metric-value">{mode === 'bitmask' ? 'bitmask' : 'DFS'}</span>
        </div>
        <div className="sps-metric">
          <span className="sps-metric-label">subsets so far</span>
          <span className="sps-metric-value">{current.collected.length}</span>
        </div>
        <div className="sps-metric sps-metric-dim">
          <span className="sps-metric-label">total subsets</span>
          <span className="sps-metric-value sps-metric-dimval">2^{n} = {1 << n}</span>
        </div>
      </div>

      <div className="sps-trace">
        <span className="sps-trace-label">trace</span>
        <span className="sps-trace-val">{current.note}</span>
      </div>
    </div>
  );
}
