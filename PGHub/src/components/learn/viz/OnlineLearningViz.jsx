import React, { useMemo, useState } from 'react';
import { GitBranch, RotateCcw, StepForward, FastForward } from 'lucide-react';
import './OnlineLearningViz.css';

// Online learning vs static batch model.
//
// A 1-D regression toy: each sample (x, y) arrives one at a time with the true
// relation y ≈ w*·x. The ONLINE model takes one SGD step per sample:
//     w ← w − η · (w·x − y) · x         (perceptron/LMS update)
// The STATIC model was trained once on the first regime and never updates, so
// when the data distribution drifts (w* jumps), the static model's error climbs
// while the online model tracks the new slope after a short adaptation lag.
//
// Fully deterministic: a fixed pseudo-stream (mulberry-free, table-driven) so
// the same steps always replay. No Math.random.

const ETA = 0.06; // learning rate for the online SGD update
const N_STEPS = 60;
const DRIFT_AT = 30; // when drift is enabled, true slope jumps at this step
const W_TRUE_A = 1.4; // regime 1 true slope
const W_TRUE_B = -0.8; // regime 2 true slope (after drift)
const W_STATIC = 1.4; // static model frozen at regime-1 fit

// A fixed cycle of x values so the stream is reproducible and well-conditioned.
const X_CYCLE = [0.9, -1.2, 1.5, -0.6, 1.1, -1.4, 0.7, -0.9, 1.3, -1.1];

function simulate(drift) {
  let wOnline = W_TRUE_A; // online model starts already fit to regime 1
  const series = [];
  let onlineSq = 0;
  let staticSq = 0;
  for (let i = 0; i < N_STEPS; i++) {
    const x = X_CYCLE[i % X_CYCLE.length];
    const wStar = drift && i >= DRIFT_AT ? W_TRUE_B : W_TRUE_A;
    const y = wStar * x; // clean target (deterministic)

    // errors measured BEFORE the online model sees this label
    const eOnline = wOnline * x - y;
    const eStatic = W_STATIC * x - y;
    onlineSq += eOnline * eOnline;
    staticSq += eStatic * eStatic;

    // online SGD step
    wOnline = wOnline - ETA * eOnline * x;

    series.push({
      i: i + 1,
      x,
      wStar,
      wOnline,
      onlineErr: Math.sqrt(onlineSq / (i + 1)),
      staticErr: Math.sqrt(staticSq / (i + 1)),
      drifted: drift && i >= DRIFT_AT,
    });
  }
  return series;
}

export default function OnlineLearningViz() {
  const [drift, setDrift] = useState(true);
  const [step, setStep] = useState(N_STEPS);

  const full = useMemo(() => simulate(drift), [drift]);
  const seen = full.slice(0, step);
  const last = seen[seen.length - 1] || full[0];

  // adaptation lag: steps since drift until online error stops climbing back
  // toward the static gap — approximated as steps for online error to fall to
  // within 10% of its pre-drift level after the jump.
  const adaptLag = useMemo(() => {
    if (!drift) return 0;
    const post = full.slice(DRIFT_AT);
    const recovered = post.findIndex((p) => Math.abs(p.wOnline - W_TRUE_B) < 0.15);
    return recovered === -1 ? post.length : recovered + 1;
  }, [full, drift]);

  const reset = () => {
    setDrift(true);
    setStep(N_STEPS);
  };
  const stepOne = () => setStep((s) => Math.min(N_STEPS, s + 1));
  const playAll = () => setStep(N_STEPS);

  // SVG geometry — error-vs-samples line chart (numeric axes; horizontal ok).
  const W = 940;
  const H = 470;
  const padL = 56;
  const padR = 28;
  const padT = 44;
  const padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxErr = useMemo(() => {
    const m = Math.max(...full.map((d) => Math.max(d.onlineErr, d.staticErr)), 0.5);
    return Math.ceil(m * 10) / 10;
  }, [full]);

  const px = (i) => padL + ((i - 1) / (N_STEPS - 1)) * plotW;
  const py = (e) => padT + plotH - (e / maxErr) * plotH;

  const pathFor = (key) =>
    seen.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${px(d.i).toFixed(1)} ${py(d[key]).toFixed(1)}`).join(' ');

  const driftX = px(DRIFT_AT + 1);
  const yTicks = [0, maxErr / 2, maxErr];
  const xTicks = [1, 15, 30, 45, 60];

  return (
    <div className="olv">
      <div className="olv-head">
        <h3 className="olv-title">Online learning — adapt per sample, not per retrain</h3>
        <p className="olv-sub">
          An online model takes one gradient step on every incoming sample, so it tracks a shifting data
          distribution. A static model trained once degrades the moment the world changes — watch the error gap open.
        </p>
      </div>

      <div className="olv-controls">
        <button
          type="button"
          className={`olv-btn ${drift ? 'olv-btn-primary' : ''}`}
          onClick={() => setDrift((v) => !v)}
        >
          <GitBranch size={14} /> {drift ? `Concept drift ON (@${DRIFT_AT})` : 'Inject concept drift'}
        </button>

        <span className="olv-spacer" aria-hidden="true" />

        <span className="olv-step-tag">sample {step}/{N_STEPS}</span>
        <button type="button" className="olv-btn olv-btn-primary" onClick={stepOne}>
          <StepForward size={14} /> Step stream
        </button>
        <button type="button" className="olv-btn" onClick={playAll}>
          <FastForward size={14} /> Play all
        </button>
        <button type="button" className="olv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="olv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="olv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="olv-col-title" x={padL} y={28}>running error (RMSE) vs samples seen</text>

          {/* y grid + labels */}
          {yTicks.map((t) => (
            <g key={`y-${t}`}>
              <line className="olv-grid" x1={padL} y1={py(t)} x2={padL + plotW} y2={py(t)} />
              <text className="olv-axis-lbl olv-axis-y" x={padL - 10} y={py(t) + 4}>{t.toFixed(2)}</text>
            </g>
          ))}
          {/* x labels */}
          {xTicks.map((t) => (
            <text key={`x-${t}`} className="olv-axis-lbl olv-axis-x" x={px(t)} y={padT + plotH + 22}>{t}</text>
          ))}
          <text className="olv-axis-cap" x={padL + plotW / 2} y={H - 12}>samples →</text>

          {/* drift marker */}
          {drift && (
            <g>
              <line className="olv-drift-line" x1={driftX} y1={padT} x2={driftX} y2={padT + plotH} />
              <text className="olv-drift-lbl" x={driftX} y={padT - 6}>distribution shift</text>
            </g>
          )}

          {/* static model error */}
          <path className="olv-line is-static" d={pathFor('staticErr')} />
          {/* online model error */}
          <path className="olv-line is-online" d={pathFor('onlineErr')} />

          {/* head dots */}
          <circle className="olv-dot is-static" cx={px(last.i)} cy={py(last.staticErr)} r={4} />
          <circle className="olv-dot is-online" cx={px(last.i)} cy={py(last.onlineErr)} r={4} />

          {/* legend */}
          <g transform={`translate(${padL + plotW - 168}, ${padT + 6})`}>
            <rect className="olv-legend-bg" x={-10} y={-14} width={178} height={44} rx={6} />
            <line className="olv-line is-online" x1={0} y1={0} x2={20} y2={0} />
            <text className="olv-legend-lbl" x={26} y={4}>online (per-sample SGD)</text>
            <line className="olv-line is-static" x1={0} y1={18} x2={20} y2={18} />
            <text className="olv-legend-lbl" x={26} y={22}>static (frozen batch fit)</text>
          </g>
        </svg>
      </div>

      <div className="olv-metrics">
        <div className="olv-metric">
          <span className="olv-metric-label">samples seen</span>
          <span className="olv-metric-value">{step} / {N_STEPS}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">online error (RMSE)</span>
          <span className="olv-metric-value is-online">{last.onlineErr.toFixed(3)}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">static error (RMSE)</span>
          <span className="olv-metric-value is-static">{last.staticErr.toFixed(3)}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">adaptation lag</span>
          <span className="olv-metric-value is-lag">{drift ? `${adaptLag} samples` : 'no drift'}</span>
        </div>
        <div className="olv-metric">
          <span className="olv-metric-label">online slope ŵ</span>
          <span className="olv-metric-value">{last.wOnline.toFixed(2)} → target {last.wStar.toFixed(2)}</span>
        </div>
      </div>

      <div className="olv-narration">
        <span className="olv-narration-label">why it matters</span>
        <span className="olv-narration-body">
          {drift
            ? `At sample ${DRIFT_AT} the true relationship flips (slope ${W_TRUE_A} → ${W_TRUE_B}). The static model can't move — its running error climbs and stays high. The online model nudges its weight one sample at a time and re-fits the new regime within ~${adaptLag} samples. That short adaptation lag is the price of never retraining from scratch.`
            : 'No drift: both models track the same regime, so their errors stay close and the static fit is fine. The online model only earns its keep when the distribution moves — spam filters, recommendation, fraud, sensor streams — where yesterday\'s batch model is already stale. Turn on concept drift to see the gap open.'}
        </span>
      </div>
    </div>
  );
}
