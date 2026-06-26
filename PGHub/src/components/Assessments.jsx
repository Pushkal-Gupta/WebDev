import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Play, ArrowLeft, Award } from 'lucide-react';
import {
  useTopics,
  useProblemsCompact,
  useUserProgress,
  filterByRoadmap,
} from '../lib/queries';
import { primaryTopicLabel } from '../lib/topicLabel';
import StatusPill from './StatusPill';
import { legacyToStatus } from '../lib/status';
import ForgeThumb from './ml/forge/ForgeThumb';
import Breadcrumb from './common/Breadcrumb';
import './Assessments.css';

const CRUMBS = [{ label: 'Vault', to: '/vault' }, { label: 'Assessments' }];

// Keyword -> ForgeThumb archetype, so each topic card carries a distinct,
// topic-related motif. First match wins; specific patterns precede generic ones
// so e.g. "advanced graphs" hits network before any array catch-all.
const MOTIF_RULES = [
  [/two.?pointer/i, 'vectors'],
  [/sliding.?window/i, 'attention'],
  [/bit|bitmask|xor/i, 'bits'],
  [/2.?d.?\s*d\.?p|2d.?dp|grid.?dp|range|prefix|interval|knapsack|\bdp\b|dynamic.?prog/i, 'matrix'],
  [/trie|heap|priority.?queue|\bbst\b|tree|binary.?indexed|segment/i, 'tree'],
  [/backtrack|recursion|recursive|permutation|combination|subset/i, 'tree'],
  [/advanced.?graph|shortest.?path|dijkstra|\bmst\b|union.?find|topolog|graph/i, 'network'],
  [/binary.?search|search/i, 'scatter'],
  [/geometr|\bgeo\b|coordinate|convex/i, 'field'],
  [/linked.?list/i, 'chain'],
  [/\bstack\b|monotonic/i, 'bars'],
  [/\bqueue\b|deque/i, 'cuda'],
  [/greedy|schedul/i, 'bars'],
  [/math|number.?theory|arithmetic|combinatoric|modul/i, 'rings'],
  [/string|substring|palindrome|matching|anagram/i, 'heat'],
  [/hash|hashmap|hash.?table|\bmap\b|\bset\b/i, 'heat'],
  [/array|sort|matrix|two.?sum/i, 'grid'],
];

function motifForTopic(name) {
  const s = String(name || '');
  for (const [re, motif] of MOTIF_RULES) if (re.test(s)) return motif;
  return 'cards';
}

const DEFAULTS = {
  problemCount: 3,
  minutesPerProblem: 10,  // soft default; tunable per-test
};

// Difficulty mix templates per assessment level
const MIX = {
  Beginner:     { Easy: 3, Medium: 0, Hard: 0, label: 'Beginner', color: 'easy', minutes: 25 },
  Intermediate: { Easy: 1, Medium: 2, Hard: 0, label: 'Intermediate', color: 'medium', minutes: 45 },
  Advanced:     { Easy: 0, Medium: 2, Hard: 1, label: 'Advanced', color: 'hard', minutes: 75 },
};

function pickN(arr, n) {
  const out = [];
  const pool = [...arr];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function fmtClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function Assessments({ session, roadmapMode = '500' }) {
  const userId = session?.user?.id;
  const { data: topics = [], isLoading: topicsLoading, isError: topicsErr } = useTopics();
  const { data: problemsData, isLoading: probsLoading, isError: probsErr } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const [activeTest, setActiveTest] = useState(null);
  const dataLoading = topicsLoading || probsLoading;
  const dataError = topicsErr || probsErr;

  const tierProblems = useMemo(() => filterByRoadmap(problemsData, roadmapMode), [problemsData, roadmapMode]);
  const byId = progressBundle?.byId || {};

  const topicCards = useMemo(() => {
    const byTopic = {};
    tierProblems.forEach(p => {
      if (!byTopic[p.topic_id]) byTopic[p.topic_id] = [];
      byTopic[p.topic_id].push(p);
    });
    const labelOf = {};
    topics.forEach(t => { labelOf[t.id] = primaryTopicLabel(t.name); });
    return Object.entries(byTopic)
      .map(([tid, problems]) => ({ topicId: tid, label: labelOf[tid] || tid, problems }))
      .filter(t => t.problems.length >= 3)  // need at least 3 problems to assess
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tierProblems, topics]);

  const startTest = (topic, level) => {
    const mix = MIX[level];
    const easy = topic.problems.filter(p => p.difficulty === 'Easy');
    const med  = topic.problems.filter(p => p.difficulty === 'Medium');
    const hard = topic.problems.filter(p => p.difficulty === 'Hard');

    const picked = [
      ...pickN(easy, mix.Easy),
      ...pickN(med, mix.Medium),
      ...pickN(hard, mix.Hard),
    ];

    // Fill remaining if the topic doesn't have enough of a specific difficulty
    const want = mix.Easy + mix.Medium + mix.Hard;
    if (picked.length < want) {
      const taken = new Set(picked.map(p => p.id));
      const filler = topic.problems.filter(p => !taken.has(p.id));
      picked.push(...pickN(filler, want - picked.length));
    }

    if (picked.length === 0) return;

    // Date.now() during a click handler is fine; the lint rule can't tell render
    // from handler. Disable just this line.
    // eslint-disable-next-line react-hooks/purity
    const startedAt = Date.now();

    setActiveTest({
      topic,
      level: mix.label,
      color: mix.color,
      durationSec: mix.minutes * 60,
      startedAt,
      problems: picked,
    });
  };

  if (activeTest) {
    return <ActiveAssessment test={activeTest} byId={byId} onExit={() => setActiveTest(null)} />;
  }

  return (
    <div className="asm-container">
      <Breadcrumb items={CRUMBS} />
      <header className="asm-header">
        <h1 className="asm-title">Assessments</h1>
        <p className="asm-sub">
          Timed single-topic mini-tests at three levels, with problems drawn at random so retakes stay fresh.
        </p>
      </header>

      {dataLoading ? (
        <div className="asm-empty">
          <div className="skel skel-row-full" style={{ marginBottom: '0.5rem' }} />
          <div className="skel skel-row-full" style={{ marginBottom: '0.5rem' }} />
          <div className="skel skel-row-full" />
        </div>
      ) : dataError ? (
        <div className="asm-empty">
          <p className="asm-empty-title">Couldn&rsquo;t load topics or problems</p>
          <p className="asm-empty-sub">
            Network error.{' '}
            <button className="asm-btn" style={{ marginTop: '0.5rem' }} onClick={() => window.location.reload()}>Retry</button>
          </p>
        </div>
      ) : topicCards.length === 0 ? (
        <div className="asm-empty">
          <p className="asm-empty-title">No topics with enough problems yet</p>
          <p className="asm-empty-sub">Try widening your tier filter — each topic needs at least 3 problems to run an assessment.</p>
        </div>
      ) : (
        <ul className="asm-grid">
          {topicCards.map(t => {
            const solved = t.problems.filter(p => byId[p.id]?.is_completed).length;
            return (
              <li key={t.topicId} className="asm-card">
                <div className="asm-card-thumb">
                  <ForgeThumb seed={t.label} kind={motifForTopic(t.label)} label={t.label} />
                </div>
                <div className="asm-card-head">
                  <h3 className="asm-card-title">{t.label}</h3>
                  <span className="asm-card-meta">{solved} / {t.problems.length} solved</span>
                </div>
                <div className="asm-levels">
                  {Object.keys(MIX).map(level => {
                    const mix = MIX[level];
                    const canRun = t.problems.length >= (mix.Easy + mix.Medium + mix.Hard);
                    return (
                      <button
                        key={level}
                        type="button"
                        className={`asm-level asm-level-${mix.color}`}
                        onClick={() => startTest(t, level)}
                        disabled={!canRun}
                        title={canRun ? `${mix.minutes}-minute ${level} test` : 'Not enough problems in this topic for this level'}
                      >
                        <Play size={12} /> {level}
                        <span className="asm-level-time"><Clock size={10} /> {mix.minutes}m</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActiveAssessment({ test, byId, onExit }) {
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const elapsedSec = Math.floor((now - test.startedAt) / 1000);
  const remainingSec = Math.max(0, test.durationSec - elapsedSec);
  const timeUp = remainingSec <= 0;

  const solvedNow = test.problems.filter(p => byId[p.id]?.is_completed).length;
  const totalCount = test.problems.length;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (timeUp && !finished) setFinished(true);
  }, [timeUp, finished]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const scoreText = finished || timeUp
    ? `${solvedNow} / ${totalCount} solved in ${fmtClock(Math.min(elapsedSec, test.durationSec))}`
    : null;

  return (
    <div className="asm-container">
      <button className="asm-back" onClick={onExit}>
        <ArrowLeft size={13} /> Back to assessments
      </button>
      <header className="asm-active-header">
        <div>
          <h1 className="asm-title">{test.topic.label} — {test.level}</h1>
          <p className="asm-sub">Solve the problems in any order. Mark Solved in the workspace and progress will sync here automatically.</p>
        </div>
        <div className={`asm-clock asm-clock-${timeUp ? 'done' : 'live'}`}>
          <Clock size={14} />
          <span className="asm-clock-value">{fmtClock(remainingSec)}</span>
          {timeUp && <span className="asm-clock-label">Time up</span>}
        </div>
      </header>

      {(finished || timeUp) && (
        <div className="asm-result">
          <Award size={18} />
          <div>
            <div className="asm-result-headline">{scoreText}</div>
            <div className="asm-result-sub">
              {solvedNow === totalCount
                ? 'Clean sweep. Try Advanced or pick a different topic.'
                : solvedNow > 0
                  ? `Tackle the ${totalCount - solvedNow} you missed in the Workspace; re-take the assessment when you're ready.`
                  : 'No solves this round — review the linked concept and retake.'}
            </div>
          </div>
        </div>
      )}

      <ol className="asm-problem-list">
        {test.problems.map((p, i) => {
          const solved = byId[p.id]?.is_completed;
          return (
            <li key={p.id} className={`asm-problem ${solved ? 'solved' : ''}`}>
              <span className="asm-problem-letter">{String.fromCharCode(65 + i)}</span>
              <Link to={`/category/${p.topic_id}/${p.id}`} className="asm-problem-body">
                <span className="asm-problem-name">{p.name}</span>
                <span className="asm-problem-topic">{p.topic_id}</span>
              </Link>
              <span className={`asm-diff asm-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
              <StatusPill value={legacyToStatus(byId[p.id])} size="sm" disabled />
            </li>
          );
        })}
      </ol>

      {!finished && !timeUp && (
        <div className="asm-actions">
          <button className="asm-btn" onClick={() => setFinished(true)}>
            Finish early
          </button>
        </div>
      )}
    </div>
  );
}
