import React, { useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 380;
const L = 50;
const R = 18;
const T = 30;
const B = 46;
const PW = W - L - R;
const PH = H - T - B;

const EPOCHS = 60;

function snap(v, p = 2) {
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

// Build deterministic train/val curves over EPOCHS.
// Train falls monotonically toward a small floor. Val falls, bottoms out, then climbs (U-shape) + jitter.
function buildCurves() {
  const rand = mulberry32(20260616);
  const train = [];
  const val = [];
  const valBottom = 26; // epoch where the underlying val curve bottoms out
  for (let e = 0; e <= EPOCHS; e++) {
    // train: exponential decay to ~0.08
    const tr = 0.08 + 1.05 * Math.exp(-e / 11);
    train.push(tr);
    // val: parabola-ish around valBottom plus the train trend, plus noise
    const base = 0.34 + 0.9 * Math.exp(-e / 9) + 0.00055 * (e - valBottom) ** 2;
    const noise = (rand() - 0.5) * 0.045;
    val.push(Math.max(0.05, base + noise));
  }
  return { train, val, valBottom };
}

export default function EarlyStoppingViz() {
  const { train, val } = useMemo(() => buildCurves(), []);

  // best-val checkpoint (argmin of val)
  const bestEpoch = useMemo(() => {
    let bi = 0;
    for (let i = 1; i < val.length; i++) if (val[i] < val[bi]) bi = i;
    return bi;
  }, [val]);

  const [stopEpoch, setStopEpoch] = useState(bestEpoch);
  const [patience, setPatience] = useState(5);
  const svgRef = useRef(null);

  // Where the patience rule would actually fire: first epoch with `patience`
  // consecutive non-improvements over the running best.
  const patienceStop = useMemo(() => {
    let best = Infinity;
    let counter = 0;
    for (let e = 0; e < val.length; e++) {
      if (val[e] < best - 1e-9) {
        best = val[e];
        counter = 0;
      } else {
        counter += 1;
        if (counter >= patience) return e;
      }
    }
    return EPOCHS;
  }, [val, patience]);

  const yMax = useMemo(() => Math.max(...train, ...val) * 1.05, [train, val]);
  const yMin = 0;

  const ex = (e) => L + (e / EPOCHS) * PW;
  const ey = (v) => T + (1 - (v - yMin) / (yMax - yMin)) * PH;

  function pathFor(arr) {
    return arr.map((v, e) => `${e === 0 ? 'M' : 'L'}${snap(ex(e), 1)},${snap(ey(v), 1)}`).join(' ');
  }

  // overfitting region after the stop marker, between the two curves
  function gapArea() {
    const start = Math.max(stopEpoch, bestEpoch);
    if (start >= EPOCHS) return null;
    const top = [];
    const bot = [];
    for (let e = start; e <= EPOCHS; e++) {
      top.push(`${e === start ? 'M' : 'L'}${snap(ex(e), 1)},${snap(ey(val[e]), 1)}`);
    }
    for (let e = EPOCHS; e >= start; e--) {
      bot.push(`L${snap(ex(e), 1)},${snap(ey(train[e]), 1)}`);
    }
    return top.join(' ') + ' ' + bot.join(' ') + ' Z';
  }

  function handlePointer(clientX) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const e = Math.round(((px - L) / PW) * EPOCHS);
    setStopEpoch(Math.max(0, Math.min(EPOCHS, e)));
  }

  const dragging = useRef(false);
  const onDown = (ev) => {
    dragging.current = true;
    handlePointer(ev.clientX ?? ev.touches?.[0]?.clientX);
  };
  const onMove = (ev) => {
    if (!dragging.current) return;
    handlePointer(ev.clientX ?? ev.touches?.[0]?.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const gap = snap(val[stopEpoch] - train[stopEpoch], 3);
  const pastBest = stopEpoch > bestEpoch;

  const gridY = [0.25, 0.5, 0.75, 1.0].map((f) => yMin + f * (yMax - yMin));

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}`, cursor: 'ew-resize' }}
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          {/* gridlines */}
          {gridY.map((g, i) => (
            <g key={`g-${i}`}>
              <line x1={L} y1={ey(g)} x2={L + PW} y2={ey(g)} stroke="var(--border)" strokeWidth="0.4" strokeDasharray="2 3" opacity="0.5" />
              <text x={L - 6} y={ey(g) + 3} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
                {snap(g, 2)}
              </text>
            </g>
          ))}
          {/* axes */}
          <line x1={L} y1={T} x2={L} y2={T + PH} stroke="var(--border)" strokeWidth="0.8" />
          <line x1={L} y1={T + PH} x2={L + PW} y2={T + PH} stroke="var(--border)" strokeWidth="0.8" />
          {[0, 15, 30, 45, 60].map((e) => (
            <text key={`xt-${e}`} x={ex(e)} y={T + PH + 14} fontSize="7.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
              {e}
            </text>
          ))}
          <text x={L + PW / 2} y={H - 6} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            EPOCH
          </text>

          {/* overfitting gap region after best */}
          {gapArea() && <path d={gapArea()} fill="rgba(var(--accent-rgb), 0.08)" stroke="none" />}

          {/* curves */}
          <path d={pathFor(train)} fill="none" stroke="var(--hue-mint)" strokeWidth="2" />
          <path d={pathFor(val)} fill="none" stroke="var(--hue-pink)" strokeWidth="2" />

          {/* best-val checkpoint */}
          <line x1={ex(bestEpoch)} y1={T} x2={ex(bestEpoch)} y2={T + PH} stroke="var(--hue-mint)" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.7" />
          <circle cx={ex(bestEpoch)} cy={ey(val[bestEpoch])} r="5" fill="var(--hue-mint)" stroke="var(--bg)" strokeWidth="1.3" />
          <text x={ex(bestEpoch)} y={T - 6} fontSize="8" fill="var(--hue-mint)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
            best val · e{bestEpoch}
          </text>

          {/* patience-fired marker */}
          {patienceStop < EPOCHS && (
            <g>
              <line x1={ex(patienceStop)} y1={T} x2={ex(patienceStop)} y2={T + PH} stroke="var(--warning)" strokeWidth="0.9" strokeDasharray="1 3" opacity="0.8" />
              <text x={ex(patienceStop)} y={T + PH + 28} fontSize="7.5" fill="var(--warning)" fontFamily="var(--mono)" textAnchor="middle">
                patience fires · e{patienceStop}
              </text>
            </g>
          )}

          {/* draggable stop marker */}
          <g>
            <line x1={ex(stopEpoch)} y1={T - 2} x2={ex(stopEpoch)} y2={T + PH} stroke="var(--accent)" strokeWidth="1.6" />
            <rect x={ex(stopEpoch) - 7} y={T - 16} width="14" height="11" rx="2" fill="var(--accent)" />
            <circle cx={ex(stopEpoch)} cy={ey(train[stopEpoch])} r="4" fill="var(--hue-mint)" stroke="var(--bg)" strokeWidth="1.2" />
            <circle cx={ex(stopEpoch)} cy={ey(val[stopEpoch])} r="4" fill="var(--hue-pink)" stroke="var(--bg)" strokeWidth="1.2" />
          </g>

          {/* legend */}
          <g fontFamily="var(--mono)" fontSize="8">
            <line x1={L + 8} y1={T + 10} x2={L + 24} y2={T + 10} stroke="var(--hue-mint)" strokeWidth="2" />
            <text x={L + 28} y={T + 13} fill="var(--text-dim)">train</text>
            <line x1={L + 70} y1={T + 10} x2={L + 86} y2={T + 10} stroke="var(--hue-pink)" strokeWidth="2" />
            <text x={L + 90} y={T + 13} fill="var(--text-dim)">val</text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">stop epoch</span>
          <input type="range" min="0" max={EPOCHS} step="1" value={stopEpoch} onChange={(e) => setStopEpoch(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{stopEpoch}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">patience</span>
          <input type="range" min="1" max="20" step="1" value={patience} onChange={(e) => setPatience(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{patience}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">@stop</span>
            <span className="mlviz-val">
              train {snap(train[stopEpoch], 3)} · val {snap(val[stopEpoch], 3)}
            </span>
            <span className="mlviz-sub">losses at the marker (drag it on the chart)</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">gap</span>
            <span className="mlviz-val">{gap}</span>
            <span className="mlviz-sub">{pastBest ? 'val − train widening: overfitting' : 'still tracking — not overfit yet'}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">best</span>
            <span className="mlviz-val">
              epoch {bestEpoch} · val {snap(val[bestEpoch], 3)}
            </span>
            <span className="mlviz-sub">restore THIS checkpoint, not the last weights</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">rule</span>
            <span className="mlviz-val">
              {patienceStop < EPOCHS ? `patience=${patience} fires at epoch ${patienceStop}` : `patience=${patience} never fires`}
            </span>
            <span className="mlviz-sub">stop after {patience} evals with no new best</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => { setStopEpoch(bestEpoch); setPatience(5); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          train loss falls forever · val loss U-turns at the best checkpoint · everything right of it is memorised noise
        </div>
      </div>
    </div>
  );
}
