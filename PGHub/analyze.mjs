import { COURSES, COURSE_CARDS } from './src/content/courses.js';

const courseList = [
  'python-basics',
  'javascript-basics',
  'react-basics',
  'java-basics',
  'cpp-basics',
  'typescript-basics',
  'go-basics'
];

const summaryRows = [];

courseList.forEach(id => {
  const course = COURSES[id];
  if (!course || !course.lessons) return;
  
  const lessons = course.lessons;
  const totalIntro = lessons.reduce((s, l) => s + (l.intro || '').length, 0);
  const avgIntro = Math.round(totalIntro / lessons.length);
  
  const allHaveExercise = lessons.every(l => !!l.exercise);
  const avgExerciseStarter = Math.round(
    lessons.reduce((s, l) => s + (l.exercise?.starter || '').length, 0) / lessons.length
  );
  
  const depth = avgIntro > 200 ? 'deep' : avgIntro > 100 ? 'medium' : 'thin';
  
  let issues = [];
  if (!allHaveExercise) issues.push(`${lessons.filter(l => !l.exercise).length} missing exercises`);
  if (avgExerciseStarter < 30) issues.push('weak starter code');
  
  summaryRows.push({
    course: course.title,
    lessons: lessons.length,
    depth,
    avgIntro,
    issues: issues.length ? issues.join('; ') : 'none'
  });
});

// Sort by depth
summaryRows.sort((a, b) => {
  const depthRank = { thin: 0, medium: 1, deep: 2 };
  return depthRank[a.depth] - depthRank[b.depth];
});

console.log('COURSE QUALITY MATRIX');
console.log('Course | Lessons | Depth | Avg Intro | Issues');
console.log('------|---------|-------|-----------|--------');
summaryRows.forEach(r => {
  console.log(
    `${r.course.padEnd(20)} | ${r.lessons} | ${r.depth.padEnd(6)} | ${r.avgIntro}c | ${r.issues}`
  );
});

// Identify worst courses
console.log('\n\nWORST 3 BY DEPTH + EXERCISE COVERAGE:');
const scored = courseList.map(id => {
  const c = COURSES[id];
  const lessons = c.lessons || [];
  const depthScore = lessons.reduce((s, l) => s + (l.intro || '').length, 0) / lessons.length;
  const exScore = lessons.filter(l => l.exercise).length / lessons.length;
  const starterScore = lessons.reduce((s, l) => s + (l.exercise?.starter || '').length, 0) / lessons.length;
  return {
    name: c.title,
    overall: (depthScore / 200) * 0.4 + exScore * 0.35 + (starterScore / 100) * 0.25
  };
}).sort((a, b) => a.overall - b.overall);

scored.slice(0, 3).forEach((c, i) => {
  console.log(`${i + 1}. ${c.name} (score: ${c.overall.toFixed(2)})`);
});

console.log('\n\nMISSING TOPICS (interview-prep priority):');
console.log('- Python: decorators, generators, async/await, *args/**kwargs, context managers');
console.log('- JavaScript: prototypes, this binding, event delegation, error handling, async patterns');
console.log('- TypeScript: conditional types, mapped types, readonly modifiers, type guards, assertion syntax');
console.log('- Java: OOP (inheritance/polymorphism), interfaces, exception handling, file I/O, concurrency');
console.log('- C++: templates, smart pointers, move semantics, RAII, STL breadth (deque, priority_queue)');
console.log('- Go: goroutines, channels, interfaces, error handling patterns');
console.log('- React: hooks (useEffect, useContext, useReducer), error boundaries, portals, refs');
console.log('- Across all: No Rust course, No dedicated DSA course, No async/concurrency patterns');
