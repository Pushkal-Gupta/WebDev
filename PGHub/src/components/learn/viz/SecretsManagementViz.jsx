import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, Vault,
  AppWindow, Database, Clock, Check, X, ArrowRight, RefreshCw,
  KeyRound, ShieldOff, FileWarning, Timer,
} from 'lucide-react';
import './SecretsManagementViz.css';

// A secret's full lifecycle through a vault, contrasted with a hardcoded key.
// Vault mode: the app authenticates with its own identity, the vault hands back
// a SHORT-LIVED lease { secret, lease_id, ttl }, the app uses it, the TTL counts
// down as time advances, and on expiry the vault auto-rotates to a fresh secret
// (old value revoked) — or an operator revokes the lease immediately. Blast
// radius is "minutes". Hardcoded mode: a literal API key is committed to the
// repo, lives in git history forever, never rotates — blast radius is "forever".

const MAX_TTL = 3600;
const TIME_CHUNK = 900;          // each "Advance time" press burns 15 minutes

// Deterministic secret values, cycled by version — never Math.random.
const SECRET_VALUES = [
  { full: 'sk_live_7f3a91', masked: 'sk_••••_7f3a' },
  { full: 'sk_live_b2e4d8', masked: 'sk_••••_b2e4' },
  { full: 'sk_live_c19a05', masked: 'sk_••••_c19a' },
  { full: 'sk_live_4d7c62', masked: 'sk_••••_4d7c' },
];
const LEASE_IDS = ['lease/9c1f-0', 'lease/9c1f-1', 'lease/9c1f-2', 'lease/9c1f-3'];

function secretForVersion(v) {
  const i = (v - 1) % SECRET_VALUES.length;
  return SECRET_VALUES[i];
}
function leaseForVersion(v) {
  const i = (v - 1) % LEASE_IDS.length;
  return LEASE_IDS[i];
}

const ACTORS = [
  { key: 'app', label: 'App', sub: 'role: orders-svc', icon: 'app' },
  { key: 'vault', label: 'Vault', sub: 'secret broker', icon: 'vault' },
  { key: 'store', label: 'Store', sub: 'backing secret', icon: 'store' },
];
const ACTOR_INDEX = Object.fromEntries(ACTORS.map((a, i) => [a.key, i]));

const PHASE_LABEL = {
  idle: 'no lease yet',
  authenticate: 'app authenticates',
  issue: 'vault issues lease',
  use: 'app uses secret',
  countdown: 'lease TTL counting down',
  rotate: 'auto-rotate on expiry',
  revoke: 'lease revoked',
  hardcoded: 'hardcoded key',
};

// The canonical lifecycle frames for the play/step run loop. Each frame names
// the phase and the message hop; the live TTL / version / status overlay is held
// in separate state so "Advance time" and "Revoke" mutate it outside the loop.
const FLOW = [
  {
    phase: 'authenticate',
    active: ['app', 'vault'],
    msg: { from: 'app', to: 'vault', dir: 'fwd', label: 'authenticate { role: orders-svc }' },
    note: 'The app proves its own identity to the vault — here a workload role, not a human password. No secret value is in this request. The vault decides what this role is allowed to read before it hands anything back.',
  },
  {
    phase: 'issue',
    active: ['vault', 'store'],
    msg: { from: 'vault', to: 'store', dir: 'fwd', label: 'fetch + lease db/creds' },
    note: 'The vault pulls the backing secret from its store and wraps it in a lease: the value, a lease_id to track it, and a TTL of 3600s. The lease is the whole point — the secret is now time-bounded, not permanent.',
  },
  {
    phase: 'issue',
    active: ['vault', 'app'],
    msg: { from: 'vault', to: 'app', dir: 'back', label: 'lease { secret, lease_id, ttl: 3600 }' },
    note: 'The vault returns the lease to the app. The app holds the secret only in memory for the life of the lease — nothing lands on disk, nothing is committed. The clock has started.',
  },
  {
    phase: 'use',
    active: ['app'],
    msg: { from: 'app', to: 'app', dir: 'self', label: 'use secret -> call downstream API' },
    note: 'The app uses the leased secret to authenticate its own downstream calls. Advance time to watch the lease age — when the TTL hits zero the vault rotates the value and the old one stops working, so a leaked copy self-destructs.',
  },
];

const RUN_DELAY_MS = 1500;

export default function SecretsManagementViz() {
  const [mode, setMode] = useState('vault');          // 'vault' | 'hardcoded'
  const [hasLease, setHasLease] = useState(false);
  const [version, setVersion] = useState(1);
  const [ttl, setTtl] = useState(MAX_TTL);
  const [revoked, setRevoked] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => FLOW, []);
  const totalSteps = frames.length;
  const flowDone = step >= totalSteps - 1;
  const isRunning = isRunningRaw && mode === 'vault' && hasLease && !flowDone;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

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

  // Derived live state -------------------------------------------------------
  const secret = secretForVersion(version);
  const leaseId = leaseForVersion(version);
  // GUARD: never divide by a zero max.
  const ttlFrac = MAX_TTL > 0 ? Math.max(0, Math.min(1, ttl / MAX_TTL)) : 0;
  const ttlPct = Math.round(ttlFrac * 100);

  let status;
  if (mode === 'hardcoded') status = 'static / never rotated';
  else if (revoked) status = 'revoked';
  else if (!hasLease) status = 'no lease';
  else if (ttl <= 0) status = 'expired -> rotated';
  else status = 'active';

  const blastRadius = mode === 'hardcoded' ? 'forever' : (hasLease ? 'minutes' : '—');

  // Actions ------------------------------------------------------------------
  const requestSecret = () => {
    if (mode !== 'vault') return;
    setIsRunning(false);
    setHasLease(true);
    setRevoked(false);
    setTtl(MAX_TTL);
    setStep(0);
  };

  const advanceTime = () => {
    if (mode !== 'vault' || !hasLease || revoked) return;
    setIsRunning(false);
    setTtl((t) => {
      const next = t - TIME_CHUNK;
      if (next <= 0) {
        // Auto-rotate: bump version (new deterministic value), refresh the lease.
        setVersion((v) => v + 1);
        return MAX_TTL;
      }
      return next;
    });
    if (ttl - TIME_CHUNK <= 0) setStep(totalSteps - 1);
  };

  const revokeNow = () => {
    if (mode !== 'vault' || !hasLease) return;
    setIsRunning(false);
    setRevoked(true);
    setTtl(0);
  };

  const reset = () => {
    setIsRunning(false);
    setHasLease(false);
    setRevoked(false);
    setVersion(1);
    setTtl(MAX_TTL);
    setStep(0);
  };

  const switchMode = (next) => {
    if (next === mode) return;
    setIsRunning(false);
    setMode(next);
    setHasLease(false);
    setRevoked(false);
    setVersion(1);
    setTtl(MAX_TTL);
    setStep(0);
  };

  // Frame + SVG geometry -----------------------------------------------------
  const current = mode === 'vault' && hasLease
    ? frames[Math.min(step, totalSteps - 1)]
    : null;

  const W = 760;
  const H = 320;
  const laneTop = 56;
  const laneBottom = H - 60;
  const pad = 96;
  const denom = Math.max(ACTORS.length - 1, 1);
  const laneX = (i) => pad + (i / denom) * (W - 2 * pad);
  const msgY = laneTop + 96;

  const ActorIcon = (icon, cls) => {
    if (icon === 'app') return <AppWindow width={20} height={20} className={cls} />;
    if (icon === 'vault') return <Vault width={20} height={20} className={cls} />;
    return <Database width={20} height={20} className={cls} />;
  };

  const isActive = (key) => (current ? current.active.includes(key) : false);
  const toneForDir = (dir) => (dir === 'back' ? 'back' : dir === 'self' ? 'self' : 'fwd');
  const msg = current ? current.msg : null;
  const msgTone = msg ? toneForDir(msg.dir) : 'fwd';

  let msgLine = null;
  if (msg && msg.dir !== 'self') {
    const xa = laneX(ACTOR_INDEX[msg.from]);
    const xb = laneX(ACTOR_INDEX[msg.to]);
    msgLine = { xa, xb, mid: (xa + xb) / 2, ltr: xb >= xa };
  }
  const selfActor = msg && msg.dir === 'self' ? laneX(ACTOR_INDEX[msg.from]) : null;

  // TTL gauge geometry (horizontal bar under the lifelines).
  const gaugeX = pad;
  const gaugeW = W - 2 * pad;
  const gaugeY = laneBottom + 14;
  const fillW = gaugeW * ttlFrac;
  const ttlTone = revoked || ttl <= 0 ? 'fail' : (ttlFrac < 0.34 ? 'warn' : 'ok');

  const playLabel = isRunningRaw && isRunning
    ? 'Pause'
    : (flowDone ? 'Replay flow' : 'Play');

  const phaseLabel = mode === 'hardcoded'
    ? PHASE_LABEL.hardcoded
    : (!hasLease ? PHASE_LABEL.idle
      : revoked ? PHASE_LABEL.revoke
        : ttl <= 0 ? PHASE_LABEL.rotate
          : (current ? PHASE_LABEL[current.phase] : PHASE_LABEL.countdown));

  const narrationTone = mode === 'hardcoded' || revoked
    ? 'is-fail'
    : (hasLease && ttl <= 0 ? 'is-warn' : (hasLease ? 'is-ok' : ''));

  const narration = mode === 'hardcoded'
    ? 'The key is a literal in the source, committed once and indexed in git history forever. Anyone who ever had repo access — a former contributor, a leaked clone, a fork — holds a working credential that no rotation reaches. There is no lease to expire and no version to bump: the blast radius is permanent.'
    : !hasLease
      ? 'No lease yet. Press "Request secret" and the app authenticates to the vault with its own role — then step through the lifecycle.'
      : revoked
        ? 'The lease was revoked immediately. The vault drops it, the value stops authenticating downstream calls at once, and any copy the app cached is now dead. This is the kill switch a hardcoded key never had.'
        : ttl <= 0
          ? `The TTL hit zero, so the vault auto-rotated to ${secret.masked} (version v${version}) and revoked the previous value. A secret leaked before this moment is already worthless — that is why the blast radius is measured in minutes.`
          : current
            ? current.note
            : 'The lease is live and aging. Keep advancing time to reach expiry and watch the auto-rotation.';

  // Hardcoded-mode code panel — DATA shown as plain text, never evaluated.
  const HARDCODED_CODE = [
    { t: '// payments/client.js', kind: 'comment' },
    { t: 'const API_KEY = "sk_live_abc123";', kind: 'danger' },
    { t: 'export const stripe = new Stripe(API_KEY);', kind: 'plain' },
  ];

  return (
    <div className="secv">
      <div className="secv-head">
        <h3 className="secv-title">A secret with an expiry date vs a key committed forever</h3>
        <p className="secv-sub">
          In vault mode the app leases a short-lived secret that counts down, rotates on expiry, and
          dies on revoke. Flip to hardcoded mode to see the same key frozen into git history with no
          way back.
        </p>
      </div>

      <div className="secv-controls">
        <div className="secv-modeswitch" role="group" aria-label="Secret delivery mode">
          <button
            type="button"
            className={`secv-mode-btn ${mode === 'vault' ? 'is-active' : ''}`}
            onClick={() => switchMode('vault')}
            aria-pressed={mode === 'vault'}
          >
            <Vault size={14} /> Vault
          </button>
          <button
            type="button"
            className={`secv-mode-btn is-danger-side ${mode === 'hardcoded' ? 'is-active' : ''}`}
            onClick={() => switchMode('hardcoded')}
            aria-pressed={mode === 'hardcoded'}
          >
            <FileWarning size={14} /> Hardcoded
          </button>
        </div>

        {mode === 'vault' && (
          <div className="secv-actions">
            <button
              type="button"
              className="secv-btn secv-btn-primary"
              onClick={requestSecret}
            >
              <KeyRound size={14} /> Request secret
            </button>
            <button
              type="button"
              className="secv-btn"
              onClick={advanceTime}
              disabled={!hasLease || revoked}
            >
              <Timer size={14} /> Advance time
            </button>
            <button
              type="button"
              className="secv-btn secv-btn-danger"
              onClick={revokeNow}
              disabled={!hasLease || revoked}
            >
              <ShieldOff size={14} /> Revoke now
            </button>
          </div>
        )}

        <label className="secv-speed">
          <span className="secv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="secv-speed-range"
            aria-label="Playback speed"
          />
          <span className="secv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="secv-spacer" aria-hidden="true" />

        <div className="secv-buttons">
          <button
            type="button"
            className="secv-btn secv-btn-primary"
            onClick={() => {
              if (mode !== 'vault') return;
              if (!hasLease) { requestSecret(); setIsRunning(true); return; }
              if (flowDone) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={mode !== 'vault'}
          >
            {isRunningRaw && isRunning ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="secv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={mode !== 'vault' || !hasLease || flowDone}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="secv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={mode !== 'vault' || !hasLease || flowDone}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="secv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        {mode === 'vault' && hasLease && (
          <div className="secv-stepcount">
            step <strong>{Math.min(step + 1, totalSteps)}</strong> / {totalSteps}
          </div>
        )}
      </div>

      <div className="secv-stage">
        {mode === 'hardcoded' ? (
          <div className="secv-hard">
            <div className="secv-hard-panel">
              <div className="secv-hard-bar">
                <FileWarning size={14} className="secv-ic is-fail" />
                <span className="secv-hard-file">payments/client.js</span>
                <span className="secv-hard-tag">committed to repo</span>
              </div>
              <pre className="secv-code">
                {HARDCODED_CODE.map((ln, i) => (
                  <span key={ln.t} className={`secv-code-line is-${ln.kind}`}>
                    <span className="secv-code-ln">{i + 1}</span>
                    <span className="secv-code-text">{ln.t}</span>
                  </span>
                ))}
              </pre>
              <div className="secv-blame">
                <ArrowRight size={12} className="secv-ic is-fail" />
                <span>
                  leaked in commit <strong>3f33f42</strong> — valid forever, never rotated, present in
                  every clone and fork of this history
                </span>
              </div>
              <div className="secv-verdict">
                <X size={14} className="secv-ic is-fail" />
                <span>
                  Danger: anyone who ever read this repo holds a live key. Rotation can&apos;t reach a
                  value baked into the past.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="secv-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="secv-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className="secv-ah is-fwd" />
              </marker>
              <marker id="secv-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className="secv-ah is-back" />
              </marker>
              <marker id="secv-arr-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className="secv-ah is-self" />
              </marker>
            </defs>

            {/* lifelines */}
            {ACTORS.map((a, i) => {
              const x = laneX(i);
              const on = isActive(a.key);
              return (
                <line
                  key={`life-${a.key}`}
                  className={`secv-life ${on ? 'is-on' : ''}`}
                  x1={x}
                  y1={laneTop + 44}
                  x2={x}
                  y2={laneBottom}
                />
              );
            })}

            {/* in-flight message */}
            {msgLine && (
              <g>
                <line
                  className={`secv-msg is-${msgTone}`}
                  x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                  y1={msgY}
                  x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                  y2={msgY}
                  markerEnd={`url(#secv-arr-${msgTone})`}
                />
                <text className={`secv-msg-label is-${msgTone}`} x={msgLine.mid} y={msgY - 11} textAnchor="middle">
                  {msg.label}
                </text>
              </g>
            )}
            {selfActor != null && (
              <g>
                <path
                  className={`secv-msg is-${msgTone}`}
                  d={`M ${selfActor} ${msgY - 14} q 58 0 58 16 q 0 16 -58 16`}
                  fill="none"
                  markerEnd={`url(#secv-arr-${msgTone})`}
                />
                <text className={`secv-msg-label is-${msgTone}`} x={selfActor + 66} y={msgY + 4} textAnchor="start">
                  {msg.label}
                </text>
              </g>
            )}

            {/* actor headers */}
            {ACTORS.map((a, i) => {
              const x = laneX(i);
              const on = isActive(a.key);
              return (
                <g key={`actor-${a.key}`}>
                  <rect
                    className={`secv-actor ${on ? 'is-on' : ''}`}
                    x={x - 70}
                    y={laneTop - 24}
                    width={140}
                    height={62}
                    rx={9}
                  />
                  <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                    {ActorIcon(a.icon, `secv-actor-ic ${on ? 'is-on' : ''}`)}
                  </g>
                  <text className={`secv-actor-label ${on ? 'is-on' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                    {a.label}
                  </text>
                  <text className="secv-actor-sub" x={x} y={laneTop + 27} textAnchor="middle">
                    {a.sub}
                  </text>
                </g>
              );
            })}

            {/* current lease chip on the App lane */}
            {hasLease && (
              <g transform={`translate(${laneX(0)}, ${laneTop + 60})`}>
                <rect className={`secv-chip ${revoked || ttl <= 0 ? 'is-fail' : 'is-ok'}`} x={-66} y={0} width={132} height={34} rx={7} />
                <text className="secv-chip-k" x={0} y={14} textAnchor="middle">
                  {revoked ? 'secret revoked' : `secret ${secret.masked}`}
                </text>
                <text className="secv-chip-v" x={0} y={27} textAnchor="middle">
                  {leaseId} · v{version}
                </text>
              </g>
            )}

            {/* TTL gauge */}
            <g>
              <text className="secv-gauge-cap" x={gaugeX} y={gaugeY - 6} textAnchor="start">
                lease TTL
              </text>
              <text className={`secv-gauge-num is-${ttlTone}`} x={gaugeX + gaugeW} y={gaugeY - 6} textAnchor="end">
                {hasLease ? `${Math.max(0, ttl)}s / ${MAX_TTL}s` : 'no lease'}
              </text>
              <rect className="secv-gauge-track" x={gaugeX} y={gaugeY} width={gaugeW} height={14} rx={7} />
              {hasLease && (
                <rect className={`secv-gauge-fill is-${ttlTone}`} x={gaugeX} y={gaugeY} width={Math.max(0, fillW)} height={14} rx={7} />
              )}
              <text className={`secv-gauge-pct is-${ttlTone}`} x={W / 2} y={gaugeY + 32} textAnchor="middle">
                {hasLease ? `${phaseLabel} · ${ttlPct}% remaining` : 'press Request secret to lease a credential'}
              </text>
            </g>
          </svg>
        )}
      </div>

      <div className="secv-body">
        <div className="secv-payload">
          <div className="secv-payload-head">
            <ArrowRight size={13} className="secv-ic" />
            <span className="secv-payload-title">{mode === 'hardcoded' ? 'static key' : 'live lease'}</span>
            <span className="secv-payload-label">{phaseLabel}</span>
          </div>
          <div className="secv-params">
            {mode === 'hardcoded' ? (
              <>
                <div className="secv-param is-fail">
                  <span className="secv-param-k">value</span>
                  <span className="secv-param-eq">=</span>
                  <span className="secv-param-v">sk_live_abc123</span>
                  <span className="secv-param-badge is-fail"><X size={10} /> in repo</span>
                </div>
                <div className="secv-param is-fail">
                  <span className="secv-param-k">rotation</span>
                  <span className="secv-param-eq">=</span>
                  <span className="secv-param-v">none — same value since first commit</span>
                </div>
                <div className="secv-param is-fail">
                  <span className="secv-param-k">reach</span>
                  <span className="secv-param-eq">=</span>
                  <span className="secv-param-v">every clone, fork, and CI log of this history</span>
                </div>
              </>
            ) : !hasLease ? (
              <div className="secv-param-empty">No lease held — press Request secret or Play.</div>
            ) : (
              <>
                <div className={`secv-param ${revoked || ttl <= 0 ? 'is-fail' : 'is-key'}`}>
                  <span className="secv-param-k">secret</span>
                  <span className="secv-param-eq">=</span>
                  <span className="secv-param-v">{revoked ? '(revoked)' : secret.masked}</span>
                  <span className="secv-param-badge is-key"><KeyRound size={10} /> masked</span>
                </div>
                <div className="secv-param is-id">
                  <span className="secv-param-k">lease_id</span>
                  <span className="secv-param-eq">=</span>
                  <span className="secv-param-v">{leaseId}</span>
                </div>
                <div className={`secv-param ${ttlTone === 'fail' ? 'is-fail' : ttlTone === 'warn' ? 'is-time' : 'is-ok'}`}>
                  <span className="secv-param-k">ttl</span>
                  <span className="secv-param-eq">=</span>
                  <span className="secv-param-v">{Math.max(0, ttl)}s remaining of {MAX_TTL}s</span>
                  <span className="secv-param-badge is-time"><Clock size={10} /> short-lived</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="secv-metrics">
          <div className="secv-metric">
            <span className="secv-metric-label">mode</span>
            <span className={`secv-metric-value ${mode === 'hardcoded' ? 'is-fail' : 'is-ok'}`}>
              {mode === 'hardcoded' ? 'hardcoded' : 'vault'}
            </span>
          </div>
          <div className="secv-metric">
            <span className="secv-metric-label">TTL remaining</span>
            <span className={`secv-metric-value is-${ttlTone === 'ok' ? 'ok' : ttlTone === 'warn' ? 'warn' : 'fail'}`}>
              {mode === 'hardcoded' ? 'infinite' : (hasLease ? `${Math.max(0, ttl)}s` : '—')}
            </span>
          </div>
          <div className="secv-metric">
            <span className="secv-metric-label">secret version</span>
            <span className="secv-metric-value">
              {mode === 'hardcoded' ? 'v1 (frozen)' : `v${version}`}
            </span>
          </div>
          <div className="secv-metric">
            <span className="secv-metric-label">status</span>
            <span className={`secv-metric-value ${revoked || mode === 'hardcoded' ? 'is-fail' : (hasLease && ttl <= 0 ? 'is-warn' : (hasLease ? 'is-ok' : ''))}`}>
              {status}
            </span>
          </div>
          <div className="secv-metric secv-metric-dim">
            <span className="secv-metric-label">blast radius</span>
            <span className={`secv-metric-value ${mode === 'hardcoded' ? 'is-fail' : (hasLease ? 'is-ok' : '')}`}>
              {blastRadius}
            </span>
          </div>
        </div>
      </div>

      <div className={`secv-narration ${narrationTone}`}>
        <span className={`secv-narration-label ${narrationTone}`}>{phaseLabel}</span>
        <span className="secv-narration-body">{narration}</span>
      </div>

      <div className="secv-legend">
        <span className="secv-legend-item"><KeyRound size={13} className="secv-ic is-key" /> leased secret — masked, held in memory only</span>
        <span className="secv-legend-item"><Clock size={13} className="secv-ic is-time" /> TTL — short-lived, counts down to expiry</span>
        <span className="secv-legend-item"><RefreshCw size={13} className="secv-ic is-ok" /> auto-rotate — new version, old value revoked</span>
        <span className="secv-legend-item"><FileWarning size={13} className="secv-ic is-fail" /> hardcoded key — blast radius forever</span>
      </div>
    </div>
  );
}
