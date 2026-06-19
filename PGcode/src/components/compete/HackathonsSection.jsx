import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Code2, Trophy, Users, Calendar, Tag, ExternalLink, CalendarOff } from 'lucide-react';
import { useExternalContests } from '../../lib/queries';
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

export default function HackathonsSection() {
  const { data: rows = [], isLoading } = useExternalContests();

  const hackathons = useMemo(
    () => rows.filter((r) => r.platform === 'devpost'),
    [rows],
  );

  return (
    <div className="lnch">
      <nav className="lnch-crumbs">
        <Link to="/compete">PGBattle</Link>
        <ChevronRight size={11} />
        <span>Hackathons</span>
      </nav>

      <header className="lnch-head">
        <h1 className="lnch-title"><Code2 size={26} /> Hackathons</h1>
        <p className="lnch-sub">Open build sprints pulled from DevPost — ship a project, win prizes, find a team.</p>
      </header>

      {isLoading ? (
        <div className="lnch-skel">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="lnch-skel-card" />)}
        </div>
      ) : hackathons.length === 0 ? (
        <div className="lnch-empty">
          <CalendarOff size={40} />
          <p className="lnch-empty-title">Nothing scheduled right now</p>
          <p className="lnch-empty-sub">No open hackathons at the moment. Check back soon — new build sprints land here as they open.</p>
        </div>
      ) : (
        <div className="lnch-grid">
          {hackathons.map((h) => {
            const extra = h.extra || {};
            const prize = extra.prize;
            const registered = extra.registered;
            const tags = tagList(extra);
            const date = fmtDate(h.start_time);
            const live = h.phase === 'ongoing' || h.phase === 'live';
            return (
              <article key={h.id} className="lnch-card">
                <div className="lnch-card-head">
                  <span className="lnch-badge"><Code2 size={11} /> DevPost</span>
                  {h.phase && <span className={`lnch-phase${live ? ' live' : ''}`}>{h.phase}</span>}
                </div>
                <h2 className="lnch-card-name">{h.name}</h2>
                {extra.organizer && <p className="lnch-card-desc">Hosted by {extra.organizer}.</p>}
                <div className="lnch-chips">
                  {prize && <span className="lnch-chip prize"><Trophy size={11} /> {prize}</span>}
                  {registered != null && <span className="lnch-chip"><Users size={11} /> {registered} registered</span>}
                  {tags.map((t) => <span key={t} className="lnch-chip tag"><Tag size={10} /> {t}</span>)}
                </div>
                <div className="lnch-card-foot">
                  <span className="lnch-meta">
                    <Calendar size={12} /> {date || 'Date TBA'}
                  </span>
                  {h.url && (
                    <a className="lnch-cta" href={h.url} target="_blank" rel="noreferrer">
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
