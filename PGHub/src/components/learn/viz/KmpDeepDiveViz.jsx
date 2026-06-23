import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './KmpDeepDiveViz.css';

const PRESETS = ['ababcababa', 'aabaabaaa', 'abcabcabc'];

// Build the failure-function construction trace, exposing the fallback chain.
function buildFrames(P) {
  const m = P.length;
  const pi = new Array(m).fill(0);
  const frames = [];
  frames.push({
    pi: pi.slice(), filled: 1, i: 0, k: 0, set: 0, compare: null, match: null, chain: [],
    note: `pi[0] = 0 by definition — a single character has no proper prefix that is also a suffix. Start at i = 1.`,
  });
  let k = 0;
  for (let i = 1; i < m; i++) {
    const chain = [];
    while (k > 0 && P[i] !== P[k]) {
      chain.push(k);
      frames.push({
        pi: pi.slice(), filled: i, i, k, set: null, compare: [i, k], match: false, chain: [...chain],
        note: `P[${i}]='${P[i]}' != P[${k}]='${P[k]}' -> fall back along the failure chain: k = pi[${k - 1}] = ${pi[k - 1]}.`,
      });
      k = pi[k - 1];
    }
    if (P[i] === P[k]) {
      frames.push({
        pi: pi.slice(), filled: i, i, k, set: null, compare: [i, k], match: true, chain: [...chain],
        note: `P[${i}]='${P[i]}' == P[${k}]='${P[k]}' -> extend the border by one: k -> ${k + 1}.`,
      });
      k++;
    }
    pi[i] = k;
    frames.push({
      pi: pi.slice(), filled: i + 1, i, k, set: i, compare: null, match: null, chain: [...chain],
      note: `Set pi[${i}] = ${k}. The longest border of P[0..${i}] has length ${k}.`,
    });
  }
  frames.push({
    pi: pi.slice(), filled: m, i: m, k, set: null, compare: null, match: null, chain: [],
    note: `Table complete. Each fallback strictly decreases k while increments raise it by 1; total fallbacks <= total increments <= m, so the build is O(m).`,
  });
  return frames;
}

export default function KmpDeepDiveViz() {
  const [pattern, setPattern] = useState(PRESETS[0]);
  const [frames, setFrames] = useState(() => buildFrames(PRESETS[0]));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.6);
  const timer = useRef(null);

  const total = frames.length;
  const cur = frames[Math.min(step, total - 1)];
  const delay = Math.round(950 / speed);
  const running = playing && step < total - 1;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [running, step, delay, total]);

  const pick = (p) => { setPattern(p); setPlaying(false); setFrames(buildFrames(p)); setStep(0); };

  const m = pattern.length;
  const W = 880;
  const cellW = Math.min(70, (W - 120) / m);
  const gridX = 96;
  const rowY1 = 58;
  const rowY2 = 108;

  return (
    <div className="kmpd">
      <div className="kmpd-head">
        <h3 className="kmpd-title">KMP failure function — building the table via the fallback chain</h3>
        <p className="kmpd-sub">
          pi[i] is the longest proper prefix of P[0..i] that is also a suffix. On a mismatch the build
          falls back along pi[k-1] until it can extend or reaches 0 — the exact chain the matcher reuses.
        </p>
      </div>

      <div className="kmpd-controls">
        <div className="kmpd-presets">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={`kmpd-preset ${pattern === p ? 'kmpd-preset-on' : ''}`} onClick={() => pick(p)}>{p}</button>
          ))}
        </div>
        <button type="button" className="kmpd-btn" onClick={() => { if (step >= total - 1) return; setPlaying((x) => !x); }} disabled={step >= total - 1}>
          {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="kmpd-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="kmpd-btn" onClick={() => setStep(total - 1)} disabled={step >= total - 1}>
          <SkipForward size={14} /> Skip
        </button>
        <button type="button" className="kmpd-btn" onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw size={14} /> Reset</button>
        <label className="kmpd-speed">
          <span className="kmpd-speed-label">speed</span>
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="kmpd-range" />
        </label>
        <div className="kmpd-stepcount">step <strong>{step + 1}</strong> / {total}</div>
      </div>

      <div className="kmpd-stage">
        <svg viewBox={`0 0 ${W} 186`} className="kmpd-svg" preserveAspectRatio="xMidYMid meet">
          <rect x={10} y={10} width={W - 20} height={166} fill="var(--surface)" stroke="var(--border)" rx={8} />
          <text x={20} y={rowY1 + 22} className="kmpd-rowtag">P</text>
          <text x={20} y={rowY2 + 22} className="kmpd-rowtag">pi</text>
          {pattern.split('').map((ch, i) => {
            const x = gridX + i * cellW;
            const isI = i === cur.i;
            const cmpI = cur.compare && cur.compare[0] === i;
            const cmpK = cur.compare && cur.compare[1] === i;
            const inChain = cur.chain.includes(i);
            const isK = i === cur.k && !cmpK;
            const piShown = i < cur.filled;
            let charFill = 'var(--bg)';
            let charStroke = 'var(--border)';
            if (cmpI && cur.match === true) { charFill = 'var(--easy)'; charStroke = 'var(--easy)'; }
            else if (cmpI && cur.match === false) { charFill = 'var(--hard)'; charStroke = 'var(--hard)'; }
            else if (cmpI) { charFill = 'var(--medium)'; charStroke = 'var(--medium)'; }
            else if (isI) { charStroke = 'var(--accent)'; charFill = 'rgba(var(--accent-rgb),0.12)'; }
            let kFill = 'var(--bg)';
            let kStroke = 'var(--border)';
            if (cmpK) { kFill = cur.match ? 'var(--easy)' : 'var(--medium)'; kStroke = kFill; }
            else if (inChain) { kStroke = 'var(--hue-violet)'; kFill = 'rgba(var(--accent-rgb),0.08)'; }
            else if (isK) { kStroke = 'var(--hue-sky)'; }
            return (
              <g key={i}>
                <text x={x + (cellW - 4) / 2} y={rowY1 - 8} className="kmpd-idx">{i}</text>
                <rect x={x} y={rowY1} width={cellW - 4} height={34} rx={4} fill={charFill} stroke={charStroke} strokeWidth={cmpI || isI ? 2.4 : 1.4} />
                <text x={x + (cellW - 4) / 2} y={rowY1 + 23} className="kmpd-char">{ch}</text>
                <rect x={x} y={rowY2} width={cellW - 4} height={34} rx={4} fill={kFill} stroke={kStroke} strokeWidth={cmpK || inChain ? 2.4 : 1.4} />
                <text x={x + (cellW - 4) / 2} y={rowY2 + 23} className="kmpd-pi">{piShown ? cur.pi[i] : '·'}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="kmpd-rows">
        <div className="kmpd-metric"><span className="kmpd-metric-label">i (current)</span><span className="kmpd-metric-value">{cur.i >= m ? 'done' : cur.i}</span></div>
        <div className="kmpd-metric"><span className="kmpd-metric-label">k (border len)</span><span className="kmpd-metric-value">{cur.k}</span></div>
        <div className="kmpd-metric"><span className="kmpd-metric-label">fallback chain</span><span className="kmpd-metric-value">{cur.chain.length ? cur.chain.join(' -> ') : '—'}</span></div>
      </div>

      <div className="kmpd-note">
        <span className="kmpd-note-label">step</span>
        <span className="kmpd-note-text">{cur.note}</span>
      </div>
    </div>
  );
}
