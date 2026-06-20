import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Table2, FileJson, GitMerge, Zap, Copy, Pencil, AlertTriangle, Database,
} from 'lucide-react';
import './NosqlVsSqlViz.css';

// SQL (normalized, JOINs) vs NoSQL (denormalized, embedded document) answering
// the SAME query: "show order #1001 with its customer name and line items."
//
//   SQL    three normalized tables — orders, customers, order_items. The query
//          STARTS at orders, JOINs to customers on customer_id, JOINs to
//          order_items on order_id. Three table touches, but the customer name
//          is stored ONCE.
//   NoSQL  one orders document with the customer name and items EMBEDDED. The
//          read is a single document fetch — fast — but the customer's name is
//          DUPLICATED into every order document.
//
// The write toggle shows the cost of that duplication: rename the customer and
// SQL updates one row; NoSQL must rewrite the name in N documents (a fan-out
// write). Read speed vs write fan-out is the whole trade.

// number of orders the customer appears in (duplicate copies in NoSQL)
const DUP_DOCS = 4;

// SQL read traversal steps
function sqlReadFrames() {
  return [
    { table: 'orders', detail: 'SELECT * FROM orders WHERE id = 1001', touched: ['orders'], note: 'The query starts at the orders table and finds row 1001. It holds a customer_id (42) and an order id, but no customer name and no items yet — those live in other tables.' },
    { table: 'customers', detail: 'JOIN customers ON customer_id = 42', touched: ['orders', 'customers'], note: 'First JOIN: follow customer_id 42 into the customers table to pull the name "Ada Lovelace". Stored once here, referenced by every order — that is normalization.' },
    { table: 'order_items', detail: 'JOIN order_items ON order_id = 1001', touched: ['orders', 'customers', 'order_items'], note: 'Second JOIN: gather the two line items for order 1001 from order_items. Three tables touched to assemble one answer — more work per read, but zero duplicated data.' },
    { table: 'done', detail: 'assembled: order + name + 2 items', touched: ['orders', 'customers', 'order_items'], note: 'The engine assembles the joined rows into the final result. The cost was 3 table accesses; the benefit is that the customer name exists in exactly one place.' },
  ];
}

// NoSQL read traversal steps
function nosqlReadFrames() {
  return [
    { stage: 'locate', detail: 'db.orders.findOne({ _id: 1001 })', note: 'A single lookup by _id locates the orders document for 1001. No joins are planned — everything this query needs is supposed to be inside that one document.' },
    { stage: 'fetch', detail: 'one document returned', note: 'The document comes back whole: it already embeds the customer name "Ada Lovelace" and both line items. One round trip, one read — this is why denormalized reads are fast.' },
    { stage: 'done', detail: 'served from a single read', note: 'Done. Where SQL touched three tables, NoSQL touched one document. The catch is hiding in that embedded name — see what a write costs.' },
  ];
}

const SQL_TABLES = [
  { key: 'orders', label: 'orders', icon: 'table', cols: ['id: 1001', 'customer_id: 42'] },
  { key: 'customers', label: 'customers', icon: 'table', cols: ['id: 42', 'name: Ada Lovelace'] },
  { key: 'order_items', label: 'order_items', icon: 'table', cols: ['order_id: 1001', 'sku x2'] },
];

export default function NosqlVsSqlViz() {
  const [showWrite, setShowWrite] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const sqlFrames = sqlReadFrames();
  const nosqlFrames = nosqlReadFrames();
  // longest lane drives the step count
  const totalSteps = Math.max(sqlFrames.length, nosqlFrames.length);
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1900 / Math.max(speed, 0.1));

  const sqlCur = sqlFrames[Math.min(step, sqlFrames.length - 1)];
  const nosqlCur = nosqlFrames[Math.min(step, nosqlFrames.length - 1)];

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
    return () => {
      if (runTimer.current) { clearTimeout(runTimer.current); runTimer.current = null; }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => { if (runTimer.current) clearTimeout(runTimer.current); }, []);

  const reset = () => { setIsRunning(false); setStep(0); };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SQL "touched" count this step (number of table accesses so far)
  const sqlTouches = sqlCur.touched.length;
  const nosqlDone = nosqlCur.stage === 'done';

  // ---- SVG geometry ----
  const W = 940;
  const H = 380;
  const midX = W / 2;

  // SQL side (left)
  const sqlX = 30;
  const sqlW = 380;
  const tH = 78;
  const tGap = 16;
  const tTop = 70;
  const tableX = (i) => sqlX + 10 + (i % 1) * 0; // single column
  const tableY = (i) => tTop + i * (tH + tGap);

  // NoSQL side (right)
  const docX = 540;
  const docW = 360;
  const docTop = 90;
  const docH = 200;

  return (
    <div className="nvs">
      <div className="nvs-head">
        <h3 className="nvs-title">SQL joins vs NoSQL document — the same query, two shapes</h3>
        <p className="nvs-sub">
          One side answers &ldquo;order 1001 with customer and items&rdquo; by joining three normalized tables;
          the other by reading one embedded document. Step the read to compare, then toggle the write to see
          duplication&rsquo;s cost.
        </p>
      </div>

      <div className="nvs-controls">
        <button
          type="button"
          className={`nvs-toggle ${showWrite ? 'is-on is-warn' : ''}`}
          onClick={() => { setShowWrite((v) => !v); }}
          aria-pressed={showWrite}
          title="Rename the customer and compare the write cost"
        >
          {showWrite ? <Pencil size={13} /> : <Copy size={13} />}
          write: rename customer {showWrite ? 'on' : 'off'}
        </button>
        <span className={`nvs-tag ${showWrite ? 'is-warn' : ''}`}>
          {showWrite ? `NoSQL must update ${DUP_DOCS} docs` : 'comparing the read path'}
        </span>

        <label className="nvs-speed">
          <span className="nvs-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="nvs-speed-range" aria-label="Playback speed"
          />
          <span className="nvs-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="nvs-spacer" aria-hidden="true" />

        <div className="nvs-buttons">
          <button
            type="button" className="nvs-btn nvs-btn-primary"
            onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunning((v) => !v); }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="nvs-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="nvs-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="nvs-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
        <div className="nvs-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="nvs-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="nvs-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="nvs-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="nvs-ah" />
            </marker>
            <marker id="nvs-arr-w" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="nvs-ah is-w" />
            </marker>
          </defs>

          {/* divider */}
          <line className="nvs-divider" x1={midX} y1={56} x2={midX} y2={H - 14} />

          {/* ---- SQL side ---- */}
          <g transform={`translate(${sqlX - 2}, ${tTop - 34})`}>
            <Table2 width={16} height={16} className="nvs-ic-head is-sql" />
          </g>
          <text className="nvs-side-label is-sql" x={sqlX + 20} y={tTop - 22} textAnchor="start">SQL — normalized, 3 tables joined</text>

          {SQL_TABLES.map((t, i) => {
            const ty = tableY(i);
            const touched = sqlCur.touched.includes(t.key);
            const active = !touched ? false
              : (sqlCur.table === t.key) || (sqlCur.table === 'done');
            return (
              <g key={t.key}>
                {i < SQL_TABLES.length - 1 && (
                  <line
                    className={`nvs-join ${sqlCur.touched.includes(SQL_TABLES[i + 1].key) ? 'is-on' : ''}`}
                    x1={tableX(i) + sqlW / 2 - 30}
                    y1={ty + tH}
                    x2={tableX(i + 1) + sqlW / 2 - 30}
                    y2={tableY(i + 1)}
                    markerEnd="url(#nvs-arr)"
                  />
                )}
                <rect className={`nvs-table ${touched ? 'is-touched' : ''} ${active ? 'is-active' : ''}`} x={tableX(i)} y={ty} width={sqlW} height={tH} rx={8} />
                <g transform={`translate(${tableX(i) + 12}, ${ty + 10})`}>
                  <Table2 width={15} height={15} className={`nvs-table-ic ${touched ? 'is-on' : ''}`} />
                </g>
                <text className="nvs-table-label" x={tableX(i) + 34} y={ty + 22} textAnchor="start">{t.label}</text>
                {t.cols.map((c, k) => (
                  <text key={c} className="nvs-table-col" x={tableX(i) + 16} y={ty + 42 + k * 16} textAnchor="start">{c}</text>
                ))}
                {i === 1 && (
                  <text className="nvs-once" x={tableX(i) + sqlW - 14} y={ty + 22} textAnchor="end">stored once</text>
                )}
                {/* join label */}
                {i > 0 && sqlCur.table !== 'orders' && (
                  <text className={`nvs-join-label ${sqlCur.touched.includes(t.key) ? 'is-on' : ''}`} x={tableX(i) + sqlW / 2} y={ty - 4} textAnchor="middle">
                    {i === 1 ? 'JOIN on customer_id' : 'JOIN on order_id'}
                  </text>
                )}
              </g>
            );
          })}
          <text className="nvs-cost is-sql" x={sqlX + 10} y={H - 22} textAnchor="start">
            {`read: ${sqlTouches} table touch${sqlTouches === 1 ? '' : 'es'}`}
          </text>

          {/* ---- NoSQL side ---- */}
          <g transform={`translate(${docX - 2}, ${docTop - 64})`}>
            <FileJson width={16} height={16} className="nvs-ic-head is-nosql" />
          </g>
          <text className="nvs-side-label is-nosql" x={docX + 20} y={docTop - 52} textAnchor="start">NoSQL — denormalized, one document</text>

          {/* single-read arrow */}
          <line
            className={`nvs-read ${step >= 1 ? 'is-on' : ''}`}
            x1={docX - 24}
            y1={docTop + docH / 2}
            x2={docX - 4}
            y2={docTop + docH / 2}
            markerEnd="url(#nvs-arr)"
          />
          <text className={`nvs-read-label ${step >= 1 ? 'is-on' : ''}`} x={docX - 70} y={docTop + docH / 2 - 8} textAnchor="middle">single read</text>

          <rect className={`nvs-doc ${nosqlDone ? 'is-done' : 'is-active'}`} x={docX} y={docTop} width={docW} height={docH} rx={10} />
          <g transform={`translate(${docX + 14}, ${docTop + 12})`}>
            <FileJson width={16} height={16} className="nvs-doc-ic" />
          </g>
          <text className="nvs-doc-title" x={docX + 36} y={docTop + 25} textAnchor="start">orders/1001</text>
          {[
            '{',
            '  _id: 1001,',
            '  customer: "Ada Lovelace",',
            '  items: [ sku-A, sku-B ],',
            '}',
          ].map((line, k) => {
            const isName = line.includes('customer');
            return (
              <text
                key={k}
                className={`nvs-doc-line ${isName ? 'is-dup' : ''} ${isName && showWrite ? 'is-rewrite' : ''}`}
                x={docX + 22}
                y={docTop + 52 + k * 22}
                textAnchor="start"
              >
                {line}
              </text>
            );
          })}
          {/* duplication callout */}
          <text className="nvs-dup-note" x={docX + docW - 14} y={docTop + 96} textAnchor="end">embedded copy</text>

          {/* duplicate docs stack when write is on */}
          {showWrite && (
            <g>
              {Array.from({ length: DUP_DOCS - 1 }).map((_, k) => (
                <rect key={k} className="nvs-doc-dup" x={docX + 12 + (k + 1) * 8} y={docTop + docH + 14 + (k + 1) * 4} width={docW - 60} height={20} rx={5} />
              ))}
              <text className="nvs-write-note" x={docX + 10} y={docTop + docH + 30} textAnchor="start">
                {`rename → rewrite "customer" in ${DUP_DOCS} docs`}
              </text>
            </g>
          )}
          <text className={`nvs-cost is-nosql ${showWrite ? 'is-warn' : ''}`} x={docX + 10} y={H - 22} textAnchor="start">
            {showWrite ? `write: ${DUP_DOCS}-doc fan-out` : 'read: 1 document fetch'}
          </text>

          {/* SQL write cost when toggled */}
          {showWrite && (
            <text className="nvs-write-sql" x={sqlX + 10} y={H - 6} textAnchor="start">
              SQL write: UPDATE customers SET name=… (1 row)
            </text>
          )}
          {showWrite && (
            <text className="nvs-write-nosql" x={docX + 10} y={H - 6} textAnchor="start">
              {`NoSQL write: ${DUP_DOCS} document updates`}
            </text>
          )}
        </svg>
      </div>

      <div className="nvs-metrics">
        <div className="nvs-metric">
          <span className="nvs-metric-label">query</span>
          <span className="nvs-metric-value">order 1001 + name + items</span>
        </div>
        <div className="nvs-metric">
          <span className="nvs-metric-label">SQL read cost</span>
          <span className="nvs-metric-value">{`${sqlTouches} table${sqlTouches === 1 ? '' : 's'}`}</span>
        </div>
        <div className="nvs-metric">
          <span className="nvs-metric-label">NoSQL read cost</span>
          <span className="nvs-metric-value is-ok">{step >= 1 ? '1 document' : 'locating…'}</span>
        </div>
        <div className="nvs-metric">
          <span className="nvs-metric-label">SQL write cost</span>
          <span className={`nvs-metric-value ${showWrite ? 'is-ok' : ''}`}>{showWrite ? '1 row' : '—'}</span>
        </div>
        <div className="nvs-metric nvs-metric-dim">
          <span className="nvs-metric-label">NoSQL write cost</span>
          <span className={`nvs-metric-value ${showWrite ? 'is-warn' : ''}`}>{showWrite ? `${DUP_DOCS} docs` : '—'}</span>
        </div>
      </div>

      <div className="nvs-narration-row">
        <div className="nvs-narration is-sql">
          <span className="nvs-narration-label is-sql"><Table2 size={12} /> SQL</span>
          <span className="nvs-narration-body">{showWrite ? 'The name lives in one customers row, so a rename is a single UPDATE — normalization makes writes cheap and consistent.' : sqlCur.note}</span>
        </div>
        <div className={`nvs-narration is-nosql ${showWrite ? 'is-warn' : ''}`}>
          <span className={`nvs-narration-label is-nosql ${showWrite ? 'is-warn' : ''}`}><FileJson size={12} /> NoSQL</span>
          <span className="nvs-narration-body">{showWrite ? `The name was embedded into every order, so a rename must rewrite it in all ${DUP_DOCS} documents — fast reads were paid for with expensive, fan-out writes.` : nosqlCur.note}</span>
        </div>
      </div>

      <div className="nvs-legend">
        <span className="nvs-legend-item"><GitMerge size={13} className="nvs-ic is-sql" /> SQL — joins, data stored once</span>
        <span className="nvs-legend-item"><Zap size={13} className="nvs-ic is-nosql" /> NoSQL — one read, data embedded</span>
        <span className="nvs-legend-item"><Copy size={13} className="nvs-ic is-warn" /> duplication — the cost of denormalizing</span>
        <span className="nvs-legend-item"><Database size={13} className="nvs-ic" /> read speed vs write fan-out</span>
      </div>
    </div>
  );
}
