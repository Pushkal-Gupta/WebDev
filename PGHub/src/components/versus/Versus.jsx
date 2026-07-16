import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, HelpCircle, Eye, Radar, EyeOff, Clock, Code2, Minus, Lightbulb, Snowflake, Swords } from 'lucide-react';
import { createMatch, POWERUPS } from '../../lib/versus';
import '../../styles/versus.css';

const DIFFS = ['Any', 'Easy', 'Medium', 'Hard'];
const TIMES = [{ label: '10 min', v: 600 }, { label: '15 min', v: 900 }, { label: '25 min', v: 1500 }];
const LANGS = ['python', 'javascript', 'java', 'cpp'];
const PU_ICON = { Minus, Radar, Lightbulb, Snowflake };

export default function Versus({ session }) {
  const nav = useNavigate();
  const [difficulty, setDifficulty] = useState('Any');
  const [time, setTime] = useState(900);
  const [language, setLanguage] = useState('python');
  const [powerup, setPowerup] = useState('none');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const user = session?.user;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';

  const create = async () => {
    if (!user) return;
    setBusy(true); setErr('');
    try {
      const m = await createMatch({ difficulty, language, timeLimit: time, powerup, hostId: user.id, hostName: name });
      nav(`/versus/${m.id}`);
    } catch (e) { setErr(e.message || 'Could not create match'); setBusy(false); }
  };
  const join = () => {
    const c = joinCode.trim().toUpperCase();
    if (c.length >= 4) nav(`/versus/${c}`);
  };

  return (
    <div className="vs-page">
      <div className="vs-hero">
        <span className="vs-beta">BETA</span>
        <h1 className="vs-title"><Zap className="vs-bolt" /> Versus</h1>
        <p className="vs-sub">Race a friend on a real interview problem. First to pass every test wins. You always see their progress, never their code. Pick a power-up to gain an edge.</p>
      </div>

      <div className="vs-card">
        <div className="vs-vs">
          <div className="vs-avatar you"><User /><span>You</span></div>
          <div className="vs-vs-badge">VS</div>
          <div className="vs-avatar foe"><HelpCircle /><span>Your friend</span></div>
        </div>
        <div className="vs-divider" />

        <div className="vs-row"><span className="vs-row-label">Difficulty</span>
          <div className="vs-chips">{DIFFS.map((d) => <button key={d} className={`vs-chip ${difficulty === d ? 'on' : ''}`} onClick={() => setDifficulty(d)}>{d}</button>)}</div>
        </div>
        <div className="vs-row"><span className="vs-row-label"><Clock size={13} /> Time</span>
          <div className="vs-chips">{TIMES.map((t) => <button key={t.v} className={`vs-chip ${time === t.v ? 'on' : ''}`} onClick={() => setTime(t.v)}>{t.label}</button>)}</div>
        </div>
        <div className="vs-row"><span className="vs-row-label"><Code2 size={13} /> Language</span>
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

        <div className="vs-feats">
          <span><Eye size={14} /> See their tests passing live</span>
          <span><Zap size={14} /> Feel them typing in real time</span>
          <span><EyeOff size={14} /> Never see their code</span>
        </div>
      </div>

      {user ? (
        <div className="vs-actions">
          <button className="vs-primary" onClick={create} disabled={busy}><Swords size={16} /> {busy ? 'Creating…' : 'Create match & invite'}</button>
          <div className="vs-join">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter code" maxLength={8} onKeyDown={(e) => e.key === 'Enter' && join()} />
            <button className="vs-secondary" onClick={join}>Join</button>
          </div>
          {err ? <p className="vs-err">{err}</p> : null}
        </div>
      ) : (
        <div className="vs-signin">
          <h3>Sign in to play Versus</h3>
          <p>You need an account to create or join a race.</p>
        </div>
      )}
    </div>
  );
}
