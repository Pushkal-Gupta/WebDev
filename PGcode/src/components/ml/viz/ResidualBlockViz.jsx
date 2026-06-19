import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 380;

const X_MAIN = 200;
const X_SKIP = 420;

const Y_INPUT = 36;
const Y_BLOCK1 = 110;
const Y_BLOCK2 = 200;
const Y_SUM = 290;
const Y_RELU = 332;
const Y_OUTPUT = 366;

const BLOCK_W = 150;
const BLOCK_H = 56;

// 7 phases of the animation. step index = current phase reached.
// 0: idle (nothing flowing)
// 1: input -> top of both paths
// 2: main reaches block1 output, skip continues
// 3: main reaches block2 output, skip approaches sum
// 4: both arrive at sum
// 5: relu
// 6: output
const TOTAL_STEPS = 6;
const STEP_MS = 520;

export default function ResidualBlockViz() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => () => clearTimer(), []);

  const handleReset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setStep(0);
  }, []);

  const handleRun = useCallback(() => {
    clearTimer();
    setStep(0);
    setRunning(true);
    let s = 0;
    const tick = () => {
      s += 1;
      setStep(s);
      if (s >= TOTAL_STEPS) {
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, STEP_MS);
    };
    timerRef.current = setTimeout(tick, 120);
  }, []);

  const handleStep = useCallback(() => {
    clearTimer();
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  // Animation helpers
  const mainActive = (atStep) => step >= atStep;
  const skipActive = step >= 1;

  // Edge color based on whether signal has reached that edge.
  const edgeStroke = (reached) => (reached ? 'var(--accent)' : 'var(--border)');
  const edgeWidth = (reached) => (reached ? 2.4 : 1.4);
  const edgeOpacity = (reached) => (reached ? 1 : 0.6);

  // Skip path SVG path. Goes from input split point right, down past blocks, into sum from the right.
  const skipPathD = `M ${X_MAIN + BLOCK_W / 2 + 10} ${Y_INPUT + 14} L ${X_SKIP} ${Y_INPUT + 14} L ${X_SKIP} ${Y_SUM} L ${X_MAIN + 18} ${Y_SUM}`;

  // Phase caption.
  const captions = [
    'press play. the block computes F(x) on the main path while x rides the skip wire untouched.',
    'input x splits — main path enters Conv → BN → ReLU; skip wire copies x to the right.',
    'first sub-layer done. residual function F(x) is half-built. skip still carrying x.',
    'second Conv → BN finishes F(x). skip has reached the sum node from the right.',
    'sum node: y = F(x) + x. the identity term keeps gradients alive on the backward pass.',
    'final ReLU sharpens the activation.',
    'output flows out. default behaviour of the block: when F(x) ≈ 0, the block computes identity for free.',
  ];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px', aspectRatio: `${W} / ${H}` }}>
          <defs>
            <marker id="rb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="rb-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border)" />
            </marker>
            <marker id="rb-arrow-sky" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--hue-sky, #5ecbff)" />
            </marker>
          </defs>

          {/* INPUT x */}
          <g>
            <circle
              cx={X_MAIN}
              cy={Y_INPUT}
              r={16}
              fill={mainActive(1) ? 'var(--accent)' : 'var(--surface)'}
              stroke={mainActive(1) ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={1.6}
            />
            <text
              x={X_MAIN}
              y={Y_INPUT + 4}
              textAnchor="middle"
              fontSize="14"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fontWeight="700"
              fill={mainActive(1) ? 'var(--bg)' : 'var(--text-dim)'}
            >
              x
            </text>
            <text
              x={X_MAIN - 28}
              y={Y_INPUT + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill="var(--text-dim)"
              letterSpacing="0.08em"
            >
              input
            </text>
          </g>

          {/* Edge: input -> block 1 (main path) */}
          <line
            x1={X_MAIN}
            y1={Y_INPUT + 16}
            x2={X_MAIN}
            y2={Y_BLOCK1 - BLOCK_H / 2 - 2}
            stroke={edgeStroke(mainActive(1))}
            strokeWidth={edgeWidth(mainActive(1))}
            opacity={edgeOpacity(mainActive(1))}
            markerEnd={mainActive(1) ? 'url(#rb-arrow)' : 'url(#rb-arrow-dim)'}
          />

          {/* Skip wire (input -> right -> down -> back to sum) */}
          <path
            d={skipPathD}
            fill="none"
            stroke={skipActive ? 'var(--hue-sky, #5ecbff)' : 'var(--border)'}
            strokeWidth={skipActive ? 2.2 : 1.2}
            strokeDasharray={skipActive ? '0' : '4 4'}
            opacity={skipActive ? 1 : 0.55}
            markerEnd={skipActive ? 'url(#rb-arrow-sky)' : 'url(#rb-arrow-dim)'}
          />
          {/* skip label */}
          <text
            x={X_SKIP + 12}
            y={(Y_INPUT + Y_SUM) / 2 - 30}
            fontSize="11"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            fill={skipActive ? 'var(--hue-sky, #5ecbff)' : 'var(--text-dim)'}
          >
            skip
          </text>
          <text
            x={X_SKIP + 12}
            y={(Y_INPUT + Y_SUM) / 2 - 14}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.08em"
          >
            identity
          </text>
          <text
            x={X_SKIP + 12}
            y={(Y_INPUT + Y_SUM) / 2 + 2}
            fontSize="9"
            fontFamily="var(--mono, monospace)"
            fill="var(--text-dim)"
            letterSpacing="0.08em"
          >
            wire = x
          </text>

          {/* BLOCK 1: Conv BN ReLU */}
          <g>
            <rect
              x={X_MAIN - BLOCK_W / 2}
              y={Y_BLOCK1 - BLOCK_H / 2}
              width={BLOCK_W}
              height={BLOCK_H}
              rx={6}
              ry={6}
              fill={mainActive(2) ? 'var(--accent)' : 'var(--surface)'}
              stroke={mainActive(2) ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={1.6}
              opacity={mainActive(2) ? 0.95 : 0.85}
            />
            <text
              x={X_MAIN}
              y={Y_BLOCK1 - 8}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--mono, monospace)"
              fontWeight="700"
              fill={mainActive(2) ? 'var(--bg)' : 'var(--text-main)'}
              letterSpacing="0.06em"
            >
              Conv 3×3
            </text>
            <text
              x={X_MAIN}
              y={Y_BLOCK1 + 6}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill={mainActive(2) ? 'var(--bg)' : 'var(--text-dim)'}
            >
              BatchNorm
            </text>
            <text
              x={X_MAIN}
              y={Y_BLOCK1 + 19}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fontWeight="700"
              fill={mainActive(2) ? 'var(--bg)' : 'var(--text-dim)'}
            >
              ReLU
            </text>
          </g>

          {/* Edge: block1 -> block2 */}
          <line
            x1={X_MAIN}
            y1={Y_BLOCK1 + BLOCK_H / 2}
            x2={X_MAIN}
            y2={Y_BLOCK2 - BLOCK_H / 2 - 2}
            stroke={edgeStroke(mainActive(2))}
            strokeWidth={edgeWidth(mainActive(2))}
            opacity={edgeOpacity(mainActive(2))}
            markerEnd={mainActive(2) ? 'url(#rb-arrow)' : 'url(#rb-arrow-dim)'}
          />

          {/* BLOCK 2: Conv BN */}
          <g>
            <rect
              x={X_MAIN - BLOCK_W / 2}
              y={Y_BLOCK2 - BLOCK_H / 2}
              width={BLOCK_W}
              height={BLOCK_H}
              rx={6}
              ry={6}
              fill={mainActive(3) ? 'var(--accent)' : 'var(--surface)'}
              stroke={mainActive(3) ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={1.6}
              opacity={mainActive(3) ? 0.95 : 0.85}
            />
            <text
              x={X_MAIN}
              y={Y_BLOCK2 - 8}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--mono, monospace)"
              fontWeight="700"
              fill={mainActive(3) ? 'var(--bg)' : 'var(--text-main)'}
              letterSpacing="0.06em"
            >
              Conv 3×3
            </text>
            <text
              x={X_MAIN}
              y={Y_BLOCK2 + 6}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fill={mainActive(3) ? 'var(--bg)' : 'var(--text-dim)'}
            >
              BatchNorm
            </text>
            <text
              x={X_MAIN + BLOCK_W / 2 + 8}
              y={Y_BLOCK2 + 4}
              fontSize="11"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              fontWeight="700"
              fill={mainActive(3) ? 'var(--accent)' : 'var(--text-dim)'}
            >
              F(x)
            </text>
          </g>

          {/* Edge: block2 -> sum (left side) */}
          <line
            x1={X_MAIN}
            y1={Y_BLOCK2 + BLOCK_H / 2}
            x2={X_MAIN}
            y2={Y_SUM - 18}
            stroke={edgeStroke(mainActive(3))}
            strokeWidth={edgeWidth(mainActive(3))}
            opacity={edgeOpacity(mainActive(3))}
            markerEnd={mainActive(3) ? 'url(#rb-arrow)' : 'url(#rb-arrow-dim)'}
          />

          {/* SUM node */}
          <g>
            <circle
              cx={X_MAIN}
              cy={Y_SUM}
              r={18}
              fill={mainActive(4) ? 'var(--hue-mint, #7be0c0)' : 'var(--surface)'}
              stroke={mainActive(4) ? 'var(--hue-mint, #7be0c0)' : 'var(--border)'}
              strokeWidth={1.8}
            />
            <text
              x={X_MAIN}
              y={Y_SUM + 6}
              textAnchor="middle"
              fontSize="20"
              fontFamily="var(--mono, monospace)"
              fontWeight="700"
              fill={mainActive(4) ? 'var(--bg)' : 'var(--text-dim)'}
            >
              +
            </text>
            <text
              x={X_MAIN + 28}
              y={Y_SUM - 8}
              fontSize="10"
              fontFamily="var(--mono, monospace)"
              fontStyle="italic"
              fontWeight="700"
              fill={mainActive(4) ? 'var(--hue-mint, #7be0c0)' : 'var(--text-dim)'}
            >
              y = F(x) + x
            </text>
          </g>

          {/* Edge: sum -> relu */}
          <line
            x1={X_MAIN}
            y1={Y_SUM + 18}
            x2={X_MAIN}
            y2={Y_RELU - 12}
            stroke={edgeStroke(mainActive(5))}
            strokeWidth={edgeWidth(mainActive(5))}
            opacity={edgeOpacity(mainActive(5))}
            markerEnd={mainActive(5) ? 'url(#rb-arrow)' : 'url(#rb-arrow-dim)'}
          />

          {/* Final ReLU */}
          <g>
            <rect
              x={X_MAIN - 50}
              y={Y_RELU - 12}
              width={100}
              height={22}
              rx={5}
              ry={5}
              fill={mainActive(5) ? 'var(--accent)' : 'var(--surface)'}
              stroke={mainActive(5) ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={1.4}
              opacity={mainActive(5) ? 0.95 : 0.85}
            />
            <text
              x={X_MAIN}
              y={Y_RELU + 4}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--mono, monospace)"
              fontWeight="700"
              fill={mainActive(5) ? 'var(--bg)' : 'var(--text-dim)'}
              letterSpacing="0.06em"
            >
              ReLU
            </text>
          </g>

          {/* Edge: relu -> output */}
          <line
            x1={X_MAIN}
            y1={Y_RELU + 10}
            x2={X_MAIN}
            y2={Y_OUTPUT - 4}
            stroke={edgeStroke(mainActive(6))}
            strokeWidth={edgeWidth(mainActive(6))}
            opacity={edgeOpacity(mainActive(6))}
            markerEnd={mainActive(6) ? 'url(#rb-arrow)' : 'url(#rb-arrow-dim)'}
          />

          {/* OUTPUT label */}
          <text
            x={X_MAIN}
            y={Y_OUTPUT + 10}
            textAnchor="middle"
            fontSize="11"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            fill={mainActive(6) ? 'var(--accent)' : 'var(--text-dim)'}
            letterSpacing="0.08em"
          >
            output
          </text>

          {/* Phase indicator */}
          <text
            x={W - 10}
            y={18}
            textAnchor="end"
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.12em"
            fill={running ? 'var(--accent)' : 'var(--text-dim)'}
          >
            step {step}/{TOTAL_STEPS}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>main</span>
          <span className="mlviz-val">F(x)</span>
          <span className="mlviz-sub">two Conv-BN-ReLU sub-layers learn the correction</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-sky, #5ecbff)' }}>skip</span>
          <span className="mlviz-val">x</span>
          <span className="mlviz-sub">identity wire — not learned, just carried around</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint, #7be0c0)' }}>sum</span>
          <span className="mlviz-val">y = F(x) + x</span>
          <span className="mlviz-sub">default behaviour: F(x) ≈ 0 ⇒ block computes identity for free</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
            disabled={running}
          >
            <Play size={13} />
            <span>Play forward pass</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || step >= TOTAL_STEPS}
          >
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {captions[step]}
        </div>
      </div>
    </div>
  );
}
