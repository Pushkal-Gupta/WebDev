import { Palette, Sparkles } from 'lucide-react';
import './submissionReport.css';

// Shared submission-report chart kit for the DSA workspace and PGBattle: complexity
// compare, Big-O growth curves, beats distribution, and code style. Fed an analysis
// object from buildComplexityAnalysis() (in lib/complexityAnalyzer).

const MEM_RANK = { 'O(1)': 0, 'O(log n)': 0.3, 'O(n)': 1.1, 'O(n log n)': 1.7, 'O(n^2)': 3.2, 'O(n^3)': 4.6, 'O(2^n)': 5.2, 'O(n!)': 6.4 };
function estMemoryMb(spaceBigO, codeLen = 0) {
  const rank = MEM_RANK[spaceBigO] ?? 1;
  return (16.1 + rank + Math.min(1.6, codeLen / 4000)).toFixed(1);
}

// LeetCode-style "beats" distribution. Renders a population density over the metric
// (runtime or memory) as bars; the user sits at their percentile with a marker, and the
// portion they beat is tinted. `pct` = percent of submissions this one beats.
export function BeatsDistribution({ pct, label, value, hue }) {
  const N = 30;
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  const bars = [];
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    const h = Math.exp(-Math.pow((x - 0.4) / 0.2, 2)) + 0.25 * Math.exp(-Math.pow((x - 0.72) / 0.16, 2));
    bars.push(h);
  }
  const maxH = Math.max(...bars);
  const userIdx = Math.round((1 - p / 100) * (N - 1));
  return (
    <div className="ws-beats">
      <div className="ws-beats-head">
        <span className="ws-beats-label">{label}</span>
        <span className="ws-beats-value">{value}</span>
        <span className="ws-beats-pct" style={{ '--c': hue }}>Beats {p}%</span>
      </div>
      <div className="ws-beats-chart" style={{ '--c': hue }}>
        {bars.map((h, i) => (
          <div
            key={i}
            className={`ws-beats-bar${i >= userIdx ? ' beaten' : ''}${i === userIdx ? ' user' : ''}`}
            style={{ height: `${Math.max(6, Math.round((h / maxH) * 100))}%` }}
          />
        ))}
      </div>
    </div>
  );
}

const BIGO_CURVES = [
  { key: 'O(1)',       label: 'O(1)',       hue: 'var(--easy)',        fn: () => 1 },
  { key: 'O(log n)',   label: 'O(log n)',   hue: 'var(--hue-mint)',    fn: (n) => Math.log2(n + 1) },
  { key: 'O(n)',       label: 'O(n)',       hue: 'var(--hue-sky)',     fn: (n) => n },
  { key: 'O(n log n)', label: 'O(n log n)', hue: 'var(--hue-violet)',  fn: (n) => n * Math.log2(n + 1) },
  { key: 'O(n^2)',     label: 'O(n²)',      hue: 'var(--medium)',      fn: (n) => n * n },
  { key: 'O(2^n)',     label: 'O(2ⁿ)',      hue: 'var(--hard)',        fn: (n) => Math.pow(2, n) },
];

function bigoCurveKey(c) {
  if (!c) return null;
  if (c === 'O(n^3)') return 'O(n^2)';
  if (c === 'O(n!)') return 'O(2^n)';
  return BIGO_CURVES.some(k => k.key === c) ? c : null;
}

export function BigOCurves({ title, active, optimal, uid }) {
  const W = 300, H = 172, PL = 30, PR = 12, PT = 14, PB = 24;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const N = 30, XMAX = 10, ceiling = XMAX * 2.6;
  const activeKey = bigoCurveKey(active);
  const optimalKey = bigoCurveKey(optimal);
  const showOptimal = optimalKey && optimalKey !== activeKey;
  const optimalCurve = showOptimal ? BIGO_CURVES.find(c => c.key === optimalKey) : null;
  const xAt = (n) => PL + (n / XMAX) * plotW;
  const yAt = (v) => PT + plotH - (v / ceiling) * plotH;
  const pathFor = (fn) => {
    let d = '';
    for (let i = 0; i <= N; i++) {
      const n = (i / N) * XMAX;
      d += (i === 0 ? 'M' : 'L') + xAt(n).toFixed(1) + ' ' + yAt(fn(n)).toFixed(1) + ' ';
    }
    return d.trim();
  };
  const activeCurve = BIGO_CURVES.find(c => c.key === activeKey) || null;
  const endOnScreen = activeCurve ? activeCurve.fn(XMAX) <= ceiling : false;
  const gid = `bigo-${uid}`;

  return (
    <div className="ws-bigo">
      <div className="ws-bigo-head">
        <span className="ws-bigo-title">{title}</span>
        <span className="ws-bigo-chip" style={{ '--c': activeCurve?.hue || 'var(--text-dim)' }}>
          {activeCurve?.label || 'N/A'}
        </span>
        {showOptimal && (
          <span className="ws-bigo-opt-chip" style={{ '--c': optimalCurve?.hue }}>
            optimal {optimalCurve?.label}
          </span>
        )}
      </div>
      <svg className="ws-bigo-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${title} growth curves`}>
        <defs>
          <filter id={`${gid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
          <clipPath id={`${gid}-clip`}>
            <rect x={PL} y={PT - 2} width={plotW + PR} height={plotH + 2} />
          </clipPath>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f, i) => (
          <line key={i} x1={PL} y1={PT + plotH - f * plotH} x2={PL + plotW} y2={PT + plotH - f * plotH}
            className="ws-bigo-grid" />
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={PT + plotH} className="ws-bigo-axis" />
        <line x1={PL} y1={PT + plotH} x2={PL + plotW} y2={PT + plotH} className="ws-bigo-axis" />
        <text x={PL - 4} y={PT + 4} className="ws-bigo-axtext" textAnchor="end">ops</text>
        <text x={PL + plotW} y={PT + plotH + 16} className="ws-bigo-axtext" textAnchor="end">n →</text>
        <g clipPath={`url(#${gid}-clip)`}>
          {BIGO_CURVES.map((c) => {
            const isActive = c.key === activeKey;
            return (
              <path key={c.key} d={pathFor(c.fn)} fill="none" stroke={c.hue}
                strokeWidth={isActive ? 2.8 : 1.4}
                strokeOpacity={activeKey ? (isActive ? 1 : 0.22) : 0.7}
                strokeLinecap="round" strokeLinejoin="round" />
            );
          })}
          {activeCurve && (
            <path d={pathFor(activeCurve.fn)} fill="none" stroke={activeCurve.hue}
              strokeWidth="3" strokeOpacity="0.55" filter={`url(#${gid}-glow)`}
              strokeLinecap="round" strokeLinejoin="round" />
          )}
          {optimalCurve && (
            <path d={pathFor(optimalCurve.fn)} fill="none" stroke={optimalCurve.hue}
              strokeWidth="2.2" strokeOpacity="0.9" strokeDasharray="5 4"
              strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
        {activeCurve && endOnScreen && (
          <circle cx={xAt(XMAX)} cy={yAt(activeCurve.fn(XMAX))} r="3.6" fill={activeCurve.hue} />
        )}
        {optimalCurve && optimalCurve.fn(XMAX) <= ceiling && (
          <circle cx={xAt(XMAX)} cy={yAt(optimalCurve.fn(XMAX))} r="3" fill="none"
            stroke={optimalCurve.hue} strokeWidth="1.6" strokeDasharray="3 2" />
        )}
      </svg>
      <div className="ws-bigo-legend">
        {BIGO_CURVES.map((c) => (
          <span key={c.key} className={`ws-bigo-leg${c.key === activeKey ? ' is-active' : ''}${c.key === optimalKey && showOptimal ? ' is-optimal' : ''}`}
            style={{ '--c': c.hue }}>
            <span className="ws-bigo-leg-dot" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ComplexityCompare({ label, mine, optimal, ok }) {
  return (
    <div className="ws-cx-row">
      <span className="ws-cx-metric">{label}</span>
      <div className="ws-cx-pair">
        <div className="ws-cx-cell mine">
          <span className="ws-cx-k">Yours</span>
          <b className={ok ? 'ok' : 'warn'}>{mine}</b>
        </div>
        <span className="ws-cx-arrow">→</span>
        <div className="ws-cx-cell opt">
          <span className="ws-cx-k">Optimal</span>
          <b>{optimal}</b>
        </div>
      </div>
      <span className={`ws-cx-badge ${ok ? 'ok' : 'warn'}`}>{ok ? 'Optimal' : 'Can improve'}</span>
    </div>
  );
}

const STYLE_HUE = {
  Excellent: 'var(--easy)',
  Good: 'var(--hue-sky)',
  Fair: 'var(--medium)',
  'Needs work': 'var(--hard)',
};

function StyleGradeRow({ label, value }) {
  return (
    <div className="ws-style-row">
      <span className="ws-style-label">{label}</span>
      <span className="ws-style-grade" style={{ '--c': STYLE_HUE[value] || 'var(--text-dim)' }}>
        {value}
      </span>
    </div>
  );
}

export function CodeStylePanel({ style }) {
  if (!style) return null;
  return (
    <div className="ws-style">
      <div className="ws-style-head">
        <Palette size={14} />
        <span className="ws-style-title">Code Style</span>
        <span className={`ws-style-src${style.source === 'llm' ? ' llm' : ''}`}>
          {style.source === 'llm' ? <><Sparkles size={11} /> AI review</> : 'estimated'}
        </span>
      </div>
      <StyleGradeRow label="Readability" value={style.readability} />
      <StyleGradeRow label="Structure" value={style.structure} />
      {style.suggestions && (
        <p className="ws-style-sugg"><b>Suggestions:</b> {style.suggestions}</p>
      )}
    </div>
  );
}

// Full report block: verdict + complexity-vs-optimal + Big-O curves + beats + code style.
// `analysis` is the object returned by buildComplexityAnalysis (or an LLM-enriched one).
export default function SubmissionAnalysis({ analysis, codeLen = 0, runtimeMs, memoryMb }) {
  if (!analysis?.user) return null;
  const a = analysis;
  const runValue = runtimeMs ? `${runtimeMs} ms` : (a.runtimeMs ? `${a.runtimeMs} ms` : '');
  const memValue = memoryMb != null ? `${memoryMb} MB` : `${estMemoryMb(a.user?.space, codeLen)} MB`;
  return (
    <div className="sr-report">
      {a.verdict ? <div className="sr-verdict">{a.verdict}</div> : null}

      <div className="ws-cx">
        <ComplexityCompare label="Time" mine={a.user.time} optimal={a.optimal.time} ok={a.timeGap === 0} />
        <ComplexityCompare label="Space" mine={a.user.space} optimal={a.optimal.space} ok={a.spaceGap === 0} />
      </div>

      <div className="ws-bigo-wrap">
        <BigOCurves title="Time complexity" active={a.user.time} optimal={a.optimal?.time} uid="rv-time" />
        <BigOCurves title="Space complexity" active={a.user.space} optimal={a.optimal?.space} uid="rv-space" />
      </div>

      <div className="ws-beats-wrap">
        <BeatsDistribution pct={a.beatsRuntime} label="Runtime" value={runValue} hue="var(--hue-sky)" />
        <BeatsDistribution pct={a.beatsMemory} label="Memory" value={memValue} hue="var(--hue-violet)" />
      </div>

      {a.codeStyle ? <CodeStylePanel style={a.codeStyle} /> : null}
    </div>
  );
}
