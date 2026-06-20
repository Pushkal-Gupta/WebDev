import React, { useMemo, useState } from 'react';
import { ToggleLeft, ToggleRight, Target } from 'lucide-react';
import './FeatureFlagsViz.css';

const USERS = 40;

// Stable per-user hash → bucket 0..99. The flag is enabled for a user when
// either a targeting rule matches OR their bucket falls under the rollout %.
// Hashing on a stable user key (not random) is what makes a 30% rollout sticky:
// the same users stay in as you ramp, instead of reshuffling each evaluation.
function userBucket(id) {
  let h = (id + 1) * 2654435761;
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) % 100;
}

// A handful of users are "internal" (targeting rule: always on).
function isTargeted(id) {
  return id % 13 === 0;
}

function evaluate(id, enabled, rollout, targeting) {
  if (!enabled) return { on: false, reason: 'flag off' };
  if (targeting && isTargeted(id)) return { on: true, reason: 'targeted' };
  const bucket = userBucket(id);
  if (bucket < rollout) return { on: true, reason: `bucket ${bucket} < ${rollout}` };
  return { on: false, reason: `bucket ${bucket} ≥ ${rollout}` };
}

export default function FeatureFlagsViz() {
  const [enabled, setEnabled] = useState(true);
  const [rollout, setRollout] = useState(30);
  const [targeting, setTargeting] = useState(true);

  const users = useMemo(() => Array.from({ length: USERS }).map((_, id) => ({
    id,
    bucket: userBucket(id),
    targeted: isTargeted(id),
    ...evaluate(id, enabled, rollout, targeting),
  })), [enabled, rollout, targeting]);

  const onCount = useMemo(() => users.filter((u) => u.on).length, [users]);
  const onPct = Math.round((onCount / USERS) * 100);
  const targetedOn = useMemo(() => users.filter((u) => u.on && u.reason === 'targeted').length, [users]);

  // SVG geometry — grid of user dots
  const W = 940;
  const cols = 10;
  const rows = USERS / cols;
  const gx = 84;
  const gw = W - gx - 28;
  const cell = gw / cols;
  const gridTop = 64;
  const H = gridTop + rows * cell + 30;

  return (
    <div className="ffv">
      <div className="ffv-head">
        <h3 className="ffv-title">Feature flags — rollout by user bucket</h3>
        <p className="ffv-sub">
          A flag decides who sees a feature. Each user hashes to a stable bucket 0&ndash;99; the rollout %
          admits every bucket below the line. Targeting rules force specific cohorts on regardless of the %.
        </p>
      </div>

      <div className="ffv-controls">
        <button type="button" className={`ffv-toggle ${enabled ? 'is-on' : ''}`} onClick={() => setEnabled((v) => !v)}>
          {enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} flag {enabled ? 'enabled' : 'disabled'}
        </button>
        <label className="ffv-slider">
          <span className="ffv-input-label">rollout %</span>
          <input type="range" min={0} max={100} step={5} value={rollout} disabled={!enabled}
            onChange={(e) => setRollout(Number(e.target.value))} className="ffv-range" aria-label="Rollout percent" />
          <span className="ffv-slider-val">{rollout}%</span>
        </label>
        <span className="ffv-spacer" aria-hidden="true" />
        <button type="button" className={`ffv-toggle ${targeting ? 'is-on' : ''}`} onClick={() => setTargeting((v) => !v)}>
          <Target size={14} /> targeting {targeting ? 'on' : 'off'}
        </button>
      </div>

      <div className="ffv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ffv-svg" preserveAspectRatio="xMidYMid meet"
          role="img" aria-label="User population colored by flag evaluation">
          <text x={gx} y={40} className="ffv-axis-label">
            user population ({USERS}) — filled = sees the feature, ring = targeted cohort
          </text>
          {users.map((u) => {
            const col = u.id % cols;
            const row = Math.floor(u.id / cols);
            const cx = gx + col * cell + cell / 2;
            const cy = gridTop + row * cell + cell / 2;
            const r = Math.min(cell, cell) * 0.32;
            const cls = !u.on ? 'is-off' : (u.reason === 'targeted' ? 'is-target' : 'is-on');
            return (
              <g key={`u-${u.id}`}>
                <circle cx={cx} cy={cy} r={r} className={`ffv-user ${cls}`} />
                {u.targeted && <circle cx={cx} cy={cy} r={r + 3.5} className="ffv-target-ring" />}
                <text x={cx} y={cy + 3} className="ffv-user-bucket" textAnchor="middle">{u.bucket}</text>
              </g>
            );
          })}
          <text x={gx} y={H - 10} className="ffv-foot">
            {enabled
              ? `bucket < ${rollout} → on${targeting ? '; targeted cohort forced on (rings)' : ''}.`
              : 'flag disabled — nobody sees the feature, rollout % is ignored.'}
          </text>
        </svg>
      </div>

      <div className="ffv-metrics">
        <div className="ffv-metric">
          <span className="ffv-metric-label">% enabled</span>
          <span className="ffv-metric-value">{onPct}%</span>
        </div>
        <div className="ffv-metric">
          <span className="ffv-metric-label">users on / total</span>
          <span className="ffv-metric-value">{onCount} / {USERS}</span>
        </div>
        <div className="ffv-metric">
          <span className="ffv-metric-label">via rollout bucket</span>
          <span className="ffv-metric-value">{onCount - targetedOn}</span>
        </div>
        <div className="ffv-metric">
          <span className="ffv-metric-label"><Target size={11} /> via targeting</span>
          <span className="ffv-metric-value is-target">{targetedOn}</span>
        </div>
      </div>

      <div className="ffv-narration">
        <span className="ffv-narration-label">trace</span>
        <span className="ffv-narration-body">
          {enabled
            ? `At ${rollout}% rollout, ${onCount - targetedOn} users land below the bucket cutoff${targeting ? ` plus ${targetedOn} forced on by targeting` : ''} — ${onPct}% see the feature. Ramp the slider and the same users stay in (sticky hashing).`
            : 'Flag is off: every evaluation returns false. Re-enable to resume the bucketed rollout.'}
        </span>
      </div>
    </div>
  );
}
