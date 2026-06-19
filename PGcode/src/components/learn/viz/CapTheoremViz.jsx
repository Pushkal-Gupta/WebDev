import React, { useMemo, useState } from 'react';
import { Server, WifiOff, Wifi, User, RotateCcw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import './CapTheoremViz.css';

const FRESH = 42;
const STALE = 41;

const MODES = {
  'no partition': {
    partitioned: false,
    favor: null,
    keep: ['C', 'A'],
    sacrifice: null,
  },
  'CP — favor consistency': {
    partitioned: true,
    favor: 'C',
    keep: ['C', 'P'],
    sacrifice: 'A',
  },
  'AP — favor availability': {
    partitioned: true,
    favor: 'A',
    keep: ['A', 'P'],
    sacrifice: 'C',
  },
};

const MODE_KEYS = Object.keys(MODES);

function buildState(mode) {
  const m = MODES[mode];
  const node1 = { id: 1, value: FRESH, holdsFresh: true };
  const node2 = { id: 2, value: m.partitioned ? STALE : FRESH, holdsFresh: !m.partitioned };

  let reply1;
  let reply2;
  if (!m.partitioned) {
    reply1 = { kind: 'fresh', text: `${FRESH}` };
    reply2 = { kind: 'fresh', text: `${FRESH}` };
  } else if (m.favor === 'C') {
    reply1 = { kind: 'fresh', text: `${FRESH}` };
    reply2 = { kind: 'error', text: 'ERROR' };
  } else {
    reply1 = { kind: 'fresh', text: `${FRESH}` };
    reply2 = { kind: 'stale', text: `${STALE}` };
  }

  let note;
  if (!m.partitioned) {
    note = `Network healthy. Write counter = ${FRESH} on Node 1 replicates to Node 2, so both hold ${FRESH}. The client reads ${FRESH} from either node — fresh and consistent. P is irrelevant: with no partition you keep both C and A.`;
  } else if (m.favor === 'C') {
    note = `Partition severed the link before the write reached Node 2 (still ${STALE}). CP choice: Node 2 cannot confirm with its peer, so it rejects the read rather than serve stale data. Client gets ${FRESH} from Node 1, ERROR from Node 2. Consistency kept, availability sacrificed.`;
  } else {
    note = `Partition severed the link before the write reached Node 2 (still ${STALE}). AP choice: both nodes answer to stay available, so Node 2 serves the stale ${STALE} while Node 1 serves the fresh ${FRESH}. Availability kept, consistency sacrificed.`;
  }

  return {
    mode,
    partitioned: m.partitioned,
    favor: m.favor,
    keep: m.keep,
    sacrifice: m.sacrifice,
    node1,
    node2,
    reply1,
    reply2,
    note,
  };
}

const replyColor = (kind) => {
  if (kind === 'fresh') return 'var(--easy)';
  if (kind === 'stale') return 'var(--warning)';
  return 'var(--hard)';
};

const ReplyIcon = ({ kind, size }) => {
  if (kind === 'fresh') return <CheckCircle2 size={size} />;
  if (kind === 'stale') return <AlertTriangle size={size} />;
  return <XCircle size={size} />;
};

const VERTEX = {
  C: { label: 'Consistency', short: 'C', desc: 'every read sees the latest write' },
  A: { label: 'Availability', short: 'A', desc: 'every request gets a non-error answer' },
  P: { label: 'Partition tolerance', short: 'P', desc: 'works despite a severed network' },
};

export default function CapTheoremViz() {
  const [mode, setMode] = useState(MODE_KEYS[1]);

  const s = useMemo(() => buildState(mode), [mode]);

  const W = 940;
  const H = 430;

  const tri = {
    C: { x: 165, y: 70 },
    A: { x: 60, y: 270 },
    P: { x: 270, y: 270 },
  };
  const keepSet = new Set(s.keep);
  const edgeKept = (a, b) => keepSet.has(a) && keepSet.has(b);

  const node1 = { x: 545, y: 120 };
  const node2 = { x: 545, y: 320 };
  const nodeW = 150;
  const nodeH = 76;
  const linkMidX = node1.x + nodeW / 2;

  const clientX = 845;
  const reply = (r) => r;

  const renderReply = (r, y) => (
    <g>
      <rect
        className="captv-reply"
        x={clientX - 116}
        y={y - 18}
        width={92}
        height={36}
        rx={8}
        style={{ stroke: replyColor(r.kind) }}
      />
      <text className="captv-reply-val" x={clientX - 70} y={y + 5} style={{ fill: replyColor(r.kind) }}>
        {r.text}
      </text>
    </g>
  );

  return (
    <div className="captv">
      <div className="captv-head">
        <h3 className="captv-title">CAP theorem — pick two when the network splits</h3>
        <p className="captv-sub">
          A write lands on Node 1 (counter = {FRESH}). Toggle a network partition and choose whether each node favors
          consistency or availability, then watch what the client reads back from each.
        </p>
      </div>

      <div className="captv-controls">
        <div className="captv-modes" role="tablist" aria-label="Partition mode">
          {MODE_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`captv-mode ${mode === k ? 'is-on' : ''}`}
              onClick={() => setMode(k)}
              aria-pressed={mode === k}
            >
              {k}
            </button>
          ))}
        </div>

        <span className="captv-spacer" aria-hidden="true" />

        <div className="captv-partition-flag">
          {s.partitioned ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span>{s.partitioned ? 'partition active' : 'network healthy'}</span>
        </div>

        <button type="button" className="captv-btn" onClick={() => setMode(MODE_KEYS[1])}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="captv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="captv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="captv-row-label" x={165} y={28} textAnchor="middle">the CAP triangle</text>

          <polygon
            className="captv-tri-fill"
            points={`${tri.C.x},${tri.C.y} ${tri.A.x},${tri.A.y} ${tri.P.x},${tri.P.y}`}
          />

          {[
            ['C', 'A'],
            ['A', 'P'],
            ['C', 'P'],
          ].map(([a, b]) => (
            <line
              key={`edge-${a}${b}`}
              className={`captv-tri-edge ${edgeKept(a, b) ? 'is-kept' : ''}`}
              x1={tri[a].x}
              y1={tri[a].y}
              x2={tri[b].x}
              y2={tri[b].y}
            />
          ))}

          {Object.keys(tri).map((v) => {
            const p = tri[v];
            const kept = keepSet.has(v);
            const dropped = s.sacrifice === v;
            return (
              <g key={`vtx-${v}`}>
                <circle
                  className={`captv-vtx ${kept ? 'is-kept' : ''} ${dropped ? 'is-dropped' : ''}`}
                  cx={p.x}
                  cy={p.y}
                  r={26}
                />
                <text className="captv-vtx-short" x={p.x} y={p.y + 6}>{VERTEX[v].short}</text>
                <text
                  className={`captv-vtx-label ${dropped ? 'is-dropped' : ''}`}
                  x={p.x}
                  y={v === 'C' ? p.y - 36 : p.y + 46}
                >
                  {VERTEX[v].label}
                </text>
              </g>
            );
          })}

          <text className="captv-tri-caption" x={165} y={392} textAnchor="middle">
            {s.partitioned
              ? `keeping ${s.keep.join(' + ')}, sacrificing ${s.sacrifice}`
              : 'keeping C + A — P unused while healthy'}
          </text>

          <line className="captv-divider" x1={355} y1={36} x2={355} y2={398} />

          <text className="captv-row-label" x={650} y={28} textAnchor="middle">replicated store + client read</text>

          <line
            className={`captv-link ${s.partitioned ? 'is-cut' : 'is-ok'}`}
            x1={linkMidX}
            y1={node1.y + nodeH / 2}
            x2={linkMidX}
            y2={node2.y - nodeH / 2}
          />
          {s.partitioned ? (
            <g className="captv-link-badge">
              <circle cx={linkMidX} cy={(node1.y + node2.y) / 2} r={15} className="captv-link-badge-bg" />
              <WifiOff x={linkMidX - 9} y={(node1.y + node2.y) / 2 - 9} width={18} height={18} className="captv-link-icon-cut" />
            </g>
          ) : (
            <g className="captv-link-badge">
              <circle cx={linkMidX} cy={(node1.y + node2.y) / 2} r={15} className="captv-link-badge-bg" />
              <Wifi x={linkMidX - 9} y={(node1.y + node2.y) / 2 - 9} width={18} height={18} className="captv-link-icon-ok" />
            </g>
          )}

          {[s.node1, s.node2].map((n) => {
            const nx = n.id === 1 ? node1.x : node2.x;
            const ny = n.id === 1 ? node1.y : node2.y;
            const r = n.id === 1 ? s.reply1 : s.reply2;
            return (
              <g key={`node-${n.id}`}>
                <rect
                  className={`captv-node ${r.kind === 'error' ? 'is-error' : r.kind === 'stale' ? 'is-stale' : 'is-fresh'}`}
                  x={nx - nodeW / 2}
                  y={ny - nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx={12}
                />
                <Server x={nx - nodeW / 2 + 14} y={ny - 12} width={22} height={22} className="captv-node-icon" />
                <text className="captv-node-name" x={nx - nodeW / 2 + 44} y={ny - 8}>{`Node ${n.id}`}</text>
                <text className="captv-node-state" x={nx - nodeW / 2 + 44} y={ny + 12}>
                  {`counter = ${n.value}`}
                </text>
                <text className="captv-node-tag" x={nx - nodeW / 2 + 44} y={ny + 28}>
                  {n.holdsFresh ? 'fresh' : 'stale (un-replicated)'}
                </text>
              </g>
            );
          })}

          <g>
            <circle cx={clientX} cy={(node1.y + node2.y) / 2} r={30} className="captv-client" />
            <User x={clientX - 13} y={(node1.y + node2.y) / 2 - 13} width={26} height={26} className="captv-client-icon" />
            <text className="captv-client-label" x={clientX} y={(node1.y + node2.y) / 2 + 50}>client</text>
          </g>

          {[node1, node2].map((nn, i) => {
            const r = i === 0 ? s.reply1 : s.reply2;
            return (
              <g key={`flow-${i}`}>
                <line
                  className={`captv-flow is-${r.kind}`}
                  x1={nn.x + nodeW / 2}
                  y1={nn.y}
                  x2={clientX - 120}
                  y2={nn.y}
                />
                {renderReply(reply(r), nn.y)}
                <g transform={`translate(${clientX - 132}, ${nn.y})`} className={`captv-flow-icon is-${r.kind}`}>
                  <ReplyIcon kind={r.kind} size={16} />
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="captv-metrics">
        <div className="captv-metric">
          <span className="captv-metric-label">network</span>
          <span className={`captv-metric-value ${s.partitioned ? 'is-bad' : 'is-ok'}`}>
            {s.partitioned ? 'partitioned' : 'healthy'}
          </span>
        </div>
        <div className="captv-metric">
          <span className="captv-metric-label">keeping</span>
          <span className="captv-metric-value is-ok">{s.keep.join(' + ')}</span>
        </div>
        <div className="captv-metric">
          <span className="captv-metric-label">sacrificing</span>
          <span className={`captv-metric-value ${s.sacrifice ? 'is-bad' : ''}`}>{s.sacrifice || 'none'}</span>
        </div>
        <div className="captv-metric">
          <span className="captv-metric-label">Node 1 reply</span>
          <span className="captv-metric-value" style={{ color: replyColor(s.reply1.kind) }}>{s.reply1.text}</span>
        </div>
        <div className="captv-metric">
          <span className="captv-metric-label">Node 2 reply</span>
          <span className="captv-metric-value" style={{ color: replyColor(s.reply2.kind) }}>{s.reply2.text}</span>
        </div>
      </div>

      <div className="captv-narration">
        <span className="captv-narration-label">trace</span>
        <span className="captv-narration-body">{s.note}</span>
      </div>
    </div>
  );
}
