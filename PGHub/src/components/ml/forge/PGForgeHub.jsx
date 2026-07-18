import React, { useMemo, useState, useEffect, useRef, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  Sigma, ListChecks, FileText, Cpu, FolderGit2, Map, Route,
  ArrowRight, ArrowLeft, ArrowUpRight, Code2, BookOpen, Trophy, Table2,
  Play, Pause, RotateCcw, Gauge,
} from 'lucide-react';
import { PILLARS } from '../../../content/mlContent';
import { MATH_MODULES } from './pgForgeMathData';
import { PG_FORGE_PROBLEMS } from './pgForgeProblemsData';
import { PAPERS } from './pgForgePapersData';
import {
  PapersThumb, FoundationsThumb, LessonsThumb, ProjectsThumb, ProblemsThumb,
  CudaThumb, RoadmapsThumb, StudyPlansThumb, ProgressThumb, SheetsThumb,
} from './ForgeHubThumbs';
import './PGForgeHub.css';

// The surfaces of PGForge. ML Math owns the foundations; Lessons owns the
// applied/architecture track — they no longer both advertise "linear algebra",
// which is what read as duplicated. Each card carries its own animated thumb —
// the shared ForgeHubThumb router keys on the legacy /ml paths, so mapping the
// component directly here keeps every card's preview on-topic instead of
// collapsing to the fallback.
const PILLAR_CARDS = [
  { to: '/forge/projects',    icon: FolderGit2, title: 'Projects',     Thumb: ProjectsThumb,
    desc: 'Build something real: a digit classifier, a small transformer, backprop from scratch.' },
  { to: '/forge/problems',    icon: ListChecks, title: 'Problems',     Thumb: ProblemsThumb,
    desc: 'Implement optimizers, activations, losses, and classic models from scratch — one runnable task each.' },
  { to: '/forge/papers',      icon: FileText,   title: 'Papers',       Thumb: PapersThumb,
    desc: 'Landmark reads rebuilt step by step — attention, residual nets, Adam, diffusion.' },
  { to: '/forge/learn',       icon: BookOpen,   title: 'Lessons',      Thumb: LessonsThumb,
    desc: 'Deep nets, attention, transformers, diffusion, and RL — the architectures, end to end.' },
  { to: '/forge/math',        icon: Sigma,      title: 'Foundations',  Thumb: FoundationsThumb,
    desc: 'Linear algebra, calculus, probability, optimization, and information theory — each with a live visual.' },
  { to: '/forge/cuda',        icon: Cpu,        title: 'CUDA Kernels', Thumb: CudaThumb,
    desc: 'Write the GPU kernels under the math — reductions, tiled matmul, softmax, scan.' },
  { to: '/forge/roadmaps',    icon: Map,        title: 'Roadmaps',     Thumb: RoadmapsThumb,
    desc: 'An ordered path from math foundations through architectures to reinforcement learning.' },
  { to: '/forge/study-plans', icon: Route,      title: 'Study Plans',  Thumb: StudyPlansThumb,
    desc: 'Guided tracks that string lessons, problems, papers, and math into one route.' },
  { to: '/forge/progress',    icon: Trophy,     title: 'Progress',     Thumb: ProgressThumb,
    desc: 'Your solved-problem ring, badges, submission streak, and recent activity.' },
  { to: '/forge/sheets',      icon: Table2,     title: 'Sheets',       Thumb: SheetsThumb,
    desc: 'Quick-reference cheat sheets — NumPy, PyTorch, CUDA, Triton, and ML interviews.' },
];

// Quick-jump chips under the hero stats — a compact set of on-topic entry points
// so the left column reads full alongside the tall network card.
const HERO_JUMP = [
  { to: '/forge/learn',    icon: BookOpen,   label: 'Transformers' },
  { to: '/forge/papers',   icon: FileText,   label: 'Attention paper' },
  { to: '/forge/cuda',     icon: Cpu,        label: 'CUDA kernels' },
  { to: '/forge/problems', icon: ListChecks, label: 'Optimizers' },
];

// Deterministic PRNG — never Math.random. Seeds the network's fixed weights so
// the layout is reproducible across renders.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A live multi-layer network training in place: signals pulse left→right on the
// forward pass, gradients flow right→left on backprop, node activations fire in a
// sweeping wave, and the loss ticks down epoch by epoch. Dozens of edges + nodes
// animate at once — all via staggered CSS keyframes, with a single rAF only
// flipping the pass and advancing the loss/epoch readouts (never per-frame state).
const NF_LAYER_X = [40, 120, 200, 280];
const NF_LAYER_N = [4, 6, 5, 3];
const NF_LAYER_LABEL = ['input', 'hidden', 'hidden', 'output'];
const NF_PHASE_S = 1.35;        // seconds per pass (forward, then backward) at 1x

function nfNodeY(n, i) {
  const gap = Math.min(28, 150 / n);
  return 100 + (i - (n - 1) / 2) * gap;
}
function nfNextLoss(prev, rnd) {
  const decayed = prev * 0.855 + 0.028;             // asymptotes toward ~0.19
  return Math.max(0.08, decayed + (rnd() - 0.5) * 0.045);
}

function NeuralFlowViz() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Document-global SVG defs ids must be unique per instance.
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const ids = {
    glow: `nfGlow-${uid}`,
    bg: `nfBg-${uid}`,
    vig: `nfVig-${uid}`,
  };

  // Fixed geometry — layer node coordinates + every inter-layer edge with a
  // reproducible signed weight (drives colour + thickness).
  const { nodes, edges } = useMemo(() => {
    const rnd = mulberry32(0x51ed);
    const layers = NF_LAYER_N.map((n, li) =>
      Array.from({ length: n }, (_, i) => ({ x: NF_LAYER_X[li], y: nfNodeY(n, i), layer: li })));
    const nd = layers.flat();
    const ed = [];
    for (let li = 0; li < layers.length - 1; li += 1) {
      layers[li].forEach((a, ai) => layers[li + 1].forEach((b, bi) => {
        const w = rnd() * 2 - 1;
        ed.push({
          x1: a.x, y1: a.y, x2: b.x, y2: b.y, w, eo: li,
          key: `${li}-${ai}-${bi}`,
        });
      }));
    }
    return { nodes: nd, edges: ed };
  }, []);

  const [playing, setPlaying] = useState(!reduce);
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState('fwd');
  const [epoch, setEpoch] = useState(1);
  const [loss, setLoss] = useState(2.85);

  const phaseRef = useRef('fwd');
  const epochRef = useRef(1);
  const lossRef = useRef(2.85);
  const rndRef = useRef(mulberry32(0x9e37));

  // Single rAF: accumulate elapsed time, flip the pass every NF_PHASE_S, and on
  // each completed forward+backward cycle advance the epoch + decay the loss.
  // Only a handful of state writes per second — never a per-frame render.
  useEffect(() => {
    if (reduce || !playing) return undefined;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const dur = NF_PHASE_S / speed;
    const tick = (ts) => {
      acc += Math.min(0.05, (ts - last) / 1000);
      last = ts;
      if (acc >= dur) {
        acc -= dur;
        const next = phaseRef.current === 'fwd' ? 'bwd' : 'fwd';
        phaseRef.current = next;
        setPhase(next);
        if (next === 'fwd') {
          lossRef.current = nfNextLoss(lossRef.current, rndRef.current);
          epochRef.current += 1;
          if (epochRef.current > 60 || lossRef.current < 0.14) {
            epochRef.current = 1;
            lossRef.current = 2.85;
          }
          setEpoch(epochRef.current);
          setLoss(lossRef.current);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, playing, speed]);

  const doReset = () => {
    phaseRef.current = 'fwd';
    epochRef.current = 1;
    lossRef.current = 2.85;
    rndRef.current = mulberry32(0x9e37);
    setPhase('fwd');
    setEpoch(1);
    setLoss(2.85);
  };

  const dataPhase = reduce ? 'fwd' : phase;
  const passLabel = dataPhase === 'fwd' ? 'forward pass' : 'backprop';

  return (
    <div className="forge-hero-viz">
      <div className="forge-hero-viz-head">
        <span className="forge-hero-viz-title">Training a neural net — forward &amp; backprop</span>
        <span className="forge-hero-viz-read">epoch {epoch} · loss {loss.toFixed(3)}</span>
      </div>
      <svg viewBox="0 0 320 200" className="forge-hero-viz-svg" role="img"
        preserveAspectRatio="xMidYMid meet"
        aria-label="A multi-layer neural network training: signals pulse forward across the edges, gradients flow back, and node activations fire in a wave.">
        <defs>
          <linearGradient id={ids.bg} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--hue-violet) 15%, var(--bg))" />
            <stop offset="55%" stopColor="var(--bg)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--hue-sky) 11%, var(--bg))" />
          </linearGradient>
          <radialGradient id={ids.vig} cx="50%" cy="46%" r="72%">
            <stop offset="0%" stopColor="var(--bg)" stopOpacity="0" />
            <stop offset="70%" stopColor="var(--bg)" stopOpacity="0" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--text-main) 30%, transparent)" stopOpacity="0.45" />
          </radialGradient>
          <filter id={ids.glow} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y="0" width="320" height="200" fill={`url(#${ids.bg})`} />

        <g className={reduce ? 'nf-scene nf-static' : 'nf-scene'} data-phase={dataPhase}
          style={{ '--nf-speed': speed }}>
          {/* static structural wires — the network skeleton */}
          <g>
            {edges.map((e) => (
              <line key={`w-${e.key}`} className="nf-wire" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                strokeWidth={0.4 + Math.abs(e.w) * 1.25}
                stroke={`color-mix(in srgb, var(--hue-${e.w >= 0 ? 'sky' : 'pink'}) 42%, var(--surface))`} />
            ))}
          </g>
          {/* animated signal pulses travelling along every edge */}
          <g>
            {edges.map((e) => (
              <line key={`e-${e.key}`} className="nf-edge" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                strokeWidth={0.5 + Math.abs(e.w) * 1.5}
                stroke={`var(--hue-${e.w >= 0 ? 'sky' : 'pink'})`}
                style={{ '--nf-eo': e.eo }} />
            ))}
          </g>
          {/* activation blooms — a halo firing behind each node as its layer lights up */}
          <g>
            {nodes.map((n, i) => (
              <circle key={`b-${i}`} className="nf-bloom" cx={n.x} cy={n.y} r="7"
                style={{ '--nf-order': n.layer }} />
            ))}
          </g>
          {/* the neurons themselves, gently glowing */}
          <g filter={`url(#${ids.glow})`}>
            {nodes.map((n, i) => (
              <circle key={`n-${i}`} className="nf-core" cx={n.x} cy={n.y} r="4.6"
                style={{ '--nf-order': n.layer }} />
            ))}
          </g>
          {/* layer captions */}
          {NF_LAYER_X.map((x, li) => (
            <text key={`t-${li}`} className="nf-label" x={x} y="192" textAnchor="middle">
              {NF_LAYER_LABEL[li]}
            </text>
          ))}
        </g>
        <rect x="0" y="0" width="320" height="200" fill={`url(#${ids.vig})`} pointerEvents="none" />
      </svg>

      <div className="forge-hero-ctl">
        <button className="forge-hero-btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause' : 'Play'}
        </button>
        <button className="forge-hero-btn" onClick={doReset}><RotateCcw size={13} /> Reset</button>
        <span className={`forge-hero-status nf-pass ${dataPhase === 'fwd' ? 'is-fwd' : 'is-bwd'}`}>
          {dataPhase === 'fwd' ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}{passLabel}
        </span>
      </div>

      <div className="forge-hero-sliders">
        <label className="forge-hero-sl">
          <span><span className="nf-sl-lead"><Gauge size={11} /> speed</span> <b>{speed.toFixed(1)}×</b></span>
          <input type="range" min="0.5" max="2" step="0.1" value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} aria-label="animation speed" />
        </label>
      </div>

      <p className="forge-hero-viz-cap">
        Signals pulse left to right on the <b>forward pass</b>, then gradients flow right to left on <b>backprop</b> — the neurons fire in a wave and the loss drops each epoch. Warm edges carry negative weights, cool edges positive.
      </p>
    </div>
  );
}

// ── Reel mini-viz ───────────────────────────────────────────────────────────
// A Netflix-style row of tiny, always-moving ML visuals that glides left forever.
// Each viz is pure CSS-animated inline SVG (no SMIL ids, so the duplicated
// marquee track never collides), theme-tokened via the --reel-hue the tile sets.
const REEL_VB = '0 0 120 72';

function VizDescent() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <line className="reel-base" x1="10" y1="60" x2="110" y2="60" />
      <path className="reel-descent-curve" d="M12 16 Q60 78 108 16" />
      <circle className="reel-descent-dot" cx="12" cy="16" r="4.6" />
    </svg>
  );
}

function VizAttention() {
  const cells = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 6; c += 1) cells.push({ r, c });
  }
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {cells.map(({ r, c }) => (
        <rect key={`${r}-${c}`} className="reel-att-cell" x={16 + c * 15} y={9 + r * 14}
          width="12" height="11" rx="2.4" style={{ animationDelay: `${(r + c) * 0.16}s` }} />
      ))}
    </svg>
  );
}

function VizDiffusion() {
  const dots = [
    [24, 20], [40, 14], [58, 24], [76, 16], [94, 26], [30, 40],
    [48, 48], [66, 40], [84, 50], [100, 40], [20, 54], [58, 58],
  ];
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {dots.map(([x, y], i) => (
        <circle key={i} className="reel-diff-dot" cx={x} cy={y} r="4"
          style={{ animationDelay: `${(i % 6) * 0.28}s` }} />
      ))}
    </svg>
  );
}

function VizVectorField() {
  const arrows = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 5; c += 1) arrows.push({ x: 20 + c * 20, y: 16 + r * 20, d: r + c });
  }
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {arrows.map(({ x, y, d }, i) => (
        <g key={i} className="reel-vec" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${d * 0.2}s` }}>
          <line className="reel-vec-line" x1={x - 7} y1={y} x2={x + 6} y2={y} />
          <path className="reel-vec-head" d={`M${x + 6} ${y - 3} L${x + 10} ${y} L${x + 6} ${y + 3} Z`} />
        </g>
      ))}
    </svg>
  );
}

function VizOptimizer() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path className="reel-opt-bowl" d="M14 20 Q60 82 106 20" />
      <ellipse className="reel-opt-shadow" cx="60" cy="60" rx="11" ry="3.4" />
      <circle className="reel-opt-ball" cx="60" cy="18" r="6" />
    </svg>
  );
}

function VizNeuralNet() {
  const cols = [24, 60, 96];
  const ys = [[18, 40, 62], [26, 54], [22, 50]];
  const edges = [];
  ys[0].forEach((y0, a) => ys[1].forEach((y1, b) => edges.push({ x1: cols[0], y1: y0, x2: cols[1], y2: y1, d: a + b })));
  ys[1].forEach((y1, a) => ys[2].forEach((y2, b) => edges.push({ x1: cols[1], y1, x2: cols[2], y2, d: a + b + 3 })));
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {edges.map((e, i) => (
        <line key={i} className="reel-net-edge" x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          style={{ animationDelay: `${e.d * 0.22}s` }} />
      ))}
      {ys.map((layer, li) => layer.map((y, i) => (
        <circle key={`${li}-${i}`} className="reel-net-node" cx={cols[li]} cy={y} r="5.4"
          style={{ animationDelay: `${(li * 3 + i) * 0.18}s` }} />
      )))}
    </svg>
  );
}

function VizSoftmax() {
  const bars = [0, 1, 2, 3, 4, 5];
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <line className="reel-base" x1="12" y1="62" x2="108" y2="62" />
      {bars.map((i) => (
        <rect key={i} className={`reel-bar reel-bar-${i}`} x={16 + i * 15} y="12" width="11" height="50"
          rx="2.4" style={{ transformOrigin: `${21 + i * 15}px 62px` }} />
      ))}
    </svg>
  );
}

function VizActivation() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <line className="reel-base" x1="10" y1="40" x2="110" y2="40" />
      <g className="reel-wave-scroll">
        <path className="reel-wave" d="M-60 40 Q-45 12 -30 40 T0 40 T30 40 T60 40 T90 40 T120 40 T150 40 T180 40" />
      </g>
      <circle className="reel-wave-node" cx="60" cy="40" r="4.4" />
    </svg>
  );
}

function VizWarp() {
  const cells = [];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 8; c += 1) cells.push({ r, c, d: r + c });
  }
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {cells.map(({ r, c, d }) => (
        <rect key={`${r}-${c}`} className="reel-warp-cell" x={12 + c * 12.5} y={11 + r * 13}
          width="10" height="10" rx="2" style={{ animationDelay: `${d * 0.1}s` }} />
      ))}
    </svg>
  );
}

function VizConvergence() {
  return (
    <svg viewBox={REEL_VB} className="reel-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <circle className="reel-ring-track" cx="60" cy="36" r="24" />
      <circle className="reel-ring-fill" cx="60" cy="36" r="24" transform="rotate(-90 60 36)" pathLength="100" />
      <circle className="reel-ring-core" cx="60" cy="36" r="6" />
    </svg>
  );
}

// Featured-paper visual for "Attention Is All You Need" — a live attention
// heat-grid (query rows attending over key columns, the weights rippling in a
// diagonal wave) with source tokens on the left flowing into a target token via
// curved connection lines. Pure CSS motion, theme-tokened, reduced-motion safe.
function AttentionPaperViz() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const N = 5;
  const G0 = 52, GS = 15;           // grid origin + cell stride
  const cells = [];
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) cells.push({ r, c });
  }
  // Left-column source tokens fanning into a single attended target on the grid.
  const tokY = [22, 40, 58, 76];
  const targetX = G0 + 2 * GS + GS / 2;
  const targetY = 8;
  return (
    <svg viewBox="0 0 140 105" className="forge-att-svg" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="Attention heat-grid with tokens attending to tokens">
      <rect x="0" y="0" width="140" height="105" fill="var(--bg)" />
      {/* flowing connection lines from source tokens into the attended cell */}
      {tokY.map((y, i) => (
        <path
          key={`ln-${i}`}
          className={reduce ? 'forge-att-link-static' : 'forge-att-link'}
          style={reduce ? undefined : { animationDelay: `${i * 0.5}s` }}
          d={`M18 ${y} C34 ${y}, ${targetX - 16} ${targetY + 6}, ${targetX} ${targetY + 4}`}
          fill="none"
          stroke={`var(--hue-${['violet', 'sky', 'pink', 'mint'][i]})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
      {tokY.map((y, i) => (
        <circle key={`tk-${i}`} cx="14" cy={y} r="4.6"
          fill={`color-mix(in srgb, var(--hue-${['violet', 'sky', 'pink', 'mint'][i]}) 82%, var(--surface))`}
          stroke="var(--surface)" strokeWidth="1" />
      ))}
      {/* the Q x K attention weight grid */}
      {cells.map(({ r, c }) => (
        <rect
          key={`${r}-${c}`}
          className={reduce ? 'forge-att-cell-static' : 'forge-att-cell'}
          style={reduce ? undefined : { animationDelay: `${(r + c) * 0.22}s` }}
          x={G0 + c * GS}
          y={22 + r * GS}
          width={GS - 3}
          height={GS - 3}
          rx="2.6"
          fill={`color-mix(in srgb, var(--hue-pink) ${28 + ((r * N + c) % 5) * 14}%, var(--hue-sky))`}
        />
      ))}
      {/* a highlight query-row sweeping down the grid */}
      {!reduce && (
        <rect className="forge-att-scan" x={G0 - 2} y="20" width={N * GS + 1} height={GS + 1}
          rx="3" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
      )}
    </svg>
  );
}

const REEL_TILES = [
  { to: '/forge/math',     title: 'Gradient descent', hue: 'var(--hue-sky)',    Viz: VizDescent },
  { to: '/forge/learn',    title: 'Self-attention',   hue: 'var(--hue-violet)', Viz: VizAttention },
  { to: '/forge/papers',   title: 'Diffusion',        hue: 'var(--hue-pink)',   Viz: VizDiffusion },
  { to: '/forge/math',     title: 'Vector fields',    hue: 'var(--hue-mint)',   Viz: VizVectorField },
  { to: '/forge/problems', title: 'Optimizers',       hue: 'var(--accent)',     Viz: VizOptimizer },
  { to: '/forge/learn',    title: 'Neural nets',      hue: 'var(--hue-sky)',    Viz: VizNeuralNet },
  { to: '/forge/problems', title: 'Softmax',          hue: 'var(--hue-violet)', Viz: VizSoftmax },
  { to: '/forge/math',     title: 'Activations',      hue: 'var(--hue-mint)',   Viz: VizActivation },
  { to: '/forge/cuda',     title: 'Warp scheduling',  hue: 'var(--warning)',    Viz: VizWarp },
  { to: '/forge/progress', title: 'Convergence',      hue: 'var(--hue-pink)',   Viz: VizConvergence },
];

function ReelTile(tile) {
  const { to, title, hue, Viz } = tile;
  return (
    <Link to={to} className="reel-tile" style={{ '--reel-hue': hue }}>
      <div className="reel-tile-stage"><Viz /></div>
      <div className="reel-tile-cap">
        <span className="reel-tile-title">{title}</span>
        <ArrowUpRight size={13} className="reel-tile-arr" />
      </div>
    </Link>
  );
}

function ForgeReel() {
  const reduce = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const head = (
    <div className="forge-section-head">
      <h2 className="forge-section-title">See the ideas move</h2>
    </div>
  );

  if (reduce) {
    return (
      <section className="forge-section">
        {head}
        <div className="reel-static">
          {REEL_TILES.map((t) => <ReelTile key={`${t.to}-${t.title}`} {...t} />)}
        </div>
      </section>
    );
  }

  return (
    <section className="forge-section">
      {head}
      <div className="reel-viewport">
        <div className="reel-track">
          {REEL_TILES.map((t) => <ReelTile key={`a-${t.to}-${t.title}`} {...t} />)}
          {REEL_TILES.map((t) => <ReelTile key={`b-${t.to}-${t.title}`} {...t} />)}
        </div>
      </div>
    </section>
  );
}

export default function PGForgeHub() {
  const lessonCount = useMemo(
    () => Object.values(PILLARS).reduce((acc, p) => acc + (p.lessons?.length || 0), 0),
    [],
  );
  const mathTopicCount = useMemo(
    () => MATH_MODULES.reduce((acc, m) => acc + m.topics.length, 0),
    [],
  );
  const sampleProblems = PG_FORGE_PROBLEMS.slice(0, 6);
  const featured = PAPERS[0];

  const stats = [
    { n: mathTopicCount, label: 'math topics' },
    { n: lessonCount, label: 'lessons' },
    { n: PG_FORGE_PROBLEMS.length, label: 'problems' },
    { n: PAPERS.length, label: 'papers rebuilt' },
  ];

  return (
    <div className="forge-hub">
      <section className="forge-hero">
        <div className="forge-hero-left">
          <h1 className="forge-hero-title">
            <span className="forge-hero-pg">PG</span>Forge
          </h1>
          <p className="forge-hero-tag">
            The math, the code, and the papers behind machine learning — read the intuition, drag the visual, then build it yourself.
          </p>
          <div className="forge-hero-ctas">
            <Link to="/ml/math" className="forge-hero-cta forge-hero-cta-primary">
              Start with the math <ArrowRight size={15} />
            </Link>
            <Link to="/ml/problems" className="forge-hero-cta forge-hero-cta-ghost">
              <Code2 size={15} /> Solve a problem
            </Link>
          </div>
          <div className="forge-hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="forge-hero-stat">
                <span className="forge-hero-stat-n">{s.n}</span>
                <span className="forge-hero-stat-l">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="forge-hero-jump">
            <span className="forge-hero-jump-lead">Jump in</span>
            {HERO_JUMP.map((j) => {
              const Icon = j.icon;
              return (
                <Link key={j.to} to={j.to} className="forge-hero-chip">
                  <Icon size={13} /> {j.label}
                </Link>
              );
            })}
          </div>
        </div>
        <NeuralFlowViz />
      </section>

      <ForgeReel />

      <section className="forge-section">
        <div className="forge-section-head">
          <h2 className="forge-section-title">Pick a surface</h2>
        </div>
        <div className="forge-pillar-grid">
          {PILLAR_CARDS.map((s) => {
            const Icon = s.icon;
            const Thumb = s.Thumb;
            return (
              <Link key={s.to} to={s.to} className="forge-pillar">
                <div className="forge-thumb-frame forge-pillar-thumb">
                  <Thumb />
                  <span className="forge-pillar-badge"><Icon size={15} /></span>
                </div>
                <div className="forge-pillar-body">
                  <h3 className="forge-pillar-title">{s.title}</h3>
                  <p className="forge-pillar-desc">{s.desc}</p>
                  <span className="forge-pillar-cta">Open <ArrowRight size={13} /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="forge-split">
        <div className="forge-feature">
          <div className="forge-feature-head">
            <FileText size={16} />
            <span>Paper, rebuilt</span>
          </div>
          {featured && (
            <Link to="/ml/papers" className="forge-feature-card">
              <div className="forge-thumb-frame forge-feature-thumb">
                <AttentionPaperViz />
              </div>
              <div className="forge-feature-text">
                <h3 className="forge-feature-title">{featured.title}</h3>
                {featured.summary && <p className="forge-feature-sub">{featured.summary}</p>}
                <span className="forge-pillar-cta">Read the walkthrough <ArrowUpRight size={13} /></span>
              </div>
            </Link>
          )}
        </div>

        <div className="forge-feature">
          <div className="forge-feature-head">
            <ListChecks size={16} />
            <span>Warm up on a problem</span>
          </div>
          <div className="forge-problem-list">
            {sampleProblems.map((p) => (
              <Link key={p.slug} to={`/ml/problems/${p.slug}`} className="forge-problem-row">
                <Code2 size={14} className="forge-problem-icon" />
                <span className="forge-problem-name">{p.title}</span>
                <span className={`forge-problem-diff forge-problem-diff-${p.difficulty}`}>{p.difficulty}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
