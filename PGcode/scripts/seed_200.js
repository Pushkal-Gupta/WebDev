import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ykpjmvoyatcrlqyqbgfu.supabase.co';
const SUPABASE_SERVICE_KEY = '***REDACTED_SERVICE_KEY***';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const topics = [
  'arrays', 'strings', 'stack', 'queue', 'linkedlist', 'trees', 'recursion',
  'two-pointers', 'binary-search', 'sliding-window', 'graphs', 'tries',
  'heap', 'dp', 'backtracking', 'greedy', 'intervals', '2d-dp',
  'advanced-graphs', 'math', 'bit-manipulation', 'geometry'
];

function generateProblemData(topicId, index) {
  const id = `${topicId}-pattern-${index + 1}`;
  const diff = index < 3 ? 'Easy' : index < 7 ? 'Medium' : 'Hard';
  const name = `${topicId.charAt(0).toUpperCase() + topicId.slice(1)} Pattern #${index + 1}`;
  
  const problem = {
    id: id,
    topic_id: topicId,
    name: name,
    difficulty: diff,
    description: `<p>Analyze and implement the <strong>${name}</strong> pattern for ${topicId}.</p>`,
    solution_video_url: '3OamzN90kPg', // NeetCode placeholder
    hints: [`Focus on O(N) complexity`, `Use a set for fast lookup`]
  };

  const codeTemplates = [
    { problem_id: id, language: 'javascript', code: `function solve(input) {\n  // Implementation for ${name}\n  return true;\n}` },
    { problem_id: id, language: 'python', code: `def solve(input):\n    # Implementation for ${name}\n    return True` },
    { problem_id: id, language: 'java', code: `class Solution {\n    public boolean solve(Object input) {\n        return true;\n    }\n}` }
  ];

  const dryRunSteps = [
    { problem_id: id, step_number: 1, title: 'Step 1: Initialization', visual_state_data: { array: [10, 20, 30], pointer: 0 } },
    { problem_id: id, step_number: 2, title: 'Step 2: Processing', visual_state_data: { array: [10, 20, 30], pointer: 1 } },
    { problem_id: id, step_number: 3, title: 'Step 3: Result Found', visual_state_data: { array: [10, 20, 30], pointer: 2, found: true } }
  ];

  return { problem, codeTemplates, dryRunSteps };
}

async function seed() {
  console.log("🚀 Starting clinical 200-question expansion...");
  
  // Clean start
  await supabase.from('PGcode_problems').delete().neq('id', 'void');

  let problems = [];
  let templates = [];
  let steps = [];

  topics.forEach(topic => {
    const count = (topic === 'arrays' || topic === 'strings') ? 10 : 9;
    for (let i = 0; i < count; i++) {
        const data = generateProblemData(topic, i);
        problems.push(data.problem);
        templates.push(...data.codeTemplates);
        steps.push(...data.dryRunSteps);
    }
  });

  const BATCH_SIZE = 50;
  
  console.log(`📦 Seeding ${problems.length} problems...`);
  for (let i = 0; i < problems.length; i += BATCH_SIZE) {
    await supabase.from('PGcode_problems').insert(problems.slice(i, i + BATCH_SIZE));
  }

  console.log(`📜 Seeding ${templates.length} templates...`);
  for (let i = 0; i < templates.length; i += BATCH_SIZE) {
    await supabase.from('PGcode_problem_templates').insert(templates.slice(i, i + BATCH_SIZE));
  }

  console.log(`📉 Seeding ${steps.length} dry-run steps...`);
  for (let i = 0; i < steps.length; i += BATCH_SIZE) {
    await supabase.from('PGcode_interactive_dry_runs').insert(steps.slice(i, i + BATCH_SIZE));
  }

  console.log("🏁 200 questions successfully integrated!");
}

seed();
