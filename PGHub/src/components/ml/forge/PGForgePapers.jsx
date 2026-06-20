import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { ChevronRight, ExternalLink, BookOpen, ArrowLeft, ArrowRight, FileText, Sigma, Code2 } from 'lucide-react';
import './PGForgePapers.css';
import { PAPERS } from './pgForgePapersData';
import { getArchitecture } from './pgForgeArchData';
import ArchitectureDiagram from './ArchitectureDiagram';
import ForgeThumb from './ForgeThumb';

// Render a KaTeX display formula to HTML the same way MLLesson does, so we
// never ship raw LaTeX backslashes to the page.
function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: true, output: 'html' });
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

// Every paper now carries vertical architecture data, so the card visual is
// always the vertical ArchitectureDiagram (with a ForgeThumb fallback only if
// data is somehow missing). No horizontal/bespoke SVGs are rendered anywhere.
function PaperCardVisual({ paper }) {
  const arch = getArchitecture(paper.id);
  if (arch) {
    return (
      <div className="forge-card-viz forge-card-viz-arch">
        <ArchitectureDiagram title={arch.title} blocks={arch.blocks} skips={arch.skips} />
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

// The expanded teaching panel for the active step: full paragraph + optional
// KaTeX formula or code snippet + an optional link to the real PGForge problem.
function StepExplanation({ step, index }) {
  if (!step) return null;
  return (
    <section className="forge-step-explain">
      <div className="forge-step-explain-head">
        <span className="forge-step-explain-num">{index + 1}</span>
        <h3 className="forge-step-explain-title">{step.title}</h3>
      </div>
      <p className="forge-step-explain-body">{step.explanation || step.detail}</p>
      {step.formula && (
        <div className="forge-step-formula">
          <span className="forge-step-aside-label"><Sigma size={12} /> Formula</span>
          <div
            className="forge-step-formula-math"
            dangerouslySetInnerHTML={{ __html: katexHtml(step.formula) }}
          />
        </div>
      )}
      {step.code && (
        <div className="forge-step-code">
          <span className="forge-step-aside-label"><Code2 size={12} /> Snippet</span>
          <pre className="forge-step-code-pre"><code>{step.code}</code></pre>
        </div>
      )}
      {step.problem && (
        <Link to={`/ml/problems/${step.problem}`} className="forge-step-solve">
          Solve this <ArrowRight size={14} />
        </Link>
      )}
    </section>
  );
}

function PaperDetail({ paper, index, onBack, onOpen }) {
  const [activeStep, setActiveStep] = useState(0);
  const [hoverBlock, setHoverBlock] = useState(undefined);

  const steps = paper.steps || [];
  const activeBlock = steps[activeStep] ? steps[activeStep].block : undefined;
  const arch = getArchitecture(paper.id);
  const archActiveBlock = hoverBlock !== undefined ? hoverBlock : activeBlock;

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
          {paper.ideas && (
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
                      {step.problem && (
                        <span className="forge-step-tag">has practice problem</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <StepExplanation step={steps[activeStep]} index={activeStep} />
          </div>
        </div>

        <aside className="forge-paper-detail-aside">
          <div className="forge-detail-diagram">
            <p className="forge-paper-section-label">Architecture</p>
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
              <div className="forge-paper-diagram is-keycard">
                <KeyIdeaCard ideas={paper.ideas || []} />
              </div>
            )}
            {steps[activeStep] && (
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
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        {paper ? (
          <>
            <button type="button" className="forge-crumb-link" onClick={() => setSelectedId(null)}>
              Papers
            </button>
            <ChevronRight size={13} />
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
