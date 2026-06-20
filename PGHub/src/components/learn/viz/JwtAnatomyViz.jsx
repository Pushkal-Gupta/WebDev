import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck,
  ShieldAlert, Clock, KeyRound, FileText, Hash, ScissorsLineDashed,
} from 'lucide-react';
import './JwtAnatomyViz.css';

// A JWT decoded into three Base64URL parts: header.payload.signature.
// The header names the algorithm, the payload carries claims (sub, name, iat,
// exp), and the signature is HMAC-SHA256 over base64url(header).base64url(payload)
// keyed by a secret. Edit a claim and the payload's base64 changes, so the
// recomputed signature no longer matches the token the server received -> the
// verifier flags it as TAMPERED. Push exp into the past and a valid signature
// still fails on the expiry check. The verify flow steps through split ->
// decode -> recompute HMAC -> compare -> check exp -> final verdict.

const SECRET = 'pgcode-shared-secret';
const NOW = 1_700_000_000;                 // fixed "now" so the demo is deterministic
const FUTURE_EXP = NOW + 3600;             // valid: 1h ahead
const PAST_EXP = NOW - 3600;               // expired: 1h ago
const ORIGINAL_SUB = 'user-42';
const ORIGINAL_NAME = 'Ada';

// Base64URL over the UTF-8 bytes of an ASCII/JSON string. Deterministic,
// no crypto lib. Encodes manually so we never depend on btoa's unicode quirks.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function base64url(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : null;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : null;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 0x03) << 4) | (b1 == null ? 0 : b1 >> 4)];
    out += b1 == null ? '' : B64_CHARS[((b1 & 0x0f) << 2) | (b2 == null ? 0 : b2 >> 6)];
    out += b2 == null ? '' : B64_CHARS[b2 & 0x3f];
  }
  return out;
}

// Deterministic 32-bit FNV-1a hash. Stands in for HMAC-SHA256 — same key
// property: any change to the signing input or the secret changes the output,
// and it never uses Math.random.
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const HEX = '0123456789abcdef';
function toHex32(n) {
  let s = '';
  let v = n >>> 0;
  for (let i = 0; i < 8; i += 1) {
    s = HEX[v & 0xf] + s;
    v >>>= 4;
  }
  return s;
}

// Fake-but-stable signature: spread four FNV passes over the signing input +
// secret into a 32-char hex string that looks like a truncated HMAC digest.
function signature(signingInput, secret) {
  const seed = `${secret}::${signingInput}`;
  const a = fnv1a(seed);
  const b = fnv1a(`${seed}:1:${a}`);
  const c = fnv1a(`${seed}:2:${b}`);
  const d = fnv1a(`${seed}:3:${c}`);
  return toHex32(a) + toHex32(b) + toHex32(c) + toHex32(d);
}

const HEADER_OBJ = { alg: 'HS256', typ: 'JWT' };
function headerJson() {
  return JSON.stringify(HEADER_OBJ);
}
function payloadJson(sub, name, exp) {
  return JSON.stringify({ sub, name, iat: NOW, exp });
}

function buildToken(sub, name, exp) {
  const h = base64url(headerJson());
  const p = base64url(payloadJson(sub, name, exp));
  const signingInput = `${h}.${p}`;
  const sig = signature(signingInput, SECRET);
  return { h, p, sig, signingInput };
}

// The token the server originally issued — its signature is the trusted baseline.
const ISSUED = buildToken(ORIGINAL_SUB, ORIGINAL_NAME, FUTURE_EXP);

const STEP_META = [
  { key: 'idle', label: 'token' },
  { key: 'split', label: 'split' },
  { key: 'decode', label: 'decode' },
  { key: 'recompute', label: 'recompute' },
  { key: 'compare', label: 'compare sig' },
  { key: 'expiry', label: 'check exp' },
  { key: 'verdict', label: 'verdict' },
];
const TOTAL_STEPS = STEP_META.length;
const RUN_DELAY_MS = 1500;

const STEP_NOTE = {
  idle: 'A JWT is three Base64URL strings joined by dots: header.payload.signature. Edit the sub or name claim to forge a new payload, or move exp into the past, then step the verifier through to see what it catches.',
  split: 'The verifier splits the compact token on its two dots into exactly three parts. No decoding yet — just header, payload, and the signature the client presented.',
  decode: 'Base64URL-decode the header and payload back into JSON. The header names the algorithm (HS256); the payload carries the claims. Anyone can read this — a JWT is signed, not encrypted.',
  recompute: 'Recompute the signature locally: HMAC-SHA256( base64url(header) + "." + base64url(payload), secret ). The verifier holds the same secret, so it can re-derive what the signature must be for this exact payload.',
  compare: 'Compare the recomputed signature to the one on the token. If a single byte of the payload changed, the recomputed value diverges and the seal is broken.',
  expiry: 'Even a perfectly signed token can be stale. Compare exp against now. A future exp passes; a past exp is rejected regardless of the signature.',
  verdict: 'Final verdict. Valid needs both a matching signature and an unexpired token. A mismatched signature means tampered; a good signature with a past exp means expired.',
};

export default function JwtAnatomyViz() {
  const [sub, setSub] = useState(ORIGINAL_SUB);
  const [name, setName] = useState(ORIGINAL_NAME);
  const [expired, setExpired] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const exp = expired ? PAST_EXP : FUTURE_EXP;

  // The token as it stands now, given the (possibly edited) claims. Its parts
  // are recomputed live; the signature is what the verifier WOULD derive.
  const current = useMemo(() => buildToken(sub, name, exp), [sub, name, exp]);

  // The signature physically sitting on the token. If the payload was tampered,
  // the presented signature is still the originally issued one (the attacker
  // cannot recompute it without the secret), so it no longer matches.
  const tampered = sub !== ORIGINAL_SUB || name !== ORIGINAL_NAME;
  const presentedSig = tampered ? ISSUED.sig : current.sig;
  const sigMatch = presentedSig === current.sig;
  const notExpired = exp > NOW;
  const verdict = !sigMatch ? 'tampered' : !notExpired ? 'expired' : 'valid';

  const isRunning = isRunningRaw && step < TOTAL_STEPS - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(0.5, speed));

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const stepKey = STEP_META[Math.min(step, TOTAL_STEPS - 1)].key;
  const reached = (k) => step >= STEP_META.findIndex((m) => m.key === k);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const restoreClaims = () => {
    setIsRunning(false);
    setStep(0);
    setSub(ORIGINAL_SUB);
    setName(ORIGINAL_NAME);
  };

  const editClaims = (nextSub, nextName) => {
    setIsRunning(false);
    setStep(0);
    setSub(nextSub);
    setName(nextName);
  };

  const toggleExpired = () => {
    setIsRunning(false);
    setStep(0);
    setExpired((v) => !v);
  };

  const playLabel = isRunningRaw && step < TOTAL_STEPS - 1
    ? 'Pause'
    : (step >= TOTAL_STEPS - 1 ? 'Replay' : 'Verify');

  // SVG geometry — three stacked rounded panels for the three token parts.
  const W = 940;
  const H = 232;
  const padX = 22;
  const panelW = W - padX * 2;
  const panelH = 54;
  const gap = 14;
  const panelY = (i) => 18 + i * (panelH + gap);

  const decoded = reached('decode');
  const recomputed = reached('recompute');
  const compared = reached('compare');

  // Highlight which panel the verifier is touching at this step.
  const activePanel = stepKey === 'decode'
    ? -1                                    // header + payload both light up
    : stepKey === 'recompute' || stepKey === 'compare' || stepKey === 'verdict'
      ? 2
      : stepKey === 'expiry' ? 1 : null;

  const partStyle = (klass) => `jwv-tok-part ${klass}`;

  const verdictTone = verdict === 'valid' ? 'ok' : verdict === 'expired' ? 'warn' : 'bad';

  return (
    <div className="jwv">
      <div className="jwv-head">
        <h3 className="jwv-title">JWT anatomy — three parts, one seal, tamper-evident</h3>
        <p className="jwv-sub">
          header.payload.signature, Base64URL-encoded and dot-joined. Edit a claim or expire the token,
          then step the verifier through split, decode, recompute, and compare to see exactly what breaks.
        </p>
      </div>

      <div className="jwv-controls">
        <div className="jwv-claim-edit" role="group" aria-label="Edit payload claims">
          <span className="jwv-input-label">sub</span>
          <input
            type="text"
            className="jwv-text"
            value={sub}
            onChange={(e) => editClaims(e.target.value, name)}
            spellCheck={false}
            aria-label="Edit the sub claim"
          />
          <span className="jwv-input-label">name</span>
          <input
            type="text"
            className="jwv-text"
            value={name}
            onChange={(e) => editClaims(sub, e.target.value)}
            spellCheck={false}
            aria-label="Edit the name claim"
          />
        </div>

        <button
          type="button"
          className="jwv-btn"
          onClick={() => editClaims('admin', 'Mallory')}
          title="Forge the claims to escalate to admin — the payload changes, so the signature will not match"
        >
          <ShieldAlert size={14} /> Forge admin
        </button>
        <button
          type="button"
          className="jwv-btn"
          onClick={restoreClaims}
          disabled={!tampered}
          title="Restore the original claims so the signature matches again"
        >
          <RotateCcw size={14} /> Restore
        </button>

        <button
          type="button"
          className={`jwv-toggle ${expired ? 'is-on' : ''}`}
          onClick={toggleExpired}
          aria-pressed={expired}
          title="Set exp in the past to expire the token"
        >
          <Clock size={14} /> exp {expired ? 'past' : 'future'}
        </button>

        <span className="jwv-spacer" aria-hidden="true" />

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

        <div className="jwv-buttons">
          <button
            type="button"
            className="jwv-btn jwv-btn-primary"
            onClick={() => {
              if (step >= TOTAL_STEPS - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < TOTAL_STEPS - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="jwv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="jwv-btn"
            onClick={() => setStep(TOTAL_STEPS - 1)}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="jwv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="jwv-stepcount">
          step <strong>{step + 1}</strong> / {TOTAL_STEPS}
        </div>
      </div>

      {/* compact token strip — three colored parts joined by dots */}
      <div className="jwv-token">
        <span className="jwv-token-label">eyJ token</span>
        <span className="jwv-token-str">
          <span className={partStyle('is-header')}>{current.h}</span>
          <span className="jwv-tok-dot">.</span>
          <span className={partStyle('is-payload')}>{current.p}</span>
          <span className="jwv-tok-dot">.</span>
          <span className={partStyle('is-sig')}>{presentedSig}</span>
        </span>
      </div>

      <div className="jwv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="jwv-svg" preserveAspectRatio="xMidYMid meet">
          {/* header panel */}
          <g>
            <rect
              className={`jwv-panel is-header ${activePanel === -1 ? 'is-active' : ''}`}
              x={padX} y={panelY(0)} width={panelW} height={panelH} rx={8}
            />
            <text className="jwv-panel-tag is-header" x={padX + 12} y={panelY(0) + 17}>HEADER · alg + typ</text>
            <text className="jwv-panel-body" x={padX + 12} y={panelY(0) + 38}>
              {decoded ? headerJson() : `${current.h}  (base64url)`}
            </text>
          </g>

          {/* payload panel */}
          <g>
            <rect
              className={`jwv-panel is-payload ${activePanel === -1 || activePanel === 1 ? 'is-active' : ''}`}
              x={padX} y={panelY(1)} width={panelW} height={panelH} rx={8}
            />
            <text className="jwv-panel-tag is-payload" x={padX + 12} y={panelY(1) + 17}>
              PAYLOAD · claims{tampered ? ' (edited)' : ''}
            </text>
            <text className="jwv-panel-body" x={padX + 12} y={panelY(1) + 38}>
              {decoded ? payloadJson(sub, name, exp) : `${current.p}  (base64url)`}
            </text>
          </g>

          {/* signature panel */}
          <g>
            <rect
              className={`jwv-panel is-sig ${activePanel === 2 ? 'is-active' : ''} ${compared ? (sigMatch ? 'is-ok' : 'is-bad') : ''}`}
              x={padX} y={panelY(2)} width={panelW} height={panelH} rx={8}
            />
            <text className="jwv-panel-tag is-sig" x={padX + 12} y={panelY(2) + 17}>
              SIGNATURE · HMAC-SHA256(b64(header).b64(payload), secret)
            </text>
            <text className="jwv-panel-body" x={padX + 12} y={panelY(2) + 38}>
              {recomputed
                ? `presented ${presentedSig.slice(0, 16)}…  vs  recomputed ${current.sig.slice(0, 16)}…`
                : presentedSig}
            </text>
            {compared && (
              <text className={`jwv-panel-seal ${sigMatch ? 'is-ok' : 'is-bad'}`} x={W - padX - 12} y={panelY(2) + 28} textAnchor="end">
                {sigMatch ? 'seal intact' : 'seal broken'}
              </text>
            )}
          </g>
        </svg>
      </div>

      <div className="jwv-readouts">
        <div className="jwv-metric">
          <span className="jwv-metric-label">signature match</span>
          <span className={`jwv-metric-value ${compared ? (sigMatch ? 'is-ok' : 'is-bad') : ''}`}>
            {compared ? (sigMatch ? 'yes — seal intact' : 'no — recomputed differs') : 'not checked'}
          </span>
        </div>
        <div className="jwv-metric">
          <span className="jwv-metric-label">expiry status</span>
          <span className={`jwv-metric-value ${reached('expiry') ? (notExpired ? 'is-ok' : 'is-warn') : ''}`}>
            {reached('expiry')
              ? (notExpired ? `valid · exp = now + 3600` : 'expired · exp = now − 3600')
              : `exp ${expired ? 'in the past' : 'in the future'}`}
          </span>
        </div>
        <div className="jwv-metric">
          <span className="jwv-metric-label">overall verdict</span>
          <span className={`jwv-metric-value is-${verdictTone} ${reached('verdict') ? '' : 'is-pending'}`}>
            {reached('verdict')
              ? (verdict === 'valid' ? 'VALID' : verdict === 'expired' ? 'EXPIRED' : 'TAMPERED')
              : 'pending'}
          </span>
        </div>
        <div className="jwv-metric jwv-metric-dim">
          <span className="jwv-metric-label">decoded claims</span>
          <span className="jwv-metric-value">{`sub=${sub} · name=${name}`}</span>
        </div>
      </div>

      <div className={`jwv-narration is-${verdictTone === 'ok' && reached('verdict') ? 'ok' : verdictTone === 'bad' && reached('verdict') ? 'bad' : verdictTone === 'warn' && reached('verdict') ? 'warn' : 'accent'}`}>
        <span className="jwv-narration-label">{STEP_META[Math.min(step, TOTAL_STEPS - 1)].label}</span>
        <span className="jwv-narration-body">{STEP_NOTE[stepKey]}</span>
      </div>

      <div className="jwv-legend">
        <span className="jwv-legend-item"><FileText size={13} className="jwv-ic is-header" /> header — algorithm + type</span>
        <span className="jwv-legend-item"><FileText size={13} className="jwv-ic is-payload" /> payload — readable claims, not secret</span>
        <span className="jwv-legend-item"><Hash size={13} className="jwv-ic is-sig" /> signature — HMAC over header.payload</span>
        <span className="jwv-legend-item"><ScissorsLineDashed size={13} className="jwv-ic is-dim" /> split on the two dots first</span>
        <span className="jwv-legend-item"><ShieldCheck size={13} className="jwv-ic is-ok" /> match + unexpired = valid</span>
        <span className="jwv-legend-item"><KeyRound size={13} className="jwv-ic is-warn" /> the secret never leaves the server</span>
      </div>
    </div>
  );
}
