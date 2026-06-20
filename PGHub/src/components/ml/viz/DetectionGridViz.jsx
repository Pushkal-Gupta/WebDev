import React, { useMemo, useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import './MLViz.css';

const W = 620;
const H = 380;
const IMG = 300;
const IMG_X = 30;
const IMG_Y = 50;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iou(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const iw = Math.max(0, x2 - x1);
  const ih = Math.max(0, y2 - y1);
  const inter = iw * ih;
  const uni = a.w * a.h + b.w * b.h - inter;
  return uni <= 0 ? 0 : inter / uni;
}

// ground-truth box (in image-local pixels)
const GT = { x: 96, y: 78, w: 120, h: 130 };

// a cluster of predicted boxes around the GT plus one distractor; deterministic
function buildPreds(seed) {
  const rand = mulberry32(seed);
  const preds = [];
  for (let i = 0; i < 5; i++) {
    const jx = (rand() - 0.5) * 70;
    const jy = (rand() - 0.5) * 70;
    const jw = (rand() - 0.5) * 50;
    const jh = (rand() - 0.5) * 50;
    preds.push({
      id: i,
      x: GT.x + jx,
      y: GT.y + jy,
      w: Math.max(50, GT.w + jw),
      h: Math.max(50, GT.h + jh),
      score: snap(0.55 + rand() * 0.42, 2),
    });
  }
  // a distractor far from GT
  preds.push({ id: 5, x: 30, y: 200, w: 80, h: 70, score: snap(0.5 + rand() * 0.3, 2) });
  return preds;
}

export default function DetectionGridViz() {
  const [gridN, setGridN] = useState(4);
  const [showAnchors, setShowAnchors] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [iouThresh, setIouThresh] = useState(0.5);
  const [seed, setSeed] = useState(42);

  const allPreds = useMemo(() => buildPreds(seed), [seed]);

  // NMS as a stepped reveal: kept[] grows, suppressed[] grows
  const [step, setStep] = useState(0);

  const nmsTrace = useMemo(() => {
    const sorted = [...allPreds].sort((a, b) => b.score - a.score);
    const kept = [];
    const suppressed = [];
    const trace = [{ kept: [], suppressed: [], picked: null, compared: [] }];
    const pool = [...sorted];
    while (pool.length) {
      const best = pool.shift();
      kept.push(best);
      const compared = [];
      for (let i = pool.length - 1; i >= 0; i--) {
        const ov = iou(best, pool[i]);
        compared.push({ id: pool[i].id, ov: snap(ov, 2) });
        if (ov >= iouThresh) {
          suppressed.push({ ...pool[i], byId: best.id, ov: snap(ov, 2) });
          pool.splice(i, 1);
        }
      }
      trace.push({ kept: [...kept], suppressed: [...suppressed], picked: best.id, compared });
    }
    return trace;
  }, [allPreds, iouThresh]);

  const maxStep = nmsTrace.length - 1;
  const cur = nmsTrace[Math.min(step, maxStep)];
  const keptIds = new Set(cur.kept.map((b) => b.id));
  const supIds = new Set(cur.suppressed.map((b) => b.id));

  const cell = IMG / gridN;

  function localToScreen(b) {
    return { x: IMG_X + b.x, y: IMG_Y + b.y, w: b.w, h: b.h };
  }

  // best IoU among currently-kept boxes vs GT
  const bestIoU = allPreds.reduce((m, b) => Math.max(m, iou(b, GT)), 0);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: '840px' }}
        >
          <text x={IMG_X} y={IMG_Y - 16} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            DETECTION · {gridN}×{gridN} grid · anchors per cell · GT vs predictions · NMS @ IoU≥{snap(iouThresh, 2)}
          </text>

          {/* image canvas */}
          <rect x={IMG_X} y={IMG_Y} width={IMG} height={IMG} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" rx="3" />

          {/* grid */}
          {showGrid &&
            Array.from({ length: gridN - 1 }).map((_, i) => (
              <g key={`grid-${i}`}>
                <line x1={IMG_X + (i + 1) * cell} y1={IMG_Y} x2={IMG_X + (i + 1) * cell} y2={IMG_Y + IMG} stroke="var(--border)" strokeWidth="0.6" opacity="0.6" />
                <line x1={IMG_X} y1={IMG_Y + (i + 1) * cell} x2={IMG_X + IMG} y2={IMG_Y + (i + 1) * cell} stroke="var(--border)" strokeWidth="0.6" opacity="0.6" />
              </g>
            ))}

          {/* anchor boxes: 2 aspect ratios centred on each cell */}
          {showAnchors &&
            Array.from({ length: gridN * gridN }).map((_, idx) => {
              const r = Math.floor(idx / gridN);
              const c = idx % gridN;
              const cx = IMG_X + c * cell + cell / 2;
              const cy = IMG_Y + r * cell + cell / 2;
              const aw = cell * 0.7;
              const ah = cell * 0.45;
              return (
                <g key={`anc-${idx}`}>
                  <rect x={cx - aw / 2} y={cy - ah / 2} width={aw} height={ah} fill="none" stroke="var(--hue-sky)" strokeWidth="0.5" opacity="0.45" />
                  <rect x={cx - ah / 2} y={cy - aw / 2} width={ah} height={aw} fill="none" stroke="var(--hue-sky)" strokeWidth="0.5" opacity="0.45" />
                  <circle cx={cx} cy={cy} r="1.1" fill="var(--hue-sky)" opacity="0.6" />
                </g>
              );
            })}

          {/* ground truth */}
          {(() => {
            const g = localToScreen(GT);
            return (
              <g>
                <rect x={g.x} y={g.y} width={g.w} height={g.h} fill="var(--easy)" opacity="0.1" stroke="var(--easy)" strokeWidth="2" strokeDasharray="5 3" />
                <text x={g.x + 3} y={g.y - 4} fontSize="8" fill="var(--easy)" fontFamily="var(--mono)" fontWeight="700">
                  ground truth
                </text>
              </g>
            );
          })()}

          {/* predicted boxes */}
          {allPreds.map((b) => {
            const s = localToScreen(b);
            const isKept = keptIds.has(b.id);
            const isSup = supIds.has(b.id);
            const stroke = isKept ? 'var(--accent)' : isSup ? 'var(--hard)' : 'var(--text-dim)';
            const op = isSup ? 0.3 : isKept ? 1 : 0.65;
            return (
              <g key={`pred-${b.id}`} opacity={op}>
                <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="none" stroke={stroke} strokeWidth={isKept ? 2 : 1.2} strokeDasharray={isSup ? '3 3' : 'none'} />
                <rect x={s.x} y={s.y - 11} width={34} height={11} fill={stroke} opacity={isSup ? 0.4 : 0.85} rx="1.5" />
                <text x={s.x + 2} y={s.y - 2.5} fontSize="7" fill="var(--bg)" fontFamily="var(--mono)" fontWeight="700">
                  {snap(b.score, 2)}
                </text>
              </g>
            );
          })}

          {/* legend */}
          <g transform={`translate(${IMG_X + IMG + 18},${IMG_Y})`}>
            <text x="0" y="0" fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
              NMS step {Math.min(step, maxStep)}/{maxStep}
            </text>
            <g transform="translate(0,18)">
              <rect x="0" y="-7" width="14" height="10" fill="none" stroke="var(--accent)" strokeWidth="2" />
              <text x="20" y="2" fontSize="8" fill="var(--text-main)" fontFamily="var(--mono)">kept ({cur.kept.length})</text>
            </g>
            <g transform="translate(0,36)">
              <rect x="0" y="-7" width="14" height="10" fill="none" stroke="var(--hard)" strokeWidth="1.2" strokeDasharray="3 3" />
              <text x="20" y="2" fontSize="8" fill="var(--text-main)" fontFamily="var(--mono)">suppressed ({cur.suppressed.length})</text>
            </g>
            <g transform="translate(0,54)">
              <rect x="0" y="-7" width="14" height="10" fill="none" stroke="var(--easy)" strokeWidth="2" strokeDasharray="5 3" />
              <text x="20" y="2" fontSize="8" fill="var(--text-main)" fontFamily="var(--mono)">ground truth</text>
            </g>

            {cur.picked !== null && (
              <g transform="translate(0,84)">
                <text x="0" y="0" fontSize="8" fill="var(--accent)" fontFamily="var(--mono)">
                  picked #{cur.picked} (top score)
                </text>
                {cur.compared.slice(0, 5).map((cmp, i) => (
                  <text key={`cmp-${i}`} x="0" y={14 + i * 12} fontSize="7.5" fill={cmp.ov >= iouThresh ? 'var(--hard)' : 'var(--text-dim)'} fontFamily="var(--mono)">
                    IoU(#{cur.picked},#{cmp.id}) = {snap(cmp.ov, 2)} {cmp.ov >= iouThresh ? '→ drop' : '→ keep'}
                  </text>
                ))}
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">grid N</span>
          <input type="range" min="2" max="7" step="1" value={gridN} onChange={(e) => setGridN(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{gridN}×{gridN}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">IoU thresh</span>
          <input type="range" min="0.1" max="0.9" step="0.05" value={iouThresh} onChange={(e) => { setIouThresh(parseFloat(e.target.value)); setStep(0); }} />
          <span className="mlviz-slider-val">{snap(iouThresh, 2)}</span>
        </label>

        <div className="mlviz-toggles">
          <button type="button" className={`mlviz-toggle ${showAnchors ? 'is-on' : ''}`} onClick={() => setShowAnchors((v) => !v)}>
            <span className="mlviz-toggle-dot" />
            anchor boxes
          </button>
          <button type="button" className={`mlviz-toggle ${showGrid ? 'is-on' : ''}`} onClick={() => setShowGrid((v) => !v)}>
            <span className="mlviz-toggle-dot" />
            cell grid
          </button>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">best IoU</span>
            <span className="mlviz-val">{snap(bestIoU, 2)} vs ground truth</span>
            <span className="mlviz-sub">localization quality of the closest prediction</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">boxes</span>
            <span className="mlviz-val">{allPreds.length} → {cur.kept.length} after {Math.min(step, maxStep)} NMS step(s)</span>
            <span className="mlviz-sub">NMS keeps highest score, drops overlaps above the IoU threshold</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setStep((s) => Math.min(maxStep, s + 1))} disabled={step >= maxStep}>
            <StepForward size={13} />
            <span>NMS step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setStep(0); setSeed((s) => (s * 1103515245 + 12345) % 2147483647); }}>
            <span>New boxes</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setStep(0); setGridN(4); setIouThresh(0.5); setShowAnchors(true); setShowGrid(true); setSeed(42); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          step NMS: pick the top-score box, drop any box overlapping it past the IoU threshold, repeat on the rest
        </div>
      </div>
    </div>
  );
}
