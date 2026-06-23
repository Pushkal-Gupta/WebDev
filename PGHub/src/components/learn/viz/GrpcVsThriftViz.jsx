import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import './GrpcVsThriftViz.css';

// Comparison axes. edge: 'grpc' | 'thrift' | 'tie'.
const AXES = [
  {
    id: 'idl',
    label: 'IDL',
    grpc: '.proto (Protocol Buffers)',
    thrift: '.thrift file',
    edge: 'tie',
    detail:
      'Both define services in a typed IDL and generate client + server stubs. Protobuf has a tighter, more widely-tooled grammar; Thrift IDL is comparably expressive. This is a wash — both catch breaking changes at build time, not runtime.',
  },
  {
    id: 'wire',
    label: 'WIRE FORMAT',
    grpc: 'Protobuf binary',
    thrift: 'TBinary · TCompact · TJSON',
    edge: 'thrift',
    detail:
      'gRPC is locked to Protobuf binary. Thrift lets you pick the protocol: TCompact for size, TBinary for speed, TJSON for human-readable web output without a proxy. That configurability is a Thrift edge when you need TJSON for browser clients.',
  },
  {
    id: 'transport',
    label: 'TRANSPORT',
    grpc: 'HTTP/2 (multiplexed)',
    thrift: 'TSocket · THttp · others',
    edge: 'tie',
    detail:
      'gRPC rides HTTP/2 — one TCP connection, parallel streams, HPACK header compression, no head-of-line blocking. Thrift can run over raw TCP, named pipes, or HTTP. gRPC wins on multiplexing; Thrift wins on transport choice. Call it a tie weighted by your need.',
  },
  {
    id: 'streaming',
    label: 'STREAMING',
    grpc: '4 native modes',
    thrift: 'not native (extensions)',
    edge: 'grpc',
    detail:
      'gRPC ships unary, server-stream, client-stream, and bidirectional streaming on HTTP/2 out of the box. Thrift has no first-class streaming — you bolt it on via extensions. For real-time or push workloads, gRPC is the clear winner.',
  },
  {
    id: 'langs',
    label: 'LANG SUPPORT',
    grpc: '11+ first-party',
    thrift: '~25 first-party',
    edge: 'thrift',
    detail:
      'Thrift historically shipped more first-party language targets (~25 vs gRPC’s 11+). For an unusual-language polyglot stack, Thrift’s breadth can be decisive — though gRPC’s community generators have closed much of the gap.',
  },
  {
    id: 'ecosystem',
    label: 'ECOSYSTEM',
    grpc: 'interceptors · deadlines · mesh',
    thrift: 'leaner · fewer built-ins',
    edge: 'grpc',
    detail:
      'gRPC carries interceptors, deadline propagation, retries, load balancers, and deep service-mesh integration (Envoy, Istio, Kubernetes are all gRPC-aware). Thrift is leaner — you build more yourself. For new infra, gRPC’s batteries-included ecosystem wins.',
  },
];

// gRPC streaming modes for the animated flow sub-toggle.
const STREAM_MODES = [
  { id: 'unary', label: 'unary', desc: 'one request, one response — a plain RPC call.' },
  { id: 'server', label: 'server-stream', desc: 'one request, a stream of responses back.' },
  { id: 'client', label: 'client-stream', desc: 'a stream of requests, one response at the end.' },
  { id: 'bidi', label: 'bidi', desc: 'requests and responses interleave freely on one stream.' },
];

const EDGE_LABEL = { grpc: 'gRPC', thrift: 'Thrift', tie: 'tie' };

export default function GrpcVsThriftViz() {
  const [axisId, setAxisId] = useState('streaming');
  const [streamMode, setStreamMode] = useState('unary');
  const [isPlaying, setIsPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const raf = useRef(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (!isPlaying || reduced.current) return undefined;
    let alive = true;
    let last = performance.now();
    const loop = (now) => {
      if (!alive) return;
      const dt = now - last;
      last = now;
      setTick((t) => (t + dt * 0.0006) % 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      alive = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [isPlaying]);

  const axis = useMemo(() => AXES.find((a) => a.id === axisId), [axisId]);
  const mode = useMemo(() => STREAM_MODES.find((m) => m.id === streamMode), [streamMode]);

  const reset = () => {
    setAxisId('streaming');
    setStreamMode('unary');
    setTick(0);
    setIsPlaying(true);
  };

  // Matrix geometry
  const W = 940;
  const H = 360;
  const colGrpcX = 70;
  const colThriftX = 510;
  const colW = 360;
  const rowTop = 70;
  const rowH = 40;
  const rowGap = 4;
  const rowY = (i) => rowTop + i * (rowH + rowGap);

  const hueForEdge = (edge) =>
    edge === 'grpc' ? 'var(--hue-sky)' : edge === 'thrift' ? 'var(--hue-violet)' : 'var(--hue-mint)';

  // Streaming flow dots — positions derived from tick + mode.
  const clientX = 150;
  const serverX = 790;
  const wireY = 250;
  const dotAt = (phase) => {
    const p = (tick + phase) % 1;
    return clientX + (serverX - clientX) * p;
  };
  const dotBack = (phase) => {
    const p = (tick + phase) % 1;
    return serverX - (serverX - clientX) * p;
  };

  const renderFlowDots = () => {
    const dots = [];
    if (streamMode === 'unary') {
      dots.push({ x: dotAt(0), dir: 'fwd', k: 'u1' });
      dots.push({ x: dotBack(0.5), dir: 'back', k: 'u2' });
    } else if (streamMode === 'server') {
      dots.push({ x: dotAt(0), dir: 'fwd', k: 's0' });
      [0, 0.33, 0.66].forEach((ph, i) => dots.push({ x: dotBack(ph), dir: 'back', k: `s${i}` }));
    } else if (streamMode === 'client') {
      [0, 0.33, 0.66].forEach((ph, i) => dots.push({ x: dotAt(ph), dir: 'fwd', k: `c${i}` }));
      dots.push({ x: dotBack(0.5), dir: 'back', k: 'c9' });
    } else {
      [0, 0.5].forEach((ph, i) => dots.push({ x: dotAt(ph), dir: 'fwd', k: `b${i}` }));
      [0.25, 0.75].forEach((ph, i) => dots.push({ x: dotBack(ph), dir: 'back', k: `bb${i}` }));
    }
    return dots;
  };

  return (
    <div className="gvt">
      <div className="gvt-head">
        <h3 className="gvt-title">gRPC vs Apache Thrift — an explorable comparison matrix</h3>
        <p className="gvt-sub">
          Click an axis to highlight both columns and see which framework wins it. Then animate gRPC&apos;s
          four streaming modes as request/response flows between client and server.
        </p>
      </div>

      <div className="gvt-controls">
        <div className="gvt-chips" role="tablist" aria-label="Comparison axis">
          {AXES.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`gvt-chip ${axisId === a.id ? 'is-on' : ''}`}
              onClick={() => setAxisId(a.id)}
              aria-pressed={axisId === a.id}
            >
              {a.label}
            </button>
          ))}
        </div>

        <span className="gvt-spacer" aria-hidden="true" />

        <button type="button" className="gvt-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gvt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gvt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gvt-grpc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--hue-sky)" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="gvt-thrift-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--hue-violet)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* column backdrops */}
          <rect x={colGrpcX} y={36} width={colW} height={rowY(AXES.length - 1) + rowH - 30} rx={10} fill="url(#gvt-grpc-grad)" />
          <rect x={colThriftX} y={36} width={colW} height={rowY(AXES.length - 1) + rowH - 30} rx={10} fill="url(#gvt-thrift-grad)" />

          <text className="gvt-col-title gvt-col-grpc" x={colGrpcX + colW / 2} y={56}>gRPC</text>
          <text className="gvt-col-title gvt-col-thrift" x={colThriftX + colW / 2} y={56}>Apache Thrift</text>

          {AXES.map((a, i) => {
            const active = a.id === axisId;
            const y = rowY(i);
            const grpcWins = a.edge === 'grpc';
            const thriftWins = a.edge === 'thrift';
            return (
              <g key={a.id} className={`gvt-row ${active ? 'is-active' : ''}`} onClick={() => setAxisId(a.id)} style={{ cursor: 'pointer' }}>
                <rect className={`gvt-cell ${active ? 'is-active' : ''} ${grpcWins ? 'is-win' : ''}`} x={colGrpcX} y={y} width={colW} height={rowH} rx={7} />
                <rect className={`gvt-cell ${active ? 'is-active' : ''} ${thriftWins ? 'is-win' : ''}`} x={colThriftX} y={y} width={colW} height={rowH} rx={7} />
                <text className="gvt-axis-label" x={W / 2} y={y + rowH / 2 + 4}>{a.label}</text>
                <text className="gvt-cell-val" x={colGrpcX + 16} y={y + rowH / 2 + 4} textAnchor="start">{a.grpc}</text>
                <text className="gvt-cell-val" x={colThriftX + colW - 16} y={y + rowH / 2 + 4} textAnchor="end">{a.thrift}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="gvt-detail" style={{ borderLeftColor: hueForEdge(axis.edge) }}>
        <div className="gvt-detail-head">
          <span className="gvt-detail-axis">{axis.label}</span>
          <span className="gvt-edge" style={{ background: `color-mix(in srgb, ${hueForEdge(axis.edge)} 18%, transparent)`, color: hueForEdge(axis.edge), borderColor: hueForEdge(axis.edge) }}>
            edge: {EDGE_LABEL[axis.edge]}
          </span>
        </div>
        <p className="gvt-detail-body">{axis.detail}</p>
      </div>

      <div className="gvt-stream">
        <div className="gvt-stream-bar">
          <span className="gvt-stream-title">gRPC streaming modes</span>
          <div className="gvt-stream-modes" role="tablist" aria-label="Streaming mode">
            {STREAM_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`gvt-mchip ${streamMode === m.id ? 'is-on' : ''}`}
                onClick={() => setStreamMode(m.id)}
                aria-pressed={streamMode === m.id}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="gvt-btn gvt-btn-primary"
            onClick={() => setIsPlaying((p) => !p)}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>

        <svg viewBox="0 0 940 130" className="gvt-flow-svg" preserveAspectRatio="xMidYMid meet">
          <line className="gvt-wire" x1={clientX + 8} y1={wireY - 170} x2={serverX - 8} y2={wireY - 170} />
          <rect className="gvt-node gvt-node-client" x={clientX - 70} y={wireY - 200} width={130} height={56} rx={9} />
          <text className="gvt-node-title" x={clientX - 5} y={wireY - 176}>Client</text>
          <text className="gvt-node-sub" x={clientX - 5} y={wireY - 158}>HTTP/2 stream</text>
          <rect className="gvt-node gvt-node-server" x={serverX - 60} y={wireY - 200} width={130} height={56} rx={9} />
          <text className="gvt-node-title" x={serverX + 5} y={wireY - 176}>Server</text>
          <text className="gvt-node-sub" x={serverX + 5} y={wireY - 158}>handler</text>

          {renderFlowDots().map((d) => (
            <circle
              key={d.k}
              className={`gvt-dot ${d.dir === 'fwd' ? 'is-fwd' : 'is-back'}`}
              cx={d.x}
              cy={wireY - 170}
              r={6}
            />
          ))}
          <text className="gvt-flow-caption" x={470} y={wireY - 130}>{mode.desc}</text>
        </svg>
      </div>

      <div className="gvt-metrics">
        <div className="gvt-metric">
          <span className="gvt-metric-label">selected axis</span>
          <span className="gvt-metric-value">{axis.label}</span>
        </div>
        <div className="gvt-metric">
          <span className="gvt-metric-label">gRPC</span>
          <span className="gvt-metric-value is-grpc">{axis.grpc}</span>
        </div>
        <div className="gvt-metric">
          <span className="gvt-metric-label">Thrift</span>
          <span className="gvt-metric-value is-thrift">{axis.thrift}</span>
        </div>
        <div className="gvt-metric">
          <span className="gvt-metric-label">edge</span>
          <span className="gvt-metric-value" style={{ color: hueForEdge(axis.edge) }}>{EDGE_LABEL[axis.edge]}</span>
        </div>
      </div>

      <div className="gvt-narration">
        <span className="gvt-narration-label">read</span>
        <span className="gvt-narration-body">
          On <strong>{axis.label.toLowerCase()}</strong>, the edge goes to <strong>{EDGE_LABEL[axis.edge]}</strong>. Streaming demo: <strong>{mode.label}</strong> — {mode.desc}
        </span>
      </div>
    </div>
  );
}
