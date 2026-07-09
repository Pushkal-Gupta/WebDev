import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Camera, Sun, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './GfxRaytraceViz.css';

// Deterministic 2D side-view ray tracer. Real analytic ray-sphere / ray-line math.
// No randomness anywhere. All coordinates live in the SVG viewBox below.
const W = 640;
const H = 440;
const EPS = 0.001;

const EYE = { x: 58, y: 226 };
const PLANE_X = 150;
const PLANE_TOP = 92;
const PLANE_BOT = 360;
const NUM_PIXELS = 11;
const SPHERE = { x: 412, y: 250, r: 74 };
const FLOOR_Y = 384;
const FLOOR_X0 = 150;
const FLOOR_X1 = 624;
const LIGHT = { x: 520, y: 60 };

const STAGES = ['primary', 'shadow', 'reflection'];
const STAGE_LABEL = { primary: 'Primary ray', shadow: 'Shadow ray', reflection: 'Reflection ray' };

const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a, s) => ({ x: a.x * s, y: a.y * s });
const dot = (a, b) => a.x * b.x + a.y * b.y;
const len = (a) => Math.sqrt(dot(a, a));
const norm = (a) => { const m = len(a) || 1; return { x: a.x / m, y: a.y / m }; };

function intersectSphere(O, D, C, r) {
  const L = sub(O, C);
  const a = dot(D, D);
  const b = 2 * dot(L, D);
  const c = dot(L, L) - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t1 = (-b - s) / (2 * a);
  const t2 = (-b + s) / (2 * a);
  if (t1 > EPS) return t1;
  if (t2 > EPS) return t2;
  return null;
}

function intersectFloor(O, D) {
  if (Math.abs(D.y) < 1e-9) return null;
  const t = (FLOOR_Y - O.y) / D.y;
  if (t <= EPS) return null;
  const x = O.x + t * D.x;
  if (x < FLOOR_X0 || x > FLOOR_X1) return null;
  return t;
}

// Nearest hit of a ray with the scene. normal points "outward" (up for floor).
function castRay(O, D) {
  const ts = intersectSphere(O, D, SPHERE, SPHERE.r);
  const tf = intersectFloor(O, D);
  let obj = null;
  let t = Infinity;
  if (ts !== null && ts < t) { t = ts; obj = 'sphere'; }
  if (tf !== null && tf < t) { t = tf; obj = 'floor'; }
  if (!obj) return null;
  const point = add(O, scale(D, t));
  const normal = obj === 'sphere' ? norm(sub(point, SPHERE)) : { x: 0, y: -1 };
  return { t, point, obj, normal };
}

function pixelPoint(i) {
  const f = NUM_PIXELS === 1 ? 0.5 : i / (NUM_PIXELS - 1);
  return { x: PLANE_X, y: PLANE_TOP + f * (PLANE_BOT - PLANE_TOP) };
}

function reflectDir(D, N) {
  return norm(sub(D, scale(N, 2 * dot(D, N))));
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function computeScene(pixel) {
  const px = pixelPoint(pixel);
  const primaryDir = norm(sub(px, EYE));
  const primary = castRay(EYE, primaryDir);

  if (!primary) {
    const far = add(EYE, scale(primaryDir, 900));
    return {
      px, primaryDir, primaryDir2: primaryDir,
      primaryEnd: far, hitObj: 'miss', hit: null, normal: null,
      shadow: null, reflection: null,
    };
  }

  const P = primary.point;
  const N = primary.normal;
  const origin = add(P, scale(N, EPS * 400)); // epsilon offset along normal
  const toLightRaw = sub(LIGHT, P);
  const distToLight = len(toLightRaw);
  const toLight = norm(toLightRaw);

  // Shadow: facing away from light, or an object blocks the segment to the light.
  const facingAway = dot(N, toLight) <= 0;
  const block = castRay(origin, toLight);
  const blocked = block !== null && block.t < distToLight;
  const shadowed = facingAway || blocked;
  const shadowEnd = blocked ? block.point : LIGHT;

  // Reflection: mirror direction, cast again for the next hit.
  const refDir = reflectDir(primaryDir, N);
  const refHit = castRay(origin, refDir);
  const reflection = refHit
    ? { dir: refDir, end: refHit.point, target: refHit.obj }
    : { dir: refDir, end: add(origin, scale(refDir, 640)), target: 'sky' };

  return {
    px, primaryDir, primaryEnd: P, hitObj: primary.obj, hit: P, normal: N,
    shadow: { end: shadowEnd, shadowed, blocked, facingAway, distToLight },
    reflection,
  };
}

export default function GfxRaytraceViz() {
  const [pixel, setPixel] = useState(5);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const scene = useMemo(() => computeScene(pixel), [pixel]);
  const total = STAGES.length - 1;
  const stageKey = STAGES[Math.min(step, total)];

  function selectPixel(i) {
    setPixel(i);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 480 : 1100) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const showPrimary = true;
  const showShadow = step >= 1 && scene.hit;
  const showReflection = step >= 2 && scene.hit;

  const hitLabel = scene.hitObj === 'miss' ? 'nothing (escapes)'
    : scene.hitObj === 'sphere' ? 'sphere' : 'floor';
  const inShadow = scene.shadow ? scene.shadow.shadowed : false;
  const shadowReason = !scene.shadow ? '—'
    : scene.shadow.blocked ? 'sphere blocks the light'
      : scene.shadow.facingAway ? 'surface faces away'
        : 'reaches the light';
  const reflTarget = !scene.reflection ? '—'
    : scene.reflection.target === 'sky' ? 'sky / background'
      : scene.reflection.target;

  const stageText = {
    primary: scene.hit
      ? `Primary ray leaves the eye, passes through pixel ${pixel}, and hits the ${hitLabel} at the nearest positive t.`
      : `Primary ray through pixel ${pixel} misses every object and escapes to the background color.`,
    shadow: scene.hit
      ? (inShadow
        ? `Shadow ray toward the light is occluded (${shadowReason}) — the hit point gets no direct light.`
        : 'Shadow ray reaches the light unobstructed — the hit point receives full direct light.')
      : 'No hit, so there is nothing to shade.',
    reflection: scene.hit
      ? `Reflection ray leaves along R = D - 2(D·N)N and samples the ${reflTarget}, mixed into the pixel color.`
      : 'No hit, so no reflection ray is spawned.',
  };

  return (
    <div className="gfxrt">
      <div className="gfxrt-head">
        <div className="gfxrt-head-icon"><Camera size={18} /></div>
        <div className="gfxrt-head-text">
          <h3 className="gfxrt-title">Shooting rays into a scene</h3>
          <p className="gfxrt-sub">
            Pick a pixel, then step the ray: a primary ray finds the nearest hit, a shadow ray
            tests the light, and a reflection ray bounces off along the mirror direction.
          </p>
        </div>
        <button type="button" className="gfxrt-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gfxrt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gfxrt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gfxrt-arrow-primary" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="gfxrt-head-primary" />
            </marker>
            <marker id="gfxrt-arrow-lit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="gfxrt-head-lit" />
            </marker>
            <marker id="gfxrt-arrow-dark" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="gfxrt-head-dark" />
            </marker>
            <marker id="gfxrt-arrow-refl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="gfxrt-head-refl" />
            </marker>
          </defs>

          {/* floor */}
          <line x1={FLOOR_X0} y1={FLOOR_Y} x2={FLOOR_X1} y2={FLOOR_Y} className="gfxrt-floor" />
          <text x={FLOOR_X1 - 4} y={FLOOR_Y + 16} className="gfxrt-floor-label" textAnchor="end">floor plane</text>

          {/* sphere */}
          <circle cx={SPHERE.x} cy={SPHERE.y} r={SPHERE.r} className="gfxrt-sphere" />
          <text x={SPHERE.x} y={SPHERE.y - SPHERE.r - 6} className="gfxrt-obj-label" textAnchor="middle">mirror sphere</text>

          {/* light */}
          <g className="gfxrt-light">
            {Array.from({ length: 8 }).map((_, k) => {
              const ang = (k / 8) * Math.PI * 2;
              return (
                <line
                  key={k}
                  x1={LIGHT.x + Math.cos(ang) * 12} y1={LIGHT.y + Math.sin(ang) * 12}
                  x2={LIGHT.x + Math.cos(ang) * 19} y2={LIGHT.y + Math.sin(ang) * 19}
                  className="gfxrt-light-ray"
                />
              );
            })}
            <circle cx={LIGHT.x} cy={LIGHT.y} r={9} className="gfxrt-light-core" />
          </g>
          <text x={LIGHT.x} y={LIGHT.y - 26} className="gfxrt-obj-label" textAnchor="middle">light</text>

          {/* image plane with pixel ticks */}
          <line x1={PLANE_X} y1={PLANE_TOP - 6} x2={PLANE_X} y2={PLANE_BOT + 6} className="gfxrt-plane" />
          {Array.from({ length: NUM_PIXELS }).map((_, i) => {
            const p = pixelPoint(i);
            const on = i === pixel;
            return (
              <rect
                key={i}
                x={PLANE_X - 5} y={p.y - 9} width={10} height={18} rx={2}
                className={`gfxrt-pixel${on ? ' is-on' : ''}`}
              />
            );
          })}
          <text x={PLANE_X} y={PLANE_TOP - 12} className="gfxrt-obj-label" textAnchor="middle">image plane</text>

          {/* camera / eye */}
          <g className="gfxrt-cam">
            <rect x={EYE.x - 20} y={EYE.y - 15} width={26} height={30} rx={4} className="gfxrt-cam-body" />
            <path d={`M ${EYE.x + 6} ${EYE.y - 10} L ${EYE.x + 22} ${EYE.y - 18} L ${EYE.x + 22} ${EYE.y + 18} L ${EYE.x + 6} ${EYE.y + 10} Z`} className="gfxrt-cam-lens" />
          </g>
          <text x={EYE.x - 6} y={EYE.y + 30} className="gfxrt-obj-label" textAnchor="middle">eye</text>

          {/* primary ray */}
          {showPrimary && (
            <line
              x1={EYE.x} y1={EYE.y} x2={scene.primaryEnd.x} y2={scene.primaryEnd.y}
              className="gfxrt-ray gfxrt-ray-primary" markerEnd="url(#gfxrt-arrow-primary)"
            />
          )}

          {/* hit point + normal */}
          {scene.hit && (
            <>
              <circle cx={scene.hit.x} cy={scene.hit.y} r={5} className="gfxrt-hit" />
              {step >= 1 && (
                <line
                  x1={scene.hit.x} y1={scene.hit.y}
                  x2={scene.hit.x + scene.normal.x * 30} y2={scene.hit.y + scene.normal.y * 30}
                  className="gfxrt-normal"
                />
              )}
            </>
          )}

          {/* shadow ray */}
          {showShadow && (
            <line
              x1={scene.hit.x} y1={scene.hit.y} x2={scene.shadow.end.x} y2={scene.shadow.end.y}
              className={`gfxrt-ray ${scene.shadow.shadowed ? 'gfxrt-ray-dark' : 'gfxrt-ray-lit'}`}
              markerEnd={scene.shadow.shadowed ? 'url(#gfxrt-arrow-dark)' : 'url(#gfxrt-arrow-lit)'}
            />
          )}

          {/* reflection ray */}
          {showReflection && (
            <line
              x1={scene.hit.x} y1={scene.hit.y} x2={scene.reflection.end.x} y2={scene.reflection.end.y}
              className="gfxrt-ray gfxrt-ray-refl" markerEnd="url(#gfxrt-arrow-refl)"
            />
          )}
        </svg>
      </div>

      <div className="gfxrt-pixsel">
        <span className="gfxrt-pixsel-label">pixel</span>
        <input
          type="range" min={0} max={NUM_PIXELS - 1} step={1} value={pixel}
          onChange={(e) => selectPixel(Number(e.target.value))} className="gfxrt-pixsel-range"
        />
        <span className="gfxrt-pixsel-val">{pixel} / {NUM_PIXELS - 1}</span>
      </div>

      <div className="gfxrt-controls">
        <button type="button" className="gfxrt-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="gfxrt-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="gfxrt-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="gfxrt-speed-range"
          />
          <span className="gfxrt-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="gfxrt-progress">stage {Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="gfxrt-readout">
        <div className="gfxrt-stat is-stage">
          <span className="gfxrt-stat-label">stage</span>
          <span className="gfxrt-stat-val">{STAGE_LABEL[stageKey]}</span>
        </div>
        <div className="gfxrt-stat is-hit">
          <span className="gfxrt-stat-label">primary hits</span>
          <span className="gfxrt-stat-val">{hitLabel}</span>
        </div>
        <div className={`gfxrt-stat ${inShadow ? 'is-dark' : 'is-lit'}`}>
          <span className="gfxrt-stat-label">in shadow</span>
          <span className="gfxrt-stat-val">{!scene.hit ? '—' : inShadow ? 'yes' : 'no'}</span>
        </div>
        <div className="gfxrt-stat is-refl">
          <span className="gfxrt-stat-label">reflects to</span>
          <span className="gfxrt-stat-val">{scene.hit ? reflTarget : '—'}</span>
        </div>
      </div>

      <div className="gfxrt-note">
        <span className="gfxrt-note-label">now</span>
        <span className="gfxrt-note-body">
          <Sun size={13} className="gfxrt-note-ic" /> {stageText[stageKey]}
        </span>
      </div>
    </div>
  );
}
