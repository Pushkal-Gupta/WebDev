// ─────────────────────────────────────────────────────────────────────────
// sceneGenerators — compile the compact step-frame format (the same shape the
// AlgoVisualizer stepper consumes: { array, pointers, highlights, chip, subRow,
// window, caption }) into a continuous, keyframed SceneVisualizer scene.
//
// This is the scalable path: every problem that already has `viz_steps.frames`
// (thousands of them) gets a real MANIM-style animated scene for free — cells
// persist and pop, pointers glide, roles cross-fade, aux rows fill, captions and
// beats line up — without hand-authoring a bespoke timeline per problem. New
// problems only need the simple frame list (easy for agents to write); the
// archetype builders below emit those frames from a handful of parameters.
// ─────────────────────────────────────────────────────────────────────────

const STEP = 1400;   // ms between frames
const MOVE = 560;    // ms a value takes to transition into its new frame (hold before)
const W = 900;

// Role → visual style. Colors are theme tokens (SceneVisualizer resolves + tweens).
const ROLE_STYLE = {
  current:  { fill: 'accent', textFill: 'bg', lift: 9, scale: 1.09, ease: 'back' },
  compared: { fill: 'sky', textFill: 'bg', lift: 4, scale: 1.03 },
  match:    { fill: 'mint', textFill: 'bg', lift: 9, scale: 1.11, ease: 'back' },
  found:    { fill: 'mint', textFill: 'bg', lift: 9, scale: 1.11, ease: 'back' },
  visited:  { fill: 'hover-box', textFill: 'text-dim', lift: 0, scale: 0.97 },
  done:     { fill: 'mint', textFill: 'bg', lift: 0, scale: 1 },
  mid:      { fill: 'accent', textFill: 'bg', lift: 9, scale: 1.09, ease: 'back' },
  low:      { fill: 'medium', textFill: 'bg', lift: 0, scale: 1 },
  high:     { fill: 'medium', textFill: 'bg', lift: 0, scale: 1 },
  left:     { fill: 'sky', textFill: 'bg', lift: 2, scale: 1 },
  right:    { fill: 'violet', textFill: 'bg', lift: 2, scale: 1 },
  pivot:    { fill: 'pink', textFill: 'bg', lift: 11, scale: 1.1, ease: 'back' },
  frontier: { fill: 'sky', textFill: 'bg', lift: 2, scale: 1 },
  window:   { fill: 'hover-box', textFill: 'text-main', lift: 0, scale: 1 },
  key:      { fill: 'pink', textFill: 'bg', lift: 4, scale: 1.03 },
  eliminated: { fill: 'bg', textFill: 'text-dim', lift: 0, scale: 0.9 },
  tree:     { fill: 'violet', textFill: 'bg', lift: 0, scale: 1 },
  default:  { fill: 'surface', textFill: 'text-main', lift: 0, scale: 1 },
};
function styleFor(role) { return ROLE_STYLE[role] || ROLE_STYLE.default; }

// Pointer lane priority so a given name keeps its vertical track.
const POINTER_LANES = ['lo', 'l', 'left', 'low', 'i', 'p', 'mid', 'pivot', 'cur', 'k', 'j', 'r', 'right', 'hi', 'high', 'match', 'prev'];
function laneRank(name) { const r = POINTER_LANES.indexOf(String(name).toLowerCase()); return r === -1 ? POINTER_LANES.length : r; }

// Build a keyframe track from a per-frame value array with a hold-then-move feel.
// Numeric tracks always move; string/color tracks only emit on change.
function buildTrack(vals, { numeric = false, ease = 'smooth' } = {}) {
  const kfs = [];
  let last;
  for (let k = 0; k < vals.length; k++) {
    const v = vals[k];
    if (v == null) continue;
    const t = k * STEP;
    if (k === 0) { kfs.push({ t: 0, v }); last = v; continue; }
    if (!numeric && v === last) continue;
    kfs.push({ t: Math.max(0, t - MOVE), v: last });          // hold previous
    kfs.push({ t, v, ease });                                  // arrive at new
    last = v;
  }
  return kfs.length ? kfs : undefined;
}

function normHighlights(h) {
  if (!h) return {};
  if (Array.isArray(h)) { const m = {}; for (const i of h) m[i] = 'current'; return m; }
  return h;
}
function pointerIndexMap(p) {
  // returns { name: index } for one frame
  const out = {};
  if (!p) return out;
  for (const [k, v] of Object.entries(p)) {
    const idx = Number(k);
    if (!Number.isFinite(idx)) continue;
    (Array.isArray(v) ? v : [v]).forEach((name) => { if (name != null) out[String(name)] = idx; });
  }
  return out;
}

// Dispatch by renderer. Returns null when we can't compile (stepper stays).
export function framesToScene(viz) {
  if (!viz || !Array.isArray(viz.frames) || !viz.frames.length) return null;
  const renderer = viz.renderer || 'array';
  if (renderer === 'array' || renderer === 'window') return arrayFramesToScene(viz);
  if (renderer === 'grid') return gridFramesToScene(viz);
  if (renderer === 'graph' || renderer === 'tree') return graphFramesToScene(viz);
  return null;
}

// Compile array/window frames into a scene.
function arrayFramesToScene(viz) {
  const renderer = viz.renderer || 'array';
  const frames = viz.frames;
  const F = frames.length;

  // Canonical cell set = the widest array seen; frames that collapse to a
  // shorter array (e.g. a final [answer]) reuse the previous full row so the
  // layout never jumps.
  let n = 0;
  for (const f of frames) if (Array.isArray(f.array) && f.array.length > n) n = f.array.length;
  if (n === 0 || n > 24) return null;

  const effArrays = [];
  let lastFull = null;
  for (const f of frames) {
    if (Array.isArray(f.array) && f.array.length === n) { lastFull = f.array; effArrays.push(f.array); }
    else effArrays.push(lastFull || (Array.isArray(f.array) ? f.array : []));
  }
  if (!lastFull) return null;

  // Layout
  const gap = 12;
  const cellW = Math.max(30, Math.min(78, Math.floor((760 - (n - 1) * gap) / n)));
  const cellH = Math.min(74, cellW);
  const totalW = n * cellW + (n - 1) * gap;
  const startX = Math.round((W - totalW) / 2);
  const cellY = 150;
  const cellX = (i) => startX + i * (cellW + gap);
  const cellCX = (i) => cellX(i) + cellW / 2;
  const anyChips = frames.some((f) => f.chip);
  const anySub = frames.some((f) => f.subRow && Array.isArray(f.subRow.values));
  const subY = cellY + cellH + 34;
  const viewH = anySub ? subY + 46 : cellY + cellH + 56;

  const objects = [];

  // Cells (persist across the whole scene; fill/textFill/scale/lift/value tween).
  for (let i = 0; i < n; i++) {
    const fillVals = [], textVals = [], scaleVals = [], liftVals = [], valueVals = [];
    for (let k = 0; k < F; k++) {
      const hl = normHighlights(frames[k].highlights);
      const win = frames[k].window;
      let role = hl[i];
      if (!role && renderer === 'window' && win) {
        const l = Array.isArray(win) ? win[0] : win.start;
        const r = Array.isArray(win) ? win[1] : win.end;
        if (i >= l && i <= r) role = 'window';
      }
      const st = styleFor(role);
      fillVals.push(st.fill);
      textVals.push(st.textFill);
      scaleVals.push(st.scale);
      liftVals.push(st.lift);
      valueVals.push(effArrays[k][i]);
    }
    const tracks = {};
    const ft = buildTrack(fillVals); if (ft) tracks.fill = ft;
    const tt = buildTrack(textVals); if (tt) tracks.textFill = tt;
    const scEase = 'back';
    const sc = buildTrack(scaleVals, { numeric: true, ease: scEase }); if (sc) tracks.scale = sc;
    const lf = buildTrack(liftVals, { numeric: true }); if (lf) tracks.lift = lf;
    // value only if it actually changes over time
    const valuesChange = valueVals.some((v, idx) => idx > 0 && v !== valueVals[idx - 1]);
    if (valuesChange) { const vt = buildTrack(valueVals); if (vt) tracks.value = vt; }
    objects.push({
      id: `cell${i}`, type: 'cell',
      base: { x: cellX(i), y: cellY, w: cellW, h: cellH, rx: 9, value: lastFull[i], idx: i, fill: 'surface', textFill: 'text-main' },
      tracks,
    });
  }

  // Pointers — each distinct name is one gliding token on its own lane.
  const allNames = new Set();
  frames.forEach((f) => { Object.keys(pointerIndexMap(f.pointers)).forEach((nm) => allNames.add(nm)); });
  // window renderer auto-adds l/r if the frames don't already carry pointers.
  if (renderer === 'window' && allNames.size === 0) { allNames.add('l'); allNames.add('r'); }
  const names = [...allNames].sort((a, b) => laneRank(a) - laneRank(b) || a.localeCompare(b));
  names.forEach((name, laneIdx) => {
    const xVals = [], opVals = [];
    let lastX = cellCX(0);
    for (let k = 0; k < F; k++) {
      let idxMap = pointerIndexMap(frames[k].pointers);
      if (renderer === 'window' && !Object.keys(idxMap).length && frames[k].window) {
        const w = frames[k].window;
        const l = Array.isArray(w) ? w[0] : w.start; const r = Array.isArray(w) ? w[1] : w.end;
        idxMap = { l, r };
      }
      if (name in idxMap && idxMap[name] >= 0 && idxMap[name] < n) {
        lastX = cellCX(idxMap[name]); xVals.push(lastX); opVals.push(1);
      } else { xVals.push(lastX); opVals.push(0); }
    }
    objects.push({
      id: `ptr_${name}`, type: 'pointer',
      base: { x: cellCX(0), y: cellY - 44 - laneIdx * 24, value: name },
      tracks: { x: buildTrack(xVals, { numeric: true, ease: 'back' }), opacity: buildTrack(opVals, { numeric: true }) },
    });
  });

  // Sub-row (dp / prefix / seen map) — one label per index that fades in when it
  // holds a value.
  if (anySub) {
    const sub0 = frames.find((f) => f.subRow && Array.isArray(f.subRow.values))?.subRow;
    const label = sub0?.label;
    if (label) objects.push({ id: 'subLabel', type: 'label', base: { x: startX - 12, y: subY, value: `${label}:`, anchor: 'end', fill: 'text-dim', size: 12, weight: '700' } });
    for (let i = 0; i < n; i++) {
      const valVals = [], opVals = [];
      let last = '';
      for (let k = 0; k < F; k++) {
        const sr = frames[k].subRow;
        const v = sr && Array.isArray(sr.values) ? sr.values[i] : undefined;
        const has = v !== undefined && v !== null && v !== '';
        valVals.push(has ? v : last);
        opVals.push(has ? 1 : 0);
        if (has) last = v;
      }
      if (opVals.every((o) => o === 0)) continue;
      objects.push({
        id: `sub${i}`, type: 'label',
        base: { x: cellCX(i), y: subY, value: '', fill: 'violet', size: 13, weight: '700' },
        tracks: { value: buildTrack(valVals), opacity: buildTrack(opVals, { numeric: true }), scale: buildTrack(opVals.map((o) => (o ? 1 : 0.6)), { numeric: true, ease: 'back' }) },
      });
    }
  }

  // Chips — up to 3 stat chips across the top; each shows "LABEL value".
  if (anyChips) {
    const maxChips = frames.reduce((m, f) => Math.max(m, Array.isArray(f.chip) ? f.chip.length : (f.chip ? 1 : 0)), 0);
    const chipY = 42;
    const slotW = Math.min(240, (totalW) / Math.max(1, maxChips));
    for (let c = 0; c < maxChips; c++) {
      const textVals = [], opVals = [], colorVals = [];
      for (let k = 0; k < F; k++) {
        const chips = Array.isArray(frames[k].chip) ? frames[k].chip : (frames[k].chip ? [frames[k].chip] : []);
        const ch = chips[c];
        if (ch && (ch.label != null || ch.value != null)) {
          textVals.push(`${ch.label != null ? String(ch.label).toUpperCase() + '  ' : ''}${ch.value != null ? ch.value : ''}`);
          opVals.push(1);
          colorVals.push(ch.tone || 'accent');
        } else { textVals.push(textVals.length ? textVals[textVals.length - 1] : ''); opVals.push(0); colorVals.push(colorVals.length ? colorVals[colorVals.length - 1] : 'accent'); }
      }
      const cx = maxChips === 1 ? W / 2 : startX + slotW / 2 + c * slotW;
      objects.push({
        id: `chip${c}`, type: 'label',
        base: { x: cx, y: chipY, value: '', fill: 'accent', size: 15, weight: '700' },
        tracks: { value: buildTrack(textVals), opacity: buildTrack(opVals, { numeric: true }), fill: buildTrack(colorVals) },
      });
    }
  }

  const captions = frames.map((f, k) => ({ t: k * STEP, text: f.caption || '' }));
  const beats = frames.map((f, k) => ({ t: k * STEP, label: (f.chip && !Array.isArray(f.chip) && f.chip.label) ? String(f.chip.label) : `step ${k + 1}` }));

  return {
    title: viz.title,
    viewBox: [0, 0, W, viewH],
    objects,
    captions,
    beats,
  };
}

// Compile grid frames (matrix / DP-grid / BFS) into a scene. Cells hold values
// that change over time; a cell that changes this frame flashes (accent + pop)
// then settles, producing a wavefront/fill animation.
function gridFramesToScene(viz) {
  const frames = viz.frames;
  const F = frames.length;
  let R = 0, C = 0;
  for (const f of frames) {
    if (Array.isArray(f.grid) && f.grid.length) {
      R = Math.max(R, f.grid.length);
      C = Math.max(C, ...f.grid.map((row) => (Array.isArray(row) ? row.length : 0)));
    }
  }
  if (R === 0 || C === 0 || R > 12 || C > 16) return null;

  // Effective grid per frame (carry forward the last full-dimension grid so a
  // frame that shrinks to a summary [[value]] doesn't collapse the layout).
  const eff = [];
  let lastFull = null;
  for (const f of frames) {
    if (Array.isArray(f.grid) && f.grid.length === R && f.grid.every((row) => Array.isArray(row) && row.length === C)) { lastFull = f.grid; eff.push(f.grid); }
    else eff.push(lastFull);
  }
  if (!lastFull) return null;
  for (let k = 0; k < F; k++) if (!eff[k]) eff[k] = lastFull;

  const anyChips = frames.some((f) => f.chip);
  const gap = 6;
  const topY = anyChips ? 84 : 60;
  const cell = Math.max(20, Math.min(64, Math.floor((760 - (C - 1) * gap) / C), Math.floor((320 - (R - 1) * gap) / R)));
  const gridW = C * cell + (C - 1) * gap;
  const startX = Math.round((W - gridW) / 2);
  const cellX = (c) => startX + c * (cell + gap);
  const cellY = (r) => topY + r * (cell + gap);
  const viewH = topY + R * (cell + gap) + 34;
  const fontSize = Math.max(10, Math.min(20, Math.floor(cell * 0.42)));

  const objects = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const valueVals = [], fillVals = [], textVals = [], scaleVals = [];
      let prev;
      for (let k = 0; k < F; k++) {
        const v = eff[k][r] ? eff[k][r][c] : undefined;
        const changed = k > 0 && v !== prev;
        // explicit per-cell role if the frame provides highlights keyed "r,c"
        const hlRole = frames[k].highlights && (frames[k].highlights[`${r},${c}`] || frames[k].highlights[`${r}-${c}`]);
        const role = hlRole || (changed ? 'current' : 'default');
        const st = styleFor(role);
        valueVals.push(v);
        fillVals.push(st.fill);
        textVals.push(st.textFill);
        scaleVals.push(role === 'current' ? 1.12 : (st.scale ?? 1));
        prev = v;
      }
      const tracks = {};
      const vt = buildTrack(valueVals); if (vt) tracks.value = vt;
      const ft = buildTrack(fillVals); if (ft) tracks.fill = ft;
      const tt = buildTrack(textVals); if (tt) tracks.textFill = tt;
      const sc = buildTrack(scaleVals, { numeric: true, ease: 'back' }); if (sc) tracks.scale = sc;
      objects.push({
        id: `g${r}_${c}`, type: 'cell',
        base: { x: cellX(c), y: cellY(r), w: cell, h: cell, rx: 6, value: lastFull[r][c], fill: 'surface', textFill: 'text-main', size: fontSize },
        tracks,
      });
    }
  }

  if (anyChips) {
    const textVals = [], opVals = [], colorVals = [];
    for (let k = 0; k < F; k++) {
      const ch = Array.isArray(frames[k].chip) ? frames[k].chip[0] : frames[k].chip;
      if (ch && (ch.label != null || ch.value != null)) { textVals.push(`${ch.label != null ? String(ch.label).toUpperCase() + '  ' : ''}${ch.value != null ? ch.value : ''}`); opVals.push(1); colorVals.push(ch.tone || 'accent'); }
      else { textVals.push(textVals.length ? textVals[textVals.length - 1] : ''); opVals.push(0); colorVals.push('accent'); }
    }
    objects.push({ id: 'chip0', type: 'label', base: { x: W / 2, y: 42, value: '', fill: 'accent', size: 15, weight: '700' }, tracks: { value: buildTrack(textVals), opacity: buildTrack(opVals, { numeric: true }), fill: buildTrack(colorVals) } });
  }

  return {
    title: viz.title,
    viewBox: [0, 0, W, viewH],
    objects,
    captions: frames.map((f, k) => ({ t: k * STEP, text: f.caption || '' })),
    beats: frames.map((f, k) => ({ t: k * STEP, label: `step ${k + 1}` })),
  };
}

// Compile graph / tree frames into a scene. Node positions are fixed (circle
// layout for graphs, layered for trees); animation is node/edge state colour
// cross-fade plus a focus pop on the "current" node each frame.
function graphFramesToScene(viz) {
  const frames = viz.frames;
  const F = frames.length;
  const isTree = viz.renderer === 'tree';

  // Collect the node set + edges from the union of all frames.
  const nodeIds = [];
  const seen = new Set();
  const edgeSet = new Map();
  for (const f of frames) {
    for (const nd of (f.nodes || [])) { const id = String(nd.id); if (!seen.has(id)) { seen.add(id); nodeIds.push(id); } }
    for (const e of (f.edges || [])) { const a = String(e[0] ?? e.a ?? e.from), b = String(e[1] ?? e.b ?? e.to); const key = `${a}|${b}`; if (!edgeSet.has(key)) edgeSet.set(key, [a, b]); }
  }
  if (nodeIds.length === 0 || nodeIds.length > 26) return null;

  const anyChips = frames.some((f) => f.chip);
  const topY = anyChips ? 70 : 40;
  const cxC = W / 2;
  const N = nodeIds.length;
  const R = Math.max(90, Math.min(150, N * 16));
  const cyC = topY + R + 20;
  const pos = {};
  nodeIds.forEach((id, i) => {
    const ang = (i / N) * 2 * Math.PI - Math.PI / 2;
    pos[id] = { x: cxC + R * Math.cos(ang), y: cyC + R * Math.sin(ang) };
  });
  const viewH = cyC + R + 40;

  const NODE_ROLE = {
    current: { fill: 'accent', textFill: 'bg', scale: 1.18 },
    visited: { fill: 'mint', textFill: 'bg', scale: 1 },
    done: { fill: 'mint', textFill: 'bg', scale: 1 },
    frontier: { fill: 'sky', textFill: 'bg', scale: 1.05 },
    match: { fill: 'mint', textFill: 'bg', scale: 1.12 },
    default: { fill: 'surface', textFill: 'text-main', scale: 1 },
  };
  const nodeState = (f, id) => {
    const nd = (f.nodes || []).find((x) => String(x.id) === id);
    if (nd && nd.state) return nd.state;
    if (f.highlightedNodes && f.highlightedNodes[id]) return f.highlightedNodes[id];
    return null;
  };

  const objects = [];
  // Edges first (under nodes).
  for (const [key, [a, b]] of edgeSet) {
    if (!pos[a] || !pos[b]) continue;
    const strokeVals = [];
    for (let k = 0; k < F; k++) {
      const present = (frames[k].edges || []).some((e) => (String(e[0] ?? e.a ?? e.from) === a && String(e[1] ?? e.b ?? e.to) === b));
      const st = (frames[k].edges || []).find((e) => String(e[0] ?? e.a ?? e.from) === a && String(e[1] ?? e.b ?? e.to) === b)?.state;
      strokeVals.push(st === 'current' || st === 'visited' || st === 'tree' ? 'accent' : present ? 'border' : 'border');
    }
    objects.push({ id: `e_${key}`, type: 'line', base: { x: pos[a].x, y: pos[a].y, x2: pos[b].x, y2: pos[b].y, stroke: 'border', thickness: 2 }, tracks: { stroke: buildTrack(strokeVals) } });
  }
  // Nodes.
  for (const id of nodeIds) {
    const fillVals = [], textVals = [], scaleVals = [];
    for (let k = 0; k < F; k++) {
      const st = NODE_ROLE[nodeState(frames[k], id)] || NODE_ROLE.default;
      fillVals.push(st.fill); textVals.push(st.textFill); scaleVals.push(st.scale);
    }
    const label = (() => { for (const f of frames) { const nd = (f.nodes || []).find((x) => String(x.id) === id); if (nd && nd.label != null) return nd.label; } return id; })();
    objects.push({
      id: `n_${id}`, type: 'node',
      base: { cx: pos[id].x, cy: pos[id].y, r: 20, value: label, fill: 'surface', textFill: 'text-main' },
      tracks: { fill: buildTrack(fillVals), textFill: buildTrack(textVals), scale: buildTrack(scaleVals, { numeric: true, ease: 'back' }) },
    });
  }

  if (anyChips) {
    const textVals = [], opVals = [], colorVals = [];
    for (let k = 0; k < F; k++) {
      const ch = Array.isArray(frames[k].chip) ? frames[k].chip[0] : frames[k].chip;
      if (ch && (ch.label != null || ch.value != null)) { textVals.push(`${ch.label != null ? String(ch.label).toUpperCase() + '  ' : ''}${ch.value != null ? ch.value : ''}`); opVals.push(1); colorVals.push(ch.tone || 'accent'); }
      else { textVals.push(textVals.length ? textVals[textVals.length - 1] : ''); opVals.push(0); colorVals.push('accent'); }
    }
    objects.push({ id: 'chip0', type: 'label', base: { x: W / 2, y: 40, value: '', fill: 'accent', size: 15, weight: '700' }, tracks: { value: buildTrack(textVals), opacity: buildTrack(opVals, { numeric: true }), fill: buildTrack(colorVals) } });
  }
  // `isTree` kept for future layered layout; circle layout works for both today.
  void isTree;

  return {
    title: viz.title,
    viewBox: [0, 0, W, viewH],
    objects,
    captions: frames.map((f, k) => ({ t: k * STEP, text: f.caption || '' })),
    beats: frames.map((f, k) => ({ t: k * STEP, label: `step ${k + 1}` })),
  };
}

// ── Archetype frame builders ───────────────────────────────────────────────
// Emit the simple frame list from a few parameters; feed through framesToScene
// for the animation. Handy for problems that don't yet have hand-authored
// frames. Each returns { title, renderer:'array', frames }.

// Two pointers converging on a target sum in a sorted array.
export function genTwoPointerSum(nums, target, title = 'Two pointers') {
  const frames = [{ array: nums, chip: { label: 'target', value: target, tone: 'accent' }, caption: `Sorted array. Place lo at the left and hi at the right; their sum tells us which way to move to reach ${target}.` }];
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const sum = nums[lo] + nums[hi];
    const done = sum === target;
    frames.push({
      array: nums,
      pointers: { [lo]: 'lo', [hi]: 'hi' },
      highlights: { [lo]: done ? 'match' : 'compared', [hi]: done ? 'match' : 'compared' },
      chip: { label: 'sum', value: `${nums[lo]} + ${nums[hi]} = ${sum}`, tone: done ? 'mint' : 'sky' },
      caption: done ? `${nums[lo]} + ${nums[hi]} = ${target} — found the pair.` : (sum < target ? `${sum} < ${target}: too small, move lo right.` : `${sum} > ${target}: too big, move hi left.`),
    });
    if (done) break;
    if (sum < target) lo++; else hi--;
  }
  return { title, renderer: 'array', frames };
}

// Binary search for target in a sorted array.
export function genBinarySearch(nums, target, title = 'Binary search') {
  const frames = [{ array: nums, chip: { label: 'target', value: target, tone: 'accent' }, caption: `Sorted array. Halve the search space each step by comparing the middle element to ${target}.` }];
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const hit = nums[mid] === target;
    const hl = {};
    for (let i = 0; i < nums.length; i++) if (i < lo || i > hi) hl[i] = 'eliminated';
    hl[mid] = hit ? 'match' : 'mid';
    frames.push({
      array: nums,
      pointers: lo === hi ? { [mid]: ['lo', 'hi', 'mid'] } : { [lo]: 'lo', [hi]: 'hi', [mid]: 'mid' },
      highlights: hl,
      chip: { label: 'mid', value: `nums[${mid}] = ${nums[mid]}`, tone: hit ? 'mint' : 'sky' },
      caption: hit ? `nums[${mid}] = ${target} — found at index ${mid}.` : (nums[mid] < target ? `${nums[mid]} < ${target}: discard the left half, move lo above mid.` : `${nums[mid]} > ${target}: discard the right half, move hi below mid.`),
    });
    if (hit) break;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return { title, renderer: 'array', frames };
}
