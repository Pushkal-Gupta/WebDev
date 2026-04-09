// Judge0 CE — free hosted code execution API
const JUDGE0_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

const LANG_MAP = {
  python:     { id: 71 },   // Python 3.8.1
  javascript: { id: 63 },   // JavaScript (Node.js 12.14.0)
  java:       { id: 62 },   // Java (OpenJDK 13.0.1)
};

export async function runCode(code, language, stdin = '') {
  const config = LANG_MAP[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const response = await fetch(JUDGE0_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: config.id,
      source_code: code,
      stdin,
    }),
  });

  if (!response.ok) {
    throw new Error(`Execution service returned ${response.status}`);
  }

  const data = await response.json();
  const statusId = data.status?.id;

  // Status 6 = Compilation Error
  if (statusId === 6) {
    return {
      status: 'compile_error',
      output: data.compile_output || 'Compilation failed',
    };
  }

  // Status 5 = Time Limit Exceeded
  if (statusId === 5) {
    return { status: 'time_limit', output: 'Time Limit Exceeded (5s)' };
  }

  // Status 3 = Accepted (successful run)
  if (statusId === 3) {
    return { status: 'success', output: data.stdout || '(No output)' };
  }

  // Status 7-12 = Runtime errors (SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, Other)
  // Status 4 = Wrong Answer (but we handle comparison ourselves)
  // Status 11 = Runtime Error (NZEC)
  // Status 13 = Internal Error
  return {
    status: 'runtime_error',
    output: data.stderr || data.compile_output || data.message || 'Runtime error',
  };
}
