import React, { useMemo, useState } from 'react';
import { Waves } from 'lucide-react';
import './TcpCongestionControlViz.css';

const ALGOS = [
  { key: 'reno', label: 'Reno', hue: 'var(--hue-sky)', desc: 'AIMD: +1 MSS/RTT, halve on loss. Linear recovery underutilizes high-BDP paths.' },
  { key: 'cubic', label: 'CUBIC', hue: 'var(--accent)', desc: 'Cubic curve anchored at last W_max. RTT-independent, aggressive far from W_max, plateaus near it. Linux default.' },
  { key: 'bbr', label: 'BBR', hue: 'var(--hue-violet)', desc: 'Models BtlBw × RTprop, paces at bottleneck bandwidth. Ignores loss; reacts to queueing (RTT growth).' },
];

const RTTS = 80; // x axis ticks
const LOSS_AT = 28;

function renoSeries(loss) {
  const w = [];
  let cwnd = 2;
  let ss = true;
  let ssthresh = 64;
  for (let t = 0; t < RTTS; t += 1) {
    if (loss && t === LOSS_AT) { cwnd = Math.max(2, cwnd / 2); ssthresh = cwnd; ss = false; }
    w.push(cwnd);
    if (ss && cwnd < ssthresh) cwnd *= 1.6; else { ss = false; cwnd += 1; }
    cwnd = Math.min(cwnd, 70);
  }
  return w;
}
function cubicSeries(loss) {
  const w = [];
  const C = 0.0009;
  let wmax = 64;
  let lastLoss = -18;
  let cur = 6;
  for (let t = 0; t < RTTS; t += 1) {
    if (loss && t === LOSS_AT) { wmax = cur; lastLoss = t; cur = cur * 0.8; }
    const K = Math.cbrt((wmax * 0.3) / C);
    const val = C * Math.pow((t - lastLoss) - K, 3) + wmax;
    cur = Math.max(4, Math.min(70, val));
    w.push(cur);
  }
  return w;
}
function bbrSeries() {
  // BBR paces at BtlBw; minor probe-bandwidth oscillation, loss-insensitive.
  const w = [];
  const btl = 58;
  for (let t = 0; t < RTTS; t += 1) {
    if (t < 8) { w.push(4 + t * 7); continue; }
    const probe = Math.sin(t / 6) * 4;
    w.push(Math.min(70, btl + probe));
  }
  return w;
}

export default function TcpCongestionControlViz() {
  const [loss, setLoss] = useState(true);
  const [active, setActive] = useState({ reno: true, cubic: true, bbr: true });

  const series = useMemo(() => ({
    reno: renoSeries(loss),
    cubic: cubicSeries(loss),
    bbr: bbrSeries(),
  }), [loss]);

  const W = 920;
  const H = 320;
  const padL = 50;
  const padR = 18;
  const padT = 22;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const yMax = 74;

  const xOf = (t) => padL + (t / (RTTS - 1)) * plotW;
  const yOf = (v) => padT + plotH - (v / yMax) * plotH;
  const path = (arr) => arr.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');

  const toggle = (k) => setActive((a) => ({ ...a, [k]: !a[k] }));

  // throughput proxy = average cwnd over window
  const avg = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;

  return (
    <div className="tcv">
      <div className="tcv-head">
        <h3 className="tcv-title"><Waves size={18} className="tcv-ticon" /> Congestion control — Reno vs CUBIC vs BBR</h3>
        <p className="tcv-sub">
          Congestion window (cwnd) over round trips on a high-BDP path. Reno sawtooths and recovers slowly; CUBIC&apos;s cubic curve refills fast; BBR paces at the bottleneck and shrugs off loss. Toggle a loss event and each algorithm.
        </p>
      </div>

      <div className="tcv-controls">
        <div className="tcv-algos">
          {ALGOS.map((a) => (
            <button key={a.key} type="button" className={`tcv-algo ${active[a.key] ? 'tcv-algo-on' : ''}`} onClick={() => toggle(a.key)}>
              <span className="tcv-swatch" style={{ background: a.hue, opacity: active[a.key] ? 1 : 0.3 }} />{a.label}
            </button>
          ))}
        </div>
        <div className="tcv-toggle">
          <button type="button" className={`tcv-tg ${loss ? 'tcv-tg-on' : ''}`} onClick={() => setLoss(true)}>loss event</button>
          <button type="button" className={`tcv-tg ${!loss ? 'tcv-tg-on' : ''}`} onClick={() => setLoss(false)}>clean path</button>
        </div>
      </div>

      <div className="tcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tcv-svg" preserveAspectRatio="xMidYMid meet">
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border)" strokeWidth={1.2} />
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth={1.2} />
          <text x={16} y={padT + plotH / 2} className="tcv-axis" transform={`rotate(-90 16 ${padT + plotH / 2})`} style={{ textAnchor: 'middle' }}>cwnd (MSS)</text>
          <text x={padL + plotW / 2} y={H - 6} className="tcv-axis" style={{ textAnchor: 'middle' }}>round trips →</text>

          {loss && (
            <g>
              <line x1={xOf(LOSS_AT)} y1={padT} x2={xOf(LOSS_AT)} y2={padT + plotH} stroke="var(--hard)" strokeWidth={1.4} strokeDasharray="4 3" opacity={0.7} />
              <text x={xOf(LOSS_AT) + 6} y={padT + 14} className="tcv-loss">packet loss</text>
            </g>
          )}

          {ALGOS.map((a) => active[a.key] && (
            <polyline key={a.key} points={path(series[a.key])} fill="none" stroke={a.hue} strokeWidth={2.6} opacity={0.92} />
          ))}
        </svg>
      </div>

      <div className="tcv-cards">
        {ALGOS.map((a) => (
          <div key={a.key} className={`tcv-card ${active[a.key] ? '' : 'tcv-card-off'}`}>
            <div className="tcv-card-head">
              <span className="tcv-swatch" style={{ background: a.hue }} />
              <span className="tcv-card-name">{a.label}</span>
              <span className="tcv-card-tput">avg cwnd {Math.round(avg(series[a.key]))}</span>
            </div>
            <p className="tcv-card-desc">{a.desc}</p>
          </div>
        ))}
      </div>

      <div className="tcv-trace">
        <span className="tcv-trace-label">read-off</span>
        <span className="tcv-trace-val">
          {loss
            ? 'After loss: Reno halves and crawls back at +1/RTT (minutes on a 1Gbps×100ms path). CUBIC dips then refills along its cubic curve. BBR barely notices — it keys on queueing delay, not loss.'
            : 'Clean path: Reno still sawtooths from its periodic probing; CUBIC climbs to capacity and plateaus; BBR locks onto the bottleneck bandwidth and holds steady with small bandwidth-probe oscillations.'}
        </span>
      </div>
    </div>
  );
}
