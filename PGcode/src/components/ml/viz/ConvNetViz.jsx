import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

/* ------------------------------------------------------------------ */
/* ConvNet architecture                                               */
/*                                                                    */
/*   input  28x28 x 1                                                 */
/*     -> conv 3x3 (4 filters)  -> 26x26 x 4                          */
/*     -> maxpool 2x2 (stride 2)-> 13x13 x 4                          */
/*     -> conv 3x3 (8 filters)  -> 11x11 x 8                          */
/*     -> maxpool 2x2 (stride 2)-> 5x5 x 8                            */
/*     -> flatten + dense 10                                          */
/* ------------------------------------------------------------------ */

const IN_SIZE = 28;
const K = 3;
const F1 = 4;
const F2 = 8;
const C1_SIZE = IN_SIZE - K + 1;   // 26
const P1_SIZE = Math.floor(C1_SIZE / 2); // 13
const C2_SIZE = P1_SIZE - K + 1;   // 11
const P2_SIZE = Math.floor(C2_SIZE / 2); // 5
const N_OUT = 10;
const FLAT_DIM = P2_SIZE * P2_SIZE * F2; // 200

const STEP_DELAY = 700;

/* ---------- Seeded RNG (mulberry32) ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  // Box-Muller, lightweight
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* ---------- Seeded "3" shaped 28x28 grayscale input ---------- */
function buildInputDigit() {
  const grid = Array.from({ length: IN_SIZE }, () => new Float32Array(IN_SIZE));
  // Draw a blocky "3" using horizontal bars plus a curved right edge.
  // Bars: top, middle, bottom. Right vertical column connects them.
  const ink = (r, c, v = 1) => {
    if (r >= 0 && r < IN_SIZE && c >= 0 && c < IN_SIZE) {
      grid[r][c] = Math.min(1, grid[r][c] + v);
    }
  };
  // top bar (rows 5..8, cols 7..21)
  for (let r = 5; r <= 8; r++) for (let c = 7; c <= 21; c++) ink(r, c, 1);
  // middle bar (rows 12..15, cols 10..21)
  for (let r = 12; r <= 15; r++) for (let c = 10; c <= 21; c++) ink(r, c, 1);
  // bottom bar (rows 19..22, cols 7..21)
  for (let r = 19; r <= 22; r++) for (let c = 7; c <= 21; c++) ink(r, c, 1);
  // right spine connecting bars (rows 5..22, cols 19..21)
  for (let r = 5; r <= 22; r++) for (let c = 19; c <= 21; c++) ink(r, c, 1);
  // soften edges with a light halo so the visualization shows brightness gradients
  const halo = grid.map((row) => Array.from(row));
  for (let r = 0; r < IN_SIZE; r++) {
    for (let c = 0; c < IN_SIZE; c++) {
      if (halo[r][c] > 0) continue;
      let near = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < IN_SIZE && nc >= 0 && nc < IN_SIZE && grid[nr][nc] > 0.5) near++;
      }
      if (near > 0) grid[r][c] = 0.18;
    }
  }
  return grid;
}

/* ---------- Layer math (deterministic from seed) ---------- */
function buildKernels(seed, count, kSize, inChans) {
  const rng = mulberry32(seed);
  const kernels = [];
  for (let f = 0; f < count; f++) {
    const filt = [];
    for (let ic = 0; ic < inChans; ic++) {
      const k = [];
      for (let r = 0; r < kSize; r++) {
        const row = [];
        for (let c = 0; c < kSize; c++) {
          row.push(gaussian(rng) * 0.6);
        }
        k.push(row);
      }
      filt.push(k);
    }
    kernels.push(filt);
  }
  return kernels;
}

function buildDense(seed, outN, inN) {
  const rng = mulberry32(seed);
  const W = [];
  const b = [];
  for (let o = 0; o < outN; o++) {
    const row = new Float32Array(inN);
    for (let i = 0; i < inN; i++) row[i] = gaussian(rng) * 0.15;
    W.push(row);
    b.push(gaussian(rng) * 0.05);
  }
  return { W, b };
}

function relu(v) { return v > 0 ? v : 0; }

function conv2dStack(inputMaps, kernels) {
  // inputMaps: [inC][H][W], kernels: [outC][inC][K][K] -> output [outC][H-K+1][W-K+1] (ReLU)
  const inC = inputMaps.length;
  const H = inputMaps[0].length;
  const W = inputMaps[0][0].length;
  const outH = H - K + 1;
  const outW = W - K + 1;
  const outC = kernels.length;
  const out = [];
  for (let o = 0; o < outC; o++) {
    const map = Array.from({ length: outH }, () => new Float32Array(outW));
    for (let r = 0; r < outH; r++) {
      for (let c = 0; c < outW; c++) {
        let s = 0;
        for (let ic = 0; ic < inC; ic++) {
          for (let i = 0; i < K; i++) {
            for (let j = 0; j < K; j++) {
              s += inputMaps[ic][r + i][c + j] * kernels[o][ic][i][j];
            }
          }
        }
        map[r][c] = relu(s);
      }
    }
    out.push(map);
  }
  return out;
}

function maxPool2(inputMaps) {
  const outC = inputMaps.length;
  const H = inputMaps[0].length;
  const W = inputMaps[0][0].length;
  const outH = Math.floor(H / 2);
  const outW = Math.floor(W / 2);
  const out = [];
  for (let o = 0; o < outC; o++) {
    const map = Array.from({ length: outH }, () => new Float32Array(outW));
    for (let r = 0; r < outH; r++) {
      for (let c = 0; c < outW; c++) {
        const a = inputMaps[o][2 * r][2 * c];
        const b = inputMaps[o][2 * r][2 * c + 1];
        const cc = inputMaps[o][2 * r + 1][2 * c];
        const d = inputMaps[o][2 * r + 1][2 * c + 1];
        map[r][c] = Math.max(a, b, cc, d);
      }
    }
    out.push(map);
  }
  return out;
}

function flattenMaps(maps) {
  const out = new Float32Array(maps.length * maps[0].length * maps[0][0].length);
  let i = 0;
  for (let m = 0; m < maps.length; m++) {
    for (let r = 0; r < maps[m].length; r++) {
      for (let c = 0; c < maps[m][0].length; c++) {
        out[i++] = maps[m][r][c];
      }
    }
  }
  return out;
}

function softmax(arr) {
  const m = Math.max(...arr);
  const e = arr.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

/* ---------- Layout ---------- */
const STAGE_W = 1080;
const STAGE_H = 380;
const PAD_T = 26;
const PAD_B = 50;

// Each layer occupies a column with a centered stack of feature maps drawn isometrically.
// We pick visual sizes for each layer's feature map (in px) — not equal to feature-map resolution,
// so that small late-stage maps still read clearly.
const LAYER_DEFS = [
  { id: 'input', label: 'INPUT  28x28x1',    cx: 80,   mapW: 110, mapH: 110, count: 1,  offset: 0 },
  { id: 'conv1', label: 'CONV 3x3  26x26x4',  cx: 260,  mapW: 90,  mapH: 90,  count: F1, offset: 6 },
  { id: 'pool1', label: 'POOL 2x2  13x13x4',  cx: 440,  mapW: 64,  mapH: 64,  count: F1, offset: 6 },
  { id: 'conv2', label: 'CONV 3x3  11x11x8',  cx: 610,  mapW: 56,  mapH: 56,  count: F2, offset: 4 },
  { id: 'pool2', label: 'POOL 2x2  5x5x8',    cx: 780,  mapW: 38,  mapH: 38,  count: F2, offset: 4 },
  { id: 'dense', label: 'DENSE  10',          cx: 960,  mapW: 56,  mapH: 220, count: 1,  offset: 0 },
];

function layerCenterY() {
  return PAD_T + (STAGE_H - PAD_T - PAD_B) / 2;
}

function mapOriginXY(layerIdx, mapIdx) {
  const def = LAYER_DEFS[layerIdx];
  const cy = layerCenterY();
  // Stack centered: total stack span = (count-1)*offset
  const span = (def.count - 1) * def.offset;
  const ox = def.cx - def.mapW / 2 + (def.count - 1 - mapIdx) * def.offset;
  const oy = cy - def.mapH / 2 - span / 2 + mapIdx * def.offset;
  return { x: ox, y: oy, w: def.mapW, h: def.mapH };
}

/* ---------- Feature map → SVG canvas (rendered as tiny coloured rects) ---------- */
function FeatureMap({
  origin, data, size, dim, highlighted, faded, onClick, stroke,
}) {
  // data: 2D Float32 array (size x size). We render as a rect grid; for big maps we collapse to a single bg + grid lines.
  const { x, y, w, h } = origin;
  const cellW = w / size;
  const cellH = h / size;
  // For perf, only draw cells with appreciable value.
  const rects = [];
  let maxAbs = 0;
  if (data) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const v = Math.abs(data[r][c]);
        if (v > maxAbs) maxAbs = v;
      }
    }
  }
  if (maxAbs === 0) maxAbs = 1;
  const baseOpacity = faded ? 0.18 : 1;
  if (data) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const v = data[r][c];
        const t = Math.min(1, Math.abs(v) / maxAbs);
        if (t < 0.04) continue;
        const op = (0.15 + t * 0.78) * baseOpacity;
        const fill = v >= 0
          ? `rgba(var(--accent-rgb), ${op})`
          : `color-mix(in srgb, var(--hue-pink) ${(op * 100).toFixed(1)}%, transparent)`;
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={x + c * cellW}
            y={y + r * cellH}
            width={cellW + 0.4}
            height={cellH + 0.4}
            fill={fill}
            shapeRendering="crispEdges"
          />
        );
      }
    }
  }
  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      opacity={faded ? 0.45 : 1}
    >
      {highlighted && (
        <rect
          x={x - 2}
          y={y - 2}
          width={w + 4}
          height={h + 4}
          rx={5}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          opacity={0.55}
          filter="url(#cn-glow)"
        />
      )}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill="var(--bg)"
        stroke={stroke || (highlighted ? 'var(--accent)' : 'var(--border)')}
        strokeWidth={highlighted ? 1.8 : 1}
      />
      {data && rects}
      {!data && (
        <line
          x1={x + 4} y1={y + h - 4} x2={x + w - 4} y2={y + 4}
          stroke="var(--text-dim)" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5"
        />
      )}
      {dim && (
        <rect
          x={x} y={y} width={w} height={h} rx={3}
          fill="var(--bg)" opacity="0.55"
        />
      )}
    </g>
  );
}

/* ---------- Compute receptive field on the input for a given (layer, mapIdx, r, c) ---------- */
function receptiveFieldOnInput(layerId, r, c) {
  // Map output coord at each layer back to input coord ranges.
  // conv 3x3 valid: input range [r..r+2]
  // pool 2x2 s2: input range [2r..2r+1]
  let r0 = r, c0 = c, r1 = r, c1 = c;
  const apply = (kind) => {
    if (kind === 'conv') { r1 = r1 + K - 1; c1 = c1 + K - 1; }
    else if (kind === 'pool') { r0 = r0 * 2; c0 = c0 * 2; r1 = r1 * 2 + 1; c1 = c1 * 2 + 1; }
  };
  // Walk back from layerId toward input
  const order = ['input', 'conv1', 'pool1', 'conv2', 'pool2'];
  const idx = order.indexOf(layerId);
  if (idx < 0) return null;
  // From layerId outputs back to input: reverse ops
  // For each step earlier, we apply the kind of the *current* layer.
  // conv1 output -> input via 'conv'
  // pool1 output -> conv1 via 'pool' then 'conv'
  // conv2 output -> pool1 via 'conv' -> conv1 via 'pool' -> input via 'conv'
  // pool2 output -> conv2 via 'pool' -> pool1 via 'conv' -> conv1 via 'pool' -> input via 'conv'
  const opsByLayer = {
    input: [],
    conv1: ['conv'],
    pool1: ['pool', 'conv'],
    conv2: ['conv', 'pool', 'conv'],
    pool2: ['pool', 'conv', 'pool', 'conv'],
  };
  const ops = opsByLayer[layerId] || [];
  for (const o of ops) apply(o);
  // Clip
  r0 = Math.max(0, r0); c0 = Math.max(0, c0);
  r1 = Math.min(IN_SIZE - 1, r1); c1 = Math.min(IN_SIZE - 1, c1);
  return { r0, c0, r1, c1 };
}

/* ---------- Main component ---------- */
export default function ConvNetViz({ seed = 7 }) {
  const inputGrid = useMemo(() => buildInputDigit(), []);

  const kernels1 = useMemo(() => buildKernels(seed * 131 + 1, F1, K, 1), [seed]);
  const kernels2 = useMemo(() => buildKernels(seed * 131 + 2, F2, K, F1), [seed]);
  const dense = useMemo(() => buildDense(seed * 131 + 3, N_OUT, FLAT_DIM), [seed]);

  // Pre-compute the full forward pass once (deterministic). We reveal it stepwise.
  const full = useMemo(() => {
    const inMaps = [inputGrid];
    const c1 = conv2dStack(inMaps, kernels1);
    const p1 = maxPool2(c1);
    const c2 = conv2dStack(p1, kernels2);
    const p2 = maxPool2(c2);
    const flat = flattenMaps(p2);
    const logits = new Float32Array(N_OUT);
    for (let o = 0; o < N_OUT; o++) {
      let s = dense.b[o];
      for (let i = 0; i < FLAT_DIM; i++) s += dense.W[o][i] * flat[i];
      logits[o] = s;
    }
    const probs = softmax(Array.from(logits));
    return { c1, p1, c2, p2, flat, logits, probs };
  }, [inputGrid, kernels1, kernels2, dense]);

  // Reveal phase: 0 = input only, 1 = +conv1, 2 = +pool1, 3 = +conv2, 4 = +pool2, 5 = +dense
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const timerRef = useRef(null);

  const [selected, setSelected] = useState(null); // { layer, mapIdx }
  const [hoverOut, setHoverOut] = useState(null); // output neuron index

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stop(), [stop]);

  const stepOnce = useCallback(() => {
    setPhase((p) => Math.min(5, p + 1));
  }, []);

  const handleRun = useCallback(() => {
    if (runningRef.current) { stop(); return; }
    if (phase >= 5) {
      setPhase(0);
    }
    runningRef.current = true;
    setRunning(true);
    const tick = () => {
      if (!runningRef.current) return;
      setPhase((p) => {
        const np = Math.min(5, p + 1);
        if (np >= 5) {
          runningRef.current = false;
          setRunning(false);
          return np;
        }
        timerRef.current = setTimeout(tick, STEP_DELAY);
        return np;
      });
    };
    timerRef.current = setTimeout(tick, STEP_DELAY);
  }, [phase, stop]);

  const handleReset = useCallback(() => {
    stop();
    setPhase(0);
    setSelected(null);
    setHoverOut(null);
  }, [stop]);

  // Are maps available at a given layer index (in LAYER_DEFS) given phase?
  const layerVisible = (lid) => {
    const order = ['input', 'conv1', 'pool1', 'conv2', 'pool2', 'dense'];
    return order.indexOf(lid) <= phase;
  };

  // Pick map data for a (layer, mapIdx)
  const mapDataFor = (lid, mapIdx) => {
    if (!layerVisible(lid)) return null;
    switch (lid) {
      case 'input': return inputGrid;
      case 'conv1': return full.c1[mapIdx];
      case 'pool1': return full.p1[mapIdx];
      case 'conv2': return full.c2[mapIdx];
      case 'pool2': return full.p2[mapIdx];
      default: return null;
    }
  };

  const mapSizeFor = (lid) => {
    switch (lid) {
      case 'input': return IN_SIZE;
      case 'conv1': return C1_SIZE;
      case 'pool1': return P1_SIZE;
      case 'conv2': return C2_SIZE;
      case 'pool2': return P2_SIZE;
      default: return 1;
    }
  };

  // Brightness flow back from a hovered output neuron.
  // For each feature map upstream, compute the sum |W| connecting to that output neuron through that map's flattened indices.
  const flowWeights = useMemo(() => {
    if (hoverOut == null) return null;
    const W = dense.W[hoverOut];
    // Strength per pool2 map = sum |W| over its flattened indices.
    const strengthP2 = new Float32Array(F2);
    let i = 0;
    for (let m = 0; m < F2; m++) {
      let s = 0;
      for (let r = 0; r < P2_SIZE; r++) {
        for (let c = 0; c < P2_SIZE; c++) {
          s += Math.abs(W[i++]);
        }
      }
      strengthP2[m] = s;
    }
    const mx = Math.max(...strengthP2) || 1;
    const nP2 = Array.from(strengthP2, (v) => v / mx);
    // Each pool2 map traces back to the same-index conv2 map; conv2 maps mix all 4 pool1 maps via kernels.
    const strengthC2 = nP2; // same indexing (pool just downsamples, channel-preserving)
    const strengthP1 = new Float32Array(F1);
    for (let p1i = 0; p1i < F1; p1i++) {
      let s = 0;
      for (let c2i = 0; c2i < F2; c2i++) {
        // sum of |kernels2[c2i][p1i]| weights
        let kSum = 0;
        for (let i2 = 0; i2 < K; i2++)
          for (let j2 = 0; j2 < K; j2++)
            kSum += Math.abs(kernels2[c2i][p1i][i2][j2]);
        s += strengthC2[c2i] * kSum;
      }
      strengthP1[p1i] = s;
    }
    const mxP1 = Math.max(...strengthP1) || 1;
    const nP1 = Array.from(strengthP1, (v) => v / mxP1);
    // conv1 maps same indexing as pool1
    const nC1 = nP1;
    return { conv1: nC1, pool1: nP1, conv2: strengthC2, pool2: nP2 };
  }, [hoverOut, dense.W, kernels2]);

  const predicted = useMemo(() => {
    let arg = 0;
    for (let i = 1; i < N_OUT; i++) if (full.probs[i] > full.probs[arg]) arg = i;
    return arg;
  }, [full.probs]);

  // Receptive field rect on input for current selection.
  const rfRect = useMemo(() => {
    if (!selected) return null;
    const sz = mapSizeFor(selected.layer);
    if (sz <= 1) return null;
    // Use full map: span all coords -> compute total receptive box
    const tl = receptiveFieldOnInput(selected.layer, 0, 0);
    const br = receptiveFieldOnInput(selected.layer, sz - 1, sz - 1);
    if (!tl || !br) return null;
    return { r0: tl.r0, c0: tl.c0, r1: br.r1, c1: br.c1 };
  }, [selected]);

  // Highlight set for current selection -> downstream maps (for receptive field forward, we keep simple: only mark the selected one).
  const isHighlighted = (lid, mapIdx) => {
    if (!selected) return false;
    return selected.layer === lid && selected.mapIdx === mapIdx;
  };

  const isFaded = (lid, mapIdx) => {
    if (flowWeights && lid !== 'input' && lid !== 'dense') {
      const arr = flowWeights[lid];
      if (arr) {
        // Fade weak maps
        return arr[mapIdx] < 0.35;
      }
    }
    if (selected) {
      return !isHighlighted(lid, mapIdx) && selected.layer === lid;
    }
    return false;
  };

  // Helper to render a layer's stack of feature maps
  const renderLayer = (lidIdx) => {
    const def = LAYER_DEFS[lidIdx];
    const lid = def.id;
    const out = [];
    if (lid === 'dense') {
      // Render 10 output neurons as a vertical column of small bars
      const px0 = def.cx - def.mapW / 2;
      const py0 = layerCenterY() - def.mapH / 2;
      const cellH = def.mapH / N_OUT;
      const probs = layerVisible('dense') ? full.probs : null;
      for (let i = 0; i < N_OUT; i++) {
        const y = py0 + i * cellH;
        const p = probs ? probs[i] : 0;
        const barW = (def.mapW - 12) * (p || 0);
        const isPred = probs && i === predicted;
        const isHover = hoverOut === i;
        out.push(
          <g
            key={`out-${i}`}
            onMouseEnter={() => setHoverOut(i)}
            onMouseLeave={() => setHoverOut(null)}
            style={{ cursor: 'pointer' }}
          >
            {(isHover || isPred) && (
              <rect
                x={px0 - 1.5} y={y - 0.5}
                width={def.mapW + 3} height={cellH - 1}
                rx={4}
                fill="none"
                stroke={isHover ? 'var(--accent)' : 'var(--hue-sky)'}
                strokeWidth={2.4}
                opacity={0.5}
                filter="url(#cn-glow)"
              />
            )}
            <rect
              x={px0} y={y + 1}
              width={def.mapW} height={cellH - 2}
              rx={3}
              fill={isHover ? 'rgba(var(--accent-rgb), 0.12)' : 'var(--bg)'}
              stroke={isHover ? 'var(--accent)' : isPred ? 'var(--hue-sky)' : 'var(--border)'}
              strokeWidth={isHover || isPred ? 1.4 : 1}
            />
            <text
              x={px0 + 6} y={y + cellH / 2 + 3}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
            >
              {i}
            </text>
            {probs && (
              <rect
                x={px0 + 18} y={y + cellH / 2 - 3}
                width={Math.max(2, barW)} height={6}
                rx={1}
                fill={isPred ? 'var(--accent)' : 'var(--hue-sky)'}
                opacity={0.45 + p * 0.55}
              />
            )}
            {probs && (
              <text
                x={px0 + def.mapW - 4} y={y + cellH / 2 + 3}
                fontSize="8"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)"
                textAnchor="end"
              >
                {(p * 100).toFixed(0)}%
              </text>
            )}
          </g>
        );
      }
      return out;
    }

    for (let m = def.count - 1; m >= 0; m--) {
      const origin = mapOriginXY(lidIdx, m);
      const data = mapDataFor(lid, m);
      out.push(
        <FeatureMap
          key={`${lid}-${m}`}
          origin={origin}
          data={data}
          size={mapSizeFor(lid)}
          dim={!layerVisible(lid)}
          highlighted={isHighlighted(lid, m)}
          faded={isFaded(lid, m)}
          onClick={() => {
            if (!layerVisible(lid)) return;
            if (selected && selected.layer === lid && selected.mapIdx === m) {
              setSelected(null);
            } else {
              setSelected({ layer: lid, mapIdx: m });
            }
          }}
          stroke={
            flowWeights && lid !== 'input' && flowWeights[lid] && flowWeights[lid][m] >= 0.7
              ? 'var(--accent)' : undefined
          }
        />
      );
    }
    return out;
  };

  // Connector polylines between layers (just thin guides)
  const connectors = useMemo(() => {
    const lines = [];
    for (let i = 0; i < LAYER_DEFS.length - 1; i++) {
      const a = LAYER_DEFS[i];
      const b = LAYER_DEFS[i + 1];
      const ax = a.cx + a.mapW / 2 + ((a.count - 1) * a.offset) / 2;
      const bx = b.cx - b.mapW / 2 - ((b.count - 1) * b.offset) / 2;
      const cy = layerCenterY();
      const active = phase >= i + 1;
      if (active) {
        lines.push(
          <line
            key={`conn-glow-${i}`}
            x1={ax} y1={cy} x2={bx} y2={cy}
            stroke="url(#cn-conn-grad)"
            strokeWidth={3.5}
            strokeLinecap="round"
            opacity={0.4}
            filter="url(#cn-glow)"
          />
        );
      }
      lines.push(
        <line
          key={`conn-${i}`}
          x1={ax} y1={cy} x2={bx} y2={cy}
          stroke={active ? 'url(#cn-conn-grad)' : 'var(--border)'}
          strokeWidth={active ? 1.6 : 1}
          strokeLinecap="round"
          opacity={active ? 0.85 : 0.4}
          strokeDasharray={active ? '0' : '3 3'}
        />
      );
    }
    return lines;
  }, [phase]);

  // Receptive-field rect overlay on input
  const rfOverlay = useMemo(() => {
    if (!rfRect) return null;
    const origin = mapOriginXY(0, 0);
    const cellW = origin.w / IN_SIZE;
    const cellH = origin.h / IN_SIZE;
    const { r0, c0, r1, c1 } = rfRect;
    const x = origin.x + c0 * cellW;
    const y = origin.y + r0 * cellH;
    const w = (c1 - c0 + 1) * cellW;
    const h = (r1 - r0 + 1) * cellH;
    return (
      <rect
        x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3}
        rx={2}
        fill="none"
        stroke="var(--hue-sky)"
        strokeWidth="1.6"
        strokeDasharray="3 2"
      />
    );
  }, [rfRect]);

  // Status line text
  const statusLine = useMemo(() => {
    if (hoverOut != null) {
      return `output neuron ${hoverOut}  p=${(full.probs[hoverOut] * 100).toFixed(1)}% — brighter maps contribute more`;
    }
    if (selected) {
      const def = LAYER_DEFS.find((d) => d.id === selected.layer);
      return `selected: ${def.id} filter ${selected.mapIdx}  receptive field shown on input`;
    }
    const phaseNames = ['input loaded', 'conv1 + relu', 'maxpool 2x2', 'conv2 + relu', 'maxpool 2x2', 'dense + softmax'];
    return `phase ${phase}/5  —  ${phaseNames[phase]}`;
  }, [hoverOut, selected, phase, full.probs]);

  return (
    <div className="mlviz-wrap cn-wrap">
      <div className="mlviz-stage cn-stage">
        <svg
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          className="mlviz-svg cn-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="cn-conn-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-sky)" />
            </linearGradient>
            <filter id="cn-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
          </defs>

          {/* Layer labels */}
          {LAYER_DEFS.map((d, i) => (
            <text
              key={`lbl-${d.id}`}
              x={d.cx}
              y={STAGE_H - PAD_B + 22}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill={phase >= i ? 'var(--text-main)' : 'var(--text-dim)'}
              textAnchor="middle"
              letterSpacing="0.1em"
              opacity={phase >= i ? 1 : 0.6}
            >
              {d.label}
            </text>
          ))}

          {/* Connectors */}
          {connectors}

          {/* Each layer's stack */}
          {LAYER_DEFS.map((_, i) => (
            <g key={`layer-${i}`}>{renderLayer(i)}</g>
          ))}

          {/* Receptive field overlay (drawn after maps so it sits on top) */}
          {rfOverlay}

          {/* Title strip */}
          <text
            x={PAD_T} y={16}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.18em"
          >
            CONVNET FORWARD PASS
          </text>

          {phase >= 5 && (
            <text
              x={STAGE_W - 14} y={16}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--accent)"
              textAnchor="end"
              letterSpacing="0.1em"
            >
              argmax = {predicted}
            </text>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-statcol">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">state</span>
            <span className="cn-state-val">{statusLine}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={stepOnce}
            disabled={running || phase >= 5}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Pause' : phase >= 5 ? 'Replay' : 'Run'}</span>
          </button>
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
          step to feed forward one layer · click a feature map for its receptive field · hover an output neuron to trace contribution
        </div>
      </div>
    </div>
  );
}
