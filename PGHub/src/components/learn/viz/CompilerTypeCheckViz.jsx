import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Binary, Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import './CompilerTypeCheckViz.css';

// Walk a tiny AST for `let n: int = 3; let msg: string = "hi"; return n + msg;`
// filling a symbol table, then type-check `n + msg` and flag the int+string error.
// Deterministic: a fixed step script, no randomness.
const STEPS = [
  { note: 'Start: an empty symbol table. We walk the AST top-down, recording each declared name and its type.', table: [], focus: null, check: null },
  { note: 'Declaration `n: int = 3`. The initializer 3 is an int literal — it matches the annotation. Bind n -> int.', table: [['n', 'int', 'ok']], focus: 'n', check: null },
  { note: 'Declaration `msg: string = "hi"`. The initializer is a string literal — matches. Bind msg -> string.', table: [['n', 'int', 'ok'], ['msg', 'string', 'ok']], focus: 'msg', check: null },
  { note: 'Now type-check `return n + msg`. Look up the operands: n is int, msg is string.', table: [['n', 'int', 'ok'], ['msg', 'string', 'ok']], focus: null, check: { left: 'int', right: 'string', op: '+', result: null } },
  { note: 'The + operator needs both operands to be the same numeric type. int + string has no rule — TYPE ERROR, reported with the exact location.', table: [['n', 'int', 'ok'], ['msg', 'string', 'ok']], focus: null, check: { left: 'int', right: 'string', op: '+', result: 'error' } },
];

const BASE_MS = 1200;

// AST nodes laid out in the SVG (x,y in a 300x150 viewBox).
const AST = [
  { id: 'prog', x: 150, y: 16, label: 'program', kind: 'node' },
  { id: 'd1', x: 60, y: 52, label: 'let n:int', kind: 'decl', binds: 'n' },
  { id: 'd2', x: 150, y: 52, label: 'let msg:str', kind: 'decl', binds: 'msg' },
  { id: 'ret', x: 240, y: 52, label: 'return', kind: 'node' },
  { id: 'plus', x: 240, y: 90, label: '+', kind: 'op' },
  { id: 'ln', x: 212, y: 126, label: 'n', kind: 'leaf' },
  { id: 'rm', x: 268, y: 126, label: 'msg', kind: 'leaf' },
];
const EDGES = [['prog', 'd1'], ['prog', 'd2'], ['prog', 'ret'], ['ret', 'plus'], ['plus', 'ln'], ['plus', 'rm']];

export default function CompilerTypeCheckViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);
  const s = STEPS[step];
  const last = step >= STEPS.length - 1;

  const advance = useCallback(() => setStep((i) => Math.min(STEPS.length - 1, i + 1)), []);

  useEffect(() => {
    if (!playing) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last) { setPlaying(false); return undefined; }
    timer.current = setTimeout(advance, Math.round(BASE_MS / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, speed, last, advance]);

  const reset = () => { setPlaying(false); setStep(0); };
  const errored = s.check?.result === 'error';

  return (
    <div className="ctc">
      <div className="ctc-head">
        <span className="ctc-head-icon"><Binary size={18} /></span>
        <div className="ctc-head-text">
          <h4 className="ctc-title">Semantic analysis: type checking</h4>
          <p className="ctc-sub">Walk the AST, fill the symbol table, then check operand types.</p>
        </div>
        <button className="ctc-reset" onClick={reset}><RotateCcw size={13} /> Reset</button>
      </div>

      <div className="ctc-stage">
        <svg className="ctc-svg" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet" role="img" aria-label="AST type-check walk">
          {EDGES.map(([a, b]) => {
            const na = AST.find((n) => n.id === a); const nb = AST.find((n) => n.id === b);
            const active = errored && (b === 'plus' || b === 'ln' || b === 'rm');
            return <line key={a + b} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} className={`ctc-edge${active ? ' is-err' : ''}`} />;
          })}
          {AST.map((n) => {
            const bound = n.binds && s.table.some((r) => r[0] === n.binds);
            const focus = s.focus === n.binds && n.binds;
            const errNode = errored && (n.id === 'plus' || n.id === 'ln' || n.id === 'rm');
            const cls = `ctc-node is-${n.kind}${bound ? ' is-bound' : ''}${focus ? ' is-focus' : ''}${errNode ? ' is-err' : ''}`;
            return (
              <g key={n.id} className={cls}>
                <rect x={n.x - 26} y={n.y - 11} width="52" height="22" rx="6" className="ctc-node-box" />
                <text x={n.x} y={n.y + 4} className="ctc-node-text">{n.label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="ctc-panels">
        <div className="ctc-symtab">
          <div className="ctc-symtab-title">Symbol table</div>
          {s.table.length === 0 && <div className="ctc-symtab-empty">(empty)</div>}
          {s.table.map(([name, type]) => (
            <div key={name} className={`ctc-sym${s.focus === name ? ' is-focus' : ''}`}>
              <span className="ctc-sym-name">{name}</span>
              <span className="ctc-sym-arrow">→</span>
              <span className="ctc-sym-type">{type}</span>
            </div>
          ))}
        </div>
        {s.check && (
          <div className={`ctc-check${errored ? ' is-err' : ''}`}>
            <div className="ctc-check-title">Type rule check</div>
            <div className="ctc-check-expr">
              <span className="ctc-t">{s.check.left}</span>
              <span className="ctc-op">{s.check.op}</span>
              <span className="ctc-t">{s.check.right}</span>
            </div>
            <div className="ctc-check-verdict">
              {errored ? 'no rule for int + string → TypeError' : 'looking up operand types…'}
            </div>
          </div>
        )}
      </div>

      <div className="ctc-controls">
        <button className="ctc-btn" onClick={() => setPlaying((p) => !p)} disabled={last}>
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause' : 'Play'}
        </button>
        <button className="ctc-btn" onClick={advance} disabled={playing || last}><StepForward size={13} /> Step</button>
        <span className="ctc-speed">Speed
          <input className="ctc-speed-range" type="range" min="0.5" max="4" step="0.5" value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} aria-label="speed" />
          <span className="ctc-speed-value">{speed}x</span>
        </span>
        <span className="ctc-progress">{step + 1} / {STEPS.length}</span>
      </div>

      <div className={`ctc-note${errored ? ' is-err' : ''}`}>
        <span className="ctc-note-label">{errored ? 'Type error' : 'Step'}</span>
        <span className="ctc-note-body">{s.note}</span>
      </div>
    </div>
  );
}
