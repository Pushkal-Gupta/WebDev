import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Notebook as NotebookIcon, Search, X } from 'lucide-react';
import { useUserProgress, useProblemsCompact } from '../lib/queries';
import './Notebook.css';

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

  if (!userId) {
    return (
      <div className="nb-container">
        <header className="nb-header">
          <span className="nb-eyebrow"><NotebookIcon size={11} /> Notebook</span>
          <h1 className="nb-title">Your personal review knowledge base</h1>
          <p className="nb-sub">
            Sign in to see all the notes you've written across problems — your personal
            reviewable knowledge graph.
          </p>
        </header>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="nb-container">
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
      <header className="nb-header">
        <span className="nb-eyebrow"><NotebookIcon size={11} /> Notebook</span>
        <h1 className="nb-title">Notes you've written</h1>
        <p className="nb-sub">
          <strong>{noteRows.length}</strong> problem{noteRows.length === 1 ? '' : 's'} with notes.
          Use this as your personal review wiki.
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
            preferred approach. They'll all collect here.
          </p>
          <Link to="/practice" className="nb-cta">Browse problems</Link>
        </div>
      )}

      <ul className="nb-list">
        {filtered.map(r => (
          <li key={r.problem_id} className="nb-card">
            <Link
              to={`/category/${encodeURIComponent(r.problem.topic_id)}/${encodeURIComponent(r.problem_id)}`}
              className="nb-card-head"
            >
              <span className={`nb-diff nb-diff-${r.problem.difficulty?.toLowerCase()}`}>
                {r.problem.difficulty}
              </span>
              <span className="nb-card-title">{r.problem.name}</span>
              <span className="nb-card-meta">
                {r.confidence ? `confidence ${r.confidence}/5 · ` : ''}
                {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : ''}
              </span>
            </Link>
            <pre className="nb-card-note">{r.notes}</pre>
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
