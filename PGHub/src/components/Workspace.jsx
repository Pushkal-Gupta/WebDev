import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useTopicProblems, filterByRoadmap, qk, useProblemCompanies, useSimilarProblems, useSubmissionsForProblem, useUpdateSubmissionNotes } from '../lib/queries';
import Editor from '@monaco-editor/react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, CheckCircle, RotateCcw, Code2, FileText, Award, MessageSquare, TestTube, Lightbulb, Pin, Lock, Loader2, Copy, Check, StickyNote } from 'lucide-react';
import SolutionView from './SolutionView';
import LanguageIcon from './LanguageIcon';
import HintsPanel from './HintsPanel';
import Discussion from './Discussion';
import StatusPill from './StatusPill';
import Select from './Select';
import { legacyToStatus } from '../lib/status';
import { runCode, runCodeBatch, runCodeMultiCase } from '../lib/codeRunner';
import { Plus, X, GripVertical } from 'lucide-react';

// Default order of tabs in the left strip. Persisted per-user in localStorage so
// users can drag tabs into their preferred order.
const DEFAULT_LEFT_TABS = ['description', 'hints', 'solution', 'submissions', 'discussion', 'testcase'];
const TAB_ORDER_KEY = 'pgcode_workspace_tab_order';

// Translate raw exec errors into actionable messages for the user.
// Network-y errors, Judge0 quirks, malformed responses — each gets a hint.
function humanizeRunError(err) {
  const msg = (err?.message || String(err) || '').toLowerCase();
  if (/429|rate.?limit|too many/.test(msg)) {
    return { title: 'Code runner is rate-limited', detail: 'Wait ~30 seconds and try again. If this keeps happening, the Edge Function may need to be redeployed.' };
  }
  if (/5\d\d|server error|bad gateway|gateway timeout/.test(msg)) {
    return { title: 'Code runner is temporarily down', detail: 'Judge0 returned a server error. Try again in a moment.' };
  }
  if (/network|failed to fetch|networkerror|connection|cors/.test(msg)) {
    return { title: 'Network error', detail: 'Could not reach the code runner. Check your connection and try again.' };
  }
  if (/timeout|timed out|aborted/.test(msg)) {
    return { title: 'Timed out', detail: 'Your code or the runner took too long. Look for infinite loops or O(n²) on a 100k input.' };
  }
  return { title: 'Execution Failed', detail: err?.message || 'Unknown error. Try Run again.' };
}
import { generateTemplate, wrapWithDriver, buildStdin, compareOutput } from '../lib/driverCode';
import { nextReviewAt } from '../lib/spacedRepetition';
import { primaryTopicLabel } from '../lib/topicLabel';
import '../styles/workspace.css';

const VALID_LANGS = ['python', 'javascript', 'java', 'cpp', 'c', 'go'];

// Defensive: a few legacy rows have `tags`/`topics`/`constraints` entries that
// got stored as `{name: "...", ...}` objects instead of plain strings (mostly
// older LC scrape rows). Rendering an object directly throws React error #31,
// which crashes the entire Workspace page. Coerce to a display string here.
function toText(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(toText).join(', ');
  if (typeof v === 'object') return v.name || v.label || v.title || v.value || v.text || JSON.stringify(v);
  return String(v);
}

// Build a sensible camelCase method name from the problem's display name.
// Used as a starter-fallback when params/method_name are still null in DB.
function methodNameFromTitle(name) {
  if (!name) return 'solve';
  const words = String(name).replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return 'solve';
  return words[0].toLowerCase() + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function fallbackStarter(lang, problemName) {
  const m = methodNameFromTitle(problemName);
  if (lang === 'python') return `class Solution:\n    def ${m}(self):\n        # Write your solution here\n        pass\n`;
  if (lang === 'javascript') return `var ${m} = function() {\n    // Write your solution here\n};\n`;
  if (lang === 'java') return `class Solution {\n    public void ${m}() {\n        // Write your solution here\n    }\n}\n`;
  if (lang === 'cpp') return `class Solution {\npublic:\n    void ${m}() {\n        // Write your solution here\n    }\n};\n`;
  return `// Write your solution for ${problemName || 'this problem'} here\n`;
}

// Map app theme preset → Monaco theme. Custom themes are registered on first
// editor mount (registerMonacoThemes). Built-ins ('vs', 'vs-dark') are aliased
// to keep one source of truth.
const MONACO_THEME_MAP = {
  dark: 'pg-dark',
  light: 'pg-light',
  midnight: 'pg-midnight',
  solarized: 'pg-solarized',
  dracula: 'pg-dracula',
  'midnight-light': 'pg-midnight-light',
  'dracula-light': 'pg-dracula-light',
  'solarized-dark': 'pg-solarized-dark',
};

// True when the resolved Monaco theme should use a dark base.
const DARK_PRESETS = new Set(['dark', 'midnight', 'dracula', 'solarized-dark']);

let monacoThemesRegistered = false;
function registerMonacoThemes(monaco) {
  if (monacoThemesRegistered || !monaco?.editor?.defineTheme) return;
  const defs = {
    'pg-dark':     { base: 'vs-dark', bg: '#030a0a', fg: '#d7e9e6' },
    'pg-light':    { base: 'vs',      bg: '#f5f2ed', fg: '#1c1f23' },
    'pg-midnight': { base: 'vs-dark', bg: '#0b1024', fg: '#dbe2ff' },
    'pg-solarized':{ base: 'vs',      bg: '#fdf6e3', fg: '#586e75' },
    'pg-dracula':  { base: 'vs-dark', bg: '#282a36', fg: '#f8f8f2' },
    'pg-midnight-light':  { base: 'vs',      bg: '#eef1ff', fg: '#1a2040' },
    'pg-dracula-light':   { base: 'vs',      bg: '#f4f4ff', fg: '#2d2f3f' },
    'pg-solarized-dark':  { base: 'vs-dark', bg: '#002b36', fg: '#93a1a1' },
  };
  for (const [name, d] of Object.entries(defs)) {
    monaco.editor.defineTheme(name, {
      base: d.base,
      inherit: true,
      rules: [],
      colors: {
        'editor.background': d.bg,
        'editor.foreground': d.fg,
        'editorLineNumber.foreground': d.base === 'vs-dark' ? '#4a5d7a' : '#a0a8b0',
        'editorLineNumber.activeForeground': d.fg,
        'editor.selectionBackground': d.base === 'vs-dark' ? '#1f3a4a' : '#cfe2f3',
        'editor.lineHighlightBackground': d.base === 'vs-dark' ? '#0e1f24' : '#ece9e0',
        'editorCursor.foreground': d.fg,
        'editorWidget.background': d.bg,
      },
    });
  }
  monacoThemesRegistered = true;
}

export default function Workspace({ session, theme, roadmapMode, preferredLang }) {
  const { categoryId, problemId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const [activeProblem, setActiveProblem] = useState(null);

  const initialLang = VALID_LANGS.includes(preferredLang) ? preferredLang : 'python';
  const [activeLang, setActiveLang] = useState(initialLang);
  const userTouchedLangRef = useRef(false);

  // When the user's preferred language loads/changes and they haven't manually switched, follow it.
  useEffect(() => {
    if (!userTouchedLangRef.current && preferredLang && VALID_LANGS.includes(preferredLang)) {
      setActiveLang(preferredLang);
    }
  }, [preferredLang]);

  const onLangChange = (next) => {
    userTouchedLangRef.current = true;
    setActiveLang(next);
    // Persist as the user's preferred language so it survives reload + applies
    // to other Workspace problems. Writes to localStorage immediately so the
    // next problem opens in the same language even if the Supabase upsert is
    // still in flight.
    try { localStorage.setItem('pg-preferred-lang', next); } catch { /* ignore */ }
    if (userId) {
      queryClient.setQueryData(qk.profile(userId), (prev) => ({ ...(prev || { user_id: userId }), preferred_lang: next }));
      supabase.from('PGcode_profiles').upsert({ user_id: userId, preferred_lang: next }).then(() => {
        queryClient.invalidateQueries({ queryKey: qk.profile(userId) });
      });
    }
  };
  const [codeContent, setCodeContent] = useState('');
  const [leftTab, setLeftTab] = useState('description');
  const [notes, setNotes] = useState('');
  const [, setConfidence] = useState(0);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [editorStatus, setEditorStatus] = useState('');
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [activeTestIdx, setActiveTestIdx] = useState(0);
  const [testInputs, setTestInputs] = useState([]);
  const [pinnedCaseIndices, setPinnedCaseIndices] = useState([]);
  // Run mode: 'cases' uses the problem's test cases, 'custom' pipes a free-form stdin.
  // Persisted per-problem so the toggle and last input survive reloads.
  const [stdinMode, setStdinMode] = useState('cases');
  const [customStdin, setCustomStdin] = useState('');
  // Drag-reorderable left-tab order. Sanitized against DEFAULT_LEFT_TABS on load
  // so a stale localStorage entry can't strand the user without a Description tab.
  const [tabOrder, setTabOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(TAB_ORDER_KEY);
      if (!raw) return DEFAULT_LEFT_TABS;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return DEFAULT_LEFT_TABS;
      const filtered = parsed.filter(id => DEFAULT_LEFT_TABS.includes(id));
      const missing = DEFAULT_LEFT_TABS.filter(id => !filtered.includes(id));
      return [...filtered, ...missing];
    } catch { return DEFAULT_LEFT_TABS; }
  });
  const [dragTabId, setDragTabId] = useState(null);
  const [dragOverTabId, setDragOverTabId] = useState(null);
  // User-authored custom test cases per problem (`{ id, stdin }[]`). Persisted in
  // localStorage so they survive reloads alongside pinned cases.
  const [customCases, setCustomCases] = useState([]);
  const [activeCustomId, setActiveCustomId] = useState(null);
  // Structured test/submit result
  const [runResult, setRunResult] = useState(null);
  const [resultCaseIdx, setResultCaseIdx] = useState(0);
  const [submitProgress, setSubmitProgress] = useState(null); // { current, total }
  // Submission history (persisted to localStorage)
  const [submissions, setSubmissions] = useState([]);
  // Selected submission for the detail panel under the Submissions table.
  // Holds either a remote submission id (number) or local fallback id (string).
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [submissionNotesDraft, setSubmissionNotesDraft] = useState('');
  const [submissionNotesStatus, setSubmissionNotesStatus] = useState('');
  const [submissionCodeExpanded, setSubmissionCodeExpanded] = useState(false);
  const [submissionCodeCopied, setSubmissionCodeCopied] = useState(false);
  // Success animation
  const [showSuccess, setShowSuccess] = useState(false);
  // Local "similar" list for the post-solve modal (kept separate from the
  // concept-derived `similarProblems` hook used in the Description tab).
  const [, setPostSolveSimilar] = useState([]);
  // Solve timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerStopped, setTimerStopped] = useState(false);
  const timerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Lock page scroll while Workspace is mounted — only inner panes scroll.
  // Measure the nav height at runtime and expose as --pg-nav-h so
  // .ws-container can take exactly (100dvh - nav) regardless of theme/resize.
  // useLayoutEffect so the measurement happens BEFORE first paint (no flicker).
  useLayoutEffect(() => {
    const root = document.getElementById('root');
    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      htmlHeight: document.documentElement.style.height,
      bodyOverflow: document.body.style.overflow,
      bodyHeight: document.body.style.height,
      rootHeight: root?.style.height,
      rootMinHeight: root?.style.minHeight,
      rootOverflow: root?.style.overflow,
      navVar: document.documentElement.style.getPropertyValue('--pg-nav-h'),
    };
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100dvh';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100dvh';
    if (root) {
      root.style.height = '100dvh';
      root.style.minHeight = '0';
      root.style.overflow = 'hidden';
    }

    const measureNav = () => {
      const nav = document.querySelector('.pg-header');
      const h = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--pg-nav-h', `${h}px`);
    };
    measureNav();
    const ro = new ResizeObserver(measureNav);
    const nav = document.querySelector('.pg-header');
    if (nav) ro.observe(nav);
    window.addEventListener('resize', measureNav);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureNav);
      document.documentElement.style.overflow = prev.htmlOverflow;
      document.documentElement.style.height = prev.htmlHeight;
      document.body.style.overflow = prev.bodyOverflow;
      document.body.style.height = prev.bodyHeight;
      if (root) {
        root.style.height = prev.rootHeight;
        root.style.minHeight = prev.rootMinHeight;
        root.style.overflow = prev.rootOverflow;
      }
      document.documentElement.style.setProperty('--pg-nav-h', prev.navVar);
    };
  }, []);

  const [leftWidth, setLeftWidth] = useState(
    () => parseInt(localStorage.getItem('pgcode_split')) || 45
  );
  const latestLeftWidthRef = useRef(leftWidth);
  useEffect(() => { latestLeftWidthRef.current = leftWidth; }, [leftWidth]);

  // Timer: tick every second when not paused (tab hidden) and not stopped (solved)
  useEffect(() => {
    if (timerStopped) return;
    timerRef.current = setInterval(() => {
      if (!timerPaused) setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerPaused, timerStopped]);

  // Timer: pause on tab visibility change
  useEffect(() => {
    const handler = () => setTimerPaused(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Timer: reset when problem changes
  useEffect(() => {
    setTimerSeconds(0);
    setTimerPaused(false);
    setTimerStopped(false);
  }, [activeProblem?.id]);

  // Topic info (cached)
  const { data: topic } = useQuery({
    queryKey: ['topic', categoryId],
    queryFn: async () => {
      const { data } = await supabase.from('PGcode_topics').select('*').eq('id', categoryId).maybeSingle();
      return data || null;
    },
    enabled: !!categoryId,
    staleTime: 60 * 60 * 1000,
  });

  // Problems for this topic (cached, shared with TopicModal)
  const { data: rawProblems, isError: problemsError } = useTopicProblems(categoryId);

  const problems = useMemo(() => {
    if (!rawProblems) return [];
    let filtered = filterByRoadmap(rawProblems, roadmapMode);
    if (filtered.length === 0) filtered = rawProblems;
    if (problemId && !filtered.find(p => p.id === problemId)) {
      const target = rawProblems.find(p => p.id === problemId);
      if (target) filtered = [...filtered, target];
    }
    return filtered;
  }, [rawProblems, roadmapMode, problemId]);

  const loadError = problemsError;

  // If the URL has /category/X/Y but Y isn't a problem under category X (wrong
  // topic_id on the source link, stale bookmark, list-style roadmap, deleted
  // topic, etc.), fall back to fetching the problem row directly so the page
  // actually opens. Without this the page would hang on "Loading…".
  //
  // CRITICAL: fire whenever problemId is set and the topic-filtered list
  // doesn't contain it — even when the topic load returned empty OR errored.
  // Earlier bug: gating on `rawProblems !== undefined` alone meant a network
  // error or RLS failure left rawProblems forever undefined → fallback never
  // fired → page hangs on "Loading…".
  const inTopic = !!problemId && !!problems.find(p => p.id === problemId);
  const { data: directProblem, isLoading: directLoading } = useQuery({
    queryKey: ['problemById', problemId],
    queryFn: async () => {
      const { data } = await supabase.from('PGcode_problems').select('*').eq('id', problemId).maybeSingle();
      return data || null;
    },
    enabled: !!problemId && (rawProblems !== undefined || !!problemsError) && !inTopic,
    staleTime: 60 * 60 * 1000,
    retry: 2,
  });

  // Sync activeProblem from (a) the topic list, (b) the direct fetch, or
  // (c) the topic's first problem if no problemId in URL.
  useEffect(() => {
    let next;
    if (problemId) {
      next = problems.find(p => p.id === problemId) || directProblem;
    } else if (problems.length > 0) {
      next = problems[0];
    }
    if (next) setActiveProblem(prev => (prev?.id === next.id ? prev : next));
  }, [problems, problemId, directProblem]);

  // Persist last-opened problem so Home can offer "Resume where you left off".
  useEffect(() => {
    if (!session?.user?.id || !activeProblem?.id) return;
    try {
      localStorage.setItem(
        `pg-last-problem-${session.user.id}`,
        JSON.stringify({
          id: activeProblem.id,
          name: activeProblem.name,
          difficulty: activeProblem.difficulty,
          topic_id: activeProblem.topic_id,
        }),
      );
    } catch { /* localStorage full or unavailable */ }
  }, [session?.user?.id, activeProblem?.id, activeProblem?.name, activeProblem?.difficulty, activeProblem?.topic_id]);

  // Templates per problem (cached)
  const { data: templates = {} } = useQuery({
    queryKey: qk.templates(activeProblem?.id),
    queryFn: async () => {
      const { data } = await supabase.from('PGcode_problem_templates').select('*').eq('problem_id', activeProblem.id);
      const m = {};
      (data || []).forEach(t => { m[t.language] = t.code; });
      return m;
    },
    enabled: !!activeProblem?.id,
    staleTime: 60 * 60 * 1000,
  });

  // Initialize test case inputs when problem changes
  const activeTestCases = activeProblem?.test_cases;
  useEffect(() => {
    if (activeTestCases?.length > 0 && activeTestCases[0]?.inputs) {
      setActiveTestIdx(0);
      setTestInputs([...activeTestCases[0].inputs]);
    } else {
      setActiveTestIdx(0);
      setTestInputs([]);
    }
    setRunResult(null);
    setResultCaseIdx(0);
    setSubmitProgress(null);
    try {
      const saved = JSON.parse(localStorage.getItem(`pgcode_subs_${activeProblem?.id}`) || '[]');
      setSubmissions(saved);
    } catch { setSubmissions([]); }
    try {
      const savedPinned = JSON.parse(localStorage.getItem(`pgcode_pinned_${activeProblem?.id}`) || '[]');
      setPinnedCaseIndices(Array.isArray(savedPinned) ? savedPinned : []);
    } catch { setPinnedCaseIndices([]); }
    try {
      const savedMode = localStorage.getItem(`pgcode_run_mode_${activeProblem?.id}`);
      setStdinMode(savedMode === 'custom' ? 'custom' : 'cases');
      const savedStdin = localStorage.getItem(`pgcode_run_stdin_${activeProblem?.id}`);
      setCustomStdin(typeof savedStdin === 'string' ? savedStdin : '');
    } catch { setStdinMode('cases'); setCustomStdin(''); }
    try {
      const savedCustom = JSON.parse(localStorage.getItem(`pgcode_custom_cases_${activeProblem?.id}`) || '[]');
      setCustomCases(Array.isArray(savedCustom) ? savedCustom : []);
    } catch { setCustomCases([]); }
    setActiveCustomId(null);
  }, [activeProblem?.id, activeTestCases]);

  // Per-problem user progress (cached). MUST come before the editor-init
  // effect — the effect reads userProgress and React's evaluation of the deps
  // array would otherwise throw a TDZ ReferenceError on mount.
  const { data: userProgress } = useQuery({
    queryKey: ['userProgress', userId, activeProblem?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('PGcode_user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_id', activeProblem.id)
        .maybeSingle();
      return data || null;
    },
    enabled: !!userId && !!activeProblem?.id,
    staleTime: 60 * 1000,
  });

  // Remote submission history (memory + notes + source_code). Powers the
  // LeetCode-style detail panel under the Submissions tab.
  const { data: remoteSubmissions = [] } = useSubmissionsForProblem(userId, activeProblem?.id);
  const updateSubmissionNotes = useUpdateSubmissionNotes();

  // Track which (problem, lang) combo the editor has been initialized for.
  // Without this, the effect's `userProgress` dep would cause every Run/save to
  // re-initialize the editor (stomping the user's in-flight edits).
  const initKeyRef = useRef('');
  useEffect(() => {
    if (!activeProblem) return;
    const key = `${activeProblem.id}::${activeLang}`;
    if (initKeyRef.current === key) return;

    const localKey = `pgcode_code_${activeProblem.id}_${activeLang}`;
    const localCode = localStorage.getItem(localKey);
    const hasMetadata = activeProblem.method_name && activeProblem.params;
    const generated = hasMetadata ? generateTemplate(activeLang, activeProblem.method_name, activeProblem.params, activeProblem.return_type) : null;

    const isStaleGeneric = localCode && (
      localCode.includes('def solve(self, input)') ||
      localCode.includes('var solve = function(input)') ||
      localCode.includes('Object solve(')
    );
    if (isStaleGeneric) localStorage.removeItem(localKey);

    if (localCode && !isStaleGeneric) setCodeContent(localCode);
    else if (userProgress?.last_code?.[activeLang]) setCodeContent(userProgress.last_code[activeLang]);
    else setCodeContent(generated || templates[activeLang] || fallbackStarter(activeLang, activeProblem.name));

    initKeyRef.current = key;
  }, [activeProblem, activeLang, templates, userProgress]);

  // Companies that have asked this problem + similar problems (sharing concepts)
  const { data: problemCompanies = [] } = useProblemCompanies(activeProblem?.id);
  const { data: similarProblems = [] } = useSimilarProblems(activeProblem?.id);

  // Sync notes/confidence local UI state from cached progress
  useEffect(() => {
    setNotes(userProgress?.notes || '');
    setConfidence(userProgress?.confidence || 0);
  }, [userProgress?.id, userProgress?.notes, userProgress?.confidence]);

  const saveProgress = async (updates) => {
    if (!userId || !activeProblem) return;
    const payload = { user_id: userId, problem_id: activeProblem.id, updated_at: new Date().toISOString(), ...updates };
    const { error } = await supabase.from('PGcode_user_progress').upsert(payload);
    if (!error) {
      // Optimistically merge into both the per-problem and bundle caches so the
      // UI flips before invalidation refetches.
      queryClient.setQueryData(['userProgress', userId, activeProblem.id], (prev) => ({ ...(prev || {}), ...payload }));
      queryClient.setQueryData(qk.userProgress(userId), (old) => {
        if (!old) return old;
        const rows = old.rows ? [...old.rows] : [];
        const byId = { ...(old.byId || {}) };
        const existing = byId[activeProblem.id] || {};
        const merged = { ...existing, ...payload };
        byId[activeProblem.id] = merged;
        const idx = rows.findIndex(r => r.problem_id === activeProblem.id);
        if (idx >= 0) rows[idx] = merged; else rows.push(merged);
        return { rows, byId };
      });
      queryClient.invalidateQueries({ queryKey: qk.userProgress(userId) });
    }
  };

  const SAMPLE_FALLBACK_COUNT = 3;

  // Sample = visible to the user. The rest are hidden and only the grader sees
  // them on submit. Each test case carries an `is_sample` flag (backfilled by
  // scripts/mark-sample-cases.js); for any legacy row missing the flag, fall
  // back to the first 3 indices so the panel never renders empty.
  const visibleCaseIndices = React.useMemo(() => {
    if (!activeProblem?.test_cases?.length) return [];
    const total = activeProblem.test_cases.length;
    const flagged = [];
    for (let i = 0; i < total; i++) {
      if (activeProblem.test_cases[i]?.is_sample === true) flagged.push(i);
    }
    const set = new Set(flagged.length ? flagged : Array.from({ length: Math.min(SAMPLE_FALLBACK_COUNT, total) }, (_, i) => i));
    pinnedCaseIndices.forEach(idx => { if (idx >= 0 && idx < total) set.add(idx); });
    return Array.from(set).sort((a, b) => a - b);
  }, [activeProblem?.test_cases, pinnedCaseIndices]);

  const pinCase = (originalIdx) => {
    setPinnedCaseIndices(prev => {
      if (prev.includes(originalIdx)) return prev;
      const next = [...prev, originalIdx].sort((a, b) => a - b);
      try { localStorage.setItem(`pgcode_pinned_${activeProblem.id}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    // Update runResult to remove canPin flag since case is now visible
    setRunResult(prev => {
      if (!prev?.cases) return prev;
      return {
        ...prev,
        cases: prev.cases.map(c =>
          c.originalIdx === originalIdx ? { ...c, canPin: false, isHidden: false } : c
        ),
      };
    });
  };

  const unpinCase = (originalIdx) => {
    setPinnedCaseIndices(prev => {
      const next = prev.filter(i => i !== originalIdx);
      try { localStorage.setItem(`pgcode_pinned_${activeProblem.id}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    // If the unpinned case was currently selected, fall back to case 0
    if (activeTestIdx === originalIdx) {
      setActiveTestIdx(0);
      if (activeProblem?.test_cases?.[0]?.inputs) {
        setTestInputs([...activeProblem.test_cases[0].inputs]);
      }
    }
  };

  const persistTabOrder = (next) => {
    try { localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const handleTabDragStart = (id) => (e) => {
    setDragTabId(id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch { /* Safari quirk */ }
  };
  const handleTabDragOver = (id) => (e) => {
    if (!dragTabId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabId !== id) setDragOverTabId(id);
  };
  const handleTabDrop = (id) => (e) => {
    e.preventDefault();
    if (!dragTabId || dragTabId === id) { setDragTabId(null); setDragOverTabId(null); return; }
    setTabOrder(prev => {
      const from = prev.indexOf(dragTabId);
      const to = prev.indexOf(id);
      if (from < 0 || to < 0) return prev;
      const next = prev.slice();
      next.splice(from, 1);
      next.splice(to, 0, dragTabId);
      persistTabOrder(next);
      return next;
    });
    setDragTabId(null);
    setDragOverTabId(null);
  };
  const handleTabDragEnd = () => { setDragTabId(null); setDragOverTabId(null); };

  const persistCustomCases = (next) => {
    if (!activeProblem) return;
    try { localStorage.setItem(`pgcode_custom_cases_${activeProblem.id}`, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const addCustomCase = () => {
    if (!activeProblem) return;
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setCustomCases(prev => {
      const next = [...prev, { id, stdin: '' }];
      persistCustomCases(next);
      return next;
    });
    setActiveCustomId(id);
    setStdinMode('custom');
    setCustomStdin('');
    try { localStorage.setItem(`pgcode_run_mode_${activeProblem.id}`, 'custom'); } catch { /* ignore */ }
  };

  const selectCustomCase = (id) => {
    const found = customCases.find(c => c.id === id);
    if (!found) return;
    setActiveCustomId(id);
    setStdinMode('custom');
    setCustomStdin(found.stdin || '');
    if (activeProblem) {
      try {
        localStorage.setItem(`pgcode_run_mode_${activeProblem.id}`, 'custom');
        localStorage.setItem(`pgcode_run_stdin_${activeProblem.id}`, found.stdin || '');
      } catch { /* ignore */ }
    }
  };

  const updateCustomCase = (id, stdin) => {
    setCustomCases(prev => {
      const next = prev.map(c => c.id === id ? { ...c, stdin } : c);
      persistCustomCases(next);
      return next;
    });
    if (id === activeCustomId) {
      setCustomStdin(stdin);
      if (activeProblem) {
        try { localStorage.setItem(`pgcode_run_stdin_${activeProblem.id}`, stdin); } catch { /* ignore */ }
      }
    }
  };

  const removeCustomCase = (id) => {
    setCustomCases(prev => {
      const next = prev.filter(c => c.id !== id);
      persistCustomCases(next);
      return next;
    });
    if (activeCustomId === id) {
      setActiveCustomId(null);
      setStdinMode('cases');
      setCustomStdin('');
      if (activeProblem) {
        try { localStorage.setItem(`pgcode_run_mode_${activeProblem.id}`, 'cases'); } catch { /* ignore */ }
      }
    }
  };

  const handleRun = async () => {
    // Custom-stdin mode: bypass the test harness and run the user's raw source against
    // whatever they typed in the textarea. Submit ignores this and always grades real cases.
    const useCustomStdin = stdinMode === 'custom';

    // Fall back to single raw execution for problems without driver metadata,
    // or whenever the user has opted into custom-stdin mode.
    if (useCustomStdin || !activeProblem.test_cases?.length || !activeProblem.method_name || !activeProblem.params) {
      setLeftTab('testresult');
      setRunning(true);
      setRunResult(null);
      setResultCaseIdx(0);
      setConsoleOutput('Running...');
      try {
        const result = await runCode(codeContent, activeLang, useCustomStdin ? customStdin : '');
        if (result.status !== 'success') {
          const statusMap = { compile_error: 'Compile Error', time_limit: 'Time Limit Exceeded', runtime_error: 'Runtime Error' };
          setRunResult({ status: 'error', statusText: statusMap[result.status] || 'Error', error: result.output, isSubmission: false });
          setConsoleOutput('');
        } else {
          setConsoleOutput(result.output);
          setRunResult(null);
        }
      } catch (err) {
        { const e = humanizeRunError(err); setRunResult({ status: 'error', statusText: e.title, error: e.detail, isSubmission: false }); }
        setConsoleOutput('');
      } finally {
        setRunning(false);
      }
      return;
    }

    setLeftTab('testresult');
    setRunning(true);
    setRunResult(null);
    setResultCaseIdx(0);
    setConsoleOutput('');
    const indices = visibleCaseIndices;
    const total = indices.length;
    setSubmitProgress({ current: 0, total });

    try {
      const params = activeProblem.params || [];
      const cases = [];
      let passedCount = 0;
      let firstFailIdx = -1;

      const stdins = indices.map(idx => buildStdin(activeProblem.test_cases[idx].inputs));
      const useMultiCase = (activeLang === 'java' || activeLang === 'cpp') && total > 1;
      const fullCode = wrapWithDriver(
        codeContent, activeLang,
        activeProblem.method_name, activeProblem.params, activeProblem.return_type,
        useMultiCase ? { multiCaseCount: total } : {},
      );
      const results = useMultiCase
        ? await runCodeMultiCase(fullCode, activeLang, stdins)
        : await runCodeBatch(fullCode, activeLang, stdins);
      setSubmitProgress({ current: total, total });

      for (let i = 0; i < total; i++) {
        const originalIdx = indices[i];
        const tc = activeProblem.test_cases[originalIdx];
        const result = results[i];

        if (result.status !== 'success') {
          // Compile error is code-level — will fail identically for all cases, so break early
          if (result.status === 'compile_error') {
            const statusMap = { compile_error: 'Compile Error', time_limit: 'Time Limit Exceeded', runtime_error: 'Runtime Error' };
            setRunResult({
              status: 'error',
              statusText: statusMap[result.status] || 'Error',
              error: result.output,
              totalCases: total,
              totalPassed: passedCount,
              isSubmission: false,
            });
            return;
          }
          // Runtime error / TLE may be case-specific — record and continue
          if (firstFailIdx === -1) firstFailIdx = i;
          cases.push({
            passed: false,
            originalIdx,
            input: params.map((p, j) => ({ name: p.name, value: tc.inputs[j] || '' })),
            output: result.output?.trim() || '(Error)',
            expected: tc.expected,
          });
          continue;
        }

        const passed = compareOutput(result.output, tc.expected);
        if (passed) passedCount++;
        if (!passed && firstFailIdx === -1) firstFailIdx = i;

        cases.push({
          passed,
          originalIdx,
          input: params.map((p, j) => ({ name: p.name, value: tc.inputs[j] || '' })),
          output: result.output.trim(),
          expected: tc.expected,
        });
      }

      const allPassed = passedCount === total;
      setRunResult({
        status: allPassed ? 'accepted' : 'wrong_answer',
        statusText: allPassed ? 'Accepted' : 'Wrong Answer',
        cases,
        activeCaseIdx: firstFailIdx >= 0 ? firstFailIdx : 0,
        totalCases: total,
        totalPassed: passedCount,
        isSubmission: false,
      });
      setResultCaseIdx(firstFailIdx >= 0 ? firstFailIdx : 0);
    } catch (err) {
      { const e = humanizeRunError(err); setRunResult({ status: 'error', statusText: e.title, error: e.detail, isSubmission: false }); }
    } finally {
      setRunning(false);
      setSubmitProgress(null);
    }
  };

  const handleSubmit = async () => {
    if (!activeProblem.test_cases?.length || !activeProblem.method_name) {
      await handleRun();
      return;
    }

    setLeftTab('testresult');
    setRunning(true);
    setRunResult(null);
    setResultCaseIdx(0);
    setConsoleOutput('');
    const total = activeProblem.test_cases.length;
    setSubmitProgress({ current: 0, total });

    const startTime = Date.now();

    try {
      const params = activeProblem.params || [];
      let allPassed = true;
      let failIdx = -1;

      const stdins = activeProblem.test_cases.map(tc => buildStdin(tc.inputs));
      const useMultiCase = (activeLang === 'java' || activeLang === 'cpp') && total > 1;
      const fullCode = wrapWithDriver(
        codeContent, activeLang,
        activeProblem.method_name, activeProblem.params, activeProblem.return_type,
        useMultiCase ? { multiCaseCount: total } : {},
      );
      const results = useMultiCase
        ? await runCodeMultiCase(fullCode, activeLang, stdins)
        : await runCodeBatch(fullCode, activeLang, stdins);
      setSubmitProgress({ current: total, total });

      for (let i = 0; i < total; i++) {
        const tc = activeProblem.test_cases[i];
        const result = results[i];

        if (result.status !== 'success') {
          allPassed = false;
          failIdx = i;
          const statusMap = { compile_error: 'Compile Error', time_limit: 'Time Limit Exceeded', runtime_error: 'Runtime Error' };
          setRunResult({
            status: 'error',
            statusText: statusMap[result.status] || 'Error',
            error: result.output,
            failedCase: i + 1,
            totalCases: total,
            totalPassed: i,
            isSubmission: true,
          });
          break;
        }

        const passed = compareOutput(result.output, tc.expected);

        if (!passed) {
          allPassed = false;
          failIdx = i;
          const isHidden = !visibleCaseIndices.includes(i);
          // Show only the failing case (NeetCode/LeetCode style)
          setRunResult({
            status: 'wrong_answer',
            statusText: 'Wrong Answer',
            cases: [{
              passed: false,
              originalIdx: i,
              isHidden,
              canPin: isHidden,
              input: params.map((p, j) => ({ name: p.name, value: tc.inputs[j] || '' })),
              output: result.output.trim(),
              expected: tc.expected,
            }],
            activeCaseIdx: 0,
            failedCase: i + 1,
            totalCases: total,
            totalPassed: i,
            isSubmission: true,
          });
          setResultCaseIdx(0);
          break;
        }
      }

      const elapsed = Date.now() - startTime;

      if (allPassed) {
        // Lock the solve-time the moment submission is accepted.
        setTimerStopped(true);
        setRunResult({
          status: 'accepted',
          statusText: 'Accepted',
          totalCases: total,
          totalPassed: total,
          runtime: elapsed,
          isSubmission: true,
        });
        // Trigger success animation
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        // Fetch similar problems by tags (requires migrate_add_tags.sql)
        if (activeProblem?.tags?.length > 0) {
          supabase
            .from('PGcode_problems')
            .select('id, name, topic_id, difficulty')
            .overlaps('tags', activeProblem.tags)
            .neq('id', activeProblem.id)
            .limit(5)
            .then(({ data }) => setPostSolveSimilar(data || []))
            .catch(() => setPostSolveSimilar([]));
        } else {
          setPostSolveSimilar([]);
        }
        if (session?.user) {
          saveProgress({
            is_completed: true,
            last_solved_at: new Date().toISOString(),
            next_review_at: new Date(Date.now() + 3 * 86400000).toISOString(),
            solve_count: (userProgress?.solve_count || 0) + 1,
          });
        }
      }

      // Save submission to history with a code snapshot so the user can
      // re-load the exact submission by clicking it in the Submissions tab.
      const sub = {
        id: (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
        status: allPassed ? 'Accepted' : (failIdx >= 0 ? 'Wrong Answer' : 'Error'),
        language: activeLang,
        runtime: allPassed ? `${elapsed}ms` : 'N/A',
        passed: allPassed ? total : (failIdx >= 0 ? failIdx : 0),
        total,
        date: new Date().toISOString(),
        code: codeContent,
      };
      const newSubs = [sub, ...submissions].slice(0, 20);
      setSubmissions(newSubs);
      try { localStorage.setItem(`pgcode_subs_${activeProblem.id}`, JSON.stringify(newSubs)); } catch { /* ignore */ }

      // Persist to PGcode_user_submissions so the LeetCode-style detail panel
      // can render full stats + accept per-submission notes. Memory is
      // approximated from source length (Judge0 memory is unreliable across
      // languages); deterministic so histogram bins behave.
      if (userId) {
        const verdict = allPassed ? 'accepted' : (failIdx >= 0 ? 'wrong_answer' : 'error');
        const memoryKb = 12000 + ((codeContent?.length || 0) * 7) % 8000;
        supabase.from('PGcode_user_submissions').insert({
          user_id: userId,
          problem_id: activeProblem.id,
          language: activeLang,
          source_code: codeContent,
          verdict,
          kind: 'submit',
          cases_passed: sub.passed,
          cases_total: total,
          runtime_ms: allPassed ? elapsed : null,
          memory_kb: allPassed ? memoryKb : null,
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: qk.submissionsForProblem(userId, activeProblem.id) });
        });
      }

    } catch (err) {
      { const e = humanizeRunError(err); setRunResult({ status: 'error', statusText: e.title, error: e.detail, isSubmission: true }); }
    } finally {
      setRunning(false);
      setSubmitProgress(null);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl+Enter runs code, Cmd/Ctrl+Shift+Enter submits.
  // Use refs so the listener stays bound to the freshest handler without re-binding.
  const runRef = useRef(handleRun);
  const submitRef = useRef(handleSubmit);
  runRef.current = handleRun;
  submitRef.current = handleSubmit;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (running) return;
        if (e.shiftKey) submitRef.current?.();
        else runRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running]);

  // Retained for the confidence control + manual notes-save button (auto-save
  // covers persistence today); underscore-prefixed to mark intentionally unused.
  const _setAndSaveConfidence = (val) => {
    setConfidence(val);
    saveProgress({
      confidence: val,
      next_review_at: nextReviewAt(val, userProgress?.solve_count || 1),
    });
  };

  const _saveNotes = () => { saveProgress({ notes }); setEditorStatus('Notes saved'); setTimeout(() => setEditorStatus(''), 2000); };

  // Debounced auto-save of notes — manual Save button stays as a confidence
  // signal, but users won't lose unsaved edits on tab close / nav-away.
  useEffect(() => {
    if (!userId || !activeProblem) return;
    const remote = userProgress?.notes || '';
    if (notes === remote) return;
    const t = setTimeout(() => { saveProgress({ notes }); }, 1500);
    return () => clearTimeout(t);
    // saveProgress is intentionally NOT in deps — it changes identity each
    // render and would re-debounce constantly. activeProblem.id is the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, userId, activeProblem?.id, userProgress?.notes]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    registerMonacoThemes(monaco);
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
    });
    // Monaco swallows Cmd/Ctrl+Enter inside the editor surface; register it as
    // an editor action so the shortcut works even when the user is typing code.
    editor.addAction({
      id: 'pgcode.run',
      label: 'PG Hub: Run',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => { runRef.current?.(); },
    });
    editor.addAction({
      id: 'pgcode.submit',
      label: 'PG Hub: Submit',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => { submitRef.current?.(); },
    });
  };

  const handleDividerDrag = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = latestLeftWidthRef.current;
    let finalPct = startW;
    const onMove = (ev) => {
      const c = document.querySelector('.ws-main');
      if (!c) return;
      const total = c.offsetWidth;
      const MIN_LEFT_PX = 280;
      const MIN_RIGHT_PX = 420;
      const minPct = (MIN_LEFT_PX / total) * 100;
      const maxPct = ((total - MIN_RIGHT_PX) / total) * 100;
      const pct = Math.max(minPct, Math.min(maxPct, startW + ((ev.clientX - startX) / total) * 100));
      finalPct = pct;
      setLeftWidth(pct);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      localStorage.setItem('pgcode_split', Math.round(finalPct));
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  if (loadError) return <div className="ws-loading">Something went wrong loading this problem. <Link to="/">Back to Roadmap</Link></div>;
  // After the topic AND direct fetch have both finished, if we still have no
  // problem, the ID truly doesn't exist — say so instead of spinning forever.
  if (!activeProblem) {
    const giveUp = problemId && rawProblems !== undefined && !directLoading && directProblem === null;
    if (giveUp) {
      return (
        <div className="ws-loading">
          Couldn&rsquo;t find a problem with id <code>{problemId}</code>.
          <br />
          <Link to="/practice">Browse all problems</Link> · <Link to="/">Back to roadmap</Link>
        </div>
      );
    }
    return <div className="ws-loading">Loading… <Link to="/">Back to roadmap</Link></div>;
  }

  const cleanedName = activeProblem.name.replace(/Pattern #(\d+)/, 'Problem #$1').replace(/Challenge #(\d+)/, 'Problem #$1');
  const displayName = activeProblem.leetcode_number ? `${activeProblem.leetcode_number}. ${cleanedName}` : cleanedName;

  // LC-imported problems bake a "Constraints:" section into the description HTML.
  // When that's already present we must NOT render the dedicated constraints
  // block below, or the reader sees Constraints twice.
  const descHasConstraints = typeof activeProblem.description === 'string'
    && /constraints?\s*:/i.test(activeProblem.description);

  // Examples to render below the description. We prefer the seeded description's
  // own examples (lots of legacy problems embed them as HTML); if it has none,
  // synthesize from the first ~3 sample test cases so the user always sees concrete
  // I/O instead of a wall of prose.
  // Curated, prose-explained samples authored per-problem. Shape:
  // [{ inputs: [string], expected: string, explanation_md: string, viz_anchor: string|null }, ...].
  // When present, these render ABOVE the auto-synthesized examples below.
  const explainedSamples = Array.isArray(activeProblem.explained_samples)
    ? activeProblem.explained_samples.filter(s => s && (Array.isArray(s.inputs) || s.expected !== undefined))
    : [];
  const formatExplainedInput = (s) => {
    if (!Array.isArray(s.inputs) || !s.inputs.length) return '';
    const params = Array.isArray(activeProblem.params) ? activeProblem.params : [];
    return s.inputs.map((v, j) => {
      const name = params[j]?.name || `arg${j}`;
      return `${name} = ${typeof v === 'string' ? v : JSON.stringify(v)}`;
    }).join(', ');
  };
  // Minimal markdown for explained_samples — bold, inline code, and line breaks.
  // Avoids pulling in a parser dep; explanations are short prose, not full docs.
  const renderExplanationMd = (md) => {
    const safe = String(md || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return safe
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  const descHasExamples = /\bexamples?\s*\d*\s*:/i.test(activeProblem.description || '');
  const sampleCases = (() => {
    if (descHasExamples) return [];
    const tcs = Array.isArray(activeProblem.test_cases) ? activeProblem.test_cases : [];
    const samples = tcs.filter(t => t && (t.sample || t.is_sample || t.example));
    const pool = samples.length ? samples : tcs;
    // Flagship test_cases use `inputs: [string]` (array, one per param). LC-imported
    // sample_test_cases use `input` (singular string). Map both formats.
    const formatInput = (t) => {
      if (Array.isArray(t.inputs) && t.inputs.length) {
        const params = Array.isArray(activeProblem.params) ? activeProblem.params : [];
        return t.inputs.map((v, j) => {
          const name = params[j]?.name || `arg${j}`;
          return `${name} = ${typeof v === 'string' ? v : JSON.stringify(v)}`;
        }).join(', ');
      }
      const v = t.input ?? t.in ?? t.stdin ?? '';
      return typeof v === 'string' ? v : JSON.stringify(v);
    };
    return pool.slice(0, 5).map((t, i) => {
      const output = t.expected ?? t.output ?? t.out ?? '';
      const explain = t.explanation || t.note || '';
      return {
        i: i + 1,
        input: formatInput(t),
        output: typeof output === 'string' ? output : JSON.stringify(output),
        explain,
      };
    });
  })();

  return (
    <div className="ws-container">
      {showSuccess && (
        <div className="ws-success-overlay">
          <div className="ws-success-flash">
            <CheckCircle size={32} />
            <span>Accepted</span>
          </div>
        </div>
      )}
      <div className="ws-main">
        {/* ═══ LEFT PANEL ═══ */}
        <div className="ws-left" style={{ width: `${leftWidth}%` }}>
          <div className="ws-left-header">
            <Link to="/" className="ws-back"><ChevronLeft size={14} /> Back</Link>
            {problems.length > 1 && (() => {
              const currentIdx = problems.findIndex(p => p.id === activeProblem?.id);
              const prevProblem = currentIdx > 0 ? problems[currentIdx - 1] : null;
              const nextProblem = currentIdx < problems.length - 1 ? problems[currentIdx + 1] : null;
              return (
                <div className="ws-nav-arrows">
                  <button
                    className="ws-nav-btn"
                    disabled={!prevProblem}
                    onClick={() => prevProblem && navigate(`/category/${categoryId}/${prevProblem.id}`)}
                    title={prevProblem ? prevProblem.name : 'No previous problem'}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="ws-nav-count">{currentIdx + 1}/{problems.length}</span>
                  <button
                    className="ws-nav-btn"
                    disabled={!nextProblem}
                    onClick={() => nextProblem && navigate(`/category/${categoryId}/${nextProblem.id}`)}
                    title={nextProblem ? nextProblem.name : 'No next problem'}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* LeetCode-style tabs — drag to reorder, order persists per-user. */}
          <div className="ws-left-tabs">
            {tabOrder.map(id => {
              const def = {
                description: { label: 'Description', Icon: FileText },
                hints: { label: 'Hints', Icon: Lightbulb },
                solution: { label: 'Solution', Icon: Award },
                submissions: { label: 'Submissions', Icon: Award },
                discussion: { label: 'Discussion', Icon: MessageSquare },
                testcase: { label: 'Testcase', Icon: TestTube },
              }[id];
              if (!def) return null;
              const { Icon } = def;
              return (
                <button
                  key={id}
                  className={`ws-tab ${leftTab === id ? 'active' : ''} ${dragTabId === id ? 'dragging' : ''} ${dragOverTabId === id && dragTabId && dragTabId !== id ? 'drag-over' : ''}`}
                  onClick={() => setLeftTab(id)}
                  draggable
                  onDragStart={handleTabDragStart(id)}
                  onDragOver={handleTabDragOver(id)}
                  onDrop={handleTabDrop(id)}
                  onDragEnd={handleTabDragEnd}
                  title="Drag to reorder"
                >
                  <GripVertical size={11} className="ws-tab-grip" />
                  <Icon size={13} /> {def.label}
                </button>
              );
            })}
            {(consoleOutput || runResult || running) && (
              <button className={`ws-tab ${leftTab === 'testresult' ? 'active' : ''}`} onClick={() => setLeftTab('testresult')}>
                Test Result
              </button>
            )}
          </div>

          <div className="ws-left-content">
            {/* ── DESCRIPTION TAB ── */}
            {leftTab === 'description' && (
              <div className="ws-question">
                <div className="ws-q-head">
                  <h1 className="ws-q-title">{displayName}</h1>
                  <span className={`ws-diff-badge ws-diff-${activeProblem.difficulty?.toLowerCase()}`}>{activeProblem.difficulty}</span>
                </div>


                {problemCompanies.length > 0 && (
                  <div className="ws-companies">
                    <span className="ws-companies-label">Asked at</span>
                    <div className="ws-company-chips">
                      {problemCompanies.map(c => (
                        <Link key={c.slug} to={`/company/${c.slug}`} className="ws-company-chip">{c.name}</Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ws-q-desc" dangerouslySetInnerHTML={{ __html: activeProblem.description }} />

                {explainedSamples.length > 0 && (
                  <div className="ws-examples ws-examples-explained">
                    {explainedSamples.map((s, i) => {
                      const inputStr = formatExplainedInput(s);
                      const expectedStr = typeof s.expected === 'string' ? s.expected : JSON.stringify(s.expected);
                      return (
                        <div key={`exp-${i}`} className="ws-example">
                          <div className="ws-example-title">Example {i + 1}</div>
                          {inputStr && (
                            <div className="ws-example-row"><span className="ws-example-label">Input</span><code>{inputStr}</code></div>
                          )}
                          <div className="ws-example-row"><span className="ws-example-label">Output</span><code>{expectedStr}</code></div>
                          {s.explanation_md && (
                            <div className="ws-example-row">
                              <span className="ws-example-label">Explanation</span>
                              <span
                                className="ws-example-explain"
                                dangerouslySetInnerHTML={{ __html: renderExplanationMd(s.explanation_md) }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {explainedSamples.length === 0 && sampleCases.length > 0 && (
                  <div className="ws-examples">
                    {sampleCases.map(ex => (
                      <div key={ex.i} className="ws-example">
                        <div className="ws-example-title">Example {ex.i}</div>
                        <div className="ws-example-row"><span className="ws-example-label">Input</span><code>{ex.input}</code></div>
                        <div className="ws-example-row"><span className="ws-example-label">Output</span><code>{ex.output}</code></div>
                        {ex.explain && (
                          <div className="ws-example-row"><span className="ws-example-label">Explanation</span><span className="ws-example-explain">{ex.explain}</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints — skipped when the description HTML already
                    embeds its own Constraints section (LC-imported rows). */}
                {!descHasConstraints && (() => {
                  const raw = activeProblem.constraints;
                  if (!raw) return null;
                  const arr = Array.isArray(raw)
                    ? raw
                    : (typeof raw === 'string'
                        ? raw.split('\n').filter(Boolean)
                        : [toText(raw)]);
                  const constraintItems = arr.map(toText).filter(t => t && t.trim().length > 0);
                  if (constraintItems.length === 0) return null;
                  return (
                    <div className="ws-constraints">
                      <div className="ws-constraints-title">Constraints</div>
                      <ul>
                        {constraintItems.map((text, i) => (
                          <li key={i} dangerouslySetInnerHTML={{ __html: text.replace(/`([^`]+)`/g, '<code>$1</code>') }} />
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {/* Follow-up */}
                {activeProblem.follow_up && toText(activeProblem.follow_up).trim().length > 0 && (
                  <div className="ws-followup">
                    <div className="ws-followup-label">Follow-up</div>
                    <p>{toText(activeProblem.follow_up)}</p>
                  </div>
                )}

                {/* Topics — merges explicit topics, tags, topic_id name, and category. */}
                {(() => {
                  const list = [];
                  const seen = new Set();
                  const add = (raw) => {
                    const t = toText(raw);
                    if (!t) return;
                    const key = t.toLowerCase().trim();
                    if (seen.has(key)) return;
                    seen.add(key);
                    list.push(t);
                  };
                  if (Array.isArray(activeProblem.topics)) activeProblem.topics.forEach(add);
                  if (Array.isArray(activeProblem.tags)) activeProblem.tags.forEach(add);
                  if (topic?.name) add(primaryTopicLabel(topic.name) || topic.name);
                  if (topic?.category) add(topic.category);
                  if (activeProblem.pattern) add(activeProblem.pattern);
                  if (list.length === 0) return null;
                  return (
                    <details className="ws-expandable ws-expandable-topics">
                      <summary>
                        <ChevronRight size={13} className="ws-expandable-caret" />
                        <span>Topics</span>
                        <span className="ws-expandable-count">{list.length}</span>
                      </summary>
                      <div className="ws-topics-wrap">
                        {list.map((label, i) => (
                          <span key={i} className="ws-topic-pill">{label}</span>
                        ))}
                      </div>
                    </details>
                  );
                })()}

                {similarProblems.length > 0 && (
                  <div className="ws-similar">
                    <h3 className="ws-similar-title">Similar problems</h3>
                    <div className="ws-similar-grid">
                      {similarProblems.map(p => (
                        <Link
                          key={p.id}
                          to={`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`}
                          className="ws-similar-card"
                        >
                          <span className="ws-similar-name">{p.leetcode_number ? `${p.leetcode_number}. ${p.name}` : p.name}</span>
                          <span className={`ws-similar-diff ws-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── HINTS TAB ── */}
            {leftTab === 'hints' && (
              <HintsPanel
                hints={activeProblem.hints || []}
                problemId={activeProblem.id}
                problemName={activeProblem.name}
                problemDescription={activeProblem.description}
                code={codeContent}
              />
            )}

            {/* ── SOLUTION TAB ── */}
            {leftTab === 'solution' && (
              <div className="ws-solution">
                <SolutionView problem={activeProblem} activeLang={activeLang} />
              </div>
            )}

            {/* ── SUBMISSIONS TAB ── */}
            {leftTab === 'submissions' && (
              <SubmissionsTabContent
                session={session}
                userId={userId}
                userProgress={userProgress}
                activeProblem={activeProblem}
                activeLang={activeLang}
                onLangChange={onLangChange}
                saveProgress={saveProgress}
                setCodeContent={setCodeContent}
                setRunResult={setRunResult}
                submissions={submissions}
                remoteSubmissions={remoteSubmissions}
                selectedSubmissionId={selectedSubmissionId}
                setSelectedSubmissionId={setSelectedSubmissionId}
                submissionNotesDraft={submissionNotesDraft}
                setSubmissionNotesDraft={setSubmissionNotesDraft}
                submissionNotesStatus={submissionNotesStatus}
                setSubmissionNotesStatus={setSubmissionNotesStatus}
                submissionCodeExpanded={submissionCodeExpanded}
                setSubmissionCodeExpanded={setSubmissionCodeExpanded}
                submissionCodeCopied={submissionCodeCopied}
                setSubmissionCodeCopied={setSubmissionCodeCopied}
                updateSubmissionNotes={updateSubmissionNotes}
              />
            )}

            {/* ── DISCUSSION TAB ── */}
            {leftTab === 'discussion' && (
              <div className="ws-discussion">
                <Discussion targetKind="problem" targetId={activeProblem.id} session={session} />
              </div>
            )}

            {/* ── TESTCASE TAB ── */}
            {leftTab === 'testcase' && (
              <div className="ws-testcase">
                {activeProblem.test_cases?.length > 0 || customCases.length > 0 ? (
                  <>
                    <div className="ws-tc-cases">
                      {visibleCaseIndices.map((originalIdx, i) => {
                        const isPinned = pinnedCaseIndices.includes(originalIdx);
                        const isActive = !activeCustomId && activeTestIdx === originalIdx;
                        return (
                          <div key={originalIdx} className={`ws-tc-case-wrap ${isActive ? 'active' : ''}`}>
                            <button
                              className={`ws-tc-case ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''}`}
                              onClick={() => {
                                setActiveTestIdx(originalIdx);
                                setTestInputs([...activeProblem.test_cases[originalIdx].inputs]);
                                setActiveCustomId(null);
                                setStdinMode('cases');
                                if (activeProblem) {
                                  try { localStorage.setItem(`pgcode_run_mode_${activeProblem.id}`, 'cases'); } catch { /* ignore */ }
                                }
                              }}>
                              {isPinned && <Pin size={11} className="ws-tc-pin-icon" />}
                              Case {i + 1}
                            </button>
                            {isPinned && (
                              <button
                                className="ws-tc-unpin"
                                title="Remove pinned case"
                                onClick={(e) => { e.stopPropagation(); unpinCase(originalIdx); }}>
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {customCases.map((cc, i) => {
                        const isActive = activeCustomId === cc.id;
                        return (
                          <div key={cc.id} className={`ws-tc-case-wrap ws-tc-custom ${isActive ? 'active' : ''}`}>
                            <button
                              className={`ws-tc-case ${isActive ? 'active' : ''}`}
                              onClick={() => selectCustomCase(cc.id)}>
                              Custom {i + 1}
                            </button>
                            <button
                              className="ws-tc-unpin"
                              title="Remove custom case"
                              onClick={(e) => { e.stopPropagation(); removeCustomCase(cc.id); }}>
                              <X size={11} />
                            </button>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className="ws-tc-add-custom"
                        onClick={addCustomCase}
                        title="Add a custom test case with free-form stdin">
                        <Plus size={12} /> Custom
                      </button>
                      {activeProblem.test_cases?.length > visibleCaseIndices.length && (
                        <span className="ws-tc-hidden-badge" title="Hidden cases run only on Submit">
                          <Lock size={11} />
                          + {activeProblem.test_cases.length - visibleCaseIndices.length} hidden tests will run on submit
                        </span>
                      )}
                    </div>
                    {activeCustomId ? (
                      <div className="ws-tc-fields">
                        <div className="ws-tc-field ws-tc-field-custom">
                          <label>Custom stdin (each line is one parameter)</label>
                          <textarea
                            className="ws-tc-input ws-tc-textarea"
                            value={customCases.find(c => c.id === activeCustomId)?.stdin || ''}
                            onChange={e => updateCustomCase(activeCustomId, e.target.value)}
                            placeholder={'[2,7,11,15]\n9'}
                            spellCheck={false}
                            rows={4}
                          />
                        </div>
                      </div>
                    ) : (
                      activeProblem.test_cases?.length > 0 && (
                        <div className="ws-tc-fields">
                          {(activeProblem.params || []).map((param, i) => (
                            <div key={i} className="ws-tc-field">
                              <label>{param.name} =</label>
                              <input type="text" value={testInputs[i] || ''} onChange={e => {
                                const next = [...testInputs];
                                next[i] = e.target.value;
                                setTestInputs(next);
                              }} className="ws-tc-input" />
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </>
                ) : (
                  <>
                    <div className="ws-tc-cases">
                      <button
                        type="button"
                        className="ws-tc-add-custom"
                        onClick={addCustomCase}
                        title="Add a custom test case with free-form stdin">
                        <Plus size={12} /> Custom
                      </button>
                    </div>
                    <p className="ws-empty-msg">No test cases available for this problem yet. Add a Custom case to run with your own stdin.</p>
                  </>
                )}
              </div>
            )}

            {/* ── TEST RESULT TAB ── */}
            {leftTab === 'testresult' && (
              <div className="ws-testresult">
                {/* Submit progress */}
                {running && submitProgress && (
                  <div className="ws-submit-progress">
                    <div className="ws-submit-loading">
                      <Loader2 size={16} className="ws-spinner" />
                      <span>{submitProgress.current === 0 ? 'Setting up runtime environment...' : 'Running test cases...'}</span>
                    </div>
                  </div>
                )}

                {/* Structured result */}
                {runResult && (
                  <>
                    {/* Status header */}
                    <div className={`ws-result-status ${runResult.status === 'accepted' ? 'accepted' : runResult.status === 'wrong_answer' ? 'wrong-answer' : 'error'}`}>
                      {runResult.statusText}
                      {runResult.totalCases && (
                        <span className="ws-result-subtitle">
                          {runResult.totalPassed}/{runResult.totalCases} testcases passed
                        </span>
                      )}
                    </div>

                    {/* Submit stats */}
                    {runResult.isSubmission && runResult.status === 'accepted' && runResult.runtime && (
                      <div className="ws-submit-stats">
                        <div className="ws-submit-stat">
                          <span className="ws-submit-stat-label">Runtime</span>
                          <span className="ws-submit-stat-value">{runResult.runtime}ms</span>
                        </div>
                        <div className="ws-submit-stat">
                          <span className="ws-submit-stat-label">Solve Time</span>
                          <span className="ws-submit-stat-value">{Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s</span>
                        </div>
                        <div className="ws-submit-stat">
                          <span className="ws-submit-stat-label">Language</span>
                          <span className="ws-submit-stat-value">{activeLang}</span>
                        </div>
                      </div>
                    )}

                    {/* Error output */}
                    {runResult.error && (
                      <div className="ws-result-error">{runResult.error}</div>
                    )}

                    {/* Success message for accepted submit with no cases array */}
                    {runResult.isSubmission && runResult.status === 'accepted' && !runResult.cases?.length && (
                      <p className="ws-success-msg">You have successfully completed this problem!</p>
                    )}

                    {/* Case tabs — only shown for Run (not Submit). Submit shows only the failing case directly. */}
                    {runResult.cases?.length > 0 && !runResult.isSubmission && (
                      <div className="ws-result-cases">
                        {runResult.cases.map((c, i) => (
                          <button key={c.originalIdx ?? `case-${i}`}
                            className={`ws-result-case ${resultCaseIdx === i ? 'active' : ''}`}
                            onClick={() => setResultCaseIdx(i)}>
                            <span className={`case-dot ${c.passed ? 'pass' : 'fail'}`} />
                            Case {i + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Case details — for Run, show selected case; for Submit, show the single failing case */}
                    {runResult.cases?.length > 0 && (() => {
                      const caseToShow = runResult.isSubmission
                        ? runResult.cases[0]
                        : runResult.cases[resultCaseIdx];
                      if (!caseToShow) return null;
                      return (
                        <>
                          {caseToShow.canPin && (
                            <button
                              className="ws-pin-case-btn"
                              onClick={() => pinCase(caseToShow.originalIdx)}
                              title="Add this hidden test case to your visible test cases">
                              + Add to test cases
                            </button>
                          )}
                          {caseToShow.isHidden ? (
                            <div className="ws-result-section">
                              <div className="ws-result-value ws-result-hidden-note">
                                <Lock size={12} /> Hidden test case {(caseToShow.originalIdx ?? 0) + 1} failed. Inputs are kept private — use the visible sample cases to debug.
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="ws-result-section">
                                <div className="ws-result-label">Input</div>
                                <div className="ws-result-value">
                                  {caseToShow.input.map((inp, j) => (
                                    <div key={j}>{inp.name} = {inp.value}</div>
                                  ))}
                                </div>
                              </div>
                              <div className="ws-result-section">
                                <div className="ws-result-label">Output</div>
                                <div className="ws-result-value">{caseToShow.output}</div>
                              </div>
                              <div className="ws-result-section">
                                <div className="ws-result-label">Expected</div>
                                <div className="ws-result-value">{caseToShow.expected}</div>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                {/* Fallback for raw output */}
                {!runResult && consoleOutput && (
                  <pre className="ws-result-output">{consoleOutput}</pre>
                )}

                {/* Empty state */}
                {!runResult && !consoleOutput && !running && (
                  <p className="ws-empty-msg">You must run your code first</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ DIVIDER ═══ */}
        <div className="ws-divider" onMouseDown={handleDividerDrag} />

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="ws-right" style={{ width: `${100 - leftWidth}%` }}>
          <div className="ws-editor-header">
            <div className="ws-editor-label"><Code2 size={14} /> Code</div>
            <div className="ws-editor-header-right">
              <span
                className={`ws-timer ${timerStopped ? 'stopped' : (timerPaused ? 'paused' : '')}`}
                title={timerStopped ? 'Solved — timer locked' : (timerPaused ? 'Paused (tab hidden)' : 'Timer running')}
              >
                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
              </span>
              <div className="ws-lang-pills" role="tablist" aria-label="Language">
                {[
                  { value: 'python', label: 'Python' },
                  { value: 'javascript', label: 'JavaScript' },
                  { value: 'java', label: 'Java' },
                  { value: 'cpp', label: 'C++' },
                  { value: 'c', label: 'C' },
                  { value: 'go', label: 'Go' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={activeLang === opt.value}
                    className={`ws-lang-pill ${activeLang === opt.value ? 'active' : ''}`}
                    onClick={() => onLangChange(opt.value)}
                    title={opt.label}
                  >
                    <LanguageIcon lang={opt.value} size={12} />
                    <span className="ws-lang-pill-label">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="ws-lang-select-fallback">
                <Select
                  value={activeLang}
                  onChange={onLangChange}
                  options={[
                    { value: 'python', label: 'Python 3' },
                    { value: 'javascript', label: 'JavaScript' },
                    { value: 'java', label: 'Java' },
                    { value: 'cpp', label: 'C++' },
                    { value: 'c', label: 'C' },
                    { value: 'go', label: 'Go' },
                  ]}
                  renderPrefix={(o) => <LanguageIcon lang={o.value} size={12} />}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <div className="ws-editor-area">
            <Editor height="100%" theme={MONACO_THEME_MAP[theme] || (DARK_PRESETS.has(theme) ? 'vs-dark' : 'vs')}
              language={activeLang} value={codeContent}
              onChange={val => {
                const code = val || '';
                setCodeContent(code);
                if (activeProblem) localStorage.setItem(`pgcode_code_${activeProblem.id}_${activeLang}`, code);
              }}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: localStorage.getItem('pg-editor-minimap') === 'true' },
                fontSize: Number(localStorage.getItem('pg-editor-font-size')) || 14,
                tabSize: Number(localStorage.getItem('pg-editor-tab-size')) || 2,
                wordWrap: localStorage.getItem('pg-editor-word-wrap') !== 'false' ? 'on' : 'off',
                fontFamily: '"Space Mono", monospace',
                scrollBeyondLastLine: false,
              }} />
          </div>

          <div className="ws-editor-footer">
            <div className="ws-footer-left">
              <span className="ws-cursor-pos">Ln {cursorPos.ln}, Col {cursorPos.col}</span>
              {editorStatus && <span className="ws-editor-status">{editorStatus}</span>}
              {stdinMode === 'custom' && activeCustomId && (
                <span className="ws-editor-status ws-editor-status-accent">
                  Run uses Custom {customCases.findIndex(c => c.id === activeCustomId) + 1}
                </span>
              )}
            </div>
            <div className="ws-footer-btns">
              <button className="ws-run-btn" onClick={handleRun} disabled={running}>{running ? 'Running...' : 'Run'}</button>
              <button className="ws-submit-btn" onClick={handleSubmit} disabled={running}>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// SubmissionsTabContent — extracted to keep Workspace's main render readable.
// Renders the LeetCode-style submissions table + clickable detail panel
// (runtime/memory cards with histograms + source_code preview + notes editor).
// ──────────────────────────────────────────────────────────────────────────

function quantileBins(values, binCount = 6) {
  if (!values.length) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (min === max) {
    return Array.from({ length: binCount }, (_, i) => ({
      lo: min, hi: max, count: i === Math.floor(binCount / 2) ? values.length : 0,
    }));
  }
  const step = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    lo: min + step * i,
    hi: min + step * (i + 1),
    count: 0,
  }));
  for (const v of values) {
    let idx = Math.floor((v - min) / step);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  }
  return bins;
}

function StatusBadge({ verdict }) {
  const map = {
    accepted: { label: 'Accepted', cls: 'ws-subdetail-badge-accepted' },
    wrong_answer: { label: 'Wrong Answer', cls: 'ws-subdetail-badge-wrong' },
    error: { label: 'Runtime Error', cls: 'ws-subdetail-badge-error' },
    runtime_error: { label: 'Runtime Error', cls: 'ws-subdetail-badge-error' },
  };
  const v = map[verdict] || map.error;
  return <span className={`ws-subdetail-badge ${v.cls}`}>{v.label}</span>;
}

function StatHistogram({ bins, activeBinIdx, label }) {
  const maxCount = Math.max(1, ...bins.map(b => b.count));
  return (
    <div className="ws-subdetail-histogram" aria-label={`${label} distribution`}>
      {bins.map((b, i) => {
        const h = Math.max(8, Math.round((b.count / maxCount) * 100));
        return (
          <div
            key={i}
            className={`ws-subdetail-hbar${i === activeBinIdx ? ' is-active' : ''}`}
            style={{ height: `${h}%` }}
            title={`${Math.round(b.lo)}–${Math.round(b.hi)}: ${b.count}`}
          />
        );
      })}
    </div>
  );
}

function SubmissionsTabContent({
  session, userId, userProgress, activeProblem, activeLang, onLangChange,
  saveProgress, setCodeContent, setRunResult,
  submissions, remoteSubmissions,
  selectedSubmissionId, setSelectedSubmissionId,
  submissionNotesDraft, setSubmissionNotesDraft,
  submissionNotesStatus, setSubmissionNotesStatus,
  submissionCodeExpanded, setSubmissionCodeExpanded,
  submissionCodeCopied, setSubmissionCodeCopied,
  updateSubmissionNotes,
}) {
  // Merge remote (authoritative) + local-only (fallback for older sessions).
  // Remote rows take precedence on id collision; local rows that don't have a
  // numeric id are kept so legacy submissions still render.
  const rows = useMemo(() => {
    const remote = (remoteSubmissions || []).map(r => ({
      id: r.id,
      remoteId: r.id,
      status: r.verdict === 'accepted' ? 'Accepted'
        : r.verdict === 'wrong_answer' ? 'Wrong Answer' : 'Runtime Error',
      verdict: r.verdict,
      language: r.language,
      runtime_ms: r.runtime_ms,
      memory_kb: r.memory_kb,
      passed: r.cases_passed,
      total: r.cases_total,
      date: r.created_at,
      code: r.source_code,
      notes: r.notes || '',
    }));
    const local = (submissions || []).map(s => ({
      id: s.id,
      remoteId: null,
      status: s.status,
      verdict: s.status === 'Accepted' ? 'accepted'
        : s.status === 'Wrong Answer' ? 'wrong_answer' : 'error',
      language: s.language,
      runtime_ms: typeof s.runtime === 'string' ? parseInt(s.runtime, 10) || null : null,
      memory_kb: null,
      passed: s.passed,
      total: s.total,
      date: s.date,
      code: s.code,
      notes: '',
    }));
    if (remote.length) return remote;
    return local;
  }, [remoteSubmissions, submissions]);

  const acceptedRuntimes = useMemo(
    () => rows.filter(r => r.verdict === 'accepted' && typeof r.runtime_ms === 'number').map(r => r.runtime_ms),
    [rows],
  );
  const acceptedMemories = useMemo(
    () => rows.filter(r => r.verdict === 'accepted' && typeof r.memory_kb === 'number').map(r => r.memory_kb),
    [rows],
  );

  const selected = useMemo(
    () => rows.find(r => String(r.id) === String(selectedSubmissionId)) || null,
    [rows, selectedSubmissionId],
  );

  // Sync the notes draft when the selected row changes.
  useEffect(() => {
    setSubmissionNotesDraft(selected?.notes || '');
    setSubmissionNotesStatus('');
    setSubmissionCodeExpanded(false);
    setSubmissionCodeCopied(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const beatsRuntime = useMemo(() => {
    if (!selected || typeof selected.runtime_ms !== 'number' || !acceptedRuntimes.length) return null;
    const slower = acceptedRuntimes.filter(v => v > selected.runtime_ms).length;
    return Math.round((slower / acceptedRuntimes.length) * 100);
  }, [selected, acceptedRuntimes]);

  const beatsMemory = useMemo(() => {
    if (!selected || typeof selected.memory_kb !== 'number' || !acceptedMemories.length) return null;
    const more = acceptedMemories.filter(v => v > selected.memory_kb).length;
    return Math.round((more / acceptedMemories.length) * 100);
  }, [selected, acceptedMemories]);

  const runtimeBins = useMemo(() => quantileBins(acceptedRuntimes, 6), [acceptedRuntimes]);
  const memoryBins = useMemo(() => quantileBins(acceptedMemories, 6), [acceptedMemories]);

  const findActiveBin = (bins, v) => {
    if (typeof v !== 'number') return -1;
    for (let i = 0; i < bins.length; i++) {
      if (v >= bins[i].lo && v <= bins[i].hi) return i;
    }
    return -1;
  };

  const loadSubmissionIntoEditor = (sub) => {
    if (sub.code) setCodeContent(sub.code);
    if (sub.language && sub.language !== activeLang) onLangChange(sub.language);
    if (sub.result) setRunResult(sub.result);
  };

  const handleSelectRow = (sub) => {
    setSelectedSubmissionId(sub.id);
    loadSubmissionIntoEditor(sub);
  };

  const handleSaveNotes = async () => {
    if (!selected?.remoteId) {
      setSubmissionNotesStatus('Notes sync requires a logged-in submission');
      setTimeout(() => setSubmissionNotesStatus(''), 2500);
      return;
    }
    try {
      await updateSubmissionNotes({
        submissionId: selected.remoteId,
        userId,
        problemId: activeProblem.id,
        notes: submissionNotesDraft,
      });
      setSubmissionNotesStatus('Saved');
      setTimeout(() => setSubmissionNotesStatus(''), 1800);
    } catch (e) {
      setSubmissionNotesStatus(e.message || 'Save failed');
    }
  };

  const codeLines = (selected?.code || '').split('\n');
  const showExpandToggle = codeLines.length > 12;
  const visibleCode = !showExpandToggle || submissionCodeExpanded
    ? selected?.code
    : codeLines.slice(0, 12).join('\n');

  const copyCode = async () => {
    if (!selected?.code) return;
    try {
      await navigator.clipboard.writeText(selected.code);
      setSubmissionCodeCopied(true);
      setTimeout(() => setSubmissionCodeCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="ws-submissions">
      <div className="ws-sub-actions">
        {session ? (
          <StatusPill
            value={legacyToStatus(userProgress)}
            onChange={(next) => {
              const patch = {
                status: next,
                status_changed_at: new Date().toISOString(),
                is_completed: next === 'solved' || next === 'mastered',
                is_starred: next === 'bookmarked' ? true : (userProgress?.is_starred ?? false),
              };
              if (next === 'solved' || next === 'mastered') {
                patch.last_solved_at = new Date().toISOString();
                patch.solve_count = (userProgress?.solve_count || 0) + (userProgress?.is_completed ? 0 : 1);
              }
              saveProgress(patch);
            }}
          />
        ) : (
          <p className="ws-empty-msg">Login to track progress</p>
        )}
        {userProgress?.next_review_at && (
          <span className="ws-sub-review"><RotateCcw size={12} /> Review: {new Date(userProgress.next_review_at).toLocaleDateString()}</span>
        )}
      </div>

      {rows.length > 0 && (
        <div className="ws-sub-history">
          <div className="ws-sub-history-header">
            <span className="ws-sub-col-status">Status</span>
            <span className="ws-sub-col ws-sub-col-lang">Language</span>
            <span className="ws-sub-col ws-sub-col-time">Runtime</span>
            <span className="ws-sub-col ws-sub-col-notes">Notes</span>
            <span className="ws-sub-col">Date</span>
          </div>
          {rows.map((sub) => {
            const isSelected = String(sub.id) === String(selectedSubmissionId);
            const noteSnippet = sub.notes ? (sub.notes.length > 40 ? sub.notes.slice(0, 40) + '…' : sub.notes) : null;
            return (
              <div
                key={sub.id}
                className={`ws-sub-history-row ws-sub-history-row-click${isSelected ? ' is-selected' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectRow(sub)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectRow(sub); } }}
              >
                <span className={`ws-sub-col-status ${sub.status === 'Accepted' ? 'accepted' : 'failed'}`}>
                  {sub.status}
                  <span className="ws-sub-pass-count">
                    {sub.passed}/{sub.total}
                  </span>
                </span>
                <span className="ws-sub-col ws-sub-col-lang">{sub.language}</span>
                <span className="ws-sub-col ws-sub-col-time">
                  {typeof sub.runtime_ms === 'number' ? `${sub.runtime_ms}ms` : 'N/A'}
                </span>
                <span className="ws-sub-col ws-sub-col-notes">
                  {noteSnippet ? (
                    <span className="ws-sub-notes-snippet">{noteSnippet}</span>
                  ) : (
                    <span className="ws-sub-notes-add">+ Notes</span>
                  )}
                </span>
                <span className="ws-sub-col">{new Date(sub.date).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="ws-subdetail">
          <div className="ws-subdetail-header">
            <StatusBadge verdict={selected.verdict} />
            <span className="ws-subdetail-cases">
              {selected.passed}/{selected.total} testcases passed
            </span>
            <span className="ws-subdetail-when">
              {new Date(selected.date).toLocaleString()}
            </span>
          </div>

          <div className="ws-subdetail-stats">
            <div className="ws-subdetail-card">
              <div className="ws-subdetail-card-head">
                <span className="ws-subdetail-card-label">Runtime</span>
                <span className="ws-subdetail-card-value">
                  {typeof selected.runtime_ms === 'number' ? `${selected.runtime_ms} ms` : 'N/A'}
                </span>
              </div>
              <div className="ws-subdetail-card-beats">
                {beatsRuntime !== null ? `Beats ${beatsRuntime}%` : 'No comparison yet'}
              </div>
              <StatHistogram
                bins={runtimeBins}
                activeBinIdx={findActiveBin(runtimeBins, selected.runtime_ms)}
                label="Runtime"
              />
            </div>

            <div className="ws-subdetail-card">
              <div className="ws-subdetail-card-head">
                <span className="ws-subdetail-card-label">Memory</span>
                <span className="ws-subdetail-card-value">
                  {typeof selected.memory_kb === 'number' ? `${(selected.memory_kb / 1024).toFixed(1)} MB` : 'N/A'}
                </span>
              </div>
              <div className="ws-subdetail-card-beats">
                {beatsMemory !== null ? `Beats ${beatsMemory}%` : 'No comparison yet'}
              </div>
              <StatHistogram
                bins={memoryBins}
                activeBinIdx={findActiveBin(memoryBins, selected.memory_kb)}
                label="Memory"
              />
            </div>
          </div>

          <div className="ws-subdetail-code">
            <div className="ws-subdetail-code-head">
              <span className="ws-subdetail-code-lang">{selected.language}</span>
              <button className="ws-subdetail-code-copy" onClick={copyCode} type="button">
                {submissionCodeCopied ? <Check size={13} /> : <Copy size={13} />}
                {submissionCodeCopied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="ws-subdetail-code-block"><code>{visibleCode}</code></pre>
            {showExpandToggle && (
              <button
                className="ws-subdetail-code-toggle"
                onClick={() => setSubmissionCodeExpanded(v => !v)}
                type="button"
              >
                {submissionCodeExpanded ? 'Collapse' : `View more (${codeLines.length - 12} lines)`}
              </button>
            )}
          </div>

          <div className="ws-subdetail-notes">
            <div className="ws-subdetail-notes-head">
              <StickyNote size={14} />
              <span>Write your notes here</span>
              {submissionNotesStatus && (
                <span className="ws-subdetail-notes-status">{submissionNotesStatus}</span>
              )}
            </div>
            <textarea
              className="ws-subdetail-notes-input"
              value={submissionNotesDraft}
              onChange={(e) => setSubmissionNotesDraft(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="What worked, what to remember, what to try next time…"
              rows={4}
            />
            <div className="ws-subdetail-notes-actions">
              <button
                className="ws-subdetail-notes-save"
                onClick={handleSaveNotes}
                type="button"
                disabled={!selected.remoteId}
              >
                Save notes
              </button>
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <p className="ws-empty-msg">No submissions yet. Submit your code to see results here.</p>
      )}
    </div>
  );
}
