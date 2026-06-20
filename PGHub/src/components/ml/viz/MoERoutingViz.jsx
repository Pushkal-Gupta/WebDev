import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StepForward, RotateCcw, Play, Square } from 'lucide-react';
import './MLViz.css';

/*
 * Sparse Mixture-of-Experts routing.
 * A stream of tokens arrives one at a time. A gating network produces a softmax
 * over E experts; we keep the top-k, renormalise their gate weights, and send
 * the token to those experts. We accumulate per-expert load (token count) and
 * draw a load-balancing bar. Gate logits are deterministic (mulberry32 per
 * token id), so the whole run is reproducible. Sliders: number of experts E,
 * top-k. Readout: per-expert utilisation + balance (coefficient of variation).
 */

const W = 600;
const H = 360;

const COLOR_GATE = 'var(--hue-violet)';
const COLOR_ON = 'var(--accent)';
const COLOR_LOAD = 'var(--hue-sky)';
const COLOR_HOT = 'var(--hue-pink)';

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softmax(z) {
  const m = Math.max(...z);
  const ex = z.map((x) => Math.exp(x - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
}

// Deterministic gate logits for token #tid over E experts.
// A couple of experts get a standing bias so imbalance is visible without
// load-balancing (the classic MoE failure mode).
function gateLogits(tid, E) {
  const rand = mulberry32(1009 + tid * 31);
  const z = [];
  for (let i = 0; i < E; i++) z.push(rand() * 2.2);
  z[0] += 1.3;
  if (E > 3) z[2] += 0.8;
  return z;
}

function topK(probs, k) {
  return probs
    .map((p, i) => [p, i])
    .sort((a, b) => b[0] - a[0])
    .slice(0, k)
    .map(([, i]) => i);
}

export default function MoERoutingViz() {
  const [E, setE] = useState(6);
  const [k, setK] = useState(2);
  const [tid, setTid] = useState(0); // tokens routed so far
  const [load, setLoad] = useState(() => new Array(6).fill(0));
  const [running, setRunning] = useState(false);
  const loadRef = useRef(new Array(6).fill(0));
  const tidRef = useRef(0);
  const runningRef = useRef(false);
  const timerRef = useRef(null);
  const eRef = useRef(6);
  const kRef = useRef(2);

  // current token's gate
  const logits = useMemo(() => gateLogits(tid, E), [tid, E]);
  const probs = useMemo(() => softmax(logits), [logits]);
  const chosen = useMemo(() => topK(probs, Math.min(k, E)), [probs, k, E]);
  const chosenSet = useMemo(() => new Set(chosen), [chosen]);
  // renormalised gate weights over chosen experts
  const renorm = useMemo(() => {
    const sum = chosen.reduce((a, i) => a + probs[i], 0);
    const out = new Array(E).fill(0);
    chosen.forEach((i) => { out[i] = probs[i] / sum; });
    return out;
  }, [chosen, probs, E]);

  const resetLoad = useCallback((newE) => {
    const arr = new Array(newE).fill(0);
    loadRef.current = arr;
    setLoad(arr);
    tidRef.current = 0;
    setTid(0);
  }, []);

  const route = useCallback(() => {
    const curE = eRef.current;
    const curK = kRef.current;
    const t = tidRef.current;
    const p = softmax(gateLogits(t, curE));
    const sel = topK(p, Math.min(curK, curE));
    const arr = loadRef.current.slice();
    sel.forEach((i) => { arr[i] += 1; });
    loadRef.current = arr;
    setLoad(arr);
    tidRef.current = t + 1;
    setTid(t + 1);
  }, []);

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  const handlePlay = useCallback(() => {
    if (runningRef.current) { runningRef.current = false; setRunning(false); clearTimer(); return; }
    runningRef.current = true; setRunning(true);
    const tick = () => {
      if (!runningRef.current) return;
      route();
      if (tidRef.current >= 60) { runningRef.current = false; setRunning(false); clearTimer(); return; }
      timerRef.current = setTimeout(tick, 220);
    };
    timerRef.current = setTimeout(tick, 120);
  }, [route]);

  const reset = useCallback(() => {
    runningRef.current = false; setRunning(false); clearTimer();
    resetLoad(eRef.current);
  }, [resetLoad]);

  const onChangeE = (v) => {
    eRef.current = v; setE(v);
    if (kRef.current > v) { kRef.current = v; setK(v); }
    resetLoad(v);
  };
  const onChangeK = (v) => { kRef.current = v; setK(v); };

  // load stats
  const total = load.reduce((a, b) => a + b, 0) || 1;
  const util = load.map((c) => c / total);
  const idealShare = (Math.min(k, E)) / E; // expected fraction per expert if perfectly balanced (each token hits k experts)
  const mean = load.reduce((a, b) => a + b, 0) / E;
  const variance = load.reduce((a, c) => a + (c - mean) ** 2, 0) / E;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0; // coefficient of variation: 0 = perfect balance
  const maxLoad = Math.max(...load, 1);

  // --- layout ---
  const tokX = 40;
  const tokY = 60;
  const gateX = 150;
  const gateY = 40;
  const expX0 = 320;
  const expW = 200;
  const rowH = Math.min(34, (H - 130) / E);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" style={{ maxWidth: '820px' }}>
          {/* incoming token */}
          <text x={tokX} y={tokY - 16} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">token #{tid}</text>
          <circle cx={tokX} cy={tokY + 10} r="14" fill={COLOR_GATE} opacity="0.85" />
          <text x={tokX} y={tokY + 14} fontSize="9" fill="var(--bg)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">x</text>

          {/* gate box */}
          <rect x={gateX} y={gateY} width="86" height={H - 100} rx="8" fill="var(--surface)" stroke="var(--border)" />
          <text x={gateX + 43} y={gateY + 16} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">gate g(x)</text>
          {/* gate weight bars (mini) */}
          {probs.map((p, i) => {
            const yy = gateY + 28 + i * ((H - 100 - 36) / E);
            const on = chosenSet.has(i);
            return (
              <g key={`g${i}`}>
                <rect x={gateX + 8} y={yy} width={70 * p} height={(H - 100 - 36) / E - 4} rx="2" fill={on ? COLOR_ON : COLOR_GATE} opacity={on ? 0.9 : 0.4} />
                <text x={gateX + 8} y={yy + ((H - 100 - 36) / E - 4) / 2 + 3} fontSize="6.5" fill="var(--text-main)" fontFamily="var(--mono)">{snap(p, 2)}</text>
              </g>
            );
          })}

          {/* token -> gate wire */}
          <line x1={tokX + 14} y1={tokY + 10} x2={gateX} y2={gateY + (H - 100) / 2} stroke="var(--text-dim)" strokeWidth="1" opacity="0.6" />

          {/* experts column */}
          <text x={expX0 + expW / 2} y={28} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.06em">
            EXPERTS · load over {tid} tokens
          </text>
          {Array.from({ length: E }).map((_, i) => {
            const yy = 40 + i * rowH;
            const on = chosenSet.has(i);
            const w = util[i];
            const hot = util[i] > idealShare * 1.6;
            return (
              <g key={`e${i}`}>
                {/* routing wire from gate to chosen experts */}
                {on && (
                  <line x1={gateX + 86} y1={gateY + 28 + i * ((H - 100 - 36) / E) + ((H - 100 - 36) / E) / 2}
                    x2={expX0 - 4} y2={yy + rowH / 2} stroke={COLOR_ON} strokeWidth={1 + renorm[i] * 3} opacity="0.8" />
                )}
                {/* expert box */}
                <rect x={expX0} y={yy} width="70" height={rowH - 6} rx="6"
                  fill={on ? COLOR_ON : 'var(--surface)'} opacity={on ? 0.85 : 0.5}
                  stroke={on ? COLOR_ON : 'var(--border)'} strokeWidth="1" />
                <text x={expX0 + 35} y={yy + (rowH - 6) / 2 + 3} fontSize="9" fill={on ? 'var(--bg)' : 'var(--text-main)'} fontFamily="var(--mono)" textAnchor="middle" fontWeight={on ? 700 : 400}>E{i}</text>
                {/* load bar */}
                <rect x={expX0 + 80} y={yy + 2} width={expW - 84} height={rowH - 10} rx="3" fill="var(--border)" opacity="0.2" />
                <rect x={expX0 + 80} y={yy + 2} width={Math.max(1, (load[i] / maxLoad) * (expW - 84))} height={rowH - 10} rx="3" fill={hot ? COLOR_HOT : COLOR_LOAD} opacity="0.75" />
                <text x={expX0 + 84} y={yy + (rowH - 6) / 2 + 3} fontSize="7" fill="var(--text-main)" fontFamily="var(--mono)">{load[i]} · {snap(w * 100, 0)}%</text>
              </g>
            );
          })}

          {/* ideal-share reference */}
          <line x1={expX0 + 80 + idealShare * 0} y1={40} x2={expX0 + 80} y2={H - 56} stroke="var(--text-dim)" strokeWidth="0" />
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">experts E</span>
          <input type="range" min="3" max="10" step="1" value={E} onChange={(e) => onChangeE(parseInt(e.target.value, 10))} disabled={running} />
          <span className="mlviz-slider-val">{E}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">top-k</span>
          <input type="range" min="1" max={E} step="1" value={k} onChange={(e) => onChangeK(parseInt(e.target.value, 10))} disabled={running} />
          <span className="mlviz-slider-val">{Math.min(k, E)}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">route</span>
            <span className="mlviz-val">token #{tid} → {chosen.map((i) => `E${i}`).join(', ') || '—'}</span>
            <span className="mlviz-sub">gate weights renorm: [{chosen.map((i) => snap(renorm[i], 2)).join(', ')}]</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">compute</span>
            <span className="mlviz-val">{Math.min(k, E)} / {E} experts = {snap((Math.min(k, E) / E) * 100, 0)}% of dense</span>
            <span className="mlviz-sub">params stay full; only k experts run per token</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">balance</span>
            <span className="mlviz-val">CV = {snap(cv, 3)}</span>
            <span className="mlviz-sub">load spread (0 = perfectly even) · pink = overloaded expert</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={route} disabled={running}>
            <StepForward size={13} />
            <span>Route token</span>
          </button>
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={handlePlay}>
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Stream tokens'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          the gate scores every expert; only the top-k run, so compute is k/E of a dense layer while parameters span all E · without a balancing loss the gate collapses onto a few favourites — watch the CV climb and an expert turn pink
        </div>
      </div>
    </div>
  );
}
