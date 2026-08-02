import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Zap, Clock, User, Swords, ArrowLeft, Trophy, Eye, Flame, ThumbsUp, Laugh, PartyPopper } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getMatch, matchChannel } from '../../lib/versus';
import { friendlyError } from '../../lib/errors';
import '../../styles/versus.css';

const COUNTDOWN_MS = 3000;
const REACTIONS = {
  fire: { Icon: Flame, hue: 'var(--hard)' },
  zap: { Icon: Zap, hue: 'var(--warning)' },
  up: { Icon: ThumbsUp, hue: 'var(--hue-sky)' },
  laugh: { Icon: Laugh, hue: 'var(--medium)' },
  party: { Icon: PartyPopper, hue: 'var(--hue-violet)' },
};

// Read-only live view of a battle. Subscribes to the match channel WITHOUT tracking
// presence, so the two players never see a spectator as their opponent. Code is never
// shown (consistent with the battle's "you never see their code") — only the race.
export default function Spectator() {
  const { code } = useParams();
  const nav = useNavigate();
  const [match, setMatch] = useState(null);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(0);
  const [hostSolved, setHostSolved] = useState(0);
  const [guestSolved, setGuestSolved] = useState(0);
  const [ended, setEnded] = useState(null); // { winnerName }
  const [fly, setFly] = useState([]);
  const flyIdRef = useRef(0);

  // A spectator never tracks presence, so its channel key is inert — a constant is fine.
  // now starts at 0; the max(0,…) clamp below shows full time until the first tick.
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const m = await getMatch(code);
        if (!live) return;
        if (!m) { setErr('Match not found. It may have expired.'); return; }
        setMatch(m);
        setHostSolved(Array.isArray(m.host_solved) ? m.host_solved.length : 0);
        setGuestSolved(Array.isArray(m.guest_solved) ? m.guest_solved.length : 0);
        if (m.status === 'finished' && m.winner_id) {
          setEnded({ winnerName: m.winner_id === m.host_id ? (m.host_name || 'Host') : (m.guest_name || 'Guest') });
        }
      } catch (e) { if (live) setErr(friendlyError(e, 'Failed to load match.')); }
    })();
    return () => { live = false; };
  }, [code]);

  const pushFly = useCallback((k, side) => {
    const id = ++flyIdRef.current;
    setFly((f) => [...f, { id, k, side }]);
    setTimeout(() => setFly((f) => f.filter((x) => x.id !== id)), 1600);
  }, []);

  useEffect(() => {
    if (!match) return undefined;
    const hostId = match.host_id, guestId = match.guest_id;
    const ch = matchChannel(code, 'spectator');
    ch.on('broadcast', { event: 'progress' }, ({ payload }) => {
      if (payload.uid === hostId) setHostSolved(payload.solved || 0);
      else if (payload.uid === guestId) setGuestSolved(payload.solved || 0);
    });
    ch.on('broadcast', { event: 'reaction' }, ({ payload }) => {
      pushFly(payload.k, payload.uid === hostId ? 'host' : 'guest');
    });
    ch.on('broadcast', { event: 'start' }, async () => { const m = await getMatch(code); if (m) setMatch(m); });
    ch.on('broadcast', { event: 'win' }, ({ payload }) => { setEnded({ winnerName: payload.name || 'A player' }); });
    ch.on('broadcast', { event: 'forfeit' }, ({ payload }) => {
      const loser = payload.name;
      setEnded({ winnerName: loser === (match.host_name) ? (match.guest_name || 'Guest') : (match.host_name || 'Host'), forfeit: loser });
    });
    // NOTE: intentionally NOT calling ch.track(...) — a spectator must stay invisible.
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [match, code, pushFly]);

  if (err) return <div className="vs-page"><div className="vs-signin"><h3>{err}</h3><button className="vs-secondary" onClick={() => nav('/battle')}><ArrowLeft size={14} /> Back to PGBattle</button></div></div>;
  if (!match) return <div className="vs-page"><div className="vs-loading"><Zap className="vs-bolt spin" /> Loading match…</div></div>;

  const numQ = match.num_questions || 1;
  const hostName = match.host_name || 'Host';
  const guestName = match.guest_name || 'Guest';
  const started = match.started_at ? new Date(match.started_at).getTime() : now;
  const effElapsed = match.started_at ? Math.max(0, Math.floor((now - started - COUNTDOWN_MS) / 1000)) : 0;
  const remain = Math.max(0, match.time_limit_sec - effElapsed);
  const mm = String(Math.floor(remain / 60)).padStart(2, '0'), ss = String(remain % 60).padStart(2, '0');
  const hostPct = numQ ? Math.round((hostSolved / numQ) * 100) : 0;
  const guestPct = numQ ? Math.round((guestSolved / numQ) * 100) : 0;
  const statusLabel = ended ? 'Finished' : (match.status === 'active' ? 'Live' : match.status === 'waiting' ? 'Waiting to start' : match.status);

  return (
    <div className="vs-spectate">
      <div className="vs-spectate-bar">
        <button className="vs-back" onClick={() => nav('/battle')}><ArrowLeft size={15} /></button>
        <span className={`vs-spectate-badge ${ended ? 'done' : match.status === 'active' ? 'live' : ''}`}><Eye size={13} /> {statusLabel}</span>
        {match.status === 'active' && !ended ? <div className="vs-timer"><Clock size={15} /> {mm}:{ss}</div> : null}
        <span className="vs-spectate-meta">{match.difficulty} · {numQ} question{numQ === 1 ? '' : 's'}</span>
      </div>

      <div className="vs-spectate-stage">
        <div className="vs-spectate-arena">
          <div className="vs-spectate-side">
            <div className="vs-spectate-avatar host"><User size={26} /></div>
            <div className="vs-spectate-name">{hostName}</div>
            <div className="vs-spectate-track"><div className="vs-bp-fill me" style={{ width: hostPct + '%' }} /></div>
            <div className="vs-spectate-count">{hostSolved}/{numQ}</div>
          </div>
          <div className="vs-spectate-vs"><Swords size={22} /></div>
          <div className="vs-spectate-side">
            <div className="vs-spectate-avatar guest"><User size={26} /></div>
            <div className="vs-spectate-name">{guestName}</div>
            <div className="vs-spectate-track"><div className="vs-bp-fill foe" style={{ width: guestPct + '%' }} /></div>
            <div className="vs-spectate-count">{guestSolved}/{numQ}</div>
          </div>

          {fly.length ? (
            <div className="vs-react-layer">
              {fly.map((r) => {
                const R = REACTIONS[r.k];
                if (!R) return null;
                const Icon = R.Icon;
                return <span key={r.id} className={`vs-react-fly ${r.side === 'host' ? 'mine' : 'foe'}`} style={{ '--c': R.hue }}><Icon size={30} /></span>;
              })}
            </div>
          ) : null}
        </div>

        {ended ? (
          <div className="vs-spectate-result">
            <Trophy size={22} /> <b>{ended.winnerName}</b> won{ended.forfeit ? ` — ${ended.forfeit} forfeited` : ''}
          </div>
        ) : (
          <p className="vs-spectate-hint"><Eye size={13} /> Watching live — you see the race, never the code.</p>
        )}
      </div>
    </div>
  );
}
