import React from 'react';
import './CompeteHubThumbs.css';

// Animated, theme-tokened SVG previews for the PGBattle / Compete hub cards.
// One component per card, each on-topic + visibly distinct. Pattern matches the
// PGLearn hub thumbs (LearningHub): a viewBox SVG scaling to fill the card thumb
// frame, animation via CSS @keyframes / SVG <animate>, theme tokens only, hue set
// per component through the `--cht-hue` custom property, prefers-reduced-motion
// honored in the stylesheet. No hardcoded colors, no emoji, no required props.

const VB = '0 0 200 90';

function Frame({ hue, label, children }) {
  return (
    <svg
      className="cht-thumb"
      viewBox={VB}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      style={{ '--cht-hue': hue }}
    >
      {children}
    </svg>
  );
}

/* ============ User lookup — profile ring sweeps, stat bars climb ============ */
export function ProfileLookupThumb() {
  const ring = 2 * Math.PI * 26;
  return (
    <Frame hue="var(--hue-violet)" label="A profile loading with a progress ring and stat bars">
      <circle cx="52" cy="45" r="26" className="cht-pl-track" />
      <circle
        cx="52" cy="45" r="26"
        className="cht-pl-prog"
        style={{ strokeDasharray: ring, transformOrigin: '52px 45px' }}
      />
      <circle cx="52" cy="39" r="8.5" className="cht-accent cht-pl-pop" />
      <path d="M37 60 a15 13 0 0 1 30 0 Z" className="cht-fill-strong cht-pl-pop" style={{ animationDelay: '0.15s' }} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="98" y={26 + i * 16} width="78" height="9" rx="4.5" className="cht-soft-fill" />
          <rect
            x="98" y={26 + i * 16} width="78" height="9" rx="4.5"
            className={`cht-accent cht-pl-bar cht-pl-bar-${i}`}
            style={{ transformOrigin: '98px 0' }}
          />
        </g>
      ))}
    </Frame>
  );
}

/* ============ Rating predictor — line rises, dashed forecast arrows up ============ */
export function RatingPredictorThumb() {
  const hist = 'M16 70 L42 60 L66 64 L92 46';
  const fore = 'M92 46 L122 38 L152 22 L176 14';
  return (
    <Frame hue="var(--hue-mint)" label="A rating line rising then a dashed forecast arrow trending up">
      <line x1="14" y1="78" x2="186" y2="78" className="cht-axis" />
      <path d={hist} className="cht-rp-hist" pathLength="100" />
      <path d={fore} className="cht-rp-fore" pathLength="100" markerEnd="url(#cht-rp-arrow)" />
      <circle cx="92" cy="46" r="4" className="cht-fill-strong" />
      <circle cx="176" cy="14" r="5" className="cht-accent cht-rp-target" />
      <defs>
        <marker id="cht-rp-arrow" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto">
          <path d="M0 0 L9 4.5 L0 9 Z" className="cht-accent-fill" />
        </marker>
      </defs>
    </Frame>
  );
}

/* ============ Contest calendar — day cells sweep-light, contest day pulses ============ */
export function ContestCalendarThumb() {
  const cols = 6; const rows = 3;
  const cells = [];
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) cells.push([c, r, r * cols + c]);
  const hot = 9;
  return (
    <Frame hue="var(--hue-sky)" label="A calendar grid with days lighting in sequence and one contest day pulsing">
      <rect x="14" y="12" width="172" height="12" rx="4" className="cht-accent" opacity="0.85" />
      {cells.map(([c, r, i]) => {
        const x = 16 + c * 28.5;
        const y = 30 + r * 18;
        const isHot = i === hot;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width="25" height="15" rx="3"
              className={isHot ? 'cht-cc-hotcell' : `cht-cc-cell cht-cc-cell-${i % 6}`}
            />
            {isHot && <circle cx={x + 12.5} cy={y + 7.5} r="9" className="cht-cc-pulse" />}
          </g>
        );
      })}
    </Frame>
  );
}

/* ============ LeetCode problems — difficulty bars rise, solved check stamps ============ */
export function ProblemsThumb() {
  const diff = ['var(--easy)', 'var(--medium)', 'var(--hard)'];
  const bars = [44, 70, 30, 58, 48, 66, 38];
  return (
    <Frame hue="var(--accent)" label="Easy, medium and hard difficulty bars rising with a solved check cycling">
      <line x1="14" y1="74" x2="150" y2="74" className="cht-axis" />
      {bars.map((h, i) => (
        <rect
          key={i}
          x={16 + i * 19} y={74 - h} width="13" height={h} rx="2.5"
          className={`cht-pr-bar cht-pr-bar-${i}`}
          style={{ fill: diff[i % 3], transformOrigin: `0 74px` }}
        />
      ))}
      <g className="cht-pr-check" style={{ transformOrigin: '172px 30px' }}>
        <circle cx="172" cy="30" r="15" className="cht-accent-fill" />
        <path d="M165 30 L170 35 L180 24" className="cht-pr-tick" />
      </g>
    </Frame>
  );
}

/* ============ LeetCode contests — rating line draws, trophy pops ============ */
export function ContestsThumb() {
  const line = 'M14 66 L40 52 L62 58 L86 40 L110 46 L134 26 L158 32';
  return (
    <Frame hue="var(--accent)" label="A contest rating line drawing on with a trophy at the peak">
      <line x1="14" y1="76" x2="186" y2="76" className="cht-axis" />
      <path d={line} className="cht-co-line" pathLength="100" />
      {[[40, 52], [86, 40], [134, 26]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.4" className={`cht-co-dot cht-co-dot-${i}`} />
      ))}
      <g className="cht-co-trophy" style={{ transformOrigin: '170px 40px' }}>
        <path d="M162 26 h16 v6 a8 8 0 0 1 -16 0 Z" className="cht-accent-fill" />
        <path d="M162 28 a6 5 0 0 1 -6 5 M178 28 a6 5 0 0 0 6 5" className="cht-co-handle" />
        <rect x="167" y="40" width="6" height="6" className="cht-accent-fill" />
        <rect x="162" y="46" width="16" height="4" rx="1.5" className="cht-fill-strong" />
      </g>
    </Frame>
  );
}

/* ============ Competitions — judge lanes, a "now" line sweeps and lights rounds ============ */
export function CompetitionsThumb() {
  const lanes = [22, 45, 68];
  const blocks = [[26, 48], [70, 96], [124, 150]];
  return (
    <Frame hue="var(--hue-pink)" label="Three judge lanes with contest rounds lit by a sweeping now line">
      {lanes.map((y, li) => (
        <g key={li}>
          <line x1="14" y1={y} x2="186" y2={y} className="cht-cm-rail" />
          {blocks.map(([x0, x1], bi) => (
            <rect
              key={bi}
              x={x0 + li * 8} y={y - 6} width={x1 - x0} height="12" rx="3"
              className={`cht-cm-block cht-cm-block-${(li + bi) % 3}`}
            />
          ))}
        </g>
      ))}
      <line x1="0" y1="10" x2="0" y2="80" className="cht-cm-scan" />
    </Frame>
  );
}

/* ============ Hackathons — countdown clock sweeps, blocks stack up ============ */
export function HackathonsThumb() {
  return (
    <Frame hue="var(--warning)" label="A countdown clock sweeping while build blocks stack up">
      <circle cx="50" cy="45" r="28" className="cht-pl-track" />
      <circle cx="50" cy="45" r="28" className="cht-hk-ring" style={{ strokeDasharray: 2 * Math.PI * 28, transformOrigin: '50px 45px' }} />
      <circle cx="50" cy="45" r="3" className="cht-accent" />
      <line x1="50" y1="45" x2="50" y2="26" className="cht-hk-hand" style={{ transformOrigin: '50px 45px' }} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={110} y={66 - i * 14} width={50 + (i % 2) * 14} height="11" rx="2.5"
          className={`cht-hk-blk cht-hk-blk-${i}`}
          style={{ transformOrigin: `110px ${72 - i * 14}px` }}
        />
      ))}
    </Frame>
  );
}

/* ============ Conferences — presentation screen, slides advance ============ */
export function ConferencesThumb() {
  return (
    <Frame hue="var(--hue-sky)" label="A presentation screen with slides advancing and progress dots">
      <rect x="34" y="10" width="132" height="58" rx="5" className="cht-cf-screen" />
      <rect x="92" y="68" width="16" height="9" className="cht-fill-strong" />
      <rect x="76" y="77" width="48" height="4" rx="2" className="cht-fill-strong" />
      <g className="cht-cf-slides">
        {[0, 1, 2].map((i) => (
          <g key={i} className={`cht-cf-slide cht-cf-slide-${i}`}>
            <rect x="44" y="20" width="46" height="7" rx="3" className="cht-accent" />
            <rect x="44" y="33" width="112" height="4.5" rx="2" className="cht-soft-fill" />
            <rect x="44" y="42" width="96" height="4.5" rx="2" className="cht-soft-fill" />
            <rect x="44" y="51" width="74" height="4.5" rx="2" className="cht-soft-fill" />
            <rect x={120} y="42" width="36" height="14" rx="3" className="cht-fill-strong" />
          </g>
        ))}
      </g>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={88 + i * 12} cy="62" r="2.6" className={`cht-cf-dot cht-cf-dot-${i}`} />
      ))}
    </Frame>
  );
}

/* ============ ML competitions — leaderboard rows climb / shuffle ============ */
export function KaggleThumb() {
  const rows = [0, 1, 2, 3];
  const widths = [120, 96, 108, 84];
  return (
    <Frame hue="var(--hue-mint)" label="A leaderboard with rows climbing and a medal moving to the top">
      {rows.map((i) => (
        <g key={i} className={`cht-kg-row cht-kg-row-${i}`}>
          <circle cx="24" cy={20 + i * 18} r="7" className="cht-kg-rank" />
          <rect x="38" y={15 + i * 18} width={widths[i]} height="10" rx="3" className="cht-soft-fill" />
          <rect x="38" y={15 + i * 18} width={widths[i] * 0.6} height="10" rx="3" className="cht-fill-strong" />
        </g>
      ))}
      <g className="cht-kg-medal" style={{ transformOrigin: '24px 20px' }}>
        <circle cx="24" cy="20" r="7" className="cht-accent-fill" />
      </g>
    </Frame>
  );
}

/* ============ GSoC — program timeline, phases light in sequence ============ */
export function GsocThumb() {
  const nodes = [22, 68, 114, 160];
  return (
    <Frame hue="var(--hue-violet)" label="A program timeline with phases lighting up in sequence">
      <line x1="22" y1="45" x2="160" y2="45" className="cht-gs-rail" />
      <line x1="22" y1="45" x2="160" y2="45" className="cht-gs-fill" pathLength="100" />
      {nodes.map((x, i) => (
        <g key={i} className={`cht-gs-node cht-gs-node-${i}`}>
          <circle cx={x} cy="45" r="9" className="cht-gs-ring" />
          <circle cx={x} cy="45" r="4.5" className="cht-gs-core" />
          <rect x={x - 16} y="58" width="32" height="6" rx="3" className="cht-soft-fill" />
          <rect x={x - 14} y="24" width={20 + (i % 2) * 6} height="6" rx="3" className="cht-soft-fill" />
        </g>
      ))}
    </Frame>
  );
}

/* ============ LLMs on LeetCode — model solve-rate bars race ============ */
export function LlmsThumb() {
  const models = [0, 1, 2, 3];
  const rates = [150, 116, 92, 64];
  return (
    <Frame hue="var(--hue-pink)" label="Language-model solve-rate bars racing to different lengths">
      <rect x="14" y="12" width="10" height="66" rx="2" className="cht-lm-spine" />
      {models.map((i) => (
        <g key={i}>
          <circle cx="20" cy={22 + i * 17} r="3.4" className="cht-lm-node" />
          <rect x="30" y={17 + i * 17} width="156" height="10" rx="5" className="cht-soft-fill" />
          <rect
            x="30" y={17 + i * 17} width={rates[i]} height="10" rx="5"
            className={`cht-lm-bar cht-lm-bar-${i}`}
            style={{ transformOrigin: '30px 0' }}
          />
        </g>
      ))}
    </Frame>
  );
}

/* ============ Resources — link-shelf cards slide in ============ */
export function ResourcesThumb() {
  const cards = [0, 1, 2];
  return (
    <Frame hue="var(--hue-sky)" label="Resource link cards sliding onto a shelf in sequence">
      {cards.map((i) => (
        <g key={i} className={`cht-rs-card cht-rs-card-${i}`}>
          <rect x="20" y={14 + i * 22} width="160" height="18" rx="5" className="cht-rs-box" />
          <circle cx="32" cy={23 + i * 22} r="5.5" className="cht-accent-fill" />
          <path
            d={`M29 ${23 + i * 22} a2.4 2.4 0 0 1 0 -3.4 l1.6 -1.6 a2.4 2.4 0 0 1 3.4 3.4 M35 ${23 + i * 22} a2.4 2.4 0 0 1 0 3.4 l-1.6 1.6 a2.4 2.4 0 0 1 -3.4 -3.4`}
            className="cht-rs-link"
          />
          <rect x="46" y={19 + i * 22} width={92 - i * 14} height="4.5" rx="2" className="cht-fill-strong" />
          <rect x="46" y={26 + i * 22} width={70 - i * 8} height="3.5" rx="1.75" className="cht-soft-fill" />
        </g>
      ))}
    </Frame>
  );
}

// Lookup by a stable key carried on each Compete card. Falls back to the problems
// thumb so a missing key never renders blank.
const COMPETE_THUMBS = {
  lookup: ProfileLookupThumb,
  predictor: RatingPredictorThumb,
  calendar: ContestCalendarThumb,
  problems: ProblemsThumb,
  contests: ContestsThumb,
  competitions: CompetitionsThumb,
  hackathons: HackathonsThumb,
  conferences: ConferencesThumb,
  kaggle: KaggleThumb,
  gsoc: GsocThumb,
  llms: LlmsThumb,
  resources: ResourcesThumb,
};

export default function CompeteHubThumb({ thumbKey }) {
  const Thumb = COMPETE_THUMBS[thumbKey] || COMPETE_THUMBS.problems;
  return <Thumb />;
}
