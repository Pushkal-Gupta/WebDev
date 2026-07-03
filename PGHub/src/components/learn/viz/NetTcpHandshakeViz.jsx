import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight, Play, Pause, SkipForward, RotateCcw,
  Laptop, Server, Hash, CheckCheck, Zap, ZapOff,
} from 'lucide-react';
import './NetTcpHandshakeViz.css';

// Deterministic message scripts. cseq = client's next send seq, sack = server's cumulative ACK.
const CLEAN = [
  { kind: 'syn', dir: 'c2s', label: 'SYN', seq: 1000, ack: null, cseq: 1000, sack: 0 },
  { kind: 'synack', dir: 's2c', label: 'SYN-ACK', seq: 5000, ack: 1001, cseq: 1000, sack: 1001 },
  { kind: 'ack', dir: 'c2s', label: 'ACK', seq: 1001, ack: 5001, cseq: 1001, sack: 1001 },
  { kind: 'data', dir: 'c2s', label: 'DATA len=500', seq: 1001, ack: null, cseq: 1501, sack: 1001 },
  { kind: 'dack', dir: 's2c', label: 'ACK', seq: 5001, ack: 1501, cseq: 1501, sack: 1501 },
  { kind: 'data', dir: 'c2s', label: 'DATA len=500', seq: 1501, ack: null, cseq: 2001, sack: 1501 },
  { kind: 'dack', dir: 's2c', label: 'ACK', seq: 5001, ack: 2001, cseq: 2001, sack: 2001 },
];

const LOSSY = [
  { kind: 'syn', dir: 'c2s', label: 'SYN', seq: 1000, ack: null, cseq: 1000, sack: 0 },
  { kind: 'synack', dir: 's2c', label: 'SYN-ACK', seq: 5000, ack: 1001, cseq: 1000, sack: 1001 },
  { kind: 'ack', dir: 'c2s', label: 'ACK', seq: 1001, ack: 5001, cseq: 1001, sack: 1001 },
  { kind: 'data', dir: 'c2s', label: 'DATA len=500', seq: 1001, ack: null, cseq: 1501, sack: 1001 },
  { kind: 'dack', dir: 's2c', label: 'ACK', seq: 5001, ack: 1501, cseq: 1501, sack: 1501 },
  { kind: 'data', dir: 'c2s', label: 'DATA len=500', seq: 1501, ack: null, cseq: 1501, sack: 1501, dropped: true },
  { kind: 'timeout', dir: 'mid', label: 'RTO timeout', seq: null, ack: null, cseq: 1501, sack: 1501 },
  { kind: 'data', dir: 'c2s', label: 'DATA len=500', seq: 1501, ack: null, cseq: 2001, sack: 1501, retransmit: true },
  { kind: 'dack', dir: 's2c', label: 'ACK', seq: 5001, ack: 2001, cseq: 2001, sack: 2001 },
];

const KIND_DESC = {
  syn: 'client opens the connection, proposing a start sequence number',
  synack: 'server agrees, acknowledges the SYN, sends its own start sequence',
  ack: 'client acknowledges the server — handshake complete, channel open',
  data: 'client sends a data segment; bytes are numbered from its sequence',
  dack: 'server cumulative-ACKs: every byte below this number has arrived',
  timeout: 'no ACK came back in time — the retransmission timer fired',
};

const W = 760;
const HEAD_Y = 8;
const HEAD_H = 34;
const TOP = HEAD_Y + HEAD_H + 14;
const ROW_H = 40;
const BOT_PAD = 22;
const X_C = 150;
const X_S = 610;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function NetTcpHandshakeViz() {
  const [loss, setLoss] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const msgs = loss ? LOSSY : CLEAN;
  const total = msgs.length;
  const H = TOP + total * ROW_H + BOT_PAD;

  function toggleLoss() { setLoss((v) => !v); setStep(0); setPlaying(false); }
  function reset() { setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), Math.round((reduced() ? 360 : 820) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const finished = step >= total;
  const showPause = playing && step < total;
  const current = step > 0 ? msgs[step - 1] : null;

  const shown = useMemo(() => msgs.slice(0, step), [msgs, step]);
  const last = shown.length ? shown[shown.length - 1] : null;
  const clientSeq = last ? last.cseq : 1000;
  const serverAck = last ? last.sack : 0;
  const lastRetransmit = current ? Boolean(current.retransmit) : false;

  const yOf = (i) => TOP + i * ROW_H + ROW_H * 0.32;

  return (
    <div className="nettcp">
      <div className="nettcp-head">
        <div className="nettcp-head-icon"><ArrowLeftRight size={18} /></div>
        <div className="nettcp-head-text">
          <h3 className="nettcp-title">TCP handshake &amp; reliable delivery</h3>
          <p className="nettcp-sub">
            Watch SYN / SYN-ACK / ACK open the connection, then a data segment and its
            cumulative ACK. Flip loss on to see a timeout and retransmission.
          </p>
        </div>
        <button type="button" className="nettcp-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="nettcp-chips">
        <button
          type="button"
          className={`nettcp-toggle${loss ? ' is-on' : ''}`}
          onClick={toggleLoss}
        >
          {loss ? <ZapOff size={14} /> : <Zap size={14} />}
          {loss ? 'Packet loss: on' : 'Packet loss: off'}
        </button>
        <span className="nettcp-hint">
          {loss ? 'one DATA segment drops mid-wire — the timer recovers it' : 'clean network — every segment is acknowledged'}
        </span>
      </div>

      <div className="nettcp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="nettcp-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="nettcp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="nettcp-arrowhead" />
            </marker>
          </defs>

          {/* lane headers */}
          <g className="nettcp-lane">
            <rect x={X_C - 64} y={HEAD_Y} width={128} height={HEAD_H} rx={8} className="nettcp-lane-box" />
            <Laptop x={X_C - 54} y={HEAD_Y + 9} width={16} height={16} className="nettcp-lane-ico" />
            <text x={X_C + 6} y={HEAD_Y + 22} className="nettcp-lane-label" textAnchor="middle">Client</text>
          </g>
          <g className="nettcp-lane">
            <rect x={X_S - 64} y={HEAD_Y} width={128} height={HEAD_H} rx={8} className="nettcp-lane-box" />
            <Server x={X_S - 54} y={HEAD_Y + 9} width={16} height={16} className="nettcp-lane-ico" />
            <text x={X_S + 6} y={HEAD_Y + 22} className="nettcp-lane-label" textAnchor="middle">Server</text>
          </g>

          {/* lifelines */}
          <line x1={X_C} y1={TOP - 6} x2={X_C} y2={H - 8} className="nettcp-life" />
          <line x1={X_S} y1={TOP - 6} x2={X_S} y2={H - 8} className="nettcp-life" />

          {msgs.map((m, i) => {
            const visible = i < step;
            const isCur = i === step - 1;
            const y0 = yOf(i);
            const y1 = y0 + ROW_H * 0.46;

            let cls = 'nettcp-msg';
            if (visible) cls += ' is-shown';
            if (isCur) cls += ' is-cur';
            if (m.dropped) cls += ' is-drop';
            if (m.retransmit) cls += ' is-retx';

            if (m.kind === 'timeout') {
              const cx = (X_C + X_S) / 2;
              return (
                <g key={i} className={`${cls} nettcp-timeout`}>
                  <line x1={X_C + 14} y1={y0 + 8} x2={X_S - 14} y2={y0 + 8} className="nettcp-timeout-line" />
                  <text x={cx} y={y0 + 2} className="nettcp-timeout-text" textAnchor="middle">RTO timeout — resend</text>
                </g>
              );
            }

            const c2s = m.dir === 'c2s';
            const sx = c2s ? X_C : X_S;
            const ex = c2s ? X_S : X_C;
            const frac = m.dropped ? 0.52 : 1;
            const tx = sx + (ex - sx) * frac;
            const ty = y0 + (y1 - y0) * frac;
            const labelText = m.ack != null
              ? `${m.label} · seq=${m.seq} ack=${m.ack}`
              : `${m.label} · seq=${m.seq}`;
            const midx = (sx + tx) / 2;

            return (
              <g key={i} className={cls}>
                <text x={midx} y={y0 - 5} className="nettcp-msg-label" textAnchor="middle">{labelText}</text>
                <line
                  x1={sx}
                  y1={y0}
                  x2={tx}
                  y2={ty}
                  className="nettcp-wire"
                  markerEnd={m.dropped ? undefined : 'url(#nettcp-arrow)'}
                />
                {m.dropped && (
                  <g className="nettcp-x">
                    <line x1={tx - 6} y1={ty - 6} x2={tx + 6} y2={ty + 6} className="nettcp-x-line" />
                    <line x1={tx - 6} y1={ty + 6} x2={tx + 6} y2={ty - 6} className="nettcp-x-line" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="nettcp-controls">
        <button type="button" className="nettcp-btn" onClick={togglePlay}>
          {showPause ? <Pause size={14} /> : <Play size={14} />}{showPause ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="nettcp-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={finished}>
          <SkipForward size={14} /> Step
        </button>
        <label className="nettcp-speed">
          <span className="nettcp-speed-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="nettcp-speed-range"
          />
          <span className="nettcp-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="nettcp-progress">{step} / {total} messages</span>
      </div>

      <div className="nettcp-readout">
        <div className="nettcp-stat is-seq">
          <Hash size={13} />
          <span className="nettcp-stat-label">client seq</span>
          <span className="nettcp-stat-val">{clientSeq}</span>
        </div>
        <div className="nettcp-stat is-ack">
          <CheckCheck size={13} />
          <span className="nettcp-stat-label">server ack</span>
          <span className="nettcp-stat-val">{serverAck || '—'}</span>
        </div>
        <div className={`nettcp-stat ${lastRetransmit ? 'is-retx' : 'is-clean'}`}>
          <span className="nettcp-stat-label">retransmitted</span>
          <span className="nettcp-stat-val">{lastRetransmit ? 'yes' : 'no'}</span>
        </div>
      </div>

      <div className="nettcp-note">
        <span className="nettcp-note-label">now</span>
        <span className="nettcp-note-body">
          {current
            ? `${current.label} — ${KIND_DESC[current.kind]}`
            : 'press Play or Step to open the connection with a SYN'}
        </span>
      </div>
    </div>
  );
}
