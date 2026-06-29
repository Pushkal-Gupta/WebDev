// Pure, dependency-free parser for LeetCode-style `constraints` text.
//
// Goal: turn the free-text constraints column into machine-checkable bounds so
// generators keep their inputs in range and a sweeper can flag/prune cases that
// fall OUTSIDE the stated constraints (which would wrongly FAIL a correct
// solution that legitimately relies on the constraints).
//
// Design principles:
//  - BEST EFFORT. Parse what we can recognise; OMIT anything we can't infer.
//    Never invent a tight bound from nothing — an absent field means "unknown",
//    and validateInputs() must never flag against an unknown bound.
//  - CONSERVATIVE validation. Only flag a CLEAR violation: a value/length that
//    is strictly outside an explicitly-parsed bound, or a char outside an
//    explicitly-parsed charset. Anything ambiguous passes.
//
//   node scripts/lib/constraint-bounds.mjs --selftest
//
// Exports: parseBounds, validateInputs, clampValue.

// ── number parsing ───────────────────────────────────────────────────────────
// Handles: 1000, 10^4, 10^9, 2 * 10^4, -10^9, 1e5, 2*10^5, 2^31 - 1,
// and the corrupted "caret-lost" forms LeetCode imports sometimes produce
// (10^5 -> "105", 2 * 10^5 -> "2 * 105", 2^31 -> "231"). We only treat a bare
// big integer as a corrupted power when it matches that exact shape, never when
// it's a plausible literal (<= 4 digits stays literal).
function normMinus(s) {
  // unify unicode minus / en-dash / figure-dash to ASCII '-'
  return s.replace(/[−‒–—－]/g, '-');
}

// Parse a single numeric token (already trimmed) -> Number or null.
function parseNum(tokRaw) {
  if (tokRaw == null) return null;
  let tok = normMinus(String(tokRaw)).trim();
  if (!tok) return null;

  // 2^31 - 1  /  2^31 − 1  /  2^31-1
  let m = tok.match(/^(-?)(\d+)\s*\^\s*(\d+)\s*-\s*1$/);
  if (m) { const v = Math.pow(Number(m[2]), Number(m[3])) - 1; return m[1] ? -v : v; }
  // 2^31
  m = tok.match(/^(-?)(\d+)\s*\^\s*(\d+)$/);
  if (m) { const v = Math.pow(Number(m[2]), Number(m[3])); return m[1] ? -v : v; }
  // K * 10^E  (or A * B^E)
  m = tok.match(/^(-?)(\d+(?:\.\d+)?)\s*\*\s*(\d+)\s*\^\s*(\d+)$/);
  if (m) { const v = Number(m[2]) * Math.pow(Number(m[3]), Number(m[4])); return m[1] ? -v : v; }
  // 10^E
  m = tok.match(/^(-?)(\d+)\s*\^\s*(\d+)$/);
  if (m) { const v = Math.pow(Number(m[2]), Number(m[3])); return m[1] ? -v : v; }
  // scientific 1e5 / 2.5e4
  m = tok.match(/^(-?\d+(?:\.\d+)?)e(\d+)$/i);
  if (m) return Number(m[0]);
  // corrupted "caret-lost" power: K * 10E  -> K * 10^E  (e.g. "2 * 105" = 2*10^5)
  m = tok.match(/^(-?)(\d+(?:\.\d+)?)\s*\*\s*10(\d)$/);
  if (m) { const v = Number(m[2]) * Math.pow(10, Number(m[3])); return m[1] ? -v : v; }
  // corrupted "caret-lost" power: 10E -> 10^E (e.g. "105" = 10^5, "109" = 10^9)
  m = tok.match(/^(-?)10([4-9])$/);
  if (m) { const v = Math.pow(10, Number(m[2])); return m[1] ? -v : v; }
  // plain integer / float
  m = tok.match(/^-?\d+(?:\.\d+)?$/);
  if (m) return Number(tok);
  return null;
}

// ── variable normalisation ───────────────────────────────────────────────────
// Map a raw variable token to a canonical kind + reference name.
//  - length kinds:  "<param>.length", bare "n"/"m" (declared == X.length), "X.size"
//  - element kinds: "<param>[i]", "<matrix>[i][j]"
//  - scalar kinds:  "k", "target", or any bare param name that is an int scalar
// Returns { kind: 'len'|'elem'|'scalar', name } or null.
function classifyVar(rawVar, params, lenAliases) {
  let v = normMinus(String(rawVar)).trim();
  if (!v) return null;
  // strip surrounding spaces around brackets
  v = v.replace(/\s+/g, '');

  const paramNames = new Set((params || []).map((p) => p.name));

  // X.length / X.size / X.len
  let m = v.match(/^([A-Za-z_]\w*)\.(?:length|size|len)$/);
  if (m) return { kind: 'len', name: m[1] };

  // X[i][j]  -> element of 2D param X
  m = v.match(/^([A-Za-z_]\w*)\[[^\]]*\]\[[^\]]*\]$/);
  if (m) return { kind: 'elem', name: m[1] };

  // X[i]  -> element of 1D param X (or a matrix row length if X is 2D — caller
  // resolves; we report 'elem' and let parseBounds decide via param type)
  m = v.match(/^([A-Za-z_]\w*)\[[^\]]*\]$/);
  if (m) return { kind: 'elem', name: m[1] };

  // bare identifier
  m = v.match(/^([A-Za-z_]\w*)$/);
  if (m) {
    const id = m[1];
    if (lenAliases && lenAliases[id]) return { kind: 'len', name: lenAliases[id] };
    // bare n/m almost always denote a length even without an explicit "n == X.length"
    if ((id === 'n' || id === 'm') && params && params.length) {
      // attach to the first array/string param if present
      const arr = (params || []).find((p) => /list|\[\]|str|string|array/i.test(String(p.type)));
      if (arr) return { kind: 'len', name: arr.name, soft: true };
    }
    if (paramNames.has(id)) return { kind: 'scalar', name: id };
    return { kind: 'scalar', name: id };
  }
  return null;
}

// ── charset detection ────────────────────────────────────────────────────────
// Build a charset by ACCUMULATING every character class mentioned on the line.
// LeetCode constraints routinely combine classes ("lowercase English letters,
// digits, ' ', and '$'") — flagging only the first class would wrongly reject
// the others. So we OR together: named letter/digit classes + every quoted char.
// If the line is only prose with no recognizable class, return null.
function detectCharset(line) {
  const t = line.toLowerCase();
  // printable-ASCII is a superset — short-circuit (nothing useful to flag).
  if (/\bprintable ascii\b/.test(t)) return { range: [0x20, 0x7e], printable: true };

  const ranges = [];
  const extra = new Set();
  let matchedClass = false;

  if (/lowercase\b.*\buppercase|\blower(?:case)?\b.*\bupper(?:case)?\b/.test(t) && /english/.test(t)) {
    ranges.push(['a', 'z'], ['A', 'Z']); matchedClass = true;
  } else if (/lowercase english letter/.test(t) || /\blowercase letter/.test(t)) {
    ranges.push(['a', 'z']); matchedClass = true;
  } else if (/uppercase english letter/.test(t) || /\buppercase letter/.test(t)) {
    ranges.push(['A', 'Z']); matchedClass = true;
  } else if (/english letter/.test(t) || /\bletters?\b/.test(t)) {
    ranges.push(['a', 'z'], ['A', 'Z']); matchedClass = true;
  }
  if (/\bdigits?\b/.test(t) || /\bintegers?\b/.test(t) || /\bnumbers?\b/.test(t)) { ranges.push(['0', '9']); matchedClass = true; }
  if (/\ba-z only\b/.test(t)) { ranges.push(['a', 'z']); matchedClass = true; }
  if (/A-Z only/.test(line)) { ranges.push(['A', 'Z']); matchedClass = true; }

  // every explicitly-quoted single char ('{', ',', '$', '0', '1', ' ' ...)
  for (const m of line.matchAll(/'(.)'/g)) { extra.add(m[1]); matchedClass = true; }
  // a bare "' '" space sometimes written as "space" word
  if (/\bspaces?\b/.test(t) && !/no (?:leading|trailing) space/.test(t)) { extra.add(' '); matchedClass = true; }

  if (!matchedClass) return null;
  // Only emit a charset when the line is actually a "consists of / consist of /
  // contains / is either" style alphabet statement — otherwise a stray quoted
  // char in prose (e.g. an example) shouldn't become a hard alphabet.
  const isAlphabetStmt = /\bconsists?\b|\bcontains?\b|\bis either\b|\bmade up of\b|\bcharacters?\b|only\b|\bletters?\b|\bdigits?\b/.test(t);
  if (!isAlphabetStmt) return null;

  return { ranges: ranges.length ? ranges : undefined, chars: extra.size ? [...extra].join('') : undefined };
}

// OR two charsets together. printable absorbs everything.
function mergeCharset(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.printable || b.printable) return { range: [0x20, 0x7e], printable: true };
  const ranges = [...(a.ranges || []), ...(b.ranges || [])];
  const chars = (a.chars || '') + (b.chars || '');
  return {
    ranges: ranges.length ? ranges : undefined,
    chars: chars.length ? [...new Set(chars)].join('') : undefined,
  };
}

function charInCharset(ch, cs) {
  if (!cs) return true;
  if (cs.printable) {
    const c = ch.charCodeAt(0);
    return c >= cs.range[0] && c <= cs.range[1];
  }
  // ranges and explicit chars are OR-ed together (a char passes if ANY allows it)
  if (cs.chars && cs.chars.includes(ch)) return true;
  if (cs.ranges && cs.ranges.some(([lo, hi]) => ch >= lo && ch <= hi)) return true;
  // if neither field is set, we have no real alphabet -> don't flag
  if (!cs.chars && !cs.ranges) return true;
  return false;
}

// ── bound merging ────────────────────────────────────────────────────────────
function mergeRange(dst, key, lo, hi) {
  if (lo != null) {
    const k = `${key}Min`;
    dst[k] = dst[k] == null ? lo : Math.max(dst[k], lo);
  }
  if (hi != null) {
    const k = `${key}Max`;
    dst[k] = dst[k] == null ? hi : Math.min(dst[k], hi);
  }
}

// ── main parse ───────────────────────────────────────────────────────────────
// Returns { perParam: { name: { lenMin,lenMax,valMin,valMax,charset } }, scalars: { name: {valMin,valMax} } }
export function parseBounds(constraintsText, params = []) {
  const perParam = {};
  const scalars = {};
  if (!constraintsText || typeof constraintsText !== 'string') return { perParam, scalars };

  const paramType = {};
  for (const p of params || []) paramType[p.name] = String(p.type || '');
  const isArrayParam = (n) => /list|\[\]|array/i.test(paramType[n] || '');
  const is2DParam = (n) => /list\[list|\[\]\[\]/i.test(paramType[n] || '');
  const isStrParam = (n) => /\bstr\b|string/i.test(paramType[n] || '') && !isArrayParam(n);

  const ensureParam = (n) => (perParam[n] = perParam[n] || {});
  const ensureScalar = (n) => (scalars[n] = scalars[n] || {});

  // Pass 1: collect length aliases ("n == nums.length", "n = nums.length").
  const lenAliases = {};
  const lines = constraintsText.split(/\r?\n/).map((l) => normMinus(l).trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_]\w*)\s*={1,2}\s*([A-Za-z_]\w*)\.(?:length|size|len)\s*$/);
    if (m) lenAliases[m[1]] = m[2];
    const m2 = line.match(/^([A-Za-z_]\w*)\.(?:length|size|len)\s*={1,2}\s*([A-Za-z_]\w*)\s*$/);
    if (m2) lenAliases[m2[2]] = m2[1];
  }

  // Apply a parsed (lo,hi) to a classified variable, fanning out to all params
  // when the variable lists several (e.g. "grid.length, grid[i].length").
  const applyToVar = (rawVar, lo, hi) => {
    const cls = classifyVar(rawVar, params, lenAliases);
    if (!cls) return;
    if (cls.kind === 'len') {
      // a length is a non-negative count
      if (lo != null && lo < 0) lo = 0;
      mergeRange(ensureParam(cls.name), 'len', lo, hi);
    } else if (cls.kind === 'elem') {
      // element value of an array/matrix param
      if (perParam[cls.name] || isArrayParam(cls.name) || paramType[cls.name] != null) {
        mergeRange(ensureParam(cls.name), 'val', lo, hi);
      } else {
        mergeRange(ensureParam(cls.name), 'val', lo, hi);
      }
    } else {
      // scalar — if it's actually a string/array param name and the rule looks
      // like a value bound, it's ambiguous; treat bare array param value bounds
      // as element bounds, else scalar.
      if (isArrayParam(cls.name)) mergeRange(ensureParam(cls.name), 'val', lo, hi);
      else if (isStrParam(cls.name)) mergeRange(ensureParam(cls.name), 'len', lo != null && lo < 0 ? 0 : lo, hi);
      else mergeRange(ensureScalar(cls.name), 'val', lo, hi);
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\.$/, '');

    // charset phrases — attach to every string param (or the single string param)
    const cs = detectCharset(line);
    if (cs) {
      const strParams = (params || []).filter((p) => isStrParam(p.name) || /list\[str/i.test(paramType[p.name] || ''));
      for (const p of strParams) ensureParam(p.name).charset = mergeCharset(ensureParam(p.name).charset, cs);
      // also if exactly one param overall and it's a string
      if (!strParams.length && (params || []).length === 1 && isStrParam(params[0].name)) {
        ensureParam(params[0].name).charset = mergeCharset(ensureParam(params[0].name).charset, cs);
      }
    }

    // "<param>[idx] == 'X'" (or "is/equals 'X'") declares an allowed char for
    // that string param — fold it into the charset so end-anchors like
    // "s[0] == '(' and s[-1] == ')'" don't get wrongly flagged.
    for (const m of line.matchAll(/([A-Za-z_]\w*)\s*\[[^\]]*\]\s*(?:={1,2}|is|equals)\s*'(.)'/g)) {
      const pname = m[1];
      if (isStrParam(pname) || (paramType[pname] != null && !isArrayParam(pname))) {
        const p = ensureParam(pname);
        p.charset = p.charset || { chars: '' };
        if (p.charset.chars == null) p.charset.chars = '';
        if (!p.charset.chars.includes(m[2])) p.charset.chars += m[2];
      }
    }

    // strip a trailing prose clause after the numeric rule (", where ...")
    const core = line.split(/\bwhere\b/i)[0].trim();

    // Split a comma-grouped variable list inside a bound, e.g.
    //   "1 <= m, n <= 100"           -> vars [m, n]
    //   "0 <= kx, ky <= 49"
    //   "1 <= grid.length, grid[i].length <= 1000"

    // Form A:  LO <op> VARLIST <op> HI    (two-sided)
    let m = core.match(/^(-?[\w.^*\s]+?)\s*(<=|<|≤)\s*(.+?)\s*(<=|<|≤)\s*(-?[\w.^*\s]+)$/);
    if (m) {
      const lo = parseNum(m[1]);
      const hiOp = m[4];
      let hi = parseNum(m[5]);
      if (hi != null && (hiOp === '<')) hi = hi - 1; // strict upper
      const varlist = splitVarList(m[3]);
      let loAdj = lo;
      if (lo != null && m[2] === '<') loAdj = lo + 1; // strict lower
      for (const v of varlist) applyToVar(v, loAdj, hi);
      continue;
    }

    // Form B:  VARLIST <op> HI     (one-sided upper)
    m = core.match(/^(.+?)\s*(<=|<|≤)\s*(-?[\w.^*\s]+)$/);
    if (m && classifyVar(splitVarList(m[1])[0], params, lenAliases)) {
      let hi = parseNum(m[3]);
      if (hi != null && m[2] === '<') hi = hi - 1;
      // guard: left side must not itself be a number (that's a bare "1 <= x" w/ no var)
      if (parseNum(m[1].trim()) == null) {
        for (const v of splitVarList(m[1])) applyToVar(v, null, hi);
        continue;
      }
    }

    // Form C:  LO <op> VARLIST     (one-sided lower, number on left)
    m = core.match(/^(-?[\w.^*\s]+?)\s*(<=|<|≤)\s*(.+)$/);
    if (m && parseNum(m[1].trim()) != null && classifyVar(splitVarList(m[3])[0], params, lenAliases)) {
      let lo = parseNum(m[1]);
      if (lo != null && m[2] === '<') lo = lo + 1;
      for (const v of splitVarList(m[3])) applyToVar(v, lo, null);
      continue;
    }

    // Form D:  VAR == K   (exact)
    m = core.match(/^(.+?)\s*={2}\s*(-?[\w.^*\s]+)$/);
    if (m) {
      const k = parseNum(m[2].trim());
      if (k != null) {
        for (const v of splitVarList(m[1])) applyToVar(v, k, k);
        continue;
      }
    }
  }

  // Resolve element bounds that were attached to a 2D param via "[i]" (row) vs
  // "[i][j]" (cell): both map to the same param name here, which is fine — the
  // val bound applies to leaf integers either way.
  // For a string param, a "valMin/valMax" that slipped in is meaningless; drop it.
  for (const n of Object.keys(perParam)) {
    if (isStrParam(n)) {
      delete perParam[n].valMin;
      delete perParam[n].valMax;
    }
    // a length can never be negative
    if (perParam[n].lenMin != null && perParam[n].lenMin < 0) perParam[n].lenMin = 0;
  }

  return { perParam, scalars, _meta: { lenAliases } };
}

// Split "grid.length, grid[i].length" or "m, n" into individual var tokens,
// but DON'T split inside brackets.
function splitVarList(s) {
  const parts = [];
  let depth = 0, cur = '';
  for (const ch of String(s)) {
    if (ch === '[' || ch === '(') depth++;
    if (ch === ']' || ch === ')') depth--;
    if (ch === ',' && depth <= 0) { if (cur.trim()) parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

// ── input parsing ────────────────────────────────────────────────────────────
// Each input is a string: either JSON ("[1,2]", "5", "\"abc\"") or a bare/quoted
// scalar. Return the parsed JS value, or a sentinel if unparseable.
function parseInput(raw) {
  if (typeof raw !== 'string') return { value: raw, ok: true };
  const s = raw.trim();
  try {
    return { value: JSON.parse(s), ok: true };
  } catch { /* fall through */ }
  // bare quoted string already handled by JSON; try stripping outer quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return { value: s.slice(1, -1), ok: true };
  }
  // bare number
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return { value: Number(s), ok: true };
  // bare token -> treat as string
  return { value: s, ok: true };
}

// recursively collect leaf numbers / chars from a value
function leafNumbers(v, out) {
  if (Array.isArray(v)) { for (const x of v) leafNumbers(x, out); return; }
  if (typeof v === 'number') out.push(v);
}
function arrayLength(v) { return Array.isArray(v) ? v.length : null; }

// ── validation ───────────────────────────────────────────────────────────────
// Conservative: only flag CLEAR violations against explicitly-parsed bounds.
export function validateInputs(inputsArray, params = [], bounds = null) {
  const violations = [];
  if (!bounds) bounds = { perParam: {}, scalars: {} };
  const { perParam = {}, scalars = {} } = bounds;
  if (!Array.isArray(inputsArray)) return { ok: true, violations };

  for (let i = 0; i < (params || []).length; i++) {
    const p = params[i];
    if (!p) continue;
    const raw = inputsArray[i];
    if (raw === undefined) continue;
    const parsed = parseInput(raw);
    if (!parsed.ok) continue;
    const val = parsed.value;
    const type = String(p.type || '');
    const isArr = /list|\[\]|array/i.test(type);
    const isStr = (/\bstr\b|string/i.test(type)) && !isArr;

    const pb = perParam[p.name];
    if (pb) {
      // length checks
      if (isArr || isStr) {
        const len = isStr ? (typeof val === 'string' ? val.length : null) : arrayLength(val);
        if (len != null) {
          if (pb.lenMin != null && len < pb.lenMin) violations.push(`${p.name}.length=${len} < min ${pb.lenMin}`);
          if (pb.lenMax != null && len > pb.lenMax) violations.push(`${p.name}.length=${len} > max ${pb.lenMax}`);
        }
      }
      // element value checks (arrays)
      if (isArr && (pb.valMin != null || pb.valMax != null)) {
        const nums = [];
        leafNumbers(val, nums);
        for (const x of nums) {
          if (pb.valMin != null && x < pb.valMin) { violations.push(`${p.name} element ${x} < min ${pb.valMin}`); break; }
          if (pb.valMax != null && x > pb.valMax) { violations.push(`${p.name} element ${x} > max ${pb.valMax}`); break; }
        }
      }
      // charset checks (strings)
      if (isStr && pb.charset && typeof val === 'string') {
        for (const ch of val) {
          if (!charInCharset(ch, pb.charset)) { violations.push(`${p.name} char ${JSON.stringify(ch)} outside charset`); break; }
        }
      }
    }

    // scalar value checks
    const sb2 = scalars[p.name];
    if (sb2 && typeof val === 'number') {
      if (sb2.valMin != null && val < sb2.valMin) violations.push(`${p.name}=${val} < min ${sb2.valMin}`);
      if (sb2.valMax != null && val > sb2.valMax) violations.push(`${p.name}=${val} > max ${sb2.valMax}`);
    }
  }
  return { ok: violations.length === 0, violations };
}

// ── clamp helper for generators ──────────────────────────────────────────────
// Given a type and a raw JS value (number, string, or array), nudge it into the
// parsed bounds for that param. Returns the clamped value (same shape). Best
// effort: only acts on fields that exist in `pb`.
export function clampValue(type, raw, pb) {
  if (!pb) return raw;
  const t = String(type || '');
  const isArr = /list|\[\]|array/i.test(t);
  const isStr = (/\bstr\b|string/i.test(t)) && !isArr;

  const clampNum = (x) => {
    let v = x;
    if (pb.valMin != null && v < pb.valMin) v = pb.valMin;
    if (pb.valMax != null && v > pb.valMax) v = pb.valMax;
    return v;
  };
  const clampLeaves = (v) => {
    if (Array.isArray(v)) return v.map(clampLeaves);
    if (typeof v === 'number') return clampNum(v);
    return v;
  };

  if (typeof raw === 'number') return clampNum(raw);

  if (isArr && Array.isArray(raw)) {
    let arr = (pb.valMin != null || pb.valMax != null) ? clampLeaves(raw) : raw;
    // length clamp (truncate only; never pad with invented data)
    if (pb.lenMax != null && Array.isArray(arr) && arr.length > pb.lenMax) arr = arr.slice(0, pb.lenMax);
    return arr;
  }

  if (isStr && typeof raw === 'string') {
    let s = raw;
    // charset clamp first (drop chars outside the set), THEN length-truncate so
    // the result is both in-alphabet and within the max length.
    if (pb.charset) {
      const kept = [...s].filter((ch) => charInCharset(ch, pb.charset));
      s = kept.join('');
    }
    if (pb.lenMax != null && s.length > pb.lenMax) s = s.slice(0, pb.lenMax);
    return s;
  }
  return raw;
}

// ── selftest ─────────────────────────────────────────────────────────────────
function selftest() {
  let pass = 0, fail = 0;
  const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log(`  FAIL: ${msg}`); } };
  const P = (txt, params) => parseBounds(txt, params);

  // 1. element bound flags low + high, accepts in-range
  {
    const b = P('1 <= nums.length <= 100\n1 <= nums[i] <= 1000', [{ name: 'nums', type: 'List[int]' }]);
    ok(b.perParam.nums.valMin === 1 && b.perParam.nums.valMax === 1000, '1: elem val bounds parsed');
    ok(b.perParam.nums.lenMin === 1 && b.perParam.nums.lenMax === 100, '1: len bounds parsed');
    ok(!validateInputs(['[-5,3]'], [{ name: 'nums', type: 'List[int]' }], b).ok, '1: flags -5');
    ok(!validateInputs(['[2000]'], [{ name: 'nums', type: 'List[int]' }], b).ok, '1: flags 2000');
    ok(validateInputs(['[500,1,1000]'], [{ name: 'nums', type: 'List[int]' }], b).ok, '1: accepts in-range');
  }
  // 2. strict upper bound  VAR < HI
  {
    const b = P('0 <= i < 5', [{ name: 'i', type: 'int' }]);
    ok(b.scalars.i.valMin === 0 && b.scalars.i.valMax === 4, '2: strict < gives max 4');
    ok(!validateInputs(['5'], [{ name: 'i', type: 'int' }], b).ok, '2: flags 5');
    ok(validateInputs(['4'], [{ name: 'i', type: 'int' }], b).ok, '2: accepts 4');
  }
  // 3. 10^k powers
  {
    const b = P('1 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9', [{ name: 'nums', type: 'List[int]' }]);
    ok(b.perParam.nums.lenMax === 10000, '3: 10^4 length');
    ok(b.perParam.nums.valMin === -1000000000 && b.perParam.nums.valMax === 1000000000, '3: 10^9 elem');
  }
  // 4. 2 * 10^4
  {
    const b = P('1 <= nums.length <= 2 * 10^4', [{ name: 'nums', type: 'List[int]' }]);
    ok(b.perParam.nums.lenMax === 20000, '4: 2*10^4 = 20000');
  }
  // 5. corrupted caret-lost powers
  {
    const b = P('1 <= nums.length <= 105\n1 <= nums[i] <= 2 * 105', [{ name: 'nums', type: 'List[int]' }]);
    ok(b.perParam.nums.lenMax === 100000, '5: "105" -> 10^5');
    ok(b.perParam.nums.valMax === 200000, '5: "2 * 105" -> 2*10^5');
  }
  // 6. unicode ≤
  {
    const b = P('1 ≤ matrix[i][j] ≤ 10^5', [{ name: 'matrix', type: 'List[List[int]]' }]);
    ok(b.perParam.matrix.valMin === 1 && b.perParam.matrix.valMax === 100000, '6: unicode ≤ + 2D elem');
    ok(!validateInputs(['[[0,2]]'], [{ name: 'matrix', type: 'List[List[int]]' }], b).ok, '6: flags 0 in matrix');
  }
  // 7. comma-grouped vars on element  "0 <= kx, ky <= 49" (scalars)
  {
    const b = P('0 <= kx, ky <= 49', [{ name: 'kx', type: 'int' }, { name: 'ky', type: 'int' }]);
    ok(b.scalars.kx.valMax === 49 && b.scalars.ky.valMax === 49, '7: comma scalars both bounded');
    ok(!validateInputs(['50', '3'], [{ name: 'kx', type: 'int' }, { name: 'ky', type: 'int' }], b).ok, '7: flags kx=50');
  }
  // 8. comma-grouped length + elem  "1 <= grid.length, grid[i].length <= 1000"
  {
    const b = P('1 <= grid.length, grid[i].length <= 1000', [{ name: 'grid', type: 'List[List[int]]' }]);
    ok(b.perParam.grid.lenMin === 1 && b.perParam.grid.lenMax === 1000, '8: grid len bounded');
  }
  // 9. n == nums.length alias
  {
    const b = P('n == nums.length\n1 <= n <= 1000\n1 <= nums[i] <= 1000', [{ name: 'nums', type: 'List[int]' }]);
    ok(b.perParam.nums.lenMax === 1000, '9: n alias -> nums length');
  }
  // 10. string length + charset
  {
    const b = P('1 <= s.length <= 100\ns consists of lowercase English letters only', [{ name: 's', type: 'str' }]);
    ok(b.perParam.s.lenMax === 100, '10: s length');
    ok(b.perParam.s.charset && b.perParam.s.charset.ranges, '10: charset parsed');
    ok(!validateInputs(['"abC"'], [{ name: 's', type: 'str' }], b).ok, '10: flags uppercase C');
    ok(validateInputs(['"abc"'], [{ name: 's', type: 'str' }], b).ok, '10: accepts lowercase');
  }
  // 11. binary string charset
  {
    const b = P("s consists only of the characters '0' and '1'.", [{ name: 's', type: 'str' }]);
    ok(b.perParam.s.charset.chars === '01', '11: 0/1 charset');
    ok(!validateInputs(['"012"'], [{ name: 's', type: 'str' }], b).ok, '11: flags 2');
  }
  // 12. printable ASCII accepts most
  {
    const b = P('1 <= input.length <= 10^4\ninput contains printable ASCII characters', [{ name: 'input', type: 'str' }]);
    ok(b.perParam.input.charset && b.perParam.input.charset.printable, '12: printable charset');
    ok(validateInputs(['"a!~ Z"'], [{ name: 'input', type: 'str' }], b).ok, '12: accepts printable');
  }
  // 13. no bound -> no flag (conservative)
  {
    const b = P('All elements are distinct.\nThe input is generated such that ...', [{ name: 'nums', type: 'List[int]' }]);
    ok(Object.keys(b.perParam).length === 0, '13: prose-only parses nothing');
    ok(validateInputs(['[-999999]'], [{ name: 'nums', type: 'List[int]' }], b).ok, '13: no flag without bound');
  }
  // 14. one-sided lower bound  "1 <= k"
  {
    const b = P('1 <= k', [{ name: 'k', type: 'int' }]);
    ok(b.scalars.k.valMin === 1 && b.scalars.k.valMax == null, '14: lower-only k');
    ok(!validateInputs(['0'], [{ name: 'k', type: 'int' }], b).ok, '14: flags k=0');
    ok(validateInputs(['7'], [{ name: 'k', type: 'int' }], b).ok, '14: accepts k=7');
  }
  // 15. 2^31 - 1
  {
    const b = P('1 <= columnTitle.length <= 7\nReturn value <= 2^31 - 1', [{ name: 'columnTitle', type: 'str' }]);
    ok(b.perParam.columnTitle.lenMax === 7, '15: columnTitle length');
  }
  // 16. clampValue
  {
    const pb = { valMin: 1, valMax: 1000, lenMax: 3 };
    const out = clampValue('List[int]', [-5, 2000, 5, 9], pb);
    ok(JSON.stringify(out) === JSON.stringify([1, 1000, 5]), '16: clamp arr values + truncate len');
    const sOut = clampValue('str', 'abCDef', { lenMax: 4, charset: { ranges: [['a', 'z']] } });
    ok(sOut === 'abef', '16: clamp str charset (drop CD) -> then len ok');
  }
  // 17. string param value rule must NOT create elem val bound
  {
    const b = P('1 <= s.length <= 50', [{ name: 's', type: 'str' }]);
    ok(b.perParam.s.valMin == null && b.perParam.s.valMax == null, '17: no val bound on string');
  }

  console.log(`\nselftest: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

if (process.argv.includes('--selftest')) selftest();
