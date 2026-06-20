import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Clock, KeyRound, RefreshCw, ShieldAlert, Smartphone, Server, ShieldX, CheckCircle,
} from 'lucide-react';
import './Oauth2RefreshTokenViz.css';

// Access token + refresh token lifecycle with rotation and reuse-detection.
//
//   Access token   short-lived (here 60s). The client uses it on every API call
//                   until it EXPIRES.
//   Refresh token   long-lived. When the access token dies, the client trades
//                   the refresh token for a fresh access token WITHOUT re-login.
//   Rotation        each refresh issues a NEW refresh token and invalidates the
//                   old one. The set of tokens descended from one login is a
//                   "family".
//   Reuse detection If an OLD (already-rotated) refresh token is presented, the
//                   server knows it was either leaked or replayed and REVOKES the
//                   whole family — every token from that login dies at once.
//
// Interactive: advance the clock so the access token expires, then refresh to
// rotate. Toggle "attacker reuses old refresh token" to fire a stolen old token
// at the server and watch the family get revoked.

const ACCESS_TTL = 60; // seconds the access token is valid

// Build the timeline of frames. `attack` injects a reuse step after the second
// rotation: the attacker replays refresh-token rt1 (already rotated away).
function buildFrames(attack) {
  const f = [];
  const base = {
    phase: 'login',
    clock: 0,
    accessId: null,
    accessExpiresAt: null,
    accessValid: false,
    activeRefresh: null, // current valid refresh token id
    rotatedRefresh: [], // refresh token ids that have been rotated away (now invalid)
    revoked: false,
    msg: null, // { from, to, label, tone }
    note: '',
  };

  // 1. login -> tokens issued
  f.push({
    ...base,
    phase: 'login',
    clock: 0,
    accessId: 'at0',
    accessExpiresAt: ACCESS_TTL,
    accessValid: true,
    activeRefresh: 'rt0',
    msg: { from: 'client', to: 'server', label: 'login → access at0 + refresh rt0', tone: 'issue' },
    note: `The user logs in once. The server issues a short-lived access token (at0, valid ${ACCESS_TTL}s) and a long-lived refresh token (rt0). From now on the password is never sent again — these two tokens carry the session.`,
  });

  // 2. use access token while valid
  f.push({
    ...base,
    phase: 'use',
    clock: 20,
    accessId: 'at0',
    accessExpiresAt: ACCESS_TTL,
    accessValid: true,
    activeRefresh: 'rt0',
    msg: { from: 'client', to: 'api', label: 'API call with at0 → 200 OK', tone: 'use' },
    note: `At t=20s the access token at0 is still inside its ${ACCESS_TTL}s window, so API calls succeed with no round-trip to the auth server. The refresh token sits unused — it is only for when the access token dies.`,
  });

  // 3. clock advances past expiry
  f.push({
    ...base,
    phase: 'expire',
    clock: ACCESS_TTL + 5,
    accessId: 'at0',
    accessExpiresAt: ACCESS_TTL,
    accessValid: false,
    activeRefresh: 'rt0',
    msg: { from: 'client', to: 'api', label: 'API call with at0 → 401 expired', tone: 'expire' },
    note: `The clock passes ${ACCESS_TTL}s. at0 has expired, so the next API call returns 401. This is by design: short access-token lifetimes mean a leaked access token is useless within a minute.`,
  });

  // 4. refresh -> rotate (rt0 -> rt1, new at1)
  f.push({
    ...base,
    phase: 'refresh',
    clock: ACCESS_TTL + 6,
    accessId: 'at1',
    accessExpiresAt: ACCESS_TTL * 2 + 6,
    accessValid: true,
    activeRefresh: 'rt1',
    rotatedRefresh: ['rt0'],
    msg: { from: 'client', to: 'server', label: 'refresh rt0 → new access at1 + new refresh rt1', tone: 'rotate' },
    note: `The client presents rt0 to the token endpoint. The server returns a fresh access token (at1) AND a fresh refresh token (rt1), then invalidates rt0. This is rotation: every refresh consumes the old refresh token and mints a new one, so a captured refresh token is only good once.`,
  });

  // 5. use new access token
  f.push({
    ...base,
    phase: 'use',
    clock: ACCESS_TTL + 30,
    accessId: 'at1',
    accessExpiresAt: ACCESS_TTL * 2 + 6,
    accessValid: true,
    activeRefresh: 'rt1',
    rotatedRefresh: ['rt0'],
    msg: { from: 'client', to: 'api', label: 'API call with at1 → 200 OK', tone: 'use' },
    note: `Back to normal: at1 is valid again, API calls succeed, and rt1 is the only live refresh token. rt0 is now dead — presenting it again would be a red flag.`,
  });

  if (attack) {
    // 6. attacker replays the old, already-rotated rt0
    f.push({
      ...base,
      phase: 'reuse',
      clock: ACCESS_TTL + 40,
      accessId: 'at1',
      accessExpiresAt: ACCESS_TTL * 2 + 6,
      accessValid: true,
      activeRefresh: 'rt1',
      rotatedRefresh: ['rt0'],
      msg: { from: 'attacker', to: 'server', label: 'refresh rt0 (stolen, already rotated)', tone: 'attack' },
      note: `An attacker who stole rt0 earlier tries to use it. But rt0 was already rotated away in step 4. The server sees a refresh token that should never be presented again — proof that the family has been compromised.`,
    });

    // 7. server revokes the whole family
    f.push({
      ...base,
      phase: 'revoke',
      clock: ACCESS_TTL + 41,
      accessId: 'at1',
      accessExpiresAt: ACCESS_TTL * 2 + 6,
      accessValid: false,
      activeRefresh: null,
      rotatedRefresh: ['rt0', 'rt1'],
      revoked: true,
      msg: { from: 'server', to: 'client', label: 'REVOKE family — rt0, rt1, at1 all dead', tone: 'revoke' },
      note: `Reuse detection fires. Because a rotated-away token was replayed, the server cannot tell the attacker from the legitimate client, so it revokes the ENTIRE token family — rt0, rt1, and at1 all die. Both parties must log in again. The blast radius is one stolen session, not a permanent backdoor.`,
    });
  } else {
    // alt 6. another clean refresh to show rotation chains
    f.push({
      ...base,
      phase: 'refresh',
      clock: ACCESS_TTL * 2 + 10,
      accessId: 'at2',
      accessExpiresAt: ACCESS_TTL * 3 + 10,
      accessValid: true,
      activeRefresh: 'rt2',
      rotatedRefresh: ['rt0', 'rt1'],
      msg: { from: 'client', to: 'server', label: 'refresh rt1 → new access at2 + new refresh rt2', tone: 'rotate' },
      note: `Another cycle: at1 eventually expires, the client refreshes with rt1, and the server rotates again to at2 + rt2. The refresh chain rt0 → rt1 → rt2 means only the newest token is ever live, so a leak of any earlier one is detectable the moment it is used.`,
    });
  }

  return f;
}

const RUN_DELAY_MS = 1900;

export default function Oauth2RefreshTokenViz() {
  const [attack, setAttack] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = buildFrames(attack);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => { setIsRunning(false); setStep(0); };
  const toggleAttack = () => { setIsRunning(false); setStep(0); setAttack((v) => !v); };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- SVG geometry ----
  const W = 940;
  const H = 360;
  const clientX = 130;
  const serverX = 470;
  const apiX = 810;
  const laneY = 110;
  const boxW = 150;
  const boxH = 84;

  const isAttackActor = current.msg && current.msg.from === 'attacker';
  const actorXY = (key) => {
    if (key === 'client' || key === 'attacker') return { x: clientX, y: laneY };
    if (key === 'api') return { x: apiX, y: laneY };
    return { x: serverX, y: laneY };
  };

  const msg = current.msg;
  let arrow = null;
  if (msg) {
    const a = actorXY(msg.from);
    const b = actorXY(msg.to);
    arrow = { a, b, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  }

  // access-token TTL bar fill: clock vs expiry
  const ttlFrac = current.accessExpiresAt
    ? Math.min(1, Math.max(0, current.clock / Math.max(1, current.accessExpiresAt)))
    : 0;

  const revoked = current.revoked;
  const reuse = current.phase === 'reuse';

  return (
    <div className="ortv">
      <div className="ortv-head">
        <h3 className="ortv-title">Refresh tokens — rotation and reuse detection</h3>
        <p className="ortv-sub">
          A short-lived access token expires; the long-lived refresh token buys a new one without re-login.
          Each refresh rotates the refresh token. Toggle the attacker to replay an old, already-rotated token and
          watch the whole family get revoked.
        </p>
      </div>

      <div className="ortv-controls">
        <button
          type="button"
          className={`ortv-toggle ${attack ? 'is-on is-bad' : ''}`}
          onClick={toggleAttack}
          aria-pressed={attack}
          title="Replay a stolen, already-rotated refresh token"
        >
          {attack ? <ShieldAlert size={13} /> : <RefreshCw size={13} />}
          attacker reuses old token {attack ? 'on' : 'off'}
        </button>
        <span className={`ortv-tag ${attack ? 'is-bad' : ''}`}>
          {attack ? 'expect family revocation' : 'clean rotation chain'}
        </span>
        <span className="ortv-tag">
          <Clock size={11} /> t = {current.clock}s
        </span>

        <label className="ortv-speed">
          <span className="ortv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ortv-speed-range" aria-label="Playback speed"
          />
          <span className="ortv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="ortv-spacer" aria-hidden="true" />

        <div className="ortv-buttons">
          <button
            type="button" className="ortv-btn ortv-btn-primary"
            onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunning((v) => !v); }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button" className="ortv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button" className="ortv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ortv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ortv-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="ortv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ortv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {['issue', 'use', 'expire', 'rotate', 'attack', 'revoke'].map((t) => (
              <marker key={t} id={`ortv-arr-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className={`ortv-ah is-${t}`} />
              </marker>
            ))}
          </defs>

          {/* message arrow */}
          {arrow && (
            <g>
              <line
                className={`ortv-msg is-${msg.tone}`}
                x1={arrow.a.x + (arrow.b.x >= arrow.a.x ? boxW / 2 : -boxW / 2)}
                y1={arrow.a.y}
                x2={arrow.b.x + (arrow.b.x >= arrow.a.x ? -boxW / 2 - 8 : boxW / 2 + 8)}
                y2={arrow.b.y}
                markerEnd={`url(#ortv-arr-${msg.tone})`}
              />
              <rect className={`ortv-msg-pill is-${msg.tone}`} x={arrow.mid.x - 175} y={arrow.mid.y - 14} width={350} height={28} rx={6} />
              <text className={`ortv-msg-label is-${msg.tone}`} x={arrow.mid.x} y={arrow.mid.y + 4} textAnchor="middle">{msg.label}</text>
            </g>
          )}

          {/* client / attacker box */}
          <g>
            <rect className={`ortv-actor ${isAttackActor ? 'is-attacker' : 'is-client'} ${revoked ? 'is-dead' : ''}`} x={clientX - boxW / 2} y={laneY - boxH / 2} width={boxW} height={boxH} rx={10} />
            <g transform={`translate(${clientX - 11}, ${laneY - boxH / 2 + 10})`}>
              {isAttackActor
                ? <ShieldAlert width={22} height={22} className="ortv-actor-ic is-attacker" />
                : <Smartphone width={22} height={22} className={`ortv-actor-ic ${revoked ? 'is-dead' : ''}`} />}
            </g>
            <text className="ortv-actor-label" x={clientX} y={laneY + 4} textAnchor="middle">{isAttackActor ? 'Attacker' : 'Client'}</text>
            <text className={`ortv-actor-sub ${revoked ? 'is-dead' : ''}`} x={clientX} y={laneY + 22} textAnchor="middle">
              {revoked ? 'must re-login' : isAttackActor ? 'replaying rt0' : `holds ${current.accessId || '—'}`}
            </text>
          </g>

          {/* auth server box */}
          <g>
            <rect className={`ortv-actor is-server ${reuse || revoked ? 'is-alert' : ''}`} x={serverX - boxW / 2} y={laneY - boxH / 2} width={boxW} height={boxH} rx={10} />
            <g transform={`translate(${serverX - 11}, ${laneY - boxH / 2 + 10})`}>
              {revoked
                ? <ShieldX width={22} height={22} className="ortv-actor-ic is-alert" />
                : <Server width={22} height={22} className="ortv-actor-ic is-server" />}
            </g>
            <text className="ortv-actor-label" x={serverX} y={laneY + 4} textAnchor="middle">Auth Server</text>
            <text className={`ortv-actor-sub ${reuse || revoked ? 'is-alert' : ''}`} x={serverX} y={laneY + 22} textAnchor="middle">
              {revoked ? 'family revoked' : reuse ? 'reuse detected!' : current.activeRefresh ? `live: ${current.activeRefresh}` : '—'}
            </text>
          </g>

          {/* api box */}
          <g>
            <rect className="ortv-actor is-api" x={apiX - boxW / 2} y={laneY - boxH / 2} width={boxW} height={boxH} rx={10} />
            <g transform={`translate(${apiX - 11}, ${laneY - boxH / 2 + 10})`}>
              {current.accessValid
                ? <CheckCircle width={22} height={22} className="ortv-actor-ic is-ok" />
                : <KeyRound width={22} height={22} className="ortv-actor-ic is-api" />}
            </g>
            <text className="ortv-actor-label" x={apiX} y={laneY + 4} textAnchor="middle">Resource API</text>
            <text className={`ortv-actor-sub ${current.accessValid ? 'is-ok' : 'is-dim'}`} x={apiX} y={laneY + 22} textAnchor="middle">
              {current.accessValid ? 'access valid' : 'access expired'}
            </text>
          </g>

          {/* access-token TTL bar */}
          {(() => {
            const by = 210;
            const bx = clientX - 110;
            const bw = 220;
            const bh = 16;
            return (
              <g>
                <text className="ortv-bar-label" x={bx} y={by - 6} textAnchor="start">access token lifetime ({ACCESS_TTL}s)</text>
                <rect className="ortv-bar-track" x={bx} y={by} width={bw} height={bh} rx={4} />
                <rect className={`ortv-bar-fill ${current.accessValid ? 'is-ok' : 'is-expired'}`} x={bx} y={by} width={Math.max(2, ttlFrac * bw)} height={bh} rx={4} />
                <text className={`ortv-bar-state ${current.accessValid ? 'is-ok' : 'is-expired'}`} x={bx + bw + 8} y={by + bh - 3} textAnchor="start">
                  {current.accessValid ? 'valid' : 'expired'}
                </text>
              </g>
            );
          })()}

          {/* refresh-token family chain */}
          {(() => {
            const fy = 280;
            const fx0 = serverX - 200;
            const allTokens = ['rt0', 'rt1', 'rt2'];
            return (
              <g>
                <text className="ortv-bar-label" x={fx0} y={fy - 8} textAnchor="start">refresh-token family (rotation chain)</text>
                {allTokens.map((t, i) => {
                  const tx = fx0 + i * 150;
                  const isActive = current.activeRefresh === t;
                  const isRotated = current.rotatedRefresh.includes(t);
                  const state = revoked && isRotated ? 'revoked' : isActive ? 'active' : isRotated ? 'rotated' : 'unborn';
                  return (
                    <g key={t}>
                      {i < allTokens.length - 1 && (
                        <line className="ortv-chain" x1={tx + 44} y1={fy + 14} x2={tx + 106} y2={fy + 14} markerEnd="url(#ortv-arr-rotate)" />
                      )}
                      <rect className={`ortv-token is-${state}`} x={tx} y={fy} width={88} height={30} rx={6} />
                      <text className={`ortv-token-label is-${state}`} x={tx + 44} y={fy + 19} textAnchor="middle">{t}</text>
                      <text className={`ortv-token-state is-${state}`} x={tx + 44} y={fy + 44} textAnchor="middle">
                        {state === 'active' ? 'live' : state === 'rotated' ? 'rotated' : state === 'revoked' ? 'revoked' : 'not issued'}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="ortv-metrics">
        <div className="ortv-metric">
          <span className="ortv-metric-label">access token</span>
          <span className={`ortv-metric-value ${current.accessValid ? 'is-ok' : 'is-warn'}`}>
            {`${current.accessId || '—'} · ${current.accessValid ? 'valid' : 'expired'}`}
          </span>
        </div>
        <div className="ortv-metric">
          <span className="ortv-metric-label">live refresh token</span>
          <span className={`ortv-metric-value ${revoked ? 'is-bad' : ''}`}>{current.activeRefresh || (revoked ? 'none' : '—')}</span>
        </div>
        <div className="ortv-metric">
          <span className="ortv-metric-label">rotated away</span>
          <span className="ortv-metric-value">{current.rotatedRefresh.join(', ') || 'none'}</span>
        </div>
        <div className="ortv-metric ortv-metric-dim">
          <span className="ortv-metric-label">family status</span>
          <span className={`ortv-metric-value ${revoked ? 'is-bad' : 'is-ok'}`}>{revoked ? 'revoked' : 'healthy'}</span>
        </div>
      </div>

      <div className={`ortv-narration ${revoked ? 'is-bad' : reuse ? 'is-warn' : ''}`}>
        <span className={`ortv-narration-label ${revoked ? 'is-bad' : reuse ? 'is-warn' : ''}`}>
          {current.phase}
        </span>
        <span className="ortv-narration-body">{current.note}</span>
      </div>

      <div className="ortv-legend">
        <span className="ortv-legend-item"><Clock size={13} className="ortv-ic is-api" /> access token — short-lived, expires fast</span>
        <span className="ortv-legend-item"><RefreshCw size={13} className="ortv-ic is-rotate" /> rotation — each refresh mints a new refresh token</span>
        <span className="ortv-legend-item"><ShieldAlert size={13} className="ortv-ic is-bad" /> reuse — replaying a rotated token is detectable</span>
        <span className="ortv-legend-item"><ShieldX size={13} className="ortv-ic is-bad" /> revocation — the whole family dies at once</span>
      </div>
    </div>
  );
}
