import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, ChevronRight, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 420;
const PAD = 36;
const PANEL_W = 120;
const STAGE_W = W - PANEL_W - PAD * 2;
const STAGE_H = H - PAD * 2;
const STAGE_X = PAD;
const STAGE_Y = PAD;

const NUM_CLASSES = 3;
const PER_CLASS = 4;
const TOTAL = NUM_CLASSES * PER_CLASS;
const SEED = 0xBADC0DE;

const CLASS_COLORS = [
  'var(--accent)',
  'var(--hue-pink)',
  'var(--hue-mint)',
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Map [-1.4, 1.4] -> stage coords (kept inside the box with margin)
function toScreen(x, y) {
  const cx = STAGE_X + STAGE_W / 2 + (x / 1.6) * (STAGE_W / 2 - 14);
  const cy = STAGE_Y + STAGE_H / 2 - (y / 1.6) * (STAGE_H / 2 - 14);
  return { sx: cx, sy: cy };
}

function initialPoints(rng) {
  // Scatter all 12 points roughly uniformly; classes intermingle so training
  // has work to do.
  const pts = [];
  for (let i = 0; i < TOTAL; i += 1) {
    const cls = Math.floor(i / PER_CLASS);
    pts.push({
      x: (rng() - 0.5) * 2.4,
      y: (rng() - 0.5) * 2.4,
      cls,
    });
  }
  return pts;
}

function pairDist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// SimCLR-style InfoNCE energy: for each anchor i, sim = -d^2 / (2*tau).
// loss_i = -log( sum_j_same_class exp(sim_ij) / sum_j_diff_class exp(sim_ij) ).
function totalEnergy(pts, tau) {
  const t = Math.max(0.05, tau);
  let total = 0;
  for (let i = 0; i < pts.length; i += 1) {
    let posSum = 0;
    let negSum = 0;
    for (let j = 0; j < pts.length; j += 1) {
      if (i === j) continue;
      const d = pairDist(pts[i], pts[j]);
      const s = Math.exp(-(d * d) / (2 * t));
      if (pts[i].cls === pts[j].cls) posSum += s;
      else negSum += s;
    }
    const denom = posSum + negSum;
    if (denom <= 0 || posSum <= 0) {
      total += 6;
    } else {
      total += -Math.log(posSum / denom);
    }
  }
  return total;
}

// One small SimCLR-style update: positives pulled together; negatives pushed apart,
// with magnitudes softmaxed at temperature τ.
function stepUpdate(pts, tau, lr = 0.045) {
  const t = Math.max(0.05, tau);
  const out = pts.map((p) => ({ ...p }));

  for (let i = 0; i < pts.length; i += 1) {
    let fx = 0;
    let fy = 0;
    // Per-anchor softmax weights for negatives only (hardest neg gets most push).
    const negSims = [];
    const negIdx = [];
    for (let j = 0; j < pts.length; j += 1) {
      if (i === j || pts[j].cls === pts[i].cls) continue;
      const d = pairDist(pts[i], pts[j]);
      negSims.push(-(d * d) / (2 * t));
      negIdx.push(j);
    }
    const maxS = negSims.length ? Math.max(...negSims) : 0;
    const exps = negSims.map((s) => Math.exp(s - maxS));
    const sumE = exps.reduce((acc, v) => acc + v, 0) || 1;
    const negW = exps.map((v) => v / sumE);

    for (let j = 0; j < pts.length; j += 1) {
      if (i === j) continue;
      const dx = pts[j].x - pts[i].x;
      const dy = pts[j].y - pts[i].y;
      const d = Math.sqrt(dx * dx + dy * dy) + 1e-6;
      const ux = dx / d;
      const uy = dy / d;
      if (pts[j].cls === pts[i].cls) {
        // Pull toward j (uniformly across same-class peers).
        const pull = 1.0 / (PER_CLASS - 1 || 1);
        fx += ux * pull;
        fy += uy * pull;
      } else {
        // Push away from j, weighted by softmax weight.
        const k = negIdx.indexOf(j);
        const w = negW[k] || 0;
        // Push more when closer (already implicit in the softmax + 1/d scaling)
        const mag = w * (1.4 + 1.2 / d);
        fx -= ux * mag;
        fy -= uy * mag;
      }
    }

    // Clamp force step for stability and apply.
    const fnorm = Math.sqrt(fx * fx + fy * fy);
    const maxStep = 1.5;
    const scale = fnorm > maxStep ? maxStep / fnorm : 1;
    out[i].x += fx * scale * lr;
    out[i].y += fy * scale * lr;

    // Soft-bound so points don't escape the box.
    out[i].x = Math.max(-1.5, Math.min(1.5, out[i].x));
    out[i].y = Math.max(-1.5, Math.min(1.5, out[i].y));
  }
  return out;
}

export default function ContrastiveTrainingDynamicsViz() {
  const initial = useMemo(() => initialPoints(mulberry32(SEED)), []);
  const [points, setPoints] = useState(initial);
  const [tau, setTau] = useState(0.4);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  // For the loss history mini-chart.
  const [history, setHistory] = useState(() => [totalEnergy(initial, 0.4)]);

  const advance = useCallback(() => {
    setPoints((prev) => {
      const next = stepUpdate(prev, tau);
      setHistory((h) => {
        const e = totalEnergy(next, tau);
        const trimmed = h.length >= 80 ? h.slice(1) : h;
        return [...trimmed, e];
      });
      return next;
    });
    setStep((s) => s + 1);
  }, [tau]);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setInterval(() => advance(), 110);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running, advance]);

  const reset = useCallback(() => {
    setRunning(false);
    const fresh = initialPoints(mulberry32(SEED));
    setPoints(fresh);
    setStep(0);
    setHistory([totalEnergy(fresh, tau)]);
  }, [tau]);

  const energy = useMemo(() => totalEnergy(points, tau), [points, tau]);

  // Mini chart in right panel.
  const chart = useMemo(() => {
    const ux = 90;
    const uy = 56;
    const x0 = W - PANEL_W - PAD / 2 + 16;
    const y0 = STAGE_Y + 230;
    const maxE = Math.max(...history, 1);
    const minE = Math.min(...history, 0);
    const span = Math.max(0.5, maxE - minE);
    const pts = history.map((v, i) => {
      const px = x0 + (i / Math.max(1, history.length - 1)) * ux;
      const py = y0 + uy - ((v - minE) / span) * uy;
      return `${px},${py}`;
    });
    return { x0, y0, ux, uy, polyline: pts.join(' '), maxE, minE };
  }, [history]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}
        >
          {/* Stage */}
          <rect
            x={STAGE_X - 10}
            y={STAGE_Y - 10}
            width={STAGE_W + 20}
            height={STAGE_H + 20}
            rx={12}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Crosshairs */}
          <line
            x1={STAGE_X}
            y1={STAGE_Y + STAGE_H / 2}
            x2={STAGE_X + STAGE_W}
            y2={STAGE_Y + STAGE_H / 2}
            stroke="var(--text-dim)"
            strokeWidth={0.6}
            opacity={0.4}
          />
          <line
            x1={STAGE_X + STAGE_W / 2}
            y1={STAGE_Y}
            x2={STAGE_X + STAGE_W / 2}
            y2={STAGE_Y + STAGE_H}
            stroke="var(--text-dim)"
            strokeWidth={0.6}
            opacity={0.4}
          />

          <text
            x={STAGE_X + 8}
            y={STAGE_Y + 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            EMBEDDING SPACE · {NUM_CLASSES} CLASSES × {PER_CLASS} SAMPLES
          </text>

          {/* Same-class faint connectors (show clustering progress) */}
          {points.map((p, i) =>
            points.map((q, j) => {
              if (j <= i) return null;
              if (p.cls !== q.cls) return null;
              const a = toScreen(p.x, p.y);
              const b = toScreen(q.x, q.y);
              return (
                <line
                  key={`pos-${i}-${j}`}
                  x1={a.sx}
                  y1={a.sy}
                  x2={b.sx}
                  y2={b.sy}
                  stroke={CLASS_COLORS[p.cls]}
                  strokeWidth={0.8}
                  opacity={0.32}
                />
              );
            }),
          )}

          {/* Points */}
          {points.map((p, i) => {
            const { sx, sy } = toScreen(p.x, p.y);
            return (
              <g key={`pt-${i}`}>
                <circle cx={sx} cy={sy} r={8} fill={CLASS_COLORS[p.cls]} opacity={0.22} />
                <circle cx={sx} cy={sy} r={4} fill={CLASS_COLORS[p.cls]} />
              </g>
            );
          })}

          {/* Right metrics panel */}
          <g>
            <rect
              x={W - PANEL_W - PAD / 2 + 4}
              y={STAGE_Y - 10}
              width={PANEL_W}
              height={STAGE_H + 20}
              rx={10}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            {(() => {
              const px = W - PANEL_W - PAD / 2 + 16;
              return (
                <g>
                  <text x={px} y={STAGE_Y + 6} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">METRICS</text>

                  <text x={px} y={STAGE_Y + 28} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">STEP</text>
                  <text x={px} y={STAGE_Y + 44} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--text-main)">{step}</text>

                  <text x={px} y={STAGE_Y + 68} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">τ</text>
                  <text x={px} y={STAGE_Y + 84} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--text-main)">{tau.toFixed(2)}</text>

                  <text x={px} y={STAGE_Y + 108} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">ENERGY</text>
                  <text x={px} y={STAGE_Y + 124} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--accent)">{energy.toFixed(2)}</text>

                  <text x={px} y={STAGE_Y + 148} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">Σ InfoNCE</text>
                  <text x={px} y={STAGE_Y + 162} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" opacity={0.7}>over 12 anchors</text>

                  <text x={px} y={STAGE_Y + 220} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">LOSS HISTORY</text>

                  {/* Mini chart */}
                  <rect
                    x={chart.x0 - 2}
                    y={chart.y0 - 2}
                    width={chart.ux + 4}
                    height={chart.uy + 4}
                    fill="var(--bg)"
                    stroke="var(--border)"
                    strokeWidth={0.6}
                    rx={3}
                  />
                  <polyline
                    points={chart.polyline}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={1.4}
                  />

                  <text x={px} y={STAGE_Y + STAGE_H - 40} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">CLASSES</text>
                  {CLASS_COLORS.map((c, i) => (
                    <g key={`leg-${i}`}>
                      <circle cx={px + 4} cy={STAGE_Y + STAGE_H - 24 + i * 12} r={4} fill={c} />
                      <text
                        x={px + 14}
                        y={STAGE_Y + STAGE_H - 20 + i * 12}
                        fontSize="10"
                        fontFamily="var(--serif, serif)"
                        fontStyle="italic"
                        fill="var(--text-main)"
                      >
                        class {i + 1}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">temperature τ</span>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.01"
              value={tau}
              onChange={(e) => setTau(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{tau.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag">step</span>
          <span className="mlviz-val">{step}</span>
          <span className="mlviz-sub">number of SimCLR-style updates applied</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag">energy</span>
          <span className="mlviz-val">{energy.toFixed(3)}</span>
          <span className="mlviz-sub">Σ InfoNCE — drops as same-class points cluster and inter-class points separate</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={advance}
            disabled={running}
          >
            <ChevronRight size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? <Pause size={13} /> : <Play size={13} />}
            <span>{running ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          small τ sharpens the softmax — hardest negative dominates the push · large τ smooths it · watch same-class points form tight clusters as energy falls
        </div>
      </div>
    </div>
  );
}
