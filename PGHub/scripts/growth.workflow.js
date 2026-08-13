export const meta = {
  name: 'pghub-testcase-growth',
  description: 'Generate valid, constraint-respecting test INPUTS for under-covered problems (Python grades downstream)',
  phases: [{ title: 'Generate', detail: 'one agent per slice; writes {slug:[[input,...],...]} to its dir' }],
};
const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args || {});
let tasks = (parsedArgs && parsedArgs.tasks) || [];
if (!tasks.length && parsedArgs.base) for (let i = 0; i < (parsedArgs.count || 0); i++) tasks.push({ dir: `${parsedArgs.base}/growth/wf/s${i}`, idx: i });
log(`testcase-growth: ${tasks.length} slices`);

const prompt = (dir) => `Generate additional VALID test-case INPUTS for under-covered PGHub coding problems (project /Users/pushkalgupta/Desktop/WebDev/PGHub). These problems currently have very few test cases; we need more COVERAGE that strictly respects each problem's constraints.

Read ${dir}/slice.json — an array of problems { id, name, difficulty, constraints, method_name, params, return_type, python, sampleInputs }. \`python\` is the correct canonical solution; \`constraints\` states the valid input ranges/shape; \`sampleInputs\` is 1-2 EXISTING valid input tuples for that problem.

For EACH problem, produce ~24 NEW, DIVERSE, STRICTLY-VALID input tuples. Each tuple is an array of per-parameter strings, one per entry in \`params\`.

CRITICAL — COPY THE EXACT STRING FORMAT of \`sampleInputs\`. This is the single most important rule: your output tuples must be byte-for-byte format-compatible with the samples. In particular note how the samples encode each type — e.g. a str param appears JSON-QUOTED like "\\"leetcode\\"" (the string literally includes the double-quotes), NOT bare leetcode; a char is "\\"x\\""; List[str] is "[\\"a\\",\\"b\\"]". If sampleInputs shows quotes, you MUST include quotes. Mirror the samples exactly for every param position; only change the VALUES (respecting constraints), never the encoding. If sampleInputs is empty, fall back to: int "7", float "1.5", bool "true", str "\\"abc\\"" (quoted), List[int] "[1,2,3]".
Match the order and types of \`params\` exactly.

CRITICAL — every input MUST satisfy the stated constraints. This is the whole point: DO NOT emit out-of-domain inputs. Examples of what to NEVER do: an edge/index >= n when the constraint says indices are 0..n-1; a negative where the constraint says >= 0; an unsorted array where the constraint says sorted/non-decreasing; a value beyond the stated numeric bound; a wrong array length. Read the constraints carefully and honor relational constraints (e.g. edges[i] within [0, n-1], k <= len, 1 <= x <= n).

Aim for coverage variety: minimums (empty/size-1 where allowed), maximum-size within bounds, all-equal, negatives (only if allowed), sorted/reverse, duplicates, boundary values at the constraint edges, and typical middles. You do NOT compute outputs — Python does that downstream; you only produce valid inputs.

Build the output with a Node/Python script (assemble the object, then JSON.stringify/json.dump) to avoid escaping errors.

Write ${dir}/out.json = a JSON object mapping slug -> array of input-tuples (each tuple an array of strings). Valid JSON only. Do NOT touch the database or any source file. End with a one-line count summary.`;

phase('Generate');
const runOne = async (t, attempt = 1) => {
  try { const r = await agent(prompt(t.dir), { label: `grow:${t.idx}${attempt > 1 ? '.r' : ''}`, phase: 'Generate', agentType: 'general-purpose' }); if (r == null && attempt < 2) return runOne(t, attempt + 1); return { ok: r != null }; }
  catch { if (attempt < 2) return runOne(t, attempt + 1); return { ok: false }; }
};
const results = await parallel(tasks.map((t) => () => runOne(t)));
const done = results.filter((r) => r && r.ok).length;
log(`testcase-growth complete: ${done}/${tasks.length} slices ok`);
return { total: tasks.length, done };
