import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Server, Laptop, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './ApiRestViz.css';

// One resource collection the verbs act on. The initial rows are fixed, so a
// given verb always produces the same result — nothing here is random.
const INITIAL_ROWS = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
];

// Each verb: its path, the effect on the collection, and the status it returns.
const VERBS = {
  GET: {
    key: 'GET', path: '/users/2', hue: 'is-get',
    server: 'read row 2, change nothing', status: '200 OK',
    request: 'GET /users/2', body: '(no body)',
    apply: (rows) => rows,
  },
  POST: {
    key: 'POST', path: '/users', hue: 'is-post',
    server: 'insert a new row, assign id', status: '201 Created',
    request: 'POST /users', body: '{ name: "Lin" }',
    apply: (rows) => [...rows, { id: nextId(rows), name: 'Lin' }],
  },
  PUT: {
    key: 'PUT', path: '/users/2', hue: 'is-put',
    server: 'replace row 2 wholesale', status: '200 OK',
    request: 'PUT /users/2', body: '{ name: "Grace H." }',
    apply: (rows) => rows.map((r) => (r.id === 2 ? { id: 2, name: 'Grace H.' } : r)),
  },
  PATCH: {
    key: 'PATCH', path: '/users/2', hue: 'is-patch',
    server: 'merge one field of row 2', status: '200 OK',
    request: 'PATCH /users/2', body: '{ name: "Grace*" }',
    apply: (rows) => rows.map((r) => (r.id === 2 ? { ...r, name: 'Grace*' } : r)),
  },
  DELETE: {
    key: 'DELETE', path: '/users/2', hue: 'is-delete',
    server: 'remove row 2', status: '204 No Content',
    request: 'DELETE /users/2', body: '(no body)',
    apply: (rows) => rows.filter((r) => r.id !== 2),
  },
};

const VERB_ORDER = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function nextId(rows) {
  return rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

// Four resting states of one exchange. safeStep walks through them.
const STEPS = [
  { key: 'idle', label: 'Client builds the request', side: 'client' },
  { key: 'request', label: 'Request travels to the server', side: 'wire-down' },
  { key: 'process', label: 'Server processes the resource', side: 'server' },
  { key: 'response', label: 'Response returns with a status code', side: 'wire-up' },
];

// Geometry: two vertical lanes, messages cross horizontally between them.
const W = 420;
const H = 300;
const CLIENT_X = 84;
const SERVER_X = 336;
const LANE_TOP = 30;
const LANE_BOT = 274;
const REQ_Y = 128;
const RESP_Y = 196;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ApiRestViz() {
  const [verbKey, setVerbKey] = useState('POST');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const verb = VERBS[verbKey];
  const total = STEPS.length - 1;
  const safeStep = Math.min(step, total);
  const cur = STEPS[safeStep];

  // The collection only changes once the server has processed the request.
  const applied = safeStep >= 2;
  const rows = useMemo(
    () => (applied ? verb.apply(INITIAL_ROWS) : INITIAL_ROWS),
    [applied, verb],
  );

  function pickVerb(k) {
    setVerbKey(k);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const showReq = cur.key === 'request';
  const showResp = cur.key === 'response';
  const serverBusy = cur.key === 'process';

  const rowCount = rows.length;
  const statusShown = safeStep >= 3 ? verb.status : '—';

  return (
    <div className={`arv ${verb.hue}`}>
      <div className="arv-head">
        <div className="arv-head-icon"><Server size={18} /></div>
        <div className="arv-head-text">
          <h3 className="arv-title">One verb, one resource, one status code</h3>
          <p className="arv-sub">
            Pick an HTTP verb and step the exchange &mdash; the request crosses to the server,
            the collection changes (or not), and a status code comes back.
          </p>
        </div>
        <button type="button" className="arv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="arv-verbs">
        {VERB_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className={`arv-verb ${VERBS[k].hue}${k === verbKey ? ' is-on' : ''}`}
            onClick={() => pickVerb(k)}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="arv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="arv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="arv-arrow-head" />
            </marker>
            <marker id="arv-arrow-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="arv-arrow-head is-back" />
            </marker>
            <filter id="arv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* lifelines */}
          <line x1={CLIENT_X} y1={LANE_TOP + 34} x2={CLIENT_X} y2={LANE_BOT} className="arv-lifeline" />
          <line x1={SERVER_X} y1={LANE_TOP + 34} x2={SERVER_X} y2={LANE_BOT} className="arv-lifeline" />

          {/* lane headers */}
          <g className="arv-lane-head">
            <rect x={CLIENT_X - 52} y={LANE_TOP} width={104} height={30} rx={8} className="arv-lane-box" />
            <text x={CLIENT_X} y={LANE_TOP + 20} textAnchor="middle" className="arv-lane-name">CLIENT</text>
          </g>
          <g className={`arv-lane-head${serverBusy ? ' is-busy' : ''}`}>
            <rect x={SERVER_X - 52} y={LANE_TOP} width={104} height={30} rx={8} className="arv-lane-box is-server" />
            <text x={SERVER_X} y={LANE_TOP + 20} textAnchor="middle" className="arv-lane-name">SERVER</text>
          </g>

          {/* request message: client -> server */}
          <g className={`arv-msg is-req${showReq ? ' is-live' : ''}${safeStep > 1 ? ' is-past' : ''}`}>
            <line
              x1={CLIENT_X} y1={REQ_Y} x2={SERVER_X - 10} y2={REQ_Y}
              className="arv-msg-line" markerEnd="url(#arv-arrow)"
            />
            <text x={(CLIENT_X + SERVER_X) / 2} y={REQ_Y - 9} textAnchor="middle" className="arv-msg-label">
              {verb.request}
            </text>
            {showReq && (
              <circle cx={SERVER_X - 26} cy={REQ_Y} r={7} className="arv-packet" filter="url(#arv-glow)" />
            )}
          </g>

          {/* response message: server -> client */}
          <g className={`arv-msg is-resp${showResp ? ' is-live' : ''}`}>
            <line
              x1={SERVER_X} y1={RESP_Y} x2={CLIENT_X + 10} y2={RESP_Y}
              className="arv-msg-line is-back" markerEnd="url(#arv-arrow-back)"
            />
            <text x={(CLIENT_X + SERVER_X) / 2} y={RESP_Y - 9} textAnchor="middle" className="arv-msg-label is-back">
              {safeStep >= 3 ? verb.status : verb.status}
            </text>
            {showResp && (
              <circle cx={CLIENT_X + 26} cy={RESP_Y} r={7} className="arv-packet is-back" filter="url(#arv-glow)" />
            )}
          </g>

          {/* server processing marker on the lifeline */}
          <rect
            x={SERVER_X - 7} y={REQ_Y - 4} width={14} height={RESP_Y - REQ_Y + 8} rx={4}
            className={`arv-activation${safeStep >= 2 ? ' is-on' : ''}`}
          />
        </svg>
      </div>

      <div className="arv-lower">
        <div className="arv-table">
          <div className="arv-table-head">
            <span className="arv-table-title">/users</span>
            <span className="arv-table-count">{rowCount} rows</span>
          </div>
          <div className="arv-rows">
            {rows.map((r) => {
              const isNew = applied && verbKey === 'POST' && r.name === 'Lin';
              const isEdited = applied && (verbKey === 'PUT' || verbKey === 'PATCH') && r.id === 2;
              return (
                <div key={r.id} className={`arv-row${isNew ? ' is-new' : ''}${isEdited ? ' is-edited' : ''}`}>
                  <span className="arv-cell-id">{r.id}</span>
                  <span className="arv-cell-name">{r.name}</span>
                </div>
              );
            })}
            {applied && verbKey === 'DELETE' && (
              <div className="arv-row is-removed">
                <span className="arv-cell-id">2</span>
                <span className="arv-cell-name">Grace (removed)</span>
              </div>
            )}
          </div>
        </div>

        <div className="arv-readout">
          <div className="arv-stat is-method">
            <span className="arv-stat-label">method</span>
            <span className="arv-stat-val">{verbKey}</span>
          </div>
          <div className="arv-stat is-status">
            <span className="arv-stat-label">status</span>
            <span className="arv-stat-val">{statusShown}</span>
          </div>
          <div className="arv-stat is-rows">
            <span className="arv-stat-label">rows</span>
            <span className="arv-stat-val">{rowCount}</span>
          </div>
        </div>
      </div>

      <div className="arv-controls">
        <button type="button" className="arv-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="arv-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={safeStep >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="arv-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="arv-speed-range"
          />
          <span className="arv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="arv-progress">{safeStep} / {total}</span>
      </div>

      <div className="arv-note">
        <span className="arv-note-icon"><Laptop size={13} /></span>
        <span className="arv-note-body">
          {cur.label}. <strong>{verb.server}</strong> &mdash; {verbKey} returns {verb.status}.
        </span>
      </div>
    </div>
  );
}
