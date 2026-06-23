import React, { useMemo, useState } from 'react';
import { Activity, Zap, TrendingUp, AlertTriangle, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import './TcpCongestionViz.css';

// TCP congestion control — how cwnd (the congestion window) evolves per RTT.
//
// SLOW START: cwnd doubles each RTT (exponential) until it hits ssthresh.
// CONGESTION AVOIDANCE: above ssthresh, cwnd grows +1 MSS per RTT (linear).
// LOSS via triple-dup-ACK -> fast recovery: ssthresh = cwnd/2, cwnd = ssthresh
//   (multiplicative decrease), then resume linear growth.
// LOSS via timeout: ssthresh = cwnd/2, cwnd resets to 1, back to slow start.
//
// We simulate one RTT per step from a fixed initial state — deterministic.

const INIT = { cwnd: 1, ssthresh: 16, rtt: 0, phase: 'slow-start' };

function stepCwnd(state) {
  const { cwnd, ssthresh, rtt } = state;
  let nextCwnd;
  let phase;
  if (cwnd < ssthresh) {
    nextCwnd = cwnd * 2;
    phase = 'slow-start';
    if (nextCwnd >= ssthresh) {
      nextCwnd = ssthresh;
      phase = 'congestion-avoidance';
    }
  } else {
    nextCwnd = cwnd + 1;
    phase = 'congestion-avoidance';
  }
  return { cwnd: nextCwnd, ssthresh, rtt: rtt + 1, phase, event: 'grow' };
}

function applyLoss(state, mode) {
  const newSsthresh = Math.max(2, Math.floor(state.cwnd / 2));
  if (mode === 'timeout') {
    return { cwnd: 1, ssthresh: newSsthresh, rtt: state.rtt + 1, phase: 'slow-start', event: 'timeout' };
  }
  return { cwnd: newSsthresh, ssthresh: newSsthresh, rtt: state.rtt + 1, phase: 'fast-recovery', event: 'fast-retransmit' };
}

const PHASE_LABEL = {
  'slow-start': 'Slow start',
  'congestion-avoidance': 'Congestion avoidance',
  'fast-recovery': 'Fast recovery',
};
const PHASE_TAG = {
  'slow-start': 'var(--hue-sky)',
  'congestion-avoidance': 'var(--hue-mint)',
  'fast-recovery': 'var(--warning)',
};

export default function TcpCongestionViz() {
  const [history, setHistory] = useState([{ ...INIT, event: 'init' }]);
  const [lossMode, setLossMode] = useState('triple-dup');

  const cur = history[history.length - 1];

  const reset = () => {
    setHistory([{ ...INIT, event: 'init' }]);
    setLossMode('triple-dup');
  };

  const stepRtt = () => {
    setHistory((h) => {
      if (h.length > 26) return h;
      return [...h, stepCwnd(h[h.length - 1])];
    });
  };

  const stepBack = () => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };

  const injectLoss = () => {
    setHistory((h) => {
      if (h.length > 26) return h;
      return [...h, applyLoss(h[h.length - 1], lossMode === 'timeout' ? 'timeout' : 'triple-dup')];
    });
  };

  // SVG geometry — a cwnd-vs-RTT line chart (horizontal time axis allowed).
  const W = 940;
  const H = 420;
  const padL = 56;
  const padR = 24;
  const padT = 28;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxRtt = Math.max(12, history.length - 1);
  const maxCwnd = useMemo(() => {
    const peak = Math.max(...history.map((s) => s.cwnd), cur.ssthresh, 18);
    return Math.ceil((peak + 2) / 4) * 4;
  }, [history, cur.ssthresh]);

  const xFor = (rtt) => padL + (rtt / maxRtt) * plotW;
  const yFor = (cwnd) => padT + plotH - (cwnd / maxCwnd) * plotH;

  const points = history.map((s, i) => ({ x: xFor(i), y: yFor(s.cwnd), s, i }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const yTicks = [];
  for (let v = 0; v <= maxCwnd; v += 4) yTicks.push(v);
  const xTicks = [];
  for (let v = 0; v <= maxRtt; v += 2) xTicks.push(v);

  const lastEvent = cur.event;

  return (
    <div className="tcv">
      <div className="tcv-head">
        <h3 className="tcv-title">TCP congestion control — cwnd across round trips</h3>
        <p className="tcv-sub">
          The congestion window doubles each RTT during slow start, then climbs linearly once past ssthresh.
          A loss halves the threshold; a timeout collapses cwnd to 1. Step the RTTs and inject a loss to watch.
        </p>
      </div>

      <div className="tcv-controls">
        <button type="button" className="tcv-btn" onClick={stepBack} disabled={history.length <= 1}>
          <ChevronLeft size={14} /> Back
        </button>
        <button type="button" className="tcv-btn tcv-btn-primary" onClick={stepRtt} disabled={history.length > 26}>
          Step RTT <ChevronRight size={14} />
        </button>
        <button type="button" className="tcv-btn tcv-btn-loss" onClick={injectLoss} disabled={history.length > 26}>
          <AlertTriangle size={14} /> Inject loss
        </button>
        <div className="tcv-seg">
          <button
            type="button"
            className={`tcv-seg-btn ${lossMode === 'triple-dup' ? 'is-active' : ''}`}
            onClick={() => setLossMode('triple-dup')}
          >
            triple-dup ACK
          </button>
          <button
            type="button"
            className={`tcv-seg-btn ${lossMode === 'timeout' ? 'is-active' : ''}`}
            onClick={() => setLossMode('timeout')}
          >
            timeout
          </button>
        </div>
        <span className="tcv-spacer" aria-hidden="true" />
        <button type="button" className="tcv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="tcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="tcv-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + y ticks */}
          {yTicks.map((v) => (
            <g key={`y-${v}`}>
              <line className="tcv-grid" x1={padL} y1={yFor(v)} x2={W - padR} y2={yFor(v)} />
              <text className="tcv-tick" x={padL - 10} y={yFor(v) + 3.5} textAnchor="end">{v}</text>
            </g>
          ))}
          {xTicks.map((v) => (
            <text key={`x-${v}`} className="tcv-tick" x={xFor(v)} y={H - padB + 18} textAnchor="middle">{v}</text>
          ))}

          {/* ssthresh line */}
          <line className="tcv-ssthresh" x1={padL} y1={yFor(cur.ssthresh)} x2={W - padR} y2={yFor(cur.ssthresh)} />
          <text className="tcv-ssthresh-label" x={W - padR} y={yFor(cur.ssthresh) - 6} textAnchor="end">
            ssthresh = {cur.ssthresh}
          </text>

          {/* axis labels */}
          <text className="tcv-axis-label" x={padL - 40} y={padT + plotH / 2} transform={`rotate(-90 ${padL - 40} ${padT + plotH / 2})`} textAnchor="middle">
            cwnd (MSS)
          </text>
          <text className="tcv-axis-label" x={padL + plotW / 2} y={H - 8} textAnchor="middle">round trips (RTT)</text>

          {/* area under the curve */}
          {points.length > 1 && (
            <path
              className="tcv-area"
              d={`${linePath} L ${points[points.length - 1].x.toFixed(1)} ${yFor(0)} L ${points[0].x.toFixed(1)} ${yFor(0)} Z`}
              fill="url(#tcv-area-grad)"
            />
          )}

          {/* the cwnd line */}
          <path className="tcv-line" d={linePath} fill="none" />

          {/* points colored by phase */}
          {points.map((p) => {
            const isLoss = p.s.event === 'timeout' || p.s.event === 'fast-retransmit';
            const tag = isLoss ? 'var(--hard)' : PHASE_TAG[p.s.phase];
            return (
              <g key={`pt-${p.i}`}>
                <circle className="tcv-pt" cx={p.x} cy={p.y} r={p.i === points.length - 1 ? 6 : 3.6} style={{ fill: tag }} />
                {isLoss && (
                  <text className="tcv-loss-mark" x={p.x} y={p.y - 11} textAnchor="middle">
                    {p.s.event === 'timeout' ? 'timeout' : 'loss'}
                  </text>
                )}
              </g>
            );
          })}

          {/* current value chip */}
          <text className="tcv-cur" x={points[points.length - 1].x} y={points[points.length - 1].y - 14} textAnchor="middle">
            cwnd {cur.cwnd}
          </text>
        </svg>
      </div>

      <div className="tcv-metrics">
        <div className="tcv-metric">
          <span className="tcv-metric-label">cwnd</span>
          <span className="tcv-metric-value"><Activity size={12} /> {cur.cwnd} MSS</span>
        </div>
        <div className="tcv-metric">
          <span className="tcv-metric-label">ssthresh</span>
          <span className="tcv-metric-value">{cur.ssthresh} MSS</span>
        </div>
        <div className="tcv-metric">
          <span className="tcv-metric-label">phase</span>
          <span className="tcv-metric-value" style={{ color: PHASE_TAG[cur.phase] }}>
            {cur.phase === 'slow-start' ? <Zap size={12} /> : <TrendingUp size={12} />} {PHASE_LABEL[cur.phase]}
          </span>
        </div>
        <div className="tcv-metric">
          <span className="tcv-metric-label">RTT count</span>
          <span className="tcv-metric-value">{cur.rtt}</span>
        </div>
        <div className="tcv-metric">
          <span className="tcv-metric-label">last event</span>
          <span className="tcv-metric-value">{lastEvent}</span>
        </div>
      </div>

      <div className="tcv-narration">
        <span className="tcv-narration-label">why it matters</span>
        <span className="tcv-narration-body">
          Slow start probes capacity fast (exponential) so a new connection isn't crawling; congestion avoidance
          then creeps up linearly to gently test for more room. A triple-duplicate ACK signals isolated loss —
          the network still flows — so cwnd only halves (fast recovery). A timeout means the pipe likely stalled,
          so cwnd collapses to 1 and slow start restarts. This additive-increase / multiplicative-decrease loop
          is what lets millions of flows share a link fairly without a central controller.
        </span>
      </div>
    </div>
  );
}
