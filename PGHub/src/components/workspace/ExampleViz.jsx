// Inline SVG diagram of a single example's INPUT, chosen by the problem's param
// shapes. Graph (n + edge list) → circle-laid nodes + edges; binary-tree
// level-order array → real tree; matrix → grid; flat array / string → labelled
// cells. Returns null when nothing draws cleanly, so the caller shows text only.
// Theme tokens only, no scrollbars, sizes to fit inside an example card.

function parse(v) {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  try { return JSON.parse(s); } catch { return s; }
}
const isPairList = (v) => Array.isArray(v) && v.length > 0 && v.every(e => Array.isArray(e) && e.length === 2 && e.every(x => Number.isInteger(x)));
const isFlat = (v) => Array.isArray(v) && v.every(x => typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean');
const isMatrix = (v) => Array.isArray(v) && v.length > 0 && v.every(r => Array.isArray(r) && r.every(x => typeof x === 'number' || typeof x === 'string'));

function pickGraph(vals) {
  // need an edge list (List[List[int]] of pairs) and, ideally, a node count int
  let edges = null; const directed = false;
  vals.forEach((v) => { if (edges === null && isPairList(v)) edges = v; });
  if (!edges) return null;
  let mx = -1; for (const [a, b] of edges) mx = Math.max(mx, a, b);
  const impliedN = mx + 1;
  // Node count is the standalone integer param (name is often generic like
  // "nums"); accept it only when it's a sane superset of the vertices the edges
  // reference, so an isolated vertex still renders. Fall back to impliedN.
  let n = impliedN;
  for (const v of vals) { if (Number.isInteger(v) && v >= impliedN && v <= 26) { n = v; break; } }
  if (n < 1 || n > 26) return null;
  return { edges, n, directed };
}

function GraphSvg({ n, edges }) {
  const R = 82, cx = 100, cy = 100;
  const pos = Array.from({ length: n }, (_, i) => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) };
  });
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxWidth: 240, display: 'block' }} preserveAspectRatio="xMidYMid meet">
      {edges.map(([a, b], i) => (a < n && b < n) && (
        <line key={i} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y}
          stroke="var(--border)" strokeWidth="2" />
      ))}
      {pos.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="12" fill="rgba(var(--accent-rgb),0.12)" stroke="var(--accent)" strokeWidth="1.5" />
          <text x={p.x} y={p.y} dy="0.35em" textAnchor="middle" fontSize="11" fill="var(--text-main)" fontWeight="600">{i}</text>
        </g>
      ))}
    </svg>
  );
}

function pickTree(vals, params) {
  // a level-order array with possible nulls, named root/tree, holding ints
  for (let j = 0; j < vals.length; j++) {
    const name = (params[j]?.name || '').toLowerCase();
    const v = vals[j];
    if (Array.isArray(v) && v.length > 0 && v.length <= 31 && /^(root|tree|head|node)$/.test(name)
      && v.every(x => x === null || Number.isInteger(x))) return v;
  }
  return null;
}

function TreeSvg({ arr }) {
  // BFS positions from a LeetCode level-order array with nulls for missing kids.
  let maxDepth = 0;
  // reconstruct parent/child from the compact (null-aware) encoding
  const built = [];
  for (let k = 0; k < arr.length; k++) built.push(arr[k]);
  // assign coordinates: standard heap-style is wrong with nulls, so walk a queue
  let ptr = 1; const childOf = {};
  for (let p = 0; p < built.length && ptr < built.length; p++) {
    if (built[p] === null) continue;
    if (ptr < built.length) { if (built[ptr] !== null) childOf[`${p}-L`] = ptr; ptr++; }
    if (ptr < built.length) { if (built[ptr] !== null) childOf[`${p}-R`] = ptr; ptr++; }
  }
  // depth by BFS over childOf
  const depth = new Array(built.length).fill(0); const order = [0]; const seen = new Set([0]);
  for (let h = 0; h < order.length; h++) {
    const p = order[h];
    for (const side of ['L', 'R']) { const c = childOf[`${p}-${side}`]; if (c !== undefined && !seen.has(c)) { depth[c] = depth[p] + 1; maxDepth = Math.max(maxDepth, depth[c]); seen.add(c); order.push(c); } }
  }
  // x by in-order-ish slot within each depth
  const perDepth = {}; order.forEach(idx => { perDepth[depth[idx]] = perDepth[depth[idx]] || []; perDepth[depth[idx]].push(idx); });
  const W = 260, rowH = 46; const H = (maxDepth + 1) * rowH + 20;
  const xy = {};
  Object.keys(perDepth).forEach(d => { const row = perDepth[d]; row.forEach((idx, k) => { xy[idx] = { x: ((k + 1) / (row.length + 1)) * W, y: 22 + d * rowH }; }); });
  const lines = [];
  Object.keys(childOf).forEach(key => { const [p] = key.split('-'); const c = childOf[key]; if (xy[+p] && xy[c]) lines.push([xy[+p], xy[c]]); });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 320, display: 'block' }} preserveAspectRatio="xMidYMid meet">
      {lines.map(([a, b], i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border)" strokeWidth="2" />)}
      {order.map(idx => xy[idx] && (
        <g key={idx}>
          <circle cx={xy[idx].x} cy={xy[idx].y} r="13" fill="rgba(var(--accent-rgb),0.12)" stroke="var(--accent)" strokeWidth="1.5" />
          <text x={xy[idx].x} y={xy[idx].y} dy="0.35em" textAnchor="middle" fontSize="11" fill="var(--text-main)" fontWeight="600">{built[idx]}</text>
        </g>
      ))}
    </svg>
  );
}

function Cells({ rows }) {
  return (
    <div className="exviz-cells">
      {rows.map((row, r) => (
        <div key={r} className="exviz-row">
          {row.map((c, i) => (
            <div key={i} className="exviz-cell" title={String(c)}>{String(c)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Pick the best inline diagram for an example's inputs (React Compiler memoizes
// the caller, so no manual useMemo needed).
function buildExampleModel(inputs, params) {
  const vals = (Array.isArray(inputs) ? inputs : []).map(parse);
  const ps = Array.isArray(params) ? params : [];
  if (!vals.length) return null;
  const g = pickGraph(vals);
  if (g && g.edges.length <= 60) return { kind: 'graph', ...g };
  const tree = pickTree(vals, ps);
  if (tree) return { kind: 'tree', arr: tree };
  // matrix (grid) — first matrix param, bounded size
  for (let j = 0; j < vals.length; j++) {
    const v = vals[j];
    if (isMatrix(v) && v.length <= 12 && v[0].length <= 16) return { kind: 'cells', rows: v.map(r => r.map(x => x)) };
  }
  // flat array — first array param
  for (let j = 0; j < vals.length; j++) {
    const v = vals[j];
    if (isFlat(v) && v.length > 0 && v.length <= 24) return { kind: 'cells', rows: [v] };
  }
  // string — first string param of reasonable length
  for (let j = 0; j < vals.length; j++) {
    const v = vals[j];
    if (typeof v === 'string' && v.length >= 1 && v.length <= 28) return { kind: 'cells', rows: [v.split('')] };
  }
  return null;
}

export default function ExampleViz({ inputs, params }) {
  const model = buildExampleModel(inputs, params);
  if (!model) return null;
  return (
    <div className="exviz">
      {model.kind === 'graph' && <GraphSvg n={model.n} edges={model.edges} />}
      {model.kind === 'tree' && <TreeSvg arr={model.arr} />}
      {model.kind === 'cells' && <Cells rows={model.rows} />}
    </div>
  );
}
