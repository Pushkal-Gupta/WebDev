import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Search, TreePine } from 'lucide-react';
import './SuffixTreeViz.css';

const S = 'banana$';

// Pre-laid-out suffix tree of "banana$" (compressed trie). Each edge carries a label.
// Leaves tagged with the start index of the suffix they represent.
function buildTree() {
  // node ids and positions on a fixed canvas
  const nodes = {
    root: { id: 'root', x: 470, y: 40, label: '' },
    a: { id: 'a', x: 210, y: 130, label: '' },
    na: { id: 'na', x: 470, y: 130, label: '' },
    b: { id: 'b', x: 650, y: 130, label: '' },
    dollar: { id: 'dollar', x: 800, y: 130, label: '', leaf: 6 },
    a1: { id: 'a1', x: 110, y: 230, label: '', leaf: 5 },
    ana: { id: 'ana', x: 300, y: 230, label: '' },
    na1: { id: 'na1', x: 420, y: 230, label: '', leaf: 4 },
    nana: { id: 'nana', x: 560, y: 230, label: '' },
    banana: { id: 'banana', x: 700, y: 230, label: '', leaf: 0 },
    ana_d: { id: 'ana_d', x: 250, y: 330, label: '', leaf: 3 },
    ana_na: { id: 'ana_na', x: 360, y: 330, label: '', leaf: 1 },
    nana_d: { id: 'nana_d', x: 520, y: 330, label: '', leaf: 2 },
    nana_na: { id: 'nana_na', x: 600, y: 330, label: '', leaf: 0 },
  };
  // edges: { from, to, label, walkChars (cumulative substring spelled from root to `to`) }
  const edges = [
    { id: 'e_a', from: 'root', to: 'a', label: 'a', spell: 'a' },
    { id: 'e_na', from: 'root', to: 'na', label: 'na', spell: 'na' },
    { id: 'e_b', from: 'root', to: 'b', label: 'banana$', spell: 'banana$' },
    { id: 'e_d', from: 'root', to: 'dollar', label: '$', spell: '$' },
    { id: 'e_a1', from: 'a', to: 'a1', label: '$', spell: 'a$' },
    { id: 'e_ana', from: 'a', to: 'ana', label: 'na', spell: 'ana' },
    { id: 'e_na1', from: 'na', to: 'na1', label: '$', spell: 'na$' },
    { id: 'e_nana', from: 'na', to: 'nana', label: 'na', spell: 'nana' },
    { id: 'e_ana_d', from: 'ana', to: 'ana_d', label: '$', spell: 'ana$' },
    { id: 'e_ana_na', from: 'ana', to: 'ana_na', label: 'na$', spell: 'anana$' },
    { id: 'e_nana_d', from: 'nana', to: 'nana_d', label: '$', spell: 'nana$' },
    { id: 'e_nana_na', from: 'nana', to: 'nana_na', label: '$', spell: 'nanana' },
  ];
  // remove the malformed banana branch beyond first leaf for clarity
  const cleanEdges = edges.filter((e) => e.id !== 'e_nana_na');
  delete nodes.nana_na;
  return { nodes, edges: cleanEdges };
}

const QUERIES = ['ana', 'nan', 'apple'];

function buildQueryFrames(tree, pattern) {
  const { edges } = tree;
  const frames = [];
  frames.push({ activeEdges: [], activeNodes: ['root'], consumed: 0, status: 'start', note: `Query "${pattern}": start at root. Any substring of S is a prefix of some suffix, so walk down matching edge labels.` });
  let node = 'root';
  let consumed = 0;
  const pathEdges = [];
  const pathNodes = ['root'];
  while (consumed < pattern.length) {
    const next = pattern[consumed];
    const edge = edges.find((e) => e.from === node && e.label[0] === next);
    if (!edge) {
      frames.push({ activeEdges: [...pathEdges], activeNodes: [...pathNodes], consumed, status: 'fail', note: `No edge from current node starts with '${next}'. "${pattern}" is NOT a substring of S.` });
      return frames;
    }
    // consume along edge label
    let k = 0;
    while (k < edge.label.length && consumed < pattern.length) {
      if (edge.label[k] !== pattern[consumed]) {
        frames.push({ activeEdges: [...pathEdges, edge.id], activeNodes: [...pathNodes], consumed, status: 'fail', note: `Mismatch on edge "${edge.label}" at '${edge.label[k]}' ≠ '${pattern[consumed]}'. NOT a substring.` });
        return frames;
      }
      k += 1; consumed += 1;
    }
    pathEdges.push(edge.id);
    pathNodes.push(edge.to);
    node = edge.to;
    frames.push({ activeEdges: [...pathEdges], activeNodes: [...pathNodes], consumed, status: consumed >= pattern.length ? 'match' : 'walk', note: consumed >= pattern.length ? `Consumed all of "${pattern}" along edge "${edge.label}". MATCH — every leaf below this point marks an occurrence.` : `Matched edge "${edge.label}". ${consumed}/${pattern.length} chars consumed, continue down.` });
  }
  return frames;
}

export default function SuffixTreeViz() {
  const tree = useMemo(() => buildTree(), []);
  const [query, setQuery] = useState(QUERIES[0]);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const timer = useRef(null);

  const frames = useMemo(() => buildQueryFrames(tree, query), [tree, query]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1000 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  }, [isRunning, step, delay, totalSteps]);

  const reset = () => { setIsRunningRaw(false); setStep(0); };
  const pickQuery = (q) => { if (q === query) return; setQuery(q); setStep(0); setIsRunningRaw(false); };

  const W = 920;
  const H = 380;
  const { nodes, edges } = tree;
  const activeEdges = new Set(current.activeEdges);
  const activeNodes = new Set(current.activeNodes);
  const headNode = current.activeNodes[current.activeNodes.length - 1];

  return (
    <div className="stv">
      <div className="stv-head">
        <h3 className="stv-title"><TreePine size={18} className="stv-ticon" /> Suffix tree of &quot;{S}&quot; — substring query in O(|P|)</h3>
        <p className="stv-sub">
          A compressed trie of every suffix. Any substring is a prefix of some suffix, so a query walks down edge labels: exhaust the pattern → match; fall off → not present. Leaves are tagged with suffix start index.
        </p>
      </div>

      <div className="stv-controls">
        <div className="stv-queries">
          <span className="stv-q-label"><Search size={13} /> query</span>
          {QUERIES.map((q) => (
            <button key={q} type="button" className={`stv-q ${q === query ? 'stv-q-on' : ''}`} onClick={() => pickQuery(q)}>&quot;{q}&quot;</button>
          ))}
        </div>
        <div className="stv-buttons">
          <button type="button" className="stv-btn stv-btn-primary" onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunningRaw((v) => !v); }}>
            {isRunning ? <Pause size={14} /> : <Play size={14} />}{isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="stv-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}><ChevronRight size={14} /> Step</button>
          <button type="button" className="stv-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}><SkipForward size={14} /> Skip</button>
          <button type="button" className="stv-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <label className="stv-speed">
          <span className="stv-speed-label">speed</span>
          <input type="range" min={0.5} max={4} step={0.5} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="stv-speed-range" />
          <span className="stv-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <div className="stv-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="stv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="stv-svg" preserveAspectRatio="xMidYMid meet">
          {/* pattern progress bar */}
          {S && [...query].map((ch, i) => {
            const x = 24 + i * 30;
            const done = i < current.consumed;
            const isHead = i === current.consumed && current.status !== 'match' && current.status !== 'fail';
            return (
              <g key={`pc-${i}`}>
                <rect x={x} y={18} width={26} height={26} rx={4}
                  fill={done ? 'rgba(var(--accent-rgb),0.2)' : 'var(--bg)'}
                  stroke={isHead ? 'var(--hue-pink)' : done ? 'var(--accent)' : 'var(--border)'} strokeWidth={isHead ? 2.5 : 1.5} />
                <text x={x + 13} y={36} className="stv-pchar">{ch}</text>
              </g>
            );
          })}

          {edges.map((e) => {
            const a = nodes[e.from];
            const b = nodes[e.to];
            const on = activeEdges.has(e.id);
            const failEdge = current.status === 'fail' && current.activeEdges[current.activeEdges.length - 1] === e.id;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <g key={e.id}>
                <line x1={a.x} y1={a.y + 16} x2={b.x} y2={b.y - 16}
                  stroke={failEdge ? 'var(--hard)' : on ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={on || failEdge ? 3 : 1.4} opacity={on || failEdge ? 1 : 0.6} />
                <rect x={midX - e.label.length * 4.5 - 4} y={midY - 9} width={e.label.length * 9 + 8} height={17} rx={3}
                  fill="var(--bg)" stroke={on ? 'var(--accent)' : 'transparent'} opacity={0.95} />
                <text x={midX} y={midY + 4} className="stv-elabel" style={{ fill: on ? 'var(--accent)' : 'var(--text-dim)' }}>{e.label}</text>
              </g>
            );
          })}

          {Object.values(nodes).map((nd) => {
            const on = activeNodes.has(nd.id);
            const isHead = nd.id === headNode;
            const isLeaf = nd.leaf !== undefined;
            const matchHead = isHead && current.status === 'match';
            return (
              <g key={nd.id}>
                {isLeaf ? (
                  <rect x={nd.x - 13} y={nd.y - 13} width={26} height={26} rx={5}
                    fill={on ? 'rgba(var(--accent-rgb),0.2)' : 'var(--surface)'}
                    stroke={matchHead ? 'var(--easy)' : on ? 'var(--accent)' : 'var(--border)'} strokeWidth={on ? 2.5 : 1.5} />
                ) : (
                  <circle cx={nd.x} cy={nd.y} r={11}
                    fill={isHead ? 'var(--accent)' : on ? 'rgba(var(--accent-rgb),0.18)' : 'var(--surface)'}
                    stroke={isHead ? 'var(--accent)' : on ? 'var(--accent)' : 'var(--border)'} strokeWidth={2} />
                )}
                {isLeaf && <text x={nd.x} y={nd.y + 5} className="stv-leaf">{nd.leaf}</text>}
                {nd.id === 'root' && <text x={nd.x} y={nd.y - 18} className="stv-rootlbl">root</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="stv-metrics">
        <div className="stv-metric"><span className="stv-metric-label">status</span>
          <span className="stv-metric-value" style={{ color: current.status === 'match' ? 'var(--easy)' : current.status === 'fail' ? 'var(--hard)' : 'var(--accent)' }}>{current.status}</span>
        </div>
        <div className="stv-metric"><span className="stv-metric-label">consumed</span><span className="stv-metric-value">{current.consumed} / {query.length}</span></div>
        <div className="stv-metric stv-metric-dim"><span className="stv-metric-label">tree size</span><span className="stv-metric-value stv-metric-dimval">≤ 2n−1 nodes</span></div>
      </div>

      <div className="stv-trace">
        <span className="stv-trace-label">trace</span>
        <span className="stv-trace-val">{current.note}</span>
      </div>
    </div>
  );
}
