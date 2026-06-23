import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, ChevronRight, RotateCcw, Activity, Zap, AlertTriangle } from 'lucide-react';
import './SlowstartTcpViz.css';

const W = 880;
const H = 380;
const LEFT = 46;
const RIGHT = 20;
const TOP = 24;
const BOT = 40;
const PLOT_W = W - LEFT - RIGHT;
const PLOT_H = H - TOP - BOT;

// Build the cwnd trajectory deterministically.
// Slow start (x2 per RTT) until ssthresh -> congestion avoidance (+1/RTT).
// Two loss styles: timeout (cwnd->1, restart slow start) and 3-dup-ACK (cwnd->ssthresh).
function trajectory(initSsthresh) {
  const pts = [];
  let cwnd = 1;
  let ssthresh = initSsthresh;
  const loss = { 9: 'timeout', 20: 'dupack' };
  for (let rtt = 0; rtt <= 30; rtt++) {
    const phase = cwnd < ssthresh ? 'slow-start' : 'congestion-avoidance';
    const event = loss[rtt] || null;
    pts.push({ rtt, cwnd, ssthresh, phase, event });
    if (event) {
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = event === 'timeout' ? 1 : ssthresh;
    } else if (cwnd < ssthresh) {
      cwnd = cwnd * 2;
    } else {
      cwnd = cwnd + 1;
    }
  }
  return pts;
}

export default function SlowstartTcpViz() {
  const [ssthresh0, setSsthresh0] = useState(16);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const pts = useMemo(() => trajectory(ssthresh0), [ssthresh0]);
  const maxCwnd = useMemo(() => Math.max(...pts.map((p) => p.cwnd)) + 2, [pts]);
  const maxRtt = pts.length - 1;
  const total = pts.length;
  const cur = pts[Math.min(step, total - 1)];
  const isPlaying = playing && step < total - 1;

  const sx = (rtt) => LEFT + (rtt / maxRtt) * PLOT_W;
  const sy = (c) => TOP + (1 - c / maxCwnd) * PLOT_H;

  useEffect(() => {
    if (!isPlaying) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), 380);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [isPlaying, step, total]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const shown = pts.slice(0, step + 1);
  const linePts = shown.map((p) => `${sx(p.rtt).toFixed(1)},${sy(p.cwnd).toFixed(1)}`);
  const ssthreshPts = shown.map((p) => `${sx(p.rtt).toFixed(1)},${sy(p.ssthresh).toFixed(1)}`);

  const reset = () => { setPlaying(false); setStep(0); };
  const changeSsthresh = (v) => { setPlaying(false); setStep(0); setSsthresh0(v); };

  const yTicks = [];
  for (let v = 0; v <= maxCwnd; v += Math.max(2, Math.ceil(maxCwnd / 8 / 2) * 2)) yTicks.push(v);

  const phaseLabel = cur.event
    ? (cur.event === 'timeout' ? 'loss · timeout' : 'loss · 3 dup ACKs')
    : cur.phase === 'slow-start' ? 'slow start (×2 / RTT)' : 'congestion avoidance (+1 / RTT)';

  const note = cur.event === 'timeout'
    ? 'Timeout — the worst signal. The sender assumes the network is badly congested: ssthresh drops to half of cwnd and cwnd crashes back to 1, restarting slow start from scratch.'
    : cur.event === 'dupack'
      ? 'Three duplicate ACKs — a milder loss signal. Fast retransmit + fast recovery cut cwnd to ssthresh and resume congestion avoidance directly, skipping the slow-start crawl.'
      : cur.phase === 'slow-start'
        ? 'Slow start: cwnd doubles every RTT, probing for spare capacity exponentially until it reaches ssthresh.'
        : 'Congestion avoidance: past ssthresh, cwnd grows by just one MSS per RTT — additive increase, gently testing the ceiling.';

  return (
    <div className="sstcp">
      <div className="sstcp-head">
        <span className="sstcp-head-icon"><Activity size={16} /></span>
        <span className="sstcp-head-text">
          <span className="sstcp-head-title">TCP congestion window over time</span>
          <span className="sstcp-head-sub">
            step the RTTs — watch cwnd ramp exponentially, level off, then collapse on loss
          </span>
        </span>
        <span className="sstcp-chip">cwnd = {cur.cwnd} MSS</span>
      </div>

      <div className="sstcp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="sstcp-svg" preserveAspectRatio="xMidYMid meet">
          {/* grid + y ticks */}
          {yTicks.map((v) => (
            <g key={`y-${v}`}>
              <line x1={LEFT} y1={sy(v)} x2={LEFT + PLOT_W} y2={sy(v)} stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
              <text x={LEFT - 8} y={sy(v) + 3} className="sstcp-tick" textAnchor="end">{v}</text>
            </g>
          ))}
          <text x={14} y={TOP + 4} className="sstcp-axis">cwnd</text>
          <text x={LEFT + PLOT_W} y={H - 8} className="sstcp-axis" textAnchor="end">round-trip times</text>

          {/* ssthresh dashed line */}
          {ssthreshPts.length > 1 && (
            <polyline points={ssthreshPts.join(' ')} fill="none" stroke="var(--hue-pink)" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.8" />
          )}

          {/* phase-shaded segments under the curve */}
          {shown.map((p, i) => {
            if (i === 0) return null;
            const prev = shown[i - 1];
            const tone = prev.phase === 'slow-start' ? 'var(--accent)' : 'var(--hue-violet)';
            return (
              <line key={`seg-${i}`} x1={sx(prev.rtt)} y1={sy(prev.cwnd)} x2={sx(p.rtt)} y2={sy(p.cwnd)} stroke={tone} strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
            );
          })}

          {/* main cwnd line */}
          {linePts.length > 1 && (
            <polyline points={linePts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* loss markers */}
          {shown.filter((p) => p.event).map((p) => (
            <g key={`loss-${p.rtt}`}>
              <line x1={sx(p.rtt)} y1={TOP} x2={sx(p.rtt)} y2={TOP + PLOT_H} stroke="var(--hard)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={sx(p.rtt)} cy={sy(p.cwnd)} r="5.5" fill="var(--hard)" />
            </g>
          ))}

          {/* current head dot */}
          <circle cx={sx(cur.rtt)} cy={sy(cur.cwnd)} r="11" fill="rgba(var(--accent-rgb),0.16)" />
          <circle cx={sx(cur.rtt)} cy={sy(cur.cwnd)} r="5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="sstcp-cards">
        <div className="sstcp-card sstcp-card-accent">
          <span className="sstcp-card-label">cwnd</span>
          <span className="sstcp-card-val">{cur.cwnd} MSS</span>
        </div>
        <div className="sstcp-card sstcp-card-pink">
          <span className="sstcp-card-label">ssthresh</span>
          <span className="sstcp-card-val">{cur.ssthresh} MSS</span>
        </div>
        <div className="sstcp-card sstcp-card-violet">
          <span className="sstcp-card-label">phase</span>
          <span className="sstcp-card-val">{phaseLabel}</span>
        </div>
        <div className="sstcp-card">
          <span className="sstcp-card-label">RTT</span>
          <span className="sstcp-card-val">{cur.rtt} / {maxRtt}</span>
        </div>
      </div>

      <div className="sstcp-controls">
        <label className="sstcp-slider">
          <span className="sstcp-slider-label"><Zap size={13} /> initial ssthresh</span>
          <input type="range" min={4} max={32} step={2} value={ssthresh0} onChange={(e) => changeSsthresh(Number(e.target.value))} />
          <span className="sstcp-slider-val">{ssthresh0}</span>
        </label>
        <span className="sstcp-spacer" />
        <button type="button" className="sstcp-btn sstcp-btn-primary" onClick={() => (step >= total - 1 ? reset() : setPlaying((v) => !v))}>
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? 'Pause' : step >= total - 1 ? 'Replay' : 'Play'}
        </button>
        <button type="button" className="sstcp-btn" onClick={() => setStep((s) => Math.min(s + 1, total - 1))} disabled={step >= total - 1}>
          <ChevronRight size={14} /> Step
        </button>
        <button type="button" className="sstcp-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="sstcp-narration">
        <span className="sstcp-narration-label">
          {cur.event ? <AlertTriangle size={12} /> : null} RTT {cur.rtt}
        </span>
        <span className="sstcp-narration-body">{note}</span>
      </div>
    </div>
  );
}
