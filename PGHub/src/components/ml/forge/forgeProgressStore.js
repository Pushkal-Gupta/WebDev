// Client-side solve tracking for PGForge ML problems.
//
// There's no server progress for the forge problems, so we persist solves in
// localStorage. Shape under key 'pgforge_solved_v1':
//   { [slug]: { difficulty: 'easy'|'medium'|'hard', ts: <epoch ms> } }
//
// Everything degrades gracefully when storage is empty or unavailable, so the
// dashboard renders an all-zero state instead of throwing.

const STORAGE_KEY = 'pgforge_solved_v1';
const DIFFS = ['easy', 'medium', 'hard'];

function now() {
  // Some sandboxed runtimes don't expose Date.now; fall back to an instance.
  return typeof Date.now === 'function' ? Date.now() : new Date().getTime();
}

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

// Returns the raw solved map. Always an object, never null.
export function getSolved() {
  const store = safeStorage();
  if (!store) return {};
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSolved(map) {
  const store = safeStorage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota or privacy mode — silently keep the in-memory result for this view.
  }
}

export function markSolved(slug, difficulty) {
  if (!slug) return;
  const map = getSolved();
  const diff = DIFFS.includes(difficulty) ? difficulty : 'easy';
  map[slug] = { difficulty: diff, ts: now() };
  writeSolved(map);
}

export function unmarkSolved(slug) {
  if (!slug) return;
  const map = getSolved();
  if (map[slug]) {
    delete map[slug];
    writeSolved(map);
  }
}

export function isSolved(slug) {
  if (!slug) return false;
  return Boolean(getSolved()[slug]);
}

// Local YYYY-MM-DD key for a Date, used to bucket solves into days.
function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

// Difference in whole days between two day-start dates.
function dayDiff(a, b) {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

// Aggregate everything the dashboard needs from the solved map + catalog.
export function computeStats(allProblems = []) {
  const solvedMap = getSolved();
  const solvedSlugs = Object.keys(solvedMap);

  const byDiff = {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  };

  // Totals come from the catalog so denominators are stable even if a slug was
  // renamed out from under an old solve record.
  allProblems.forEach((p) => {
    const d = DIFFS.includes(p.difficulty) ? p.difficulty : 'easy';
    byDiff[d].total += 1;
    if (solvedMap[p.slug]) byDiff[d].solved += 1;
  });

  const total = allProblems.length;
  const solved = byDiff.easy.solved + byDiff.medium.solved + byDiff.hard.solved;

  // Recent: every solve, newest first. Title is resolved by the caller against
  // the catalog; we carry slug/difficulty/ts.
  const recent = solvedSlugs
    .map((slug) => ({
      slug,
      difficulty: solvedMap[slug]?.difficulty || 'easy',
      ts: solvedMap[slug]?.ts || 0,
    }))
    .sort((a, b) => b.ts - a.ts);

  // Per-day counts for the heatmap + streaks.
  const counts = {};
  recent.forEach((r) => {
    if (!r.ts) return;
    const key = dayKey(new Date(r.ts));
    counts[key] = (counts[key] || 0) + 1;
  });

  // Heatmap: last 26 weeks ending today, oldest first, week-by-week columns.
  const today = startOfDay(new Date());
  const weeks = 26;
  const totalDays = weeks * 7;
  const heatmap = [];
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    const count = counts[key] || 0;
    let level = 0;
    if (count >= 1) level = 1;
    if (count >= 2) level = 2;
    if (count >= 4) level = 3;
    heatmap.push({ date: key, count, level });
  }

  // Streaks: consecutive days that have at least one solve.
  const activeDays = Object.keys(counts).sort(); // ascending YYYY-MM-DD
  let bestStreak = 0;
  let currentStreak = 0;
  if (activeDays.length) {
    let run = 1;
    bestStreak = 1;
    for (let i = 1; i < activeDays.length; i += 1) {
      const prev = new Date(activeDays[i - 1]);
      const cur = new Date(activeDays[i]);
      if (dayDiff(cur, prev) === 1) run += 1;
      else run = 1;
      if (run > bestStreak) bestStreak = run;
    }

    // Current streak: walk back from today (or yesterday) while days are active.
    const lastActive = new Date(activeDays[activeDays.length - 1]);
    const gapFromToday = dayDiff(today, lastActive);
    if (gapFromToday <= 1) {
      const activeSet = new Set(activeDays);
      currentStreak = 0;
      const cursor = new Date(today);
      // If today has no solve but yesterday does, the streak still stands.
      if (!activeSet.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
      while (activeSet.has(dayKey(cursor))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
  }

  const totalSubmissions = recent.length;

  return {
    total,
    solved,
    byDiff,
    recent,
    heatmap,
    currentStreak,
    bestStreak,
    totalSubmissions,
  };
}
