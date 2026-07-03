import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Globe, Server, Database, Play, Pause, SkipForward, RotateCcw, Zap, Clock } from 'lucide-react';
import './NetDnsHttpViz.css';

// Vertical pipeline of actors. Top-to-bottom: the browser asks a resolver,
// which walks the DNS hierarchy, then the browser fetches over HTTP.
const NODES = [
  { id: 'browser', label: 'Browser', sub: 'you', Icon: Globe, kind: 'edge' },
  { id: 'resolver', label: 'Recursive resolver', sub: 'ISP / public', Icon: Server, kind: 'dns' },
  { id: 'root', label: 'Root name server', sub: 'the root .', Icon: Server, kind: 'dns' },
  { id: 'tld', label: 'TLD name server', sub: '.com', Icon: Server, kind: 'dns' },
  { id: 'auth', label: 'Authoritative NS', sub: 'example.com', Icon: Database, kind: 'dns' },
  { id: 'server', label: 'Web server', sub: '93.184.216.34', Icon: Server, kind: 'http' },
];

// Each step is one directed hop: dot travels from node `from` to node `to`.
const DNS_STEPS = [
  { from: 0, to: 1, ms: 2, phase: 'dns', label: 'Browser asks the resolver: where is www.example.com?' },
  { from: 1, to: 2, ms: 18, phase: 'dns', label: 'Resolver -> Root: who is responsible for .com?' },
  { from: 2, to: 3, ms: 16, phase: 'dns', label: 'Root referral -> resolver asks the .com TLD server' },
  { from: 3, to: 4, ms: 20, phase: 'dns', label: 'TLD referral -> resolver asks the authoritative server' },
  { from: 4, to: 1, ms: 18, phase: 'dns', label: 'Authoritative -> resolver: A 93.184.216.34, TTL 3600' },
  { from: 1, to: 0, ms: 2, phase: 'dns', label: 'Resolver -> browser: 93.184.216.34  [answer now cached]' },
];
const HTTP_STEPS = [
  { from: 0, to: 5, ms: 45, phase: 'http', label: 'Browser -> server: TCP + TLS handshake, then GET /index.html' },
  { from: 5, to: 0, ms: 18, phase: 'http', label: 'Server -> browser: 200 OK, text/html (12 KB)' },
];
const CACHE_STEP = { from: 0, to: 0, ms: 1, phase: 'cache', label: 'Cache HIT: www.example.com -> 93.184.216.34  [no DNS walk]' };

const FIRST = [...DNS_STEPS, ...HTTP_STEPS];
const CACHED = [CACHE_STEP, ...HTTP_STEPS];

const sumMs = (steps) => steps.reduce((s, x) => s + x.ms, 0);
const FIRST_TOTAL = sumMs(FIRST);
const CACHED_TOTAL = sumMs(CACHED);

// SVG geometry.
const W = 520;
const BOX_X = 150;
const BOX_W = 230;
const BOX_H = 40;
const GAP = 14;
const TOP = 16;
const cyOf = (i) => TOP + i * (BOX_H + GAP) + BOX_H / 2;
const H = TOP + NODES.length * (BOX_H + GAP) - GAP + TOP;
const SPINE_X = BOX_X + BOX_W / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const MODES = [
  { id: 'first', label: 'First visit', hint: 'cold cache' },
  { id: 'cached', label: 'Repeat visit', hint: 'warm cache' },
];

export default function NetDnsHttpViz() {
  const [mode, setMode] = useState('first');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const steps = mode === 'first' ? FIRST : CACHED;
  const total = steps.length;
  const totalMs = mode === 'first' ? FIRST_TOTAL : CACHED_TOTAL;

  function pickMode(id) { setMode(id); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }
  function reset() { setStep(0); setPlaying(false); }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), Math.round((reduced() ? 360 : 880) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const current = step > 0 ? steps[step - 1] : null;
  const elapsed = useMemo(
    () => steps.slice(0, step).reduce((s, x) => s + x.ms, 0),
    [steps, step],
  );
  const finished = step >= total;
  const showPause = playing && step < total;

  const dotNode = current ? current.to : 0;
  const dotY = cyOf(dotNode);
  const activePair = current ? new Set([current.from, current.to]) : new Set([0]);

  const phaseLabel = current
    ? (current.phase === 'dns' ? 'DNS resolution'
      : current.phase === 'cache' ? 'cache lookup' : 'HTTP exchange')
    : 'ready';

  return (
    <div className="netdns">
      <div className="netdns-head">
        <div className="netdns-head-icon"><Globe size={18} /></div>
        <div className="netdns-head-text">
          <h3 className="netdns-title">From name to page: DNS, then HTTP</h3>
          <p className="netdns-sub">
            A name is resolved by walking root &rarr; TLD &rarr; authoritative, then the page is
            fetched over HTTP. The repeat visit skips the whole DNS walk &mdash; the answer is cached.
          </p>
        </div>
        <button type="button" className="netdns-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="netdns-chips">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`netdns-chip${m.id === mode ? ' is-active' : ''}`}
            onClick={() => pickMode(m.id)}
          >
            {m.id === 'cached' ? <Zap size={12} /> : <Globe size={12} />}
            {m.label}
            <span className="netdns-chip-hint">{m.hint}</span>
          </button>
        ))}
      </div>

      <div className="netdns-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="netdns-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="netdns-dot-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-sky)" />
            </linearGradient>
            <filter id="netdns-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* spine connecting consecutive actors */}
          <line
            x1={SPINE_X} y1={cyOf(0)} x2={SPINE_X} y2={cyOf(NODES.length - 1)}
            className="netdns-spine"
          />
          {/* HTTP shortcut edge: browser straight to server, drawn in the left gutter */}
          <path
            className={`netdns-http-edge${current && current.phase === 'http' ? ' is-live' : ''}`}
            d={`M ${BOX_X - 8} ${cyOf(0)} C ${BOX_X - 64} ${cyOf(0)}, ${BOX_X - 64} ${cyOf(5)}, ${BOX_X - 8} ${cyOf(5)}`}
          />
          <text x={BOX_X - 60} y={(cyOf(0) + cyOf(5)) / 2} className="netdns-http-edge-label" textAnchor="middle">
            <tspan>HTTP</tspan>
          </text>

          {NODES.map((n, i) => {
            const active = activePair.has(i);
            const cy = cyOf(i);
            return (
              <g key={n.id} className={`netdns-node is-${n.kind}${active ? ' is-active' : ''}`}>
                <rect x={BOX_X} y={cy - BOX_H / 2} width={BOX_W} height={BOX_H} rx={9} className="netdns-node-box" />
                <text x={BOX_X + 16} y={cy - 3} className="netdns-node-label">{n.label}</text>
                <text x={BOX_X + 16} y={cy + 12} className="netdns-node-sub">{n.sub}</text>
                <text x={BOX_X + BOX_W - 14} y={cy + 5} className="netdns-node-tag" textAnchor="end">
                  {n.kind === 'dns' ? 'DNS' : n.kind === 'http' ? 'web' : 'client'}
                </text>
              </g>
            );
          })}

          {/* the message dot rides the spine */}
          <g
            className={`netdns-dot is-${current ? current.phase : 'idle'}`}
            style={{ transform: `translate(${SPINE_X}px, ${dotY}px)` }}
          >
            <circle r={9} className="netdns-dot-core" filter="url(#netdns-glow)" />
          </g>
        </svg>
      </div>

      <div className="netdns-controls">
        <button type="button" className="netdns-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}
          {showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="netdns-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="netdns-speed">
          <span className="netdns-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="netdns-speed-range"
          />
          <span className="netdns-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="netdns-progress">{step} / {total} hops</span>
      </div>

      <div className="netdns-readout">
        <div className="netdns-stat is-phase">
          <span className="netdns-stat-label">stage</span>
          <span className="netdns-stat-val">{phaseLabel}</span>
        </div>
        <div className="netdns-stat is-elapsed">
          <Clock size={13} />
          <span className="netdns-stat-label">elapsed</span>
          <span className="netdns-stat-val">{elapsed} / {totalMs} ms</span>
        </div>
        <div className={`netdns-stat ${mode === 'cached' ? 'is-hit' : 'is-miss'}`}>
          <span className="netdns-stat-label">DNS cache</span>
          <span className="netdns-stat-val">{mode === 'cached' ? 'HIT' : 'MISS'}</span>
        </div>
      </div>

      <div className="netdns-compare">
        <span className="netdns-compare-row">
          <span className="netdns-compare-key">first visit</span>
          <span className="netdns-compare-bar"><span className="netdns-compare-fill is-first" style={{ width: '100%' }} /></span>
          <span className="netdns-compare-num">{FIRST_TOTAL} ms</span>
        </span>
        <span className="netdns-compare-row">
          <span className="netdns-compare-key">repeat visit</span>
          <span className="netdns-compare-bar"><span className="netdns-compare-fill is-cached" style={{ width: `${(CACHED_TOTAL / FIRST_TOTAL) * 100}%` }} /></span>
          <span className="netdns-compare-num">{CACHED_TOTAL} ms</span>
        </span>
      </div>

      <div className="netdns-note">
        <span className="netdns-note-label">now</span>
        <span className="netdns-note-body">
          {current
            ? current.label
            : `${mode === 'first' ? 'Cold cache' : 'Warm cache'}: press Play to ${mode === 'first' ? 'walk the hierarchy and fetch the page' : 'skip DNS and fetch straight from the server'}.`}
        </span>
      </div>
    </div>
  );
}
