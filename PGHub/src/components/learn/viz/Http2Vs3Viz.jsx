import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Network, Layers, Clock, Zap, Ban, ArrowRight, Flag,
} from 'lucide-react';
import './Http2Vs3Viz.css';

// HTTP/2 over TCP vs HTTP/3 over QUIC, framed at the HTTP REQUEST level. A page
// load fires four concurrent requests, each multiplexed onto its own stream of
// one connection. Drop a packet on a chosen request and watch how far the stall
// spreads — and when the WHOLE PAGE finishes loading in each protocol:
//   HTTP/2 over TCP — every stream rides one ordered TCP byte stream. A lost
//     segment blocks delivery of every later byte to the browser, including
//     bytes for the OTHER requests. So one drop freezes all four requests until
//     the retransmit lands, and the page-load finish slips for everything.
//   HTTP/3 over QUIC — QUIC tracks each request's bytes independently over UDP.
//     A lost packet only stalls ITS request; the other three keep arriving, and
//     the page finishes far sooner.
// A wall clock sweeps left to right; the dropped packet retransmits after a
// fixed RTT gap so the stalled region is visible and the finish delta measurable.

const REQUESTS = [
  { label: 'GET /app.js', hue: '--hue-violet', dur: 12 },
  { label: 'GET /style.css', hue: '--hue-sky', dur: 8 },
  { label: 'GET /api/data', hue: '--hue-pink', dur: 14 },
  { label: 'GET /logo.png', hue: '--hue-mint', dur: 10 },
];
const STREAM_COUNT = REQUESTS.length;
const RETRANSMIT_GAP = 7;     // wall-clock units before a dropped packet retransmits
const DROP_FRACTION = 0.5;    // where along a request's bytes the loss happens
const TICK_MS = 100;

function streamId(i) {
  return i * 4 + 1;           // QUIC client-initiated bidirectional stream ids
}

// Build per-request finish times for both protocols.
// Without a drop, request i simply finishes at its own duration (all start at 0,
// multiplexed concurrently). With a drop on request `dropReq`, the loss happens
// partway through that request's bytes, at time dropAt = dur * DROP_FRACTION.
//   HTTP/3 (QUIC): only the dropped request waits RETRANSMIT_GAP — its finish
//     slides right by the gap; the other requests are untouched.
//   HTTP/2 (TCP): the single ordered byte stream stalls. Every byte that the
//     browser would have received at-or-after dropAt is held back by the gap,
//     so EVERY request whose finish is at-or-after dropAt slips by RETRANSMIT_GAP.
function buildPlan(http3, dropReq) {
  const hasDrop = dropReq >= 0 && dropReq < STREAM_COUNT;
  const dropAt = hasDrop ? REQUESTS[dropReq].dur * DROP_FRACTION : 0;

  const streams = REQUESTS.map((r, i) => {
    const baseEnd = r.dur;
    let end = baseEnd;
    let stalled = false;
    let stallFrom = baseEnd;

    if (hasDrop) {
      if (http3) {
        if (i === dropReq) {
          end = baseEnd + RETRANSMIT_GAP;
          stalled = true;
          stallFrom = dropAt;
        }
      } else if (baseEnd >= dropAt) {
        // TCP: shared ordered byte stream — anything delivered at/after the loss
        // point is held back across all requests.
        end = baseEnd + RETRANSMIT_GAP;
        stalled = true;
        stallFrom = dropAt;
      }
    }

    return {
      i,
      label: r.label,
      hue: r.hue,
      dur: r.dur,
      baseEnd,
      end,
      stalled,
      stallFrom,
      isDropReq: hasDrop && i === dropReq,
      dropAt,
    };
  });

  const pageFinish = streams.reduce((m, s) => Math.max(m, s.end), 0);
  const total = pageFinish + 2;
  return { streams, pageFinish, total, dropAt, hasDrop };
}

export default function Http2Vs3Viz() {
  const [http3, setHttp3] = useState(false);
  const [dropReq, setDropReq] = useState(0);
  const [hasDrop, setHasDrop] = useState(true);
  const [speed, setSpeed] = useState(1.5);
  const [isRunning, setIsRunning] = useState(false);
  const [clock, setClock] = useState(0);

  const runTimer = useRef(null);

  const effDrop = hasDrop ? dropReq : -1;
  const plan = useMemo(() => buildPlan(http3, effDrop), [http3, effDrop]);
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
    setHttp3((v) => !v);
  };

  const dropOnReq = (i) => {
    setIsRunning(false);
    setClock(0);
    setHasDrop(true);
    setDropReq(i);
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

  // Finish times for both protocols, with and without the current drop, for the
  // readouts. Guard divisions against a zero baseline.
  const cleanFinish = useMemo(() => buildPlan(http3, -1).pageFinish, [http3]);
  const tcpFinish = useMemo(() => buildPlan(false, effDrop).pageFinish, [effDrop]);
  const quicFinish = useMemo(() => buildPlan(true, effDrop).pageFinish, [effDrop]);
  const pageFinish = plan.pageFinish;
  const stallCost = Math.max(0, pageFinish - cleanFinish);
  const stalledStreams = plan.streams.filter((s) => s.stalled).length;
  const finishedReqs = plan.streams.filter((s) => clock >= s.end).length;

  // SVG geometry — one row per request, the page-load timeline across the track.
  const W = 980;
  const labelW = 132;
  const trackX = labelW + 14;
  const trackRight = W - 80;     // room for the per-request finish tag
  const trackW = trackRight - trackX;
  const rowH = 36;
  const rowGap = 12;
  const topPad = 44;
  const botPad = 38;
  const H = topPad + STREAM_COUNT * (rowH + rowGap) - rowGap + botPad;

  const xAt = (t) => trackX + (t / safeTotal) * trackW;
  const cursorX = xAt(clock);

  const modeLabel = http3 ? 'HTTP/3 over QUIC' : 'HTTP/2 over TCP';
  const pageDone = clock >= pageFinish;

  return (
    <div className="h23v">
      <div className="h23v-head">
        <h3 className="h23v-title">HTTP/2 over TCP vs HTTP/3 over QUIC — when does the page finish?</h3>
        <p className="h23v-sub">
          A page load fires four requests, each on its own stream of one connection. Drop a packet on a
          request: over TCP the shared ordered byte stream freezes every request until the retransmit
          lands; over QUIC only the request that lost a packet waits, so the page finishes sooner.
        </p>
      </div>

      <div className="h23v-controls">
        <button
          type="button"
          className={`h23v-toggle ${http3 ? 'is-on' : ''}`}
          onClick={toggleMode}
          aria-pressed={http3}
          title="Switch between HTTP/2 over TCP and HTTP/3 over QUIC"
        >
          <Network size={14} /> {http3 ? 'HTTP/3 (QUIC)' : 'HTTP/2 (TCP)'}
        </button>

        <div className="h23v-droprow" role="group" aria-label="Drop a packet on a request">
          <span className="h23v-input-label">drop packet on</span>
          {REQUESTS.map((r, i) => (
            <button
              key={`drop-${r.label}`}
              type="button"
              className={`h23v-drop-btn ${hasDrop && dropReq === i ? 'is-on' : ''}`}
              onClick={() => dropOnReq(i)}
              style={{ '--h23v-hue': `var(${r.hue})` }}
              title={`Drop a packet on ${r.label}`}
            >
              R{i + 1}
            </button>
          ))}
          <button
            type="button"
            className={`h23v-drop-btn h23v-drop-clear ${!hasDrop ? 'is-on' : ''}`}
            onClick={clearDrop}
            title="No packet loss"
          >
            <Ban size={12} /> none
          </button>
        </div>

        <label className="h23v-speed">
          <span className="h23v-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h23v-range"
            aria-label="Playback speed"
          />
          <span className="h23v-range-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="h23v-spacer" aria-hidden="true" />

        <div className="h23v-buttons">
          <button type="button" className="h23v-btn h23v-btn-primary" onClick={play}>
            {isRunning && !done ? <Pause size={14} /> : <Play size={14} />}
            {isRunning && !done ? 'Pause' : (done ? 'Replay' : 'Load page')}
          </button>
          <button type="button" className="h23v-btn" onClick={resetClock}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="h23v-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="h23v-svg" preserveAspectRatio="xMidYMid meet">
          <text className="h23v-conn-label" x={trackX} y={20} textAnchor="start">
            {http3
              ? 'one QUIC connection over UDP — per-request byte tracking, independent delivery'
              : 'one TCP connection — single ordered byte stream, in-order delivery for every request'}
          </text>
          <text className="h23v-clock-label" x={trackRight} y={20} textAnchor="end">
            {`t = ${clock} / ${total}`}
          </text>

          <line className="h23v-axis" x1={trackX} y1={topPad - 8} x2={trackRight} y2={topPad - 8} />

          {/* stall shading: TCP shades the full grid from the loss point;
              QUIC shades only the dropped request's row. */}
          {hasDrop && (() => {
            const stallX = xAt(plan.dropAt);
            const stallW = Math.max(0, xAt(plan.dropAt + RETRANSMIT_GAP) - stallX);
            if (http3) {
              const y = topPad + dropReq * (rowH + rowGap);
              return (
                <rect
                  className="h23v-stall-band is-quic"
                  x={stallX}
                  y={y - 2}
                  width={stallW}
                  height={rowH + 4}
                  rx={5}
                />
              );
            }
            return (
              <rect
                className="h23v-stall-band is-tcp"
                x={stallX}
                y={topPad - 4}
                width={stallW}
                height={STREAM_COUNT * (rowH + rowGap) - rowGap + 8}
                rx={6}
              />
            );
          })()}

          {plan.streams.map((s) => {
            const y = topPad + s.i * (rowH + rowGap);
            const x0 = xAt(0);
            const xEnd = xAt(s.end);
            const progressed = Math.min(clock, s.end);
            const fillW = (progressed / safeTotal) * trackW;
            const isLive = clock > 0 && clock < s.end;
            const isDone = clock >= s.end;
            const dropX = xAt(s.dropAt);
            return (
              <g key={`row-${s.i}`}>
                <text className="h23v-lane-req" x={0} y={y + rowH / 2 - 3}>
                  {s.label}
                </text>
                <text
                  className={`h23v-lane-sid ${s.stalled ? 'is-stalled' : 'is-on'}`}
                  x={0}
                  y={y + rowH / 2 + 12}
                >
                  {s.stalled ? 'stalled' : (http3 ? `stream ${streamId(s.i)}` : `stream ${streamId(s.i)}`)}
                </text>

                {/* planned span to the finish */}
                <rect
                  className={`h23v-track ${s.stalled ? 'is-stalled' : ''}`}
                  x={x0}
                  y={y + 3}
                  width={Math.max(2, xEnd - x0)}
                  height={rowH - 6}
                  rx={6}
                  style={{ '--h23v-hue': `var(${s.hue})` }}
                />
                {/* delivered fill */}
                <rect
                  className={`h23v-fill ${isLive ? 'is-live' : ''} ${isDone ? 'is-done' : ''}`}
                  x={x0}
                  y={y + 3}
                  width={Math.max(0, fillW)}
                  height={rowH - 6}
                  rx={6}
                  style={{ '--h23v-hue': `var(${s.hue})` }}
                />

                {/* loss marker on the affected request(s) */}
                {s.stalled && (
                  <>
                    <line
                      className="h23v-drop-x a"
                      x1={dropX - 5}
                      y1={y + 7}
                      x2={dropX + 5}
                      y2={y + rowH - 7}
                    />
                    <line
                      className="h23v-drop-x b"
                      x1={dropX + 5}
                      y1={y + 7}
                      x2={dropX - 5}
                      y2={y + rowH - 7}
                    />
                  </>
                )}

                {/* per-request finish tag */}
                <text
                  className={`h23v-dur ${isDone ? 'is-done' : ''} ${s.stalled ? 'is-stalled' : ''}`}
                  x={trackRight + 8}
                  y={y + rowH / 2 + 4}
                  textAnchor="start"
                >
                  {`${s.end}u`}
                </text>
              </g>
            );
          })}

          {/* sweeping cursor */}
          <line
            className="h23v-cursor"
            x1={cursorX}
            y1={topPad - 14}
            x2={cursorX}
            y2={H - botPad + 10}
          />
          <text className="h23v-cursor-cap" x={cursorX} y={topPad - 18} textAnchor="middle">
            {modeLabel}
          </text>

          {/* no-loss baseline finish */}
          <text className="h23v-finish-mark" x={xAt(cleanFinish)} y={H - 22} textAnchor="middle">
            {`no-loss page = ${cleanFinish}u`}
          </text>

          {/* page-load finish marker for the active protocol */}
          <line
            className={`h23v-finish-line ${http3 ? 'is-quic' : 'is-tcp'}`}
            x1={xAt(pageFinish)}
            y1={topPad - 8}
            x2={xAt(pageFinish)}
            y2={H - botPad + 6}
          />
          <g
            className={`h23v-finish-flag ${http3 ? 'is-quic' : 'is-tcp'} ${pageDone ? 'is-reached' : ''}`}
            transform={`translate(${xAt(pageFinish)}, ${H - botPad + 14})`}
          >
            <circle r={9} />
            <Flag x={-5} y={-5} width={10} height={10} />
          </g>
          <text
            className={`h23v-finish-mark ${http3 ? 'is-quic' : 'is-tcp'}`}
            x={xAt(pageFinish)}
            y={H - 6}
            textAnchor="middle"
          >
            {`page loaded = ${pageFinish}u`}
          </text>
        </svg>
      </div>

      <div className="h23v-metrics">
        <div className="h23v-metric">
          <span className="h23v-metric-label">protocol</span>
          <span className={`h23v-metric-value ${http3 ? 'is-ok' : 'is-warn'}`}>
            {http3 ? 'HTTP/3' : 'HTTP/2'}
          </span>
        </div>
        <div className="h23v-metric">
          <span className="h23v-metric-label">transport</span>
          <span className={`h23v-metric-value ${http3 ? 'is-ok' : 'is-warn'}`}>
            {http3 ? 'QUIC / UDP' : 'TCP'}
          </span>
        </div>
        <div className="h23v-metric">
          <span className="h23v-metric-label">streams stalled by the drop</span>
          <span className={`h23v-metric-value ${stalledStreams > 1 ? 'is-warn' : (stalledStreams === 1 ? 'is-ok' : '')}`}>
            {hasDrop ? `${stalledStreams} / ${STREAM_COUNT}` : `0 / ${STREAM_COUNT}`}
          </span>
        </div>
        <div className="h23v-metric">
          <span className="h23v-metric-label">extra page-load cost</span>
          <span className={`h23v-metric-value ${stallCost > 0 ? (http3 ? 'is-ok' : 'is-warn') : ''}`}>
            {`+${stallCost}u`}
          </span>
        </div>
        <div className="h23v-metric h23v-metric-dim">
          <span className="h23v-metric-label">head-of-line scope</span>
          <span className={`h23v-metric-value ${http3 ? 'is-ok' : 'is-warn'}`}>
            {http3 ? 'per-stream only' : 'transport-wide'}
          </span>
        </div>
        <div className="h23v-metric h23v-metric-dim">
          <span className="h23v-metric-label">page loaded — TCP vs QUIC</span>
          <span className="h23v-metric-value">
            <span className="is-warn">{`${tcpFinish}u`}</span>
            {' / '}
            <span className="is-ok">{`${quicFinish}u`}</span>
            {hasDrop && tcpFinish !== quicFinish ? ` · QUIC −${tcpFinish - quicFinish}u` : ''}
          </span>
        </div>
        <div className="h23v-metric h23v-metric-dim">
          <span className="h23v-metric-label">requests finished now</span>
          <span className="h23v-metric-value">
            {`${finishedReqs} / ${STREAM_COUNT}`}
          </span>
        </div>
        <div className="h23v-metric h23v-metric-dim">
          <span className="h23v-metric-label">packet loss</span>
          <span className="h23v-metric-value">
            {hasDrop ? REQUESTS[dropReq].label : 'none'}
          </span>
        </div>
      </div>

      <div className={`h23v-narration ${http3 ? 'is-ok' : 'is-warn'}`}>
        <span className={`h23v-narration-label ${http3 ? 'is-ok' : 'is-warn'}`}>
          {http3 ? 'quic — isolated stall' : 'tcp — head-of-line'}
        </span>
        <span className="h23v-narration-body">
          {!hasDrop
            ? `No loss: all four requests deliver concurrently on one connection and the page finishes at the slowest single request (${cleanFinish}u) under both protocols. Drop a packet on any request to see where HTTP/2 and HTTP/3 diverge.`
            : http3
              ? `HTTP/3 tracks each request's bytes separately over QUIC. The lost packet on ${REQUESTS[dropReq].label} stalls only that one request while its retransmit travels; the other ${STREAM_COUNT - 1} keep arriving. The page still loads at ${pageFinish}u — just +${stallCost}u, confined to one stream. That is the head-of-line blocking QUIC removes.`
              : `HTTP/2 rides one ordered TCP byte stream, so the browser cannot accept any byte after the lost one until it is retransmitted — including bytes for the other requests. The single drop on ${REQUESTS[dropReq].label} freezes all ${stalledStreams} requests, pushing the page-load finish to ${pageFinish}u (+${stallCost}u). Switch to HTTP/3 and the same drop costs the page nothing extra beyond the one stalled stream.`}
        </span>
      </div>

      <div className="h23v-legend">
        <span className="h23v-legend-item"><Zap size={13} className="h23v-ic is-ok" /> HTTP/3 / QUIC: a drop stalls only its own request</span>
        <span className="h23v-legend-item"><Clock size={13} className="h23v-ic is-warn" /> HTTP/2 / TCP: a drop stalls every request</span>
        <span className="h23v-legend-item"><Ban size={13} className="h23v-ic is-fail" /> dropped packet — retransmitted after one RTT</span>
        <span className="h23v-legend-item"><Flag size={13} className="h23v-ic is-accent" /> page loaded = slowest request finishes</span>
        <span className="h23v-legend-item"><Layers size={13} className="h23v-ic" /> each request is one multiplexed stream</span>
        <span className="h23v-legend-item"><ArrowRight size={13} className="h23v-ic" /> cursor sweeps the wall clock</span>
      </div>
    </div>
  );
}
