// Supabase Edge Function: lc-user
// Proxies LeetCode's public GraphQL API for a single user's contest ranking
// info + rich profile stats, normalizing it to a flat shape the client can render.
//
// Request:  { username: string }
// Response: {
//   username, realName, avatar, ranking,
//   rating, attendedContestsCount, globalRanking, totalParticipants,
//   topPercentage, badge,
//   history: Array<{ index, title, slug, startTime, rating, ranking,
//                    trendDirection, attended, problemsSolved, totalProblems }>,
//   submitStats: { easy, medium, hard, total,
//                  submissionsEasy, submissionsMedium, submissionsHard, submissionsTotal } | null,
//   totalQuestions: { easy, medium, hard, total } | null,
//   beats: { easy, medium, hard } | null,
//   activity: { streak, totalActiveDays } | null,
//   languages: Array<{ language, solved }>,
//   skills: { advanced: [{tagName, problemsSolved}], intermediate: [...], fundamental: [...] }
// }
//
// LeetCode GraphQL has no auth requirement for these public queries, but it
// rejects requests without a browser-like Referer/Origin, so we send them.
//
// Each rich section is derived defensively: if a sub-query field is missing
// (some accounts hide stats / older schema), that section degrades to null /
// empty arrays instead of failing the whole request.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LC_GRAPHQL = "https://leetcode.com/graphql";

const QUERY = `
query userPublicProfileAndContest($username: String!) {
  allQuestionsCount {
    difficulty
    count
  }
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    problemsSolvedBeatsStats {
      difficulty
      percentage
    }
    userCalendar {
      streak
      totalActiveDays
    }
    languageProblemCount {
      languageName
      problemsSolved
    }
    tagProblemCounts {
      advanced {
        tagName
        problemsSolved
      }
      intermediate {
        tagName
        problemsSolved
      }
      fundamental {
        tagName
        problemsSolved
      }
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
    badge { name }
  }
  userContestRankingHistory(username: $username) {
    attended
    rating
    ranking
    trendDirection
    problemsSolved
    totalProblems
    contest { title titleSlug startTime }
  }
}`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// LeetCode reports difficulty as "All" | "Easy" | "Medium" | "Hard".
function byDifficulty<T>(
  rows: any[],
  pick: (row: any) => T,
): { easy: T | null; medium: T | null; hard: T | null; all: T | null } {
  const out = { easy: null as T | null, medium: null as T | null, hard: null as T | null, all: null as T | null };
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    const key = String(row?.difficulty || "").toLowerCase();
    if (key === "easy") out.easy = pick(row);
    else if (key === "medium") out.medium = pick(row);
    else if (key === "hard") out.hard = pick(row);
    else if (key === "all") out.all = pick(row);
  }
  return out;
}

function normalizeSubmitStats(matched: any) {
  try {
    const rows = matched?.submitStatsGlobal?.acSubmissionNum;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const solved = byDifficulty(rows, (r) => Number(r?.count ?? 0));
    const subs = byDifficulty(rows, (r) => Number(r?.submissions ?? 0));
    const easy = solved.easy ?? 0;
    const medium = solved.medium ?? 0;
    const hard = solved.hard ?? 0;
    return {
      easy,
      medium,
      hard,
      total: solved.all ?? easy + medium + hard,
      submissionsEasy: subs.easy ?? 0,
      submissionsMedium: subs.medium ?? 0,
      submissionsHard: subs.hard ?? 0,
      submissionsTotal: subs.all ?? (subs.easy ?? 0) + (subs.medium ?? 0) + (subs.hard ?? 0),
    };
  } catch {
    return null;
  }
}

function normalizeTotalQuestions(data: any) {
  try {
    const rows = data?.allQuestionsCount;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const counts = byDifficulty(rows, (r) => Number(r?.count ?? 0));
    const easy = counts.easy ?? 0;
    const medium = counts.medium ?? 0;
    const hard = counts.hard ?? 0;
    return {
      easy,
      medium,
      hard,
      total: counts.all ?? easy + medium + hard,
    };
  } catch {
    return null;
  }
}

function normalizeBeats(matched: any) {
  try {
    const rows = matched?.problemsSolvedBeatsStats;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const pct = byDifficulty(rows, (r) =>
      typeof r?.percentage === "number" ? r.percentage : null,
    );
    if (pct.easy === null && pct.medium === null && pct.hard === null) return null;
    return { easy: pct.easy, medium: pct.medium, hard: pct.hard };
  } catch {
    return null;
  }
}

function normalizeActivity(matched: any) {
  try {
    const cal = matched?.userCalendar;
    if (!cal) return null;
    const streak = cal.streak ?? null;
    const totalActiveDays = cal.totalActiveDays ?? null;
    if (streak === null && totalActiveDays === null) return null;
    return { streak, totalActiveDays };
  } catch {
    return null;
  }
}

function normalizeLanguages(matched: any) {
  try {
    const rows = matched?.languageProblemCount;
    if (!Array.isArray(rows)) return [];
    return rows
      .map((r) => ({
        language: r?.languageName || "",
        solved: Number(r?.problemsSolved ?? 0),
      }))
      .filter((r) => r.language)
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 6);
  } catch {
    return [];
  }
}

function normalizeTagGroup(rows: any): { tagName: string; problemsSolved: number }[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => ({
      tagName: r?.tagName || "",
      problemsSolved: Number(r?.problemsSolved ?? 0),
    }))
    .filter((r) => r.tagName && r.problemsSolved > 0)
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 6);
}

function normalizeSkills(matched: any) {
  try {
    const tags = matched?.tagProblemCounts;
    if (!tags) return { advanced: [], intermediate: [], fundamental: [] };
    return {
      advanced: normalizeTagGroup(tags.advanced),
      intermediate: normalizeTagGroup(tags.intermediate),
      fundamental: normalizeTagGroup(tags.fundamental),
    };
  } catch {
    return { advanced: [], intermediate: [], fundamental: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      throw new Error("username must be a non-empty string");
    }
    const handle = username.trim();
    if (handle.length > 64 || !/^[A-Za-z0-9_.-]+$/.test(handle)) {
      throw new Error("invalid username");
    }

    const res = await fetch(LC_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": `https://leetcode.com/u/${handle}/`,
        "Origin": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0 (compatible; PGcode/1.0)",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { username: handle },
        operationName: "userPublicProfileAndContest",
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`LeetCode GraphQL failed: ${res.status} ${txt.slice(0, 200)}`);
    }

    const payload = await res.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message || "LeetCode GraphQL error");
    }

    const data = payload.data || {};
    const matched = data.matchedUser;
    if (!matched) {
      return jsonResponse({ error: "User not found", username: handle, notFound: true }, 404);
    }

    const profile = matched.profile || {};
    const ranking = data.userContestRanking || {};
    const rawHistory: any[] = Array.isArray(data.userContestRankingHistory)
      ? data.userContestRankingHistory
      : [];

    // Only attended contests carry a meaningful rating point on the curve.
    const history = rawHistory
      .filter((h) => h && h.attended)
      .map((h, i) => ({
        index: i,
        title: h.contest?.title || "",
        slug: h.contest?.titleSlug || "",
        startTime: h.contest?.startTime ?? null,
        rating: typeof h.rating === "number" ? Math.round(h.rating) : null,
        ranking: h.ranking ?? null,
        trendDirection: h.trendDirection || "NONE",
        attended: !!h.attended,
        problemsSolved: h.problemsSolved ?? null,
        totalProblems: h.totalProblems ?? null,
      }));

    const normalized = {
      username: matched.username || handle,
      realName: profile.realName || "",
      avatar: profile.userAvatar || "",
      ranking: profile.ranking ?? null,
      rating: typeof ranking.rating === "number" ? Math.round(ranking.rating) : null,
      attendedContestsCount: ranking.attendedContestsCount ?? history.length,
      globalRanking: ranking.globalRanking ?? null,
      totalParticipants: ranking.totalParticipants ?? null,
      topPercentage: typeof ranking.topPercentage === "number" ? ranking.topPercentage : null,
      badge: ranking.badge?.name || null,
      history,
      submitStats: normalizeSubmitStats(matched),
      totalQuestions: normalizeTotalQuestions(data),
      beats: normalizeBeats(matched),
      activity: normalizeActivity(matched),
      languages: normalizeLanguages(matched),
      skills: normalizeSkills(matched),
    };

    return jsonResponse(normalized);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
