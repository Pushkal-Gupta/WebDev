import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './AhoCorasickViz.css';

const PATTERNS = ['he', 'she', 'his', 'hers'];
const TEXT = 'ushers';
const SEED = 0xACAC01;

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildAutomaton(patterns) {
  // node: { id, children: {ch: id}, fail: id, dict: id|null, output: [patternIdx], depth, parent, parentCh }
  const nodes = [{ id: 0, children: {}, fail: 0, dict: null, output: [], depth: 0, parent: -1, parentCh: '' }];

  patterns.forEach((p, pi) => {
    let cur = 0;
    for (const ch of p) {
      if (nodes[cur].children[ch] === undefined) {
        nodes.push({
          id: nodes.length,
          children: {},
          fail: 0,
          dict: null,
          output: [],
          depth: nodes[cur].depth + 1,
          parent: cur,
          parentCh: ch,
        });
        nodes[cur].children[ch] = nodes.length - 1;
      }
      cur = nodes[cur].children[ch];
    }
    nodes[cur].output.push(pi);
  });

  // BFS to compute fail + dict
  const queue = [];
  for (const ch in nodes[0].children) {
    const v = nodes[0].children[ch];
    nodes[v].fail = 0;
    queue.push(v);
  }
  while (queue.length) {
    const u = queue.shift();
    for (const ch in nodes[u].children) {
      const v = nodes[u].children[ch];
      let f = nodes[u].fail;
      while (f !== 0 && nodes[f].children[ch] === undefined) {
        f = nodes[f].fail;
      }
      if (nodes[f].children[ch] !== undefined && nodes[f].children[ch] !== v) {
        nodes[v].fail = nodes[f].children[ch];
      } else {
        nodes[v].fail = 0;
      }
      const ff = nodes[v].fail;
      nodes[v].dict = nodes[ff].output.length > 0 ? ff : nodes[ff].dict;
      queue.push(v);
    }
  }
  return nodes;
}

function buildFrames(patterns, text) {
  const nodes = buildAutomaton(patterns);
  const frames = [];

  frames.push({
    phase: 'init',
    state: 0,
    i: -1,
    visitedFail: [],
    matches: [],
    note: 'Automaton built. Start at root (state 0). Walk the text character by character.',
  });

  let state = 0;
  const matches = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const visitedFail = [];
    // walk fails
    let s = state;
    while (s !== 0 && nodes[s].children[ch] === undefined) {
      visitedFail.push({ from: s, to: nodes[s].fail });
      s = nodes[s].fail;
    }
    const before = state;
    if (nodes[s].children[ch] !== undefined) {
      state = nodes[s].children[ch];
    } else {
      state = 0;
    }

    frames.push({
      phase: 'transition',
      state,
      i,
      ch,
      from: before,
      visitedFail,
      matches: [...matches],
      note: visitedFail.length
        ? `i = ${i}, char '${ch}': fail-walk ${visitedFail.map(v => `${v.from}→${v.to}`).join(', ')}, then goto[${s}, '${ch}'] = ${state}.`
        : `i = ${i}, char '${ch}': goto[${before}, '${ch}'] = ${state}.`,
    });

    // collect outputs via dict-links
    const newMatches = [];
    if (nodes[state].output.length > 0) {
      for (const pi of nodes[state].output) {
        const pat = patterns[pi];
        newMatches.push({ pi, pat, end: i, start: i - pat.length + 1, via: state });
      }
    }
    let d = nodes[state].dict;
    while (d !== null) {
      for (const pi of nodes[d].output) {
        const pat = patterns[pi];
        newMatches.push({ pi, pat, end: i, start: i - pat.length + 1, via: d });
      }
      d = nodes[d].dict;
    }

    if (newMatches.length > 0) {
      matches.push(...newMatches);
      frames.push({
        phase: 'match',
        state,
        i,
        ch,
        visitedFail: [],
        matches: [...matches],
        newMatches,
        note: `Match${newMatches.length > 1 ? 'es' : ''}: ${newMatches.map(m => `"${m.pat}" at [${m.start}..${m.end}]`).join(', ')}.`,
      });
    }
  }

  frames.push({
    phase: 'done',
    state,
    i: text.length,
    visitedFail: [],
    matches: [...matches],
    note: `Done. Scanned ${text.length} chars in O(n + matches), found ${matches.length} occurrence${matches.length === 1 ? '' : 's'}.`,
  });

  return { frames, nodes };
}

function layoutTree(nodes) {
  // Layer nodes by depth and assign x positions left-to-right by DFS order, then a bit of jitter from seed.
  const rng = mulberry32(SEED);
  const byDepth = [];
  for (const n of nodes) {
    if (!byDepth[n.depth]) byDepth[n.depth] = [];
    byDepth[n.depth].push(n.id);
  }
  // Use DFS to get a stable left-to-right order within a depth.
  const order = new Map();
  let counter = 0;
  function dfs(id) {
    order.set(id, counter++);
    const cs = Object.entries(nodes[id].children).sort(([a], [b]) => a.localeCompare(b));
    for (const [, c] of cs) dfs(c);
  }
  dfs(0);
  for (const arr of byDepth) {
    if (arr) arr.sort((a, b) => order.get(a) - order.get(b));
  }

  const maxDepth = byDepth.length - 1;
  const W = 720;
  const layerH = 90;
  const topPad = 36;
  const pos = {};
  byDepth.forEach((arr, depth) => {
    if (!arr) return;
    const n = arr.length;
    const step = W / (n + 1);
    arr.forEach((id, idx) => {
      const jitter = (rng() - 0.5) * 6;
      pos[id] = { x: step * (idx + 1) + jitter, y: topPad + depth * layerH };
    });
  });
  return { pos, W: W + 40, H: topPad + (maxDepth + 1) * layerH + 20 };
}

export default function AhoCorasickViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const { frames, nodes } = useMemo(() => buildFrames(PATTERNS, TEXT), []);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(900 / speed);

  const { pos, W, H } = useMemo(() => layoutTree(nodes), [nodes]);

  useEffect(() => {
    if (!isRunning) return;
    runTimer.current = setTimeout(() => {
      setStep((s2) => Math.min(s2 + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => {
    setIsRunningRaw(false);
    setStep(0);
  };

  // Text strip layout
  const textPad = 30;
  const cellW = 36;
  const textW = textPad * 2 + cellW * TEXT.length;
  const textH = 70;
  const totalW = Math.max(W, textW);

  const activeFailEdges = new Set(
    (current.visitedFail || []).map(v => `${v.from}->${v.to}`)
  );

  // build edges
  const trieEdges = [];
  const failEdges = [];
  const dictEdges = [];
  for (const n of nodes) {
    if (n.parent >= 0) {
      trieEdges.push({ from: n.parent, to: n.id, ch: n.parentCh });
    }
    if (n.id !== 0) {
      failEdges.push({ from: n.id, to: n.fail });
    }
    if (n.dict !== null) {
      dictEdges.push({ from: n.id, to: n.dict });
    }
  }

  const r = 16;

  return (
    <div className="acv">
      <div className="acv-head">
        <h3 className="acv-title">Aho–Corasick — multi-pattern matching in one pass</h3>
        <p className="acv-sub">
          Build the goto trie for {'{'}{PATTERNS.map(p => `"${p}"`).join(', ')}{'}'}, link suffix and dictionary
          edges, then scan "{TEXT}" character by character — every occurrence is reported in linear time.
        </p>
      </div>

      <div className="acv-controls">
        <div className="acv-legend">
          <span className="acv-legend-item">
            <span className="acv-legend-swatch" style={{ background: 'var(--accent)' }} />
            trie edge
          </span>
          <span className="acv-legend-item">
            <span className="acv-legend-swatch" style={{ background: 'var(--hue-sky)' }} />
            suffix (fail) link
          </span>
          <span className="acv-legend-item">
            <span className="acv-legend-swatch" style={{ background: 'var(--hue-pink)' }} />
            dictionary link
          </span>
          <span className="acv-legend-item">
            <span className="acv-legend-swatch" style={{ background: 'var(--easy)' }} />
            current state
          </span>
        </div>

        <div className="acv-actions">
          <div className="acv-buttons">
            <button
              type="button"
              className="acv-btn acv-btn-primary"
              onClick={() => {
                if (step >= totalSteps - 1) setStep(0);
                setIsRunningRaw((v) => !v);
              }}
            >
              {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
              {isRunningRaw && step < totalSteps - 1 ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="acv-btn"
              onClick={() => setStep((s2) => Math.min(s2 + 1, totalSteps - 1))}
              disabled={step >= totalSteps - 1}
            >
              <ChevronRight size={14} /> Step
            </button>
            <button
              type="button"
              className="acv-btn"
              onClick={() => setStep(totalSteps - 1)}
              disabled={step >= totalSteps - 1}
            >
              <SkipForward size={14} /> Skip
            </button>
            <button type="button" className="acv-btn" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
          <label className="acv-speed">
            <span className="acv-speed-label">speed</span>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="acv-speed-range"
            />
            <span className="acv-speed-value">{speed.toFixed(1)}×</span>
          </label>
          <div className="acv-stepcount">
            step <strong>{step + 1}</strong> / {totalSteps}
          </div>
        </div>
      </div>

      <div className="acv-stage">
        <svg viewBox={`0 0 ${totalW} ${H + textH + 20}`} className="acv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="acv-arrow-trie" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker id="acv-arrow-fail" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-sky)" />
            </marker>
            <marker id="acv-arrow-failactive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--warning)" />
            </marker>
            <marker id="acv-arrow-dict" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {/* fail edges (curved, dashed) */}
          {failEdges.map((e, idx) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            const active = activeFailEdges.has(`${e.from}->${e.to}`);
            // curve via control point offset to the side
            const mx = (a.x + b.x) / 2 + (e.from % 2 === 0 ? 60 : -60);
            const my = (a.y + b.y) / 2;
            const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
            return (
              <path
                key={`f-${idx}`}
                d={d}
                fill="none"
                stroke={active ? 'var(--warning)' : 'var(--hue-sky)'}
                strokeWidth={active ? 2 : 1.2}
                strokeDasharray="4 3"
                markerEnd={active ? 'url(#acv-arrow-failactive)' : 'url(#acv-arrow-fail)'}
                opacity={active ? 1 : 0.55}
              />
            );
          })}

          {/* dict edges (curved, dashed pink) */}
          {dictEdges.map((e, idx) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2 - 50;
            const my = (a.y + b.y) / 2 + 10;
            const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
            return (
              <path
                key={`d-${idx}`}
                d={d}
                fill="none"
                stroke="var(--hue-pink)"
                strokeWidth={1.4}
                strokeDasharray="3 2"
                markerEnd="url(#acv-arrow-dict)"
                opacity={0.85}
              />
            );
          })}

          {/* trie edges */}
          {trieEdges.map((e, idx) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            // shorten so arrow ends at circle boundary
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ex = b.x - (dx / len) * r;
            const ey = b.y - (dy / len) * r;
            return (
              <g key={`t-${idx}`}>
                <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke="var(--accent)" strokeWidth="1.5" opacity="0.85" markerEnd="url(#acv-arrow-trie)" />
                <text x={(a.x + b.x) / 2 + 6} y={(a.y + b.y) / 2 - 4} className="acv-edge-label">{e.ch}</text>
              </g>
            );
          })}

          {/* nodes */}
          {nodes.map((n) => {
            const p = pos[n.id];
            if (!p) return null;
            const isCurrent = n.id === current.state && current.phase !== 'init';
            const isAccept = n.output.length > 0;
            const fill = isCurrent
              ? 'var(--easy)'
              : isAccept
              ? 'rgba(var(--accent-rgb), 0.18)'
              : 'var(--bg)';
            const stroke = isCurrent ? 'var(--easy)' : isAccept ? 'var(--accent)' : 'var(--border)';
            return (
              <g key={`n-${n.id}`}>
                {isAccept && (
                  <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke={isCurrent ? 'var(--easy)' : 'var(--accent)'} strokeWidth="1" opacity="0.55" />
                )}
                <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke={stroke} strokeWidth={isCurrent ? 2.4 : 1.5} />
                <text x={p.x} y={p.y} className="acv-node-label" fill={isCurrent ? 'var(--bg)' : 'var(--text-main)'}>
                  {n.id}
                </text>
              </g>
            );
          })}

          {/* text strip */}
          <text x={textPad - 10} y={H + 30} className="acv-row-label" textAnchor="end">text</text>
          {[...TEXT].map((ch, idx) => {
            const x = textPad + idx * cellW;
            const isActive = idx === current.i;
            const isPast = current.i >= 0 && idx < current.i;
            const inMatch = (current.matches || []).some(m => idx >= m.start && idx <= m.end);
            const fill = isActive
              ? 'rgba(var(--accent-rgb), 0.18)'
              : inMatch
              ? 'rgba(var(--easy-rgb, 34, 197, 94), 0.16)'
              : isPast
              ? 'var(--surface)'
              : 'var(--bg)';
            const stroke = isActive ? 'var(--accent)' : inMatch ? 'var(--easy)' : 'var(--border)';
            return (
              <g key={`tx-${idx}`}>
                <rect
                  x={x}
                  y={H + 12}
                  width={cellW - 4}
                  height={36}
                  rx="4"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text x={x + (cellW - 4) / 2} y={H + 32} className="acv-text-row" fill={inMatch && !isActive ? 'var(--easy)' : 'var(--text-main)'}>
                  {ch}
                </text>
                <text x={x + (cellW - 4) / 2} y={H + 62} className="acv-text-index">{idx}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="acv-metrics">
        <div className="acv-metric">
          <span className="acv-metric-label">state</span>
          <span className="acv-metric-value">{current.state}</span>
        </div>
        <div className="acv-metric">
          <span className="acv-metric-label">i</span>
          <span className="acv-metric-value">{current.i < 0 ? '—' : current.i}</span>
        </div>
        <div className="acv-metric">
          <span className="acv-metric-label">char</span>
          <span className="acv-metric-value">{current.ch || '—'}</span>
        </div>
        <div className="acv-metric">
          <span className="acv-metric-label">matches</span>
          <span className="acv-metric-value">{(current.matches || []).length}</span>
        </div>
        <div className="acv-metric acv-metric-dim">
          <span className="acv-metric-label">phase</span>
          <span className="acv-metric-value acv-metric-dimval">{current.phase}</span>
        </div>
      </div>

      <div className="acv-matches">
        {(current.matches || []).length === 0 ? (
          <span className="acv-match-empty">no matches yet</span>
        ) : (
          current.matches.map((m, idx) => (
            <span key={`m-${idx}`} className="acv-match-chip">
              "{m.pat}" @ [{m.start}..{m.end}]
            </span>
          ))
        )}
      </div>

      <div className="acv-arith">
        <span className="acv-arith-label">trace</span>
        <span className="acv-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
