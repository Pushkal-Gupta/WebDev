import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GitCompareArrows, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 320;
const LEFT = 40;
const RIGHT = 16;
const TOP = 20;
const BOT = 30;
const PLOT_W = W - LEFT - RIGHT;
const PLOT_H = H - TOP - BOT;

const LABELS = ['A', 'B', 'C', 'D', 'E'];
const N = LABELS.length;
// fixed reference distribution P (sums to 1)
const P0 = [0.05, 0.15, 0.4, 0.3, 0.1];
// editable raw weights for Q (auto-renormalized)
const Q0 = [0.25, 0.25, 0.2, 0.2, 0.1];
const EPS = 1e-9;

function renorm(raw) {
  const s = raw.reduce((a, b) => a + b, 0) || 1;
  return raw.map((v) => v / s);
}

function klBits(p, q) {
  // sum p * log2(p/q), per-bucket contributions returned too
  const per = p.map((pi, i) => {
    if (pi <= EPS) return 0;
    const qi = Math.max(q[i], EPS);
    return pi * Math.log2(pi / qi);
  });
  return { per, total: per.reduce((a, b) => a + b, 0) };
}

function fmt(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

export default function KLDivergenceExplorerViz() {
  const [qRaw, setQRaw] = useState(Q0.slice());
  const [showReverse, setShowReverse] = useState(false);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const P = P0;
  const Q = useMemo(() => renorm(qRaw), [qRaw]);

  const fwd = useMemo(() => klBits(P, Q), [P, Q]);
  const rev = useMemo(() => klBits(Q, P), [P, Q]);

  // bucket that contributes the most to forward KL
  const domIdx = useMemo(() => {
    let best = 0;
    let bestV = -Infinity;
    fwd.per.forEach((v, i) => {
      if (v > bestV) {
        bestV = v;
        best = i;
      }
    });
    return best;
  }, [fwd.per]);

  const maxProb = 0.6;
  const slotW = PLOT_W / N;
  const barW = slotW * 0.32;
  const yOf = (prob) => TOP + (1 - Math.min(prob, maxProb) / maxProb) * PLOT_H;
  const base = TOP + PLOT_H;

  const updateBar = useCallback(
    (idx, clientY) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const ratio = (clientY - rect.top) / rect.height;
      const svgY = ratio * H;
      let prob = (1 - (svgY - TOP) / PLOT_H) * maxProb;
      prob = Math.max(0.01, Math.min(maxProb, prob));
      setQRaw((prev) => {
        const next = prev.slice();
        next[idx] = prob;
        return next;
      });
    },
    []
  );

  const onPointerDown = useCallback(
    (idx) => (e) => {
      dragRef.current = idx;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateBar(idx, e.clientY);
    },
    [updateBar]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (dragRef.current === null) return;
      updateBar(dragRef.current, e.clientY);
    },
    [updateBar]
  );
  const onPointerUp = useCallback((e) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setQRaw(Q0.slice());
    setShowReverse(false);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'y 0.08s ease, height 0.08s ease';

  const gradP = 'klx-grad-p';
  const gradQ = 'klx-grad-q';

  const activeTotal = showReverse ? rev.total : fwd.total;
  const activePer = showReverse ? rev.per : fwd.per;
  const maxPer = Math.max(EPS, ...activePer.map((v) => Math.abs(v)));

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <GitCompareArrows size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">KL divergence explorer</span>
          <span className="aev-head-sub">
            drag the Q bars — watch the wasted-bits penalty per bucket and the running KL
          </span>
        </span>
        <span className="aev-chip">{fmt(activeTotal)} bits</span>
      </div>

      <div className="aev-toggles">
        <button
          type="button"
          className={`mlviz-toggle${!showReverse ? ' is-on' : ''}`}
          onClick={() => setShowReverse(false)}
          style={{ '--toggle-color': 'var(--accent)' }}
        >
          <span className="mlviz-toggle-dot" />
          KL(P‖Q)
        </button>
        <button
          type="button"
          className={`mlviz-toggle${showReverse ? ' is-on' : ''}`}
          onClick={() => setShowReverse(true)}
          style={{ '--toggle-color': 'var(--hue-pink)' }}
        >
          <span className="mlviz-toggle-dot" />
          KL(Q‖P) — reverse
        </button>
      </div>

      <div className="aev-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <linearGradient id={gradP} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--hue-sky)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--hue-sky)" />
              </linearGradient>
              <linearGradient id={gradQ} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--hue-violet)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </linearGradient>
            </defs>

            <line x1={LEFT} y1={base} x2={LEFT + PLOT_W} y2={base} stroke="var(--border)" strokeWidth="1" />

            {LABELS.map((lab, i) => {
              const cx = LEFT + slotW * (i + 0.5);
              const pProb = P[i];
              const qProb = Q[i];
              const pY = yOf(pProb);
              const qY = yOf(qProb);
              const contrib = activePer[i];
              const isDom = i === domIdx && !showReverse;
              // per-bucket contribution intensity strip above bars
              const strip = Math.min(1, Math.abs(contrib) / maxPer);
              return (
                <g key={lab}>
                  {/* contribution heat band */}
                  <rect
                    x={cx - slotW * 0.42}
                    y={TOP - 14}
                    width={slotW * 0.84}
                    height={8}
                    rx={2}
                    fill={contrib >= 0 ? 'var(--warning)' : 'var(--hue-mint)'}
                    opacity={0.12 + 0.6 * strip}
                  />
                  {/* P bar */}
                  <rect
                    x={cx - barW - 2}
                    y={pY}
                    width={barW}
                    height={base - pY}
                    rx={2}
                    fill={`url(#${gradP})`}
                    opacity="0.92"
                  />
                  {/* Q bar (draggable) */}
                  <rect
                    x={cx + 2}
                    y={qY}
                    width={barW}
                    height={base - qY}
                    rx={2}
                    fill={`url(#${gradQ})`}
                    opacity="0.92"
                    style={{ transition: trans }}
                  />
                  {/* Q drag handle */}
                  <rect
                    x={cx + 2 - 4}
                    y={qY - 6}
                    width={barW + 8}
                    height={12}
                    rx={3}
                    fill="var(--hue-violet)"
                    opacity="0.9"
                    style={{ cursor: 'ns-resize', transition: trans }}
                    onPointerDown={onPointerDown(i)}
                  />
                  {isDom && (
                    <rect
                      x={cx - slotW * 0.46}
                      y={TOP - 2}
                      width={slotW * 0.92}
                      height={base - TOP + 2}
                      rx={4}
                      fill="none"
                      stroke="var(--warning)"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      opacity="0.8"
                    />
                  )}
                  <text
                    x={cx}
                    y={base + 18}
                    fontSize="9"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    {lab}
                  </text>
                  <text
                    x={cx}
                    y={TOP - 4}
                    fontSize="7.5"
                    fill={contrib >= 0 ? 'var(--warning)' : 'var(--hue-mint)'}
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    {contrib >= 0 ? '+' : ''}
                    {fmt(contrib, 2)}
                  </text>
                </g>
              );
            })}

            {/* legend */}
            <rect x={LEFT} y={TOP - 16} width={10} height={6} rx={1} fill="var(--hue-sky)" />
            <text x={LEFT + 14} y={TOP - 10} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
              P (fixed)
            </text>
            <rect x={LEFT + 64} y={TOP - 16} width={10} height={6} rx={1} fill="var(--hue-violet)" />
            <text x={LEFT + 78} y={TOP - 10} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
              Q (drag)
            </text>

            <text x={LEFT - 6} y={base} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
              0
            </text>
            <text x={LEFT - 6} y={TOP + 6} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
              {maxProb}
            </text>
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">KL(P‖Q)</span>
            <span className="mlviz-statcard-val">{fmt(fwd.total)}</span>
            <span className="mlviz-statcard-sub">bits wasted</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">KL(Q‖P)</span>
            <span className="mlviz-statcard-val">{fmt(rev.total)}</span>
            <span className="mlviz-statcard-sub">reverse ≠ forward</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">dominant bucket</span>
            <span className="mlviz-statcard-val">{LABELS[domIdx]}</span>
            <span className="mlviz-statcard-sub">{fmt(fwd.per[domIdx], 2)} of total</span>
          </div>
          <div className="aev-expr">Σ {showReverse ? 'q' : 'p'}·log({showReverse ? 'q/p' : 'p/q'})</div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
        <div className="mlviz-hint">
          KL ≥ 0, zero only when Q = P · drag Q to undershoot a bucket P weighs heavily → its penalty spikes
        </div>
      </div>
    </div>
  );
}
