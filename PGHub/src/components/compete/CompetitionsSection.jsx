import { useMemo } from 'react';
import { BarChart3, Trophy, Users, Calendar, Tag, ExternalLink, CalendarOff } from 'lucide-react';
import { useExternalContests } from '../../lib/queries';
import Breadcrumb from '../common/Breadcrumb';
import './LaunchSections.css';

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function tagList(extra) {
  const t = extra && extra.tags;
  if (Array.isArray(t)) return t.slice(0, 3);
  if (typeof t === 'string') return t.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  return [];
}

export default function CompetitionsSection() {
  const { data: rows = [], isLoading } = useExternalContests();

  const competitions = useMemo(
    () => rows.filter((r) => r.platform === 'kaggle'),
    [rows],
  );

  return (
    <div className="lnch">
      <Breadcrumb items={[{ label: 'Compete', to: '/compete' }, { label: 'Competitions' }]} />

      <header className="lnch-head">
        <h1 className="lnch-title"><BarChart3 size={26} /> Competitions</h1>
        <p className="lnch-sub">Data-science and machine-learning challenges from Kaggle — model, submit, climb the leaderboard.</p>
      </header>

      {isLoading ? (
        <div className="lnch-skel">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="lnch-skel-card" />)}
        </div>
      ) : competitions.length === 0 ? (
        <div className="lnch-empty">
          <CalendarOff size={40} />
          <p className="lnch-empty-title">Nothing scheduled right now</p>
          <p className="lnch-empty-sub">No open competitions at the moment. New Kaggle challenges show up here as they launch.</p>
        </div>
      ) : (
        <div className="lnch-grid">
          {competitions.map((c) => {
            const extra = c.extra || {};
            const prize = extra.prize;
            const registered = extra.registered;
            const tags = tagList(extra);
            const date = fmtDate(c.start_time);
            const live = c.phase === 'ongoing' || c.phase === 'live';
            return (
              <article key={c.id} className="lnch-card">
                <div className="lnch-card-head">
                  <span className="lnch-badge"><BarChart3 size={11} /> Kaggle</span>
                  {c.phase && <span className={`lnch-phase${live ? ' live' : ''}`}>{c.phase}</span>}
                </div>
                <h2 className="lnch-card-name">{c.name}</h2>
                {extra.organizer && <p className="lnch-card-desc">Hosted by {extra.organizer}.</p>}
                <div className="lnch-chips">
                  {prize && <span className="lnch-chip prize"><Trophy size={11} /> {prize}</span>}
                  {registered != null && <span className="lnch-chip"><Users size={11} /> {registered} teams</span>}
                  {tags.map((t) => <span key={t} className="lnch-chip tag"><Tag size={10} /> {t}</span>)}
                </div>
                <div className="lnch-card-foot">
                  <span className="lnch-meta">
                    <Calendar size={12} /> {date || 'Date TBA'}
                  </span>
                  {c.url && (
                    <a className="lnch-cta" href={c.url} target="_blank" rel="noreferrer">
                      Open <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
