// Generic frame builder. For any problem with test_cases + params, generates a
// minimal visualization that steps through each test case: shows inputs as
// labeled chips, then the expected output. Better than an empty Visualize tab.
//
// Returns { renderer, frames } or null if the problem can't be rendered this
// way (no test_cases, no params, or shape unsupported).

function parseValue(str) {
  if (typeof str !== 'string') return str;
  const s = str.trim();
  if (s === '') return s;
  // Try JSON first; fall back to raw string.
  try { return JSON.parse(s); } catch { return s; }
}

function looksLikeArray(v) {
  return Array.isArray(v) && v.every(x => typeof x === 'number' || typeof x === 'string');
}

function valueToCells(v, role = 'default') {
  if (looksLikeArray(v)) {
    return v.map(x => ({ value: x, role }));
  }
  return [{ value: String(v), role }];
}

export function buildGenericTestCaseFrames(problem) {
  if (!problem) return null;
  const tcs = Array.isArray(problem.test_cases) ? problem.test_cases : [];
  if (!tcs.length) return null;
  const params = Array.isArray(problem.params) ? problem.params : [];

  const frames = [];
  const slice = tcs.slice(0, Math.min(tcs.length, 10));

  slice.forEach((tc, i) => {
    const inputs = Array.isArray(tc.inputs) ? tc.inputs : [];
    const expected = tc.expected ?? tc.output ?? tc.out ?? '';

    // Frame: show inputs
    const paramLines = inputs.map((raw, j) => {
      const name = params[j]?.name || `arg${j}`;
      return `${name} = ${typeof raw === 'string' ? raw : JSON.stringify(raw)}`;
    });
    const firstArr = inputs.find(s => {
      const v = parseValue(s);
      return looksLikeArray(v);
    });
    const cellsIn = firstArr
      ? valueToCells(parseValue(firstArr), 'highlight')
      : [{ value: paramLines[0] || '(empty)', role: 'highlight' }];

    frames.push({
      cells: cellsIn,
      caption: `Test case ${i + 1} of ${slice.length} — Input: ${paramLines.join(', ') || '(none)'}`,
    });

    // Frame: show expected output
    const expV = parseValue(expected);
    const cellsOut = looksLikeArray(expV)
      ? valueToCells(expV, 'matched')
      : [{ value: String(expected), role: 'matched' }];

    frames.push({
      cells: cellsOut,
      caption: `Test case ${i + 1} — Expected output: ${typeof expected === 'string' ? expected : JSON.stringify(expected)}`,
    });
  });

  if (!frames.length) return null;

  return {
    title: `Test case walkthrough (${slice.length} of ${tcs.length} shown)`,
    renderer: 'array',
    frames,
    isGeneric: true,
  };
}
