import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, FileJson, Binary, Repeat } from 'lucide-react';
import './GrpcVsRestViz.css';

// Approximate on-the-wire sizes for the same "GetUser" call.
const REST_REQ_BYTES = 142; // GET line + HTTP/1.1 headers (text)
const REST_RESP_BYTES = 318; // JSON body + headers, per response
const GRPC_REQ_BYTES = 58; // protobuf-framed request over HTTP/2
const GRPC_RESP_BYTES = 96; // protobuf-framed response per message

const REST_JSON = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1024789,
  "name": "Ava Stone",
  "tier": "gold",
  "active": true
}`;

const GRPC_BYTES = '0a 07 41 76 61 20 53 74 6f 6e 65 10 c5 fd 3e 1a 04 67 6f 6c 64 20 01';

export default function GrpcVsRestViz() {
  const [streamCount, setStreamCount] = useState(5);
  const [grpcMode, setGrpcMode] = useState('unary'); // 'unary' | 'server-stream'

  const derived = useMemo(() => {
    const messages = grpcMode === 'server-stream' ? streamCount : 1;

    // REST: one round-trip per message (HTTP/1.1, no streaming).
    const restBytes = (REST_REQ_BYTES + REST_RESP_BYTES) * messages;
    const restRoundTrips = messages;

    // gRPC: one request opens the call; server streams N messages back on
    // a single HTTP/2 stream (one logical round-trip).
    const grpcBytes = GRPC_REQ_BYTES + GRPC_RESP_BYTES * messages;
    const grpcRoundTrips = 1;

    const savedPct = Math.round((1 - grpcBytes / restBytes) * 100);

    return { messages, restBytes, restRoundTrips, grpcBytes, grpcRoundTrips, savedPct };
  }, [streamCount, grpcMode]);

  const W = 940;
  const H = 360;
  const midX = W / 2;
  const clientX = 120;
  const restServerX = midX - 120;
  const grpcServerX = midX + 120;
  const serverX = W - 120;
  const laneTop = 96;
  const laneBottom = 300;

  // gRPC message positions along the response lane (interleaved/multiplexed feel).
  const grpcMsgs = Array.from({ length: derived.messages });
  const restMsgs = Array.from({ length: derived.messages });

  return (
    <div className="gvr">
      <div className="gvr-head">
        <h3 className="gvr-title">gRPC over HTTP/2 vs REST over HTTP/1.1 — the same call</h3>
        <p className="gvr-sub">
          REST sends text JSON with one request and one response per call. gRPC frames a compact
          binary protobuf payload and can stream many messages back on a single multiplexed connection.
        </p>
      </div>

      <div className="gvr-controls">
        <div className="gvr-modes" role="tablist" aria-label="gRPC call type">
          <button
            type="button"
            className={`gvr-mode ${grpcMode === 'unary' ? 'is-on' : ''}`}
            onClick={() => setGrpcMode('unary')}
            aria-pressed={grpcMode === 'unary'}
          >
            <Repeat size={13} /> UNARY
          </button>
          <button
            type="button"
            className={`gvr-mode ${grpcMode === 'server-stream' ? 'is-on' : ''}`}
            onClick={() => setGrpcMode('server-stream')}
            aria-pressed={grpcMode === 'server-stream'}
          >
            <ArrowRightLeft size={13} /> SERVER-STREAM
          </button>
        </div>

        <label className="gvr-slider">
          <span className="gvr-input-label">messages</span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={streamCount}
            disabled={grpcMode === 'unary'}
            onChange={(e) => setStreamCount(Number(e.target.value))}
            className="gvr-range"
            aria-label="Number of streamed messages"
          />
          <span className="gvr-slider-val">{derived.messages}</span>
        </label>
      </div>

      <div className="gvr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gvr-svg" preserveAspectRatio="xMidYMid meet">
          {/* divider */}
          <line className="gvr-divider" x1={midX} y1={20} x2={midX} y2={H - 20} />
          <text className="gvr-side-label is-rest" x={(clientX + restServerX) / 2} y={40}>REST · HTTP/1.1 · JSON</text>
          <text className="gvr-side-label is-grpc" x={(grpcServerX + serverX) / 2} y={40}>gRPC · HTTP/2 · protobuf</text>

          {/* REST side */}
          <g>
            <rect className="gvr-node" x={clientX - 44} y={laneTop - 26} width={88} height={52} rx={8} />
            <text className="gvr-node-label" x={clientX} y={laneTop + 5}>client</text>
            <rect className="gvr-node" x={restServerX - 44} y={laneTop - 26} width={88} height={52} rx={8} />
            <text className="gvr-node-label" x={restServerX} y={laneTop + 5}>server</text>

            {/* one connection per message (HTTP/1.1) */}
            {restMsgs.map((_, i) => {
              const y = laneTop + 60 + i * ((laneBottom - laneTop - 40) / Math.max(1, derived.messages));
              return (
                <g key={`rest-${i}`}>
                  <line className="gvr-conn is-rest" x1={clientX} y1={y} x2={restServerX} y2={y} strokeDasharray="3 3" />
                  <line className="gvr-flow is-rest-req" x1={clientX} y1={y - 5} x2={restServerX} y2={y - 5} markerEnd="url(#gvr-rest-head)" />
                  <line className="gvr-flow is-rest-resp" x1={restServerX} y1={y + 5} x2={clientX} y2={y + 5} markerEnd="url(#gvr-rest-head)" />
                  <text className="gvr-conn-tag" x={(clientX + restServerX) / 2} y={y - 9}>conn #{i + 1}</text>
                </g>
              );
            })}
          </g>

          {/* gRPC side — single connection, multiplexed messages */}
          <g>
            <rect className="gvr-node" x={grpcServerX - 44} y={laneTop - 26} width={88} height={52} rx={8} />
            <text className="gvr-node-label" x={grpcServerX} y={laneTop + 5}>client</text>
            <rect className="gvr-node" x={serverX - 44} y={laneTop - 26} width={88} height={52} rx={8} />
            <text className="gvr-node-label" x={serverX} y={laneTop + 5}>server</text>

            {/* the single shared HTTP/2 connection */}
            <line className="gvr-conn is-grpc-main" x1={grpcServerX} y1={(laneTop + laneBottom) / 2} x2={serverX} y2={(laneTop + laneBottom) / 2} />
            <text className="gvr-conn-tag is-grpc" x={(grpcServerX + serverX) / 2} y={(laneTop + laneBottom) / 2 - 12}>1 connection (multiplexed)</text>

            {/* request frame */}
            <line className="gvr-flow is-grpc-req" x1={grpcServerX} y1={laneTop + 50} x2={serverX} y2={laneTop + 50} markerEnd="url(#gvr-grpc-head)" />
            <text className="gvr-frame-tag" x={(grpcServerX + serverX) / 2} y={laneTop + 44}>request frame</text>

            {/* response message frames interleaved on the same line */}
            {grpcMsgs.map((_, i) => {
              const t = (i + 1) / (derived.messages + 1);
              const cx = serverX - t * (serverX - grpcServerX);
              const cy = (laneTop + laneBottom) / 2;
              return (
                <g key={`grpc-${i}`}>
                  <rect className="gvr-frame" x={cx - 13} y={cy - 9} width={26} height={18} rx={3} />
                  <text className="gvr-frame-idx" x={cx} y={cy + 4}>{i + 1}</text>
                </g>
              );
            })}
            <line className="gvr-flow is-grpc-resp" x1={serverX} y1={laneBottom - 20} x2={grpcServerX} y2={laneBottom - 20} markerEnd="url(#gvr-grpc-head)" />
            <text className="gvr-frame-tag" x={(grpcServerX + serverX) / 2} y={laneBottom - 26}>
              {grpcMode === 'server-stream' ? `${derived.messages} response frames` : 'response frame'}
            </text>
          </g>

          <defs>
            <marker id="gvr-rest-head" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path className="gvr-head-rest" d="M0,0 L8,4 L0,8 Z" />
            </marker>
            <marker id="gvr-grpc-head" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path className="gvr-head-grpc" d="M0,0 L8,4 L0,8 Z" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="gvr-metrics">
        <div className="gvr-metric">
          <span className="gvr-metric-label">payload — REST</span>
          <span className="gvr-metric-value is-rest">{derived.restBytes} B</span>
        </div>
        <div className="gvr-metric">
          <span className="gvr-metric-label">payload — gRPC</span>
          <span className="gvr-metric-value is-grpc">{derived.grpcBytes} B</span>
        </div>
        <div className="gvr-metric">
          <span className="gvr-metric-label">bytes saved</span>
          <span className="gvr-metric-value is-good">{derived.savedPct}%</span>
        </div>
        <div className="gvr-metric">
          <span className="gvr-metric-label">round-trips — REST</span>
          <span className="gvr-metric-value is-rest">{derived.restRoundTrips}</span>
        </div>
        <div className="gvr-metric">
          <span className="gvr-metric-label">round-trips — gRPC</span>
          <span className="gvr-metric-value is-grpc">{derived.grpcRoundTrips}</span>
        </div>
        <div className="gvr-metric">
          <span className="gvr-metric-label">streaming</span>
          <span className="gvr-metric-value">{grpcMode === 'server-stream' ? 'server → client' : 'none (unary)'}</span>
        </div>
      </div>

      <div className="gvr-payloads">
        <div className="gvr-payload is-rest">
          <span className="gvr-payload-label"><FileJson size={13} /> REST response · text JSON</span>
          <pre className="gvr-payload-body">{REST_JSON}</pre>
        </div>
        <div className="gvr-payload is-grpc">
          <span className="gvr-payload-label"><Binary size={13} /> gRPC message · binary protobuf</span>
          <pre className="gvr-payload-body">{GRPC_BYTES}</pre>
          <span className="gvr-payload-note">
            No field names on the wire — tag numbers + varints. Smaller, but not human-readable.
          </span>
        </div>
      </div>

      <div className="gvr-narration">
        <span className="gvr-narration-label">read-out</span>
        <span className="gvr-narration-body">
          {grpcMode === 'server-stream'
            ? `Streaming ${derived.messages} messages: REST opens ${derived.restRoundTrips} separate HTTP/1.1 connections and ships ${derived.restBytes} B of text. gRPC reuses one multiplexed HTTP/2 connection, framing ${derived.messages} protobuf responses for ${derived.grpcBytes} B — ${derived.savedPct}% smaller.`
            : `A single unary call: REST is one text round-trip at ${derived.restBytes} B; gRPC frames a compact binary request/response at ${derived.grpcBytes} B — ${derived.savedPct}% smaller. Switch to SERVER-STREAM to see one HTTP/2 connection carry many responses.`}
        </span>
      </div>
    </div>
  );
}
