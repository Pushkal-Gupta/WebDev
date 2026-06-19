import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, KeyRound, Server, Wifi, CreditCard, RefreshCw } from 'lucide-react';
import './IdempotencyKeyViz.css';

// Idempotency keys: making retries safe.
//
// The reader is on a checkout page. The client POSTs "charge $20" to the
// payment server. The server applies the side-effect (charges the card),
// records it in a ledger, and replies 200. But the reply gets lost on the
// wire — a network hiccup — so the client never sees it and RETRIES.
//
// WITHOUT a key, the server has no way to tell the retry apart from a brand
// new charge: it charges the card a SECOND time -> $40, two ledger entries.
//
// WITH an Idempotency-Key header, the retry carries the SAME key. The server
// keeps a key -> cached-response store. On the first request it processes,
// stores the response under the key, and applies the charge. On the retry it
// finds the key already present and returns the CACHED original response
// WITHOUT applying the side-effect again -> charged exactly once, $20.
//
// We script one fixed scenario (charge $20, reply lost, one retry) and run it
// in both modes so the metrics row makes the contrast unmissable: $20 vs $40.

const CHARGE = 20;
const IDEM_KEY = 'idem_7f3a9c';

// Each frame is an immutable snapshot. Carried state:
//   hop        : which segment is hot — 'send' | 'wifi' | 'server' | 'reply'
//   side       : 'client' | 'net' | 'server' — for box highlight
//   store      : key -> response map on the server (only used with a key)
//   ledger     : list of applied charges [{ id, amount }]
//   sent       : count of requests the client put on the wire
//   processed  : count of requests that actually applied a side-effect
//   replyState : 'none' | 'lost' | 'ok' | 'cached'
function buildFrames(useKey) {
  const frames = [];
  const store = {};
  const ledger = [];
  let sent = 0;
  let processed = 0;

  const snap = (extra) => ({
    store: { ...store },
    ledger: ledger.map((e) => ({ ...e })),
    sent,
    processed,
    hop: null,
    side: null,
    replyState: 'none',
    activeKey: useKey ? IDEM_KEY : null,
    matched: false,
    phase: 'run',
    note: '',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: useKey
      ? `Checkout: the client will POST "charge $${CHARGE}" carrying an Idempotency-Key header (${IDEM_KEY}). The server keeps a key -> cached-response store so a duplicate retry can be detected and answered from cache without charging again.`
      : `Checkout: the client will POST "charge $${CHARGE}" with NO idempotency key. The server has no way to recognise a duplicate, so every request it receives looks like a fresh charge.`,
  }));

  // --- Attempt 1: client sends the original request ---
  sent += 1;
  frames.push(snap({
    hop: 'send', side: 'client', replyState: 'none',
    note: `Attempt 1. The client sends POST /charge { amount: $${CHARGE} }${useKey ? ` with header Idempotency-Key: ${IDEM_KEY}` : ' (no idempotency key)'}. The request travels across the network to the payment server.`,
  }));

  frames.push(snap({
    hop: 'wifi', side: 'net', replyState: 'none',
    note: 'The request crosses the network and reaches the server intact. So far this is a perfectly ordinary, successful call.',
  }));

  // server processes the original — always a real side-effect on attempt 1
  processed += 1;
  ledger.push({ id: ledger.length + 1, amount: CHARGE });
  const firstResponse = `200 OK · charge #1 · $${CHARGE}`;
  if (useKey) store[IDEM_KEY] = firstResponse;
  frames.push(snap({
    hop: 'server', side: 'server', replyState: 'none',
    note: useKey
      ? `Server sees key ${IDEM_KEY} for the first time — not in the store. It PROCESSES the charge: card billed $${CHARGE}, one ledger entry, then it saves the response "${firstResponse}" under the key for next time.`
      : `Server processes the charge: card billed $${CHARGE}, one ledger entry written. With no key it simply does the work and replies — it keeps no memory of this request.`,
  }));

  // the reply is lost on the wire — the hiccup that triggers a retry
  frames.push(snap({
    hop: 'reply', side: 'net', replyState: 'lost',
    note: 'The 200 OK reply is dropped on the way back — a timeout, a dropped connection, a flaky proxy. The charge already happened on the server, but the client never learns that. From the client\'s side this looks like a failure.',
  }));

  // --- Attempt 2: the retry ---
  sent += 1;
  frames.push(snap({
    hop: 'send', side: 'client', replyState: 'lost',
    note: useKey
      ? `Client timed out, so it RETRIES — sending the exact same request with the SAME Idempotency-Key: ${IDEM_KEY}. Reusing the key is what makes the retry safe.`
      : 'Client timed out, so it RETRIES the charge. It is a brand-new request as far as the wire is concerned — nothing marks it as a duplicate.',
  }));

  frames.push(snap({
    hop: 'wifi', side: 'net', replyState: 'lost',
    note: 'The retry crosses the network and reaches the server — this time the round trip will complete.',
  }));

  if (useKey) {
    // server finds the key already present -> return cached response, no side-effect
    const cached = store[IDEM_KEY];
    frames.push(snap({
      hop: 'server', side: 'server', replyState: 'cached', matched: true,
      note: `Server looks up key ${IDEM_KEY} and finds it ALREADY processed. It skips the charge entirely and returns the CACHED response "${cached}". No second card charge, no second ledger entry — the side-effect ran exactly once.`,
    }));
    frames.push(snap({
      hop: 'reply', side: 'net', replyState: 'cached', matched: true,
      note: 'The cached 200 OK reaches the client this time. The client is happy, the customer was charged once. The retry was a no-op on the money — exactly the guarantee an idempotency key buys you.',
    }));
    frames.push(snap({
      phase: 'done', side: 'server', replyState: 'cached', matched: true,
      note: `Done. 2 requests were sent but only 1 was processed. Total charged: $${CHARGE}. Duplicate charges: 0. The key turned an unsafe retry into a safe one.`,
    }));
  } else {
    // no key -> server cannot tell it is a duplicate, charges again
    processed += 1;
    ledger.push({ id: ledger.length + 1, amount: CHARGE });
    frames.push(snap({
      hop: 'server', side: 'server', replyState: 'ok',
      note: `Server has no key to check, so the retry looks like a fresh charge. It PROCESSES it AGAIN: card billed a second $${CHARGE}, a second ledger entry. The customer just paid twice for one purchase.`,
    }));
    frames.push(snap({
      hop: 'reply', side: 'net', replyState: 'ok',
      note: 'The second reply makes it back to the client this time. The client thinks all is well — but the ledger now holds two charges. This double-charge is the classic bug idempotency keys exist to prevent.',
    }));
    frames.push(snap({
      phase: 'done', side: 'server', replyState: 'ok',
      note: `Done. 2 requests sent and both were processed. Total charged: $${CHARGE * 2}. Duplicate charges: 1. Without a key, a single lost reply doubled the bill.`,
    }));
  }

  return frames;
}

const RUN_DELAY_MS = 1300;

export default function IdempotencyKeyViz() {
  const [useKey, setUseKey] = useState(true);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(useKey), [useKey]);
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

  const toggleKey = (next) => {
    setIsRunning(false);
    setUseKey(next);
    setStep(0);
  };

  // SVG geometry — client (left), network (center), server (right) + ledger.
  const W = 940;
  const H = 440;

  const cliX = 28; const cliY = 70; const cliW = 220; const cliH = 150;
  const srvX = W - 28 - 300; const srvY = 70; const srvW = 300; const srvH = 300;
  const netX = cliX + cliW; const netW = srvX - netX;
  const laneY = cliY + 56; // request lane y
  const replyY = cliY + 110; // reply lane y

  const ledgerX = cliX; const ledgerY = cliY + cliH + 26; const ledgerW = cliW; const ledgerH = 150;

  const hop = current.hop;
  const reqHot = hop === 'send' || hop === 'wifi';
  const replyHot = hop === 'reply';
  const replyLost = current.replyState === 'lost' && replyHot;

  const storeEntries = Object.entries(current.store);
  const totalCharged = current.ledger.reduce((a, e) => a + e.amount, 0);
  const duplicateCharges = Math.max(0, current.processed - 1);

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="ikv">
      <div className="ikv-head">
        <h3 className="ikv-title">Idempotency keys — making a retry safe</h3>
        <p className="ikv-sub">
          A charge request, a lost reply, and one retry. With an Idempotency-Key the server answers the duplicate
          from cache and bills once; without one it bills twice. Watch the ledger.
        </p>
      </div>

      <div className="ikv-controls">
        <div className="ikv-toggle" role="group" aria-label="Idempotency mode">
          <button
            type="button"
            className={`ikv-toggle-btn ${useKey ? 'is-on' : ''}`}
            onClick={() => toggleKey(true)}
          >
            <KeyRound size={13} /> with key
          </button>
          <button
            type="button"
            className={`ikv-toggle-btn ${!useKey ? 'is-on is-danger' : ''}`}
            onClick={() => toggleKey(false)}
          >
            <RefreshCw size={13} /> no key
          </button>
        </div>

        <label className="ikv-speed">
          <span className="ikv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ikv-speed-range"
            aria-label="Playback speed"
          />
          <span className="ikv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="ikv-spacer" aria-hidden="true" />

        <div className="ikv-buttons">
          <button
            type="button"
            className="ikv-btn ikv-btn-primary"
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
            className="ikv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="ikv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ikv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ikv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="ikv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ikv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ikv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="ikv-arrowhead" />
            </marker>
            <marker id="ikv-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="ikv-arrowhead-hot" />
            </marker>
          </defs>

          {/* request lane: client -> server */}
          <line
            className={`ikv-wire ${reqHot ? 'is-hot' : ''}`}
            x1={netX + 6} y1={laneY} x2={srvX - 6} y2={laneY}
            markerEnd={reqHot ? 'url(#ikv-arrow-hot)' : 'url(#ikv-arrow)'}
          />
          <text className={`ikv-wire-label ${reqHot ? 'is-hot' : ''}`} x={netX + netW / 2} y={laneY - 10}>
            POST /charge {current.activeKey ? `· key ${current.activeKey}` : '· no key'}
          </text>

          {/* reply lane: server -> client */}
          <line
            className={`ikv-wire ${replyHot && !replyLost ? 'is-hot' : ''} ${replyLost ? 'is-lost' : ''}`}
            x1={srvX - 6} y1={replyY} x2={netX + 6} y2={replyY}
            markerEnd={replyHot && !replyLost ? 'url(#ikv-arrow-hot)' : 'url(#ikv-arrow)'}
          />
          <text className={`ikv-wire-label ${replyHot ? 'is-hot' : ''} ${replyLost ? 'is-lost' : ''}`} x={netX + netW / 2} y={replyY + 22}>
            {current.replyState === 'lost' ? '200 OK — DROPPED' : current.replyState === 'cached' ? '200 OK (cached)' : current.replyState === 'ok' ? '200 OK' : '200 OK'}
          </text>

          {/* network / wifi marker */}
          <g transform={`translate(${netX + netW / 2 - 9}, ${cliY - 10})`}>
            <Wifi width={18} height={18} className={`ikv-ic ${hop === 'wifi' || replyLost ? 'is-hot' : ''}`} />
          </g>

          {/* CLIENT box */}
          <g className={`ikv-node ${current.side === 'client' ? 'is-active' : ''}`}>
            <rect className="ikv-box ikv-box-client" x={cliX} y={cliY} width={cliW} height={cliH} rx={11} />
            <g transform={`translate(${cliX + 14}, ${cliY + 13})`}><CreditCard width={17} height={17} className="ikv-ic" /></g>
            <text className="ikv-box-title" x={cliX + 40} y={cliY + 27}>client</text>
            <text className="ikv-box-tag" x={cliX + cliW - 12} y={cliY + 27}>checkout</text>
            <text className="ikv-cli-line" x={cliX + 16} y={cliY + 64}>charge ${CHARGE}</text>
            <text className="ikv-cli-sub" x={cliX + 16} y={cliY + 88}>
              {current.sent >= 2 ? 'retry sent (same request)' : current.sent === 1 ? 'request sent' : 'ready to send'}
            </text>
            <text className="ikv-cli-key" x={cliX + 16} y={cliY + 116}>
              {current.activeKey ? `key: ${current.activeKey}` : 'key: none'}
            </text>
          </g>

          {/* SERVER box */}
          <g className={`ikv-node ${current.side === 'server' ? 'is-active' : ''}`}>
            <rect className="ikv-box ikv-box-server" x={srvX} y={srvY} width={srvW} height={srvH} rx={11} />
            <g transform={`translate(${srvX + 14}, ${srvY + 13})`}><Server width={17} height={17} className="ikv-ic" /></g>
            <text className="ikv-box-title" x={srvX + 40} y={srvY + 27}>payment server</text>
            <text className="ikv-box-tag" x={srvX + srvW - 12} y={srvY + 27}>processes charge</text>

            {/* key -> response store */}
            <text className="ikv-store-head" x={srvX + 16} y={srvY + 58}>idempotency store · key &rarr; response</text>
            <rect className="ikv-store-frame" x={srvX + 14} y={srvY + 68} width={srvW - 28} height={70} rx={7} />
            {!current.activeKey && (
              <text className="ikv-store-empty" x={srvX + srvW / 2} y={srvY + 108}>disabled — no key on requests</text>
            )}
            {current.activeKey && storeEntries.length === 0 && (
              <text className="ikv-store-empty" x={srvX + srvW / 2} y={srvY + 108}>empty — no key seen yet</text>
            )}
            {current.activeKey && storeEntries.map(([k, v], ri) => (
              <g key={`store-${k}`}>
                <rect className={`ikv-store-row ${current.matched ? 'is-hit' : ''}`} x={srvX + 22} y={srvY + 78 + ri * 30} width={srvW - 44} height={24} rx={5} />
                <text className="ikv-store-key" x={srvX + 32} y={srvY + 95 + ri * 30}>{k}</text>
                <text className="ikv-store-val" x={srvX + srvW - 32} y={srvY + 95 + ri * 30}>{v}</text>
              </g>
            ))}

            {/* server verdict */}
            <text className={`ikv-verdict ${current.replyState === 'cached' ? 'is-cached' : (current.side === 'server' && (current.replyState === 'ok' || current.processed > 0) ? 'is-charge' : '')}`} x={srvX + 16} y={srvY + 172}>
              {current.replyState === 'cached'
                ? 'key found -> return cached, no charge'
                : current.side === 'server'
                  ? `charge applied · $${CHARGE}`
                  : 'idle'}
            </text>

            {/* mini ledger total inside server */}
            <text className="ikv-store-head" x={srvX + 16} y={srvY + 204}>charges applied this run</text>
            <rect className="ikv-store-frame" x={srvX + 14} y={srvY + 214} width={srvW - 28} height={70} rx={7} />
            {current.ledger.length === 0 && (
              <text className="ikv-store-empty" x={srvX + srvW / 2} y={srvY + 252}>none yet</text>
            )}
            {current.ledger.map((e, ri) => (
              <g key={`srvled-${e.id}`}>
                <rect className={`ikv-led-row ${e.id > 1 ? 'is-dup' : ''}`} x={srvX + 22 + ri * ((srvW - 56) / 2)} y={srvY + 226} width={(srvW - 56) / 2 - 8} height={46} rx={6} />
                <text className="ikv-led-amt" x={srvX + 22 + ri * ((srvW - 56) / 2) + ((srvW - 56) / 4) - 4} y={srvY + 248}>${e.amount}</text>
                <text className="ikv-led-tag" x={srvX + 22 + ri * ((srvW - 56) / 2) + ((srvW - 56) / 4) - 4} y={srvY + 264}>charge #{e.id}</text>
              </g>
            ))}
          </g>

          {/* CLIENT-side ledger summary (running total) */}
          <g>
            <rect className="ikv-box ikv-box-ledger" x={ledgerX} y={ledgerY} width={ledgerW} height={ledgerH} rx={11} />
            <text className="ikv-box-title" x={ledgerX + 16} y={ledgerY + 26}>card statement</text>
            <text className={`ikv-total ${duplicateCharges > 0 ? 'is-bad' : 'is-good'}`} x={ledgerX + ledgerW / 2} y={ledgerY + 80}>
              ${totalCharged}
            </text>
            <text className="ikv-total-sub" x={ledgerX + ledgerW / 2} y={ledgerY + 112}>
              {current.ledger.length} charge{current.ledger.length === 1 ? '' : 's'}
              {duplicateCharges > 0 ? ` · ${duplicateCharges} duplicate` : ''}
            </text>
          </g>
        </svg>
      </div>

      <div className="ikv-metrics">
        <div className="ikv-metric">
          <span className="ikv-metric-label">mode</span>
          <span className={`ikv-metric-value ${useKey ? 'is-good' : 'is-bad'}`}>{useKey ? 'with key' : 'no key'}</span>
        </div>
        <div className="ikv-metric">
          <span className="ikv-metric-label">requests sent</span>
          <span className="ikv-metric-value">{current.sent}</span>
        </div>
        <div className="ikv-metric">
          <span className="ikv-metric-label">processed</span>
          <span className="ikv-metric-value">{current.processed}</span>
        </div>
        <div className="ikv-metric">
          <span className="ikv-metric-label">total charged</span>
          <span className={`ikv-metric-value ${duplicateCharges > 0 ? 'is-bad' : 'is-good'}`}>${totalCharged}</span>
        </div>
        <div className="ikv-metric">
          <span className="ikv-metric-label">duplicate charges</span>
          <span className={`ikv-metric-value ${duplicateCharges > 0 ? 'is-bad' : ''}`}>{duplicateCharges}</span>
        </div>
      </div>

      <div className="ikv-narration">
        <span className={`ikv-narration-label ikv-phase-${current.phase} ${current.replyState === 'lost' ? 'is-lost' : ''} ${current.replyState === 'cached' ? 'is-cached' : ''}`}>
          {current.replyState === 'lost' ? 'hiccup' : current.replyState === 'cached' ? 'cache hit' : current.phase === 'done' ? 'result' : 'trace'}
        </span>
        <span className="ikv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
