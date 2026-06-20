import React, { useMemo, useState } from 'react';
import { Factory, ArrowRight } from 'lucide-react';
import './FactoryPatternViz.css';

const TYPES = {
  pdf: {
    label: 'pdf',
    cls: 'PdfDocument',
    hue: 'var(--hue-sky)',
    methods: ['render()', 'addPage()', 'embedFont()'],
    note: 'paginated, print-ready',
  },
  word: {
    label: 'word',
    cls: 'WordDocument',
    hue: 'var(--hue-mint)',
    methods: ['render()', 'addParagraph()', 'trackChanges()'],
    note: 'flowing, editable',
  },
  sheet: {
    label: 'sheet',
    cls: 'SpreadsheetDocument',
    hue: 'var(--hue-violet)',
    methods: ['render()', 'setCell()', 'recalcFormulas()'],
    note: 'grid of cells',
  },
  slides: {
    label: 'slides',
    cls: 'SlidesDocument',
    hue: 'var(--hue-pink)',
    methods: ['render()', 'addSlide()', 'startPresenting()'],
    note: 'deck of frames',
  },
};

const KEYS = Object.keys(TYPES);

export default function FactoryPatternViz() {
  const [type, setType] = useState('pdf');
  const product = useMemo(() => TYPES[type], [type]);

  // SVG geometry
  const W = 940;
  const H = 320;

  return (
    <div className="fpv">
      <div className="fpv-head">
        <h3 className="fpv-title">Factory — ask by type, get the matching object</h3>
        <p className="fpv-sub">
          The client calls <code>factory.create(type)</code> and gets back something that implements the common
          interface. It never names the concrete class. Pick a type and watch the factory construct the matching product.
        </p>
      </div>

      <div className="fpv-controls">
        <span className="fpv-input-label">requested type</span>
        <div className="fpv-types">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`fpv-type ${k === type ? 'is-active' : ''}`}
              onClick={() => setType(k)}
              style={k === type ? { borderColor: TYPES[k].hue, color: TYPES[k].hue } : undefined}
            >
              "{TYPES[k].label}"
            </button>
          ))}
        </div>
      </div>

      <div className="fpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="fpv-svg" preserveAspectRatio="xMidYMid meet">
          {/* client */}
          <rect className="fpv-client" x={30} y={110} width={170} height={100} rx={10} />
          <text className="fpv-node-title" x={115} y={138}>Client</text>
          <text className="fpv-node-sub" x={115} y={156}>knows only interface</text>
          <rect className="fpv-call-pill" x={48} y={168} width={134} height={30} rx={6} />
          <text className="fpv-call-text" x={115} y={188}>create("{product.label}")</text>

          {/* arrow client -> factory */}
          <line className="fpv-edge" x1={200} y1={160} x2={290} y2={160} style={{ stroke: product.hue }} />
          <polygon className="fpv-arrow" points="290,154 302,160 290,166" style={{ fill: product.hue }} />

          {/* factory */}
          <rect className="fpv-factory" x={302} y={110} width={180} height={100} rx={10} />
          <text className="fpv-node-title" x={392} y={138}>DocumentFactory</text>
          <text className="fpv-node-sub" x={392} y={156}>switch(type)</text>
          <rect className="fpv-call-pill" x={320} y={168} width={144} height={30} rx={6} style={{ stroke: product.hue }} />
          <text className="fpv-call-text" x={392} y={188} style={{ fill: product.hue }}>new {product.cls}()</text>

          {/* arrow factory -> product */}
          <line className="fpv-edge" x1={482} y1={160} x2={580} y2={160} style={{ stroke: product.hue }} />
          <polygon className="fpv-arrow" points="580,154 592,160 580,166" style={{ fill: product.hue }} />

          {/* produced concrete product */}
          <rect className="fpv-product" x={592} y={70} width={318} height={180} rx={12} style={{ stroke: product.hue }} />
          <rect className="fpv-product-bar" x={592} y={70} width={318} height={6} rx={3} style={{ fill: product.hue }} />
          <text className="fpv-product-cls" x={751} y={104} style={{ fill: product.hue }}>{product.cls}</text>
          <text className="fpv-product-note" x={751} y={124}>{product.note}</text>
          {product.methods.map((m, i) => (
            <g key={`m-${m}`}>
              <rect className="fpv-method" x={616} y={140 + i * 34} width={270} height={26} rx={6} />
              <circle cx={632} cy={140 + i * 34 + 13} r={4} style={{ fill: product.hue }} />
              <text className="fpv-method-text" x={648} y={140 + i * 34 + 18}>{m}</text>
            </g>
          ))}

          {/* dimmed alternatives the factory could have built */}
          <text className="fpv-alt-label" x={392} y={244}>could also build</text>
          {KEYS.filter((k) => k !== type).map((k, i) => (
            <text key={`alt-${k}`} className="fpv-alt" x={300 + i * 64} y={266}>{TYPES[k].cls.replace('Document', '')}</text>
          ))}
        </svg>
      </div>

      <div className="fpv-metrics">
        <div className="fpv-metric">
          <span className="fpv-metric-label">requested type</span>
          <span className="fpv-metric-value">"{product.label}"</span>
        </div>
        <div className="fpv-metric">
          <span className="fpv-metric-label">produced class</span>
          <span className="fpv-metric-value" style={{ color: product.hue }}>{product.cls}</span>
        </div>
        <div className="fpv-metric">
          <span className="fpv-metric-label">interface</span>
          <span className="fpv-metric-value">Document.render()</span>
        </div>
      </div>

      <div className="fpv-narration">
        <span className="fpv-narration-label"><Factory size={12} /> trace</span>
        <span className="fpv-narration-body">
          Client passed <code>"{product.label}"</code> to the factory <ArrowRight size={11} style={{ verticalAlign: 'middle' }} /> the
          factory's switch matched it and returned <strong>new {product.cls}()</strong>. The client holds a Document
          reference and calls <code>render()</code> without ever importing or naming {product.cls}.
        </span>
      </div>
    </div>
  );
}
