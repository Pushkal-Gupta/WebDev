import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, ListPlus, Search, X, ArrowLeft, Share2, Lock, Globe, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  useMyLists,
  useMyListProblems,
  useProblemsCompact,
  useUserProgress,
  filterByRoadmap,
} from '../lib/queries';
import StatusPill from './StatusPill';
import { legacyToStatus } from '../lib/status';
import ProgressRing from './vault/ProgressRing';
import './vault/vault.css';
import './MyLists.css';

const isSolved = (p) => {
  const s = legacyToStatus(p);
  return s === 'solved' || s === 'mastered';
};

export default function MyLists({ session }) {
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const { data: lists = [], isLoading } = useMyLists(userId);
  const { data: progressBundle } = useUserProgress(userId);
  const progressById = progressBundle?.byId || {};

  const [activeList, setActiveList] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState(null);   // list being delete/rename
  const [error, setError] = useState(null);

  const createList = async () => {
    if (!userId || !newListName.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('PGcode_user_lists')
        .insert({ user_id: userId, name: newListName.trim() })
        .select()
        .single();
      if (e) throw e;
      setNewListName('');
      queryClient.invalidateQueries({ queryKey: ['userLists', userId] });
      if (data) setActiveList(data);
    } catch (e) {
      setError(e?.message || 'Couldn\'t create list.');
    } finally {
      setCreating(false);
    }
  };

  const deleteList = async (id) => {
    if (pendingId === id) return;
    if (!confirm('Delete this list? Problems in it are not affected.')) return;
    setPendingId(id);
    try {
      const { error: e } = await supabase.from('PGcode_user_lists').delete().eq('id', id);
      if (e) { setError(e.message); return; }
      queryClient.invalidateQueries({ queryKey: ['userLists', userId] });
      if (activeList?.id === id) setActiveList(null);
    } finally {
      setPendingId(null);
    }
  };

  const renameList = async (id, name) => {
    if (!name.trim() || pendingId === id) return;
    setPendingId(id);
    try {
      const { error: e } = await supabase.from('PGcode_user_lists').update({ name: name.trim() }).eq('id', id);
      if (e) { setError(e.message); return; }
      queryClient.invalidateQueries({ queryKey: ['userLists', userId] });
    } finally {
      setPendingId(null);
    }
  };

  if (!userId) {
    return (
      <div className="ml-container">
        <div className="ml-empty">
          <ListPlus size={28} className="ml-empty-icon" />
          <h2 className="ml-empty-title">Sign in to create custom lists</h2>
          <p className="ml-empty-sub">Group problems however you want — Revisit this week, Trees mastery, Pre-Google.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="ml-container">
        <header className="ml-header">
          <h1 className="ml-title">My Lists</h1>
          <p className="ml-sub">Your saved problem collections.</p>
        </header>
        <div className="ml-skel-grid">
          {[0, 1, 2].map(i => (
            <div key={i} className="ml-skel-card">
              <div className="skel skel-text" />
              <div className="skel skel-text-short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeList) {
    return <ListDetail session={session} list={activeList} onBack={() => setActiveList(null)} />;
  }

  return (
    <div className="ml-container">
      <nav className="vault-crumbs" aria-label="Breadcrumb">
        <Link to="/vault" className="vault-crumbs-back">
          <ArrowLeft size={12} /> Vault
        </Link>
        <span className="vault-crumbs-sep">/</span>
        <span className="vault-crumbs-current">Lists</span>
      </nav>
      <header className="ml-header">
        <h1 className="ml-title">My Lists</h1>
        <p className="ml-sub">Your private problem collections — group anything however you want.</p>
      </header>

      <div className="ml-create-row">
        <input
          className="ml-input"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name (e.g. Revisit Trees)"
          onKeyDown={(e) => { if (e.key === 'Enter') createList(); }}
        />
        <button
          className="ml-btn ml-btn-primary"
          onClick={createList}
          disabled={creating || !newListName.trim()}
        >
          <Plus size={13} /> Create
        </button>
      </div>
      {error && <div className="ml-error">{error}</div>}

      {lists.length === 0 ? (
        <div className="ml-empty">
          <ListPlus size={28} className="ml-empty-icon" />
          <h2 className="ml-empty-title">No lists yet</h2>
          <p className="ml-empty-sub">Create your first list above. Add problems from any problem page.</p>
        </div>
      ) : (
        <ul className="ml-list-grid">
          {lists.map(l => (
            <ListCard
              key={l.id}
              list={l}
              progressById={progressById}
              pending={pendingId === l.id}
              onOpen={() => setActiveList(l)}
              onRename={() => { const n = prompt('Rename list to:', l.name); if (n) renameList(l.id, n); }}
              onDelete={() => deleteList(l.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ListCard({ list, progressById, pending, onOpen, onRename, onDelete }) {
  const { data: problems = [] } = useMyListProblems(list.id);

  const stats = useMemo(() => {
    let solved = 0, e = 0, m = 0, h = 0;
    for (const p of problems) {
      if (isSolved(progressById[p.id])) solved++;
      const d = (p.difficulty || '').toLowerCase();
      if (d === 'easy') e++;
      else if (d === 'medium') m++;
      else if (d === 'hard') h++;
    }
    return { total: problems.length, solved, e, m, h };
  }, [problems, progressById]);

  const total = stats.total || 1;

  return (
    <li
      className="ml-list-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    >
      <div className="ml-list-open">
        <div className="ml-list-toprow">
          <ProgressRing solved={stats.solved} total={stats.total} color="var(--accent)" size={48} />
          <div className="ml-list-headtext">
            <span className="ml-list-name">{list.name}</span>
            <span className="ml-list-meta">
              {stats.solved} / {stats.total} solved · {new Date(list.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {list.description && <span className="ml-list-desc">{list.description}</span>}
        {stats.total > 0 ? (
          <div className="ml-diffbar" title={`${stats.e} easy · ${stats.m} medium · ${stats.h} hard`}>
            {stats.e > 0 && <span className="ml-diffbar-seg ml-diffbar-easy" style={{ flex: stats.e / total }} />}
            {stats.m > 0 && <span className="ml-diffbar-seg ml-diffbar-med" style={{ flex: stats.m / total }} />}
            {stats.h > 0 && <span className="ml-diffbar-seg ml-diffbar-hard" style={{ flex: stats.h / total }} />}
          </div>
        ) : (
          <div className="ml-diffbar ml-diffbar-empty" />
        )}
        <div className="ml-diffbar-legend">
          <span className="ml-leg ml-leg-easy">{stats.e}E</span>
          <span className="ml-leg ml-leg-med">{stats.m}M</span>
          <span className="ml-leg ml-leg-hard">{stats.h}H</span>
        </div>
      </div>
      <div className="ml-list-actions">
        <button
          className="ml-icon-btn"
          onClick={(e) => { e.stopPropagation(); onRename(); }}
          title="Rename"
        >
          <Pencil size={12} />
        </button>
        <button
          className="ml-icon-btn ml-icon-danger"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={pending}
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </li>
  );
}

function makeShareSlug() {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

function ListDetail({ session, list, onBack }) {
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const { data: listProblems = [], isLoading } = useMyListProblems(list.id);
  const { data: allProblems = [] } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const togglePublic = async () => {
    const nextPublic = !list.is_public;
    const patch = { is_public: nextPublic };
    if (nextPublic && !list.share_slug) patch.share_slug = makeShareSlug();
    const { error: e } = await supabase
      .from('PGcode_user_lists')
      .update(patch)
      .eq('id', list.id);
    if (!e) queryClient.invalidateQueries({ queryKey: ['userLists', userId] });
  };

  const shareUrl = list.is_public && list.share_slug
    ? `${window.location.origin}${window.location.pathname}#/lists/share/${list.share_slug}`
    : null;

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const byId = progressBundle?.byId || {};
  const inList = useMemo(() => new Set(listProblems.map(p => p.id)), [listProblems]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return filterByRoadmap(allProblems, '500')
      .filter(p => !inList.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 10);
  }, [allProblems, inList, search]);

  const [mutatingId, setMutatingId] = useState(null);

  const addProblem = async (problemId) => {
    if (mutatingId === problemId) return;
    setMutatingId(problemId);
    try {
      const { error: e } = await supabase
        .from('PGcode_user_list_problems')
        .insert({ list_id: list.id, problem_id: problemId, position: listProblems.length });
      if (!e) {
        queryClient.invalidateQueries({ queryKey: ['userListProblems', list.id] });
        queryClient.invalidateQueries({ queryKey: ['userLists', userId] });
        setSearch('');
      }
    } finally {
      setMutatingId(null);
    }
  };

  const removeProblem = async (problemId) => {
    if (mutatingId === problemId) return;
    setMutatingId(problemId);
    try {
      const { error: e } = await supabase
        .from('PGcode_user_list_problems')
        .delete()
        .eq('list_id', list.id)
        .eq('problem_id', problemId);
      if (!e) queryClient.invalidateQueries({ queryKey: ['userListProblems', list.id] });
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <div className="ml-container">
      <button className="ml-back" onClick={onBack}>
        <ArrowLeft size={13} /> All lists
      </button>
      <header className="ml-header">
        <h1 className="ml-title">{list.name}</h1>
        <p className="ml-sub">{listProblems.length} problem{listProblems.length === 1 ? '' : 's'}</p>
      </header>

      <div className="ml-share-row">
        <button
          type="button"
          className={`ml-btn ${list.is_public ? 'ml-btn-primary' : ''}`}
          onClick={togglePublic}
          title={list.is_public ? 'Make this list private' : 'Anyone with the link can view'}
        >
          {list.is_public ? <><Globe size={12} /> Public</> : <><Lock size={12} /> Private</>}
        </button>
        {shareUrl && (
          <>
            <code className="ml-share-url">{shareUrl}</code>
            <button className="ml-btn" onClick={copyShareUrl}>
              {copied ? <><Check size={12} /> Copied</> : <><Share2 size={12} /> Copy link</>}
            </button>
          </>
        )}
      </div>

      <div className="ml-search-row">
        <Search size={13} className="ml-search-icon" />
        <input
          className="ml-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search and add problems…"
        />
        {search && (
          <button className="ml-icon-btn" onClick={() => setSearch('')}><X size={12} /></button>
        )}
      </div>
      {searchResults.length > 0 && (
        <ul className="ml-search-results">
          {searchResults.map(p => (
            <li key={p.id}>
              <button className="ml-search-row-btn" onClick={() => addProblem(p.id)}>
                <Plus size={11} />
                <span className="ml-sr-name">{p.name}</span>
                <span className={`ml-diff ml-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isLoading ? (
        <div className="ml-skel">Loading problems…</div>
      ) : listProblems.length === 0 ? (
        <div className="ml-empty">
          <p className="ml-empty-title">List is empty.</p>
          <p className="ml-empty-sub">Use the search above to add problems.</p>
        </div>
      ) : (
        <ol className="ml-problem-list">
          {listProblems.map((p, i) => (
            <li key={p.id} className="ml-problem-row">
              <span className="ml-problem-num">{String(i + 1).padStart(2, '0')}</span>
              <Link to={`/category/${p.topic_id}/${p.id}`} className="ml-problem-body">
                <span className="ml-problem-name">{p.name}</span>
                <span className="ml-problem-topic">{p.topic_id}</span>
              </Link>
              <span className={`ml-diff ml-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
              <StatusPill value={legacyToStatus(byId[p.id])} size="sm" disabled />
              <button className="ml-icon-btn ml-icon-danger" onClick={() => removeProblem(p.id)} title="Remove from list">
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
