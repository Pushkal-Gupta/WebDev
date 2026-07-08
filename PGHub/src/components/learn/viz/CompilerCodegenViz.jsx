import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cpu, Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import './CompilerCodegenViz.css';

// Lower the AST for `2 + 3 * 4` to stack-machine bytecode, then execute it.
// Emit phase appends instructions (post-order: operands before the operator);
// run phase pushes/pops on a stack. Deterministic script, no randomness.
const PROGRAM = [
  { op: 'PUSH', arg: 2 }, { op: 'PUSH', arg: 3 }, { op: 'PUSH', arg: 4 },
  { op: 'MUL' }, { op: 'ADD' },
];

// Build the step script: first "emit" each instruction, then "run" each.
const STEPS = [{ phase: 'emit', idx: -1, stack: [], note: 'Post-order traversal of `2 + 3 * 4`. We emit operands before their operator, so the multiply (higher precedence) is bytecode-adjacent to 3 and 4.' }];
PROGRAM.forEach((ins, i) => {
  STEPS.push({ phase: 'emit', idx: i, stack: [], note: `Emit ${ins.op}${ins.arg !== undefined ? ' ' + ins.arg : ''}. Bytecode grows one instruction; nothing runs yet.` });
});
let st = [];
PROGRAM.forEach((ins, i) => {
  if (ins.op === 'PUSH') { st = [...st, ins.arg]; STEPS.push({ phase: 'run', idx: i, stack: st, note: `PUSH ${ins.arg}: push the literal onto the operand stack.` }); }
  else { const b = st[st.length - 1], a = st[st.length - 2]; const r = ins.op === 'MUL' ? a * b : a + b; st = [...st.slice(0, -2), r]; STEPS.push({ phase: 'run', idx: i, stack: st, note: `${ins.op}: pop ${a} and ${b}, ${ins.op === 'MUL' ? 'multiply' : 'add'} -> ${r}, push the result.` }); }
});
STEPS.push({ phase: 'done', idx: PROGRAM.length, stack: st, note: `The stack holds the final result: ${st[0]}. A bytecode VM runs this instruction stream directly — no tree walk at runtime.` });

const BASE_MS = 1000;

export default function CompilerCodegenViz() {
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
  const emittedCount = s.phase === 'emit' ? s.idx + 1 : PROGRAM.length;

  return (
    <div className="ccg">
      <div className="ccg-head">
        <span className="ccg-head-icon"><Cpu size={18} /></span>
        <div className="ccg-head-text">
          <h4 className="ccg-title">Code generation: AST → bytecode → run</h4>
          <p className="ccg-sub">Lower `2 + 3 * 4` to stack-machine instructions, then execute them.</p>
        </div>
        <button className="ccg-reset" onClick={reset}><RotateCcw size={13} /> Reset</button>
      </div>

      <div className="ccg-body">
        <div className="ccg-col">
          <div className="ccg-col-title">Bytecode</div>
          <div className="ccg-bytecode">
            {PROGRAM.map((ins, i) => {
              const shown = i < emittedCount;
              const running = s.phase === 'run' && s.idx === i;
              const done = s.phase === 'run' && s.idx > i || s.phase === 'done';
              return (
                <div key={i} className={`ccg-ins${shown ? ' is-shown' : ''}${running ? ' is-running' : ''}${done ? ' is-done' : ''}`}>
                  <span className="ccg-ins-i">{i}</span>
                  <span className="ccg-ins-op">{ins.op}</span>
                  {ins.arg !== undefined && <span className="ccg-ins-arg">{ins.arg}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="ccg-col">
          <div className="ccg-col-title">Operand stack</div>
          <div className="ccg-stack">
            {s.stack.length === 0 && <div className="ccg-stack-empty">(empty)</div>}
            {[...s.stack].reverse().map((v, i) => (
              <div key={s.stack.length - 1 - i} className={`ccg-cell${i === 0 ? ' is-top' : ''}`}>{v}</div>
            ))}
          </div>
          {s.phase === 'done' && <div className="ccg-result">result = {s.stack[0]}</div>}
        </div>
      </div>

      <div className="ccg-controls">
        <button className="ccg-btn" onClick={() => setPlaying((p) => !p)} disabled={last}>
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause' : 'Play'}
        </button>
        <button className="ccg-btn" onClick={advance} disabled={playing || last}><StepForward size={13} /> Step</button>
        <span className="ccg-speed">Speed
          <input className="ccg-speed-range" type="range" min="0.5" max="4" step="0.5" value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} aria-label="speed" />
          <span className="ccg-speed-value">{speed}x</span>
        </span>
        <span className="ccg-progress">{step + 1} / {STEPS.length}</span>
      </div>

      <div className="ccg-note">
        <span className="ccg-note-label">{s.phase === 'emit' ? 'Emit' : s.phase === 'run' ? 'Execute' : 'Done'}</span>
        <span className="ccg-note-body">{s.note}</span>
      </div>
    </div>
  );
}
