import React, { useMemo, useState } from 'react';
import { KeyRound, FileText, ScrollText, ShieldCheck, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import './Sigv4SigningViz.css';

// AWS Signature Version 4 — how a request proves it came from a key holder
// without ever putting the secret on the wire.
//
//   1. canonical request = method + path + sorted query + canonical headers
//      + signed-headers list + SHA256(payload). Hashed -> a fixed digest.
//   2. string-to-sign  = algorithm + timestamp + credential scope
//      (date/region/service/aws4_request) + hash(canonical request).
//   3. signing key derived by CHAINED HMAC, each step keyed by the prior:
//        kDate    = HMAC("AWS4"+secret, date)
//        kRegion  = HMAC(kDate,    region)
//        kService = HMAC(kRegion,  service)
//        kSigning = HMAC(kService, "aws4_request")
//   4. signature = HMAC(kSigning, string-to-sign).
//
// The secret never travels; only the signature does. Any change to method,
// path, query, headers, body, or timestamp changes the canonical request hash,
// which changes the signature — so tampering and replay are detectable.

// Deterministic, browser-safe stand-in for HMAC-SHA256. NOT real crypto — it
// only needs to behave like a hash for the viz: same input -> same output, and
// a one-bit input change cascades across the whole digest (avalanche).
const mix = (seed, text) => {
  let h = (seed >>> 0) ^ 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
    h ^= h >>> 15;
  }
  h ^= h << 13;
  h = (h >>> 0) ^ (h >>> 7);
  return h >>> 0;
};

const hexDigest = (seed, text, len = 16) => {
  let out = '';
  let h = mix(seed, text);
  while (out.length < len) {
    h = mix(h, out + text);
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return out.slice(0, len);
};

const PRESETS = [
  { id: 'get-listbuckets', method: 'GET', path: '/', query: 'list-type=2', body: '', service: 's3', region: 'us-east-1', date: '20260623' },
  { id: 'put-object', method: 'PUT', path: '/photos/cat.png', query: '', body: 'PNG…', service: 's3', region: 'eu-west-1', date: '20260623' },
  { id: 'dynamo-query', method: 'POST', path: '/', query: '', body: '{"TableName":"Users"}', service: 'dynamodb', region: 'ap-south-1', date: '20260623' },
];

const STAGES = [
  { key: 'canonical', label: 'Canonical request', icon: FileText, hue: 'var(--hue-sky)' },
  { key: 'string', label: 'String-to-sign', icon: ScrollText, hue: 'var(--hue-violet)' },
  { key: 'key', label: 'Derive signing key', icon: KeyRound, hue: 'var(--hue-pink)' },
  { key: 'sign', label: 'Signature', icon: ShieldCheck, hue: 'var(--hue-mint)' },
];

const SECRET = 'wJalrXUtnFEMI/K7MDENG'; // canonical AWS docs example secret (public sample)

export default function Sigv4SigningViz() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [tampered, setTampered] = useState(false);
  const [stage, setStage] = useState(3);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) || PRESETS[0],
    [presetId],
  );

  // The tamper toggle flips a single byte of the path — the avalanche demo.
  const req = useMemo(() => {
    const path = tampered ? `${preset.path}?x` : preset.path;
    return { ...preset, path };
  }, [preset, tampered]);

  const model = useMemo(() => {
    const canonical = [
      req.method,
      req.path,
      req.query,
      `host:${req.service}.${req.region}.amazonaws.com`,
      `x-amz-date:${req.date}T000000Z`,
      'host;x-amz-date',
      hexDigest(0x50, req.body || ''),
    ].join('\n');
    const canonicalHash = hexDigest(0x10, canonical, 24);

    const scope = `${req.date}/${req.region}/${req.service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      `${req.date}T000000Z`,
      scope,
      canonicalHash,
    ].join('\n');

    // Chained HMAC derivation — each link is keyed by the previous digest.
    const kSecret = hexDigest(mix(0xa1, `AWS4${SECRET}`), 'AWS4-secret', 12);
    const kDate = hexDigest(mix(0xa1, `AWS4${SECRET}`), req.date, 12);
    const kRegion = hexDigest(mix(0xb2, kDate), req.region, 12);
    const kService = hexDigest(mix(0xc3, kRegion), req.service, 12);
    const kSigning = hexDigest(mix(0xd4, kService), 'aws4_request', 12);

    const signature = hexDigest(mix(0xe5, kSigning), stringToSign, 32);

    return {
      canonical,
      canonicalHash,
      scope,
      stringToSign,
      chain: [
        { name: 'kSecret', input: 'AWS4 + secret', value: kSecret },
        { name: 'kDate', input: req.date, value: kDate },
        { name: 'kRegion', input: req.region, value: kRegion },
        { name: 'kService', input: req.service, value: kService },
        { name: 'kSigning', input: 'aws4_request', value: kSigning },
      ],
      signature,
    };
  }, [req]);

  const reset = () => {
    setPresetId(PRESETS[0].id);
    setTampered(false);
    setStage(3);
  };

  const stepStage = (dir) => {
    setStage((s) => (s + dir + STAGES.length) % STAGES.length);
  };

  // SVG geometry — vertical pipeline, data flows downward.
  const W = 940;
  const H = 560;
  const colX = W / 2;
  const boxW = 560;
  const boxX = colX - boxW / 2;
  const stageH = 110;
  const gap = 28;
  const startY = 20;

  const stagePositions = STAGES.map((_, i) => startY + i * (stageH + gap));

  return (
    <div className="s4v">
      <div className="s4v-head">
        <h3 className="s4v-title">AWS SigV4 — signing a request without sending the secret</h3>
        <p className="s4v-sub">
          The request collapses to a canonical hash, gets wrapped in a dated scope, and is signed with a key
          derived through four chained HMACs. Tamper with one byte and watch the signature avalanche.
        </p>
      </div>

      <div className="s4v-controls">
        <div className="s4v-presets">
          <span className="s4v-input-label">request</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`s4v-chip ${presetId === p.id ? 'is-active' : ''}`}
              onClick={() => setPresetId(p.id)}
            >
              {p.method} {p.service}
            </button>
          ))}
        </div>

        <div className="s4v-presets">
          <span className="s4v-input-label">stage</span>
          {STAGES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`s4v-chip ${stage === i ? 'is-active' : ''}`}
              onClick={() => setStage(i)}
            >
              {i + 1}
            </button>
          ))}
          <span className="s4v-stepper">
            <button type="button" className="s4v-step-btn" onClick={() => stepStage(1)} aria-label="Next stage">
              <ChevronUp size={13} />
            </button>
            <button type="button" className="s4v-step-btn" onClick={() => stepStage(-1)} aria-label="Previous stage">
              <ChevronDown size={13} />
            </button>
          </span>
        </div>

        <span className="s4v-spacer" aria-hidden="true" />

        <button
          type="button"
          className={`s4v-btn ${tampered ? 's4v-btn-primary' : ''}`}
          onClick={() => setTampered((v) => !v)}
        >
          <ShieldCheck size={14} /> {tampered ? 'Path tampered' : 'Tamper with path'}
        </button>
        <button type="button" className="s4v-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="s4v-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="s4v-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id="s4v-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="s4v-arrowhead" />
            </marker>
          </defs>

          {/* downward trunk connecting the four stages */}
          {stagePositions.slice(0, -1).map((y, i) => (
            <line
              key={`trunk-${i}`}
              className="s4v-trunk"
              x1={colX}
              y1={y + stageH}
              x2={colX}
              y2={stagePositions[i + 1]}
              markerEnd="url(#s4v-arrow)"
            />
          ))}

          {STAGES.map((s, i) => {
            const y = stagePositions[i];
            const active = stage === i;
            const Icon = s.icon;
            return (
              <g key={s.key}>
                <rect
                  className={`s4v-box ${active ? 'is-active' : ''}`}
                  x={boxX}
                  y={y}
                  width={boxW}
                  height={stageH}
                  rx={11}
                  style={active ? { stroke: s.hue } : undefined}
                />
                <rect x={boxX} y={y} width={6} height={stageH} rx={3} fill={s.hue} />
                <g transform={`translate(${boxX + 18}, ${y + 14})`}>
                  <Icon width={16} height={16} className="s4v-ic" style={{ color: s.hue }} />
                </g>
                <text className="s4v-box-title" x={boxX + 42} y={y + 27}>
                  {i + 1}. {s.label}
                </text>

                {/* per-stage content */}
                {s.key === 'canonical' && (
                  <>
                    <text className="s4v-line" x={boxX + 18} y={y + 50}>
                      {req.method} {req.path} {req.query ? `?${req.query}` : ''}
                    </text>
                    <text className="s4v-line s4v-dim" x={boxX + 18} y={y + 70}>
                      host;x-amz-date · payload-hash = {hexDigest(0x50, req.body || '').slice(0, 16)}…
                    </text>
                    <text className="s4v-line s4v-hash" x={boxX + 18} y={y + 92} style={{ fill: s.hue }}>
                      hash → {model.canonicalHash}…
                    </text>
                  </>
                )}
                {s.key === 'string' && (
                  <>
                    <text className="s4v-line" x={boxX + 18} y={y + 50}>AWS4-HMAC-SHA256 · {req.date}T000000Z</text>
                    <text className="s4v-line s4v-dim" x={boxX + 18} y={y + 70}>scope = {model.scope}</text>
                    <text className="s4v-line s4v-hash" x={boxX + 18} y={y + 92} style={{ fill: s.hue }}>
                      + canonical hash {model.canonicalHash.slice(0, 16)}…
                    </text>
                  </>
                )}
                {s.key === 'key' && (
                  <>
                    <text className="s4v-line s4v-dim" x={boxX + 18} y={y + 50}>
                      kSecret → kDate → kRegion → kService → kSigning
                    </text>
                    <text className="s4v-line" x={boxX + 18} y={y + 72}>
                      each link HMAC-keyed by the previous digest
                    </text>
                    <text className="s4v-line s4v-hash" x={boxX + 18} y={y + 92} style={{ fill: s.hue }}>
                      kSigning = {model.chain[4].value}…
                    </text>
                  </>
                )}
                {s.key === 'sign' && (
                  <>
                    <text className="s4v-line s4v-dim" x={boxX + 18} y={y + 52}>
                      signature = HMAC(kSigning, string-to-sign)
                    </text>
                    <text className="s4v-line s4v-sig" x={boxX + 18} y={y + 84} style={{ fill: s.hue }}>
                      {model.signature}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="s4v-chain">
        <span className="s4v-chain-label">chained HMAC key derivation</span>
        <div className="s4v-chain-row">
          {model.chain.map((link, i) => (
            <React.Fragment key={link.name}>
              <div className="s4v-link">
                <span className="s4v-link-name">{link.name}</span>
                <span className="s4v-link-input">{link.input}</span>
                <span className="s4v-link-value">{link.value}</span>
              </div>
              {i < model.chain.length - 1 && <span className="s4v-link-arrow" aria-hidden="true">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="s4v-metrics">
        <div className="s4v-metric">
          <span className="s4v-metric-label">canonical hash</span>
          <span className="s4v-metric-value">{model.canonicalHash}…</span>
        </div>
        <div className="s4v-metric">
          <span className="s4v-metric-label">credential scope</span>
          <span className="s4v-metric-value">{model.scope}</span>
        </div>
        <div className="s4v-metric">
          <span className="s4v-metric-label">final signature</span>
          <span className={`s4v-metric-value ${tampered ? 'is-tampered' : 'is-ok'}`}>{model.signature}</span>
        </div>
      </div>

      <div className="s4v-narration">
        <span className="s4v-narration-label">why it matters</span>
        <span className="s4v-narration-body">
          The secret never leaves the client — only the signature crosses the wire. The server recomputes the
          same canonical request, scope, and signing key, then checks the signature matches.
          {tampered
            ? ' You changed one byte of the path, and the signature avalanched to a completely different value — the server rejects it as tampered.'
            : ' Flip a single byte of method, path, query, header, body, or timestamp and the signature avalanches, so tampering is caught.'}{' '}
          Because the scope pins the date, a captured request can&apos;t be replayed days later.
        </span>
      </div>
    </div>
  );
}
