import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Trash2, RefreshCw, Zap } from 'lucide-react';
import './CdnEdgeCacheViz.css';

const W = 940;
const H = 440;

const ORIGIN = { x: 470, y: 70, label: 'Origin' };

// Edge POPs arranged across the lower band; each user sits just below its edge.
const EDGES = [
  { id: 'E0', label: 'us-west', x: 150, y: 230 },
  { id: 'E1', label: 'us-east', x: 360, y: 250 },
  { id: 'E2', label: 'eu-west', x: 580, y: 250 },
  { id: 'E3', label: 'ap-south', x: 790, y: 230 },
];

const USERS = [
  { id: 'U0', city: 'Seattle', edge: 'E0', x: 110, y: 370 },
  { id: 'U1', city: 'Chicago', edge: 'E1', x: 320, y: 392 },
  { id: 'U2', city: 'Berlin', edge: 'E2', x: 620, y: 392 },
  { id: 'U3', city: 'Mumbai', edge: 'E3', x: 830, y: 370 },
];

const edgeById = (id) => EDGES.find((e) => e.id === id);
const userById = (id) => USERS.find((u) => u.id === id);

// Deterministic latencies so a replay is stable.
const hitLatency = (uid) => 15 + (uid.charCodeAt(1) % 4) * 7; // 15..36 ms
const missLatency = (uid) => 130 + (uid.charCodeAt(1) % 5) * 14; // 130..186 ms

// Replay the event list to a full step trace. Cache warmth per edge is derived
// purely here — no state is mutated outside this function.
function buildFrames(events) {
  const frames = [];
  const warm = {}; // edgeId -> true once populated
  for (const e of EDGES) warm[e.id] = false;
  let hits = 0;
  let misses = 0;

  const snap = (extra) => ({
    warm: { ...warm },
    hits,
    misses,
    activeUser: null,
    activeEdge: null,
    result: null,
    latency: null,
    legs: [], // [{from:{x,y}, to:{x,y}}] path the packet walks
    packetAt: 0, // index into legs the packet currently occupies (start of that leg)
    purge: false,
    ...extra,
  });

  frames.push(snap({
    note: 'Four edge caches sit between users and the origin. Every cache starts cold, so the first request from each region is a miss.',
  }));

  for (const ev of events) {
    if (ev.type === 'purge') {
      for (const e of EDGES) warm[e.id] = false;
      frames.push(snap({
        purge: true,
        note: 'Purge — every edge cache is dropped. The next request in each region travels back to the origin again.',
      }));
      continue;
    }
    // request event
    const u = userById(ev.user);
    const edge = edgeById(u.edge);
    const isHit = warm[edge.id];
    const up = { x: u.x, y: u.y };
    const ep = { x: edge.x, y: edge.y };
    const op = { x: ORIGIN.x, y: ORIGIN.y };

    if (isHit) {
      hits += 1;
      const lat = hitLatency(u.id);
      frames.push(snap({
        activeUser: u.id,
        activeEdge: edge.id,
        result: 'HIT',
        latency: lat,
        legs: [{ from: up, to: ep }, { from: ep, to: up }],
        packetAt: 0,
        note: `${u.city} -> ${edge.label}: HIT. ${edge.label} already holds the content, served in ${lat} ms without touching the origin.`,
      }));
    } else {
      misses += 1;
      warm[edge.id] = true;
      const lat = missLatency(u.id);
      frames.push(snap({
        activeUser: u.id,
        activeEdge: edge.id,
        result: 'MISS',
        latency: lat,
        legs: [
          { from: up, to: ep },
          { from: ep, to: op },
          { from: op, to: ep },
          { from: ep, to: up },
        ],
        packetAt: 0,
        note: `${u.city} -> ${edge.label}: MISS. ${edge.label} fetches from the origin, populates its cache, then answers — ${lat} ms. ${edge.label} is now warm.`,
      }));
    }
  }

  const total = hits + misses;
  const ratio = total ? Math.round((hits / total) * 100) : 0;
  if (events.some((e) => e.type === 'request')) {
    frames.push(snap({
      note: `Idle. ${hits} hit(s), ${misses} miss(es) over ${total} request(s) -> hit rate ${ratio}%. Warm edges keep answering locally until the next purge.`,
    }));
  }
  return frames;
}

const DEFAULT_EVENTS = [
  { type: 'request', user: 'U1' },
  { type: 'request', user: 'U1' },
  { type: 'request', user: 'U2' },
  { type: 'request', user: 'U0' },
  { type: 'request', user: 'U2' },
];

export default function CdnEdgeCacheViz() {
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(events), [events]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const issueRequest = (userId) => {
    setIsRunning(false);
    setEvents((es) => [...es, { type: 'request', user: userId }]);
    setStep(totalSteps);
  };

  const demoRequest = () => {
    const u = USERS[Math.floor(Math.random() * USERS.length)];
    issueRequest(u.id);
  };

  const purge = () => {
    setIsRunning(false);
    setEvents((es) => [...es, { type: 'purge' }]);
    setStep(totalSteps);
  };

  const restart = () => {
    setIsRunning(false);
    setEvents(DEFAULT_EVENTS);
    setStep(0);
  };

  const total = current.hits + current.misses;
  const ratio = total ? Math.round((current.hits / total) * 100) : 0;
  const servingEdge = current.activeEdge ? edgeById(current.activeEdge).label : '—';

  // Packet position: animate along the active leg list, one hop per playback tick.
  // The packet rests at the END of the leg indexed by min(step-progress). To keep
  // it purely derived from the frame, place it at the destination of the last leg.
  const packet = (() => {
    if (!current.legs || current.legs.length === 0) return null;
    const lastLeg = current.legs[current.legs.length - 1];
    return { x: lastLeg.to.x, y: lastLeg.to.y };
  })();

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');
  const resultToken = current.result === 'HIT' ? 'is-hit' : current.result === 'MISS' ? 'is-miss' : '';

  return (
    <div className="cdn">
      <div className="cdn-head">
        <h3 className="cdn-title">CDN edge caching — hits stay local, misses reach the origin</h3>
        <p className="cdn-sub">
          Click a city to fetch content. A nearby cache hit returns in milliseconds; a miss travels all the way to the origin and warms the edge.
        </p>
      </div>

      <div className="cdn-controls">
        <button type="button" className="cdn-btn" onClick={demoRequest}>
          <RefreshCw size={12} /> demo request
        </button>
        <button type="button" className="cdn-btn" onClick={purge}>
          <Trash2 size={12} /> purge cache
        </button>

        <label className="cdn-speed">
          <span className="cdn-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cdn-speed-range"
            aria-label="Playback speed"
          />
          <span className="cdn-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="cdn-spacer" aria-hidden="true" />

        <div className="cdn-buttons">
          <button
            type="button"
            className="cdn-btn cdn-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="cdn-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cdn-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cdn-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="cdn-btn" onClick={restart}>
            <RefreshCw size={13} /> Restart
          </button>
        </div>
        <div className="cdn-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cdn-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cdn-svg" preserveAspectRatio="xMidYMid meet">
          {/* static links: each edge to origin, each user to its edge */}
          {EDGES.map((e) => {
            const active = current.legs.some(
              (l) => (l.from.x === e.x && l.from.y === e.y && l.to.x === ORIGIN.x && l.to.y === ORIGIN.y)
                || (l.to.x === e.x && l.to.y === e.y && l.from.x === ORIGIN.x && l.from.y === ORIGIN.y),
            );
            return (
              <line
                key={`oe-${e.id}`}
                className={`cdn-link ${active ? 'is-active-miss' : ''}`}
                x1={ORIGIN.x}
                y1={ORIGIN.y}
                x2={e.x}
                y2={e.y}
              />
            );
          })}
          {USERS.map((u) => {
            const e = edgeById(u.edge);
            const active = current.activeUser === u.id;
            const cls = active ? (current.result === 'HIT' ? 'is-active-hit' : 'is-active-miss') : '';
            return (
              <line
                key={`ue-${u.id}`}
                className={`cdn-link ${cls}`}
                x1={u.x}
                y1={u.y}
                x2={e.x}
                y2={e.y}
              />
            );
          })}

          {/* origin */}
          <g>
            <rect className="cdn-origin" x={ORIGIN.x - 64} y={ORIGIN.y - 26} width={128} height={52} rx={10} />
            <text className="cdn-origin-label" x={ORIGIN.x} y={ORIGIN.y - 2}>Origin server</text>
            <text className="cdn-origin-sub" x={ORIGIN.x} y={ORIGIN.y + 16}>source of truth</text>
          </g>

          {/* edges */}
          {EDGES.map((e) => {
            const isWarm = current.warm[e.id];
            const isActive = current.activeEdge === e.id;
            const cls = [
              'cdn-edge',
              isWarm && 'is-warm',
              isActive && (current.result === 'HIT' ? 'is-hit' : 'is-miss'),
            ].filter(Boolean).join(' ');
            return (
              <g key={`edge-${e.id}`}>
                <rect className={cls} x={e.x - 52} y={e.y - 24} width={104} height={48} rx={9} />
                <text className="cdn-edge-label" x={e.x} y={e.y - 2}>{e.label}</text>
                <g transform={`translate(${e.x - 40}, ${e.y + 8})`}>
                  <circle className={`cdn-cache-dot ${isWarm ? 'is-warm' : ''}`} cx={6} cy={-4} r={5} />
                  <text className="cdn-edge-state" x={18} y={0}>{isWarm ? 'cached' : 'cold'}</text>
                </g>
              </g>
            );
          })}

          {/* users (clickable) */}
          {USERS.map((u) => {
            const isActive = current.activeUser === u.id;
            const cls = [
              'cdn-user',
              isActive && (current.result === 'HIT' ? 'is-hit' : 'is-miss'),
            ].filter(Boolean).join(' ');
            return (
              <g
                key={`user-${u.id}`}
                className="cdn-user-g"
                onClick={() => issueRequest(u.id)}
                role="button"
                tabIndex={0}
                aria-label={`Request content from ${u.city}`}
              >
                <circle className={cls} cx={u.x} cy={u.y} r={18} />
                <text className="cdn-user-icon" x={u.x} y={u.y + 5}>{u.city.charAt(0)}</text>
                <text className="cdn-user-label" x={u.x} y={u.y + 36}>{u.city}</text>
              </g>
            );
          })}

          {/* moving packet */}
          {packet && (
            <g>
              <circle className={`cdn-packet ${resultToken}`} cx={packet.x} cy={packet.y} r={8} />
              {current.latency != null && (
                <text className={`cdn-packet-lat ${resultToken}`} x={packet.x} y={packet.y - 14}>
                  {current.latency} ms
                </text>
              )}
            </g>
          )}

          <text x={24} y={H - 12} className="cdn-hint">click a city to issue a request</text>
        </svg>
      </div>

      <div className="cdn-metrics">
        <div className="cdn-metric">
          <span className="cdn-metric-label">result</span>
          <span className={`cdn-metric-value ${resultToken}`}>{current.result || '—'}</span>
        </div>
        <div className="cdn-metric">
          <span className="cdn-metric-label">latency</span>
          <span className={`cdn-metric-value ${resultToken}`}>
            {current.latency != null ? `${current.latency} ms` : '—'}
          </span>
        </div>
        <div className="cdn-metric">
          <span className="cdn-metric-label">hit rate</span>
          <span className="cdn-metric-value"><Zap size={12} /> {ratio}%</span>
        </div>
        <div className="cdn-metric">
          <span className="cdn-metric-label">hits</span>
          <span className="cdn-metric-value is-hit">{current.hits}</span>
        </div>
        <div className="cdn-metric">
          <span className="cdn-metric-label">misses</span>
          <span className="cdn-metric-value is-miss">{current.misses}</span>
        </div>
        <div className="cdn-metric">
          <span className="cdn-metric-label">serving edge</span>
          <span className="cdn-metric-value">{servingEdge}</span>
        </div>
      </div>

      <div className="cdn-narration">
        <span className="cdn-narration-label">trace</span>
        <span className="cdn-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
