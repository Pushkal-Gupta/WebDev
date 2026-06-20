import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, RotateCcw, Play, Pause, SkipForward, ListPlus } from 'lucide-react';
import './RadixTreeViz.css';

const DEFAULT_SEQUENCE = ['apple', 'app', 'apex', 'apply', 'ban', 'banana'];

const NODE_R = 16;
const LEVEL_H = 88;
const LEAF_GAP = 78;
const PAD_X = 36;
const PAD_Y = 40;
const STEP_MS = 900;

function createNode() {
  return { children: new Map(), end: false };
}

function commonPrefixLen(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

// Radix-tree insert with edge splitting. Returns a structured log of steps
// taken (used to drive the animation): walk / split / new-edge / mark-terminal.
function insertWithSteps(root, word) {
  const steps = [];
  if (!word) return steps;
  let cur = root;
  let path = '';
  let remaining = word;

  steps.push({ kind: 'start', word, path: '', remaining, label: `Start at root inserting "${word}"` });

  while (remaining.length > 0) {
    const first = remaining[0];
    if (!cur.children.has(first)) {
      // No outgoing edge starting with this char; create new leaf edge.
      const leaf = createNode();
      leaf.end = true;
      cur.children.set(first, { label: remaining, node: leaf });
      steps.push({
        kind: 'new-edge',
        word,
        atPath: path,
        edgeLabel: remaining,
        newPath: path + remaining,
        label: `No edge starts with "${first}". Add new edge "${remaining}" and mark terminal`,
      });
      return steps;
    }

    const edge = cur.children.get(first);
    const cpl = commonPrefixLen(edge.label, remaining);

    if (cpl === edge.label.length) {
      // Entire edge label consumed; descend.
      steps.push({
        kind: 'walk',
        word,
        fromPath: path,
        toPath: path + edge.label,
        edgeLabel: edge.label,
        consumed: edge.label,
        label: `Edge "${edge.label}" fully matched. Walk down`,
      });
      cur = edge.node;
      path += edge.label;
      remaining = remaining.slice(cpl);
      if (remaining.length === 0) {
        const wasEnd = cur.end;
        cur.end = true;
        steps.push({
          kind: 'mark-terminal',
          word,
          atPath: path,
          alreadyTerminal: wasEnd,
          label: wasEnd
            ? `"${word}" already present (terminal already set)`
            : `Mark node at "${path}" as terminal`,
        });
        return steps;
      }
      continue;
    }

    // Partial match: split the edge at cpl.
    const sharedPrefix = edge.label.slice(0, cpl);
    const oldSuffix = edge.label.slice(cpl);
    const newSuffix = remaining.slice(cpl);

    const splitNode = createNode();
    // Re-attach old child under split node with its remaining suffix.
    splitNode.children.set(oldSuffix[0], { label: oldSuffix, node: edge.node });
    // Replace edge in parent with shorter shared-prefix edge to splitNode.
    cur.children.set(first, { label: sharedPrefix, node: splitNode });

    steps.push({
      kind: 'split',
      word,
      atPath: path,
      oldLabel: edge.label,
      sharedPrefix,
      oldSuffix,
      newSuffix,
      splitPath: path + sharedPrefix,
      label: `Split edge "${edge.label}" into "${sharedPrefix}" + "${oldSuffix}" at "${path + sharedPrefix}"`,
    });

    if (newSuffix.length === 0) {
      // Word ends exactly at the split node.
      splitNode.end = true;
      steps.push({
        kind: 'mark-terminal',
        word,
        atPath: path + sharedPrefix,
        alreadyTerminal: false,
        label: `Word ends at split. Mark "${path + sharedPrefix}" as terminal`,
      });
      return steps;
    }

    // Otherwise add a sibling edge for the new suffix.
    const leaf = createNode();
    leaf.end = true;
    splitNode.children.set(newSuffix[0], { label: newSuffix, node: leaf });
    steps.push({
      kind: 'new-edge',
      word,
      atPath: path + sharedPrefix,
      edgeLabel: newSuffix,
      newPath: path + sharedPrefix + newSuffix,
      label: `Add sibling edge "${newSuffix}" under "${path + sharedPrefix}"`,
    });
    return steps;
  }

  // remaining empty from the top: root marks word (shouldn't happen for non-empty)
  cur.end = true;
  steps.push({
    kind: 'mark-terminal',
    word,
    atPath: path,
    alreadyTerminal: false,
    label: `Mark root as terminal`,
  });
  return steps;
}

function buildRadix(words) {
  const root = createNode();
  for (const w of words) insertWithSteps(root, w);
  return root;
}

// Layout: bottom-up width measurement, then x-placement. Returns nodes + edges
// + idByPath, with edges carrying the prefix label and its position.
function layoutRadix(root) {
  let nextId = 0;
  const nodes = [];
  const edges = [];

  function assignIds(node, parentId, edgeLabel, depth, path) {
    const id = nextId++;
    nodes.push({
      id,
      end: node.end,
      depth,
      path,
      parentId,
      edgeLabelFromParent: edgeLabel,
    });
    const childKeys = [...node.children.keys()].sort();
    const childIds = [];
    for (const k of childKeys) {
      const e = node.children.get(k);
      const childId = assignIds(e.node, id, e.label, depth + 1, path + e.label);
      childIds.push(childId);
      edges.push({ from: id, to: childId, label: e.label });
    }
    nodes[id].children = childIds;
    return id;
  }
  assignIds(root, null, null, 0, '');

  function measure(id) {
    const n = nodes[id];
    if (n.children.length === 0) {
      // Wider gap for radix trees because edges carry strings.
      const labelLen = n.edgeLabelFromParent ? n.edgeLabelFromParent.length : 0;
      n.width = Math.max(LEAF_GAP, 18 + labelLen * 8);
      return n.width;
    }
    let total = 0;
    for (const cid of n.children) total += measure(cid);
    n.width = Math.max(LEAF_GAP, total);
    return n.width;
  }
  measure(0);

  function place(id, leftX) {
    const n = nodes[id];
    if (n.children.length === 0) {
      n.x = leftX + n.width / 2;
    } else {
      let cursor = leftX;
      for (const cid of n.children) {
        const cw = nodes[cid].width;
        place(cid, cursor);
        cursor += cw;
      }
      const first = nodes[n.children[0]];
      const last = nodes[n.children[n.children.length - 1]];
      n.x = (first.x + last.x) / 2;
    }
    n.y = PAD_Y + n.depth * LEVEL_H;
  }
  place(0, 0);

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = 0;
    maxY = 0;
  }

  const shift = PAD_X - minX;
  for (const n of nodes) n.x += shift;

  const width = (maxX - minX) + PAD_X * 2;
  const height = maxY + PAD_Y + NODE_R + 18;

  const idByPath = new Map();
  for (const n of nodes) idByPath.set(n.path, n.id);

  return { nodes, edges, width, height, idByPath };
}

function countWords(nodes) {
  return nodes.reduce((acc, n) => acc + (n.end ? 1 : 0), 0);
}

// Search-mode frames: walk down the radix tree consuming as much of the word as
// possible per edge; mismatches mid-edge or unknown first-char children abort.
function buildSearchFrames(root, word) {
  const frames = [];
  if (!word) return frames;

  // We rebuild a path -> node map by walking the tree.
  // Track current node, path-so-far, remaining query.
  let cur = root;
  let path = '';
  let remaining = word;

  frames.push({
    activePaths: new Set([path]),
    currentPath: path,
    edgeActivePath: null,
    consumed: '',
    remaining,
    status: 'walking',
    label: `Start at root searching "${word}"`,
  });

  while (remaining.length > 0) {
    const first = remaining[0];
    if (!cur.children.has(first)) {
      frames.push({
        activePaths: new Set(framesActivePaths(frames)),
        currentPath: path,
        edgeActivePath: null,
        consumed: word.slice(0, word.length - remaining.length),
        remaining,
        status: 'missing',
        missingChar: first,
        label: `No edge starts with "${first}" from "${path || 'root'}". Not found`,
      });
      return frames;
    }
    const edge = cur.children.get(first);
    const cpl = commonPrefixLen(edge.label, remaining);
    if (cpl < edge.label.length) {
      // Mismatch mid-edge: the word would require splitting an existing edge => absent.
      frames.push({
        activePaths: new Set(framesActivePaths(frames)),
        currentPath: path,
        edgeActivePath: path + edge.label,
        consumed: word.slice(0, word.length - remaining.length) + edge.label.slice(0, cpl),
        remaining: remaining.slice(cpl),
        status: 'missing',
        missingChar: remaining[cpl] || '',
        label: `Edge "${edge.label}" diverges from query after "${edge.label.slice(0, cpl)}". Not found`,
      });
      return frames;
    }
    // Edge fully consumed.
    cur = edge.node;
    path += edge.label;
    remaining = remaining.slice(cpl);
    frames.push({
      activePaths: new Set([...framesActivePaths(frames), path]),
      currentPath: path,
      edgeActivePath: path,
      consumed: word.slice(0, word.length - remaining.length),
      remaining,
      status: remaining.length === 0 ? 'final' : 'walking',
      label:
        remaining.length === 0
          ? `Edge "${edge.label}" matches the tail`
          : `Edge "${edge.label}" matched. Continue with "${remaining}"`,
    });
  }

  frames.push({
    activePaths: new Set(framesActivePaths(frames)),
    currentPath: path,
    edgeActivePath: path,
    consumed: word,
    remaining: '',
    status: cur.end ? 'found' : 'prefix-only',
    label: cur.end
      ? `Found: "${word}" is a complete word`
      : `Reached "${word}" but it is a prefix only`,
  });
  return frames;
}

function framesActivePaths(frames) {
  if (frames.length === 0) return [];
  return [...frames[frames.length - 1].activePaths];
}

// Insert-mode frames replay each step from insertWithSteps against a snapshot
// of the tree taken AFTER the step is applied. The animation highlights the
// "newest" path / edge so the reader sees the change.
function buildInsertFrames(beforeWords, newWord) {
  if (!newWord) return null;
  // Build a "before" tree.
  const beforeRoot = buildRadix(beforeWords);
  // Apply insertion to get the steps + after-tree.
  const steps = insertWithSteps(beforeRoot, newWord);
  // After insertion, beforeRoot is mutated to be afterRoot.
  const afterRoot = beforeRoot;
  const layoutAfter = layoutRadix(afterRoot);

  const frames = steps.map((step) => {
    // Pick a "highlighted" path & edge from the step.
    let highlightPath = null;
    let highlightEdgeTo = null;
    let phase = step.kind;

    if (step.kind === 'start') {
      highlightPath = '';
    } else if (step.kind === 'walk') {
      highlightPath = step.toPath;
      highlightEdgeTo = step.toPath;
    } else if (step.kind === 'split') {
      highlightPath = step.splitPath;
      highlightEdgeTo = step.splitPath;
    } else if (step.kind === 'new-edge') {
      highlightPath = step.newPath;
      highlightEdgeTo = step.newPath;
    } else if (step.kind === 'mark-terminal') {
      highlightPath = step.atPath;
    }
    return {
      phase,
      highlightPath,
      highlightEdgeTo,
      label: step.label,
      word: newWord,
    };
  });
  return { frames, layoutAfter };
}

export default function RadixTreeViz() {
  const [words, setWords] = useState(() => []);
  const [seqIdx, setSeqIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [searchInput, setSearchInput] = useState('apply');
  const [operation, setOperation] = useState('Empty tree. Insert words to begin');

  // Animation state: one frame queue + playhead, plus mode flag.
  const [frames, setFrames] = useState([]);
  const [frameIdx, setFrameIdx] = useState(-1);
  const [mode, setMode] = useState('idle'); // 'idle' | 'insert' | 'search'
  const [isPlayingRaw, setIsPlaying] = useState(false);

  // The layout we render: during INSERT we render the "after" layout the
  // whole time so the reader watches the new structure appear; during SEARCH
  // we render the current tree.
  const liveLayout = useMemo(() => layoutRadix(buildRadix(words)), [words]);
  const [overrideLayout, setOverrideLayout] = useState(null);
  const layout = overrideLayout || liveLayout;

  const playRef = useRef(null);

  const currentFrame =
    frameIdx >= 0 && frameIdx < frames.length ? frames[frameIdx] : null;

  const isPlaying = isPlayingRaw && frameIdx >= 0 && frameIdx < frames.length - 1;

  // Auto-advance frames when playing.
  useEffect(() => {
    if (!isPlaying) return;
    playRef.current = setTimeout(() => setFrameIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [isPlaying]);

  // Derive the search result from the final frame instead of mirroring it in
  // state — avoids a setState-in-effect cascade after the animation lands.
  const searchResult = (() => {
    if (mode !== 'search') return null;
    if (frames.length === 0) return null;
    if (frameIdx !== frames.length - 1) return null;
    const last = frames[frames.length - 1];
    return last.status === 'found' ? 'found' : 'not_found';
  })();

  const sanitize = (raw) => raw.toLowerCase().replace(/[^a-z]/g, '');

  const startInsertAnim = useCallback(
    (rawWord) => {
      const w = sanitize(rawWord);
      if (!w) {
        setOperation('Insert: input must be lowercase letters');
        return;
      }
      const built = buildInsertFrames(words, w);
      if (!built) return;
      // Commit immediately, but render the override layout while animating so
      // the new structure is the one the reader watches.
      setWords((prev) => [...prev, w]);
      setOverrideLayout(built.layoutAfter);
      setFrames(built.frames);
      setFrameIdx(0);
      setMode('insert');
      setIsPlaying(true);
      setOperation(`Inserting "${w}"`);
    },
    [words],
  );

  const onInsertTyped = useCallback(() => {
    if (inputValue.trim()) {
      startInsertAnim(inputValue);
      setInputValue('');
    } else if (seqIdx < DEFAULT_SEQUENCE.length) {
      const next = DEFAULT_SEQUENCE[seqIdx];
      setSeqIdx((i) => i + 1);
      startInsertAnim(next);
    } else {
      setOperation('Sequence exhausted. Type a word to add more, or Reset');
    }
  }, [inputValue, seqIdx, startInsertAnim]);

  const onSearch = useCallback(() => {
    const w = sanitize(searchInput);
    if (!w) {
      setOperation('Search: input must be lowercase letters');
      return;
    }
    const root = buildRadix(words);
    const f = buildSearchFrames(root, w);
    setOverrideLayout(null);
    setFrames(f);
    setFrameIdx(0);
    setMode('search');
    setIsPlaying(true);
    setOperation(`Searching "${w}"`);
  }, [searchInput, words]);

  const onPlay = useCallback(() => {
    if (frames.length === 0) return;
    if (frameIdx >= frames.length - 1) setFrameIdx(0);
    setIsPlaying(true);
  }, [frames, frameIdx]);

  const onPause = useCallback(() => {
    setIsPlaying(false);
    if (playRef.current) clearTimeout(playRef.current);
  }, []);

  const onStep = useCallback(() => {
    setIsPlaying(false);
    if (playRef.current) clearTimeout(playRef.current);
    if (frames.length === 0) return;
    if (frameIdx < frames.length - 1) setFrameIdx((i) => i + 1);
  }, [frames, frameIdx]);

  const onReset = useCallback(() => {
    setWords([]);
    setSeqIdx(0);
    setFrames([]);
    setFrameIdx(-1);
    setMode('idle');
    setIsPlaying(false);
    setOverrideLayout(null);
    setOperation('Reset. Empty tree');
    if (playRef.current) clearTimeout(playRef.current);
  }, []);

  const onLoadAll = useCallback(() => {
    setWords([...DEFAULT_SEQUENCE]);
    setSeqIdx(DEFAULT_SEQUENCE.length);
    setFrames([]);
    setFrameIdx(-1);
    setMode('idle');
    setIsPlaying(false);
    setOverrideLayout(null);
    setOperation('Loaded default sequence');
  }, []);

  // Path-set / current-node lookups for highlighting.
  const highlightPath = currentFrame ? currentFrame.highlightPath ?? currentFrame.currentPath : null;
  const activePaths =
    mode === 'search' && currentFrame ? currentFrame.activePaths : null;
  const edgeActivePath =
    currentFrame ? currentFrame.edgeActivePath ?? currentFrame.highlightEdgeTo ?? null : null;

  const opLabel = currentFrame ? currentFrame.label : operation;

  const totalNodes = layout.nodes.length;
  const totalWords = countWords(layout.nodes);

  const resultPill = (() => {
    if (mode === 'search' && currentFrame && currentFrame.status === 'missing') {
      return { text: 'Not found', kind: 'fail' };
    }
    if (searchResult === 'found') return { text: 'Found', kind: 'ok' };
    if (searchResult === 'not_found') return { text: 'Not found', kind: 'fail' };
    if (mode === 'search' && currentFrame && currentFrame.status === 'prefix-only') {
      return { text: 'Prefix only', kind: 'warn' };
    }
    return null;
  })();

  const nextSeqWord =
    seqIdx < DEFAULT_SEQUENCE.length ? DEFAULT_SEQUENCE[seqIdx] : null;

  return (
    <div className="rtv-root">
      <div className="rtv-head">
        <div className="rtv-title-block">
          <h3 className="rtv-title">Radix tree (compact prefix trie)</h3>
          <p className="rtv-sub">
            Edges carry whole prefix strings, not single characters. Insertion walks down matching
            prefixes; on a divergence the edge splits.
          </p>
        </div>
      </div>

      <div className="rtv-controls">
        <div className="rtv-control-group">
          <label className="rtv-input-label" htmlFor="rtv-insert">
            Insert
          </label>
          <input
            id="rtv-insert"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInsertTyped();
            }}
            className="rtv-input"
            placeholder={nextSeqWord ? `next: ${nextSeqWord}` : 'type a word'}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="rtv-btn rtv-btn-primary" onClick={onInsertTyped}>
            <Plus size={14} /> Insert
          </button>
        </div>

        <div className="rtv-control-group">
          <label className="rtv-input-label" htmlFor="rtv-search">
            Search
          </label>
          <input
            id="rtv-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
            className="rtv-input"
            placeholder="e.g. apply"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="rtv-btn rtv-btn-accent" onClick={onSearch}>
            <Search size={14} /> Search
          </button>
          {resultPill && (
            <span className={`rtv-result-pill rtv-result-${resultPill.kind}`}>{resultPill.text}</span>
          )}
        </div>

        <div className="rtv-control-spacer" />

        <div className="rtv-control-group">
          {isPlaying ? (
            <button type="button" className="rtv-btn" onClick={onPause}>
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button type="button" className="rtv-btn" onClick={onPlay} disabled={frames.length === 0}>
              <Play size={14} /> Run
            </button>
          )}
          <button type="button" className="rtv-btn" onClick={onStep} disabled={frames.length === 0}>
            <SkipForward size={14} /> Step
          </button>
          <button type="button" className="rtv-btn" onClick={onLoadAll}>
            <ListPlus size={14} /> Load all
          </button>
          <button type="button" className="rtv-btn" onClick={onReset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="rtv-stage">
        <svg
          className="rtv-svg"
          viewBox={`0 0 ${Math.max(layout.width, 360)} ${Math.max(layout.height, 220)}`}
          role="img"
          aria-label="Radix tree visualization"
        >
          {layout.edges.map((e, i) => {
            const a = layout.nodes[e.from];
            const b = layout.nodes[e.to];
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const edgeIsActive =
              edgeActivePath !== null &&
              edgeActivePath !== undefined &&
              b.path === edgeActivePath;
            const edgeOnSearchPath =
              activePaths && activePaths.has(b.path) && activePaths.has(a.path);
            const isNewEdge =
              mode === 'insert' &&
              currentFrame &&
              (currentFrame.phase === 'new-edge' || currentFrame.phase === 'split') &&
              currentFrame.highlightEdgeTo === b.path;

            const labelW = Math.max(20, e.label.length * 8 + 10);
            return (
              <g key={`edge-${i}`}>
                <line
                  x1={a.x}
                  y1={a.y + (a.id === 0 ? NODE_R - 3 : NODE_R)}
                  x2={b.x}
                  y2={b.y - NODE_R}
                  className={[
                    'rtv-edge',
                    edgeIsActive ? 'rtv-edge-active' : '',
                    edgeOnSearchPath && !edgeIsActive ? 'rtv-edge-on-path' : '',
                    isNewEdge ? 'rtv-edge-new' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
                <g
                  className={[
                    'rtv-edge-label',
                    edgeIsActive ? 'rtv-edge-label-active' : '',
                    edgeOnSearchPath && !edgeIsActive ? 'rtv-edge-label-on-path' : '',
                    isNewEdge ? 'rtv-edge-label-new' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <rect
                    x={midX - labelW / 2}
                    y={midY - 10}
                    width={labelW}
                    height={20}
                    rx={5}
                    className="rtv-edge-label-bg"
                  />
                  <text x={midX} y={midY + 4} textAnchor="middle" className="rtv-edge-label-text">
                    {e.label}
                  </text>
                </g>
              </g>
            );
          })}

          {layout.nodes.map((n) => {
            const isRoot = n.id === 0;
            const isCurrent = highlightPath !== null && highlightPath !== undefined && n.path === highlightPath;
            const onPath = activePaths && activePaths.has(n.path);
            const isEnd = n.end;
            const cls = [
              'rtv-node',
              isRoot ? 'rtv-node-root' : '',
              isCurrent ? 'rtv-node-current' : '',
              onPath && !isCurrent ? 'rtv-node-onpath' : '',
              isEnd ? 'rtv-node-end' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <g key={n.id} className={cls}>
                {isCurrent && (
                  <circle cx={n.x} cy={n.y} r={NODE_R + 6} className="rtv-node-ring" />
                )}
                <circle cx={n.x} cy={n.y} r={isRoot ? NODE_R - 3 : NODE_R} />
                {isRoot && (
                  <text x={n.x} y={n.y + 4} textAnchor="middle" className="rtv-node-label">
                    ·
                  </text>
                )}
                {isEnd && (
                  <text
                    x={n.x}
                    y={n.y + NODE_R + 14}
                    textAnchor="middle"
                    className="rtv-node-word"
                  >
                    {n.path}
                  </text>
                )}
              </g>
            );
          })}

          {/* Missing-edge marker during a failed search. */}
          {mode === 'search' &&
            currentFrame &&
            currentFrame.status === 'missing' &&
            currentFrame.currentPath !== null &&
            layout.idByPath.has(currentFrame.currentPath) && (
              <g className="rtv-missing">
                <line
                  x1={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].x}
                  y1={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].y + NODE_R}
                  x2={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].x}
                  y2={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].y + NODE_R + 30}
                  className="rtv-missing-stub"
                />
                <rect
                  x={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].x - 16}
                  y={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].y + NODE_R + 30}
                  width={32}
                  height={22}
                  rx={5}
                  className="rtv-missing-pill"
                />
                <text
                  x={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].x}
                  y={layout.nodes[layout.idByPath.get(currentFrame.currentPath)].y + NODE_R + 45}
                  textAnchor="middle"
                  className="rtv-missing-text"
                >
                  {currentFrame.missingChar || '?'}
                </text>
              </g>
            )}
        </svg>
      </div>

      <div className="rtv-word-row">
        <span className="rtv-word-row-label">Words</span>
        <div className="rtv-word-chips">
          {words.length === 0 && <span className="rtv-word-empty">Empty</span>}
          {words.map((w, i) => (
            <span
              key={`${w}-${i}`}
              className={`rtv-word-chip ${
                mode === 'insert' && i === words.length - 1 ? 'rtv-word-chip-new' : ''
              }`}
            >
              {w}
            </span>
          ))}
        </div>
        {nextSeqWord && (
          <span className="rtv-next-hint">
            Next in sequence: <code>{nextSeqWord}</code>
          </span>
        )}
      </div>

      <div className="rtv-footer">
        <div className="rtv-stat">
          <span className="rtv-stat-label">Nodes</span>
          <span className="rtv-stat-value">{totalNodes}</span>
        </div>
        <div className="rtv-stat">
          <span className="rtv-stat-label">Words</span>
          <span className="rtv-stat-value">{totalWords}</span>
        </div>
        <div className="rtv-stat">
          <span className="rtv-stat-label">Mode</span>
          <span className="rtv-stat-value">{mode === 'idle' ? '—' : mode}</span>
        </div>
        <div className="rtv-stat">
          <span className="rtv-stat-label">Step</span>
          <span className="rtv-stat-value">
            {frames.length === 0 ? '—' : `${frameIdx + 1} / ${frames.length}`}
          </span>
        </div>
        <div className="rtv-stat rtv-stat-grow">
          <span className="rtv-stat-label">Operation</span>
          <span className="rtv-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
