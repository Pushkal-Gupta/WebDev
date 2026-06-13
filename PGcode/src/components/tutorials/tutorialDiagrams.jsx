// Static SVG diagrams used by DSA Tutorial theory bodies in place of ASCII art.
//
// Wired to a fenced block with the marker ```tut-diagram <name>``` (see
// TUT_DIAGRAM_NAMES in tutorialDiagramsRegistry.js).
//
// Hard constraints (CLAUDE.md):
//   - Theme tokens only via the `.tut-diagram-*` class set; no hex colors.
//   - Lucide icons only when needed; no emoji.
//   - No internal scrollbars; every SVG uses width:100% + preserveAspectRatio.
//   - Static — these are pictures, not interactive viz. Use ```tut-viz``` for
//     interactive components.

import React from 'react';
import { TUT_DIAGRAM_NAMES } from './tutorialDiagramsRegistry';

// ---------------------------------------------------------------------------
// Shared SVG primitives.
// ---------------------------------------------------------------------------

// Single arrow-marker definition reused across every diagram. Each component
// references it via marker-end="url(#tutDiagramArrow)".
function ArrowMarker() {
  return (
    <defs>
      <marker
        id="tutDiagramArrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" className="tut-diagram-arrow-head" />
      </marker>
      <marker
        id="tutDiagramArrowAccent"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" className="tut-diagram-arrow-head accent" />
      </marker>
    </defs>
  );
}

function DiagramFrame({ title, children, viewBox }) {
  return (
    <div className="tut-viz tut-diagram">
      {title && (
        <div className="tut-viz-head">
          <span>{title}</span>
        </div>
      )}
      <div className="tut-viz-svg-wrap">
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="tut-viz-svg tut-diagram-svg"
          role="img"
          aria-label={title || 'diagram'}
        >
          <ArrowMarker />
          {children}
        </svg>
      </div>
    </div>
  );
}

// A labelled rectangular node. Provides a stable visual brick everywhere.
function NodeBox({ x, y, w, h, label, sub, variant = 'default' }) {
  const cx = x + w / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className={`tut-diagram-node ${variant}`}
      />
      <text x={cx} y={y + h / 2 + (sub ? -4 : 5)} textAnchor="middle"
        className="tut-diagram-node-label">{label}</text>
      {sub && (
        <text x={cx} y={y + h / 2 + 12} textAnchor="middle"
          className="tut-diagram-node-sub">{sub}</text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1. stdin -> code -> stdout (Fundamentals page hero).
// ---------------------------------------------------------------------------

function StdinCodeStdoutFlow() {
  const W = 760, H = 260;
  const BOX_W = 150, BOX_H = 64;
  const top = 70;
  const x1 = 60, x2 = 305, x3 = 550;

  return (
    <DiagramFrame title="Input / Output pipeline" viewBox={`0 0 ${W} ${H}`}>
      <NodeBox x={x1} y={top} w={BOX_W} h={BOX_H} label="stdin" />
      <NodeBox x={x2} y={top} w={BOX_W} h={BOX_H} label="your code" variant="accent" />
      <NodeBox x={x3} y={top} w={BOX_W} h={BOX_H} label="stdout" />

      {/* top arrows between boxes */}
      <line
        x1={x1 + BOX_W + 6} y1={top + BOX_H / 2}
        x2={x2 - 6} y2={top + BOX_H / 2}
        className="tut-diagram-line"
        markerEnd="url(#tutDiagramArrow)"
      />
      <line
        x1={x2 + BOX_W + 6} y1={top + BOX_H / 2}
        x2={x3 - 6} y2={top + BOX_H / 2}
        className="tut-diagram-line"
        markerEnd="url(#tutDiagramArrow)"
      />

      {/* sources feeding stdin */}
      <line
        x1={x1 + BOX_W / 2} y1={top + BOX_H + 6}
        x2={x1 + BOX_W / 2} y2={top + BOX_H + 56}
        className="tut-diagram-line dim"
        markerStart="url(#tutDiagramArrow)"
      />
      <text x={x1 + BOX_W / 2} y={top + BOX_H + 76} textAnchor="middle"
        className="tut-diagram-caption">keyboard</text>
      <text x={x1 + BOX_W / 2} y={top + BOX_H + 94} textAnchor="middle"
        className="tut-diagram-caption-sub">file &lt; in.txt</text>

      {/* sinks from code + stdout */}
      <line
        x1={x2 + BOX_W / 2} y1={top + BOX_H + 6}
        x2={x2 + BOX_W / 2} y2={top + BOX_H + 56}
        className="tut-diagram-line dim"
        markerEnd="url(#tutDiagramArrow)"
      />
      <text x={x2 + BOX_W / 2} y={top + BOX_H + 76} textAnchor="middle"
        className="tut-diagram-caption">memory</text>

      <line
        x1={x3 + BOX_W / 2} y1={top + BOX_H + 6}
        x2={x3 + BOX_W / 2} y2={top + BOX_H + 56}
        className="tut-diagram-line dim"
        markerEnd="url(#tutDiagramArrow)"
      />
      <text x={x3 + BOX_W / 2} y={top + BOX_H + 76} textAnchor="middle"
        className="tut-diagram-caption">terminal</text>
      <text x={x3 + BOX_W / 2} y={top + BOX_H + 94} textAnchor="middle"
        className="tut-diagram-caption-sub">file &gt; out.txt</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 2. if / else control-flow graph (diamond + two blocks + merge).
// ---------------------------------------------------------------------------

function IfElseBranchFlow() {
  const W = 560, H = 360;
  const cx = W / 2;

  return (
    <DiagramFrame title="If / else branch graph" viewBox={`0 0 ${W} ${H}`}>
      {/* condition diamond */}
      <polygon
        points={`${cx},20 ${cx + 80},70 ${cx},120 ${cx - 80},70`}
        className="tut-diagram-node accent"
      />
      <text x={cx} y={75} textAnchor="middle" className="tut-diagram-node-label">cond ?</text>

      {/* branches */}
      <NodeBox x={cx - 200} y={180} w={140} h={56} label="block A" />
      <NodeBox x={cx + 60} y={180} w={140} h={56} label="block B" />

      {/* arrows from diamond to blocks with true/false labels */}
      <line
        x1={cx - 60} y1={92}
        x2={cx - 130} y2={180}
        className="tut-diagram-line"
        markerEnd="url(#tutDiagramArrow)"
      />
      <text x={cx - 110} y={140} textAnchor="middle" className="tut-diagram-caption">true</text>

      <line
        x1={cx + 60} y1={92}
        x2={cx + 130} y2={180}
        className="tut-diagram-line"
        markerEnd="url(#tutDiagramArrow)"
      />
      <text x={cx + 110} y={140} textAnchor="middle" className="tut-diagram-caption">false</text>

      {/* merge */}
      <NodeBox x={cx - 70} y={290} w={140} h={50} label="merge" />

      <line
        x1={cx - 130} y1={236}
        x2={cx - 30} y2={290}
        className="tut-diagram-line"
        markerEnd="url(#tutDiagramArrow)"
      />
      <line
        x1={cx + 130} y1={236}
        x2={cx + 30} y2={290}
        className="tut-diagram-line"
        markerEnd="url(#tutDiagramArrow)"
      />
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 3. for loop flowchart (init / cond / body / update).
// ---------------------------------------------------------------------------

function ForLoopFlow() {
  const W = 480, H = 480;
  const cx = W / 2;

  return (
    <DiagramFrame title="For loop control flow" viewBox={`0 0 ${W} ${H}`}>
      <NodeBox x={cx - 90} y={20} w={180} h={52} label="init: i = 0" />

      {/* diamond cond */}
      <polygon
        points={`${cx},120 ${cx + 110},170 ${cx},220 ${cx - 110},170`}
        className="tut-diagram-node accent"
      />
      <text x={cx} y={175} textAnchor="middle" className="tut-diagram-node-label">i &lt; n ?</text>

      <NodeBox x={cx - 90} y={270} w={180} h={52} label="body(i)" />
      <NodeBox x={cx - 90} y={370} w={180} h={52} label="update: i++" />

      {/* exit node */}
      <NodeBox x={cx + 170} y={150} w={100} h={48} label="exit" variant="dim" />

      {/* arrows */}
      <line x1={cx} y1={72} x2={cx} y2={120}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <line x1={cx} y1={220} x2={cx} y2={270}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <line x1={cx} y1={322} x2={cx} y2={370}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <text x={cx + 14} y={250} className="tut-diagram-caption">yes</text>

      {/* back-edge: update -> cond (left side) */}
      <path
        d={`M ${cx - 90} ${396} L ${cx - 200} ${396} L ${cx - 200} ${170} L ${cx - 110} ${170}`}
        className="tut-diagram-line"
        fill="none"
        markerEnd="url(#tutDiagramArrow)"
      />

      {/* cond -> exit (right) labelled no */}
      <line
        x1={cx + 110} y1={170}
        x2={cx + 170} y2={170}
        className="tut-diagram-line"
        markerEnd="url(#tutDiagramArrow)"
      />
      <text x={cx + 140} y={160} textAnchor="middle" className="tut-diagram-caption">no</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 4. while loop — pre-test vs post-test side by side.
// ---------------------------------------------------------------------------

function WhileLoopFlow() {
  const W = 760, H = 360;

  function Lane({ x0, title, postTest }) {
    const cx = x0 + 140;
    const top = 30;
    const condY = postTest ? 180 : 60;
    const bodyY = postTest ? 60 : 180;
    return (
      <g>
        <text x={cx} y={top} textAnchor="middle" className="tut-diagram-subhead">{title}</text>

        {/* diamond */}
        <polygon
          points={`${cx},${condY} ${cx + 90},${condY + 40} ${cx},${condY + 80} ${cx - 90},${condY + 40}`}
          className="tut-diagram-node accent"
        />
        <text x={cx} y={condY + 45} textAnchor="middle" className="tut-diagram-node-label">cond ?</text>

        {/* body */}
        <NodeBox x={cx - 70} y={bodyY} w={140} h={50} label="body" />

        {/* exit */}
        <NodeBox x={cx + 130} y={condY + 22} w={80} h={40} label="exit" variant="dim" />

        {postTest ? (
          <>
            {/* body -> cond */}
            <line x1={cx} y1={bodyY + 50} x2={cx} y2={condY}
              className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
            {/* cond -> body back-edge (yes) */}
            <path
              d={`M ${cx - 90} ${condY + 40} L ${cx - 160} ${condY + 40} L ${cx - 160} ${bodyY + 25} L ${cx - 70} ${bodyY + 25}`}
              fill="none"
              className="tut-diagram-line"
              markerEnd="url(#tutDiagramArrow)"
            />
            <text x={cx - 140} y={condY + 30} className="tut-diagram-caption">yes</text>
          </>
        ) : (
          <>
            {/* cond -> body (yes) */}
            <line x1={cx} y1={condY + 80} x2={cx} y2={bodyY}
              className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
            <text x={cx + 14} y={bodyY - 10} className="tut-diagram-caption">yes</text>
            {/* body back-edge -> cond */}
            <path
              d={`M ${cx - 70} ${bodyY + 25} L ${cx - 160} ${bodyY + 25} L ${cx - 160} ${condY + 40} L ${cx - 90} ${condY + 40}`}
              fill="none"
              className="tut-diagram-line"
              markerEnd="url(#tutDiagramArrow)"
            />
          </>
        )}

        {/* cond -> exit (no) */}
        <line x1={cx + 90} y1={condY + 40} x2={cx + 130} y2={condY + 40}
          className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
        <text x={cx + 110} y={condY + 32} textAnchor="middle"
          className="tut-diagram-caption">no</text>
      </g>
    );
  }

  return (
    <DiagramFrame title="Pre-test vs post-test while" viewBox={`0 0 ${W} ${H}`}>
      <Lane x0={20} title="pre-test  while (c) { ... }" postTest={false} />
      <Lane x0={400} title="post-test  do { ... } while (c)" postTest={true} />
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 5. Class as blueprint -> instances.
// ---------------------------------------------------------------------------

function ClassToInstancesFlow() {
  const W = 720, H = 280;
  return (
    <DiagramFrame title="Class blueprint, two instances" viewBox={`0 0 ${W} ${H}`}>
      {/* class block (left) */}
      <rect x={30} y={40} width={220} height={170} rx={8}
        className="tut-diagram-node accent" />
      <text x={140} y={64} textAnchor="middle" className="tut-diagram-node-label">class BankAccount</text>
      <line x1={40} y1={78} x2={240} y2={78} className="tut-diagram-line dim" />
      <text x={50} y={104} className="tut-diagram-caption" textAnchor="start">balance: number</text>
      <text x={50} y={138} className="tut-diagram-caption" textAnchor="start">deposit(amt)</text>
      <text x={50} y={170} className="tut-diagram-caption" textAnchor="start">withdraw(amt)</text>

      {/* instances */}
      <NodeBox x={400} y={50} w={130} h={70} label="acc_a" sub="$10" />
      <NodeBox x={560} y={50} w={130} h={70} label="acc_b" sub="$50" />
      <text x={465} y={148} textAnchor="middle" className="tut-diagram-caption">instance</text>
      <text x={625} y={148} textAnchor="middle" className="tut-diagram-caption">instance</text>

      {/* arrows from class to instances */}
      <line x1={250} y1={85} x2={400} y2={85}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <line x1={250} y1={120} x2={560} y2={85}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />

      <text x={325} y={75} textAnchor="middle" className="tut-diagram-caption">stamp</text>

      {/* state + behavior label */}
      <text x={465} y={210} textAnchor="middle" className="tut-diagram-caption-sub">
        each instance carries its own state; methods are shared
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 6. Space buckets (input / aux / call stack / output).
// ---------------------------------------------------------------------------

function SpaceBucketsDiagram() {
  const W = 600, H = 380;
  const rows = [
    { label: 'input (read-only)', note: 'not counted in extra space', variant: 'dim' },
    { label: 'aux structures',    note: 'arrays, maps, sets you allocate', variant: 'default' },
    { label: 'call stack',        note: 'one frame per pending recursive call', variant: 'default' },
    { label: 'output',            note: 'counted if the problem returns it', variant: 'accent' },
  ];
  const ROW_H = 64, GAP = 12, X0 = 40, Y0 = 30, ROW_W = 520;

  return (
    <DiagramFrame title="Where space goes" viewBox={`0 0 ${W} ${H}`}>
      {rows.map((r, i) => {
        const y = Y0 + i * (ROW_H + GAP);
        return (
          <g key={i}>
            <rect x={X0} y={y} width={ROW_W} height={ROW_H} rx={6}
              className={`tut-diagram-node ${r.variant}`} />
            <text x={X0 + 18} y={y + 26} className="tut-diagram-node-label" textAnchor="start">
              {r.label}
            </text>
            <text x={X0 + 18} y={y + 46} className="tut-diagram-caption" textAnchor="start">
              {r.note}
            </text>
          </g>
        );
      })}
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 7. Recursion call tree — factorial(4).
// ---------------------------------------------------------------------------

function RecursionCallTree() {
  const W = 640, H = 360;
  // Vertical chain of recursive calls (skewed tree)
  const calls = [
    { x: 40,  y: 30,  label: 'factorial(4)' },
    { x: 160, y: 90,  label: 'factorial(3)' },
    { x: 280, y: 150, label: 'factorial(2)' },
    { x: 400, y: 210, label: 'factorial(1)' },
  ];
  const returns = [
    { x: 400, y: 270, label: 'return 1', variant: 'accent' },
    { x: 280, y: 270, label: 'return 2', variant: 'accent' },
    { x: 160, y: 270, label: 'return 6', variant: 'accent' },
    { x: 40,  y: 270, label: 'return 24', variant: 'accent' },
  ];

  return (
    <DiagramFrame title="Recursive call tree — factorial(4)" viewBox={`0 0 ${W} ${H}`}>
      {calls.map((c, i) => (
        <g key={`c-${i}`}>
          <NodeBox x={c.x} y={c.y} w={140} h={42} label={c.label} />
          {i < calls.length - 1 && (
            <line
              x1={c.x + 70} y1={c.y + 42}
              x2={calls[i + 1].x + 70} y2={calls[i + 1].y}
              className="tut-diagram-line"
              markerEnd="url(#tutDiagramArrow)"
            />
          )}
        </g>
      ))}

      <text x={500} y={235} className="tut-diagram-caption">base case</text>

      {returns.map((r, i) => (
        <g key={`r-${i}`}>
          <NodeBox x={r.x} y={r.y} w={140} h={42} label={r.label} variant={r.variant} />
          {i < returns.length - 1 && (
            <line
              x1={r.x + 70} y1={r.y}
              x2={returns[i + 1].x + 70} y2={returns[i + 1].y + 42}
              className="tut-diagram-line accent"
              markerEnd="url(#tutDiagramArrowAccent)"
            />
          )}
        </g>
      ))}

      <text x={W / 2} y={335} textAnchor="middle" className="tut-diagram-caption-sub">
        descending: reduce + recurse;  ascending: fold answers back up the stack
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 8. Search families — linear, binary, hash, illustrated.
// ---------------------------------------------------------------------------

function SearchFamiliesDiagram() {
  const W = 720, H = 400;
  const cellW = 52, cellH = 44, x0 = 40;

  const linear = [5, 2, 8, 1, 9, 4, 7, 3];
  const binary = [1, 2, 3, 4, 5, 7, 8, 9];

  return (
    <DiagramFrame title="Three search families" viewBox={`0 0 ${W} ${H}`}>
      {/* Linear */}
      <text x={x0} y={30} className="tut-diagram-subhead">Linear · O(n)</text>
      {linear.map((v, i) => (
        <g key={`l-${i}`}>
          <rect x={x0 + i * cellW} y={44} width={cellW - 6} height={cellH} rx={4}
            className="tut-diagram-cell" />
          <text x={x0 + i * cellW + (cellW - 6) / 2} y={44 + cellH / 2 + 5}
            textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
        </g>
      ))}
      <line x1={x0} y1={108} x2={x0 + linear.length * cellW - 6} y2={108}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <text x={x0 + linear.length * cellW + 16} y={113}
        className="tut-diagram-caption">inspect each cell</text>

      {/* Binary */}
      <text x={x0} y={150} className="tut-diagram-subhead">Binary · O(log n)</text>
      {binary.map((v, i) => {
        const active = i === 0 || i === 3 || i === 7;
        return (
          <g key={`b-${i}`}>
            <rect x={x0 + i * cellW} y={164} width={cellW - 6} height={cellH} rx={4}
              className={`tut-diagram-cell ${active ? 'accent' : ''}`} />
            <text x={x0 + i * cellW + (cellW - 6) / 2} y={164 + cellH / 2 + 5}
              textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
          </g>
        );
      })}
      <text x={x0 + (cellW - 6) / 2} y={228} textAnchor="middle"
        className="tut-diagram-caption">L</text>
      <text x={x0 + 3 * cellW + (cellW - 6) / 2} y={228} textAnchor="middle"
        className="tut-diagram-caption">M</text>
      <text x={x0 + 7 * cellW + (cellW - 6) / 2} y={228} textAnchor="middle"
        className="tut-diagram-caption">R</text>

      {/* Hash */}
      <text x={x0} y={270} className="tut-diagram-subhead">Hash · O(1) avg</text>
      <rect x={x0} y={284} width={140} height={44} rx={4} className="tut-diagram-cell" />
      <text x={x0 + 70} y={284 + 28} textAnchor="middle" className="tut-diagram-cell-text">
        h("kai") = 6
      </text>
      <line x1={x0 + 140} y1={306} x2={x0 + 200} y2={306}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <rect x={x0 + 200} y={284} width={140} height={44} rx={4}
        className="tut-diagram-cell accent" />
      <text x={x0 + 270} y={284 + 28} textAnchor="middle" className="tut-diagram-cell-text">
        bucket[6]
      </text>
      <line x1={x0 + 340} y1={306} x2={x0 + 400} y2={306}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <rect x={x0 + 400} y={284} width={170} height={44} rx={4}
        className="tut-diagram-cell" />
      <text x={x0 + 485} y={284 + 28} textAnchor="middle" className="tut-diagram-cell-text">
        ("kai", 42)
      </text>
      <text x={x0 + 200} y={350} className="tut-diagram-caption">
        jump direct
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 9. Binary search L/M/R window shrinking.
// ---------------------------------------------------------------------------

function BinarySearchSteps() {
  const W = 720, H = 360;
  const data = [1, 3, 4, 5, 7, 9, 11, 13];
  const cellW = 64, cellH = 48, x0 = 40;
  const rows = [
    { y: 40,  label: 'start',   L: 0, M: 3, R: 7, note: 'a[M]=5 < 7  → L = M+1' },
    { y: 150, label: 'step 1',  L: 4, M: 5, R: 7, note: 'a[M]=9 > 7  → R = M' },
    { y: 260, label: 'step 2',  L: 4, M: 4, R: 5, note: 'a[M]=7 == 7 → found' },
  ];

  return (
    <DiagramFrame title="Binary search — L / M / R shrink" viewBox={`0 0 ${W} ${H}`}>
      {rows.map((row, ri) => (
        <g key={ri}>
          <text x={x0 - 4} y={row.y - 6} className="tut-diagram-subhead">{row.label}</text>
          {data.map((v, i) => {
            const inRange = i >= row.L && i <= row.R;
            const isMid = i === row.M;
            return (
              <g key={`${ri}-${i}`}>
                <rect x={x0 + i * cellW} y={row.y} width={cellW - 6} height={cellH} rx={4}
                  className={`tut-diagram-cell ${isMid ? 'accent' : inRange ? 'highlight' : 'dim'}`} />
                <text x={x0 + i * cellW + (cellW - 6) / 2} y={row.y + cellH / 2 + 5}
                  textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
                {i === row.L && (
                  <text x={x0 + i * cellW + (cellW - 6) / 2} y={row.y + cellH + 14}
                    textAnchor="middle" className="tut-diagram-caption">L</text>
                )}
                {i === row.M && (
                  <text x={x0 + i * cellW + (cellW - 6) / 2} y={row.y + cellH + 26}
                    textAnchor="middle" className="tut-diagram-caption accent">M</text>
                )}
                {i === row.R && i !== row.L && (
                  <text x={x0 + i * cellW + (cellW - 6) / 2} y={row.y + cellH + 14}
                    textAnchor="middle" className="tut-diagram-caption">R</text>
                )}
              </g>
            );
          })}
          <text x={x0 + data.length * cellW + 8} y={row.y + cellH / 2 + 4}
            className="tut-diagram-caption">{row.note}</text>
        </g>
      ))}
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 10. Sliding window — array with L/R bounds.
// ---------------------------------------------------------------------------

function SlidingWindowPointers() {
  const W = 720, H = 220;
  const data = [2, 5, 1, 3, 4, 7, 1, 2];
  const cellW = 70, cellH = 56, x0 = 40;
  const L = 1, R = 4;

  return (
    <DiagramFrame title="Sliding window over an array" viewBox={`0 0 ${W} ${H}`}>
      {data.map((v, i) => {
        const inWindow = i >= L && i <= R;
        const isEndpoint = i === L || i === R;
        return (
          <g key={i}>
            <rect x={x0 + i * cellW} y={40} width={cellW - 6} height={cellH} rx={4}
              className={`tut-diagram-cell ${isEndpoint ? 'accent' : inWindow ? 'highlight' : ''}`} />
            <text x={x0 + i * cellW + (cellW - 6) / 2} y={40 + cellH / 2 + 5}
              textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
          </g>
        );
      })}
      <text x={x0 + L * cellW + (cellW - 6) / 2} y={120}
        textAnchor="middle" className="tut-diagram-caption accent">L</text>
      <text x={x0 + L * cellW + (cellW - 6) / 2} y={138}
        textAnchor="middle" className="tut-diagram-caption-sub">left</text>
      <text x={x0 + R * cellW + (cellW - 6) / 2} y={120}
        textAnchor="middle" className="tut-diagram-caption accent">R</text>
      <text x={x0 + R * cellW + (cellW - 6) / 2} y={138}
        textAnchor="middle" className="tut-diagram-caption-sub">right</text>

      <text x={W / 2} y={185} textAnchor="middle" className="tut-diagram-caption-sub">
        expand R to grow the window;  advance L to shrink it
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 11. Backtracking permutation tree.
// ---------------------------------------------------------------------------

function BacktrackingTree() {
  const W = 720, H = 380;
  // Three-level permutation tree
  const root = { label: '[ ]', x: W / 2, y: 40 };
  const lvl1 = [
    { label: '[a]', x: 120, y: 130 },
    { label: '[b]', x: 360, y: 130 },
    { label: '[c]', x: 600, y: 130 },
  ];
  const lvl2 = [
    { label: '[ab]', x: 60,  y: 230, p: 0 },
    { label: '[ac]', x: 180, y: 230, p: 0 },
    { label: '[ba]', x: 300, y: 230, p: 1 },
    { label: '[bc]', x: 420, y: 230, p: 1 },
    { label: '[ca]', x: 540, y: 230, p: 2 },
    { label: '[cb]', x: 660, y: 230, p: 2 },
  ];
  // Standard 6 permutation leaves, one per lvl2 parent.
  const leaves = ['abc', 'acb', 'bac', 'bca', 'cab', 'cba'];

  return (
    <DiagramFrame title="Backtracking — permutation search tree" viewBox={`0 0 ${W} ${H}`}>
      <NodeBox x={root.x - 30} y={root.y} w={60} h={36} label={root.label} variant="accent" />

      {lvl1.map((n, i) => (
        <g key={`l1-${i}`}>
          <NodeBox x={n.x - 30} y={n.y} w={60} h={36} label={n.label} />
          <line x1={root.x} y1={root.y + 36} x2={n.x} y2={n.y}
            className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
        </g>
      ))}

      {lvl2.map((n, i) => (
        <g key={`l2-${i}`}>
          <NodeBox x={n.x - 32} y={n.y} w={64} h={36} label={n.label} />
          <line x1={lvl1[n.p].x} y1={lvl1[n.p].y + 36} x2={n.x} y2={n.y}
            className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
        </g>
      ))}

      {leaves.map((s, i) => (
        <g key={`l3-${i}`}>
          <NodeBox x={lvl2[i].x - 32} y={330} w={64} h={36} label={`[${s}]`} variant="accent" />
          <line x1={lvl2[i].x} y1={lvl2[i].y + 36} x2={lvl2[i].x} y2={330}
            className="tut-diagram-line accent" markerEnd="url(#tutDiagramArrowAccent)" />
        </g>
      ))}
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 12. N-Queens 4x4 board.
// ---------------------------------------------------------------------------

function NQueensBoard() {
  const N = 4, CELL = 56, x0 = 220, y0 = 20;
  // a queen position per row for one valid solution
  const queens = [1, 3, 0, 2];
  const W = 720, H = N * CELL + 60;

  return (
    <DiagramFrame title="N-Queens — one valid 4×4 placement" viewBox={`0 0 ${W} ${H}`}>
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => {
          const isDark = (r + c) % 2 === 1;
          const isQueen = queens[r] === c;
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x0 + c * CELL}
                y={y0 + r * CELL}
                width={CELL}
                height={CELL}
                className={`tut-diagram-tile ${isDark ? 'dark' : 'light'}`}
              />
              {isQueen && (
                <circle
                  cx={x0 + c * CELL + CELL / 2}
                  cy={y0 + r * CELL + CELL / 2}
                  r={CELL / 3}
                  className="tut-diagram-queen"
                />
              )}
            </g>
          );
        })
      )}
      {/* labels */}
      <text x={x0 - 14} y={y0 + N * CELL / 2} textAnchor="end"
        className="tut-diagram-caption">rows 0..3</text>
      <text x={x0 + N * CELL / 2} y={y0 + N * CELL + 24} textAnchor="middle"
        className="tut-diagram-caption">columns 0..3</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 13. Singly linked list nodes (7 -> 3 -> 9 -> 1 -> null).
// ---------------------------------------------------------------------------

function LinkedListDiagram({ variant, values = [7, 3, 9, 1] }) {
  const W = 740, H = variant === 'doubly' ? 220 : 200;
  const NODE_W = 110, NODE_H = 56, GAP = 38, x0 = 50, y = variant === 'doubly' ? 80 : 60;

  return (
    <DiagramFrame
      title={
        variant === 'doubly' ? 'Doubly linked list (prev / next)' :
        variant === 'circular' ? 'Circular linked list (tail → head)' :
        'Singly linked list (next pointer)'
      }
      viewBox={`0 0 ${W} ${H}`}
    >
      {/* head label */}
      <text x={x0 + NODE_W / 2} y={y - 22} textAnchor="middle"
        className="tut-diagram-subhead">head</text>
      <line x1={x0 + NODE_W / 2} y1={y - 14} x2={x0 + NODE_W / 2} y2={y}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />

      {values.map((v, i) => {
        const nx = x0 + i * (NODE_W + GAP);
        return (
          <g key={i}>
            <rect x={nx} y={y} width={NODE_W} height={NODE_H} rx={6}
              className="tut-diagram-node" />
            {/* split into value cell + ptr cell */}
            <line x1={nx + NODE_W * 0.5} y1={y} x2={nx + NODE_W * 0.5} y2={y + NODE_H}
              className="tut-diagram-line dim" />
            <text x={nx + NODE_W * 0.25} y={y + NODE_H / 2 + 5}
              textAnchor="middle" className="tut-diagram-node-label">{v}</text>
            {/* next pointer marker */}
            <text x={nx + NODE_W * 0.75} y={y + NODE_H / 2 + 5}
              textAnchor="middle" className="tut-diagram-caption">next</text>

            {/* connector to next node */}
            {i < values.length - 1 && (
              <line
                x1={nx + NODE_W}
                y1={y + NODE_H / 2}
                x2={nx + NODE_W + GAP}
                y2={y + NODE_H / 2}
                className="tut-diagram-line"
                markerEnd="url(#tutDiagramArrow)"
              />
            )}

            {/* doubly variant: prev split */}
            {variant === 'doubly' && (
              <>
                <text x={nx + NODE_W * 0.25} y={y - 8} textAnchor="middle"
                  className="tut-diagram-caption">prev</text>
                {i > 0 && (
                  <line
                    x1={nx}
                    y1={y + NODE_H * 0.25}
                    x2={nx - GAP}
                    y2={y + NODE_H * 0.25}
                    className="tut-diagram-line"
                    markerEnd="url(#tutDiagramArrow)"
                  />
                )}
              </>
            )}
          </g>
        );
      })}

      {/* tail end */}
      {variant === 'circular' ? (
        <>
          {/* curve back from last node to first */}
          <path
            d={`M ${x0 + (values.length - 1) * (NODE_W + GAP) + NODE_W} ${y + NODE_H / 2}
                C ${x0 + (values.length - 1) * (NODE_W + GAP) + NODE_W + 30} ${y + NODE_H + 60},
                  ${x0 - 60} ${y + NODE_H + 60},
                  ${x0} ${y + NODE_H / 2}`}
            fill="none"
            className="tut-diagram-line accent"
            markerEnd="url(#tutDiagramArrowAccent)"
          />
          <text x={W / 2} y={y + NODE_H + 80} textAnchor="middle"
            className="tut-diagram-caption">tail.next → head</text>
        </>
      ) : (
        <text x={x0 + (values.length - 1) * (NODE_W + GAP) + NODE_W + 24}
          y={y + NODE_H / 2 + 5}
          className="tut-diagram-caption">null</text>
      )}

      {/* tail label */}
      {variant !== 'circular' && (
        <text x={x0 + (values.length - 1) * (NODE_W + GAP) + NODE_W / 2} y={y + NODE_H + 18}
          textAnchor="middle" className="tut-diagram-caption-sub">tail</text>
      )}
    </DiagramFrame>
  );
}

function SinglyLinkedListDiagram() {
  return <LinkedListDiagram variant="singly" />;
}
function DoublyLinkedListDiagram() {
  return <LinkedListDiagram variant="doubly" values={['A', 'B', 'C', 'D']} />;
}
function CircularLinkedListDiagram() {
  return <LinkedListDiagram variant="circular" values={['A', 'B', 'C']} />;
}

// ---------------------------------------------------------------------------
// 14. Cycle detection — acyclic vs cyclic.
// ---------------------------------------------------------------------------

function CycleDetectionDiagram() {
  const W = 720, H = 280;
  // left: acyclic chain ; right: cyclic chain with loop
  const RAD = 22, GAP = 56;

  // acyclic
  const ax0 = 40;
  const ay = 110;
  const aChain = ['s', '·', '·', '·', '·', '∅'];
  // cyclic
  const cx0 = 380;
  const cy = 90;
  const cChain = ['s', '·', '·', 'L', '·', '·'];

  return (
    <DiagramFrame title="Floyd cycle detection — acyclic vs cyclic" viewBox={`0 0 ${W} ${H}`}>
      <text x={ax0 + 90} y={50} className="tut-diagram-subhead">acyclic</text>
      {aChain.map((c, i) => {
        const cx = ax0 + i * GAP;
        return (
          <g key={`a-${i}`}>
            <circle cx={cx} cy={ay} r={RAD}
              className={`tut-diagram-circle ${c === '∅' ? 'dim' : ''}`} />
            <text x={cx} y={ay + 5} textAnchor="middle"
              className="tut-diagram-cell-text">{c}</text>
            {i < aChain.length - 1 && (
              <line x1={cx + RAD} y1={ay} x2={cx + GAP - RAD} y2={ay}
                className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
            )}
          </g>
        );
      })}
      <text x={ax0 + 90} y={ay + 60} className="tut-diagram-caption">
        slow / fast both walk off the end
      </text>

      {/* cyclic */}
      <text x={cx0 + 90} y={50} className="tut-diagram-subhead">cyclic</text>
      {cChain.map((c, i) => {
        const cx = cx0 + i * GAP;
        return (
          <g key={`c-${i}`}>
            <circle cx={cx} cy={cy} r={RAD}
              className={`tut-diagram-circle ${i >= 3 ? 'accent' : ''}`} />
            <text x={cx} y={cy + 5} textAnchor="middle"
              className="tut-diagram-cell-text">{c}</text>
            {i < cChain.length - 1 && (
              <line x1={cx + RAD} y1={cy} x2={cx + GAP - RAD} y2={cy}
                className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
            )}
          </g>
        );
      })}
      {/* loop arc from last back to L */}
      <path
        d={`M ${cx0 + 5 * GAP} ${cy + RAD}
            C ${cx0 + 5 * GAP} ${cy + RAD + 60},
              ${cx0 + 3 * GAP} ${cy + RAD + 60},
              ${cx0 + 3 * GAP} ${cy + RAD}`}
        fill="none"
        className="tut-diagram-line accent"
        markerEnd="url(#tutDiagramArrowAccent)"
      />
      <text x={cx0 + 4 * GAP} y={cy + RAD + 80} textAnchor="middle"
        className="tut-diagram-caption">slow and fast meet inside the loop</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 15. Stack push / pop visualization (before / after).
// ---------------------------------------------------------------------------

function StackPushPopDiagram() {
  const W = 640, H = 360;
  const cellH = 44, cellW = 110;
  const x1 = 100, x2 = 420;

  function Cells({ x, top, items, topLabel }) {
    return (
      <g>
        {items.map((v, i) => (
          <g key={i}>
            <rect x={x} y={top + i * cellH} width={cellW} height={cellH - 4} rx={4}
              className={`tut-diagram-node ${i === 0 ? 'accent' : ''}`} />
            <text x={x + cellW / 2} y={top + i * cellH + cellH / 2}
              textAnchor="middle" className="tut-diagram-node-label">{v}</text>
          </g>
        ))}
        <text x={x + cellW + 14} y={top + cellH / 2 + 5} className="tut-diagram-caption">
          {topLabel}
        </text>
        <text x={x + cellW + 14} y={top + (items.length - 1) * cellH + cellH / 2 + 5}
          className="tut-diagram-caption">bottom</text>
      </g>
    );
  }

  return (
    <DiagramFrame title="Stack — LIFO push / pop" viewBox={`0 0 ${W} ${H}`}>
      <text x={x1 + cellW / 2} y={30} textAnchor="middle" className="tut-diagram-subhead">
        push(4)
      </text>
      <Cells x={x1} top={60} items={[4, 3, 2, 1]} topLabel="top" />

      <text x={x2 + cellW / 2} y={30} textAnchor="middle" className="tut-diagram-subhead">
        pop() → 4
      </text>
      <Cells x={x2} top={60} items={[3, 2, 1]} topLabel="top" />

      {/* arrow between the two */}
      <line x1={x1 + cellW + 70} y1={170} x2={x2 - 14} y2={170}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 16. Min stack — main stack alongside min stack.
// ---------------------------------------------------------------------------

function MinStackDiagram() {
  const W = 600, H = 360;
  const cellH = 44, cellW = 110;
  const x1 = 110, x2 = 360;
  const main = [5, 3, 7, 1, 4];
  const mins = [1, 1, 1, 1, 4];

  return (
    <DiagramFrame title="Min stack — main + min mirror" viewBox={`0 0 ${W} ${H}`}>
      <text x={x1 + cellW / 2} y={30} textAnchor="middle" className="tut-diagram-subhead">
        main stack
      </text>
      <text x={x2 + cellW / 2} y={30} textAnchor="middle" className="tut-diagram-subhead">
        min stack
      </text>

      {main.map((v, i) => (
        <g key={`m-${i}`}>
          <rect x={x1} y={60 + i * cellH} width={cellW} height={cellH - 4} rx={4}
            className="tut-diagram-node" />
          <text x={x1 + cellW / 2} y={60 + i * cellH + cellH / 2}
            textAnchor="middle" className="tut-diagram-node-label">{v}</text>
        </g>
      ))}
      {mins.map((v, i) => (
        <g key={`mi-${i}`}>
          <rect x={x2} y={60 + i * cellH} width={cellW} height={cellH - 4} rx={4}
            className="tut-diagram-node accent" />
          <text x={x2 + cellW / 2} y={60 + i * cellH + cellH / 2}
            textAnchor="middle" className="tut-diagram-node-label">{v}</text>
        </g>
      ))}

      <text x={W / 2} y={310} textAnchor="middle" className="tut-diagram-caption">
        getMin() = top of min stack = {mins[0]}
      </text>
      <text x={W / 2} y={330} textAnchor="middle" className="tut-diagram-caption-sub">
        each level on the right stores the min of all entries below it
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 17. Queue — head / tail with arrows.
// ---------------------------------------------------------------------------

function QueueDiagram() {
  const W = 700, H = 220;
  const cellW = 76, cellH = 60, x0 = 80, y = 80;
  const data = [1, 2, 3, 4, 5];

  return (
    <DiagramFrame title="Queue — FIFO" viewBox={`0 0 ${W} ${H}`}>
      <text x={x0 - 30} y={y + cellH / 2 + 5} textAnchor="end"
        className="tut-diagram-subhead">dequeue</text>
      <line x1={x0 - 20} y1={y + cellH / 2} x2={x0 - 4} y2={y + cellH / 2}
        className="tut-diagram-line" markerStart="url(#tutDiagramArrow)" />

      {data.map((v, i) => (
        <g key={i}>
          <rect x={x0 + i * cellW} y={y} width={cellW - 6} height={cellH} rx={4}
            className={`tut-diagram-cell ${i === 0 || i === data.length - 1 ? 'accent' : ''}`} />
          <text x={x0 + i * cellW + (cellW - 6) / 2} y={y + cellH / 2 + 5}
            textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
        </g>
      ))}

      <text x={x0 + (cellW - 6) / 2} y={y + cellH + 22} textAnchor="middle"
        className="tut-diagram-caption">head</text>
      <text x={x0 + (data.length - 1) * cellW + (cellW - 6) / 2} y={y + cellH + 22}
        textAnchor="middle" className="tut-diagram-caption">tail</text>

      <line x1={x0 + data.length * cellW + 4} y1={y + cellH / 2}
        x2={x0 + data.length * cellW + 30} y2={y + cellH / 2}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <text x={x0 + data.length * cellW + 40} y={y + cellH / 2 + 5}
        className="tut-diagram-subhead">enqueue</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 18. Deque — both ends.
// ---------------------------------------------------------------------------

function DequeDiagram() {
  const W = 740, H = 240;
  const cellW = 78, cellH = 60, x0 = 130, y = 90;
  const data = ['A', 'B', 'C', 'D', 'E'];

  return (
    <DiagramFrame title="Deque — both ends" viewBox={`0 0 ${W} ${H}`}>
      <line x1={x0 - 70} y1={y + 18} x2={x0 - 4} y2={y + 18}
        className="tut-diagram-line accent" markerStart="url(#tutDiagramArrowAccent)" />
      <text x={x0 - 60} y={y + 10} className="tut-diagram-caption accent">popFront</text>
      <line x1={x0 - 4} y1={y + 44} x2={x0 - 70} y2={y + 44}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <text x={x0 - 60} y={y + 60} className="tut-diagram-caption">pushFront</text>

      {data.map((v, i) => (
        <g key={i}>
          <rect x={x0 + i * cellW} y={y} width={cellW - 6} height={cellH} rx={4}
            className="tut-diagram-cell" />
          <text x={x0 + i * cellW + (cellW - 6) / 2} y={y + cellH / 2 + 5}
            textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
        </g>
      ))}

      <text x={x0 + (cellW - 6) / 2} y={y + cellH + 22} textAnchor="middle"
        className="tut-diagram-caption">front</text>
      <text x={x0 + (data.length - 1) * cellW + (cellW - 6) / 2} y={y + cellH + 22}
        textAnchor="middle" className="tut-diagram-caption">back</text>

      <line x1={x0 + data.length * cellW + 4} y1={y + 18}
        x2={x0 + data.length * cellW + 70} y2={y + 18}
        className="tut-diagram-line" markerEnd="url(#tutDiagramArrow)" />
      <text x={x0 + data.length * cellW + 16} y={y + 10}
        className="tut-diagram-caption">pushBack</text>

      <line x1={x0 + data.length * cellW + 70} y1={y + 44}
        x2={x0 + data.length * cellW + 4} y2={y + 44}
        className="tut-diagram-line accent" markerEnd="url(#tutDiagramArrowAccent)" />
      <text x={x0 + data.length * cellW + 16} y={y + 60}
        className="tut-diagram-caption accent">popBack</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 19. Binary tree with levels.
// ---------------------------------------------------------------------------

function BinaryTreeLevelsDiagram() {
  const W = 680, H = 360;
  const nodes = [
    { id: 1, x: W / 2, y: 40, lvl: 0 },
    { id: 2, x: W / 2 - 160, y: 130, lvl: 1, parent: 1 },
    { id: 3, x: W / 2 + 160, y: 130, lvl: 1, parent: 1 },
    { id: 4, x: W / 2 - 220, y: 220, lvl: 2, parent: 2 },
    { id: 5, x: W / 2 - 100, y: 220, lvl: 2, parent: 2 },
    { id: 6, x: W / 2 + 220, y: 220, lvl: 2, parent: 3 },
    { id: 7, x: W / 2 + 160, y: 310, lvl: 3, parent: 6 },
  ];
  const R = 22;

  return (
    <DiagramFrame title="Binary tree — depth / level" viewBox={`0 0 ${W} ${H}`}>
      {/* edges first */}
      {nodes.filter(n => n.parent).map(n => {
        const p = nodes.find(x => x.id === n.parent);
        return (
          <line key={`e-${n.id}`} x1={p.x} y1={p.y + R} x2={n.x} y2={n.y - R}
            className="tut-diagram-line" />
        );
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={R} className="tut-diagram-circle" />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            className="tut-diagram-cell-text">{n.id}</text>
        </g>
      ))}
      {/* level labels */}
      {[0, 1, 2, 3].map(l => (
        <text key={l} x={30} y={40 + l * 90 + 5}
          className="tut-diagram-caption">level {l}</text>
      ))}
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 20. BFS / DFS visit order on a small tree.
// ---------------------------------------------------------------------------

function BfsDfsTreeDiagram() {
  const W = 720, H = 320;
  // Same shape: root A with B, C children; B has D, E; C has F, G
  const nodes = [
    { id: 'A', x: W / 2, y: 40 },
    { id: 'B', x: W / 2 - 140, y: 130 },
    { id: 'C', x: W / 2 + 140, y: 130 },
    { id: 'D', x: W / 2 - 200, y: 230 },
    { id: 'E', x: W / 2 - 80, y: 230 },
    { id: 'F', x: W / 2 + 80, y: 230 },
    { id: 'G', x: W / 2 + 200, y: 230 },
  ];
  const edges = [['A','B'],['A','C'],['B','D'],['B','E'],['C','F'],['C','G']];
  const R = 22;

  const bfsOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const dfsOrder = ['A', 'B', 'D', 'E', 'C', 'F', 'G'];

  return (
    <DiagramFrame title="BFS vs DFS visit order" viewBox={`0 0 ${W} ${H}`}>
      {edges.map(([a, b], i) => {
        const A = nodes.find(n => n.id === a);
        const B = nodes.find(n => n.id === b);
        return (
          <line key={i} x1={A.x} y1={A.y + R} x2={B.x} y2={B.y - R}
            className="tut-diagram-line" />
        );
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={R} className="tut-diagram-circle accent" />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            className="tut-diagram-cell-text">{n.id}</text>
        </g>
      ))}
      <text x={40}  y={290} className="tut-diagram-subhead">BFS:</text>
      <text x={100} y={290} className="tut-diagram-caption">{bfsOrder.join(' → ')}</text>
      <text x={40}  y={308} className="tut-diagram-subhead">DFS:</text>
      <text x={100} y={308} className="tut-diagram-caption">{dfsOrder.join(' → ')}</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 21. BST with sorted in-order.
// ---------------------------------------------------------------------------

function BstDiagram() {
  const W = 680, H = 360;
  const nodes = [
    { v: 8,  x: W / 2,        y: 40,  parent: null },
    { v: 3,  x: W / 2 - 170,  y: 130, parent: 8 },
    { v: 10, x: W / 2 + 170,  y: 130, parent: 8 },
    { v: 1,  x: W / 2 - 240,  y: 220, parent: 3 },
    { v: 6,  x: W / 2 - 100,  y: 220, parent: 3 },
    { v: 14, x: W / 2 + 240,  y: 220, parent: 10 },
    { v: 4,  x: W / 2 - 140,  y: 290, parent: 6 },
    { v: 7,  x: W / 2 - 60,   y: 290, parent: 6 },
    { v: 13, x: W / 2 + 200,  y: 290, parent: 14 },
  ];
  const R = 20;

  return (
    <DiagramFrame title="BST — in-order traversal is sorted" viewBox={`0 0 ${W} ${H}`}>
      {nodes.filter(n => n.parent != null).map((n, i) => {
        const p = nodes.find(x => x.v === n.parent);
        return (
          <line key={i} x1={p.x} y1={p.y + R} x2={n.x} y2={n.y - R}
            className="tut-diagram-line" />
        );
      })}
      {nodes.map(n => (
        <g key={n.v}>
          <circle cx={n.x} cy={n.y} r={R} className="tut-diagram-circle" />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            className="tut-diagram-cell-text">{n.v}</text>
        </g>
      ))}
      <text x={W / 2} y={340} textAnchor="middle"
        className="tut-diagram-caption">in-order:  1 · 3 · 4 · 6 · 7 · 8 · 10 · 13 · 14</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 22. Heap — tree + array layout pairing.
// ---------------------------------------------------------------------------

function HeapDiagram() {
  const W = 720, H = 380;
  const tree = [
    { v: 10, x: 200, y: 30 },
    { v: 15, x: 110, y: 110, p: 0 },
    { v: 20, x: 300, y: 110, p: 0 },
    { v: 17, x: 60,  y: 190, p: 1 },
    { v: 25, x: 150, y: 190, p: 1 },
    { v: 30, x: 260, y: 190, p: 2 },
    { v: 40, x: 350, y: 190, p: 2 },
  ];
  const R = 22;
  const arr = [10, 15, 20, 17, 25, 30, 40];
  const cellW = 54, cellH = 40, ax0 = 60, ay = 280;

  return (
    <DiagramFrame title="Heap — tree shape + flat array" viewBox={`0 0 ${W} ${H}`}>
      {tree.filter(n => n.p != null).map((n, i) => {
        const p = tree[n.p];
        return (
          <line key={`e-${i}`} x1={p.x} y1={p.y + R} x2={n.x} y2={n.y - R}
            className="tut-diagram-line" />
        );
      })}
      {tree.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={R}
            className={`tut-diagram-circle ${i === 0 ? 'accent' : ''}`} />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            className="tut-diagram-cell-text">{n.v}</text>
        </g>
      ))}

      {/* array layout below */}
      {arr.map((v, i) => (
        <g key={`a-${i}`}>
          <rect x={ax0 + i * cellW} y={ay} width={cellW - 4} height={cellH} rx={3}
            className="tut-diagram-cell" />
          <text x={ax0 + i * cellW + (cellW - 4) / 2} y={ay + cellH / 2 + 4}
            textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
          <text x={ax0 + i * cellW + (cellW - 4) / 2} y={ay - 6}
            textAnchor="middle" className="tut-diagram-caption">{i}</text>
        </g>
      ))}

      <text x={W - 220} y={ay + cellH / 2 + 4} className="tut-diagram-caption">
        parent(i) = (i-1)/2
      </text>
      <text x={W - 220} y={ay + cellH / 2 + 22} className="tut-diagram-caption">
        children: 2i+1, 2i+2
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 23. Topological sort — prerequisite graph.
// ---------------------------------------------------------------------------

function TopoSortDiagram() {
  const W = 700, H = 320;
  const nodes = [
    { id: 'socks', x: 60,  y: 70 },
    { id: 'pants', x: 60,  y: 180 },
    { id: 'shirt', x: 60,  y: 270 },
    { id: 'shoes', x: 300, y: 130 },
    { id: 'tie',   x: 540, y: 200 },
  ];
  const edges = [
    ['socks', 'shoes'], ['pants', 'shoes'],
    ['shoes', 'tie'], ['shirt', 'tie'],
  ];
  const R = 32;

  return (
    <DiagramFrame title="Topological sort — prerequisite DAG" viewBox={`0 0 ${W} ${H}`}>
      {edges.map(([a, b], i) => {
        const A = nodes.find(n => n.id === a);
        const B = nodes.find(n => n.id === b);
        // shorten by R on both ends so arrowheads sit cleanly
        const dx = B.x - A.x, dy = B.y - A.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        return (
          <line
            key={i}
            x1={A.x + ux * R} y1={A.y + uy * R}
            x2={B.x - ux * R} y2={B.y - uy * R}
            className="tut-diagram-line"
            markerEnd="url(#tutDiagramArrow)"
          />
        );
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <ellipse cx={n.x} cy={n.y} rx={R + 8} ry={R - 6}
            className="tut-diagram-circle accent" />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            className="tut-diagram-cell-text">{n.id}</text>
        </g>
      ))}
      <text x={W / 2} y={300} textAnchor="middle" className="tut-diagram-caption">
        valid order:  socks · pants · shirt · shoes · tie
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 24. Weighted graph (used by Dijkstra and Bellman-Ford illustrations).
// ---------------------------------------------------------------------------

function WeightedGraphDiagram() {
  const W = 600, H = 320;
  const nodes = [
    { id: 'A', x: 80,  y: 160 },
    { id: 'B', x: 220, y: 60 },
    { id: 'C', x: 220, y: 260 },
    { id: 'D', x: 380, y: 60 },
    { id: 'E', x: 380, y: 260 },
  ];
  const edges = [
    { a: 'A', b: 'B', w: 2 },
    { a: 'A', b: 'C', w: 5 },
    { a: 'B', b: 'C', w: 1 },
    { a: 'B', b: 'D', w: 4 },
    { a: 'C', b: 'E', w: 2 },
    { a: 'D', b: 'E', w: 3 },
  ];
  const R = 24;

  return (
    <DiagramFrame title="Weighted graph" viewBox={`0 0 ${W} ${H}`}>
      {edges.map((e, i) => {
        const A = nodes.find(n => n.id === e.a);
        const B = nodes.find(n => n.id === e.b);
        return (
          <g key={i}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              className="tut-diagram-line" />
            <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2 - 6}
              textAnchor="middle" className="tut-diagram-caption accent">
              {e.w}
            </text>
          </g>
        );
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={R}
            className={`tut-diagram-circle ${n.id === 'A' ? 'accent' : ''}`} />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            className="tut-diagram-cell-text">{n.id}</text>
        </g>
      ))}
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 25. DSU forest before and after unions.
// ---------------------------------------------------------------------------

function DsuForestDiagram() {
  const W = 720, H = 280;
  // After union(0,1), union(2,3), union(0,2): tree { 0 -> 1, 2; 2 -> 3 }
  const trees = [
    { root: 0, x: 120, levels: [
      [{ v: 0, x: 0 }],
      [{ v: 1, x: -50 }, { v: 2, x: 50 }],
      [{ v: 3, x: 50 }],
    ] },
  ];
  const singletons = [4, 5, 6, 7];
  const R = 22;

  return (
    <DiagramFrame title="DSU forest after some unions" viewBox={`0 0 ${W} ${H}`}>
      {trees.map((t, ti) => (
        <g key={ti}>
          {t.levels.map((level, lvl) =>
            level.map((n, i) => {
              const cx = t.x + n.x;
              const cy = 50 + lvl * 80;
              return (
                <g key={`${lvl}-${i}`}>
                  <circle cx={cx} cy={cy} r={R}
                    className={`tut-diagram-circle ${lvl === 0 ? 'accent' : ''}`} />
                  <text x={cx} y={cy + 5} textAnchor="middle"
                    className="tut-diagram-cell-text">{n.v}</text>
                </g>
              );
            })
          )}
          {/* edges hard-coded: 0->1, 0->2, 2->3 */}
          <line x1={t.x}      y1={50 + R} x2={t.x - 50} y2={130 - R}
            className="tut-diagram-line" />
          <line x1={t.x}      y1={50 + R} x2={t.x + 50} y2={130 - R}
            className="tut-diagram-line" />
          <line x1={t.x + 50} y1={130 + R} x2={t.x + 50} y2={210 - R}
            className="tut-diagram-line" />
        </g>
      ))}

      {singletons.map((v, i) => (
        <g key={`s-${i}`}>
          <circle cx={340 + i * 80} cy={80} r={R} className="tut-diagram-circle" />
          <text x={340 + i * 80} y={85} textAnchor="middle"
            className="tut-diagram-cell-text">{v}</text>
        </g>
      ))}
      <text x={420} y={150} textAnchor="middle"
        className="tut-diagram-caption">still singletons</text>
      <text x={420} y={230} textAnchor="middle"
        className="tut-diagram-caption-sub">find(3) walks 3 → 2 → 0</text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 26. Huffman tree.
// ---------------------------------------------------------------------------

function HuffmanTreeDiagram() {
  const W = 700, H = 380;
  // Hand-laid layout matching the lesson's example.
  const nodes = [
    { id: 'root', x: 350, y: 30,  v: 100, leaf: false },
    { id: 'F',    x: 200, y: 130, v: 45,  leaf: true,  sym: 'F' },
    { id: '55',   x: 500, y: 130, v: 55,  leaf: false },
    { id: '25',   x: 410, y: 220, v: 25,  leaf: false },
    { id: '30',   x: 590, y: 220, v: 30,  leaf: false },
    { id: 'C',    x: 360, y: 310, v: 12,  leaf: true,  sym: 'C' },
    { id: 'D',    x: 460, y: 310, v: 13,  leaf: true,  sym: 'D' },
    { id: '14',   x: 540, y: 310, v: 14,  leaf: false },
    { id: 'E',    x: 640, y: 310, v: 16,  leaf: true,  sym: 'E' },
  ];
  const edges = [
    ['root', 'F'], ['root', '55'],
    ['55', '25'], ['55', '30'],
    ['25', 'C'], ['25', 'D'],
    ['30', '14'], ['30', 'E'],
  ];

  return (
    <DiagramFrame title="Huffman tree — frequent symbols near the root" viewBox={`0 0 ${W} ${H}`}>
      {edges.map(([a, b], i) => {
        const A = nodes.find(n => n.id === a);
        const B = nodes.find(n => n.id === b);
        return (
          <line key={i} x1={A.x} y1={A.y + 24} x2={B.x} y2={B.y - 24}
            className="tut-diagram-line" />
        );
      })}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.leaf ? 24 : 26}
            className={`tut-diagram-circle ${n.leaf ? 'accent' : ''}`} />
          <text x={n.x} y={n.y - 2} textAnchor="middle"
            className="tut-diagram-cell-text">
            {n.leaf ? n.sym : n.v}
          </text>
          {n.leaf && (
            <text x={n.x} y={n.y + 12} textAnchor="middle"
              className="tut-diagram-caption-sub">:{n.v}</text>
          )}
        </g>
      ))}
      <text x={W / 2} y={360} textAnchor="middle" className="tut-diagram-caption">
        F=0 · C=100 · D=101 · A=1100 · B=1101 · E=111
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// 27. DP table grid (knapsack-style) — header axes + filled cells.
// ---------------------------------------------------------------------------

function DpTableDiagram() {
  const W = 640, H = 320;
  const grid = [
    [0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1],
    [0, 1, 6, 7, 7, 7],
    [0, 1, 6, 7, 8, 9],
  ];
  const cellW = 70, cellH = 50, x0 = 90, y0 = 60;

  return (
    <DiagramFrame title="DP table — fill row by row" viewBox={`0 0 ${W} ${H}`}>
      {grid[0].map((_, j) => (
        <text key={`j-${j}`} x={x0 + j * cellW + cellW / 2} y={y0 - 12}
          textAnchor="middle" className="tut-diagram-caption">j={j}</text>
      ))}
      {grid.map((row, i) => (
        <g key={`r-${i}`}>
          <text x={x0 - 10} y={y0 + i * cellH + cellH / 2 + 4}
            textAnchor="end" className="tut-diagram-caption">i={i}</text>
          {row.map((v, j) => (
            <g key={`c-${i}-${j}`}>
              <rect x={x0 + j * cellW} y={y0 + i * cellH}
                width={cellW - 4} height={cellH - 4} rx={3}
                className={`tut-diagram-cell ${v > 0 ? 'highlight' : 'dim'}`} />
              <text x={x0 + j * cellW + (cellW - 4) / 2}
                y={y0 + i * cellH + cellH / 2 + 4}
                textAnchor="middle" className="tut-diagram-cell-text">{v}</text>
            </g>
          ))}
        </g>
      ))}
      <text x={W / 2} y={290} textAnchor="middle" className="tut-diagram-caption-sub">
        each cell depends only on cells already filled above
      </text>
    </DiagramFrame>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher — single default export so react-refresh stays happy.
// ---------------------------------------------------------------------------

const COMPONENTS = {
  StdinCodeStdoutFlow,
  IfElseBranchFlow,
  ForLoopFlow,
  WhileLoopFlow,
  ClassToInstancesFlow,
  SpaceBucketsDiagram,
  RecursionCallTree,
  SearchFamiliesDiagram,
  BinarySearchSteps,
  SlidingWindowPointers,
  BacktrackingTree,
  NQueensBoard,
  SinglyLinkedListDiagram,
  DoublyLinkedListDiagram,
  CircularLinkedListDiagram,
  CycleDetectionDiagram,
  StackPushPopDiagram,
  MinStackDiagram,
  QueueDiagram,
  DequeDiagram,
  BinaryTreeLevelsDiagram,
  BfsDfsTreeDiagram,
  BstDiagram,
  HeapDiagram,
  TopoSortDiagram,
  WeightedGraphDiagram,
  DsuForestDiagram,
  HuffmanTreeDiagram,
  DpTableDiagram,
};

export default function TutorialDiagram({ name }) {
  if (!TUT_DIAGRAM_NAMES.has(name)) return null;
  const Comp = COMPONENTS[name];
  if (!Comp) return null;
  return <Comp />;
}
