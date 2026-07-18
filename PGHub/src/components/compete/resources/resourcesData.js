// Curated resource shelf for the compete hub. `kind: 'internal'` items route inside
// PGHub; `kind: 'external'` items open a well-known, stable reference in a new tab.

export const RESOURCE_GROUPS = [
  {
    key: 'cp-foundations',
    title: 'Competitive foundations',
    blurb: 'The core toolkit every contest problem leans on — with interactive visualizers.',
    hue: 'var(--hue-violet)',
    items: [
      { label: 'Binary search patterns', to: '/visualize/binary-search', kind: 'internal' },
      { label: 'Sliding window', to: '/visualize/sliding-window', kind: 'internal' },
      { label: 'Union-Find', to: '/visualize/union-find', kind: 'internal' },
      { label: 'Dijkstra shortest paths', to: '/visualize/dijkstras-algorithm', kind: 'internal' },
      { label: 'Segment trees', to: '/learning', kind: 'internal' },
      { label: 'Dynamic programming', to: '/visualize/0-1-knapsack', kind: 'internal' },
      { label: 'Topological sort', to: '/visualize/topological-sort', kind: 'internal' },
    ],
  },
  {
    key: 'learn-classics',
    title: 'Learn the classics',
    blurb: 'The canonical, free references every competitive programmer keeps open.',
    hue: 'var(--hue-sky)',
    items: [
      { label: 'CP-Algorithms', href: 'https://cp-algorithms.com/', kind: 'external' },
      { label: 'USACO Guide', href: 'https://usaco.guide/', kind: 'external' },
      { label: 'Codeforces EDU', href: 'https://codeforces.com/edu/courses', kind: 'external' },
      { label: "Competitive Programmer's Handbook (PDF)", href: 'https://cses.fi/book/book.pdf', kind: 'external' },
      { label: 'MIT 6.006 (OCW)', href: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/', kind: 'external' },
    ],
  },
  {
    key: 'practice',
    title: 'Where to practice',
    blurb: 'Drill rated problems here and across every major judge.',
    hue: 'var(--hue-mint)',
    items: [
      { label: 'PGCode problem set', to: '/practice', kind: 'internal' },
      { label: 'LeetCode rated problems', to: '/compete/leetcode/problems', kind: 'internal' },
      { label: 'Rating predictor', to: '/compete/leetcode', kind: 'internal' },
      { label: 'Codeforces problemset', href: 'https://codeforces.com/problemset', kind: 'external' },
      { label: 'AtCoder', href: 'https://atcoder.jp/contests/', kind: 'external' },
      { label: 'CSES Problem Set', href: 'https://cses.fi/problemset/', kind: 'external' },
      { label: 'Project Euler', href: 'https://projecteuler.net/', kind: 'external' },
    ],
  },
  {
    key: 'interview',
    title: 'Interview preparation',
    blurb: 'Structured paths from fundamentals to company-tagged sets.',
    hue: 'var(--hue-pink)',
    items: [
      { label: 'PGPath roadmaps', to: '/', kind: 'internal' },
      { label: 'Company question sets', to: '/company', kind: 'internal' },
      { label: 'Pattern-based study plans', to: '/learning', kind: 'internal' },
      { label: 'Mock workspace', to: '/playground', kind: 'internal' },
      { label: 'Blind 75 list', to: '/practice', kind: 'internal' },
    ],
  },
  {
    key: 'ml-comp',
    title: 'ML competition prep',
    blurb: 'Background for data-science and machine-learning contests.',
    hue: 'var(--hue-violet)',
    items: [
      { label: 'PGForge ML lessons', to: '/ml/learn', kind: 'internal' },
      { label: 'ML math primers', to: '/ml/math', kind: 'internal' },
      { label: 'ML competitions board', to: '/compete/kaggle', kind: 'internal' },
      { label: 'Landmark papers', to: '/ml/papers', kind: 'internal' },
      { label: 'Kaggle Competitions', href: 'https://www.kaggle.com/competitions', kind: 'external' },
      { label: 'Papers With Code', href: 'https://paperswithcode.com/', kind: 'external' },
    ],
  },
  {
    key: 'opensource',
    title: 'Open source & internships',
    blurb: 'Get paid to contribute, or land a first real codebase.',
    hue: 'var(--hue-sky)',
    items: [
      { label: 'GSoC explorer', to: '/compete/gsoc', kind: 'internal' },
      { label: 'Hackathons board', to: '/compete/hackathons', kind: 'internal' },
      { label: 'Conferences & deadlines', to: '/compete/conferences', kind: 'internal' },
      { label: 'Google Summer of Code', href: 'https://summerofcode.withgoogle.com/', kind: 'external' },
      { label: 'Major League Hacking', href: 'https://mlh.io/seasons/2026/events', kind: 'external' },
      { label: 'Devpost hackathons', href: 'https://devpost.com/hackathons', kind: 'external' },
    ],
  },
  {
    key: 'reference',
    title: 'Quick reference',
    blurb: 'Cheatsheets you reach for mid-contest.',
    hue: 'var(--hue-mint)',
    items: [
      { label: 'Complexity cheatsheet', to: '/learning', kind: 'internal' },
      { label: 'Language idioms (Py/JS/Java/C++)', to: '/playground', kind: 'internal' },
      { label: 'Common pitfalls', to: '/learning', kind: 'internal' },
      { label: 'Big-O cheat sheet', href: 'https://www.bigocheatsheet.com/', kind: 'external' },
    ],
  },
  {
    key: 'community',
    title: 'Communities & staying sharp',
    blurb: 'Where competitive programmers discuss, upsolve, and improve.',
    hue: 'var(--hue-pink)',
    items: [
      { label: 'Codeforces blogs', href: 'https://codeforces.com/blog/entry/13529', kind: 'external' },
      { label: 'r/leetcode', href: 'https://www.reddit.com/r/leetcode/', kind: 'external' },
      { label: 'r/competitiveprogramming', href: 'https://www.reddit.com/r/competitiveprogramming/', kind: 'external' },
      { label: 'CodeChef Discuss', href: 'https://discuss.codechef.com/', kind: 'external' },
    ],
  },
];

export const RESOURCE_TIPS = [
  { title: 'Read every constraint first', detail: 'The bound on n usually tells you the intended time complexity before you read the prompt twice.' },
  { title: 'Code the brute force, then optimize', detail: 'A correct slow solution anchors your tests and reveals the pattern to speed up.' },
  { title: 'Keep a personal template', detail: 'Fast I/O, common data structures, and debug helpers ready to paste saves minutes per round.' },
  { title: 'Upsolve after the contest', detail: 'The problems just past your reach are where rating actually comes from — revisit them.' },
  { title: 'Practice with a timer', detail: 'Contest pressure is a skill. Simulate the clock so the real round feels familiar, not frantic.' },
  { title: 'Review editorials, even on AC', detail: 'The intended solution is often cleaner than yours — steal the technique for next time.' },
];
