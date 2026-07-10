// Generic frame builder. For any problem with test_cases + params, generates a
// visual walkthrough: each test case renders its most-visual input (a string as
// per-character cells, a flat array as value cells) and its expected output as
// cells, with the full input/output in the caption. Falls back to a labeled chip
// only when nothing is cell-renderable. Beats an empty Visualize tab AND the old
// text-only dump.
//
// Returns { renderer, frames } or null if the problem can't be rendered this way.

function parseValue(str) {
  if (typeof str !== 'string') return str;
  const s = str.trim();
  if (s === '') return s;
  try { return JSON.parse(s); } catch { return s; }
}

function looksLikeFlatArray(v) {
  return Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'number' || typeof x === 'string' || typeof x === 'boolean');
}

// A row of cells for a value, or null if it can't be shown as cells cleanly.
function toCells(raw, role) {
  const v = parseValue(raw);
  if (looksLikeFlatArray(v)) {
    if (v.length > 24) return null; // too wide — leave to the caption
    return v.map(x => ({ value: typeof x === 'boolean' ? String(x) : x, role }));
  }
  // a plain string → one cell per character (skip if empty / too long)
  if (typeof v === 'string' && v.length >= 1 && v.length <= 32) {
    return v.split('').map(ch => ({ value: ch, role }));
  }
  return null;
}

const fmt = (raw) => (typeof raw === 'string' ? raw : JSON.stringify(raw));

export function buildGenericTestCaseFrames(problem) {
  if (!problem) return null;
  const tcs = Array.isArray(problem.test_cases) ? problem.test_cases : [];
  if (!tcs.length) return null;
  const params = Array.isArray(problem.params) ? problem.params : [];

  const frames = [];
  const slice = tcs.slice(0, Math.min(tcs.length, 8));

  slice.forEach((tc, i) => {
    const inputs = Array.isArray(tc.inputs) ? tc.inputs : [];
    const expected = tc.expected ?? tc.output ?? tc.out ?? '';
    const paramLines = inputs.map((raw, j) => `${params[j]?.name || `arg${j}`} = ${fmt(raw)}`);

    // Input frame: render the first cell-able param (prefer a flat array, else a string).
    let cellsIn = null, shownName = '';
    // pass 1: prefer arrays
    for (let j = 0; j < inputs.length && !cellsIn; j++) {
      const v = parseValue(inputs[j]);
      if (looksLikeFlatArray(v)) { cellsIn = toCells(inputs[j], 'highlight'); shownName = params[j]?.name || `arg${j}`; }
    }
    // pass 2: fall back to a string
    for (let j = 0; j < inputs.length && !cellsIn; j++) {
      const c = toCells(inputs[j], 'highlight');
      if (c) { cellsIn = c; shownName = params[j]?.name || `arg${j}`; }
    }
    frames.push({
      cells: cellsIn || [{ value: paramLines[0] || '(empty)', role: 'highlight' }],
      caption: `Case ${i + 1}/${slice.length} · ${shownName ? shownName + ' visualized. ' : ''}Input: ${paramLines.join(', ') || '(none)'}`,
    });

    // Output frame: render the expected value as cells when possible.
    const cellsOut = toCells(fmt(expected).replace(/^"|"$/g, ''), 'matched') || [{ value: String(expected), role: 'matched' }];
    frames.push({
      cells: cellsOut,
      caption: `Case ${i + 1}/${slice.length} · Expected output: ${fmt(expected)}`,
    });
  });

  if (!frames.length) return null;

  return {
    title: `Worked examples (${slice.length} of ${tcs.length})`,
    renderer: 'array',
    frames,
    isGeneric: true,
  };
}
