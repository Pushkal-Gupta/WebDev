import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Network, GitMerge } from 'lucide-react';
import './HopcroftKarpMatchViz.css';

const SVG_W = 720;
const SVG_H = 380;
const NODE_R = 17;
const LEFT_X = 170;
const RIGHT_X = SVG_W - 170;
const TOP_Y = 56;
const STEP_MS = 950;
const INF = 1 << 28;

// Two deterministic, seeded bipartite presets. Edges only; positions derived.
const PRESETS = {
  A: {
    name: 'Preset A',
    L: 5,
    R: 5,
    edges: [
      [0, 0], [0, 1],
      [1, 0], [1, 2],
      [2, 1], [2, 3],
      [3, 2], [3, 4],
      [4, 3], [4, 4],
    ],
  },
  B: {
    name: 'Preset B',
    L: 5,
    R: 5,
    edges: [
      [0, 0], [0, 2],
      [1, 0], [1, 1],
      [2, 1], [2, 2], [2, 4],
      [3, 2], [3, 3],
      [4, 3], [4, 4],
    ],
  },
};

function buildAdj(preset) {
  const adj = Array.from({ length: preset.L }, () => []);
  for (const [u, v] of preset.edges) adj[u].push(v);
  adj.forEach((a) => a.sort((x, y) => x - y));
  return adj;
}

function matchedEdgeSet(matchL) {
  const s = new Set();
  for (let u = 0; u < matchL.length; u += 1) {
    if (matchL[u] >= 0) s.add(`${u}-${matchL[u]}`);
  }
  return s;
}

function snapshot(matchL, matchR, extra) {
  return {
    matched: matchedEdgeSet(matchL),
    layers: {},
    activePath: [],
    highlightL: new Set(),
    highlightR: new Set(),
    phase: 0,
    op: '',
    size: matchL.filter((x) => x >= 0).length,
    done: false,
    ...extra,
  };
}

// Build the full frame list for Hopcroft-Karp on a preset.
function buildFrames(preset) {
  const adj = buildAdj(preset);
  const nL = preset.L;
  const nR = preset.R;
  const matchL = new Array(nL).fill(-1);
  const matchR = new Array(nR).fill(-1);
  const frames = [];
  let phase = 0;

  frames.push(snapshot(matchL, matchR, {
    op: 'idle',
    caption: 'Empty matching. Each phase runs a BFS to layer free left vertices by shortest augmenting distance, then DFS augments along several shortest paths at once.',
  }));

  const freeLeft = () => {
    const out = [];
    for (let u = 0; u < nL; u += 1) if (matchL[u] < 0) out.push(u);
    return out;
  };

  // Hopcroft-Karp BFS: distance layers on left vertices.
  function bfs() {
    const dist = new Array(nL).fill(INF);
    const queue = [];
    for (let u = 0; u < nL; u += 1) {
      if (matchL[u] < 0) { dist[u] = 0; queue.push(u); }
    }
    let reachable = false;
    let head = 0;
    while (head < queue.length) {
      const u = queue[head]; head += 1;
      for (const v of adj[u]) {
        const w = matchR[v];
        if (w < 0) {
          reachable = true;
        } else if (dist[w] === INF) {
          dist[w] = dist[u] + 1;
          queue.push(w);
        }
      }
    }
    return { dist, reachable };
  }

  // DFS augment along shortest-distance edges.
  function dfs(u, dist, pathOut) {
    for (const v of adj[u]) {
      const w = matchR[v];
      if (w < 0 || (dist[w] === dist[u] + 1 && dfs(w, dist, pathOut))) {
        matchR[v] = u;
        matchL[u] = v;
        pathOut.push([u, v]);
        return true;
      }
    }
    dist[u] = INF;
    return false;
  }

  while (true) {
    const { dist, reachable } = bfs();

    // Build a layer map keyed by node id "L#"/"R#" -> layer index for display.
    const layerMap = {};
    for (let u = 0; u < nL; u += 1) {
      if (dist[u] !== INF) layerMap[`L${u}`] = dist[u];
    }

    if (!reachable) {
      frames.push(snapshot(matchL, matchR, {
        layers: layerMap,
        phase,
        op: 'bfs',
        caption: `Phase ${phase + 1} BFS: no free right vertex is reachable from any free left vertex. No augmenting path exists — the matching is maximum.`,
        done: true,
      }));
      break;
    }

    phase += 1;
    const fl = freeLeft();
    frames.push(snapshot(matchL, matchR, {
      layers: layerMap,
      phase,
      op: 'bfs',
      highlightL: new Set(fl),
      caption: `Phase ${phase} BFS: free left vertices ${fl.map((u) => `L${u}`).join(', ')} sit at layer 0. Alternating layers spread right until a free right vertex is hit. Shortest augmenting length fixed for this phase.`,
    }));

    // DFS from each still-free left vertex; emit a frame per successful augment.
    const dfsDist = [...dist];
    let augmentedThisPhase = 0;
    for (let u = 0; u < nL; u += 1) {
      if (matchL[u] >= 0) continue;
      const path = [];
      if (dfs(u, dfsDist, path)) {
        augmentedThisPhase += 1;
        frames.push(snapshot(matchL, matchR, {
          layers: layerMap,
          phase,
          op: 'dfs',
          activePath: path.map(([a, b]) => `${a}-${b}`),
          highlightL: new Set(path.map(([a]) => a)),
          highlightR: new Set(path.map(([, b]) => b)),
          caption: `Phase ${phase} DFS augment from L${u}: flip the alternating path ${path.map(([a, b]) => `L${a}-R${b}`).join(' / ')}. Free edges become matched, matched become free. Matching size now ${matchL.filter((x) => x >= 0).length}.`,
        }));
      }
    }

    frames.push(snapshot(matchL, matchR, {
      layers: layerMap,
      phase,
      op: 'phase-end',
      caption: `Phase ${phase} complete: ${augmentedThisPhase} vertex-disjoint augmenting path${augmentedThisPhase === 1 ? '' : 's'} flipped. Matching size = ${matchL.filter((x) => x >= 0).length}. Run the next BFS phase.`,
    }));
  }

  // Final maximum-matching frame.
  frames.push(snapshot(matchL, matchR, {
    op: 'done',
    phase,
    highlightL: new Set(matchL.map((v, u) => (v >= 0 ? u : -1)).filter((x) => x >= 0)),
    highlightR: new Set(matchR.map((u, v) => (u >= 0 ? v : -1)).filter((x) => x >= 0)),
    caption: `Maximum matching reached after ${phase} phase${phase === 1 ? '' : 's'}: size ${matchL.filter((x) => x >= 0).length}. Thick accent edges are the final matching.`,
    done: true,
  }));

  return frames;
}

function leftPos(u, count) {
  const span = SVG_H - TOP_Y * 2;
  const gap = count > 1 ? span / (count - 1) : 0;
  return { x: LEFT_X, y: TOP_Y + u * gap };
}

function rightPos(v, count) {
  const span = SVG_H - TOP_Y * 2;
  const gap = count > 1 ? span / (count - 1) : 0;
  return { x: RIGHT_X, y: TOP_Y + v * gap };
}

export default function HopcroftKarpMatchViz() {
  const [presetKey, setPresetKey] = useState('A');
  const preset = PRESETS[presetKey];
  const frames = useMemo(() => buildFrames(preset), [preset]);

  const [idx, setIdx] = useState(0);
  const [playingRaw, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef(null);

  const current = frames[idx];
  const atEnd = idx >= frames.length - 1;
  const playing = playingRaw && idx < frames.length - 1;

  const next = useCallback(() => {
    setIdx((i) => (i >= frames.length - 1 ? i : i + 1));
  }, [frames.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      return undefined;
    }
    timerRef.current = setTimeout(() => next(), Math.round(STEP_MS / speed));
    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  }, [playing, idx, speed, next]);

  const selectPreset = (key) => {
    setPlaying(false);
    setIdx(0);
    setPresetKey(key);
  };

  const handleRestart = () => {
    setPlaying(false);
    setIdx(0);
  };

  const edges = useMemo(() => preset.edges.map(([u, v]) => ({
    u, v, key: `${u}-${v}`,
  })), [preset]);

  const leftIds = Array.from({ length: preset.L }, (_, i) => i);
  const rightIds = Array.from({ length: preset.R }, (_, i) => i);

  const freeLeftCount = useMemo(() => {
    const matchedLeft = new Set();
    current.matched.forEach((k) => matchedLeft.add(Number(k.split('-')[0])));
    return preset.L - matchedLeft.size;
  }, [current, preset.L]);

  const opLabel = (() => {
    switch (current.op) {
      case 'bfs': return 'BFS layering';
      case 'dfs': return 'DFS augment';
      case 'phase-end': return 'phase complete';
      case 'done': return 'maximum matching';
      default: return 'idle';
    }
  })();

  return (
    <div className="hkviz">
      <div className="hkviz-header">
        <div className="hkviz-title">Hopcroft-Karp maximum bipartite matching</div>
        <div className="hkviz-stats">
          <span className="hkviz-stat-label">Matching</span>
          <span className="hkviz-stat-value">{current.size}</span>
        </div>
      </div>

      <div className="hkviz-ops">
        <div className="hkviz-op">
          <span className="hkviz-op-label">Graph</span>
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              type="button"
              className={`hkviz-btn ${presetKey === key ? 'hkviz-btn-primary' : 'hkviz-btn-ghost'}`}
              onClick={() => selectPreset(key)}
            >
              <Network size={14} />
              <span>{PRESETS[key].name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="hkviz-btn hkviz-btn-ghost"
          onClick={handleRestart}
          aria-label="Reset"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      <div className="hkviz-body">
        <div className="hkviz-stage">
          <svg
            className="hkviz-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Hopcroft-Karp bipartite matching visualization"
          >
            <text className="hkviz-col-label" x={LEFT_X} y={TOP_Y - 28} textAnchor="middle">LEFT</text>
            <text className="hkviz-col-label" x={RIGHT_X} y={TOP_Y - 28} textAnchor="middle">RIGHT</text>

            <g className="hkviz-edges">
              {edges.map((e) => {
                const a = leftPos(e.u, preset.L);
                const b = rightPos(e.v, preset.R);
                const isMatched = current.matched.has(e.key);
                const isActive = current.activePath.includes(e.key);
                let cls = 'hkviz-edge';
                if (isActive) cls += ' hkviz-edge-active';
                else if (isMatched) cls += ' hkviz-edge-matched';
                return (
                  <line
                    key={e.key}
                    className={cls}
                    x1={a.x + NODE_R}
                    y1={a.y}
                    x2={b.x - NODE_R}
                    y2={b.y}
                  />
                );
              })}
            </g>

            <g className="hkviz-nodes">
              {leftIds.map((u) => {
                const p = leftPos(u, preset.L);
                const hi = current.highlightL.has(u);
                const layer = current.layers[`L${u}`];
                const hasLayer = layer !== undefined && current.op === 'bfs';
                return (
                  <g key={`L${u}`} className={`hkviz-node ${hi ? 'hkviz-node-hi' : ''} ${hasLayer ? 'hkviz-node-layered' : ''}`} transform={`translate(${p.x}, ${p.y})`}>
                    {hi && <circle className="hkviz-node-ring" r={NODE_R + 6} />}
                    <circle className="hkviz-node-circle" r={NODE_R} />
                    <text className="hkviz-node-text" textAnchor="middle" dominantBaseline="central">L{u}</text>
                    {hasLayer && (
                      <text className="hkviz-layer-tag" x={-(NODE_R + 12)} y="0" textAnchor="middle" dominantBaseline="central">{layer}</text>
                    )}
                  </g>
                );
              })}
              {rightIds.map((v) => {
                const p = rightPos(v, preset.R);
                const hi = current.highlightR.has(v);
                return (
                  <g key={`R${v}`} className={`hkviz-node ${hi ? 'hkviz-node-hi' : ''}`} transform={`translate(${p.x}, ${p.y})`}>
                    {hi && <circle className="hkviz-node-ring" r={NODE_R + 6} />}
                    <circle className="hkviz-node-circle" r={NODE_R} />
                    <text className="hkviz-node-text" textAnchor="middle" dominantBaseline="central">R{v}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="hkviz-sidebar">
          <div className="hkviz-panel">
            <div className="hkviz-panel-label">Operation</div>
            <div className="hkviz-panel-value">{opLabel}</div>
          </div>
          <div className="hkviz-panel">
            <div className="hkviz-panel-label">Phase</div>
            <div className="hkviz-panel-value">{current.phase}</div>
          </div>
          <div className="hkviz-panel">
            <div className="hkviz-panel-label">Matching size</div>
            <div className="hkviz-panel-value">{current.size}</div>
          </div>
          <div className="hkviz-panel">
            <div className="hkviz-panel-label">Free left vertices</div>
            <div className="hkviz-panel-value">{freeLeftCount}</div>
          </div>
          <div className="hkviz-panel">
            <div className="hkviz-panel-label">Max matching reached</div>
            <div className={`hkviz-panel-value ${current.done ? 'hkviz-yes' : 'hkviz-no'}`}>
              {current.done ? 'yes' : 'no'}
            </div>
          </div>
          <div className="hkviz-panel">
            <div className="hkviz-panel-label">Step</div>
            <div className="hkviz-panel-value">{idx + 1} / {frames.length}</div>
          </div>
        </aside>
      </div>

      <p className="hkviz-caption">{current.caption}</p>

      <div className="hkviz-controls">
        <button
          type="button"
          className="hkviz-btn hkviz-btn-ghost"
          onClick={handleRestart}
          disabled={idx === 0 && !playing}
        >
          <RotateCcw size={14} />
          <span>Restart</span>
        </button>
        <button
          type="button"
          className="hkviz-btn hkviz-btn-primary"
          onClick={() => {
            if (atEnd) { setIdx(0); setPlaying(true); return; }
            setPlaying((p) => !p);
          }}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span>{playing ? 'Pause' : atEnd ? 'Replay' : 'Run'}</span>
        </button>
        <button
          type="button"
          className="hkviz-btn hkviz-btn-ghost"
          onClick={next}
          disabled={atEnd}
        >
          <SkipForward size={14} />
          <span>Step</span>
        </button>
        <label className="hkviz-speed">
          <span className="hkviz-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="hkviz-speed-range"
            aria-label="Playback speed"
          />
          <span className="hkviz-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="hkviz-legend">
          <span className="hkviz-legend-item"><GitMerge size={13} /> matched edge</span>
        </div>
      </div>
    </div>
  );
}
