// Client-side code runner. Prefers the Supabase Edge Function (batched + parallel
// server-side fan-out to Judge0). Falls back to the public Judge0 CE endpoint
// directly if the function call fails — keeps dev flow working before deploy.

import { supabase } from './supabase';
import { JAVA_CASE_SEP, JAVA_OUT_END, JAVA_ERR_PREFIX } from './driverCode';

const JUDGE0_DIRECT_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

const LANG_MAP = {
  python:     { id: 71 },   // Python 3.8.1
  javascript: { id: 63 },   // JavaScript (Node.js 12.14.0)
  java:       { id: 62 },   // Java (OpenJDK 13.0.1)
  cpp:        { id: 54 },   // C++ (GCC 9.2.0)
};

// Run a batch of stdins against the same source code in parallel, server-side.
// Returns an array of { status, output } in the same order as `stdins`.
export async function runCodeBatch(code, language, stdins) {
  if (!LANG_MAP[language]) throw new Error(`Unsupported language: ${language}`);
  if (!Array.isArray(stdins) || stdins.length === 0) return [];

  const { data, error } = await supabase.functions.invoke('run-code', {
    body: { code, language, stdins },
  });

  if (error) {
    // Fall back to serial direct calls so the app still works locally before the
    // function is deployed. Logged so we know the function path is broken.
    console.warn('run-code edge function failed, falling back to direct Judge0:', error.message);
    const results = [];
    for (const stdin of stdins) {
      results.push(await runCodeDirect(code, language, stdin));
    }
    return results;
  }

  if (data?.error) throw new Error(data.error);
  return data.results;
}

// Compile-once, run-N optimization for languages with slow compile+startup
// (currently java and cpp). `code` must have been produced by
// wrapWithDriver(..., { multiCaseCount: stdins.length }). Concatenates stdins
// with the case separator, runs ONCE, then splits the output back into N
// per-case results. Turns a compile-error into that same compile-error for
// every case so the client UI keeps its existing early-exit behavior.
export async function runCodeMultiCase(code, language, stdins) {
  if (!Array.isArray(stdins) || stdins.length === 0) return [];
  const combined = stdins.join(`\n${JAVA_CASE_SEP}\n`);
  const [raw] = await runCodeBatch(code, language, [combined]);

  // Compile-error / TLE / pre-run runtime errors apply to the whole submission.
  if (raw.status !== 'success') {
    return stdins.map(() => ({ status: raw.status, output: raw.output }));
  }

  // Split on the end-of-case sentinel. Any case that produced no output line
  // (e.g. JVM crashed mid-loop) becomes a runtime_error for that slot onward.
  const parts = (raw.output || '').split(`${JAVA_OUT_END}\n`).map(p => p.replace(/\n$/, ''));
  const results = [];
  for (let i = 0; i < stdins.length; i++) {
    const p = parts[i];
    if (p === undefined) {
      results.push({ status: 'runtime_error', output: 'Execution aborted before this case ran' });
      continue;
    }
    if (p.startsWith(JAVA_ERR_PREFIX)) {
      results.push({ status: 'runtime_error', output: p.slice(JAVA_ERR_PREFIX.length) });
      continue;
    }
    results.push({ status: 'success', output: p });
  }
  return results;
}

// Single-shot execution (used by free-run mode with no test cases).
export async function runCode(code, language, stdin = '') {
  const batch = await runCodeBatch(code, language, [stdin]);
  return batch[0];
}

// Direct Judge0 call, used only as fallback.
async function runCodeDirect(code, language, stdin = '') {
  const config = LANG_MAP[language];
  const response = await fetch(JUDGE0_DIRECT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language_id: config.id, source_code: code, stdin }),
  });
  if (!response.ok) throw new Error(`Execution service returned ${response.status}`);
  const data = await response.json();
  const statusId = data.status?.id;
  if (statusId === 6) return { status: 'compile_error', output: data.compile_output || 'Compilation failed' };
  if (statusId === 5) return { status: 'time_limit', output: 'Time Limit Exceeded (5s)' };
  if (statusId === 3) return { status: 'success', output: data.stdout || '(No output)' };
  return { status: 'runtime_error', output: data.stderr || data.compile_output || data.message || 'Runtime error' };
}
