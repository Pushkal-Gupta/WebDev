import React, { useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Code2, BookOpen, Flag, Layers, Clock } from 'lucide-react';
import { useRoadmap, useRoadmapNodes, useProblemsCompact, useAllConceptsCompact, useUserProgress, useListProblemIds } from '../../lib/queries';
import StatusPill from '../StatusPill';
import { legacyToStatus } from '../../lib/status';
import './Roadmaps.css';

export default function RoadmapTrack({ session }) {
  const { slug } = useParams();
  const { data: roadmap, isLoading } = useRoadmap(slug);
  const { data: nodes = [] } = useRoadmapNodes(slug);
  const { data: problemsData = [] } = useProblemsCompact();
  const { data: concepts = [] } = useAllConceptsCompact();
  const { data: progressBundle } = useUserProgress(session?.user?.id);

  // ── All hooks live above any conditional return (rules of hooks). ──

  // For list-typed roadmaps that point at a curated list, resolve membership.
  // Also auto-fall-back to the same-named curated list when nodes table is empty,
  // so e.g. /roadmaps/blind-75 renders by reading PGcode_lists['blind-75'].
  const candidateListSlug = useMemo(() => {
    if (nodes.length > 0) {
      const listNode = nodes.find(n => n.node_type === 'list');
      return listNode?.ref_id || null;
    }
    return slug || null;
  }, [nodes, slug]);
  const { data: listProblemIds } = useListProblemIds(candidateListSlug);

  const problemsById = useMemo(() => {
    const m = {};
    problemsData.forEach(p => { m[p.id] = p; });
    return m;
  }, [problemsData]);

  const conceptsBySlug = useMemo(() => {
    const m = {};
    concepts.forEach(c => { m[c.slug] = c; });
    return m;
  }, [concepts]);

  const byId = useMemo(() => progressBundle?.byId || {}, [progressBundle]);

  const fallbackProblems = useMemo(() => {
    if (nodes.length > 0) return [];
    if (!listProblemIds) return [];
    return problemsData.filter(p => listProblemIds.has(p.id));
  }, [nodes, listProblemIds, problemsData]);

  const completedCount = useMemo(() => {
    if (fallbackProblems.length > 0) {
      return fallbackProblems.filter(p => byId[p.id]?.is_completed).length;
    }
    let c = 0;
    nodes.forEach(n => {
      if (n.node_type === 'problem' && byId[n.ref_id]?.is_completed) c++;
    });
    return c;
  }, [fallbackProblems, nodes, byId]);

  const totalCount = fallbackProblems.length > 0
    ? fallbackProblems.length
    : nodes.filter(n => n.node_type === 'problem').length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // ── End hooks. Conditional returns from here on. ──

  if (!isLoading && roadmap?.kind === 'graph' && slug === 'dsa-fundamentals') {
    return <Navigate to="/roadmaps/dsa-fundamentals" replace />;
  }

  if (isLoading) {
    return (
      <div className="rmx-container">
        <div className="rmx-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="rmx-container">
        <div className="rmx-empty">
          <h2 className="rmx-empty-title">Roadmap not found</h2>
          <p className="rmx-empty-sub">
            <Link to="/roadmaps">Back to all roadmaps</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rmx-container rmx-track">
      <nav className="rmx-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/roadmaps">Roadmaps</Link>
        <ChevronRight size={12} />
        <span>{roadmap.name}</span>
      </nav>

      <header className="rmx-track-header">
        <Link to="/roadmaps" className="rmx-back">
          <ArrowLeft size={14} /> All roadmaps
        </Link>
        <h1 className="rmx-track-title">{roadmap.name}</h1>
        {roadmap.description && <p className="rmx-track-desc">{roadmap.description}</p>}
        <div className="rmx-track-meta">
          {roadmap.estimated_hours && (
            <span className="rmx-track-meta-chip"><Clock size={11} /> ~{roadmap.estimated_hours} hours</span>
          )}
          {totalCount > 0 && (
            <span className="rmx-track-meta-chip">{completedCount} / {totalCount} solved · {progressPct}%</span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="rmx-track-progress">
            <div className="rmx-track-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </header>

      <ol className="rmx-track-list">
        {nodes.length > 0 ? nodes.map((n, i) => (
          <RoadmapNodeRow
            key={n.id ?? i}
            node={n}
            i={i}
            problemsById={problemsById}
            conceptsBySlug={conceptsBySlug}
            byId={byId}
            session={session}
          />
        )) : fallbackProblems.length > 0 ? (
          fallbackProblems.map((p, i) => (
            <RoadmapProblemRow
              key={p.id}
              problem={p}
              i={i}
              byId={byId}
              session={session}
            />
          ))
        ) : (
          <li className="rmx-empty">
            <p className="rmx-empty-title">This track is empty</p>
            <p className="rmx-empty-sub">
              Nothing wired up yet. Check back soon, or jump into a different track from the
              roadmaps page.
            </p>
          </li>
        )}
      </ol>
    </div>
  );
}

function RoadmapNodeRow({ node, i, problemsById, conceptsBySlug, byId, session }) {
  if (node.node_type === 'milestone' || node.node_type === 'section') {
    return (
      <li className="rmx-node rmx-node-section">
        <Flag size={14} className="rmx-node-icon" />
        <div className="rmx-node-body">
          <span className="rmx-node-title">{node.title || 'Milestone'}</span>
          {node.description && <span className="rmx-node-desc">{node.description}</span>}
        </div>
      </li>
    );
  }

  if (node.node_type === 'concept') {
    const c = conceptsBySlug[node.ref_id];
    if (!c) return null;
    return (
      <li className="rmx-node">
        <span className="rmx-node-num">{String(i + 1).padStart(2, '0')}</span>
        <BookOpen size={14} className="rmx-node-icon" />
        <Link to={`/learn/${c.module_slug}/${c.slug}`} className="rmx-node-body rmx-node-link">
          <span className="rmx-node-title">{c.title}</span>
          {c.subtitle && <span className="rmx-node-desc">{c.subtitle}</span>}
        </Link>
      </li>
    );
  }

  if (node.node_type === 'problem') {
    const p = problemsById[node.ref_id];
    if (!p) return null;
    return <RoadmapProblemRow problem={p} i={i} byId={byId} session={session} />;
  }

  if (node.node_type === 'list') {
    return (
      <li className="rmx-node">
        <span className="rmx-node-num">{String(i + 1).padStart(2, '0')}</span>
        <Layers size={14} className="rmx-node-icon" />
        <Link to={`/practice?list=${node.ref_id}`} className="rmx-node-body rmx-node-link">
          <span className="rmx-node-title">{node.title || node.ref_id}</span>
          {node.description && <span className="rmx-node-desc">{node.description}</span>}
        </Link>
      </li>
    );
  }

  return null;
}

function RoadmapProblemRow({ problem: p, i, byId, session: _session }) {
  const prog = byId[p.id];
  const status = legacyToStatus(prog);
  return (
    <li className="rmx-node">
      <span className="rmx-node-num">{String(i + 1).padStart(2, '0')}</span>
      <Code2 size={14} className="rmx-node-icon" />
      <Link to={`/category/${p.topic_id}/${p.id}`} className="rmx-node-body rmx-node-link">
        <span className="rmx-node-title">{p.name}</span>
        <span className="rmx-node-desc">{p.topic_id}</span>
      </Link>
      <span className={`rmx-node-diff rmx-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
      <StatusPill value={status} size="sm" disabled />
    </li>
  );
}
