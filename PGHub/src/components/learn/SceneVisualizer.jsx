import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Repeat } from 'lucide-react';
import './SceneVisualizer.css';

// ─────────────────────────────────────────────────────────────────────────
// SceneVisualizer — a browser "mini-MANIM": a continuous, requestAnimationFrame
// interpolated SVG animation player. Unlike the frame-stepper (AlgoVisualizer),
// objects TWEEN smoothly between keyframes on a real timeline — pointers glide,
// cells pop and morph, values move, labels fade — with easing, so it reads like
// a 3Blue1Brown scene rather than discrete slides.
//
// Scene schema (JSON, DB-storable under viz_steps as { kind:'scene', scene }):
//   {
//     title?, viewBox?: [x,y,w,h] (default [0,0,900,420]), loop?: bool,
//     objects: [
//       { id, type: 'cell'|'label'|'pointer'|'line'|'arrow'|'node'|'bar'|'bracket',
//         base?: { ...static props }, tracks?: { prop: [{ t, v, ease? }] } }
//     ],
//     captions?: [{ t, text }],
//     beats?: [{ t, label? }]   // scrubber markers + prev/next targets
//   }
// t is in milliseconds. Numeric props interpolate; color props (fill/stroke)
// interpolate through resolved theme rgb; string props snap at the keyframe.
// ─────────────────────────────────────────────────────────────────────────

const EASINGS = {
  linear: (t) => t,
  smooth: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), // smootherstep-ish
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  back: (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  bounce: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

const NUMERIC_PROPS = new Set(['x', 'y', 'x2', 'y2', 'w', 'h', 'r', 'cx', 'cy', 'opacity', 'scale', 'rot', 'size', 'thickness', 'lift']);
const COLOR_PROPS = new Set(['fill', 'stroke', 'textFill']);

// Resolve theme tokens (e.g. 'accent', 'hue-mint', 'text-main') to concrete rgb
// so we can smoothly interpolate between them. Falls through for literal colors.
const TOKEN_VAR = {
  accent: '--accent', mint: '--hue-mint', sky: '--hue-sky', pink: '--hue-pink',
  violet: '--hue-violet', surface: '--surface', border: '--border', bg: '--bg',
  'text-main': '--text-main', 'text-dim': '--text-dim', easy: '--easy',
  medium: '--medium', hard: '--hard', warning: '--warning', 'hover-box': '--hover-box',
};
function resolveColor(token, palette) {
  if (token == null) return null;
  if (typeof token === 'string' && (token.startsWith('#') || token.startsWith('rgb'))) return token;
  if (palette && TOKEN_VAR[token] && palette[token]) return palette[token];
  return typeof token === 'string' ? token : null;
}
function parseRgb(str) {
  if (!str) return null;
  if (str.startsWith('#')) {
    let h = str.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = str.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts.length > 3 ? parts[3] : 1];
}
function lerp(a, b, t) { return a + (b - a) * t; }
// A color prop's value may be a theme token ('accent'), an already-resolved
// 'rgba(...)' (from interpolation), a '--var', or a literal. Normalize to
// something SVG accepts: tokens become var(--...).
function col(v) {
  if (v == null) return undefined;
  if (typeof v === 'string') {
    if (TOKEN_VAR[v]) return `var(${TOKEN_VAR[v]})`;
    if (v.startsWith('--')) return `var(${v})`;
  }
  return v;
}
function lerpColor(ca, cb, t) {
  const A = parseRgb(ca), B = parseRgb(cb);
  if (!A || !B) return t < 0.5 ? ca : cb;
  return `rgba(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))},${lerp(A[3], B[3], t).toFixed(3)})`;
}

// Value of one track at time `now`.
function trackValue(kfs, now, isColor, palette) {
  if (!kfs || !kfs.length) return undefined;
  if (now <= kfs[0].t) return isColor ? resolveColor(kfs[0].v, palette) : kfs[0].v;
  const last = kfs[kfs.length - 1];
  if (now >= last.t) return isColor ? resolveColor(last.v, palette) : last.v;
  let i = 0;
  while (i < kfs.length - 1 && kfs[i + 1].t <= now) i++;
  const a = kfs[i], b = kfs[i + 1];
  const span = b.t - a.t;
  const raw = span <= 0 ? 1 : (now - a.t) / span;
  const ease = EASINGS[b.ease || a.ease || 'smooth'] || EASINGS.smooth;
  const p = ease(Math.max(0, Math.min(1, raw)));
  if (isColor) return lerpColor(resolveColor(a.v, palette), resolveColor(b.v, palette), p);
  if (typeof a.v === 'number' && typeof b.v === 'number') return lerp(a.v, b.v, p);
  return p < 1 ? a.v : b.v; // non-numeric strings snap at segment end
}

function objStateAt(obj, now, palette) {
  const out = { ...(obj.base || {}) };
  const tracks = obj.tracks || {};
  for (const [prop, kfs] of Object.entries(tracks)) {
    const v = trackValue(kfs, now, COLOR_PROPS.has(prop), palette);
    if (v !== undefined) out[prop] = v;
  }
  return out;
}

function sceneDuration(scene) {
  let max = 0;
  for (const o of scene.objects || []) {
    for (const kfs of Object.values(o.tracks || {})) {
      for (const k of kfs) if (k.t > max) max = k.t;
    }
  }
  for (const c of scene.captions || []) if (c.t > max) max = c.t;
  for (const b of scene.beats || []) if (b.t > max) max = b.t;
  return Math.max(1000, max + 600);
}

// ── Object renderers ──────────────────────────────────────────────────────
function Mobject({ s, type }) {
  const opacity = s.opacity == null ? 1 : s.opacity;
  const scale = s.scale == null ? 1 : s.scale;
  const lift = s.lift || 0;
  if (type === 'cell') {
    const w = s.w ?? 60, h = s.h ?? 60, x = s.x ?? 0, y = (s.y ?? 0) - lift;
    const cx = x + w / 2, cy = y + h / 2;
    return (
      <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`} style={{ filter: s.glow ? 'drop-shadow(0 0 8px var(--accent))' : 'none' }}>
        <rect x={x} y={y} width={w} height={h} rx={s.rx ?? 8} fill={col(s.fill) || 'var(--surface)'} stroke={col(s.stroke) || 'var(--border)'} strokeWidth={s.thickness ?? 1.5} />
        {s.value != null && <text x={cx} y={cy} dy=".34em" textAnchor="middle" fontSize={s.size ?? 20} fontWeight="700" fill={col(s.textFill) || 'var(--text-main)'} fontFamily="var(--mono)">{s.value}</text>}
        {s.idx != null && <text x={cx} y={y + h + 14} textAnchor="middle" fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono)">{s.idx}</text>}
      </g>
    );
  }
  if (type === 'bar') {
    const w = s.w ?? 40, x = s.x ?? 0, baseY = s.baseY ?? 0, h = Math.max(0, s.h ?? 0);
    const y = baseY - h;
    return (
      <g opacity={opacity}>
        <rect x={x} y={y} width={w} height={h} rx={s.rx ?? 5} fill={col(s.fill) || 'var(--border)'} />
        {s.value != null && <text x={x + w / 2} y={y - 6} textAnchor="middle" fontSize={s.size ?? 13} fontWeight="600" fill={col(s.textFill) || 'var(--text-main)'} fontFamily="var(--mono)">{s.value}</text>}
        {s.idx != null && <text x={x + w / 2} y={baseY + 14} textAnchor="middle" fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono)">{s.idx}</text>}
      </g>
    );
  }
  if (type === 'label') {
    return (
      <text opacity={opacity} x={s.x ?? 0} y={s.y ?? 0} textAnchor={s.anchor || 'middle'} dy=".34em"
        fontSize={s.size ?? 15} fontWeight={s.weight || '600'} fill={col(s.fill) || 'var(--text-main)'}
        fontFamily={s.font || 'var(--mono)'} transform={scale !== 1 ? `translate(${s.x} ${s.y}) scale(${scale}) translate(${-s.x} ${-s.y})` : undefined}>
        {s.value ?? s.text ?? ''}
      </text>
    );
  }
  if (type === 'pointer') {
    const x = s.x ?? 0, y = s.y ?? 0;
    const tw = Math.max(22, String(s.value ?? '').length * 9 + 14);
    return (
      <g opacity={opacity}>
        <rect x={x - tw / 2} y={y} width={tw} height={22} rx={5} fill={col(s.fill) || 'var(--hover-box)'} stroke={col(s.stroke) || 'var(--accent)'} strokeWidth="1.5" />
        <text x={x} y={y + 11} dy=".34em" textAnchor="middle" fontSize="12.5" fontWeight="700" fill={col(s.textFill) || 'var(--accent)'} fontFamily="var(--mono)">{s.value}</text>
        <path d={`M ${x - 5} ${y + 22} L ${x + 5} ${y + 22} L ${x} ${y + 30} Z`} fill={col(s.stroke) || 'var(--accent)'} />
      </g>
    );
  }
  if (type === 'line') {
    return <line opacity={opacity} x1={s.x ?? 0} y1={s.y ?? 0} x2={s.x2 ?? 0} y2={s.y2 ?? 0} stroke={col(s.stroke) || 'var(--border)'} strokeWidth={s.thickness ?? 2} strokeDasharray={s.dash || undefined} strokeLinecap="round" />;
  }
  if (type === 'arrow') {
    const x1 = s.x ?? 0, y1 = s.y ?? 0, x2 = s.x2 ?? 0, y2 = s.y2 ?? 0;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const ah = 8;
    const p1x = x2 - ah * Math.cos(ang - 0.5), p1y = y2 - ah * Math.sin(ang - 0.5);
    const p2x = x2 - ah * Math.cos(ang + 0.5), p2y = y2 - ah * Math.sin(ang + 0.5);
    return (
      <g opacity={opacity} stroke={col(s.stroke) || 'var(--accent)'} fill={col(s.stroke) || 'var(--accent)'}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={s.thickness ?? 2} strokeLinecap="round" />
        <path d={`M ${x2} ${y2} L ${p1x} ${p1y} L ${p2x} ${p2y} Z`} />
      </g>
    );
  }
  if (type === 'node') {
    const cx = s.cx ?? 0, cy = s.cy ?? 0, r = s.r ?? 20;
    return (
      <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}>
        {s.glow && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6" />}
        <circle cx={cx} cy={cy} r={r} fill={col(s.fill) || 'var(--surface)'} stroke={col(s.stroke) || 'var(--border)'} strokeWidth={s.thickness ?? 1.5} />
        {s.value != null && <text x={cx} y={cy} dy=".34em" textAnchor="middle" fontSize={s.size ?? 15} fontWeight="700" fill={col(s.textFill) || 'var(--text-main)'} fontFamily="var(--mono)">{s.value}</text>}
      </g>
    );
  }
  if (type === 'bracket') {
    // A range brace under [x .. x2] at y.
    const x1 = s.x ?? 0, x2 = s.x2 ?? 0, y = s.y ?? 0;
    return (
      <g opacity={opacity} stroke={col(s.stroke) || 'var(--hue-sky)'} fill="none" strokeWidth={s.thickness ?? 2} strokeLinecap="round">
        <path d={`M ${x1} ${y} L ${x1} ${y + 6} L ${x2} ${y + 6} L ${x2} ${y}`} />
        {s.value != null && <text x={(x1 + x2) / 2} y={y + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill={col(s.stroke) || 'var(--hue-sky)'} fontFamily="var(--mono)" stroke="none">{s.value}</text>}
      </g>
    );
  }
  return null;
}

const SPEEDS = [0.5, 1, 1.5, 2];

export default function SceneVisualizer({ scene, title }) {
  const probeRef = useRef(null);
  const nowRef = useRef(0); // loop-owned playback time; `now` state mirrors it for render
  const [now, setNow] = useState(0);
  const setTime = (v) => { nowRef.current = v; setNow(v); };
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [palette, setPalette] = useState(null); // resolved theme token -> rgb, for smooth color interpolation

  const duration = useMemo(() => sceneDuration(scene), [scene]);
  const viewBox = scene.viewBox || [0, 0, 900, 420];
  const beats = scene.beats || [];

  // Resolve theme tokens to concrete rgb (read the ref inside an effect, never
  // during render) so colors can cross-fade. Re-resolve on theme switch.
  useEffect(() => {
    const el = probeRef.current;
    if (!el) return undefined;
    const read = () => {
      const cs = getComputedStyle(el);
      const p = {};
      for (const [tok, v] of Object.entries(TOKEN_VAR)) p[tok] = cs.getPropertyValue(v).trim();
      setPalette(p);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
    return () => obs.disconnect();
  }, []);

  // Continuous playback: the RAF loop owns time via nowRef and mirrors it into
  // state each frame. Stopping at the end happens inside the frame callback (an
  // async task), not synchronously in the effect body.
  useEffect(() => {
    if (!playing) return undefined;
    let raf; let last = null;
    const stepFrame = (ts) => {
      if (last == null) last = ts;
      const dt = (ts - last) * speed; last = ts;
      let t = nowRef.current + dt;
      if (t >= duration) {
        if (loop) { t = t % duration; }
        else { setTime(duration); setPlaying(false); return; }
      }
      setTime(t);
      raf = requestAnimationFrame(stepFrame);
    };
    raf = requestAnimationFrame(stepFrame);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, duration, loop]);

  const togglePlay = () => {
    if (nowRef.current >= duration - 1) setTime(0); // replay from start if at end
    setPlaying((p) => !p);
  };
  const restart = () => { setTime(0); setPlaying(true); };
  const stepBeat = (dir) => {
    setPlaying(false);
    const marks = [0, ...beats.map((b) => b.t), duration].sort((a, b) => a - b);
    if (dir > 0) { const nxt = marks.find((m) => m > nowRef.current + 1); setTime(nxt ?? duration); }
    else { const prev = [...marks].reverse().find((m) => m < nowRef.current - 1); setTime(prev ?? 0); }
  };

  const activeCaption = useMemo(() => {
    const caps = scene.captions || [];
    let cur = '';
    for (const c of caps) if (c.t <= now + 1) cur = c.text;
    return cur;
  }, [scene.captions, now]);

  const states = (scene.objects || []).map((o) => ({ o, s: objStateAt(o, now, palette) }));

  return (
    <div className="scene-viz" ref={probeRef}>
      {(title || scene.title) && <h4 className="scene-title">{title || scene.title}</h4>}
      <div className="scene-stage">
        <svg viewBox={viewBox.join(' ')} width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={title || scene.title || 'animation'} style={{ display: 'block', maxHeight: '46vh' }}>
          {states.map(({ o, s }) => <Mobject key={o.id} s={s} type={o.type} />)}
        </svg>
      </div>

      <div className="scene-caption" aria-live="polite">{activeCaption || 'Press play to watch the walkthrough.'}</div>

      <div className="scene-controls">
        <button onClick={() => stepBeat(-1)} title="Previous beat" aria-label="Previous beat"><SkipBack size={14} /></button>
        <button className="scene-play" onClick={togglePlay} title={playing ? 'Pause' : 'Play'} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button onClick={() => stepBeat(1)} title="Next beat" aria-label="Next beat"><SkipForward size={14} /></button>
        <button onClick={restart} title="Restart" aria-label="Restart"><RotateCcw size={13} /></button>
        <button className={loop ? 'scene-loop-on' : ''} onClick={() => setLoop((l) => !l)} title="Loop" aria-label="Toggle loop"><Repeat size={13} /></button>

        <div className="scene-track-wrap">
          <div className="scene-track">
            <input type="range" min={0} max={duration} step={1} value={Math.min(now, duration)}
              onChange={(e) => { setPlaying(false); setTime(Number(e.target.value)); }} aria-label="Timeline" />
            {beats.map((b, i) => (
              <button key={i} className="scene-beat-tick" style={{ left: `${(b.t / duration) * 100}%` }}
                title={b.label || `Beat ${i + 1}`} aria-label={b.label || `Beat ${i + 1}`}
                onClick={() => { setPlaying(false); setTime(b.t); }} />
            ))}
          </div>
          <span className="scene-time">{(now / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s</span>
        </div>

        <div className="scene-speeds" role="group" aria-label="Speed">
          {SPEEDS.map((x) => (
            <button key={x} className={`scene-speed ${speed === x ? 'active' : ''}`} onClick={() => setSpeed(x)}>{x}x</button>
          ))}
        </div>
      </div>
    </div>
  );
}
