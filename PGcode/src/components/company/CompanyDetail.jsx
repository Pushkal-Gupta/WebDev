import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Building2, Flame, MapPin } from 'lucide-react';
import { useCompany, useCompanyProblems, useUserProgress } from '../../lib/queries';
import StatusPill from '../StatusPill';
import { legacyToStatus } from '../../lib/status';
import './Companies.css';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function CompanyDetail({ session }) {
  const { slug } = useParams();
  const { data: company, isLoading } = useCompany(slug);
  const { data: problems = [] } = useCompanyProblems(slug);
  const { data: progressBundle } = useUserProgress(session?.user?.id);

  const [diffFilter, setDiffFilter] = useState(new Set(DIFFICULTIES));

  const byId = progressBundle?.byId || {};

  const filtered = useMemo(() => problems.filter(p => diffFilter.has(p.difficulty)), [problems, diffFilter]);

  const difficultyCounts = useMemo(() => {
    const c = { Easy: 0, Medium: 0, Hard: 0 };
    problems.forEach(p => { if (c[p.difficulty] != null) c[p.difficulty]++; });
    return c;
  }, [problems]);

  const topicCounts = useMemo(() => {
    const m = {};
    problems.forEach(p => { m[p.topic_id] = (m[p.topic_id] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [problems]);

  const solvedCount = problems.filter(p => byId[p.id]?.is_completed).length;

  if (isLoading) {
    return (
      <div className="comp-container">
        <div className="comp-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="comp-container">
        <div className="comp-empty">
          <h2 className="comp-empty-title">Company not found</h2>
          <p className="comp-empty-sub"><Link to="/company">Back to companies</Link></p>
        </div>
      </div>
    );
  }

  const toggleDiff = (d) => {
    setDiffFilter(prev => {
      const next = new Set(prev);
      if (next.has(d)) { if (next.size > 1) next.delete(d); }
      else next.add(d);
      return next;
    });
  };

  return (
    <div className="comp-container comp-detail">
      <nav className="comp-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/company">Companies</Link>
        <ChevronRight size={12} />
        <span>{company.name}</span>
      </nav>

      <header className="comp-detail-header">
        <Link to="/company" className="comp-back">
          <ArrowLeft size={13} /> All companies
        </Link>
        <div className="comp-detail-title-row">
          <Building2 size={22} className="comp-detail-icon" />
          <h1 className="comp-detail-title">{company.name}</h1>
        </div>
        {company.tagline && <p className="comp-detail-tagline">{company.tagline}</p>}
        <div className="comp-detail-meta">
          {company.hq && <span className="comp-detail-meta-chip"><MapPin size={11} /> {company.hq}</span>}
          {company.domain && <span className="comp-detail-meta-chip">{company.domain}</span>}
          {problems.length > 0 && (
            <span className="comp-detail-meta-chip">{solvedCount} / {problems.length} solved</span>
          )}
        </div>
      </header>

      {problems.length === 0 ? (
        <div className="comp-empty">
          <p className="comp-empty-title">No problems linked yet.</p>
          <p className="comp-empty-sub">
            Populate <code>PGcode_company_problems</code> for <code>{company.slug}</code> to surface this
            company&rsquo;s most-asked problems here.
          </p>
        </div>
      ) : (
        <>
          <section className="comp-stats">
            <div className="comp-stat-card">
              <span className="comp-stat-label">Easy</span>
              <span className="comp-stat-val comp-stat-easy">{difficultyCounts.Easy}</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-label">Medium</span>
              <span className="comp-stat-val comp-stat-medium">{difficultyCounts.Medium}</span>
            </div>
            <div className="comp-stat-card">
              <span className="comp-stat-label">Hard</span>
              <span className="comp-stat-val comp-stat-hard">{difficultyCounts.Hard}</span>
            </div>
            {topicCounts.length > 0 && (
              <div className="comp-topic-chips">
                <span className="comp-topic-chips-label">Top topics:</span>
                {topicCounts.map(([t, n]) => (
                  <span key={t} className="comp-topic-chip">{t} · {n}</span>
                ))}
              </div>
            )}
          </section>

          <div className="comp-diff-toggles" role="group" aria-label="Filter by difficulty">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`comp-diff-btn comp-diff-${d.toLowerCase()} ${diffFilter.has(d) ? 'active' : ''}`}
                onClick={() => toggleDiff(d)}
                aria-pressed={diffFilter.has(d)}
              >
                <span className="comp-diff-dot" /> {d}
              </button>
            ))}
          </div>

          <ol className="comp-problem-list">
            {filtered.map((p, i) => (
              <li key={p.id} className="comp-problem-row">
                <span className="comp-problem-num">{String(i + 1).padStart(2, '0')}</span>
                <Link to={`/category/${p.topic_id}/${p.id}`} className="comp-problem-body">
                  <span className="comp-problem-name">{p.name}</span>
                  <span className="comp-problem-topic">{p.topic_id}</span>
                </Link>
                {p.frequency_score > 0 && (
                  <span className="comp-freq" title={`Frequency score ${p.frequency_score}/100`}>
                    <Flame size={11} /> {p.frequency_score}
                  </span>
                )}
                <span className={`comp-problem-diff comp-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
                <StatusPill value={legacyToStatus(byId[p.id])} size="sm" disabled />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
