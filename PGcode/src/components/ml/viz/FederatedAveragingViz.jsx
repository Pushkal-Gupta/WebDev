import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Users, Zap } from 'lucide-react';
import './MLViz.css';

const W = 760;
const H = 380;
const MAX_K = 8;
const N_PER_CLIENT = 30;
const TEST_N = 40;
const N_ROUNDS = 30;
const STEP_MS = 380;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Each client gets a slightly different non-iid linear regression task: y = w_true · x + noise
// w_true varies across clients (so naive local training diverges)
// Global "true" w is the average of all client w_true values.
function makeClientData(rng, wTrue, n) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i++) {
    const x = (rng() - 0.5) * 2; // x in [-1, 1]
    const y = wTrue[0] * x + wTrue[1] + 0.15 * gaussian(rng);
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
}

function localSGD(w, data, T, lr) {
  let [a, b] = w;
  const { xs, ys } = data;
  for (let t = 0; t < T; t++) {
    let ga = 0, gb = 0;
    for (let i = 0; i < xs.length; i++) {
      const pred = a * xs[i] + b;
      const err = pred - ys[i];
      ga += err * xs[i];
      gb += err;
    }
    ga /= xs.length;
    gb /= xs.length;
    a -= lr * ga;
    b -= lr * gb;
  }
  return [a, b];
}

function meanW(ws) {
  const n = ws.length;
  let a = 0, b = 0;
  for (const w of ws) { a += w[0]; b += w[1]; }
  return [a / n, b / n];
}

function weightDivergence(ws) {
  const m = meanW(ws);
  let s = 0;
  for (const w of ws) {
    s += (w[0] - m[0]) ** 2 + (w[1] - m[1]) ** 2;
  }
  return Math.sqrt(s / ws.length);
}

function testLoss(w, test) {
  const { xs, ys } = test;
  let s = 0;
  for (let i = 0; i < xs.length; i++) {
    const pred = w[0] * xs[i] + w[1];
    s += (pred - ys[i]) ** 2;
  }
  return s / xs.length;
}

function buildPlan(K, T, baseSeed) {
  const rng = mulberry32(baseSeed);
  // True w per client — varied
  const clientTrue = [];
  for (let k = 0; k < K; k++) {
    const slope = 0.6 + 0.45 * Math.cos((k / K) * 2 * Math.PI) + 0.15 * (rng() - 0.5);
    const bias = 0.1 + 0.35 * Math.sin((k / K) * 2 * Math.PI) + 0.1 * (rng() - 0.5);
    clientTrue.push([slope, bias]);
  }
  const globalTrue = meanW(clientTrue);

  const clientData = clientTrue.map((wT, k) => makeClientData(mulberry32(baseSeed + 101 + k * 53), wT, N_PER_CLIENT));
  const testData = makeClientData(mulberry32(baseSeed + 777), globalTrue, TEST_N);

  // Simulate FedAvg
  const history = [];
  let global = [0, 0];
  const lr = 0.5;
  history.push({ global: [...global], clients: clientData.map(() => [...global]),
                 divergence: 0, testLoss: testLoss(global, testData) });

  for (let r = 0; r < N_ROUNDS; r++) {
    const clients = clientData.map((d) => localSGD(global, d, T, lr));
    const divergence = weightDivergence(clients);
    global = meanW(clients);
    history.push({ global: [...global], clients, divergence, testLoss: testLoss(global, testData) });
  }
  return { clientTrue, clientData, testData, history, globalTrue };
}

export default function FederatedAveragingViz() {
  const [K, setK] = useState(4);
  const [T, setT] = useState(8);
  const [round, setRound] = useState(0);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef(null);

  const seed = 13;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const plan = useMemo(() => buildPlan(K, T, seed + K * 7 + T), [K, T]);

  const isRunning = isRunningRaw && round < N_ROUNDS;

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    const ms = reducedMotion ? 40 : STEP_MS;
    timerRef.current = setInterval(() => {
      setRound((r) => Math.min(r + 1, N_ROUNDS));
    }, ms);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isRunning, reducedMotion]);

  const handleToggle = useCallback(() => {
    if (round >= N_ROUNDS) { setRound(0); setIsRunningRaw(true); return; }
    setIsRunningRaw((r) => !r);
  }, [round]);
  const handleStep = useCallback(() => setRound((r) => Math.min(r + 1, N_ROUNDS)), []);
  const handleReset = useCallback(() => { setRound(0); setIsRunningRaw(false); }, []);

  const frame = plan.history[round];

  // Layout: K client mini-scatter plots arranged in a row (top), global center, test scatter below
  const clientRows = K <= 4 ? 1 : 2;
  const cols = clientRows === 1 ? K : Math.ceil(K / 2);
  const CLIENT_AREA_X = 14;
  const CLIENT_AREA_Y = 32;
  const CLIENT_AREA_W = 440;
  const CLIENT_AREA_H = 220;
  const cellW = CLIENT_AREA_W / cols;
  const cellH = CLIENT_AREA_H / clientRows;

  const TEST_X = CLIENT_AREA_X + CLIENT_AREA_W + 16;
  const TEST_Y = 32;
  const TEST_W = W - TEST_X - 18;
  const TEST_H = CLIENT_AREA_H;

  // Convergence panel at bottom
  const CONV_X = CLIENT_AREA_X;
  const CONV_Y = CLIENT_AREA_Y + CLIENT_AREA_H + 22;
  const CONV_W = W - CONV_X - 18;
  const CONV_H = H - CONV_Y - 14;

  // Coordinate transforms for scatter (x in [-1.1, 1.1], y in [-1.1, 1.7])
  function toScatter(px, py, x, y, w, h) {
    const sx = px + 6 + ((x + 1.1) / 2.2) * (w - 12);
    const sy = py + h - 6 - ((y + 1.1) / 2.8) * (h - 12);
    return [sx, sy];
  }

  function renderClient(k) {
    const col = k % cols;
    const row = Math.floor(k / cols);
    const px = CLIENT_AREA_X + col * cellW;
    const py = CLIENT_AREA_Y + row * cellH;
    const w = cellW - 6;
    const h = cellH - 6;
    const data = plan.clientData[k];
    const [a, b] = frame.clients[k];
    // line in y = a*x + b for x in [-1, 1]
    const [lx1, ly1] = toScatter(px, py, -1, a * -1 + b, w, h);
    const [lx2, ly2] = toScatter(px, py, 1, a * 1 + b, w, h);
    return (
      <g key={`c-${k}`}>
        <rect x={px} y={py} width={w} height={h} rx={6}
              fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />
        <text x={px + 5} y={py + 11} fontSize="8.5" fill="var(--text-dim)"
              fontFamily="var(--mono)" letterSpacing="0.1em" fontWeight={700}>
          {`CLIENT ${k + 1}`}
        </text>
        {data.xs.map((xv, i) => {
          const [sx, sy] = toScatter(px, py, xv, data.ys[i], w, h);
          return <circle key={i} cx={sx} cy={sy} r={1.7} fill="var(--hue-sky)" opacity="0.7" />;
        })}
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke="var(--hue-pink)" strokeWidth="1.4" opacity="0.95" />
      </g>
    );
  }

  function renderTest() {
    const [a, b] = frame.global;
    const data = plan.testData;
    const [lx1, ly1] = toScatter(TEST_X, TEST_Y, -1, a * -1 + b, TEST_W, TEST_H);
    const [lx2, ly2] = toScatter(TEST_X, TEST_Y, 1, a * 1 + b, TEST_W, TEST_H);
    const [gtx1, gty1] = toScatter(TEST_X, TEST_Y, -1, plan.globalTrue[0] * -1 + plan.globalTrue[1], TEST_W, TEST_H);
    const [gtx2, gty2] = toScatter(TEST_X, TEST_Y, 1, plan.globalTrue[0] * 1 + plan.globalTrue[1], TEST_W, TEST_H);
    return (
      <g>
        <text x={TEST_X} y={TEST_Y - 8} fontSize="10" fill="var(--text-dim)"
              fontFamily="var(--mono)" letterSpacing="0.14em">
          GLOBAL MODEL  ·  test set
        </text>
        <rect x={TEST_X} y={TEST_Y} width={TEST_W} height={TEST_H} rx={8}
              fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />
        {data.xs.map((xv, i) => {
          const [sx, sy] = toScatter(TEST_X, TEST_Y, xv, data.ys[i], TEST_W, TEST_H);
          return <circle key={i} cx={sx} cy={sy} r={2} fill="var(--text-main)" opacity="0.55" />;
        })}
        {/* ground truth line */}
        <line x1={gtx1} y1={gty1} x2={gtx2} y2={gty2}
              stroke="var(--text-dim)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" />
        {/* current global model line */}
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke="var(--accent)" strokeWidth="2" opacity="0.95" />
        <text x={TEST_X + 6} y={TEST_Y + TEST_H - 6} fontSize="8.5" fill="var(--text-dim)"
              fontFamily="var(--mono)">dashed = ground truth   solid = fed-avg model</text>
      </g>
    );
  }

  function renderConvergence() {
    // Divergence + test loss curves vs round
    const xs = plan.history.map((_, i) => CONV_X + 10 + ((CONV_W - 20) * i) / N_ROUNDS);
    const divMax = Math.max(...plan.history.map((h) => h.divergence), 1e-6);
    const lossMax = Math.max(...plan.history.map((h) => h.testLoss), 1e-6);
    const visible = Math.min(round + 1, plan.history.length);

    let dDiv = '';
    let dLoss = '';
    for (let i = 0; i < visible; i++) {
      const x = xs[i];
      const yDiv = CONV_Y + CONV_H - 14 - ((plan.history[i].divergence / divMax) * (CONV_H - 28));
      const yLoss = CONV_Y + CONV_H - 14 - ((plan.history[i].testLoss / lossMax) * (CONV_H - 28));
      dDiv += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + yDiv.toFixed(1) + ' ';
      dLoss += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + yLoss.toFixed(1) + ' ';
    }
    return (
      <g>
        <text x={CONV_X} y={CONV_Y - 6} fontSize="10" fill="var(--text-dim)"
              fontFamily="var(--mono)" letterSpacing="0.14em">
          CONVERGENCE  ·  round {round} / {N_ROUNDS}
        </text>
        <rect x={CONV_X} y={CONV_Y} width={CONV_W} height={CONV_H} rx={8}
              fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />
        <path d={dDiv} fill="none" stroke="var(--hue-pink)" strokeWidth="1.6" opacity="0.95" />
        <path d={dLoss} fill="none" stroke="var(--accent)" strokeWidth="1.6" opacity="0.95" />
        <g transform={`translate(${CONV_X + 10}, ${CONV_Y + 12})`}>
          <rect x={0} y={-7} width={9} height={9} rx={2} fill="var(--hue-pink)" />
          <text x={14} y={1} fontSize="9" fill="var(--text-main)" fontFamily="var(--mono)">
            weight divergence
          </text>
          <rect x={130} y={-7} width={9} height={9} rx={2} fill="var(--accent)" />
          <text x={144} y={1} fontSize="9" fill="var(--text-main)" fontFamily="var(--mono)">
            test loss
          </text>
        </g>
      </g>
    );
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text x={CLIENT_AREA_X} y={CLIENT_AREA_Y - 10} fontSize="10" fill="var(--text-dim)"
                fontFamily="var(--mono)" letterSpacing="0.14em">
            {`CLIENTS (K=${K})  ·  local data + local model line`}
          </text>
          {Array.from({ length: K }, (_, k) => renderClient(k))}
          {renderTest()}
          {renderConvergence()}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Users size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              clients K
            </span>
            <input type="range" min="2" max={MAX_K} step="1" value={K}
                   onChange={(e) => { setK(parseInt(e.target.value, 10)); setRound(0); setIsRunningRaw(false); }} />
            <span className="mlviz-slider-val">{K}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">local steps T</span>
            <input type="range" min="1" max="20" step="1" value={T}
                   onChange={(e) => { setT(parseInt(e.target.value, 10)); setRound(0); setIsRunningRaw(false); }} />
            <span className="mlviz-slider-val">{T}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span>
            <span className="mlviz-sub">weight divergence</span>{' '}
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
              {frame.divergence.toFixed(3)}
            </span>
          </span>
          <span>
            <span className="mlviz-sub">test loss</span>{' '}
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>
              {frame.testLoss.toFixed(3)}
            </span>
          </span>
          <span>
            <span className="mlviz-sub">global w</span>{' '}
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              [{frame.global[0].toFixed(2)}, {frame.global[1].toFixed(2)}]
            </span>
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`} onClick={handleToggle}>
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{round >= N_ROUNDS ? 'Restart' : isRunning ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleStep}
                  disabled={isRunning || round >= N_ROUNDS}>
            <Zap size={13} />
            <span>Round</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            round {round} / {N_ROUNDS}
          </span>
        </div>

        <div className="mlviz-hint">
          each round = T local SGD steps per client, then average all weights into the global model
        </div>
      </div>
    </div>
  );
}
