import React, { useMemo, useState } from 'react';
import {
  FileText,
  GitCompareArrows,
  MessageSquare,
  Scale,
  Cpu,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 380;

const STAGES = [
  {
    id: 'sft',
    label: 'SFT',
    sub: 'supervised fine-tune',
    InputIcon: FileText,
    inputText: 'demos',
    inputSub: '(prompt, ideal response)',
    process: 'cross-entropy',
    output: 'π_SFT',
  },
  {
    id: 'rm',
    label: 'RM',
    sub: 'reward model',
    InputIcon: GitCompareArrows,
    inputText: 'pairs',
    inputSub: '(A ≻ B preference)',
    process: 'Bradley–Terry',
    output: 'r_θ',
  },
  {
    id: 'ppo',
    label: 'PPO',
    sub: 'RL policy update',
    InputIcon: MessageSquare,
    inputText: 'prompts',
    inputSub: 'sample y ~ π_θ',
    process: 'r − β·KL',
    output: 'π_PPO',
  },
];

const STAGE_TOP = 70;
const STAGE_H = 72;
const STAGE_GAP = 16;

const COL_INPUT_X = 96;
const COL_PROCESS_X = 360;
const COL_OUTPUT_X = 620;

function stageY(i) {
  return STAGE_TOP + i * (STAGE_H + STAGE_GAP);
}

// Synthetic reward / KL / hacking score curves as a function of β.
// Mirrors common qualitative findings: low β → reward goes up, KL explodes,
// hacking score climbs (model exploits RM). High β → KL pinned, low reward
// gain but low hacking.
function computeMetrics(beta) {
  // beta in [0.01, 1.0]
  // Reward: rises sharply as β shrinks (less constraint), saturates at ~9.4
  const reward = 9.4 - 4.6 * Math.pow(beta, 0.55);
  // KL: explodes as β shrinks
  const kl = 0.05 + 6.5 * Math.pow(1 - Math.min(beta, 1), 2.2) + 0.02 / Math.max(beta, 0.01);
  // Hacking score: low β → very high. Use a steep falloff.
  const hacking = Math.max(
    0,
    Math.min(1, 0.95 - Math.pow(beta * 1.1, 0.6))
  );
  return { reward, kl, hacking };
}

export default function RLHFPipelineViz() {
  const [beta, setBeta] = useState(0.1);

  const metrics = useMemo(() => computeMetrics(beta), [beta]);

  const hackingPct = Math.round(metrics.hacking * 100);
  const isHacking = metrics.hacking > 0.45;

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
            <marker
              id="rlhf-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker
              id="rlhf-arrow-dim"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* Column headers */}
          <text x={COL_INPUT_X} y={STAGE_TOP - 32} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.16em">
            DATA
          </text>
          <text x={COL_PROCESS_X} y={STAGE_TOP - 32} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.16em">
            TRAIN OBJECTIVE
          </text>
          <text x={COL_OUTPUT_X} y={STAGE_TOP - 32} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)" textAnchor="middle" letterSpacing="0.16em">
            ARTIFACT
          </text>

          {/* Header title */}
          <text x={16} y={22} fontSize="11" fill="var(--accent)" fontFamily="var(--mono, monospace)" letterSpacing="0.16em" fontWeight="700">
            RLHF — THREE-STAGE PIPELINE
          </text>
          <text x={16} y={38} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
            SFT → reward model → PPO leashed to π_SFT via KL penalty
          </text>

          {STAGES.map((stage, i) => {
            const y = stageY(i);
            const Icon = stage.InputIcon;
            // PPO stage gets the β-sensitive highlight ring
            const ringFn = stage.id === 'ppo';

            return (
              <g key={stage.id}>
                {/* Stage label */}
                <text
                  x={20}
                  y={y + STAGE_H / 2 - 4}
                  fontSize="14"
                  fill="var(--accent)"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                  letterSpacing="0.1em"
                >
                  {stage.label}
                </text>
                <text
                  x={20}
                  y={y + STAGE_H / 2 + 10}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  letterSpacing="0.06em"
                >
                  {stage.sub}
                </text>

                {/* INPUT */}
                <rect
                  x={COL_INPUT_X - 58}
                  y={y + 10}
                  width={116}
                  height={STAGE_H - 20}
                  rx={6}
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <g transform={`translate(${COL_INPUT_X - 38}, ${y + STAGE_H / 2 - 8})`}>
                  <foreignObject x={-9} y={-9} width={18} height={18}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                      }}
                    >
                      <Icon size={13} />
                    </div>
                  </foreignObject>
                </g>
                <text
                  x={COL_INPUT_X + 6}
                  y={y + STAGE_H / 2 - 2}
                  fontSize="10"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {stage.inputText}
                </text>
                <text
                  x={COL_INPUT_X + 6}
                  y={y + STAGE_H / 2 + 11}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                >
                  {stage.inputSub}
                </text>

                {/* Arrow to process */}
                <line
                  x1={COL_INPUT_X + 58}
                  y1={y + STAGE_H / 2}
                  x2={COL_PROCESS_X - 78}
                  y2={y + STAGE_H / 2}
                  stroke="var(--text-dim)"
                  strokeWidth="1.2"
                  markerEnd="url(#rlhf-arrow-dim)"
                />

                {/* PROCESS */}
                <rect
                  x={COL_PROCESS_X - 72}
                  y={y + 10}
                  width={144}
                  height={STAGE_H - 20}
                  rx={6}
                  fill={ringFn ? 'rgba(var(--accent-rgb, 0,255,245), 0.10)' : 'var(--surface)'}
                  stroke={ringFn ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={ringFn ? 1.4 : 1}
                />
                <g transform={`translate(${COL_PROCESS_X - 52}, ${y + STAGE_H / 2 - 8})`}>
                  <foreignObject x={-9} y={-9} width={18} height={18}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: ringFn ? 'var(--accent)' : 'var(--text-dim)',
                      }}
                    >
                      {i === 1 ? <Scale size={13} /> : <Cpu size={13} />}
                    </div>
                  </foreignObject>
                </g>
                <text
                  x={COL_PROCESS_X - 36}
                  y={y + STAGE_H / 2 + 3}
                  fontSize="10.5"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {stage.process}
                </text>
                {/* KL penalty hint on PPO */}
                {stage.id === 'ppo' && (
                  <text
                    x={COL_PROCESS_X - 36}
                    y={y + STAGE_H / 2 + 16}
                    fontSize="8"
                    fill="var(--accent)"
                    fontFamily="var(--mono, monospace)"
                  >
                    β = {beta.toFixed(2)}
                  </text>
                )}

                {/* Arrow to artifact */}
                <line
                  x1={COL_PROCESS_X + 72}
                  y1={y + STAGE_H / 2}
                  x2={COL_OUTPUT_X - 40}
                  y2={y + STAGE_H / 2}
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  markerEnd="url(#rlhf-arrow)"
                />

                {/* OUTPUT */}
                <rect
                  x={COL_OUTPUT_X - 36}
                  y={y + 10}
                  width={72}
                  height={STAGE_H - 20}
                  rx={6}
                  fill="rgba(var(--accent-rgb, 0,255,245), 0.18)"
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                />
                <text
                  x={COL_OUTPUT_X}
                  y={y + STAGE_H / 2 + 4}
                  fontSize="14"
                  fill="var(--accent)"
                  fontFamily="var(--serif, serif)"
                  textAnchor="middle"
                  fontStyle="italic"
                  fontWeight="700"
                >
                  {stage.output}
                </text>
              </g>
            );
          })}

          {/* Vertical feed: π_SFT seeds RM (and acts as KL anchor for PPO) */}
          <path
            d={`M ${COL_OUTPUT_X} ${stageY(0) + STAGE_H - 8} C ${COL_OUTPUT_X + 36} ${stageY(0) + STAGE_H + 8}, ${COL_OUTPUT_X + 36} ${stageY(1) + 12}, ${COL_OUTPUT_X} ${stageY(1) + 12}`}
            stroke="var(--accent)"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="4 3"
            opacity="0.7"
            markerEnd="url(#rlhf-arrow)"
          />
          <path
            d={`M ${COL_OUTPUT_X} ${stageY(1) + STAGE_H - 8} C ${COL_OUTPUT_X + 36} ${stageY(1) + STAGE_H + 8}, ${COL_OUTPUT_X + 36} ${stageY(2) + 12}, ${COL_OUTPUT_X} ${stageY(2) + 12}`}
            stroke="var(--accent)"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="4 3"
            opacity="0.7"
            markerEnd="url(#rlhf-arrow)"
          />

          {/* KL anchor: π_SFT --> PPO penalty box */}
          <path
            d={`M ${COL_OUTPUT_X - 36} ${stageY(0) + STAGE_H / 2} C ${260} ${stageY(0) + STAGE_H / 2}, ${260} ${stageY(2) + STAGE_H / 2}, ${COL_PROCESS_X - 72} ${stageY(2) + STAGE_H / 2}`}
            stroke="var(--hue-mint)"
            strokeWidth="1.1"
            strokeDasharray="2 4"
            fill="none"
            opacity="0.75"
          />
          <text
            x={208}
            y={(stageY(0) + stageY(2)) / 2 + STAGE_H / 2}
            fontSize="8.5"
            fill="var(--hue-mint)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.06em"
          >
            KL anchor
          </text>

          {/* Bottom KL/Reward bars */}
          {(() => {
            const barTop = H - 32;
            const labelLeftW = 100;
            const barLeft = labelLeftW;
            const barMax = W - 32 - barLeft - 70;
            // reward bar normalized to [0, 10]
            const rwd = Math.max(0, Math.min(1, metrics.reward / 10));
            return (
              <g>
                <text
                  x={16}
                  y={barTop - 6}
                  fontSize="9"
                  fill="var(--hue-mint)"
                  fontFamily="var(--mono, monospace)"
                >
                  reward
                </text>
                <rect x={barLeft} y={barTop - 14} width={barMax} height={10} rx={3} fill="var(--surface)" stroke="var(--border)" />
                <rect x={barLeft} y={barTop - 14} width={Math.max(2, barMax * rwd)} height={10} rx={3} fill="var(--hue-mint)" opacity="0.85" />
                <text
                  x={barLeft + barMax + 6}
                  y={barTop - 5}
                  fontSize="9"
                  fill="var(--hue-mint)"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {metrics.reward.toFixed(2)}
                </text>

                <text x={16} y={barTop + 8} fontSize="9" fill="var(--hue-pink)" fontFamily="var(--mono, monospace)">
                  KL(π_θ ∥ π_SFT)
                </text>
                <rect x={barLeft} y={barTop} width={barMax} height={10} rx={3} fill="var(--surface)" stroke="var(--border)" />
                <rect
                  x={barLeft}
                  y={barTop}
                  width={Math.max(2, Math.min(barMax, barMax * (metrics.kl / 7)))}
                  height={10}
                  rx={3}
                  fill="var(--hue-pink)"
                  opacity="0.85"
                />
                <text
                  x={barLeft + barMax + 6}
                  y={barTop + 9}
                  fontSize="9"
                  fill="var(--hue-pink)"
                  fontFamily="var(--mono, monospace)"
                  fontWeight="700"
                >
                  {metrics.kl.toFixed(2)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Scale size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              KL coefficient β
            </span>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={beta}
              onChange={(e) => setBeta(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{beta.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span className="mlviz-tag" style={{ color: 'var(--hue-mint)' }}>reward</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-mint)' }}>
            {metrics.reward.toFixed(2)}
          </span>
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink)' }}>KL</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
            {metrics.kl.toFixed(2)}
          </span>
          <span
            className="mlviz-tag"
            style={{ color: isHacking ? 'var(--hard, var(--hue-pink))' : 'var(--hue-mint)' }}
          >
            hacking score
          </span>
          <span
            className="mlviz-val"
            style={{
              color: isHacking ? 'var(--hard, var(--hue-pink))' : 'var(--hue-mint)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            {isHacking ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
            {hackingPct}%
          </span>
          <span className="mlviz-sub">
            {beta < 0.05
              ? 'β tiny → policy drifts off the SFT manifold and games r_θ'
              : beta < 0.3
              ? 'β small → high reward, KL climbs, watch for reward hacking'
              : beta < 0.7
              ? 'β balanced → reward improves while staying near π_SFT'
              : 'β large → KL pinned, policy barely moves, reward gain small'}
          </span>
        </div>

        <div className="mlviz-hint">
          drag β to set the KL leash strength · low β unlocks reward but invites hacking · the green dashed line shows π_SFT acting as the anchor
        </div>
      </div>
    </div>
  );
}
