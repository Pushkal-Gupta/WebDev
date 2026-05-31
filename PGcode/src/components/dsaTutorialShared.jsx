import React, { useState, useEffect, useRef, useId, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, ChevronDown, ChevronRight, CheckCircle2, Circle,
  Lock, ExternalLink, Info, AlertTriangle, Lightbulb,
  Gauge, AlertCircle, Brain, Cog, Target, GitBranch, ListChecks, Wrench,
  ListOrdered, Copy, Check, Link as LinkIcon, Film,
} from 'lucide-react';

import { normName } from './dsaTutorialUtils';
import AlgoVisualizer, {
  ArrayBarRenderer, GraphRenderer, SlidingWindowRenderer,
  NumberGridRenderer, TreeRenderer,
} from './learn/AlgoVisualizer';
import { VISUALIZATIONS } from './learn/conceptVisualizations';

// Cache a normalized-label -> viz-slug map so theory items without an explicit
// `conceptSlug` can still resolve to a registered visualization.
const VIZ_BY_NORM_LABEL = (() => {
  const m = new Map();
  Object.keys(VISUALIZATIONS).forEach(slug => m.set(normName(slug), slug));
  return m;
})();

function resolveVizSlug({ explicitSlug, conceptSlug, label }) {
  const candidates = [explicitSlug, conceptSlug];
  for (const c of candidates) {
    if (c && VISUALIZATIONS[c]) return c;
  }
  const n = normName(label);
  if (VIZ_BY_NORM_LABEL.has(n)) return VIZ_BY_NORM_LABEL.get(n);
  return null;
}

function renderForSlug(slug, frame) {
  const r = VISUALIZATIONS[slug]?.renderer;
  if (r === 'graph')  return <GraphRenderer frame={frame} />;
  if (r === 'window') return <SlidingWindowRenderer frame={frame} />;
  if (r === 'grid')   return <NumberGridRenderer frame={frame} />;
  if (r === 'tree')   return <TreeRenderer frame={frame} />;
  return <ArrayBarRenderer frame={frame} />;
}

function InlineVisualizer({ slug }) {
  const viz = useMemo(() => VISUALIZATIONS[slug], [slug]);
  if (!viz) return null;
  return (
    <div className="tut-theory-viz">
      <div className="tut-theory-viz-head">
        <Film size={12} />
        <span>{viz.title || 'Visualization'}</span>
      </div>
      <AlgoVisualizer
        frames={viz.frames}
        cases={viz.cases}
        build={viz.build}
        inputSchema={viz.inputSchema}
        render={(frame) => renderForSlug(slug, frame)}
      />
    </div>
  );
}

function highlightLabel(label, q) {
  if (!q) return label;
  const lower = label.toLowerCase();
  const i = lower.indexOf(q);
  if (i === -1) return label;
  return (
    <>
      {label.slice(0, i)}
      <mark>{label.slice(i, i + q.length)}</mark>
      {label.slice(i + q.length)}
    </>
  );
}

export function TutorialItem({ item, problemByName, conceptByName, byId, highlight }) {
  const [expanded, setExpanded] = useState(false);
  if (item.kind === 'topic') {
    const concept = item.conceptSlug
      ? null
      : conceptByName.get(normName(item.label));
    const slug = item.conceptSlug || concept?.slug;
    let moduleSlug = concept?.module_slug;
    if (slug && !moduleSlug) {
      const c = [...conceptByName.values()].find(c => c.slug === slug);
      if (c) moduleSlug = c.module_slug;
    }
    const hasBody = !!item.body;
    const hasLink = !!(slug && moduleSlug);
    return (
      <li className={`tut-item-theory-wrap tut-item-topic-wrap ${expanded ? 'expanded' : ''}`}>
        <button
          type="button"
          className="tut-item tut-item-topic tut-item-theory-button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          <span className="tut-item-icon">
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
          <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
          <span className="tut-item-kind">topic</span>
        </button>
        {expanded && (
          <div className="tut-theory-body">
            {hasBody && <TheoryBody body={item.body} />}
            {hasLink && (
              <Link to={`/learn/${moduleSlug}/${slug}`} className="tut-theory-readmore">
                <BookOpen size={11} /> Open full concept page
                <ExternalLink size={10} />
              </Link>
            )}
            {!hasBody && !hasLink && (
              <p className="tut-theory-placeholder">
                <Circle size={10} className="tut-inline-icon" />
                See the related concepts above for in-depth coverage.
              </p>
            )}
          </div>
        )}
      </li>
    );
  }
  if (item.kind === 'theory') {
    const concept = item.conceptSlug
      ? null
      : conceptByName.get(normName(item.label));
    const slug = item.conceptSlug || concept?.slug;
    let moduleSlug = concept?.module_slug;
    if (slug && !moduleSlug) {
      const c = [...conceptByName.values()].find(c => c.slug === slug);
      if (c) moduleSlug = c.module_slug;
    }
    const hasBody = !!item.body;
    const hasLink = !!(slug && moduleSlug);

    if (hasBody) {
      return (
        <li className={`tut-item-theory-wrap ${expanded ? 'expanded' : ''}`}>
          <button
            type="button"
            className="tut-item tut-item-theory tut-item-theory-button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
          >
            <span className="tut-item-icon">
              {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </span>
            <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
            <span className="tut-item-kind">theory</span>
          </button>
          {expanded && (
            <div className="tut-theory-body">
              <TheoryBody body={item.body} />
              {hasLink && (
                <Link to={`/learn/${moduleSlug}/${slug}`} className="tut-theory-readmore">
                  <BookOpen size={11} /> Open full concept page
                  <ExternalLink size={10} />
                </Link>
              )}
            </div>
          )}
        </li>
      );
    }

    if (hasLink) {
      return (
        <li className="tut-item tut-item-theory">
          <Link to={`/learn/${moduleSlug}/${slug}`} className="tut-item-link">
            <span className="tut-item-icon"><BookOpen size={11} /></span>
            <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
            <span className="tut-item-kind">theory</span>
          </Link>
        </li>
      );
    }
    return (
      <li className="tut-item tut-item-theory-soft">
        <span className="tut-item-icon"><BookOpen size={11} /></span>
        <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
        <span className="tut-item-kind">theory · soon</span>
      </li>
    );
  }
  // problem
  const p = item.id
    ? null
    : problemByName.get(normName(item.label));
  if (p) {
    const prog = byId[p.id];
    const solved = prog?.is_completed;
    const attempted = !solved && (prog?.status === 'attempted' || prog?.is_starred);
    const bubbleClass = solved ? 'solved' : (attempted ? 'attempted' : 'todo');
    return (
      <li className={`tut-item ${solved ? 'solved' : ''}`}>
        <Link to={`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`} className="tut-item-link">
          <span className={`tut-bubble tut-bubble-${bubbleClass}`} aria-label={solved ? 'solved' : attempted ? 'attempted' : 'not started'}>
            {solved && <CheckCircle2 size={9} />}
          </span>
          <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
          <span className={`tut-item-diff tut-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
        </Link>
      </li>
    );
  }
  return (
    <li className="tut-item tut-item-soon">
      <span className="tut-item-icon"><Lock size={10} /></span>
      <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
      <span className="tut-item-kind">soon</span>
    </li>
  );
}

// Renders inline backtick spans as <code>. Splits a string into [text, <code>, text, ...].
function renderInline(text, keyPrefix = '') {
  if (text == null) return null;
  const str = String(text);
  const pattern = /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  const out = [];
  let last = 0;
  let i = 0;
  let m;
  while ((m = pattern.exec(str)) !== null) {
    if (m.index > last) {
      out.push(<React.Fragment key={`${keyPrefix}-t-${i++}`}>{str.slice(last, m.index)}</React.Fragment>);
    }
    if (m[1]) {
      out.push(<code key={`${keyPrefix}-c-${i++}`} className="tut-theory-code">{m[1].slice(1, -1)}</code>);
    } else if (m[2]) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(m[2]);
      out.push(<a key={`${keyPrefix}-a-${i++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>);
    } else if (m[3]) {
      out.push(<strong key={`${keyPrefix}-b-${i++}`}>{m[3].slice(2, -2)}</strong>);
    } else if (m[4]) {
      out.push(<em key={`${keyPrefix}-i-${i++}`}>{m[4].slice(1, -1)}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < str.length) {
    out.push(<React.Fragment key={`${keyPrefix}-t-${i++}`}>{str.slice(last)}</React.Fragment>);
  }
  return out.length === 0 ? str : out;
}

function parseCallout(line) {
  const m = /^>\s*(Note|Warning|Tip|Insight|Caution):\s*(.*)$/i.exec(line.trim());
  if (!m) return null;
  return { kind: m[1].toLowerCase(), text: m[2] };
}

function Callout({ kind, children }) {
  const icon = kind === 'warning' || kind === 'caution'
    ? <AlertTriangle size={14} />
    : kind === 'tip' || kind === 'insight'
      ? <Lightbulb size={14} />
      : <Info size={14} />;
  const label = kind === 'warning' || kind === 'caution'
    ? 'Warning'
    : kind === 'tip' ? 'Tip'
    : kind === 'insight' ? 'Insight'
    : 'Note';
  return (
    <aside className={`tut-callout tut-callout-${kind}`}>
      <span className="tut-callout-icon">{icon}</span>
      <div className="tut-callout-body">
        <span className="tut-callout-label">{label}</span>
        <span className="tut-callout-text">{children}</span>
      </div>
    </aside>
  );
}

const LANG_LABELS = {
  py: 'Python', python: 'Python',
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  cpp: 'C++', c: 'C', java: 'Java', go: 'Go',
  rs: 'Rust', rust: 'Rust',
  sh: 'Shell', bash: 'Shell', shell: 'Shell',
  sql: 'SQL', json: 'JSON',
  ascii: 'Diagram', diagram: 'Diagram', txt: 'Diagram',
  plain: 'Code', '': 'Code',
};

function looksLikeAscii(text) {
  if (!text) return false;
  const sample = text.slice(0, 800);
  const glyphCount = (sample.match(/[│─┌┐└┘├┤┬┴┼╭╮╯╰═║╔╗╚╝→←↑↓⇒⇐|+\-*=>]/g) || []).length;
  const alpha = (sample.match(/[a-zA-Z]/g) || []).length;
  if (glyphCount < 6) return false;
  return glyphCount > alpha * 0.25;
}

function CodeBlock({ lang, code }) {
  const normLang = (lang || '').toLowerCase();
  const isAscii = normLang === 'ascii' || normLang === 'diagram' || normLang === 'txt'
    || (!normLang && looksLikeAscii(code));
  const displayLang = isAscii
    ? 'Diagram'
    : LANG_LABELS[normLang] || (normLang ? normLang.toUpperCase() : 'Code');
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }).catch(() => {});
  }, [code]);
  return (
    <div className={`tut-codeblock ${isAscii ? 'tut-codeblock-ascii' : ''}`}>
      <div className="tut-codeblock-bar">
        <span className="tut-codeblock-lang">{displayLang}</span>
        <button
          type="button"
          className="tut-codeblock-copy"
          onClick={onCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className={`tut-theory-pre tut-theory-pre-${normLang || 'plain'}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderBlock(text, keyPrefix) {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let buf = [];
  let inFence = false;
  let fenceLang = '';
  let fenceBuf = [];

  const flushBuf = () => {
    if (!buf.length) return;
    const joined = buf.join('\n').trim();
    if (!joined) { buf = []; return; }
    joined.split(/\n{2,}/).forEach((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return;
      const callout = parseCallout(trimmed);
      if (callout) {
        out.push(
          <Callout key={`${keyPrefix}-cl-${out.length}-${i}`} kind={callout.kind}>
            {renderInline(callout.text, `${keyPrefix}-cl-${out.length}`)}
          </Callout>
        );
        return;
      }
      out.push(<p key={`${keyPrefix}-p-${out.length}-${i}`}>{renderInline(trimmed, `${keyPrefix}-p-${out.length}`)}</p>);
    });
    buf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = /^```(\w*)\s*$/.exec(line);
    if (fenceMatch) {
      if (inFence) {
        out.push(
          <CodeBlock
            key={`${keyPrefix}-pre-${out.length}`}
            lang={fenceLang}
            code={fenceBuf.join('\n')}
          />
        );
        inFence = false;
        fenceLang = '';
        fenceBuf = [];
      } else {
        flushBuf();
        inFence = true;
        fenceLang = fenceMatch[1] || '';
      }
      continue;
    }
    if (inFence) { fenceBuf.push(line); continue; }
    buf.push(line);
  }
  if (inFence) {
    out.push(
      <CodeBlock
        key={`${keyPrefix}-pre-${out.length}`}
        lang={fenceLang}
        code={fenceBuf.join('\n')}
      />
    );
  }
  flushBuf();
  return out;
}

function ComplexityTable({ complexity }) {
  if (!complexity) return null;
  if (typeof complexity === 'string') {
    return (
      <div className="tut-theory-complexity">
        <span className="tut-theory-cx-label"><Gauge size={11} /> Complexity</span>
        <span className="tut-theory-cx-value">{renderInline(complexity, 'cx-str')}</span>
      </div>
    );
  }
  const rows = [];
  if (complexity.time) rows.push(['Time', complexity.time]);
  if (complexity.build) rows.push(['Build', complexity.build]);
  if (complexity.operation) rows.push(['Operation', complexity.operation]);
  if (complexity.best) rows.push(['Best', complexity.best]);
  if (complexity.average) rows.push(['Average', complexity.average]);
  if (complexity.worst) rows.push(['Worst', complexity.worst]);
  if (complexity.space) rows.push(['Space', complexity.space]);
  if (complexity.notes) rows.push(['Notes', complexity.notes]);
  return (
    <div className="tut-theory-cx-card">
      <div className="tut-theory-cx-head">
        <Gauge size={13} />
        <span>Complexity</span>
      </div>
      <table className="tut-theory-cx-table">
        <thead>
          <tr>
            <th className="tut-cx-col-op">Operation</th>
            <th className="tut-cx-col-cost">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className={i % 2 ? 'tut-cx-row-alt' : ''}>
              <td className="tut-cx-op">{k}</td>
              <td className="tut-cx-cost">{renderInline(v, `cxr-${i}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parsePitfall(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  const nameMatch = /^\*\*([^*]+?)\*\*\.?\s*/.exec(str);
  let name = '';
  let rest = str;
  if (nameMatch) {
    name = nameMatch[1].replace(/\.$/, '').trim();
    rest = str.slice(nameMatch[0].length);
  }
  const fixIdx = rest.search(/\b(?:Fix|Remedy|Solution)\s*:/i);
  let desc = rest;
  let fix = '';
  if (fixIdx >= 0) {
    desc = rest.slice(0, fixIdx).trim();
    fix = rest.slice(fixIdx).replace(/^\s*(?:Fix|Remedy|Solution)\s*:\s*/i, '').trim();
  }
  desc = desc.replace(/\.\s*$/, '').trim();
  return { name, desc, fix };
}

function PitfallList({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="tut-theory-pitfalls">
      <div className="tut-theory-pitfalls-head">
        <AlertCircle size={13} />
        <span>Pitfalls</span>
        <span className="tut-pitfalls-count">{items.length}</span>
      </div>
      <div className="tut-pitfall-grid">
        {items.map((raw, j) => {
          const parsed = parsePitfall(raw);
          if (!parsed) return null;
          const { name, desc, fix } = parsed;
          return (
            <div key={j} className="tut-pitfall-card">
              <div className="tut-pitfall-head">
                <AlertTriangle size={13} />
                <span>{name || `Pitfall ${j + 1}`}</span>
              </div>
              {desc && (
                <p className="tut-pitfall-desc">{renderInline(desc, `pfd-${j}`)}</p>
              )}
              {fix && (
                <p className="tut-pitfall-fix">
                  <span className="tut-pitfall-fix-label"><Wrench size={11} /> Fix</span>
                  <span className="tut-pitfall-fix-text">{renderInline(fix, `pff-${j}`)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function headingIconFor(heading) {
  const h = (heading || '').toLowerCase();
  if (h.includes('mental') || h.includes('intuition')) return Brain;
  if (h.includes('canonical') || h.includes('operation') || h.includes('mechanic')) return Cog;
  if (h.includes('when to') || h.includes('use case') || h.includes('reach')) return Target;
  if (h.includes('variant') || h.includes('flavor')) return GitBranch;
  if (h.includes('problem') || h.includes('interview') || h.includes('example')) return ListChecks;
  return ChevronRight;
}

function slugifyHeading(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function SectionTOC({ entries, parentId }) {
  const [active, setActive] = useState(entries[0]?.id || null);
  const tocRef = useRef(null);

  useEffect(() => {
    if (!entries.length) return;
    const targets = entries
      .map(e => document.getElementById(`${parentId}-${e.id}`))
      .filter(Boolean);
    if (!targets.length) return;
    const obs = new IntersectionObserver(
      (intersecting) => {
        const visible = intersecting
          .filter(en => en.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace(`${parentId}-`, '');
          setActive(id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 1] },
    );
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, [entries, parentId]);

  if (!entries.length) return null;

  const handleClick = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(`${parentId}-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <aside className="tut-section-toc" ref={tocRef} aria-label="On this page">
      <div className="tut-section-toc-head">
        <ListOrdered size={11} />
        <span>On this page</span>
      </div>
      <ol className="tut-section-toc-list">
        {entries.map((e) => (
          <li
            key={e.id}
            className={active === e.id ? 'is-active' : ''}
          >
            <a href={`#${parentId}-${e.id}`} onClick={handleClick(e.id)}>
              <span className="tut-section-toc-dot" />
              <span className="tut-section-toc-label">{e.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function AnchorLink({ targetId, label }) {
  const [copied, setCopied] = useState(false);
  const onClick = (e) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}${window.location.hash.split('#')[0] || ''}#${targetId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }).catch(() => {});
    }
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <button
      type="button"
      className="tut-anchor-link"
      onClick={onClick}
      aria-label={`Copy link to ${label || 'section'}`}
      title={copied ? 'Link copied' : 'Copy link to section'}
    >
      {copied ? <Check size={12} /> : <LinkIcon size={12} />}
    </button>
  );
}

export function TheoryBody({ body }) {
  const rawId = useId();
  const parentId = `tb${rawId.replace(/:/g, '')}`;

  if (!body) return null;
  if (typeof body === 'string') {
    return <div className="tut-theory-content">{renderBlock(body, 'str')}</div>;
  }

  const tocEntries = [];
  if (Array.isArray(body.sections)) {
    body.sections.forEach((sec, i) => {
      tocEntries.push({
        id: `sec-${i}-${slugifyHeading(sec.heading)}`,
        label: sec.heading,
      });
    });
  }
  if (body.complexity) tocEntries.push({ id: 'complexity', label: 'Complexity' });
  if (body.pitfalls?.length) tocEntries.push({ id: 'pitfalls', label: 'Pitfalls' });

  return (
    <div className="tut-theory-layout">
      <div className="tut-theory-content">
        {body.summary && (
          <p className="tut-theory-summary">{renderInline(body.summary, 'sum')}</p>
        )}
        {body.sections?.map((sec, i) => {
          const HeadingIcon = headingIconFor(sec.heading);
          const anchor = `${parentId}-sec-${i}-${slugifyHeading(sec.heading)}`;
          return (
            <section
              key={i}
              id={anchor}
              className="tut-theory-section tut-theory-card"
            >
              <div className="tut-theory-card-head">
                <span className="tut-theory-card-icon"><HeadingIcon size={13} /></span>
                <h4 className="tut-theory-heading">{sec.heading}</h4>
                <AnchorLink targetId={anchor} label={sec.heading} />
              </div>
              <div className="tut-theory-card-body">
                {Array.isArray(sec.body)
                  ? (
                    <ul className="tut-theory-list">
                      {sec.body.map((li, j) => (
                        <li key={j}>{renderInline(li, `sec-${i}-li-${j}`)}</li>
                      ))}
                    </ul>
                  )
                  : renderBlock(sec.body, `sec-${i}`)
                }
              </div>
            </section>
          );
        })}
        {body.complexity && (
          <div id={`${parentId}-complexity`}>
            <ComplexityTable complexity={body.complexity} />
          </div>
        )}
        {body.pitfalls?.length > 0 && (
          <div id={`${parentId}-pitfalls`}>
            <PitfallList items={body.pitfalls} />
          </div>
        )}
      </div>
      <SectionTOC entries={tocEntries} parentId={parentId} />
    </div>
  );
}
