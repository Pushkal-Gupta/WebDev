import React from 'react';
import './ForgeHubThumbs.css';

// Animated, theme-tokened SVG previews for the PGForge hub pillar cards.
// One distinct, on-topic, auto-looping motif per surface — mirrors the PGLearn
// hub thumbs (a tree that builds itself, a roadmap marker that travels a path).
// Colours are theme hues only; every class + svg id is `fht-`/component-prefixed
// so two thumbs on one page never collide. Reduced motion rests each on a
// representative static frame (see ForgeHubThumbs.css).

const VIEWBOX = '0 0 200 88';

function Thumb({ hue, label, children }) {
  return (
    <svg
      className="fht-thumb"
      viewBox={VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      style={{ '--fht-hue': hue }}
    >
      <rect className="fht-bg" x="0" y="0" width="200" height="88" />
      {children}
      <rect className="fht-stripe" x="0" y="0" width="200" height="3" />
    </svg>
  );
}

/* ===== Foundations — a coordinate frame that rotates around the origin ===== */
export function FoundationsThumb() {
  const ox = 42;
  const oy = 60;
  return (
    <Thumb hue="var(--hue-violet)" label="A rotating vector frame on coordinate axes">
      <defs>
        <marker id="fht-found-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0 0 L7 3.5 L0 7 Z" fill="var(--fht-hue)" />
        </marker>
        <marker id="fht-found-arr2" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0 0 L7 3.5 L0 7 Z" fill="color-mix(in srgb, var(--fht-hue) 60%, var(--surface))" />
        </marker>
      </defs>
      {[78, 108, 138, 168].map((x) => (
        <line key={`v${x}`} x1={x} y1="12" x2={x} y2={oy} className="fht-grid" />
      ))}
      {[16, 32, 48].map((y) => (
        <line key={`h${y}`} x1={ox} y1={y} x2="184" y2={y} className="fht-grid" />
      ))}
      <line x1={ox} y1={oy} x2="186" y2={oy} className="fht-axis" />
      <line x1={ox} y1={oy} x2={ox} y2="10" className="fht-axis" />
      <circle cx={ox} cy={oy} r="36" className="fht-found-orbit" />
      <g className="fht-found-frame" style={{ transformOrigin: `${ox}px ${oy}px` }}>
        <line x1={ox} y1={oy} x2={ox + 46} y2={oy} className="fht-found-vec1" markerEnd="url(#fht-found-arr)" />
        <line x1={ox} y1={oy} x2={ox} y2={oy - 30} className="fht-found-vec2" markerEnd="url(#fht-found-arr2)" />
      </g>
      <circle cx={ox} cy={oy} r="3.4" className="fht-accent-dot" />
    </Thumb>
  );
}

/* ===== Lessons — a small net with signals flowing layer to layer ===== */
export function LessonsThumb() {
  const cols = [40, 100, 160];
  const ys = [[30, 58], [20, 44, 68], [32, 56]];
  const routes = [
    `M${cols[0]} 30 L${cols[1]} 44 L${cols[2]} 32`,
    `M${cols[0]} 58 L${cols[1]} 68 L${cols[2]} 56`,
    `M${cols[0]} 30 L${cols[1]} 20 L${cols[2]} 56`,
  ];
  return (
    <Thumb hue="var(--hue-sky)" label="A neural network with signals flowing through its layers">
      {ys[0].map((y, i) => ys[1].map((y2, j) => (
        <line key={`e0${i}${j}`} x1={cols[0]} y1={y} x2={cols[1]} y2={y2} className="fht-edge" />
      )))}
      {ys[1].map((y, i) => ys[2].map((y2, j) => (
        <line key={`e1${i}${j}`} x1={cols[1]} y1={y} x2={cols[2]} y2={y2} className="fht-edge" />
      )))}
      {ys.map((layer, li) => layer.map((y, i) => (
        <circle key={`n${li}${i}`} cx={cols[li]} cy={y} r="5.5" className={li === 1 ? 'fht-node-done' : 'fht-node-soft'} />
      )))}
      {routes.map((d, i) => (
        <circle key={`s${i}`} r="3.6" className="fht-net-signal fht-motion">
          <animateMotion dur="2.8s" begin={`${-i * 0.9}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1" />
        </circle>
      ))}
    </Thumb>
  );
}

/* ===== Projects — blocks assemble into a structure, a build bar fills ===== */
export function ProjectsThumb() {
  const blocks = [
    [54, 56], [88, 56], [122, 56],
    [71, 42], [105, 42],
    [88, 28],
  ];
  return (
    <Thumb hue="var(--hue-mint)" label="Blocks assembling into a structure as a build bar fills">
      {blocks.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="30" height="12" rx="3" className={`fht-block fht-block-${i}`} style={{ transformOrigin: `${x + 15}px ${y + 6}px` }} />
      ))}
      <rect x="40" y="74" width="120" height="7" rx="3.5" className="fht-buildtrack" />
      <rect x="40" y="74" width="120" height="7" rx="3.5" className="fht-buildfill" />
    </Thumb>
  );
}

/* ===== Problems — test bars rise as they pass, a check stamps in ===== */
export function ProblemsThumb() {
  const bars = [70, 90, 110, 130, 150];
  const heights = [26, 40, 22, 48, 34];
  return (
    <Thumb hue="var(--accent)" label="Runnable tests passing one by one as bars rise">
      <path d="M40 22 L28 44 L40 66" className="fht-bracket" />
      <path d="M52 22 L64 44 L52 66" className="fht-bracket" />
      <line x1="66" y1="70" x2="162" y2="70" className="fht-axis" />
      {bars.map((x, i) => (
        <rect key={i} x={x} y={70 - heights[i]} width="12" height={heights[i]} rx="2.5"
          className={`fht-testbar fht-testbar-${i}`} style={{ transformOrigin: `${x + 6}px 70px` }} />
      ))}
      <g className="fht-pass-badge">
        <circle cx="160" cy="22" r="9" className="fht-pass-circle" />
        <path d="M155.5 22 L159 25.5 L165 18.5" className="fht-pass-check" />
      </g>
    </Thumb>
  );
}

/* ===== Papers — a document whose lines write on, a highlight sweeps ===== */
export function PapersThumb() {
  const lines = [22, 32, 42, 52, 62];
  const widths = [44, 60, 52, 64, 38];
  return (
    <Thumb hue="var(--hue-pink)" label="A paper with lines writing on and a highlight sweeping down">
      <rect x="66" y="12" width="68" height="66" rx="5" className="fht-page" />
      <rect className="fht-highlight" x="72" y="18" width="56" height="9" rx="2" />
      {lines.map((y, i) => (
        <line key={i} x1="76" y1={y} x2={76 + widths[i]} y2={y}
          className={`fht-paperline fht-paperline-${i}`} pathLength="100" />
      ))}
    </Thumb>
  );
}

/* ===== CUDA — a thread grid lighting up in a diagonal warp sweep ===== */
export function CudaThumb() {
  const cols = 8;
  const rows = 4;
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      cells.push({ r, c, d: r + c });
    }
  }
  return (
    <Thumb hue="var(--warning)" label="A grid of GPU threads lighting up in a diagonal warp sweep">
      {cells.map(({ r, c, d }) => (
        <rect key={`${r}-${c}`} x={24 + c * 19} y={14 + r * 16} width="15" height="12" rx="2.5"
          className={`fht-thread fht-thread-w${d}`} />
      ))}
    </Thumb>
  );
}

/* ===== Roadmaps — a winding path with a marker travelling along it ===== */
export function RoadmapsThumb() {
  const path = 'M22 66 C 52 66, 54 26, 84 26 C 114 26, 116 64, 146 60 C 170 56.5, 178 30, 186 24';
  const nodes = [[22, 66], [84, 26], [146, 60], [186, 24]];
  return (
    <Thumb hue="var(--hue-sky)" label="A roadmap path with a progress marker travelling along it">
      <path d={path} className="fht-road-track" />
      <path d={path} className="fht-road-fill" pathLength="100" />
      {nodes.map(([cx, cy], i) => (
        <g key={i} className={`fht-road-node fht-road-node-${i}`} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r="6.5" className="fht-node-soft" />
          <circle cx={cx} cy={cy} r="3" className="fht-road-dot" />
        </g>
      ))}
      <circle r="5" className="fht-road-marker fht-motion">
        <animateMotion dur="5s" repeatCount="indefinite" rotate="auto"
          keyPoints="0;0.33;0.66;1;1" keyTimes="0;0.33;0.66;0.9;1" calcMode="spline"
          keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0 0 1 1" path={path} />
      </circle>
    </Thumb>
  );
}

/* ===== Study Plans — a checklist filling in row by row ===== */
export function StudyPlansThumb() {
  const rows = [18, 36, 54, 72];
  const widths = [86, 64, 100, 74];
  return (
    <Thumb hue="var(--hue-mint)" label="A study-plan checklist filling in row by row">
      {rows.map((y, i) => (
        <g key={i} className={`fht-plan-row fht-plan-row-${i}`}>
          <rect x="42" y={y} width="14" height="14" rx="3.5" className="fht-plan-box" />
          <path d={`M45.5 ${y + 7} L49 ${y + 10.5} L53.5 ${y + 3.5}`} className="fht-plan-check" />
          <rect x="64" y={y + 4} width={widths[i]} height="6" rx="3" className="fht-plan-line" />
        </g>
      ))}
    </Thumb>
  );
}

/* ===== Progress — a ring fills, a streak heatmap pulses ===== */
export function ProgressThumb() {
  const cx = 50;
  const cy = 46;
  const r = 24;
  const heat = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      heat.push({ row, col, d: (row * 6 + col) % 7 });
    }
  }
  return (
    <Thumb hue="var(--hue-violet)" label="A progress ring filling beside a pulsing streak heatmap">
      <circle cx={cx} cy={cy} r={r} className="fht-ring-track" />
      <circle cx={cx} cy={cy} r={r} className="fht-ring-fill" pathLength="100"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r="6" className="fht-accent-dot" />
      {heat.map(({ row, col, d }) => (
        <rect key={`${row}-${col}`} x={92 + col * 16} y={20 + row * 13} width="12" height="9" rx="2"
          className={`fht-heat fht-heat-${d}`} />
      ))}
    </Thumb>
  );
}

/* ===== Sheets — rows of a reference sheet sliding in ===== */
export function SheetsThumb() {
  const rows = [34, 50, 66];
  const cols = [40, 86, 132];
  const widths = [40, 40, 44];
  return (
    <Thumb hue="var(--hue-pink)" label="Rows of a reference sheet sliding into place">
      <rect x="40" y="16" width="136" height="11" rx="3" className="fht-sheet-head" />
      {rows.map((y, i) => (
        <g key={i} className={`fht-sheet-row fht-sheet-row-${i}`}>
          {cols.map((x, c) => (
            <rect key={c} x={x} y={y} width={widths[c]} height="9" rx="2.5"
              className={c === 0 ? 'fht-sheet-cell-strong' : 'fht-sheet-cell'} />
          ))}
        </g>
      ))}
    </Thumb>
  );
}

const THUMB_BY_ROUTE = {
  '/ml/math': FoundationsThumb,
  '/ml/learn': LessonsThumb,
  '/ml/projects': ProjectsThumb,
  '/ml/problems': ProblemsThumb,
  '/ml/papers': PapersThumb,
  '/ml/cuda': CudaThumb,
  '/ml/roadmaps': RoadmapsThumb,
  '/ml/study-plans': StudyPlansThumb,
  '/ml/progress': ProgressThumb,
  '/ml/sheets': SheetsThumb,
};

export default function ForgeHubThumb({ to }) {
  const Cmp = THUMB_BY_ROUTE[to] || FoundationsThumb;
  return <Cmp />;
}
