export const meta = {
  name: 'qa-scrum',
  description: 'Identify + verify QA issues across PGHub into a ranked, deduped backlog',
  phases: [
    { title: 'Identify', detail: 'parallel read-only sweeps per area' },
    { title: 'Verify', detail: 'confirm each finding is real + reproducible' },
  ],
};

const ROOT = '/Users/pushkalgupta/Desktop/WebDev/PGHub';

const AREAS = [
  {
    key: 'practice',
    prompt: `Read-only QA sweep of the Practice surface in ${ROOT}: ProblemList.jsx, Workspace.jsx, and src/lib/queries.js. Look for REAL user-facing bugs: search/filter/pagination wrong results, Run/Submit failures, examples panel formatting, count/numbering display, status pills, broken links, hook-order/TDZ crashes. Do NOT propose features — only defects. For each, give a precise repro and the expected behavior.`,
  },
  {
    key: 'ml-forge',
    prompt: `Read-only QA sweep of the ML/PGForge surface in ${ROOT}: src/components/ml/** (MLHub, MLLesson, forge/PGForgeProblemDetail, RunnableCodePanel usage, viz registry). Look for REAL defects: broken viz, code panel not running, markdown/KaTeX rendering raw LaTeX, oversized/overflowing diagrams, inner scrollbars, missing titles/visuals on cards, broken routes. Precise repro + expected per item.`,
  },
  {
    key: 'learn-viz',
    prompt: `Read-only QA sweep of Learn/Visualize/Concepts/Tutorial in ${ROOT}: src/components/learn/** (VisualizeIndex, AlgoVisualizer, ConceptPage, dsaTutorialShared, RunnableCode*). Look for REAL defects: visualizations overflowing/too big, SVG viewBox mismatch, code blocks not unified/runnable, markdown/KaTeX bugs, empty space, inner scrollbars, broken stepping/playback. Precise repro + expected.`,
  },
  {
    key: 'compete',
    prompt: `Read-only QA sweep of Compete/Contests/Arena/Companies in ${ROOT}: src/components/contests/**, company/**, compete dashboards. Look for REAL defects: card visuals unrelated to topic, broken data load/empty states, chart rendering, navigation (back buttons), overflow, hardcoded colors. Precise repro + expected. (Avoid editing — read only.)`,
  },
  {
    key: 'vault',
    prompt: `Read-only QA sweep of Vault/Lists/Notes/Review/Progress/Achievements in ${ROOT}: src/components/** for these routes. Look for REAL defects: CRUD failing after login (RLS), missing back navigation, empty-state copy, broken charts/heatmaps, overflow, inconsistent gutters. Precise repro + expected.`,
  },
  {
    key: 'cross-cutting',
    prompt: `Read-only cross-cutting QA sweep of ${ROOT}/src: find HARD-rule violations — hardcoded colors instead of theme tokens, any emoji in source, inner scrollbars (overflow:auto/scroll on inner content), dead empty space below content, non-responsive fixed widths, broken/orphaned lazy routes in App.jsx, console-error-prone patterns. Report file:line per violation with the exact offending snippet.`,
  },
];

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'severity', 'file', 'repro', 'expected'],
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['P0', 'P1', 'P2'] },
          file: { type: 'string' },
          repro: { type: 'string' },
          expected: { type: 'string' },
          fixHint: { type: 'string' },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isReal', 'severity', 'reason'],
  properties: {
    isReal: { type: 'boolean' },
    severity: { type: 'string', enum: ['P0', 'P1', 'P2'] },
    reason: { type: 'string' },
    fixHint: { type: 'string' },
  },
};

phase('Identify');
const swept = await pipeline(
  AREAS,
  (a) => agent(a.prompt, { label: `scan:${a.key}`, phase: 'Identify', schema: FINDINGS_SCHEMA }),
  (found, area) => parallel(((found && found.items) || []).map((it) => () =>
    agent(
      `Independently verify this QA finding is REAL and reproducible by reading the cited code. Be skeptical — default isReal=false if you cannot confirm from the code. Finding: ${JSON.stringify(it)}. Confirm the file exists and the described defect is actually present; set the confirmed severity and a concrete one-line fixHint.`,
      { label: `verify:${area.key}`, phase: 'Verify', schema: VERDICT_SCHEMA },
    ).then((v) => ({ ...it, area: area.key, verdict: v })).catch(() => null),
  )),
);

const confirmed = swept
  .flat()
  .filter(Boolean)
  .filter((f) => f.verdict && f.verdict.isReal)
  .map((f) => ({
    title: f.title,
    area: f.area,
    severity: f.verdict.severity || f.severity,
    file: f.file,
    repro: f.repro,
    expected: f.expected,
    fixHint: f.verdict.fixHint || f.fixHint || '',
  }))
  .sort((a, b) => a.severity.localeCompare(b.severity));

log(`QA sweep: ${confirmed.length} confirmed issues (${confirmed.filter((c) => c.severity === 'P0').length} P0)`);
return { confirmed };
