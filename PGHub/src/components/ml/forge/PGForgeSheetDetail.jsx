import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  Grid3x3, Flame, Cpu, Zap, Brain, FileText,
  Sparkles, Move3d, Maximize2, Crosshair, Minimize2, Dices, Wand2,
  Boxes, GitBranch, Layers, Target, RefreshCw, Eye, Save, Combine,
  Database, Code2, AlignJustify, GitMerge, LayoutGrid, Gauge,
  Hash, ArrowLeftRight, Plus, Sigma, Scale, Shrink, Rocket,
  BarChart3, Wrench, Network, TrendingDown,
} from 'lucide-react';
import { getSheet, SHEET_ACCENT_CYCLE } from './pgForgeSheetsData';
import Breadcrumb from '../../common/Breadcrumb';
import './PGForgeSheetDetail.css';

const TITLE_ICONS = { Grid3x3, Flame, Cpu, Zap, Brain };

const SECTION_ICONS = {
  Sparkles, Move3d, Maximize2, Crosshair, Minimize2, Dices, Wand2, Grid3x3,
  Boxes, GitBranch, Brain, Layers, Target, RefreshCw, Eye, Save, Combine,
  Database, Code2, AlignJustify, GitMerge, LayoutGrid, Gauge, Cpu,
  Hash, ArrowLeftRight, Plus, Sigma, Zap, Scale, Shrink, Rocket,
  BarChart3, Wrench, Network, TrendingDown, FileText,
};

// hue token -> css custom property used for the section accent
const HUE_VAR = {
  violet: 'var(--hue-violet)',
  sky: 'var(--hue-sky)',
  pink: 'var(--hue-pink)',
  mint: 'var(--hue-mint)',
  accent: 'var(--accent)',
};

// ---- tiny inline SVG illustrations, keyed by section.diagram ----
// Lightweight, theme-token coloured, no axis labels beyond what reads at a glance.
// `c` is the section accent colour passed in.

function BroadcastDiagram({ c }) {
  return (
    <svg viewBox="0 0 200 64" className="forge-shd-svg" role="img" aria-label="Broadcasting a column across a matrix">
      <g fill="none" stroke={c} strokeWidth="1.4">
        {[0, 1, 2].map((r) => (
          <rect key={`col-${r}`} x="6" y={6 + r * 18} width="14" height="14" rx="2"
            fill={c} fillOpacity="0.18" />
        ))}
      </g>
      <text x="30" y="36" fill="var(--text-dim)" fontFamily="var(--mono)" fontSize="13">+</text>
      <g>
        {[0, 1, 2].map((r) => (
          [0, 1, 2, 3].map((cl) => (
            <rect key={`m-${r}-${cl}`} x={42 + cl * 18} y={6 + r * 18} width="14" height="14" rx="2"
              fill={c} fillOpacity={0.06 + r * 0.04} stroke={c} strokeWidth="1" strokeOpacity="0.5" />
          ))
        ))}
      </g>
      <text x="122" y="36" fill="var(--text-dim)" fontFamily="var(--mono)" fontSize="13">=</text>
      <g>
        {[0, 1, 2].map((r) => (
          [0, 1, 2, 3].map((cl) => (
            <rect key={`o-${r}-${cl}`} x={134 + cl * 14} y={6 + r * 18} width="11" height="14" rx="2"
              fill={c} fillOpacity="0.22" />
          ))
        ))}
      </g>
    </svg>
  );
}

function AxisReduceDiagram({ c }) {
  return (
    <svg viewBox="0 0 200 64" className="forge-shd-svg" role="img" aria-label="Reducing a matrix along an axis">
      <g>
        {[0, 1, 2].map((r) => (
          [0, 1, 2].map((cl) => (
            <rect key={`g-${r}-${cl}`} x={10 + cl * 18} y={6 + r * 18} width="14" height="14" rx="2"
              fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1" strokeOpacity="0.5" />
          ))
        ))}
      </g>
      <path d="M70 33 L96 33" stroke="var(--text-dim)" strokeWidth="1.3" markerEnd="url(#shd-arrow)" />
      <text x="74" y="20" fill="var(--text-dim)" fontFamily="var(--mono)" fontSize="9">sum axis=0</text>
      <g>
        {[0, 1, 2].map((cl) => (
          <rect key={`s-${cl}`} x={112 + cl * 18} y={24} width="14" height="14" rx="2"
            fill={c} fillOpacity="0.3" />
        ))}
      </g>
    </svg>
  );
}

function MemoryHierarchyDiagram({ c }) {
  const rows = [
    { w: 60, label: 'registers', op: 0.34 },
    { w: 110, label: 'shared', op: 0.22 },
    { w: 170, label: 'global', op: 0.1 },
  ];
  return (
    <svg viewBox="0 0 200 76" className="forge-shd-svg" role="img" aria-label="GPU memory hierarchy by speed">
      {rows.map((row, i) => (
        <g key={row.label}>
          <rect x={(200 - row.w) / 2} y={8 + i * 22} width={row.w} height="16" rx="3"
            fill={c} fillOpacity={row.op} stroke={c} strokeWidth="1" strokeOpacity="0.5" />
          <text x="100" y={19 + i * 22} fill="var(--text-main)" fontFamily="var(--mono)" fontSize="9"
            textAnchor="middle">{row.label}</text>
        </g>
      ))}
    </svg>
  );
}

function ThreadGridDiagram({ c }) {
  return (
    <svg viewBox="0 0 200 64" className="forge-shd-svg" role="img" aria-label="Threads grouped into blocks across a grid">
      {[0, 1, 2].map((b) => (
        <g key={`b-${b}`}>
          <rect x={8 + b * 64} y="14" width="56" height="36" rx="4"
            fill="none" stroke={c} strokeWidth="1.2" strokeOpacity="0.7" />
          {[0, 1, 2, 3].map((t) => (
            <rect key={`t-${b}-${t}`} x={14 + b * 64 + t * 12} y="26" width="9" height="12" rx="1.5"
              fill={c} fillOpacity={0.18 + t * 0.06} />
          ))}
          <text x={36 + b * 64} y="60" fill="var(--text-dim)" fontFamily="var(--mono)" fontSize="8"
            textAnchor="middle">block {b}</text>
        </g>
      ))}
    </svg>
  );
}

function AutogradDiagram({ c }) {
  const nodes = ['w', 'w²', 'loss'];
  return (
    <svg viewBox="0 0 200 60" className="forge-shd-svg" role="img" aria-label="Forward graph and backward gradient flow">
      {nodes.map((n, i) => (
        <g key={n}>
          <circle cx={28 + i * 72} cy="22" r="13" fill={c} fillOpacity="0.16" stroke={c} strokeWidth="1.2" />
          <text x={28 + i * 72} y="26" fill="var(--text-main)" fontFamily="var(--mono)" fontSize="9"
            textAnchor="middle">{n}</text>
        </g>
      ))}
      <path d="M43 22 L83 22" stroke={c} strokeWidth="1.3" markerEnd="url(#shd-arrow)" />
      <path d="M115 22 L155 22" stroke={c} strokeWidth="1.3" markerEnd="url(#shd-arrow)" />
      <path d="M155 40 L43 40" stroke="var(--text-dim)" strokeWidth="1.1" strokeDasharray="3 3" markerEnd="url(#shd-arrow)" />
      <text x="100" y="54" fill="var(--text-dim)" fontFamily="var(--mono)" fontSize="8" textAnchor="middle">backward .grad</text>
    </svg>
  );
}

function TrainLoopDiagram({ c }) {
  const steps = ['zero_grad', 'forward', 'loss', 'backward', 'step'];
  return (
    <svg viewBox="0 0 200 150" className="forge-shd-svg" role="img" aria-label="Training loop steps, top to bottom">
      {steps.map((s, i) => (
        <g key={s}>
          <rect x="44" y={6 + i * 28} width="112" height="20" rx="5"
            fill={c} fillOpacity="0.14" stroke={c} strokeWidth="1.1" />
          <text x="100" y={20 + i * 28} fill="var(--text-main)" fontFamily="var(--mono)" fontSize="9"
            textAnchor="middle">{s}</text>
          {i < steps.length - 1 && (
            <path d={`M100 ${26 + i * 28} L100 ${34 + i * 28}`} stroke={c} strokeWidth="1.3"
              markerEnd="url(#shd-arrow)" />
          )}
        </g>
      ))}
    </svg>
  );
}

function BiasVarianceDiagram({ c }) {
  return (
    <svg viewBox="0 0 200 72" className="forge-shd-svg" role="img" aria-label="Bias falls and variance rises with capacity">
      <line x1="20" y1="60" x2="190" y2="60" stroke="var(--border)" strokeWidth="1" />
      <line x1="20" y1="8" x2="20" y2="60" stroke="var(--border)" strokeWidth="1" />
      <path d="M22 14 C70 50 130 58 188 59" fill="none" stroke="var(--hue-sky)" strokeWidth="1.6" />
      <path d="M22 58 C80 56 140 28 188 12" fill="none" stroke="var(--hue-pink)" strokeWidth="1.6" />
      <path d="M22 40 C80 22 130 22 188 44" fill="none" stroke={c} strokeWidth="1.8" />
      <text x="150" y="22" fill="var(--hue-pink)" fontFamily="var(--mono)" fontSize="8">variance</text>
      <text x="150" y="56" fill="var(--hue-sky)" fontFamily="var(--mono)" fontSize="8">bias</text>
      <text x="84" y="18" fill={c} fontFamily="var(--mono)" fontSize="8">total</text>
    </svg>
  );
}

function AttentionDiagram({ c }) {
  const rows = ['Q · Kᵀ', '÷ √dₖ', 'softmax', '· V'];
  return (
    <svg viewBox="0 0 200 124" className="forge-shd-svg" role="img" aria-label="Attention computation, top to bottom">
      {rows.map((s, i) => (
        <g key={s}>
          <rect x="50" y={6 + i * 28} width="100" height="20" rx="5"
            fill={c} fillOpacity="0.14" stroke={c} strokeWidth="1.1" />
          <text x="100" y={20 + i * 28} fill="var(--text-main)" fontFamily="var(--mono)" fontSize="9"
            textAnchor="middle">{s}</text>
          {i < rows.length - 1 && (
            <path d={`M100 ${26 + i * 28} L100 ${34 + i * 28}`} stroke={c} strokeWidth="1.3"
              markerEnd="url(#shd-arrow)" />
          )}
        </g>
      ))}
    </svg>
  );
}

const DIAGRAMS = {
  broadcast: BroadcastDiagram,
  'axis-reduce': AxisReduceDiagram,
  'memory-hierarchy': MemoryHierarchyDiagram,
  'thread-grid': ThreadGridDiagram,
  autograd: AutogradDiagram,
  'train-loop': TrainLoopDiagram,
  'bias-variance': BiasVarianceDiagram,
  attention: AttentionDiagram,
};

export default function PGForgeSheetDetail() {
  const { slug } = useParams();
  const sheet = useMemo(() => getSheet(slug), [slug]);

  if (!sheet) return <Navigate to="/ml/sheets" replace />;

  const TitleIcon = TITLE_ICONS[sheet.icon] || FileText;
  const sectionCount = sheet.sections.length;
  const itemCount = sheet.sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="forge-shd">
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <marker id="shd-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="var(--text-dim)" />
          </marker>
        </defs>
      </svg>

      <Breadcrumb
        items={[
          { label: 'PGForge', to: '/ml' },
          { label: 'Sheets', to: '/ml/sheets' },
          { label: sheet.title || 'Sheet' },
        ]}
      />

      <header className="forge-shd-header">
        <div className="forge-shd-head-row">
          <span className="forge-shd-head-icon"><TitleIcon size={22} /></span>
          <h1 className="forge-shd-title">{sheet.title}</h1>
        </div>
        <p className="forge-shd-blurb">{sheet.blurb}</p>
        <div className="forge-shd-meta">
          <span className="forge-shd-chip">{sectionCount} sections</span>
          <span className="forge-shd-chip">{itemCount} snippets</span>
        </div>
      </header>

      <div className="forge-shd-grid">
        {sheet.sections.map((section, i) => {
          const accent = HUE_VAR[section.accent] || HUE_VAR[SHEET_ACCENT_CYCLE[i % SHEET_ACCENT_CYCLE.length]];
          const SecIcon = SECTION_ICONS[section.icon] || FileText;
          const Diagram = section.diagram ? DIAGRAMS[section.diagram] : null;
          return (
            <section
              key={section.heading}
              className="forge-shd-section"
              style={{ '--sec-accent': accent }}
            >
              <div className="forge-shd-sec-top">
                <span className="forge-shd-sec-icon"><SecIcon size={15} /></span>
                <h2 className="forge-shd-sec-head">{section.heading}</h2>
              </div>
              {section.note && <p className="forge-shd-sec-note">{section.note}</p>}
              {Diagram && (
                <div className="forge-shd-diagram"><Diagram c={accent} /></div>
              )}
              <ul className="forge-shd-items">
                {section.items.map((item) => (
                  <li key={item.label} className="forge-shd-item">
                    <span className="forge-shd-item-label">{item.label}</span>
                    <pre className="forge-shd-code"><code>{item.code}</code></pre>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
