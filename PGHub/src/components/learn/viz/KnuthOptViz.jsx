import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './KnuthOptViz.css';

// Optimal-BST-style interval DP on n leaves with weights w[].
// dp[i][j] = min_k (dp[i][k] + dp[k+1][j]) + W(i,j), W = sum of weights.
const WEIGHTS = [4, 2, 6, 3, 5];

function prefix(w) {
  const pre = [0];
  for (let i = 0; i < w.length; i++) pre.push(pre[i] + w[i]);
  return pre;
}

// Build trace. mode === 'knuth' restricts inner k to [opt[i][j-1], opt[i+1][j]].
function buildFrames(w, mode) {
  const n = w.length;
  const pre = prefix(w);
  const W = (i, j) => pre[j + 1] - pre[i];
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  const opt = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) opt[i][i] = i;
  const frames = [];
  let work = 0;

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let lo = i;
      let hi = j - 1;
      if (mode === 'knuth') {
        lo = opt[i][j - 1];
        hi = opt[i + 1][j];
      }
      let best = Infinity;
      let bestK = lo;
      const scanned = [];
      for (let k = lo; k <= hi; k++) {
        work++;
        scanned.push(k);
        const cand = dp[i][k] + dp[k + 1][j] + W(i, j);
        if (cand < best) { best = cand; bestK = k; }
      }
      dp[i][j] = best;
      opt[i][j] = bestK;
      frames.push({
        i, j, lo, hi, scanned: [...scanned], bestK, value: best, work, mode,
        dpSnapshot: dp.map((r) => [...r]),
        note: mode === 'knuth'
          ? `dp[${i}][${j}]: Knuth restricts k to [opt[${i}][${j - 1}]=${lo}, opt[${i + 1}][${j}]=${hi}] -> ${scanned.length} candidate${scanned.length === 1 ? '' : 's'}. Best split k=${bestK}, cost ${best}.`
          : `dp[${i}][${j}]: naive scans k in [${lo}, ${hi}] -> ${scanned.length} candidates. Best split k=${bestK}, cost ${best}.`,
      });
    }
  }
  frames.push({
    i: null, j: null, lo: 0, hi: 0, scanned: [], bestK: null, value: dp[0][n - 1], work, mode,
    dpSnapshot: dp.map((r) => [...r]),
    note: `Done. Total inner-loop candidate evaluations: ${work}. ${mode === 'knuth' ? 'The opt window telescopes -> O(n^2).' : 'Every cell scans its full range -> O(n^3).'}`,
  });
  return frames;
}

export default function KnuthOptViz() {
  const [mode, setMode] = useState('knuth');
  const [naiveWork, knuthWork] = useMemo(() => {
    const nf = buildFrames(WEIGHTS, 'naive');
    const kf = buildFrames(WEIGHTS, 'knuth');
    return [nf[nf.length - 1].work, kf[kf.length - 1].work];
  }, []);
  const [frames, setFrames] = useState(() => buildFrames(WEIGHTS, 'knuth'));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.6);
  const timer = useRef(null);

  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const delay = Math.round(900 / speed);
  const running = playing && step < total - 1;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [running, step, delay, total]);

  const switchMode = (m) => { setMode(m); setPlaying(false); setFrames(buildFrames(WEIGHTS, m)); setStep(0); };

  const n = WEIGHTS.length;
  const W = 520;
  const cell = (W - 60) / n;
  const gridX = 56;
  const gridY = 56;

  const scannedSet = new Set(cur.scanned);

  return (
    <div className="knv">
      <div className="knv-head">
        <h3 className="knv-title">Knuth optimization — the shrinking inner-search window</h3>
        <p className="knv-sub">
          Interval DP fills cells by length. Naively each dp[i][j] scans every split k. When the optimal
          split is monotone, the search is pinned to [opt[i][j-1], opt[i+1][j]] — and the total work drops from O(n&sup3;) to O(n&sup2;).
        </p>
      </div>

      <div className="knv-controls">
        <div className="knv-toggle">
          <button type="button" className={`knv-tog ${mode === 'naive' ? 'knv-tog-on' : ''}`} onClick={() => switchMode('naive')}>naive O(n&sup3;)</button>
          <button type="button" className={`knv-tog ${mode === 'knuth' ? 'knv-tog-on' : ''}`} onClick={() => switchMode('knuth')}>Knuth O(n&sup2;)</button>
        </div>
        <button type="button" className="knv-btn" onClick={() => { if (step >= total - 1) return; setPlaying((p) => !p); }} disabled={step >= total - 1}>
          {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="knv-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="knv-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}>
          <SkipForward size={14} /> Skip
        </button>
        <button type="button" className="knv-btn" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={14} /> Reset</button>
        <label className="knv-speed">
          <span className="knv-speed-label">speed</span>
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="knv-range" />
        </label>
        <div className="knv-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="knv-body">
        <div className="knv-stage">
          <svg viewBox={`0 0 ${W} ${W}`} className="knv-svg" preserveAspectRatio="xMidYMid meet">
            <rect x={8} y={8} width={W - 16} height={W - 16} fill="var(--surface)" stroke="var(--border)" rx={8} />
            {Array.from({ length: n }).map((_, c) => (
              <text key={`ch-${c}`} x={gridX + c * cell + cell / 2} y={gridY - 12} className="knv-axis">j={c}</text>
            ))}
            {Array.from({ length: n }).map((_, r) => (
              <text key={`rh-${r}`} x={gridX - 14} y={gridY + r * cell + cell / 2 + 4} className="knv-axis">i={r}</text>
            ))}
            {Array.from({ length: n }).map((_, r) => Array.from({ length: n }).map((__, c) => {
              if (c < r) return null;
              const x = gridX + c * cell;
              const y = gridY + r * cell;
              const isCur = cur.i === r && cur.j === c;
              const filled = cur.dpSnapshot[r][c] > 0 || r === c;
              let fill = 'var(--bg)';
              let stroke = 'var(--border)';
              if (isCur) { fill = 'var(--medium)'; stroke = 'var(--medium)'; }
              else if (filled) { fill = 'rgba(var(--accent-rgb), 0.16)'; stroke = 'var(--accent)'; }
              return (
                <g key={`${r}-${c}`}>
                  <rect x={x + 3} y={y + 3} width={cell - 6} height={cell - 6} rx={5} fill={fill} stroke={stroke} strokeWidth={isCur ? 2.6 : 1.4} />
                  <text x={x + cell / 2} y={y + cell / 2 + 4} className="knv-cellval" style={{ fill: isCur ? 'var(--bg)' : 'var(--text-main)' }}>
                    {filled ? cur.dpSnapshot[r][c] : ''}
                  </text>
                </g>
              );
            }))}
          </svg>
        </div>

        <div className="knv-side">
          <div className="knv-window">
            <span className="knv-window-tag">k candidates for dp[{cur.i ?? '·'}][{cur.j ?? '·'}]</span>
            <div className="knv-window-row">
              {Array.from({ length: n }).map((_, k) => {
                const inRange = cur.i != null && k >= cur.lo && k <= cur.hi;
                const scanned = scannedSet.has(k);
                const best = k === cur.bestK;
                return (
                  <span key={k} className={`knv-kcell ${best ? 'knv-kcell-best' : scanned ? 'knv-kcell-scan' : inRange ? 'knv-kcell-range' : ''}`}>{k}</span>
                );
              })}
            </div>
            <span className="knv-window-note">{cur.scanned.length} candidate{cur.scanned.length === 1 ? '' : 's'} this cell</span>
          </div>
          <div className="knv-metric"><span className="knv-metric-label">total candidate evals ({mode})</span><span className="knv-metric-value">{cur.work}</span></div>
          <div className="knv-compare">
            <div className="knv-bar-row"><span className="knv-bar-lab">naive</span><div className="knv-bar"><div className="knv-bar-fill knv-bar-naive" style={{ width: `${(naiveWork / Math.max(naiveWork, knuthWork)) * 100}%` }} /></div><span className="knv-bar-num">{naiveWork}</span></div>
            <div className="knv-bar-row"><span className="knv-bar-lab">Knuth</span><div className="knv-bar"><div className="knv-bar-fill knv-bar-knuth" style={{ width: `${(knuthWork / Math.max(naiveWork, knuthWork)) * 100}%` }} /></div><span className="knv-bar-num">{knuthWork}</span></div>
          </div>
        </div>
      </div>

      <div className="knv-note">
        <span className="knv-note-label">trace</span>
        <span className="knv-note-text">{cur.note}</span>
      </div>
    </div>
  );
}
