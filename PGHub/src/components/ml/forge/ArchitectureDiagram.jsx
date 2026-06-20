import React, { useId, useMemo } from 'react';
import './ArchitectureDiagram.css';

// A large, data-driven architecture diagram. The SVG scales to fill its
// container (width:100%) so a generous viewBox keeps labels crisp and the whole
// figure readable instead of cramped. See pgForgeArchData.js for the block spec.
//
// props:
//   title       - panel heading (e.g. 'Transformer')
//   blocks      - [{ key, label, sub, kind, repeat, lane }]
//   skips       - [{ from, to, label }]  curved residual / shortcut arrows
//   activeBlock - the `key` of the block to highlight (matches a step's block)

const VB_W = 600;
const PAD_X = 28;
const PAD_TOP = 26;
const PAD_BOT = 22;
const NODE_W = 300;
const NODE_H = 66;
const V_GAP = 30;
const BRACKET_GAP = 88; // horizontal room reserved on the right for the xN bracket

// kind -> theme hue token (set in CSS) + a short type tag drawn on the block.
const KIND = {
  input: { hue: 'accent', tag: 'in' },
  output: { hue: 'accent', tag: 'out' },
  embed: { hue: 'sky', tag: 'embed' },
  conv: { hue: 'sky', tag: 'conv' },
  attention: { hue: 'violet', tag: 'attn' },
  sample: { hue: 'violet', tag: 'sample' },
  norm: { hue: 'mint', tag: 'norm' },
  flow: { hue: 'mint', tag: 'op' },
  op: { hue: 'mint', tag: 'op' },
  dense: { hue: 'pink', tag: 'mlp' },
  ffn: { hue: 'pink', tag: 'ffn' },
  loss: { hue: 'pink', tag: 'loss' },
};

function kindOf(kind) {
  return KIND[kind] || { hue: 'accent', tag: '' };
}

// Single centered vertical column. Blocks are big enough for a title + sub-line.
function layout(blocks) {
  const hasBracket = blocks.some((b) => b.repeat);
  const x = Math.round((VB_W - NODE_W) / 2) - (hasBracket ? Math.round(BRACKET_GAP / 2) : 0);
  const nodes = blocks.map((b, i) => {
    const meta = kindOf(b.kind);
    return {
      ...b,
      meta,
      idx: i,
      x,
      y: PAD_TOP + i * (NODE_H + V_GAP),
      w: NODE_W,
    };
  });
  const height = PAD_TOP + blocks.length * (NODE_H + V_GAP) - V_GAP + PAD_BOT;
  return { nodes, height, hasBracket, nodeX: x };
}

// Group consecutive blocks sharing the same `repeat` tag into one bracket run.
function bracketRuns(nodes) {
  const runs = [];
  let cur = null;
  nodes.forEach((n) => {
    if (n.repeat) {
      if (cur && cur.tag === n.repeat) {
        cur.nodes.push(n);
      } else {
        cur = { tag: n.repeat, nodes: [n] };
        runs.push(cur);
      }
    } else {
      cur = null;
    }
  });
  return runs.filter((r) => r.nodes.length >= 1);
}

export default function ArchitectureDiagram({ title, blocks, skips = [], activeBlock }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { nodes, height, nodeX } = useMemo(() => layout(blocks), [blocks]);
  const runs = useMemo(() => bracketRuns(nodes), [nodes]);

  const isHot = (key) => activeBlock !== undefined && key === activeBlock;

  // straight-down trunk edges between consecutive blocks
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({ from: nodes[i], to: nodes[i + 1] });
  }

  const cx = nodeX + NODE_W / 2;
  const skipX = nodeX - 18; // skip arrows ride the left gutter of the column

  return (
    <div className="arch-diagram">
      {title && <p className="arch-diagram-title">{title}</p>}
      <svg
        className="arch-svg"
        viewBox={`0 0 ${VB_W} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${title || 'Model'} architecture diagram`}
      >
        <defs>
          <marker
            id={`ah-${uid}`}
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path className="arch-arrow-head" d="M1 1 L9 5 L1 9 z" />
          </marker>
          <marker
            id={`ah-skip-${uid}`}
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path className="arch-arrow-head is-skip" d="M1 1 L9 5 L1 9 z" />
          </marker>
          {['accent', 'sky', 'violet', 'pink', 'mint'].map((h) => (
            <linearGradient key={h} id={`ng-${h}-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop className={`arch-grad-top hue-${h}`} offset="0%" />
              <stop className={`arch-grad-bot hue-${h}`} offset="100%" />
            </linearGradient>
          ))}
          <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* trunk edges */}
        <g className="arch-edges">
          {edges.map((e, i) => {
            const y1 = e.from.y + NODE_H;
            const y2 = e.to.y;
            const hot = isHot(e.from.key) || isHot(e.to.key);
            return (
              <line
                key={`edge-${i}`}
                className={`arch-edge${hot ? ' is-hot' : ''}`}
                x1={cx}
                y1={y1}
                x2={cx}
                y2={y2 - 2}
                markerEnd={`url(#ah-${uid})`}
              />
            );
          })}
        </g>

        {/* skip / residual connections */}
        <g className="arch-skips">
          {skips.map((s, i) => {
            const a = nodes[s.from];
            const b = nodes[s.to];
            if (!a || !b) return null;
            const up = b.y < a.y;
            const ya = up ? a.y : a.y + NODE_H;
            const yb = up ? b.y + NODE_H : b.y;
            const bow = Math.max(40, Math.abs(yb - ya) * 0.32);
            const ctrlX = skipX - bow;
            const hot = isHot(a.key) || isHot(b.key);
            const my = (ya + yb) / 2;
            return (
              <g key={`skip-${i}`} className={`arch-skip${hot ? ' is-hot' : ''}`}>
                <path
                  className="arch-skip-path"
                  d={`M${nodeX} ${ya} C ${ctrlX} ${ya}, ${ctrlX} ${yb}, ${nodeX} ${yb - 1}`}
                  markerEnd={`url(#ah-skip-${uid})`}
                />
                {s.label && (
                  <text className="arch-skip-label" x={ctrlX - 4} y={my} textAnchor="end" dominantBaseline="central">
                    {s.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* xN stack brackets */}
        <g className="arch-brackets">
          {runs.map((run, i) => {
            const first = run.nodes[0];
            const last = run.nodes[run.nodes.length - 1];
            const bx = first.x + NODE_W + 18;
            const top = first.y - 6;
            const bot = last.y + NODE_H + 6;
            const mid = (top + bot) / 2;
            const hot = run.nodes.some((n) => isHot(n.key));
            return (
              <g key={`run-${i}`} className={`arch-bracket${hot ? ' is-hot' : ''}`}>
                <path
                  className="arch-bracket-path"
                  d={`M${bx} ${top} q 10 0 10 10 L${bx + 10} ${mid - 9} q 0 9 9 9 q -9 0 -9 9 L${bx + 10} ${bot - 10} q 0 10 -10 10`}
                  fill="none"
                />
                <text className="arch-bracket-label" x={bx + 24} y={mid} textAnchor="start" dominantBaseline="central">
                  x N
                </text>
              </g>
            );
          })}
        </g>

        {/* blocks */}
        <g className="arch-nodes">
          {nodes.map((n) => {
            const hot = isHot(n.key);
            const grad = `url(#ng-${n.meta.hue}-${uid})`;
            return (
              <g key={`${n.key}-${n.idx}`} className={`arch-node hue-${n.meta.hue}${hot ? ' is-hot' : ''}`}>
                {hot && (
                  <rect
                    className="arch-node-glow"
                    x={n.x - 2}
                    y={n.y - 2}
                    width={n.w + 4}
                    height={NODE_H + 4}
                    rx={15}
                    filter={`url(#glow-${uid})`}
                  />
                )}
                <rect
                  className="arch-node-box"
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={NODE_H}
                  rx={13}
                  fill={grad}
                />
                <rect className="arch-node-accent" x={n.x} y={n.y} width={5} height={NODE_H} rx={2.5} />
                {n.meta.tag && (
                  <text className="arch-node-tag" x={n.x + n.w - 12} y={n.y + 14} textAnchor="end">
                    {n.meta.tag}
                  </text>
                )}
                <text
                  className="arch-node-label"
                  x={n.x + n.w / 2}
                  y={n.y + (n.sub ? NODE_H / 2 - 9 : NODE_H / 2)}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {n.label}
                </text>
                {n.sub && (
                  <text
                    className="arch-node-sub"
                    x={n.x + n.w / 2}
                    y={n.y + NODE_H / 2 + 12}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
