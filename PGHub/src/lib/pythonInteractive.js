// Pyodide-backed interactive Python runtime for the Playground.
//
// Why a singleton: Pyodide is ~10MB and takes 3-5s to initialize, so we lazy-
// load it on first call and reuse the instance for subsequent runs.
//
// Why CDN indexURL: the npm package ships the .wasm + stdlib zip, but Vite
// can't bundle them as static assets without extra plugin config. Pointing
// indexURL at jsdelivr keeps the main bundle thin (only the JS loader gets
// pulled in) and lets the browser cache the wasm across sessions.

const PYODIDE_VERSION = '0.29.4';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise = null;

export function loadPyodideOnce() {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    // Loaded from the CDN as a side-effect script so Vite doesn't try to bundle
    // pyodide.mjs's node-only conditional imports (node:fs, ws, etc.).
    const mod = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
    const py = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    return py;
  })().catch((err) => {
    pyodidePromise = null;
    throw err;
  });
  return pyodidePromise;
}

// Run `code` interactively. The callbacks bridge Python's stdout / stdin / errors
// back to the React UI:
//   onStdout(text)  - called for each batched chunk Python prints.
//   onStdin()       - returns a Promise<string> resolved by the UI when the user
//                     submits a line (without trailing newline).
//   onError(text)   - traceback text on uncaught Python exceptions.
//   onDone(code)    - fires once, exit code (0 = success, 1 = uncaught error).
//
// Implementation notes:
//   - We replace builtins.input with a Python function that calls
//     pyodide.ffi.run_sync(__pg_input(prompt)). run_sync uses JS Promise
//     Integration (JSPI) to block the synchronous Python call until the JS
//     promise resolves - so user code can stay plain `input()` with no await.
//   - Requires enableRunUntilComplete=true (the default in 0.29) AND a browser
//     with WebAssembly stack switching. All current Chromium-based browsers
//     ship this; Safari/Firefox may fall back to the asyncio loop path.
export async function runInteractive(code, { onStdout, onStdin, onError, onDone } = {}) {
  const py = await loadPyodideOnce();

  // Auto-load any Pyodide-provided packages the code imports — numpy, pandas,
  // scipy, scikit-learn, matplotlib, sympy, networkx, etc. all ship with Pyodide
  // but aren't loaded until asked. Without this, `import numpy` raises
  // ModuleNotFoundError even though it's available. Packages Pyodide doesn't have
  // (torch, tensorflow) are skipped here and still error at import, as before.
  try { await py.loadPackagesFromImports(code); } catch { /* best-effort; unknown imports error at runtime */ }

  const stdout = (chunk) => { try { onStdout?.(String(chunk)); } catch { /* ignore */ } };
  const stderr = (chunk) => { try { onError?.(String(chunk)); } catch { /* ignore */ } };
  const inputBridge = async (prompt) => {
    if (prompt) stdout(String(prompt));
    const line = await Promise.resolve(onStdin?.());
    return line == null ? '' : String(line);
  };

  // Use a `write`-style stdout so partial lines (e.g. print(..., end="")) reach
  // the UI before we block on input(). `batched` would buffer until a newline.
  py.setStdout({
    write: (buf) => {
      try {
        const text = new TextDecoder().decode(buf);
        stdout(text);
      } catch { /* ignore */ }
      return buf.length;
    },
    isatty: false,
  });
  py.setStderr({
    write: (buf) => {
      try {
        const text = new TextDecoder().decode(buf);
        stderr(text);
      } catch { /* ignore */ }
      return buf.length;
    },
    isatty: false,
  });

  py.globals.set('__pg_input', inputBridge);
  py.globals.set('__pg_user_code', code);

  const wrapper = `
import builtins, sys, traceback
from pyodide.ffi import run_sync

def __pg_blocking_input(prompt=""):
    # Pyodide's batched stdout only flushes on newline. Force a flush so any
    # pending print(..., end="") (the classic "Enter input : " case) reaches
    # the UI before we block on the user.
    try:
        sys.stdout.flush()
    except Exception:
        pass
    return run_sync(__pg_input(prompt))

builtins.input = __pg_blocking_input

__pg_exit_code = 0
try:
    exec(compile(__pg_user_code, "<playground>", "exec"),
         {"__name__": "__main__", "input": __pg_blocking_input})
except SystemExit as __pg_e:
    __pg_exit_code = int(getattr(__pg_e, "code", 0) or 0)
except BaseException:
    sys.stderr.write(traceback.format_exc())
    __pg_exit_code = 1
finally:
    try:
        sys.stdout.flush()
    except Exception:
        pass
`;

  let exitCode = 0;
  try {
    await py.runPythonAsync(wrapper);
    const ec = py.globals.get('__pg_exit_code');
    exitCode = typeof ec === 'number' ? ec : 0;
  } catch (err) {
    stderr(err?.message ? `${err.message}\n` : `${String(err)}\n`);
    exitCode = 1;
  } finally {
    try { py.globals.delete('__pg_input'); } catch { /* ignore */ }
    try { py.globals.delete('__pg_user_code'); } catch { /* ignore */ }
    try { py.globals.delete('__pg_exit_code'); } catch { /* ignore */ }
  }
  onDone?.(exitCode);
  return exitCode;
}

// One-shot, non-interactive run used by the free-form lesson runners (RunnableCodePanel
// / RunnableCodeBlock). Routes Python through Pyodide so scientific imports (numpy,
// pandas, scipy, sklearn, matplotlib, sympy, networkx) resolve via
// loadPackagesFromImports — Judge0's Python lacks them and isn't reachable from the
// static-hosted deploy at all. Returns the same { status, output } shape as runCode.
export async function runPythonInBrowser(code) {
  let buffer = '';
  let sawError = false;
  try {
    // onStdin returns '' so any input() call resolves immediately instead of hanging.
    const exitCode = await runInteractive(code, {
      onStdout: (text) => { buffer += text; },
      onError: (text) => { buffer += text; sawError = true; },
      onStdin: () => '',
    });
    const status = (exitCode !== 0 || sawError) ? 'runtime_error' : 'success';
    return { status, output: buffer || '(No output)' };
  } catch (err) {
    const detail = err?.message ? String(err.message) : String(err);
    return { status: 'runtime_error', output: buffer ? `${buffer}\n${detail}` : detail };
  }
}
