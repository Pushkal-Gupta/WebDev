export const meta = {
  name: 'pghub-lang-backfill',
  description: 'Port canonical Python to missing JS/Java/C++ reference solutions (graded + stored downstream)',
  phases: [{ title: 'Port', detail: 'one agent per slice; writes {slug:{lang:code}} to its dir' }],
};

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args || {});
let tasks = (parsedArgs && parsedArgs.tasks) || [];
if (!tasks.length && parsedArgs.base) {
  for (let i = 0; i < (parsedArgs.count || 0); i++) tasks.push({ dir: `${parsedArgs.base}/backfill/wf/s${i}`, idx: i });
}
log(`lang-backfill: ${tasks.length} slices`);

const prompt = (dir) => `Port canonical Python solutions to their MISSING reference languages for PGHub coding problems (project /Users/pushkalgupta/Desktop/WebDev/PGHub).

Read ${dir}/slice.json — an array of problems { id, name, difficulty, method_name, params, return_type, python, missing }. \`missing\` is an array naming which of javascript / java / cpp are absent. \`python\` is the correct canonical solution.

For EACH problem, write a faithful, IDIOMATIC solution in EACH language listed in \`missing\` that implements the SAME algorithm as the python, with the SAME method signature (method_name / params / return_type). These are graded automatically against the problem's real test cases downstream and only stored if they pass EVERY case, so correctness is essential:
- Match the exact method/class shape the harness expects: Java uses a public class \`Solution\` with method \`method_name\`; C++ uses \`class Solution { public: <return> method_name(...) };\`; JavaScript exports a function \`var method_name = function(...) {...}\` (or \`function method_name(...)\`).
- Use the same parameter order/types as python. Return the same type/shape.
- No stubs, no "TODO", no "see editorial" — real working code only. Skip a language only if you genuinely cannot port it.
- Prefer standard-library only; no external deps. C++: include what you use.

Build the output with a Node or Python script (assign each code string to a variable, then JSON.stringify / json.dump) to avoid escaping errors.

Write ${dir}/out.json = a JSON object mapping slug -> { javascript?, java?, cpp? } (include only the languages you ported). Valid JSON only. Do NOT touch the database or any source file. End with a one-line count summary.`;

phase('Port');
const runOne = async (t, attempt = 1) => {
  try {
    const r = await agent(prompt(t.dir), { label: `bf:${t.idx}${attempt > 1 ? '.r' : ''}`, phase: 'Port', agentType: 'general-purpose' });
    if (r == null && attempt < 2) return runOne(t, attempt + 1);
    return { ok: r != null };
  } catch { if (attempt < 2) return runOne(t, attempt + 1); return { ok: false }; }
};
const results = await parallel(tasks.map((t) => () => runOne(t)));
const done = results.filter((r) => r && r.ok).length;
log(`lang-backfill complete: ${done}/${tasks.length} slices ok`);
return { total: tasks.length, done };
