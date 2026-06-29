import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { FileText, Hash } from 'lucide-react';
import RunnableCodePanel from '../../RunnableCodePanel';
import './NotebookCells.css';

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

// Inline markdown: **bold**, `code`, *italic*, \(math\), [label](url).
function renderInline(text) {
  if (!text) return [];
  const out = [];
  let key = 0;
  let buf = '';
  const flushBuf = () => { if (buf) { out.push(buf); buf = ''; } };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        flushBuf();
        out.push(<code className="nbc-icode" key={`c${key++}`}>{text.slice(i + 1, end)}</code>);
        i = end + 1;
        continue;
      }
    }

    if (ch === '\\' && text[i + 1] === '(') {
      const end = text.indexOf('\\)', i + 2);
      if (end > i) {
        flushBuf();
        out.push(
          <span
            className="nbc-imath"
            key={`m${key++}`}
            dangerouslySetInnerHTML={{ __html: katexHtml(text.slice(i + 2, end), false) }}
          />
        );
        i = end + 2;
        continue;
      }
    }

    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end > i) {
        flushBuf();
        out.push(<strong key={`b${key++}`}>{renderInline(text.slice(i + 2, end))}</strong>);
        i = end + 2;
        continue;
      }
    }

    if (
      ch === '*' &&
      text[i + 1] !== '*' &&
      text[i + 1] !== ' ' &&
      text[i - 1] !== '*' &&
      !/\w/.test(text[i - 1] || '')
    ) {
      const end = text.indexOf('*', i + 1);
      if (end > i && text[end + 1] !== '*' && text[end - 1] !== ' ') {
        flushBuf();
        out.push(<em key={`i${key++}`}>{renderInline(text.slice(i + 1, end))}</em>);
        i = end + 1;
        continue;
      }
    }

    if (ch === '[') {
      const close = text.indexOf(']', i + 1);
      if (close > i && text[close + 1] === '(') {
        const urlEnd = text.indexOf(')', close + 2);
        if (urlEnd > close) {
          flushBuf();
          out.push(
            <a key={`l${key++}`} href={text.slice(close + 2, urlEnd)} target="_blank" rel="noreferrer noopener">
              {renderInline(text.slice(i + 1, close))}
            </a>
          );
          i = urlEnd + 1;
          continue;
        }
      }
    }

    buf += ch;
    i++;
  }
  flushBuf();
  return out;
}

// Block parser: \[display math\], bullet/ordered lists, sub-headings, paragraphs.
function renderProse(body, keyBase = 'nbp') {
  const blocks = String(body).split(/\n\n+/);
  const nodes = [];
  blocks.forEach((blk, bi) => {
    if (/\\\[[\s\S]+?\\\]/.test(blk)) {
      const parts = blk.split(/(\\\[[\s\S]+?\\\])/g);
      parts.forEach((part, pi) => {
        const m = part.match(/^\\\[([\s\S]+?)\\\]$/);
        if (m) {
          nodes.push(
            <div
              key={`${keyBase}-${bi}-m${pi}`}
              className="nbc-math"
              dangerouslySetInnerHTML={{ __html: katexHtml(m[1].trim(), true) }}
            />
          );
        } else if (part.trim()) {
          nodes.push(<p key={`${keyBase}-${bi}-p${pi}`} className="nbc-p">{renderInline(part.trim())}</p>);
        }
      });
      return;
    }

    const lines = blk.split('\n');
    const isBullet = lines.every((l) => /^\s*[-*]\s+/.test(l));
    const isOrdered = lines.every((l) => /^\s*\d+\.\s+/.test(l));

    if (isBullet && lines.length) {
      nodes.push(
        <ul key={`${keyBase}-${bi}`} className="nbc-ul">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      );
      return;
    }

    if (isOrdered && lines.length) {
      nodes.push(
        <ol key={`${keyBase}-${bi}`} className="nbc-ol">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\s*\d+\.\s+/, ''))}</li>
          ))}
        </ol>
      );
      return;
    }

    if (/^#{2,4}\s+/.test(blk)) {
      nodes.push(<h3 key={`${keyBase}-${bi}`} className="nbc-h3">{renderInline(blk.replace(/^#{2,4}\s+/, ''))}</h3>);
      return;
    }

    nodes.push(<p key={`${keyBase}-${bi}`} className="nbc-p">{renderInline(blk)}</p>);
  });
  return nodes;
}

function MarkdownCell({ cell, idx }) {
  return (
    <div className="nbc-cell nbc-cell-md">
      <div className="nbc-gutter nbc-gutter-md" aria-hidden="true">
        <FileText size={13} />
      </div>
      <div className="nbc-md-body">
        {renderProse(cell.content, `md${idx}`)}
      </div>
    </div>
  );
}

function CodeCell({ cell, execCount, slug }) {
  const lang = cell.lang || 'python';
  return (
    <div className="nbc-cell nbc-cell-code">
      <div className="nbc-gutter nbc-gutter-code" aria-hidden="true">
        <span className="nbc-exec">[<span className="nbc-exec-n">{execCount}</span>]</span>
      </div>
      <div className="nbc-code-body">
        <RunnableCodePanel
          code={cell.code}
          lang={lang}
          storageKey={`nbc-${slug}-${execCount}`}
          minLines={4}
        />
      </div>
    </div>
  );
}

// Renders a Jupyter-style sequence of interleaved markdown + runnable code cells.
// `cells`: [{ type:'markdown', content } | { type:'code', lang, code }]
export default function NotebookCells({ cells, slug = 'project' }) {
  const prepared = useMemo(() => {
    const out = [];
    (cells || []).forEach((cell, i) => {
      const priorCode = out.filter((p) => p.cell.type === 'code').length;
      out.push({
        cell,
        key: i,
        execCount: cell.type === 'code' ? priorCode + 1 : null,
      });
    });
    return out;
  }, [cells]);

  if (!prepared.length) return null;

  return (
    <div className="nbc-notebook">
      <div className="nbc-notebook-head">
        <Hash size={14} />
        <span>Notebook</span>
        <span className="nbc-notebook-sub">{prepared.filter((p) => p.cell.type === 'code').length} runnable cells</span>
      </div>
      <div className="nbc-cells">
        {prepared.map(({ cell, key, execCount }) =>
          cell.type === 'code'
            ? <CodeCell key={key} cell={cell} execCount={execCount} slug={slug} />
            : <MarkdownCell key={key} cell={cell} idx={key} />
        )}
      </div>
    </div>
  );
}
