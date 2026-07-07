import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, ChevronRight, RotateCcw, KeyRound, ShieldAlert, ShieldCheck,
  RefreshCw, Ban, Plus, Gauge, CheckCircle2, XCircle,
} from 'lucide-react';
import './SecKeyRotationViz.css';

// The rotate -> migrate -> revoke drill for a leaked credential, staged as a
// vertical lifecycle timeline. A key leaks (stage 0) and is still live, so the
// attacker's requests succeed. A new standby key is issued (stage 1); both keys
// now work. Apps migrate to the new key (stage 2). Finally the old key is
// revoked (stage 3) — from that instant the leaked key is dead and the attacker
// is locked out, while legitimate traffic never dropped. Revoking LAST is what
// buys zero downtime. Fully deterministic — the step index drives everything.

const STAGES = [
  { key: 'leak', title: 'key leaked', detail: 'old key exposed publicly', tone: 'bad' },
  { key: 'issue', title: 'new standby key issued', detail: 'both keys now valid', tone: 'warn' },
  { key: 'migrate', title: 'apps migrate to new key', detail: 'traffic moved to new key', tone: 'warn' },
  { key: 'revoke', title: 'old key revoked', detail: 'leaked key is now dead', tone: 'ok' },
];
const TOTAL_STEPS = STAGES.length;
const RUN_DELAY_MS = 1600;

// SVG geometry — a single centered vertical column of stage nodes, data flowing
// downward, plus a live request panel on the right showing old vs new key status.
const W = 620;
const H = 440;
const COL_X = 30;
const COL_W = 330;
const NODE_H = 66;
const NODE_GAP = 26;
const TOP = 20;
const nodeY = (i) => TOP + i * (NODE_H + NODE_GAP);
const COL_MID = COL_X + COL_W / 2;
const PANEL_X = 392;
const PANEL_W = 200;

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SecKeyRotationViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const isRunning = isRunningRaw && step < TOTAL_STEPS - 1;
  const baseDelay = prefersReduced() ? RUN_DELAY_MS * 1.6 : RUN_DELAY_MS;
  const delay = Math.round(baseDelay / Math.max(0.5, speed));

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => { setIsRunning(false); setStep(0); };

  // Deterministic state derived purely from the step index.
  const oldKeyLive = step < 3;        // revoked at the last stage
  const newKeyExists = step >= 1;     // issued at stage 1
  const migrated = step >= 2;         // apps switched at stage 2
  const revoked = step >= 3;

  // Who each key represents right now, and whether a request with it succeeds.
  const attackerReq = oldKeyLive ? 'ok' : 'fail';       // attacker holds the OLD key
  const legitReq = migrated ? 'new' : 'old';            // which key legit apps use
  const legitOk = migrated ? newKeyExists : oldKeyLive; // legit traffic never drops

  const contained = revoked;
  const stageTone = STAGES[step].tone;

  const playLabel = isRunningRaw && step < TOTAL_STEPS - 1
    ? 'Pause'
    : (step >= TOTAL_STEPS - 1 ? 'Replay' : 'Play');

  const STEP_NOTE = {
    leak: 'The old key has leaked — committed to a public repo, printed in a log, shipped in a bundle. It is still a valid, live credential, so every request the attacker makes with it succeeds. The clock is now running.',
    issue: 'Rotate: a brand-new key is issued while the old one stays live. For this overlap window both keys work — nothing breaks. Do NOT revoke yet; production still authenticates with the old key.',
    migrate: 'Migrate: every service, function, and environment is updated to use the new key and traffic is confirmed to have moved over. Legitimate requests now ride the new key; the old key is still valid but idle for your apps.',
    revoke: 'Revoke: only now is the old key disabled. From this instant the leaked credential is dead — the attacker is locked out with a 401 — while legitimate traffic, already on the new key, never dropped a request. Zero-downtime containment.',
  };

  const nodeState = (i) => {
    if (step === i) return 'active';
    if (step > i) return 'done';
    return 'idle';
  };

  const stageIcons = [ShieldAlert, Plus, RefreshCw, Ban];

  return (
    <div className="skr">
      <div className="skr-head">
        <div className="skr-head-icon"><KeyRound size={18} /></div>
        <div className="skr-head-text">
          <h3 className="skr-title">Key rotation — rotate, migrate, revoke</h3>
          <p className="skr-sub">
            A leaked key stays dangerous until it is revoked. Issue a new key first, migrate every
            app onto it, then kill the old one last — the attacker is cut off with no downtime.
          </p>
        </div>
        <button type="button" className="skr-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="skr-controls">
        <div className="skr-stagepills" role="group" aria-label="Lifecycle stages">
          {STAGES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`skr-pill ${step === i ? 'is-on' : ''} ${step > i ? 'is-done' : ''}`}
              onClick={() => { setIsRunning(false); setStep(i); }}
              title={s.detail}
            >
              {i + 1}. {s.key}
            </button>
          ))}
        </div>

        <span className="skr-spacer" aria-hidden="true" />

        <label className="skr-speed">
          <Gauge size={13} />
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="skr-speed-range"
            aria-label="Playback speed"
          />
          <span className="skr-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="skr-buttons">
          <button
            type="button"
            className="skr-btn skr-btn-primary"
            onClick={() => {
              if (step >= TOTAL_STEPS - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < TOTAL_STEPS - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="skr-btn"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="skr-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="skr-stepcount">
          stage <strong>{step + 1}</strong> / {TOTAL_STEPS}
        </div>
      </div>

      <div className="skr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="skr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="skr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="skr-arrow-head" />
            </marker>
            <filter id="skr-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <text className="skr-col-tag" x={COL_X} y={12}>KEY LIFECYCLE · flows downward</text>

          {/* downward trunk connectors between stage nodes */}
          {STAGES.slice(0, -1).map((s, i) => (
            <line
              key={`conn-${s.key}`}
              x1={COL_MID}
              y1={nodeY(i) + NODE_H}
              x2={COL_MID}
              y2={nodeY(i + 1)}
              className={`skr-conn ${step > i ? 'is-live' : ''}`}
              markerEnd="url(#skr-arrow)"
            />
          ))}

          {/* stage nodes */}
          {STAGES.map((s, i) => {
            const Icon = stageIcons[i];
            const st = nodeState(i);
            return (
              <g key={s.key} className={`skr-node is-${s.tone} is-${st}`}>
                <rect
                  x={COL_X}
                  y={nodeY(i)}
                  width={COL_W}
                  height={NODE_H}
                  rx={10}
                  className="skr-node-box"
                  filter={st === 'active' ? 'url(#skr-glow)' : undefined}
                />
                <g transform={`translate(${COL_X + 18}, ${nodeY(i) + NODE_H / 2 - 10})`}>
                  <Icon width={20} height={20} className={`skr-node-ic is-${s.tone}`} />
                </g>
                <text className="skr-node-idx" x={COL_X + COL_W - 16} y={nodeY(i) + 22} textAnchor="end">
                  {i + 1}
                </text>
                <text className="skr-node-title" x={COL_X + 50} y={nodeY(i) + 28}>{s.title}</text>
                <text className="skr-node-detail" x={COL_X + 50} y={nodeY(i) + 48}>{s.detail}</text>
              </g>
            );
          })}

          {/* live request panel — old vs new key at the current stage */}
          <text className="skr-col-tag" x={PANEL_X} y={12}>LIVE REQUESTS · at this stage</text>
          <rect x={PANEL_X} y={TOP} width={PANEL_W} height={196} rx={10} className="skr-panel" />

          {/* OLD KEY (the leaked one, held by the attacker) */}
          <g transform={`translate(${PANEL_X + 16}, ${TOP + 20})`}>
            <KeyRound width={15} height={15} className={`skr-panel-ic is-${oldKeyLive ? 'bad' : 'dead'}`} />
          </g>
          <text className="skr-panel-key" x={PANEL_X + 40} y={TOP + 32}>old key (leaked)</text>
          <rect
            x={PANEL_X + 16}
            y={TOP + 44}
            width={PANEL_W - 32}
            height={44}
            rx={8}
            className={`skr-req is-${oldKeyLive ? 'ok-bad' : 'dead'}`}
          />
          <g transform={`translate(${PANEL_X + 28}, ${TOP + 58})`}>
            {oldKeyLive
              ? <CheckCircle2 width={16} height={16} className="skr-req-ic is-bad" />
              : <XCircle width={16} height={16} className="skr-req-ic is-ok" />}
          </g>
          <text className={`skr-req-text is-${oldKeyLive ? 'bad' : 'ok'}`} x={PANEL_X + 50} y={TOP + 63}>
            {oldKeyLive ? 'attacker: SUCCEEDS' : 'attacker: 401 locked out'}
          </text>
          <text className="skr-req-sub" x={PANEL_X + 50} y={TOP + 79}>
            {oldKeyLive ? 'leaked key still live' : 'revoked — key is dead'}
          </text>

          {/* NEW KEY (issued, then adopted by legit apps) */}
          <g transform={`translate(${PANEL_X + 16}, ${TOP + 108})`}>
            <KeyRound width={15} height={15} className={`skr-panel-ic is-${newKeyExists ? 'ok' : 'dim'}`} />
          </g>
          <text className="skr-panel-key" x={PANEL_X + 40} y={TOP + 120}>new key (apps)</text>
          <rect
            x={PANEL_X + 16}
            y={TOP + 132}
            width={PANEL_W - 32}
            height={44}
            rx={8}
            className={`skr-req is-${newKeyExists ? 'ok' : 'dim'}`}
          />
          <g transform={`translate(${PANEL_X + 28}, ${TOP + 146})`}>
            {newKeyExists
              ? <CheckCircle2 width={16} height={16} className="skr-req-ic is-ok" />
              : <XCircle width={16} height={16} className="skr-req-ic is-dim" />}
          </g>
          <text className={`skr-req-text is-${newKeyExists ? 'ok' : 'dim'}`} x={PANEL_X + 50} y={TOP + 151}>
            {newKeyExists ? 'apps: SUCCEED' : 'not issued yet'}
          </text>
          <text className="skr-req-sub" x={PANEL_X + 50} y={TOP + 167}>
            {migrated ? 'traffic migrated here' : (newKeyExists ? 'standby, ready' : '—')}
          </text>

          {/* legit-uptime callout */}
          <rect x={PANEL_X} y={TOP + 214} width={PANEL_W} height={54} rx={10} className={`skr-uptime is-${legitOk ? 'ok' : 'bad'}`} />
          <g transform={`translate(${PANEL_X + 16}, ${TOP + 228})`}>
            {legitOk
              ? <ShieldCheck width={16} height={16} className="skr-uptime-ic is-ok" />
              : <ShieldAlert width={16} height={16} className="skr-uptime-ic is-bad" />}
          </g>
          <text className="skr-uptime-title" x={PANEL_X + 40} y={TOP + 234}>legit uptime</text>
          <text className={`skr-uptime-val is-${legitOk ? 'ok' : 'bad'}`} x={PANEL_X + 40} y={TOP + 254}>
            {legitOk ? `serving on ${legitReq} key` : 'downtime'}
          </text>
        </svg>
      </div>

      <div className="skr-readouts">
        <div className="skr-metric">
          <span className="skr-metric-label">old key (leaked)</span>
          <span className={`skr-metric-value ${oldKeyLive ? 'is-bad' : 'is-ok'}`}>
            {oldKeyLive ? 'live — attacker in' : 'revoked — dead'}
          </span>
        </div>
        <div className="skr-metric">
          <span className="skr-metric-label">new key</span>
          <span className={`skr-metric-value ${newKeyExists ? 'is-ok' : 'is-dim'}`}>
            {revoked ? 'sole valid key' : (migrated ? 'in use' : (newKeyExists ? 'standby' : 'not issued'))}
          </span>
        </div>
        <div className="skr-metric">
          <span className="skr-metric-label">attacker access</span>
          <span className={`skr-metric-value ${attackerReq === 'ok' ? 'is-bad' : 'is-ok'}`}>
            {attackerReq === 'ok' ? 'requests succeed' : 'cut off'}
          </span>
        </div>
        <div className="skr-metric skr-metric-dim">
          <span className="skr-metric-label">containment</span>
          <span className={`skr-metric-value is-${contained ? 'ok' : 'bad'}`}>
            {contained ? 'contained' : 'exposed'}
          </span>
        </div>
      </div>

      <div className={`skr-narration is-${stageTone}`}>
        <span className="skr-narration-label">{`stage ${step + 1} — ${STAGES[step].key}`}</span>
        <span className="skr-narration-body">{STEP_NOTE[STAGES[step].key]}</span>
      </div>

      <div className="skr-legend">
        <span className="skr-legend-item"><ShieldAlert size={13} className="skr-ic is-bad" /> leaked key live — attacker succeeds</span>
        <span className="skr-legend-item"><Plus size={13} className="skr-ic is-warn" /> new key issued — both valid (overlap)</span>
        <span className="skr-legend-item"><RefreshCw size={13} className="skr-ic is-warn" /> apps migrate — traffic on new key</span>
        <span className="skr-legend-item"><Ban size={13} className="skr-ic is-ok" /> old key revoked — attacker cut off, no downtime</span>
      </div>
    </div>
  );
}
