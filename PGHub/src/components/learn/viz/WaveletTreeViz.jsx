import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, RotateCcw, Play, Pause, SkipForward } from 'lucide-react';
import './WaveletTreeViz.css';

const SVG_W = 760;
const SVG_H = 420;
const STEP_MS = 1100;

const PRESETS = [
  { label: 'A', arr: [3, 1, 4, 1, 5, 2, 6, 2] },
  { label: 'B', arr: [5, 3, 6, 1, 2, 4, 6, 3] },
  { label: 'C', arr: [2, 4, 1, 6, 5, 3, 1, 4] },
];

const ALPHA_LO = 1;
const ALPHA_HI = 6;

// Build the wavelet tree as a flat list of nodes.
// Each node: { id, lo, hi, values:[...], bits:[0|1], left, right, depth }
function buildTree(arr) {
  const nodes = [];
  function rec(values, lo, hi, depth) {
    const id = nodes.length;
    const node = { id, lo, hi, values, bits: [], left: -1, right: -1, depth };
    nodes.push(node);
    if (lo === hi) return id;
    const mid = Math.floor((lo + hi) / 2);
    const leftVals = [];
    const rightVals = [];
    node.bits = values.map((v) => {
      if (v <= mid) {
        leftVals.push(v);
        return 0;
      }
      rightVals.push(v);
      return 1;
    });
    node.left = rec(leftVals, lo, mid, depth + 1);
    node.right = rec(rightVals, mid + 1, hi, depth + 1);
    return id;
  }
  rec(arr, ALPHA_LO, ALPHA_HI, 0);
  return nodes;
}

// rank of bit b within bits[0..pos-1] (count of b in first `pos` entries)
function rankBit(bits, b, pos) {
  let c = 0;
  for (let i = 0; i < pos && i < bits.length; i++) {
    if (bits[i] === b) c += 1;
  }
  return c;
}

// Build query frames: k-th smallest in A[l..r] (1-indexed, inclusive) using descent.
function buildQueryFrames(nodes, A, l1, r1, k) {
  const frames = [];
  let nodeId = 0;
  // l, r are 1-indexed inclusive positions within the current node's value list
  let l = l1;
  let r = r1;
  let kRem = k;

  frames.push({
    nodeId: 0,
    lo: nodes[0].lo,
    hi: nodes[0].hi,
    l,
    r,
    k: kRem,
    zeros: null,
    decision: null,
    childEdge: null,
    answer: null,
    caption: `Query: ${k}-th smallest in A[${l1}..${r1}]. Start at the root covering values ${nodes[0].lo}..${nodes[0].hi} with the whole range [${l}, ${r}].`,
  });

  let guard = 0;
  while (guard < 40) {
    guard += 1;
    const node = nodes[nodeId];
    if (node.lo === node.hi) {
      frames.push({
        nodeId,
        lo: node.lo,
        hi: node.hi,
        l,
        r,
        k: kRem,
        zeros: null,
        decision: null,
        childEdge: null,
        answer: node.lo,
        caption: `Leaf reached: this node covers only value ${node.lo}. The answer is ${node.lo}.`,
      });
      return { frames, answer: node.lo };
    }
    const bits = node.bits;
    // zeros in [l..r] (1-indexed inclusive) = rankBit(0, r) - rankBit(0, l-1)
    const zerosBefore = rankBit(bits, 0, l - 1);
    const zerosThru = rankBit(bits, 0, r);
    const zerosInRange = zerosThru - zerosBefore;

    if (kRem <= zerosInRange) {
      // go left: remap l,r via zero-rank
      const nl = zerosBefore + 1;
      const nr = zerosThru;
      frames.push({
        nodeId,
        lo: node.lo,
        hi: node.hi,
        l,
        r,
        k: kRem,
        zeros: zerosInRange,
        decision: 'left',
        childEdge: { from: nodeId, to: node.left },
        answer: null,
        caption: `Zeros in [${l}, ${r}] = ${zerosInRange}. Since k=${kRem} <= ${zerosInRange}, the answer is in the lower half. Descend left; remap range to [${nl}, ${nr}].`,
      });
      l = nl;
      r = nr;
      nodeId = node.left;
    } else {
      // go right: k decreases by zeros, remap via one-rank
      const onesBefore = (l - 1) - zerosBefore;
      const onesThru = r - zerosThru;
      const nl = onesBefore + 1;
      const nr = onesThru;
      const nk = kRem - zerosInRange;
      frames.push({
        nodeId,
        lo: node.lo,
        hi: node.hi,
        l,
        r,
        k: kRem,
        zeros: zerosInRange,
        decision: 'right',
        childEdge: { from: nodeId, to: node.right },
        answer: null,
        caption: `Zeros in [${l}, ${r}] = ${zerosInRange}. Since k=${kRem} > ${zerosInRange}, skip the lower half. Descend right; k becomes ${nk}, remap range to [${nl}, ${nr}].`,
      });
      l = nl;
      r = nr;
      kRem = nk;
      nodeId = node.right;
    }
  }
  return { frames, answer: null };
}

// Tree layout: assign x by in-order leaf spread, y by depth.
function computeLayout(nodes) {
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const padX = 40;
  const padTop = 30;
  const usableW = SVG_W - padX * 2;
  const levelStep = maxDepth > 0 ? (SVG_H - padTop - 80) / maxDepth : 0;

  // Count leaves under each node for proportional spread.
  const leafCount = Array(nodes.length).fill(0);
  function countLeaves(id) {
    const n = nodes[id];
    if (n.left === -1 && n.right === -1) {
      leafCount[id] = 1;
      return 1;
    }
    let c = 0;
    if (n.left !== -1) c += countLeaves(n.left);
    if (n.right !== -1) c += countLeaves(n.right);
    leafCount[id] = c;
    return c;
  }
  countLeaves(0);

  const pos = Array(nodes.length).fill(null);
  const slot = usableW / Math.max(leafCount[0], 1);
  function place(id, leftX) {
    const n = nodes[id];
    const y = padTop + n.depth * levelStep;
    if (n.left === -1 && n.right === -1) {
      pos[id] = { x: leftX + slot / 2, y };
      return slot;
    }
    let used = 0;
    const childCenters = [];
    if (n.left !== -1) {
      const w = place(n.left, leftX + used);
      childCenters.push(pos[n.left].x);
      used += w;
    }
    if (n.right !== -1) {
      const w = place(n.right, leftX + used);
      childCenters.push(pos[n.right].x);
      used += w;
    }
    const center = (Math.min(...childCenters) + Math.max(...childCenters)) / 2;
    pos[id] = { x: center, y };
    return used;
  }
  place(0, padX);
  return pos;
}

function NodeBox({ node, x, y, active, onLrSlice }) {
  const vals = node.values;
  const n = vals.length;
  const cell = Math.min(26, n > 0 ? 150 / Math.max(n, 1) : 18);
  const boxW = Math.max(n * cell + 8, 28);
  const valH = 17;
  const bitH = node.bits.length > 0 ? 15 : 0;
  const totalH = valH + bitH + 6;
  const startX = x - boxW / 2;
  const slice = active ? onLrSlice : null;
  return (
    <g className={`wtviz-node ${active ? 'wtviz-node-active' : ''}`}>
      <rect
        className="wtviz-node-box"
        x={startX}
        y={y - totalH / 2}
        width={boxW}
        height={totalH}
        rx="4"
      />
      {vals.map((v, i) => {
        const cx = startX + 4 + i * cell + cell / 2;
        const inSlice = slice && i >= slice.l - 1 && i <= slice.r - 1;
        return (
          <text
            key={`v-${i}`}
            className={`wtviz-val ${inSlice ? 'wtviz-val-slice' : ''}`}
            x={cx}
            y={y - totalH / 2 + valH / 2 + 4}
            textAnchor="middle"
          >
            {v}
          </text>
        );
      })}
      {node.bits.map((b, i) => {
        const cx = startX + 4 + i * cell + cell / 2;
        const inSlice = slice && i >= slice.l - 1 && i <= slice.r - 1;
        return (
          <text
            key={`b-${i}`}
            className={`wtviz-bit wtviz-bit-${b} ${inSlice ? 'wtviz-bit-slice' : ''}`}
            x={cx}
            y={y - totalH / 2 + valH + bitH / 2 + 4}
            textAnchor="middle"
          >
            {b}
          </text>
        );
      })}
      <text className="wtviz-range-tag" x={x} y={y + totalH / 2 + 11} textAnchor="middle">
        [{node.lo},{node.hi}]
      </text>
    </g>
  );
}

export default function WaveletTreeViz() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [lVal, setLVal] = useState('2');
  const [rVal, setRVal] = useState('7');
  const [kVal, setKVal] = useState('3');
  const [frames, setFrames] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const A = PRESETS[presetIdx].arr;
  const nodes = useMemo(() => buildTree(A), [A]);
  const positions = useMemo(() => computeLayout(nodes), [nodes]);

  const currentFrame = frames.length > 0 ? frames[idx] : null;
  const atEnd = frames.length === 0 || idx >= frames.length - 1;
  const playing = playingRaw && frames.length > 0 && idx < frames.length - 1;
  const delay = Math.round(STEP_MS / speed);

  const next = useCallback(() => {
    setIdx((i) => (i >= frames.length - 1 ? i : i + 1));
  }, [frames.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => next(), delay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next, delay]);

  const parseInRange = (raw, min, max) => {
    const v = Number.parseInt(raw, 10);
    if (Number.isNaN(v) || v < min || v > max) return null;
    return v;
  };

  const runQuery = () => {
    const n = A.length;
    const l = parseInRange(lVal, 1, n);
    const r = parseInRange(rVal, 1, n);
    if (l === null || r === null || l > r) return;
    const span = r - l + 1;
    const k = parseInRange(kVal, 1, span);
    if (k === null) return;
    const built = buildQueryFrames(nodes, A, l, r, k);
    setFrames(built.frames);
    setIdx(0);
    setPlaying(true);
  };

  const handlePreset = (i) => {
    setPresetIdx(i);
    setPlaying(false);
    setFrames([]);
    setIdx(0);
  };

  const handleReset = () => {
    setPlaying(false);
    setFrames([]);
    setIdx(0);
  };

  const activeNodeId = currentFrame ? currentFrame.nodeId : -1;
  const activeEdge = currentFrame ? currentFrame.childEdge : null;
  const lrSlice = currentFrame ? { l: currentFrame.l, r: currentFrame.r } : null;

  // edges for rendering
  const edges = useMemo(() => {
    const list = [];
    nodes.forEach((n) => {
      if (n.left !== -1) list.push({ from: n.id, to: n.left, key: `${n.id}-L` });
      if (n.right !== -1) list.push({ from: n.id, to: n.right, key: `${n.id}-R` });
    });
    return list;
  }, [nodes]);

  const answer = currentFrame ? currentFrame.answer : null;

  const fmt = (v) => (v === null || v === undefined ? '—' : String(v));

  return (
    <div className="wtviz">
      <div className="wtviz-header">
        <div className="wtviz-title">Wavelet tree — range k-th smallest</div>
        <div className="wtviz-stats">
          <span className="wtviz-stat-label">Alphabet</span>
          <span className="wtviz-stat-value">{ALPHA_LO}..{ALPHA_HI}</span>
        </div>
      </div>

      <div className="wtviz-ops">
        <div className="wtviz-op">
          <span className="wtviz-op-label">Array</span>
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              className={`wtviz-btn ${i === presetIdx ? 'wtviz-btn-primary' : 'wtviz-btn-ghost'}`}
              onClick={() => handlePreset(i)}
              disabled={playing}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="wtviz-array">
          {A.map((v, i) => (
            <span
              key={`a-${i}`}
              className={`wtviz-acell ${
                currentFrame && i + 1 >= Number(lVal) && i + 1 <= Number(rVal) ? 'wtviz-acell-hi' : ''
              }`}
            >
              <span className="wtviz-acell-idx">{i + 1}</span>
              <span className="wtviz-acell-val">{v}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="wtviz-ops">
        <div className="wtviz-op">
          <span className="wtviz-op-label">l</span>
          <input
            className="wtviz-input"
            type="number"
            min="1"
            max={A.length}
            value={lVal}
            onChange={(e) => setLVal(e.target.value)}
            aria-label="Range left"
          />
          <span className="wtviz-op-label">r</span>
          <input
            className="wtviz-input"
            type="number"
            min="1"
            max={A.length}
            value={rVal}
            onChange={(e) => setRVal(e.target.value)}
            aria-label="Range right"
          />
          <span className="wtviz-op-label">k</span>
          <input
            className="wtviz-input"
            type="number"
            min="1"
            max={A.length}
            value={kVal}
            onChange={(e) => setKVal(e.target.value)}
            aria-label="k-th smallest"
          />
          <button
            type="button"
            className="wtviz-btn wtviz-btn-primary"
            onClick={runQuery}
            disabled={playing}
          >
            <Search size={14} />
            <span>Query</span>
          </button>
        </div>
        <button
          type="button"
          className="wtviz-btn wtviz-btn-ghost"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="wtviz-body">
        <div className="wtviz-stage">
          <svg
            className="wtviz-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Wavelet tree visualization"
          >
            <g className="wtviz-edges">
              {edges.map((e) => {
                const a = positions[e.from];
                const b = positions[e.to];
                if (!a || !b) return null;
                const active =
                  activeEdge && activeEdge.from === e.from && activeEdge.to === e.to;
                return (
                  <line
                    key={e.key}
                    className={`wtviz-edge ${active ? 'wtviz-edge-active' : ''}`}
                    x1={a.x}
                    y1={a.y + 18}
                    x2={b.x}
                    y2={b.y - 18}
                  />
                );
              })}
            </g>
            <g className="wtviz-nodes">
              {nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                return (
                  <NodeBox
                    key={n.id}
                    node={n}
                    x={p.x}
                    y={p.y}
                    active={n.id === activeNodeId}
                    onLrSlice={lrSlice}
                  />
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="wtviz-sidebar">
          <div className="wtviz-panel">
            <div className="wtviz-panel-label">Node range [lo,hi]</div>
            <div className="wtviz-panel-value">
              {currentFrame ? `[${currentFrame.lo}, ${currentFrame.hi}]` : '—'}
            </div>
          </div>
          <div className="wtviz-panel">
            <div className="wtviz-panel-label">Slice [l,r] in node</div>
            <div className="wtviz-panel-value">
              {currentFrame ? `[${currentFrame.l}, ${currentFrame.r}]` : '—'}
            </div>
          </div>
          <div className="wtviz-panel">
            <div className="wtviz-panel-label">k remaining</div>
            <div className="wtviz-panel-value">{currentFrame ? fmt(currentFrame.k) : '—'}</div>
          </div>
          <div className="wtviz-panel">
            <div className="wtviz-panel-label">zeros in range</div>
            <div className="wtviz-panel-value">{currentFrame ? fmt(currentFrame.zeros) : '—'}</div>
          </div>
          <div className="wtviz-panel">
            <div className="wtviz-panel-label">decision</div>
            <div className="wtviz-panel-value wtviz-decision">
              {currentFrame ? fmt(currentFrame.decision) : '—'}
            </div>
          </div>
          <div className="wtviz-panel wtviz-panel-answer">
            <div className="wtviz-panel-label">answer</div>
            <div className="wtviz-panel-value wtviz-answer">{fmt(answer)}</div>
          </div>
        </aside>
      </div>

      <p className="wtviz-caption">
        {currentFrame
          ? currentFrame.caption
          : 'Each node holds the values in its range and a bitvector marking 0 = lower half, 1 = upper half. Pick l, r, k and run a query to descend the tree.'}
      </p>

      <div className="wtviz-controls">
        <button
          type="button"
          className="wtviz-btn wtviz-btn-ghost"
          onClick={() => {
            if (frames.length === 0) return;
            setPlaying(false);
            setIdx(0);
          }}
          disabled={frames.length === 0}
        >
          <RotateCcw size={14} />
          <span>Restart</span>
        </button>
        <button
          type="button"
          className="wtviz-btn wtviz-btn-primary"
          onClick={() => {
            if (frames.length === 0) return;
            if (atEnd) {
              setIdx(0);
              setPlaying(true);
              return;
            }
            setPlaying((p) => !p);
          }}
          disabled={frames.length === 0}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="wtviz-btn wtviz-btn-ghost"
          onClick={next}
          disabled={frames.length === 0 || atEnd}
        >
          <SkipForward size={14} />
          <span>Step</span>
        </button>
        <label className="wtviz-speed">
          <span className="wtviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="wtviz-speed-range"
          />
          <span className="wtviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="wtviz-step-count">
          {frames.length === 0 ? '—' : `${idx + 1} / ${frames.length}`}
        </div>
      </div>
    </div>
  );
}
