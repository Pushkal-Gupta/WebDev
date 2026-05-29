// Achievement catalog. Each achievement has an `eligible(ctx)` predicate that
// runs over the user's current state to decide whether it should be granted.
//
// ctx = {
//   solvedCount, easyCount, medCount, hardCount,
//   currentStreak, longestStreak,
//   topicMastery: { [topicId]: { solved, total } },
//   topicsMasteredCount,           // topics with total>=5 fully solved
//   conceptsRead,                  // tracked via recordLocalVisit('concepts', slug)
//   visualizationsViewed,          // tracked via recordLocalVisit('viz', slug)
//   languagesUsed: Set<string>,    // distinct languages across submissions+byId
//   sharedSnippets,
//   contestsFinished,              // # of PGcode_user_contest_attempts rows
//   maxSolvesInOneDay,
//   noteCount,                     // # of progress rows with notes
//   maxOwnedListSize,              // largest count of problems in any custom list
//   fastestSolveMinutes,           // smallest gap between first attempt and accepted submit
//   solvedWeekendPair,             // true if a Sat + the following/preceding Sun both have solves
//   solvedAtNight,                 // true if any solve between midnight-4am local
// }

import {
  Award, Flame, Mountain, Sparkles, Zap, BookOpen, Globe, GitFork, Trophy, Crown, Target, Layers,
  Languages, Swords, CalendarRange, Timer, Medal, Trees, NotebookPen, FilePen, ListChecks,
  GraduationCap, BarChart3, MoonStar, Eye, CalendarDays,
} from 'lucide-react';

const VISIT_STORE_PREFIX = 'pgcode-visited-';

// Track that the user opened a given concept / visualization. Persists a Set of
// slugs in localStorage so the counter is stable across reloads even without a
// server-side telemetry table. Idempotent per slug.
export function recordLocalVisit(bucket, slug) {
  if (!bucket || !slug) return;
  try {
    const key = `${VISIT_STORE_PREFIX}${bucket}`;
    const raw = localStorage.getItem(key);
    const set = new Set(raw ? JSON.parse(raw) : []);
    if (set.has(slug)) return;
    set.add(slug);
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch { /* localStorage unavailable */ }
}

function getLocalVisitCount(bucket) {
  try {
    const raw = localStorage.getItem(`${VISIT_STORE_PREFIX}${bucket}`);
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.length : 0;
  } catch { return 0; }
}

export const ACHIEVEMENTS = [
  {
    id: 'first-solve',
    title: 'First Solve',
    description: 'You solved your first problem on PGcode.',
    icon: Sparkles,
    color: 'easy',
    category: 'solves',
    eligible: ctx => ctx.solvedCount >= 1,
  },
  {
    id: 'ten-solves',
    title: 'Getting Warm',
    description: 'Solved 10 problems.',
    icon: Target,
    color: 'medium',
    category: 'solves',
    eligible: ctx => ctx.solvedCount >= 10,
  },
  {
    id: 'fifty-solves',
    title: 'Half a Century',
    description: 'Solved 50 problems.',
    icon: Award,
    color: 'accent',
    category: 'solves',
    eligible: ctx => ctx.solvedCount >= 50,
  },
  {
    id: 'hundred-solves',
    title: 'Triple Digits',
    description: 'Solved 100 problems.',
    icon: Trophy,
    color: 'accent',
    category: 'solves',
    eligible: ctx => ctx.solvedCount >= 100,
  },
  {
    id: 'streak-7',
    title: 'Week Streak',
    description: '7-day solve streak.',
    icon: Flame,
    color: 'hard',
    category: 'streak',
    eligible: ctx => ctx.longestStreak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Month Streak',
    description: '30-day solve streak.',
    icon: Flame,
    color: 'hard',
    category: 'streak',
    eligible: ctx => ctx.longestStreak >= 30,
  },
  {
    id: 'streak-60',
    title: 'Streak 60',
    description: 'Two straight months — 60 days.',
    icon: Flame,
    color: 'hard',
    category: 'streak',
    eligible: ctx => ctx.longestStreak >= 60,
  },
  {
    id: 'streak-100',
    title: 'Century Streak',
    description: '100-day solve streak. Rare air.',
    icon: Flame,
    color: 'hard',
    category: 'streak',
    eligible: ctx => ctx.longestStreak >= 100,
  },
  {
    id: 'streak-365',
    title: 'Year Streak',
    description: '365-day solve streak. A full year of showing up.',
    icon: Flame,
    color: 'hard',
    category: 'streak',
    eligible: ctx => ctx.longestStreak >= 365,
  },
  {
    id: 'hard-five',
    title: 'Hard Hitter',
    description: 'Solved 5 Hard-difficulty problems.',
    icon: Mountain,
    color: 'hard',
    category: 'difficulty',
    eligible: ctx => ctx.hardCount >= 5,
  },
  {
    id: 'hard-ten',
    title: 'Hard 10',
    description: 'Cleared 10 Hard problems.',
    icon: Mountain,
    color: 'hard',
    category: 'difficulty',
    eligible: ctx => ctx.hardCount >= 10,
  },
  {
    id: 'hard-twentyfive',
    title: 'Hard 25',
    description: 'Twenty-five Hards down. The grind is real.',
    icon: Mountain,
    color: 'hard',
    category: 'difficulty',
    eligible: ctx => ctx.hardCount >= 25,
  },
  {
    id: 'all-difficulties',
    title: 'Well-Rounded',
    description: 'Solved at least one Easy, one Medium, and one Hard.',
    icon: Layers,
    color: 'accent',
    category: 'difficulty',
    eligible: ctx => ctx.easyCount >= 1 && ctx.medCount >= 1 && ctx.hardCount >= 1,
  },
  {
    id: 'topic-mastery',
    title: 'Topic Master',
    description: 'Reached 100% completion on any topic with 5+ problems.',
    icon: Crown,
    color: 'accent',
    category: 'topic',
    eligible: ctx => Object.values(ctx.topicMastery || {}).some(t => t.total >= 5 && t.solved === t.total),
  },
  {
    id: 'topic-master-three',
    title: 'Topic Master x3',
    description: 'Fully cleared three different topics (5+ problems each).',
    icon: Trees,
    color: 'accent',
    category: 'topic',
    eligible: ctx => (ctx.topicsMasteredCount || 0) >= 3,
  },
  {
    id: 'concept-curious',
    title: 'Concept Curious',
    description: 'Read 5 concept pages.',
    icon: BookOpen,
    color: 'medium',
    category: 'discovery',
    eligible: ctx => (ctx.conceptsRead || 0) >= 5,
  },
  {
    id: 'theory-junkie',
    title: 'Theory Junkie',
    description: 'Opened 25 concept pages in the Learn library.',
    icon: GraduationCap,
    color: 'medium',
    category: 'discovery',
    eligible: ctx => (ctx.conceptsRead || 0) >= 25,
  },
  {
    id: 'visualizer',
    title: 'Visualizer',
    description: 'Viewed 10 algorithm visualizations.',
    icon: Eye,
    color: 'medium',
    category: 'discovery',
    eligible: ctx => (ctx.visualizationsViewed || 0) >= 10,
  },
  {
    id: 'polyglot',
    title: 'Polyglot',
    description: 'Submitted code in 3+ different languages.',
    icon: Globe,
    color: 'accent',
    category: 'language',
    eligible: ctx => (ctx.languagesUsed?.size || 0) >= 3,
  },
  {
    id: 'trilingual',
    title: 'Trilingual',
    description: 'Shipped accepted solutions in 3 distinct languages.',
    icon: Languages,
    color: 'accent',
    category: 'language',
    eligible: ctx => (ctx.acceptedLanguages?.size || 0) >= 3,
  },
  {
    id: 'quintet',
    title: 'Quintet',
    description: 'Submitted in 5 different languages.',
    icon: Languages,
    color: 'accent',
    category: 'language',
    eligible: ctx => (ctx.languagesUsed?.size || 0) >= 5,
  },
  {
    id: 'shared-snippet',
    title: 'Open Source',
    description: 'Created your first shareable playground link.',
    icon: GitFork,
    color: 'medium',
    category: 'curation',
    eligible: ctx => (ctx.sharedSnippets || 0) >= 1,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Solved 3 problems in a single day.',
    icon: Zap,
    color: 'medium',
    category: 'habit',
    eligible: ctx => (ctx.maxSolvesInOneDay || 0) >= 3,
  },
  {
    id: 'sub-five',
    title: 'Sub-5',
    description: 'Cracked a problem in under 5 minutes from first attempt to accepted.',
    icon: Timer,
    color: 'medium',
    category: 'habit',
    eligible: ctx => (ctx.fastestSolveMinutes ?? Infinity) > 0 && ctx.fastestSolveMinutes < 5,
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Solved problems on both Saturday and Sunday of the same weekend.',
    icon: CalendarRange,
    color: 'accent',
    category: 'habit',
    eligible: ctx => !!ctx.solvedWeekendPair,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Submitted between midnight and 4 AM local time.',
    icon: MoonStar,
    color: 'medium',
    category: 'habit',
    eligible: ctx => !!ctx.solvedAtNight,
  },
  {
    id: 'contest-rookie',
    title: 'Contest Rookie',
    description: 'Entered your first PGcode contest.',
    icon: Swords,
    color: 'medium',
    category: 'contest',
    eligible: ctx => (ctx.contestsFinished || 0) >= 1,
  },
  {
    id: 'contest-regular',
    title: 'Contest Regular',
    description: 'Competed in 5 contests.',
    icon: Medal,
    color: 'accent',
    category: 'contest',
    eligible: ctx => (ctx.contestsFinished || 0) >= 5,
  },
  {
    id: 'journaler',
    title: 'Journaler',
    description: 'Wrote notes on 5 different problems.',
    icon: NotebookPen,
    color: 'medium',
    category: 'curation',
    eligible: ctx => (ctx.noteCount || 0) >= 5,
  },
  {
    id: 'annotator',
    title: 'Annotator',
    description: 'Wrote notes on 25 problems — the Notebook is a real archive now.',
    icon: FilePen,
    color: 'accent',
    category: 'curation',
    eligible: ctx => (ctx.noteCount || 0) >= 25,
  },
  {
    id: 'curator',
    title: 'Curator',
    description: 'Built a custom list containing 10+ problems.',
    icon: ListChecks,
    color: 'accent',
    category: 'curation',
    eligible: ctx => (ctx.maxOwnedListSize || 0) >= 10,
  },
  {
    id: 'bar-raiser',
    title: 'Bar Raiser',
    description: 'Hit 50 Mediums solved.',
    icon: BarChart3,
    color: 'medium',
    category: 'difficulty',
    eligible: ctx => (ctx.medCount || 0) >= 50,
  },
  // Monthly challenges — parametric, retroactive for last 6 months + current.
  // ids match the catalog table seeded in scripts/migrate-45-streak-monthly-badges.sql.
  // Eligibility reads ctx.solvesByMonth, a {YYYYMM: count} map built from
  // PGcode_user_progress.last_solved_at timestamps.
  ...buildMonthlyAchievements(),
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Generate monthly badges for the last 6 months + current month.
// Kept in sync with the SQL seed by sharing the YYYYMM key convention.
function buildMonthlyAchievements() {
  const now = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const monthIdx = d.getMonth();
    const yyyymm = `${year}${String(monthIdx + 1).padStart(2, '0')}`;
    const pretty = `${MONTH_NAMES[monthIdx]} ${year}`;
    result.push({
      id: `monthly-${yyyymm}`,
      title: `${pretty} Challenge`,
      description: `Solve 30 problems during ${pretty}.`,
      icon: CalendarDays,
      color: 'accent',
      category: 'monthly',
      monthKey: yyyymm,
      eligible: ctx => (ctx.solvesByMonth?.[yyyymm] || 0) >= 30,
    });
  }
  return result;
}

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

// Run every catalog entry against ctx, return ids that are currently earned.
export function computeEarned(ctx) {
  return ACHIEVEMENTS.filter(a => {
    try { return a.eligible(ctx); } catch { return false; }
  }).map(a => a.id);
}

// Build the ctx object from query-hook data.
export function buildAchievementContext({
  problems,
  byId,
  profile,
  sharedSnippets = 0,
  submissions = [],
  contestAttempts = [],
  listSizes = {},
}) {
  const solved = (problems || []).filter(p => byId?.[p.id]?.is_completed);
  const easyCount = solved.filter(p => p.difficulty === 'Easy').length;
  const medCount = solved.filter(p => p.difficulty === 'Medium').length;
  const hardCount = solved.filter(p => p.difficulty === 'Hard').length;

  const topicMastery = {};
  (problems || []).forEach(p => {
    if (!topicMastery[p.topic_id]) topicMastery[p.topic_id] = { total: 0, solved: 0 };
    topicMastery[p.topic_id].total++;
    if (byId?.[p.id]?.is_completed) topicMastery[p.topic_id].solved++;
  });
  const topicsMasteredCount = Object.values(topicMastery).filter(t => t.total >= 5 && t.solved === t.total).length;

  // Languages: prefer the submissions log (authoritative — Run/Submit records
  // every language tried). Fall back to per-progress last_code blob for users
  // whose submission history was never persisted.
  const languagesUsed = new Set();
  const acceptedLanguages = new Set();
  (submissions || []).forEach(s => {
    if (s?.language) languagesUsed.add(s.language);
    if (s?.language && (s.verdict === 'Accepted' || s.verdict === 'accepted')) {
      acceptedLanguages.add(s.language);
    }
  });
  Object.values(byId || {}).forEach(p => {
    if (p.last_code && typeof p.last_code === 'object') {
      Object.keys(p.last_code).forEach(lang => {
        if (p.last_code[lang]?.length > 0) languagesUsed.add(lang);
      });
    }
  });

  // Max solves in one day + note count + weekend / night-owl flags + fastest solve
  // + per-month solve totals (powers the monthly-YYYYMM badges).
  const solveCounts = {};
  const solvesByMonth = {};
  let noteCount = 0;
  const solveDays = new Set();
  let solvedAtNight = false;
  Object.values(byId || {}).forEach(p => {
    if (p.notes && String(p.notes).trim().length > 0) noteCount += 1;
    if (p.is_completed && p.last_solved_at) {
      const d = new Date(p.last_solved_at);
      const day = d.toDateString();
      solveCounts[day] = (solveCounts[day] || 0) + 1;
      solveDays.add(day);
      const hr = d.getHours();
      if (hr >= 0 && hr < 4) solvedAtNight = true;
      const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
      solvesByMonth[yyyymm] = (solvesByMonth[yyyymm] || 0) + 1;
    }
  });
  const maxSolvesInOneDay = Math.max(0, ...Object.values(solveCounts));

  // Weekend pair: any Saturday in solveDays whose adjacent Sunday is also there.
  let solvedWeekendPair = false;
  for (const dayStr of solveDays) {
    const d = new Date(dayStr);
    if (d.getDay() === 6) {
      const sun = new Date(d);
      sun.setDate(d.getDate() + 1);
      if (solveDays.has(sun.toDateString())) { solvedWeekendPair = true; break; }
    }
  }

  // Fastest solve in minutes — pair earliest submission per problem with its
  // first Accepted submission. Requires the submission history to be present.
  let fastestSolveMinutes = Infinity;
  const firstSeen = {};
  const firstAccepted = {};
  (submissions || []).forEach(s => {
    if (!s?.problem_id || !s?.created_at) return;
    const t = new Date(s.created_at).getTime();
    if (Number.isNaN(t)) return;
    if (!(s.problem_id in firstSeen) || t < firstSeen[s.problem_id]) firstSeen[s.problem_id] = t;
    if ((s.verdict === 'Accepted' || s.verdict === 'accepted')
      && (!(s.problem_id in firstAccepted) || t < firstAccepted[s.problem_id])) {
      firstAccepted[s.problem_id] = t;
    }
  });
  Object.keys(firstAccepted).forEach(pid => {
    const start = firstSeen[pid];
    const end = firstAccepted[pid];
    if (start && end && end >= start) {
      const mins = (end - start) / 60000;
      if (mins < fastestSolveMinutes) fastestSolveMinutes = mins;
    }
  });
  if (fastestSolveMinutes === Infinity) fastestSolveMinutes = null;

  // Custom-list curator metric: biggest list owned.
  const maxOwnedListSize = Math.max(0, ...Object.values(listSizes || {}));

  // Contests finished (any attempt row counts — entering is the achievement bar).
  const contestsFinished = (contestAttempts || []).length;

  return {
    solvedCount: solved.length,
    easyCount, medCount, hardCount,
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    topicMastery,
    topicsMasteredCount,
    conceptsRead: getLocalVisitCount('concepts'),
    visualizationsViewed: getLocalVisitCount('viz'),
    languagesUsed,
    acceptedLanguages,
    sharedSnippets,
    contestsFinished,
    maxSolvesInOneDay,
    noteCount,
    maxOwnedListSize,
    fastestSolveMinutes,
    solvedWeekendPair,
    solvedAtNight,
    solvesByMonth,
  };
}

// Stable ordering for the category section headings in the Achievements UI.
// Anything not in this list falls through to "Other".
export const CATEGORY_ORDER = [
  'solves',
  'streak',
  'monthly',
  'difficulty',
  'topic',
  'language',
  'contest',
  'curation',
  'discovery',
  'habit',
];

export const CATEGORY_LABELS = {
  solves: 'Solve milestones',
  streak: 'Streaks',
  monthly: 'Monthly challenges',
  difficulty: 'Difficulty',
  topic: 'Topic mastery',
  language: 'Languages',
  contest: 'Contests',
  curation: 'Notes & lists',
  discovery: 'Learn & visualize',
  habit: 'Habits',
};
