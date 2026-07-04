import React, { useState, useEffect, useRef } from 'react';
import { Boxes, GitFork, Package, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import './PyClassViz.css';

const A = { id: 'a', of: 'Animal', name: '"Ada"', sound: '"Hmm"' };
const B = { id: 'b', of: 'Animal', name: '"Bo"', sound: '"Meow"' };
const DOG = { id: 'dog', of: 'Dog', name: '"Rex"', sound: '"Woof"' };

const STEPS = [
  {
    op: 'class Animal: ...',
    showSub: false,
    override: false,
    instances: [],
    focus: 'class',
    note: 'A class is a blueprint — it defines shared methods (speak, __repr__) and a class attribute, but it is not yet an object you can use.',
  },
  {
    op: 'a = Animal("Ada", "Hmm")',
    showSub: false,
    override: false,
    instances: [A],
    focus: 'a',
    note: 'Calling the class builds an instance. Object a gets its OWN attributes (name, sound) but borrows speak() from the class.',
  },
  {
    op: 'b = Animal("Bo", "Meow")',
    showSub: false,
    override: false,
    instances: [A, B],
    focus: 'b',
    note: 'A second instance from the same blueprint. Different attribute values, yet the exact same shared method — one definition, many objects.',
  },
  {
    op: 'class Dog(Animal): ...',
    showSub: true,
    override: false,
    instances: [A, B],
    focus: 'sub',
    note: 'Dog is-a Animal. It inherits every method and the class attribute for free, without copying any code.',
  },
  {
    op: 'def speak(self): ...  # override',
    showSub: true,
    override: true,
    instances: [A, B],
    focus: 'override',
    note: 'Dog overrides speak() — its own version runs for Dog instances, while super() still reuses the parent behaviour inside it.',
  },
  {
    op: 'dog = Dog("Rex")',
    showSub: true,
    override: true,
    instances: [A, B, DOG],
    focus: 'dog',
    note: 'A Dog instance: its own name/sound, the overridden speak(), and __repr__ inherited straight from Animal.',
  },
];

const W = 760;
const H = 380;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PyClassViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef(null);

  const total = STEPS.length;
  const cur = STEPS[Math.min(step, total - 1)];
  const finished = step >= total - 1;

  function togglePlay() {
    if (finished) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total - 1) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => {
        const next = Math.min(total - 1, s + 1);
        if (next >= total - 1) setPlaying(false);
        return next;
      });
    }, Math.round((reduced() ? 560 : 1250) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const instCount = cur.instances.length;
  const classCount = cur.showSub ? 2 : 1;

  // class box geometry
  const animalBox = { x: 36, y: 34, w: 212, h: 108 };
  const dogBox = { x: 36, y: 240, w: 212, h: 118 };
  const animalRight = animalBox.x + animalBox.w;
  const animalCY = animalBox.y + animalBox.h / 2;
  const dogRight = dogBox.x + dogBox.w;
  const dogCY = dogBox.y + dogBox.h / 2;

  const cardX = 332;
  const cardW = 212;
  const cardH = 70;
  const slots = {
    a: { y: 36, cy: 36 + cardH / 2 },
    b: { y: 118, cy: 118 + cardH / 2 },
    dog: { y: 258, h: 78, cy: 258 + 39 },
  };

  function instSlot(inst) {
    if (inst.id === 'dog') return { y: slots.dog.y, h: 78, cy: slots.dog.cy };
    return { y: slots[inst.id].y, h: cardH, cy: slots[inst.id].cy };
  }

  return (
    <div className="pycls">
      <div className="pycls-head">
        <div className="pycls-head-icon"><Boxes size={18} /></div>
        <div className="pycls-head-text">
          <h3 className="pycls-title">class &rarr; instances &rarr; subclass</h3>
          <p className="pycls-sub">
            One blueprint, many objects. Step through building instances, then a subclass that inherits and overrides.
          </p>
        </div>
      </div>

      <div className="pycls-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pycls-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pycls-arrow-head" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="pycls-arrow-fill" />
            </marker>
          </defs>

          <text x={20} y={22} className="pycls-stage-label">classes (blueprints)</text>
          <text x={cardX} y={22} className="pycls-stage-label">instances (objects)</text>

          {/* ANIMAL class box */}
          <g className={`pycls-clsbox is-animal${cur.focus === 'class' ? ' is-focus' : ''}`}>
            <rect x={animalBox.x} y={animalBox.y} width={animalBox.w} height={animalBox.h} rx={11} className="pycls-clsbox-rect" />
            <text x={animalBox.x + 14} y={animalBox.y + 24} className="pycls-cls-title">class Animal</text>
            <text x={animalBox.x + 14} y={animalBox.y + 46} className="pycls-cls-attr">kingdom = "Animalia"</text>
            <text x={animalBox.x + 14} y={animalBox.y + 68} className="pycls-cls-meth">speak(self)</text>
            <text x={animalBox.x + 14} y={animalBox.y + 88} className="pycls-cls-meth">__repr__(self)</text>
          </g>

          {/* inherits arrow Animal -> Dog */}
          {cur.showSub && (
            <g className="pycls-inherit">
              <line x1={animalBox.x + 60} y1={animalBox.y + animalBox.h} x2={animalBox.x + 60} y2={dogBox.y}
                className="pycls-inherit-line" markerEnd="url(#pycls-arrow-head)" />
              <text x={animalBox.x + 70} y={(animalBox.y + animalBox.h + dogBox.y) / 2 + 4} className="pycls-inherit-label">inherits</text>
            </g>
          )}

          {/* DOG subclass box */}
          {cur.showSub && (
            <g className={`pycls-clsbox is-dog${cur.focus === 'sub' || cur.focus === 'override' ? ' is-focus' : ''}`}>
              <rect x={dogBox.x} y={dogBox.y} width={dogBox.w} height={dogBox.h} rx={11} className="pycls-clsbox-rect" />
              <text x={dogBox.x + 14} y={dogBox.y + 24} className="pycls-cls-title">class Dog(Animal)</text>
              <text x={dogBox.x + 14} y={dogBox.y + 46} className="pycls-cls-attr">inherits kingdom, __repr__</text>
              <text x={dogBox.x + 14} y={dogBox.y + 70}
                className={`pycls-cls-meth${cur.override ? ' is-override' : ''}`}>
                speak(self){cur.override ? '  ← override' : ''}
              </text>
              <text x={dogBox.x + 14} y={dogBox.y + 92} className="pycls-cls-attr">super().speak() reused</text>
            </g>
          )}

          {/* INSTANCE cards + dashed instance-of connectors */}
          {cur.instances.map((inst) => {
            const slot = instSlot(inst);
            const isDog = inst.of === 'Dog';
            const fromX = isDog ? dogRight : animalRight;
            const fromY = isDog ? dogCY : animalCY;
            const focus = cur.focus === inst.id;
            return (
              <g key={inst.id} className={`pycls-inst is-${isDog ? 'dog' : 'animal'}${focus ? ' is-focus' : ''}`}>
                <line x1={fromX} y1={fromY} x2={cardX} y2={slot.cy} className="pycls-link" />
                <rect x={cardX} y={slot.y} width={cardW} height={slot.h} rx={10} className="pycls-inst-rect" />
                <text x={cardX + 14} y={slot.y + 22} className="pycls-inst-title">
                  {inst.id}
                  <tspan className="pycls-inst-of">  ({inst.of})</tspan>
                </text>
                <text x={cardX + 14} y={slot.y + 42} className="pycls-inst-attr">name = {inst.name}</text>
                <text x={cardX + 14} y={slot.y + 60} className="pycls-inst-attr">sound = {inst.sound}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pycls-controls">
        <button type="button" className="pycls-btn" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : (finished ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="pycls-btn"
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
          disabled={finished}
        >
          <SkipForward size={14} /> Step
        </button>
        <button
          type="button"
          className="pycls-btn"
          onClick={() => { setStep(0); setPlaying(false); }}
        >
          <RotateCcw size={14} /> Reset
        </button>
        <label className="pycls-speed">
          <span className="pycls-speed-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pycls-speed-range"
          />
          <span className="pycls-speed-value">{speed.toFixed(1)}×</span>
        </label>
        <span className="pycls-progress">{step + 1} / {total} steps</span>
      </div>

      <div className="pycls-readout">
        <div className="pycls-stat is-op">
          <Boxes size={13} />
          <span className="pycls-stat-label">operation</span>
          <span className="pycls-stat-val">{cur.op}</span>
        </div>
        <div className="pycls-stat is-inst">
          <Package size={13} />
          <span className="pycls-stat-label">live instances</span>
          <span className="pycls-stat-val">{instCount}</span>
        </div>
        <div className="pycls-stat is-cls">
          <GitFork size={13} />
          <span className="pycls-stat-label">classes</span>
          <span className="pycls-stat-val">{classCount}</span>
        </div>
      </div>

      <div className="pycls-note">
        <span className="pycls-note-label">now</span>
        <span className="pycls-note-body">{cur.note}</span>
      </div>
    </div>
  );
}
