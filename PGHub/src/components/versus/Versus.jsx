import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, HelpCircle, Eye, Radar, EyeOff, Clock, Code2, Minus, Lightbulb, Snowflake, Swords, Trophy, ArrowRight, Hash, ListChecks } from 'lucide-react';
import { createMatch, getMyRecord, POWERUPS } from '../../lib/versus';
import { sendChallenge } from '../../lib/friends';
import { friendlyError } from '../../lib/errors';
import FriendsPanel from './FriendsPanel';
import '../../styles/versus.css';

const DIFFS = ['Any', 'Easy', 'Medium', 'Hard'];
const TIMES = [{ label: '10 min', v: 600 }, { label: '15 min', v: 900 }, { label: '25 min', v: 1500 }];
const LANGS = ['python', 'javascript', 'java', 'cpp'];
const PU_ICON = { Minus, Radar, Lightbulb, Snowflake };

function RaceLane({ delay, cls, pct }) {
  return (
    <div className={`vs-lane ${cls}`}>
      <div className="vs-lane-fill" style={{ width: pct + '%', animationDelay: delay }} />
      <span className="vs-lane-dot" style={{ left: pct + '%', animationDelay: delay }} />
    </div>
  );
}

export default function Versus({ session }) {
  const nav = useNavigate();
  const [difficulty, setDifficulty] = useState('Any');
  const [time, setTime] = useState(900);
  const [language, setLanguage] = useState('python');
  const [numQuestions, setNumQuestions] = useState(1);
  const [powerup, setPowerup] = useState('none');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [record, setRecord] = useState(null);
  const [challengingId, setChallengingId] = useState(null);

  const user = session?.user;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';

  useEffect(() => {
    let live = true;
    if (!user) { Promise.resolve().then(() => { if (live) setRecord(null); }); return () => { live = false; }; }
    getMyRecord(user.id).then((r) => { if (live) setRecord(r); }).catch(() => {});
    return () => { live = false; };
  }, [user]);

  const create = async () => {
    if (!user) return;
    setBusy(true); setErr('');
    try {
      const m = await createMatch({ difficulty, language, timeLimit: time, powerup, numQuestions, hostId: user.id, hostName: name });
      nav(`/versus/${m.id}`);
    } catch (e) { setErr(friendlyError(e, 'Could not create match.')); setBusy(false); }
  };
  const join = () => {
    const c = joinCode.trim().toUpperCase();
    if (c.length >= 4) nav(`/versus/${c}`);
  };
  const challengeFriend = async (friend) => {
    if (!user || challengingId) return;
    setChallengingId(friend.id); setErr('');
    try {
      const m = await createMatch({ difficulty, language, timeLimit: time, powerup, numQuestions, hostId: user.id, hostName: name });
      await sendChallenge(friend.id, { code: m.id, fromId: user.id, fromName: name, difficulty, language, timeLimit: time, numQuestions });
      nav(`/versus/${m.id}`);
    } catch (e) { setErr(friendlyError(e, 'Could not send challenge.')); setChallengingId(null); }
  };

  const winRate = record && record.total ? Math.round((record.wins / record.total) * 100) : 0;

  return (
    <div className="vs-page">
      <div className="vs-hero">
        <h1 className="vs-title"><Zap className="vs-bolt" /> <span className="vs-title-pg">PG</span>Battle</h1>
        <p className="vs-sub">Race a rival on real interview problems in real time. Their bar climbs as their tests pass — first to green wins. You never see their code.</p>
      </div>

      <div className="vs-grid">
        {/* ── Setup ── */}
        <div className="vs-setup-card">
          <div className="vs-vs">
            <div className="vs-avatar you"><User /><span>{name}</span><small>you</small></div>
            <div className="vs-vs-badge">VS</div>
            <div className="vs-avatar foe"><HelpCircle /><span>Your rival</span><small>invite below</small></div>
          </div>
          <div className="vs-divider" />

          <div className="vs-row"><span className="vs-row-label">Difficulty</span>
            <div className="vs-chips">{DIFFS.map((d) => <button key={d} className={`vs-chip ${difficulty === d ? 'on' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>)}</div>
          </div>
          <div className="vs-row"><span className="vs-row-label"><Clock size={13} /> Time</span>
            <div className="vs-chips">{TIMES.map((t) => <button key={t.v} className={`vs-chip ${time === t.v ? 'on' : ''}`} onClick={() => setTime(t.v)}>{t.label}</button>)}</div>
          </div>
          <div className="vs-row"><span className="vs-row-label"><ListChecks size={13} /> Questions</span>
            <div className="vs-chips">{[1, 2, 3, 4].map((n) => <button key={n} className={`vs-chip ${numQuestions === n ? 'on' : ''}`} onClick={() => setNumQuestions(n)}>{n}{n === 1 ? ' question' : ''}</button>)}</div>
          </div>
          <div className="vs-row"><span className="vs-row-label"><Code2 size={13} /> Your code</span>
            <div className="vs-chips">{LANGS.map((l) => <button key={l} className={`vs-chip ${language === l ? 'on' : ''}`} onClick={() => setLanguage(l)}>{l}</button>)}</div>
          </div>

          <div className="vs-powerups">
            {POWERUPS.map((p) => {
              const Ic = PU_ICON[p.icon] || Minus;
              return (
                <button key={p.id} className={`vs-pu ${powerup === p.id ? 'on' : ''}`} onClick={() => setPowerup(p.id)} title={p.desc}>
                  <Ic size={16} /><b>{p.label}</b><em>{p.desc}</em>
                </button>
              );
            })}
          </div>

          {user ? (
            <div className="vs-actions">
              <button className="vs-primary" onClick={create} disabled={busy}><Swords size={16} /> {busy ? 'Creating…' : 'Create match & get a code'}</button>
              <div className="vs-join">
                <span className="vs-join-icon"><Hash size={15} /></span>
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter a rival's code" maxLength={8} onKeyDown={(e) => e.key === 'Enter' && join()} />
                <button className="vs-secondary" onClick={join} disabled={joinCode.trim().length < 4}>Join <ArrowRight size={14} /></button>
              </div>
              {err ? <p className="vs-err">{err}</p> : null}
            </div>
          ) : (
            <div className="vs-signin-inline">
              <h3>Sign in to battle</h3>
              <p>You need an account to create or join a race.</p>
            </div>
          )}
        </div>

        {/* ── Side: record + how it works ── */}
        <div className="vs-side">
          <div className="vs-record-card">
            <div className="vs-record-head"><Trophy size={15} /> Your record</div>
            {record && record.total ? (
              <>
                <div className="vs-record-nums">
                  <div className="vs-rn win"><b>{record.wins}</b><span>won</span></div>
                  <div className="vs-rn rate"><b>{winRate}%</b><span>win rate</span></div>
                  <div className="vs-rn loss"><b>{record.losses}</b><span>lost</span></div>
                </div>
                <div className="vs-record-bar">
                  <div className="vs-record-bar-win" style={{ width: winRate + '%' }} />
                  <div className="vs-record-bar-loss" style={{ width: (100 - winRate) + '%' }} />
                </div>
                <div className="vs-record-recent">
                  {record.recent.map((m, i) => (
                    <span key={i} className={`vs-pip ${m.won ? 'w' : 'l'}`} title={`${m.won ? 'Won' : 'Lost'} vs ${m.oppName} · ${m.difficulty} · ${m.language}`}>{m.won ? 'W' : 'L'}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="vs-record-empty">
                <Swords size={26} />
                <p>{user ? 'No battles yet. Create a match and challenge someone.' : 'Sign in to track your wins and losses.'}</p>
              </div>
            )}
          </div>

          {user ? <FriendsPanel session={session} onChallenge={challengeFriend} challengingId={challengingId} /> : null}

          <div className="vs-how-card">
            <div className="vs-how-head"><Zap size={14} /> Live race</div>
            <div className="vs-race">
              <RaceLane cls="you" pct={82} delay="0s" />
              <RaceLane cls="foe" pct={64} delay="0.4s" />
            </div>
            <div className="vs-feats">
              <span><Eye size={14} /> See their tests pass live</span>
              <span><Zap size={14} /> Feel them typing in real time</span>
              <span><EyeOff size={14} /> Never see their code</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
