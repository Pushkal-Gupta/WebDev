import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './SecretsRotationViz.css';

const MODES = [
  { id: 'static', label: 'STATIC ROTATION' },
  { id: 'dynamic', label: 'DYNAMIC (VAULT / STS)' },
];

// Each frame is a snapshot. `now` is the timeline cursor position 0..1.
function buildStaticFrames() {
  const base = (extra) => ({
    mode: 'static',
    now: 0,
    activeSecret: 'pw-v1',
    ttl: null,
    race: 'safe',
    compromise: '—',
    stage: '',
    note: '',
    // validity bars: {id, x0, x1, hue, label, dim}
    bars: [],
    ...extra,
  });

  const v1 = { id: 'pw-v1', x0: 0.04, x1: 0.5, hue: 'var(--hue-sky)', label: 'password v1' };
  const v2 = { id: 'pw-v2', x0: 0.46, x1: 0.96, hue: 'var(--hue-violet)', label: 'password v2' };

  return [
    base({
      now: 0.06,
      stage: 'steady state',
      activeSecret: 'pw-v1',
      bars: [v1],
      note: 'Steady state: the app and the database share one long-lived password (v1), set once and baked into env config. Nothing rotates until a human or a cron triggers it.',
    }),
    base({
      now: 0.42,
      stage: 'generate new secret',
      activeSecret: 'pw-v1',
      bars: [v1, { ...v2, dim: true }],
      note: 'Step 1 — generate password v2. It exists in the secret store but is not deployed anywhere yet. The DB still only accepts v1.',
    }),
    base({
      now: 0.5,
      stage: 'deploy to app',
      activeSecret: 'pw-v1 → pw-v2',
      race: 'window',
      bars: [v1, v2],
      note: 'Step 2 — deploy v2 to the app config and roll instances. RACE WINDOW: some app pods now hold v2 while the DB still authenticates v1 — those connections fail until the DB is updated. Both must overlap.',
    }),
    base({
      now: 0.58,
      stage: 'update database',
      activeSecret: 'pw-v2',
      race: 'window',
      bars: [v1, v2],
      note: 'Step 3 — update the DB to accept v2. Briefly the DB accepts BOTH v1 and v2 (the overlap that keeps the swap from causing an outage). Any pod still on v1 keeps working for now.',
    }),
    base({
      now: 0.78,
      stage: 'revoke old after soak',
      activeSecret: 'pw-v2',
      race: 'safe',
      bars: [{ ...v1, dim: true }, v2],
      note: 'Step 4 — after a soak period (all pods confirmed on v2), revoke v1 at the DB. The race window closes. If you cut over with NO overlap instead, every in-flight v1 connection breaks at once — a self-inflicted outage.',
    }),
    base({
      now: 0.92,
      stage: 'done',
      activeSecret: 'pw-v2',
      race: 'safe',
      compromise: 'v1 leak still valid until revoked',
      bars: [{ ...v1, dim: true }, v2],
      note: 'Done. v2 is the new long-lived secret. Note the cost: between rotations a leaked password stays valid for the WHOLE cycle (often weeks). Static rotation only bounds the blast radius — it never removes the long-lived secret.',
    }),
  ];
}

function buildDynamicFrames() {
  const base = (extra) => ({
    mode: 'dynamic',
    now: 0,
    activeSecret: '—',
    ttl: null,
    race: 'n/a',
    compromise: '—',
    stage: '',
    note: '',
    bars: [],
    leakX: null,
    ...extra,
  });

  const lease1 = { id: 'lease-a', x0: 0.1, x1: 0.45, hue: 'var(--hue-mint)', label: 'user_xyz · TTL 1h' };
  const lease2 = { id: 'lease-b', x0: 0.45, x1: 0.8, hue: 'var(--hue-sky)', label: 'renewed lease · TTL 1h' };

  return [
    base({
      now: 0.06,
      stage: 'authenticate',
      activeSecret: '—',
      ttl: null,
      note: 'The app proves a STABLE identity to the secret store — a Kubernetes service account or an IAM role. No password lives in config; the identity is what is trusted.',
    }),
    base({
      now: 0.12,
      stage: 'issue short-lived credential',
      activeSecret: 'user_xyz',
      ttl: 60,
      bars: [lease1],
      note: 'The store mints a fresh credential on demand — a random DB user with TTL = 1h. It is bound to this lease and to nothing else. The credential never existed before this request.',
    }),
    base({
      now: 0.3,
      stage: 'in use',
      activeSecret: 'user_xyz',
      ttl: 33,
      bars: [lease1],
      note: 'The app connects with the leased credential. The TTL bar counts down — the credential is good for the remaining window only. There is no swap, no race: the DB and the app reference the same lease.',
    }),
    base({
      now: 0.42,
      stage: 'renew before expiry',
      activeSecret: 'user_xyz → renewed',
      ttl: 8,
      bars: [lease1, lease2],
      note: 'Before the TTL hits zero, a renewal heartbeat extends the lease (or issues a fresh one). A Vault Agent sidecar typically handles this so the app never holds an expired credential.',
    }),
    base({
      now: 0.55,
      stage: 'credential leaked',
      activeSecret: 'renewed lease',
      ttl: 30,
      bars: [lease2],
      leakX: 0.55,
      compromise: 'leaked token — TTL still running',
      note: 'Suppose the live credential is exfiltrated here. With a long-lived secret this would be a perpetual breach. Here it is bound to a TTL that is already ticking down.',
    }),
    base({
      now: 0.82,
      stage: 'auto-expire',
      activeSecret: 'renewed lease',
      ttl: 0,
      bars: [{ ...lease2, dim: true }],
      leakX: 0.55,
      compromise: 'leaked token EXPIRED — access denied',
      note: 'At TTL = 0 the lease is revoked and the DB user is dropped automatically. The leaked credential goes dark with no human in the loop. Blast radius = minutes, not months.',
    }),
    base({
      now: 0.94,
      stage: 'done',
      activeSecret: 'next lease on demand',
      ttl: null,
      compromise: 'contained',
      note: 'Done. Credentials are minted per-lease, renewed under load, and expire themselves. Nothing long-lived ever touches config — the entire race window of static rotation simply does not exist.',
    }),
  ];
}

const RUN_DELAY_MS = 1300;

export default function SecretsRotationViz() {
  const [mode, setMode] = useState('static');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'static' ? buildStaticFrames() : buildDynamicFrames()),
    [mode],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchMode = (id) => {
    if (id === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(id);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 430;

  // timeline geometry
  const tlX0 = 60;
  const tlX1 = W - 60;
  const tlW = tlX1 - tlX0;
  const tlY = 250;
  const tx = (t) => tlX0 + t * tlW;

  const barY = 110;
  const barH = 30;
  const barGap = 14;

  const nowX = tx(current.now);

  return (
    <div className="srv">
      <div className="srv-head">
        <h3 className="srv-title">Secrets rotation — static swap vs short-lived credentials</h3>
        <p className="srv-sub">
          Walk a credential along a timeline. In static rotation, watch the race window where the app and the
          database briefly disagree. In dynamic mode, watch a leaked credential go dark on its own when its TTL
          expires.
        </p>
      </div>

      <div className="srv-controls">
        <div className="srv-modes" role="tablist" aria-label="Rotation mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`srv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="srv-speed">
          <span className="srv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="srv-speed-range"
            aria-label="Playback speed"
          />
          <span className="srv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="srv-spacer" aria-hidden="true" />

        <div className="srv-buttons">
          <button
            type="button"
            className="srv-btn srv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="srv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="srv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="srv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="srv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="srv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="srv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="srv-track-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.0" />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
            <filter id="srv-now-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <text className="srv-stage-label" x={tlX0} y={40}>
            {mode === 'static' ? 'STATIC ROTATION TIMELINE' : 'DYNAMIC CREDENTIAL TIMELINE'}
          </text>
          <text className="srv-stage-stage" x={tlX1} y={40} textAnchor="end">
            {current.stage}
          </text>

          {/* validity bars */}
          {current.bars.map((b, bi) => {
            const x0 = tx(b.x0);
            const x1 = tx(b.x1);
            const y = barY + bi * (barH + barGap);
            return (
              <g key={b.id} className={`srv-bar-g ${b.dim ? 'is-dim' : ''}`}>
                <rect
                  className="srv-bar"
                  x={x0}
                  y={y}
                  width={Math.max(2, x1 - x0)}
                  height={barH}
                  rx={6}
                  style={{ fill: b.hue }}
                />
                <text className="srv-bar-label" x={x0 + 8} y={y + barH / 2 + 4}>
                  {b.label}
                </text>
              </g>
            );
          })}

          {/* race window highlight (static) */}
          {mode === 'static' && current.race === 'window' && (
            <g>
              <rect
                className="srv-race"
                x={tx(0.46)}
                y={barY - 8}
                width={tx(0.5) - tx(0.46) + (tx(0.5) - tx(0.46))}
                height={2 * barH + barGap + 16}
                rx={6}
              />
              <text className="srv-race-text" x={tx(0.5)} y={barY - 14} textAnchor="middle">
                RACE WINDOW
              </text>
            </g>
          )}

          {/* leaked credential marker (dynamic) */}
          {mode === 'dynamic' && current.leakX != null && (
            <g className={`srv-leak ${current.ttl === 0 ? 'is-dark' : ''}`}>
              <circle className="srv-leak-dot" cx={tx(current.leakX)} cy={barY + barH / 2} r={9} />
              <text className="srv-leak-text" x={tx(current.leakX)} y={barY - 10} textAnchor="middle">
                {current.ttl === 0 ? 'leaked · EXPIRED' : 'leaked token'}
              </text>
            </g>
          )}

          {/* timeline axis */}
          <line className="srv-track-base" x1={tlX0} y1={tlY} x2={tlX1} y2={tlY} />
          <rect className="srv-track-grad" x={tlX0} y={tlY - 3} width={tlW} height={6} rx={3} fill="url(#srv-track-grad)" />
          <text className="srv-axis-tick" x={tlX0} y={tlY + 24} textAnchor="start">t = 0</text>
          <text className="srv-axis-tick" x={tlX1} y={tlY + 24} textAnchor="end">later</text>

          {/* now cursor */}
          <g filter="url(#srv-now-glow)">
            <line className="srv-now" x1={nowX} y1={barY - 24} x2={nowX} y2={tlY + 6} />
            <polygon
              className="srv-now-head"
              points={`${nowX - 7},${tlY + 6} ${nowX + 7},${tlY + 6} ${nowX},${tlY + 18}`}
            />
          </g>
          <text className="srv-now-label" x={nowX} y={barY - 30} textAnchor="middle">now</text>

          {/* TTL countdown bar (dynamic) */}
          {mode === 'dynamic' && (
            <g>
              <text className="srv-ttl-label" x={tlX0} y={tlY + 64}>
                LEASE TTL
              </text>
              <rect className="srv-ttl-track" x={tlX0 + 96} y={tlY + 52} width={tlW - 96} height={18} rx={9} />
              {current.ttl != null && (
                <rect
                  className={`srv-ttl-fill ${current.ttl === 0 ? 'is-empty' : current.ttl <= 12 ? 'is-low' : ''}`}
                  x={tlX0 + 96}
                  y={tlY + 52}
                  width={Math.max(0, ((tlW - 96) * current.ttl) / 60)}
                  height={18}
                  rx={9}
                />
              )}
              <text className="srv-ttl-val" x={tlX1} y={tlY + 65} textAnchor="end">
                {current.ttl == null ? 'no active lease' : `${current.ttl} min left`}
              </text>
            </g>
          )}

          {/* race status line (static) */}
          {mode === 'static' && (
            <g>
              <text className="srv-ttl-label" x={tlX0} y={tlY + 64}>
                APP / DB SYNC
              </text>
              <rect
                className={`srv-sync-pill ${current.race === 'window' ? 'is-bad' : 'is-ok'}`}
                x={tlX0 + 110}
                y={tlY + 50}
                width={300}
                height={22}
                rx={11}
              />
              <text className="srv-sync-text" x={tlX0 + 110 + 150} y={tlY + 65} textAnchor="middle">
                {current.race === 'window' ? 'mismatch possible — both creds must work' : 'app and DB agree on one secret'}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="srv-metrics">
        <div className="srv-metric">
          <span className="srv-metric-label">mode</span>
          <span className="srv-metric-value">{mode === 'static' ? 'static' : 'dynamic'}</span>
        </div>
        <div className="srv-metric">
          <span className="srv-metric-label">active secret</span>
          <span className="srv-metric-value">{current.activeSecret}</span>
        </div>
        <div className="srv-metric">
          <span className="srv-metric-label">{mode === 'dynamic' ? 'ttl remaining' : 'race window'}</span>
          <span className={`srv-metric-value ${mode === 'static' && current.race === 'window' ? 'is-bad' : ''}`}>
            {mode === 'dynamic'
              ? (current.ttl == null ? '—' : `${current.ttl} min`)
              : (current.race === 'window' ? 'OPEN' : 'closed')}
          </span>
        </div>
        <div className="srv-metric">
          <span className="srv-metric-label">compromise outcome</span>
          <span className={`srv-metric-value ${current.compromise.includes('EXPIRED') || current.compromise === 'contained' ? 'is-good' : current.compromise.includes('leak') ? 'is-bad' : ''}`}>
            {current.compromise}
          </span>
        </div>
      </div>

      <div className="srv-narration">
        <span className="srv-narration-label">trace</span>
        <span className="srv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
