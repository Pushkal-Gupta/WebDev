import React, { useCallback, useMemo, useRef, useState } from 'react';
import { RotateCcw, Move } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 420;
const PAD = 40;
const PANEL_W = 120;
const STAGE_W = W - PANEL_W - PAD;
const STAGE_H = H - PAD * 2;
const ORIGIN_X = PAD + STAGE_W / 2;
const ORIGIN_Y = PAD + STAGE_H / 2;
const UNIT = 70;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toScreen(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function fromScreen(sx, sy) {
  return { x: (sx - ORIGIN_X) / UNIT, y: -(sy - ORIGIN_Y) / UNIT };
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const ANCHOR_COLOR = 'var(--hue-sky)';
const POS_COLOR = 'var(--accent)';
const NEG_COLOR = 'var(--hue-pink)';

const SEED = 0x7172103;

function initialLayout() {
  const rng = mulberry32(SEED);
  // anchor in the middle-left, positive close to it, negative further away
  return {
    a: { x: -0.6, y: 0.4 + (rng() - 0.5) * 0.1 },
    p: { x: 0.4, y: 0.8 + (rng() - 0.5) * 0.1 },
    n: { x: 1.1, y: -0.7 + (rng() - 0.5) * 0.1 },
  };
}

export default function TripletLossViz() {
  const [points, setPoints] = useState(initialLayout);
  const [margin, setMargin] = useState(0.6);
  const [dragKey, setDragKey] = useState(null);
  const svgRef = useRef(null);

  const dap = dist(points.a, points.p);
  const dan = dist(points.a, points.n);
  const loss = Math.max(0, dap - dan + margin);
  const satisfied = dap + margin <= dan;

  const a = toScreen(points.a.x, points.a.y);
  const p = toScreen(points.p.x, points.p.y);
  const n = toScreen(points.n.x, points.n.y);

  const tripletColor = satisfied ? 'var(--easy)' : 'var(--hard)';

  const startDrag = useCallback((key) => () => setDragKey(key), []);

  const onMove = useCallback(
    (e) => {
      if (!dragKey || !svgRef.current) return;
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const local = pt.matrixTransform(ctm.inverse());
      const world = fromScreen(local.x, local.y);
      // clamp to stage range
      const cx = Math.max(-2.6, Math.min(2.6, world.x));
      const cy = Math.max(-2, Math.min(2, world.y));
      setPoints((prev) => ({ ...prev, [dragKey]: { x: cx, y: cy } }));
    },
    [dragKey],
  );

  const endDrag = useCallback(() => setDragKey(null), []);

  const reset = useCallback(() => {
    setPoints(initialLayout());
    setMargin(0.6);
  }, []);

  // Margin ring around anchor (radius = d(a,p) + margin shows the "required" no-neg zone).
  const requiredRadius = (dap + margin) * UNIT;

  // Grid lines
  const gridLines = useMemo(() => {
    const out = [];
    for (let i = -3; i <= 3; i += 1) {
      const { sx } = toScreen(i, 0);
      out.push({ key: `v${i}`, x1: sx, y1: PAD, x2: sx, y2: PAD + STAGE_H });
    }
    for (let j = -2; j <= 2; j += 1) {
      const { sy } = toScreen(0, j);
      out.push({ key: `h${j}`, x1: PAD, y1: sy, x2: PAD + STAGE_W, y2: sy });
    }
    return out;
  }, []);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: 620, aspectRatio: `${W} / ${H}` }}
          onMouseMove={onMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) onMove({ clientX: t.clientX, clientY: t.clientY });
          }}
          onTouchEnd={endDrag}
        >
          {/* Stage panel */}
          <rect
            x={PAD - 12}
            y={PAD - 12}
            width={STAGE_W + 24}
            height={STAGE_H + 24}
            rx={12}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Grid */}
          {gridLines.map((g) => (
            <line
              key={g.key}
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke="var(--border)"
              strokeWidth={0.6}
              opacity={0.45}
            />
          ))}

          {/* Axes */}
          <line
            x1={PAD}
            y1={ORIGIN_Y}
            x2={PAD + STAGE_W}
            y2={ORIGIN_Y}
            stroke="var(--text-dim)"
            strokeWidth={0.9}
            opacity={0.55}
          />
          <line
            x1={ORIGIN_X}
            y1={PAD}
            x2={ORIGIN_X}
            y2={PAD + STAGE_H}
            stroke="var(--text-dim)"
            strokeWidth={0.9}
            opacity={0.55}
          />

          <text
            x={PAD + 6}
            y={PAD + 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.14em"
          >
            EMBEDDING SPACE · 2D
          </text>

          {/* Margin ring around anchor: required radius beyond which negatives must lie */}
          <circle
            cx={a.sx}
            cy={a.sy}
            r={requiredRadius}
            fill="none"
            stroke={tripletColor}
            strokeWidth={1.2}
            strokeDasharray="4 5"
            opacity={0.65}
          />
          {/* d(a,p) circle - the "positive" distance ring */}
          <circle
            cx={a.sx}
            cy={a.sy}
            r={dap * UNIT}
            fill="none"
            stroke={POS_COLOR}
            strokeWidth={0.9}
            strokeDasharray="2 4"
            opacity={0.4}
          />

          {/* Triplet edges */}
          <line
            x1={a.sx}
            y1={a.sy}
            x2={p.sx}
            y2={p.sy}
            stroke={POS_COLOR}
            strokeWidth={2.2}
            opacity={0.85}
          />
          <line
            x1={a.sx}
            y1={a.sy}
            x2={n.sx}
            y2={n.sy}
            stroke={NEG_COLOR}
            strokeWidth={2.2}
            opacity={0.85}
          />

          {/* Midpoint labels for distances */}
          <g>
            <rect
              x={(a.sx + p.sx) / 2 - 22}
              y={(a.sy + p.sy) / 2 - 9}
              width={44}
              height={16}
              rx={4}
              fill="var(--bg)"
              stroke={POS_COLOR}
              strokeWidth={0.8}
            />
            <text
              x={(a.sx + p.sx) / 2}
              y={(a.sy + p.sy) / 2 + 3}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill={POS_COLOR}
              textAnchor="middle"
              fontWeight={700}
            >
              {dap.toFixed(2)}
            </text>
          </g>
          <g>
            <rect
              x={(a.sx + n.sx) / 2 - 22}
              y={(a.sy + n.sy) / 2 - 9}
              width={44}
              height={16}
              rx={4}
              fill="var(--bg)"
              stroke={NEG_COLOR}
              strokeWidth={0.8}
            />
            <text
              x={(a.sx + n.sx) / 2}
              y={(a.sy + n.sy) / 2 + 3}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill={NEG_COLOR}
              textAnchor="middle"
              fontWeight={700}
            >
              {dan.toFixed(2)}
            </text>
          </g>

          {/* Points */}
          {[
            { key: 'a', pt: a, color: ANCHOR_COLOR, label: 'a', sub: 'anchor' },
            { key: 'p', pt: p, color: POS_COLOR, label: 'p', sub: 'positive' },
            { key: 'n', pt: n, color: NEG_COLOR, label: 'n', sub: 'negative' },
          ].map(({ key, pt, color, label, sub }) => (
            <g
              key={key}
              style={{ cursor: dragKey === key ? 'grabbing' : 'grab' }}
              onMouseDown={startDrag(key)}
              onTouchStart={startDrag(key)}
            >
              <circle
                cx={pt.sx}
                cy={pt.sy}
                r={14}
                fill="var(--bg)"
                stroke={color}
                strokeWidth={2.2}
              />
              <circle cx={pt.sx} cy={pt.sy} r={4} fill={color} />
              <text
                x={pt.sx + 18}
                y={pt.sy - 4}
                fontSize="13"
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
                fontWeight={700}
                fill="var(--text-main)"
              >
                {label}
              </text>
              <text
                x={pt.sx + 18}
                y={pt.sy + 10}
                fontSize="9"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)"
                letterSpacing="0.1em"
              >
                {sub}
              </text>
            </g>
          ))}

          {/* Verdict tag */}
          <g>
            <rect
              x={PAD - 6}
              y={PAD + STAGE_H - 28}
              width={170}
              height={22}
              rx={6}
              fill="var(--surface)"
              stroke={tripletColor}
              strokeWidth={1.4}
            />
            <text
              x={PAD + 4}
              y={PAD + STAGE_H - 13}
              fontSize="11"
              fontFamily="var(--mono, monospace)"
              fill={tripletColor}
              fontWeight={700}
              letterSpacing="0.1em"
            >
              {satisfied ? 'CONSTRAINT MET' : 'CONSTRAINT VIOLATED'}
            </text>
          </g>

          {/* Right metrics panel */}
          <g>
            <rect
              x={W - PANEL_W - PAD / 2 + 4}
              y={PAD - 12}
              width={PANEL_W}
              height={STAGE_H + 24}
              rx={10}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            {(() => {
              const px = W - PANEL_W - PAD / 2 + 16;
              return (
                <g>
                  <text x={px} y={PAD + 6} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">METRICS</text>

                  <text x={px} y={PAD + 28} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">d(a, p)</text>
                  <text x={px} y={PAD + 44} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill={POS_COLOR}>{dap.toFixed(3)}</text>

                  <text x={px} y={PAD + 68} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">d(a, n)</text>
                  <text x={px} y={PAD + 84} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill={NEG_COLOR}>{dan.toFixed(3)}</text>

                  <text x={px} y={PAD + 108} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">margin α</text>
                  <text x={px} y={PAD + 124} fontSize="14" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--text-main)">{margin.toFixed(2)}</text>

                  <text x={px} y={PAD + 148} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">slack</text>
                  <text x={px} y={PAD + 164} fontSize="13" fontFamily="var(--mono, monospace)" fontWeight={700} fill="var(--text-main)">{(dan - dap - margin).toFixed(3)}</text>

                  <text x={px} y={PAD + 188} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.12em">L = max(0, ·)</text>
                  <text x={px} y={PAD + 206} fontSize="16" fontFamily="var(--mono, monospace)" fontWeight={700} fill={tripletColor}>{loss.toFixed(3)}</text>

                  <text x={px} y={PAD + STAGE_H - 36} fontSize="9" fontFamily="var(--mono, monospace)" fill="var(--text-dim)" letterSpacing="0.14em">LEGEND</text>
                  <circle cx={px + 4} cy={PAD + STAGE_H - 18} r={4} fill={ANCHOR_COLOR} />
                  <text x={px + 14} y={PAD + STAGE_H - 14} fontSize="10" fontFamily="var(--serif, serif)" fontStyle="italic" fill="var(--text-main)">anchor</text>
                  <circle cx={px + 4} cy={PAD + STAGE_H - 4} r={4} fill={POS_COLOR} />
                  <text x={px + 14} y={PAD + STAGE_H} fontSize="10" fontFamily="var(--serif, serif)" fontStyle="italic" fill="var(--text-main)">positive</text>
                  <circle cx={px + 4} cy={PAD + STAGE_H + 10} r={4} fill={NEG_COLOR} />
                  <text x={px + 14} y={PAD + STAGE_H + 14} fontSize="10" fontFamily="var(--serif, serif)" fontStyle="italic" fill="var(--text-main)">negative</text>
                </g>
              );
            })()}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">margin α</span>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.01"
              value={margin}
              onChange={(e) => setMargin(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{margin.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: POS_COLOR }}>d(a, p)</span>
          <span className="mlviz-val">{dap.toFixed(3)}</span>
          <span className="mlviz-sub">distance from anchor to positive</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: NEG_COLOR }}>d(a, n)</span>
          <span className="mlviz-val">{dan.toFixed(3)}</span>
          <span className="mlviz-sub">distance from anchor to negative</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: tripletColor }}>L<sub>triplet</sub></span>
          <span className="mlviz-val">{loss.toFixed(3)}</span>
          <span className="mlviz-sub">max(0, d(a,p) − d(a,n) + α) — zero when constraint holds</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset layout</span>
          </button>
          <span className="mlviz-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Move size={12} /> drag any point to move it
          </span>
        </div>

        <div className="mlviz-hint">
          the dashed ring marks the required radius d(a,p) + α — pull the negative outside the ring to satisfy the triplet · green edge = constraint met · red edge = active loss
        </div>
      </div>
    </div>
  );
}
