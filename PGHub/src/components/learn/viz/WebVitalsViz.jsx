import React, { useId, useMemo, useState } from 'react';
import {
  Gauge, Timer, MousePointerClick, MoveVertical, RotateCcw, Wrench,
} from 'lucide-react';
import './WebVitalsViz.css';

const METRICS = [
  { id: 'lcp', label: 'LCP', long: 'Largest Contentful Paint', Icon: Timer },
  { id: 'cls', label: 'CLS', long: 'Cumulative Layout Shift', Icon: MoveVertical },
  { id: 'inp', label: 'INP', long: 'Interaction to Next Paint', Icon: MousePointerClick },
];

// rating from value against [good, poor] thresholds
function rate(value, good, poor) {
  if (value <= good) return 'good';
  if (value <= poor) return 'needs';
  return 'poor';
}

const RATING_META = {
  good: { label: 'Good', token: 'var(--easy)', cls: 'is-good' },
  needs: { label: 'Needs work', token: 'var(--medium)', cls: 'is-needs' },
  poor: { label: 'Poor', token: 'var(--hard)', cls: 'is-poor' },
};

const SEG_HUES = ['var(--hue-sky)', 'var(--hue-violet)', 'var(--hue-pink)', 'var(--hue-mint)'];

// ---- LCP -------------------------------------------------------------------
const LCP_DEFAULTS = { ttfb: 350, discover: 200, fetch: 700, render: 500 };
const LCP_HOPS = [
  { key: 'ttfb', label: 'TTFB', desc: 'server responds' },
  { key: 'discover', label: 'Discover', desc: 'find hero URL' },
  { key: 'fetch', label: 'Fetch', desc: 'download bytes' },
  { key: 'render', label: 'Render', desc: 'paint pixels' },
];
const LAZY_PENALTY = 1800; // ms added to discover when hero is lazy-loaded

// ---- CLS -------------------------------------------------------------------
const CLS_DEFAULTS = [
  { impact: 0.8, distance: 0.1 },
  { impact: 0.35, distance: 0.18 },
  { impact: 0.15, distance: 0.05 },
];

// ---- INP -------------------------------------------------------------------
const INP_DEFAULTS = { input: 90, handler: 280, render: 120 };

export default function WebVitalsViz() {
  const uid = useId().replace(/:/g, '');
  const [active, setActive] = useState('lcp');

  const [lcp, setLcp] = useState({ ...LCP_DEFAULTS });
  const [lazy, setLazy] = useState(false);

  const [shifts, setShifts] = useState(CLS_DEFAULTS.map((s) => ({ ...s })));
  const [reserve, setReserve] = useState(false);

  const [inp, setInp] = useState({ ...INP_DEFAULTS });
  const [yieldFix, setYieldFix] = useState(false);

  const reset = () => {
    setLcp({ ...LCP_DEFAULTS });
    setLazy(false);
    setShifts(CLS_DEFAULTS.map((s) => ({ ...s })));
    setReserve(false);
    setInp({ ...INP_DEFAULTS });
    setYieldFix(false);
  };

  // ---- LCP compute ---------------------------------------------------------
  const lcpData = useMemo(() => {
    const discover = lcp.discover + (lazy ? LAZY_PENALTY : 0);
    const segs = [
      { ...LCP_HOPS[0], value: lcp.ttfb },
      { ...LCP_HOPS[1], value: discover },
      { ...LCP_HOPS[2], value: lcp.fetch },
      { ...LCP_HOPS[3], value: lcp.render },
    ];
    const totalMs = segs.reduce((a, s) => a + s.value, 0);
    return { segs, totalMs, totalS: totalMs / 1000 };
  }, [lcp, lazy]);
  const lcpRating = rate(lcpData.totalS, 2.5, 4.0);

  // ---- CLS compute ---------------------------------------------------------
  const clsData = useMemo(() => {
    const rows = shifts.map((s) => {
      const score = reserve ? 0 : s.impact * s.distance;
      return { ...s, score };
    });
    const total = rows.reduce((a, r) => a + r.score, 0);
    return { rows, total };
  }, [shifts, reserve]);
  const clsRating = rate(clsData.total, 0.1, 0.25);

  // ---- INP compute ---------------------------------------------------------
  const inpData = useMemo(() => {
    const input = yieldFix ? Math.round(inp.input * 0.4) : inp.input;
    const handler = yieldFix ? Math.min(inp.handler, 50) : inp.handler;
    const renderMs = inp.render;
    const segs = [
      { key: 'input', label: 'Input delay', desc: 'queue then start', value: input },
      { key: 'handler', label: 'Handler', desc: 'your JS runs', value: handler },
      { key: 'render', label: 'Render', desc: 'paint result', value: renderMs },
    ];
    const total = segs.reduce((a, s) => a + s.value, 0);
    return { segs, total };
  }, [inp, yieldFix]);
  const inpRating = rate(inpData.total, 200, 500);

  const setLcpHop = (k, v) => setLcp((p) => ({ ...p, [k]: v }));
  const setInpHop = (k, v) => setInp((p) => ({ ...p, [k]: v }));
  const setShift = (i, k, v) => setShifts((p) => p.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  return (
    <div className="wvit">
      <div className="wvit-head">
        <span className="wvit-head-icon"><Gauge size={18} /></span>
        <div className="wvit-head-text">
          <h3 className="wvit-title">Core Web Vitals explorer</h3>
          <p className="wvit-sub">
            Drag the inputs and watch each vital score and rate itself live against the
            p75 good / needs-work / poor thresholds.
          </p>
        </div>
        <button type="button" className="wvit-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="wvit-tabs" role="tablist" aria-label="Web vital">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active === m.id}
            className={`wvit-tab ${active === m.id ? 'is-on' : ''}`}
            onClick={() => setActive(m.id)}
          >
            <m.Icon size={14} />
            <span className="wvit-tab-label">{m.label}</span>
            <span className="wvit-tab-long">{m.long}</span>
          </button>
        ))}
      </div>

      {active === 'lcp' && (
        <LcpExplorer
          uid={uid}
          lcp={lcp}
          lazy={lazy}
          setLazy={setLazy}
          setLcpHop={setLcpHop}
          data={lcpData}
          rating={lcpRating}
        />
      )}
      {active === 'cls' && (
        <ClsExplorer
          shifts={shifts}
          setShift={setShift}
          reserve={reserve}
          setReserve={setReserve}
          data={clsData}
          rating={clsRating}
        />
      )}
      {active === 'inp' && (
        <InpExplorer
          uid={uid}
          inp={inp}
          setInpHop={setInpHop}
          yieldFix={yieldFix}
          setYieldFix={setYieldFix}
          data={inpData}
          rating={inpRating}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared gauge: a horizontal threshold scale with a marker at the value's spot.
// good zone | needs zone | poor zone, value clamped onto the scale.
function ThresholdGauge({ value, good, poor, max, unit, format }) {
  const W = 600;
  const H = 54;
  const pad = 6;
  const inner = W - pad * 2;
  const at = (v) => pad + Math.min(v / max, 1) * inner;
  const goodX = at(good);
  const poorX = at(poor);
  const valX = at(value);
  const rating = rate(value, good, poor);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="wvit-gauge-svg" preserveAspectRatio="xMidYMid meet">
      <rect className="wvit-gz is-good" x={pad} y={20} width={goodX - pad} height={14} rx={3} />
      <rect className="wvit-gz is-needs" x={goodX} y={20} width={poorX - goodX} height={14} rx={3} />
      <rect className="wvit-gz is-poor" x={poorX} y={20} width={W - pad - poorX} height={14} rx={3} />

      <text className="wvit-gtick" x={goodX} y={50} textAnchor="middle">{format(good)}</text>
      <text className="wvit-gtick" x={poorX} y={50} textAnchor="middle">{format(poor)}</text>

      <g style={{ transform: `translateX(${valX}px)` }} className="wvit-gmarker-g">
        <polygon className={`wvit-gmarker ${RATING_META[rating].cls}`} points="0,2 -6,-8 6,-8" />
        <line className={`wvit-gneedle ${RATING_META[rating].cls}`} x1={0} y1={4} x2={0} y2={36} />
        <text className={`wvit-gval ${RATING_META[rating].cls}`} x={0} y={-3} textAnchor="middle">
          {format(value)}{unit}
        </text>
      </g>
    </svg>
  );
}

function RatingChip({ rating }) {
  const m = RATING_META[rating];
  return <span className={`wvit-chip ${m.cls}`}>{m.label}</span>;
}

function Slider({ label, desc, value, min, max, step, unit, onChange }) {
  return (
    <label className="wvit-slider">
      <span className="wvit-slider-top">
        <span className="wvit-slider-label">{label}</span>
        <span className="wvit-slider-val">{value}{unit}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="wvit-range" aria-label={`${label} ${desc}`}
      />
      <span className="wvit-slider-desc">{desc}</span>
    </label>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      className={`wvit-toggle ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
      <span className="wvit-toggle-knob" />
      <span className="wvit-toggle-label">{label}</span>
    </button>
  );
}

// ---- LCP explorer ----------------------------------------------------------
function LcpExplorer({ uid, lcp, lazy, setLazy, setLcpHop, data, rating }) {
  const { segs, totalMs, totalS } = data;
  // vertical waterfall geometry: time flows DOWNWARD
  const W = 360;
  const top = 30;
  const colX = 150;
  const colW = 150;
  const pxPerMs = 0.05;
  const minSeg = 16;
  const heights = segs.map((s) => Math.max(s.value * pxPerMs, minSeg));
  const bars = segs.map((s, i) => ({
    ...s,
    y: top + heights.slice(0, i).reduce((a, b) => a + b, 0),
    h: heights[i],
    hue: SEG_HUES[i],
  }));
  const H = top + heights.reduce((a, b) => a + b, 0) + 24;

  return (
    <div className="wvit-body">
      <div className="wvit-controls">
        {LCP_HOPS.map((hop) => (
          <Slider
            key={hop.key}
            label={hop.label}
            desc={hop.desc}
            value={lcp[hop.key]}
            min={0}
            max={hop.key === 'fetch' ? 3000 : 2000}
            step={10}
            unit=" ms"
            onChange={(v) => setLcpHop(hop.key, v)}
          />
        ))}
        <Toggle on={lazy} onChange={setLazy} label="hero is lazy-loaded" />
      </div>

      <div className="wvit-visual">
        <div className="wvit-waterfall">
          <div className="wvit-wf-cap"><MoveVertical size={12} /> time flows down</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="wvit-wf-svg" preserveAspectRatio="xMidYMid meet">
            <defs><linearGradient id={`${uid}-lcpgrad`} /></defs>
            <line className="wvit-wf-axis" x1={colX - 14} y1={top} x2={colX - 14} y2={H - 24} />
            {bars.map((b) => (
              <g key={b.key}>
                <rect
                  x={colX} y={b.y + 1} width={colW} height={b.h - 2} rx={4}
                  fill={b.hue} opacity={lazy && b.key === 'discover' ? 0.95 : 0.85}
                  className="wvit-wf-bar"
                />
                <text className="wvit-wf-name" x={colX - 22} y={b.y + b.h / 2 + 4} textAnchor="end">
                  {b.label}
                </text>
                <text className="wvit-wf-ms" x={colX + colW / 2} y={b.y + b.h / 2 + 4} textAnchor="middle">
                  {b.value} ms
                </text>
                {lazy && b.key === 'discover' && (
                  <text className="wvit-wf-pen" x={colX + colW + 8} y={b.y + b.h / 2 + 4}>
                    +{LAZY_PENALTY} lazy
                  </text>
                )}
              </g>
            ))}
            <text className="wvit-wf-total" x={colX + colW / 2} y={H - 8} textAnchor="middle">
              LCP = {totalMs} ms = {totalS.toFixed(2)} s
            </text>
          </svg>
        </div>

        <div className="wvit-readout">
          <div className="wvit-score-row">
            <span className="wvit-score-num" style={{ color: RATING_META[rating].token }}>
              {totalS.toFixed(2)}<span className="wvit-score-unit">s</span>
            </span>
            <RatingChip rating={rating} />
          </div>
          <ThresholdGauge
            value={totalS} good={2.5} poor={4.0} max={6} unit="s"
            format={(v) => v.toFixed(1)}
          />
          <ThresholdLegend good="≤ 2.5s" needs="2.5 – 4.0s" poor="> 4.0s" />
          <p className="wvit-fix">
            <Wrench size={13} />
            Put the hero <code>&lt;img&gt;</code> in HTML with <code>fetchpriority=&quot;high&quot;</code>,
            preconnect to its origin, inline critical CSS — never <code>loading=&quot;lazy&quot;</code> the hero.
          </p>
          <p className="wvit-narrate">
            LCP is the sum of the chain: TTFB then discover the hero URL then fetch its bytes then render.
            {lazy ? ' Lazy-loading the hero delays discovery until layout runs — the classic wound.' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- CLS explorer ----------------------------------------------------------
function ClsExplorer({ shifts, setShift, reserve, setReserve, data, rating }) {
  const { rows, total } = data;
  const worst = rows.reduce((mx, r, i) => (r.score > rows[mx].score ? i : mx), 0);

  return (
    <div className="wvit-body">
      <div className="wvit-controls wvit-controls-cls">
        {shifts.map((s, i) => (
          <div key={`shift-${i}`} className="wvit-shift">
            <span className="wvit-shift-tag">shift {i + 1}</span>
            <Slider
              label="impact" desc="fraction of viewport moved"
              value={s.impact} min={0} max={1} step={0.05} unit=""
              onChange={(v) => setShift(i, 'impact', v)}
            />
            <Slider
              label="distance" desc="how far it jumped"
              value={s.distance} min={0} max={1} step={0.05} unit=""
              onChange={(v) => setShift(i, 'distance', v)}
            />
            <span className="wvit-shift-score">
              = {(s.impact * s.distance).toFixed(3)}
            </span>
          </div>
        ))}
        <Toggle on={reserve} onChange={setReserve} label="reserve space (width/height)" />
      </div>

      <div className="wvit-visual">
        <div className="wvit-page-mock" aria-hidden="true">
          <div className="wvit-mock-cap">page mock</div>
          <div className={`wvit-mock-frame ${reserve ? 'is-reserved' : 'is-shifting'}`}>
            <div className="wvit-mock-banner">{reserve ? 'space reserved' : 'banner injects'}</div>
            <div className="wvit-mock-line wvit-mock-line-a" />
            <div className="wvit-mock-line wvit-mock-line-b" />
            <div className="wvit-mock-line wvit-mock-line-c" />
          </div>
          <div className="wvit-mock-note">
            {reserve
              ? 'space held, content stays put, 0 shift'
              : 'content below the banner jumps down'}
          </div>
        </div>

        <div className="wvit-readout">
          <div className="wvit-cls-rows">
            {rows.map((r, i) => (
              <div key={`r-${i}`} className={`wvit-cls-row ${i === worst && r.score > 0 ? 'is-worst' : ''}`}>
                <span className="wvit-cls-name">shift {i + 1}</span>
                <span className="wvit-cls-calc">{r.impact.toFixed(2)} × {r.distance.toFixed(2)}</span>
                <span className="wvit-cls-eq">=</span>
                <span className="wvit-cls-num">{r.score.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div className="wvit-score-row">
            <span className="wvit-score-num" style={{ color: RATING_META[rating].token }}>
              {total.toFixed(3)}
            </span>
            <RatingChip rating={rating} />
          </div>
          <ThresholdGauge
            value={total} good={0.1} poor={0.25} max={0.5} unit=""
            format={(v) => v.toFixed(2)}
          />
          <ThresholdLegend good="≤ 0.10" needs="0.10 – 0.25" poor="> 0.25" />
          <p className="wvit-fix">
            <Wrench size={13} />
            Reserve space before content loads — set <code>width</code>/<code>height</code> on images,
            <code> aspect-ratio</code> on media, <code>min-height</code> on injected slots.
          </p>
          <p className="wvit-narrate">
            CLS sums (impact × distance) over the worst 5-second window. A banner pushing 80% of the
            viewport down by 10% scores 0.8 × 0.1 = 0.08.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- INP explorer ----------------------------------------------------------
function InpExplorer({ uid, inp, setInpHop, yieldFix, setYieldFix, data, rating }) {
  const { segs, total } = data;
  const W = 360;
  const top = 30;
  const colX = 150;
  const colW = 150;
  const pxPerMs = 0.18;
  const minSeg = 16;
  const heights = segs.map((s) => Math.max(s.value * pxPerMs, minSeg));
  const bars = segs.map((s, i) => ({
    ...s,
    y: top + heights.slice(0, i).reduce((a, b) => a + b, 0),
    h: heights[i],
    hue: SEG_HUES[i],
  }));
  const H = top + heights.reduce((a, b) => a + b, 0) + 24;

  return (
    <div className="wvit-body">
      <div className="wvit-controls">
        <Slider
          label="Input delay" desc="event waits behind a busy main thread"
          value={inp.input} min={0} max={600} step={10} unit=" ms"
          onChange={(v) => setInpHop('input', v)}
        />
        <Slider
          label="Handler" desc="your event-handler JS runs"
          value={inp.handler} min={0} max={800} step={10} unit=" ms"
          onChange={(v) => setInpHop('handler', v)}
        />
        <Slider
          label="Render" desc="browser paints the next frame"
          value={inp.render} min={0} max={400} step={10} unit=" ms"
          onChange={(v) => setInpHop('render', v)}
        />
        <Toggle on={yieldFix} onChange={setYieldFix} label="yield / paint feedback first" />
      </div>

      <div className="wvit-visual">
        <div className="wvit-waterfall">
          <div className="wvit-wf-cap"><MoveVertical size={12} /> one interaction, top to bottom</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="wvit-wf-svg" preserveAspectRatio="xMidYMid meet">
            <defs><linearGradient id={`${uid}-inpgrad`} /></defs>
            <line className="wvit-wf-axis" x1={colX - 14} y1={top} x2={colX - 14} y2={H - 24} />
            {bars.map((b) => (
              <g key={b.key}>
                <rect
                  x={colX} y={b.y + 1} width={colW} height={b.h - 2} rx={4}
                  fill={b.hue} opacity={0.85} className="wvit-wf-bar"
                />
                <text className="wvit-wf-name" x={colX - 22} y={b.y + b.h / 2 + 4} textAnchor="end">
                  {b.label}
                </text>
                <text className="wvit-wf-ms" x={colX + colW / 2} y={b.y + b.h / 2 + 4} textAnchor="middle">
                  {b.value} ms
                </text>
              </g>
            ))}
            <text className="wvit-wf-total" x={colX + colW / 2} y={H - 8} textAnchor="middle">
              INP = {total} ms
            </text>
          </svg>
        </div>

        <div className="wvit-readout">
          <div className="wvit-score-row">
            <span className="wvit-score-num" style={{ color: RATING_META[rating].token }}>
              {total}<span className="wvit-score-unit">ms</span>
            </span>
            <RatingChip rating={rating} />
          </div>
          <ThresholdGauge
            value={total} good={200} poor={500} max={800} unit="ms"
            format={(v) => `${Math.round(v)}`}
          />
          <ThresholdLegend good="≤ 200ms" needs="200 – 500ms" poor="> 500ms" />
          <p className="wvit-fix">
            <Wrench size={13} />
            Keep tasks under 50ms, <code>await</code> a yield to let the browser paint, and render
            visible feedback before the heavy work runs.
          </p>
          <p className="wvit-narrate">
            INP is input delay + handler time + render time of the slowest interaction on the page.
            {yieldFix ? ' Yielding cuts the input delay and caps the handler so the frame paints fast.' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

function ThresholdLegend({ good, needs, poor }) {
  return (
    <div className="wvit-legend">
      <span className="wvit-legend-item is-good"><i /> good {good}</span>
      <span className="wvit-legend-item is-needs"><i /> needs {needs}</span>
      <span className="wvit-legend-item is-poor"><i /> poor {poor}</span>
    </div>
  );
}
