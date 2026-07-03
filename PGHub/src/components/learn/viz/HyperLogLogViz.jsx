import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Zap,
} from 'lucide-react';
import './HyperLogLogViz.css';

const STEP_MS = 760;
const HASH_BITS = 48;
const P_MIN = 3;
const P_MAX = 6;
const DEFAULT_P = 4;
// Pre-loaded distinct tokens so a few registers already hold meaningful ranks.
const INITIAL_STREAM = [
  'user-7',
  'session-42',
  'k-1009',
  'event-88',
  'user-7',
  'token-x',
  'k-1009',
  'order-555',
];

// 32-bit avalanche so sequential tokens ("item-1", "item-2") don't correlate.
function mix32(h) {
  let x = h >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}

function fnv1a(str, salt) {
  let h = (0x811c9dc5 ^ (salt * 0x01000193)) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return mix32(h ^ (salt * 0x9e3779b9));
}

// 48-bit hash as a safe JS Number, built from two independent 32-bit hashes.
function hash48(str) {
  const a = fnv1a(str, 1);
  const b = fnv1a(str, 2) & 0xffff;
  return a * 65536 + b;
}

function bitAt(val, i) {
  return Math.floor(val / Math.pow(2, i)) % 2;
}

// MSB-first bit string of `width` bits.
function bitString(val, width) {
  let s = '';
  for (let i = width - 1; i >= 0; i--) s += bitAt(val, i);
  return s;
}

function alphaFor(m) {
  if (m === 16) return 0.673;
  if (m === 32) return 0.697;
  if (m === 64) return 0.709;
  return 0.7213 / (1 + 1.079 / m);
}

// Decompose one token: top p bits = register index, leading zeros of the
// remainder (+1) = the rank that register stores the max of.
function decompose(token, p) {
  const remBits = HASH_BITS - p;
  const h = hash48(String(token));
  const idx = Math.floor(h / Math.pow(2, remBits));
  const rem = h % Math.pow(2, remBits);
  let rank = 1;
  let i = remBits - 1;
  while (i >= 0 && bitAt(rem, i) === 0) {
    rank += 1;
    i -= 1;
  }
  return {
    h,
    idx,
    rem,
    rank,
    remBits,
    idxBits: bitString(idx, p),
    remBitsStr: bitString(rem, remBits),
  };
}

function emptyReg(m) {
  return new Array(m).fill(0);
}

// Replay the whole stream into a fresh register array (keeps it consistent
// with the current p / m at all times).
function buildRegisters(stream, p) {
  const m = 1 << p;
  const reg = emptyReg(m);
  for (const tok of stream) {
    const { idx, rank } = decompose(tok, p);
    if (rank > reg[idx]) reg[idx] = rank;
  }
  return reg;
}

function trueDistinct(stream) {
  return new Set(stream).size;
}

// HyperLogLog harmonic-mean estimator with small-range correction.
function estimateFromReg(reg) {
  const m = reg.length;
  const alpha = alphaFor(m);
  let sum = 0;
  let zeros = 0;
  for (const v of reg) {
    sum += Math.pow(2, -v);
    if (v === 0) zeros += 1;
  }
  let est = (alpha * m * m) / sum;
  if (est <= 2.5 * m && zeros > 0) {
    est = m * Math.log(m / zeros);
  }
  return est;
}

function cloneReg(reg) {
  return reg.slice();
}

// Build the per-item animation: hash -> reveal index bits -> reveal rank ->
// update register to the max.
function buildAddFrames(reg, token, p) {
  const d = decompose(token, p);
  const before = reg[d.idx];
  const after = Math.max(before, d.rank);
  const frames = [];

  frames.push({
    reg: cloneReg(reg),
    token,
    decomp: d,
    phase: 'hash',
    activeIdx: null,
    label: `hash("${token}") -> ${d.idxBits} | ${d.remBitsStr}. First ${p} bits pick the register, the rest gives the rank.`,
  });

  frames.push({
    reg: cloneReg(reg),
    token,
    decomp: d,
    phase: 'index',
    activeIdx: d.idx,
    label: `index bits ${d.idxBits} = ${d.idx} -> register[${d.idx}] (currently ${before}).`,
  });

  frames.push({
    reg: cloneReg(reg),
    token,
    decomp: d,
    phase: 'rank',
    activeIdx: d.idx,
    label: `remainder ${d.remBitsStr} has ${d.rank - 1} leading zero${d.rank - 1 === 1 ? '' : 's'} -> rank = ${d.rank}.`,
  });

  const next = cloneReg(reg);
  next[d.idx] = after;
  const changed = after > before;
  frames.push({
    reg: next,
    token,
    decomp: d,
    phase: 'update',
    activeIdx: d.idx,
    label: changed
      ? `register[${d.idx}] = max(${before}, ${d.rank}) = ${after} — new high-water mark.`
      : `register[${d.idx}] = max(${before}, ${d.rank}) = ${before} — unchanged, kept the larger rank.`,
  });

  return { frames, finalReg: next };
}

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const r = Math.round(n);
  if (r < min) return min;
  if (r > max) return max;
  return r;
}

function regLayout(m) {
  const barW = m <= 8 ? 52 : m <= 16 ? 40 : m <= 32 ? 26 : 16;
  const gap = m <= 16 ? 8 : m <= 32 ? 5 : 3;
  const padX = 40;
  const padTop = 24;
  const plotH = 150;
  const baseLabel = 40;
  const width = padX * 2 + m * barW + (m - 1) * gap;
  const height = padTop + plotH + baseLabel;
  return { barW, gap, padX, padTop, plotH, baseLabel, width, height };
}

// Distinct synthetic tokens for the "add a million" bulk demo.
function bulkTokens(start, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(`bulk-${start + i}`);
  return out;
}

export default function HyperLogLogViz() {
  const [p, setP] = useState(DEFAULT_P);
  const [stream, setStream] = useState(() => [...INITIAL_STREAM]);
  const [addInput, setAddInput] = useState('page-view-99');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [, setPendingTok] = useState(null);
  const [operation, setOperation] = useState(
    'Pre-loaded with 8 tokens (6 distinct). Add a token to watch its bits split into an index and a rank.',
  );
  const [bulkExtra, setBulkExtra] = useState(0);
  const playRef = useRef(null);

  const m = 1 << p;
  const remBits = HASH_BITS - p;

  // Live registers derived from the stream + current p — always consistent.
  const liveReg = useMemo(() => buildRegisters(stream, p), [stream, p]);
  const baseDistinct = useMemo(() => trueDistinct(stream), [stream]);

  const currentFrame = idx >= 0 && idx < frames.length ? frames[idx] : null;
  // Derive `playing` from bounds so the auto-run effect never calls setPlaying.
  const playing = playingRaw && idx >= 0 && idx < frames.length - 1;

  const renderReg = currentFrame ? currentFrame.reg : liveReg;
  const layout = useMemo(() => regLayout(m), [m]);

  // The bulk button injects `bulkExtra` distinct tokens into the count math
  // without storing a million strings in React state.
  const bulkReg = useMemo(() => {
    if (bulkExtra === 0) return liveReg;
    const reg = cloneReg(liveReg);
    for (const tok of bulkTokens(0, bulkExtra)) {
      const { idx: ri, rank } = decompose(tok, p);
      if (rank > reg[ri]) reg[ri] = rank;
    }
    return reg;
  }, [liveReg, bulkExtra, p]);

  const effectiveReg = currentFrame ? liveReg : bulkReg;
  const trueCount = baseDistinct + bulkExtra;
  const estimate = useMemo(() => estimateFromReg(effectiveReg), [effectiveReg]);
  const relErr = trueCount === 0 ? 0 : ((estimate - trueCount) / trueCount) * 100;
  const stdErr = (1.04 / Math.sqrt(m)) * 100;

  const maxRank = Math.max(1, ...renderReg);

  const commitPendingTok = useCallback(() => {
    setPendingTok((current) => {
      if (current !== null) setStream((prev) => [...prev, current]);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    playRef.current = setTimeout(() => {
      setIdx((i) => {
        const next = i + 1;
        if (next === frames.length - 1) commitPendingTok();
        return next;
      });
    }, Math.round(STEP_MS / speed));
    return () => clearTimeout(playRef.current);
  }, [playing, idx, speed, frames, commitPendingTok]);

  const startFrames = useCallback(
    (newFrames) => {
      setFrames(newFrames);
      setIdx(0);
      setPlaying(true);
      if (newFrames.length <= 1) commitPendingTok();
    },
    [commitPendingTok],
  );

  const onAdd = useCallback(() => {
    const tok = String(addInput).trim();
    if (!tok) {
      setOperation('Add: enter a non-empty token.');
      return;
    }
    const { frames: fs } = buildAddFrames(liveReg, tok, p);
    setPendingTok(tok);
    setOperation(`Add "${tok}"`);
    startFrames(fs);
  }, [addInput, liveReg, p, startFrames]);

  const onBulk = useCallback(() => {
    setPlaying(false);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setBulkExtra((prev) => prev + 1_000_000);
    setOperation(
      'Folded in 1,000,000 distinct tokens at once — the estimate tracks millions while only m registers stay in memory.',
    );
  }, []);

  const onReset = useCallback(() => {
    setPlaying(false);
    setStream([...INITIAL_STREAM]);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setBulkExtra(0);
    setOperation('Reset to the default 8-token stream.');
  }, []);

  const onClear = useCallback(() => {
    setPlaying(false);
    setStream([]);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setBulkExtra(0);
    setOperation('Cleared — every register is zero, estimate is 0.');
  }, []);

  const onPChange = (e) => {
    const v = clampInt(e.target.value, P_MIN, P_MAX, DEFAULT_P);
    setPlaying(false);
    setP(v);
    setFrames([]);
    setIdx(-1);
    setPendingTok(null);
    setOperation(
      `Precision p = ${v} -> m = ${1 << v} registers. Standard error ≈ 1.04/√m, so more registers tighten the estimate.`,
    );
  };

  const stepNext = () => {
    if (idx < frames.length - 1) {
      setIdx((i) => {
        const next = i + 1;
        if (next === frames.length - 1) commitPendingTok();
        return next;
      });
    }
  };
  const stepPrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };
  const togglePlay = () => {
    if (frames.length === 0) return;
    if (idx >= frames.length - 1) {
      setIdx(0);
      setPlaying(true);
    } else {
      setPlaying((pl) => !pl);
    }
  };

  const opLabel = currentFrame ? currentFrame.label : operation;
  const decomp = currentFrame ? currentFrame.decomp : null;
  const phase = currentFrame ? currentFrame.phase : null;
  const activeIdx = currentFrame ? currentFrame.activeIdx : null;
  const focusToken = currentFrame ? currentFrame.token : null;

  const step = idx + 1;
  const totalSteps = frames.length;

  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  // Which slice of the bit string is the index vs the rank's leading zeros.
  const rankZeros = decomp ? decomp.rank - 1 : 0;

  return (
    <div className="hll-root">
      <div className="hll-head">
        <div className="hll-title-block">
          <h3 className="hll-title">HyperLogLog</h3>
          <p className="hll-sub">
            Count distinct items in a few hundred bytes. Each item is hashed; the
            first p bits choose one of m registers, and the count of leading zeros
            in the rest sets that register&apos;s value to the running max. The
            harmonic mean of the registers estimates the cardinality.
          </p>
        </div>
      </div>

      <div className="hll-controls">
        <div className="hll-control-group">
          <label className="hll-input-label" htmlFor="hll-p">
            Precision p
          </label>
          <input
            id="hll-p"
            type="range"
            className="hll-range"
            min={P_MIN}
            max={P_MAX}
            step={1}
            value={p}
            onChange={onPChange}
          />
          <span className="hll-range-value">{p}</span>
          <span className="hll-range-aux">m = {m}</span>
        </div>

        <div className="hll-control-group">
          <label className="hll-input-label" htmlFor="hll-add">
            Add token
          </label>
          <input
            id="hll-add"
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAdd();
            }}
            className="hll-input"
            placeholder="token"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="hll-btn hll-btn-primary" onClick={onAdd}>
            <Plus size={14} /> Add
          </button>
        </div>

        <button type="button" className="hll-btn hll-btn-accent" onClick={onBulk}>
          <Zap size={14} /> Add 1,000,000 distinct
        </button>

        <div className="hll-control-spacer" />

        <label className="hll-speed">
          <span className="hll-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="hll-speed-range"
            aria-label="Playback speed"
          />
          <span className="hll-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <button
          type="button"
          className="hll-btn"
          onClick={stepPrev}
          disabled={frames.length === 0 || idx <= 0}
          aria-label="Previous step"
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="hll-btn"
          onClick={togglePlay}
          disabled={frames.length === 0}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          className="hll-btn"
          onClick={stepNext}
          disabled={frames.length === 0 || idx >= frames.length - 1}
          aria-label="Next step"
        >
          <SkipForward size={14} />
        </button>
        <button type="button" className="hll-btn" onClick={onClear}>
          Clear
        </button>
        <button type="button" className="hll-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Bit decomposition for the token currently in focus. */}
      <div className="hll-bits-row">
        <span className="hll-bits-label">
          {focusToken ? `hash("${focusToken}")` : `hash bits (${HASH_BITS}-bit)`}
        </span>
        {decomp ? (
          <div className="hll-bits">
            <span className="hll-bit-group hll-bit-index" title="register index bits">
              {decomp.idxBits}
            </span>
            <span className="hll-bit-sep">|</span>
            <span className="hll-bit-group hll-bit-rest">
              {decomp.remBitsStr.split('').map((b, i) => {
                const isLeadZero = i < rankZeros;
                const isOne = i === rankZeros;
                const cls = isLeadZero
                  ? 'hll-bit hll-bit-zero'
                  : isOne
                    ? 'hll-bit hll-bit-one'
                    : 'hll-bit';
                return (
                  <span key={`b-${i}`} className={cls}>
                    {b}
                  </span>
                );
              })}
            </span>
          </div>
        ) : (
          <span className="hll-bits-hint">
            Add a token to split its hash into {p} index bits and {remBits} rank bits.
          </span>
        )}
        {decomp && (
          <span className="hll-bits-readout">
            idx {decomp.idx} · rank {decomp.rank}
          </span>
        )}
      </div>

      <div className="hll-stage">
        <svg
          className="hll-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="HyperLogLog register array"
        >
          {renderReg.map((val, r) => {
            const x = layout.padX + r * (layout.barW + layout.gap);
            const h = (val / maxRank) * layout.plotH;
            const y = layout.padTop + (layout.plotH - h);
            const isActive = activeIdx === r;
            const showVal = val > 0;
            const labelEvery = m <= 16 ? 1 : m <= 32 ? 2 : 4;
            const cls = [
              'hll-bar',
              val > 0 ? 'hll-bar-set' : 'hll-bar-empty',
              isActive && phase === 'index' ? 'hll-bar-target' : '',
              isActive && phase === 'rank' ? 'hll-bar-target' : '',
              isActive && phase === 'update' ? 'hll-bar-update' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={`reg-${r}`} className={cls}>
                <rect
                  x={x}
                  y={layout.padTop}
                  width={layout.barW}
                  height={layout.plotH}
                  rx={4}
                  className="hll-bar-track"
                />
                <rect
                  x={x}
                  y={y}
                  width={layout.barW}
                  height={Math.max(showVal ? 3 : 0, h)}
                  rx={4}
                  className="hll-bar-fill"
                />
                {showVal && (
                  <text
                    x={x + layout.barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    className="hll-bar-val"
                  >
                    {val}
                  </text>
                )}
                {r % labelEvery === 0 && (
                  <text
                    x={x + layout.barW / 2}
                    y={layout.padTop + layout.plotH + 16}
                    textAnchor="middle"
                    className="hll-bar-idx"
                  >
                    {r}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="hll-formula-row">
        <span className="hll-formula-label">Estimate</span>
        <code className="hll-formula">
          E = α·m² / Σ 2^(−register[j])
        </code>
        <span className="hll-formula-sep">·</span>
        <code className="hll-formula hll-formula-result">
          α={alphaFor(m).toFixed(3)}, m={m}, std err ≈ {stdErr.toFixed(1)}%
        </code>
      </div>

      <div className="hll-footer">
        <div className="hll-stat hll-stat-emph">
          <span className="hll-stat-label">Estimate</span>
          <span className="hll-stat-value hll-stat-big">{fmt(estimate)}</span>
        </div>
        <div className="hll-stat">
          <span className="hll-stat-label">True distinct</span>
          <span className="hll-stat-value hll-stat-big">{fmt(trueCount)}</span>
        </div>
        <div className="hll-stat">
          <span className="hll-stat-label">Rel. error</span>
          <span className="hll-stat-value">
            {trueCount === 0 ? '—' : `${relErr >= 0 ? '+' : ''}${relErr.toFixed(1)}%`}
          </span>
        </div>
        <div className="hll-stat">
          <span className="hll-stat-label">Registers (m)</span>
          <span className="hll-stat-value">
            {m} × 6 bits ≈ {Math.ceil((m * 6) / 8)} bytes
          </span>
        </div>
        <div className="hll-stat">
          <span className="hll-stat-label">Current (idx, rank)</span>
          <span className="hll-stat-value">
            {decomp ? `(${decomp.idx}, ${decomp.rank})` : '—'}
          </span>
        </div>
        <div className="hll-stat">
          <span className="hll-stat-label">Step</span>
          <span className="hll-stat-value">
            {totalSteps === 0 ? '0 / 0' : `${step} / ${totalSteps}`}
          </span>
        </div>
        <div className="hll-stat hll-stat-grow">
          <span className="hll-stat-label">Current operation</span>
          <span className="hll-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
