import React, { useId, useMemo, useState } from 'react';

// Reusable, dependency-free SVG chart primitives for the compete dashboard.
// Every chart scales via viewBox + width:100% + preserveAspectRatio so there
// is never an inner or horizontal scrollbar regardless of container width.
// Colors are theme tokens only; rendering is deterministic (no Math.random).

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
const fmtNum = (v) => (v == null ? '—' : v.toLocaleString());

// ---- StatCard: headline metric tile (mlviz-statcard equivalent) ----
export function StatCard({ icon: Icon, label, value, hue, big }) {
  return (
    <div className={`chk-stat${big ? ' chk-stat-big' : ''}`}>
      <span className="chk-stat-top">
        {Icon && <Icon size={big ? 16 : 14} className="chk-stat-icon" style={hue ? { color: hue } : undefined} />}
        <span className="chk-stat-label">{label}</span>
      </span>
      <span className="chk-stat-value" style={big && hue ? { color: hue } : undefined}>{value}</span>
    </div>
  );
}

// ---- Donut: proportional ring, single segment set, centre label ----
// segments: [{ key, label, value, hue }]. Centre shows `total` + `caption`.
export function Donut({ segments, total, caption, ariaLabel }) {
  const [hover, setHover] = useState(null);
  const uid = useId().replace(/[:]/g, '');
  const R = 39;
  const STROKE = 8;
  const GAP = 0.018; // fraction of circumference left blank between segments
  const C = 2 * Math.PI * R;
  const denom = segments.reduce((s, g) => s + (num(g.value) ?? 0), 0);
  const centre = total != null ? total.toLocaleString() : denom.toLocaleString();
  const active = hover != null ? segments[hover] : null;
  const live = segments.filter((s) => (num(s.value) ?? 0) > 0);
  const gapLen = live.length > 1 ? GAP * C : 0;

  let offset = 0;
  return (
    <div className="chk-donut">
      <svg viewBox="0 0 100 100" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaLabel} className="chk-donut-svg">
        <defs>
          {segments.map((s) => (
            <linearGradient key={s.key} id={`donutGrad-${uid}-${s.key}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={s.hue} stopOpacity="0.65" />
              <stop offset="100%" stopColor={s.hue} stopOpacity="1" />
            </linearGradient>
          ))}
          <filter id={`donutGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--viz-line)" strokeWidth={STROKE} strokeOpacity="0.5" />
        {denom > 0 && segments.map((s, i) => {
          const val = num(s.value) ?? 0;
          if (val <= 0) return null;
          const seg = (val / denom) * C;
          const dash = Math.max(0, seg - gapLen);
          const isHover = hover === i;
          const el = (
            <circle
              key={s.key}
              cx="50" cy="50" r={R} fill="none"
              stroke={`url(#donutGrad-${uid}-${s.key})`}
              strokeWidth={isHover ? STROKE + 2 : STROKE}
              strokeLinecap="round"
              strokeDasharray={`${dash.toFixed(2)} ${(C - dash).toFixed(2)}`}
              strokeDashoffset={`${(-offset).toFixed(2)}`}
              transform="rotate(-90 50 50)"
              className="chk-donut-seg"
              filter={isHover ? `url(#donutGlow-${uid})` : undefined}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          );
          offset += seg;
          return el;
        })}
        <text x="50" y="46" textAnchor="middle" className="chk-donut-total" style={active ? { fill: active.hue } : undefined}>
          {active ? (num(active.value) ?? 0).toLocaleString() : centre}
        </text>
        <text x="50" y="60" textAnchor="middle" className="chk-donut-sub">
          {active ? active.label : caption}
        </text>
      </svg>
      <div className="chk-donut-legend">
        {segments.map((s, i) => (
          <button
            type="button"
            key={s.key}
            className={`chk-donut-leg${hover === i ? ' active' : ''}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="chk-donut-dot" style={{ background: s.hue }} />
            <span className="chk-donut-leg-label">{s.label}</span>
            <strong>{(num(s.value) ?? 0).toLocaleString()}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- GaugeRing: single 0..max progress arc with centre value ----
export function GaugeRing({ value, max = 100, hue, suffix = '', caption, icon: Icon, goalLabel }) {
  const uid = useId().replace(/[:]/g, '');
  const R = 39;
  const STROKE = 7;
  const C = 2 * Math.PI * R;
  const frac = value == null ? 0 : Math.min(1, Math.max(0, value / max));
  const display = value == null ? '—' : `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
  return (
    <div className="chk-gauge">
      <svg viewBox="0 0 100 100" width="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="chk-gauge-svg">
        <defs>
          <linearGradient id={`gaugeGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={hue} stopOpacity="0.55" />
            <stop offset="100%" stopColor={hue} stopOpacity="1" />
          </linearGradient>
          <filter id={`gaugeGlow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--viz-line)" strokeWidth={STROKE} strokeOpacity="0.5" />
        <circle
          cx="50" cy="50" r={R} fill="none" stroke={`url(#gaugeGrad-${uid})`} strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${(frac * C).toFixed(1)} ${C.toFixed(1)}`}
          transform="rotate(-90 50 50)"
          className="chk-gauge-arc"
          filter={frac > 0 ? `url(#gaugeGlow-${uid})` : undefined}
        />
        <text x="50" y={goalLabel ? '47' : '54'} textAnchor="middle" className="chk-gauge-value">{display}</text>
        {goalLabel && <text x="50" y="63" textAnchor="middle" className="chk-gauge-goal">{goalLabel}</text>}
      </svg>
      {caption && (
        <span className="chk-gauge-caption">
          {Icon && <Icon size={13} style={{ color: hue }} />} {caption}
        </span>
      )}
    </div>
  );
}

// ---- HBarChart: horizontal bars, single or paired series, hover highlight ----
// rows: [{ key, label, a, b? , hueA?, hueB?, fmt? }]. `max` auto from data.
export function HBarChart({ rows, hueA = 'var(--accent)', hueB = 'var(--hue-pink)', paired = false, scaleMax }) {
  const [hover, setHover] = useState(null);
  const max = scaleMax ?? Math.max(1, ...rows.flatMap((r) => [num(r.a) ?? 0, num(r.b) ?? 0]));
  const pct = (v) => `${Math.round(((num(v) ?? 0) / max) * 100)}%`;
  const show = (r, v) => (r.fmt ? r.fmt(v) : fmtNum(v));
  return (
    <div className="chk-hbars">
      {rows.map((r, i) => (
        <div
          key={r.key || r.label}
          className={`chk-hbar-row${hover === i ? ' active' : ''}${paired ? ' paired' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="chk-hbar-label" style={r.labelHue ? { color: r.labelHue } : undefined} title={r.label}>
            {r.label}
          </span>
          <div className="chk-hbar-bars">
            <div className="chk-hbar-track">
              <div className="chk-hbar-fill" style={{ width: pct(r.a), background: r.hueA || hueA }} />
              <span className="chk-hbar-num">{show(r, r.a)}</span>
            </div>
            {paired && (
              <div className="chk-hbar-track">
                <div className="chk-hbar-fill" style={{ width: pct(r.b), background: r.hueB || hueB }} />
                <span className="chk-hbar-num">{show(r, r.b)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- LineChart: one or more rating/value series, shared scale, hover tooltip ----
const VB_W = 640;
const VB_H = 240;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 28;

// Catmull-Rom -> cubic Bezier smoothing for a soft, premium curve. Control-point
// Y is clamped to [yMin, yMax] (the plot band) so sharp reversals don't make the
// curve overshoot past the gridlines / axis scale — the line must stay aligned
// with the same inner rect the gridlines and y-scale use.
function smoothPath(pts, yMin = -Infinity, yMax = Infinity) {
  if (pts.length === 0) return '';
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ');
  const clampY = (v) => Math.max(yMin, Math.min(yMax, v));
  let d = `M ${pts[0].cx.toFixed(1)} ${pts[0].cy.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.cx + (p2.cx - p0.cx) / 6;
    const c1y = clampY(p1.cy + (p2.cy - p0.cy) / 6);
    const c2x = p2.cx - (p3.cx - p1.cx) / 6;
    const c2y = clampY(p2.cy - (p3.cy - p1.cy) / 6);
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.cx.toFixed(1)} ${p2.cy.toFixed(1)}`;
  }
  return d;
}

// series: [{ points: [{label, value, meta?}], color }]. tooltip uses series[0]
// when `interactive` (single-series); compare mode passes interactive=false.
export function LineChart({ series, area = false, interactive = true, peakLabel }) {
  const [hover, setHover] = useState(null);
  const uid = useId().replace(/[:]/g, '');

  const geo = useMemo(() => {
    const valid = series.map((s) => (s.points || []).filter((p) => typeof p.value === 'number'));
    const vals = valid.flat().map((p) => p.value);
    if (vals.length === 0) return null;
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    if (hi === lo) { hi += 50; lo -= 50; }
    const pad = (hi - lo) * 0.12;
    lo -= pad; hi += pad;
    const maxLen = Math.max(...valid.map((v) => v.length));
    const plotW = VB_W - PAD_L - PAD_R;
    const plotH = VB_H - PAD_T - PAD_B;
    const x = (i) => PAD_L + (maxLen <= 1 ? plotW / 2 : (i / (maxLen - 1)) * plotW);
    const y = (v) => PAD_T + plotH - ((v - lo) / (hi - lo)) * plotH;
    return {
      lo, hi,
      coords: valid.map((pts, si) => pts.map((p, i) => ({ ...p, cx: x(i), cy: y(p.value), color: series[si].color }))),
      gridY: [0, 0.25, 0.5, 0.75, 1].map((f) => ({ yy: PAD_T + plotH - f * plotH, val: Math.round(lo + f * (hi - lo)) })),
    };
  }, [series]);

  if (!geo) return null;

  const first = geo.coords[0] || [];
  const active = interactive && hover != null ? first[hover] : null;
  const peakIdx = first.length ? first.reduce((best, p, i) => (p.value > first[best].value ? i : best), 0) : -1;
  const peak = peakIdx >= 0 ? first[peakIdx] : null;

  const handleMove = (e) => {
    if (!interactive || first.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ux = ((e.clientX - rect.left) / rect.width) * VB_W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < first.length; i += 1) {
      const d = Math.abs(first[i].cx - ux);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setHover(best);
  };

  const TT_W = 144;
  const TT_H = active && active.meta?.delta != null ? 64 : 50;
  let ttX = active ? active.cx + 12 : 0;
  if (active && ttX + TT_W > VB_W - PAD_R) ttX = active.cx - 12 - TT_W;
  let ttY = active ? active.cy - TT_H - 8 : 0;
  if (ttY < PAD_T) ttY = PAD_T;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Rating progression chart"
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        {geo.coords.map((coords, si) => (
          <linearGradient key={si} id={`lineArea-${uid}-${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={coords[0]?.color || 'var(--accent)'} stopOpacity="0.30" />
            <stop offset="65%" stopColor={coords[0]?.color || 'var(--accent)'} stopOpacity="0.05" />
            <stop offset="100%" stopColor={coords[0]?.color || 'var(--accent)'} stopOpacity="0" />
          </linearGradient>
        ))}
        <filter id={`lineGlow-${uid}`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {geo.gridY.map((g, i) => (
        <g key={i}>
          <line x1={PAD_L} y1={g.yy} x2={VB_W - PAD_R} y2={g.yy} stroke="var(--viz-line)" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="2 5" />
          <text x={PAD_L - 8} y={g.yy + 3} textAnchor="end" className="chk-axis-label">{g.val}</text>
        </g>
      ))}

      {area && geo.coords.map((coords, si) => (
        coords.length > 1 ? (
          <path
            key={si}
            d={`${smoothPath(coords, PAD_T, VB_H - PAD_B)} L ${coords[coords.length - 1].cx.toFixed(1)} ${(VB_H - PAD_B).toFixed(1)} L ${coords[0].cx.toFixed(1)} ${(VB_H - PAD_B).toFixed(1)} Z`}
            fill={`url(#lineArea-${uid}-${si})`}
          />
        ) : null
      ))}

      {geo.coords.map((coords, si) => (
        <g key={si}>
          <path
            d={smoothPath(coords, PAD_T, VB_H - PAD_B)}
            fill="none"
            stroke={coords[0]?.color || 'var(--accent)'}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter={`url(#lineGlow-${uid})`}
          />
        </g>
      ))}

      {peakLabel && peak && (() => {
        const lbl = `peak ${Math.round(peak.value)}`;
        const halfW = (lbl.length * 6.2) / 2;
        let anchor = 'middle';
        let lx = peak.cx;
        if (peak.cx + halfW > VB_W - PAD_R) { anchor = 'end'; lx = VB_W - PAD_R; }
        else if (peak.cx - halfW < PAD_L) { anchor = 'start'; lx = PAD_L; }
        return (
          <g pointerEvents="none">
            <circle cx={peak.cx} cy={peak.cy} r="4.5" fill={peak.color} stroke="var(--surface)" strokeWidth="1.5" />
            <text x={lx} y={peak.cy - 9} textAnchor={anchor} className="chk-peak-label">{lbl}</text>
          </g>
        );
      })()}

      {active && (
        <line x1={active.cx} y1={PAD_T} x2={active.cx} y2={VB_H - PAD_B} stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.45" strokeDasharray="2 3" />
      )}

      {active && (
        <circle cx={active.cx} cy={active.cy} r="5" fill={active.color} stroke="var(--surface)" strokeWidth="2" />
      )}

      {active && (
        <g className="chk-tip" pointerEvents="none">
          <rect x={ttX} y={ttY} width={TT_W} height={TT_H} rx="8" fill="var(--surface)" stroke="var(--viz-line)" strokeWidth="1" />
          <text x={ttX + 10} y={ttY + 16} className="chk-tip-title">{active.label}</text>
          <text x={ttX + 10} y={ttY + 34} className="chk-tip-value">{Math.round(active.value)}</text>
          {active.meta?.rank != null && (
            <text x={ttX + 10} y={ttY + (active.meta.delta != null ? 50 : 47)} className="chk-tip-meta">
              rank #{active.meta.rank.toLocaleString()}
            </text>
          )}
          {active.meta?.delta != null && (
            <text x={ttX + TT_W - 10} y={ttY + 34} textAnchor="end" className="chk-tip-delta" fill={active.meta.delta >= 0 ? 'var(--easy)' : 'var(--hard)'}>
              {active.meta.delta >= 0 ? `+${active.meta.delta}` : active.meta.delta}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}

// ---- Legend: shared dot+label row for multi-series charts ----
export function Legend({ items }) {
  return (
    <div className="chk-legend">
      {items.map((it, i) => (
        <span key={i} className="chk-legend-item">
          <span className="chk-legend-dot" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
