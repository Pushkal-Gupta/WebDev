import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 540;
const H = 320;

const POS = {
  a: { x: 70, y: 80 },
  b: { x: 70, y: 220 },
  s: { x: 240, y: 150 },
  c: { x: 240, y: 260 },
  y: { x: 430, y: 200 },
};

const NODE_R = 22;

function Node({ pos, label, value, color, sub, dim }) {
  return (
    <g opacity={dim ? 0.35 : 1}>
      <circle
        cx={pos.x}
        cy={pos.y}
        r={NODE_R}
        fill="var(--bg)"
        stroke={color}
        strokeWidth="2.4"
      />
      <text
        x={pos.x}
        y={pos.y - 1}
        fontSize="13"
        fontFamily="var(--serif)"
        fontStyle="italic"
        fontWeight="800"
        fill={color}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
      <text
        x={pos.x}
        y={pos.y + 11}
        fontSize="9.5"
        fontFamily="var(--mono)"
        fill="var(--text-dim)"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {sub}
      </text>
      <text
        x={pos.x}
        y={pos.y + NODE_R + 14}
        fontSize="11.5"
        fontFamily="var(--mono)"
        fontWeight="700"
        fill={color}
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
}

function OpNode({ pos, symbol, color }) {
  return (
    <g>
      <rect x={pos.x - 18} y={pos.y - 16} width="36" height="32" rx="6" fill="var(--surface)" stroke={color} strokeWidth="1.8" />
      <text
        x={pos.x}
        y={pos.y + 1}
        fontSize="18"
        fontFamily="var(--mono)"
        fontWeight="800"
        fill={color}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {symbol}
      </text>
    </g>
  );
}

function lineEdge(p1, p2, padStart = NODE_R, padEnd = NODE_R) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  return {
    x1: p1.x + ux * padStart,
    y1: p1.y + uy * padStart,
    x2: p2.x - ux * padEnd,
    y2: p2.y - uy * padEnd,
  };
}

export default function ForwardBackwardGraphViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(3);
  const [c, setC] = useState(4);
  const [mode, setMode] = useState('forward');

  const sVal = a + b;
  const yVal = sVal * c;
  const L = yVal;

  const grads = useMemo(() => {
    const dLdy = 1;
    const dLds = dLdy * c;
    const dLdc = dLdy * sVal;
    const dLda = dLds * 1;
    const dLdb = dLds * 1;
    return { a: dLda, b: dLdb, c: dLdc, s: dLds, y: dLdy };
  }, [c, sVal]);

  const isFwd = mode === 'forward';
  const fwdColor = 'var(--accent)';
  const bwdColor = 'var(--warning, #facc15)';

  const opPlusPos = { x: 155, y: 150 };
  const opMulPos = { x: 335, y: 200 };

  const eAtoPlus = lineEdge(POS.a, opPlusPos, NODE_R, 22);
  const eBtoPlus = lineEdge(POS.b, opPlusPos, NODE_R, 22);
  const ePlusToS = lineEdge(opPlusPos, POS.s, 22, NODE_R);
  const eStoMul = lineEdge(POS.s, opMulPos, NODE_R, 22);
  const eCtoMul = lineEdge(POS.c, opMulPos, NODE_R, 22);
  const eMulToY = lineEdge(opMulPos, POS.y, 22, NODE_R);

  const edgeColor = isFwd ? fwdColor : bwdColor;
  const markerId = isFwd ? 'fbg-arrow-fwd' : 'fbg-arrow-bwd';

  const renderEdge = (e, key) => (
    isFwd ? (
      <line key={key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={edgeColor} strokeWidth="2" markerEnd={`url(#${markerId})`} />
    ) : (
      <line key={key} x1={e.x2} y1={e.y2} x2={e.x1} y2={e.y1} stroke={edgeColor} strokeWidth="2" strokeDasharray="5 4" markerEnd={`url(#${markerId})`} />
    )
  );

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="fbg-arrow-fwd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={fwdColor} />
            </marker>
            <marker id="fbg-arrow-bwd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={bwdColor} />
            </marker>
          </defs>

          {renderEdge(eAtoPlus, 'ea')}
          {renderEdge(eBtoPlus, 'eb')}
          {renderEdge(ePlusToS, 'eps')}
          {renderEdge(eStoMul, 'esm')}
          {renderEdge(eCtoMul, 'ecm')}
          {renderEdge(eMulToY, 'emy')}

          <OpNode pos={opPlusPos} symbol="+" color={isFwd ? fwdColor : bwdColor} />
          <OpNode pos={opMulPos} symbol="×" color={isFwd ? fwdColor : bwdColor} />

          <Node
            pos={POS.a}
            label="a"
            value={isFwd ? `= ${a}` : `∂L/∂a = ${grads.a.toFixed(1)}`}
            color={isFwd ? fwdColor : bwdColor}
            sub="leaf"
          />
          <Node
            pos={POS.b}
            label="b"
            value={isFwd ? `= ${b}` : `∂L/∂b = ${grads.b.toFixed(1)}`}
            color={isFwd ? fwdColor : bwdColor}
            sub="leaf"
          />
          <Node
            pos={POS.s}
            label="s"
            value={isFwd ? `= ${sVal}` : `∂L/∂s = ${grads.s.toFixed(1)}`}
            color={isFwd ? fwdColor : bwdColor}
            sub="a+b"
          />
          <Node
            pos={POS.c}
            label="c"
            value={isFwd ? `= ${c}` : `∂L/∂c = ${grads.c.toFixed(1)}`}
            color={isFwd ? fwdColor : bwdColor}
            sub="leaf"
          />
          <Node
            pos={POS.y}
            label="y"
            value={isFwd ? `= ${yVal}` : `∂L/∂y = ${grads.y.toFixed(1)}`}
            color={isFwd ? fwdColor : bwdColor}
            sub="s·c"
          />

          <text x={W / 2} y={20} fontSize="12" fontFamily="var(--mono)" fontWeight="700" fill={isFwd ? fwdColor : bwdColor} textAnchor="middle">
            {isFwd ? 'FORWARD — values flow left to right' : 'BACKWARD — gradients flow right to left'}
          </text>
          <text x={W / 2} y={H - 8} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">
            {isFwd
              ? `L = y = (a+b)·c = (${a}+${b})·${c} = ${L}`
              : `seed ∂L/∂y = 1, walk reversed edges multiplying local jacobians`}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: fwdColor }}>forward</span>
          <span className="mlviz-val">
            s = a + b = {sVal} · y = s · c = {yVal} · L = {L}
          </span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: bwdColor }}>backward</span>
          <span className="mlviz-val">
            ∂L/∂a = {grads.a.toFixed(1)}, ∂L/∂b = {grads.b.toFixed(1)}, ∂L/∂c = {grads.c.toFixed(1)}
          </span>
          <span className="mlviz-sub">
            +: copies upstream grad to each input. ×: multiplies upstream by the *other* input.
          </span>
        </div>
      </div>

      <div className="mt-controls">
        <div className="mlviz-slider" style={{ minWidth: 140 }}>
          <span className="mlviz-slider-label">a</span>
          <input type="range" min="-5" max="5" step="1" value={a} onChange={(e) => setA(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{a}</span>
        </div>
        <div className="mlviz-slider" style={{ minWidth: 140 }}>
          <span className="mlviz-slider-label">b</span>
          <input type="range" min="-5" max="5" step="1" value={b} onChange={(e) => setB(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{b}</span>
        </div>
        <div className="mlviz-slider" style={{ minWidth: 140 }}>
          <span className="mlviz-slider-label">c</span>
          <input type="range" min="-5" max="5" step="1" value={c} onChange={(e) => setC(parseInt(e.target.value, 10))} />
          <span className="mlviz-slider-val">{c}</span>
        </div>
        <button
          type="button"
          className={`mlviz-btn ${mode === 'forward' ? 'mlviz-btn-primary' : ''}`}
          onClick={() => setMode('forward')}
        >
          forward
        </button>
        <button
          type="button"
          className={`mlviz-btn ${mode === 'backward' ? 'mlviz-btn-primary' : ''}`}
          onClick={() => setMode('backward')}
        >
          backward
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={() => { setA(2); setB(3); setC(4); setMode('forward'); }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
