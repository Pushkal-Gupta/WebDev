import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward } from 'lucide-react';
import './JwsSignatureViz.css';

const ALGS = [
  { id: 'HS256', label: 'HS256', kind: 'symmetric', keyNote: 'shared secret', signWith: 'shared secret', verifyWith: 'shared secret' },
  { id: 'RS256', label: 'RS256', kind: 'asymmetric', keyNote: 'private / public key', signWith: 'private key', verifyWith: 'public key' },
  { id: 'EdDSA', label: 'EdDSA', kind: 'asymmetric', keyNote: 'Ed25519 key pair', signWith: 'private key', verifyWith: 'public key' },
];

// Deterministic tiny "signature" derived from the signing input + alg, so a
// tampered payload visibly changes the bytes. Not real crypto — a stable digest.
function pseudoSig(input, alg) {
  let h = 2166136261 >>> 0;
  const s = `${alg}::${input}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const hex = '0123456789abcdef';
  let out = '';
  let x = h;
  for (let i = 0; i < 10; i += 1) {
    out += hex[x & 15];
    x = (x >>> 4) ^ Math.imul(x, 2654435761);
    x >>>= 0;
  }
  return out;
}

const HEADER_B64 = 'eyJhbGciOi…typ:JWT';
const PAYLOAD_CLEAN = 'eyJzdWIiOiJhbGljZS…exp';
const PAYLOAD_TAMPERED = 'eyJzdWIiOiJhZG1pbg…exp';

function buildFrames(alg, tamper) {
  const algObj = ALGS.find((a) => a.id === alg);
  const payloadB64 = tamper ? PAYLOAD_TAMPERED : PAYLOAD_CLEAN;
  const signingInput = `${HEADER_B64}.${PAYLOAD_CLEAN}`; // signature was made over the CLEAN payload
  const sigOriginal = pseudoSig(signingInput, alg);
  // On the wire the attacker keeps the original signature but ships the tampered payload.
  const verifyInput = `${HEADER_B64}.${payloadB64}`;
  const sigRecomputed = pseudoSig(verifyInput, alg);
  const match = sigRecomputed === sigOriginal;

  const base = (extra) => ({
    alg,
    kind: algObj.kind,
    tamper,
    headerB64: HEADER_B64,
    payloadB64,
    sigB64: sigOriginal,
    sigRecomputed: null,
    side: 'signer', // signer | wire | verifier
    match: null,
    verdict: '—',
    showSegments: ['header', 'payload'],
    note: '',
    ...extra,
  });

  const frames = [
    base({
      side: 'signer',
      showSegments: ['header'],
      note: `The header declares alg=${alg}. It and the payload are each base64url-encoded and joined by a dot. So far the token is just header.payload — no signature yet.`,
    }),
    base({
      side: 'signer',
      showSegments: ['header', 'payload'],
      note: tamper
        ? `The genuine signer encodes the ORIGINAL payload (sub:"alice"). The signature it is about to compute covers exactly header.payload of this clean token.`
        : `Header and payload are now both present. The signature will cover exactly the string header_b64 + "." + payload_b64 — nothing else.`,
    }),
    base({
      side: 'signer',
      showSegments: ['header', 'payload', 'signature'],
      sigB64: sigOriginal,
      note: algObj.kind === 'symmetric'
        ? `Sign: signature = HMAC-SHA256(${algObj.signWith}, header.payload). The same secret will be needed to verify. The signature becomes the 3rd segment.`
        : `Sign: signature = ${alg}-sign(${algObj.signWith}, hash(header.payload)). Only the private key can produce it; the public key will verify it. Appended as the 3rd segment.`,
    }),
    base({
      side: 'wire',
      showSegments: ['header', 'payload', 'signature'],
      sigB64: sigOriginal,
      note: tamper
        ? `In transit an attacker flips the payload to sub:"admin" but CANNOT recompute a matching signature without the ${algObj.signWith}. They forward the old signature and hope the verifier does not check.`
        : `The full token header.payload.signature travels to the verifier over the network. Anyone can read the payload — it is signed, not encrypted — but they cannot alter it undetected.`,
    }),
    base({
      side: 'verifier',
      showSegments: ['header', 'payload', 'signature'],
      sigB64: sigOriginal,
      sigRecomputed,
      match,
      note: algObj.kind === 'symmetric'
        ? `Verify: the verifier recomputes HMAC-SHA256(${algObj.verifyWith}, header.payload) over the token it received and compares it to the 3rd segment.`
        : `Verify: the verifier checks the signature against header.payload using the ${algObj.verifyWith} — pinned to ${alg}, never trusting the token's own alg field.`,
    }),
    base({
      side: 'verifier',
      showSegments: ['header', 'payload', 'signature'],
      sigB64: sigOriginal,
      sigRecomputed,
      match,
      verdict: match ? 'VALID' : 'TAMPERED',
      note: match
        ? `Recomputed signature equals the token's signature → VALID. The verifier now trusts the claims and goes on to check exp / aud / iss.`
        : `Recomputed signature does NOT equal the token's signature → TAMPERED. The flipped payload changed the signing input, so the old signature no longer matches. The token is rejected.`,
    }),
  ];

  return frames;
}

const RUN_DELAY_MS = 1300;

export default function JwsSignatureViz() {
  const [alg, setAlg] = useState('RS256');
  const [tamper, setTamper] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(alg, tamper), [alg, tamper]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchAlg = (id) => {
    if (id === alg) return;
    setIsRunning(false);
    setStep(0);
    setAlg(id);
  };

  const toggleTamper = () => {
    setIsRunning(false);
    setStep(0);
    setTamper((t) => !t);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const algObj = ALGS.find((a) => a.id === alg);

  // SVG geometry
  const W = 940;
  const H = 440;

  // token segment blocks (the JWT string is canonically header.payload.signature)
  const segY = 70;
  const segH = 64;
  const segGap = 14;
  const segX = 60;
  const segW = (W - 2 * segX - 2 * segGap) / 3;
  const segments = [
    { id: 'header', label: 'header', hue: 'var(--hue-sky)', value: current.headerB64 },
    { id: 'payload', label: 'payload', hue: 'var(--hue-violet)', value: current.payloadB64 },
    { id: 'signature', label: 'signature', hue: 'var(--hue-mint)', value: current.sigB64 },
  ];

  // sign -> verify vertical pipeline
  const laneX = W / 2;
  const stepRows = [
    { id: 'signer', label: 'SIGNER', sub: `sign with ${algObj.signWith}`, y: 210 },
    { id: 'wire', label: 'NETWORK', sub: 'token.in.transit', y: 285 },
    { id: 'verifier', label: 'VERIFIER', sub: `verify with ${algObj.verifyWith}`, y: 360 },
  ];
  const rowIdx = stepRows.findIndex((r) => r.id === current.side);

  return (
    <div className="jwv">
      <div className="jwv-head">
        <h3 className="jwv-title">JWS — signing and verifying a JWT</h3>
        <p className="jwv-sub">
          Build a token as header.payload.signature, sign it, send it, and verify it. Flip the tamper toggle to
          edit the payload after signing and watch the signature check fall to TAMPERED.
        </p>
      </div>

      <div className="jwv-controls">
        <div className="jwv-modes" role="tablist" aria-label="Signing algorithm">
          {ALGS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`jwv-mode ${alg === a.id ? 'is-on' : ''}`}
              onClick={() => switchAlg(a.id)}
              aria-pressed={alg === a.id}
            >
              {a.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`jwv-tamper ${tamper ? 'is-on' : ''}`}
          onClick={toggleTamper}
          aria-pressed={tamper}
        >
          {tamper ? 'TAMPERED PAYLOAD' : 'TAMPER PAYLOAD'}
        </button>

        <label className="jwv-speed">
          <span className="jwv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="jwv-speed-range"
            aria-label="Playback speed"
          />
          <span className="jwv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="jwv-spacer" aria-hidden="true" />

        <div className="jwv-buttons">
          <button
            type="button"
            className="jwv-btn jwv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="jwv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="jwv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="jwv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="jwv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="jwv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="jwv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="jwv-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="jwv-arrowhead" />
            </marker>
          </defs>

          <text className="jwv-stage-label" x={segX} y={40}>JWT = header . payload . signature</text>

          {/* token segments (data layout left-to-right is fine — it's the wire format) */}
          {segments.map((seg, si) => {
            const x = segX + si * (segW + segGap);
            const shown = current.showSegments.includes(seg.id);
            const isTamperedSeg = seg.id === 'payload' && current.tamper;
            const isSigMismatch = seg.id === 'signature' && current.match === false;
            return (
              <g key={seg.id} className={`jwv-seg-g ${shown ? 'is-shown' : 'is-pending'}`}>
                <rect
                  className={`jwv-seg ${isTamperedSeg ? 'is-tampered' : ''} ${isSigMismatch ? 'is-mismatch' : ''}`}
                  x={x}
                  y={segY}
                  width={segW}
                  height={segH}
                  rx={8}
                  style={shown && !isTamperedSeg && !isSigMismatch ? { stroke: seg.hue } : undefined}
                />
                <rect x={x} y={segY} width={5} height={segH} rx={2.5} fill={isTamperedSeg ? 'var(--warning)' : isSigMismatch ? 'var(--hard)' : seg.hue} opacity={shown ? 1 : 0.3} />
                <text className="jwv-seg-label" x={x + 14} y={segY + 20}>{seg.label}</text>
                <text className="jwv-seg-val" x={x + 14} y={segY + 42}>
                  {shown ? seg.value : '…'}
                </text>
                {isTamperedSeg && (
                  <text className="jwv-seg-flag" x={x + segW - 10} y={segY + 20} textAnchor="end">edited</text>
                )}
              </g>
            );
          })}

          {/* dots between segments */}
          <text className="jwv-dot" x={segX + segW + segGap / 2} y={segY + segH / 2 + 6} textAnchor="middle">.</text>
          <text className="jwv-dot" x={segX + 2 * segW + 1.5 * segGap} y={segY + segH / 2 + 6} textAnchor="middle">.</text>

          {/* vertical sign -> verify pipeline (top-to-bottom) */}
          {stepRows.map((r, ri) => {
            const active = current.side === r.id;
            const passed = ri < rowIdx;
            return (
              <g key={r.id}>
                {ri > 0 && (
                  <line
                    className={`jwv-flow ${ri <= rowIdx ? 'is-on' : ''}`}
                    x1={laneX}
                    y1={stepRows[ri - 1].y + 26}
                    x2={laneX}
                    y2={r.y - 26}
                    markerEnd="url(#jwv-arrow)"
                  />
                )}
                <rect
                  className={`jwv-node ${active ? 'is-active' : ''} ${passed ? 'is-passed' : ''}`}
                  x={laneX - 150}
                  y={r.y - 26}
                  width={300}
                  height={52}
                  rx={9}
                />
                <text className="jwv-node-label" x={laneX - 134} y={r.y - 6}>{r.label}</text>
                <text className="jwv-node-sub" x={laneX - 134} y={r.y + 14}>{r.sub}</text>
              </g>
            );
          })}

          {/* signature compare badge at the verifier */}
          {current.sigRecomputed != null && (
            <g>
              <text className="jwv-cmp-label" x={laneX + 60} y={stepRows[2].y - 6} textAnchor="start">recomputed</text>
              <text
                className={`jwv-cmp-val ${current.match ? 'is-match' : 'is-mismatch'}`}
                x={laneX + 60}
                y={stepRows[2].y + 14}
                textAnchor="start"
              >
                {current.sigRecomputed} {current.match ? '== match' : '!= mismatch'}
              </text>
            </g>
          )}

          {/* verdict pill */}
          {current.verdict !== '—' && (
            <g>
              <rect
                className={`jwv-verdict ${current.verdict === 'VALID' ? 'is-valid' : 'is-bad'}`}
                x={laneX - 80}
                y={H - 36}
                width={160}
                height={28}
                rx={14}
              />
              <text className="jwv-verdict-text" x={laneX} y={H - 17} textAnchor="middle">
                {current.verdict}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="jwv-metrics">
        <div className="jwv-metric">
          <span className="jwv-metric-label">alg</span>
          <span className="jwv-metric-value">{alg}</span>
        </div>
        <div className="jwv-metric">
          <span className="jwv-metric-label">key type</span>
          <span className="jwv-metric-value">{algObj.kind}</span>
        </div>
        <div className="jwv-metric">
          <span className="jwv-metric-label">signature match</span>
          <span className={`jwv-metric-value ${current.match === true ? 'is-good' : current.match === false ? 'is-bad' : ''}`}>
            {current.match == null ? '—' : current.match ? 'yes' : 'no'}
          </span>
        </div>
        <div className="jwv-metric">
          <span className="jwv-metric-label">verdict</span>
          <span className={`jwv-metric-value ${current.verdict === 'VALID' ? 'is-good' : current.verdict === 'TAMPERED' ? 'is-bad' : ''}`}>
            {current.verdict}
          </span>
        </div>
      </div>

      <div className="jwv-narration">
        <span className="jwv-narration-label">trace</span>
        <span className="jwv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
