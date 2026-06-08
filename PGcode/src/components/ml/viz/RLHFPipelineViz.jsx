import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  GitCompareArrows,
  MessageSquare,
  Cpu,
  Scale,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './MLViz.css';

const W = 640;
const H = 460;

const STAGES = [
  {
    id: 'sft',
    label: 'Stage 1 — SFT',
    sub: 'Supervised Fine-Tuning',
    inputIcon: FileText,
    inputText: 'Demos',
    inputSub: '(prompt, ideal response)',
    process: 'Cross-entropy on responses',
    processDetail: 'Teacher-forced, frozen base init',
    output: 'π_SFT',
    outputSub: 'policy that knows the format',
    tex: '\\mathcal{L}_{\\text{SFT}}(\\theta) \\;=\\; -\\,\\mathbb{E}_{(x,\\,y)\\sim\\mathcal{D}_{\\text{SFT}}}\\!\\left[\\,\\sum_{t} \\log \\pi_{\\theta}(y_{t}\\mid x,\\,y_{<t})\\,\\right]',
    objectiveCaption: 'Minimise next-token cross-entropy over the demonstration set.',
  },
  {
    id: 'rm',
    label: 'Stage 2 — RM',
    sub: 'Reward Model',
    inputIcon: GitCompareArrows,
    inputText: 'Pairs',
    inputSub: '(prompt, A, B, label A≻B)',
    process: 'Bradley-Terry on pair scores',
    processDetail: 'SFT backbone, scalar head',
    output: 'r_θ',
    outputSub: 'scalar ranker, frozen after this stage',
    tex: '\\mathcal{L}_{\\text{RM}}(\\phi) \\;=\\; -\\,\\mathbb{E}_{(x,\\,y_{w},\\,y_{l})\\sim\\mathcal{D}_{\\text{pref}}}\\!\\left[\\,\\log \\sigma\\!\\bigl(r_{\\phi}(x,\\,y_{w}) - r_{\\phi}(x,\\,y_{l})\\bigr)\\,\\right]',
    objectiveCaption: 'Maximise the likelihood that the chosen response scores higher than the rejected one.',
  },
  {
    id: 'ppo',
    label: 'Stage 3 — PPO',
    sub: 'RL Fine-Tuning',
    inputIcon: MessageSquare,
    inputText: 'Prompts',
    inputSub: 'sample y ~ π_θ(·|x)',
    process: 'PPO on r − β·KL',
    processDetail: 'π_SFT frozen as KL anchor',
    output: 'π_PPO',
    outputSub: 'aligned policy, leashed to π_SFT',
    tex: '\\mathcal{J}(\\theta) \\;=\\; \\mathbb{E}_{x \\sim \\mathcal{D},\\,y \\sim \\pi_{\\theta}(\\cdot\\mid x)}\\!\\left[\\,r_{\\phi}(x,\\,y) \\;-\\; \\beta \\,\\mathrm{KL}\\!\\bigl(\\pi_{\\theta}(\\cdot\\mid x)\\,\\|\\,\\pi_{\\text{SFT}}(\\cdot\\mid x)\\bigr)\\,\\right]',
    objectiveCaption: 'Maximise reward minus a KL penalty against π_SFT — climb the reward, stay on the leash.',
  },
];

function katexHtml(tex, displayMode = true) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

// Geometry per stage row
const STAGE_TOP = 36;
const STAGE_H = 124;
const STAGE_GAP = 14;

const COL_INPUT_X = 88;
const COL_PROCESS_X = 320;
const COL_OUTPUT_X = 552;

function stageY(i) {
  return STAGE_TOP + i * (STAGE_H + STAGE_GAP);
}

export default function RLHFPipelineViz() {
  const [activeStep, setActiveStep] = useState(-1); // step-through cursor: -1 = none, 0..2 = highlight
  const [hovered, setHovered] = useState(null); // stage id under cursor
  const [expanded, setExpanded] = useState(null); // stage id whose objective is open
  const [playing, setPlaying] = useState(false);

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => {
      setActiveStep((s) => {
        if (s >= STAGES.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1100);
    return () => clearTimeout(t);
  }, [playing, activeStep]);

  const handleStep = () => {
    setActiveStep((s) => (s >= STAGES.length - 1 ? s : s + 1));
  };

  const handleReset = () => {
    setActiveStep(-1);
    setPlaying(false);
    setExpanded(null);
  };

  const handleToggle = (id) => {
    setExpanded((cur) => (cur === id ? null : id));
  };

  const handleHover = (id) => setHovered(id);
  const handleLeave = () => setHovered(null);

  const activeId = useMemo(() => {
    if (hovered) return hovered;
    if (activeStep >= 0) return STAGES[activeStep].id;
    return null;
  }, [hovered, activeStep]);

  const isLit = (i) => {
    if (activeStep < 0 && !hovered) return false;
    if (hovered) return STAGES[i].id === hovered;
    return i <= activeStep;
  };

  const isProduced = (i) => {
    // "what each stage produces" — highlight only the output column for the active stage
    if (hovered) return STAGES[i].id === hovered;
    return i === activeStep;
  };

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '640px' }}
        >
          <defs>
            <marker
              id="rlhf-arr"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
            <marker
              id="rlhf-arr-acc"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Column headers */}
          <text
            x={COL_INPUT_X}
            y={STAGE_TOP - 14}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.16em"
          >
            INPUT
          </text>
          <text
            x={COL_PROCESS_X}
            y={STAGE_TOP - 14}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.16em"
          >
            TRAINING
          </text>
          <text
            x={COL_OUTPUT_X}
            y={STAGE_TOP - 14}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.16em"
          >
            OUTPUT WEIGHTS
          </text>

          {STAGES.map((stage, i) => {
            const y = stageY(i);
            const lit = isLit(i);
            const produced = isProduced(i);
            const stroke = lit ? 'var(--accent)' : 'var(--border)';
            const strokeAcc = produced ? 'var(--accent)' : 'var(--border)';
            const arr = lit ? 'url(#rlhf-arr-acc)' : 'url(#rlhf-arr)';
            const arrowStroke = lit ? 'var(--accent)' : 'var(--text-dim)';
            const InputIcon = stage.inputIcon;

            return (
              <g
                key={stage.id}
                onMouseEnter={() => handleHover(stage.id)}
                onMouseLeave={handleLeave}
                onClick={() => handleToggle(stage.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Row band for hit-testing + subtle highlight */}
                <rect
                  x={6}
                  y={y - 4}
                  width={W - 12}
                  height={STAGE_H + 8}
                  rx={10}
                  fill={lit ? 'rgba(var(--accent-rgb, 0,255,245), 0.06)' : 'transparent'}
                  stroke={expanded === stage.id ? 'var(--accent)' : 'transparent'}
                  strokeWidth="1"
                  strokeDasharray={expanded === stage.id ? '4 3' : '0'}
                />

                {/* Stage label (top-left) */}
                <text
                  x={20}
                  y={y + 12}
                  fontSize="10"
                  fill={lit ? 'var(--accent)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  letterSpacing="0.1em"
                  fontWeight="700"
                >
                  {stage.label.toUpperCase()}
                </text>
                <text
                  x={20}
                  y={y + 24}
                  fontSize="8.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  letterSpacing="0.06em"
                >
                  {stage.sub}
                </text>

                {/* INPUT box */}
                <rect
                  x={COL_INPUT_X - 64}
                  y={y + 40}
                  width={128}
                  height={64}
                  rx={6}
                  fill="var(--surface)"
                  stroke={stroke}
                  strokeWidth="1.2"
                />
                <g transform={`translate(${COL_INPUT_X - 8}, ${y + 50})`}>
                  <foreignObject x={-9} y={0} width={18} height={18}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: lit ? 'var(--accent)' : 'var(--text-dim)',
                      }}
                    >
                      <InputIcon size={14} />
                    </div>
                  </foreignObject>
                </g>
                <text
                  x={COL_INPUT_X}
                  y={y + 82}
                  fontSize="11"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {stage.inputText}
                </text>
                <text
                  x={COL_INPUT_X}
                  y={y + 96}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {stage.inputSub}
                </text>

                {/* Arrow INPUT -> PROCESS */}
                <line
                  x1={COL_INPUT_X + 64 + 4}
                  y1={y + 72}
                  x2={COL_PROCESS_X - 80 - 4}
                  y2={y + 72}
                  stroke={arrowStroke}
                  strokeWidth="1.2"
                  opacity={lit ? 1 : 0.6}
                  markerEnd={arr}
                />

                {/* PROCESS box */}
                <rect
                  x={COL_PROCESS_X - 80}
                  y={y + 40}
                  width={160}
                  height={64}
                  rx={6}
                  fill={lit ? 'rgba(var(--accent-rgb, 0,255,245), 0.10)' : 'var(--surface)'}
                  stroke={stroke}
                  strokeWidth="1.4"
                />
                <g transform={`translate(${COL_PROCESS_X - 9}, ${y + 48})`}>
                  <foreignObject x={-9} y={0} width={18} height={18}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: lit ? 'var(--accent)' : 'var(--text-dim)',
                      }}
                    >
                      {i === 1 ? <Scale size={14} /> : <Cpu size={14} />}
                    </div>
                  </foreignObject>
                </g>
                <text
                  x={COL_PROCESS_X}
                  y={y + 80}
                  fontSize="10.5"
                  fill="var(--text-main)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {stage.process}
                </text>
                <text
                  x={COL_PROCESS_X}
                  y={y + 94}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {stage.processDetail}
                </text>

                {/* Arrow PROCESS -> OUTPUT */}
                <line
                  x1={COL_PROCESS_X + 80 + 4}
                  y1={y + 72}
                  x2={COL_OUTPUT_X - 56 - 4}
                  y2={y + 72}
                  stroke={arrowStroke}
                  strokeWidth="1.2"
                  opacity={lit ? 1 : 0.6}
                  markerEnd={arr}
                />

                {/* OUTPUT box (weights chip) */}
                <rect
                  x={COL_OUTPUT_X - 56}
                  y={y + 40}
                  width={112}
                  height={64}
                  rx={6}
                  fill={produced ? 'rgba(var(--accent-rgb, 0,255,245), 0.18)' : 'var(--surface)'}
                  stroke={strokeAcc}
                  strokeWidth={produced ? '1.6' : '1.2'}
                />
                <text
                  x={COL_OUTPUT_X}
                  y={y + 76}
                  fontSize="15"
                  fill={produced ? 'var(--accent)' : 'var(--text-main)'}
                  fontFamily="var(--serif, serif)"
                  fontStyle="italic"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {stage.output}
                </text>
                <text
                  x={COL_OUTPUT_X}
                  y={y + 92}
                  fontSize="7.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {stage.outputSub}
                </text>

                {/* Chevron hint (click to expand) */}
                <g transform={`translate(${W - 28}, ${y + 14})`}>
                  <foreignObject x={-8} y={-8} width={16} height={16}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dim)',
                        transform: expanded === stage.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 180ms ease',
                      }}
                    >
                      <ChevronDown size={13} />
                    </div>
                  </foreignObject>
                </g>
              </g>
            );
          })}

          {/* Inter-stage feed arrows: output of stage i -> input of stage i+1 */}
          {STAGES.slice(0, -1).map((_, i) => {
            const y1 = stageY(i) + 104;
            const y2 = stageY(i + 1) + 40;
            const xOut = COL_OUTPUT_X;
            const xIn = COL_INPUT_X;
            const lit = activeStep > i || (hovered && STAGES.findIndex((s) => s.id === hovered) > i);
            const stroke = lit ? 'var(--accent)' : 'var(--text-dim)';
            const arr = lit ? 'url(#rlhf-arr-acc)' : 'url(#rlhf-arr)';
            const midY = (y1 + y2) / 2;
            return (
              <g key={`feed-${i}`}>
                <path
                  d={`M ${xOut} ${y1} C ${xOut} ${midY}, ${xIn} ${midY}, ${xIn} ${y2 - 4}`}
                  stroke={stroke}
                  strokeWidth="1.3"
                  fill="none"
                  opacity={lit ? 1 : 0.55}
                  strokeDasharray="4 3"
                  markerEnd={arr}
                />
                <text
                  x={(xOut + xIn) / 2}
                  y={midY - 4}
                  fontSize="8.5"
                  fill={lit ? 'var(--accent)' : 'var(--text-dim)'}
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  letterSpacing="0.08em"
                >
                  {i === 0 ? 'π_SFT seeds RM + samples pairs' : 'r_θ scores π_θ samples'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        {expanded && (() => {
          const s = STAGES.find((st) => st.id === expanded);
          if (!s) return null;
          return (
            <div
              className="mlviz-row"
              style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '0.45rem',
                padding: '0.6rem 0.7rem',
                border: '1px solid var(--accent)',
                borderRadius: '8px',
                background: 'rgba(var(--accent-rgb, 0,255,245), 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span
                  className="mlviz-tag"
                  style={{ color: 'var(--accent)', letterSpacing: '0.12em' }}
                >
                  {s.label.toUpperCase()} OBJECTIVE
                </span>
                <span className="mlviz-sub">{s.objectiveCaption}</span>
              </div>
              <div
                className="ml-math"
                style={{ margin: 0 }}
                dangerouslySetInnerHTML={{ __html: katexHtml(s.tex, true) }}
              />
            </div>
          );
        })()}

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={() => {
              if (activeStep >= STAGES.length - 1) {
                setActiveStep(0);
              } else {
                handleStep();
              }
            }}
            disabled={playing}
          >
            <Play size={13} />
            <span>
              {activeStep < 0
                ? 'Step through'
                : activeStep >= STAGES.length - 1
                ? 'Restart steps'
                : `Step ${activeStep + 2} of ${STAGES.length}`}
            </span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => {
              if (playing) {
                setPlaying(false);
                return;
              }
              if (activeStep >= STAGES.length - 1) setActiveStep(-1);
              setPlaying(true);
            }}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause auto-play' : 'Auto-play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          click any stage to expand its training objective · hover to highlight what it produces · step through advances SFT → RM → PPO
        </div>
      </div>
    </div>
  );
}
