import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Shuffle, SkipForward } from 'lucide-react';
import './MLViz.css';

/* MANIM-style LSTM cell visualization.
   - 2D state vectors c, h drawn as twin bar charts (per-component value in [-1, 1])
   - Sequence of tokens (xs) drives the cell step by step
   - Each gate is wired with arrows; clicking Step animates a phase per gate
     phases: idle -> forget -> input -> candidate -> blend -> output -> hidden -> done
   - Live readout shows f, i, g, o, c_new, h_new */

const W = 720;
const H = 460;
const DIM = 6;                       // state vector dimensionality
const STEP_DELAY = 600;              // ms between phases

const DEFAULT_TOKENS = ['Open', 'a', 'door', 'softly'];

const PHASES = [
  { id: 'idle',      label: 'Idle' },
  { id: 'forget',    label: 'Forget gate f = sigma(W_f [h, x])' },
  { id: 'input',     label: 'Input gate i = sigma(W_i [h, x])' },
  { id: 'candidate', label: 'Candidate g = tanh(W_g [h, x])' },
  { id: 'blend',     label: 'c_new = f * c_prev + i * g' },
  { id: 'output',    label: 'Output gate o = sigma(W_o [h, x])' },
  { id: 'hidden',    label: 'h_new = o * tanh(c_new)' },
  { id: 'done',      label: 'Step complete' },
];

const COLORS = {
  forget:    'var(--hue-pink, #ff66cc)',
  input:     'var(--hue-sky, #5ecbff)',
  candidate: 'var(--hue-mint, #7be0c0)',
  output:    'var(--hue-violet, #b08bff)',
  cell:      'var(--accent)',
  hidden:    'var(--warning, #f5a524)',
};

/* Deterministic pseudo-random in [-1, 1] from a string seed. Used to derive
   per-token, per-component "weighted" sums before activations are applied. */
function seedHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function srand(seed, j) {
  const x = Math.sin((seed ^ (j * 374761393)) >>> 0) * 43758.5453;
  return x - Math.floor(x);
}
function fromSeed(token, gate) {
  const s = seedHash(`${gate}:${token}`);
  const out = [];
  for (let j = 0; j < DIM; j++) {
    out.push((srand(s, j) * 2 - 1) * 1.6);
  }
  return out;
}

function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
function tanh(z) { return Math.tanh(z); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

/* Compute the next LSTM state given (x, h_prev, c_prev). We do not have real
   weights — instead we synthesize pre-activations deterministically from the
   token string so the demo is reproducible. The math (sigmoid, tanh, blend)
   is real. */
function step(token, hPrev, cPrev) {
  const wf = fromSeed(token, 'f');
  const wi = fromSeed(token, 'i');
  const wg = fromSeed(token, 'g');
  const wo = fromSeed(token, 'o');
  const f = wf.map((z, j) => sigmoid(z + 0.4 * hPrev[j]));
  const i = wi.map((z, j) => sigmoid(z + 0.4 * hPrev[j]));
  const g = wg.map((z, j) => tanh(z + 0.5 * hPrev[j]));
  const o = wo.map((z, j) => sigmoid(z + 0.4 * hPrev[j]));
  const cNew = cPrev.map((c, j) => clamp(f[j] * c + i[j] * g[j], -1.5, 1.5));
  const hNew = cNew.map((c, j) => o[j] * tanh(c));
  return { f, i, g, o, cNew, hNew };
}

/* Twin-bar chart: each component drawn as a bar centered on a baseline.
   Positive values rise, negative values fall. Range visualised: [-1.2, 1.2]. */
function BarChart({ x, y, w, h, values, color, label, sublabel, range = 1.2, accent }) {
  const bw = w / values.length;
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} ry={6}
            fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
      <line x1={x + 2} y1={cy} x2={x + w - 2} y2={cy}
            stroke="var(--border)" strokeWidth={0.6} strokeDasharray="2 3" />
      {values.map((v, j) => {
        const vClamped = clamp(v, -range, range);
        const half = (h / 2) - 4;
        const bh = Math.abs(vClamped) / range * half;
        const bx = x + j * bw + 2;
        const by = vClamped >= 0 ? cy - bh : cy;
        return (
          <g key={j}>
            <rect x={bx} y={by} width={bw - 4} height={Math.max(1.5, bh)} rx={1.5}
                  fill={color} opacity={0.85} />
            <text x={bx + (bw - 4) / 2} y={cy + half + 11}
                  textAnchor="middle" fontSize="8"
                  fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
              {vClamped.toFixed(2)}
            </text>
          </g>
        );
      })}
      <text x={x + 6} y={y + 12} fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill={accent || 'var(--text-dim)'} letterSpacing="0.12em">
        {label}
      </text>
      {sublabel && (
        <text x={x + w - 6} y={y + 12} textAnchor="end" fontSize="9"
              fontFamily="var(--mono, monospace)" fill="var(--text-dim)">
          {sublabel}
        </text>
      )}
    </g>
  );
}

/* A gate block: rounded rect with title + sigmoid/tanh glyph + activation strip.
   Activation strip is a row of mini-bars showing the gate output per component. */
function GateBlock({ x, y, w, h, title, op, values, color, active }) {
  return (
    <g opacity={active ? 1 : 0.85}>
      <rect x={x} y={y} width={w} height={h} rx={10} ry={10}
            fill={active ? `rgba(0,0,0,0)` : 'var(--surface)'}
            stroke={active ? color : 'var(--border)'}
            strokeWidth={active ? 2 : 1.2} />
      {active && (
        <rect x={x} y={y} width={w} height={h} rx={10} ry={10}
              fill={color} opacity={0.10} />
      )}
      <text x={x + w / 2} y={y + 16} textAnchor="middle"
            fontSize="11" fontFamily="var(--serif, serif)"
            fontStyle="italic" fontWeight="700" fill={color}>
        {title}
      </text>
      <text x={x + w / 2} y={y + 30} textAnchor="middle"
            fontSize="9" fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)" letterSpacing="0.1em">
        {op}
      </text>
      {/* Per-component activation strip */}
      <g transform={`translate(${x + 8} ${y + 38})`}>
        {values.map((v, j) => {
          const sw = (w - 16) / values.length;
          const bh = h - 50;
          const isSigmoid = op.indexOf('sigma') === 0 || op.startsWith('sigmoid') || op.startsWith('σ');
          const bottomAligned = isSigmoid;
          const norm = bottomAligned
            ? clamp(v, 0, 1)
            : (clamp(v, -1, 1) + 1) / 2;
          const fill = `${color}`;
          return (
            <g key={j}>
              <rect x={j * sw + 1} y={0} width={sw - 2} height={bh}
                    rx={2} fill="var(--bg)" opacity={0.4} />
              <rect x={j * sw + 1} y={bh - norm * bh} width={sw - 2}
                    height={Math.max(1.5, norm * bh)}
                    rx={2} fill={fill} opacity={0.85} />
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color = 'var(--text-dim)', active, dashed }) {
  const stroke = active ? color : 'var(--text-dim)';
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={stroke}
          strokeWidth={active ? 2 : 1.1}
          opacity={active ? 1 : 0.55}
          strokeDasharray={dashed ? '4 3' : undefined}
          markerEnd="url(#lstm-arrow)" />
  );
}

function Op({ cx, cy, label, color, active }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={11}
              fill={active ? color : 'var(--surface)'}
              stroke={active ? color : 'var(--border)'}
              strokeWidth={active ? 2 : 1.2}
              opacity={active ? 1 : 0.85} />
      <text x={cx} y={cy + 3.5} textAnchor="middle"
            fontSize="11" fontWeight="700"
            fontFamily="var(--mono, monospace)"
            fill={active ? 'var(--bg)' : color}>
        {label}
      </text>
    </g>
  );
}

export default function LSTMGatesViz() {
  const [tokensInput, setTokensInput] = useState(DEFAULT_TOKENS.join(' '));
  const [tokenIdx, setTokenIdx]       = useState(0);
  const [phaseIdx, setPhaseIdx]       = useState(0);
  const [running, setRunning]         = useState(false);
  const timerRef                      = useRef(null);

  // Maintain running state across user-driven steps.
  const [hPrev, setHPrev] = useState(() => new Array(DIM).fill(0));
  const [cPrev, setCPrev] = useState(() => new Array(DIM).fill(0));

  const tokens = useMemo(
    () => tokensInput.split(/\s+/).filter(Boolean).slice(0, 12),
    [tokensInput]
  );

  // Compute current step results from token. Even at idle we keep them around
  // for the readout (with zero-vector preview when before first step).
  const currentToken = tokens[tokenIdx] || tokens[tokens.length - 1] || 'x';
  const result = useMemo(
    () => step(currentToken, hPrev, cPrev),
    [currentToken, hPrev, cPrev]
  );

  const phase = PHASES[phaseIdx].id;

  // What to display in the gate strips depends on phase: before a gate "fires"
  // its strip is muted (raw pre-activations); after it has run its activation
  // strip is shown.
  const phaseRank = phaseIdx;
  const showForget    = phaseRank >= 1;
  const showInput     = phaseRank >= 2;
  const showCandidate = phaseRank >= 3;
  const showBlend     = phaseRank >= 4;
  const showOutput    = phaseRank >= 5;
  const showHidden    = phaseRank >= 6;

  // Live c_new / h_new based on what has fired so far. Before blend, c stays at c_prev.
  const cLive = showBlend ? result.cNew : cPrev;
  const hLive = showHidden ? result.hNew : hPrev;

  // f/i/g/o displayed values: muted neutral if gate hasn't fired yet.
  const neutral = new Array(DIM).fill(0);
  const fDisp = showForget    ? result.f : neutral;
  const iDisp = showInput     ? result.i : neutral;
  const gDisp = showCandidate ? result.g : neutral;
  const oDisp = showOutput    ? result.o : neutral;

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleStep = useCallback(() => {
    if (running) return;
    if (phaseIdx >= PHASES.length - 1) {
      // Commit step: move state forward, advance token.
      setHPrev(result.hNew);
      setCPrev(result.cNew);
      setTokenIdx((t) => Math.min(tokens.length - 1, t + 1));
      setPhaseIdx(0);
      return;
    }
    setRunning(true);
    let p = phaseIdx;
    const tick = () => {
      p = Math.min(PHASES.length - 1, p + 1);
      setPhaseIdx(p);
      if (p >= PHASES.length - 1) {
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, 60);
  }, [phaseIdx, result, running, tokens.length]);

  const handleRunAll = useCallback(() => {
    if (running) return;
    setRunning(true);
    // Walk the entire sequence forward, advancing phases token-by-token.
    let tIdx = tokenIdx;
    let h = hPrev;
    let c = cPrev;
    let p = phaseIdx;
    const tick = () => {
      if (p < PHASES.length - 1) {
        p += 1;
        setPhaseIdx(p);
        timerRef.current = setTimeout(tick, STEP_DELAY * 0.7);
        return;
      }
      // commit
      const r = step(tokens[tIdx] || currentToken, h, c);
      h = r.hNew; c = r.cNew;
      setHPrev(h); setCPrev(c);
      if (tIdx < tokens.length - 1) {
        tIdx += 1;
        setTokenIdx(tIdx);
        p = 0;
        setPhaseIdx(0);
        timerRef.current = setTimeout(tick, STEP_DELAY * 0.6);
      } else {
        setRunning(false);
      }
    };
    timerRef.current = setTimeout(tick, 80);
  }, [running, tokenIdx, hPrev, cPrev, phaseIdx, tokens, currentToken]);

  const handleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setRunning(false);
    setTokenIdx(0);
    setPhaseIdx(0);
    setHPrev(new Array(DIM).fill(0));
    setCPrev(new Array(DIM).fill(0));
  }, []);

  const handleRandom = useCallback(() => {
    if (running) return;
    const pool = [
      'Open a door softly',
      'The mouse chased a cat',
      'Quiet rain fell at noon',
      'A bright star fell west',
      'Birds sing before dawn',
      'Cold winds carry old songs',
    ];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setTokensInput(pick);
    handleReset();
  }, [running, handleReset]);

  // Layout. The cell is centred; the 4 gates are stacked on the left of the
  // arithmetic spine. State vectors c and h sit at top and right.
  const padX = 30;
  const cellX = padX + 220;
  const cellY = 90;
  const cellW = 340;
  const cellH = 280;

  // gate placement inside the cell
  const gateW = 88;
  const gateH = 78;
  const gateGap = 12;
  const gatesY = cellY + 36;
  // 4 vertically-stacked gates would be too tall — use 2x2 grid.
  const gateCol0 = cellX + 18;
  const gateCol1 = cellX + 18 + gateW + gateGap;
  const gateRow0 = gatesY;
  const gateRow1 = gatesY + gateH + gateGap;

  // multiply / sum nodes on the spine (right side of cell)
  const spineX = cellX + cellW - 50;
  const fMulY  = cellY + 44;          // f * c_prev
  const iMulY  = cellY + 110;         // i * g
  const sumY   = cellY + 160;         // c_new = above + below
  const tanhY  = cellY + 200;         // tanh(c_new)
  const oMulY  = cellY + 230;         // o * tanh(c_new) -> h_new

  // input rail (left of cell)
  const inputRailX = padX + 60;
  // top/bottom state vectors
  const cBarX = cellX + cellW - 160;
  const cBarY = cellY - 70;
  const hBarX = cellX + cellW + 60;
  const hBarY = cellY + cellH / 2 + 40;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg"
             style={{ maxWidth: 760, aspectRatio: `${W} / ${H}` }}>
          <defs>
            <marker id="lstm-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>

          {/* Side labels */}
          <text x={12} y={20} fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)" letterSpacing="0.14em">
            LSTM CELL — 4 GATES, 1 STATE
          </text>
          <text x={W - 12} y={20} fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)" textAnchor="end" letterSpacing="0.14em">
            dim = {DIM}
          </text>

          {/* Cell container */}
          <rect x={cellX} y={cellY} width={cellW} height={cellH} rx={14}
                fill="var(--surface)" opacity={0.55}
                stroke="var(--border)" strokeWidth={1.2} strokeDasharray="5 4" />
          <text x={cellX + 14} y={cellY + 18} fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)" letterSpacing="0.12em">
            CELL
          </text>

          {/* Token list (sequence rail) */}
          <g>
            <text x={padX} y={cellY - 50} fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)" letterSpacing="0.12em">
              SEQUENCE
            </text>
            {tokens.map((t, k) => {
              const tx = padX + k * 56;
              const ty = cellY - 36;
              const isCur = k === tokenIdx;
              const isPast = k < tokenIdx;
              return (
                <g key={`${t}-${k}`}>
                  <rect x={tx} y={ty} width={50} height={26} rx={6}
                        fill={isCur ? 'rgba(var(--accent-rgb, 0, 255, 245), 0.18)' : 'var(--bg)'}
                        stroke={isCur ? 'var(--accent)' : 'var(--border)'}
                        strokeWidth={isCur ? 1.6 : 1}
                        opacity={isPast ? 0.55 : 1} />
                  <text x={tx + 25} y={ty + 17} textAnchor="middle"
                        fontSize="11"
                        fontFamily="var(--serif, serif)"
                        fontStyle="italic" fontWeight="700"
                        fill={isCur ? 'var(--accent)' : 'var(--text-main)'}>
                    {t}
                  </text>
                </g>
              );
            })}
          </g>

          {/* x_t input pill — feeds into all gates */}
          <g>
            <rect x={inputRailX - 30} y={cellY + cellH / 2 - 16}
                  width={60} height={32} rx={16}
                  fill="rgba(var(--accent-rgb, 0, 255, 245), 0.12)"
                  stroke="var(--accent)" strokeWidth={1.4} />
            <text x={inputRailX} y={cellY + cellH / 2 + 5}
                  textAnchor="middle" fontSize="13"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic" fontWeight="700"
                  fill="var(--accent)">
              x_t
            </text>
            <text x={inputRailX} y={cellY + cellH / 2 + 28}
                  textAnchor="middle" fontSize="9"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)">
              {currentToken}
            </text>
          </g>

          {/* h_{t-1} pill (loops in from below) */}
          <g>
            <rect x={inputRailX - 30} y={cellY + cellH + 22}
                  width={60} height={28} rx={14}
                  fill="rgba(245, 165, 36, 0.12)"
                  stroke={COLORS.hidden} strokeWidth={1.2} />
            <text x={inputRailX} y={cellY + cellH + 41}
                  textAnchor="middle" fontSize="12"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic" fontWeight="700"
                  fill={COLORS.hidden}>
              h_t-1
            </text>
          </g>

          {/* Arrows from inputs to each gate */}
          {[
            { y: gateRow0 + gateH / 2, color: COLORS.forget,    active: phase === 'forget' },
            { y: gateRow0 + gateH / 2, color: COLORS.input,     active: phase === 'input' },
            { y: gateRow1 + gateH / 2, color: COLORS.candidate, active: phase === 'candidate' },
            { y: gateRow1 + gateH / 2, color: COLORS.output,    active: phase === 'output' },
          ].map((row, k) => {
            const targetX = k % 2 === 0 ? gateCol0 : gateCol1;
            return (
              <g key={k} style={{ color: row.color }}>
                <Arrow x1={inputRailX + 30} y1={cellY + cellH / 2}
                       x2={targetX} y2={row.y}
                       color={row.color} active={row.active} />
              </g>
            );
          })}
          {/* h_{t-1} into gates */}
          <g style={{ color: COLORS.hidden }}>
            <Arrow x1={inputRailX + 30} y1={cellY + cellH + 36}
                   x2={gateCol0 + 6} y2={gateRow1 + gateH + 8}
                   color={COLORS.hidden} dashed />
          </g>

          {/* Gates: 2x2 grid */}
          <g onClick={() => setPhaseIdx(1)} style={{ cursor: 'pointer' }}>
            <GateBlock x={gateCol0} y={gateRow0} w={gateW} h={gateH}
                       title="forget" op="σ" values={fDisp}
                       color={COLORS.forget}
                       active={phase === 'forget' || showBlend} />
          </g>
          <g onClick={() => setPhaseIdx(2)} style={{ cursor: 'pointer' }}>
            <GateBlock x={gateCol1} y={gateRow0} w={gateW} h={gateH}
                       title="input" op="σ" values={iDisp}
                       color={COLORS.input}
                       active={phase === 'input' || showBlend} />
          </g>
          <g onClick={() => setPhaseIdx(3)} style={{ cursor: 'pointer' }}>
            <GateBlock x={gateCol0} y={gateRow1} w={gateW} h={gateH}
                       title="candidate" op="tanh" values={gDisp}
                       color={COLORS.candidate}
                       active={phase === 'candidate' || showBlend} />
          </g>
          <g onClick={() => setPhaseIdx(5)} style={{ cursor: 'pointer' }}>
            <GateBlock x={gateCol1} y={gateRow1} w={gateW} h={gateH}
                       title="output" op="σ" values={oDisp}
                       color={COLORS.output}
                       active={phase === 'output' || showHidden} />
          </g>

          {/* Cell-state c_{t-1} bar chart entering from top */}
          <BarChart x={cBarX} y={cBarY} w={150} h={50}
                    values={cPrev} color={COLORS.cell}
                    label="c_t-1" sublabel="cell state"
                    accent={COLORS.cell} />

          {/* Arithmetic spine */}
          {/* f -> mul with c_prev */}
          <Arrow x1={gateCol1 + gateW} y1={gateRow0 + gateH / 2}
                 x2={spineX - 10} y2={fMulY}
                 color={COLORS.forget} active={showBlend} />
          <Arrow x1={cBarX + 75} y1={cBarY + 50}
                 x2={spineX} y2={fMulY - 12}
                 color={COLORS.cell} active={showBlend} />
          <Op cx={spineX} cy={fMulY} label="×" color={COLORS.forget} active={showBlend} />

          {/* i -> mul with g */}
          <Arrow x1={gateCol1 + gateW} y1={gateRow0 + gateH * 0.85}
                 x2={spineX - 10} y2={iMulY - 4}
                 color={COLORS.input} active={showBlend} />
          <Arrow x1={gateCol1 + gateW} y1={gateRow1 + gateH / 2}
                 x2={spineX - 10} y2={iMulY + 6}
                 color={COLORS.candidate} active={showBlend} />
          <Op cx={spineX} cy={iMulY} label="×" color={COLORS.input} active={showBlend} />

          {/* sum -> c_new */}
          <Arrow x1={spineX} y1={fMulY + 12}
                 x2={spineX} y2={sumY - 11}
                 color={COLORS.cell} active={showBlend} />
          <Arrow x1={spineX} y1={iMulY + 12}
                 x2={spineX} y2={sumY - 11}
                 color={COLORS.cell} active={showBlend} />
          <Op cx={spineX} cy={sumY} label="+" color={COLORS.cell} active={showBlend} />

          {/* c_new label tag */}
          <g>
            <rect x={spineX + 18} y={sumY - 12} width={62} height={22} rx={6}
                  fill={showBlend ? 'rgba(0,0,0,0)' : 'var(--surface)'}
                  stroke={showBlend ? COLORS.cell : 'var(--border)'}
                  strokeWidth={showBlend ? 1.6 : 1}
                  opacity={showBlend ? 1 : 0.6} />
            {showBlend && (
              <rect x={spineX + 18} y={sumY - 12} width={62} height={22} rx={6}
                    fill={COLORS.cell} opacity={0.15} />
            )}
            <text x={spineX + 49} y={sumY + 3} textAnchor="middle"
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic" fontWeight="700"
                  fill={showBlend ? COLORS.cell : 'var(--text-dim)'}>
              c_t
            </text>
          </g>

          {/* tanh(c_new) on the way down to output mul */}
          <Arrow x1={spineX} y1={sumY + 11}
                 x2={spineX} y2={tanhY - 10}
                 color={COLORS.cell} active={showHidden} />
          <Op cx={spineX} cy={tanhY} label="t" color={COLORS.cell} active={showHidden} />
          <text x={spineX + 18} y={tanhY + 3} fontSize="9"
                fontFamily="var(--mono, monospace)"
                fill={showHidden ? COLORS.cell : 'var(--text-dim)'}
                opacity={showHidden ? 1 : 0.6}>
            tanh
          </text>

          {/* o * tanh(c_new) */}
          <Arrow x1={spineX} y1={tanhY + 11}
                 x2={spineX} y2={oMulY - 11}
                 color={COLORS.cell} active={showHidden} />
          <Arrow x1={gateCol1 + gateW} y1={gateRow1 + gateH * 0.6}
                 x2={spineX - 10} y2={oMulY - 4}
                 color={COLORS.output} active={showHidden} />
          <Op cx={spineX} cy={oMulY} label="×" color={COLORS.output} active={showHidden} />

          {/* h_new output to right */}
          <Arrow x1={spineX + 11} y1={oMulY}
                 x2={hBarX - 10} y2={hBarY + 10}
                 color={COLORS.hidden} active={showHidden} />

          {/* c_new also exits to the right (next timestep) */}
          <Arrow x1={spineX + 11} y1={sumY}
                 x2={cellX + cellW + 18} y2={sumY}
                 color={COLORS.cell} active={showBlend} />
          <text x={cellX + cellW + 22} y={sumY - 4}
                fontSize="9" fontFamily="var(--mono, monospace)"
                fill={COLORS.cell} opacity={showBlend ? 1 : 0.6}>
            to t+1
          </text>

          {/* Live state vectors on the right */}
          <BarChart x={hBarX} y={hBarY} w={130} h={56}
                    values={hLive} color={COLORS.hidden}
                    label="h_t" sublabel="hidden / output"
                    accent={COLORS.hidden} />
          <BarChart x={hBarX} y={hBarY + 82} w={130} h={56}
                    values={cLive} color={COLORS.cell}
                    label="c_t" sublabel="next cell"
                    accent={COLORS.cell} />

          {/* Phase strip */}
          <g>
            <rect x={padX} y={H - 36} width={W - padX * 2} height={24} rx={6}
                  fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
            <text x={padX + 10} y={H - 19} fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--accent)" letterSpacing="0.12em">
              PHASE
            </text>
            <text x={padX + 64} y={H - 19} fontSize="11"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-main)">
              {PHASES[phaseIdx].label}
            </text>
            <text x={W - padX - 10} y={H - 19} fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)" textAnchor="end">
              {Math.min(tokenIdx + 1, tokens.length)} / {tokens.length}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLORS.forget }}>f</span>
          <span className="mlviz-val">[{fDisp.map(v => v.toFixed(2)).join(', ')}]</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLORS.input }}>i</span>
          <span className="mlviz-val">[{iDisp.map(v => v.toFixed(2)).join(', ')}]</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLORS.candidate }}>g</span>
          <span className="mlviz-val">[{gDisp.map(v => v.toFixed(2)).join(', ')}]</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLORS.output }}>o</span>
          <span className="mlviz-val">[{oDisp.map(v => v.toFixed(2)).join(', ')}]</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLORS.cell }}>c_t</span>
          <span className="mlviz-val">[{cLive.map(v => v.toFixed(2)).join(', ')}]</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLORS.hidden }}>h_t</span>
          <span className="mlviz-val">[{hLive.map(v => v.toFixed(2)).join(', ')}]</span>
        </div>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{
            color: 'var(--text-dim)', fontFamily: 'var(--mono)',
            fontStyle: 'normal', fontSize: '0.72rem', letterSpacing: '0.12em'
          }}>
            SEQUENCE
          </span>
          <input
            type="text"
            value={tokensInput}
            onChange={(e) => { setTokensInput(e.target.value); }}
            disabled={running}
            className="ah-input"
            style={{ minWidth: 0, flex: 1 }}
            placeholder="Open a door softly"
          />
        </div>
        <div className="mlviz-row mlviz-btn-row">
          <button type="button"
                  className="mlviz-btn mlviz-btn-primary"
                  onClick={handleStep}
                  disabled={running}>
            <SkipForward size={13} />
            <span>{phaseIdx >= PHASES.length - 1 ? 'Next token' : 'Step'}</span>
          </button>
          <button type="button"
                  className="mlviz-btn"
                  onClick={handleRunAll}
                  disabled={running}>
            <Play size={13} />
            <span>Run all</span>
          </button>
          <button type="button"
                  className="mlviz-btn"
                  onClick={handleRandom}
                  disabled={running}>
            <Shuffle size={13} />
            <span>Random</span>
          </button>
          <button type="button"
                  className="mlviz-btn"
                  onClick={handleReset}
                  disabled={running}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
        <div className="mlviz-hint">
          each Step advances one phase: forget → input → candidate → blend → output → hidden. when phases are done, Step commits c_t, h_t and feeds the next token.
        </div>
      </div>
    </div>
  );
}
