import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Lock, Unlock } from 'lucide-react';
import './TlsHandshakeViz.css';

// Step a TLS 1.2-style handshake: the asymmetric (slow, public-key) phase
// negotiates parameters and a shared secret, then everything switches to a
// fast symmetric session key. Each frame tracks what is encrypted vs plaintext.
function buildFrames() {
  const frames = [];

  const snap = (extra) => ({
    dir: null, // 'c2s' | 's2c'
    title: '',
    payload: '',
    crypto: 'plaintext', // 'plaintext' | 'asymmetric' | 'symmetric'
    haveSecret: false,
    secured: false,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: 'TCP is already connected. TLS now layers on top: the goal is for client and server to agree on one shared symmetric key without ever sending it in the clear. The handshake itself starts in plaintext.',
  }));

  frames.push(snap({
    dir: 'c2s',
    title: 'ClientHello',
    payload: 'TLS version · cipher suites · client random',
    crypto: 'plaintext',
    note: 'Client opens with ClientHello: the highest TLS version it supports, a list of cipher suites it can use, and a fresh client random. All plaintext — nothing secret yet.',
  }));

  frames.push(snap({
    dir: 's2c',
    title: 'ServerHello + Certificate',
    payload: 'chosen cipher · server random · X.509 cert (public key)',
    crypto: 'plaintext',
    note: 'Server replies with ServerHello (picks one cipher suite, sends a server random) and its certificate. The cert carries the server\'s public key and is signed by a CA the client can verify.',
  }));

  frames.push(snap({
    dir: 's2c',
    title: 'ServerHelloDone',
    payload: 'verify cert chain against trusted CAs',
    crypto: 'plaintext',
    note: 'Client validates the certificate chain up to a trusted root CA, checks the hostname and expiry. If the cert is bad, the handshake aborts here — this is what stops impostor servers.',
  }));

  frames.push(snap({
    dir: 'c2s',
    title: 'ClientKeyExchange',
    payload: 'pre-master secret ENCRYPTED with server public key',
    crypto: 'asymmetric',
    haveSecret: true,
    note: 'Client generates a pre-master secret and encrypts it with the server\'s PUBLIC key. Only the server\'s private key can decrypt it — so even an eavesdropper who saw every byte cannot recover the secret. This is the one expensive asymmetric operation.',
  }));

  frames.push(snap({
    title: 'Derive session keys',
    payload: 'master secret = PRF(pre-master, client random, server random)',
    crypto: 'symmetric',
    haveSecret: true,
    note: 'Both sides now mix the pre-master secret with both randoms through a key-derivation function to get the same master secret, and from it the symmetric session keys. Identical on both ends, never transmitted.',
  }));

  frames.push(snap({
    dir: 'c2s',
    title: 'ChangeCipherSpec + Finished',
    payload: 'ENCRYPTED with the new symmetric key',
    crypto: 'symmetric',
    haveSecret: true,
    note: 'Client signals "everything after this is encrypted" and sends a Finished message — a MAC over the whole handshake — under the new symmetric key. If anything was tampered with, the MAC won\'t match.',
  }));

  frames.push(snap({
    dir: 's2c',
    title: 'ChangeCipherSpec + Finished',
    payload: 'ENCRYPTED with the new symmetric key',
    crypto: 'symmetric',
    haveSecret: true,
    note: 'Server switches to the symmetric key too and sends its own encrypted Finished. Both Finished messages verify the handshake was not modified in transit.',
  }));

  frames.push(snap({
    title: 'Secure session established',
    payload: 'application data ENCRYPTED (AES) with the symmetric key',
    crypto: 'symmetric',
    haveSecret: true,
    secured: true,
    note: 'Handshake complete. Application data (HTTP requests/responses) now travels encrypted with the fast symmetric key. Asymmetric crypto was used once to bootstrap; the bulk traffic uses cheap symmetric encryption.',
  }));

  return frames;
}

const RUN_DELAY_MS = 1400;

export default function TlsHandshakeViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
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

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 360;
  const clientX = 150;
  const serverX = W - 150;
  const laneTop = 70;
  const laneBottom = H - 40;
  const arrowY = (laneTop + laneBottom) / 2;

  const showArrow = current.dir !== null;
  const isC2S = current.dir === 'c2s';
  const ax1 = isC2S ? clientX : serverX;
  const ax2 = isC2S ? serverX : clientX;

  const cryptoClass = current.crypto === 'asymmetric' ? 'is-asym'
    : current.crypto === 'symmetric' ? 'is-sym' : 'is-plain';

  const cryptoLabel = current.crypto === 'asymmetric' ? 'asymmetric (public-key)'
    : current.crypto === 'symmetric' ? 'symmetric (session key)' : 'plaintext';

  return (
    <div className="tlv">
      <div className="tlv-head">
        <h3 className="tlv-title">TLS handshake — bootstrapping a symmetric key with asymmetric crypto</h3>
        <p className="tlv-sub">
          Step from ClientHello through certificate, key exchange and Finished. Watch the channel start in the
          clear, use the server&apos;s public key once to ferry a secret, then switch every later message to a fast
          shared symmetric key.
        </p>
      </div>

      <div className="tlv-controls">
        <label className="tlv-speed">
          <span className="tlv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tlv-range"
            aria-label="Playback speed"
          />
          <span className="tlv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="tlv-spacer" aria-hidden="true" />

        <div className="tlv-buttons">
          <button
            type="button"
            className="tlv-btn tlv-btn-primary"
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
            className="tlv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="tlv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="tlv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="tlv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="tlv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tlv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tlv-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" className="tlv-arrowhead" />
            </marker>
          </defs>

          {/* peer headers */}
          <rect className="tlv-peer" x={clientX - 80} y={laneTop - 46} width={160} height={36} rx={8} />
          <text className="tlv-peer-label" x={clientX} y={laneTop - 23}>CLIENT</text>
          <rect className="tlv-peer" x={serverX - 80} y={laneTop - 46} width={160} height={36} rx={8} />
          <text className="tlv-peer-label" x={serverX} y={laneTop - 23}>SERVER</text>

          {/* lifelines */}
          <line className="tlv-lifeline" x1={clientX} y1={laneTop} x2={clientX} y2={laneBottom} />
          <line className="tlv-lifeline" x1={serverX} y1={laneTop} x2={serverX} y2={laneBottom} />

          {/* segment */}
          {showArrow ? (
            <g className={`tlv-seg ${cryptoClass}`}>
              <line
                className="tlv-seg-line"
                x1={ax1}
                y1={arrowY}
                x2={ax2}
                y2={arrowY}
                markerEnd="url(#tlv-arrow)"
              />
              <rect
                className="tlv-seg-box"
                x={(clientX + serverX) / 2 - 220}
                y={arrowY - 56}
                width={440}
                height={36}
                rx={8}
              />
              <text className="tlv-seg-title" x={(clientX + serverX) / 2} y={arrowY - 33}>
                {current.title}
              </text>
              <rect
                className="tlv-seg-pay"
                x={(clientX + serverX) / 2 - 230}
                y={arrowY + 14}
                width={460}
                height={32}
                rx={8}
              />
              <text className="tlv-seg-payload" x={(clientX + serverX) / 2} y={arrowY + 35}>
                {current.payload}
              </text>
            </g>
          ) : (
            <g>
              <rect
                className={`tlv-seg-box ${cryptoClass}`}
                x={(clientX + serverX) / 2 - 230}
                y={arrowY - 26}
                width={460}
                height={36}
                rx={8}
              />
              <text className="tlv-compute" x={(clientX + serverX) / 2} y={arrowY - 2}>
                {current.title || 'TCP connected — TLS not started'}
              </text>
              {current.payload && (
                <text className="tlv-compute-sub" x={(clientX + serverX) / 2} y={arrowY + 34}>
                  {current.payload}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="tlv-metrics">
        <div className="tlv-metric">
          <span className="tlv-metric-label">channel</span>
          <span className={`tlv-metric-value ${cryptoClass}`}>{cryptoLabel}</span>
        </div>
        <div className="tlv-metric">
          <span className="tlv-metric-label">shared secret</span>
          <span className={`tlv-metric-value ${current.haveSecret ? 'is-sym' : ''}`}>
            {current.haveSecret ? 'derived' : 'not yet'}
          </span>
        </div>
        <div className="tlv-metric">
          <span className="tlv-metric-label">session</span>
          <span className={`tlv-metric-value tlv-lockrow ${current.secured ? 'is-sym' : 'is-plain'}`}>
            {current.secured ? <Lock size={14} /> : <Unlock size={14} />}
            {current.secured ? 'secured' : 'open'}
          </span>
        </div>
        <div className="tlv-metric">
          <span className="tlv-metric-label">message</span>
          <span className="tlv-metric-value">{current.title || '—'}</span>
        </div>
      </div>

      <div className="tlv-narration">
        <span className="tlv-narration-label">trace</span>
        <span className="tlv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
