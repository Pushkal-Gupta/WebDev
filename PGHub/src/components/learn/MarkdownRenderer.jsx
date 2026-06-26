import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Shared markdown + KaTeX renderer. The source of truth for prose rendering on
// concept pages, the solution view, and anywhere else that shows authored
// markdown with inline/display math. Keep ConceptPage and SolutionView wired to
// THIS so math/lists/code/tables render identically everywhere (HARD rule in
// CLAUDE.md: same renderer, never hand-rolled).

const MD_REMARK_PLUGINS = [remarkGfm];

// Sentinels for math: pre-processor swaps inline LaTeX delimiters into an inline
// code span wrapped with zero-width-space-delimited MATH/DMATH markers so
// react-markdown leaves it intact; the code component detects the sentinel and
// renders KaTeX HTML instead of normal inline code.
const MATH_SENTINEL = '​MATH​';
const DMATH_SENTINEL = '​DMATH​';

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

const MD_COMPONENTS = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
  code: ({ node: _node, className, children, ...props }) => {
    const text = Array.isArray(children) ? children.join('') : String(children ?? '');
    if (text.startsWith(DMATH_SENTINEL)) {
      const expr = text.slice(DMATH_SENTINEL.length);
      return (
        <span
          className="cp-math"
          dangerouslySetInnerHTML={{ __html: katexHtml(expr, true) }}
        />
      );
    }
    if (text.startsWith(MATH_SENTINEL)) {
      const expr = text.slice(MATH_SENTINEL.length);
      return (
        <span
          className="cp-imath"
          dangerouslySetInnerHTML={{ __html: katexHtml(expr, false) }}
        />
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },
};

const INLINE_MD_COMPONENTS = {
  ...MD_COMPONENTS,
  p: ({ node: _node, children }) => <>{children}</>,
};

const SUPERSCRIPT_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', n: 'ⁿ', k: 'ᵏ', i: 'ⁱ',
};

function toSuperscript(exp) {
  let out = '';
  for (const ch of exp) {
    out += SUPERSCRIPT_MAP[ch] ?? ch;
  }
  return out;
}

function formatPowers(text) {
  if (typeof text !== 'string' || text.indexOf('^') === -1) return text;
  const parts = text.split(/(`+[^`]*`+)/g);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue;
    parts[i] = parts[i].replace(
      /([A-Za-z0-9)\]])\^(-?[0-9]+|[nki])\b/g,
      (_m, base, exp) => `${base}${toSuperscript(exp)}`,
    );
  }
  return parts.join('');
}

// Replace LaTeX inline/display delimiters with zero-width-space-wrapped
// MATH/DMATH sentinels inside an inline code span so react-markdown treats them
// as inline code, then the custom `code` component renders them via KaTeX.
function preprocessInlineMath(text) {
  if (typeof text !== 'string') return text;
  if (text.indexOf('\\(') === -1 && text.indexOf('\\[') === -1) return text;
  const parts = text.split(/(`+[^`]*`+)/g);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue;
    parts[i] = parts[i].replace(/\\\[([\s\S]+?)\\\]/g, (_m, expr) => {
      const safe = expr.replace(/`/g, '').replace(/\n/g, ' ');
      return `\n\n\`${DMATH_SENTINEL}${safe}\`\n\n`;
    });
    parts[i] = parts[i].replace(/\\\(([\s\S]+?)\\\)/g, (_m, expr) => {
      const safe = expr.replace(/`/g, '').replace(/\n/g, ' ');
      return `\`${MATH_SENTINEL}${safe}\``;
    });
  }
  return parts.join('');
}

export default function Markdown({ children, inline = false }) {
  if (children == null) return null;
  const raw = typeof children === 'string' ? children : String(children);
  if (!raw.trim()) return null;
  const source = formatPowers(preprocessInlineMath(raw));
  return (
    <ReactMarkdown
      remarkPlugins={MD_REMARK_PLUGINS}
      components={inline ? INLINE_MD_COMPONENTS : MD_COMPONENTS}
    >
      {source}
    </ReactMarkdown>
  );
}
