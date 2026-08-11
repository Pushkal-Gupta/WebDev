export const meta = {
  name: 'pghub-content-drive',
  description: 'Generate viz_steps + multi-approach editorials for all remaining PGHub problems',
  phases: [{ title: 'Generate', detail: 'one agent per slice; writes out.json to its slice dir' }],
};

// args = { base, vizCount, apprCount }  OR  { tasks: [{kind,dir,idx}] }
const parsedArgs = typeof args === 'string' ? JSON.parse(args) : (args || {});
let tasks = (parsedArgs && parsedArgs.tasks) || [];
if (!tasks.length && parsedArgs.base) {
  const base = parsedArgs.base;
  for (let i = 0; i < (parsedArgs.vizCount || 0); i++) tasks.push({ kind: 'viz', dir: `${base}/viz/wf/s${i}`, idx: i });
  for (let i = 0; i < (parsedArgs.apprCount || 0); i++) tasks.push({ kind: 'appr', dir: `${base}/appr/wf/s${i}`, idx: i });
}
log(`content-drive: ${tasks.length} slices (${tasks.filter(t => t.kind === 'viz').length} viz, ${tasks.filter(t => t.kind === 'appr').length} appr)`);

const vizPrompt = (dir) => `Build MANIM-style algorithm-step visualizations for PGHub coding problems (project /Users/pushkalgupta/Desktop/WebDev/PGHub).

Read ${dir}/slice.json — an array of problems {id,name,pattern,difficulty,method_name,params,tags,description,python}. python is the canonical optimal solution; these problems have NO visualization yet.

For EACH problem produce viz_steps = { title, renderer, frames }:
- renderer: "array" for almost everything; "window" only for sliding-window problems.
- ARRAY frame: { array:[...], pointers:{"i":0}, highlights:[2], caption:"narration of this step", chip:"val" } — only array+caption required per frame.
- WINDOW frame: { array:[...], window:{start,end}, pointers:{...}, caption:"..." }.
- 8-14 frames, each a REAL step of the algorithm executing (init -> iterate -> update -> result); last frame states the final answer.
- Pick a SMALL example (length 5-8). Trace the ACTUAL python; HAND-VERIFY the final answer.
Rules: no emoji anywhere; narration-voice captions; arrays <=10 elements.

Write ${dir}/out-0.json = a JSON array of { id, viz_steps }, one per problem. Valid JSON only. Do NOT touch the database, MLLesson.jsx, or any source file. End with a one-line count summary.`;

const apprPrompt = (dir) => `Improve PGHub problem editorials (project /Users/pushkalgupta/Desktop/WebDev/PGHub).

Read ${dir}/slice.json — an array of Medium/Hard problems {id,name,pattern,difficulty,python,editorial}. Each currently has a SINGLE-approach editorial.

For EACH problem rewrite editorial_md (markdown) with MULTIPLE approaches:
- ## Intuition (2-4 sentences reframing the problem)
- ## Brute force — naive approach, why it works, **Time:** O(...), **Space:** O(...)
- ## Optimal — efficient approach matching the given python, the key insight, **Time:** O(...), **Space:** O(...), plus a short \`\`\`python block matching the technique
- optionally ## Why it works or ## Edge cases
Approaches and complexities must be ACCURATE and match the pattern+python. 250-500 words. No emoji; instructional voice ok; no builder/PM pitch; proper markdown.
Build the output with a Node or Python script (assign each editorial to a variable, then JSON.stringify / json.dump) to avoid JSON-escaping errors.

Write ${dir}/out-0.json = a JSON array of { id, editorial_md }, one per problem. Valid JSON only. Do NOT touch the database or any source file. End with a one-line count summary.`;

phase('Generate');
// One retry per task so a transient API error (connection-closed / stall) doesn't waste a slice.
// A hard spend-cap rejection will still fail both attempts — that's surfaced, not silently retried forever.
const runOne = async (t, attempt = 1) => {
  const prompt = t.kind === 'viz' ? vizPrompt(t.dir) : apprPrompt(t.dir);
  try {
    const r = await agent(prompt, { label: `${t.kind}:${t.idx}${attempt > 1 ? '.r' : ''}`, phase: 'Generate', agentType: 'general-purpose' });
    if (r == null && attempt < 2) return runOne(t, attempt + 1);
    return { ok: r != null, kind: t.kind };
  } catch {
    if (attempt < 2) return runOne(t, attempt + 1);
    return { ok: false, kind: t.kind };
  }
};
const results = await parallel(tasks.map((t) => () => runOne(t)));

const done = results.filter((r) => r && r.ok).length;
const vizDone = results.filter((r) => r && r.ok && r.kind === 'viz').length;
const apprDone = results.filter((r) => r && r.ok && r.kind === 'appr').length;
log(`content-drive complete: ${done}/${tasks.length} slices ok (viz ${vizDone}, appr ${apprDone})`);
return { total: tasks.length, done, vizDone, apprDone };
