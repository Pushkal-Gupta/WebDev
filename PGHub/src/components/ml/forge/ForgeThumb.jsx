import React, { useMemo } from 'react';
import './ForgeThumb.css';

// A deterministic, theme-tokened SVG thumbnail for topic/problem/paper cards.
// No image assets — each card gets an abstract motif picked from its content
// (an explicit `topic`, a keyword in the `kind`/`seed`, or a hash fallback) so
// the SAME topic always renders the same FAMILY of picture and DIFFERENT cards
// render visibly different pictures. Two cards never collide because:
//   1. the motif is chosen on-topic, and
//   2. inside a motif every position/height/opacity/count is jittered by a
//      seeded PRNG, so two cards sharing a motif still look distinct, and
//   3. the colour pair is decoupled (c1 and c2 come from independent hashes).
// Colours are theme hues only, so thumbnails recolour with the active palette.

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

// A tiny deterministic PRNG seeded off a string. Returned closure yields a new
// pseudo-random float in [0, 1) each call (mulberry32). This is what makes two
// cards that land on the SAME motif still look different — every drawn element
// reads its jitter/height/opacity from this stream, keyed on the card seed.
function rng(seedStr) {
  let a = (hash(seedStr) ^ 0x9e3779b9) >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Every selectable motif. Used by the keyword rules, the explicit topic map and
// the hash fallback so a title that matches nothing still lands on a distinct
// picture, never a single shared default.
const MOTIFS = [
  'vectors', 'matrix', 'descent', 'attention', 'network', 'distribution',
  'entropy', 'wave', 'diffusion', 'orbit', 'cuda', 'paper', 'bits',
  'scatter', 'bars', 'field', 'rings', 'tree', 'heat', 'chain', 'grid', 'cards',
  // on-topic motifs added for the PGForge content surfaces
  'convolution', 'metrics', 'recommender', 'timeseries', 'sequence',
  'transformer', 'schedule', 'cluster', 'project',
];

// Stride for positional (index-based) motif assignment. Coprime to MOTIFS.length
// (31) so stepping by it visits every motif exactly once — consecutive cards get
// well-separated, never-repeating shapes. Keep coprime if MOTIFS grows.
const MOTIF_STRIDE = 13;

// Explicit content -> motif map. A card that knows its real subject (a problem
// CATEGORY, a Foundations TOPIC/module, a project TAG, a study-plan SLUG) passes
// it as `topic` and gets the matching on-topic picture directly — no guessing.
// Keys are lower-cased; lookups normalise punctuation/spacing first.
const TOPIC_MOTIF = {
  // problem categories
  optimizers: 'descent',
  activations: 'wave',
  losses: 'entropy',
  normalization: 'distribution',
  attention: 'attention',
  'attention/llm': 'attention',
  llms: 'sequence',
  'neural networks': 'network',
  'classical ml': 'scatter',
  'data processing': 'bars',
  transformers: 'transformer',
  diffusion: 'diffusion',
  'reinforcement learning': 'orbit',
  embeddings: 'vectors',
  convolutions: 'convolution',
  clustering: 'cluster',
  'dimensionality reduction': 'project',
  metrics: 'metrics',
  'sequence models': 'wave',
  probability: 'distribution',
  'computer vision': 'heat',
  'linear algebra': 'matrix',
  statistics: 'distribution',
  'time series': 'timeseries',
  recommenders: 'recommender',
  // foundations modules + topics
  calculus: 'descent',
  'calculus & gradients': 'descent',
  'information theory': 'entropy',
  optimization: 'descent',
  'numerical methods': 'bits',
  'matrix calculus & tensors': 'cuda',
  'probability & statistics': 'distribution',
  vectors: 'vectors',
  'dot product': 'vectors',
  'matrix multiply': 'matrix',
  eigen: 'matrix',
  svd: 'matrix',
  projections: 'project',
  norms: 'rings',
  derivatives: 'descent',
  'chain rule': 'chain',
  gradients: 'field',
  'jacobian hessian': 'field',
  'gradient descent geometry': 'descent',
  backprop: 'network',
  distributions: 'distribution',
  bayes: 'distribution',
  'expectation variance': 'distribution',
  mle: 'distribution',
  covariance: 'heat',
  sampling: 'scatter',
  convexity: 'descent',
  'gd sgd': 'descent',
  momentum: 'descent',
  adam: 'descent',
  'lr schedules': 'schedule',
  lagrange: 'field',
  entropy: 'entropy',
  'cross entropy': 'entropy',
  'kl divergence': 'entropy',
  'mutual information': 'entropy',
  perplexity: 'bars',
  'floating point': 'bits',
  conditioning: 'bits',
  'numerical stability': 'bits',
  'finite differences': 'bits',
  'matrix calculus': 'cuda',
  broadcasting: 'cuda',
  einsum: 'cuda',
  'tensor contraction': 'cuda',
  vectorization: 'cuda',
  // project / study-plan tags + slugs
  regression: 'descent',
  autograd: 'network',
  graphs: 'tree',
  mlp: 'network',
  classification: 'scatter',
  rnn: 'wave',
  sequence: 'sequence',
  nlp: 'sequence',
  cnn: 'convolution',
  vision: 'heat',
  tokenization: 'sequence',
  pca: 'project',
  unsupervised: 'cluster',
  vae: 'diffusion',
  generative: 'diffusion',
  pytorch: 'network',
  numpy: 'matrix',
  cuda: 'cuda',
  triton: 'cuda',
  // study-plan slugs
  'neural-nets-from-scratch': 'network',
  'transformers-and-attention': 'transformer',
  'ml-math-foundations': 'matrix',
  'classical-ml-toolkit': 'scatter',
  'optimization-and-training-dynamics': 'descent',
  'ml-interview-prep': 'cards',
  // sheet slugs
  'cracking-ml': 'cards',
  // paper topics (fallback when no architecture diagram is available)
  architecture: 'transformer',
  language: 'sequence',
  regularization: 'distribution',
  reinforcement: 'orbit',
  alignment: 'metrics',
  'fine-tuning': 'schedule',
  multimodal: 'heat',
  scaling: 'bars',
  systems: 'cuda',
};

// Keyword -> motif. First match wins; order matters (specific before generic).
// This is the fallback when no explicit `topic` is given but the seed/title is
// descriptive enough to read a subject from.
const RULES = [
  [/eigen|svd|singular|determinant|spectral/i, 'matrix'],
  [/vector|embedding|cosine|dot.?product|span|basis/i, 'vectors'],
  [/matri|linear|transform|projection|tensor|broadcast|einsum|contraction/i, 'matrix'],
  [/conv2d|convolut|kernel.?map|cnn|filter/i, 'convolution'],
  [/field|flow|curl|diverg(?!ence)|stream|nabla|jacobian|hessian/i, 'field'],
  [/gradient|descent|optimiz|sgd|adam|momentum|loss|convex|newton|lagrange/i, 'descent'],
  [/schedul|warmup|cosine.?decay|annealing|learning.?rate/i, 'schedule'],
  [/attention|self.?atten|head/i, 'attention'],
  [/transformer|encoder.?block|decoder.?block/i, 'transformer'],
  [/network|mlp|neuron|perceptron|backprop|layer|deep|residual/i, 'network'],
  [/distribution|gaussian|probab|bayes|variance|expectation|likelihood|covarianc|normaliz/i, 'distribution'],
  [/entropy|cross.?entropy|kl|divergence|mutual|information|perplexit/i, 'entropy'],
  [/recommend|collaborative|user.?item|rating.?matrix/i, 'recommender'],
  [/time.?series|forecast|seasonal|trend|arima/i, 'timeseries'],
  [/rnn|lstm|recurrent|token|nlp|language.?model|n.?gram/i, 'sequence'],
  [/sequence|positional|signal|fourier|frequenc|wave|sinusoid|activation/i, 'wave'],
  [/diffusion|vae|generative|autoencoder|gan/i, 'diffusion'],
  [/reinforce|reward|policy|markov|mdp|rlhf|agent|bandit|orbit/i, 'orbit'],
  [/cuda|warp|block|parallel|tile|thread|gpu/i, 'cuda'],
  [/paper|research|read|attention is all|resnet|imagenet/i, 'paper'],
  [/quantiz|distill|lora|prun|compress|float|numeric|stability|precision|conditioning|binary/i, 'bits'],
  [/tree|forest|decision|hierarch|recurs|split|branch|gini/i, 'tree'],
  [/cluster|kmeans|k.?means/i, 'cluster'],
  [/pca|dimensionalit|reduc|t.?sne|umap|manifold/i, 'project'],
  [/knn|regression|classif|svm|naive.?bayes/i, 'scatter'],
  [/heat|grid|map|pixel|image|spatial|vision/i, 'heat'],
  [/metric|accuracy|precision.?recall|f1|roc|auc|score|benchmark|leaderboard|gauge/i, 'metrics'],
  [/bar|chart|histogram|count|stat/i, 'bars'],
  [/ring|cycle|round|epoch|iteration|loop|periodic|norm/i, 'rings'],
  [/list|note|review|progress|history|achiev|assess|plan|roadmap|streak|vault|study|interview/i, 'cards'],
];

const ALIASES = { graph: 'network', dot: 'vectors', bar: 'bars', linalg: 'matrix' };

// Normalise an explicit topic/category string to a TOPIC_MOTIF key.
function topicKey(topic) {
  return topic.toLowerCase().replace(/[^a-z0-9/&\s-]/g, '').replace(/\s+/g, ' ').trim();
}

function pickMotif(kind, seed, topic) {
  // UNIQUENESS-FIRST. A unique seed (the card's own title) scatters across the
  // FULL motif pool, salted by kind+topic, so two cards never share a motif just
  // because they share a category. (Previously kind/topic short-circuited and
  // collapsed every same-category card onto one motif — all "activation" cards
  // became bars, all "reduction" cards became trees, etc.) Combined with the
  // seed-decoupled colour pair + seeded jitter, every card draws a distinct image.
  if (seed) {
    return MOTIFS[hash(`m:${seed}|${kind || ''}|${topic || ''}`) % MOTIFS.length];
  }
  // No seed — fall back to kind, then topic, then a default.
  if (kind && kind !== 'auto') {
    const k = kind.toLowerCase();
    if (MOTIFS.includes(k)) return k;
    if (ALIASES[k]) return ALIASES[k];
    if (TOPIC_MOTIF[topicKey(k)]) return TOPIC_MOTIF[topicKey(k)];
  }
  if (topic) {
    const key = topicKey(topic);
    if (TOPIC_MOTIF[key]) return TOPIC_MOTIF[key];
    const spaced = key.replace(/-/g, ' ');
    if (TOPIC_MOTIF[spaced]) return TOPIC_MOTIF[spaced];
  }
  return 'scatter';
}

// Short corner label. Honours an explicit prop, otherwise derives 1-2 words from
// topic/kind/seed so every thumbnail carries some kind of name.
function pickLabel(label, kind, seed, topic) {
  // Keep whole words — the SVG text auto-compresses to fit, so we never cut a word
  // mid-character ("Numerical Stab"). Cap generously to avoid absurdly long tags.
  if (label) return label.slice(0, 26);
  if (topic) return topic.slice(0, 26);
  if (kind && kind !== 'auto') return kind.slice(0, 26);
  const words = (seed || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'forge';
  return words.slice(0, 3).join(' ').slice(0, 26);
}

// All motifs receive a seeded `rand` stream so the same motif jitters per card.
function Motif({ name, c1, c2, rand }) {
  switch (name) {
    case 'vectors': {
      // 2-3 arrows from the origin at seed-varied angles/lengths.
      const n = 2 + Math.floor(rand() * 2);
      return (
        <g>
          <line x1="14" y1="66" x2="14" y2="12" className="ft-axis" />
          <line x1="14" y1="66" x2="108" y2="66" className="ft-axis" />
          {Array.from({ length: n }).map((_, i) => {
            const len = 38 + rand() * 50;
            const ang = (0.12 + rand() * 0.55) * Math.PI;
            return (
              <line key={i} x1="14" y1="66" x2={14 + Math.cos(ang) * len} y2={66 - Math.sin(ang) * len}
                stroke={i % 2 ? c2 : c1} strokeWidth="3" markerEnd={`url(#ft-a${i % 2 ? 2 : 1})`} />
            );
          })}
        </g>
      );
    }
    case 'matrix':
      return (
        <g>
          {[0, 1, 2].map((r) => [0, 1, 2, 3].map((col) => (
            <rect key={`${r}-${col}`} x={20 + col * 20} y={18 + r * 16} width="14" height="11" rx="2"
              fill={rand() > 0.5 ? c1 : c2} opacity={0.3 + rand() * 0.6} />
          )))}
        </g>
      );
    case 'descent': {
      // A bowl + a path of steps rolling toward the minimum, jittered per card.
      const pts = [0, 1, 2, 3].map((i) => {
        const t = 0.18 + i * 0.2;
        const x = 18 + t * 80;
        const y = 22 + Math.pow(1 - t, 2) * 40 + (rand() - 0.5) * 8;
        return [x, y];
      });
      const dip = 0.4 + rand() * 0.2;
      return (
        <g>
          <path d={`M10 20 Q${10 + dip * 100} 92 110 26`} fill="none" stroke={c2} strokeWidth="2.5" opacity="0.55" />
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill={c1} opacity={1 - i * 0.18} />)}
          <path d={`M${pts.map((p) => p.join(' ')).join(' L')}`} fill="none" stroke={c1} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      );
    }
    case 'attention':
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((col) => (
            <rect key={`${r}-${col}`} x={28 + col * 16} y={16 + r * 13} width="13" height="10" rx="2"
              fill={rand() > 0.55 ? c1 : c2} opacity={0.16 + rand() * 0.74} />
          )))}
        </g>
      );
    case 'network': {
      // 3-layer net with seed-varied node counts per layer.
      const cols = [24, 60, 96];
      const counts = [2 + Math.floor(rand() * 2), 2 + Math.floor(rand() * 2), 1 + Math.floor(rand() * 2)];
      const ys = counts.map((c) => Array.from({ length: c }, (_, i) => 22 + (i + 0.5) * (40 / c)));
      return (
        <g>
          {ys[0].map((y, i) => ys[1].map((y2, j) => (
            <line key={`e0${i}${j}`} x1={cols[0]} y1={y} x2={cols[1]} y2={y2} className="ft-edge" />
          )))}
          {ys[1].map((y, i) => ys[2].map((y2, j) => (
            <line key={`e1${i}${j}`} x1={cols[1]} y1={y} x2={cols[2]} y2={y2} className="ft-edge" />
          )))}
          {ys.map((layer, li) => layer.map((y, i) => (
            <circle key={`n${li}${i}`} cx={cols[li]} cy={y} r="4.5" fill={li === 1 ? c2 : c1} />
          )))}
        </g>
      );
    }
    case 'distribution': {
      // A bell histogram whose peak position/spread shift per card.
      const peak = 3 + Math.floor(rand() * 3);
      const heights = Array.from({ length: 9 }, (_, i) => {
        const d = Math.abs(i - peak);
        return Math.max(8, 64 * Math.exp(-(d * d) / (2 + rand() * 2)));
      });
      return (
        <g>
          {heights.map((h, i) => (
            <rect key={i} x={16 + i * 10} y={70 - h} width="8" height={h} rx="1.5"
              fill={i === peak ? c1 : c2} opacity={i === peak ? 0.92 : 0.45} />
          ))}
        </g>
      );
    }
    case 'entropy': {
      const a = 18 + rand() * 16;
      const b = 36 + rand() * 16;
      return (
        <g>
          <path d={`M14 68 C40 68 40 ${a} 60 ${a} C80 ${a} 80 68 106 68`} fill="none" stroke={c1} strokeWidth="2.5" />
          <path d={`M14 68 C40 68 40 ${b} 60 ${b} C80 ${b} 80 68 106 68`} fill="none" stroke={c2} strokeWidth="2.5" opacity="0.6" strokeDasharray="4 3" />
        </g>
      );
    }
    case 'wave': {
      const amp = 12 + rand() * 14;
      const freq = 1.5 + rand() * 1.5;
      const pts = Array.from({ length: 31 }, (_, i) => {
        const x = 10 + i * 3.4;
        const y = 40 - Math.sin((i / 30) * Math.PI * freq + rand() * 0.6) * amp;
        return `${x} ${y.toFixed(1)}`;
      });
      return (
        <g>
          <path d={`M${pts.join(' L')}`} fill="none" stroke={c1} strokeWidth="2.5" />
          <path d={`M${pts.join(' L')}`} fill="none" stroke={c2} strokeWidth="2" opacity="0.4" transform="translate(0 14)" />
        </g>
      );
    }
    case 'diffusion':
      return (
        <g>
          {Array.from({ length: 24 }).map((_, i) => (
            <circle key={i} cx={18 + rand() * 84} cy={12 + rand() * 54} r={1.5 + rand() * 3}
              fill={i % 2 ? c1 : c2} opacity={0.15 + rand() * 0.7} />
          ))}
          <path d="M16 70 L104 70" stroke={c1} strokeWidth="1.5" opacity="0.4" />
        </g>
      );
    case 'orbit': {
      const moons = 2 + Math.floor(rand() * 2);
      return (
        <g>
          <circle cx="60" cy="40" r="22" fill="none" stroke={c2} strokeWidth="2" opacity="0.5" strokeDasharray="4 4" />
          <circle cx="60" cy="40" r="8" fill={c1} />
          {Array.from({ length: moons }).map((_, i) => {
            const ang = rand() * Math.PI * 2;
            const rad = 16 + rand() * 8;
            return <circle key={i} cx={60 + Math.cos(ang) * rad} cy={40 + Math.sin(ang) * rad} r={3 + rand() * 2} fill={i % 2 ? c2 : c1} opacity="0.8" />;
          })}
        </g>
      );
    }
    case 'cuda':
      return (
        <g>
          {[0, 1, 2, 3, 4, 5].map((col) => (
            <g key={col}>
              {[0, 1, 2, 3].map((r) => (
                <rect key={r} x={16 + col * 15} y={16 + r * 12} width="11" height="9" rx="1.5"
                  fill={rand() > 0.5 ? c1 : c2} opacity={0.25 + rand() * 0.6} />
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
            <line key={y} x1="42" y1={y} x2={42 + 18 + rand() * 18} y2={y} stroke={c1} strokeWidth="2.5" opacity={i === 0 ? 0.9 : 0.45} />
          ))}
        </g>
      );
    case 'bits':
      return (
        <g>
          {Array.from({ length: 24 }).map((_, i) => (
            <text key={i} x={18 + (i % 8) * 12} y={24 + Math.floor(i / 8) * 18}
              fill={rand() > 0.5 ? c1 : c2} opacity="0.7" fontSize="11" fontFamily="var(--mono, monospace)">
              {rand() > 0.5 ? 1 : 0}
            </text>
          ))}
        </g>
      );
    case 'scatter':
      return (
        <g>
          {Array.from({ length: 18 }).map((_, i) => {
            const cluster = i % 2;
            const cx = cluster ? 40 + rand() * 24 : 70 + rand() * 24;
            const cy = cluster ? 20 + rand() * 24 : 36 + rand() * 24;
            return <circle key={i} cx={cx} cy={cy} r="3.5" fill={cluster ? c1 : c2} opacity="0.75" />;
          })}
        </g>
      );
    case 'bars':
      return (
        <g>
          <line x1="14" y1="66" x2="106" y2="66" className="ft-axis" />
          {Array.from({ length: 7 }).map((_, i) => {
            const h = 12 + rand() * 50;
            return <rect key={i} x={18 + i * 13} y={66 - h} width="9" height={h} rx="1.5"
              fill={i % 2 ? c2 : c1} opacity={0.45 + rand() * 0.5} />;
          })}
        </g>
      );
    case 'field':
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((col) => {
            const x = 18 + col * 21;
            const y = 16 + r * 16;
            const ang = rand() * Math.PI * 2;
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
    case 'tree': {
      // Binary tree with a seed-chosen leaf highlighted.
      const hot = Math.floor(rand() * 4);
      const leaves = [24, 48, 72, 96];
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
          {leaves.map((x, i) => <circle key={x} cx={x} cy="62" r="3.5" fill={i === hot ? c1 : c2} opacity={i === hot ? 1 : 0.6} />)}
        </g>
      );
    }
    case 'heat':
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((col) => {
            const v = rand();
            return (
              <rect key={`${r}-${col}`} x={16 + col * 15} y={16 + r * 12} width="14" height="11" rx="1"
                fill={v > 0.5 ? c1 : c2} opacity={0.18 + v * 0.72} />
            );
          }))}
        </g>
      );
    case 'chain':
      return (
        <g>
          {[20, 50, 80].map((x) => (
            <line key={`l${x}`} x1={x + 9} y1="40" x2={x + 21} y2="40"
              stroke={c2} strokeWidth="2.5" markerEnd="url(#ft-a2)" />
          ))}
          {[20, 50, 80, 110].map((x, i) => (
            <circle key={`n${x}`} cx={x} cy="40" r="9"
              fill={i === 3 ? 'none' : c1} stroke={i === 3 ? c2 : 'none'}
              strokeWidth="2" strokeDasharray={i === 3 ? '3 3' : undefined}
              opacity={i === 3 ? 0.7 : 0.9 - i * 0.12} />
          ))}
        </g>
      );
    case 'grid': {
      const a = Math.floor(rand() * 20);
      const b = Math.floor(rand() * 20);
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((col) => {
            const idx = r * 5 + col;
            const on = idx === a || idx === b;
            return (
              <rect key={`${r}-${col}`} x={20 + col * 16} y={16 + r * 13} width="14" height="11" rx="2"
                fill={on ? c1 : 'none'} stroke={c2} strokeWidth="1.5" opacity={on ? 0.9 : 0.5} />
            );
          }))}
        </g>
      );
    }

    // ---- on-topic motifs ----
    case 'convolution': {
      // A pixel grid with a sliding kernel window highlighted at a seed offset.
      const kx = Math.floor(rand() * 4);
      const ky = Math.floor(rand() * 2);
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((col) => {
            const inWin = col >= kx && col < kx + 2 && r >= ky && r < ky + 2;
            return (
              <rect key={`${r}-${col}`} x={16 + col * 15} y={14 + r * 13} width="13" height="11" rx="1.5"
                fill={inWin ? c1 : c2} opacity={inWin ? 0.9 : 0.22 + rand() * 0.18} />
            );
          }))}
          <rect x={16 + kx * 15 - 1.5} y={14 + ky * 13 - 1.5} width="32" height="28" rx="3"
            fill="none" stroke={c1} strokeWidth="2" />
        </g>
      );
    }
    case 'metrics': {
      // A gauge arc filled to a seed-varied fraction.
      const frac = 0.35 + rand() * 0.55;
      const start = Math.PI;
      const end = Math.PI * (1 - frac);
      const cx = 60; const cy = 56; const rad = 30;
      const p = (ang) => `${cx + Math.cos(ang) * rad} ${cy - Math.sin(ang) * rad}`;
      return (
        <g>
          <path d={`M${p(start)} A${rad} ${rad} 0 0 1 ${p(0)}`} fill="none" stroke={c2} strokeWidth="4" opacity="0.3" strokeLinecap="round" />
          <path d={`M${p(start)} A${rad} ${rad} 0 0 1 ${p(end)}`} fill="none" stroke={c1} strokeWidth="4" strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={cx + Math.cos(end) * (rad - 4)} y2={cy - Math.sin(end) * (rad - 4)} stroke={c1} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="3.5" fill={c1} />
        </g>
      );
    }
    case 'recommender': {
      // A user-item rating matrix with a few seed-chosen filled cells.
      return (
        <g>
          {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((col) => {
            const filled = rand() > 0.5;
            return filled
              ? <rect key={`${r}-${col}`} x={22 + col * 16} y={16 + r * 13} width="13" height="10" rx="2"
                  fill={rand() > 0.5 ? c1 : c2} opacity={0.5 + rand() * 0.45} />
              : <rect key={`${r}-${col}`} x={22 + col * 16} y={16 + r * 13} width="13" height="10" rx="2"
                  fill="none" stroke={c2} strokeWidth="1" opacity="0.35" />;
          }))}
        </g>
      );
    }
    case 'timeseries': {
      // A jagged history line + a dashed forecast continuation.
      const hist = Array.from({ length: 8 }, (_, i) => [14 + i * 8, 30 + Math.sin(i + rand()) * 8 + rand() * 10]);
      const last = hist[hist.length - 1];
      const fc = Array.from({ length: 4 }, (_, i) => [last[0] + (i + 1) * 8, last[1] - (i + 1) * (2 + rand() * 3)]);
      return (
        <g>
          <line x1="12" y1="66" x2="108" y2="66" className="ft-axis" />
          <path d={`M${hist.map((p) => p.join(' ')).join(' L')}`} fill="none" stroke={c1} strokeWidth="2.5" />
          <path d={`M${last.join(' ')} L${fc.map((p) => p.join(' ')).join(' L')}`} fill="none" stroke={c2} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      );
    }
    case 'sequence': {
      // A row of token boxes, one highlighted as the "next" prediction.
      const next = 3 + Math.floor(rand() * 2);
      return (
        <g>
          {Array.from({ length: 5 }).map((_, i) => (
            <g key={i}>
              <rect x={12 + i * 21} y="30" width="16" height="20" rx="3"
                fill={i === next ? c1 : c2} opacity={i === next ? 0.9 : 0.4 + rand() * 0.2} />
              {i < 4 && <line x1={12 + i * 21 + 16} y1="40" x2={12 + (i + 1) * 21} y2="40" stroke={c2} strokeWidth="2" markerEnd="url(#ft-a2)" />}
            </g>
          ))}
        </g>
      );
    }
    case 'transformer': {
      // A vertical stack of blocks — the canonical transformer column.
      const n = 3 + Math.floor(rand() * 2);
      return (
        <g>
          {Array.from({ length: n }).map((_, i) => (
            <rect key={i} x="38" y={12 + i * (52 / n)} width="44" height={(52 / n) - 5} rx="3"
              fill={i % 2 ? c1 : c2} opacity={0.45 + (i / n) * 0.45} />
          ))}
          {Array.from({ length: n - 1 }).map((_, i) => (
            <line key={`a${i}`} x1="60" y1={12 + (i + 1) * (52 / n) - 4} x2="60" y2={12 + (i + 1) * (52 / n)} stroke={c2} strokeWidth="2" />
          ))}
        </g>
      );
    }
    case 'schedule': {
      // A warmup ramp then a cosine-style decay; phase boundary varies by seed.
      const peakX = 28 + rand() * 22;
      const pts = [];
      for (let x = 14; x <= 106; x += 4) {
        let y;
        if (x < peakX) y = 64 - ((x - 14) / (peakX - 14)) * 44;
        else y = 20 + (1 - Math.cos(((x - peakX) / (106 - peakX)) * Math.PI)) / 2 * 42;
        pts.push(`${x} ${y.toFixed(1)}`);
      }
      return (
        <g>
          <line x1="12" y1="66" x2="108" y2="66" className="ft-axis" />
          <path d={`M${pts.join(' L')}`} fill="none" stroke={c1} strokeWidth="2.5" />
          <line x1={peakX} y1="20" x2={peakX} y2="66" stroke={c2} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
        </g>
      );
    }
    case 'cluster': {
      // Three blobs around seed-placed centroids, marked with a ring.
      const centers = Array.from({ length: 3 }, () => [26 + rand() * 68, 18 + rand() * 44]);
      return (
        <g>
          {centers.map(([cx, cy], ci) => (
            <g key={ci}>
              {Array.from({ length: 6 }).map((_, i) => (
                <circle key={i} cx={cx + (rand() - 0.5) * 18} cy={cy + (rand() - 0.5) * 18} r="2.6"
                  fill={ci === 1 ? c2 : c1} opacity="0.7" />
              ))}
              <circle cx={cx} cy={cy} r="4" fill="none" stroke={ci === 1 ? c2 : c1} strokeWidth="2" />
            </g>
          ))}
        </g>
      );
    }
    case 'project': {
      // Dimensionality reduction: a 3D point cloud projected onto a 2D axis line.
      const axAng = (0.1 + rand() * 0.3) * Math.PI;
      const ax = [60 + Math.cos(axAng) * 44, 40 - Math.sin(axAng) * 26];
      const ax2 = [60 - Math.cos(axAng) * 44, 40 + Math.sin(axAng) * 26];
      return (
        <g>
          <line x1={ax[0]} y1={ax[1]} x2={ax2[0]} y2={ax2[1]} stroke={c2} strokeWidth="2" opacity="0.6" />
          {Array.from({ length: 12 }).map((_, i) => {
            const px = 22 + rand() * 76;
            const py = 16 + rand() * 48;
            // foot of perpendicular onto the axis direction
            const t = ((px - 60) * Math.cos(axAng) - (py - 40) * Math.sin(axAng));
            const fx = 60 + t * Math.cos(axAng);
            const fy = 40 - t * Math.sin(axAng);
            return (
              <g key={i}>
                <line x1={px} y1={py} x2={fx} y2={fy} stroke={c1} strokeWidth="0.8" opacity="0.3" />
                <circle cx={px} cy={py} r="2.6" fill={c1} opacity="0.8" />
                <circle cx={fx} cy={fy} r="2" fill={c2} />
              </g>
            );
          })}
        </g>
      );
    }
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

export default function ForgeThumb({ kind = 'auto', seed = '', topic = '', label, index = null, className = '' }) {
  const { motif, c1, c2, hi, tag } = useMemo(() => {
    // Decouple the colour pair: c1 from the seed, c2 from an independent salted
    // hash, and force them apart so no card shows a same-colour-on-same-colour
    // pattern. This alone removes most of the "they all look alike" effect.
    const base = seed || topic || kind || 'forge';
    const h1 = hash(base);
    const h2 = hash(`hue2:${base}`);
    const i1 = h1 % HUES.length;
    let i2 = h2 % HUES.length;
    if (i2 === i1) i2 = (i2 + 1 + (h2 % (HUES.length - 1))) % HUES.length;
    // When the parent passes a card `index`, assign the motif POSITIONALLY with a
    // stride coprime to the pool size — this guarantees every card on the page
    // draws a DIFFERENT motif (no hash-collision repeats), spread across the pool
    // so neighbours never share a shape. Colour stays seed-based, so each card is
    // still individually distinct. Without an index, fall back to seed scatter.
    const motifVal = (typeof index === 'number')
      ? MOTIFS[((index * MOTIF_STRIDE) % MOTIFS.length + MOTIFS.length) % MOTIFS.length]
      : pickMotif(kind, seed, topic);
    return {
      motif: motifVal,
      c1: HUES[i1],
      c2: HUES[i2],
      hi: i1,
      tag: pickLabel(label, kind, seed, topic),
    };
  }, [kind, seed, topic, label, index]);

  // A fresh PRNG per render keyed on the card's full identity. Deterministic:
  // the same card always draws the same jitter, different cards differ.
  const rand = useMemo(() => rng(`${motif}|${seed}|${topic}|${kind}`), [motif, seed, topic, kind]);

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
      <Motif name={motif} c1={c1} c2={c2} rand={rand} />
      <g className="ft-tag" aria-hidden="true">
        {(() => {
          const text = tag.toUpperCase();
          const estW = text.length * 5.6; // rough glyph width at the tag font size
          const MAX_W = 104; // keep within the 120-wide viewBox with side padding
          const fit = estW > MAX_W;
          const boxW = Math.min(112, 9 + (fit ? MAX_W : estW));
          return (
            <>
              <rect className="ft-tag-bg" x="4" y="66" width={boxW} height="11" rx="3" />
              <text
                className="ft-tag-text"
                x="8"
                y="74"
                {...(fit ? { textLength: MAX_W, lengthAdjust: 'spacingAndGlyphs' } : {})}
              >
                {text}
              </text>
            </>
          );
        })()}
      </g>
    </svg>
  );
}
