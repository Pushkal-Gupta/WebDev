import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, Ticket,
  User, KeyRound, ShieldCheck, Server, Clock, Check, X, ArrowRight,
} from 'lucide-react';
import './KerberosProtocolViz.css';

// Kerberos ticket flow across four actors: the Client, the Authentication Server
// (AS) and Ticket-Granting Server (TGS) that together form the KDC, and the
// target Service. The arc the reader should leave with:
//   1. AS-REQ / AS-REP — the client asks the AS for a TGT. The AS replies with a
//      TGT (encrypted under the TGS key, opaque to the client) plus a session
//      key, all encrypted under a key DERIVED FROM THE PASSWORD. The password
//      itself never travels — the client proves it by decrypting the reply.
//   2. TGS-REQ / TGS-REP — the client presents the TGT + a fresh timestamped
//      authenticator to the TGS and gets back a service ticket for one service.
//   3. AP-REQ / AP-REP — the client presents the service ticket + authenticator
//      to the service; the service decrypts the ticket with its own key and
//      checks the timestamp, defeating replay. A toggle replays a stale
//      authenticator to show the clock-skew rejection.

const ACTORS = [
  { key: 'client', label: 'Client', sub: 'alice@CORP', icon: 'user' },
  { key: 'as', label: 'AS', sub: 'auth server', icon: 'key' },
  { key: 'tgs', label: 'TGS', sub: 'ticket-granting', icon: 'ticket' },
  { key: 'svc', label: 'Service', sub: 'http/files', icon: 'server' },
];
const ACTOR_INDEX = Object.fromEntries(ACTORS.map((a, i) => [a.key, i]));

const PHASE_LABEL = {
  init: 'setup',
  asreq: 'AS-REQ',
  asrep: 'AS-REP',
  unlock: 'derive key from password',
  tgsreq: 'TGS-REQ',
  tgsrep: 'TGS-REP',
  apreq: 'AP-REQ',
  apcheck: 'service verifies',
  reject: 'replay rejected',
  aprep: 'AP-REP',
  done: 'done',
};

const SAMPLE = {
  principal: 'alice@CORP.EXAMPLE',
  realm: 'CORP.EXAMPLE',
  tgt: 'TGT{alice, K_c,tgs}',
  tgtKey: 'enc with K_TGS',
  sessKeyCT: 'K_c,tgs',
  svcTicket: 'ST{alice, K_c,svc}',
  svcTicketKey: 'enc with K_SVC',
  sessKeySvc: 'K_c,svc',
  ts: '14:02:11.402',
  staleTs: '13:46:55.108',
};

// frame: { phase, active, msg:{from,to,dir,label}|null, params:[{k,v,kind}],
//          inFlight, note, fatal? }
function buildFrames(replay) {
  const frames = [];

  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    note: replay
      ? 'Kerberos ticket flow with an attacker replaying a captured authenticator. The password never travels and every authenticator is timestamped — step through to the AP-REQ and watch the service reject the stale replay on the clock check.'
      : 'Kerberos: the client gets a ticket-granting ticket from the AS, trades it at the TGS for a service ticket, then presents that to the Service. Three round trips, and the password never crosses the wire — each reply is unlocked by a key derived from it. Step through each hop.',
  });

  frames.push({
    phase: 'asreq',
    active: ['client', 'as'],
    msg: { from: 'client', to: 'as', dir: 'fwd', label: 'AS-REQ' },
    params: [
      { k: 'principal', v: SAMPLE.principal, kind: 'id' },
      { k: 'realm', v: SAMPLE.realm },
      { k: 'requested', v: 'krbtgt/CORP (the TGS)' },
      { k: 'password_sent', v: 'no — never', kind: 'ok' },
    ],
    inFlight: 'AS-REQ for a TGT',
    note: 'The client sends an AS-REQ naming its principal (alice@CORP) and asking for a ticket to the TGS. Note what is NOT here: the password. Kerberos never puts the password on the wire — the client will instead prove it knows the password by decrypting the reply.',
  });

  frames.push({
    phase: 'asrep',
    active: ['as', 'client'],
    msg: { from: 'as', to: 'client', dir: 'back', label: 'AS-REP { TGT, session key }' },
    params: [
      { k: 'TGT', v: `${SAMPLE.tgt} (${SAMPLE.tgtKey})`, kind: 'ticket' },
      { k: 'session_key', v: SAMPLE.sessKeyCT, kind: 'key' },
      { k: 'enc_part', v: 'encrypted with key from alice password', kind: 'lock' },
      { k: 'lifetime', v: 'starttime .. endtime' },
    ],
    inFlight: 'TGT + K_c,tgs (password-locked)',
    note: 'The AS looks up alice in its database, mints a TGT (sealed with the TGS key — opaque to the client) and a client/TGS session key. It wraps the session key in a blob encrypted with a key DERIVED FROM ALICE\'S PASSWORD. The AS never asked for the password; it just assumes only the real alice can open this.',
  });

  frames.push({
    phase: 'unlock',
    active: ['client'],
    msg: { from: 'client', to: 'client', dir: 'self', label: 'derive key from password -> decrypt' },
    params: [
      { k: 'derive', v: 'K_alice = hash(password, salt)', kind: 'key' },
      { k: 'decrypt', v: 'open AS-REP enc_part', kind: 'lock' },
      { k: 'recovered', v: `session_key ${SAMPLE.sessKeyCT}`, kind: 'ok' },
      { k: 'TGT', v: 'stored, still opaque to client', kind: 'ticket' },
    ],
    inFlight: 'password unlocks the session key',
    note: 'The client derives K_alice from the password the user typed locally, and uses it to decrypt the AS-REP. If the password is right, out comes the client/TGS session key. This is the proof step — knowing the password means being able to open this blob. The TGT stays sealed; the client just carries it.',
  });

  frames.push({
    phase: 'tgsreq',
    active: ['client', 'tgs'],
    msg: { from: 'client', to: 'tgs', dir: 'fwd', label: 'TGS-REQ { TGT, authenticator }' },
    params: [
      { k: 'TGT', v: SAMPLE.tgt, kind: 'ticket' },
      { k: 'authenticator', v: `{ alice, timestamp ${SAMPLE.ts} }`, kind: 'time' },
      { k: 'auth_enc', v: 'encrypted with K_c,tgs', kind: 'lock' },
      { k: 'requested', v: 'http/files.corp (the Service)' },
    ],
    inFlight: 'TGT + fresh authenticator',
    note: 'To get a service ticket, the client sends the TGS the still-sealed TGT plus a fresh authenticator: its name and the current timestamp, encrypted with the client/TGS session key it just recovered. The timestamp makes each request one-time — a captured authenticator goes stale within minutes.',
  });

  frames.push({
    phase: 'tgsrep',
    active: ['tgs', 'client'],
    msg: { from: 'tgs', to: 'client', dir: 'back', label: 'TGS-REP { service ticket }' },
    params: [
      { k: 'service_ticket', v: `${SAMPLE.svcTicket} (${SAMPLE.svcTicketKey})`, kind: 'ticket' },
      { k: 'session_key', v: SAMPLE.sessKeySvc, kind: 'key' },
      { k: 'tgs_check', v: 'TGT decrypts + authenticator fresh', kind: 'ok' },
    ],
    inFlight: 'service ticket + K_c,svc',
    note: 'The TGS decrypts the TGT with its own key (only the KDC can), reads the client/TGS session key inside, and uses it to validate the authenticator and its timestamp. Satisfied, it issues a service ticket sealed with the SERVICE\'s key, plus a new client/service session key. The client still never saw the service\'s key.',
  });

  frames.push({
    phase: 'apreq',
    active: ['client', 'svc'],
    msg: { from: 'client', to: 'svc', dir: 'fwd', label: 'AP-REQ { service ticket, authenticator }' },
    params: [
      { k: 'service_ticket', v: SAMPLE.svcTicket, kind: 'ticket' },
      {
        k: 'authenticator',
        v: replay
          ? `{ alice, timestamp ${SAMPLE.staleTs} (replayed) }`
          : `{ alice, timestamp ${SAMPLE.ts} }`,
        kind: replay ? 'fail' : 'time',
      },
      { k: 'auth_enc', v: 'encrypted with K_c,svc', kind: 'lock' },
    ],
    inFlight: replay ? 'replayed stale authenticator' : 'service ticket + fresh authenticator',
    note: replay
      ? 'Here an attacker replays an authenticator captured from an earlier session — but its timestamp is old. The service ticket is genuine, yet the authenticator carries a stale time. The service is about to notice.'
      : 'The client finally talks to the Service: it presents the service ticket (sealed with the service key) and a fresh authenticator encrypted with the client/service session key. The KDC is no longer involved — the ticket carries everything the service needs.',
  });

  if (replay) {
    frames.push({
      phase: 'reject',
      active: ['svc'],
      msg: { from: 'svc', to: 'svc', dir: 'self', label: '|now - timestamp| > skew ?' },
      params: [
        { k: 'decrypt_ticket', v: 'open ST with K_SVC -> get K_c,svc', kind: 'ok' },
        { k: 'authenticator_ts', v: SAMPLE.staleTs, kind: 'fail' },
        { k: 'clock_skew', v: '|now - ts| = 15m23s > 5m', kind: 'fail' },
        { k: 'result', v: 'KRB_AP_ERR_SKEW — rejected', kind: 'fail' },
      ],
      inFlight: 'timestamp too old — replay caught',
      fatal: true,
      note: 'The service decrypts the ticket with its own key to recover the session key, then decrypts the authenticator and checks its timestamp against the local clock. The replayed time is far outside the allowed skew window, so the service returns KRB_AP_ERR_SKEW and refuses. Timestamps plus a small replay cache are how Kerberos kills replay without ever contacting the KDC.',
    });
    return frames;
  }

  frames.push({
    phase: 'apcheck',
    active: ['svc'],
    msg: { from: 'svc', to: 'svc', dir: 'self', label: 'decrypt ticket + check timestamp' },
    params: [
      { k: 'decrypt_ticket', v: 'open ST with K_SVC -> get K_c,svc', kind: 'ok' },
      { k: 'authenticator_ts', v: SAMPLE.ts, kind: 'time' },
      { k: 'clock_skew', v: '|now - ts| = 0m02s < 5m', kind: 'ok' },
      { k: 'identity', v: 'alice@CORP — authenticated', kind: 'ok' },
    ],
    inFlight: 'ticket valid + timestamp fresh',
    note: 'The service decrypts the service ticket with its own long-term key — proving the ticket came from the trusted KDC — and pulls out the client/service session key. It uses that to open the authenticator and confirm the timestamp is within the skew window. Identity established, replay ruled out, and the KDC was never contacted for this call.',
  });

  frames.push({
    phase: 'aprep',
    active: ['svc', 'client'],
    msg: { from: 'svc', to: 'client', dir: 'back', label: 'AP-REP (mutual auth)' },
    params: [
      { k: 'enc', v: 'timestamp + 1, encrypted with K_c,svc', kind: 'key' },
      { k: 'proves', v: 'service holds the right key too', kind: 'ok' },
      { k: 'channel', v: 'session encrypted with K_c,svc', kind: 'ok' },
    ],
    inFlight: 'mutual authentication complete',
    note: 'For mutual authentication the service returns an AP-REP echoing the authenticator\'s timestamp, encrypted with the client/service session key. Only a service holding the real service key could have decrypted the ticket and produced this — so the client now trusts the service too. Both sides share K_c,svc for the encrypted session.',
  });

  frames.push({
    phase: 'done',
    active: ['client', 'svc'],
    msg: null,
    params: [
      { k: 'password', v: 'never left the client', kind: 'ok' },
      { k: 'tickets', v: 'TGT + service ticket, both timestamped', kind: 'ticket' },
      { k: 'KDC_calls_per_service', v: '0 after the service ticket', kind: 'ok' },
    ],
    inFlight: 'authenticated session open',
    note: 'Done. The password never crossed the wire — it only ever decrypted the AS-REP locally. Tickets are time-bounded and authenticators are single-use by timestamp, so a stolen ticket expires and a replayed authenticator is caught. And once the client holds a service ticket, it authenticates to that service repeatedly without bothering the KDC again — that is the scaling win.',
  });

  return frames;
}

const RUN_DELAY_MS = 1600;

export default function KerberosProtocolViz() {
  const [replay, setReplay] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(replay), [replay]);
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

  const toggleReplay = () => {
    setIsRunning(false);
    setStep(0);
    setReplay((v) => !v);
  };

  // SVG geometry — four actor lanes with vertical lifelines.
  const W = 940;
  const H = 360;
  const laneTop = 56;
  const laneBottom = H - 26;
  const pad = 90;
  const denom = Math.max(ACTORS.length - 1, 1);
  const laneX = (i) => pad + (i / denom) * (W - 2 * pad);
  const msgY = laneTop + 118;

  const ActorIcon = (icon, cls) => {
    if (icon === 'user') return <User width={20} height={20} className={cls} />;
    if (icon === 'key') return <KeyRound width={20} height={20} className={cls} />;
    if (icon === 'ticket') return <Ticket width={20} height={20} className={cls} />;
    return <Server width={20} height={20} className={cls} />;
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay flow' : 'Play');

  const msg = current.msg;
  const isActive = (key) => current.active.includes(key);

  const toneForDir = (dir) => (dir === 'back' ? 'back' : dir === 'self' ? 'self' : 'fwd');
  const msgTone = current.fatal ? 'fail' : (msg ? toneForDir(msg.dir) : 'fwd');

  let msgLine = null;
  if (msg && msg.dir !== 'self') {
    const xa = laneX(ACTOR_INDEX[msg.from]);
    const xb = laneX(ACTOR_INDEX[msg.to]);
    msgLine = { xa, xb, mid: (xa + xb) / 2, ltr: xb >= xa };
  }
  const selfActor = msg && msg.dir === 'self' ? laneX(ACTOR_INDEX[msg.from]) : null;

  const outcome = current.phase === 'reject'
    ? 'replay rejected'
    : (current.phase === 'aprep' || current.phase === 'done' ? 'authenticated' : 'in progress');
  const outcomeClass = current.phase === 'reject'
    ? 'is-fail'
    : (current.phase === 'aprep' || current.phase === 'done' ? 'is-ok' : '');

  const ticketHeld = step >= 5 ? 'service ticket' : (step >= 2 ? 'TGT' : 'none yet');

  return (
    <div className="kbv">
      <div className="kbv-head">
        <h3 className="kbv-title">Kerberos — tickets, not passwords, on the wire</h3>
        <p className="kbv-sub">
          The client earns a ticket-granting ticket from the AS, trades it at the TGS for a service
          ticket, then presents that to the Service. The password only ever unlocks a reply locally.
          Flip &ldquo;replay a stale authenticator&rdquo; to watch the timestamp check reject it.
        </p>
      </div>

      <div className="kbv-controls">
        <button
          type="button"
          className={`kbv-toggle ${replay ? 'is-danger' : ''}`}
          onClick={toggleReplay}
          aria-pressed={replay}
          title="Toggle replaying a captured, stale authenticator at the service"
        >
          {replay ? <X size={14} /> : <Clock size={14} />}
          replay a stale authenticator {replay ? 'on' : 'off'}
        </button>

        <span className={`kbv-mode-tag ${replay ? 'is-danger' : ''}`}>
          {replay ? 'replay attempt' : 'honest flow'}
        </span>

        <span className="kbv-ticket-tag">
          <Ticket size={12} /> holding: {ticketHeld}
        </span>

        <label className="kbv-speed">
          <span className="kbv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="kbv-speed-range"
            aria-label="Playback speed"
          />
          <span className="kbv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="kbv-spacer" aria-hidden="true" />

        <div className="kbv-buttons">
          <button
            type="button"
            className="kbv-btn kbv-btn-primary"
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
            className="kbv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="kbv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="kbv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="kbv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="kbv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="kbv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="kbv-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="kbv-ah is-fwd" />
            </marker>
            <marker id="kbv-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="kbv-ah is-back" />
            </marker>
            <marker id="kbv-arr-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="kbv-ah is-self" />
            </marker>
            <marker id="kbv-arr-fail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="kbv-ah is-fail" />
            </marker>
          </defs>

          {/* KDC bracket over AS + TGS */}
          {(() => {
            const x1 = laneX(ACTOR_INDEX.as) - 64;
            const x2 = laneX(ACTOR_INDEX.tgs) + 64;
            return (
              <g>
                <rect className="kbv-kdc" x={x1} y={laneTop - 38} width={x2 - x1} height={12} rx={4} />
                <text className="kbv-kdc-label" x={(x1 + x2) / 2} y={laneTop - 30} textAnchor="middle">
                  KDC (key distribution center)
                </text>
              </g>
            );
          })()}

          {/* lifelines */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            return (
              <line
                key={`life-${a.key}`}
                className={`kbv-life ${on ? 'is-on' : ''}`}
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
                className={`kbv-msg is-${msgTone}`}
                x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                y1={msgY}
                x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                y2={msgY}
                markerEnd={`url(#kbv-arr-${msgTone})`}
              />
              <text
                className={`kbv-msg-label is-${msgTone}`}
                x={msgLine.mid}
                y={msgY - 11}
                textAnchor="middle"
              >
                {msg.label}
              </text>
            </g>
          )}
          {selfActor != null && (
            <g>
              <path
                className={`kbv-msg is-${msgTone}`}
                d={`M ${selfActor} ${msgY - 14} q 60 0 60 16 q 0 16 -60 16`}
                fill="none"
                markerEnd={`url(#kbv-arr-${msgTone})`}
              />
              <text className={`kbv-msg-label is-${msgTone}`} x={selfActor + 68} y={msgY + 4} textAnchor="start">
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
                  className={`kbv-actor ${on ? 'is-on' : ''}`}
                  x={x - 64}
                  y={laneTop - 24}
                  width={128}
                  height={62}
                  rx={9}
                />
                <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                  {ActorIcon(a.icon, `kbv-actor-ic ${on ? 'is-on' : ''}`)}
                </g>
                <text className={`kbv-actor-label ${on ? 'is-on' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                  {a.label}
                </text>
                <text className="kbv-actor-sub" x={x} y={laneTop + 27} textAnchor="middle">
                  {a.sub}
                </text>
              </g>
            );
          })}

          {/* phase ribbon */}
          <text className={`kbv-phase-tag ${current.fatal ? 'is-fail' : ''}`} x={W / 2} y={laneBottom + 16} textAnchor="middle">
            {`${PHASE_LABEL[current.phase] || current.phase} · ${current.inFlight}`}
          </text>
        </svg>
      </div>

      <div className="kbv-body">
        <div className="kbv-payload">
          <div className="kbv-payload-head">
            <ArrowRight size={13} className="kbv-ic" />
            <span className="kbv-payload-title">
              {msg ? (msg.dir === 'self' ? 'local check' : `${msg.from} -> ${msg.to}`) : 'state'}
            </span>
            <span className="kbv-payload-label">{msg ? msg.label : 'idle'}</span>
          </div>
          <div className="kbv-params">
            {current.params.length === 0 && (
              <div className="kbv-param-empty">Nothing on the wire yet — press Play or Step.</div>
            )}
            {current.params.map((p) => (
              <div
                key={`${p.k}-${p.v}`}
                className={`kbv-param ${p.kind ? `is-${p.kind}` : ''}`}
              >
                <span className="kbv-param-k">{p.k}</span>
                <span className="kbv-param-eq">=</span>
                <span className="kbv-param-v">{p.v}</span>
                {p.kind === 'ticket' && <span className="kbv-param-badge is-ticket"><Ticket size={10} /> ticket</span>}
                {p.kind === 'key' && <span className="kbv-param-badge is-key"><KeyRound size={10} /> key</span>}
                {p.kind === 'lock' && <span className="kbv-param-badge is-lock"><ShieldCheck size={10} /> encrypted</span>}
                {p.kind === 'time' && <span className="kbv-param-badge is-time"><Clock size={10} /> timestamp</span>}
                {p.kind === 'ok' && <span className="kbv-param-badge is-ok"><Check size={10} /> ok</span>}
                {p.kind === 'fail' && <span className="kbv-param-badge is-fail"><X size={10} /> fail</span>}
                {p.kind === 'id' && <span className="kbv-param-badge is-id">principal</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="kbv-metrics">
          <div className="kbv-metric">
            <span className="kbv-metric-label">phase</span>
            <span className={`kbv-metric-value ${current.fatal ? 'is-fail' : (current.phase === 'aprep' || current.phase === 'done' ? 'is-ok' : '')}`}>
              {PHASE_LABEL[current.phase] || current.phase}
            </span>
          </div>
          <div className="kbv-metric">
            <span className="kbv-metric-label">password on wire</span>
            <span className="kbv-metric-value is-ok">never</span>
          </div>
          <div className="kbv-metric">
            <span className="kbv-metric-label">ticket held</span>
            <span className="kbv-metric-value">{ticketHeld}</span>
          </div>
          <div className="kbv-metric kbv-metric-dim">
            <span className="kbv-metric-label">outcome</span>
            <span className={`kbv-metric-value ${outcomeClass}`}>{outcome}</span>
          </div>
        </div>
      </div>

      <div className={`kbv-narration ${current.fatal ? 'is-fail' : (current.phase === 'aprep' || current.phase === 'done' || current.phase === 'apcheck' ? 'is-ok' : '')}`}>
        <span className={`kbv-narration-label ${current.fatal ? 'is-fail' : (current.phase === 'aprep' || current.phase === 'done' || current.phase === 'apcheck' ? 'is-ok' : '')}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="kbv-narration-body">{current.note}</span>
      </div>

      <div className="kbv-legend">
        <span className="kbv-legend-item"><Ticket size={13} className="kbv-ic is-ticket" /> TGT / service ticket — sealed, opaque to the client</span>
        <span className="kbv-legend-item"><KeyRound size={13} className="kbv-ic is-key" /> session key — recovered, then proves identity</span>
        <span className="kbv-legend-item"><Clock size={13} className="kbv-ic is-time" /> timestamped authenticator — single-use</span>
        <span className="kbv-legend-item"><X size={13} className="kbv-ic is-fail" /> stale timestamp -&gt; KRB_AP_ERR_SKEW</span>
      </div>
    </div>
  );
}
