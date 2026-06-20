import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Target } from 'lucide-react';
import './MLViz.css';

function mulberry32(a) {
  return function () {
    let t = (a = (a + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 720;
const H = 360;
const SEED = 0xC0FFEE;
const N_CHUNKS = 20;

const EMBED_X = 18;
const EMBED_Y = 28;
const EMBED_W = 330;
const EMBED_H = 300;

const CTX_X = EMBED_X + EMBED_W + 24;
const CTX_Y = 28;
const CTX_W = W - CTX_X - 18;
const CTX_H = 300;

const CHUNK_TOPICS = [
  'transformers',
  'embeddings',
  'sql',
  'kubernetes',
  'cooking',
];

const HUE_FOR_TOPIC = {
  transformers: 'var(--hue-sky)',
  embeddings: 'var(--hue-mint)',
  sql: 'var(--hue-violet)',
  kubernetes: 'var(--hue-pink)',
  cooking: 'var(--text-dim)',
};

const QUERY_TOPIC = 'transformers';
const QUERY_X = 0.62;
const QUERY_Y = 0.42;

function makeChunks() {
  const rng = mulberry32(SEED);
  const centers = {
    transformers: [0.66, 0.40],
    embeddings: [0.50, 0.30],
    sql: [0.25, 0.72],
    kubernetes: [0.30, 0.30],
    cooking: [0.78, 0.78],
  };
  const out = [];
  for (let i = 0; i < N_CHUNKS; i++) {
    const topic = CHUNK_TOPICS[i % CHUNK_TOPICS.length];
    const [cx, cy] = centers[topic];
    const spread = 0.10;
    const x = Math.min(0.97, Math.max(0.03, cx + (rng() - 0.5) * spread * 2));
    const y = Math.min(0.97, Math.max(0.03, cy + (rng() - 0.5) * spread * 2));
    out.push({ id: i, topic, x, y, label: `c${i.toString().padStart(2, '0')}` });
  }
  return out;
}

const GROUND_TRUTH = new Set([0, 5, 10, 15]);

const STAGES = ['query', 'embed', 'knn', 'topk', 'context', 'llm'];
const STAGE_LABELS = {
  query: 'user query',
  embed: 'embed → vector',
  knn: 'kNN scan',
  topk: 'select top-k',
  context: 'assemble context',
  llm: 'feed to LLM',
};

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function sim(a, b) {
  return 1 - dist(a, b) / Math.SQRT2;
}

export default function RAGRetrievalPipelineViz() {
  const chunks = useMemo(() => makeChunks(), []);
  const [k, setK] = useState(3);
  const [threshold, setThreshold] = useState(0.5);
  const [stageIdx, setStageIdxRaw] = useState(STAGES.length - 1);
  const [isRunningRaw, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const isRunning = isRunningRaw && stageIdx < STAGES.length - 1;

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      setStageIdxRaw((s) => s + 1);
    }, 700);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning]);

  const scored = useMemo(() => {
    const query = { x: QUERY_X, y: QUERY_Y };
    return chunks
      .map((c) => ({ ...c, sim: sim(query, c) }))
      .sort((a, b) => b.sim - a.sim);
  }, [chunks]);

  const aboveThreshold = useMemo(() => scored.filter((c) => c.sim >= threshold), [scored, threshold]);
  const topK = useMemo(() => aboveThreshold.slice(0, k), [aboveThreshold, k]);
  const topKIds = useMemo(() => new Set(topK.map((c) => c.id)), [topK]);

  const recall = useMemo(() => {
    let hits = 0;
    for (const id of topKIds) if (GROUND_TRUTH.has(id)) hits++;
    return hits / GROUND_TRUTH.size;
  }, [topKIds]);

  const stage = STAGES[stageIdx];
  const showQuery = stageIdx >= 0;
  const showScan = stageIdx >= 2;
  const showTopK = stageIdx >= 3;
  const showContext = stageIdx >= 4;
  const showLLM = stageIdx >= 5;

  const toX = (u) => EMBED_X + 12 + u * (EMBED_W - 24);
  const toY = (v) => EMBED_Y + 12 + v * (EMBED_H - 24);

  const handlePlay = useCallback(() => {
    if (stageIdx >= STAGES.length - 1) {
      setStageIdxRaw(0);
      setIsRunning(true);
      return;
    }
    setIsRunning((r) => !r);
  }, [stageIdx]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setStageIdxRaw(STAGES.length - 1);
  }, []);

  const playLabel = stageIdx >= STAGES.length - 1 ? 'Replay' : isRunning ? 'Pause' : 'Play';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', maxWidth: '100%', height: 'auto', aspectRatio: `${W} / ${H}`, display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="rag-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" opacity="0.8" />
            </marker>
          </defs>

          {/* Embedding panel */}
          <rect
            x={EMBED_X}
            y={EMBED_Y}
            width={EMBED_W}
            height={EMBED_H}
            fill="var(--bg)"
            stroke="var(--border)"
            rx="10"
          />
          <text
            x={EMBED_X + 10}
            y={EMBED_Y - 8}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            EMBEDDING SPACE  (2D projection of d=384)
          </text>

          {/* axes hairlines */}
          <line
            x1={EMBED_X + 12}
            y1={EMBED_Y + EMBED_H - 12}
            x2={EMBED_X + EMBED_W - 12}
            y2={EMBED_Y + EMBED_H - 12}
            stroke="var(--border)"
            strokeWidth="0.6"
            opacity="0.6"
          />
          <line
            x1={EMBED_X + 12}
            y1={EMBED_Y + 12}
            x2={EMBED_X + 12}
            y2={EMBED_Y + EMBED_H - 12}
            stroke="var(--border)"
            strokeWidth="0.6"
            opacity="0.6"
          />

          {/* threshold circle around query */}
          {showScan && (
            <circle
              cx={toX(QUERY_X)}
              cy={toY(QUERY_Y)}
              r={(1 - threshold) * (EMBED_W - 24) * 0.7}
              fill="rgba(var(--accent-rgb), 0.06)"
              stroke="var(--accent)"
              strokeOpacity="0.45"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* lines from query to topK */}
          {showTopK &&
            topK.map((c) => (
              <line
                key={`l-${c.id}`}
                x1={toX(QUERY_X)}
                y1={toY(QUERY_Y)}
                x2={toX(c.x)}
                y2={toY(c.y)}
                stroke="var(--accent)"
                strokeWidth="1.2"
                strokeOpacity="0.7"
                strokeDasharray="2 3"
              />
            ))}

          {/* chunk dots */}
          {chunks.map((c) => {
            const isTopK = showTopK && topKIds.has(c.id);
            const isTruth = GROUND_TRUTH.has(c.id);
            const fill = HUE_FOR_TOPIC[c.topic];
            const r = isTopK ? 7 : 4;
            const opacity = isTopK ? 1 : 0.55;
            return (
              <g key={c.id}>
                <circle
                  cx={toX(c.x)}
                  cy={toY(c.y)}
                  r={r}
                  fill={fill}
                  opacity={opacity}
                  stroke={isTopK ? 'var(--accent)' : 'none'}
                  strokeWidth="1.5"
                  style={{ transition: 'r 0.25s ease, opacity 0.25s ease' }}
                />
                {isTruth && (
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r={r + 3}
                    fill="none"
                    stroke="var(--easy)"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.85"
                  />
                )}
                {isTopK && (
                  <text
                    x={toX(c.x) + 9}
                    y={toY(c.y) + 3}
                    fontSize="8"
                    fill="var(--text-main)"
                    fontFamily="var(--mono)"
                  >
                    {c.label} ({c.sim.toFixed(2)})
                  </text>
                )}
              </g>
            );
          })}

          {/* query star */}
          {showQuery && (
            <g>
              <polygon
                points={(() => {
                  const cx = toX(QUERY_X);
                  const cy = toY(QUERY_Y);
                  const r1 = 9;
                  const r2 = 4;
                  const pts = [];
                  for (let i = 0; i < 10; i++) {
                    const a = (Math.PI / 5) * i - Math.PI / 2;
                    const r = i % 2 === 0 ? r1 : r2;
                    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
                  }
                  return pts.join(' ');
                })()}
                fill="var(--accent)"
                stroke="var(--bg)"
                strokeWidth="1"
              />
              <text
                x={toX(QUERY_X) + 12}
                y={toY(QUERY_Y) - 8}
                fontSize="9"
                fill="var(--accent)"
                fontFamily="var(--mono)"
                fontWeight="700"
              >
                query
              </text>
            </g>
          )}

          {/* Context assembly panel */}
          <rect
            x={CTX_X}
            y={CTX_Y}
            width={CTX_W}
            height={CTX_H}
            fill={showContext ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--bg)'}
            stroke={showContext ? 'var(--accent)' : 'var(--border)'}
            strokeOpacity={showContext ? 0.7 : 1}
            rx="10"
            style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
          />
          <text
            x={CTX_X + 10}
            y={CTX_Y - 8}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            CONTEXT  (top-{k}, sim ≥ {threshold.toFixed(2)})
          </text>

          {/* assembled chunks list */}
          {showContext &&
            topK.map((c, i) => {
              const rowY = CTX_Y + 18 + i * 22;
              return (
                <g key={`ctx-${c.id}`}>
                  <rect
                    x={CTX_X + 8}
                    y={rowY}
                    width={CTX_W - 16}
                    height={18}
                    fill="var(--bg)"
                    stroke={HUE_FOR_TOPIC[c.topic]}
                    strokeOpacity="0.6"
                    rx="4"
                  />
                  <text x={CTX_X + 14} y={rowY + 12} fontSize="9" fontFamily="var(--mono)" fill="var(--text-main)">
                    {c.label}
                  </text>
                  <text
                    x={CTX_X + 56}
                    y={rowY + 12}
                    fontSize="8.5"
                    fontFamily="var(--serif)"
                    fontStyle="italic"
                    fill="var(--text-dim)"
                  >
                    {c.topic}
                  </text>
                  <text
                    x={CTX_X + CTX_W - 14}
                    y={rowY + 12}
                    fontSize="9"
                    fontFamily="var(--mono)"
                    fill={HUE_FOR_TOPIC[c.topic]}
                    textAnchor="end"
                  >
                    {c.sim.toFixed(3)}
                  </text>
                </g>
              );
            })}

          {/* LLM block */}
          {showLLM && (
            <g>
              <rect
                x={CTX_X + 8}
                y={CTX_Y + CTX_H - 56}
                width={CTX_W - 16}
                height={42}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="1.4"
                rx="8"
              />
              <text
                x={CTX_X + CTX_W / 2}
                y={CTX_Y + CTX_H - 36}
                fontSize="10"
                fontFamily="var(--mono)"
                fill="var(--accent)"
                textAnchor="middle"
                letterSpacing="0.14em"
                fontWeight="700"
              >
                LLM (context + query)
              </text>
              <text
                x={CTX_X + CTX_W / 2}
                y={CTX_Y + CTX_H - 22}
                fontSize="9"
                fontFamily="var(--mono)"
                fill="var(--text-dim)"
                textAnchor="middle"
              >
                generate grounded answer
              </text>
            </g>
          )}

          {/* stage strip */}
          <g>
            {STAGES.map((s, i) => {
              const sx = 18 + i * ((W - 36) / STAGES.length);
              const sw = (W - 36) / STAGES.length - 8;
              const active = i <= stageIdx;
              return (
                <g key={s}>
                  <rect
                    x={sx}
                    y={H - 22}
                    width={sw}
                    height={14}
                    fill={active ? 'rgba(var(--accent-rgb), 0.18)' : 'var(--bg)'}
                    stroke={active ? 'var(--accent)' : 'var(--border)'}
                    strokeOpacity={active ? 0.8 : 0.6}
                    rx="3"
                  />
                  <text
                    x={sx + sw / 2}
                    y={H - 12}
                    fontSize="8"
                    fill={active ? 'var(--accent)' : 'var(--text-dim)'}
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                    letterSpacing="0.06em"
                  >
                    {STAGE_LABELS[s]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Target size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              top-k
            </span>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={k}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{k}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">similarity threshold</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{threshold.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>recall@k</span>
            <span className="mlviz-val" style={{ color: 'var(--easy)' }}>{recall.toFixed(2)}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>retrieved</span>
            <span className="mlviz-val">{topK.length}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>above τ</span>
            <span className="mlviz-val">{aboveThreshold.length}</span>
          </span>
          <span>
            <span className="mlviz-slider-label" style={{ marginRight: 6 }}>relevant</span>
            <span className="mlviz-val" style={{ color: 'var(--easy)' }}>{GROUND_TRUTH.size}</span>
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`}
            onClick={handlePlay}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{playLabel}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setStageIdxRaw((s) => Math.min(STAGES.length - 1, s + 1))}
            disabled={isRunning || stageIdx >= STAGES.length - 1}
          >
            <Sparkles size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            stage {stageIdx + 1}/{STAGES.length} · {stage}
          </span>
        </div>

        <div className="mlviz-hint">
          dashed rings = ground-truth relevant chunks · accent ring = retrieved
        </div>
      </div>
    </div>
  );
}
