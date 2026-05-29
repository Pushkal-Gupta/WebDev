import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import { DSA_TUTORIAL } from '../content/dsaTutorial';
import {
  useProblemsCompact,
  useAllConceptsCompact,
  useUserProgress,
} from '../lib/queries';
import { normName, passesFilter } from './dsaTutorialUtils';
import { TutorialItem } from './dsaTutorialShared';
import './DsaTutorial.css';

export default function DsaTutorialTopic({ session }) {
  const { topicSlug } = useParams();
  const userId = session?.user?.id;

  const sectionIdx = DSA_TUTORIAL.findIndex(s => s.slug === topicSlug);
  const section = sectionIdx >= 0 ? DSA_TUTORIAL[sectionIdx] : null;

  const { data: problemsData = [] } = useProblemsCompact();
  const { data: conceptsData = [] } = useAllConceptsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const byId = useMemo(() => progressBundle?.byId || {}, [progressBundle]);

  const problemByName = useMemo(() => {
    const m = new Map();
    problemsData.forEach(p => m.set(normName(p.name), p));
    return m;
  }, [problemsData]);
  const conceptByName = useMemo(() => {
    const m = new Map();
    conceptsData.forEach(c => m.set(normName(c.title), c));
    return m;
  }, [conceptsData]);

  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState('all');
  const q = search.trim().toLowerCase();

  // Compute per-topic progress + counts (must run regardless of whether the
  // section exists — keeps hook order stable when an unknown slug renders the
  // not-found state).
  const progress = useMemo(() => {
    if (!section) return { theory: 0, problems: 0, solved: 0 };
    let theory = 0, problems = 0, solved = 0;
    section.subsections.forEach(sub => {
      sub.items.forEach(it => {
        if (it.kind === 'theory' || it.kind === 'topic') {
          theory += 1;
        } else if (it.kind === 'problem') {
          problems += 1;
          const p = problemByName.get(normName(it.label));
          if (p && byId[p.id]?.is_completed) solved += 1;
        }
      });
    });
    return { theory, problems, solved };
  }, [section, problemByName, byId]);

  if (!section) {
    return (
      <div className="tut-topic">
        <div className="tut-topic-sticky">
          <div className="tut-topic-back">
            <Link to="/tutorial" className="tut-topic-back-link">
              <ArrowLeft size={14} />
              <span>Back to Tutorial</span>
            </Link>
          </div>
        </div>
        <div className="tut-topic-notfound">
          <h1>Topic not found</h1>
          <p>That topic slug does not exist. Head back and pick another.</p>
        </div>
      </div>
    );
  }

  const pct = progress.problems > 0
    ? Math.round((progress.solved / progress.problems) * 100)
    : 0;

  return (
    <div className="tut-topic">
      <div className="tut-topic-sticky">
        <div className="tut-topic-back">
          <Link to="/tutorial" className="tut-topic-back-link">
            <ArrowLeft size={14} />
            <span>Back to Tutorial</span>
          </Link>
          <span className="tut-topic-back-num">
            {String(sectionIdx + 1).padStart(2, '0')} / {String(DSA_TUTORIAL.length).padStart(2, '0')}
          </span>
        </div>
        <div className="tut-topic-titlebar">
          <div className="tut-topic-titlebar-text">
            <span className="tut-topic-eyebrow">Topic {String(sectionIdx + 1).padStart(2, '0')}</span>
            <h1 className="tut-topic-title">{section.title}</h1>
          </div>
          {progress.problems > 0 && (
            <div className="tut-topic-pct" aria-label={`${pct}% complete`}>
              <span className="tut-topic-pct-num">{pct}%</span>
              <span className="tut-topic-pct-label">{progress.solved}/{progress.problems} solved</span>
            </div>
          )}
        </div>
        {progress.problems > 0 && (
          <div className="tut-topic-progress" aria-hidden="true">
            <div className="tut-topic-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="tut-topic-body">
        {section.note && (
          <p className="tut-topic-note">{section.note}</p>
        )}

        <div className="tut-topic-toolbar">
          <div className="tut-search">
            <Search size={14} className="tut-search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${section.title.toLowerCase()}`}
            />
            {search && (
              <button className="tut-search-clear" onClick={() => setSearch('')} aria-label="Clear">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="tut-filters" role="tablist" aria-label="Filter lessons">
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

        <div className="tut-topic-sections">
          {section.subsections.map(sub => {
            const filteredItems = sub.items
              .filter(it => passesFilter(it, filterKind, problemByName, byId))
              .filter(it => !q || it.label.toLowerCase().includes(q));
            if (filteredItems.length === 0) return null;
            return (
              <div key={sub.id} className="tut-topic-sub">
                <h2 className="tut-topic-sub-title">{sub.label}</h2>
                <ul className="tut-item-list tut-topic-item-list">
                  {filteredItems.map((item, idx) => (
                    <TutorialItem
                      key={`${sub.id}-${idx}`}
                      item={item}
                      problemByName={problemByName}
                      conceptByName={conceptByName}
                      byId={byId}
                      highlight={q}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
