// Achievement catalog. Each achievement has an `eligible(ctx)` predicate that
// runs over the user's current state to decide whether it should be granted.
//
// ctx = {
//   solvedCount: number,
//   easyCount: number,
//   medCount: number,
//   hardCount: number,
//   currentStreak: number,
//   longestStreak: number,
//   topicMastery: { [topicId]: { solved, total } },
//   conceptsRead: number,
//   languagesUsed: Set<string>,
//   sharedSnippets: number,
//   contestsFinished: number,
// }

import { Award, Flame, Mountain, Sparkles, Zap, BookOpen, Globe, GitFork, Trophy, Crown, Target, Layers } from 'lucide-react';

export const ACHIEVEMENTS = [
  {
    id: 'first-solve',
    title: 'First Solve',
    description: 'You solved your first problem on PGcode.',
    icon: Sparkles,
    color: 'easy',
    eligible: ctx => ctx.solvedCount >= 1,
  },
  {
    id: 'ten-solves',
    title: 'Getting Warm',
    description: 'Solved 10 problems.',
    icon: Target,
    color: 'medium',
    eligible: ctx => ctx.solvedCount >= 10,
  },
  {
    id: 'fifty-solves',
    title: 'Half a Century',
    description: 'Solved 50 problems.',
    icon: Award,
    color: 'accent',
    eligible: ctx => ctx.solvedCount >= 50,
  },
  {
    id: 'hundred-solves',
    title: 'Triple Digits',
    description: 'Solved 100 problems.',
    icon: Trophy,
    color: 'accent',
    eligible: ctx => ctx.solvedCount >= 100,
  },
  {
    id: 'streak-7',
    title: 'Week Strong',
    description: 'Maintained a 7-day solve streak.',
    icon: Flame,
    color: 'hard',
    eligible: ctx => ctx.longestStreak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Month-long Marathon',
    description: '30-day streak. You showed up.',
    icon: Flame,
    color: 'hard',
    eligible: ctx => ctx.longestStreak >= 30,
  },
  {
    id: 'hard-five',
    title: 'Hard Hitter',
    description: 'Solved 5 Hard-difficulty problems.',
    icon: Mountain,
    color: 'hard',
    eligible: ctx => ctx.hardCount >= 5,
  },
  {
    id: 'all-difficulties',
    title: 'Well-Rounded',
    description: 'Solved at least one Easy, one Medium, and one Hard.',
    icon: Layers,
    color: 'accent',
    eligible: ctx => ctx.easyCount >= 1 && ctx.medCount >= 1 && ctx.hardCount >= 1,
  },
  {
    id: 'topic-mastery',
    title: 'Topic Master',
    description: 'Reached 100% completion on any topic with 5+ problems.',
    icon: Crown,
    color: 'accent',
    eligible: ctx => Object.values(ctx.topicMastery || {}).some(t => t.total >= 5 && t.solved === t.total),
  },
  {
    id: 'concept-curious',
    title: 'Concept Curious',
    description: 'Read 5 concept pages.',
    icon: BookOpen,
    color: 'medium',
    eligible: ctx => (ctx.conceptsRead || 0) >= 5,
  },
  {
    id: 'polyglot',
    title: 'Polyglot',
    description: 'Submitted code in 3+ different languages.',
    icon: Globe,
    color: 'accent',
    eligible: ctx => (ctx.languagesUsed?.size || 0) >= 3,
  },
  {
    id: 'shared-snippet',
    title: 'Open Source',
    description: 'Created your first shareable playground link.',
    icon: GitFork,
    color: 'medium',
    eligible: ctx => (ctx.sharedSnippets || 0) >= 1,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Solved 3 problems in a single day.',
    icon: Zap,
    color: 'medium',
    eligible: ctx => (ctx.maxSolvesInOneDay || 0) >= 3,
  },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

// Run every catalog entry against ctx, return ids that are currently earned.
export function computeEarned(ctx) {
  return ACHIEVEMENTS.filter(a => {
    try { return a.eligible(ctx); } catch { return false; }
  }).map(a => a.id);
}

// Build the ctx object from query-hook data.
export function buildAchievementContext({ problems, byId, profile, sharedSnippets = 0, conceptsRead = 0 }) {
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

  // Languages used: derived from the per-language code blob if present, else empty
  const languagesUsed = new Set();
  Object.values(byId || {}).forEach(p => {
    if (p.last_code && typeof p.last_code === 'object') {
      Object.keys(p.last_code).forEach(lang => {
        if (p.last_code[lang]?.length > 0) languagesUsed.add(lang);
      });
    }
  });

  // Max solves in one day (from last_solved_at on each row)
  const solveCounts = {};
  Object.values(byId || {}).forEach(p => {
    if (p.is_completed && p.last_solved_at) {
      const day = new Date(p.last_solved_at).toDateString();
      solveCounts[day] = (solveCounts[day] || 0) + 1;
    }
  });
  const maxSolvesInOneDay = Math.max(0, ...Object.values(solveCounts));

  return {
    solvedCount: solved.length,
    easyCount, medCount, hardCount,
    currentStreak: profile?.current_streak || 0,
    longestStreak: profile?.longest_streak || 0,
    topicMastery,
    conceptsRead,
    languagesUsed,
    sharedSnippets,
    contestsFinished: 0,
    maxSolvesInOneDay,
  };
}
