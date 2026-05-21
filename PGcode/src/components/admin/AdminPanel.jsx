import React, { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, BookOpen, Building2, Layers, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProfile, qk } from '../../lib/queries';
import './Admin.css';

function StatTile({ icon, label, value, sub, href }) {
  const Icon = icon;
  const body = (
    <>
      <div className="adm-stat-head">
        <Icon size={14} className="adm-stat-icon" />
        <span className="adm-stat-label">{label}</span>
      </div>
      <div className="adm-stat-value">{value}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </>
  );
  return href ? <Link to={href} className="adm-stat-card">{body}</Link> : <div className="adm-stat-card">{body}</div>;
}

export default function AdminPanel({ session }) {
  const userId = session?.user?.id;
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  // Top-line content counts
  const { data: counts, isError: countsError } = useQuery({
    queryKey: ['admin', 'counts'],
    queryFn: async () => {
      const [problems, concepts, modules, companies, lists, roadmaps, drafts] = await Promise.all([
        supabase.from('PGcode_problems').select('id', { count: 'exact', head: true }),
        supabase.from('PGcode_concepts').select('slug', { count: 'exact', head: true }),
        supabase.from('PGcode_modules').select('slug', { count: 'exact', head: true }),
        supabase.from('PGcode_companies').select('slug', { count: 'exact', head: true }),
        supabase.from('PGcode_lists').select('slug', { count: 'exact', head: true }),
        supabase.from('PGcode_roadmaps').select('slug', { count: 'exact', head: true }),
        supabase.from('PGcode_concepts').select('slug', { count: 'exact', head: true }).eq('status', 'draft'),
      ]);
      return {
        problems: problems.count || 0,
        concepts: concepts.count || 0,
        modules: modules.count || 0,
        companies: companies.count || 0,
        lists: lists.count || 0,
        roadmaps: roadmaps.count || 0,
        drafts: drafts.count || 0,
      };
    },
    enabled: profile?.role === 'admin' || profile?.role === 'editor',
    staleTime: 60 * 1000,
  });

  const { data: recentConcepts = [] } = useQuery({
    queryKey: ['admin', 'recentConcepts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PGcode_concepts')
        .select('slug, module_slug, title, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: profile?.role === 'admin' || profile?.role === 'editor',
    staleTime: 30 * 1000,
  });

  const { data: unlinkedConceptCount = 0 } = useQuery({
    queryKey: ['admin', 'unlinkedConcepts'],
    queryFn: async () => {
      // Concepts with no rows in PGcode_concept_problems
      const { data: linked, error } = await supabase
        .from('PGcode_concept_problems')
        .select('concept_slug');
      if (error) throw error;
      const { data: all, error: e2 } = await supabase.from('PGcode_concepts').select('slug');
      if (e2) throw e2;
      const linkedSet = new Set((linked || []).map(r => r.concept_slug));
      return (all || []).filter(c => !linkedSet.has(c.slug)).length;
    },
    enabled: profile?.role === 'admin' || profile?.role === 'editor',
    staleTime: 60 * 1000,
  });

  const tasks = useMemo(() => {
    const out = [];
    if (counts?.drafts > 0) {
      out.push({ icon: FileText, label: `${counts.drafts} concept draft${counts.drafts === 1 ? '' : 's'} pending publish`, severity: 'medium' });
    }
    if (unlinkedConceptCount > 0) {
      out.push({ icon: Layers, label: `${unlinkedConceptCount} concept${unlinkedConceptCount === 1 ? '' : 's'} not yet linked to practice problems`, severity: 'medium' });
    }
    return out;
  }, [counts, unlinkedConceptCount]);

  const refreshAll = async () => {
    setBusy(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      // Also bust the public caches in case content changed externally
      await queryClient.invalidateQueries({ queryKey: qk.modules });
      await queryClient.invalidateQueries({ queryKey: ['concepts', 'all-compact'] });
      setMessage('Caches refreshed.');
      setTimeout(() => setMessage(null), 1500);
    } finally {
      setBusy(false);
    }
  };

  if (!userId) return <Navigate to="/" replace />;
  if (profileLoading) {
    return (
      <div className="adm-container">
        <div className="adm-skel">Loading…</div>
      </div>
    );
  }
  if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    return (
      <div className="adm-container">
        <div className="adm-denied">
          <Shield size={28} className="adm-denied-icon" />
          <h1 className="adm-denied-title">Admin only</h1>
          <p className="adm-denied-sub">
            Your account doesn&rsquo;t have admin or editor permissions. Grant yourself admin by running this in the
            Supabase SQL editor (after applying <code>scripts/migrate-19-admin-roles.sql</code>):
          </p>
          <pre className="adm-denied-sql">{`UPDATE public."PGcode_profiles"
SET role = 'admin'
WHERE user_id = '${userId}';`}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-container">
      <header className="adm-header">
        <div>
          <h1 className="adm-title"><Shield size={18} /> Admin</h1>
          <p className="adm-sub">Content management surface for editors. Authored content lives as Markdown — see <code>content/concepts/</code> + <code>scripts/import-concepts.js</code>.</p>
        </div>
        <button className="adm-btn" onClick={refreshAll} disabled={busy}>
          <RefreshCw size={13} className={busy ? 'adm-spin' : ''} /> Refresh
        </button>
      </header>

      {message && <div className="adm-message">{message}</div>}
      {countsError && (
        <div className="adm-message" style={{ borderColor: 'var(--hard)', background: 'var(--hard-bg)', color: 'var(--hard)', display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'space-between' }}>
          <span>Couldn&rsquo;t load content stats — Supabase may be unreachable.</span>
          <button className="adm-btn" onClick={refreshAll} disabled={busy}>
            <RefreshCw size={11} className={busy ? 'adm-spin' : ''} /> Retry
          </button>
        </div>
      )}

      <section className="adm-grid">
        <StatTile icon={BookOpen} label="Concepts"  value={counts?.concepts ?? '—'} sub={`${counts?.drafts ?? 0} drafts`} href="/learn" />
        <StatTile icon={Layers}   label="Modules"   value={counts?.modules ?? '—'} href="/learn" />
        <StatTile icon={FileText} label="Problems"  value={counts?.problems ?? '—'} href="/practice" />
        <StatTile icon={Building2} label="Companies" value={counts?.companies ?? '—'} href="/company" />
        <StatTile icon={Layers}   label="Lists"     value={counts?.lists ?? '—'} />
        <StatTile icon={Layers}   label="Roadmaps"  value={counts?.roadmaps ?? '—'} href="/roadmaps" />
      </section>

      {tasks.length > 0 && (
        <section className="adm-tasks-card">
          <h2 className="adm-section-title"><AlertTriangle size={13} /> Open content tasks</h2>
          <ul className="adm-task-list">
            {tasks.map((t, i) => {
              const Icon = t.icon;
              return (
                <li key={i} className={`adm-task adm-task-${t.severity}`}>
                  <Icon size={13} />
                  <span>{t.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="adm-card">
        <h2 className="adm-section-title"><BookOpen size={13} /> Recently authored concepts</h2>
        {recentConcepts.length === 0 ? (
          <p className="adm-empty">No concepts yet. Drop markdown into <code>content/concepts/</code> and run <code>node scripts/import-concepts.js</code>.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>Title</th><th>Module</th><th>Status</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {recentConcepts.map(c => (
                <tr key={c.slug}>
                  <td><Link to={`/learn/${c.module_slug}/${c.slug}`}>{c.title}</Link></td>
                  <td className="adm-mono">{c.module_slug}</td>
                  <td><span className={`adm-status adm-status-${c.status}`}>{c.status}</span></td>
                  <td className="adm-mono">{c.updated_at ? new Date(c.updated_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="adm-card">
        <h2 className="adm-section-title">Content workflows (run from your terminal)</h2>
        <ul className="adm-cmd-list">
          <li>
            <span className="adm-cmd-label">Validate concepts:</span>
            <code>node scripts/import-concepts.js --dry</code>
          </li>
          <li>
            <span className="adm-cmd-label">Publish to Supabase:</span>
            <code>SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-concepts.js</code>
          </li>
          <li>
            <span className="adm-cmd-label">Seed Blind 75 list:</span>
            <code>SUPABASE_SERVICE_ROLE_KEY=… node scripts/import-blind-75.js</code>
          </li>
          <li>
            <span className="adm-cmd-label">Self-verify (build + lint + smoke):</span>
            <code>node scripts/verify.js</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
