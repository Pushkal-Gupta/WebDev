// Client-side code runner. Prefers the Supabase Edge Function (batched + parallel
// server-side fan-out to Judge0). Falls back to the public Judge0 CE endpoint
// directly if the function call fails — keeps dev flow working before deploy.

import { supabase } from './supabase';
import { JAVA_CASE_SEP, JAVA_OUT_END, JAVA_ERR_PREFIX } from './driverCode';
import { runPythonInBrowser } from './pythonInteractive';

const JUDGE0_DIRECT_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

// Languages with full test-harness/driver-code support (used by the Workspace runner)
// must be a strict subset of all supported languages — only these have driver code in
// driverCode.js. The Playground accepts every key in this map.
const LANG_MAP = {
  python:     { id: 71, name: 'Python 3',     monaco: 'python',     harness: true  },
  javascript: { id: 63, name: 'JavaScript',   monaco: 'javascript', harness: true  },
  java:       { id: 62, name: 'Java',         monaco: 'java',       harness: true  },
  cpp:        { id: 54, name: 'C++',          monaco: 'cpp',        harness: true  },
  c:          { id: 50, name: 'C',            monaco: 'c',          harness: true  },
  go:         { id: 60, name: 'Go',           monaco: 'go',         harness: true  },
  rust:       { id: 73, name: 'Rust',         monaco: 'rust',       harness: true  },
  typescript: { id: 74, name: 'TypeScript',   monaco: 'typescript', harness: true  },
  csharp:     { id: 51, name: 'C#',           monaco: 'csharp',     harness: false },
  ruby:       { id: 72, name: 'Ruby',         monaco: 'ruby',       harness: false },
  kotlin:     { id: 78, name: 'Kotlin',       monaco: 'kotlin',     harness: true  },
  swift:      { id: 83, name: 'Swift',        monaco: 'swift',      harness: true  },
  php:        { id: 68, name: 'PHP',          monaco: 'php',        harness: false },
  bash:       { id: 46, name: 'Bash',         monaco: 'shell',      harness: false },
};

export const PLAYGROUND_LANGS = Object.entries(LANG_MAP).map(([value, meta]) => ({
  value,
  label: meta.name,
  monaco: meta.monaco,
}));

export const HARNESS_LANGS = Object.entries(LANG_MAP)
  .filter(([, m]) => m.harness)
  .map(([value, m]) => ({ value, label: m.name, monaco: m.monaco }));

export { LANG_MAP };

// Server-side grading. Loads tests + driver from DB; client never sees expected
// outputs unless the function returns them in `cases[i].hint`. Falls back to
// null on any error so the caller can run the legacy client-grading flow.
//
// Returns: { verdict, passed, total, cases: [{ index, status, hint? }] } or null.
export async function gradeOnServer(problemId, language, code) {
  if (!problemId || !code || !LANG_MAP[language]) return null;
  try {
    const { data, error } = await supabase.functions.invoke('grade-submission', {
      body: { problem_id: problemId, language, code },
    });
    if (error) {
      console.warn('grade-submission failed, falling back:', error.message);
      return null;
    }
    if (data?.error) {
      console.warn('grade-submission rejected:', data.error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('grade-submission exception:', err.message);
    return null;
  }
}

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
    // java/cpp batch all cases into ONE run, so the user's debug (stderr) is a single
    // combined blob rather than per-case; surface it on each success case best-effort.
    results.push({ status: 'success', output: p, debug: raw.debug || '' });
  }
  return results;
}

// Single-shot execution (used by free-run mode with no test cases).
export async function runCode(code, language, stdin = '') {
  // Free-form Python runs go through Pyodide in the browser: it ships numpy/pandas/
  // scipy/sklearn/matplotlib/sympy/networkx (auto-loaded from imports), whereas Judge0's
  // Python has none of them and isn't even reachable from the static-hosted deploy.
  // Other languages and non-browser contexts keep the Judge0 path.
  if (language === 'python' && typeof window !== 'undefined') {
    return runPythonInBrowser(code);
  }
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
