import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Network, HardDrive, Database, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './CloudNetVolumeViz.css';

// Two scenes, both fully deterministic (no randomness anywhere).
//  - 'lb'      : a Service load-balances requests round-robin across 3 pods.
//  - 'restart' : an ephemeral pod loses its local data on restart while a pod
//                backed by a PersistentVolume keeps its data.
const POD_COUNT = 3;
const POD_LABELS = ['pod A', 'pod B', 'pod C'];
const CELLS = 5; // data-cell columns drawn per storage box

// Load-balance scene: six requests, routed round-robin to POD_COUNT pods.
function buildLbSteps() {
  const out = [];
  for (let i = 0; i < 6; i += 1) {
    const routedTo = i % POD_COUNT;
    out.push({
      scene: 'lb',
      routedTo,
      count: i + 1,
      action: `Request ${i + 1} arrives; the Service picks ${POD_LABELS[routedTo]} (round-robin), never a fixed pod.`,
    });
  }
  return out;
}

// Restart scene: write a few records, restart, write again.
function buildRestartSteps() {
  return [
    { scene: 'restart', eph: 0, pers: 0, restarted: false, action: 'Both pods start empty. The left pod writes to its own filesystem; the right pod mounts a PersistentVolume.' },
    { scene: 'restart', eph: 1, pers: 1, restarted: false, action: 'One record written. It lands on the ephemeral writable layer AND on the persistent volume.' },
    { scene: 'restart', eph: 2, pers: 2, restarted: false, action: 'Second record written to both pods.' },
    { scene: 'restart', eph: 3, pers: 3, restarted: false, action: 'Third record written. Three records on each side so far.' },
    { scene: 'restart', eph: 0, pers: 3, restarted: true, action: 'Pod restarts. The ephemeral writable layer is wiped clean; the PersistentVolume re-attaches with its data intact.' },
    { scene: 'restart', eph: 1, pers: 4, restarted: false, action: 'A new write after restart: the ephemeral pod starts over from zero, the persistent pod keeps building on what survived.' },
  ];
}

// Geometry — one SVG, laid out per scene.
const W = 460;
const H = 300;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// A row of data cells, filled up to `count`, drawn left to right.
function DataCells({ x, y, count, tone }) {
  const cw = 15;
  const gap = 4;
  const items = [];
  for (let i = 0; i < CELLS; i += 1) {
    const filled = i < count;
    items.push(
      <rect
        key={i}
        x={x + i * (cw + gap)}
        y={y}
        width={cw}
        height={16}
        rx={3}
        className={`cnv-cell ${tone}${filled ? ' is-filled' : ''}`}
      />,
    );
  }
  return <g>{items}</g>;
}

export default function CloudNetVolumeViz() {
  const [scene, setScene] = useState('lb');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const steps = useMemo(() => (scene === 'lb' ? buildLbSteps() : buildRestartSteps()), [scene]);
  const total = steps.length - 1;
  const safeStep = Math.min(step, total);
  const cur = steps[safeStep];

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function switchScene(next) {
    if (next === scene) return;
    setScene(next);
    setStep(0);
    setPlaying(false);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed, scene]);

  // ---- scene geometry ----
  const svcX = W / 2;
  const svcY = 46;
  const podY = 150;
  const podW = 108;
  const podGap = 22;
  const podRowW = POD_COUNT * podW + (POD_COUNT - 1) * podGap;
  const podStartX = (W - podRowW) / 2;
  const podCx = (i) => podStartX + i * (podW + podGap) + podW / 2;

  return (
    <div className="cnv">
      <div className="cnv-head">
        <div className="cnv-head-icon"><Network size={18} /></div>
        <div className="cnv-head-text">
          <h3 className="cnv-title">Services, replicas and where data lives</h3>
          <p className="cnv-sub">
            One Service load-balances across pod replicas; a restart wipes a pod&rsquo;s local disk but a
            mounted PersistentVolume survives. Switch scenes to compare.
          </p>
        </div>
        <button type="button" className="cnv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="cnv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cnv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cnv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="cnv-arrow-head" />
            </marker>
            <filter id="cnv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {scene === 'lb' && (
            <g>
              {/* Ingress hint + Service box at the top */}
              <text x={svcX} y={16} className="cnv-caption" textAnchor="middle">external traffic &rarr; Ingress &rarr; Service</text>
              <g className="cnv-svc">
                <rect x={svcX - 92} y={svcY - 18} width={184} height={36} rx={9} className="cnv-svc-box" />
                <text x={svcX} y={svcY + 5} className="cnv-svc-label" textAnchor="middle">Service (virtual IP)</text>
              </g>

              {/* routing edges from Service down to each pod */}
              {POD_LABELS.map((label, i) => (
                <line
                  key={`edge-${label}`}
                  x1={svcX} y1={svcY + 20}
                  x2={podCx(i)} y2={podY - 6}
                  className={`cnv-edge${cur.routedTo === i ? ' is-live' : ''}`}
                  markerEnd="url(#cnv-arrow)"
                />
              ))}

              {/* pod replicas */}
              {POD_LABELS.map((label, i) => {
                const active = cur.routedTo === i;
                return (
                  <g key={label} className={`cnv-pod${active ? ' is-active' : ''}`}>
                    <rect x={podCx(i) - podW / 2} y={podY} width={podW} height={70} rx={10} className="cnv-pod-box" />
                    <text x={podCx(i)} y={podY + 26} className="cnv-pod-label" textAnchor="middle">{label}</text>
                    <text x={podCx(i)} y={podY + 44} className="cnv-pod-ip" textAnchor="middle">10.0.{i}.{i + 4}</text>
                    <text x={podCx(i)} y={podY + 60} className="cnv-pod-state" textAnchor="middle">
                      {active ? 'handling' : 'idle'}
                    </text>
                  </g>
                );
              })}

              {/* the request token sitting on the chosen pod */}
              <circle
                cx={podCx(cur.routedTo)} cy={podY - 6} r={8}
                className="cnv-token" filter="url(#cnv-glow)"
              />
            </g>
          )}

          {scene === 'restart' && (
            <g>
              {/* LEFT: ephemeral pod */}
              <text x={116} y={22} className="cnv-caption" textAnchor="middle">ephemeral (container disk)</text>
              <g className="cnv-pod is-eph">
                <rect x={30} y={40} width={172} height={150} rx={12} className="cnv-pod-box" />
                <text x={116} y={64} className="cnv-pod-label" textAnchor="middle">pod &mdash; writable layer</text>
                <rect x={48} y={82} width={136} height={90} rx={8} className={`cnv-store is-eph${cur.restarted ? ' is-wiped' : ''}`} />
                <text x={116} y={100} className="cnv-store-label" textAnchor="middle">local data</text>
                <DataCells x={54} y={118} count={cur.eph} tone="is-eph" />
                <text x={116} y={162} className="cnv-store-count" textAnchor="middle">
                  {cur.restarted ? 'WIPED on restart' : `${cur.eph} record${cur.eph === 1 ? '' : 's'}`}
                </text>
              </g>

              {/* RIGHT: persistent pod + external volume */}
              <text x={344} y={22} className="cnv-caption" textAnchor="middle">persistent (PVC + volume)</text>
              <g className="cnv-pod is-pers">
                <rect x={258} y={40} width={120} height={150} rx={12} className="cnv-pod-box" />
                <text x={318} y={64} className="cnv-pod-label" textAnchor="middle">pod</text>
                <text x={318} y={116} className="cnv-mount-label" textAnchor="middle">mount</text>
                <line x1={378} y1={112} x2={402} y2={112} className="cnv-mount-line" markerEnd="url(#cnv-arrow)" />
              </g>
              <g className="cnv-vol">
                <rect x={402} y={70} width={54} height={100} rx={8} className="cnv-store is-pers" />
                <text x={429} y={88} className="cnv-store-label" textAnchor="middle">volume</text>
                <g>
                  {Array.from({ length: CELLS }).map((_, i) => (
                    <rect
                      key={i}
                      x={412}
                      y={98 + i * 12}
                      width={34}
                      height={9}
                      rx={2}
                      className={`cnv-cell is-pers${i < cur.pers ? ' is-filled' : ''}`}
                    />
                  ))}
                </g>
              </g>
              <text x={429} y={186} className="cnv-store-count" textAnchor="middle">{cur.pers} kept</text>

              {cur.restarted && (
                <text x={W / 2} y={210} className="cnv-restart-flag" textAnchor="middle">
                  RESTART &mdash; ephemeral lost, volume survived
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="cnv-controls">
        <div className="cnv-scenes">
          <button
            type="button"
            className={`cnv-scene-btn${scene === 'lb' ? ' is-on' : ''}`}
            onClick={() => switchScene('lb')}
          >
            <Network size={13} /> Load-balance
          </button>
          <button
            type="button"
            className={`cnv-scene-btn${scene === 'restart' ? ' is-on' : ''}`}
            onClick={() => switchScene('restart')}
          >
            <HardDrive size={13} /> Restart
          </button>
        </div>
        <button type="button" className="cnv-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="cnv-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={safeStep >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="cnv-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="cnv-speed-range"
          />
          <span className="cnv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="cnv-progress">{safeStep} / {total}</span>
      </div>

      <div className="cnv-readout">
        {scene === 'lb' ? (
          <>
            <div className="cnv-stat is-routed">
              <span className="cnv-stat-label">routed to</span>
              <span className="cnv-stat-val">{POD_LABELS[cur.routedTo]}</span>
            </div>
            <div className="cnv-stat is-count">
              <span className="cnv-stat-label">requests</span>
              <span className="cnv-stat-val">{cur.count}</span>
            </div>
            <div className="cnv-stat is-mode">
              <span className="cnv-stat-label">policy</span>
              <span className="cnv-stat-val">round-robin</span>
            </div>
          </>
        ) : (
          <>
            <div className="cnv-stat is-eph">
              <span className="cnv-stat-label"><HardDrive size={12} /> ephemeral data</span>
              <span className="cnv-stat-val">{cur.eph}</span>
            </div>
            <div className="cnv-stat is-pers">
              <span className="cnv-stat-label"><Database size={12} /> persistent data</span>
              <span className="cnv-stat-val">{cur.pers}</span>
            </div>
            <div className="cnv-stat is-mode">
              <span className="cnv-stat-label">event</span>
              <span className="cnv-stat-val">{cur.restarted ? 'restart' : 'write'}</span>
            </div>
          </>
        )}
      </div>

      <div className="cnv-note">
        <span className="cnv-note-label">now</span>
        <span className="cnv-note-body">{cur.action}</span>
      </div>
    </div>
  );
}
