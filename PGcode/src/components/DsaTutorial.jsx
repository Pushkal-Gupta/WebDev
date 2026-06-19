import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight, ArrowLeft, BookOpen, Hash, CheckCircle2 } from 'lucide-react';
import ForgeThumb from './ml/forge/ForgeThumb';
import { DSA_TUTORIAL, countTutorialItems, countAll } from '../content/dsaTutorial';
import {
  useProblemsCompact,
  useUserProgress,
} from '../lib/queries';
import { normName } from './dsaTutorialUtils';
import './DsaTutorial.css';

export default function DsaTutorial({ session }) {
  const userId = session?.user?.id;
  const { data: problemsData = [] } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const byId = useMemo(() => progressBundle?.byId || {}, [progressBundle]);

  const problemByName = useMemo(() => {
    const m = new Map();
    problemsData.forEach(p => m.set(normName(p.name), p));
    return m;
  }, [problemsData]);

  const totals = useMemo(() => {
    let totalProblems = 0, solved = 0;
    DSA_TUTORIAL.forEach(section => {
      section.subsections.forEach(sub => {
        sub.items.forEach(it => {
          if (it.kind === 'problem') {
            totalProblems++;
            const p = problemByName.get(normName(it.label));
            if (p && byId[p.id]?.is_completed) solved++;
          }
        });
      });
    });
    return { totalProblems, solved, totalAll: countAll() };
  }, [problemByName, byId]);

  // Per-section breakdown — used for the topic cards' progress bars and
  // the subtitle "X theory · Y problems" line.
  const sectionInfo = useMemo(() => {
    return DSA_TUTORIAL.map(section => {
      let theoryCount = 0, problemCount = 0;
      let problemSolved = 0;
      section.subsections.forEach(sub => {
        sub.items.forEach(it => {
          if (it.kind === 'theory' || it.kind === 'topic') {
            theoryCount += 1;
          } else if (it.kind === 'problem') {
            problemCount += 1;
            const p = problemByName.get(normName(it.label));
            if (p && byId[p.id]?.is_completed) problemSolved += 1;
          }
        });
      });
      const total = countTutorialItems(section);
      const pct = problemCount > 0 ? problemSolved / problemCount : 0;
      return {
        slug: section.slug,
        title: section.title,
        note: section.note,
        theoryCount,
        problemCount,
        problemSolved,
        total,
        pct,
      };
    });
  }, [problemByName, byId]);

  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const [filterKind, setFilterKind] = useState('all');

  const visibleSections = useMemo(() => {
    return sectionInfo.map((info, idx) => ({ info, idx })).filter(({ info, idx }) => {
      // Filter chips constrain which sections to show.
      if (filterKind === 'theory' && info.theoryCount === 0) return false;
      if (filterKind === 'problems' && info.problemCount === 0) return false;
      if (filterKind === 'unsolved') {
        if (info.problemCount === 0) return false;
        if (info.problemSolved >= info.problemCount) return false;
      }
      if (!q) return true;
      // Title match — or any item label inside matches.
      if (info.title.toLowerCase().includes(q)) return true;
      const section = DSA_TUTORIAL[idx];
      return section.subsections.some(sub =>
        sub.items.some(it => it.label.toLowerCase().includes(q))
      );
    });
  }, [sectionInfo, filterKind, q]);

  const overallPct = totals.totalProblems
    ? ((totals.solved / totals.totalProblems) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="tut-index">
      <header className="tut-index-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">DSA Tutorial</span>
        </Link>
        <div className="tut-hero">
          <div className="tut-hero-left">
            <h1 className="tut-title">DSA Tutorial</h1>
            <p className="tut-sub">Every data structure and algorithm, top to bottom — theory plus the problems that drill it.</p>
          </div>
        </div>
        {userId && totals.totalProblems > 0 && (
          <div className="tut-progress-bar" aria-label={`${overallPct}% complete — ${totals.solved} of ${totals.totalProblems} solved`}>
            <div className="tut-progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
        )}
      </header>

      <div className="tut-index-toolbar">
        <div className="tut-search">
          <Search size={14} className="tut-search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics or lessons"
          />
          {search && (
            <button className="tut-search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="tut-filters" role="tablist" aria-label="Filter topics">
          {[
            { id: 'all', label: 'All' },
            { id: 'theory', label: 'Theory' },
            { id: 'problems', label: 'Problems' },
            { id: 'unsolved', label: userId ? 'Unsolved' : 'Available' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filterKind === f.id}
              className={`tut-filter-chip ${filterKind === f.id ? 'active' : ''}`}
              onClick={() => setFilterKind(f.id)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {visibleSections.length === 0 ? (
        <div className="tut-index-empty">
          <p>No topics match that search. Clear it to see every chapter.</p>
        </div>
      ) : (
        <div className="tut-card-grid">
          {visibleSections.map(({ info, idx }) => (
            <Link
              key={info.slug}
              to={`/tutorial/${info.slug}`}
              className="tut-topic-card"
              aria-label={`Open ${info.title}`}
            >
              <div className="tut-card-thumb" aria-hidden="true">
                <ForgeThumb seed={info.title} />
              </div>
              <div className="tut-card-body">
              <div className="tut-card-top">
                <span className="tut-card-num">{String(idx + 1).padStart(2, '0')}</span>
                <ArrowRight className="tut-card-arrow" size={14} aria-hidden="true" />
              </div>
              <h2 className="tut-card-title">{info.title}</h2>
              <p className="tut-card-sub">
                {info.note ? info.note : 'Theory and drill problems for this topic.'}
              </p>
              <div className="tut-card-meta">
                {info.theoryCount > 0 && (
                  <span className="tut-card-meta-pill">
                    <BookOpen size={11} />
                    {info.theoryCount} theory
                  </span>
                )}
                {info.problemCount > 0 && (
                  <span className="tut-card-meta-pill">
                    <Hash size={11} />
                    {info.problemCount} problem{info.problemCount === 1 ? '' : 's'}
                  </span>
                )}
                {userId && info.problemSolved > 0 && (
                  <span className="tut-card-meta-pill tut-card-meta-done">
                    <CheckCircle2 size={11} />
                    {info.problemSolved} solved
                  </span>
                )}
              </div>
              {info.problemCount > 0 && (
                <div className="tut-card-progress" aria-hidden="true">
                  <div
                    className="tut-card-progress-fill"
                    style={{ width: `${Math.round(info.pct * 100)}%` }}
                  />
                </div>
              )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
