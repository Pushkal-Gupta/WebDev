import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ExternalLink,
  Code2,
  Lightbulb,
  Layers,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Sparkles,
  Eye,
  Gauge,
  Hammer,
  Wand2,
  ListChecks,
  Clock,
  Target,
} from 'lucide-react';
import { recordLocalVisit } from '../../lib/achievements';
import {
  useConcept,
  useConceptProblems,
  useConceptPrereqs,
  useModules,
  useModuleConcepts,
} from '../../lib/queries';
import ConceptQuiz from './ConceptQuiz';
import ComplexityChart from './ComplexityChart';
import Discussion from '../Discussion';
import AlgoVisualizer, {
  ArrayBarRenderer,
  GraphRenderer,
  SlidingWindowRenderer,
  NumberGridRenderer,
  TreeRenderer,
} from './AlgoVisualizer';
import { VISUALIZATIONS } from './conceptVisualizations';
import { INTERACTIVE_VIZ } from './interactiveViz';
import RunnableCodePanel from '../RunnableCodePanel';
import Markdown from './MarkdownRenderer';
import Breadcrumb from '../common/Breadcrumb';
import './Learn.css';

const LANG_TABS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

function hasContent(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(hasContent);
  return Boolean(value);
}

function estimateReadMinutes(body, code) {
  let words = 0;
  const walk = (v) => {
    if (!v) return;
    if (typeof v === 'string') {
      words += v.split(/\s+/).filter(Boolean).length;
    } else if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (typeof v === 'object') {
      Object.values(v).forEach(walk);
    }
  };
  walk(body);
  const codeLines = Object.values(code || {}).reduce(
    (n, src) => n + (typeof src === 'string' ? src.split('\n').length : 0),
    0,
  );
  const minutes = Math.max(1, Math.round(words / 220 + codeLines / 60));
  return minutes;
}

function pickFirst(...vals) {
  for (const v of vals) if (hasContent(v)) return v;
  return null;
}

function Section({ id, eyebrow, title, icon: Icon, variant, children }) {
  if (!hasContent(children)) return null;
  return (
    <section id={id} className={`cp-section cp-section-${variant || 'plain'}`}>
      <header className="cp-section-head">
        {Icon && (
          <span className="cp-section-icon" aria-hidden="true">
            <Icon size={14} />
          </span>
        )}
        <div className="cp-section-headtext">
          {eyebrow && <span className="cp-section-eyebrow">{eyebrow}</span>}
          <h2 className="cp-section-title">{title}</h2>
        </div>
      </header>
      <div className="cp-section-body">{children}</div>
    </section>
  );
}

function PitfallList({ items }) {
  if (Array.isArray(items)) {
    return (
      <ul className="cp-callout-list">
        {items.map((p, i) => (
          <li key={i}>
            <AlertTriangle size={13} className="cp-callout-bullet cp-callout-bullet-hard" />
            <span><Markdown inline>{p}</Markdown></span>
          </li>
        ))}
      </ul>
    );
  }
  return <Markdown>{items}</Markdown>;
}

function TipList({ items }) {
  if (Array.isArray(items)) {
    return (
      <ul className="cp-callout-list">
        {items.map((t, i) => (
          <li key={i}>
            <Lightbulb size={13} className="cp-callout-bullet cp-callout-bullet-easy" />
            <span><Markdown inline>{t}</Markdown></span>
          </li>
        ))}
      </ul>
    );
  }
  return <Markdown>{items}</Markdown>;
}

export default function ConceptPage({ session }) {
  const { moduleSlug, conceptSlug } = useParams();
  const { data: concept, isLoading, isError, error } = useConcept(conceptSlug);
  const { data: problems = [] } = useConceptProblems(conceptSlug);
  const { data: prereqs = [] } = useConceptPrereqs(conceptSlug);
  const { data: modules = [] } = useModules();
  const { data: siblings = [] } = useModuleConcepts(concept?.module_slug || moduleSlug);
  const [activeLang, setActiveLang] = useState('python');
  const [activeSection, setActiveSection] = useState(null);

  const body = useMemo(() => concept?.body || {}, [concept]);
  const code = useMemo(() => concept?.code || {}, [concept]);
  const viz = concept ? VISUALIZATIONS[concept.slug] : null;
  const InteractiveViz = concept ? INTERACTIVE_VIZ[concept.slug] : null;

  useEffect(() => {
    if (conceptSlug) recordLocalVisit('concepts', conceptSlug);
  }, [conceptSlug]);

  const readMinutes = useMemo(() => {
    if (concept?.body?.estimatedReadMinutes) return concept.body.estimatedReadMinutes;
    if (!concept) return null;
    return estimateReadMinutes(body, code);
  }, [concept, body, code]);

  const availableLangs = useMemo(
    () => LANG_TABS.filter((t) => hasContent(code[t.value])),
    [code],
  );

  const resolvedLang = useMemo(() => {
    if (!availableLangs.length) return activeLang;
    if (availableLangs.find((l) => l.value === activeLang)) return activeLang;
    return availableLangs[0].value;
  }, [availableLangs, activeLang]);

  const { showComplexityTime, showComplexitySpace, showComplexitySection } = useMemo(() => {
    const isNA = (val) => {
      if (!val || typeof val !== 'string') return true;
      const v = val.toLowerCase().trim();
      return !v || v.includes('not applicable') || v === 'n/a' || v === 'na' || v.startsWith('n/a');
    };
    const time = !!(body.complexity?.time) && !isNA(body.complexity.time);
    const space = !!(body.complexity?.space) && !isNA(body.complexity.space);
    const show =
      hasContent(body.complexity) && (time || space || !!body.complexity?.notes);
    return { showComplexityTime: time, showComplexitySpace: space, showComplexitySection: show };
  }, [body.complexity]);

  const sectionDefs = useMemo(() => {
    if (!concept) return [];
    const defs = [];
    if (hasContent(body.intro)) defs.push({ id: 'overview', label: 'Overview' });
    if (hasContent(body.whyItMatters)) defs.push({ id: 'why', label: 'Why it matters' });
    if (hasContent(body.intuition)) defs.push({ id: 'intuition', label: 'Intuition' });
    if (hasContent(body.visualization) || viz || InteractiveViz) defs.push({ id: 'visualization', label: 'Visualization' });
    if (hasContent(body.bruteForce)) defs.push({ id: 'brute', label: 'Brute force' });
    if (hasContent(body.optimal)) defs.push({ id: 'optimal', label: 'Optimal' });
    if (showComplexitySection) defs.push({ id: 'complexity', label: 'Complexity' });
    if (availableLangs.length) defs.push({ id: 'code', label: 'Code' });
    if (hasContent(body.pitfalls)) defs.push({ id: 'pitfalls', label: 'Pitfalls' });
    if (hasContent(body.interviewTips)) defs.push({ id: 'tips', label: 'Interview tips' });
    if (problems.length) defs.push({ id: 'related', label: 'Related problems' });
    defs.push({ id: 'quiz', label: 'Check understanding' });
    defs.push({ id: 'discussion', label: 'Discussion' });
    return defs;
  }, [concept, body, viz, InteractiveViz, availableLangs, problems, showComplexitySection]);

  const observerRef = useRef(null);
  useEffect(() => {
    if (!sectionDefs.length) return undefined;
    if (observerRef.current) observerRef.current.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      {
        root: null,
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 1],
      },
    );
    observerRef.current = observer;
    sectionDefs.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionDefs]);

  const handleJump = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const { prevConcept, nextConcept } = useMemo(() => {
    if (!concept || !siblings.length) return { prevConcept: null, nextConcept: null };
    const idx = siblings.findIndex((s) => s.slug === concept.slug);
    if (idx === -1) return { prevConcept: null, nextConcept: null };
    return {
      prevConcept: idx > 0 ? siblings[idx - 1] : null,
      nextConcept: idx < siblings.length - 1 ? siblings[idx + 1] : null,
    };
  }, [concept, siblings]);

  const fallbackCrumb = [
    { label: 'Learn', to: '/learn' },
    { label: moduleSlug, to: `/learn/${moduleSlug}` },
    { label: 'Concept' },
  ];

  if (isLoading) {
    return (
      <div className="learn-container">
        <Breadcrumb items={fallbackCrumb} />
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
        <Breadcrumb items={fallbackCrumb} />
        <div className="learn-empty">
          <h2 className="learn-empty-title">Couldn&rsquo;t load this concept</h2>
          <p className="learn-empty-sub">{error?.message || 'Network error.'}</p>
        </div>
      </div>
    );
  }

  if (!concept) {
    if (conceptSlug && VISUALIZATIONS[conceptSlug]) {
      return <Navigate to={`/visualize/${conceptSlug}`} replace />;
    }
    return (
      <div className="learn-container">
        <Breadcrumb items={fallbackCrumb} />
        <div className="learn-empty">
          <h2 className="learn-empty-title">Concept not found</h2>
          <p className="learn-empty-sub">Nothing here for this slug.</p>
        </div>
      </div>
    );
  }

  const module_ = modules.find((m) => m.slug === concept.module_slug);
  const introText = pickFirst(body.intro);
  const visualizationText = pickFirst(body.visualization);
  const references = concept.metadata?.references?.filter((r) => r?.title) || [];

  return (
    <div className="learn-container learn-concept-page cp-page">
      <Breadcrumb
        items={[
          { label: 'Learn', to: '/learn' },
          { label: module_?.name || moduleSlug, to: `/learn/${moduleSlug}` },
          { label: concept.title || 'Concept' },
        ]}
      />

      <header className="learn-concept-header cp-header">
        <h1 className="learn-concept-page-title">{concept.title}</h1>
        {concept.subtitle && (
          <p className="learn-concept-page-subtitle">{concept.subtitle}</p>
        )}
        <div className="learn-concept-meta cp-meta">
          {concept.difficulty && (
            <span
              className={`learn-concept-diff learn-concept-diff-${concept.difficulty.toLowerCase()}`}
            >
              {concept.difficulty}
            </span>
          )}
          {readMinutes && (
            <span className="cp-meta-badge">
              <Clock size={11} />
              {readMinutes} min read
            </span>
          )}
          {sectionDefs.length > 1 && (
            <span className="cp-meta-badge">
              <ListChecks size={11} />
              {sectionDefs.length} sections
            </span>
          )}
        </div>
      </header>

      <div className="cp-grid">
        <main className="cp-main">
          <Section id="overview" eyebrow="01" title="Overview" icon={BookOpen} variant="plain">
            {introText && <Markdown>{introText}</Markdown>}
          </Section>

          <Section
            id="why"
            eyebrow="02"
            title="Why it matters"
            icon={Sparkles}
            variant="why"
          >
            {hasContent(body.whyItMatters) && <Markdown>{body.whyItMatters}</Markdown>}
          </Section>

          <Section
            id="intuition"
            eyebrow="03"
            title="Intuition"
            icon={Lightbulb}
            variant="intuition"
          >
            {hasContent(body.intuition) && <Markdown>{body.intuition}</Markdown>}
          </Section>

          {(hasContent(visualizationText) || viz || InteractiveViz) && (
            <Section
              id="visualization"
              eyebrow="04"
              title="Visualization"
              icon={Eye}
              variant="visualization"
            >
              {hasContent(visualizationText) && (
                <pre className="cp-viz-text">
                  <code>{visualizationText}</code>
                </pre>
              )}
              {viz && (
                <AlgoVisualizer
                  title={viz.title}
                  frames={viz.frames}
                  cases={viz.cases}
                  build={viz.build}
                  inputSchema={viz.inputSchema}
                  render={(frame) => {
                    const r = viz.renderer;
                    if (r === 'graph') return <GraphRenderer frame={frame} />;
                    if (r === 'window') return <SlidingWindowRenderer frame={frame} />;
                    if (r === 'grid') return <NumberGridRenderer frame={frame} />;
                    if (r === 'tree') return <TreeRenderer frame={frame} />;
                    return <ArrayBarRenderer frame={frame} />;
                  }}
                />
              )}
              {InteractiveViz && (
                <div className="cp-interactive-viz">
                  <h3 className="cp-interactive-viz-title">Try it yourself</h3>
                  <InteractiveViz />
                </div>
              )}
            </Section>
          )}

          <Section
            id="brute"
            eyebrow="05"
            title="Brute force"
            icon={Hammer}
            variant="plain"
          >
            {hasContent(body.bruteForce) && <Markdown>{body.bruteForce}</Markdown>}
          </Section>

          <Section
            id="optimal"
            eyebrow="06"
            title="Optimal approach"
            icon={Wand2}
            variant="plain"
          >
            {hasContent(body.optimal) && <Markdown>{body.optimal}</Markdown>}
          </Section>

          {showComplexitySection && (
            <Section
              id="complexity"
              eyebrow="07"
              title="Complexity"
              icon={Gauge}
              variant="plain"
            >
              <div className="learn-complexity">
                {showComplexityTime && (
                  <div className="learn-complexity-cell">
                    <span className="learn-complexity-label">Time</span>
                    <code className="learn-complexity-value"><Markdown inline>{body.complexity.time}</Markdown></code>
                  </div>
                )}
                {showComplexitySpace && (
                  <div className="learn-complexity-cell">
                    <span className="learn-complexity-label">Space</span>
                    <code className="learn-complexity-value"><Markdown inline>{body.complexity.space}</Markdown></code>
                  </div>
                )}
              </div>
              {body.complexity.notes && (
                <div className="learn-complexity-notes">
                  <Markdown>{body.complexity.notes}</Markdown>
                </div>
              )}
              {showComplexityTime && <ComplexityChart time={body.complexity.time} />}
            </Section>
          )}

          {availableLangs.length > 0 && (
            <Section
              id="code"
              eyebrow="08"
              title="Reference implementation"
              icon={Code2}
              variant="plain"
            >
              <RunnableCodePanel code={code} lang={resolvedLang} onLanguageChange={setActiveLang} />
            </Section>
          )}

          {hasContent(body.pitfalls) && (
            <Section
              id="pitfalls"
              eyebrow="09"
              title="Common pitfalls"
              icon={AlertTriangle}
              variant="pitfalls"
            >
              <PitfallList items={body.pitfalls} />
            </Section>
          )}

          {hasContent(body.interviewTips) && (
            <Section
              id="tips"
              eyebrow="10"
              title="Interview tips"
              icon={Lightbulb}
              variant="tips"
            >
              <TipList items={body.interviewTips} />
            </Section>
          )}

          {problems.length > 0 && (
            <Section
              id="related"
              eyebrow="11"
              title="Related problems"
              icon={Target}
              variant="plain"
            >
              <ul className="cp-related-list">
                {problems.map((p) => (
                  <li key={p.id}>
                    <Link to={`/category/${p.topic_id}/${p.id}`} className="cp-related-row">
                      <span className="cp-related-name">{p.name}</span>
                      <span className="cp-related-meta">
                        {p.difficulty && (
                          <span
                            className={`learn-aside-diff learn-concept-diff-${p.difficulty?.toLowerCase()}`}
                          >
                            {p.difficulty}
                          </span>
                        )}
                        <ArrowRight size={13} className="cp-related-arrow" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section
            id="quiz"
            eyebrow="12"
            title="Check your understanding"
            icon={HelpCircle}
            variant="plain"
          >
            <ConceptQuiz concept={concept} />
          </Section>

          <Section
            id="discussion"
            eyebrow="13"
            title="Discussion"
            icon={BookOpen}
            variant="plain"
          >
            <Discussion targetKind="concept" targetId={concept.slug} session={session} />
          </Section>

          {(prevConcept || nextConcept) && (
            <nav className="cp-pager" aria-label="Concept navigation">
              {prevConcept ? (
                <Link
                  to={`/learn/${prevConcept.module_slug}/${prevConcept.slug}`}
                  className="cp-pager-link cp-pager-prev"
                >
                  <ChevronLeft size={14} />
                  <span>
                    <span className="cp-pager-eyebrow">Previous</span>
                    <span className="cp-pager-title">{prevConcept.title}</span>
                  </span>
                </Link>
              ) : (
                <span className="cp-pager-link cp-pager-empty" />
              )}
              {nextConcept ? (
                <Link
                  to={`/learn/${nextConcept.module_slug}/${nextConcept.slug}`}
                  className="cp-pager-link cp-pager-next"
                >
                  <span>
                    <span className="cp-pager-eyebrow">Next</span>
                    <span className="cp-pager-title">{nextConcept.title}</span>
                  </span>
                  <ChevronRight size={14} />
                </Link>
              ) : (
                <span className="cp-pager-link cp-pager-empty" />
              )}
            </nav>
          )}
        </main>

        <aside className="cp-aside">
          {sectionDefs.length > 1 && (
            <div className="cp-toc">
              <h3 className="cp-toc-title">On this page</h3>
              <ul className="cp-toc-list">
                {sectionDefs.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={handleJump(s.id)}
                      className={`cp-toc-link${activeSection === s.id ? ' active' : ''}`}
                    >
                      <span className="cp-toc-rail" aria-hidden="true" />
                      <span className="cp-toc-label">{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prereqs.length > 0 && (
            <div className="learn-aside-card cp-aside-card">
              <h3 className="learn-aside-title">Before this, learn</h3>
              <ul className="learn-aside-list">
                {prereqs.map((p) => (
                  <li key={p.slug}>
                    <Link
                      to={`/learn/${p.module_slug}/${p.slug}`}
                      className="learn-aside-row"
                    >
                      <span className="learn-aside-name">{p.title}</span>
                      {p.difficulty && (
                        <span
                          className={`learn-aside-diff learn-concept-diff-${p.difficulty.toLowerCase()}`}
                        >
                          {p.difficulty}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {references.length > 0 && (
            <div className="learn-aside-card cp-aside-card">
              <h3 className="learn-aside-title">References</h3>
              <ul className="learn-aside-list">
                {references.map((r, i) => (
                  <li key={i}>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="learn-aside-row"
                      >
                        <span className="learn-aside-name">{r.title}</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="learn-aside-row">
                        <span className="learn-aside-name">{r.title}</span>
                      </span>
                    )}
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
