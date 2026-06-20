import React, { useMemo, useState } from 'react';
import { Globe, Lock, Plug, Download, FileCode, RotateCcw, Zap } from 'lucide-react';
import './DnsPrefetchViz.css';

const HTML_PARSE = 300;
const FETCH_MS = 120;
const PARSE_BEFORE_NEED = 220;
const BASE_DNS = 40;
const BASE_TCP = 50;
const BASE_TLS = 80;

const MODES = [
  { id: 'none', label: 'No hint', icon: Download },
  { id: 'dns-prefetch', label: 'dns-prefetch', icon: Globe },
  { id: 'preconnect', label: 'preconnect', icon: Plug },
];

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const r = Math.round(n);
  if (r < min) return min;
  if (r > max) return max;
  return r;
}

function phaseDurations(rtt) {
  const scale = rtt / 100;
  return {
    dns: Math.round(BASE_DNS * scale),
    tcp: Math.round(BASE_TCP * scale),
    tls: Math.round(BASE_TLS * scale),
    fetch: FETCH_MS,
  };
}

// Compute the handshake + fetch timeline for one scenario.
// `earlyPhases` lists which connection phases run up-front during idle time.
function buildScenario(mode, rtt) {
  const d = phaseDurations(rtt);
  const earlyByMode = {
    none: [],
    'dns-prefetch': ['dns'],
    preconnect: ['dns', 'tcp', 'tls'],
  };
  const early = earlyByMode[mode];

  // The page reaches the point where it needs the third-party resource after
  // PARSE_BEFORE_NEED ms of parsing. Up-front handshake phases start at 0 and
  // overlap the idle window while HTML keeps parsing.
  const needAt = PARSE_BEFORE_NEED;

  const upfront = [];
  let t = 0;
  for (const ph of early) {
    upfront.push({ phase: ph, start: t, dur: d[ph], early: true });
    t += d[ph];
  }
  const warmEnd = t;

  // Remaining connection phases that still happen lazily at request time.
  const allPhases = ['dns', 'tcp', 'tls'];
  const lazyPhases = allPhases.filter((p) => !early.includes(p));

  const lazy = [];
  let lt = needAt;
  for (const ph of lazyPhases) {
    lazy.push({ phase: ph, start: lt, dur: d[ph], early: false });
    lt += d[ph];
  }
  const fetchStart = lazy.length > 0 ? lt : needAt;
  const fetchSeg = { phase: 'fetch', start: fetchStart, dur: d.fetch, early: false };
  const resourceReady = fetchStart + d.fetch;

  return {
    mode,
    durations: d,
    upfront,
    lazy,
    fetch: fetchSeg,
    warmEnd,
    needAt,
    resourceReady,
    movedOff: early,
  };
}

const PHASE_META = {
  dns: { label: 'DNS', hue: 'sky', icon: Globe },
  tcp: { label: 'TCP', hue: 'violet', icon: Plug },
  tls: { label: 'TLS', hue: 'pink', icon: Lock },
  fetch: { label: 'Fetch', hue: 'mint', icon: Download },
};

export default function DnsPrefetchViz() {
  const [mode, setMode] = useState('preconnect');
  const [rtt, setRtt] = useState(100);

  const none = useMemo(() => buildScenario('none', rtt), [rtt]);
  const selected = useMemo(() => buildScenario(mode, rtt), [mode, rtt]);

  const maxTime = useMemo(() => {
    const ends = [
      none.resourceReady,
      selected.resourceReady,
      HTML_PARSE,
      none.warmEnd,
      selected.warmEnd,
    ];
    return Math.max(...ends) * 1.04;
  }, [none, selected]);

  // SVG geometry.
  const VB_W = 960;
  const padL = 150;
  const padR = 28;
  const padTop = 30;
  const laneH = 34;
  const laneGap = 16;
  const plotW = VB_W - padL - padR;
  const xFor = (ms) => padL + (ms / maxTime) * plotW;
  const wFor = (ms) => (ms / maxTime) * plotW;

  const lanes = [
    { key: 'html', label: 'HTML parse', scenario: null },
    { key: 'none', label: 'No hint', scenario: none },
    { key: 'sel', label: MODES.find((m) => m.id === mode).label, scenario: selected },
  ];
  const VB_H = padTop + lanes.length * (laneH + laneGap) + 46;

  const saved = none.resourceReady - selected.resourceReady;
  const savedPct = none.resourceReady === 0 ? 0 : (saved / none.resourceReady) * 100;

  const movedLabel =
    selected.movedOff.length === 0
      ? 'none'
      : selected.movedOff.map((p) => PHASE_META[p].label).join(' + ');

  const tickStep = maxTime > 600 ? 200 : maxTime > 300 ? 100 : 50;
  const ticks = [];
  for (let v = 0; v <= maxTime; v += tickStep) ticks.push(v);

  function renderConnectionSegs(scenario, laneY) {
    const segs = [...scenario.upfront, ...scenario.lazy, scenario.fetch];
    return segs.map((seg, i) => {
      const meta = PHASE_META[seg.phase];
      const x = xFor(seg.start);
      const w = Math.max(2, wFor(seg.dur));
      const showText = w > 26;
      return (
        <g key={`seg-${i}`} className={`dnp-seg dnp-seg-${meta.hue} ${seg.early ? 'dnp-seg-early' : 'dnp-seg-lazy'}`}>
          <rect x={x} y={laneY} width={w} height={laneH} rx={5} className="dnp-seg-rect" />
          {showText && (
            <text x={x + w / 2} y={laneY + laneH / 2 + 4} textAnchor="middle" className="dnp-seg-text">
              {meta.label}
            </text>
          )}
        </g>
      );
    });
  }

  return (
    <div className="dnp-root">
      <div className="dnp-head">
        <div className="dnp-title-block">
          <h3 className="dnp-title">Resource hints: dns-prefetch &amp; preconnect</h3>
          <p className="dnp-sub">
            A third-party origin needs DNS, TCP and TLS before its first byte arrives. Done lazily,
            that handshake lands on the critical path. A resource hint moves it up-front into the idle
            window while the HTML is still parsing, so the connection is warm when the resource is needed.
          </p>
        </div>
      </div>

      <div className="dnp-controls">
        <div className="dnp-control-group">
          <span className="dnp-input-label">Hint</span>
          <div className="dnp-segmented">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`dnp-seg-btn ${mode === m.id ? 'dnp-seg-btn-on' : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  <Icon size={13} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="dnp-control-group">
          <label className="dnp-input-label" htmlFor="dnp-rtt">
            Third-party RTT
          </label>
          <input
            id="dnp-rtt"
            type="range"
            className="dnp-range"
            min={40}
            max={260}
            step={10}
            value={rtt}
            onChange={(e) => setRtt(clampInt(e.target.value, 40, 260, 100))}
          />
          <span className="dnp-range-value">{rtt} ms</span>
        </div>

        <div className="dnp-control-spacer" />

        <button type="button" className="dnp-btn dnp-btn-accent" onClick={() => setRtt(220)}>
          <Zap size={14} /> High latency
        </button>
        <button
          type="button"
          className="dnp-btn"
          onClick={() => {
            setMode('preconnect');
            setRtt(100);
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="dnp-tag-row">
        <span className="dnp-tag dnp-tag-sky">
          <Globe size={12} /> DNS {selected.durations.dns}ms
        </span>
        <span className="dnp-tag dnp-tag-violet">
          <Plug size={12} /> TCP {selected.durations.tcp}ms
        </span>
        <span className="dnp-tag dnp-tag-pink">
          <Lock size={12} /> TLS {selected.durations.tls}ms
        </span>
        <span className="dnp-tag dnp-tag-mint">
          <Download size={12} /> Fetch {selected.durations.fetch}ms
        </span>
        <span className="dnp-tag dnp-tag-doc">
          <FileCode size={12} /> moved off critical path: {movedLabel}
        </span>
      </div>

      <div className="dnp-stage">
        <svg
          className="dnp-svg"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Page-load timeline comparing connection setup without and with a resource hint"
        >
          {ticks.map((v, i) => (
            <g key={`tick-${i}`} className="dnp-tick">
              <line x1={xFor(v)} y1={padTop - 6} x2={xFor(v)} y2={VB_H - 30} className="dnp-tick-line" />
              <text x={xFor(v)} y={VB_H - 14} textAnchor="middle" className="dnp-tick-text">
                {v}ms
              </text>
            </g>
          ))}

          {/* "needs resource" marker */}
          <line
            x1={xFor(selected.needAt)}
            y1={padTop - 6}
            x2={xFor(selected.needAt)}
            y2={VB_H - 30}
            className="dnp-need-line"
          />
          <text x={xFor(selected.needAt) + 4} y={padTop + 2} className="dnp-need-text">
            resource needed
          </text>

          {lanes.map((lane, li) => {
            const laneY = padTop + li * (laneH + laneGap);
            return (
              <g key={lane.key}>
                <text x={padL - 12} y={laneY + laneH / 2 + 4} textAnchor="end" className="dnp-lane-label">
                  {lane.label}
                </text>
                <rect
                  x={padL}
                  y={laneY}
                  width={plotW}
                  height={laneH}
                  rx={5}
                  className="dnp-lane-bg"
                />

                {lane.key === 'html' && (
                  <g className="dnp-seg dnp-seg-doc">
                    <rect x={xFor(0)} y={laneY} width={wFor(HTML_PARSE)} height={laneH} rx={5} className="dnp-seg-rect" />
                    <text x={xFor(HTML_PARSE / 2)} y={laneY + laneH / 2 + 4} textAnchor="middle" className="dnp-seg-text">
                      document download + parse
                    </text>
                    {/* idle window marker */}
                    <line x1={xFor(0)} y1={laneY + laneH + 8} x2={xFor(selected.needAt)} y2={laneY + laneH + 8} className="dnp-idle-line" />
                  </g>
                )}

                {lane.scenario && (
                  <>
                    {renderConnectionSegs(lane.scenario, laneY)}
                    <g className="dnp-ready">
                      <line
                        x1={xFor(lane.scenario.resourceReady)}
                        y1={laneY - 4}
                        x2={xFor(lane.scenario.resourceReady)}
                        y2={laneY + laneH + 4}
                        className="dnp-ready-line"
                      />
                      <text
                        x={xFor(lane.scenario.resourceReady) + 4}
                        y={laneY - 6}
                        className="dnp-ready-text"
                      >
                        {Math.round(lane.scenario.resourceReady)}ms
                      </text>
                    </g>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dnp-footer">
        <div className="dnp-stat">
          <span className="dnp-stat-label">Mode</span>
          <span className="dnp-stat-value">{MODES.find((m) => m.id === mode).label}</span>
        </div>
        <div className="dnp-stat">
          <span className="dnp-stat-label">Resource ready — no hint</span>
          <span className="dnp-stat-value">{Math.round(none.resourceReady)} ms</span>
        </div>
        <div className="dnp-stat">
          <span className="dnp-stat-label">Resource ready — {MODES.find((m) => m.id === mode).label}</span>
          <span className="dnp-stat-value">{Math.round(selected.resourceReady)} ms</span>
        </div>
        <div className="dnp-stat dnp-stat-emph">
          <span className="dnp-stat-label">Time saved</span>
          <span className="dnp-stat-value dnp-stat-big">
            {Math.round(saved)} ms ({savedPct.toFixed(0)}%)
          </span>
        </div>
        <div className="dnp-stat">
          <span className="dnp-stat-label">Phases off critical path</span>
          <span className="dnp-stat-value">{movedLabel}</span>
        </div>
        <div className="dnp-stat dnp-stat-grow">
          <span className="dnp-stat-label">What changed</span>
          <span className="dnp-stat-value">
            {selected.movedOff.length === 0
              ? 'Nothing warmed early — DNS, TCP and TLS all run lazily once the resource is requested.'
              : `${movedLabel} run during idle parse time, so the fetch starts the moment the resource is needed.`}
          </span>
        </div>
      </div>
    </div>
  );
}
