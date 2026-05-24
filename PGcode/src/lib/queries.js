import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from './supabase';

// ---- Shared helpers ---------------------------------------------------------

const ROADMAP_MODES = ['100', '200', '300', '400', '500', 'all'];
const MODE_LIMITS = { '100': 100, '200': 200, '300': 300, '400': 400, '500': 500 };

// Ordering signal for "what gets included in PGcode 100/200/.../500".
// Curated quality first (test cases > hints > tags > frequency_score), then
// the original roadmap_set bucket as tie-break, then by name for stability.
// This guarantees the richest content lands inside the smaller buckets.
function rankScore(p) {
  let s = 0;
  if (Array.isArray(p.test_cases) && p.test_cases.length >= 5)  s += 1_000_000;
  if (Array.isArray(p.hints)      && p.hints.length      >= 3)  s +=   500_000;
  if (Array.isArray(p.tags)       && p.tags.length       >= 1)  s +=   100_000;
  if (typeof p.frequency_score === 'number')                     s += Math.min(p.frequency_score, 99) * 100;
  const bucket = { '100': 8, 'both': 7, '200': 6, '300': 4, '400': 2, '500': 1 }[p.roadmap_set] || 0;
  s += bucket * 1000;
  return s;
}

// Returns the canonical roadmap ordering (highest-quality first). Memoized
// by reference so React can compare cheaply.
function canonicalSort(problems) {
  return [...problems].sort((a, b) => {
    const sa = rankScore(a), sb = rankScore(b);
    if (sa !== sb) return sb - sa;
    return (a.name || '').localeCompare(b.name || '');
  });
}

// Back-compat: kept for any place that asks "is this single problem in the
// given mode?". Now reflects top-N semantics by ranking but doesn't have
// the full list, so it's only true for 'all' / '500' modes.
export function inRoadmapMode(problem, roadmapMode) {
  if (roadmapMode === 'all') return true;
  if (roadmapMode === '500') return true;
  // Conservative answer when we can't see the full ordering: include.
  return true;
}

// PGcode N means EXACTLY N problems. PGcode 'all' means the roadmap cap (1000)
// in roadmap views; /practice ignores roadmapMode entirely and shows the full
// catalog.
//
// Guarantee: every topic that has any problems at all gets at least one slot,
// even at PGcode 100. We achieve this WITHOUT exceeding N by reserving one
// slot per topic from the top down, then filling the remainder by canonical
// rank.
function selectExactlyN(problems, n) {
  const sorted = canonicalSort(problems);
  if (sorted.length <= n) return sorted;

  // Group sorted picks by topic — first occurrence is the topic's top pick.
  const topicTopPick = new Map();   // topic_id -> first sorted problem id
  for (const p of sorted) {
    if (p.topic_id && !topicTopPick.has(p.topic_id)) {
      topicTopPick.set(p.topic_id, p);
    }
  }

  const allTopicReps = [...topicTopPick.values()];
  // Cap topic reps at n — for very small n + many topics, this is what fits.
  const topicReps = allTopicReps.slice(0, n);
  const repIds = new Set(topicReps.map(p => p.id));

  // Fill remaining slots from sorted rank order, skipping already-included reps.
  const out = [...topicReps];
  for (const p of sorted) {
    if (out.length >= n) break;
    if (repIds.has(p.id)) continue;
    out.push(p);
    repIds.add(p.id);
  }
  // Final result re-sorted by canonical rank so order in the UI matches rank.
  return canonicalSort(out);
}

export const ROADMAP_HARD_CAP = 1000;

export function filterByRoadmap(problems, roadmapMode) {
  if (!problems) return [];
  if (roadmapMode === 'all') {
    // 'all' on the roadmap means the visualization cap; /practice doesn't call this.
    return canonicalSort(problems).slice(0, ROADMAP_HARD_CAP);
  }
  const limit = MODE_LIMITS[roadmapMode];
  if (!limit) return problems;
  return selectExactlyN(problems, limit);
}

// Roadmap-specific filter: 'all' resolves to the 1000 cap above already; other
// modes flow through `filterByRoadmap` and never exceed their declared N.
export function filterForRoadmapView(problems, roadmapMode) {
  if (!problems) return [];
  return filterByRoadmap(problems, roadmapMode);
}

// ---- Server-side aggregate RPCs --------------------------------------------
// Heavy work runs in Postgres; client gets compact JSON. See migrate-25.

export function useUserStatsRpc(userId) {
  return useQuery({
    queryKey: ['userStatsRpc', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('pgcode_user_stats', { uid: userId });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function usePracticeHistoryRpc(userId, limit = 200) {
  return useQuery({
    queryKey: ['practiceHistoryRpc', userId || 'anon', limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('pgcode_practice_history', { uid: userId, lim: limit });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// Server-side paginated/filtered problem list. Postgres does the filter +
// sort + slice; client receives only the visible page + total count. Cached
// per (filters, page) so back/forward feels instant.
export function useProblemPage({
  page = 0,
  pageSize = 100,
  topicId = null,
  difficulty = null,    // array | null
  search = '',
  sort = 'topic',
} = {}) {
  return useQuery({
    queryKey: [
      'problemPage',
      page, pageSize,
      topicId || 'all',
      (difficulty || []).join(',') || 'any',
      search || '',
      sort,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pgcode_problem_page', {
        p_limit:      pageSize,
        p_offset:     page * pageSize,
        p_topic_id:   topicId || null,
        p_difficulty: difficulty && difficulty.length ? difficulty : null,
        p_search:     search || null,
        p_sort:       sort,
      });
      if (error) throw error;
      return data || { rows: [], total: 0 };
    },
    staleTime: 60 * 1000,
    keepPreviousData: true,    // page transitions show old data until new arrives
  });
}

export function useProblemCompleteness() {
  return useQuery({
    queryKey: ['problemCompleteness'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pgcode_problem_completeness');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTutorialResolveRpc(normNames) {
  // Pass a pre-normalized + de-duped array. Stable across renders → stable cache key.
  return useQuery({
    queryKey: ['tutorialResolveRpc', normNames ? normNames.length : 0],
    queryFn: async () => {
      if (!normNames?.length) return [];
      const { data, error } = await supabase.rpc('pgcode_resolve_tutorial', { names: normNames });
      if (error) throw error;
      return data || [];
    },
    enabled: !!normNames?.length,
    staleTime: 30 * 60 * 1000,
  });
}

// ---- Query keys -------------------------------------------------------------

export const qk = {
  topics: ['topics'],
  edges: ['edges'],
  problems: ['problems'],
  topicProblems: (topicId) => ['problems', 'topic', topicId],
  userProgress: (userId) => ['userProgress', userId || 'anon'],
  profile: (userId) => ['profile', userId || 'anon'],
  dryRunSteps: (problemId) => ['dryRun', 'steps', problemId],
  // Sort for stability — order of stepIds shouldn't change cache identity.
  dryRunQuestions: (stepIds) => ['dryRun', 'questions', (stepIds || []).slice().sort((a, b) => a - b).join(',')],
  recentProblems: (userId) => ['recentProblems', userId || 'anon'],
  problemDetails: (problemIds) => ['problemDetails', (problemIds || []).join(',')],
  templates: (problemId) => ['templates', problemId],
  solutions: (problemId) => ['solutions', problemId],
  problemFull: (problemId) => ['problem', problemId],
  reviewCount: (userId) => ['reviewCount', userId || 'anon'],
  modules: ['modules'],
  moduleConcepts: (moduleSlug) => ['concepts', 'module', moduleSlug],
  concept: (slug) => ['concept', slug],
  conceptProblems: (slug) => ['concept', slug, 'problems'],
  conceptPrereqs: (slug) => ['concept', slug, 'prereqs'],
  problemCompanies: (problemId) => ['problem', problemId, 'companies'],
  problemSimilar: (problemId) => ['problem', problemId, 'similar'],
  userStreak: (userId) => ['userStreak', userId || 'anon'],
  potd: (date) => ['potd', date || 'today'],
  randomUnsolved: (userId, diff) => ['randomUnsolved', userId || 'anon', diff || 'any'],
  comments: (kind, id, userId) => ['comments', kind, id, userId || 'anon'],
};

// ---- Home dashboard RPCs (migrate-29) --------------------------------------

export function useUserStreak(userId) {
  return useQuery({
    queryKey: qk.userStreak(userId),
    queryFn: async () => {
      if (!userId) return { current: 0, longest: 0, today_solved: false, total_solved: 0 };
      const { data, error } = await supabase.rpc('pgcode_user_streak', { uid: userId });
      if (error) throw error;
      return data || { current: 0, longest: 0, today_solved: false, total_solved: 0 };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function usePotd() {
  return useQuery({
    queryKey: qk.potd(new Date().toISOString().slice(0, 10)),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pgcode_potd');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Hooks ------------------------------------------------------------------

export function useTopics() {
  return useQuery({
    queryKey: qk.topics,
    queryFn: async () => {
      const { data, error } = await supabase.from('PGcode_topics').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useRoadmapEdges() {
  return useQuery({
    queryKey: qk.edges,
    queryFn: async () => {
      const { data, error } = await supabase.from('PGcode_roadmap_edges').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

// Compact problem list (used by roadmap progress aggregation, side panel, problem list).
// PostgREST's `db-max-rows` server config caps a single SELECT at 1000 — `.range()`
// alone CANNOT override it. We paginate explicitly until a short page comes back.
export function useProblemsCompact() {
  return useQuery({
    queryKey: qk.problems,
    queryFn: async () => {
      const all = [];
      const PAGE = 1000;
      let page = 0;
      while (page < 20) {
        const { data, error } = await supabase
          .from('PGcode_problems')
          .select('id, name, topic_id, difficulty, roadmap_set, leetcode_url')
          .range(page * PAGE, page * PAGE + PAGE - 1);
        if (error) throw error;
        if (!data?.length) break;
        all.push(...data);
        if (data.length < PAGE) break;
        page += 1;
      }
      return all;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useTopicProblems(topicId) {
  return useQuery({
    queryKey: qk.topicProblems(topicId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_problems')
        .select('*')
        .eq('topic_id', topicId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUserProgress(userId) {
  return useQuery({
    queryKey: qk.userProgress(userId),
    queryFn: async () => {
      if (!userId) return { rows: [], byId: {} };
      const { data, error } = await supabase
        .from('PGcode_user_progress')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      const rows = data || [];
      const byId = {};
      rows.forEach(r => { byId[r.problem_id] = r; });
      return { rows, byId };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useProfile(userId) {
  return useQuery({
    queryKey: qk.profile(userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('PGcode_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentProblems(userId, limit = 3) {
  return useQuery({
    queryKey: qk.recentProblems(userId),
    queryFn: async () => {
      if (!userId) return [];
      const { data: recent, error: e1 } = await supabase
        .from('PGcode_user_progress')
        .select('problem_id, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (e1) throw e1;
      const ids = (recent || []).map(r => r.problem_id);
      if (!ids.length) return [];
      const { data: details, error: e2 } = await supabase
        .from('PGcode_problems')
        .select('id, name, topic_id, difficulty')
        .in('id', ids);
      if (e2) throw e2;
      const map = {};
      (details || []).forEach(p => { map[p.id] = p; });
      return ids.map(id => map[id]).filter(Boolean);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

// Two chained queries (steps → questions in step ids). Returns a single shape.
export function useDryRun(problemId) {
  const stepsQuery = useQuery({
    queryKey: qk.dryRunSteps(problemId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_interactive_dry_runs')
        .select('*')
        .eq('problem_id', problemId)
        .order('step_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!problemId,
    staleTime: 30 * 60 * 1000,
  });

  // Memoize stepIds: without this, a fresh array on every render gives the
  // questionsQuery a new key reference and forces unnecessary refetches.
  const stepIds = useMemo(
    () => (stepsQuery.data || []).map(s => s.id),
    [stepsQuery.data],
  );
  const questionsQuery = useQuery({
    queryKey: qk.dryRunQuestions(stepIds),
    queryFn: async () => {
      if (!stepIds.length) return {};
      const { data, error } = await supabase
        .from('PGcode_interactive_questions')
        .select('*')
        .in('dry_run_step_id', stepIds);
      if (error) throw error;
      const map = {};
      (data || []).forEach(q => { map[q.dry_run_step_id] = q; });
      return map;
    },
    enabled: !!problemId && stepIds.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  return {
    steps: stepsQuery.data || [],
    questions: questionsQuery.data || {},
    isLoading: stepsQuery.isLoading || (stepIds.length > 0 && questionsQuery.isLoading),
    error: stepsQuery.error || questionsQuery.error,
  };
}

// ---- Contests -------------------------------------------------------------

export function useContests() {
  return useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_contests')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    // Short staleTime so an empty result (e.g., pre-seed) doesn't persist for
    // an hour after the data lands.
    staleTime: 30 * 1000,
  });
}

export function useContest(slug) {
  return useQuery({
    queryKey: ['contest', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_contests')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

export function useContestProblems(slug) {
  return useQuery({
    queryKey: ['contestProblems', slug],
    queryFn: async () => {
      const { data: links, error: e1 } = await supabase
        .from('PGcode_contest_problems')
        .select('problem_id, position, points')
        .eq('contest_slug', slug)
        .order('position', { ascending: true });
      if (e1) throw e1;
      const ids = (links || []).map(l => l.problem_id);
      if (!ids.length) return [];
      const { data: probs, error: e2 } = await supabase
        .from('PGcode_problems')
        .select('id, name, topic_id, difficulty')
        .in('id', ids);
      if (e2) throw e2;
      const byId = {};
      (probs || []).forEach(p => { byId[p.id] = p; });
      return (links || [])
        .map(l => byId[l.problem_id] ? ({ ...byId[l.problem_id], position: l.position, points: l.points }) : null)
        .filter(Boolean);
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

export function useContestAttempt(userId, slug) {
  return useQuery({
    queryKey: ['contestAttempt', userId || 'anon', slug],
    queryFn: async () => {
      if (!userId || !slug) return null;
      const { data, error } = await supabase
        .from('PGcode_user_contest_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('contest_slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!userId && !!slug,
    staleTime: 30 * 1000,
  });
}

export function useMyContestAttempts(userId) {
  return useQuery({
    queryKey: ['myContestAttempts', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('PGcode_user_contest_attempts')
        .select('contest_slug, finished_at, started_at')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ---- Companies ------------------------------------------------------------

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_companies')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useCompany(slug) {
  return useQuery({
    queryKey: ['company', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_companies')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!slug,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCompanyProblems(slug) {
  return useQuery({
    queryKey: ['companyProblems', slug],
    queryFn: async () => {
      const { data: links, error: e1 } = await supabase
        .from('PGcode_company_problems')
        .select('problem_id, frequency_score, last_asked_year, role')
        .eq('company_slug', slug)
        .order('frequency_score', { ascending: false });
      if (e1) throw e1;
      const ids = [...new Set((links || []).map(l => l.problem_id))];
      if (!ids.length) return [];
      const { data: probs, error: e2 } = await supabase
        .from('PGcode_problems')
        .select('id, name, topic_id, difficulty')
        .in('id', ids);
      if (e2) throw e2;
      const byId = {};
      (probs || []).forEach(p => { byId[p.id] = p; });
      return (links || [])
        .map(l => ({ ...byId[l.problem_id], frequency_score: l.frequency_score, last_asked_year: l.last_asked_year, role: l.role }))
        .filter(p => p.id);
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

// ---- Roadmap engine -------------------------------------------------------

export function useRoadmaps() {
  return useQuery({
    queryKey: ['roadmaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_roadmaps')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useRoadmap(slug) {
  return useQuery({
    queryKey: ['roadmap', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_roadmaps')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!slug,
    staleTime: 60 * 60 * 1000,
  });
}

export function useRoadmapNodes(slug) {
  return useQuery({
    queryKey: ['roadmapNodes', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_roadmap_nodes')
        .select('*')
        .eq('roadmap_slug', slug)
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

// ---- Curated lists (Blind 75 etc.) ----------------------------------------

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_lists')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useListProblemIds(listSlug) {
  return useQuery({
    queryKey: ['listProblems', listSlug],
    queryFn: async () => {
      if (!listSlug || listSlug === 'all') return null;
      const { data, error } = await supabase
        .from('PGcode_list_problems')
        .select('problem_id, position')
        .eq('list_slug', listSlug)
        .order('position', { ascending: true });
      if (error) throw error;
      return new Set((data || []).map(r => r.problem_id));
    },
    enabled: !!listSlug && listSlug !== 'all',
    staleTime: 30 * 60 * 1000,
  });
}

// ---- User-owned custom lists ----------------------------------------------

export function useMyLists(userId) {
  return useQuery({
    queryKey: ['userLists', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('PGcode_user_lists')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// Counts every problem the user has across all their custom lists, grouped per
// list. Used by the achievements engine to grant "Curator" once any list hits
// 10+ entries.
export function useMyListSizes(userId) {
  return useQuery({
    queryKey: ['userListSizes', userId || 'anon'],
    queryFn: async () => {
      if (!userId) return {};
      const { data: lists, error: e1 } = await supabase
        .from('PGcode_user_lists')
        .select('id')
        .eq('user_id', userId);
      if (e1) throw e1;
      const ids = (lists || []).map(l => l.id);
      if (!ids.length) return {};
      const { data: rels, error: e2 } = await supabase
        .from('PGcode_user_list_problems')
        .select('list_id')
        .in('list_id', ids);
      if (e2) throw e2;
      const sizes = {};
      (rels || []).forEach(r => { sizes[r.list_id] = (sizes[r.list_id] || 0) + 1; });
      return sizes;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useMyListProblems(listId) {
  return useQuery({
    queryKey: ['userListProblems', listId || 'none'],
    queryFn: async () => {
      if (!listId) return [];
      const { data: rels, error: e1 } = await supabase
        .from('PGcode_user_list_problems')
        .select('problem_id, position, added_at')
        .eq('list_id', listId)
        .order('position', { ascending: true });
      if (e1) throw e1;
      const ids = (rels || []).map(r => r.problem_id);
      if (!ids.length) return [];
      const { data: probs, error: e2 } = await supabase
        .from('PGcode_problems')
        .select('id, name, topic_id, difficulty')
        .in('id', ids);
      if (e2) throw e2;
      const byId = {};
      (probs || []).forEach(p => { byId[p.id] = p; });
      return (rels || [])
        .map(r => byId[r.problem_id] ? ({ ...byId[r.problem_id], added_at: r.added_at, position: r.position }) : null)
        .filter(Boolean);
    },
    enabled: !!listId,
    staleTime: 30 * 1000,
  });
}

// Public shared list lookup (by share_slug)
export function usePublicList(shareSlug) {
  return useQuery({
    queryKey: ['publicList', shareSlug || 'none'],
    queryFn: async () => {
      if (!shareSlug) return null;
      const { data, error } = await supabase
        .from('PGcode_user_lists')
        .select('*')
        .eq('share_slug', shareSlug)
        .eq('is_public', true)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!shareSlug,
    staleTime: 60 * 1000,
  });
}

// ---- Practice history / submissions ---------------------------------------

export function useSubmissionHistory(userId, limit = 200) {
  return useQuery({
    queryKey: ['submissionHistory', userId || 'anon', limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('PGcode_user_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ---- Learn / Concepts ------------------------------------------------------

export function useModules() {
  return useQuery({
    queryKey: qk.modules,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_modules')
        .select('*')
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    // Short staleTime so an empty pre-seed result doesn't persist for an hour
    // after the rows are actually live.
    staleTime: 30 * 1000,
  });
}

export function useModuleConcepts(moduleSlug) {
  return useQuery({
    queryKey: qk.moduleConcepts(moduleSlug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_concepts')
        .select('slug, module_slug, title, subtitle, difficulty, position')
        .eq('module_slug', moduleSlug)
        .eq('status', 'published')
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleSlug,
    staleTime: 30 * 60 * 1000,
  });
}

export function useAllConceptsCompact() {
  return useQuery({
    queryKey: ['concepts', 'all-compact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_concepts')
        .select('slug, module_slug, title, subtitle, difficulty, position')
        .eq('status', 'published')
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    // Concepts are added often; keep stale window short so /learn counts stay accurate.
    staleTime: 60 * 1000,
  });
}

export function useConcept(slug) {
  return useQuery({
    queryKey: qk.concept(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_concepts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

export function useConceptProblems(slug) {
  return useQuery({
    queryKey: qk.conceptProblems(slug),
    queryFn: async () => {
      const { data: rels, error: e1 } = await supabase
        .from('PGcode_concept_problems')
        .select('problem_id, relation_type, position')
        .eq('concept_slug', slug)
        .order('position', { ascending: true });
      if (e1) throw e1;
      const ids = (rels || []).map(r => r.problem_id);
      if (!ids.length) return [];
      const { data: probs, error: e2 } = await supabase
        .from('PGcode_problems')
        .select('id, name, topic_id, difficulty')
        .in('id', ids);
      if (e2) throw e2;
      const byId = {};
      (probs || []).forEach(p => { byId[p.id] = p; });
      return (rels || []).map(r => ({ ...byId[r.problem_id], relation_type: r.relation_type })).filter(p => p.id);
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

// Companies that have asked a problem (joined with company name).
// Sorted by frequency_score desc; capped at 8 for the chip row.
export function useProblemCompanies(problemId) {
  return useQuery({
    queryKey: qk.problemCompanies(problemId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_company_problems')
        .select('company_slug, frequency_score')
        .eq('problem_id', problemId)
        .order('frequency_score', { ascending: false })
        .limit(8);
      if (error) throw error;
      const slugs = (data || []).map(r => r.company_slug);
      if (!slugs.length) return [];
      const { data: companies, error: e2 } = await supabase
        .from('PGcode_companies')
        .select('slug, name')
        .in('slug', slugs);
      if (e2) throw e2;
      const byId = Object.fromEntries((companies || []).map(c => [c.slug, c]));
      return (data || []).map(r => ({ slug: r.company_slug, name: byId[r.company_slug]?.name || r.company_slug, freq: r.frequency_score }))
        .filter(c => c.name);
    },
    enabled: !!problemId,
    staleTime: 30 * 60 * 1000,
  });
}

// Problems sharing a concept with this one. Find concepts via
// PGcode_concept_problems → then other problems for those concepts.
export function useSimilarProblems(problemId) {
  return useQuery({
    queryKey: qk.problemSimilar(problemId),
    queryFn: async () => {
      // Concepts this problem is linked to
      const { data: cps, error: e1 } = await supabase
        .from('PGcode_concept_problems')
        .select('concept_slug')
        .eq('problem_id', problemId);
      if (e1) throw e1;
      const slugs = [...new Set((cps || []).map(r => r.concept_slug))];
      if (!slugs.length) return [];
      // Other problems for those concepts
      const { data: siblings, error: e2 } = await supabase
        .from('PGcode_concept_problems')
        .select('concept_slug, problem_id')
        .in('concept_slug', slugs)
        .neq('problem_id', problemId);
      if (e2) throw e2;
      const ids = [...new Set((siblings || []).map(r => r.problem_id))].slice(0, 8);
      if (!ids.length) return [];
      const { data: problems, error: e3 } = await supabase
        .from('PGcode_problems')
        .select('id, name, topic_id, difficulty')
        .in('id', ids);
      if (e3) throw e3;
      return problems || [];
    },
    enabled: !!problemId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useConceptPrereqs(slug) {
  return useQuery({
    queryKey: qk.conceptPrereqs(slug),
    queryFn: async () => {
      const { data: rels, error: e1 } = await supabase
        .from('PGcode_concept_prereqs')
        .select('requires_slug')
        .eq('concept_slug', slug);
      if (e1) throw e1;
      const slugs = (rels || []).map(r => r.requires_slug);
      if (!slugs.length) return [];
      const { data, error: e2 } = await supabase
        .from('PGcode_concepts')
        .select('slug, title, module_slug, difficulty')
        .in('slug', slugs);
      if (e2) throw e2;
      return data || [];
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

export function useReviewCount(userId) {
  return useQuery({
    queryKey: qk.reviewCount(userId),
    queryFn: async () => {
      if (!userId) return 0;
      const now = new Date().toISOString();
      const { count, error } = await supabase
        .from('PGcode_user_progress')
        .select('problem_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true)
        .not('next_review_at', 'is', null)
        .lte('next_review_at', now);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ---- Prefetching ------------------------------------------------------------

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchTopicProblems = useCallback((topicId) => {
    if (!topicId) return;
    queryClient.prefetchQuery({
      queryKey: qk.topicProblems(topicId),
      queryFn: async () => {
        const { data } = await supabase
          .from('PGcode_problems')
          .select('*')
          .eq('topic_id', topicId);
        return data || [];
      },
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchProblems = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: qk.problems,
      queryFn: async () => {
        const { data } = await supabase
          .from('PGcode_problems')
          .select('id, name, topic_id, difficulty, roadmap_set, leetcode_url');
        return data || [];
      },
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchDryRun = useCallback((problemId) => {
    if (!problemId) return;
    queryClient.prefetchQuery({
      queryKey: qk.dryRunSteps(problemId),
      queryFn: async () => {
        const { data } = await supabase
          .from('PGcode_interactive_dry_runs')
          .select('*')
          .eq('problem_id', problemId)
          .order('step_number', { ascending: true });
        return data || [];
      },
      staleTime: 30 * 60 * 1000,
    });
  }, [queryClient]);

  return { prefetchTopicProblems, prefetchProblems, prefetchDryRun };
}

// ---- Discussion (comments + votes) -----------------------------------------

export function useComments(targetKind, targetId, userId) {
  return useQuery({
    queryKey: qk.comments(targetKind, targetId, userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pgcode_comments_for_target', {
        p_target_kind: targetKind,
        p_target_id: String(targetId),
        p_user_id: userId || null,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!targetKind && !!targetId,
    staleTime: 30 * 1000,
  });
}

export function usePostComment() {
  const queryClient = useQueryClient();
  return useCallback(async ({ targetKind, targetId, userId, body, parentId = null }) => {
    if (!userId) throw new Error('Sign in to comment');
    const text = (body || '').trim();
    if (!text) throw new Error('Comment cannot be empty');
    const { error } = await supabase
      .from('PGcode_comments')
      .insert({
        target_kind: targetKind,
        target_id: String(targetId),
        user_id: userId,
        body: text,
        parent_id: parentId,
      });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['comments', targetKind, String(targetId)] });
  }, [queryClient]);
}

export function useVoteComment() {
  const queryClient = useQueryClient();
  return useCallback(async ({ commentId, userId, value, targetKind, targetId }) => {
    if (!userId) throw new Error('Sign in to vote');
    const cacheKey = qk.comments(targetKind, targetId, userId);
    const prev = queryClient.getQueryData(cacheKey);
    if (Array.isArray(prev)) {
      const next = prev.map((c) => {
        if (c.id !== commentId) return c;
        const old = c.my_vote || 0;
        const newVote = old === value ? 0 : value;
        const delta = newVote - old;
        return { ...c, my_vote: newVote || null, score: (c.score || 0) + delta };
      });
      queryClient.setQueryData(cacheKey, next);
    }
    try {
      if (value === 0) {
        const { error } = await supabase
          .from('PGcode_votes')
          .delete()
          .eq('user_id', userId)
          .eq('target_kind', 'comment')
          .eq('target_id', commentId);
        if (error) throw error;
      } else {
        const existing = prev?.find?.((c) => c.id === commentId);
        const wasSame = existing?.my_vote === value;
        if (wasSame) {
          const { error } = await supabase
            .from('PGcode_votes')
            .delete()
            .eq('user_id', userId)
            .eq('target_kind', 'comment')
            .eq('target_id', commentId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('PGcode_votes')
            .upsert(
              { user_id: userId, target_kind: 'comment', target_id: commentId, value },
              { onConflict: 'user_id,target_kind,target_id' },
            );
          if (error) throw error;
        }
      }
    } finally {
      queryClient.invalidateQueries({ queryKey: ['comments', targetKind, String(targetId)] });
    }
  }, [queryClient]);
}

export { ROADMAP_MODES };
