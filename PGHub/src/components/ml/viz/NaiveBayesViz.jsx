import React, { useState, useMemo, useCallback, useRef } from 'react';
import { RotateCcw, MousePointer2 } from 'lucide-react';
import './MLViz.css';

// Layout: 480 wide, 380 tall. Main 2D plane sits to the right of the y-axis
// marginal strip and above the x-axis marginal strip.
const W = 480;
const H = 380;
const PAD_L = 28;          // left axis labels
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 24;          // bottom axis labels
const MARG_H = 56;         // height of marginal histogram strips
const PLOT_W = W - PAD_L - PAD_R - MARG_H;
const PLOT_H = H - PAD_T - PAD_B - MARG_H;
const PLOT_X0 = PAD_L + MARG_H;
const PLOT_Y0 = PAD_T;
const XMIN = -5;
const XMAX = 5;
const YMIN = -5;
const YMAX = 5;
const HIST_BINS = 18;
const BIN_W = (XMAX - XMIN) / HIST_BINS;

const POINTS_PER_CLASS = 40;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function dataToScreen(x, y) {
  const sx = PLOT_X0 + ((x - XMIN) / (XMAX - XMIN)) * PLOT_W;
  const sy = PLOT_Y0 + (1 - (y - YMIN) / (YMAX - YMIN)) * PLOT_H;
  return { sx, sy };
}

function screenToData(sx, sy) {
  const x = XMIN + ((sx - PLOT_X0) / PLOT_W) * (XMAX - XMIN);
  const y = YMIN + (1 - (sy - PLOT_Y0) / PLOT_H) * (YMAX - YMIN);
  return { x, y };
}

// Seeded mulberry32 PRNG so dataset is stable across renders.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGauss(rand) {
  return function gauss(mu, sigma) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mu + sigma * z;
  };
}

// Class 0 (red) lives at a fixed mean; class 1 (blue) mean is slider-controlled.
const CLASS0 = { mu: { x: -1.6, y: -1.2 }, sigma: { x: 1.0, y: 1.0 } };
const CLASS1_BASE = { mu: { x: 1.6, y: 1.2 }, sigma: { x: 1.0, y: 1.0 } };

function buildDataset(shift) {
  const rand0 = mulberry32(0xa1b2c3d4);
  const rand1 = mulberry32(0xdeadbeef);
  const g0 = makeGauss(rand0);
  const g1 = makeGauss(rand1);
  const pts = [];
  for (let i = 0; i < POINTS_PER_CLASS; i++) {
    pts.push({
      x: clamp(g0(CLASS0.mu.x, CLASS0.sigma.x), XMIN + 0.05, XMAX - 0.05),
      y: clamp(g0(CLASS0.mu.y, CLASS0.sigma.y), YMIN + 0.05, YMAX - 0.05),
      label: 0,
    });
  }
  for (let i = 0; i < POINTS_PER_CLASS; i++) {
    pts.push({
      x: clamp(g1(CLASS1_BASE.mu.x + shift, CLASS1_BASE.sigma.x), XMIN + 0.05, XMAX - 0.05),
      y: clamp(g1(CLASS1_BASE.mu.y + shift * 0.6, CLASS1_BASE.sigma.y), YMIN + 0.05, YMAX - 0.05),
      label: 1,
    });
  }
  return pts;
}

// Fit per-feature gaussian (mean / std) for each class — that's exactly what
// gaussian naive bayes does: each feature's class-conditional is N(mu, sigma).
function fitGaussianNB(pts) {
  const groups = [pts.filter((p) => p.label === 0), pts.filter((p) => p.label === 1)];
  const params = groups.map((g) => {
    const n = g.length;
    const meanX = g.reduce((a, p) => a + p.x, 0) / n;
    const meanY = g.reduce((a, p) => a + p.y, 0) / n;
    const varX = g.reduce((a, p) => a + (p.x - meanX) ** 2, 0) / n;
    const varY = g.reduce((a, p) => a + (p.y - meanY) ** 2, 0) / n;
    return {
      n,
      mu: { x: meanX, y: meanY },
      sigma: { x: Math.sqrt(varX + 1e-3), y: Math.sqrt(varY + 1e-3) },
    };
  });
  const total = params[0].n + params[1].n;
  const prior = [params[0].n / total, params[1].n / total];
  return { params, prior };
}

function gpdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// Independence assumption: P(x,y | c) = P(x | c) * P(y | c).
function classCondLikelihood(x, y, p) {
  return gpdf(x, p.mu.x, p.sigma.x) * gpdf(y, p.mu.y, p.sigma.y);
}

function posterior(x, y, model) {
  const l0 = classCondLikelihood(x, y, model.params[0]) * model.prior[0];
  const l1 = classCondLikelihood(x, y, model.params[1]) * model.prior[1];
  const denom = l0 + l1 + 1e-30;
  return { p0: l0 / denom, p1: l1 / denom, l0, l1 };
}

// Marching squares to render a smooth iso-contour where P(red) = 0.5.
// We discretise the plane to a grid of f(x,y) = log(P(c1|x,y) / P(c0|x,y))
// and connect zero-crossings of f on each grid cell edge.
function buildBoundarySegments(model, res = 80) {
  const dx = (XMAX - XMIN) / res;
  const dy = (YMAX - YMIN) / res;
  const f = (x, y) => {
    const post = posterior(x, y, model);
    return Math.log((post.l1 + 1e-30) / (post.l0 + 1e-30));
  };
  // Sample f on grid corners once.
  const grid = new Array((res + 1) * (res + 1));
  for (let j = 0; j <= res; j++) {
    for (let i = 0; i <= res; i++) {
      const x = XMIN + i * dx;
      const y = YMIN + j * dy;
      grid[j * (res + 1) + i] = f(x, y);
    }
  }
  const get = (i, j) => grid[j * (res + 1) + i];
  const segments = [];
  // For each cell, look at the 4 edges and emit crossings between any pair.
  // (Standard marching squares — we connect them via two crossings per cell
  // for the simple non-saddle cases.)
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const v00 = get(i, j);
      const v10 = get(i + 1, j);
      const v11 = get(i + 1, j + 1);
      const v01 = get(i, j + 1);
      const x0 = XMIN + i * dx;
      const x1 = XMIN + (i + 1) * dx;
      const y0 = YMIN + j * dy;
      const y1 = YMIN + (j + 1) * dy;
      const cross = [];
      // bottom edge (v00 -> v10)
      if ((v00 > 0) !== (v10 > 0)) {
        const t = v00 / (v00 - v10);
        cross.push({ x: x0 + t * dx, y: y0 });
      }
      // right edge (v10 -> v11)
      if ((v10 > 0) !== (v11 > 0)) {
        const t = v10 / (v10 - v11);
        cross.push({ x: x1, y: y0 + t * dy });
      }
      // top edge (v01 -> v11)
      if ((v01 > 0) !== (v11 > 0)) {
        const t = v01 / (v01 - v11);
        cross.push({ x: x0 + t * dx, y: y1 });
      }
      // left edge (v00 -> v01)
      if ((v00 > 0) !== (v01 > 0)) {
        const t = v00 / (v00 - v01);
        cross.push({ x: x0, y: y0 + t * dy });
      }
      if (cross.length === 2) {
        segments.push([cross[0], cross[1]]);
      } else if (cross.length === 4) {
        // Saddle — pair them so the two short segments don't cross the cell.
        segments.push([cross[0], cross[1]]);
        segments.push([cross[2], cross[3]]);
      }
    }
  }
  return segments;
}

// Chain segments end-to-end into polylines so we can draw a smooth path.
function chainSegments(segs, eps = 1e-3) {
  const used = new Array(segs.length).fill(false);
  const polylines = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const line = [segs[i][0], segs[i][1]];
    // Extend forward.
    let extended = true;
    while (extended) {
      extended = false;
      const tail = line[line.length - 1];
      for (let j = 0; j < segs.length; j++) {
        if (used[j]) continue;
        const a = segs[j][0];
        const b = segs[j][1];
        if (Math.abs(a.x - tail.x) < eps && Math.abs(a.y - tail.y) < eps) {
          line.push(b);
          used[j] = true;
          extended = true;
          break;
        }
        if (Math.abs(b.x - tail.x) < eps && Math.abs(b.y - tail.y) < eps) {
          line.push(a);
          used[j] = true;
          extended = true;
          break;
        }
      }
    }
    // Extend backward.
    extended = true;
    while (extended) {
      extended = false;
      const head = line[0];
      for (let j = 0; j < segs.length; j++) {
        if (used[j]) continue;
        const a = segs[j][0];
        const b = segs[j][1];
        if (Math.abs(a.x - head.x) < eps && Math.abs(a.y - head.y) < eps) {
          line.unshift(b);
          used[j] = true;
          extended = true;
          break;
        }
        if (Math.abs(b.x - head.x) < eps && Math.abs(b.y - head.y) < eps) {
          line.unshift(a);
          used[j] = true;
          extended = true;
          break;
        }
      }
    }
    polylines.push(line);
  }
  return polylines;
}

function polylineToPath(line) {
  if (!line.length) return '';
  return line
    .map((p, i) => {
      const { sx, sy } = dataToScreen(p.x, p.y);
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
    })
    .join(' ');
}

// Histogram bins (counts) for an axis ('x' or 'y') split by class.
function buildHistograms(pts, axis) {
  const bins0 = new Array(HIST_BINS).fill(0);
  const bins1 = new Array(HIST_BINS).fill(0);
  for (const p of pts) {
    const v = p[axis];
    let idx = Math.floor((v - XMIN) / BIN_W);
    if (idx < 0) idx = 0;
    if (idx >= HIST_BINS) idx = HIST_BINS - 1;
    if (p.label === 0) bins0[idx] += 1;
    else bins1[idx] += 1;
  }
  return { bins0, bins1 };
}

const COLOR_R = 'var(--hue-pink, #ff66cc)';
const COLOR_B = 'var(--hue-sky, #5ecbff)';

export default function NaiveBayesViz() {
  const svgRef = useRef(null);
  const [shift, setShift] = useState(0);
  const [query, setQuery] = useState(null); // {x, y}

  const points = useMemo(() => buildDataset(shift), [shift]);
  const model = useMemo(() => fitGaussianNB(points), [points]);

  const segs = useMemo(() => buildBoundarySegments(model, 70), [model]);
  const polylines = useMemo(() => chainSegments(segs), [segs]);

  const histX = useMemo(() => buildHistograms(points, 'x'), [points]);
  const histY = useMemo(() => buildHistograms(points, 'y'), [points]);

  // Smooth curves for the gaussian fits on each marginal strip.
  const margCurves = useMemo(() => {
    const N = 120;
    function curve(axis, classIdx) {
      const p = model.params[classIdx];
      const mu = p.mu[axis];
      const sigma = p.sigma[axis];
      const pts = [];
      // Marginal area = sum of bin counts * pdf -> scale to strip height.
      const maxPdf = gpdf(mu, mu, sigma);
      for (let i = 0; i <= N; i++) {
        const v = XMIN + (i / N) * (XMAX - XMIN);
        const y = gpdf(v, mu, sigma) / maxPdf; // 0..1
        pts.push({ v, y });
      }
      return pts;
    }
    return {
      x0: curve('x', 0),
      x1: curve('x', 1),
      y0: curve('y', 0),
      y1: curve('y', 1),
    };
  }, [model]);

  const handleClick = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    if (
      px < PLOT_X0 || px > PLOT_X0 + PLOT_W ||
      py < PLOT_Y0 || py > PLOT_Y0 + PLOT_H
    ) return;
    const { x, y } = screenToData(px, py);
    setQuery({ x, y });
  }, []);

  const handleReset = useCallback(() => {
    setQuery(null);
    setShift(0);
  }, []);

  const queryPost = useMemo(() => {
    if (!query) return null;
    return posterior(query.x, query.y, model);
  }, [query, model]);

  // Histogram bar drawing helpers.
  const maxBinCount = useMemo(() => {
    let m = 1;
    for (const arr of [histX.bins0, histX.bins1, histY.bins0, histY.bins1]) {
      for (const v of arr) if (v > m) m = v;
    }
    return m;
  }, [histX, histY]);

  const xStripY0 = PLOT_Y0 + PLOT_H;
  const xStripH = MARG_H;
  const yStripX0 = PAD_L;
  const yStripW = MARG_H;

  function xBarsFor(bins, color, opacity) {
    const out = [];
    const w = PLOT_W / HIST_BINS;
    for (let i = 0; i < HIST_BINS; i++) {
      const h = (bins[i] / maxBinCount) * (xStripH - 6);
      if (h < 0.3) continue;
      out.push(
        <rect
          key={`xb-${color}-${i}`}
          x={PLOT_X0 + i * w + 0.6}
          y={xStripY0 + 2}
          width={w - 1.2}
          height={h}
          fill={color}
          opacity={opacity}
          rx="1"
        />
      );
    }
    return out;
  }

  function yBarsFor(bins, color, opacity) {
    const out = [];
    const h = PLOT_H / HIST_BINS;
    for (let i = 0; i < HIST_BINS; i++) {
      const w = (bins[i] / maxBinCount) * (yStripW - 6);
      if (w < 0.3) continue;
      // Bin i covers data range [XMIN + i*BIN_W .. +BIN_W]; y axis is flipped.
      const yScreen = PLOT_Y0 + PLOT_H - (i + 1) * h;
      out.push(
        <rect
          key={`yb-${color}-${i}`}
          x={yStripX0 + yStripW - 2 - w}
          y={yScreen + 0.6}
          width={w}
          height={h - 1.2}
          fill={color}
          opacity={opacity}
          rx="1"
        />
      );
    }
    return out;
  }

  // Smooth marginal curves on each strip.
  function xCurvePath(curve) {
    const N = curve.length;
    return curve
      .map((p, i) => {
        const sx = PLOT_X0 + ((p.v - XMIN) / (XMAX - XMIN)) * PLOT_W;
        const sy = xStripY0 + xStripH - 4 - p.y * (xStripH - 8);
        return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
      })
      .join(' ');
  }

  function yCurvePath(curve) {
    return curve
      .map((p, i) => {
        const sy = PLOT_Y0 + (1 - (p.v - YMIN) / (YMAX - YMIN)) * PLOT_H;
        const sx = yStripX0 + 4 + p.y * (yStripW - 8);
        return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
      })
      .join(' ');
  }

  // Plot gridlines.
  const gridLines = [];
  for (let i = -4; i <= 4; i += 2) {
    const { sx } = dataToScreen(i, 0);
    const { sy } = dataToScreen(0, i);
    gridLines.push(
      <line key={`gx${i}`} x1={sx} y1={PLOT_Y0} x2={sx} y2={PLOT_Y0 + PLOT_H} stroke="var(--border)" strokeWidth="0.5" />
    );
    gridLines.push(
      <line key={`gy${i}`} x1={PLOT_X0} y1={sy} x2={PLOT_X0 + PLOT_W} y2={sy} stroke="var(--border)" strokeWidth="0.5" />
    );
  }

  const queryScreen = query ? dataToScreen(query.x, query.y) : null;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: '820px', cursor: 'crosshair' }}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="nbayes-boundary-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="nbayes-boundary-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <filter id="nbayes-query-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {/* Plot frame */}
          <rect
            x={PLOT_X0}
            y={PLOT_Y0}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
          />
          {gridLines}

          {/* Decision boundary polylines — glow underlay + gradient stroke */}
          {polylines.map((line, i) => (
            <path
              key={`bd-glow${i}`}
              d={polylineToPath(line)}
              fill="none"
              stroke="url(#nbayes-boundary-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#nbayes-boundary-glow)"
              opacity="0.5"
            />
          ))}
          {polylines.map((line, i) => (
            <path
              key={`bd${i}`}
              d={polylineToPath(line)}
              fill="none"
              stroke="url(#nbayes-boundary-grad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
          ))}

          {/* Class means as crosshairs */}
          {[0, 1].map((c) => {
            const { sx, sy } = dataToScreen(model.params[c].mu.x, model.params[c].mu.y);
            const color = c === 0 ? COLOR_R : COLOR_B;
            return (
              <g key={`mean${c}`} opacity="0.85">
                <line x1={sx - 6} y1={sy} x2={sx + 6} y2={sy} stroke={color} strokeWidth="1.6" />
                <line x1={sx} y1={sy - 6} x2={sx} y2={sy + 6} stroke={color} strokeWidth="1.6" />
                <circle cx={sx} cy={sy} r="1.6" fill={color} />
              </g>
            );
          })}

          {/* Data points */}
          {points.map((p, i) => {
            const { sx, sy } = dataToScreen(p.x, p.y);
            return (
              <circle
                key={`pt${i}`}
                cx={sx}
                cy={sy}
                r="3"
                fill={p.label === 0 ? COLOR_R : COLOR_B}
                stroke="var(--bg)"
                strokeWidth="0.8"
                opacity="0.9"
              />
            );
          })}

          {/* X-axis marginal strip */}
          <rect
            x={PLOT_X0}
            y={xStripY0}
            width={PLOT_W}
            height={xStripH}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="0.6"
            opacity="0.6"
          />
          {xBarsFor(histX.bins0, COLOR_R, 0.35)}
          {xBarsFor(histX.bins1, COLOR_B, 0.35)}
          <path d={xCurvePath(margCurves.x0)} fill="none" stroke={COLOR_R} strokeWidth="1.6" opacity="0.95" />
          <path d={xCurvePath(margCurves.x1)} fill="none" stroke={COLOR_B} strokeWidth="1.6" opacity="0.95" />

          {/* Y-axis marginal strip */}
          <rect
            x={yStripX0}
            y={PLOT_Y0}
            width={yStripW}
            height={PLOT_H}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="0.6"
            opacity="0.6"
          />
          {yBarsFor(histY.bins0, COLOR_R, 0.35)}
          {yBarsFor(histY.bins1, COLOR_B, 0.35)}
          <path d={yCurvePath(margCurves.y0)} fill="none" stroke={COLOR_R} strokeWidth="1.6" opacity="0.95" />
          <path d={yCurvePath(margCurves.y1)} fill="none" stroke={COLOR_B} strokeWidth="1.6" opacity="0.95" />

          {/* Strip labels */}
          <text
            x={PLOT_X0 + PLOT_W / 2}
            y={xStripY0 + xStripH + 16}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.15em"
          >P(x | class)</text>
          <g transform={`translate(${yStripX0 - 4}, ${PLOT_Y0 + PLOT_H / 2}) rotate(-90)`}>
            <text
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.15em"
            >P(y | class)</text>
          </g>

          {/* Axis tick labels along plot bottom and left */}
          {[-4, -2, 0, 2, 4].map((t) => {
            const { sx } = dataToScreen(t, 0);
            const { sy } = dataToScreen(0, t);
            return (
              <g key={`tk${t}`}>
                <text
                  x={sx}
                  y={PLOT_Y0 + PLOT_H + 11}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >{t}</text>
                <text
                  x={PLOT_X0 - 4}
                  y={sy + 3}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >{t}</text>
              </g>
            );
          })}

          {/* Query marker + projection lines onto both strips */}
          {queryScreen && (
            <g pointerEvents="none">
              <line
                x1={queryScreen.sx}
                y1={queryScreen.sy}
                x2={queryScreen.sx}
                y2={xStripY0 + xStripH}
                stroke="var(--accent)"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <line
                x1={queryScreen.sx}
                y1={queryScreen.sy}
                x2={yStripX0}
                y2={queryScreen.sy}
                stroke="var(--accent)"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <circle
                cx={queryScreen.sx}
                cy={queryScreen.sy}
                r="10"
                fill="var(--accent)"
                opacity="0.22"
                filter="url(#nbayes-query-glow)"
              />
              <circle
                cx={queryScreen.sx}
                cy={queryScreen.sy}
                r="6"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.8"
              />
              <circle
                cx={queryScreen.sx}
                cy={queryScreen.sy}
                r="2.4"
                fill="var(--accent)"
              />
              {/* Tick on x-strip */}
              <line
                x1={queryScreen.sx}
                y1={xStripY0}
                x2={queryScreen.sx}
                y2={xStripY0 + xStripH}
                stroke="var(--accent)"
                strokeWidth="1.2"
                opacity="0.55"
              />
              {/* Tick on y-strip */}
              <line
                x1={yStripX0}
                y1={queryScreen.sy}
                x2={yStripX0 + yStripW}
                y2={queryScreen.sy}
                stroke="var(--accent)"
                strokeWidth="1.2"
                opacity="0.55"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>NB</span>
          <span className="mlviz-sub" style={{ color: COLOR_R }}>
            class 0 ({snap(model.params[0].mu.x)}, {snap(model.params[0].mu.y)})
          </span>
          <span className="mlviz-sub" style={{ color: COLOR_B }}>
            class 1 ({snap(model.params[1].mu.x)}, {snap(model.params[1].mu.y)})
          </span>
          <span className="mlviz-sub">prior {snap(model.prior[0])} / {snap(model.prior[1])}</span>
        </div>

        {queryPost ? (
          <div className="mlviz-row-hi mlviz-statcol mlviz-statrow nb-cards">
            <div className="mlviz-statcard mlviz-statcard-dim">
              <span className="mlviz-statcard-label">query (x, y)</span>
              <span className="mlviz-statcard-val" style={{ fontSize: '0.9rem' }}>
                ({snap(query.x)}, {snap(query.y)})
              </span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-pink">
              <span className="mlviz-statcard-label">P(red)</span>
              <span className="mlviz-statcard-val">{snap(queryPost.p0, 3)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">P(blue)</span>
              <span className="mlviz-statcard-val">{snap(queryPost.p1, 3)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-accent">
              <span className="mlviz-statcard-label">pick</span>
              <span className="mlviz-statcard-val" style={{ fontSize: '0.92rem' }}>
                {queryPost.p0 > queryPost.p1 ? 'red' : 'blue'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mlviz-row mlviz-row-hi">
            <MousePointer2 size={11} style={{ color: 'var(--text-dim)' }} />
            <span className="mlviz-sub">click the plane to query a point</span>
          </div>
        )}

        {queryPost && (
          <div className="mlviz-row" style={{ fontSize: '0.7rem' }}>
            <span className="mlviz-sub" style={{ color: COLOR_R }}>
              red: P(x|c)={snap(gpdf(query.x, model.params[0].mu.x, model.params[0].sigma.x), 3)}
              {' '}P(y|c)={snap(gpdf(query.y, model.params[0].mu.y, model.params[0].sigma.y), 3)}
            </span>
          </div>
        )}
        {queryPost && (
          <div className="mlviz-row" style={{ fontSize: '0.7rem' }}>
            <span className="mlviz-sub" style={{ color: COLOR_B }}>
              blue: P(x|c)={snap(gpdf(query.x, model.params[1].mu.x, model.params[1].sigma.x), 3)}
              {' '}P(y|c)={snap(gpdf(query.y, model.params[1].mu.y, model.params[1].sigma.y), 3)}
            </span>
          </div>
        )}

        <div className="mlviz-row mlviz-controls mlviz-row-hi">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">shift class 1</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.05"
              value={shift}
              onChange={(e) => setShift(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(shift)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          assumes P(x, y | c) = P(x | c) x P(y | c) - boundary is where posteriors tie
        </div>
      </div>
    </div>
  );
}
