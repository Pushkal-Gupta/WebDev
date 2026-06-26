import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, NotebookPen } from 'lucide-react';
import { useUserProgress, useProblemsCompact } from '../lib/queries';
import ConfidenceMeter from './vault/ConfidenceMeter';
import SignInPrompt from './common/SignInPrompt';
import Breadcrumb from './common/Breadcrumb';
import './vault/vault.css';
import './Notebook.css';

const CRUMBS = [{ label: 'Vault', to: '/vault' }, { label: 'Notes' }];

export default function Notebook({ session }) {
  const userId = session?.user?.id;
  const { data: progress, isLoading } = useUserProgress(userId);
  const { data: problemsData = [] } = useProblemsCompact();
  const [q, setQ] = useState('');

  const problemMap = useMemo(() => {
    const m = {};
    for (const p of problemsData) m[p.id] = p;
    return m;
  }, [problemsData]);

  const noteRows = useMemo(() => {
    const rows = (progress?.rows || [])
      .filter(r => (r?.notes || '').trim().length > 0)
      .map(r => ({
        ...r,
        problem: problemMap[r.problem_id],
      }))
      .filter(r => r.problem);
    rows.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    return rows;
  }, [progress, problemMap]);

  const filtered = useMemo(() => {
    if (!q.trim()) return noteRows;
    const needle = q.trim().toLowerCase();
    return noteRows.filter(r =>
      r.problem.name.toLowerCase().includes(needle) ||
      (r.notes || '').toLowerCase().includes(needle)
    );
  }, [noteRows, q]);

  const crumbs = <Breadcrumb items={CRUMBS} />;

  if (!userId) {
    return (
      <div className="nb-container">
        {crumbs}
        <header className="nb-header">
          <h1 className="nb-title">Notes</h1>
        </header>
        <SignInPrompt
          icon={NotebookPen}
          title="Sign in to see your notes"
          message="Every note you write while solving, searchable and grouped by problem."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="nb-container">
        {crumbs}
        <div className="nb-skel">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="nb-container">
      {crumbs}
      <header className="nb-header">
        <h1 className="nb-title">Notes</h1>
        <p className="nb-sub">
          Every note you've written on a problem — <strong>{noteRows.length}</strong> with notes, newest first.
        </p>
      </header>

      {noteRows.length > 0 && (
        <div className="nb-controls">
          <div className="nb-search">
            <Search size={13} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by problem or note content…"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Clear" className="nb-search-clear">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {noteRows.length === 0 && (
        <div className="nb-empty">
          <h2>No notes yet</h2>
          <p>
            Open any problem and use the Notes tab to jot intuitions, edge cases, or your
            preferred approach. Everything you write collects here.
          </p>
          <Link to="/practice" className="nb-cta">Browse problems</Link>
        </div>
      )}

      <ul className="nb-grid">
        {filtered.map(r => (
          <li
            key={r.problem_id}
            className={`nb-tile nb-tile-${r.problem.difficulty?.toLowerCase()}`}
          >
            <Link
              to={`/category/${encodeURIComponent(r.problem.topic_id)}/${encodeURIComponent(r.problem_id)}`}
              className="nb-tile-link"
            >
              <div className="nb-tile-head">
                <span className={`nb-diff nb-diff-${r.problem.difficulty?.toLowerCase()}`}>
                  {r.problem.difficulty}
                </span>
                <span className="nb-tile-title">{r.problem.name}</span>
              </div>
              <div className="nb-tile-note">
                <span className="nb-tile-note-text">{r.notes}</span>
              </div>
              <div className="nb-tile-foot">
                {r.confidence
                  ? <ConfidenceMeter value={r.confidence} max={5} color="var(--hue-violet)" />
                  : <span className="nb-tile-date">No rating</span>}
                <span className="nb-tile-date">
                  {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ''}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && q && (
        <div className="nb-empty">
          <p>No notes match "{q}".</p>
        </div>
      )}
    </div>
  );
}
