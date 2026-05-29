import React, { useMemo, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import {
  ACHIEVEMENTS,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  buildAchievementContext,
  computeEarned,
} from '../lib/achievements';
import {
  useProblemsCompact,
  useUserProgress,
  useProfile,
  useSubmissionHistory,
  useMyContestAttempts,
  useMyListSizes,
  filterByRoadmap,
} from '../lib/queries';
import './Achievements.css';

export default function Achievements({ session, roadmapMode = '500', compact = false, limit = null }) {
  const userId = session?.user?.id;
  const { data: problems } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const { data: profile } = useProfile(userId);
  const { data: submissions = [] } = useSubmissionHistory(userId, 500);
  const { data: contestAttempts = [] } = useMyContestAttempts(userId);
  const { data: listSizes = {} } = useMyListSizes(userId);

  // Filter chip + search — full page only. Compact mode (embedded in /progress)
  // hides the controls and just shows the first `limit` items.
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const earnedIds = useMemo(() => {
    if (!userId) return new Set();
    const ctx = buildAchievementContext({
      problems: filterByRoadmap(problems, roadmapMode),
      byId: progressBundle?.byId || {},
      profile,
      submissions,
      contestAttempts,
      listSizes,
    });
    return new Set(computeEarned(ctx));
  }, [userId, problems, progressBundle, profile, roadmapMode, submissions, contestAttempts, listSizes]);

  const items = useMemo(() => {
    let list = [...ACHIEVEMENTS];
    if (statusFilter === 'earned') list = list.filter(a => earnedIds.has(a.id));
    else if (statusFilter === 'locked') list = list.filter(a => !earnedIds.has(a.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const ea = earnedIds.has(a.id) ? 0 : 1;
      const eb = earnedIds.has(b.id) ? 0 : 1;
      if (ea !== eb) return ea - eb;
      return 0;
    });
    return limit ? list.slice(0, limit) : list;
  }, [earnedIds, limit, statusFilter, search]);

  // Compact mode keeps the flat earned-first list. The full page groups by
  // category so the new Streaks and Monthly challenges land in their own
  // sections without losing the existing solve-milestone roll-up.
  const groupedSections = useMemo(() => {
    if (compact) return null;
    const buckets = new Map();
    items.forEach(a => {
      const cat = a.category || 'misc';
      if (!buckets.has(cat)) buckets.set(cat, []);
      buckets.get(cat).push(a);
    });
    const ordered = [];
    CATEGORY_ORDER.forEach(cat => {
      if (buckets.has(cat)) {
        ordered.push({ category: cat, label: CATEGORY_LABELS[cat] || cat, entries: buckets.get(cat) });
        buckets.delete(cat);
      }
    });
    for (const [cat, entries] of buckets) {
      ordered.push({ category: cat, label: CATEGORY_LABELS[cat] || 'Other', entries });
    }
    return ordered;
  }, [items, compact]);

  const earnedCount = earnedIds.size;
  const totalCount = ACHIEVEMENTS.length;
  const pct = totalCount ? Math.round((earnedCount / totalCount) * 100) : 0;

  const renderCard = (a) => {
    const Icon = a.icon;
    const earned = earnedIds.has(a.id);
    return (
      <div
        key={a.id}
        className={`ach-card ach-card-${a.color} ${earned ? 'earned' : 'locked'}`}
        title={earned ? `Earned: ${a.title}` : `Locked: ${a.title}`}
      >
        <div className="ach-card-icon">
          {earned ? <Icon size={18} /> : <Lock size={14} />}
        </div>
        <div className="ach-card-body">
          <span className="ach-card-title">{a.title}</span>
          <span className="ach-card-desc">{a.description}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`ach ${compact ? 'ach-compact' : ''}`}>
      {!compact && (
        <header className="ach-header">
          <div className="ach-header-titlebar">
            <h3 className="ach-title">Achievements</h3>
            <span className="ach-count">{earnedCount} / {totalCount} earned · {pct}%</span>
          </div>
          <div className="ach-progress-bar"><div className="ach-progress-fill" style={{ width: `${pct}%` }} /></div>
          <div className="ach-controls">
            <div className="ach-search">
              <Search size={13} />
              <input
                type="text"
                value={search}
                placeholder="Search achievements…"
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search achievements"
              />
            </div>
            <div className="ach-chips" role="tablist">
              {['all', 'earned', 'locked'].map(s => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === s}
                  className={`ach-chip ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? `All (${totalCount})` : s === 'earned' ? `Earned (${earnedCount})` : `Locked (${totalCount - earnedCount})`}
                </button>
              ))}
            </div>
          </div>
        </header>
      )}

      {items.length === 0 ? (
        <p className="ach-empty">No achievements match the current filter.</p>
      ) : compact ? (
        <div className="ach-grid">
          {items.map(renderCard)}
        </div>
      ) : (
        <div className="ach-sections">
          {groupedSections.map(section => (
            <section key={section.category} className="ach-section">
              <h4 className="ach-section-title">{section.label}</h4>
              <div className="ach-grid">
                {section.entries.map(renderCard)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
