import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './TreeDPViz.css';

// Maximum-weight independent set on a tree (house robber on a tree).
// Each node has a weight; you may not pick a node together with its parent.
// Post-order DFS computes two values per node:
//   skip = dp[v][0] = best for subtree(v) when v is NOT taken
//        = sum over children c of max(dp[c][0], dp[c][1])
//   take = dp[v][1] = best for subtree(v) when v IS taken
//        = weight[v] + sum over children c of dp[c][0]
// Answer = max(dp[root][0], dp[root][1]).

function buildTree() {
  // Rooted at 0. Layout chosen so edges never cross and the SVG fills width.
  const nodes = [
    { id: 0, w: 3, x: 270, y: 60 },
    { id: 1, w: 4, x: 140, y: 175 },
    { id: 2, w: 1, x: 400, y: 175 },
    { id: 3, w: 5, x: 70, y: 300 },
    { id: 4, w: 2, x: 210, y: 300 },
    { id: 5, w: 6, x: 330, y: 300 },
    { id: 6, w: 8, x: 470, y: 300 },
  ];
  const children = { 0: [1, 2], 1: [3, 4], 2: [5, 6], 3: [], 4: [], 5: [], 6: [] };
  const parent = { 0: -1, 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2 };
  return { nodes, children, parent };
}

const NODE_R = 24;

function buildFrames(tree) {
  const { nodes, children } = tree;
  const byId = {};
  nodes.forEach((n) => { byId[n.id] = n; });

  // dp[id] = { skip, take } or null if not computed yet.
  const dp = {};
  nodes.forEach((n) => { dp[n.id] = null; });
  const visiting = []; // recursion path (ids currently open)
  const frames = [];

  const snap = (extra) => ({
    dp: Object.fromEntries(nodes.map((n) => [n.id, dp[n.id] ? { ...dp[n.id] } : null])),
    visiting: [...visiting],
    active: null,
    childOf: null,
    done: false,
    chosen: null,
    total: null,
    ...extra,
  });

  frames.push(snap({
    note: 'Goal: pick a set of nodes with maximum total weight, but never a node together with its parent. Post-order DFS: solve every child before its parent.',
  }));

  function dfs(v) {
    visiting.push(v);
    frames.push(snap({
      active: v,
      note: `Enter node ${v} (weight ${byId[v].w}). ${children[v].length ? `It has children [${children[v].join(', ')}] — recurse into them first.` : 'It is a leaf — no children to wait on.'}`,
    }));

    for (const c of children[v]) {
      frames.push(snap({
        active: v,
        childOf: c,
        note: `Node ${v} descends into child ${c} before it can combine results.`,
      }));
      dfs(c);
      frames.push(snap({
        active: v,
        childOf: c,
        note: `Back at node ${v}: child ${c} is solved — skip(${c})=${dp[c].skip}, take(${c})=${dp[c].take}.`,
      }));
    }

    // Combine children into this node.
    let take = byId[v].w;
    let skip = 0;
    const takeParts = [`w${v}=${byId[v].w}`];
    const skipParts = [];
    for (const c of children[v]) {
      take += dp[c].skip;
      const best = Math.max(dp[c].skip, dp[c].take);
      skip += best;
      takeParts.push(`skip(${c})=${dp[c].skip}`);
      skipParts.push(`max(${dp[c].skip},${dp[c].take})=${best}`);
    }
    dp[v] = { skip, take };
    visiting.pop();

    const takeExpr = takeParts.join(' + ');
    const skipExpr = skipParts.length ? skipParts.join(' + ') : '0';
    frames.push(snap({
      active: v,
      note:
        `Finish node ${v}: take = ${takeExpr} = ${take} (take v, so every child must be skipped); ` +
        `skip = ${skipExpr} = ${skip} (drop v, each child free to take its best).`,
    }));

    return dp[v];
  }

  dfs(0);

  // Reconstruct the chosen set top-down: take root if take >= skip, then for
  // each node, if it was taken its children must be skipped, else children pick best.
  const root = nodes[0].id;
  const chosen = new Set();
  const decide = (v, parentTaken) => {
    const { skip, take } = dp[v];
    const canTake = !parentTaken && take >= skip;
    if (canTake) chosen.add(v);
    for (const c of children[v]) decide(c, canTake);
  };
  decide(root, false);
  const total = Math.max(dp[root].skip, dp[root].take);

  frames.push(snap({
    done: true,
    chosen: [...chosen],
    total,
    note:
      `Answer = max(skip(${root})=${dp[root].skip}, take(${root})=${dp[root].take}) = ${total}. ` +
      `Chosen set {${[...chosen].sort((a, b) => a - b).join(', ')}} — no node sits next to its parent. O(n) total.`,
  }));

  return frames;
}

export default function TreeDPViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const { frames, tree } = useMemo(() => {
    const t = buildTree();
    return { frames: buildFrames(t), tree: t };
  }, []);

  const totalSteps = frames.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(950 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
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

  const W = 940;
  const H = 380;
  const treeW = 540;

  const chosenSet = useMemo(
    () => new Set(current.done && current.chosen ? current.chosen : []),
    [current],
  );

  const edges = [];
  tree.nodes.forEach((n) => {
    tree.children[n.id].forEach((c) => edges.push([n.id, c]));
  });

  const nodeFill = (id) => {
    if (current.done && chosenSet.has(id)) return 'var(--hue-mint)';
    if (id === current.active) return 'var(--hue-pink)';
    if (id === current.childOf) return 'var(--hue-sky)';
    if (current.visiting.includes(id)) return 'rgba(var(--accent-rgb), 0.22)';
    if (current.dp[id]) return 'rgba(var(--accent-rgb), 0.12)';
    return 'var(--bg)';
  };
  const nodeStroke = (id) => {
    if (current.done && chosenSet.has(id)) return 'var(--hue-mint)';
    if (id === current.active) return 'var(--hue-pink)';
    if (id === current.childOf) return 'var(--hue-sky)';
    if (current.visiting.includes(id)) return 'var(--accent)';
    if (current.dp[id]) return 'rgba(var(--accent-rgb), 0.45)';
    return 'var(--border)';
  };
  const labelFill = (id) => {
    if ((current.done && chosenSet.has(id)) || id === current.active || id === current.childOf) {
      return 'var(--bg)';
    }
    return 'var(--text-main)';
  };

  const activeDp = current.active != null ? current.dp[current.active] : null;

  return (
    <div className="tpd">
      <div className="tpd-head">
        <h3 className="tpd-title">Tree DP — maximum-weight independent set (robber on a tree)</h3>
        <p className="tpd-sub">
          Each node carries a weight; a node and its parent can never both be picked. Post-order DFS keeps two
          values per node — take(v) and skip(v) — then the root&apos;s best is the answer.
        </p>
      </div>

      <div className="tpd-controls">
        <div className="tpd-buttons">
          <button
            type="button"
            className="tpd-btn tpd-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunningRaw((v) => !v);
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="tpd-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="tpd-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="tpd-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <label className="tpd-speed">
          <span className="tpd-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tpd-speed-range"
          />
          <span className="tpd-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="tpd-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="tpd-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tpd-svg" preserveAspectRatio="xMidYMid meet">
          {/* tree panel */}
          <rect x={20} y={20} width={treeW} height={H - 40} rx={8} fill="var(--bg)" stroke="var(--border)" />
          <text x={32} y={40} className="tpd-row-label">rooted tree — node : weight</text>

          {edges.map(([a, b]) => {
            const na = tree.nodes.find((n) => n.id === a);
            const nb = tree.nodes.find((n) => n.id === b);
            const isActive = (current.active === a && current.childOf === b);
            return (
              <line
                key={`e-${a}-${b}`}
                x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke={isActive ? 'var(--hue-sky)' : 'var(--border)'}
                strokeWidth={isActive ? 3 : 1.6}
                opacity={isActive ? 1 : 0.6}
              />
            );
          })}

          {tree.nodes.map((nd) => {
            const d = current.dp[nd.id];
            return (
              <g key={`n-${nd.id}`}>
                <circle
                  cx={nd.x} cy={nd.y} r={NODE_R}
                  fill={nodeFill(nd.id)}
                  stroke={nodeStroke(nd.id)}
                  strokeWidth={nd.id === current.active || nd.id === current.childOf || (current.done && chosenSet.has(nd.id)) ? 3 : 2}
                />
                <text x={nd.x} y={nd.y - 2} className="tpd-node-id" style={{ fill: labelFill(nd.id) }}>{nd.id}</text>
                <text x={nd.x} y={nd.y + 13} className="tpd-node-w" style={{ fill: labelFill(nd.id) }}>w{nd.w}</text>
                {d && (
                  <text x={nd.x} y={nd.y + NODE_R + 16} className="tpd-node-dp">
                    s{d.skip} · t{d.take}
                  </text>
                )}
              </g>
            );
          })}

          <text x={32} y={H - 28} className="tpd-row-label">
            s = skip(v) · t = take(v) shown once a node is solved
          </text>

          {/* take/skip computation panel */}
          {(() => {
            const px = treeW + 46;
            const pw = W - px - 20;
            return (
              <g>
                <rect x={px} y={20} width={pw} height={H - 40} rx={8} fill="var(--surface)" stroke="var(--border)" />
                <text x={px + 14} y={44} className="tpd-panel-h">
                  {current.done
                    ? 'final answer'
                    : current.active != null
                      ? `node ${current.active}`
                      : 'awaiting node'}
                </text>

                {current.done ? (
                  <>
                    <text x={px + 14} y={90} className="tpd-big-label">chosen set</text>
                    <text x={px + 14} y={120} className="tpd-big-val">
                      {`{ ${(current.chosen || []).slice().sort((a, b) => a - b).join(', ')} }`}
                    </text>
                    <text x={px + 14} y={170} className="tpd-big-label">total weight</text>
                    <text x={px + 14} y={206} className="tpd-big-total">{current.total}</text>
                    <text x={px + 14} y={250} className="tpd-panel-note">
                      No chosen node touches its parent —
                    </text>
                    <text x={px + 14} y={270} className="tpd-panel-note">
                      that is the independence constraint.
                    </text>
                  </>
                ) : (
                  <>
                    <g>
                      <rect x={px + 14} y={64} width={pw - 28} height={58} rx={6} fill="var(--bg)" stroke="var(--hue-pink)" />
                      <text x={px + 26} y={86} className="tpd-take-label">take(v) = w + Σ skip(child)</text>
                      <text x={px + 26} y={110} className="tpd-take-val">
                        {activeDp ? activeDp.take : '—'}
                      </text>
                    </g>
                    <g>
                      <rect x={px + 14} y={134} width={pw - 28} height={58} rx={6} fill="var(--bg)" stroke="var(--accent)" />
                      <text x={px + 26} y={156} className="tpd-skip-label">skip(v) = Σ max(skip,take)</text>
                      <text x={px + 26} y={180} className="tpd-skip-val">
                        {activeDp ? activeDp.skip : '—'}
                      </text>
                    </g>
                    <text x={px + 14} y={224} className="tpd-row-label">recursion path</text>
                    {current.visiting.length === 0 ? (
                      <text x={px + 14} y={250} className="tpd-empty">empty</text>
                    ) : (
                      current.visiting.map((vid, i) => (
                        <g key={`vp-${vid}`}>
                          <rect x={px + 14 + i * 40} y={234} width={34} height={28} rx={5} fill="rgba(var(--accent-rgb), 0.18)" stroke="var(--accent)" strokeWidth={1.5} />
                          <text x={px + 14 + i * 40 + 17} y={253} className="tpd-path-text">{vid}</text>
                        </g>
                      ))
                    )}
                  </>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="tpd-metrics">
        <div className="tpd-metric">
          <span className="tpd-metric-label">current node</span>
          <span className="tpd-metric-value">{current.done ? '—' : current.active != null ? current.active : '—'}</span>
        </div>
        <div className="tpd-metric tpd-metric-take">
          <span className="tpd-metric-label">take(v)</span>
          <span className="tpd-metric-value">{activeDp ? activeDp.take : '—'}</span>
        </div>
        <div className="tpd-metric tpd-metric-skip">
          <span className="tpd-metric-label">skip(v)</span>
          <span className="tpd-metric-value">{activeDp ? activeDp.skip : '—'}</span>
        </div>
        <div className="tpd-metric">
          <span className="tpd-metric-label">chosen set</span>
          <span className="tpd-metric-value">
            {current.done && current.chosen
              ? `{${current.chosen.slice().sort((a, b) => a - b).join(',')}}`
              : '—'}
          </span>
        </div>
        <div className="tpd-metric tpd-metric-total">
          <span className="tpd-metric-label">total weight</span>
          <span className="tpd-metric-value">{current.done ? current.total : '—'}</span>
        </div>
      </div>

      <div className="tpd-arith">
        <span className="tpd-arith-label">trace</span>
        <span className="tpd-arith-vals">{current.note}</span>
      </div>
    </div>
  );
}
