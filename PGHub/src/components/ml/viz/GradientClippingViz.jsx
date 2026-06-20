import React, { useEffect, useMemo, useState } from 'react';
import { Sliders, RotateCcw, Scissors, AlertTriangle } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * GradientClippingViz
 *
 * Synthetic 1D training run over N_STEPS. At each step we sample a "raw" gradient:
 *   - 92% of the time: small N(0, 0.6)
 *   - 8% of the time: huge spike, ±|N(0, 12)| (exploding gradient)
 *
 * Two parallel parameter trajectories evolve under fixed lr:
 *   - unclipped: theta -= lr * g
 *   - clipped:   theta -= lr * clip(g, threshold)   (norm clipping, here just abs in 1D)
 *
 * Loss model: f(theta) = (theta - target)^2; we plot the loss curve for each path.
 *
 * Slider: clip threshold. Readouts: # of steps clipped, max grad norm, final loss for both.
 */

const W = 720;
const H = 360;
const PAD_X = 18;
const PANEL_TOP = 28;
const PANEL_H = H - PANEL_TOP - 56;

const N_STEPS = 100;
const SEED = 11;
const LR = 0.04;
const TARGET = 1.0;
const SPIKE_PROB = 0.08;
const NORMAL_SIG = 0.6;
const SPIKE_SIG = 12.0;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

function loss(theta) {
  return (theta - TARGET) * (theta - TARGET);
}

export default function GradientClippingViz() {
  const [threshold, setThreshold] = useState(1.0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // deterministic raw gradients g_t and "true descent direction" sign — independent of threshold
  const rawGrads = useMemo(() => {
    const r = mulberry32(SEED);
    const arr = [];
    for (let i = 0; i < N_STEPS; i++) {
      const isSpike = r() < SPIKE_PROB;
      let g;
      if (isSpike) {
        g = Math.abs(gauss(r)) * SPIKE_SIG;
        if (r() < 0.5) g = -g;
      } else {
        // bias toward descent: g points away from target on average
        // We compute gradient at the true target with noise so SGD makes net progress
        g = gauss(r) * NORMAL_SIG + 2 * (0 - TARGET); // mean ≈ -2 to drive theta upward from 0
      }
      arr.push(g);
    }
    return arr;
  }, []);

  // simulate both trajectories (depend on threshold)
  const { unclipped, clipped, stats } = useMemo(() => {
    let thetaU = 0;
    let thetaC = 0;
    const uArr = [{ step: 0, theta: 0, loss: loss(0) }];
    const cArr = [{ step: 0, theta: 0, loss: loss(0) }];
    let clippedCount = 0;
    let maxNorm = 0;
    for (let i = 0; i < N_STEPS; i++) {
      const g = rawGrads[i];
      const absG = Math.abs(g);
      if (absG > maxNorm) maxNorm = absG;
      // unclipped
      thetaU = thetaU - LR * g;
      // clipped: rescale to threshold if abs exceeds it
      let gc = g;
      if (absG > threshold) {
        gc = (g / absG) * threshold;
        clippedCount += 1;
      }
      thetaC = thetaC - LR * gc;
      // clamp display range to prevent runaway off-chart
      const thetaU_disp = Math.max(-20, Math.min(20, thetaU));
      const thetaC_disp = Math.max(-20, Math.min(20, thetaC));
      uArr.push({ step: i + 1, theta: thetaU_disp, loss: loss(thetaU_disp) });
      cArr.push({ step: i + 1, theta: thetaC_disp, loss: loss(thetaC_disp) });
    }
    return {
      unclipped: uArr,
      clipped: cArr,
      stats: {
        clippedCount,
        maxNorm,
        finalLossU: uArr[uArr.length - 1].loss,
        finalLossC: cArr[cArr.length - 1].loss,
      },
    };
  }, [rawGrads, threshold]);

  // viewport mapping for top (loss) and bottom (gradient) panels
  const plotL = PAD_X + 28;
  const plotR = W - PAD_X - 8;
  const splitMid = PANEL_TOP + PANEL_H / 2 - 4;
  const lossT = PANEL_TOP + 12;
  const lossB = splitMid - 6;
  const gradT = splitMid + 16;
  const gradB = PANEL_TOP + PANEL_H - 12;
  const plotW = plotR - plotL;

  // y scaling — loss capped to a sensible visible range; we use sqrt to compress huge unclipped spikes
  const LOSS_MAX = 16;
  const mapStepX = (s) => plotL + (s / N_STEPS) * plotW;
  const mapLossY = (ls) => {
    const v = Math.min(LOSS_MAX, ls);
    return lossB - (Math.sqrt(v) / Math.sqrt(LOSS_MAX)) * (lossB - lossT);
  };
  const GRAD_MAX = 20;
  const mapGradY = (g) => {
    const v = Math.max(-GRAD_MAX, Math.min(GRAD_MAX, g));
    const midY = (gradT + gradB) / 2;
    const range = (gradB - gradT) / 2;
    return midY - (v / GRAD_MAX) * range;
  };

  const pathLoss = (arr) => {
    if (arr.length === 0) return '';
    let d = `M ${mapStepX(arr[0].step).toFixed(2)} ${mapLossY(arr[0].loss).toFixed(2)}`;
    for (let i = 1; i < arr.length; i++) {
      d += ` L ${mapStepX(arr[i].step).toFixed(2)} ${mapLossY(arr[i].loss).toFixed(2)}`;
    }
    return d;
  };

  const handleReset = () => setThreshold(1.0);

  const transition = reducedMotion ? 'none' : 'd 0.18s ease';

  const formulaHtml = useMemo(
    () => katexHtml('\\tilde{g} = g \\cdot \\min\\!\\bigl(1,\\, c/\\|g\\|\\bigr)'),
    []
  );

  const ratioCU = stats.finalLossU > 1e-9 ? stats.finalLossC / stats.finalLossU : 0;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* top panel: loss */}
          <rect
            x={plotL - 6}
            y={lossT - 6}
            width={plotW + 12}
            height={lossB - lossT + 12}
            rx={6}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.5"
          />
          <text x={plotL} y={lossT - 6} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            LOSS · √-scaled to absorb spikes
          </text>
          {/* y ticks */}
          {[0, 1, 4, 9, 16].map((v) => (
            <g key={v}>
              <line x1={plotL} y1={mapLossY(v)} x2={plotR} y2={mapLossY(v)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.6" />
              <text x={plotL - 4} y={mapLossY(v) + 3} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">{v}</text>
            </g>
          ))}
          <path d={pathLoss(unclipped)} fill="none" stroke="var(--hue-pink)" strokeWidth="1.5" opacity="0.85" style={{ transition }} />
          <path d={pathLoss(clipped)} fill="none" stroke="var(--accent)" strokeWidth="1.6" opacity="0.95" style={{ transition }} />

          {/* loss legend */}
          <g transform={`translate(${plotR - 196}, ${lossT + 6})`}>
            <rect x="0" y="0" width="190" height="34" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.6" opacity="0.85" />
            <line x1="8" y1="11" x2="22" y2="11" stroke="var(--hue-pink)" strokeWidth="2" />
            <text x="28" y="14" fontSize="9" fill="var(--text-main)" fontFamily="var(--mono)">unclipped · L={stats.finalLossU.toFixed(2)}</text>
            <line x1="8" y1="25" x2="22" y2="25" stroke="var(--accent)" strokeWidth="2" />
            <text x="28" y="28" fontSize="9" fill="var(--text-main)" fontFamily="var(--mono)">clipped · L={stats.finalLossC.toFixed(2)}</text>
          </g>

          {/* bottom panel: gradients */}
          <rect
            x={plotL - 6}
            y={gradT - 6}
            width={plotW + 12}
            height={gradB - gradT + 12}
            rx={6}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.5"
          />
          <text x={plotL} y={gradT - 6} fontSize="10" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.14em">
            RAW GRADIENT g_t · spikes flagged
          </text>
          {/* zero line */}
          <line x1={plotL} y1={(gradT + gradB) / 2} x2={plotR} y2={(gradT + gradB) / 2} stroke="var(--border)" strokeWidth="0.7" strokeDasharray="2 3" />
          {/* threshold band */}
          <line x1={plotL} y1={mapGradY(threshold)} x2={plotR} y2={mapGradY(threshold)} stroke="var(--accent)" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.7" />
          <line x1={plotL} y1={mapGradY(-threshold)} x2={plotR} y2={mapGradY(-threshold)} stroke="var(--accent)" strokeWidth="0.9" strokeDasharray="3 3" opacity="0.7" />
          <text x={plotR - 4} y={mapGradY(threshold) - 3} fontSize="8" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="end">+c</text>
          <text x={plotR - 4} y={mapGradY(-threshold) + 10} fontSize="8" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="end">−c</text>

          {/* gradient stems */}
          {rawGrads.map((g, i) => {
            const x = mapStepX(i + 1);
            const y0 = (gradT + gradB) / 2;
            const y1 = mapGradY(g);
            const isClipped = Math.abs(g) > threshold;
            return (
              <line
                key={i}
                x1={x}
                y1={y0}
                x2={x}
                y2={y1}
                stroke={isClipped ? 'var(--hue-pink)' : 'var(--hue-sky)'}
                strokeWidth={isClipped ? 1.2 : 0.8}
                opacity={isClipped ? 0.9 : 0.55}
              />
            );
          })}
          {/* spike markers */}
          {rawGrads.map((g, i) => {
            if (Math.abs(g) <= threshold) return null;
            const x = mapStepX(i + 1);
            const y1 = mapGradY(g);
            return <circle key={`m-${i}`} cx={x} cy={y1} r={1.6} fill="var(--hue-pink)" opacity="0.95" />;
          })}

          {/* y ticks for grad */}
          {[-15, -5, 0, 5, 15].map((v) => (
            <text key={v} x={plotL - 4} y={mapGradY(v) + 3} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">{v}</text>
          ))}

          {/* footer */}
          <text x={W / 2} y={H - 8} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.08em">
            tight clip (low c) → stable but slow · loose clip (high c) → spikes blow up the unclipped run
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              clip threshold c
            </span>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{threshold.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Scissors size={11} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>steps clipped</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {stats.clippedCount} / {N_STEPS}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <AlertTriangle size={11} style={{ color: 'var(--hue-pink)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>max |g|</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{stats.maxNorm.toFixed(2)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>L_final unclipped</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{stats.finalLossU.toFixed(3)}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>L_final clipped</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>{stats.finalLossC.toFixed(3)}</span>
          </span>
          <span className="mlviz-sub">
            ratio C/U = {ratioCU < 1e-3 ? '0.000' : ratioCU.toFixed(3)}
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem' }}>
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setThreshold((c) => Math.max(0.1, +(c - 0.5).toFixed(2)))}>
            <span>tighter c</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => setThreshold((c) => Math.min(10, +(c + 0.5).toFixed(2)))}>
            <span>looser c</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {N_STEPS} steps · spike prob {Math.round(SPIKE_PROB * 100)}% · spike σ = {SPIKE_SIG}
          </span>
        </div>

        <div className="mlviz-hint">
          drag c down — unclipped run explodes on the next spike · drag up — clipping disengages
        </div>
      </div>
    </div>
  );
}
