import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft, ExternalLink, Code2, Lightbulb, Layers, AlertTriangle, BookOpen, HelpCircle } from 'lucide-react';
import { useConcept, useConceptProblems, useConceptPrereqs, useModules } from '../../lib/queries';
import ConceptQuiz from './ConceptQuiz';
import ComplexityChart from './ComplexityChart';
import AlgoVisualizer, { ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer, NumberGridRenderer, TreeRenderer } from './AlgoVisualizer';
import { VISUALIZATIONS } from './conceptVisualizations';
import './Learn.css';

const LANG_TABS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

function CodeBlock({ code }) {
  if (!code) return <p className="learn-empty-sub">No code sample for this language yet.</p>;
  return (
    <pre className="learn-code">
      <code>{code}</code>
    </pre>
  );
}

function Section({ title, icon: Icon, children, accent }) {
  if (!children || (typeof children === 'string' && !children.trim())) return null;
  return (
    <section className={`learn-section${accent ? ' learn-section-accent' : ''}`}>
      <h2 className="learn-section-title">
        {Icon && <Icon size={14} className="learn-section-icon" />}
        {title}
      </h2>
      <div className="learn-section-body">{children}</div>
    </section>
  );
}

export default function ConceptPage({ session: _session }) {
  const { moduleSlug, conceptSlug } = useParams();
  const { data: concept, isLoading, isError, error } = useConcept(conceptSlug);
  const { data: problems = [] } = useConceptProblems(conceptSlug);
  const { data: prereqs = [] } = useConceptPrereqs(conceptSlug);
  const { data: modules = [] } = useModules();
  const [activeLang, setActiveLang] = useState('python');

  if (isLoading) {
    return (
      <div className="learn-container">
        <div className="learn-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="learn-container">
        <div className="learn-empty">
          <h2 className="learn-empty-title">Couldn&rsquo;t load this concept</h2>
          <p className="learn-empty-sub">{error?.message || 'Network error.'}{' '}
            <Link to="/learn">Back to library</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="learn-container">
        <div className="learn-empty">
          <h2 className="learn-empty-title">Concept not found</h2>
          <p className="learn-empty-sub">
            This concept hasn&rsquo;t been published yet. <Link to="/learn">Back to library</Link>.
          </p>
        </div>
      </div>
    );
  }

  const body = concept.body || {};
  const code = concept.code || {};
  const module_ = modules.find(m => m.slug === concept.module_slug);

  return (
    <div className="learn-container learn-concept-page">
      <nav className="learn-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/learn">Learn</Link>
        <ChevronRight size={12} />
        <Link to={`/learn/${moduleSlug}`}>{module_?.name || moduleSlug}</Link>
        <ChevronRight size={12} />
        <span>{concept.title}</span>
      </nav>

      <header className="learn-concept-header">
        <Link to={`/learn/${moduleSlug}`} className="learn-back">
          <ArrowLeft size={14} /> Back to module
        </Link>
        <h1 className="learn-concept-page-title">{concept.title}</h1>
        {concept.subtitle && <p className="learn-concept-page-subtitle">{concept.subtitle}</p>}
        <div className="learn-concept-meta">
          {concept.difficulty && (
            <span className={`learn-concept-diff learn-concept-diff-${concept.difficulty.toLowerCase()}`}>
              {concept.difficulty}
            </span>
          )}
          {body.estimatedReadMinutes && (
            <span className="learn-concept-meta-item">{body.estimatedReadMinutes} min read</span>
          )}
        </div>
      </header>

      <div className="learn-concept-grid">
        <main className="learn-concept-main">
          <Section title="Overview" icon={BookOpen}>
            {body.intro && <p>{body.intro}</p>}
            {body.whyItMatters && (
              <>
                <h3 className="learn-section-h3">Why it matters</h3>
                <p>{body.whyItMatters}</p>
              </>
            )}
          </Section>

          <Section title="Intuition" icon={Lightbulb} accent>
            {body.intuition && <p>{body.intuition}</p>}
            {body.visualization && (
              <>
                <h3 className="learn-section-h3">Visualization</h3>
                <p>{body.visualization}</p>
              </>
            )}
            {VISUALIZATIONS[concept.slug] && (
              <AlgoVisualizer
                title={VISUALIZATIONS[concept.slug].title}
                frames={VISUALIZATIONS[concept.slug].frames}
                cases={VISUALIZATIONS[concept.slug].cases}
                build={VISUALIZATIONS[concept.slug].build}
                inputSchema={VISUALIZATIONS[concept.slug].inputSchema}
                render={(frame) => {
                  const r = VISUALIZATIONS[concept.slug].renderer;
                  if (r === 'graph') return <GraphRenderer frame={frame} />;
                  if (r === 'window') return <SlidingWindowRenderer frame={frame} />;
                  if (r === 'grid') return <NumberGridRenderer frame={frame} />;
                  if (r === 'tree') return <TreeRenderer frame={frame} />;
                  return <ArrayBarRenderer frame={frame} />;
                }}
              />
            )}
          </Section>

          <Section title="Approaches" icon={Layers}>
            {body.bruteForce && (
              <>
                <h3 className="learn-section-h3">Brute force</h3>
                <p>{body.bruteForce}</p>
              </>
            )}
            {body.optimal && (
              <>
                <h3 className="learn-section-h3">Optimal approach</h3>
                <p>{body.optimal}</p>
              </>
            )}
          </Section>

          {body.complexity && (
            <Section title="Complexity">
              <div className="learn-complexity">
                {body.complexity.time && (
                  <div className="learn-complexity-cell">
                    <span className="learn-complexity-label">Time</span>
                    <code className="learn-complexity-value">{body.complexity.time}</code>
                  </div>
                )}
                {body.complexity.space && (
                  <div className="learn-complexity-cell">
                    <span className="learn-complexity-label">Space</span>
                    <code className="learn-complexity-value">{body.complexity.space}</code>
                  </div>
                )}
              </div>
              {body.complexity.notes && <p className="learn-complexity-notes">{body.complexity.notes}</p>}
              {body.complexity.time && <ComplexityChart time={body.complexity.time} />}
            </Section>
          )}

          {Object.keys(code).length > 0 && (
            <Section title="Reference implementation" icon={Code2}>
              <div className="learn-code-tabs">
                {LANG_TABS.map(t => (
                  <button
                    key={t.value}
                    className={`learn-code-tab ${activeLang === t.value ? 'active' : ''}`}
                    onClick={() => setActiveLang(t.value)}
                    disabled={!code[t.value]}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <CodeBlock code={code[activeLang]} />
            </Section>
          )}

          <Section title="Common pitfalls" icon={AlertTriangle}>
            {Array.isArray(body.pitfalls) ? (
              <ul className="learn-list">
                {body.pitfalls.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            ) : body.pitfalls ? (
              <p>{body.pitfalls}</p>
            ) : null}
          </Section>

          <Section title="Interview tips">
            {Array.isArray(body.interviewTips) ? (
              <ul className="learn-list">
                {body.interviewTips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            ) : body.interviewTips ? (
              <p>{body.interviewTips}</p>
            ) : null}
          </Section>

          <Section title="Check your understanding" icon={HelpCircle}>
            <ConceptQuiz concept={concept} />
          </Section>
        </main>

        <aside className="learn-concept-aside">
          {prereqs.length > 0 && (
            <div className="learn-aside-card">
              <h3 className="learn-aside-title">Before this, learn</h3>
              <ul className="learn-aside-list">
                {prereqs.map(p => (
                  <li key={p.slug}>
                    <Link to={`/learn/${p.module_slug}/${p.slug}`} className="learn-aside-row">
                      <span className="learn-aside-name">{p.title}</span>
                      {p.difficulty && (
                        <span className={`learn-aside-diff learn-concept-diff-${p.difficulty.toLowerCase()}`}>
                          {p.difficulty}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="learn-aside-card">
            <h3 className="learn-aside-title">Practice problems</h3>
            {problems.length > 0 ? (
              <ul className="learn-aside-list">
                {problems.map(p => (
                  <li key={p.id}>
                    <Link to={`/category/${p.topic_id}/${p.id}`} className="learn-aside-row">
                      <span className="learn-aside-name">{p.name}</span>
                      <span className={`learn-aside-diff learn-concept-diff-${p.difficulty?.toLowerCase()}`}>
                        {p.difficulty}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="learn-empty-sub">No problems linked yet.</p>
            )}
          </div>

          {concept.metadata?.references?.length > 0 && (
            <div className="learn-aside-card">
              <h3 className="learn-aside-title">References</h3>
              <ul className="learn-aside-list">
                {concept.metadata.references.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="learn-aside-row">
                      <span className="learn-aside-name">{r.title}</span>
                      <ExternalLink size={12} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
