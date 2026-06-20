import React, { useMemo, useState } from 'react';
import { Monitor, Server, ArrowRight, ArrowLeft, RefreshCw, RotateCcw, Tag } from 'lucide-react';
import './EtagConditionalViz.css';

// HTTP conditional requests with ETag / If-None-Match.
//
// The client caches a representation along with the server's ETag (a content
// fingerprint). On the next fetch it sends If-None-Match: "<etag>". The server
// compares it against the resource's current ETag:
//   - match    -> 304 Not Modified, NO body. Only headers cross the wire.
//   - no match -> 200 OK + full body + the new ETag, which the client re-caches.
//
// Deterministic byte budget: a fixed body size plus small, fixed header sizes.
const BODY_BYTES = 14320;
const REQ_HEADER_BYTES = 180;
const RESP_HEADER_BYTES = 220;

const ETAG_A = 'v1';
const ETAG_B = 'v2';

export default function EtagConditionalViz() {
  // cachedEtag: what the client currently holds. null = cold cache (first load).
  const [cachedEtag, setCachedEtag] = useState(null);
  // serverEtag: the resource's live fingerprint on the server.
  const [serverEtag, setServerEtag] = useState(ETAG_A);
  // changed: pending toggle — does the next request find a different resource?
  const [changed, setChanged] = useState(false);
  // history of completed exchanges, for the cumulative-savings readout.
  const [log, setLog] = useState([]);

  const last = log.length ? log[log.length - 1] : null;

  const savedBytes = useMemo(
    () => log.reduce((acc, e) => acc + (e.status === 304 ? BODY_BYTES : 0), 0),
    [log],
  );
  const fullCostBytes = useMemo(
    () => log.length * (BODY_BYTES + RESP_HEADER_BYTES),
    [log],
  );

  const sendRequest = () => {
    // First request to a cold cache always transfers the body (no validator yet).
    const cold = cachedEtag == null;
    const willMatch = !cold && !changed && cachedEtag === serverEtag;
    const nextServerEtag = changed ? ETAG_B : serverEtag;

    const entry = willMatch
      ? {
        reqEtag: cachedEtag,
        status: 304,
        respEtag: nextServerEtag,
        bodyBytes: 0,
        reqBytes: REQ_HEADER_BYTES,
        respBytes: RESP_HEADER_BYTES,
      }
      : {
        reqEtag: cold ? null : cachedEtag,
        status: 200,
        respEtag: nextServerEtag,
        bodyBytes: BODY_BYTES,
        reqBytes: REQ_HEADER_BYTES,
        respBytes: RESP_HEADER_BYTES + BODY_BYTES,
      };

    setServerEtag(nextServerEtag);
    setCachedEtag(nextServerEtag); // client always caches the served ETag
    setChanged(false);
    setLog((l) => [...l, entry]);
  };

  const reset = () => {
    setCachedEtag(null);
    setServerEtag(ETAG_A);
    setChanged(false);
    setLog([]);
  };

  // SVG geometry
  const W = 940;
  const H = 430;
  const cliX = 24;
  const cliW = 250;
  const srvW = 250;
  const srvX = W - 24 - srvW;
  const boxY = 56;
  const boxH = 300;

  const is304 = last && last.status === 304;
  const is200 = last && last.status === 200;
  const reqLine = 'GET /styles.css HTTP/1.1';
  const reqValidator = cachedEtag == null ? '(no validator — cold cache)' : `If-None-Match: "${cachedEtag}"`;
  const statusText = !last ? '—' : is304 ? '304 Not Modified' : '200 OK';
  const contentLen = !last ? '—' : is304 ? '0 bytes (not sent)' : `${BODY_BYTES.toLocaleString()} bytes`;

  return (
    <div className="ecv">
      <div className="ecv-head">
        <h3 className="ecv-title">ETag conditional requests — 304 Not Modified vs 200 OK</h3>
        <p className="ecv-sub">
          The client revalidates with If-None-Match carrying its cached ETag. If the resource is unchanged the
          server answers 304 with no body and the whole payload stays off the wire; if it changed, a full 200 plus
          a fresh ETag comes back and the client re-caches it.
        </p>
      </div>

      <div className="ecv-controls">
        <label className="ecv-toggle">
          <input
            type="checkbox"
            checked={changed}
            onChange={(e) => setChanged(e.target.checked)}
            className="ecv-checkbox"
          />
          <span className="ecv-toggle-text">Resource changed on server</span>
          <span className={`ecv-toggle-tag ${changed ? 'is-on' : ''}`}>
            {changed ? `next ETag "${ETAG_B}"` : `stays "${serverEtag}"`}
          </span>
        </label>

        <span className="ecv-spacer" aria-hidden="true" />

        <div className="ecv-buttons">
          <button type="button" className="ecv-btn ecv-btn-primary" onClick={sendRequest}>
            <RefreshCw size={14} /> Send request
          </button>
          <button type="button" className="ecv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ecv-stepcount">
          exchange <strong>{log.length}</strong>
        </div>
      </div>

      <div className="ecv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ecv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ecv-arrow-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" className="ecv-arrowhead" />
            </marker>
            <marker id="ecv-arrow-l" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 1 L 9 5 L 0 9 z" className={`ecv-arrowhead ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`} />
            </marker>
          </defs>

          {/* client */}
          <g className="ecv-node">
            <rect className="ecv-box" x={cliX} y={boxY} width={cliW} height={boxH} rx={11} />
            <g transform={`translate(${cliX + 14}, ${boxY + 14})`}><Monitor width={17} height={17} className="ecv-ic" /></g>
            <text className="ecv-box-title" x={cliX + 40} y={boxY + 28}>client</text>
            <text className="ecv-box-tag" x={cliX + cliW - 12} y={boxY + 28}>browser cache</text>

            <text className="ecv-field-label" x={cliX + 16} y={boxY + 64}>cached representation</text>
            <rect className={`ecv-chip ${cachedEtag == null ? 'is-empty' : ''}`} x={cliX + 16} y={boxY + 74} width={cliW - 32} height={34} rx={7} />
            <g transform={`translate(${cliX + 28}, ${boxY + 84})`}><Tag width={13} height={13} className="ecv-ic-chip" /></g>
            <text className="ecv-chip-text" x={cliX + 48} y={boxY + 96}>
              {cachedEtag == null ? 'empty — nothing cached' : `ETag "${cachedEtag}"`}
            </text>

            <text className="ecv-field-label" x={cliX + 16} y={boxY + 138}>request headers</text>
            <text className="ecv-hdr" x={cliX + 16} y={boxY + 158}>{reqLine}</text>
            <text className="ecv-hdr ecv-hdr-key" x={cliX + 16} y={boxY + 176}>{reqValidator}</text>
            <text className="ecv-hdr" x={cliX + 16} y={boxY + 194}>Accept-Encoding: gzip</text>

            <text className="ecv-field-label" x={cliX + 16} y={boxY + 232}>last response</text>
            <text className={`ecv-status ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`} x={cliX + 16} y={boxY + 254}>
              {statusText}
            </text>
            <text className="ecv-hdr" x={cliX + 16} y={boxY + 274}>
              body received: {!last ? '—' : is304 ? '0 bytes' : `${BODY_BYTES.toLocaleString()} bytes`}
            </text>
          </g>

          {/* request arrow (client -> server) */}
          <g>
            <line className="ecv-wire is-req" x1={cliX + cliW + 8} y1={boxY + 96} x2={srvX - 8} y2={boxY + 96} markerEnd="url(#ecv-arrow-r)" />
            <g transform={`translate(${(cliX + cliW + srvX) / 2 - 8}, ${boxY + 78})`}><ArrowRight width={16} height={16} className="ecv-ic-wire" /></g>
            <text className="ecv-wire-label" x={(cliX + cliW + srvX) / 2} y={boxY + 116}>
              If-None-Match
            </text>
            <text className="ecv-wire-bytes" x={(cliX + cliW + srvX) / 2} y={boxY + 132}>
              {REQ_HEADER_BYTES} B headers
            </text>
          </g>

          {/* response arrow (server -> client) */}
          <g>
            <line
              className={`ecv-wire is-resp ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`}
              x1={srvX - 8}
              y1={boxY + 204}
              x2={cliX + cliW + 8}
              y2={boxY + 204}
              markerEnd="url(#ecv-arrow-l)"
            />
            <g transform={`translate(${(cliX + cliW + srvX) / 2 - 8}, ${boxY + 210})`}><ArrowLeft width={16} height={16} className={`ecv-ic-wire ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`} /></g>
            <text className={`ecv-wire-label ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`} x={(cliX + cliW + srvX) / 2} y={boxY + 224}>
              {!last ? 'response' : is304 ? '304 · no body' : '200 · full body'}
            </text>
            <text className={`ecv-wire-bytes ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`} x={(cliX + cliW + srvX) / 2} y={boxY + 240}>
              {!last ? '—' : `${last.respBytes.toLocaleString()} B`}
            </text>
          </g>

          {/* server */}
          <g className="ecv-node">
            <rect className="ecv-box" x={srvX} y={boxY} width={srvW} height={boxH} rx={11} />
            <g transform={`translate(${srvX + 14}, ${boxY + 14})`}><Server width={17} height={17} className="ecv-ic" /></g>
            <text className="ecv-box-title" x={srvX + 40} y={boxY + 28}>server</text>
            <text className="ecv-box-tag" x={srvX + srvW - 12} y={boxY + 28}>origin</text>

            <text className="ecv-field-label" x={srvX + 16} y={boxY + 64}>current resource ETag</text>
            <rect className={`ecv-chip ${changed ? 'is-changed' : ''}`} x={srvX + 16} y={boxY + 74} width={srvW - 32} height={34} rx={7} />
            <g transform={`translate(${srvX + 28}, ${boxY + 84})`}><Tag width={13} height={13} className="ecv-ic-chip" /></g>
            <text className="ecv-chip-text" x={srvX + 48} y={boxY + 96}>
              {`ETag "${changed ? ETAG_B : serverEtag}"`}
            </text>

            <text className="ecv-field-label" x={srvX + 16} y={boxY + 138}>compare validator</text>
            <text className="ecv-hdr" x={srvX + 16} y={boxY + 158}>
              {cachedEtag == null ? 'no If-None-Match sent' : `client sent "${cachedEtag}"`}
            </text>
            <text className={`ecv-hdr ecv-cmp ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`} x={srvX + 16} y={boxY + 176}>
              {!last ? '— awaiting request —' : is304 ? 'match -> 304' : 'differs -> 200'}
            </text>

            <text className="ecv-field-label" x={srvX + 16} y={boxY + 214}>response headers</text>
            <text className={`ecv-hdr ecv-status-line ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`} x={srvX + 16} y={boxY + 234}>
              {!last ? 'HTTP/1.1 —' : `HTTP/1.1 ${statusText}`}
            </text>
            <text className="ecv-hdr ecv-hdr-key" x={srvX + 16} y={boxY + 252}>
              {!last ? 'ETag: —' : `ETag: "${last.respEtag}"`}
            </text>
            <text className="ecv-hdr" x={srvX + 16} y={boxY + 270}>Content-Length: {contentLen}</text>
          </g>
        </svg>
      </div>

      <div className="ecv-metrics">
        <div className="ecv-metric">
          <span className="ecv-metric-label">client cached ETag</span>
          <span className="ecv-metric-value">{cachedEtag == null ? '—' : `"${cachedEtag}"`}</span>
        </div>
        <div className="ecv-metric">
          <span className="ecv-metric-label">server ETag</span>
          <span className="ecv-metric-value">{`"${changed ? ETAG_B : serverEtag}"`}</span>
        </div>
        <div className="ecv-metric">
          <span className="ecv-metric-label">last status</span>
          <span className={`ecv-metric-value ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`}>{statusText}</span>
        </div>
        <div className="ecv-metric">
          <span className="ecv-metric-label">body bytes this request</span>
          <span className={`ecv-metric-value ${is304 ? 'is-saved' : ''}`}>
            {!last ? '—' : `${last.bodyBytes.toLocaleString()} B`}
          </span>
        </div>
        <div className="ecv-metric">
          <span className="ecv-metric-label">bandwidth saved</span>
          <span className="ecv-metric-value is-saved">{savedBytes.toLocaleString()} B</span>
        </div>
        <div className="ecv-metric">
          <span className="ecv-metric-label">vs full transfer</span>
          <span className="ecv-metric-value">{fullCostBytes.toLocaleString()} B</span>
        </div>
      </div>

      <div className="ecv-narration">
        <span className={`ecv-narration-label ${is304 ? 'is-saved' : is200 ? 'is-full' : ''}`}>
          {!last ? 'idle' : is304 ? 'not modified' : 'transferred'}
        </span>
        <span className="ecv-narration-body">
          {!last
            ? 'Toggle "Resource changed on server" then Send request. A cold cache (no validator) always pulls the full body on the first fetch.'
            : is304
              ? `The client's "${last.reqEtag}" matched the server's current ETag, so the server returned 304 with an empty body. ${BODY_BYTES.toLocaleString()} bytes stayed off the wire — only ${last.respBytes} bytes of headers came back.`
              : `${last.reqEtag == null ? 'No validator was present (cold cache)' : `The client's "${last.reqEtag}" no longer matched`}, so the server sent 200 OK with the full ${BODY_BYTES.toLocaleString()}-byte body and a fresh ETag "${last.respEtag}". The client cached it for next time.`}
        </span>
      </div>
    </div>
  );
}
