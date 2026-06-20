import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink, BookOpen, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import './PGForgePapers.css';
import { PAPERS } from './pgForgePapersData';
import { getArchitecture } from './pgForgeArchData';
import ArchitectureDiagram from './ArchitectureDiagram';
import ForgeThumb from './ForgeThumb';

const boxClass = (isActive, accent = false) => {
  if (isActive) return 'forge-svg-box-hot';
  return accent ? 'forge-svg-box-accent' : 'forge-svg-box';
};

function TransformerDiagram({ active }) {
  return (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Transformer encoder-decoder">
      <text className="forge-svg-dim" x="58" y="14" textAnchor="middle">Encoder</text>
      <text className="forge-svg-dim" x="232" y="14" textAnchor="middle">Decoder</text>
      <rect className={boxClass(active === 'attn')} x="20" y="22" width="76" height="26" rx="5" />
      <text className="forge-svg-text" x="58" y="39" textAnchor="middle">Self-Attn</text>
      <rect className={boxClass(active === 'ffn')} x="20" y="56" width="76" height="26" rx="5" />
      <text className="forge-svg-text" x="58" y="73" textAnchor="middle">Feed-Fwd</text>
      <rect className={boxClass(active === 'cross', true)} x="194" y="22" width="76" height="26" rx="5" />
      <text className="forge-svg-text" x="232" y="39" textAnchor="middle">Masked Attn</text>
      <rect className={boxClass(active === 'cross', true)} x="194" y="56" width="76" height="26" rx="5" />
      <text className="forge-svg-text" x="232" y="73" textAnchor="middle">Cross-Attn</text>
      <rect className={boxClass(active === 'cross', true)} x="194" y="90" width="76" height="26" rx="5" />
      <text className="forge-svg-text" x="232" y="107" textAnchor="middle">Feed-Fwd</text>
      <path className="forge-svg-line-accent" d="M96 69 H150 V69" />
      <path className="forge-svg-line-accent" d="M150 35 V69" />
      <path className="forge-svg-line-accent" d="M150 69 H194" />
      <text className={active === 'pos' ? 'forge-svg-hot-text' : 'forge-svg-dim'} x="58" y="104" textAnchor="middle">+ positional encoding</text>
      <text className="forge-svg-dim" x="232" y="132" textAnchor="middle">to softmax over vocab</text>
    </svg>
  );
}

function ResnetDiagram({ active }) {
  return (
    <svg viewBox="0 0 320 130" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Residual block with skip connection">
      <text className={active === 'in' ? 'forge-svg-hot-text' : 'forge-svg-dim'} x="22" y="58" textAnchor="middle">x</text>
      <rect className={boxClass(active === 'weight')} x="55" y="40" width="70" height="28" rx="5" />
      <text className="forge-svg-text" x="90" y="58" textAnchor="middle">weight</text>
      <rect className={boxClass(active === 'weight')} x="150" y="40" width="70" height="28" rx="5" />
      <text className="forge-svg-text" x="185" y="58" textAnchor="middle">weight</text>
      <circle className={active === 'add' ? 'forge-svg-box-hot' : 'forge-svg-box-accent'} cx="255" cy="54" r="15" />
      <text className="forge-svg-text" x="255" y="58" textAnchor="middle">+</text>
      <path className="forge-svg-line" d="M30 54 H55" />
      <path className="forge-svg-line" d="M125 54 H150" />
      <path className="forge-svg-line" d="M220 54 H240" />
      <path className={active === 'skip' ? 'forge-svg-line-hot' : 'forge-svg-line-accent'} d="M40 54 V20 H255 V39" />
      <text className={active === 'skip' ? 'forge-svg-hot-text' : 'forge-svg-dim'} x="148" y="14" textAnchor="middle">identity skip: F(x) + x</text>
      <text className="forge-svg-text" x="290" y="58" textAnchor="middle">out</text>
    </svg>
  );
}

function UnetDiagram({ active }) {
  return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid meet" role="img" aria-label="U-Net encoder-decoder with skips">
      <rect className={boxClass(active === 'enc')} x="20" y="20" width="40" height="22" rx="4" />
      <rect className={boxClass(active === 'enc')} x="30" y="50" width="40" height="22" rx="4" />
      <rect className={boxClass(active === 'enc')} x="40" y="80" width="40" height="22" rx="4" />
      <rect className={boxClass(active === 'bottleneck', true)} x="130" y="100" width="60" height="22" rx="4" />
      <text className="forge-svg-text" x="160" y="115" textAnchor="middle">bottleneck</text>
      <rect className={boxClass(active === 'dec')} x="240" y="80" width="40" height="22" rx="4" />
      <rect className={boxClass(active === 'dec')} x="250" y="50" width="40" height="22" rx="4" />
      <rect className={boxClass(active === 'dec')} x="260" y="20" width="40" height="22" rx="4" />
      <path className={active === 'skip' ? 'forge-svg-line-hot' : 'forge-svg-line-accent'} d="M60 31 H260" strokeDasharray="4 3" />
      <path className={active === 'skip' ? 'forge-svg-line-hot' : 'forge-svg-line-accent'} d="M70 61 H250" strokeDasharray="4 3" />
      <text className={active === 'skip' ? 'forge-svg-hot-text' : 'forge-svg-dim'} x="160" y="14" textAnchor="middle">skip connections carry detail across</text>
      <text className="forge-svg-dim" x="40" y="135" textAnchor="middle">encoder</text>
      <text className="forge-svg-dim" x="280" y="135" textAnchor="middle">decoder</text>
    </svg>
  );
}

function Seq2SeqDiagram({ active }) {
  return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Encoder-decoder with attention">
      <text className="forge-svg-dim" x="70" y="14" textAnchor="middle">Encoder</text>
      <text className="forge-svg-dim" x="248" y="14" textAnchor="middle">Decoder</text>
      <rect className={boxClass(active === 'enc')} x="20" y="24" width="34" height="26" rx="5" />
      <rect className={boxClass(active === 'enc')} x="62" y="24" width="34" height="26" rx="5" />
      <rect className={boxClass(active === 'enc')} x="104" y="24" width="34" height="26" rx="5" />
      <text className="forge-svg-dim" x="37" y="41" textAnchor="middle">h1</text>
      <text className="forge-svg-dim" x="79" y="41" textAnchor="middle">h2</text>
      <text className="forge-svg-dim" x="121" y="41" textAnchor="middle">h3</text>
      <rect className={boxClass(active === 'attn', true)} x="150" y="58" width="56" height="24" rx="5" />
      <text className="forge-svg-text" x="178" y="74" textAnchor="middle">attention</text>
      <path className="forge-svg-line-accent" d="M37 50 V70 H150" />
      <path className="forge-svg-line-accent" d="M79 50 V70 H150" />
      <path className="forge-svg-line-accent" d="M121 50 V70 H150" />
      <rect className={boxClass(active === 'dec')} x="214" y="24" width="34" height="26" rx="5" />
      <rect className={boxClass(active === 'dec')} x="256" y="24" width="34" height="26" rx="5" />
      <text className="forge-svg-dim" x="231" y="41" textAnchor="middle">s1</text>
      <text className="forge-svg-dim" x="273" y="41" textAnchor="middle">s2</text>
      <path className="forge-svg-line-accent" d="M206 70 H231 V50" />
      <text className="forge-svg-dim" x="248" y="100" textAnchor="middle">context vector per output word</text>
      <text className="forge-svg-dim" x="70" y="100" textAnchor="middle">source tokens in</text>
    </svg>
  );
}

function VaeDiagram({ active }) {
  return (
    <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="VAE encoder latent decoder">
      <rect className={boxClass(active === 'enc')} x="14" y="40" width="60" height="34" rx="5" />
      <text className="forge-svg-text" x="44" y="61" textAnchor="middle">encoder</text>
      <rect className={boxClass(active === 'params', true)} x="110" y="34" width="46" height="20" rx="4" />
      <text className="forge-svg-dim" x="133" y="48" textAnchor="middle">mu</text>
      <rect className={boxClass(active === 'params', true)} x="110" y="60" width="46" height="20" rx="4" />
      <text className="forge-svg-dim" x="133" y="74" textAnchor="middle">sigma</text>
      <circle className={active === 'z' ? 'forge-svg-box-hot' : 'forge-svg-box-accent'} cx="196" cy="57" r="16" />
      <text className="forge-svg-text" x="196" y="61" textAnchor="middle">z</text>
      <rect className={boxClass(active === 'dec')} x="240" y="40" width="62" height="34" rx="5" />
      <text className="forge-svg-text" x="271" y="61" textAnchor="middle">decoder</text>
      <path className="forge-svg-line" d="M74 57 H110" />
      <path className="forge-svg-line-accent" d="M156 44 H180" />
      <path className="forge-svg-line-accent" d="M156 70 H180" />
      <path className="forge-svg-line" d="M212 57 H240" />
      <text className="forge-svg-dim" x="44" y="92" textAnchor="middle">x in</text>
      <text className="forge-svg-dim" x="196" y="92" textAnchor="middle">sampled latent</text>
      <text className="forge-svg-dim" x="271" y="92" textAnchor="middle">x reconstructed</text>
    </svg>
  );
}

function DiffusionDiagram({ active }) {
  const n = 5;
  const w = 320;
  const gap = 10;
  const boxW = (w - gap * (n - 1)) / n;
  const shades = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Diffusion forward and reverse noising chain">
      {shades.map((s, i) => {
        const x = i * (boxW + gap);
        return (
          <g key={i}>
            <rect x={x} y={36} width={boxW} height={boxW} rx={6} stroke="var(--border)" fill="var(--surface)" />
            <rect x={x} y={36} width={boxW} height={boxW} rx={6} stroke="none" fill="var(--accent)" opacity={s * 0.55} />
            <text className="forge-svg-dim" x={x + boxW / 2} y={28} textAnchor="middle">{`x${i}`}</text>
            {i < n - 1 && <path className="forge-svg-line" d={`M${x + boxW} ${36 + boxW / 2} H${x + boxW + gap}`} />}
          </g>
        );
      })}
      <text className={active === 'forward' ? 'forge-svg-hot-text' : 'forge-svg-dim'} x="60" y="104" textAnchor="middle">forward: add noise</text>
      <text className={active === 'reverse' ? 'forge-svg-hot-text' : 'forge-svg-dim'} x="260" y="104" textAnchor="middle">reverse: denoise</text>
      {active === 'predict' && <text className="forge-svg-hot-text" x="160" y="16" textAnchor="middle">predict noise per step</text>}
    </svg>
  );
}

function VitDiagram({ active }) {
  const cells = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      cells.push({ r, c });
    }
  }
  return (
    <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="ViT patch embedding grid into transformer">
      {cells.map(({ r, c }) => (
        <rect key={`${r}-${c}`} className={boxClass(active === 'patches')} x={18 + c * 26} y={20 + r * 26} width={24} height={24} rx={3} />
      ))}
      <text className="forge-svg-dim" x="52" y="110" textAnchor="middle">image patches</text>
      <path className="forge-svg-line-accent" d="M98 59 H132" />
      <rect className={boxClass(active === 'embed', true)} x="134" y="20" width="48" height="72" rx="5" />
      <text className="forge-svg-text" x="158" y="52" textAnchor="middle">patch</text>
      <text className="forge-svg-text" x="158" y="64" textAnchor="middle">embed</text>
      <path className="forge-svg-line-accent" d="M182 56 H214" />
      <rect className={boxClass(active === 'encoder', true)} x="216" y="20" width="86" height="72" rx="5" />
      <text className="forge-svg-text" x="259" y="52" textAnchor="middle">Transformer</text>
      <text className="forge-svg-text" x="259" y="64" textAnchor="middle">encoder</text>
      <text className="forge-svg-dim" x="158" y="110" textAnchor="middle">+ position</text>
      <text className="forge-svg-dim" x="259" y="110" textAnchor="middle">class token out</text>
    </svg>
  );
}

function ClipDiagram({ active }) {
  return (
    <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="CLIP dual image and text encoders in shared space">
      <rect className={boxClass(active === 'imgenc')} x="16" y="20" width="78" height="26" rx="5" />
      <text className="forge-svg-text" x="55" y="37" textAnchor="middle">image enc</text>
      <rect className={boxClass(active === 'textenc')} x="16" y="74" width="78" height="26" rx="5" />
      <text className="forge-svg-text" x="55" y="91" textAnchor="middle">text enc</text>
      <path className="forge-svg-line" d="M94 33 H140 V52" />
      <path className="forge-svg-line" d="M94 87 H140 V64" />
      <circle className={active === 'align' ? 'forge-svg-box-hot' : 'forge-svg-box-accent'} cx="160" cy="58" r="20" />
      <text className="forge-svg-text" x="160" y="62" textAnchor="middle">align</text>
      <rect className={boxClass(active === 'shared', true)} x="206" y="44" width="98" height="28" rx="5" />
      <text className="forge-svg-text" x="255" y="62" textAnchor="middle">shared space</text>
      <text className="forge-svg-dim" x="55" y="58" textAnchor="middle">contrastive</text>
      <text className="forge-svg-dim" x="160" y="98" textAnchor="middle">matching pairs pull together</text>
    </svg>
  );
}

function RlhfDiagram({ active }) {
  const steps = [
    { label: 'Demonstrations', key: 'demo' },
    { label: 'Supervised fine-tune', key: 'sft' },
    { label: 'Reward model', key: 'rm' },
    { label: 'PPO policy', key: 'ppo' },
  ];
  const n = steps.length;
  const w = 320;
  const gap = 8;
  const boxW = (w - gap * (n - 1)) / n;
  return (
    <svg viewBox="0 0 320 76" preserveAspectRatio="xMidYMid meet" role="img" aria-label="RLHF four-stage pipeline">
      {steps.map((s, i) => {
        const x = i * (boxW + gap);
        const parts = s.label.split(' ');
        return (
          <g key={s.key}>
            <rect className={boxClass(active === s.key, i >= 2)} x={x} y={20} width={boxW} height={32} rx={5} />
            <text className="forge-svg-text" x={x + boxW / 2} y={32} textAnchor="middle" style={{ fontSize: '8px' }}>
              {parts[0]}
            </text>
            <text className="forge-svg-text" x={x + boxW / 2} y={44} textAnchor="middle" style={{ fontSize: '8px' }}>
              {parts.slice(1).join(' ')}
            </text>
            {i < n - 1 && <path className="forge-svg-line" d={`M${x + boxW} 36 H${x + boxW + gap}`} />}
          </g>
        );
      })}
      <text className="forge-svg-dim" x="160" y="68" textAnchor="middle">reward from ranked human comparisons</text>
    </svg>
  );
}

function FlowDiagram({ steps, active }) {
  const n = steps.length;
  const w = 320;
  const gap = 8;
  const boxW = (w - gap * (n - 1)) / n;
  return (
    <svg viewBox={`0 0 ${w} 56`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Pipeline flow">
      {steps.map((s, i) => {
        const x = i * (boxW + gap);
        return (
          <g key={s}>
            <rect className={boxClass(active === i, i === n - 1)} x={x} y={14} width={boxW} height={28} rx={5} />
            <text className="forge-svg-text" x={x + boxW / 2} y={31} textAnchor="middle" style={{ fontSize: '9px' }}>
              {s}
            </text>
            {i < n - 1 && (
              <path className="forge-svg-line" d={`M${x + boxW} 28 H${x + boxW + gap}`} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function KeyIdeaCard({ ideas }) {
  return (
    <ul className="forge-keycard">
      {ideas.map((idea, i) => (
        <li key={idea}>
          <span className="forge-keycard-num">{i + 1}</span>
          <span>{idea}</span>
        </li>
      ))}
    </ul>
  );
}

function PaperDiagram({ paper, active }) {
  switch (paper.diagram) {
    case 'transformer':
      return <TransformerDiagram active={active} />;
    case 'resnet':
      return <ResnetDiagram active={active} />;
    case 'unet':
      return <UnetDiagram active={active} />;
    case 'seq2seq':
      return <Seq2SeqDiagram active={active} />;
    case 'vae':
      return <VaeDiagram active={active} />;
    case 'diffusion':
      return <DiffusionDiagram active={active} />;
    case 'vit':
      return <VitDiagram active={active} />;
    case 'clip':
      return <ClipDiagram active={active} />;
    case 'rlhf':
      return <RlhfDiagram active={active} />;
    case 'flow':
      return paper.flow ? <FlowDiagram steps={paper.flow} active={active} /> : <KeyIdeaCard ideas={paper.ideas} />;
    default:
      return <KeyIdeaCard ideas={paper.ideas} />;
  }
}

const hasBespokeDiagram = (paper) =>
  paper.diagram === 'flow' ? Boolean(paper.flow) : paper.diagram !== undefined && paper.diagram !== 'keyideas';

function PaperCardVisual({ paper }) {
  const arch = getArchitecture(paper.id);
  const bespoke = hasBespokeDiagram(paper);
  if (arch) {
    return (
      <div className="forge-card-viz forge-card-viz-arch">
        <ArchitectureDiagram title={arch.title} blocks={arch.blocks} skips={arch.skips} />
      </div>
    );
  }
  if (bespoke) {
    return (
      <div className="forge-card-viz">
        <PaperDiagram paper={paper} />
      </div>
    );
  }
  return (
    <div className="forge-card-viz forge-card-viz-thumb">
      <ForgeThumb kind="paper" seed={paper.title} />
    </div>
  );
}

function PapersBrowse({ onOpen }) {
  return (
    <div className="forge-card-grid">
      {PAPERS.map((p) => (
        <button
          key={p.id}
          type="button"
          className="forge-paper-card"
          onClick={() => onOpen(p.id)}
        >
          <div className="forge-paper-card-viz">
            <PaperCardVisual paper={p} />
          </div>
          <div className="forge-paper-card-body">
            <h2 className="forge-paper-card-title">{p.title}</h2>
            <p className="forge-paper-card-authors">
              {p.authors.split(',')[0]} et al. · {p.year} · {p.venue}
            </p>
            <div className="forge-paper-card-tags">
              {p.topic && <span className="forge-chip forge-chip-topic">{p.topic}</span>}
              {p.difficulty && <span className="forge-chip forge-chip-diff">{p.difficulty}</span>}
              {p.steps && <span className="forge-chip">{p.steps.length} steps</span>}
            </div>
          </div>
          <span className="forge-paper-card-go">
            Build it <ArrowRight size={14} />
          </span>
        </button>
      ))}
    </div>
  );
}

function PaperDetail({ paper, index, onBack, onOpen }) {
  const [activeStep, setActiveStep] = useState(0);
  const [hoverBlock, setHoverBlock] = useState(undefined);

  const steps = paper.steps || [];
  const activeBlock = steps[activeStep] ? steps[activeStep].block : undefined;
  const arch = getArchitecture(paper.id);
  const archActiveBlock = hoverBlock !== undefined ? hoverBlock : activeBlock;
  const bespoke = hasBespokeDiagram(paper);

  const prev = index > 0 ? PAPERS[index - 1] : null;
  const next = index < PAPERS.length - 1 ? PAPERS[index + 1] : null;

  return (
    <>
      <button type="button" className="forge-detail-back" onClick={onBack}>
        <ArrowLeft size={14} /> All papers
      </button>

      <header className="forge-detail-head">
        <h1 className="forge-detail-title">{paper.title}</h1>
        <div className="forge-paper-meta">
          <span className="forge-chip">{paper.authors}</span>
          <span className="forge-chip forge-chip-year">{paper.year}</span>
          <span className="forge-chip">{paper.venue}</span>
          {paper.topic && <span className="forge-chip forge-chip-topic">{paper.topic}</span>}
          {paper.difficulty && <span className="forge-chip forge-chip-diff">{paper.difficulty}</span>}
        </div>
        <p className="forge-detail-summary">{paper.summary}</p>
        <a className="forge-paper-link" href={paper.link} target="_blank" rel="noopener noreferrer">
          Read the paper <ExternalLink size={14} />
        </a>
      </header>

      <div className="forge-paper-detail-grid">
        <div className="forge-paper-detail-main">
          {(arch || bespoke) && paper.ideas && (
            <section className="forge-paper-ideas-block">
              <p className="forge-paper-section-label">Key ideas</p>
              <KeyIdeaCard ideas={paper.ideas} />
            </section>
          )}

          <div className="forge-paper-steps-block">
            <div className="forge-paper-section-head">
              <BookOpen size={13} />
              <p className="forge-paper-section-label">Build it step by step</p>
              <span className="forge-step-count">{steps.length} steps</span>
            </div>
            <ol className="forge-steps">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <button
                    type="button"
                    className={`forge-step${i === activeStep ? ' is-active' : ''}`}
                    onClick={() => setActiveStep(i)}
                    onMouseEnter={() => {
                      setActiveStep(i);
                      setHoverBlock(step.block);
                    }}
                    onMouseLeave={() => setHoverBlock(undefined)}
                    onFocus={() => {
                      setActiveStep(i);
                      setHoverBlock(step.block);
                    }}
                    onBlur={() => setHoverBlock(undefined)}
                  >
                    <span className="forge-step-num">{i + 1}</span>
                    <span className="forge-step-body">
                      <span className="forge-step-title">{step.title}</span>
                      <span className="forge-step-detail">{step.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="forge-paper-detail-aside">
          <div className="forge-detail-diagram">
            <p className="forge-paper-section-label">
              {arch || bespoke ? 'Architecture' : 'Key ideas'}
            </p>
            {arch ? (
              <div className="forge-paper-diagram forge-paper-diagram-arch">
                <ArchitectureDiagram
                  title={arch.title}
                  blocks={arch.blocks}
                  skips={arch.skips}
                  activeBlock={archActiveBlock}
                />
              </div>
            ) : (
              <div className={`forge-paper-diagram${bespoke ? '' : ' is-keycard'}`}>
                <PaperDiagram paper={paper} active={bespoke ? activeBlock : undefined} />
              </div>
            )}
            {(arch || bespoke) && steps[activeStep] && (
              <p className="forge-diagram-caption">
                Step {activeStep + 1} · {steps[activeStep].title}
              </p>
            )}
          </div>
        </aside>
      </div>

      <nav className="forge-prevnext">
        {prev ? (
          <button type="button" className="forge-prevnext-card is-prev" onClick={() => onOpen(prev.id)}>
            <span className="forge-prevnext-dir"><ArrowLeft size={13} /> Previous</span>
            <span className="forge-prevnext-title">{prev.title}</span>
          </button>
        ) : (
          <span className="forge-prevnext-card is-empty" />
        )}
        {next ? (
          <button type="button" className="forge-prevnext-card is-next" onClick={() => onOpen(next.id)}>
            <span className="forge-prevnext-dir">Next <ArrowRight size={13} /></span>
            <span className="forge-prevnext-title">{next.title}</span>
          </button>
        ) : (
          <span className="forge-prevnext-card is-empty" />
        )}
      </nav>
    </>
  );
}

export default function PGForgePapers() {
  const [selectedId, setSelectedId] = useState(null);

  const selectedIndex = useMemo(
    () => PAPERS.findIndex((p) => p.id === selectedId),
    [selectedId],
  );
  const paper = selectedIndex >= 0 ? PAPERS[selectedIndex] : null;

  const openPaper = (id) => {
    setSelectedId(id);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  return (
    <div className="forge-papers">
      <nav className="forge-crumb">
        <Link to="/ml">PGForge</Link>
        <ChevronRight size={12} />
        {paper ? (
          <>
            <button type="button" className="forge-crumb-link" onClick={() => setSelectedId(null)}>
              Papers
            </button>
            <ChevronRight size={12} />
            <span className="forge-crumb-cur">{paper.title}</span>
          </>
        ) : (
          <span className="forge-crumb-cur">Papers</span>
        )}
      </nav>

      {!paper && (
        <header className="forge-head">
          <h1 className="forge-head-title">
            <span className="forge-head-pg">PG</span>
            <span className="forge-head-em">Forge</span> · Papers
          </h1>
          <p className="forge-head-sub">
            <FileText size={14} /> The papers that built modern ML, each broken into the steps of its method.
          </p>
        </header>
      )}

      {paper ? (
        <div className="forge-detail">
          <PaperDetail
            key={paper.id}
            paper={paper}
            index={selectedIndex}
            onBack={() => setSelectedId(null)}
            onOpen={openPaper}
          />
        </div>
      ) : (
        <PapersBrowse onOpen={openPaper} />
      )}
    </div>
  );
}
