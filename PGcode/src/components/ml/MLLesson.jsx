import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Info, Lightbulb } from 'lucide-react';
import { getLesson, getPillar } from '../../content/mlContent';
import VectorPlayground from './viz/VectorPlayground';
import MatrixTransform from './viz/MatrixTransform';
import GradientDescent from './viz/GradientDescent';
import AttentionHeatmap from './viz/AttentionHeatmap';
import NormBall from './viz/NormBall';
import SoftmaxViz from './viz/SoftmaxViz';
import NeuralNetViz from './viz/NeuralNetViz';
import ConvolutionViz from './viz/ConvolutionViz';
import './MLHub.css';
import './MLLesson.css';

const VIZ_REGISTRY = { VectorPlayground, MatrixTransform, GradientDescent, AttentionHeatmap, NormBall, SoftmaxViz, NeuralNetViz, ConvolutionViz };

function renderInlineMath(text) {
  const parts = [];
  let i = 0;
  const re = /\\\(([^)]+)\\\)/g;
  let m;
  let last = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<code className="ml-imath" key={i++}>{m[1]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderBold(text) {
  const parts = [];
  let i = 0;
  const re = /\*\*([^*]+)\*\*/g;
  let m;
  let last = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(...renderInlineMath(text.slice(last, m.index)));
    parts.push(<strong key={`b${i++}`}>{renderInlineMath(m[1])}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(...renderInlineMath(text.slice(last)));
  return parts;
}

function ProseBlock({ section, withHeading }) {
  const paragraphs = section.body.split(/\n\n+/);
  return (
    <>
      {withHeading && section.heading && <h2 className="ml-h">{section.heading}</h2>}
      {paragraphs.map((p, i) => (
        <p key={i} className="ml-p">{renderBold(p)}</p>
      ))}
    </>
  );
}

function AsciiBlock({ section }) {
  return (
    <div className="ml-ascii-wrap">
      <div className="ml-ascii-head">
        <span className="ml-ascii-head-dot">Diagram</span>
        {section.heading && <span>{section.heading}</span>}
      </div>
      <pre className="ml-ascii">{section.body}</pre>
      {section.caption && <p className="ml-caption">{section.caption}</p>}
    </div>
  );
}

function MathBlock({ section }) {
  const blocks = section.body.split(/\\\[([\s\S]+?)\\\]/g);
  return (
    <>
      {blocks.map((b, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="ml-math">{b.trim()}</pre>
        ) : (
          b.split(/\n\n+/).map((p, j) =>
            p.trim() ? (
              <p key={`${i}-${j}`} className="ml-p">
                {renderBold(p)}
              </p>
            ) : null
          )
        )
      )}
    </>
  );
}

function CodeBlock({ section }) {
  return (
    <div className="ml-code-wrap">
      <div className="ml-code-head">
        <span className="ml-ascii-head-dot"><span className="ml-code-lang">{section.language || 'code'}</span></span>
        {section.heading && <span>{section.heading}</span>}
      </div>
      <pre className="ml-code">
        <code>{section.body}</code>
      </pre>
    </div>
  );
}

function Callout({ section }) {
  const Icon = section.tone === 'tip' ? Lightbulb : Info;
  return (
    <aside className={`ml-callout ml-callout-${section.tone || 'note'}`}>
      <Icon size={16} />
      <div>{renderBold(section.body)}</div>
    </aside>
  );
}

/* Group sections into rows. A "row" is either:
   - one prose section paired with the immediately following non-prose section (ascii/math/code/callout) → side-by-side
   - one standalone prose section → full-width prose
   - one standalone non-prose section → full-width figure
   Heading lives with the prose block of each row. */
function groupRows(sections) {
  const rows = [];
  let i = 0;
  while (i < sections.length) {
    const s = sections[i];
    if (s.kind === 'prose') {
      const next = sections[i + 1];
      if (next && next.kind !== 'prose') {
        rows.push({ prose: s, figure: next });
        i += 2;
      } else {
        rows.push({ prose: s, figure: null });
        i += 1;
      }
    } else {
      rows.push({ prose: null, figure: s });
      i += 1;
    }
  }
  return rows;
}

function VizBlock({ section }) {
  const Comp = VIZ_REGISTRY[section.component];
  if (!Comp) return null;
  return (
    <div className="ml-viz-wrap">
      {section.heading && (
        <div className="ml-viz-head">
          <span className="ml-ascii-head-dot">Interactive</span>
          <span>{section.heading}</span>
        </div>
      )}
      <Comp {...(section.props || {})} />
    </div>
  );
}

function renderFigure(section) {
  switch (section.kind) {
    case 'viz': return <VizBlock section={section} />;
    case 'ascii': return <AsciiBlock section={section} />;
    case 'math': return <MathBlock section={section} />;
    case 'code': return <CodeBlock section={section} />;
    case 'callout': return <Callout section={section} />;
    default: return null;
  }
}

export default function MLLesson() {
  const { pillarSlug, lessonSlug } = useParams();
  const lesson = getLesson(pillarSlug, lessonSlug);
  const pillar = getPillar(pillarSlug);

  const rows = useMemo(() => lesson ? groupRows(lesson.sections) : [], [lesson]);

  const toc = useMemo(() => {
    if (!lesson) return [];
    return lesson.sections
      .filter(s => s.kind === 'prose' && s.heading)
      .map(s => s.heading);
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="ml-lesson">
        <Link to={pillar ? `/ml/${pillarSlug}` : '/ml'} className="learn-crumb">
          <ArrowLeft size={13} />
          <span>{pillar ? pillar.title : 'ML-DL-AI'}</span>
        </Link>
        <h1 className="ml-lesson-title">Not found</h1>
        <p className="ml-lesson-sub">No lesson "{lessonSlug}" in {pillar?.title || pillarSlug}.</p>
      </div>
    );
  }

  return (
    <div className="ml-lesson">
      <Link to={`/ml/${pillarSlug}`} className="learn-crumb">
        <ArrowLeft size={13} />
        <span>ML-DL-AI</span>
        <span className="learn-crumb-sep">/</span>
        <span>{pillar.title}</span>
        <span className="learn-crumb-sep">/</span>
        <span className="learn-crumb-here">{lesson.title}</span>
      </Link>

      <header className="ml-lesson-hero">
        <div className="ml-lesson-hero-text">
          <div className="ml-lesson-meta">
            <span>{lesson.difficulty}</span>
            <span>·</span>
            <span>{lesson.readMinutes} min read</span>
          </div>
          <h1 className="ml-lesson-title">{lesson.title}</h1>
          <p className="ml-lesson-sub">{lesson.oneLiner}</p>
        </div>

        {toc.length > 0 && (
          <nav className="ml-lesson-toc" aria-label="On this page">
            <h2 className="ml-lesson-toc-title">On this page</h2>
            <ol className="ml-lesson-toc-list">
              {toc.map((t) => <li key={t}>{t}</li>)}
            </ol>
          </nav>
        )}
      </header>

      <article className="ml-lesson-body">
        {rows.map((r, idx) => {
          if (r.prose && r.figure) {
            return (
              <section key={idx} className="ml-row">
                <div className="ml-row-prose">
                  <ProseBlock section={r.prose} withHeading />
                </div>
                <div className="ml-row-figure">
                  {renderFigure(r.figure)}
                </div>
              </section>
            );
          }
          if (r.prose) {
            return (
              <section key={idx} className="ml-row ml-row-solo">
                <div className="ml-row-prose">
                  <ProseBlock section={r.prose} withHeading />
                </div>
              </section>
            );
          }
          return (
            <section key={idx} className="ml-row ml-row-full">
              {renderFigure(r.figure)}
            </section>
          );
        })}
      </article>
    </div>
  );
}
