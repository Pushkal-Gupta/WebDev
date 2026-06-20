import React, { useMemo } from 'react';
import './ForgeThumb.css';

// A deterministic, theme-tokened SVG thumbnail for topic/problem/paper cards.
// No image assets — each card gets an abstract motif picked from its title so
// the same topic always renders the same picture, but different cards render
// visibly different motifs. Colors are theme hues only, so thumbnails recolor
// with the active palette. Mirrors the procedural-SVG approach the PGLearn hub
// uses, extended to every PGForge surface.

const HUES = [
  'var(--accent)', 'var(--hue-violet)', 'var(--hue-sky)',
  'var(--hue-pink)', 'var(--hue-mint)', 'var(--warning)',
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Every selectable motif. Used both for keyword rules and the hash fallback so a
// title that matches nothing still lands on a distinct picture, never a default.
const MOTIFS = [
  'vectors', 'matrix', 'descent', 'attention', 'network', 'distribution',
  'entropy', 'wave', 'diffusion', 'orbit', 'cuda', 'paper', 'bits',
  'scatter', 'bars', 'field', 'rings', 'tree', 'heat', 'chain', 'grid', 'cards',
];

// Keyword -> motif. First match wins; order matters (specific before generic).
const RULES = [
  [/eigen|svd|singular|determinant|spectral/i, 'matrix'],
  [/vector|embedding|cosine|dot.?product|span|basis/i, 'vectors'],
  [/matri|svd|eigen|linear|transform|projection|tensor|broadcast|einsum|contraction/i, 'matrix'],
  [/field|flow|curl|diverg(?!ence)|stream|nabla|jacobian/i, 'field'],
  [/gradient|descent|optimiz|sgd|adam|momentum|loss|learning.?rate|convex|newton|lagrange/i, 'descent'],
  [/attention|transformer|head|self.?atten/i, 'attention'],
  [/network|mlp|neuron|perceptron|backprop|layer|deep|residual|conv|cnn/i, 'network'],
  [/distribution|gaussian|probab|bayes|variance|expectation|sampl|monte|likelihood|covarianc/i, 'distribution'],
  [/entropy|cross.?entropy|kl|divergence|mutual|information|perplexit/i, 'entropy'],
  [/rnn|lstm|sequence|recurrent|positional|time|signal|fourier|frequenc/i, 'wave'],
  [/diffusion|vae|generative|autoencoder|gan/i, 'diffusion'],
  [/reinforce|reward|policy|markov|mdp|rlhf|agent|bandit|orbit/i, 'orbit'],
  [/cuda|kernel|thread|gpu|warp|block|parallel|tile/i, 'cuda'],
  [/paper|research|read|attention is all|resnet|imagenet/i, 'paper'],
  [/quantiz|distill|lora|prun|compress|float|numeric|stability|precision|conditioning|binary/i, 'bits'],
  [/tree|forest|decision|hierarch|recurs|split|branch/i, 'tree'],
  [/heat|grid|map|pixel|image|spatial|conv2d|kernel.?map/i, 'heat'],
  [/cluster|kmeans|knn|regression|classif|svm|pca|embed.?space/i, 'scatter'],
  [/bar|chart|histogram|count|metric|stat|benchmark|score|rank|leaderboard/i, 'bars'],
  [/ring|cycle|round|epoch|iteration|loop|periodic/i, 'rings'],
  [/list|note|review|progress|history|achiev|assess|plan|roadmap|streak|vault|study/i, 'cards'],
];

const ALIASES = { graph: 'network', dot: 'vectors', bar: 'bars' };

function pickMotif(kind, seed) {
  if (kind && kind !== 'auto') {
    const k = kind.toLowerCase();
    if (MOTIFS.includes(k)) return k;
    if (ALIASES[k]) return ALIASES[k];
  }
  for (const [re, motif] of RULES) if (re.test(seed)) return motif;
  // No keyword match — deterministically scatter across all motifs by hash so
  // generic titles still differ from one another instead of all defaulting.
  if (seed) return MOTIFS[hash(`m:${seed}`) % MOTIFS.length];
  return 'scatter';
}

// Short corner label. Honours an explicit prop, otherwise derives 1-2 words from
// kind/seed so every thumbnail carries some kind of name.
function pickLabel(label, kind, seed) {
  if (label) return label.slice(0, 14);
  if (kind && kind !== 'auto') return kind.slice(0, 14);
  const words = (seed || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'forge';
  return words.slice(0, 2).join(' ').slice(0, 14);
}

function Motif({ name, c1, c2 }) {
  switch (name) {
    case 'vectors':
      return (
        <g>
          <line x1="14" y1="66" x2="14" y2="14" className="ft-axis" />
          <line x1="14" y1="66" x2="106" y2="66" className="ft-axis" />
          <line x1="14" y1="66" x2="78" y2="26" stroke={c1} strokeWidth="3" markerEnd="url(#ft-a1)" />
          <line x1="14" y1="66" x2="52" y2="40" stroke={c2} strokeWidth="3" markerEnd="url(#ft-a2)" />
        </g>
      );
    case 'matrix':
      return (
        <g>
          {[0, 1, 2].map((r) => [0, 1, 2, 3].map((col) => (
            <rect key={`${r}-${col}`} x={20 + col * 20} y={18 + r * 16} width="14" height="11" rx="2"
              fill={(r + col) % 2 ? c1 : c2} opacity={0.35 + ((r * 4 + col) % 5) * 0.12} />
          )))}
        </g>
      );
    case 'descent':
      return (
        <g>
          <path d="M10 20 Q60 90 110 30" fill="none" stroke={c2} strokeWidth="2.5" opacity="0.55" />
          <circle cx="34" cy="48" r="4.5" fill={c1} />
          <circle cx="52" cy="60" r="4.5" fill={c1} opacity="0.8" />
          <circle cx="74" cy="56" r="4.5" fill={c1} opacity="0.6" />
          <path d="M34 48 L52 60 L74 56" fill="none" stroke={c1} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      );
    case 'attention':
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((col) => (
            <rect key={`${r}-${col}`} x={28 + col * 16} y={16 + r * 13} width="13" height="10" rx="2"
              fill={c1} opacity={0.18 + ((hash(`${r}${col}`) % 8) / 10)} />
          )))}
        </g>
      );
    case 'network':
      return (
        <g>
          {[24, 44, 64].map((y) => <circle key={`a${y}`} cx="24" cy={y} r="4" fill={c1} />)}
          {[30, 50].map((y) => <circle key={`b${y}`} cx="60" cy={y} r="4" fill={c2} />)}
          <circle cx="96" cy="40" r="4" fill={c1} />
          {[24, 44, 64].map((y) => [30, 50].map((y2) => (
            <line key={`${y}-${y2}`} x1="24" y1={y} x2="60" y2={y2} className="ft-edge" />
          )))}
          {[30, 50].map((y) => <line key={`o${y}`} x1="60" y1={y} x2="96" y2="40" className="ft-edge" />)}
        </g>
      );
    case 'distribution':
      return (
        <g>
          {[10, 22, 36, 52, 66, 52, 36, 22, 10].map((h, i) => (
            <rect key={i} x={16 + i * 10} y={70 - h} width="8" height={h} rx="1.5"
              fill={i === 4 ? c1 : c2} opacity={i === 4 ? 0.9 : 0.5} />
          ))}
        </g>
      );
    case 'entropy':
      return (
        <g>
          <path d="M14 68 C40 68 40 20 60 20 C80 20 80 68 106 68" fill="none" stroke={c1} strokeWidth="2.5" />
          <path d="M14 68 C40 68 40 40 60 40 C80 40 80 68 106 68" fill="none" stroke={c2} strokeWidth="2.5" opacity="0.6" strokeDasharray="4 3" />
        </g>
      );
    case 'wave':
      return (
        <g>
          <path d="M10 40 Q25 12 40 40 T70 40 T100 40 T130 40" fill="none" stroke={c1} strokeWidth="2.5" />
          <path d="M10 52 Q25 70 40 52 T70 52 T100 52" fill="none" stroke={c2} strokeWidth="2" opacity="0.6" />
        </g>
      );
    case 'diffusion':
      return (
        <g>
          {Array.from({ length: 22 }).map((_, i) => {
            const o = 0.15 + (i / 22) * 0.7;
            return <circle key={i} cx={20 + (hash(`d${i}`) % 80)} cy={14 + (hash(`e${i}`) % 52)} r={1.5 + (i % 3)} fill={i % 2 ? c1 : c2} opacity={o} />;
          })}
          <path d="M16 70 L104 70" stroke={c1} strokeWidth="1.5" opacity="0.4" />
        </g>
      );
    case 'orbit':
      return (
        <g>
          <circle cx="60" cy="40" r="22" fill="none" stroke={c2} strokeWidth="2" opacity="0.5" strokeDasharray="4 4" />
          <circle cx="60" cy="40" r="8" fill={c1} />
          <circle cx="82" cy="40" r="4.5" fill={c2} />
          <circle cx="48" cy="20" r="3.5" fill={c1} opacity="0.7" />
        </g>
      );
    case 'cuda':
      return (
        <g>
          {[0, 1, 2, 3, 4, 5].map((col) => (
            <g key={col}>
              {[0, 1, 2, 3].map((r) => (
                <rect key={r} x={16 + col * 15} y={16 + r * 12} width="11" height="9" rx="1.5"
                  fill={col < 3 ? c1 : c2} opacity={0.3 + ((col + r) % 4) * 0.18} />
              ))}
            </g>
          ))}
        </g>
      );
    case 'paper':
      return (
        <g>
          <rect x="34" y="12" width="52" height="56" rx="4" fill="none" stroke={c2} strokeWidth="2" />
          {[22, 30, 38, 46, 54].map((y, i) => (
            <line key={y} x1="42" y1={y} x2={i === 0 ? 78 : 70 - (i % 2) * 12} y2={y} stroke={c1} strokeWidth="2.5" opacity={i === 0 ? 0.9 : 0.45} />
          ))}
        </g>
      );
    case 'bits':
      return (
        <g>
          {Array.from({ length: 24 }).map((_, i) => (
            <text key={i} x={18 + (i % 8) * 12} y={24 + Math.floor(i / 8) * 18}
              fill={(hash(`b${i}`) % 2) ? c1 : c2} opacity="0.7" fontSize="11" fontFamily="var(--mono, monospace)">
              {hash(`bit${i}`) % 2}
            </text>
          ))}
        </g>
      );
    case 'scatter':
      return (
        <g>
          {Array.from({ length: 18 }).map((_, i) => {
            const cluster = i % 2;
            const cx = cluster ? 44 + (hash(`x${i}`) % 16) : 74 + (hash(`x${i}`) % 16);
            const cy = cluster ? 24 + (hash(`y${i}`) % 18) : 42 + (hash(`y${i}`) % 18);
            return <circle key={i} cx={cx} cy={cy} r="3.5" fill={cluster ? c1 : c2} opacity="0.75" />;
          })}
        </g>
      );
    case 'bars':
      // Sorted ascending bars — reads as an array / sorting motif.
      return (
        <g>
          <line x1="14" y1="66" x2="106" y2="66" className="ft-axis" />
          {[14, 22, 30, 38, 46, 54, 62].map((h, i) => (
            <rect key={i} x={18 + i * 13} y={66 - h} width="9" height={h} rx="1.5"
              fill={i % 2 ? c2 : c1} opacity={0.5 + (i / 7) * 0.45} />
          ))}
        </g>
      );
    case 'field':
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((col) => {
            const x = 18 + col * 21;
            const y = 16 + r * 16;
            const ang = ((hash(`f${r}${col}`) % 8) / 8) * Math.PI * 2;
            const dx = Math.cos(ang) * 7;
            const dy = Math.sin(ang) * 7;
            return (
              <line key={`${r}-${col}`} x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy}
                stroke={(r + col) % 2 ? c1 : c2} strokeWidth="2" opacity="0.7"
                markerEnd={`url(#ft-a${(r + col) % 2 ? 1 : 2})`} />
            );
          }))}
        </g>
      );
    case 'rings':
      return (
        <g>
          {[26, 19, 12, 6].map((rad, i) => (
            <circle key={rad} cx="60" cy="40" r={rad} fill={i === 3 ? c1 : 'none'}
              stroke={i % 2 ? c1 : c2} strokeWidth="2.5" opacity={0.4 + i * 0.15} />
          ))}
        </g>
      );
    case 'tree':
      return (
        <g>
          <line x1="60" y1="18" x2="36" y2="40" className="ft-edge" />
          <line x1="60" y1="18" x2="84" y2="40" className="ft-edge" />
          <line x1="36" y1="40" x2="24" y2="62" className="ft-edge" />
          <line x1="36" y1="40" x2="48" y2="62" className="ft-edge" />
          <line x1="84" y1="40" x2="72" y2="62" className="ft-edge" />
          <line x1="84" y1="40" x2="96" y2="62" className="ft-edge" />
          <circle cx="60" cy="18" r="5" fill={c1} />
          {[36, 84].map((x) => <circle key={x} cx={x} cy="40" r="4.5" fill={c2} />)}
          {[24, 48, 72, 96].map((x) => <circle key={x} cx={x} cy="62" r="3.5" fill={c1} opacity="0.7" />)}
        </g>
      );
    case 'heat':
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((col) => {
            const v = (hash(`h${r}${col}`) % 10) / 10;
            return (
              <rect key={`${r}-${col}`} x={16 + col * 15} y={16 + r * 12} width="14" height="11" rx="1"
                fill={v > 0.5 ? c1 : c2} opacity={0.2 + v * 0.7} />
            );
          }))}
        </g>
      );
    case 'chain':
      // Linked list: circular nodes connected left-to-right by arrowed edges.
      return (
        <g>
          {[20, 50, 80].map((x) => (
            <line key={`l${x}`} x1={x + 9} y1="40" x2={x + 21} y2="40"
              stroke={c2} strokeWidth="2.5" markerEnd="url(#ft-a2)" />
          ))}
          {[20, 50, 80, 110].map((x, i) => (
            <g key={`n${x}`}>
              <circle cx={x} cy="40" r="9"
                fill={i === 3 ? 'none' : c1} stroke={i === 3 ? c2 : 'none'}
                strokeWidth="2" strokeDasharray={i === 3 ? '3 3' : undefined}
                opacity={i === 3 ? 0.7 : 0.9 - i * 0.12} />
            </g>
          ))}
        </g>
      );
    case 'grid':
      // 2D grid / board: clean lattice of equal cells with a couple highlighted.
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((col) => {
            const on = (r === 1 && col === 1) || (r === 2 && col === 3);
            return (
              <rect key={`${r}-${col}`} x={20 + col * 16} y={16 + r * 13} width="14" height="11" rx="2"
                fill={on ? c1 : 'none'} stroke={c2} strokeWidth="1.5"
                opacity={on ? 0.9 : 0.5} />
            );
          }))}
        </g>
      );
    case 'cards':
    default:
      return (
        <g>
          <rect x="22" y="20" width="34" height="40" rx="4" fill={c1} opacity="0.85" />
          <rect x="50" y="26" width="34" height="40" rx="4" fill={c2} opacity="0.6" />
          <rect x="40" y="14" width="34" height="40" rx="4" fill="none" stroke={c1} strokeWidth="2" />
        </g>
      );
  }
}

export default function ForgeThumb({ kind = 'auto', seed = '', label, className = '' }) {
  const { motif, c1, c2, hi, tag } = useMemo(() => {
    const h = hash(seed || kind);
    const c1v = HUES[h % HUES.length];
    const c2i = (h >> 3) % HUES.length === (h % HUES.length) ? (h + 2) % HUES.length : (h >> 3) % HUES.length;
    return {
      motif: pickMotif(kind, seed),
      c1: c1v,
      c2: HUES[c2i],
      hi: h % HUES.length,
      tag: pickLabel(label, kind, seed),
    };
  }, [kind, seed, label]);

  return (
    <svg className={`forge-thumb ${className}`} viewBox="0 0 120 80" role="img" aria-hidden="true"
      preserveAspectRatio="xMidYMid meet" data-hue={hi}>
      <defs>
        <marker id="ft-a1" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill={c1} />
        </marker>
        <marker id="ft-a2" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill={c2} />
        </marker>
        <linearGradient id="ft-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} stopOpacity="0.16" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="80" fill="url(#ft-glow)" />
      <Motif name={motif} c1={c1} c2={c2} />
      <g className="ft-tag" aria-hidden="true">
        <rect className="ft-tag-bg" x="4" y="66" width={Math.min(112, 9 + tag.length * 5.4)} height="11" rx="3" />
        <text className="ft-tag-text" x="8" y="74">{tag.toUpperCase()}</text>
      </g>
    </svg>
  );
}
