import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { ChevronRight, ChevronDown, ExternalLink, BookOpen, ArrowLeft, ArrowRight, FileText, Sigma, Code2 } from 'lucide-react';
import './PGForgePapers.css';
import { PAPERS } from './pgForgePapersData';
import { getArchitecture, hueForIndex } from './pgForgeArchData';
import ArchitectureDiagram from './ArchitectureDiagram';

// Resolve a hue-cycle name to its theme token. 'accent' is the project teal
// (var(--accent)); the rest are data-viz hues (var(--hue-*)). Used so a step's
// number badge can carry the same colour as its architecture-diagram node.
function hueToken(name) {
  return name === 'accent' ? 'var(--accent)' : `var(--hue-${name})`;
}
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
      <ForgeThumb kind="paper" seed={paper.title} topic={paper.topic} />
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

// The expanded teaching panel for a step: full paragraph + optional KaTeX
// formula or code snippet + an optional link to the real PGForge problem.
// Rendered inline beneath each step's own toggle so several can stay open.
function StepExplanation({ step }) {
  if (!step) return null;
  return (
    <div className="forge-step-explain">
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
    </div>
  );
}

function PaperDetail({ paper, index, onBack, onOpen }) {
  const steps = paper.steps || [];
  // Each step expands independently: track an OPEN SET of indices, not a single
  // active step, so opening one never collapses another. The first step starts
  // open as a hint that the rows are expandable.
  const [openSteps, setOpenSteps] = useState(() => new Set(steps.length ? [0] : []));
  const [hoverBlock, setHoverBlock] = useState(undefined);
  // The diagram highlights the last step the reader touched (hover wins).
  const [focusedStep, setFocusedStep] = useState(0);

  const toggleStep = (i) => {
    setOpenSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    setFocusedStep(i);
  };

  const focusedBlock = steps[focusedStep] ? steps[focusedStep].block : undefined;
  const arch = getArchitecture(paper.id);
  const archActiveBlock = hoverBlock !== undefined ? hoverBlock : focusedBlock;

  // Each step's accent hue is the hue of the diagram node it points to, so the
  // step number badge and its architecture block share a colour (visual link).
  // The diagram assigns hue by block index, so we look up the first block whose
  // key matches this step's `block`; with no arch/match we fall back to the
  // step's own index. Deterministic and index-based — never random.
  const archBlocks = arch ? arch.blocks : [];
  const stepHue = (i) => {
    const step = steps[i];
    const blockIdx = step
      ? archBlocks.findIndex((b) => b.key === step.block)
      : -1;
    return hueToken(hueForIndex(blockIdx >= 0 ? blockIdx : i));
  };

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
              {steps.map((step, i) => {
                const isOpen = openSteps.has(i);
                const panelId = `forge-step-panel-${paper.id}-${i}`;
                return (
                  <li
                    key={step.title}
                    className={`forge-step-item${isOpen ? ' is-open' : ''}`}
                    style={{ '--step-hue': stepHue(i) }}
                  >
                    <button
                      type="button"
                      className="forge-step"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleStep(i)}
                      onMouseEnter={() => {
                        setFocusedStep(i);
                        setHoverBlock(step.block);
                      }}
                      onMouseLeave={() => setHoverBlock(undefined)}
                      onFocus={() => {
                        setFocusedStep(i);
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
                      <ChevronDown size={16} className="forge-step-chevron" />
                    </button>
                    {isOpen && (
                      <div id={panelId} className="forge-step-panel">
                        <StepExplanation step={step} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
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
            {steps[focusedStep] && (
              <p className="forge-diagram-caption">
                Step {focusedStep + 1} · {steps[focusedStep].title}
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
