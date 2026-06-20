import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Network, Layers, Clock, Zap, Ban, ArrowRight,
} from 'lucide-react';
import './Http3StreamsViz.css';

// HTTP/2-over-TCP vs HTTP/3-over-QUIC, focused on transport-level head-of-line
// blocking. Each stream is a row of ordered packets. Drop ONE packet on one
// stream and watch the difference:
//   HTTP/2 over TCP — TCP is a single ordered byte stream. A lost segment stalls
//     delivery of EVERY later byte to the application, including bytes belonging
//     to other HTTP/2 streams. So one drop blocks ALL streams until the
//     retransmit arrives. That is transport-level head-of-line blocking.
//   HTTP/3 over QUIC — QUIC tracks each stream's bytes independently over UDP. A
//     lost packet only stalls ITS OWN stream; the other streams keep delivering.
// A wall clock sweeps left to right; a dropped packet is retransmitted after a
// fixed RTT gap, so the stalled region is visible and measurable.

const HUES = ['--hue-violet', '--hue-sky', '--hue-pink', '--hue-mint'];
const STREAM_COUNT = 4;
const PKTS_PER_STREAM = 6;
const PKT_UNITS = 2;          // timeline units each packet occupies
const RETRANSMIT_GAP = 7;     // units before a dropped packet is retransmitted
const TICK_MS = 110;

function streamId(i) {
  return i * 4 + 1;           // QUIC client-initiated bidirectional: 0,4,8... +1 label flavor
}

// Layout: packets across STREAM_COUNT rows. Without a drop, packet k on stream s
// arrives at time (k+1)*PKT_UNITS. With a drop on (dropStream, dropPkt):
//  - QUIC: only that stream's later packets shift right by RETRANSMIT_GAP.
//  - TCP : the drop sits on a shared ordered byte stream, so EVERY packet that
//          arrives at-or-after the drop's original arrival time is held back by
//          RETRANSMIT_GAP — the global stall.
function buildPlan(http3, dropStream, dropPkt) {
  const base = [];
  for (let s = 0; s < STREAM_COUNT; s += 1) {
    for (let k = 0; k < PKTS_PER_STREAM; k += 1) {
      base.push({ s, k, baseArrive: (k + 1) * PKT_UNITS, hue: HUES[s % HUES.length] });
    }
  }

  const dropOriginalArrive = (dropPkt + 1) * PKT_UNITS;

  const packets = base.map((p) => {
    const isDropped = p.s === dropStream && p.k === dropPkt;
    let arrive = p.baseArrive;
    let stalled = false;

    if (http3) {
      // QUIC: only the dropped stream is affected, and only from the drop onward.
      if (p.s === dropStream && p.k >= dropPkt) {
        arrive = p.baseArrive + RETRANSMIT_GAP;
        stalled = p.k > dropPkt;
      }
    } else if (p.baseArrive >= dropOriginalArrive) {
      // TCP: shared ordered stream — everything from the drop's slot onward is
      // held back, across ALL streams.
      arrive = p.baseArrive + RETRANSMIT_GAP;
      stalled = !isDropped;
    }

    return {
      ...p,
      isDropped,
      arrive,
      stalled,
      retransmit: isDropped,
    };
  });

  const total = packets.reduce((m, p) => Math.max(m, p.arrive), 0) + PKT_UNITS;
  return { packets, total, dropOriginalArrive };
}

export default function Http3StreamsViz() {
  const [http3, setHttp3] = useState(true);
  const [dropStream, setDropStream] = useState(1);
  const [dropPkt] = useState(2);
  const [hasDrop, setHasDrop] = useState(true);
  const [speed, setSpeed] = useState(1.5);
  const [isRunning, setIsRunning] = useState(false);
  const [clock, setClock] = useState(0);

  const runTimer = useRef(null);

  const effDropStream = hasDrop ? dropStream : -1;
  const effDropPkt = hasDrop ? dropPkt : -1;
  const plan = useMemo(
    () => buildPlan(http3, effDropStream, effDropPkt),
    [http3, effDropStream, effDropPkt],
  );
  const total = plan.total;
  const safeTotal = total > 0 ? total : 1;
  const delay = useMemo(() => Math.max(16, Math.round(TICK_MS / Math.max(speed, 0.1))), [speed]);
  const done = clock >= total;

  useEffect(() => {
    if (!isRunning || done) return undefined;
    runTimer.current = setInterval(() => {
      setClock((c) => Math.min(c + 1, total));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, done, delay, total]);

  useEffect(() => {
    if (done && runTimer.current) {
      clearInterval(runTimer.current);
      runTimer.current = null;
    }
  }, [done]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const resetClock = () => {
    setIsRunning(false);
    setClock(0);
  };

  const toggleMode = () => {
    setIsRunning(false);
    setClock(0);
    setHttp3((v) => !v);
  };

  const dropOnStream = (s) => {
    setIsRunning(false);
    setClock(0);
    setHasDrop(true);
    setDropStream(s);
  };

  const clearDrop = () => {
    setIsRunning(false);
    setClock(0);
    setHasDrop(false);
  };

  const play = () => {
    if (done) setClock(0);
    setIsRunning((v) => !v);
  };

  // Compare clean baseline (no drop) vs current for the readout.
  const cleanTotal = useMemo(() => buildPlan(http3, -1, -1).total, [http3]);
  const stallCost = Math.max(0, total - cleanTotal);
  const stalledStreams = useMemo(() => {
    const set = new Set();
    plan.packets.forEach((p) => { if (p.stalled) set.add(p.s); });
    return set.size;
  }, [plan]);

  // SVG geometry — one row per stream, packets along the timeline.
  const W = 960;
  const labelW = 120;
  const trackX = labelW + 14;
  const trackRight = W - 24;
  const trackW = trackRight - trackX;
  const rowH = 38;
  const rowGap = 12;
  const topPad = 40;
  const botPad = 36;
  const H = topPad + STREAM_COUNT * (rowH + rowGap) - rowGap + botPad;

  const xAt = (t) => trackX + (t / safeTotal) * trackW;
  const cursorX = xAt(clock);
  const pktW = (PKT_UNITS / safeTotal) * trackW;

  const modeLabel = http3 ? 'HTTP/3 over QUIC' : 'HTTP/2 over TCP';

  return (
    <div className="h3v">
      <div className="h3v-head">
        <h3 className="h3v-title">HTTP/3 over QUIC vs HTTP/2 over TCP — one lost packet</h3>
        <p className="h3v-sub">
          Four streams send ordered packets on one connection. Drop a packet on a stream: over TCP the
          single ordered byte stream stalls every stream until the retransmit lands; over QUIC only the
          stream that lost a packet waits, the rest keep flowing.
        </p>
      </div>

      <div className="h3v-controls">
        <button
          type="button"
          className={`h3v-toggle ${http3 ? 'is-on' : ''}`}
          onClick={toggleMode}
          aria-pressed={http3}
          title="Switch between HTTP/3 over QUIC and HTTP/2 over TCP"
        >
          <Network size={14} /> {http3 ? 'HTTP/3 (QUIC)' : 'HTTP/2 (TCP)'}
        </button>

        <div className="h3v-droprow" role="group" aria-label="Drop a packet on a stream">
          <span className="h3v-input-label">drop packet on</span>
          {Array.from({ length: STREAM_COUNT }, (_, s) => (
            <button
              key={`drop-${s}`}
              type="button"
              className={`h3v-drop-btn ${hasDrop && dropStream === s ? 'is-on' : ''}`}
              onClick={() => dropOnStream(s)}
              style={{ '--h3v-hue': `var(${HUES[s % HUES.length]})` }}
              title={`Drop a packet on stream ${s + 1}`}
            >
              S{s + 1}
            </button>
          ))}
          <button
            type="button"
            className={`h3v-drop-btn h3v-drop-clear ${!hasDrop ? 'is-on' : ''}`}
            onClick={clearDrop}
            title="No packet loss"
          >
            <Ban size={12} /> none
          </button>
        </div>

        <label className="h3v-speed">
          <span className="h3v-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h3v-range"
            aria-label="Playback speed"
          />
          <span className="h3v-range-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="h3v-spacer" aria-hidden="true" />

        <div className="h3v-buttons">
          <button type="button" className="h3v-btn h3v-btn-primary" onClick={play}>
            {isRunning && !done ? <Pause size={14} /> : <Play size={14} />}
            {isRunning && !done ? 'Pause' : (done ? 'Replay' : 'Send')}
          </button>
          <button type="button" className="h3v-btn" onClick={resetClock}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="h3v-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="h3v-svg" preserveAspectRatio="xMidYMid meet">
          <text className="h3v-conn-label" x={trackX} y={20} textAnchor="start">
            {http3
              ? 'one QUIC connection over UDP — per-stream byte tracking, independent delivery'
              : 'one TCP connection — single ordered byte stream, in-order delivery for all'}
          </text>
          <text className="h3v-clock-label" x={trackRight} y={20} textAnchor="end">
            {`t = ${clock} / ${total}`}
          </text>

          <line className="h3v-axis" x1={trackX} y1={topPad - 8} x2={trackRight} y2={topPad - 8} />

          {Array.from({ length: STREAM_COUNT }, (_, s) => {
            const y = topPad + s * (rowH + rowGap);
            const rowStalled = plan.packets.some((p) => p.s === s && p.stalled);
            return (
              <g key={`row-${s}`}>
                <text className="h3v-lane-req" x={0} y={y + rowH / 2 - 3}>
                  {`stream ${s + 1}`}
                </text>
                <text
                  className={`h3v-lane-sid ${rowStalled ? 'is-stalled' : 'is-on'}`}
                  x={0}
                  y={y + rowH / 2 + 12}
                >
                  {rowStalled ? 'stalled' : (http3 ? `id ${streamId(s)}` : 'tcp seq')}
                </text>
                <line
                  className="h3v-lane-base"
                  x1={trackX}
                  y1={y + rowH / 2}
                  x2={trackRight}
                  y2={y + rowH / 2}
                />
              </g>
            );
          })}

          {/* stall shading: TCP shades the whole grid right of the drop slot;
              QUIC shades only the dropped stream's row right of the drop. */}
          {hasDrop && (() => {
            const stallX = xAt(plan.dropOriginalArrive);
            if (http3) {
              const y = topPad + dropStream * (rowH + rowGap);
              return (
                <rect
                  className="h3v-stall-band is-quic"
                  x={stallX}
                  y={y - 2}
                  width={Math.max(0, xAt(plan.dropOriginalArrive + RETRANSMIT_GAP) - stallX)}
                  height={rowH + 4}
                  rx={5}
                />
              );
            }
            return (
              <rect
                className="h3v-stall-band is-tcp"
                x={stallX}
                y={topPad - 4}
                width={Math.max(0, xAt(plan.dropOriginalArrive + RETRANSMIT_GAP) - stallX)}
                height={STREAM_COUNT * (rowH + rowGap) - rowGap + 8}
                rx={6}
              />
            );
          })()}

          {plan.packets.map((p) => {
            const y = topPad + p.s * (rowH + rowGap);
            const x = xAt(p.arrive - PKT_UNITS);
            const delivered = clock >= p.arrive;
            const inFlight = clock >= p.arrive - PKT_UNITS && clock < p.arrive;
            return (
              <g key={`pkt-${p.s}-${p.k}`}>
                {p.isDropped && (
                  <>
                    <rect
                      className="h3v-pkt is-dropped"
                      x={xAt(p.baseArrive - PKT_UNITS)}
                      y={y + 4}
                      width={Math.max(4, pktW - 4)}
                      height={rowH - 8}
                      rx={5}
                    />
                    <line
                      className="h3v-drop-x a"
                      x1={xAt(p.baseArrive - PKT_UNITS) + 4}
                      y1={y + 8}
                      x2={xAt(p.baseArrive - PKT_UNITS) + pktW - 8}
                      y2={y + rowH - 8}
                    />
                    <line
                      className="h3v-drop-x b"
                      x1={xAt(p.baseArrive - PKT_UNITS) + pktW - 8}
                      y1={y + 8}
                      x2={xAt(p.baseArrive - PKT_UNITS) + 4}
                      y2={y + rowH - 8}
                    />
                  </>
                )}
                <rect
                  className={`h3v-pkt ${delivered ? 'is-delivered' : ''} ${inFlight ? 'is-inflight' : ''} ${p.stalled ? 'is-stalled' : ''} ${p.retransmit ? 'is-retx' : ''}`}
                  x={x}
                  y={y + 4}
                  width={Math.max(4, pktW - 4)}
                  height={rowH - 8}
                  rx={5}
                  style={{ '--h3v-hue': `var(${p.hue})` }}
                />
                <text
                  className={`h3v-pkt-label ${delivered ? 'is-delivered' : ''}`}
                  x={x + (pktW - 4) / 2}
                  y={y + rowH / 2 + 4}
                  textAnchor="middle"
                >
                  {p.retransmit ? 'rtx' : p.k + 1}
                </text>
              </g>
            );
          })}

          {/* sweeping cursor */}
          <line
            className="h3v-cursor"
            x1={cursorX}
            y1={topPad - 14}
            x2={cursorX}
            y2={H - botPad + 8}
          />
          <text className="h3v-cursor-cap" x={cursorX} y={topPad - 18} textAnchor="middle">
            {modeLabel}
          </text>

          {/* total markers */}
          <text className="h3v-total-mark" x={xAt(cleanTotal)} y={H - 10} textAnchor="middle">
            {`no-loss finish = ${cleanTotal}u`}
          </text>
          {hasDrop && (
            <>
              <line
                className={`h3v-total-line ${http3 ? 'is-quic' : 'is-tcp'}`}
                x1={xAt(total)}
                y1={topPad - 8}
                x2={xAt(total)}
                y2={H - botPad + 4}
              />
              <text className={`h3v-total-mark ${http3 ? 'is-quic' : 'is-tcp'}`} x={xAt(total)} y={H - 10} textAnchor="middle">
                {`${modeLabel} finish = ${total}u`}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="h3v-metrics">
        <div className="h3v-metric">
          <span className="h3v-metric-label">transport</span>
          <span className={`h3v-metric-value ${http3 ? 'is-ok' : 'is-warn'}`}>
            {http3 ? 'QUIC / UDP' : 'TCP'}
          </span>
        </div>
        <div className="h3v-metric">
          <span className="h3v-metric-label">packet loss</span>
          <span className="h3v-metric-value">
            {hasDrop ? `stream ${dropStream + 1}, pkt ${dropPkt + 1}` : 'none'}
          </span>
        </div>
        <div className="h3v-metric">
          <span className="h3v-metric-label">streams stalled by it</span>
          <span className={`h3v-metric-value ${stalledStreams > 1 ? 'is-warn' : (stalledStreams === 1 ? 'is-ok' : '')}`}>
            {hasDrop ? `${stalledStreams} / ${STREAM_COUNT}` : '0 / 4'}
          </span>
        </div>
        <div className="h3v-metric">
          <span className="h3v-metric-label">extra wall-clock cost</span>
          <span className={`h3v-metric-value ${stallCost > 0 ? (http3 ? 'is-ok' : 'is-warn') : ''}`}>
            {`+${stallCost}u`}
          </span>
        </div>
        <div className="h3v-metric h3v-metric-dim">
          <span className="h3v-metric-label">head-of-line blocking</span>
          <span className={`h3v-metric-value ${http3 ? 'is-ok' : 'is-warn'}`}>
            {http3 ? 'per-stream only' : 'transport-wide'}
          </span>
        </div>
      </div>

      <div className={`h3v-narration ${http3 ? 'is-ok' : 'is-warn'}`}>
        <span className={`h3v-narration-label ${http3 ? 'is-ok' : 'is-warn'}`}>
          {http3 ? 'quic — isolated' : 'tcp — head-of-line'}
        </span>
        <span className="h3v-narration-body">
          {!hasDrop
            ? 'No loss: every stream delivers its packets in order and both transports finish at the same time. Drop a packet on any stream to see where TCP and QUIC diverge.'
            : http3
              ? `QUIC tracks each stream's bytes separately over UDP. The lost packet on stream ${dropStream + 1} only stalls stream ${dropStream + 1} while its retransmit travels; the other ${STREAM_COUNT - 1} streams keep delivering. One drop costs +${stallCost}u on a single stream — no global stall.`
              : `TCP is one ordered byte stream, so the application cannot receive any byte after the lost one until it is retransmitted — even bytes belonging to other HTTP/2 streams. The single drop on stream ${dropStream + 1} stalls all ${stalledStreams} streams for +${stallCost}u. That is transport-level head-of-line blocking, and it is exactly what QUIC removes.`}
        </span>
      </div>

      <div className="h3v-legend">
        <span className="h3v-legend-item"><Zap size={13} className="h3v-ic is-ok" /> HTTP/3 / QUIC: a drop stalls only its own stream</span>
        <span className="h3v-legend-item"><Clock size={13} className="h3v-ic is-warn" /> HTTP/2 / TCP: a drop stalls every stream</span>
        <span className="h3v-legend-item"><Ban size={13} className="h3v-ic is-fail" /> dropped packet — retransmitted after one RTT</span>
        <span className="h3v-legend-item"><Layers size={13} className="h3v-ic" /> rtx = retransmitted packet</span>
        <span className="h3v-legend-item"><ArrowRight size={13} className="h3v-ic" /> cursor sweeps the wall clock</span>
      </div>
    </div>
  );
}
