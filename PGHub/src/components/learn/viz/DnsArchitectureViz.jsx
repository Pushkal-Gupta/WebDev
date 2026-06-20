import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, RefreshCw, Database } from 'lucide-react';
import './DnsArchitectureViz.css';

// Recursive DNS resolution for one name (www.example.com) walking the hierarchy:
//   stub resolver -> recursive resolver -> root -> TLD -> authoritative -> back up.
// The recursive resolver holds a CACHE. On a cache HIT the query short-circuits:
// it never touches root / TLD / authoritative — far fewer hops.

const QNAME = 'www.example.com';
const ANSWER = '93.184.216.34';

// Tier indices into the column layout.
const STUB = 0;
const REC = 1;
const ROOT = 2;
const TLD = 3;
const AUTH = 4;

const TIERS = [
  { key: 'stub', label: 'Stub resolver', sub: 'OS / app' },
  { key: 'rec', label: 'Recursive resolver', sub: 'ISP / 8.8.8.8' },
  { key: 'root', label: 'Root server', sub: '. (13 roots)' },
  { key: 'tld', label: 'TLD server', sub: '.com' },
  { key: 'auth', label: 'Authoritative', sub: 'example.com' },
];

// dir: 'query' (down the hierarchy), 'referral' (a pointer back to recursive),
//      'answer' (the A record returning up the chain).
function buildFrames(cached) {
  const frames = [];

  const snap = (extra) => ({
    from: -1,
    to: -1,
    dir: null,
    active: -1,
    cacheState: cached ? 'warm' : 'cold',
    cacheHit: null,
    contacted: [],
    answer: null,
    ...extra,
  });

  frames.push(snap({
    active: STUB,
    note: `Resolve ${QNAME}. The stub resolver on the host has no answer of its own — it forwards the whole question to its configured recursive resolver and waits for a final IP.`,
  }));

  frames.push(snap({
    from: STUB,
    to: REC,
    dir: 'query',
    active: REC,
    note: `Stub -> recursive resolver: "what is the A record for ${QNAME}?" The recursive resolver is the only server that does the legwork; the stub just asks once.`,
  }));

  if (cached) {
    // Warm path: cache HIT, short-circuit.
    frames.push(snap({
      active: REC,
      cacheHit: true,
      contacted: ['rec'],
      note: `Cache HIT. The recursive resolver looked up ${QNAME} in its local cache and the record is still inside its TTL. No need to contact root, TLD, or the authoritative server at all.`,
    }));
    frames.push(snap({
      from: REC,
      to: STUB,
      dir: 'answer',
      active: STUB,
      cacheHit: true,
      contacted: ['rec'],
      answer: ANSWER,
      note: `Recursive -> stub: returns the cached A record ${QNAME} = ${ANSWER}. Total of 2 hops — the cache turned a five-tier walk into a single round trip.`,
    }));
    frames.push(snap({
      active: STUB,
      cacheHit: true,
      contacted: ['rec'],
      answer: ANSWER,
      note: `Done. ${QNAME} resolved to ${ANSWER} straight from the recursive resolver's cache. Caching at this tier is what keeps DNS fast for popular names.`,
    }));
    return frames;
  }

  // Cold path: cache MISS, full recursive walk.
  frames.push(snap({
    active: REC,
    cacheHit: false,
    contacted: ['rec'],
    note: `Cache MISS. The recursive resolver has no fresh record for ${QNAME}, so it must walk the hierarchy from the top. It starts by asking a root server.`,
  }));

  frames.push(snap({
    from: REC,
    to: ROOT,
    dir: 'query',
    active: ROOT,
    cacheHit: false,
    contacted: ['rec', 'root'],
    note: `Recursive -> root server: "where do I find ${QNAME}?" The root knows nothing about example.com itself — only who is responsible for the .com zone.`,
  }));

  frames.push(snap({
    from: ROOT,
    to: REC,
    dir: 'referral',
    active: REC,
    cacheHit: false,
    contacted: ['rec', 'root'],
    note: `Root -> recursive: referral. "I don't have it, but here are the .com TLD servers — ask them." The root never gives the final answer, only a pointer one level down.`,
  }));

  frames.push(snap({
    from: REC,
    to: TLD,
    dir: 'query',
    active: TLD,
    cacheHit: false,
    contacted: ['rec', 'root', 'tld'],
    note: `Recursive -> .com TLD server: "where is ${QNAME}?" The TLD server tracks every domain registered under .com and who is authoritative for each.`,
  }));

  frames.push(snap({
    from: TLD,
    to: REC,
    dir: 'referral',
    active: REC,
    cacheHit: false,
    contacted: ['rec', 'root', 'tld'],
    note: `.com -> recursive: referral. "example.com is served by these authoritative nameservers — ask them." Another pointer down, still no final IP.`,
  }));

  frames.push(snap({
    from: REC,
    to: AUTH,
    dir: 'query',
    active: AUTH,
    cacheHit: false,
    contacted: ['rec', 'root', 'tld', 'auth'],
    note: `Recursive -> authoritative server for example.com: "what is the A record for ${QNAME}?" This server holds the actual zone data and can give the real answer.`,
  }));

  frames.push(snap({
    from: AUTH,
    to: REC,
    dir: 'answer',
    active: REC,
    cacheHit: false,
    contacted: ['rec', 'root', 'tld', 'auth'],
    answer: ANSWER,
    note: `Authoritative -> recursive: the A record ${QNAME} = ${ANSWER}, with a TTL. This is the authoritative answer the recursive resolver was walking the tree to find.`,
  }));

  frames.push(snap({
    active: REC,
    cacheHit: false,
    contacted: ['rec', 'root', 'tld', 'auth'],
    answer: ANSWER,
    note: `The recursive resolver stores ${QNAME} = ${ANSWER} in its cache for the TTL. The next lookup of this name from any client takes the warm path — a single hop.`,
  }));

  frames.push(snap({
    from: REC,
    to: STUB,
    dir: 'answer',
    active: STUB,
    cacheHit: false,
    contacted: ['rec', 'root', 'tld', 'auth'],
    answer: ANSWER,
    note: `Recursive -> stub: returns the final A record ${QNAME} = ${ANSWER}. Cold lookups touch all four server tiers — that is why the cache matters so much.`,
  }));

  frames.push(snap({
    active: STUB,
    cacheHit: false,
    contacted: ['rec', 'root', 'tld', 'auth'],
    answer: ANSWER,
    note: `Done. ${QNAME} resolved to ${ANSWER} after a full recursive walk: stub -> recursive -> root -> TLD -> authoritative and back. Subsequent lookups will be cached.`,
  }));

  return frames;
}

const CONTACTED_KEYS = ['root', 'tld', 'auth'];

export default function DnsArchitectureViz() {
  const [cached, setCached] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(cached), [cached]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1200 / speed);

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

  const switchMode = (warm) => {
    if (warm === cached) return;
    setIsRunning(false);
    setStep(0);
    setCached(warm);
  };

  // Total hops = number of edge-traversal frames (frames with a real from/to).
  const totalHops = useMemo(
    () => frames.reduce((acc, f) => acc + (f.from >= 0 && f.to >= 0 ? 1 : 0), 0),
    [frames],
  );
  const hopsSoFar = useMemo(
    () => frames.slice(0, step + 1).reduce((acc, f) => acc + (f.from >= 0 && f.to >= 0 ? 1 : 0), 0),
    [frames, step],
  );
  const serversContacted = current.contacted.filter((c) => CONTACTED_KEYS.includes(c)).length;

  // SVG geometry — five tier columns across the top, query lane below.
  const W = 940;
  const H = 420;
  const colN = TIERS.length;
  const margin = 28;
  const colGap = (W - margin * 2) / colN;
  const boxW = colGap - 24;
  const boxH = 86;
  const boxY = 64;
  const colX = (i) => margin + colGap * i + 12;
  const colCx = (i) => colX(i) + boxW / 2;

  const phaseLabel = current.cacheHit === true
    ? 'cache hit'
    : current.cacheHit === false
      ? 'cache miss'
      : 'querying';

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // The animated packet sits on the active edge.
  const edge = current.from >= 0 && current.to >= 0 ? { from: current.from, to: current.to, dir: current.dir } : null;
  const dirColor = (dir) => (dir === 'query' ? 'var(--hue-sky)' : dir === 'referral' ? 'var(--warning)' : 'var(--easy)');

  return (
    <div className="dnsv">
      <div className="dnsv-head">
        <h3 className="dnsv-title">Recursive DNS resolution — walking the hierarchy with caching</h3>
        <p className="dnsv-sub">
          One name resolves down five tiers: stub to recursive resolver to root to TLD to authoritative, then the answer
          climbs back. Flip the recursive resolver's cache warm and the same lookup short-circuits to two hops.
        </p>
      </div>

      <div className="dnsv-controls">
        <div className="dnsv-modes" role="tablist" aria-label="Cache state">
          <button
            type="button"
            className={`dnsv-mode ${!cached ? 'is-on' : ''}`}
            onClick={() => switchMode(false)}
            aria-pressed={!cached}
          >
            cold cache (miss)
          </button>
          <button
            type="button"
            className={`dnsv-mode ${cached ? 'is-on' : ''}`}
            onClick={() => switchMode(true)}
            aria-pressed={cached}
          >
            warm cache (hit)
          </button>
        </div>

        <label className="dnsv-speed">
          <span className="dnsv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dnsv-speed-range"
            aria-label="Playback speed"
          />
          <span className="dnsv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dnsv-spacer" aria-hidden="true" />

        <div className="dnsv-buttons">
          <button
            type="button"
            className="dnsv-btn dnsv-btn-primary"
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
            className="dnsv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="dnsv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dnsv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="dnsv-btn" onClick={() => switchMode(!cached)}>
            <RefreshCw size={12} /> toggle cache
          </button>
        </div>
        <div className="dnsv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="dnsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dnsv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="dnsv-row-label" x={margin} y={34}>DNS hierarchy — query walks down, answer climbs back</text>

          {/* baseline connecting the tiers */}
          <line className="dnsv-spine" x1={colCx(STUB)} y1={boxY + boxH / 2} x2={colCx(AUTH)} y2={boxY + boxH / 2} />

          {/* the active edge / travelling packet */}
          {edge && (() => {
            const x1 = colCx(edge.from);
            const x2 = colCx(edge.to);
            const yEdge = edge.dir === 'answer' || edge.dir === 'referral' ? boxY + boxH + 26 : boxY + boxH / 2;
            const col = dirColor(edge.dir);
            return (
              <g>
                <line
                  className="dnsv-edge"
                  x1={x1}
                  y1={yEdge}
                  x2={x2}
                  y2={yEdge}
                  style={{ stroke: col }}
                />
                <circle className="dnsv-packet" cx={(x1 + x2) / 2} cy={yEdge} r={9} style={{ fill: col }} />
                <text
                  className="dnsv-edge-label"
                  x={(x1 + x2) / 2}
                  y={yEdge - 14}
                  style={{ fill: col }}
                >
                  {edge.dir === 'query' ? 'query ▾' : edge.dir === 'referral' ? 'referral ▴' : 'answer ▴'}
                </text>
              </g>
            );
          })()}

          {/* tier columns */}
          {TIERS.map((t, i) => {
            const x = colX(i);
            const active = current.active === i;
            const wasContacted = current.contacted.includes(t.key);
            const isRec = i === REC;
            const recHit = isRec && current.cacheHit === true;
            const recMiss = isRec && current.cacheHit === false;
            return (
              <g key={t.key}>
                <rect
                  className={`dnsv-tier ${active ? 'is-active' : ''} ${wasContacted ? 'is-contacted' : ''} ${recHit ? 'is-hit' : ''} ${recMiss ? 'is-miss' : ''}`}
                  x={x}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx={10}
                />
                <text className="dnsv-tier-idx" x={x + 12} y={boxY + 20}>{i + 1}</text>
                <text className="dnsv-tier-label" x={x + boxW / 2} y={boxY + 38}>{t.label}</text>
                <text className="dnsv-tier-sub" x={x + boxW / 2} y={boxY + 56}>{t.sub}</text>
                {isRec && (
                  <g>
                    <rect
                      className={`dnsv-cachechip ${recHit ? 'is-hit' : ''} ${recMiss ? 'is-miss' : ''}`}
                      x={x + boxW / 2 - 40}
                      y={boxY + 64}
                      width={80}
                      height={16}
                      rx={5}
                    />
                    <text className="dnsv-cachechip-label" x={x + boxW / 2} y={boxY + 76}>
                      {recHit ? 'cache HIT' : recMiss ? 'cache MISS' : 'cache'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* query origin: the host asking */}
          <text className="dnsv-qname-cap" x={colCx(STUB)} y={boxY - 16}>resolving</text>
          <text className="dnsv-qname" x={colCx(STUB)} y={boxY - 32}>{QNAME}</text>

          {/* answer readout */}
          <text className="dnsv-row-label" x={margin} y={boxY + boxH + 86}>resolved address</text>
          <rect
            className={`dnsv-answerbox ${current.answer ? 'is-found' : ''}`}
            x={margin}
            y={boxY + boxH + 96}
            width={300}
            height={52}
            rx={10}
          />
          <text className="dnsv-answer-val" x={margin + 150} y={boxY + boxH + 128}>
            {current.answer ? `${QNAME} = ${current.answer}` : 'pending…'}
          </text>

          {/* path legend */}
          <g transform={`translate(${margin + 340}, ${boxY + boxH + 96})`}>
            <rect className="dnsv-legbox" x={0} y={0} width={W - margin * 2 - 340} height={52} rx={10} />
            <line className="dnsv-leg-line" x1={18} y1={18} x2={48} y2={18} style={{ stroke: 'var(--hue-sky)' }} />
            <text className="dnsv-leg-txt" x={56} y={22}>query (down)</text>
            <line className="dnsv-leg-line" x1={170} y1={18} x2={200} y2={18} style={{ stroke: 'var(--warning)' }} />
            <text className="dnsv-leg-txt" x={208} y={22}>referral</text>
            <line className="dnsv-leg-line" x1={300} y1={18} x2={330} y2={18} style={{ stroke: 'var(--easy)' }} />
            <text className="dnsv-leg-txt" x={338} y={22}>answer (up)</text>
            <text className="dnsv-leg-txt" x={18} y={42}>
              {cached ? 'warm cache: stub → recursive (hit) → stub, 2 hops' : 'cold cache: full walk through all four server tiers'}
            </text>
          </g>
        </svg>
      </div>

      <div className="dnsv-metrics">
        <div className="dnsv-metric">
          <span className="dnsv-metric-label">phase</span>
          <span className={`dnsv-metric-value ${current.cacheHit === true ? 'is-hit' : current.cacheHit === false ? 'is-miss' : ''}`}>
            {phaseLabel}
          </span>
        </div>
        <div className="dnsv-metric">
          <span className="dnsv-metric-label">cache</span>
          <span className={`dnsv-metric-value ${current.cacheHit === true ? 'is-hit' : current.cacheHit === false ? 'is-miss' : ''}`}>
            {current.cacheHit === true ? 'HIT' : current.cacheHit === false ? 'MISS' : cached ? 'warm' : 'cold'}
          </span>
        </div>
        <div className="dnsv-metric">
          <span className="dnsv-metric-label">hops</span>
          <span className="dnsv-metric-value">{hopsSoFar} / {totalHops}</span>
        </div>
        <div className="dnsv-metric">
          <span className="dnsv-metric-label">servers contacted</span>
          <span className="dnsv-metric-value">{serversContacted}</span>
        </div>
        <div className="dnsv-metric dnsv-metric-dim">
          <span className="dnsv-metric-label">answer</span>
          <span className="dnsv-metric-value dnsv-metric-dimval">
            {current.answer ? <><Database size={12} /> {current.answer}</> : '—'}
          </span>
        </div>
      </div>

      <div className="dnsv-narration">
        <span className="dnsv-narration-label">trace</span>
        <span className="dnsv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
