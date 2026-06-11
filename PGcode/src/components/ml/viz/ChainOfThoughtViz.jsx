import React, { useMemo, useState } from 'react';
import { Brain, Sparkles, CheckCircle2, XCircle, ListOrdered, GitBranch } from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 360;

const PROBLEM =
  'Roger has 5 tennis balls. He buys 2 cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?';

const DIRECT_WRONG = '27';
const DIRECT_RIGHT = '11';
const FINAL = '11';

const COT_STEPS = [
  'Roger starts with 5 tennis balls.',
  'He buys 2 cans of tennis balls.',
  'Each can holds 3 tennis balls.',
  '2 cans times 3 balls per can equals 6 new balls.',
  '5 original balls plus 6 new balls equals 11.',
  'Therefore the answer is 11.',
];

const FEW_SHOT_EXEMPLAR = [
  'Q: A bakery has 12 buns. They bake 4 more trays of 6.',
  'A: 4 trays * 6 buns = 24 buns. 12 + 24 = 36. Answer: 36.',
];

// Pre-computed accuracy table (illustrative, GSM8K-style numbers).
const ACCURACY = {
  zero: { direct: 0.18, cot: 0.62 },
  few: { direct: 0.35, cot: 0.92 },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function ChainOfThoughtViz() {
  const [mode, setMode] = useState('few'); // 'zero' | 'few'
  const [steps, setSteps] = useState(4);
  const [seed, setSeed] = useState(7);

  // useMemo to satisfy lint pattern even if we don't sample much yet
  const rng = useMemo(() => mulberry32(seed), [seed]);
  // tiny stochastic jitter on the accuracy bar (kept deterministic per seed)
  const jitter = useMemo(() => {
    const r1 = rng();
    const r2 = rng();
    return { direct: (r1 - 0.5) * 0.04, cot: (r2 - 0.5) * 0.03 };
  }, [rng]);

  const acc = ACCURACY[mode];
  const directAcc = Math.max(0, Math.min(1, acc.direct + jitter.direct));
  const cotAcc = Math.max(0, Math.min(1, acc.cot + jitter.cot));

  const shownSteps = COT_STEPS.slice(0, steps);
  const hasFinal = steps >= COT_STEPS.length;
  const cotAnswer = hasFinal ? FINAL : '...';
  const directAnswer = mode === 'few' ? DIRECT_RIGHT : DIRECT_WRONG;
  const directCorrect = directAnswer === FINAL;
  const cotCorrect = hasFinal;

  // panel geometry
  const panelTop = 86;
  const panelGap = 18;
  const panelW = (W - 32 - panelGap) / 2;
  const panelH = H - panelTop - 88;
  const leftX = 16;
  const rightX = 16 + panelW + panelGap;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ width: '100%', height: 'auto', aspectRatio: `${W} / ${H}` }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="cot-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Prompt header */}
          <text
            x={16}
            y={22}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
          >
            PROMPT
          </text>
          <rect x={16} y={30} width={W - 32} height={42} rx={6} fill="var(--surface)" stroke="var(--border)" />
          <foreignObject x={26} y={36} width={W - 52} height={32}>
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                fontFamily: 'var(--serif, serif)',
                fontSize: '11.5px',
                color: 'var(--text-main)',
                lineHeight: 1.35,
                fontStyle: 'italic',
              }}
            >
              {PROBLEM}
            </div>
          </foreignObject>

          {/* LEFT: direct answer panel */}
          <text
            x={leftX}
            y={panelTop - 6}
            fontSize="10"
            fill="var(--hue-pink)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
            fontWeight="700"
          >
            DIRECT (ONE-SHOT)
          </text>
          <rect
            x={leftX}
            y={panelTop}
            width={panelW}
            height={panelH}
            rx={8}
            fill="var(--bg)"
            stroke={directCorrect ? 'var(--hue-mint)' : 'var(--hue-pink)'}
            strokeWidth="1.2"
            opacity="0.85"
          />
          <text
            x={leftX + panelW / 2}
            y={panelTop + 36}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
          >
            model emits answer immediately
          </text>
          <text
            x={leftX + panelW / 2}
            y={panelTop + panelH / 2 + 14}
            fontSize="42"
            fill={directCorrect ? 'var(--hue-mint)' : 'var(--hue-pink)'}
            fontFamily="var(--serif, serif)"
            textAnchor="middle"
            fontStyle="italic"
            fontWeight="700"
          >
            {directAnswer}
          </text>
          <g transform={`translate(${leftX + panelW / 2 - 8}, ${panelTop + panelH - 28})`}>
            <foreignObject x={-9} y={-9} width={18} height={18}>
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: directCorrect ? 'var(--hue-mint)' : 'var(--hue-pink)',
                }}
              >
                {directCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              </div>
            </foreignObject>
          </g>
          <text
            x={leftX + panelW / 2}
            y={panelTop + panelH - 8}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
          >
            {directCorrect ? 'lucky guess' : 'skipped the work'}
          </text>

          {/* RIGHT: CoT panel */}
          <text
            x={rightX}
            y={panelTop - 6}
            fontSize="10"
            fill="var(--accent)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
            fontWeight="700"
          >
            CHAIN-OF-THOUGHT
          </text>
          <rect
            x={rightX}
            y={panelTop}
            width={panelW}
            height={panelH}
            rx={8}
            fill="var(--bg)"
            stroke={cotCorrect ? 'var(--hue-mint)' : 'var(--accent)'}
            strokeWidth="1.2"
            opacity="0.95"
          />
          {/* Few-shot exemplar header */}
          {mode === 'few' && (
            <g>
              <rect
                x={rightX + 8}
                y={panelTop + 8}
                width={panelW - 16}
                height={28}
                rx={4}
                fill="rgba(var(--accent-rgb, 0,255,245), 0.06)"
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <text
                x={rightX + 16}
                y={panelTop + 20}
                fontSize="8"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                letterSpacing="0.1em"
              >
                EXEMPLAR
              </text>
              <text
                x={rightX + 16}
                y={panelTop + 30}
                fontSize="8.5"
                fill="var(--text-main)"
                fontFamily="var(--mono, monospace)"
              >
                {FEW_SHOT_EXEMPLAR[0].length > 44
                  ? FEW_SHOT_EXEMPLAR[0].slice(0, 44) + '…'
                  : FEW_SHOT_EXEMPLAR[0]}
              </text>
            </g>
          )}

          {/* CoT steps */}
          {shownSteps.map((step, i) => {
            const lineY = panelTop + (mode === 'few' ? 50 : 22) + i * 22;
            return (
              <g key={i}>
                <circle cx={rightX + 18} cy={lineY - 4} r={7} fill="var(--surface)" stroke="var(--accent)" />
                <text
                  x={rightX + 18}
                  y={lineY - 1}
                  fontSize="8"
                  fill="var(--accent)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {i + 1}
                </text>
                <foreignObject x={rightX + 32} y={lineY - 14} width={panelW - 42} height={20}>
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      fontFamily: 'var(--mono, monospace)',
                      fontSize: '10px',
                      color: 'var(--text-main)',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {step}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* CoT answer chip */}
          <g>
            <rect
              x={rightX + panelW - 78}
              y={panelTop + panelH - 36}
              width={70}
              height={26}
              rx={6}
              fill={cotCorrect ? 'rgba(var(--accent-rgb, 0,255,245), 0.18)' : 'var(--surface)'}
              stroke={cotCorrect ? 'var(--hue-mint)' : 'var(--border)'}
              strokeWidth="1.2"
            />
            <text
              x={rightX + panelW - 43}
              y={panelTop + panelH - 18}
              fontSize="13"
              fill={cotCorrect ? 'var(--hue-mint)' : 'var(--text-dim)'}
              fontFamily="var(--serif, serif)"
              textAnchor="middle"
              fontStyle="italic"
              fontWeight="700"
            >
              {cotAnswer}
            </text>
          </g>

          {/* Accuracy bars at bottom */}
          {(() => {
            const barTop = H - 64;
            const barH = 14;
            const barLeft = 100;
            const barMax = W - 32 - barLeft - 60;
            return (
              <g>
                <text
                  x={16}
                  y={barTop - 6}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  letterSpacing="0.14em"
                >
                  ACCURACY ON GSM8K-STYLE WORD PROBLEMS
                </text>
                <text x={16} y={barTop + 11} fontSize="10" fill="var(--hue-pink)" fontFamily="var(--mono, monospace)">
                  direct
                </text>
                <rect x={barLeft} y={barTop} width={barMax} height={barH} rx={3} fill="var(--surface)" stroke="var(--border)" />
                <rect
                  x={barLeft}
                  y={barTop}
                  width={Math.max(2, barMax * directAcc)}
                  height={barH}
                  rx={3}
                  fill="var(--hue-pink)"
                  opacity="0.8"
                />
                <text
                  x={barLeft + barMax + 8}
                  y={barTop + 11}
                  fontSize="10"
                  fill="var(--hue-pink)"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {(directAcc * 100).toFixed(0)}%
                </text>

                <text x={16} y={barTop + 33} fontSize="10" fill="var(--accent)" fontFamily="var(--mono, monospace)">
                  CoT
                </text>
                <rect x={barLeft} y={barTop + 22} width={barMax} height={barH} rx={3} fill="var(--surface)" stroke="var(--border)" />
                <rect
                  x={barLeft}
                  y={barTop + 22}
                  width={Math.max(2, barMax * cotAcc)}
                  height={barH}
                  rx={3}
                  fill="var(--accent)"
                  opacity="0.85"
                />
                <text
                  x={barLeft + barMax + 8}
                  y={barTop + 33}
                  fontSize="10"
                  fill="var(--accent)"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {(cotAcc * 100).toFixed(0)}%
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls" style={{ gap: '0.8rem', flexWrap: 'wrap' }}>
          <div className="mlviz-toggles">
            <button
              type="button"
              className={`mlviz-toggle ${mode === 'zero' ? 'is-on' : ''}`}
              onClick={() => setMode('zero')}
            >
              <span className="mlviz-toggle-dot" />
              <Sparkles size={12} />
              <span>zero-shot CoT</span>
            </button>
            <button
              type="button"
              className={`mlviz-toggle ${mode === 'few' ? 'is-on' : ''}`}
              onClick={() => setMode('few')}
            >
              <span className="mlviz-toggle-dot" />
              <GitBranch size={12} />
              <span>few-shot CoT</span>
            </button>
          </div>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <ListOrdered size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              reasoning steps shown
            </span>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{steps}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Brain size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              seed
            </span>
            <input
              type="range"
              min="1"
              max="32"
              step="1"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{seed}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink)' }}>direct</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
            {(directAcc * 100).toFixed(0)}%
          </span>
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>CoT</span>
          <span className="mlviz-val" style={{ color: 'var(--accent)' }}>
            {(cotAcc * 100).toFixed(0)}%
          </span>
          <span className="mlviz-sub">
            gap = +{((cotAcc - directAcc) * 100).toFixed(0)} pts · {mode === 'few' ? 'few-shot exemplars unlock structured reasoning' : 'a single "Let\'s think step by step" trigger'}
          </span>
        </div>

        <div className="mlviz-hint">
          toggle the prompting style · drag steps to reveal the reasoning chain · the answer only appears when the last step lands
        </div>
      </div>
    </div>
  );
}
