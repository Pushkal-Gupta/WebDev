import React, { useMemo, useState } from 'react';
import { KeyRound, Server, HardDrive, Clock, RotateCcw, Upload, Download, Lock } from 'lucide-react';
import './PresignedUrlViz.css';

// Presigned URLs (S3-style), top to bottom.
//
// The client never holds the storage secret. It asks the app server to sign;
// the server uses its secret key to produce a time-limited URL embedding an
// expiry (X-Amz-Expires) and a fixed permission (PUT or GET on one object).
// The client then talks DIRECTLY to object storage with that URL — no proxying
// the bytes through the app server. Storage re-derives the signature and checks
// the clock: a request after the expiry, or for a different object/verb, is
// rejected with 403. The secret stays server-side the whole time.

const TTLS = [60, 300, 900, 3600]; // seconds
const PERMS = [
  { key: 'put', label: 'PUT (upload)', icon: Upload },
  { key: 'get', label: 'GET (download)', icon: Download },
];

const fmtClock = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const fmtTtl = (s) => (s >= 3600 ? '1h' : s >= 60 ? `${s / 60}m` : `${s}s`);

export default function PresignedUrlViz() {
  const [ttl, setTtl] = useState(300);
  const [perm, setPerm] = useState('put');
  const [clock, setClock] = useState(0); // seconds since the URL was issued

  const model = useMemo(() => {
    const expired = clock > ttl;
    const remaining = Math.max(0, ttl - clock);
    const permLabel = PERMS.find((p) => p.key === perm).label;
    return { expired, remaining, permLabel };
  }, [clock, ttl, perm]);

  const reset = () => {
    setTtl(300);
    setPerm('put');
    setClock(0);
  };

  const stepClock = (delta) => setClock((c) => Math.max(0, c + delta));

  // SVG geometry — two vertical lanes (client left, storage right), app server
  // top-center as the signer. Messages are horizontal arrows between lanes; the
  // overall sign->use flow still reads top to bottom.
  const W = 940;
  const H = 540;
  const clientX = 150;
  const storageX = 790;
  const serverY = 90;

  const laneTop = 140;
  const laneBot = 500;

  const y1 = 200; // ask server to sign
  const y2 = 250; // server returns signed URL
  const y3 = 360; // client -> storage direct
  const y4 = 410; // storage validates / responds

  const PermIcon = PERMS.find((p) => p.key === perm).icon;

  return (
    <div className="puv">
      <div className="puv-head">
        <h3 className="puv-title">Presigned URLs — sign on the server, transfer client-to-storage</h3>
        <p className="puv-sub">
          The client asks the app server to sign with its secret; it gets back a time-limited URL with a fixed
          permission. The bytes then move directly to object storage — the secret never leaves the server.
        </p>
      </div>

      <div className="puv-controls">
        <span className="puv-input-label">ttl</span>
        {TTLS.map((t) => (
          <button
            key={t}
            type="button"
            className={`puv-chip ${ttl === t ? 'is-active' : ''}`}
            onClick={() => setTtl(t)}
          >
            {fmtTtl(t)}
          </button>
        ))}

        <span className="puv-divider" aria-hidden="true" />

        <span className="puv-input-label">grant</span>
        {PERMS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`puv-chip ${perm === p.key ? 'is-active' : ''}`}
            onClick={() => setPerm(p.key)}
          >
            {p.key.toUpperCase()}
          </button>
        ))}

        <span className="puv-spacer" aria-hidden="true" />

        <span className="puv-input-label">clock</span>
        <button type="button" className="puv-btn" onClick={() => stepClock(-60)}>
          <Clock size={14} /> -1m
        </button>
        <button type="button" className="puv-btn" onClick={() => stepClock(60)}>
          <Clock size={14} /> +1m
        </button>
        <button type="button" className="puv-btn" onClick={() => stepClock(600)}>
          <Clock size={14} /> +10m
        </button>
        <button type="button" className="puv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="puv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="puv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="puv-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="puv-arrow-bad" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hard)" />
            </marker>
            <marker id="puv-arrow-mint" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hue-mint)" />
            </marker>
          </defs>

          {/* app server (signer) at top center */}
          <rect className="puv-server" x={W / 2 - 120} y={serverY - 28} width={240} height={48} rx={10} />
          <g transform={`translate(${W / 2 - 104}, ${serverY - 18})`}>
            <Server width={16} height={16} className="puv-ic-violet" />
          </g>
          <text className="puv-server-title" x={W / 2 - 80} y={serverY - 1}>App server</text>
          <g transform={`translate(${W / 2 + 60}, ${serverY - 17})`}>
            <Lock width={14} height={14} className="puv-ic-violet" />
          </g>
          <text className="puv-server-sub" x={W / 2 + 80} y={serverY - 2}>holds secret</text>

          {/* client lane */}
          <line className="puv-lane" x1={clientX} y1={laneTop} x2={clientX} y2={laneBot} />
          <rect className="puv-actor-box" x={clientX - 70} y={laneTop - 36} width={140} height={32} rx={8} />
          <g transform={`translate(${clientX - 56}, ${laneTop - 29})`}>
            <KeyRound width={14} height={14} className="puv-ic-sky" />
          </g>
          <text className="puv-actor-title puv-sky" x={clientX - 34} y={laneTop - 15}>Client</text>

          {/* storage lane */}
          <line className="puv-lane" x1={storageX} y1={laneTop} x2={storageX} y2={laneBot} />
          <rect className="puv-actor-box" x={storageX - 80} y={laneTop - 36} width={160} height={32} rx={8} />
          <g transform={`translate(${storageX - 66}, ${laneTop - 29})`}>
            <HardDrive width={14} height={14} className="puv-ic-mint" />
          </g>
          <text className="puv-actor-title puv-mint" x={storageX - 44} y={laneTop - 15}>Object storage</text>

          {/* msg 1: client -> server "sign this" */}
          <line className="puv-msg" x1={clientX} y1={y1} x2={W / 2 - 122} y2={y1} markerEnd="url(#puv-arrow)" />
          <text className="puv-msg-label" x={(clientX + W / 2) / 2 - 60} y={y1 - 8}>① please sign {perm.toUpperCase()}</text>

          {/* msg 2: server -> client signed URL */}
          <line className="puv-msg" x1={W / 2 - 122} y1={y2} x2={clientX} y2={y2} markerEnd="url(#puv-arrow-mint)" />
          <text className="puv-msg-label" x={(clientX + W / 2) / 2 - 60} y={y2 - 8}>② signed URL (ttl {fmtTtl(ttl)})</text>

          {/* divider note */}
          <text className="puv-band" x={W / 2} y={310}>— now the secret stays put; client talks to storage directly —</text>

          {/* msg 3: client -> storage direct transfer */}
          <line
            className={`puv-msg ${model.expired ? 'is-bad' : ''}`}
            x1={clientX}
            y1={y3}
            x2={storageX}
            y2={y3}
            markerEnd={model.expired ? 'url(#puv-arrow-bad)' : 'url(#puv-arrow)'}
          />
          <text className="puv-msg-label" x={(clientX + storageX) / 2 - 80} y={y3 - 8}>
            ③ {model.permLabel} with signed URL
          </text>

          {/* msg 4: storage response */}
          <line
            className={`puv-msg ${model.expired ? 'is-bad' : 'is-good'}`}
            x1={storageX}
            y1={y4}
            x2={clientX}
            y2={y4}
            markerEnd={model.expired ? 'url(#puv-arrow-bad)' : 'url(#puv-arrow-mint)'}
          />
          <text className={`puv-msg-label ${model.expired ? 'is-bad' : 'is-good'}`} x={(clientX + storageX) / 2 - 80} y={y4 - 8}>
            ④ {model.expired ? '403 expired / denied' : '200 OK — bytes transferred'}
          </text>

          {/* clock badge */}
          <g transform={`translate(${W / 2}, 470)`}>
            <rect className={`puv-clockbox ${model.expired ? 'is-bad' : ''}`} x={-140} y={-2} width={280} height={42} rx={9} />
            <PermIcon width={14} height={14} className={model.expired ? 'puv-ic-hard' : 'puv-ic-mint'} x={-126} y={9} />
            <text className="puv-clock-text" x={-100} y={24}>
              t+{fmtClock(clock)} · ttl {fmtClock(ttl)} ·
            </text>
            <text className={`puv-clock-state ${model.expired ? 'is-bad' : 'is-good'}`} x={70} y={24}>
              {model.expired ? 'EXPIRED' : `VALID ${fmtClock(model.remaining)}`}
            </text>
          </g>
        </svg>
      </div>

      <div className="puv-metrics">
        <div className="puv-metric">
          <span className="puv-metric-label">expiry (relative)</span>
          <span className="puv-metric-value">t+{fmtClock(ttl)}</span>
        </div>
        <div className="puv-metric">
          <span className="puv-metric-label">clock now</span>
          <span className="puv-metric-value">t+{fmtClock(clock)}</span>
        </div>
        <div className="puv-metric">
          <span className="puv-metric-label">status</span>
          <span className={`puv-metric-value ${model.expired ? 'is-bad' : 'is-good'}`}>
            {model.expired ? 'expired — 403' : `valid — ${fmtClock(model.remaining)} left`}
          </span>
        </div>
        <div className="puv-metric">
          <span className="puv-metric-label">client can</span>
          <span className="puv-metric-value">{model.expired ? 'nothing' : model.permLabel}</span>
        </div>
        <div className="puv-metric">
          <span className="puv-metric-label">client cannot</span>
          <span className="puv-metric-value">
            {perm === 'put' ? 'GET, DELETE, other keys' : 'PUT, DELETE, other keys'}
          </span>
        </div>
      </div>

      <div className="puv-narration">
        <span className="puv-narration-label">why it matters</span>
        <span className="puv-narration-body">
          {model.expired
            ? `The clock is past t+${fmtClock(ttl)}, so storage re-checks the embedded expiry and returns 403 — short TTLs mean a leaked URL stops working fast. Ask the server to sign a fresh one.`
            : `The URL grants exactly ${model.permLabel} on one object for ${fmtTtl(ttl)} and nothing else. The browser uploads straight to storage at line rate, the secret never crosses the wire, and the grant self-destructs at expiry.`}
        </span>
      </div>
    </div>
  );
}
