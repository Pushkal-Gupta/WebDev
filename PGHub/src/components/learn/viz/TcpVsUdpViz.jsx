import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Network, Ban, ShieldCheck, Zap, Clock,
  ArrowRight, ListOrdered,
} from 'lucide-react';
import './TcpVsUdpViz.css';

// TCP (connection-oriented) vs UDP (connectionless), same payload sent both ways
// as a timeline of packets on one path.
//   TCP — ordered + reliable. A dropped packet is retransmitted after one RTT,
//     and the receiver holds every later packet until the gap is filled, so the
//     payload arrives complete and in order but costs extra wall-clock time.
//   UDP — fire-and-forget. A dropped packet is gone for good; the rest arrive on
//     their original schedule, so latency stays low but the payload is incomplete.
// A wall clock sweeps the timeline; the dropped slot is marked, and for TCP the
// retransmit ('rtx') is shown landing one RTT later with the reorder hold visible.

const ACCENT_HUE = '--hue-sky';
const PKT_COUNT = 8;
const PKT_UNITS = 2;          // timeline units each packet occupies
const RETRANSMIT_GAP = 7;     // units before a dropped packet is retransmitted
const TICK_MS = 110;

// Build the per-packet layout for the chosen transport + drop index.
// Without a drop, packet k arrives at (k+1)*PKT_UNITS.
// With a drop at index d:
//   TCP : the lost packet is retransmitted RETRANSMIT_GAP units later, and every
//         packet from d onward is held back by the receiver until the gap is
//         filled (in-order delivery), so all of them shift right.
//   UDP : the lost packet never arrives; nothing else shifts.
function buildPlan(isTcp, dropIdx) {
  const base = Array.from({ length: PKT_COUNT }, (_, k) => ({
    k,
    baseArrive: (k + 1) * PKT_UNITS,
  }));

  const dropOriginalArrive = dropIdx >= 0 ? (dropIdx + 1) * PKT_UNITS : -1;

  const packets = base.map((p) => {
    const isDropTarget = p.k === dropIdx;
    let arrive = p.baseArrive;
    let stalled = false;
    let lost = false;
    let retransmit = false;

    if (dropIdx >= 0) {
      if (isTcp) {
        if (p.k >= dropIdx) {
          // Retransmit + reorder hold: shift this packet right by one RTT gap.
          arrive = p.baseArrive + RETRANSMIT_GAP;
          stalled = p.k > dropIdx;     // held while waiting for the gap to fill
          retransmit = isDropTarget;   // the dropped packet is the one resent
        }
      } else if (isDropTarget) {
        // UDP: the packet is lost permanently, no retransmit, no reorder hold.
        lost = true;
      }
    }

    return {
      ...p, isDropTarget, arrive, stalled, lost, retransmit,
    };
  });

  const delivered = packets.filter((p) => !p.lost);
  const total = delivered.reduce((m, p) => Math.max(m, p.arrive), 0) + PKT_UNITS;
  return { packets, total, dropOriginalArrive };
}

export default function TcpVsUdpViz() {
  const [isTcp, setIsTcp] = useState(true);
  const [dropIdx, setDropIdx] = useState(3);
  const [hasDrop, setHasDrop] = useState(true);
  const [speed, setSpeed] = useState(1.5);
  const [isRunning, setIsRunning] = useState(false);
  const [clock, setClock] = useState(0);

  const runTimer = useRef(null);

  const effDrop = hasDrop ? dropIdx : -1;
  const plan = useMemo(() => buildPlan(isTcp, effDrop), [isTcp, effDrop]);
  const total = plan.total;
  const safeTotal = total > 0 ? total : 1;
  const delay = useMemo(
    () => Math.max(16, Math.round(TICK_MS / Math.max(speed, 0.1))),
    [speed],
  );
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
    setIsTcp((v) => !v);
  };

  const dropAt = (k) => {
    setIsRunning(false);
    setClock(0);
    setHasDrop(true);
    setDropIdx(k);
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

  // Compare clean baseline (no drop) vs current for the readouts.
  const cleanTotal = useMemo(() => buildPlan(isTcp, -1).total, [isTcp]);
  const extraLatency = Math.max(0, total - cleanTotal);
  const lostCount = plan.packets.filter((p) => p.lost).length;
  const deliveredTotal = PKT_COUNT - lostCount;

  // SVG geometry — a single sender->receiver track of packets along the timeline.
  const W = 960;
  const labelW = 120;
  const trackX = labelW + 14;
  const trackRight = W - 24;
  const trackW = trackRight - trackX;
  const rowH = 52;
  const topPad = 64;
  const botPad = 40;
  const H = topPad + rowH + botPad;

  const xAt = (t) => trackX + (t / safeTotal) * trackW;
  const cursorX = xAt(clock);
  const pktW = (PKT_UNITS / safeTotal) * trackW;
  const rowY = topPad;

  const modeLabel = isTcp ? 'TCP — ordered + reliable' : 'UDP — fire-and-forget';

  // Live delivery counts under the sweeping clock.
  const arrivedNow = plan.packets.filter((p) => !p.lost && clock >= p.arrive).length;
  const lostNow = plan.packets.filter((p) => p.lost && clock >= p.baseArrive).length;

  return (
    <div className="tuv">
      <div className="tuv-head">
        <h3 className="tuv-title">TCP vs UDP — the same payload, one lost packet</h3>
        <p className="tuv-sub">
          Eight packets travel one path. Drop a packet: TCP retransmits it and holds the rest until the
          gap is filled, delivering everything in order but later; UDP simply loses it, so the payload
          arrives incomplete with no added delay.
        </p>
      </div>

      <div className="tuv-controls">
        <button
          type="button"
          className={`tuv-toggle ${isTcp ? 'is-on' : ''}`}
          onClick={toggleMode}
          aria-pressed={isTcp}
          title="Switch between TCP and UDP"
        >
          <Network size={14} /> {isTcp ? 'TCP' : 'UDP'}
        </button>

        <div className="tuv-droprow" role="group" aria-label="Drop a packet">
          <span className="tuv-input-label">drop packet</span>
          {Array.from({ length: PKT_COUNT }, (_, k) => (
            <button
              key={`drop-${k}`}
              type="button"
              className={`tuv-drop-btn ${hasDrop && dropIdx === k ? 'is-on' : ''}`}
              onClick={() => dropAt(k)}
              title={`Drop packet ${k + 1}`}
            >
              {k + 1}
            </button>
          ))}
          <button
            type="button"
            className={`tuv-drop-btn tuv-drop-clear ${!hasDrop ? 'is-on' : ''}`}
            onClick={clearDrop}
            title="No packet loss"
          >
            <Ban size={12} /> none
          </button>
        </div>

        <label className="tuv-speed">
          <span className="tuv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tuv-range"
            aria-label="Playback speed"
          />
          <span className="tuv-range-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="tuv-spacer" aria-hidden="true" />

        <div className="tuv-buttons">
          <button type="button" className="tuv-btn tuv-btn-primary" onClick={play}>
            {isRunning && !done ? <Pause size={14} /> : <Play size={14} />}
            {isRunning && !done ? 'Pause' : (done ? 'Replay' : 'Send')}
          </button>
          <button type="button" className="tuv-btn" onClick={resetClock}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="tuv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tuv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="tuv-conn-label" x={trackX} y={22} textAnchor="start">
            {isTcp
              ? 'TCP — handshake, in-order byte stream, retransmit + congestion control'
              : 'UDP — no handshake, no ordering, no retransmit, lowest latency'}
          </text>
          <text className="tuv-clock-label" x={trackRight} y={22} textAnchor="end">
            {`t = ${clock} / ${total}`}
          </text>

          <text className="tuv-end-label" x={0} y={rowY - 12}>sender</text>
          <text className="tuv-end-label is-recv" x={0} y={rowY + rowH + 22}>receiver</text>

          <line className="tuv-axis" x1={trackX} y1={rowY - 8} x2={trackRight} y2={rowY - 8} />
          <line
            className="tuv-lane-base"
            x1={trackX}
            y1={rowY + rowH / 2}
            x2={trackRight}
            y2={rowY + rowH / 2}
          />

          {/* reorder hold band: TCP shades from the drop slot to its retransmit */}
          {hasDrop && isTcp && (() => {
            const stallX = xAt(plan.dropOriginalArrive);
            const endX = xAt(plan.dropOriginalArrive + RETRANSMIT_GAP);
            return (
              <rect
                className="tuv-stall-band"
                x={stallX}
                y={rowY - 6}
                width={Math.max(0, endX - stallX)}
                height={rowH + 12}
                rx={6}
              />
            );
          })()}

          {plan.packets.map((p) => {
            const x = xAt(p.arrive - PKT_UNITS);
            const delivered = !p.lost && clock >= p.arrive;
            const inFlight = !p.lost && clock >= p.arrive - PKT_UNITS && clock < p.arrive;
            return (
              <g key={`pkt-${p.k}`}>
                {(p.isDropTarget && (isTcp || p.lost)) && (
                  <>
                    <rect
                      className="tuv-pkt is-dropped"
                      x={xAt(p.baseArrive - PKT_UNITS)}
                      y={rowY + 6}
                      width={Math.max(4, pktW - 4)}
                      height={rowH - 12}
                      rx={6}
                    />
                    <line
                      className="tuv-drop-x"
                      x1={xAt(p.baseArrive - PKT_UNITS) + 5}
                      y1={rowY + 11}
                      x2={xAt(p.baseArrive - PKT_UNITS) + pktW - 9}
                      y2={rowY + rowH - 11}
                    />
                    <line
                      className="tuv-drop-x"
                      x1={xAt(p.baseArrive - PKT_UNITS) + pktW - 9}
                      y1={rowY + 11}
                      x2={xAt(p.baseArrive - PKT_UNITS) + 5}
                      y2={rowY + rowH - 11}
                    />
                  </>
                )}

                {!p.lost && (
                  <>
                    <rect
                      className={`tuv-pkt ${delivered ? 'is-delivered' : ''} ${inFlight ? 'is-inflight' : ''} ${p.stalled ? 'is-stalled' : ''} ${p.retransmit ? 'is-retx' : ''}`}
                      x={x}
                      y={rowY + 6}
                      width={Math.max(4, pktW - 4)}
                      height={rowH - 12}
                      rx={6}
                      style={{ '--tuv-hue': `var(${ACCENT_HUE})` }}
                    />
                    <text
                      className={`tuv-pkt-label ${delivered ? 'is-delivered' : ''}`}
                      x={x + (pktW - 4) / 2}
                      y={rowY + rowH / 2 + 4}
                      textAnchor="middle"
                    >
                      {p.retransmit ? 'rtx' : p.k + 1}
                    </text>
                  </>
                )}

                {p.lost && (
                  <text
                    className="tuv-lost-tag"
                    x={xAt(p.baseArrive - PKT_UNITS) + (pktW - 4) / 2}
                    y={rowY + rowH + 14}
                    textAnchor="middle"
                  >
                    lost
                  </text>
                )}
              </g>
            );
          })}

          {/* sweeping cursor */}
          <line
            className="tuv-cursor"
            x1={cursorX}
            y1={rowY - 18}
            x2={cursorX}
            y2={rowY + rowH + 26}
          />
          <text className="tuv-cursor-cap" x={cursorX} y={rowY - 22} textAnchor="middle">
            {modeLabel}
          </text>

          {/* total markers */}
          <text className="tuv-total-mark" x={xAt(cleanTotal)} y={H - 10} textAnchor="middle">
            {`no-loss finish = ${cleanTotal}u`}
          </text>
          {hasDrop && isTcp && extraLatency > 0 && (
            <>
              <line
                className="tuv-total-line is-tcp"
                x1={xAt(total)}
                y1={rowY - 8}
                x2={xAt(total)}
                y2={H - botPad + 4}
              />
              <text className="tuv-total-mark is-tcp" x={xAt(total)} y={H - 10} textAnchor="middle">
                {`TCP finish = ${total}u`}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="tuv-metrics">
        <div className="tuv-metric">
          <span className="tuv-metric-label">transport</span>
          <span className={`tuv-metric-value ${isTcp ? 'is-ok' : 'is-accent'}`}>
            {isTcp ? 'TCP (connection)' : 'UDP (connectionless)'}
          </span>
        </div>
        <div className="tuv-metric">
          <span className="tuv-metric-label">delivered / lost</span>
          <span className={`tuv-metric-value ${lostCount > 0 ? 'is-warn' : 'is-ok'}`}>
            {`${deliveredTotal} / ${lostCount} of ${PKT_COUNT}`}
          </span>
        </div>
        <div className="tuv-metric">
          <span className="tuv-metric-label">ordered &amp; reliable</span>
          <span className={`tuv-metric-value ${isTcp ? 'is-ok' : 'is-warn'}`}>
            {isTcp ? 'yes · yes' : 'no · no'}
          </span>
        </div>
        <div className="tuv-metric">
          <span className="tuv-metric-label">{isTcp ? 'extra latency cost' : 'packets lost for good'}</span>
          <span className={`tuv-metric-value ${isTcp ? (extraLatency > 0 ? 'is-warn' : 'is-ok') : (lostCount > 0 ? 'is-warn' : 'is-ok')}`}>
            {isTcp ? `+${extraLatency}u (retransmit)` : `${lostCount} (no retransmit)`}
          </span>
        </div>
        <div className="tuv-metric tuv-metric-dim">
          <span className="tuv-metric-label">tradeoff</span>
          <span className={`tuv-metric-value ${isTcp ? 'is-ok' : 'is-accent'}`}>
            {isTcp ? 'reliability over latency' : 'latency over reliability'}
          </span>
        </div>
        <div className="tuv-metric tuv-metric-dim">
          <span className="tuv-metric-label">arrived now</span>
          <span className="tuv-metric-value">
            {`${arrivedNow} in${lostNow > 0 ? ` · ${lostNow} lost` : ''}`}
          </span>
        </div>
      </div>

      <div className={`tuv-narration ${isTcp ? 'is-ok' : 'is-accent'}`}>
        <span className={`tuv-narration-label ${isTcp ? 'is-ok' : 'is-accent'}`}>
          {isTcp ? 'tcp — reliable' : 'udp — fast'}
        </span>
        <span className="tuv-narration-body">
          {!hasDrop
            ? 'No loss: every packet arrives in order and both transports finish at the same wall-clock time. Drop a packet to see where TCP and UDP diverge — TCP buys reliability with latency, UDP buys latency with loss.'
            : isTcp
              ? `TCP guarantees an ordered, complete byte stream. Packet ${dropIdx + 1} is lost, so the sender retransmits it (rtx) one RTT later and the receiver holds packets ${dropIdx + 2}–${PKT_COUNT} until the gap fills — so all ${PKT_COUNT} arrive in order, but the payload finishes +${extraLatency}u later. That is the price of reliability.`
              : `UDP just fires packets onto the wire. Packet ${dropIdx + 1} is lost and never comes back — no retransmit, no reorder hold — so the other ${PKT_COUNT - 1} keep their original schedule and arrive on time. The payload is incomplete (${lostCount} packet gone for good), but latency stays at the no-loss minimum.`}
        </span>
      </div>

      <div className="tuv-legend">
        <span className="tuv-legend-item"><ShieldCheck size={13} className="tuv-ic is-ok" /> TCP: retransmit + reorder = ordered, reliable</span>
        <span className="tuv-legend-item"><Zap size={13} className="tuv-ic is-accent" /> UDP: fire-and-forget = low latency, lossy</span>
        <span className="tuv-legend-item"><Ban size={13} className="tuv-ic is-fail" /> dropped packet — TCP resends it, UDP loses it</span>
        <span className="tuv-legend-item"><ListOrdered size={13} className="tuv-ic" /> rtx = retransmitted packet (TCP only)</span>
        <span className="tuv-legend-item"><Clock size={13} className="tuv-ic is-warn" /> shaded band = receiver holds to reorder (TCP)</span>
        <span className="tuv-legend-item"><ArrowRight size={13} className="tuv-ic" /> cursor sweeps the wall clock</span>
      </div>
    </div>
  );
}
