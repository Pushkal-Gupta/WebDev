import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, RotateCcw } from 'lucide-react';
import './TrieViz.css';

const INITIAL_WORDS = ['cat', 'car', 'card', 'care', 'dog', 'do'];

const NODE_R = 18;
const LEVEL_H = 78;
const LEAF_GAP = 46;
const PAD_X = 32;
const PAD_Y = 36;
const STEP_MS = 480;

function createNode() {
  return { children: new Map(), end: false };
}

function insertWord(root, word) {
  let cur = root;
  for (const ch of word) {
    if (!cur.children.has(ch)) cur.children.set(ch, createNode());
    cur = cur.children.get(ch);
  }
  cur.end = true;
}

function buildTrie(words) {
  const root = createNode();
  for (const w of words) insertWord(root, w);
  return root;
}

// Bottom-up layout: each node owns a width equal to max(LEAF_GAP, sum of children widths).
// First pass measures widths; second pass assigns x positions by partitioning that width.
function layoutTrie(root) {
  let nextId = 0;
  const nodes = [];
  const edges = [];

  function assignIds(node, parentId, ch, depth, path) {
    const id = nextId++;
    nodes.push({ id, char: ch, end: node.end, depth, path, parentId });
    const childOrder = [...node.children.keys()].sort();
    const childIds = [];
    for (const c of childOrder) {
      const childId = assignIds(node.children.get(c), id, c, depth + 1, path + c);
      childIds.push(childId);
      edges.push({ from: id, to: childId, char: c });
    }
    nodes[id].children = childIds;
    return id;
  }
  assignIds(root, null, null, 0, '');

  // Measure subtree widths.
  function measure(id) {
    const n = nodes[id];
    if (n.children.length === 0) {
      n.width = LEAF_GAP;
      return n.width;
    }
    let total = 0;
    for (const cid of n.children) total += measure(cid);
    n.width = Math.max(LEAF_GAP, total);
    return n.width;
  }
  measure(0);

  // Assign x positions.
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
      // Center parent over the span of its children.
      const first = nodes[n.children[0]];
      const last = nodes[n.children[n.children.length - 1]];
      n.x = (first.x + last.x) / 2;
    }
    n.y = PAD_Y + n.depth * LEVEL_H;
  }
  place(0, 0);

  // Bounds.
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

  // Shift everything so left edge is at PAD_X.
  const shift = PAD_X - minX;
  for (const n of nodes) n.x += shift;

  const width = (maxX - minX) + PAD_X * 2;
  const height = maxY + PAD_Y + NODE_R;

  // Build id-by-path map (used by the search animation to find which node corresponds to a prefix).
  const idByPath = new Map();
  for (const n of nodes) idByPath.set(n.path, n.id);

  return { nodes, edges, width, height, idByPath };
}

function countWords(nodes) {
  return nodes.reduce((acc, n) => acc + (n.end ? 1 : 0), 0);
}

function buildSearchFrames(layout, word) {
  // Frame shape: { activeIds: Set<number>, currentId: number|null, prefix, status, label }
  const frames = [];
  const active = new Set();
  let cur = 0;
  active.add(cur);
  frames.push({
    active: new Set(active),
    current: cur,
    prefix: '',
    status: 'walking',
    label: `Start at root. Searching "${word}"`,
  });
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const prefix = word.slice(0, i + 1);
    const childId = layout.idByPath.get(prefix);
    if (childId === undefined) {
      frames.push({
        active: new Set(active),
        current: cur,
        prefix: word.slice(0, i),
        status: 'missing',
        label: `No edge labeled "${ch}" from this node. "${word}" not found`,
        missingChar: ch,
      });
      return frames;
    }
    cur = childId;
    active.add(cur);
    frames.push({
      active: new Set(active),
      current: cur,
      prefix,
      status: i === word.length - 1 ? 'final' : 'walking',
      label: `Step ${i + 1}: follow edge "${ch}" to "${prefix}"`,
    });
  }
  const node = layout.nodes[cur];
  frames.push({
    active: new Set(active),
    current: cur,
    prefix: word,
    status: node.end ? 'found' : 'prefix-only',
    label: node.end
      ? `Found: "${word}" is marked as a complete word`
      : `Reached "${word}" but it is not marked as a complete word (prefix only)`,
  });
  return frames;
}

export default function TrieViz() {
  const [words, setWords] = useState(() => [...INITIAL_WORDS]);
  const [insertInput, setInsertInput] = useState('cars');
  const [searchInput, setSearchInput] = useState('care');
  const [operation, setOperation] = useState('Pre-loaded with 6 words');
  const [searchFrames, setSearchFrames] = useState([]);
  const [searchIdx, setSearchIdx] = useState(-1);
  const [searchResult, setSearchResult] = useState(null); // 'found' | 'not_found' | null
  const playRef = useRef(null);

  // Build the trie + layout from the current word list.
  const layout = useMemo(() => {
    const root = buildTrie(words);
    return layoutTrie(root);
  }, [words]);

  const currentFrame =
    searchIdx >= 0 && searchIdx < searchFrames.length ? searchFrames[searchIdx] : null;

  // Animation loop.
  useEffect(() => {
    if (searchIdx < 0 || searchIdx >= searchFrames.length - 1) return;
    playRef.current = setTimeout(() => setSearchIdx((i) => i + 1), STEP_MS);
    return () => clearTimeout(playRef.current);
  }, [searchIdx, searchFrames]);

  // When animation reaches the last frame, fix the result label.
  useEffect(() => {
    if (searchFrames.length === 0) return;
    if (searchIdx !== searchFrames.length - 1) return;
    const last = searchFrames[searchFrames.length - 1];
    if (last.status === 'found') setSearchResult('found');
    else setSearchResult('not_found');
  }, [searchIdx, searchFrames]);

  const sanitize = (raw) => raw.toLowerCase().replace(/[^a-z]/g, '');

  const onInsert = useCallback(() => {
    const w = sanitize(insertInput);
    if (!w) {
      setOperation('Insert: input must be lowercase letters');
      return;
    }
    if (words.includes(w)) {
      setOperation(`Insert: "${w}" already in trie`);
      return;
    }
    setWords((prev) => [...prev, w]);
    setOperation(`Inserted "${w}"`);
    setSearchFrames([]);
    setSearchIdx(-1);
    setSearchResult(null);
  }, [insertInput, words]);

  const onSearch = useCallback(() => {
    const w = sanitize(searchInput);
    if (!w) {
      setOperation('Search: input must be lowercase letters');
      return;
    }
    const frames = buildSearchFrames(layout, w);
    setSearchFrames(frames);
    setSearchIdx(0);
    setSearchResult(null);
    setOperation(`Searching "${w}"…`);
  }, [searchInput, layout]);

  const onReset = useCallback(() => {
    setWords([]);
    setOperation('Trie cleared');
    setSearchFrames([]);
    setSearchIdx(-1);
    setSearchResult(null);
    setInsertInput('');
    setSearchInput('');
  }, []);

  const onLoadDefaults = useCallback(() => {
    setWords([...INITIAL_WORDS]);
    setOperation('Reloaded default words');
    setSearchFrames([]);
    setSearchIdx(-1);
    setSearchResult(null);
  }, []);

  const totalNodes = layout.nodes.length;
  const totalWords = countWords(layout.nodes);

  const activeIds = currentFrame ? currentFrame.active : null;
  const currentId = currentFrame ? currentFrame.current : null;

  // Pre-compute edge classnames.
  const edgeView = useMemo(() => {
    return layout.edges.map((e) => {
      const onPath = activeIds && activeIds.has(e.from) && activeIds.has(e.to);
      return { ...e, onPath };
    });
  }, [layout.edges, activeIds]);

  const opLabel = currentFrame ? currentFrame.label : operation;

  const resultPill = (() => {
    if (currentFrame && currentFrame.status === 'missing') {
      return { text: 'Not found', kind: 'fail' };
    }
    if (searchResult === 'found') return { text: 'Found', kind: 'ok' };
    if (searchResult === 'not_found') return { text: 'Not found', kind: 'fail' };
    return null;
  })();

  return (
    <div className="tv-root">
      <div className="tv-head">
        <div className="tv-title-block">
          <h3 className="tv-title">Trie (prefix tree)</h3>
          <p className="tv-sub">
            Insert words, then search character by character. The path lights up as it walks. Green
            nodes mark the end of a complete word.
          </p>
        </div>
      </div>

      <div className="tv-controls">
        <div className="tv-control-group">
          <label className="tv-input-label" htmlFor="tv-insert">
            Insert
          </label>
          <input
            id="tv-insert"
            type="text"
            value={insertInput}
            onChange={(e) => setInsertInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInsert();
            }}
            className="tv-input"
            placeholder="e.g. cars"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="tv-btn tv-btn-primary" onClick={onInsert}>
            <Plus size={14} /> Insert
          </button>
        </div>

        <div className="tv-control-group">
          <label className="tv-input-label" htmlFor="tv-search">
            Search
          </label>
          <input
            id="tv-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
            className="tv-input"
            placeholder="e.g. care"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="tv-btn tv-btn-accent" onClick={onSearch}>
            <Search size={14} /> Search
          </button>
          {resultPill && (
            <span className={`tv-result-pill tv-result-${resultPill.kind}`}>{resultPill.text}</span>
          )}
        </div>

        <div className="tv-control-spacer" />

        <button type="button" className="tv-btn" onClick={onLoadDefaults}>
          Defaults
        </button>
        <button type="button" className="tv-btn" onClick={onReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="tv-stage">
        <svg
          className="tv-svg"
          viewBox={`0 0 ${Math.max(layout.width, 320)} ${Math.max(layout.height, 200)}`}
          role="img"
          aria-label="Trie visualization"
        >
          {edgeView.map((e, i) => {
            const a = layout.nodes[e.from];
            const b = layout.nodes[e.to];
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <g key={`edge-${i}`}>
                <line
                  x1={a.x}
                  y1={a.y + (a.id === 0 ? NODE_R - 4 : NODE_R)}
                  x2={b.x}
                  y2={b.y - NODE_R}
                  className={`tv-edge ${e.onPath ? 'tv-edge-active' : ''}`}
                />
                <g className={`tv-edge-label ${e.onPath ? 'tv-edge-label-active' : ''}`}>
                  <rect
                    x={midX - 9}
                    y={midY - 9}
                    width={18}
                    height={18}
                    rx={4}
                    className="tv-edge-label-bg"
                  />
                  <text x={midX} y={midY + 4} textAnchor="middle" className="tv-edge-label-text">
                    {e.char}
                  </text>
                </g>
              </g>
            );
          })}

          {layout.nodes.map((n) => {
            const isRoot = n.id === 0;
            const isCurrent = currentId === n.id;
            const isActive = activeIds && activeIds.has(n.id);
            const isEnd = n.end;
            const cls = [
              'tv-node',
              isRoot ? 'tv-node-root' : '',
              isCurrent ? 'tv-node-current' : '',
              isActive && !isCurrent ? 'tv-node-active' : '',
              isEnd ? 'tv-node-end' : '',
            ]
              .filter(Boolean)
              .join(' ');

            const label = isRoot ? '·' : n.char;
            return (
              <g key={n.id} className={cls}>
                {isCurrent && <circle cx={n.x} cy={n.y} r={NODE_R + 6} className="tv-node-ring" />}
                <circle cx={n.x} cy={n.y} r={isRoot ? NODE_R - 4 : NODE_R} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" className="tv-node-label">
                  {label}
                </text>
                {isEnd && (
                  <text
                    x={n.x}
                    y={n.y + NODE_R + 14}
                    textAnchor="middle"
                    className="tv-node-word"
                  >
                    {n.path}
                  </text>
                )}
              </g>
            );
          })}

          {/* Missing-edge marker: when search dies, draw a faded dashed stub off the dead node. */}
          {currentFrame && currentFrame.status === 'missing' && currentId !== null && (
            <g className="tv-missing">
              <line
                x1={layout.nodes[currentId].x}
                y1={layout.nodes[currentId].y + NODE_R}
                x2={layout.nodes[currentId].x}
                y2={layout.nodes[currentId].y + NODE_R + 28}
                className="tv-missing-stub"
              />
              <rect
                x={layout.nodes[currentId].x - 12}
                y={layout.nodes[currentId].y + NODE_R + 28}
                width={24}
                height={22}
                rx={5}
                className="tv-missing-pill"
              />
              <text
                x={layout.nodes[currentId].x}
                y={layout.nodes[currentId].y + NODE_R + 43}
                textAnchor="middle"
                className="tv-missing-text"
              >
                {currentFrame.missingChar}?
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="tv-word-row">
        <span className="tv-word-row-label">Words</span>
        <div className="tv-word-chips">
          {words.length === 0 && <span className="tv-word-empty">Empty</span>}
          {words.map((w) => (
            <span key={w} className="tv-word-chip">
              {w}
            </span>
          ))}
        </div>
      </div>

      <div className="tv-footer">
        <div className="tv-stat">
          <span className="tv-stat-label">Total nodes</span>
          <span className="tv-stat-value">{totalNodes}</span>
        </div>
        <div className="tv-stat">
          <span className="tv-stat-label">Total words</span>
          <span className="tv-stat-value">{totalWords}</span>
        </div>
        <div className="tv-stat tv-stat-grow">
          <span className="tv-stat-label">Current operation</span>
          <span className="tv-stat-value">{opLabel}</span>
        </div>
      </div>
    </div>
  );
}
