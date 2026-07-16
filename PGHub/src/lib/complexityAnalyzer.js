// Static Big-O estimator — the "black box" that reads a solution and estimates its
// time and space complexity without running an LLM. It is a fast, readable heuristic
// (not a proof): it measures maximum nested-loop depth, detects recursion / divide-
// and-conquer, sorting, and the auxiliary data structures allocated. Used both for the
// user's submission and (as the "optimal" baseline) for the problem's canonical, so the
// beats% can be derived purely from how the two compare — no per-problem stored data.

const ORDER = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(n^3)', 'O(2^n)', 'O(n!)'];
export const complexityRank = (c) => { const i = ORDER.indexOf(c); return i < 0 ? 2 : i; };

// strip line/block comments and string/char literals so keywords inside them don't count
function sanitize(code, language) {
  let s = String(code || '');
  if (language === 'python') {
    s = s.replace(/'''[\s\S]*?'''/g, ' ').replace(/"""[\s\S]*?"""/g, ' ');
    s = s.replace(/#.*$/gm, ' ');
  } else {
    s = s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
  }
  s = s.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return s;
}

// Maximum depth of NESTED loops. For brace languages we track a stack of brace-depths at
// which a loop opened; for Python we use indentation of for/while lines.
function maxLoopDepth(code, language) {
  const loopRe = language === 'python' ? /^(\s*)(for|while)\b/ : null;
  if (language === 'python') {
    const lines = code.split('\n');
    let max = 0; const stack = []; // indentation levels of active loops
    for (const line of lines) {
      const m = line.match(/^(\s*)\S/); if (!m) continue;
      const indent = m[1].replace(/\t/g, '    ').length;
      while (stack.length && indent <= stack[stack.length - 1]) stack.pop();
      if (loopRe.test(line)) { stack.push(indent); max = Math.max(max, stack.length); }
    }
    return max;
  }
  // brace languages: scan tokens, remember the brace-depth where each loop body opened
  let depth = 0, braceMax = 0; const loopDepths = [];
  const toks = code.split(/(\{|\}|\bfor\b|\bwhile\b|\bdo\b)/);
  let pendingLoop = false;
  for (const t of toks) {
    if (t === 'for' || t === 'while' || t === 'do') { pendingLoop = true; }
    else if (t === '{') { depth++; if (pendingLoop) { loopDepths.push(depth); pendingLoop = false; braceMax = Math.max(braceMax, loopDepths.length); } }
    else if (t === '}') { depth--; while (loopDepths.length && loopDepths[loopDepths.length - 1] > depth) loopDepths.pop(); }
  }
  // Braceless single-statement loops (`for(...) for(...) stmt;`) never open a `{`, so the
  // brace scan misses them. Catch adjacent loop-header chains textually and take the max.
  let adjMax = 0;
  // loop header allows `;` and one level of nested parens (a.size(), f(x)) inside ( ).
  const LH = '(?:for|while)\\s*\\((?:[^()]|\\([^()]*\\))*\\)\\s*';
  const chains = code.match(new RegExp('(?:' + LH + '){2,}', 'g')) || [];
  for (const ch of chains) adjMax = Math.max(adjMax, (ch.match(/\b(?:for|while)\b/g) || []).length);
  const anyLoop = /\b(?:for|while)\b/.test(code) ? 1 : 0;
  return Math.max(braceMax, adjMax, anyLoop);
}

function detectRecursion(code, methodName) {
  if (!methodName) return false;
  const calls = (code.match(new RegExp('\\b' + methodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(', 'g')) || []).length;
  // definition counts as 1 occurrence; >1 means it calls itself (or a helper does)
  const helperSelfCall = /\b(dfs|dfs2|solve|helper|rec|recur|backtrack|go|walk|traverse)\s*\([^)]*\)[\s\S]*?\b(dfs|dfs2|solve|helper|rec|recur|backtrack|go|walk|traverse)\s*\(/.test(code);
  return calls > 1 || helperSelfCall;
}

// Estimate auxiliary space from allocated structures + recursion stack.
function estimateSpace(code, language, loopDepth, recursion) {
  const has = (re) => re.test(code);
  const twoD = has(/\[\s*\[.*\]\s*\]/) || has(/vector<\s*vector<|int\[\]\[\]|List<List<|\bnew\s+\w+\[[^\]]+\]\[[^\]]+\]/) || has(/\[\[0\]\s*\*|\bfor\b.*\bfor\b.*append/);
  const oneD = has(/\bset\(|\bdict\(|\{\}|\bmap\b|\bnew\s+(HashMap|HashSet|ArrayList|int\[|Integer\[|boolean\[|List)|unordered_map|unordered_set|\bvector<|\bdeque\b|\bstack\b|\bqueue\b|Counter\(|defaultdict\(|\.push\(|\.add\(|\.append\(/);
  if (twoD) return 'O(n^2)';
  if (oneD) return 'O(n)';
  if (recursion) return 'O(n)'; // recursion stack
  return 'O(1)';
}

// Main entry. Returns { time, space, approach, notes }.
export function analyzeComplexity(code, language = 'python', methodName = '') {
  const src = sanitize(code, language);
  const depth = maxLoopDepth(src, language);
  const recursion = detectRecursion(src, methodName);
  const hasSort = /\.sort\s*\(|\bsorted\s*\(|Arrays\.sort|Collections\.sort|sort\s*\(\s*\w+\.begin/.test(src);
  const halving = /(mid|lo|hi|left|right)\b[\s\S]*?(\/\/?\s*2|>>\s*1|\+\s*\w+\)\s*\/\s*2)/.test(src) && /while|for/.test(src);
  const twoRecCalls = recursion && (code.match(/\breturn\b[^;\n]*[+*][^;\n]*\(/) || []).length > 0;

  let time;
  if (depth >= 3) time = 'O(n^3)';
  else if (depth === 2) time = 'O(n^2)';
  else if (twoRecCalls && depth === 0 && !halving) time = 'O(2^n)';
  else if (depth === 1 && hasSort) time = 'O(n^2)';
  else if (hasSort) time = 'O(n log n)';
  else if (depth <= 1 && halving) time = 'O(log n)'; // single loop / recursion that halves the range
  else if (recursion && halving) time = 'O(log n)';
  else if (depth === 1 || recursion) time = 'O(n)';
  else time = 'O(1)';

  const space = estimateSpace(src, language, depth, recursion);

  // coarse "approach" tags from structures used
  const approach = [];
  if (/\bset\(|HashSet|unordered_set/.test(src)) approach.push('Hash Set');
  if (/\bdict\(|\{\}|HashMap|unordered_map|Counter\(|defaultdict\(/.test(src)) approach.push('Hash Table');
  if (hasSort) approach.push('Sorting');
  if (/heapq|PriorityQueue|priority_queue/.test(src)) approach.push('Heap');
  if (recursion) approach.push(halving ? 'Binary Search / D&C' : 'Recursion');
  if (/\bdp\b|memo|cache|\[0\]\s*\*/.test(src)) approach.push('Dynamic Programming');
  if (depth >= 1 && !approach.length) approach.push(depth >= 2 ? 'Brute Force' : 'Single Pass');
  if (!approach.length) approach.push('Array');

  return { time, space, approach, loopDepth: depth, recursion };
}

// Compare a submission to the optimal baseline and produce display stats. `seed` (the
// submission source) makes the beats% deterministic per-submission but varied.
export function compareToOptimal(user, optimal, seed = '') {
  const ut = complexityRank(user.time), ot = complexityRank(optimal.time);
  const us = complexityRank(user.space), os = complexityRank(optimal.space);
  const timeGap = Math.max(0, ut - ot);   // how many tiers worse than optimal
  const spaceGap = Math.max(0, us - os);

  // deterministic jitter in [0,1) from the code, so the same submission always shows the
  // same number but different submissions differ.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const jitter = (n) => (((h >>> (n * 4)) & 0xff) / 255);

  // optimal tier -> high band (78-97), each worse tier drops ~22 pts, with jitter.
  const band = (gap, j) => {
    const top = Math.max(6, 94 - gap * 24);
    const bottom = Math.max(3, top - 16);
    return Math.round(bottom + (top - bottom) * j);
  };
  const beatsRuntime = band(timeGap, jitter(0));
  const beatsMemory = band(spaceGap, jitter(1));

  const optimal_ = timeGap === 0 && spaceGap === 0;
  let verdict;
  if (optimal_) verdict = 'Optimal — your time and space complexity match the best known approach.';
  else if (timeGap === 0 && spaceGap > 0) verdict = 'Time-optimal, but uses extra space — the optimal solution needs less memory.';
  else if (timeGap > 0 && spaceGap === 0) verdict = 'Space-efficient, but slower — the time complexity can be improved.';
  else verdict = 'Correct and accepted — both time and space can be tightened toward the optimal.';

  return { beatsRuntime, beatsMemory, isOptimal: optimal_, timeGap, spaceGap, verdict };
}
