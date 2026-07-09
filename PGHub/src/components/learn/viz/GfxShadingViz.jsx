import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Sun, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import './GfxShadingViz.css';

// Blinn-Phong shaded sphere, computed analytically on a regular lattice.
// No randomness: the visible hemisphere is sampled on a fixed grid of cells.
const VB = 360;                 // svg viewBox size (square)
const CX = 130;                 // sphere center x
const CY = 180;                 // sphere center y
const R = 118;                  // sphere radius (screen)
const STEP = 7;                 // lattice cell size in svg units
const CELL = STEP - 0.4;        // drawn cell size (tiny gap avoids seams)

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function norm3(x, y, z) {
  const n = Math.hypot(x, y, z) || 1;
  return [x / n, y / n, z / n];
}

// Light direction from an angle around the sphere (in the view plane) tilted
// slightly toward the camera so the highlight sits on the visible face.
function lightDir(angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  return norm3(Math.cos(a), -Math.sin(a), 0.75);
}

export default function GfxShadingViz() {
  const [angle, setAngle] = useState(35);     // light angle (degrees)
  const [ka, setKa] = useState(0.12);
  const [kd, setKd] = useState(0.72);
  const [ks, setKs] = useState(0.6);
  const [alpha, setAlpha] = useState(48);
  const stageRef = useRef(null);
  const draggingRef = useRef(false);

  const L = useMemo(() => lightDir(angle), [angle]);
  const V = useMemo(() => [0, 0, 1], []);       // eye looks down +z
  const H = useMemo(() => norm3(L[0] + V[0], L[1] + V[1], L[2] + V[2]), [L, V]);

  // Analytic lattice over the sphere's screen disk.
  const cells = useMemo(() => {
    const out = [];
    for (let sy = -R; sy <= R; sy += STEP) {
      for (let sx = -R; sx <= R; sx += STEP) {
        const r2 = sx * sx + sy * sy;
        if (r2 > R * R) continue;
        const z = Math.sqrt(R * R - r2);
        const nx = sx / R;
        const ny = sy / R;
        const nz = z / R;                       // normal = point / radius
        const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        const ndh = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]);
        const spec = ndl > 0 ? ks * Math.pow(ndh, alpha) : 0;
        const intensity = clamp(ka + kd * ndl + spec, 0, 1);
        const specShare = clamp(spec, 0, 1);
        out.push({
          x: CX + sx - CELL / 2,
          y: CY + sy - CELL / 2,
          t: intensity,
          s: specShare,
        });
      }
    }
    return out;
  }, [L, H, ka, kd, ks, alpha]);

  // Probe point: the surface point on the sphere closest to the light in the
  // view plane (deterministic) — a good spot to read N.L / N.H.
  const probe = useMemo(() => {
    const px = clamp(L[0], -0.92, 0.92) * R;
    const py = clamp(L[1], -0.92, 0.92) * R;
    const r2 = clamp(px * px + py * py, 0, R * R * 0.999);
    const pz = Math.sqrt(R * R - r2);
    const [nx, ny, nz] = [px / R, py / R, pz / R];
    const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const ndh = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]);
    const spec = ndl > 0 ? ks * Math.pow(ndh, alpha) : 0;
    const intensity = clamp(ka + kd * ndl + spec, 0, 1);
    return {
      x: CX + px,
      y: CY + py,
      ndl,
      ndh,
      diffuse: kd * ndl,
      spec,
      ambient: ka,
      intensity,
    };
  }, [L, H, ka, kd, ks, alpha]);

  // Light handle sits on a ring around the sphere at the current angle.
  const ring = R + 26;
  const handle = useMemo(() => {
    const a = (angle * Math.PI) / 180;
    return { x: CX + Math.cos(a) * ring, y: CY - Math.sin(a) * ring };
  }, [angle, ring]);

  const setAngleFromEvent = useCallback((clientX, clientY) => {
    const svg = stageRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * VB - CX;
    const sy = ((clientY - rect.top) / rect.height) * VB - CY;
    let deg = (Math.atan2(-sy, sx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    setAngle(Math.round(deg));
  }, []);

  const onPointerDown = useCallback((e) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setAngleFromEvent(e.clientX, e.clientY);
  }, [setAngleFromEvent]);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    setAngleFromEvent(e.clientX, e.clientY);
  }, [setAngleFromEvent]);

  const onPointerUp = useCallback((e) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  function reset() {
    setAngle(35);
    setKa(0.12);
    setKd(0.72);
    setKs(0.6);
    setAlpha(48);
  }

  return (
    <div className="gfxs">
      <div className="gfxs-head">
        <div className="gfxs-head-icon"><Sun size={18} /></div>
        <div className="gfxs-head-text">
          <h3 className="gfxs-title">Blinn-Phong shaded sphere</h3>
          <p className="gfxs-sub">
            Drag the light around the sphere and tune the material. Each cell is shaded per pixel:
            ambient + diffuse (N&middot;L) + specular (N&middot;H)<sup>&alpha;</sup>.
          </p>
        </div>
        <button type="button" className="gfxs-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gfxs-stage">
        <svg
          ref={stageRef}
          viewBox={`0 0 ${VB} ${VB}`}
          className="gfxs-svg"
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <clipPath id="gfxs-disk">
              <circle cx={CX} cy={CY} r={R} />
            </clipPath>
            <radialGradient id="gfxs-halo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" className="gfxs-halo-in" />
              <stop offset="100%" className="gfxs-halo-out" />
            </radialGradient>
          </defs>

          {/* orbit ring the light travels along */}
          <circle cx={CX} cy={CY} r={ring} className="gfxs-ring" />

          {/* shaded lattice, clipped to the sphere disk */}
          <g clipPath="url(#gfxs-disk)">
            {cells.map((c, i) => (
              <rect
                key={i}
                x={c.x}
                y={c.y}
                width={CELL}
                height={CELL}
                className="gfxs-cell"
                style={{
                  // base surface = accent/sky mixed into bg by intensity,
                  // then the specular share pushes toward the light tint.
                  fill: `color-mix(in srgb, var(--gfxs-spec) ${(c.s * 100).toFixed(1)}%, color-mix(in srgb, var(--gfxs-lit) ${(c.t * 100).toFixed(1)}%, var(--bg)))`,
                }}
              />
            ))}
          </g>
          <circle cx={CX} cy={CY} r={R} className="gfxs-outline" />

          {/* probe marker at the readout point */}
          <circle cx={probe.x} cy={probe.y} r={7} className="gfxs-probe-halo" />
          <circle cx={probe.x} cy={probe.y} r={3} className="gfxs-probe-dot" />

          {/* light: line from center, glowing draggable handle */}
          <line x1={CX} y1={CY} x2={handle.x} y2={handle.y} className="gfxs-light-ray" />
          <circle cx={handle.x} cy={handle.y} r={17} fill="url(#gfxs-halo)" className="gfxs-light-glow" />
          <circle cx={handle.x} cy={handle.y} r={11} className="gfxs-light-bg gfxs-light-handle" />
          <circle cx={handle.x} cy={handle.y} r={4} className="gfxs-light-core" />
        </svg>
      </div>

      <div className="gfxs-controls">
        <label className="gfxs-slider gfxs-s-light">
          <span className="gfxs-slabel"><Lightbulb size={13} /> light angle</span>
          <input type="range" min={0} max={359} step={1} value={angle}
            onChange={(e) => setAngle(Number(e.target.value))} className="gfxs-range" />
          <span className="gfxs-sval">{angle}&deg;</span>
        </label>
        <label className="gfxs-slider gfxs-s-amb">
          <span className="gfxs-slabel">ambient k<sub>a</sub></span>
          <input type="range" min={0} max={0.4} step={0.01} value={ka}
            onChange={(e) => setKa(Number(e.target.value))} className="gfxs-range" />
          <span className="gfxs-sval">{ka.toFixed(2)}</span>
        </label>
        <label className="gfxs-slider gfxs-s-diff">
          <span className="gfxs-slabel">diffuse k<sub>d</sub></span>
          <input type="range" min={0} max={1} step={0.01} value={kd}
            onChange={(e) => setKd(Number(e.target.value))} className="gfxs-range" />
          <span className="gfxs-sval">{kd.toFixed(2)}</span>
        </label>
        <label className="gfxs-slider gfxs-s-spec">
          <span className="gfxs-slabel">specular k<sub>s</sub></span>
          <input type="range" min={0} max={1} step={0.01} value={ks}
            onChange={(e) => setKs(Number(e.target.value))} className="gfxs-range" />
          <span className="gfxs-sval">{ks.toFixed(2)}</span>
        </label>
        <label className="gfxs-slider gfxs-s-shin">
          <span className="gfxs-slabel"><Sparkles size={13} /> shininess &alpha;</span>
          <input type="range" min={1} max={256} step={1} value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))} className="gfxs-range" />
          <span className="gfxs-sval">{alpha}</span>
        </label>
      </div>

      <div className="gfxs-readout">
        <div className="gfxs-stat gfxs-r-ndl">
          <span className="gfxs-stat-label">N&middot;L</span>
          <span className="gfxs-stat-val">{probe.ndl.toFixed(3)}</span>
        </div>
        <div className="gfxs-stat gfxs-r-ndh">
          <span className="gfxs-stat-label">N&middot;H</span>
          <span className="gfxs-stat-val">{probe.ndh.toFixed(3)}</span>
        </div>
        <div className="gfxs-stat gfxs-r-diff">
          <span className="gfxs-stat-label">diffuse</span>
          <span className="gfxs-stat-val">{probe.diffuse.toFixed(3)}</span>
        </div>
        <div className="gfxs-stat gfxs-r-spec">
          <span className="gfxs-stat-label">specular</span>
          <span className="gfxs-stat-val">{probe.spec.toFixed(3)}</span>
        </div>
        <div className="gfxs-stat gfxs-r-int">
          <span className="gfxs-stat-label">intensity</span>
          <span className="gfxs-stat-val">{probe.intensity.toFixed(3)}</span>
        </div>
      </div>

      <p className="gfxs-note">
        Probe reads the surface point facing the light. Push <em>shininess</em> up for a tight glossy dot,
        down for a broad matte sheen; drop <em>diffuse</em> and the terminator (N&middot;L &rarr; 0) hardens.
      </p>
    </div>
  );
}
