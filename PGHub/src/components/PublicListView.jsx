import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { usePublicList, useMyListProblems, useUserProgress } from '../lib/queries';
import Breadcrumb from './common/Breadcrumb';
import StatusPill from './StatusPill';
import { legacyToStatus } from '../lib/status';
import './MyLists.css';

export default function PublicListView({ session }) {
  const { slug } = useParams();
  const { data: list, isLoading, isError, error } = usePublicList(slug);
  const { data: items = [] } = useMyListProblems(list?.id);
  const { data: progressBundle } = useUserProgress(session?.user?.id);
  const byId = progressBundle?.byId || {};

  if (isLoading) {
    return (
      <div className="ml-container">
        <Breadcrumb items={[{ label: 'Lists', to: '/lists' }, { label: 'Shared list' }]} />
        <div className="ml-skel">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ml-container">
        <Breadcrumb items={[{ label: 'Lists', to: '/lists' }, { label: 'Shared list' }]} />
        <div className="ml-empty">
          <h2 className="ml-empty-title">Couldn&rsquo;t load shared list</h2>
          <p className="ml-empty-sub">
            {error?.message || 'Network error.'}{' '}
            <button className="ml-link" onClick={() => window.location.reload()}>Retry</button>
            {' '}or <Link to="/lists">go to My Lists</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="ml-container">
        <Breadcrumb items={[{ label: 'Lists', to: '/lists' }, { label: 'Shared list' }]} />
        <div className="ml-empty">
          <h2 className="ml-empty-title">List not found</h2>
          <p className="ml-empty-sub">
            This share link is invalid or the owner made the list private.{' '}
            <Link to="/lists">Back to My Lists</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-container">
      <Breadcrumb items={[{ label: 'Lists', to: '/lists' }, { label: list.name || 'Shared list' }]} />
      <header className="ml-header">
        <h1 className="ml-title">{list.name}</h1>
        <p className="ml-sub">
          <Globe size={11} style={{ verticalAlign: '-1px', marginRight: '0.25rem' }} />
          Public list — {items.length} problem{items.length === 1 ? '' : 's'}
        </p>
        {list.description && <p className="ml-sub" style={{ marginTop: '0.4rem' }}>{list.description}</p>}
      </header>

      {items.length === 0 ? (
        <div className="ml-empty">
          <p className="ml-empty-title">This list is empty.</p>
        </div>
      ) : (
        <ol className="ml-problem-list">
          {items.map((p, i) => (
            <li key={p.id} className="ml-problem-row">
              <span className="ml-problem-num">{String(i + 1).padStart(2, '0')}</span>
              <Link to={`/category/${p.topic_id}/${p.id}`} className="ml-problem-body">
                <span className="ml-problem-name">{p.name}</span>
                <span className="ml-problem-topic">{p.topic_id}</span>
              </Link>
              <span className={`ml-diff ml-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
              <StatusPill value={legacyToStatus(byId[p.id])} size="sm" disabled />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
