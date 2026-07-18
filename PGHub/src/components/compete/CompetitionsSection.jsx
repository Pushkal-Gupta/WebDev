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

const PLATFORM_LABEL = { codeforces: 'Codeforces', atcoder: 'AtCoder', codechef: 'CodeChef', kaggle: 'Kaggle' };

export default function CompetitionsSection() {
  const { data: rows = [], isLoading } = useExternalContests();

  // Competitive-programming judges (the ML/Kaggle track lives at /compete/kaggle).
  // Upcoming/ongoing first so the page leads with what's next, not old rounds.
  const competitions = useMemo(() => {
    const now = Date.now();
    const CP = new Set(['codeforces', 'atcoder', 'codechef']);
    return rows
      .filter((r) => CP.has(r.platform))
      .filter((r) => {
        const start = new Date(r.start_time).getTime();
        const end = start + (r.duration_minutes || 0) * 60_000;
        return now <= end; // hide finished rounds
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [rows]);

  return (
    <div className="lnch">
      <Breadcrumb items={[{ label: 'Compete', to: '/compete' }, { label: 'Competitions' }]} />

      <header className="lnch-head">
        <h1 className="lnch-title"><BarChart3 size={26} /> Competitions</h1>
        <p className="lnch-sub">Codeforces, AtCoder, and CodeChef rounds — one upcoming timeline with countdowns to the next start.</p>
      </header>

      {isLoading ? (
        <div className="lnch-skel">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="lnch-skel-card" />)}
        </div>
      ) : competitions.length === 0 ? (
        <div className="lnch-empty">
          <CalendarOff size={40} />
          <p className="lnch-empty-title">Nothing scheduled right now</p>
          <p className="lnch-empty-sub">No upcoming Codeforces, AtCoder, or CodeChef rounds are listed yet — they appear here as platforms announce them.</p>
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
                  <span className="lnch-badge"><BarChart3 size={11} /> {PLATFORM_LABEL[c.platform] || c.platform}</span>
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
