const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const LANG_MAP = {
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  java: { language: 'java', version: '15.0.2' },
};

export async function runCode(code, language, stdin = '') {
  const config = LANG_MAP[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const response = await fetch(PISTON_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: config.language,
      version: config.version,
      files: [{ content: code }],
      stdin,
      compile_timeout: 10000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Execution service returned ${response.status}`);
  }

  const result = await response.json();

  if (result.compile && result.compile.code !== 0) {
    return {
      status: 'compile_error',
      output: result.compile.stderr || result.compile.output || 'Compilation failed',
    };
  }

  const run = result.run || {};
  if (run.signal === 'SIGKILL') {
    return { status: 'time_limit', output: 'Time Limit Exceeded (5s)' };
  }
  if (run.code !== 0) {
    return { status: 'runtime_error', output: run.stderr || run.output || 'Runtime error' };
  }

  return { status: 'success', output: run.stdout || run.output || '(No output)' };
}
