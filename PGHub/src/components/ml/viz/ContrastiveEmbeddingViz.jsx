import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ChevronRight, Pause } from 'lucide-react';
import './MLViz.css';

const W = 540;
const H = 420;
const CENTER = { x: 220, y: 210 };
const RADIUS = 170;

// Initial angles (radians, 0 = right, pi/2 = down in SVG-space).
// Anchor at the top.
const INIT_ANGLES = {
  anchor: -Math.PI / 2,
  positive: -Math.PI / 2 + 1.05,
  negatives: [
    -Math.PI / 2 + 2.35,
    -Math.PI / 2 + 3.05,
    -Math.PI / 2 + 4.05,
    -Math.PI / 2 + 4.95,
    -Math.PI / 2 + 5.65,
  ],
};

function wrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Shortest signed delta from `from` to `to` on the unit circle.
function shortestDelta(from, to) {
  return wrap(to - from);
}

// Project an angle onto SVG (cx, cy).
function toXY(angle) {
  return {
    x: CENTER.x + Math.cos(angle) * RADIUS,
    y: CENTER.y + Math.sin(angle) * RADIUS,
  };
}

// Cosine similarity in 2D between two unit vectors at given angles.
function cosSim(a, b) {
  return Math.cos(a - b);
}

// Great-circle distance on the unit circle = absolute angle gap (radians).
function arcDist(a, b) {
  return Math.abs(wrap(a - b));
}

// One InfoNCE-driven update on the angles.
// Positive is pulled toward anchor by a fraction of the gap.
// Negatives are pushed away from anchor, weighted by softmax over their
// similarities (so closest = "hardest" = biggest push).
function trainStep({ anchor, positive, negatives, tau, lr }) {
  // Pull positive toward anchor along the circle.
  const dp = shortestDelta(positive, anchor);
  const nextPositive = wrap(positive + dp * lr * 1.25);

  // Softmax weights over negatives (sharper τ -> mostly hardest neg).
  const sims = negatives.map((n) => cosSim(anchor, n) / Math.max(0.02, tau));
  const maxS = Math.max(...sims);
  const exps = sims.map((s) => Math.exp(s - maxS));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  const weights = exps.map((e) => e / sum);

  const nextNegatives = negatives.map((n, i) => {
    // Push along the unit circle AWAY from the anchor.
    const dn = shortestDelta(anchor, n); // direction from anchor to n
    // Sign of dn tells us which way around the circle to push.
    const dir = dn === 0 ? 1 : Math.sign(dn);
    // Magnitude: harder negatives (higher weight) get pushed more.
    const mag = lr * (0.6 + weights[i] * 3.2);
    // Don't push past the antipode; saturate as |dn| -> π.
    const room = Math.PI - Math.abs(dn);
    const step = dir * Math.min(mag, Math.max(0, room * 0.5));
    return wrap(n + step);
  });

  return { anchor, positive: nextPositive, negatives: nextNegatives };
}

function infoNCE(anchor, positive, negatives, tau) {
  const t = Math.max(0.02, tau);
  const sp = cosSim(anchor, positive) / t;
  const sn = negatives.map((n) => cosSim(anchor, n) / t);
  const m = Math.max(sp, ...sn);
  const num = Math.exp(sp - m);
  const den = num + sn.reduce((acc, s) => acc + Math.exp(s - m), 0);
  return -Math.log(num / den);
}

const NEG_COLOR = 'var(--hue-pink, #ff66cc)';
const POS_COLOR = 'var(--accent)';
const ANCHOR_COLOR = 'var(--hue-sky, #5ecbff)';

export default function ContrastiveEmbeddingViz() {
  const [anchor] = useState(INIT_ANGLES.anchor);
  const [positive, setPositive] = useState(INIT_ANGLES.positive);
  const [negatives, setNegatives] = useState(INIT_ANGLES.negatives);
  const [tau, setTau] = useState(0.2);
  const [steps, setSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const stepOnce = useCallback(() => {
    const next = trainStep({ anchor, positive, negatives, tau, lr: 0.18 });
    setPositive(next.positive);
    setNegatives(next.negatives);
    setSteps((s) => s + 1);
  }, [anchor, positive, negatives, tau]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRunning(false);
    setPositive(INIT_ANGLES.positive);
    setNegatives([...INIT_ANGLES.negatives]);
    setSteps(0);
  }, []);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    timerRef.current = setInterval(() => {
      stepOnce();
    }, 160);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running, stepOnce]);

  const anchorXY = useMemo(() => toXY(anchor), [anchor]);
  const posXY = useMemo(() => toXY(positive), [positive]);
  const negsXY = useMemo(() => negatives.map(toXY), [negatives]);

  const apDist = arcDist(anchor, positive);
  const avgNegDist =
    negatives.reduce((acc, n) => acc + arcDist(anchor, n), 0) / negatives.length;
  const loss = infoNCE(anchor, positive, negatives, tau);

  // Softmax weights for the negatives, for visual emphasis on hard negatives.
  const sims = negatives.map((n) => cosSim(anchor, n) / Math.max(0.02, tau));
  const maxS = Math.max(...sims);
  const exps = sims.map((s) => Math.exp(s - maxS));
  const sumExp = exps.reduce((a, b) => a + b, 0) || 1;
  const negWeights = exps.map((e) => e / sumExp);
  const maxNegW = Math.max(...negWeights);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}
        >
          <defs>
            <marker
              id="ce-arrow-pull"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker
              id="ce-arrow-push"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={NEG_COLOR} />
            </marker>
          </defs>

          {/* Background panel */}
          <rect
            x={10}
            y={10}
            width={420}
            height={H - 20}
            rx={12}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Unit sphere (circle) */}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1.4}
            strokeDasharray="4 5"
            opacity={0.85}
          />
          {/* Center dot */}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={2.6}
            fill="var(--text-dim)"
            opacity={0.6}
          />
          <text
            x={CENTER.x + 8}
            y={CENTER.y - 6}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.12em"
          >
            origin
          </text>
          <text
            x={CENTER.x - RADIUS}
            y={20}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.12em"
          >
            UNIT SPHERE · ||z|| = 1
          </text>

          {/* Pull arrow: anchor -> positive (showing the pull direction) */}
          <line
            x1={anchorXY.x}
            y1={anchorXY.y}
            x2={posXY.x}
            y2={posXY.y}
            stroke="var(--accent)"
            strokeWidth={1.6}
            strokeDasharray="3 3"
            opacity={0.7}
            markerEnd="url(#ce-arrow-pull)"
          />

          {/* Push lines: anchor -> negatives (line width = softmax weight) */}
          {negsXY.map((nxy, i) => {
            const rel = negWeights[i] / Math.max(0.0001, maxNegW);
            return (
              <line
                key={`push-${i}`}
                x1={anchorXY.x}
                y1={anchorXY.y}
                x2={nxy.x}
                y2={nxy.y}
                stroke={NEG_COLOR}
                strokeWidth={0.5 + rel * 2.4}
                opacity={0.18 + rel * 0.5}
                strokeDasharray="2 4"
              />
            );
          })}

          {/* Negatives */}
          {negsXY.map((nxy, i) => {
            const rel = negWeights[i] / Math.max(0.0001, maxNegW);
            return (
              <g key={`neg-${i}`}>
                <circle
                  cx={nxy.x}
                  cy={nxy.y}
                  r={9 + rel * 4}
                  fill="color-mix(in srgb, var(--hue-pink) 16%, transparent)"
                  stroke={NEG_COLOR}
                  strokeWidth={1.4 + rel * 1.2}
                />
                <circle cx={nxy.x} cy={nxy.y} r={3} fill={NEG_COLOR} />
                <text
                  x={nxy.x + 12}
                  y={nxy.y + 4}
                  fontSize="11"
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  fontWeight={700}
                  fill="var(--text-main)"
                >
                  {`n${i + 1}`}
                </text>
              </g>
            );
          })}

          {/* Positive */}
          <g>
            <circle
              cx={posXY.x}
              cy={posXY.y}
              r={12}
              fill="rgba(var(--accent-rgb, 0, 255, 245), 0.2)"
              stroke={POS_COLOR}
              strokeWidth={1.8}
            />
            <circle cx={posXY.x} cy={posXY.y} r={3.4} fill={POS_COLOR} />
            <text
              x={posXY.x + 14}
              y={posXY.y + 4}
              fontSize="12"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fontWeight={700}
              fill="var(--text-main)"
            >
              p
            </text>
          </g>

          {/* Anchor */}
          <g>
            <circle
              cx={anchorXY.x}
              cy={anchorXY.y}
              r={13}
              fill="color-mix(in srgb, var(--hue-sky) 22%, transparent)"
              stroke={ANCHOR_COLOR}
              strokeWidth={2}
            />
            <circle cx={anchorXY.x} cy={anchorXY.y} r={3.6} fill={ANCHOR_COLOR} />
            <text
              x={anchorXY.x + 14}
              y={anchorXY.y - 8}
              fontSize="12"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fontWeight={700}
              fill="var(--text-main)"
            >
              a
            </text>
          </g>

          {/* Readout panel (right) */}
          <g>
            <rect
              x={444}
              y={16}
              width={84}
              height={H - 32}
              rx={10}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={486}
              y={32}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              textAnchor="middle"
              letterSpacing="0.14em"
            >
              METRICS
            </text>

            <text
              x={454}
              y={56}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.12em"
            >
              STEP
            </text>
            <text
              x={454}
              y={72}
              fontSize="14"
              fontFamily="var(--mono, monospace)"
              fontWeight={700}
              fill="var(--text-main)"
            >
              {steps}
            </text>

            <text
              x={454}
              y={96}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.12em"
            >
              d(a,p)
            </text>
            <text
              x={454}
              y={112}
              fontSize="13"
              fontFamily="var(--mono, monospace)"
              fontWeight={700}
              fill={POS_COLOR}
            >
              {apDist.toFixed(3)}
            </text>

            <text
              x={454}
              y={136}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.12em"
            >
              avg d(a,n)
            </text>
            <text
              x={454}
              y={152}
              fontSize="13"
              fontFamily="var(--mono, monospace)"
              fontWeight={700}
              fill={NEG_COLOR}
            >
              {avgNegDist.toFixed(3)}
            </text>

            <text
              x={454}
              y={176}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.12em"
            >
              τ
            </text>
            <text
              x={454}
              y={192}
              fontSize="13"
              fontFamily="var(--mono, monospace)"
              fontWeight={700}
              fill="var(--text-main)"
            >
              {tau.toFixed(2)}
            </text>

            <text
              x={454}
              y={216}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.12em"
            >
              InfoNCE
            </text>
            <text
              x={454}
              y={232}
              fontSize="14"
              fontFamily="var(--mono, monospace)"
              fontWeight={700}
              fill="var(--accent)"
            >
              {loss.toFixed(3)}
            </text>

            <text
              x={486}
              y={H - 64}
              fontSize="9"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              textAnchor="middle"
              letterSpacing="0.14em"
            >
              LEGEND
            </text>
            <circle cx={456} cy={H - 46} r={4} fill={ANCHOR_COLOR} />
            <text
              x={464}
              y={H - 43}
              fontSize="10"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fill="var(--text-main)"
            >
              a anchor
            </text>
            <circle cx={456} cy={H - 30} r={4} fill={POS_COLOR} />
            <text
              x={464}
              y={H - 27}
              fontSize="10"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fill="var(--text-main)"
            >
              p positive
            </text>
            <circle cx={456} cy={H - 14} r={4} fill={NEG_COLOR} />
            <text
              x={464}
              y={H - 11}
              fontSize="10"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fill="var(--text-main)"
            >
              n negatives
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">temperature τ</span>
            <input
              type="range"
              min="0.05"
              max="1.5"
              step="0.01"
              value={tau}
              onChange={(e) => setTau(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{tau.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: POS_COLOR }}>d(a, p)</span>
          <span className="mlviz-val">{apDist.toFixed(3)}</span>
          <span className="mlviz-sub">arc distance — shrinks toward 0</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: NEG_COLOR }}>avg d(a, n)</span>
          <span className="mlviz-val">{avgNegDist.toFixed(3)}</span>
          <span className="mlviz-sub">grows toward π as negatives spread</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag">InfoNCE</span>
          <span className="mlviz-val">{loss.toFixed(3)}</span>
          <span className="mlviz-sub">-log softmax probability of the positive</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={stepOnce}
            disabled={running}
          >
            <ChevronRight size={13} />
            <span>Step training</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? <Pause size={13} /> : <Play size={13} />}
            <span>{running ? 'Pause' : 'Run'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          small τ sharpens softmax — pressure concentrates on the closest (hardest) negative · large τ spreads it
        </div>
      </div>
    </div>
  );
}
